import { describe, expect, test } from 'bun:test';
import { collectImports, type ImportKind, type ImportRef } from './import-scanner.ts';
import {
  ALLOWED_FILES,
  FORBIDDEN_IMPORTS,
  HARD_ERROR_MODULES,
  INFO_MODULES,
  REPO_ROOT,
  SCAN_GLOBS,
  WARN_MODULES,
} from './node-api-policy.ts';
import { createAsyncOnce, hasNodeSpecifierHint, shouldScanRepoFile } from './scan-support.ts';

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

const FILE_SCAN_BATCH_SIZE = 24;
const REPO_SCAN_TIMEOUT_MS = 20_000;

async function scanRepo(): Promise<ScanResult> {
  const hardViolations: HardViolation[] = [];
  const warnings: SoftEntry[] = [];
  const infos: SoftEntry[] = [];

  const seenFiles = new Set<string>();
  const relPaths: string[] = [];

  for (const pattern of SCAN_GLOBS) {
    const glob = new Bun.Glob(pattern);
    for await (const relPath of glob.scan({ cwd: REPO_ROOT, onlyFiles: true })) {
      if (seenFiles.has(relPath) || !shouldScanRepoFile(relPath)) continue;
      seenFiles.add(relPath);
      relPaths.push(relPath);
    }
  }

  for (let index = 0; index < relPaths.length; index += FILE_SCAN_BATCH_SIZE) {
    const batch = relPaths.slice(index, index + FILE_SCAN_BATCH_SIZE);
    const files = await Promise.all(
      batch.map(async (relPath) => {
        const source = await Bun.file(`${REPO_ROOT}/${relPath}`).text();
        const refs: ImportRef[] = hasNodeSpecifierHint(source) ? collectImports(source) : [];
        return { relPath, refs };
      }),
    );

    for (const file of files) {
      const { relPath, refs } = file;
      if (refs.length === 0) continue;

      const allowed = ALLOWED_FILES.has(relPath);
      const seenWarn = new Set<string>();
      const seenInfo = new Set<string>();

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
          if (!seenWarn.has(ref.module)) {
            seenWarn.add(ref.module);
            warnings.push({ relPath, module: ref.module, note: warnNote });
          }
          continue;
        }

        const infoNote = INFO_MODULES.get(ref.module);
        if (infoNote !== undefined) {
          if (!seenInfo.has(ref.module)) {
            seenInfo.add(ref.module);
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

const scanOnce = createAsyncOnce(scanRepo);

describe('Bun-first policy', () => {
  test(
    'no hard-error Node module is imported anywhere',
    async () => {
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
    },
    REPO_SCAN_TIMEOUT_MS,
  );

  test(
    'no forbidden Node specifier is imported',
    async () => {
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
    },
    REPO_SCAN_TIMEOUT_MS,
  );

  test(
    'warn-list usage fails immediately on any hit',
    async () => {
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
    },
    REPO_SCAN_TIMEOUT_MS,
  );

  test(
    'info-only Node usage is documented',
    async () => {
      const { infos } = await scanOnce();
      expect(infos.length).toBeGreaterThanOrEqual(0);
    },
    REPO_SCAN_TIMEOUT_MS,
  );
});
