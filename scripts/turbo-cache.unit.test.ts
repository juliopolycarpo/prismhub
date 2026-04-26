import { describe, expect, test } from 'bun:test';

const REPO_ROOT = `${import.meta.dir}/..`;
const TURBO_CONFIG_PATH = `${REPO_ROOT}/turbo.json`;
const SETUP_BUN_ACTION_PATH = `${REPO_ROOT}/.github/actions/setup-bun/action.yml`;
const WEB_ASSETS_PACKAGE_PATH = `${REPO_ROOT}/packages/web-assets/package.json`;

interface TurboTaskConfig {
  readonly outputs?: readonly string[];
}

interface TurboConfig {
  readonly tasks: {
    readonly build: TurboTaskConfig;
    readonly compile: TurboTaskConfig;
    readonly typecheck: TurboTaskConfig;
  };
}

interface WorkspacePackageConfig {
  readonly scripts: {
    readonly build?: string;
  };
}

async function readTurboConfig(): Promise<TurboConfig> {
  return (await Bun.file(TURBO_CONFIG_PATH).json()) as TurboConfig;
}

async function readWebAssetsPackageConfig(): Promise<WorkspacePackageConfig> {
  return (await Bun.file(WEB_ASSETS_PACKAGE_PATH).json()) as WorkspacePackageConfig;
}

describe('Turbo cache config', () => {
  test('keeps build info scoped to the task that created it', async () => {
    const config = await readTurboConfig();

    expect(config.tasks.build.outputs).toContain('tsconfig.tsbuildinfo');
    expect(config.tasks.typecheck.outputs).toEqual([
      'typecheck.tsbuildinfo',
      'scripts/typecheck.tsbuildinfo',
    ]);
    expect(config.tasks.typecheck.outputs).not.toContain('*.tsbuildinfo');
    expect(config.tasks.typecheck.outputs).not.toContain('**/*.tsbuildinfo');
    expect(config.tasks.compile.outputs).not.toContain('*.tsbuildinfo');
  });

  test('does not restore TypeScript build info outside Turbo task outputs', async () => {
    const setupAction = await Bun.file(SETUP_BUN_ACTION_PATH).text();

    expect(setupAction).not.toContain('**/*.tsbuildinfo');
  });

  test('forces web-assets declarations to recover from stale build info', async () => {
    const webAssetsPackage = await readWebAssetsPackageConfig();

    expect(webAssetsPackage.scripts.build).toContain('tsc --build --force');
  });
});
