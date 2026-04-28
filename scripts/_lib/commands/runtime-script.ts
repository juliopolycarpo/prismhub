import { runtimeCommand, type RuntimeSubcommand } from './runtime-command';
import { inheritSpawn } from '../process/spawn';

type SpawnWithInheritedStdio = (command: readonly string[]) => Promise<number>;

/**
 * Runs an `apps/runtime` subcommand with inherited stdio and returns its exit code.
 *
 * Used by thin entrypoint scripts (e.g. `scripts/start.ts`, `scripts/migrate.ts`)
 * so they can collapse to a single `process.exit(await runRuntimeScript(...))` call.
 */
export async function runRuntimeScript(
  subcommand: RuntimeSubcommand,
  argv: readonly string[],
  spawn: SpawnWithInheritedStdio = inheritSpawn,
): Promise<number> {
  return spawn(runtimeCommand(subcommand, argv));
}
