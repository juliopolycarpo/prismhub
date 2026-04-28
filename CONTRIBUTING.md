# Contributing to Prismhub

## Branch Conventions

- Never commit directly to `main`. Always create a feature branch first.
- Branch naming: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`, `docs/<slug>`.
- Sign commits: `git commit -s -S` (sign-off + GPG signature).

## Commit Format

```
type(scope): short imperative summary      ← max 72 chars, no trailing period
<blank line>
Optional body explaining what and why.
Wrap at 72 chars.
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`.

## Tests (mandatory)

All new code and all bug fixes MUST include tests. A task is not complete until:

1. Tests for the new/modified code exist and pass.
2. The affected package's suite is green.
3. No existing tests regressed.

Run before committing:

```sh
bun run check             # fast parallel gates: typecheck, lint, format, tests, coverage, policy
bun run test:unit         # suffix-driven unit suites only
bun run test:integration  # suffix-driven integration suites only
bun run test:e2e          # suffix-driven e2e suites only
bun run test:coverage     # coverage gate (≥ 70% lines, fails on any non-zero subprocess exit)
bun run test:policy       # workspace test policy (data-only allowlist + behavioral coverage)
bun run verify            # final handoff: check → build → boundaries (sequential, fail-fast)
```

Detailed policy: [docs/TESTING.md](docs/TESTING.md).

## Layer Boundaries

For a comprehensive overview of the intended layering, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

Two checks protect the repo structure:

1. `bun run boundaries` catches missing or cyclic workspace dependencies.
2. ESLint `no-restricted-imports` explicitly enforces these rules:

| Scope                | Enforced restriction                                                                |
| -------------------- | ----------------------------------------------------------------------------------- |
| `apps/runtime/*`     | must not be imported from anywhere else                                             |
| `packages/contracts` | must not import any `@prismhub/*` package                                           |
| `packages/core`      | must not import `http-server`, `app-api`, `mcp-host`, `mcp-client`, or `web-assets` |
| `packages/db`        | must not import `core`, `http-server`, `app-api`, `mcp-*`, or `web-assets`          |
| `packages/mcp-core`  | must not import `mcp-host` or `mcp-client`                                          |

Treat `packages/app-api`, `packages/auth`, `packages/http-server`, `packages/mcp-host`, `packages/mcp-client`, and `packages/web-assets` as the upper service layer even where ESLint does not yet spell out every allowed edge.

## Package Test Policy

Every workspace declared under root `workspaces` is scanned. Behavioral packages must:

1. expose at least one of `test`, `test:unit`, `test:integration`, or `test:e2e`, AND
2. ship at least one matching `*.unit.test.*`, `*.integration.test.*`, or `*.e2e.test.*` file.

Only explicitly allowlisted data-only packages may use `--pass-with-no-tests`.
Today the allowlist is `@prismhub/contracts` (pure schemas). Each entry MUST
carry a documented reason in `scripts/checks/test-policy.ts`.

Every committed test file must use one of the layer suffixes: `*.unit.test.ts(x)`,
`*.integration.test.ts(x)`, or `*.e2e.test.ts`.

## Naming Conventions

- Files: `kebab-case.ts`
- Types/interfaces/classes: `PascalCase`
- Functions/variables: `camelCase`
- Unit test files: `foo.unit.test.ts` or `foo.unit.test.tsx`, colocated with `foo.ts(x)`
- Integration tests: `foo.integration.test.ts` or `foo.integration.test.tsx`
- E2E tests: `foo.e2e.test.ts`

## Running Checks with Claude Code Agents

From Claude Code, the following sub-agents are available:

```
test-runner  — runs lint → typecheck → test → build before any commit
explorer     — maps the codebase before making changes across multiple files
researcher   — fetches up-to-date library docs and researches tradeoffs
```

## PR Checklist

Before opening a PR, confirm:

- [ ] `bun run verify` — green (runs `check` → `build` → `boundaries`)
- [ ] New/modified public functions have tests at the correct pyramid level
- [ ] No `.skip`, `.only`, or `fdescribe` left in test files
- [ ] Documentation updated if public API changed
- [ ] `CONTRIBUTING.md` or layer boundary rules updated if project conventions changed
