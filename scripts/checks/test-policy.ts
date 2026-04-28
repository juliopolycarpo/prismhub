#!/usr/bin/env bun
import { Glob } from 'bun';

export const DATA_ONLY_ALLOWLIST: ReadonlyMap<string, string> = new Map([
  ['@prismhub/contracts', 'Pure TypeBox schemas \u2014 no runtime behavior to test.'],
]);

export interface PackageJson {
  readonly name?: string;
  readonly scripts?: Record<string, string>;
}

export interface RootPackageJson {
  readonly workspaces?: readonly string[];
}

export interface WorkspaceEntry {
  readonly path: string;
  readonly dir: string;
  readonly pkg: PackageJson | null;
  readonly testFileCount: number;
}

export interface PolicyViolation {
  readonly name: string;
  readonly reason: string;
}

export interface TestPolicyEvaluation {
  readonly allowlisted: readonly string[];
  readonly behavioralOk: readonly string[];
  readonly violations: readonly PolicyViolation[];
}

const TEST_SCRIPT_KEYS: readonly string[] = ['test', 'test:unit', 'test:integration', 'test:e2e'];
const TEST_FILE_GLOB = '**/*.{unit,integration,e2e}.test.{ts,tsx,js,jsx,mjs,cjs}';

export async function readJson<T>(filePath: string): Promise<T | null> {
  const file = Bun.file(filePath);
  if (!(await file.exists())) return null;
  return (await file.json()) as T;
}

export function hasPassWithNoTests(scripts: Record<string, string>): boolean {
  return Object.values(scripts).some((cmd) => cmd.includes('--pass-with-no-tests'));
}

export function hasAnyTestScript(scripts: Record<string, string>): boolean {
  return TEST_SCRIPT_KEYS.some(
    (key) => typeof scripts[key] === 'string' && scripts[key].length > 0,
  );
}

export async function discoverWorkspacePackageJsonPaths(
  rootDir = `${import.meta.dir}/../..`,
): Promise<string[]> {
  const root = await readJson<RootPackageJson>(`${rootDir}/package.json`);
  const patterns = root?.workspaces ?? [];
  const matches = new Set<string>();

  for (const pattern of patterns) {
    const glob = new Glob(`${pattern}/package.json`);
    for await (const filePath of glob.scan({ cwd: rootDir, onlyFiles: true })) {
      matches.add(filePath.replaceAll('\\', '/'));
    }
  }

  return [...matches].sort();
}

export async function countTestFiles(packageDir: string): Promise<number> {
  const glob = new Glob(TEST_FILE_GLOB);
  for await (const _ of glob.scan({ cwd: packageDir, onlyFiles: true })) {
    return 1;
  }
  return 0;
}

export function evaluateTestPolicy(
  entries: readonly WorkspaceEntry[],
  allowlist: ReadonlyMap<string, string> = DATA_ONLY_ALLOWLIST,
): TestPolicyEvaluation {
  const allowlisted: string[] = [];
  const behavioralOk: string[] = [];
  const violations: PolicyViolation[] = [];

  for (const entry of entries) {
    const name = entry.pkg?.name ?? entry.path;
    const scripts = entry.pkg?.scripts ?? {};

    if (allowlist.has(name)) {
      if (!hasPassWithNoTests(scripts) && !hasAnyTestScript(scripts)) {
        allowlisted.push(name);
        continue;
      }
      allowlisted.push(name);
      continue;
    }

    if (hasPassWithNoTests(scripts)) {
      violations.push({
        name,
        reason: 'uses --pass-with-no-tests but is not in the data-only allowlist',
      });
      continue;
    }

    if (!hasAnyTestScript(scripts)) {
      violations.push({
        name,
        reason: 'has no test/test:unit/test:integration/test:e2e script',
      });
      continue;
    }

    if (entry.testFileCount === 0) {
      violations.push({
        name,
        reason: 'declares a test script but has no *.unit/integration/e2e.test.* files',
      });
      continue;
    }

    behavioralOk.push(name);
  }

  return {
    allowlisted: allowlisted.sort(),
    behavioralOk: behavioralOk.sort(),
    violations: violations.sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export async function buildWorkspaceEntries(
  rootDir = `${import.meta.dir}/../..`,
): Promise<WorkspaceEntry[]> {
  const paths = await discoverWorkspacePackageJsonPaths(rootDir);
  return Promise.all(
    paths.map(async (relPath) => {
      const dir = relPath.replace(/\/package\.json$/, '');
      const pkg = await readJson<PackageJson>(`${rootDir}/${relPath}`);
      const testFileCount = await countTestFiles(`${rootDir}/${dir}`);
      return { path: relPath, dir, pkg, testFileCount };
    }),
  );
}

export async function main(): Promise<number> {
  const entries = await buildWorkspaceEntries();
  const evaluation = evaluateTestPolicy(entries);

  for (const name of evaluation.allowlisted) {
    const reason = DATA_ONLY_ALLOWLIST.get(name);
    process.stdout.write(`  ok    ${name} (data-only: ${reason ?? 'allowlisted'})\n`);
  }
  for (const name of evaluation.behavioralOk) {
    process.stdout.write(`  ok    ${name}\n`);
  }
  for (const violation of evaluation.violations) {
    process.stderr.write(`  FAIL  ${violation.name}: ${violation.reason}\n`);
  }

  if (evaluation.violations.length > 0) {
    process.stderr.write(
      `\n${evaluation.violations.length} violation(s). Add tests, declare a test script, or update the data-only allowlist with a justification.\n`,
    );
    return 1;
  }

  process.stdout.write('\nTest policy check passed.\n');
  return 0;
}

if (import.meta.main) {
  process.exit(await main());
}
