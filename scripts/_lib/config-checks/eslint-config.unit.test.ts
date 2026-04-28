import { describe, expect, test } from 'bun:test';

interface EslintConfigEntry {
  readonly files?: readonly string[];
  readonly ignores?: readonly string[];
  readonly plugins?: Record<string, unknown>;
  readonly languageOptions?: {
    readonly parserOptions?: {
      readonly projectService?: boolean;
      readonly tsconfigRootDir?: string;
    };
  };
  readonly rules?: Record<string, unknown>;
}

interface EslintConfigModule {
  readonly createBaseConfig: (tsconfigRootDir: string) => readonly EslintConfigEntry[];
  readonly createConfig: (options: {
    readonly tsconfigRootDir: string;
  }) => readonly EslintConfigEntry[];
  readonly exceptionConfig: readonly EslintConfigEntry[];
  readonly layerConfig: readonly EslintConfigEntry[];
}

const configUrl = new URL('../../../eslint.config.js', import.meta.url).href;
const { createBaseConfig, createConfig, exceptionConfig, layerConfig } = (await import(
  configUrl
)) as unknown as EslintConfigModule;

type RestrictedImportRule = readonly [
  'error',
  { readonly patterns?: readonly { readonly group: readonly string[] }[] },
];

function findByFile(entries: readonly EslintConfigEntry[], fileGlob: string): EslintConfigEntry {
  const entry = entries.find((candidate) => candidate.files?.includes(fileGlob));
  if (!entry) throw new Error(`ESLint config block not found for file glob: ${fileGlob}`);
  return entry;
}

function getRule(entry: EslintConfigEntry, ruleName: string): unknown {
  return entry.rules?.[ruleName];
}

function isRestrictedImportRule(rule: unknown): rule is RestrictedImportRule {
  return Array.isArray(rule) && rule[0] === 'error' && typeof rule[1] === 'object';
}

function getRestrictedGroups(entry: EslintConfigEntry): readonly string[] {
  const rule = getRule(entry, 'no-restricted-imports');
  if (!isRestrictedImportRule(rule)) return [];
  return rule[1].patterns?.flatMap((pattern) => pattern.group) ?? [];
}

function expectArrayRuleStartsWithError(rule: unknown): void {
  expect(Array.isArray(rule)).toBe(true);
  if (!Array.isArray(rule)) throw new Error('ESLint rule is not an array rule');
  expect(rule[0]).toBe('error');
}

describe('createConfig()', () => {
  test('composes base, layer, exception blocks', () => {
    const result = createConfig({ tsconfigRootDir: '/tmp/prismhub' });
    const baseConfig = createBaseConfig('/tmp/prismhub');

    expect([...result]).toEqual([...baseConfig, ...layerConfig, ...exceptionConfig]);
  });

  test('threads tsconfigRootDir into parser options', () => {
    const result = createConfig({ tsconfigRootDir: '/repo' });
    const typescriptBlock = findByFile(result, '**/*.{ts,tsx}');

    expect(typescriptBlock.languageOptions?.parserOptions?.projectService).toBe(true);
    expect(typescriptBlock.languageOptions?.parserOptions?.tsconfigRootDir).toBe('/repo');
  });
});

describe('base ESLint config', () => {
  const baseConfig = createBaseConfig('/repo');

  test('ignores generated, build, vendor paths', () => {
    const ignoresBlock = baseConfig.find((entry) => entry.ignores);

    expect(ignoresBlock?.ignores).toEqual(
      expect.arrayContaining([
        '**/dist/**',
        '**/build/**',
        '**/coverage/**',
        '**/.turbo/**',
        '**/node_modules/**',
        '**/*.generated.ts',
        '**/bun.lock',
      ]),
    );
  });

  test('enforces strict TypeScript safety', () => {
    const typescriptBlock = findByFile(baseConfig, '**/*.{ts,tsx}');

    expect(getRule(typescriptBlock, '@typescript-eslint/no-floating-promises')).toBe('error');
    expect(getRule(typescriptBlock, '@typescript-eslint/no-explicit-any')).toBe('error');
    expect(getRule(typescriptBlock, '@typescript-eslint/no-non-null-assertion')).toBe('error');
    expect(getRule(typescriptBlock, 'no-console')).toBe('error');
  });

  test('blocks runtime composition root imports', () => {
    const typescriptBlock = findByFile(baseConfig, '**/*.{ts,tsx}');

    expect(getRestrictedGroups(typescriptBlock)).toEqual(
      expect.arrayContaining(['apps/runtime/*', '@prismhub/runtime/*']),
    );
  });
});

describe('layer ESLint config', () => {
  test('contracts cannot import @prismhub packages', () => {
    const contractsBlock = findByFile(layerConfig, 'packages/contracts/**/*.ts');

    expect(getRestrictedGroups(contractsBlock)).toContain('@prismhub/*');
  });

  test('core cannot import framework/infra layers', () => {
    const coreBlock = findByFile(layerConfig, 'packages/core/**/*.ts');

    expect(getRestrictedGroups(coreBlock)).toEqual(
      expect.arrayContaining([
        '@prismhub/http-server',
        '@prismhub/app-api',
        '@prismhub/mcp-host',
        '@prismhub/mcp-client',
        '@prismhub/web-assets',
      ]),
    );
  });

  test('db isolated from upstream layers', () => {
    const dbBlock = findByFile(layerConfig, 'packages/db/**/*.ts');

    expect(getRestrictedGroups(dbBlock)).toEqual(
      expect.arrayContaining([
        '@prismhub/core',
        '@prismhub/http-server',
        '@prismhub/app-api',
        '@prismhub/mcp-core',
        '@prismhub/mcp-host',
        '@prismhub/mcp-client',
        '@prismhub/web-assets',
      ]),
    );
  });
});

describe('exception ESLint config', () => {
  test('relaxes rules for runtime CLI', () => {
    const runtimeBlock = findByFile(exceptionConfig, 'apps/runtime/src/cli.ts');

    expect(getRule(runtimeBlock, 'no-restricted-imports')).toBe('off');
    expect(getRule(runtimeBlock, 'no-console')).toBe('off');
  });

  test('forbids node:fs in package scripts', () => {
    const packageScriptsBlock = findByFile(exceptionConfig, 'packages/**/scripts/**/*.ts');
    const rule = getRule(packageScriptsBlock, 'no-restricted-syntax');

    expectArrayRuleStartsWithError(rule);
  });

  test('configures React rules for web app', () => {
    const webBlock = findByFile(exceptionConfig, 'apps/web/**/*.{ts,tsx}');

    expect(Object.keys(webBlock.plugins ?? {})).toEqual(
      expect.arrayContaining(['react-hooks', 'react-refresh']),
    );
    expect(getRule(webBlock, 'react-refresh/only-export-components')).toEqual(
      expect.arrayContaining(['warn']),
    );
  });
});
