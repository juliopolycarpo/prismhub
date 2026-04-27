# Changelog

All notable changes to Prismhub are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Note:** Prismhub is in active pre-release development (0.x.y). APIs and
> schemas may change between minor versions until the first stable release.

## [Unreleased]

### Added

- Web dashboard (React 19 + Vite + Tailwind CSS v4) at `/dashboard/`.
- MCP gateway with stdio and streaming HTTP transports.
- CLI entry point (`prismhub`) with `serve`, `stop`, `status`, `mcp`, `migrate`, `version`, and `help` commands.
- Better Auth integration with Elysia plugin and route guards.
- Database layer (Kysely + `bun:sqlite`) with migration support and round-trip tests.
- Structured logging via Pino (`packages/observability`).
- Shared schema contracts via TypeBox (`packages/contracts`).
- CI/CD workflows: `Check` on push, `Test` on push/PR, `Verify` on PR to `main`.
- Test harness with layered suffixes (`*.unit.test.ts`, `*.integration.test.ts`, `*.e2e.test.ts`).
- Coverage gate enforcing >= 70% line coverage.
- Layer boundary enforcement via ESLint `no-restricted-imports`.
- Single-binary compilation target (`bun build --compile`).

### Changed

- N/A (initial development phase).

### Deprecated

- N/A.

### Removed

- N/A.

### Fixed

- N/A.

### Security

- N/A.

## [0.1.0] — Unreleased
