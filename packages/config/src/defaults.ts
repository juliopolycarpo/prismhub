// Hardcoded constant — updated by release tooling, survives `bun build --compile`.
export const APP_VERSION = '0.1.0' as const;

export const DEFAULT_SSE_HEARTBEAT_MS = 30_000;
export const DEFAULT_EVENT_BUFFER_SIZE = 100;
