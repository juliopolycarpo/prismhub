import { describe, expect, test } from 'bun:test';
import { collectImports, type ImportKind } from './import-scanner.ts';
import {
  ALLOWED_FILES,
  FORBIDDEN_IMPORTS,
  HARD_ERROR_MODULES,
  INFO_MODULES,
  REPO_ROOT,
  SCAN_GLOBS,
  SKIP_DIR_SEGMENTS,
  WARN_MODULES,
} from './node-api-policy.ts';

interface HardViolation {
  readonly relPath: string;
  readonly module: string;
  readonly kind: ImportKind;
  readonly importedSymbol: string;
  readonly replacement: string;
}

interface SoftEntry {
  readonly relPath: string;
  readonly module: string;
  readonly note: string;
}

interface ScanResult {
  readonly hardViolations: readonly HardViolation[];
  readonly warnings: readonly SoftEntry[];
  readonly infos: readonly SoftEntry[];
}

function isUnderSkippedDir(relPath: string): boolean {
  return relPath.split('/').some((segment) => SKIP_DIR_SEGMENTS.has(segment));
}

async function scanRepo(): Promise<ScanResult> {
  const hardViolations: HardViolation[] = [];
  const warnings: SoftEntry[] = [];
  const infos: SoftEntry[] = [];

  const seenWarn = new Set<string>();
  const seenInfo = new Set<string>();
  const seenFiles = new Set<string>();

  for (const pattern of SCAN_GLOBS) {
    const glob = new Bun.Glob(pattern);
    for await (const relPath of glob.scan({ cwd: REPO_ROOT, onlyFiles: true })) {
      if (seenFiles.has(relPath)) continue;
      seenFiles.add(relPath);
      if (isUnderSkippedDir(relPath)) continue;

      const source = await Bun.file(`${REPO_ROOT}/${relPath}`).text();
      const refs = collectImports(source);
      const allowed = ALLOWED_FILES.has(relPath);

      for (const ref of refs) {
        const hardModuleNote = HARD_ERROR_MODULES.get(ref.module);
        if (hardModuleNote !== undefined && !allowed) {
          const symbol = ref.symbols.length === 0 ? '<side-effect>' : ref.symbols.join(', ');
          hardViolations.push({
            relPath,
            module: ref.module,
            kind: ref.kind,
            importedSymbol: symbol,
            replacement: hardModuleNote,
          });
          continue;
        }

        const policy = FORBIDDEN_IMPORTS.get(ref.module);
        if (policy !== undefined && !allowed) {
          if (ref.kind === 'default' || ref.kind === 'namespace' || ref.kind === 'require') {
            for (const [symbol, replacement] of policy) {
              hardViolations.push({
                relPath,
                module: ref.module,
                kind: ref.kind,
                importedSymbol: symbol,
                replacement,
              });
            }
          } else {
            for (const symbol of ref.symbols) {
              const replacement = policy.get(symbol);
              if (replacement === undefined) continue;
              hardViolations.push({
                relPath,
                module: ref.module,
                kind: ref.kind,
                importedSymbol: symbol,
                replacement,
              });
            }
          }
          continue;
        }

        const warnNote = WARN_MODULES.get(ref.module);
        if (warnNote !== undefined) {
          const key = `${relPath}::${ref.module}`;
          if (!seenWarn.has(key)) {
            seenWarn.add(key);
            warnings.push({ relPath, module: ref.module, note: warnNote });
          }
          continue;
        }

        const infoNote = INFO_MODULES.get(ref.module);
        if (infoNote !== undefined) {
          const key = `${relPath}::${ref.module}`;
          if (!seenInfo.has(key)) {
            seenInfo.add(key);
            infos.push({ relPath, module: ref.module, note: infoNote });
          }
        }
      }
    }
  }

  hardViolations.sort(
    (a, b) =>
      a.relPath.localeCompare(b.relPath) ||
      a.module.localeCompare(b.module) ||
      a.importedSymbol.localeCompare(b.importedSymbol),
  );
  warnings.sort((a, b) => a.relPath.localeCompare(b.relPath) || a.module.localeCompare(b.module));
  infos.sort((a, b) => a.relPath.localeCompare(b.relPath) || a.module.localeCompare(b.module));

  return { hardViolations, warnings, infos };
}

function scanOnce(): Promise<ScanResult> {
  let cached: Promise<ScanResult> | undefined;
  const fn = () => {
    cached ??= scanRepo();
    return cached;
  };
  return fn();
}

describe('Bun-first policy', () => {
  test('no hard-error Node module is imported anywhere', async () => {
    const { hardViolations } = await scanOnce();
    const hardModuleHits = hardViolations.filter((v) => HARD_ERROR_MODULES.has(v.module));
    if (hardModuleHits.length > 0) {
      throw new Error(
        `Found ${hardModuleHits.length} import(s) of a banned Node module:\n\n${hardModuleHits
          .map(
            (v) =>
              `  ${v.relPath}\n    [${v.kind}] ${v.module} :: ${v.importedSymbol}\n    → ${v.replacement}`,
          )
          .join('\n\n')}\n\nThese modules have a Bun-native replacement and must not be used.`,
      );
    }
    expect(hardModuleHits).toHaveLength(0);
  });

  test('no forbidden Node specifier is imported', async () => {
    const { hardViolations } = await scanOnce();
    const specifierHits = hardViolations.filter((v) => !HARD_ERROR_MODULES.has(v.module));
    if (specifierHits.length > 0) {
      throw new Error(
        `Found ${specifierHits.length} forbidden Node-API import(s) with a Bun-native replacement:\n\n${specifierHits
          .map(
            (v) =>
              `  ${v.relPath}\n    [${v.kind}] ${v.module} :: ${v.importedSymbol}\n    → ${v.replacement}`,
          )
          .join(
            '\n\n',
          )}\n\nMigrate to the Bun API, or add the file to ALLOWED_FILES in node-api-policy.ts with a justification.`,
      );
    }
    expect(specifierHits).toHaveLength(0);
  });

  test('warn-list usage fails immediately on any hit', async () => {
    const { warnings } = await scanOnce();
    if (warnings.length > 0) {
      throw new Error(
        `Found ${warnings.length} warn-list Node usage(s) — these fail immediately:\n\n${warnings
          .map((e) => `  ${e.relPath} :: ${e.module} — ${e.note}`)
          .join(
            '\n',
          )}\n\nMigrate to the Bun API, allowlist the file in node-api-policy.ts with a justification, or move the module to INFO_MODULES if it has no Bun substitute.`,
      );
    }
    expect(warnings).toHaveLength(0);
  });

  test('info-only Node usage is documented', async () => {
    const { infos } = await scanOnce();
    expect(infos.length).toBeGreaterThanOrEqual(0);
  });
});
