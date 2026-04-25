/**
 * Policy data for `no-legacy-node-apis.integration.test.ts`.
 *
 * Categories (mirrors `.claude/REVIEW.md`):
 *
 *   1. HARD_ERROR_MODULES   — any import from these modules fails the test.
 *   2. FORBIDDEN_IMPORTS    — only the listed named imports fail.
 *                             Default / namespace imports of these modules
 *                             also fail (they expose every forbidden symbol).
 *   3. WARN_MODULES         — informational; 2+ unique warnings fail the test.
 *   4. INFO_MODULES         — pure documentation; never fails. Surfaces a
 *                             count so devs can revisit when Bun adds a
 *                             native equivalent.
 *
 * References (verified against Bun docs):
 *   - https://bun.sh/docs/runtime/nodejs-apis
 *   - https://bun.sh/docs/runtime/file-io
 *   - https://bun.sh/docs/api/spawn
 *   - https://bun.sh/docs/api/udp
 *   - https://bun.sh/docs/api/http (Bun.serve)
 *   - https://bun.sh/docs/api/tcp (Bun.listen / Bun.connect)
 *   - https://bun.sh/docs/api/utils (Bun.inspect, Bun.deepEquals, ...)
 *   - https://bun.sh/reference/bun/write
 *   - https://bun.sh/reference/bun/BunFile
 *   - https://bun.sh/guides/util/file-url-to-path
 */

export const REPO_ROOT = `${import.meta.dir}/../../..`;

export const SCAN_GLOBS: readonly string[] = [
  'apps/**/*.ts',
  'apps/**/*.tsx',
  'packages/**/*.ts',
  'packages/**/*.tsx',
  'scripts/**/*.ts',
];

export const SKIP_DIR_SEGMENTS: ReadonlySet<string> = new Set([
  'node_modules',
  'dist',
  '.turbo',
  'coverage',
  '.next',
]);

/**
 * Modules with a strong Bun-native replacement. Importing ANY symbol from
 * them — named, default, namespace, side-effect, `require()` — fails the test.
 */
export const HARD_ERROR_MODULES: ReadonlyMap<string, string> = new Map([
  ['node:test', 'use `bun:test` (`describe`, `test`, `expect`, ...)'],
  ['node:child_process', 'use `Bun.spawn`, `Bun.spawnSync` or `Bun.$` (Bun Shell)'],
  ['node:dgram', 'use `Bun.udpSocket`'],
  ['node:buffer', 'use the global `Buffer`, `Uint8Array`, `ArrayBuffer` or `Blob`'],
  ['node:console', 'use the global `console`'],
  ['node:process', 'use the global `process`, `Bun.env`, `Bun.argv` or `Bun.main`'],
  ['node:string_decoder', 'use `TextDecoder` / `TextEncoder`'],
  ['node:querystring', 'use `URLSearchParams`'],
  ['node:timers', 'use the global `setTimeout` / `setInterval` / `clearTimeout` / ...'],
  ['node:timers/promises', 'use `Bun.sleep(ms)` for simple delays'],
]);

/**
 * Map of module → forbidden imported symbol → human-readable replacement.
 * Anything not listed here is allowed at the symbol level (but the module
 * itself may still be on the warn / info lists).
 *
 * Default / namespace imports of these modules also fail (they expose
 * every forbidden symbol implicitly).
 */
export const FORBIDDEN_IMPORTS: ReadonlyMap<string, ReadonlyMap<string, string>> = new Map([
  [
    'node:fs',
    new Map([
      ['readFile', 'use `Bun.file(path).text()` / `.json()` / `.bytes()` / `.stream()`'],
      [
        'readFileSync',
        'prefer `Bun.file(path).text()` (async); only keep if truly sync is required',
      ],
      ['writeFile', 'use `Bun.write(path, data)`'],
      ['writeFileSync', 'use `Bun.write(path, data)`; only keep if truly sync is required'],
      ['copyFile', 'use `Bun.write(destination, Bun.file(source))`'],
      ['createReadStream', 'use `Bun.file(path).stream()`'],
      ['createWriteStream', 'use `Bun.file(path).writer()`'],
    ]),
  ],
  [
    'node:fs/promises',
    new Map([
      ['readFile', 'use `await Bun.file(path).text()` / `.json()` / `.bytes()`'],
      ['writeFile', 'use `await Bun.write(path, data, { mode })` (creates parent dirs)'],
      ['copyFile', 'use `await Bun.write(destination, Bun.file(source))`'],
      ['unlink', 'use `await Bun.file(path).delete()`'],
    ]),
  ],
  [
    'node:http',
    new Map([
      ['createServer', 'use `Bun.serve`'],
      ['request', 'use `fetch`'],
      ['get', 'use `fetch`'],
    ]),
  ],
  [
    'node:https',
    new Map([
      ['createServer', 'use `Bun.serve` with `tls` options'],
      ['request', 'use `fetch`'],
      ['get', 'use `fetch`'],
    ]),
  ],
  [
    'node:net',
    new Map([
      ['createServer', 'use `Bun.listen`'],
      ['connect', 'use `Bun.connect`'],
      ['createConnection', 'use `Bun.connect`'],
    ]),
  ],
  [
    'node:tls',
    new Map([
      ['createServer', 'use `Bun.listen` with `tls`'],
      ['connect', 'use `Bun.connect` with `tls: true`'],
    ]),
  ],
  [
    'node:crypto',
    new Map([
      ['randomUUID', 'use the global `crypto.randomUUID()` or `Bun.randomUUIDv7()`'],
      ['randomBytes', 'use `crypto.getRandomValues(new Uint8Array(n))`'],
      ['createHash', 'use `Bun.CryptoHasher` (or `Bun.hash` for non-cryptographic hashing)'],
      ['createHmac', 'use `Bun.CryptoHasher` HMAC mode'],
      ['pbkdf2', 'prefer Web Crypto `subtle.deriveBits` / `deriveKey`'],
      ['pbkdf2Sync', 'prefer Web Crypto `subtle.deriveBits` / `deriveKey`'],
    ]),
  ],
  [
    'node:zlib',
    new Map([
      ['gzipSync', 'use `Bun.gzipSync`'],
      ['gunzipSync', 'use `Bun.gunzipSync`'],
      ['deflateSync', 'use `Bun.deflateSync`'],
      ['inflateSync', 'use `Bun.inflateSync`'],
    ]),
  ],
  [
    'node:url',
    new Map([
      ['URL', 'use the global `URL`'],
      ['URLSearchParams', 'use the global `URLSearchParams`'],
      ['fileURLToPath', 'use `Bun.fileURLToPath(url)`'],
      ['pathToFileURL', 'use `Bun.pathToFileURL(path)`'],
    ]),
  ],
  [
    'node:util',
    new Map([
      ['inspect', 'use `Bun.inspect`'],
      ['isDeepStrictEqual', 'use `Bun.deepEquals(a, b, true)`'],
      ['TextEncoder', 'use the global `TextEncoder`'],
      ['TextDecoder', 'use the global `TextDecoder`'],
    ]),
  ],
  [
    'node:perf_hooks',
    new Map([
      ['performance', 'use the global `performance`'],
      ['PerformanceObserver', 'use the global `PerformanceObserver`'],
    ]),
  ],
  [
    'node:module',
    new Map([['createRequire', 'prefer ESM imports or `Bun.resolveSync` where applicable']]),
  ],
]);

/**
 * Modules with no clean Bun substitute today, but worth flagging. Each
 * unique (file, module) pair counts as one warning. Any warn-list hit fails
 * the policy test immediately — there is no grace threshold.
 */
export const WARN_MODULES: ReadonlyMap<string, string> = new Map([
  ['node:stream', 'consider Web Streams (`ReadableStream`/`WritableStream`); not always drop-in'],
  ['node:worker_threads', 'consider Web `Worker`; not full Node parity'],
  ['node:dns', 'Bun DNS APIs are mostly cache/prefetch oriented — review case by case'],
  ['node:http2', 'Bun.serve does not yet implement HTTP/2 — review when refactoring'],
]);

/**
 * Informational only. Listing these documents intentional Node usage so we
 * notice when Bun ships a native replacement. They never fail the test.
 */
export const INFO_MODULES: ReadonlyMap<string, string> = new Map([
  ['node:async_hooks', 'avoid unless framework integration requires it'],
  ['node:os', 'no Bun-native replacement — keep'],
  ['node:path', 'no Bun-native replacement — keep'],
  ['node:events', 'EventEmitter has no direct Bun-native equivalent'],
  ['node:tty', 'no full Bun-native equivalent'],
  ['node:readline', 'no full Bun-native equivalent'],
]);

/**
 * Files explicitly allowed to use a forbidden / hard-error API.
 *
 * Each entry must include a `// reason:` comment justifying the exception
 * (e.g. wraps a low-level Node API by design, or runs on Node-only tooling).
 */
export const ALLOWED_FILES: ReadonlySet<string> = new Set<string>([
  // reason: parser self-tests intentionally embed forbidden import strings as
  // fixtures to verify the scanner detects each shape.
  'packages/integration-tests/src/import-scanner.unit.test.ts',
]);
