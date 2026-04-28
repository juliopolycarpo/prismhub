import { describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildWorkspaceEntries,
  countTestFiles,
  DATA_ONLY_ALLOWLIST,
  discoverWorkspacePackageJsonPaths,
  evaluateTestPolicy,
  hasAnyTestScript,
  hasPassWithNoTests,
  type WorkspaceEntry,
} from './test-policy.ts';

function createTempRoot(): string {
  return mkdtempSync(join(tmpdir(), 'prismhub-policy-'));
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await Bun.write(filePath, JSON.stringify(value));
}

describe('hasPassWithNoTests()', () => {
  test('opts in returns true', () => {
    expect(
      hasPassWithNoTests({
        test: 'bun test',
        'test:unit': 'bun test --pass-with-no-tests unit.test',
      }),
    ).toBe(true);
  });

  test('no flag returns false', () => {
    expect(hasPassWithNoTests({ test: 'bun test integration.test' })).toBe(false);
  });
});

describe('hasAnyTestScript()', () => {
  test('detects test scripts', () => {
    expect(hasAnyTestScript({ test: 'bun test' })).toBe(true);
    expect(hasAnyTestScript({ 'test:unit': 'bun test unit.test' })).toBe(true);
    expect(hasAnyTestScript({ 'test:integration': 'bun test int' })).toBe(true);
    expect(hasAnyTestScript({ 'test:e2e': 'bun test e2e' })).toBe(true);
  });

  test('unrelated scripts return false', () => {
    expect(hasAnyTestScript({ build: 'tsc -b', lint: 'eslint .' })).toBe(false);
  });
});

describe('evaluateTestPolicy()', () => {
  function makeEntry(partial: Partial<WorkspaceEntry>): WorkspaceEntry {
    return {
      path: 'packages/x/package.json',
      dir: 'packages/x',
      pkg: null,
      testFileCount: 0,
      ...partial,
    };
  }

  test('allowlisted data-only packages pass', () => {
    const result = evaluateTestPolicy([
      makeEntry({
        pkg: { name: '@prismhub/contracts', scripts: { test: 'bun test --pass-with-no-tests' } },
      }),
    ]);
    expect(result.allowlisted).toContain('@prismhub/contracts');
    expect(result.violations).toEqual([]);
  });

  test('behavioral packages with flag fail', () => {
    const result = evaluateTestPolicy([
      makeEntry({
        pkg: { name: '@prismhub/core', scripts: { test: 'bun test --pass-with-no-tests' } },
      }),
    ]);
    expect(result.violations).toHaveLength(1);
    const violation = result.violations[0];
    expect(violation?.name).toBe('@prismhub/core');
    expect(violation?.reason).toContain('not in the data-only allowlist');
  });

  test('behavioral packages without test script fail', () => {
    const result = evaluateTestPolicy([
      makeEntry({
        pkg: { name: '@prismhub/foo', scripts: { build: 'tsc -b' } },
      }),
    ]);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0]?.reason).toContain('no test/test:unit');
  });

  test('behavioral packages without test files fail', () => {
    const result = evaluateTestPolicy([
      makeEntry({
        pkg: { name: '@prismhub/bar', scripts: { 'test:unit': 'bun test unit.test' } },
        testFileCount: 0,
      }),
    ]);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0]?.reason).toContain('no *.unit/integration/e2e.test.* files');
  });

  test('behavioral packages with script and files pass', () => {
    const result = evaluateTestPolicy([
      makeEntry({
        pkg: { name: '@prismhub/baz', scripts: { 'test:unit': 'bun test unit.test' } },
        testFileCount: 3,
      }),
    ]);
    expect(result.violations).toEqual([]);
    expect(result.behavioralOk).toContain('@prismhub/baz');
  });
});

describe('discoverWorkspacePackageJsonPaths()', () => {
  test('discovers workspace globs from root', async () => {
    const rootDir = createTempRoot();
    try {
      mkdirSync(join(rootDir, 'apps', 'web'), { recursive: true });
      mkdirSync(join(rootDir, 'packages', 'core'), { recursive: true });
      mkdirSync(join(rootDir, 'extensions', 'devtools'), { recursive: true });

      await writeJson(join(rootDir, 'package.json'), {
        workspaces: ['apps/*', 'packages/*', 'extensions/*'],
      });
      await writeJson(join(rootDir, 'apps', 'web', 'package.json'), { name: '@prismhub/web' });
      await writeJson(join(rootDir, 'packages', 'core', 'package.json'), {
        name: '@prismhub/core',
      });
      await writeJson(join(rootDir, 'extensions', 'devtools', 'package.json'), {
        name: '@prismhub/devtools',
      });

      const paths = await discoverWorkspacePackageJsonPaths(rootDir);
      expect(paths).toContain('apps/web/package.json');
      expect(paths).toContain('packages/core/package.json');
      expect(paths).toContain('extensions/devtools/package.json');
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  test('no workspaces returns empty list', async () => {
    const rootDir = createTempRoot();
    try {
      await writeJson(join(rootDir, 'package.json'), { name: 'no-workspaces' });
      const paths = await discoverWorkspacePackageJsonPaths(rootDir);
      expect(paths).toEqual([]);
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });
});

describe('countTestFiles()', () => {
  test('no test files returns 0', async () => {
    const rootDir = createTempRoot();
    try {
      await Bun.write(join(rootDir, 'src', 'index.ts'), '// no tests\n');
      expect(await countTestFiles(rootDir)).toBe(0);
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  test('unit test exists returns >0', async () => {
    const rootDir = createTempRoot();
    try {
      await Bun.write(join(rootDir, 'src', 'foo.unit.test.ts'), 'export {}\n');
      expect(await countTestFiles(rootDir)).toBeGreaterThan(0);
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });
});

describe('buildWorkspaceEntries()', () => {
  test('combines discovery, manifest, and count', async () => {
    const rootDir = createTempRoot();
    try {
      mkdirSync(join(rootDir, 'packages', 'foo'), { recursive: true });
      await writeJson(join(rootDir, 'package.json'), { workspaces: ['packages/*'] });
      await writeJson(join(rootDir, 'packages', 'foo', 'package.json'), {
        name: '@scope/foo',
        scripts: { 'test:unit': 'bun test unit.test' },
      });
      await Bun.write(join(rootDir, 'packages', 'foo', 'src', 'a.unit.test.ts'), 'export {}\n');

      const entries = await buildWorkspaceEntries(rootDir);
      expect(entries).toHaveLength(1);
      expect(entries[0]?.pkg?.name).toBe('@scope/foo');
      expect(entries[0]?.testFileCount).toBeGreaterThan(0);
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });
});

describe('DATA_ONLY_ALLOWLIST', () => {
  test('contracts has documented reason', () => {
    expect(DATA_ONLY_ALLOWLIST.has('@prismhub/contracts')).toBe(true);
    for (const reason of DATA_ONLY_ALLOWLIST.values()) {
      expect(reason.length).toBeGreaterThan(10);
    }
  });

  test('test helpers not included', () => {
    expect(DATA_ONLY_ALLOWLIST.has('@prismhub/testkit')).toBe(false);
    expect(DATA_ONLY_ALLOWLIST.has('@prismhub/testkit-base')).toBe(false);
  });
});
