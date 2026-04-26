# AGENTS.md

## Runtime

- Use `bun`/`bunx` only. Never `node`, `npm`, `npx`, or `yarn`.
- Keep Bun's hoisted linker (`bunfig.toml`).
  Switching to `isolated` can break current `@modelcontextprotocol/sdk` peer resolution.

## Bootstrap And Dev

- Local bootstrap: `cp .prismhub/.env.example .env && bun install && bun run migrate`.
- All `.env` values are optional for local dev; `BETTER_AUTH_SECRET` is only required for production signing.
- Root dev loop: `bun run dev`.
- Root start: `bun run start`.
- Runtime only: run `bun run start` or `bun run dev` in `apps/runtime`.
- Web only: run `bun run dev` in `apps/web`. The Vite app lives under `/dashboard/` and proxies `/api` to `PRISMHUB_API` or `http://127.0.0.1:3030`.

## Verification

- CI runs `Check` on `push`, `Test` on `push` and `pull_request`, and `Verify` on `pull_request`.
- `Test` fans out unit, integration, e2e, coverage, and `web-assets` fail-fast jobs in parallel and uploads `.prismhub/tests/**/results/` artifacts.
- Pull requests also run `Verify`, which executes `bun run verify` as the final handoff gate.
- Shared CI job wiring lives in `.github/workflows/run-command.yml`.
- Shared CI bootstrap lives in `.github/actions/setup-bun/action.yml`.
- Turborepo remote cache is enabled in `Check` and `Verify` when `TURBO_TOKEN` and `TURBO_TEAM` (and optionally `TURBO_API`) are configured in GitHub.
- `bun run verify` is the final handoff gate: `check -> build -> boundaries`.
- `bun run check` runs 8 gates in parallel: typecheck, lint, format, unit, integration, e2e, coverage, policy.
- `bun run typecheck` also checks root `scripts/` with `tsc --noEmit -p scripts/tsconfig.json`; Turbo does not cover those files by itself.
- `bun run boundaries` catches missing or cyclic workspace deps; ESLint guards the composition root and lower layers.

## Workspace Map

- `apps/runtime`: composition root, CLI entrypoint (`prismhub`), migrations command, single-binary target.
- `apps/web`: React 19 + Vite dashboard served at `/dashboard/`.
- `packages/app-api`, `packages/auth`, `packages/http-server`, `packages/mcp-host`, `packages/mcp-client`, `packages/web-assets`: upper service layer.
- `packages/core`, `packages/mcp-core`: domain and MCP logic.
- `packages/db`: Kysely + `bun:sqlite`, migrations, repositories.
- `packages/contracts`, `packages/config`, `packages/observability`: bottom shared layer.
- `packages/testkit-base`, `packages/testkit`: shared test helpers.
- `packages/integration-tests`: repo-wide policy and integration tests.
- Respect the intended layering: `apps/* -> service packages -> core/mcp-core -> db -> contracts/config/observability`. ESLint explicitly guards `apps/runtime`, `contracts`, `core`, `db`, and `mcp-core`.

## Testing

- Test file names must use layer suffixes: `*.unit.test.ts`, `*.integration.test.ts`, `*.e2e.test.ts`.
- Whole repo: `bun run test`, `bun run test:unit`, `bun run test:integration`, `bun run test:e2e`.
- Single file: `bun test path/to/file.test.ts`.
- Single package: run `bun test` or `bun run test:<layer>` inside that workspace directory.
- Root `scripts/**/*.unit.test.ts` are outside Turbo and are run manually by the root test/check scripts.
- `packages/contracts` is the only allowlisted workspace that may use `--pass-with-no-tests`.
- `bun run test:coverage` enforces a global `>= 70%` line coverage gate.
- Web tests should be run from `apps/web` when invoking `bun test` directly so `apps/web/bunfig.toml` preload stays active.
- Test runs write artifacts to `.prismhub/tests/<runId>/results/`; pass `--no-artifacts` only if you intentionally want stream-only mode.

## Repo Constraints

- TypeScript is strict: `no-explicit-any`, `no-non-null-assertion`, `verbatimModuleSyntax`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes` are enforced.
- `console` is banned in production code except the explicit CLI/scripts/test allowlist in ESLint.
- Prefer Bun-native APIs. `packages/integration-tests` fails the repo on banned `node:` modules or specifiers when Bun equivalents exist.
- `**/*.generated.ts` is generated code. Edit the generator, not the generated file.
- `packages/web-assets` generates `src/manifest.generated.ts` from `apps/web/dist`; release builds fail if the dashboard has not been built.
- DB migrations live in `packages/db/src/migrations/`, use `NNNN_slug.ts`, must implement both `up` and `down`, and must be covered by the round-trip migration test in `packages/db/src/migrator.integration.test.ts`.
