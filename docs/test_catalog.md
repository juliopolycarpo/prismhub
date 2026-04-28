# Test Catalog

> Index of every test file in the monorepo.
> Generated from the suffix-based inventory command in the Testing Guide and
> grouped by package. Refresh whenever tests are added or removed.

**Totals:** 92 test files — 51 unit · 38 integration · 3 e2e.

---

## apps/runtime

| File                                                                                                                     | Type        | Subject                                              |
| ------------------------------------------------------------------------------------------------------------------------ | ----------- | ---------------------------------------------------- |
| [apps/runtime/src/**tests**/auth.e2e.test.ts](../../apps/runtime/src/__tests__/auth.e2e.test.ts)                         | e2e         | Auth flow (login, session) over real HTTP            |
| [apps/runtime/src/**tests**/boot.integration.test.ts](../../apps/runtime/src/__tests__/boot.integration.test.ts)         | integration | Full server boot, healthz, API surface               |
| [apps/runtime/src/**tests**/cli.e2e.test.ts](../../apps/runtime/src/__tests__/cli.e2e.test.ts)                           | e2e         | CLI smoke tests (`version`, `help`, unknown command) |
| [apps/runtime/src/**tests**/mcp-http.integration.test.ts](../../apps/runtime/src/__tests__/mcp-http.integration.test.ts) | integration | MCP streamable HTTP transport mounted in the runtime |
| [apps/runtime/src/**tests**/ratelimit.e2e.test.ts](../../apps/runtime/src/__tests__/ratelimit.e2e.test.ts)               | e2e         | Rate-limiting behavior over real HTTP                |
| [apps/runtime/src/**tests**/runtime-server.unit.test.ts](../../apps/runtime/src/__tests__/runtime-server.unit.test.ts)   | unit        | Server config merge and flag parsing                 |
| [apps/runtime/src/daemon/pidfile.integration.test.ts](../../apps/runtime/src/daemon/pidfile.integration.test.ts)         | integration | Pidfile acquire / read / remove across real FS       |

## apps/web

| File                                                                                                                                                             | Type        | Subject                                    |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------ |
| [apps/web/src/components/**tests**/authenticated-router.integration.test.tsx](../../apps/web/src/components/__tests__/authenticated-router.integration.test.tsx) | integration | Authenticated route guard redirects        |
| [apps/web/src/components/query-view.unit.test.tsx](../../apps/web/src/components/query-view.unit.test.tsx)                                                       | unit        | Query view rendering and state             |
| [apps/web/src/features/mcps/array-token-input.unit.test.tsx](../../apps/web/src/features/mcps/array-token-input.unit.test.tsx)                                   | unit        | Array token input component logic          |
| [apps/web/src/features/mcps/mcp-tool-configuration-card.unit.test.tsx](../../apps/web/src/features/mcps/mcp-tool-configuration-card.unit.test.tsx)               | unit        | Tool configuration card rendering          |
| [apps/web/src/features/mcps/mcp-tool-parameter-fields.unit.test.tsx](../../apps/web/src/features/mcps/mcp-tool-parameter-fields.unit.test.tsx)                   | unit        | Tool parameter field rendering             |
| [apps/web/src/features/mcps/tool-parameters.unit.test.ts](../../apps/web/src/features/mcps/tool-parameters.unit.test.ts)                                         | unit        | Tool parameters utility logic              |
| [apps/web/src/pages/**tests**/local-mcp-server.integration.test.tsx](../../apps/web/src/pages/__tests__/local-mcp-server.integration.test.tsx)                   | integration | Local MCP server page interactions         |
| [apps/web/src/pages/**tests**/login.integration.test.tsx](../../apps/web/src/pages/__tests__/login.integration.test.tsx)                                         | integration | Login page flow and validation             |
| [apps/web/src/pages/**tests**/pages.integration.test.tsx](../../apps/web/src/pages/__tests__/pages.integration.test.tsx)                                         | integration | Top-level dashboard pages render           |
| [apps/web/src/pages/**tests**/settings.integration.test.tsx](../../apps/web/src/pages/__tests__/settings.integration.test.tsx)                                   | integration | Settings page interactions and persistence |
| [apps/web/src/pages/**tests**/signup.integration.test.tsx](../../apps/web/src/pages/__tests__/signup.integration.test.tsx)                                       | integration | Signup page flow and validation            |
| [apps/web/src/pages/live/feed.unit.test.ts](../../apps/web/src/pages/live/feed.unit.test.ts)                                                                     | unit        | Live feed sorting and formatting           |

## packages/app-api

| File                                                                                                                                 | Type        | Subject                                              |
| ------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ---------------------------------------------------- |
| [packages/app-api/src/routes/cache.integration.test.ts](../../packages/app-api/src/routes/cache.integration.test.ts)                 | integration | Cache placeholder routes and headers                 |
| [packages/app-api/src/routes/feed.integration.test.ts](../../packages/app-api/src/routes/feed.integration.test.ts)                   | integration | Live feed endpoint contract                          |
| [packages/app-api/src/routes/mcp-servers.integration.test.ts](../../packages/app-api/src/routes/mcp-servers.integration.test.ts)     | integration | Private/public MCP server route contracts            |
| [packages/app-api/src/routes/public-status.integration.test.ts](../../packages/app-api/src/routes/public-status.integration.test.ts) | integration | Public status endpoint contract                      |
| [packages/app-api/src/routes/sessions.integration.test.ts](../../packages/app-api/src/routes/sessions.integration.test.ts)           | integration | Hook ingestion, session queries, and summary rollups |
| [packages/app-api/src/routes/settings.integration.test.ts](../../packages/app-api/src/routes/settings.integration.test.ts)           | integration | Settings defaults, persistence, and validation       |
| [packages/app-api/src/routes/test-helpers.unit.test.ts](../../packages/app-api/src/routes/test-helpers.unit.test.ts)                 | unit        | Route test helper factories                          |

## packages/auth

| File                                                                                           | Type        | Subject                              |
| ---------------------------------------------------------------------------------------------- | ----------- | ------------------------------------ |
| [packages/auth/src/auth.integration.test.ts](../../packages/auth/src/auth.integration.test.ts) | integration | Better Auth integration with real DB |
| [packages/auth/src/errors.unit.test.ts](../../packages/auth/src/errors.unit.test.ts)           | unit        | Auth error mapping and formatting    |
| [packages/auth/src/password.unit.test.ts](../../packages/auth/src/password.unit.test.ts)       | unit        | Password hashing and validation      |

## packages/config

| File                                                                                             | Type        | Subject                                              |
| ------------------------------------------------------------------------------------------------ | ----------- | ---------------------------------------------------- |
| [packages/config/src/env.integration.test.ts](../../packages/config/src/env.integration.test.ts) | integration | Env loading against `.prismhub/.env.example` on disk |
| [packages/config/src/env.unit.test.ts](../../packages/config/src/env.unit.test.ts)               | unit        | Env parsing, defaults, validation errors             |
| [packages/config/src/loader.unit.test.ts](../../packages/config/src/loader.unit.test.ts)         | unit        | Config loader merge logic                            |
| [packages/config/src/paths.unit.test.ts](../../packages/config/src/paths.unit.test.ts)           | unit        | Home/data-dir/path expansion helpers                 |

## packages/core

| File                                                                                                                           | Type        | Subject                                       |
| ------------------------------------------------------------------------------------------------------------------------------ | ----------- | --------------------------------------------- |
| [packages/core/src/events/bus.unit.test.ts](../../packages/core/src/events/bus.unit.test.ts)                                   | unit        | In-process event bus subscribe/emit semantics |
| [packages/core/src/ids/ulid.unit.test.ts](../../packages/core/src/ids/ulid.unit.test.ts)                                       | unit        | ULID generation determinism and format        |
| [packages/core/src/mcp-registry/service.integration.test.ts](../../packages/core/src/mcp-registry/service.integration.test.ts) | integration | MCP registry service against real DB          |
| [packages/core/src/sessions/service.integration.test.ts](../../packages/core/src/sessions/service.integration.test.ts)         | integration | Session service CRUD against real DB          |
| [packages/core/src/settings/service.integration.test.ts](../../packages/core/src/settings/service.integration.test.ts)         | integration | Settings service against real DB              |
| [packages/core/src/status/service.integration.test.ts](../../packages/core/src/status/service.integration.test.ts)             | integration | Status aggregation across upstreams           |

## packages/db

| File                                                                                                                                                           | Type        | Subject                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------ |
| [packages/db/src/migrator.integration.test.ts](../../packages/db/src/migrator.integration.test.ts)                                                             | integration | Migration up/down on a real temp SQLite DB |
| [packages/db/src/repositories/audit.repository.integration.test.ts](../../packages/db/src/repositories/audit.repository.integration.test.ts)                   | integration | Audit log repository                       |
| [packages/db/src/repositories/mcp-servers.integration.test.ts](../../packages/db/src/repositories/mcp-servers.integration.test.ts)                             | integration | MCP servers repository                     |
| [packages/db/src/repositories/session-events.repository.integration.test.ts](../../packages/db/src/repositories/session-events.repository.integration.test.ts) | integration | Session events repository                  |
| [packages/db/src/repositories/sessions.integration.test.ts](../../packages/db/src/repositories/sessions.integration.test.ts)                                   | integration | Sessions repository                        |
| [packages/db/src/repositories/settings.integration.test.ts](../../packages/db/src/repositories/settings.integration.test.ts)                                   | integration | Settings repository                        |
| [packages/db/src/repositories/users.repository.integration.test.ts](../../packages/db/src/repositories/users.repository.integration.test.ts)                   | integration | Users repository                           |

## packages/http-server

| File                                                                                                             | Type        | Subject                                         |
| ---------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------- |
| [packages/http-server/src/server.integration.test.ts](../../packages/http-server/src/server.integration.test.ts) | integration | Elysia server bootstrap, routes, error envelope |

## packages/integration-tests

| File                                                                                                                                                   | Type        | Subject                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ----------------------------------------------------------------------------------------------------- |
| [packages/integration-tests/src/import-scanner.unit.test.ts](../../packages/integration-tests/src/import-scanner.unit.test.ts)                         | unit        | Self-tests for the regex import scanner (named, default, namespace, side-effect, require, re-exports) |
| [packages/integration-tests/src/no-legacy-node-apis.integration.test.ts](../../packages/integration-tests/src/no-legacy-node-apis.integration.test.ts) | integration | Repo-wide guard: Node built-in policy enforcement                                                     |
| [packages/integration-tests/src/scan-support.unit.test.ts](../../packages/integration-tests/src/scan-support.unit.test.ts)                             | unit        | Helper functions for import scanning                                                                  |

## packages/mcp-client

| File                                                                                                       | Type        | Subject                                        |
| ---------------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------------- |
| [packages/mcp-client/src/pool.integration.test.ts](../../packages/mcp-client/src/pool.integration.test.ts) | integration | Pool against real HTTP and stdio MCP upstreams |
| [packages/mcp-client/src/pool.unit.test.ts](../../packages/mcp-client/src/pool.unit.test.ts)               | unit        | Client pool with injected establish mock       |

## packages/mcp-core

| File                                                                                                                                           | Type | Subject                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ---------------------------------------- |
| [packages/mcp-core/src/registry.unit.test.ts](../../packages/mcp-core/src/registry.unit.test.ts)                                               | unit | Tool registry registration / lookup      |
| [packages/mcp-core/src/tools/list-upstream-mcp-servers.unit.test.ts](../../packages/mcp-core/src/tools/list-upstream-mcp-servers.unit.test.ts) | unit | `list-upstream-mcp-servers` tool handler |
| [packages/mcp-core/src/tools/status.unit.test.ts](../../packages/mcp-core/src/tools/status.unit.test.ts)                                       | unit | `status` tool handler                    |

## packages/mcp-host

| File                                                                                                                         | Type        | Subject                                  |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------- |
| [packages/mcp-host/src/server.integration.test.ts](../../packages/mcp-host/src/server.integration.test.ts)                   | integration | MCP host server end-to-end against tools |
| [packages/mcp-host/src/stdio.unit.test.ts](../../packages/mcp-host/src/stdio.unit.test.ts)                                   | unit        | Stdio transport framing                  |
| [packages/mcp-host/src/streamable-http.integration.test.ts](../../packages/mcp-host/src/streamable-http.integration.test.ts) | integration | Streamable HTTP plugin lifecycle         |

## packages/observability

| File                                                                                                   | Type | Subject                                    |
| ------------------------------------------------------------------------------------------------------ | ---- | ------------------------------------------ |
| [packages/observability/src/logger.unit.test.ts](../../packages/observability/src/logger.unit.test.ts) | unit | Structured logger formatting and redaction |

## packages/testkit-base

| File                                                                                               | Type | Subject                                   |
| -------------------------------------------------------------------------------------------------- | ---- | ----------------------------------------- |
| [packages/testkit-base/src/clock.unit.test.ts](../../packages/testkit-base/src/clock.unit.test.ts) | unit | Deterministic clock implementation        |
| [packages/testkit-base/src/db.unit.test.ts](../../packages/testkit-base/src/db.unit.test.ts)       | unit | Temp database handle creation and cleanup |
| [packages/testkit-base/src/fs.unit.test.ts](../../packages/testkit-base/src/fs.unit.test.ts)       | unit | Temp directory creation and cleanup       |

## packages/testkit

| File                                                                                                         | Type        | Subject                                |
| ------------------------------------------------------------------------------------------------------------ | ----------- | -------------------------------------- |
| [packages/testkit/src/auth.integration.test.ts](../../packages/testkit/src/auth.integration.test.ts)         | integration | Auth test helpers against real DB      |
| [packages/testkit/src/events.unit.test.ts](../../packages/testkit/src/events.unit.test.ts)                   | unit        | Event bus test helpers                 |
| [packages/testkit/src/server.integration.test.ts](../../packages/testkit/src/server.integration.test.ts)     | integration | Test server creation and lifecycle     |
| [packages/testkit/src/services.integration.test.ts](../../packages/testkit/src/services.integration.test.ts) | integration | Service factory wiring against real DB |

## packages/web-assets

| File                                                                                                                       | Type        | Subject                                              |
| -------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------- |
| [packages/web-assets/scripts/generate.integration.test.ts](../../packages/web-assets/scripts/generate.integration.test.ts) | integration | Manifest generation against real `dist` fixtures     |
| [packages/web-assets/scripts/generate.unit.test.ts](../../packages/web-assets/scripts/generate.unit.test.ts)               | unit        | Manifest renderer pure function                      |
| [packages/web-assets/scripts/tsconfig.integration.test.ts](../../packages/web-assets/scripts/tsconfig.integration.test.ts) | integration | Package tsconfig keeps script tests out of `rootDir` |
| [packages/web-assets/src/index.unit.test.ts](../../packages/web-assets/src/index.unit.test.ts)                             | unit        | `loadAssetsManifest` fallback and lookup helpers     |

## scripts

| File                                                                                                                  | Type | Subject                                            |
| --------------------------------------------------------------------------------------------------------------------- | ---- | -------------------------------------------------- |
| [scripts/\_lib/argv.unit.test.ts](../../scripts/_lib/argv.unit.test.ts)                                               | unit | CLI argv parsing helper                            |
| [scripts/\_lib/config-checks/eslint-config.unit.test.ts](../../scripts/_lib/config-checks/eslint-config.unit.test.ts) | unit | ESLint config invariants                           |
| [scripts/\_lib/config-checks/tsconfig.unit.test.ts](../../scripts/_lib/config-checks/tsconfig.unit.test.ts)           | unit | Root scripts tsconfig invariants                   |
| [scripts/\_lib/config-checks/turbo-cache.unit.test.ts](../../scripts/_lib/config-checks/turbo-cache.unit.test.ts)     | unit | Turbo remote cache config invariants               |
| [scripts/\_lib/coverage-config.unit.test.ts](../../scripts/_lib/coverage-config.unit.test.ts)                         | unit | Coverage config validation                         |
| [scripts/\_lib/format.unit.test.ts](../../scripts/_lib/format.unit.test.ts)                                           | unit | Check runner checklist and failure rendering       |
| [scripts/\_lib/gate.unit.test.ts](../../scripts/_lib/gate.unit.test.ts)                                               | unit | Gate pass/fail, crash, and timeout handling        |
| [scripts/\_lib/parsers/bunTest.unit.test.ts](../../scripts/_lib/parsers/bunTest.unit.test.ts)                         | unit | Bun test summary parser                            |
| [scripts/\_lib/parsers/eslint.unit.test.ts](../../scripts/_lib/parsers/eslint.unit.test.ts)                           | unit | ESLint JSON summary parser                         |
| [scripts/\_lib/parsers/prettier.unit.test.ts](../../scripts/_lib/parsers/prettier.unit.test.ts)                       | unit | Prettier check parser                              |
| [scripts/\_lib/parsers/tsc.unit.test.ts](../../scripts/_lib/parsers/tsc.unit.test.ts)                                 | unit | TypeScript compiler output parser                  |
| [scripts/\_lib/run-id.unit.test.ts](../../scripts/_lib/run-id.unit.test.ts)                                           | unit | Run ID generation and formatting                   |
| [scripts/\_lib/runtime-command.unit.test.ts](../../scripts/_lib/runtime-command.unit.test.ts)                         | unit | Runtime command builder helpers                    |
| [scripts/\_lib/runtime-script.unit.test.ts](../../scripts/_lib/runtime-script.unit.test.ts)                           | unit | Runtime script path resolution                     |
| [scripts/\_lib/spawn.unit.test.ts](../../scripts/_lib/spawn.unit.test.ts)                                             | unit | Subprocess spawn helpers                           |
| [scripts/\_lib/test-files.unit.test.ts](../../scripts/_lib/test-files.unit.test.ts)                                   | unit | Root scripts unit-test discovery via Bun.Glob      |
| [scripts/checks/coverage.unit.test.ts](../../scripts/checks/coverage.unit.test.ts)                                    | unit | Coverage summary and per-source parsing            |
| [scripts/checks/test-policy.unit.test.ts](../../scripts/checks/test-policy.unit.test.ts)                              | unit | `--pass-with-no-tests` policy discovery/evaluation |
| [scripts/checks/web-assets-failfast.unit.test.ts](../../scripts/checks/web-assets-failfast.unit.test.ts)              | unit | Web-assets fail-fast check logic                   |
| [scripts/clean.unit.test.ts](../../scripts/clean.unit.test.ts)                                                        | unit | `clean.ts` artifact selection logic                |
| [scripts/test.unit.test.ts](../../scripts/test.unit.test.ts)                                                          | unit | Test runner orchestration                          |
| [scripts/verify.unit.test.ts](../../scripts/verify.unit.test.ts)                                                      | unit | Verify gate orchestration                          |

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
