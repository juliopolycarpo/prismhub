# Prismhub

Prismhub is a local-first companion app and MCP gateway for coding tools. Run `prismhub serve` to get a single local service that provides a dashboard, internal API, external API, and MCP server/client capabilities — making Codex, Claude Code, and other MCP-aware tools easier to connect, observe, and coordinate.

## Prerequisites

| Tool                  | Version                                |
| --------------------- | -------------------------------------- |
| [Bun](https://bun.sh) | `1.3.13` (pinned via `packageManager`) |

With **asdf**: run `cd .prismhub && asdf install` to use the repo-pinned `.tool-versions`.

## Getting Started

```sh
# 1. Install dependencies
bun install

# 2. Apply database migrations
bun run migrate

# 3. Verify the repo is healthy
bun run check          # fast parallel gates (typecheck, lint, format, tests, coverage, policy)

# 4. Build all packages
bun run build

# 5. Final handoff before commit
bun run verify         # check -> build -> boundaries (sequential, fail-fast)

# 6. Start the server
bun run start          # delegates to apps/runtime and serves Prismhub
```

The dashboard is available at `http://127.0.0.1:3030/dashboard` after startup.

## Configuration

Copy `.prismhub/.env.example` to `.env` and adjust as needed. All variables are optional (the defaults work for local development):

```sh
cp .prismhub/.env.example .env
```

## Workspace Layout

For a detailed breakdown of the system architecture and layer dependency rules, please refer to our [Architecture Documentation](docs/ARCHITECTURE.md).

| Path                     | Description                                                       |
| ------------------------ | ----------------------------------------------------------------- |
| `apps/runtime`           | Composition root, CLI entry point (`prismhub`), daemon lifecycle  |
| `apps/web`               | React + Vite dashboard served at `/dashboard`                     |
| `packages/auth`          | Better Auth server wiring, Elysia plugin, and route guards        |
| `packages/config`        | Environment parsing, default values, filesystem paths             |
| `packages/contracts`     | Shared TypeBox schemas and types across all layers                |
| `packages/core`          | Domain services: sessions, settings, MCP registry, status, events |
| `packages/db`            | Kysely + bun:sqlite client, migrations, repositories              |
| `packages/http-server`   | Elysia HTTP server, health/readiness routes                       |
| `packages/app-api`       | Private dashboard API at `/api/app`                               |
| `packages/mcp-client`    | Upstream MCP connection pool (stdio transport)                    |
| `packages/mcp-core`      | MCP protocol implementation, tool registry                        |
| `packages/mcp-host`      | Streaming HTTP MCP host                                           |
| `packages/observability` | Structured logger (pino)                                          |
| `packages/web-assets`    | Compiled web asset manifest for single-binary embedding           |
| `packages/testkit-base`  | Low-level test helpers: temp dirs, clocks, temp databases         |
| `packages/testkit`       | Shared higher-level test helpers and service factories            |

## Scripts

| Script                     | Description                                              |
| -------------------------- | -------------------------------------------------------- |
| `bun run dev`              | Start all packages in watch/hot-reload mode              |
| `bun run build`            | Build all packages                                       |
| `bun run start`            | Start the runtime server from the repo root              |
| `bun run lint`             | Run ESLint across all packages (zero warnings allowed)   |
| `bun run typecheck`        | Run `tsc --noEmit` across all packages                   |
| `bun run test`             | Run unit, integration, and e2e suites in order           |
| `bun run test:unit`        | Run only `*.unit.test.ts(x)` suites                      |
| `bun run test:integration` | Run only `*.integration.test.ts(x)` suites               |
| `bun run test:e2e`         | Run only `*.e2e.test.ts` suites                          |
| `bun run test:coverage`    | Run tests and enforce coverage threshold (≥ 70% lines)   |
| `bun run test:policy`      | Enforce test policy and `--pass-with-no-tests` allowlist |
| `bun run boundaries`       | Run `turbo boundaries` (no missing deps, no cycles)      |
| `bun run check`            | Fast parallel gate orchestrator (frequent local use)     |
| `bun run verify`           | Final handoff: check → build → boundaries (fail-fast)    |
| `bun run migrate`          | Apply pending database migrations                        |
| `bun run fix`              | Auto-fix lint and format issues                          |
| `bun run clean`            | Remove all build artifacts                               |

## Versioning

All packages are at `0.x.y` during pre-release development. Versions are not independently published until the first public release.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for branch conventions, commit format, testing policy, and the PR checklist.

## License

[MIT](./LICENSE)
