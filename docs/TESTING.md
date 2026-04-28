# Testing Guide

> Authoritative reference for how tests are organized, executed, and enforced
> in this monorepo.

## TL;DR

```sh
bun run test            # unit -> integration -> e2e via Turbo + root scripts unit tests
bun run test:unit       # only *.unit.test.ts(x)
bun run test:integration # only *.integration.test.ts(x)
bun run test:e2e        # only *.e2e.test.ts
bun run test:coverage   # with coverage gate (≥ 70% line coverage)
bun run test:policy     # policy guards (workspace test policy)
bun test path/to/file   # single file, fastest feedback loop

bun run check           # fast parallel gates (frequent local use)
bun run verify          # final handoff: check -> build -> boundaries
```

All test runners are Bun-native (`bun test`). No `jest`, `vitest`, or `node --test`.

---

## Test Pyramid

| Layer           | Suffix                  | Purpose                                                   | Real I/O?                           |
| --------------- | ----------------------- | --------------------------------------------------------- | ----------------------------------- |
| **Unit**        | `*.unit.test.ts`        | Pure logic, parsers, transforms, validators               | No — mock all boundaries            |
| **Integration** | `*.integration.test.ts` | Crosses one boundary: DB, HTTP, filesystem, MCP transport | Yes (real SQLite, Elysia, fixtures) |
| **E2E**         | `*.e2e.test.ts`         | Full process lifecycle (CLI smoke, runtime boot)          | Yes (subprocess + HTTP)             |

Test placement follows the canonical rule in [AGENTS.md > Testing](../AGENTS.md#testing). Cross-cutting tests that don't belong to any single package live in
[packages/integration-tests/](../../packages/integration-tests/) — for example
the [Bun-first policy guard](../../packages/integration-tests/src/no-legacy-node-apis.integration.test.ts).

## Suffix-Driven Selection

Test layer selection is driven by filename suffix inside each package, not by
workspace name. Every workspace that owns a layer exposes the matching script:

```json
{
  "scripts": {
    "test": "bun test",
    "test:unit": "bun test unit.test",
    "test:integration": "bun test integration.test",
    "test:e2e": "bun test e2e.test"
  }
}
```

Why this exists:

- The old `bun run test:unit` behavior filtered only the
  `@prismhub/integration-tests` workspace, so colocated
  `*.integration.test.ts` files in other packages still ran as "unit" tests.
- The current convention filters by stable suffix substring inside each
  workspace, so colocated integration tests no longer leak into unit runs.
- Root-level tests under `scripts/` are treated as unit-only and discovered via
  `Bun.Glob('**/*.unit.test.ts')`, so `packages/*/scripts/*.integration.test.ts`
  are not accidentally swept into the root suite.

---

## Running Tests

```sh
# Whole repo (turbo orchestrates per-package + root scripts unit tests)
bun run test

# Layer-only runs from the repo root
bun run test:unit
bun run test:integration
bun run test:e2e

# Single package
cd packages/db && bun test

# Single package, single layer
cd packages/app-api && bun run test:integration

# Single file
bun test packages/db/src/migrator.integration.test.ts

# Watch a single package
cd packages/core && bun test --watch

# Coverage report (gate fails below 70%)
bun run test:coverage

# Policy checks
bun run test:policy
```

---

## Testkit Helpers

Shared in [packages/testkit](../../packages/testkit/src/) — never imported by
production code (enforced by package boundaries).

```ts
import {
  createTestServices, // wired services backed by a temp SQLite DB
  createTestServer, // Elysia test server from TestServices
  createTempDirectory, // temp dir, cleaned up explicitly
  createTempDatabaseHandle, // temp SQLite file path + cleanup
} from '@prismhub/testkit';

let services: TestServices;
beforeEach(async () => {
  services = await createTestServices();
});
afterEach(async () => {
  await services.cleanup();
});

const server = createTestServer(services);
const res = await server.handle(new Request('http://local/healthz'));
expect(res.status).toBe(200);
```

---

## HTTP Mocking (MSW)

For tests that call out over HTTP, use `msw`. Shared handlers do not exist
yet — when introduced they should live in `packages/testkit/src/mocks/`.

```ts
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer(
  http.get('https://api.example.com/foo', () => HttpResponse.json({ ok: true })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## Database in Integration Tests

Tests in `packages/db` use a temp SQLite file so each run starts clean:

```ts
const handle = createTempDatabaseHandle();
const db = createDatabase({ filename: handle.databasePath });
await runMigrations(db);
// ...
await closeDatabase(db);
handle.cleanup();
```

---

## Coverage Gate

Threshold: **≥ 70 % line coverage** across all files. `bun run test:coverage`
fails closed with exit code `1` if:

- Line coverage drops below 70%.
- The coverage summary is missing or malformed.
- Any coverage subprocess exits non-zero, even when a coverage summary is
  present (a passing summary cannot mask a failing subprocess).

Per-layer enforced targets:

| Area                     | Target |
| ------------------------ | ------ |
| `packages/core`          | ≥ 90 % |
| `packages/db`            | ≥ 90 % |
| `packages/http-server`   | ≥ 70 % |
| `packages/app-api`       | ≥ 65 % |
| `packages/mcp-client`    | ≥ 65 % |
| `packages/mcp-core`      | ≥ 80 % |
| `packages/mcp-host`      | ≥ 85 % |
| `packages/observability` | ≥ 80 % |
| `packages/config`        | ≥ 80 % |
| `apps/runtime`           | ≥ 70 % |
| `apps/web`               | ≥ 70 % |
| `packages/web-assets`    | ≥ 70 % |
| `packages/testkit-base`  | ≥ 80 % |
| `packages/testkit`       | ≥ 60 % |

The global coverage run includes `packages/`, `apps/runtime/`, and root
`scripts/`. `apps/web` is validated only in the per-layer phase because its
Bun test preload lives in [apps/web/bunfig.toml](../../apps/web/bunfig.toml)
and is only active when tests execute from that package directory.

The root ESLint policy is enforced by
[`scripts/eslint-config.unit.test.ts`](../../scripts/eslint-config.unit.test.ts),
not by the coverage gate.

---

## Bun-First Runtime Policy

The repo enforces a four-tier policy on Node built-in modules. The guard is
implemented by
[packages/integration-tests/src/no-legacy-node-apis.integration.test.ts](../../packages/integration-tests/src/no-legacy-node-apis.integration.test.ts),
the regex-based scanner lives in
[import-scanner.ts](../../packages/integration-tests/src/import-scanner.ts)
(self-tested in
[import-scanner.unit.test.ts](../../packages/integration-tests/src/import-scanner.unit.test.ts)),
and the policy data is in
[node-api-policy.ts](../../packages/integration-tests/src/node-api-policy.ts).

The scanner detects every dependency shape: named, default, namespace,
side-effect, `require()`, and re-exports.

### 1. Hard-error modules — fail on any import

Banned outright. Default / namespace / require imports are also blocked.

| Module                 | Use instead                                    |
| ---------------------- | ---------------------------------------------- |
| `node:test`            | `bun:test`                                     |
| `node:child_process`   | `Bun.spawn`, `Bun.spawnSync`, `Bun.$`          |
| `node:dgram`           | `Bun.udpSocket`                                |
| `node:buffer`          | global `Buffer` / `Uint8Array` / `ArrayBuffer` |
| `node:console`         | global `console`                               |
| `node:process`         | global `process`, `Bun.env`, `Bun.argv`        |
| `node:string_decoder`  | `TextDecoder` / `TextEncoder`                  |
| `node:querystring`     | `URLSearchParams`                              |
| `node:timers`          | global `setTimeout` / `setInterval` / ...      |
| `node:timers/promises` | `Bun.sleep(ms)` for simple delays              |

### 2. Forbidden specifiers — fail on listed named imports

Other named imports from these modules stay allowed. Default / namespace /
`require()` imports are also blocked because they expose every forbidden
symbol implicitly.

| Module             | Forbidden symbols                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| `node:fs`          | `readFile`, `readFileSync`, `writeFile`, `writeFileSync`, `copyFile`, `createReadStream`, `createWriteStream` |
| `node:fs/promises` | `readFile`, `writeFile`, `copyFile`, `unlink`                                                                 |
| `node:http`        | `createServer`, `request`, `get`                                                                              |
| `node:https`       | `createServer`, `request`, `get`                                                                              |
| `node:net`         | `createServer`, `connect`, `createConnection`                                                                 |
| `node:tls`         | `createServer`, `connect`                                                                                     |
| `node:crypto`      | `randomUUID`, `randomBytes`, `createHash`, `createHmac`, `pbkdf2`, `pbkdf2Sync`                               |
| `node:zlib`        | `gzipSync`, `gunzipSync`, `deflateSync`, `inflateSync`                                                        |
| `node:url`         | `URL`, `URLSearchParams`, `fileURLToPath`, `pathToFileURL`                                                    |
| `node:util`        | `inspect`, `isDeepStrictEqual`, `TextEncoder`, `TextDecoder`                                                  |
| `node:perf_hooks`  | `performance`, `PerformanceObserver`                                                                          |
| `node:module`      | `createRequire`                                                                                               |

Replacements (Bun-native, all documented at <https://bun.sh/docs>) live in
the `FORBIDDEN_IMPORTS` map of `node-api-policy.ts`.

### 3. Warn-list — fails immediately

No clean Bun substitute today, but worth flagging. Any unique
`(file, module)` hit fails the policy test — there is no grace threshold.

| Module                | Note                                            |
| --------------------- | ----------------------------------------------- |
| `node:stream`         | consider Web Streams; not always drop-in        |
| `node:worker_threads` | consider Web `Worker`; not full Node parity     |
| `node:dns`            | Bun DNS APIs are mostly cache/prefetch oriented |
| `node:http2`          | Bun.serve does not yet implement HTTP/2         |

### 4. Info-only — never fails

Documented usage with no Bun-native replacement today. Counted only so we
notice when Bun ships an alternative.

| Module             | Why it stays                                   |
| ------------------ | ---------------------------------------------- |
| `node:async_hooks` | avoid unless framework integration requires it |
| `node:os`          | no Bun-native replacement                      |
| `node:path`        | no Bun-native replacement                      |
| `node:events`      | no direct EventEmitter equivalent              |
| `node:tty`         | no full Bun-native equivalent                  |
| `node:readline`    | no full Bun-native equivalent                  |

Sync `node:fs` helpers (`mkdtempSync`, `rmSync`, `mkdirSync`),
`node:fs/promises mkdir`, and `node:util parseArgs` also remain allowed —
no clean Bun substitute exists. See justifications inline in
`node-api-policy.ts`.

### Allowlist

If a file genuinely needs a forbidden API (e.g. a test fixture that embeds
the API as a literal string), add its path to `ALLOWED_FILES` in
`node-api-policy.ts` with a `// reason:` comment.

---

## Anti-Patterns

- ❌ `process.pid + 1` or any non-deterministic PID as a fixture
- ❌ `bun test --pass-with-no-tests` outside the explicit allowlist (enforced
  by `bun run test:policy`)
- ❌ Committing `*.test.ts` files without a layer suffix
- ❌ Mocking your own modules — sign of bad coupling, refactor instead
- ❌ Leaving `.skip`, `.only`, `fdescribe`, `fit`, or `xit` committed
- ❌ `sleep(ms)` in e2e tests — use `waitFor` or event polling
- ❌ Snapshotting full components

---

## When May Tests Be Skipped?

Only when:

1. The user explicitly authorizes ("skip tests for now", "this is a spike"), or
2. The code is a declared POC/spike, with a visible `TODO` and a tracked issue.

In both cases, list the missing tests and link the issue.

---

## Test Catalog

A machine-readable inventory of every test in the repo lives at
[test_catalog.md](./test_catalog.md). Refresh it with:

```sh
bun -e "for await (const f of new Bun.Glob('**/*.{unit,integration,e2e}.test.{ts,tsx,js}').scan({ cwd: '.', onlyFiles: true })) console.log(f);"
```

or `rg --files -g '**/*.{unit,integration,e2e}.test.*'`.

---

## Test Run Artifacts

Every invocation of `bun run test` (and the `--unit`, `--integration`, `--e2e`
variants) writes structured artifacts under
`.prismhub/tests/<runId>/results/`, where `<runId>` is the ISO-8601 timestamp
of the run with `:`/`.` replaced by `-` (e.g. `2026-04-24T15-32-07`).

```
.prismhub/tests/2026-04-24T15-32-07/results/
  summary.json          ← machine-readable suite outcomes
  unit.log.txt          ← full stdout/stderr of `bun x turbo run test:unit`
  scripts-unit.log.txt  ← root-level `scripts/**/*.unit.test.ts` output
  integration.log.txt
  e2e.log.txt
```

`summary.json` shape:

```jsonc
{
  "runId": "2026-04-24T15-32-07",
  "startedAt": "2026-04-24T15:32:07.123Z",
  "finishedAt": "2026-04-24T15:32:53.001Z",
  "exitCode": 0,
  "suites": [
    {
      "kind": "unit",
      "exitCode": 0,
      "durationMs": 4310,
      "logPath": ".../unit.log.txt",
      "command": ["bun", "x", "turbo", "run", "test:unit"],
    },
  ],
}
```

The runner exposes the run id to children via the `PRISMHUB_TEST_RUN_ID`
environment variable so tests can correlate their own data (e.g. the e2e auth
flow places its temp `prismhub serve` data dir under
`.prismhub/tests/tmp/<runId>/`).

`.prismhub/` is gitignored. Pass `--no-artifacts` to skip persistence and fall
back to the previous stream-only behavior.
