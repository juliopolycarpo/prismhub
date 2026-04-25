export type RuntimeSubcommand = 'migrate' | 'serve';

export function runtimeCommand(
  subcommand: RuntimeSubcommand,
  args: readonly string[] = [],
): readonly string[] {
  return [process.execPath, 'apps/runtime/src/main.ts', subcommand, ...args];
}
