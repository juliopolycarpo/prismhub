import { statSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  joinOutput,
  spawnCaptured,
  type Gate,
  type GateContext,
  type SpawnCaptureOptions,
  type SpawnCaptureResult,
} from './gate';
import { parseBunTestCounts } from '../parsers/bunTest';
import { parseTscOutput } from '../parsers/tsc';
import { parsePrettierCheck } from '../parsers/prettier';
import { listRootScriptUnitTests } from '../test-files';
import { rootScriptsTypecheckCommand } from '../typecheck-command';

const BUN = process.execPath;
// Resolve the turbo binary directly to skip the `bun x` resolver cold start.
// Falls back to `bun x turbo` for environments where the binary isn't present.
const TURBO_BIN: readonly string[] = resolveTurboBinary();

function resolveTurboBinary(): readonly string[] {
  const direct = resolve(import.meta.dir, '../../../node_modules/.bin/turbo');
  try {
    if (statSync(direct).isFile()) return [direct];
  } catch {
    // fallthrough
  }
  return [BUN, 'x', 'turbo'];
}

function baseSpawnOpts(ctx: GateContext): SpawnCaptureOptions {
  return { cwd: ctx.repoRoot, env: ctx.env, signal: ctx.signal };
}

function turboRun(task: string, extra: readonly string[] = []): readonly string[] {
  return [...TURBO_BIN, 'run', task, ...extra];
}

interface SimpleGateLabels {
  readonly passed: string;
  readonly failed: string;
}

/**
 * Factory for gates whose pass/fail state is purely a function of the child
 * process exit code, with static labels and no parser. Used for trivially
 * shaped gates like lint, coverage, and policy. Gates that need to derive
 * counts from output (typecheck, format, tests) build their own `Gate`.
 */
function simpleExitCodeGate(name: string, cmd: readonly string[], labels: SimpleGateLabels): Gate {
  return {
    name,
    async run(ctx) {
      const result = await spawnCaptured(cmd, baseSpawnOpts(ctx));
      return {
        passed: result.exitCode === 0,
        passedLabel: labels.passed,
        failedLabel: labels.failed,
        output: joinOutput(result),
      };
    },
  };
}

export const typecheckGate: Gate = {
  name: 'typecheck',
  async run(ctx) {
    const opts = baseSpawnOpts(ctx);
    const [turbo, scripts] = await Promise.all([
      spawnCaptured(turboRun('typecheck', ['--output-logs=errors-only']), opts),
      spawnCaptured(rootScriptsTypecheckCommand(), opts),
    ]);

    const output = `${joinOutput(turbo)}\n${joinOutput(scripts)}`;
    const passed = turbo.exitCode === 0 && scripts.exitCode === 0;
    const errors = parseTscOutput(output).errors;

    return {
      passed,
      passedLabel: 'Typecheck passes across all workspaces',
      failedLabel:
        errors > 0
          ? `Typecheck failed with ${errors} error${errors === 1 ? '' : 's'}`
          : 'Typecheck failed (counts unavailable)',
      output,
    };
  },
};

export const lintGate: Gate = simpleExitCodeGate(
  'lint',
  turboRun('lint', ['--output-logs=errors-only']),
  {
    passed: 'Lint passes across all workspaces',
    failed: 'Lint failed (see details)',
  },
);

export const formatGate: Gate = {
  name: 'format',
  async run(ctx) {
    const result = await spawnCaptured([BUN, 'x', 'prettier', '.', '--check'], baseSpawnOpts(ctx));
    const parsed = parsePrettierCheck(result.stderr, result.stdout);
    const passed = result.exitCode === 0;

    return {
      passed,
      passedLabel: 'All files using prettier code style',
      failedLabel:
        parsed.unformatted > 0
          ? `${parsed.unformatted} file${parsed.unformatted === 1 ? '' : 's'} not using prettier code style`
          : 'Prettier check failed (counts unavailable)',
      output: joinOutput(result),
    };
  },
};

interface TestGateConfig {
  readonly label: 'unit' | 'integration' | 'e2e';
  readonly turboTask: 'test:unit' | 'test:integration' | 'test:e2e';
  readonly alsoRunRootScripts?: boolean;
}

function makeTestGate(config: TestGateConfig): Gate {
  const name = `${config.label} tests`;
  return {
    name,
    async run(ctx) {
      const opts = baseSpawnOpts(ctx);
      const turboResult = await spawnCaptured(
        turboRun(config.turboTask, ['--output-logs=full']),
        opts,
      );

      const scriptsResult = config.alsoRunRootScripts ? await runRootScriptsTests(opts) : null;

      const combined = scriptsResult
        ? `${joinOutput(turboResult)}\n${joinOutput(scriptsResult)}`
        : joinOutput(turboResult);
      const counts = parseBunTestCounts(combined);
      const passed = turboResult.exitCode === 0 && (scriptsResult?.exitCode ?? 0) === 0;

      return {
        passed,
        passedLabel: counts
          ? `${counts.passed}/${counts.total} ${name} passed`
          : `${name} passed (counts unavailable)`,
        failedLabel: buildFailedTestLabel(name, counts),
        output: combined,
      };
    },
  };
}

function buildFailedTestLabel(
  name: string,
  counts: { readonly passed: number; readonly failed: number; readonly total: number } | null,
): string {
  if (!counts) return `${name} failed (counts unavailable)`;
  if (counts.failed > 0) return `!${counts.passed}/${counts.total} ${name} passed`;
  // Gate failed with zero test failures — almost always means an upstream
  // build/typecheck error blocked the suite from running. Signal that so the
  // user looks at the captured output instead of wondering about 100% pass.
  return `${name} failed before completion (${counts.passed} ran)`;
}

async function runRootScriptsTests(opts: SpawnCaptureOptions): Promise<SpawnCaptureResult> {
  // Root scripts/ is not a turbo workspace; cover its *.unit.test.ts manually.
  const files = await listRootScriptUnitTests();
  if (files.length === 0) {
    return {
      exitCode: 0,
      stdout: 'No root script unit tests found.\n',
      stderr: '',
    };
  }
  return spawnCaptured([BUN, 'test', ...files], opts);
}

export const unitTestGate = makeTestGate({
  label: 'unit',
  turboTask: 'test:unit',
  alsoRunRootScripts: true,
});

export const integrationTestGate = makeTestGate({
  label: 'integration',
  turboTask: 'test:integration',
});

export const e2eTestGate = makeTestGate({
  label: 'e2e',
  turboTask: 'test:e2e',
});

export const coverageGate: Gate = simpleExitCodeGate(
  'coverage',
  [BUN, 'scripts/checks/coverage.ts'],
  {
    passed: 'Coverage thresholds met across all layers',
    failed: 'Coverage thresholds not met',
  },
);

export const policyGate: Gate = simpleExitCodeGate(
  'policy',
  [BUN, 'scripts/checks/test-policy.ts'],
  {
    passed: 'Test policy respected (allowlist only)',
    failed: 'Test policy violated',
  },
);

export const ALL_GATES: readonly Gate[] = [
  typecheckGate,
  lintGate,
  formatGate,
  unitTestGate,
  integrationTestGate,
  e2eTestGate,
  coverageGate,
  policyGate,
];
