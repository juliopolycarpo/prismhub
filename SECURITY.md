# Security Policy

## Reporting a Vulnerability

Prismhub takes security seriously. If you discover a vulnerability, please report it privately.

**Do not open a public issue.** Instead, email the maintainer directly:

- **Email:** `julio@polycarpo.com` (replace with your actual security contact)
- **PGP key:** _(provide a key or link if available, or remove this line)_

Please include:

- A clear description of the vulnerability.
- Steps to reproduce (proof-of-concept code helps).
- Affected package(s) and version(s).
- Any potential impact or exploit scenario.

## Scope

The following packages are within the security boundary:

| Package                  | Scope                       |
| ------------------------ | --------------------------- |
| `apps/runtime`           | CLI, daemon lifecycle, IPC  |
| `apps/web`               | Dashboard (React SPA)       |
| `packages/auth`          | Authentication and sessions |
| `packages/http-server`   | HTTP server, health checks  |
| `packages/app-api`       | Private dashboard API       |
| `packages/mcp-host`      | Streaming MCP host (public) |
| `packages/mcp-client`    | Upstream MCP connections    |
| `packages/mcp-core`      | MCP protocol implementation |
| `packages/core`          | Domain services, event bus  |
| `packages/db`            | Database layer (SQLite)     |
| `packages/contracts`     | Shared schemas and types    |
| `packages/config`        | Environment and path config |
| `packages/observability` | Logging                     |
| `packages/web-assets`    | Asset manifest embedding    |

## Response Timeline

| Severity | Initial response | Patch target |
| -------- | ---------------- | ------------ |
| Critical | 48 hours         | 7 days       |
| High     | 72 hours         | 14 days      |
| Medium   | 5 business days  | Next release |
| Low      | Best effort      | Next release |

These timelines apply once the report is acknowledged. We may extend them for
complex issues and will communicate delays proactively.

## Responsible Disclosure

- We request a 90-day disclosure window after the fix is released.
- We will credit reporters in the release notes unless you request anonymity.
- We support coordinated disclosure via GitHub Security Advisories.

## Supported Versions

| Version | Supported                        |
| ------- | -------------------------------- |
| 0.x     | :white_check_mark: (pre-release) |

During the pre-release phase (0.x.y), all versions are supported for security
fixes. Once a stable 1.0.0 ships, a formal support window will be defined.
