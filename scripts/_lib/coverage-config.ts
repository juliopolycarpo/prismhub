/**
 * Per-layer line-coverage thresholds. Tighter for stable, pure-logic layers.
 * Pulled out of `check-coverage.ts` so the table can be unit-tested in isolation
 * and reused by other tooling without dragging in the bun:$ shell.
 */

export const GLOBAL_THRESHOLD = 70;

export interface LayerConfig {
  readonly dir: string;
  readonly threshold: number;
}

export const LAYER_THRESHOLDS: readonly LayerConfig[] = [
  // Core domain logic — highest bar
  { dir: 'packages/core', threshold: 90 },
  { dir: 'packages/db', threshold: 90 },
  // Infrastructure / API layer
  { dir: 'packages/http-server', threshold: 70 },
  { dir: 'packages/app-api', threshold: 65 },
  { dir: 'packages/mcp-client', threshold: 65 },
  { dir: 'packages/mcp-core', threshold: 80 },
  { dir: 'packages/mcp-host', threshold: 85 },
  { dir: 'packages/observability', threshold: 80 },
  { dir: 'packages/config', threshold: 80 },
  // Application layer
  { dir: 'apps/runtime', threshold: 70 },
  { dir: 'apps/web', threshold: 70 },
  // Static asset bundler — small, pure-logic
  { dir: 'packages/web-assets', threshold: 70 },
  // Test infrastructure (behavioral)
  { dir: 'packages/testkit-base', threshold: 80 },
  { dir: 'packages/testkit', threshold: 60 },
];
