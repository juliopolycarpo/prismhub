/**
 * Lightweight ES-module / CommonJS import scanner used by the Bun-first
 * Node API policy guard. Regex-based — fast, dependency-free, good enough
 * for source files we control.
 *
 * Captures every shape that introduces a module dependency:
 *   - named:      `import { a, b as c } from 'mod'`
 *   - default:    `import x from 'mod'`
 *   - namespace:  `import * as x from 'mod'`
 *   - sideeffect: `import 'mod'`
 *   - require:    `require('mod')`
 *   - re-exports: `export { a } from 'mod'`, `export * from 'mod'`,
 *                 `export * as x from 'mod'`
 */

export type ImportKind = 'named' | 'default' | 'namespace' | 'sideeffect' | 'require';

export interface ImportRef {
  readonly module: string;
  readonly kind: ImportKind;
  readonly symbols: readonly string[];
}

const LINE_COMMENT_RE = /\/\/[^\n]*/g;
const BLOCK_COMMENT_RE = /\/\*[\s\S]*?\*\//g;

const NAMED_IMPORT_RE =
  /import\s+(?:type\s+)?(?:([\w$]+)\s*,\s*)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g;
const DEFAULT_ONLY_IMPORT_RE = /import\s+(?:type\s+)?([\w$]+)\s+from\s*['"]([^'"]+)['"]/g;
const NAMESPACE_IMPORT_RE =
  /import\s+(?:type\s+)?(?:[\w$]+\s*,\s*)?\*\s+as\s+[\w$]+\s+from\s*['"]([^'"]+)['"]/g;
const SIDE_EFFECT_IMPORT_RE = /(?:^|[\n;])\s*import\s*['"]([^'"]+)['"]/g;
const REQUIRE_RE = /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const NAMED_REEXPORT_RE = /export\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g;
const STAR_REEXPORT_RE = /export\s+\*(?:\s+as\s+[\w$]+)?\s+from\s*['"]([^'"]+)['"]/g;

interface ImportPattern {
  readonly regex: RegExp;
  readonly kind: ImportKind;
  /** Group index for the module name. */
  readonly moduleGroup: number;
  /**
   * Optional: group index for a symbol list (e.g. `{ a, b as c }`).
   * When set, symbols are parsed via `parseSymbolList`; otherwise a static list is used.
   */
  readonly symbolsGroup?: number;
  /** Static symbols used when symbolsGroup is unset. */
  readonly staticSymbols?: readonly string[];
  /**
   * Optional: group index for a default name that sits alongside a named list
   * (e.g. `import Foo, { a } from 'mod'`). Emitted as a separate `default` ref.
   */
  readonly defaultGroup?: number;
}

const PATTERNS: readonly ImportPattern[] = [
  { regex: NAMED_IMPORT_RE, kind: 'named', moduleGroup: 3, symbolsGroup: 2, defaultGroup: 1 },
  { regex: DEFAULT_ONLY_IMPORT_RE, kind: 'default', moduleGroup: 2, symbolsGroup: 1 },
  { regex: NAMESPACE_IMPORT_RE, kind: 'namespace', moduleGroup: 1, staticSymbols: ['*'] },
  { regex: SIDE_EFFECT_IMPORT_RE, kind: 'sideeffect', moduleGroup: 1, staticSymbols: [] },
  { regex: REQUIRE_RE, kind: 'require', moduleGroup: 1, staticSymbols: ['*'] },
  { regex: NAMED_REEXPORT_RE, kind: 'named', moduleGroup: 2, symbolsGroup: 1 },
  { regex: STAR_REEXPORT_RE, kind: 'namespace', moduleGroup: 1, staticSymbols: ['*'] },
];

function stripComments(source: string): string {
  return source.replace(BLOCK_COMMENT_RE, '').replace(LINE_COMMENT_RE, '');
}

function parseSymbolList(raw: string): string[] {
  return raw
    .split(',')
    .map((entry) => {
      const head = entry.trim().split(/\s+as\s+/)[0];
      return head === undefined ? '' : head.replace(/^type\s+/, '').trim();
    })
    .filter((s): s is string => s.length > 0);
}

export function collectImports(source: string): ImportRef[] {
  const cleaned = stripComments(source);
  const refs: ImportRef[] = [];

  for (const pattern of PATTERNS) {
    for (const m of cleaned.matchAll(pattern.regex)) {
      const moduleName = m[pattern.moduleGroup];
      if (moduleName === undefined) continue;

      const symbols =
        pattern.symbolsGroup !== undefined
          ? parseSymbolList(m[pattern.symbolsGroup] ?? '')
          : (pattern.staticSymbols ?? []);

      if (pattern.defaultGroup !== undefined) {
        const defaultName = m[pattern.defaultGroup];
        if (defaultName !== undefined) {
          refs.push({ module: moduleName, kind: 'default', symbols: [defaultName] });
        }
      }

      refs.push({ module: moduleName, kind: pattern.kind, symbols });
    }
  }

  return refs;
}
