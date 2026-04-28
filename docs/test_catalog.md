# Test Catalog

> Index of every test file in the monorepo.
> Generated from the suffix-based inventory command in the Testing Guide and
> grouped by package. Refresh whenever tests are added or removed.

**Totals:** 53 test files — 26 unit · 26 integration · 1 e2e.

---

## apps/runtime

| File                                                                                                                     | Type        | Subject                                              |
| ------------------------------------------------------------------------------------------------------------------------ | ----------- | ---------------------------------------------------- |
| [apps/runtime/src/**tests**/boot.integration.test.ts](../../apps/runtime/src/__tests__/boot.integration.test.ts)         | integration | Full server boot, healthz, API surface               |
| [apps/runtime/src/**tests**/cli.e2e.test.ts](../../apps/runtime/src/__tests__/cli.e2e.test.ts)                           | e2e         | CLI smoke tests (`version`, `help`, unknown command) |
| [apps/runtime/src/**tests**/mcp-http.integration.test.ts](../../apps/runtime/src/__tests__/mcp-http.integration.test.ts) | integration | MCP streamable HTTP transport mounted in the runtime |
| [apps/runtime/src/daemon/pidfile.integration.test.ts](../../apps/runtime/src/daemon/pidfile.integration.test.ts)         | integration | Pidfile acquire / read / remove across real FS       |

## apps/web

| File                                                                                                                           | Type        | Subject                                                |
| ------------------------------------------------------------------------------------------------------------------------------ | ----------- | ------------------------------------------------------ |
| [apps/web/src/pages/**tests**/pages.integration.test.tsx](../../apps/web/src/pages/__tests__/pages.integration.test.tsx)       | integration | Top-level dashboard pages render against test services |
| [apps/web/src/pages/**tests**/settings.integration.test.tsx](../../apps/web/src/pages/__tests__/settings.integration.test.tsx) | integration | Settings page interactions and persistence             |

## packages/app-api

| File                                                                                                                             | Type        | Subject                                              |
| -------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------- |
| [packages/app-api/src/routes/cache.integration.test.ts](../../packages/app-api/src/routes/cache.integration.test.ts)             | integration | Cache placeholder routes and headers                 |
| [packages/app-api/src/routes/mcp-servers.integration.test.ts](../../packages/app-api/src/routes/mcp-servers.integration.test.ts) | integration | Private/public MCP server route contracts            |
| [packages/app-api/src/routes/sessions.integration.test.ts](../../packages/app-api/src/routes/sessions.integration.test.ts)       | integration | Hook ingestion, session queries, and summary rollups |
| [packages/app-api/src/routes/settings.integration.test.ts](../../packages/app-api/src/routes/settings.integration.test.ts)       | integration | Settings defaults, persistence, and validation       |

## packages/config

| File                                                                                             | Type        | Subject                                              |
| ------------------------------------------------------------------------------------------------ | ----------- | ---------------------------------------------------- |
| [packages/config/src/env.unit.test.ts](../../packages/config/src/env.unit.test.ts)               | unit        | Env parsing, defaults, validation errors             |
| [packages/config/src/env.integration.test.ts](../../packages/config/src/env.integration.test.ts) | integration | Env loading against `.prismhub/.env.example` on disk |
| [packages/config/src/loader.unit.test.ts](../../packages/config/src/loader.unit.test.ts)         | unit        | Config loader merge logic                            |
| [packages/config/src/paths.unit.test.ts](../../packages/config/src/paths.unit.test.ts)           | unit        | Home/data-dir/path expansion helpers                 |

## packages/core

| File                                                                                                                                                     | Type        | Subject                                       |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------- |
| [packages/core/src/events/bus.unit.test.ts](../../packages/core/src/events/bus.unit.test.ts)                                                             | unit        | In-process event bus subscribe/emit semantics |
| [packages/core/src/ids/ulid.unit.test.ts](../../packages/core/src/ids/ulid.unit.test.ts)                                                                 | unit        | ULID generation determinism and format        |
| [packages/core/src/mcp-registry/mcp-registry-service.integration.test.ts](../../packages/core/src/mcp-registry/mcp-registry-service.integration.test.ts) | integration | MCP registry service against real DB          |
| [packages/core/src/sessions/session-service.integration.test.ts](../../packages/core/src/sessions/session-service.integration.test.ts)                   | integration | Session service CRUD against real DB          |
| [packages/core/src/settings/settings-service.integration.test.ts](../../packages/core/src/settings/settings-service.integration.test.ts)                 | integration | Settings service against real DB              |
| [packages/core/src/status/status-service.integration.test.ts](../../packages/core/src/status/status-service.integration.test.ts)                         | integration | Status aggregation across upstreams           |

## packages/db

| File                                                                                                                                         | Type        | Subject                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------ |
| [packages/db/src/migrator.integration.test.ts](../../packages/db/src/migrator.integration.test.ts)                                           | integration | Migration up/down on a real temp SQLite DB |
| [packages/db/src/repositories/audit.repository.integration.test.ts](../../packages/db/src/repositories/audit.repository.integration.test.ts) | integration | Audit log repository                       |
| [packages/db/src/repositories/mcp-servers.integration.test.ts](../../packages/db/src/repositories/mcp-servers.integration.test.ts)           | integration | MCP servers repository                     |
| [packages/db/src/repositories/sessions.integration.test.ts](../../packages/db/src/repositories/sessions.integration.test.ts)                 | integration | Sessions repository                        |
| [packages/db/src/repositories/settings.integration.test.ts](../../packages/db/src/repositories/settings.integration.test.ts)                 | integration | Settings repository                        |

## packages/http-server

| File                                                                                                             | Type        | Subject                                         |
| ---------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------- |
| [packages/http-server/src/server.integration.test.ts](../../packages/http-server/src/server.integration.test.ts) | integration | Elysia server bootstrap, routes, error envelope |

## packages/integration-tests

| File                                                                                                                                                   | Type        | Subject                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ----------------------------------------------------------------------------------------------------- |
| [packages/integration-tests/src/import-scanner.unit.test.ts](../../packages/integration-tests/src/import-scanner.unit.test.ts)                         | unit        | Self-tests for the regex import scanner (named, default, namespace, side-effect, require, re-exports) |
| [packages/integration-tests/src/no-legacy-node-apis.integration.test.ts](../../packages/integration-tests/src/no-legacy-node-apis.integration.test.ts) | integration | Repo-wide guard: hard-error / forbidden-specifier / warn / info policy on Node built-ins              |

## packages/mcp-client

| File                                                                                                       | Type        | Subject                                        |
| ---------------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------------- |
| [packages/mcp-client/src/pool.unit.test.ts](../../packages/mcp-client/src/pool.unit.test.ts)               | unit        | Client pool with injected establish mock       |
| [packages/mcp-client/src/pool.integration.test.ts](../../packages/mcp-client/src/pool.integration.test.ts) | integration | Pool against real HTTP and stdio MCP upstreams |

## packages/mcp-core

| File                                                                                                                                           | Type | Subject                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ---------------------------------------- |
| [packages/mcp-core/src/registry.unit.test.ts](../../packages/mcp-core/src/registry.unit.test.ts)                                               | unit | Tool registry registration / lookup      |
| [packages/mcp-core/src/tools/list-upstream-mcp-servers.unit.test.ts](../../packages/mcp-core/src/tools/list-upstream-mcp-servers.unit.test.ts) | unit | `list-upstream-mcp-servers` tool handler |
| [packages/mcp-core/src/tools/status.unit.test.ts](../../packages/mcp-core/src/tools/status.unit.test.ts)                                       | unit | `status` tool handler                    |

## packages/mcp-host

| File                                                                                                                         | Type        | Subject                                  |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------- |
| [packages/mcp-host/src/stdio.unit.test.ts](../../packages/mcp-host/src/stdio.unit.test.ts)                                   | unit        | Stdio transport framing                  |
| [packages/mcp-host/src/server.integration.test.ts](../../packages/mcp-host/src/server.integration.test.ts)                   | integration | MCP host server end-to-end against tools |
| [packages/mcp-host/src/streamable-http.integration.test.ts](../../packages/mcp-host/src/streamable-http.integration.test.ts) | integration | Streamable HTTP plugin lifecycle         |

## packages/observability

| File                                                                                                   | Type | Subject                                    |
| ------------------------------------------------------------------------------------------------------ | ---- | ------------------------------------------ |
| [packages/observability/src/logger.unit.test.ts](../../packages/observability/src/logger.unit.test.ts) | unit | Structured logger formatting and redaction |

## packages/web-assets

| File                                                                                                                       | Type        | Subject                                              |
| -------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------- |
| [packages/web-assets/scripts/generate.unit.test.ts](../../packages/web-assets/scripts/generate.unit.test.ts)               | unit        | Manifest renderer pure function                      |
| [packages/web-assets/scripts/generate.integration.test.ts](../../packages/web-assets/scripts/generate.integration.test.ts) | integration | Manifest generation against real `dist` fixtures     |
| [packages/web-assets/scripts/tsconfig.integration.test.ts](../../packages/web-assets/scripts/tsconfig.integration.test.ts) | integration | Package tsconfig keeps script tests out of `rootDir` |
| [packages/web-assets/src/index.unit.test.ts](../../packages/web-assets/src/index.unit.test.ts)                             | unit        | `loadAssetsManifest` fallback and lookup helpers     |

## scripts

| File                                                                                                        | Type | Subject                                            |
| ----------------------------------------------------------------------------------------------------------- | ---- | -------------------------------------------------- |
| [scripts/\_lib/argv.unit.test.ts](../../scripts/_lib/argv.unit.test.ts)                                     | unit | CLI argv parsing helper                            |
| [scripts/\_lib/format.unit.test.ts](../../scripts/_lib/format.unit.test.ts)                                 | unit | Check runner checklist and failure rendering       |
| [scripts/\_lib/gate.unit.test.ts](../../scripts/_lib/gate.unit.test.ts)                                     | unit | Gate pass/fail, crash, and timeout handling        |
| [scripts/\_lib/parsers/bunTest.unit.test.ts](../../scripts/_lib/parsers/bunTest.unit.test.ts)               | unit | Bun test summary parser                            |
| [scripts/\_lib/parsers/eslint.unit.test.ts](../../scripts/_lib/parsers/eslint.unit.test.ts)                 | unit | ESLint JSON summary parser                         |
| [scripts/\_lib/parsers/prettier.unit.test.ts](../../scripts/_lib/parsers/prettier.unit.test.ts)             | unit | Prettier check parser                              |
| [scripts/\_lib/parsers/tsc.unit.test.ts](../../scripts/_lib/parsers/tsc.unit.test.ts)                       | unit | TypeScript compiler output parser                  |
| [scripts/\_lib/test-files.unit.test.ts](../../scripts/_lib/test-files.unit.test.ts)                         | unit | Root scripts unit-test discovery via Bun.Glob      |
| [scripts/checks/coverage.unit.test.ts](../../scripts/checks/coverage.unit.test.ts)                          | unit | Coverage summary and per-source parsing            |
| [scripts/checks/test-policy.unit.test.ts](../../scripts/checks/test-policy.unit.test.ts)                    | unit | `--pass-with-no-tests` policy discovery/evaluation |
| [scripts/clean.unit.test.ts](../../scripts/clean.unit.test.ts)                                              | unit | `clean.ts` artifact selection logic                |
| [scripts/\_lib/config-checks/tsconfig.unit.test.ts](../../scripts/_lib/config-checks/tsconfig.unit.test.ts) | unit | Root scripts tsconfig invariants                   |

---

## How to refresh this catalog

```sh
find apps packages scripts \
  -type f \( -name '*.unit.test.ts' -o -name '*.unit.test.tsx' \
          -o -name '*.integration.test.ts' -o -name '*.integration.test.tsx' \
          -o -name '*.e2e.test.ts' \) \
  -not -path '*/node_modules/*' -not -path '*/dist/*' | sort
```

Then sync the table above. New tests must land here in the same PR they are
introduced.
