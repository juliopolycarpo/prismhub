export interface ParsedArgs {
  readonly positional: readonly string[];
  readonly flags: ReadonlySet<string>;
  readonly options: ReadonlyMap<string, string>;
}

export function parseArgv(argv: readonly string[]): ParsedArgs {
  const positional: string[] = [];
  const flags = new Set<string>();
  const options = new Map<string, string>();

  for (const arg of argv) {
    if (!arg.startsWith('--')) {
      positional.push(arg);
      continue;
    }
    const name = arg.slice(2);
    const eqIdx = name.indexOf('=');
    if (eqIdx < 0) {
      flags.add(name);
    } else {
      options.set(name.slice(0, eqIdx), name.slice(eqIdx + 1));
    }
  }

  return { positional, flags, options };
}
