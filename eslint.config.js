import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import promise from 'eslint-plugin-promise';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import {
  coreForbiddenImports,
  dbForbiddenImports,
  generatedAndVendorIgnores,
  qualityRules,
  restrictedImportRule,
  runtimeCompositionRootImports,
  typeSafetyRules,
} from './eslint.rules.js';

function createTypeScriptConfig(tsconfigRootDir) {
  return {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
      parserOptions: { projectService: true, tsconfigRootDir },
    },
    plugins: { unicorn, promise },
    rules: {
      ...typeSafetyRules,
      ...qualityRules,
      'no-restricted-imports': restrictedImportRule(
        runtimeCompositionRootImports,
        'Never import from apps/runtime — it is the composition root only.',
      ),
    },
  };
}

export function createBaseConfig(tsconfigRootDir) {
  return [
    { ignores: generatedAndVendorIgnores },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    prettier,
    createTypeScriptConfig(tsconfigRootDir),
  ];
}

export const layerConfig = [
  {
    files: ['packages/contracts/**/*.ts'],
    rules: {
      'no-restricted-imports': restrictedImportRule(
        ['@prismhub/*'],
        'contracts is the base layer — it must not import from other @prismhub packages.',
      ),
    },
  },
  {
    files: ['packages/core/**/*.ts'],
    rules: {
      'no-restricted-imports': restrictedImportRule(
        coreForbiddenImports,
        'core must not import from framework or infrastructure layers.',
      ),
    },
  },
  {
    files: ['packages/db/**/*.ts'],
    rules: {
      'no-restricted-imports': restrictedImportRule(
        dbForbiddenImports,
        'db may only import from @prismhub/contracts and @prismhub/observability.',
      ),
    },
  },
  {
    files: ['packages/mcp-core/**/*.ts'],
    rules: {
      'no-restricted-imports': restrictedImportRule(
        ['@prismhub/mcp-host', '@prismhub/mcp-client'],
        'mcp-core must not import from mcp-host or mcp-client.',
      ),
    },
  },
];

export const exceptionConfig = [
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
  },
  {
    files: [
      'apps/runtime/src/cli.ts',
      'apps/runtime/src/main.ts',
      'apps/runtime/src/commands/**',
      'scripts/**',
    ],
    rules: {
      'no-restricted-imports': 'off',
      'no-console': 'off',
    },
  },
  {
    files: ['packages/**/scripts/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ImportDeclaration[source.value=/^(node:)?fs(\\/promises)?$/]',
          message:
            'Use Bun.file / Bun.write / Bun.Glob instead of Node `fs`. See packages/web-assets/scripts/generate.ts for the canonical pattern.',
        },
      ],
    },
  },
  {
    files: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.e2e.test.ts',
      '**/testkit/**',
      '**/testing/**',
      '**/test-*.{ts,tsx}',
    ],
    rules: {
      'max-lines-per-function': 'off',
      'max-lines': 'off',
      'no-console': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
  },
];

export function createConfig({ tsconfigRootDir }) {
  return [...createBaseConfig(tsconfigRootDir), ...layerConfig, ...exceptionConfig];
}

export default createConfig({ tsconfigRootDir: import.meta.dirname });
