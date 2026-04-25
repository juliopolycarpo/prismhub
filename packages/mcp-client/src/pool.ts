import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { Logger } from '@prismhub/observability';
import { APP_VERSION } from '@prismhub/config';

export interface UpstreamStdioTarget {
  readonly id: string;
  readonly name: string;
  readonly transport: 'stdio';
  readonly command: string;
  readonly args: readonly string[];
}

export interface UpstreamHttpTarget {
  readonly id: string;
  readonly name: string;
  readonly transport: 'http';
  readonly url: URL;
  /** Extra HTTP headers attached to every upstream request (e.g. `Authorization`). */
  readonly headers?: Readonly<Record<string, string>>;
}

/** Discriminated union of all upstream target types. */
export type UpstreamTarget = UpstreamStdioTarget | UpstreamHttpTarget;

export interface UpstreamConnection {
  readonly id: string;
  readonly name: string;
  readonly client: Client;
  readonly close: () => Promise<void>;
}

export interface McpClientPool {
  readonly connect: (target: UpstreamTarget, signal?: AbortSignal) => Promise<UpstreamConnection>;
  readonly list: () => readonly UpstreamConnection[];
  readonly closeAll: () => Promise<void>;
}

/**
 * Overrides the establish logic — inject in tests to avoid spawning real processes.
 * Receives the full UpstreamTarget for both stdio and http targets.
 */
export type EstablishConnectionFn = (target: UpstreamTarget) => Promise<UpstreamConnection>;

export interface McpClientPoolOptions {
  /**
   * Override the connection establishment logic.
   * Used in tests to inject fake connections without spawning child processes.
   */
  readonly establish?: EstablishConnectionFn;
  /**
   * Timeout in milliseconds for a single connect attempt.
   * Default: 10 000 ms.
   */
  readonly connectTimeoutMs?: number;
  /** Structured logger for stderr capture and close errors. */
  readonly logger?: Logger;
}

const DEFAULT_CONNECT_TIMEOUT_MS = 10_000;

function rejectAfter(ms: number, message: string): Promise<never> {
  return new Promise((_resolve, reject) => setTimeout(() => reject(new Error(message)), ms));
}

function rejectOnAbort(signal: AbortSignal): Promise<never> {
  return new Promise((_resolve, reject) => {
    if (signal.aborted) {
      reject(new Error(`connect aborted: ${signal.reason as string}`));
      return;
    }
    signal.addEventListener('abort', () => reject(new Error('connect aborted')), { once: true });
  });
}

async function establishStdio(
  target: UpstreamStdioTarget,
  logger?: Logger,
): Promise<UpstreamConnection> {
  const transport = new StdioClientTransport({
    command: target.command,
    args: [...target.args],
    stderr: 'pipe',
  });

  // Capture stderr before starting so early output is not lost
  if (transport.stderr) {
    transport.stderr.on('data', (chunk: Buffer) => {
      logger?.warn(`[upstream:${target.id}] ${chunk.toString().trimEnd()}`);
    });
  }

  const client = new Client({ name: 'prismhub', version: APP_VERSION }, { capabilities: {} });
  await client.connect(transport);

  return { id: target.id, name: target.name, client, close: () => client.close() };
}

async function establishHttp(target: UpstreamHttpTarget): Promise<UpstreamConnection> {
  // Cast required: StreamableHTTPClientTransport.sessionId getter returns `string | undefined`
  // which is incompatible with Transport.sessionId?: string under exactOptionalPropertyTypes.
  // This is an SDK type definition mismatch — the runtime behavior is correct.
  const transportOptions = target.headers
    ? { requestInit: { headers: { ...target.headers } } }
    : undefined;
  const transport = new StreamableHTTPClientTransport(
    target.url,
    transportOptions,
  ) as unknown as Transport;
  const client = new Client({ name: 'prismhub', version: APP_VERSION }, { capabilities: {} });
  await client.connect(transport);
  return { id: target.id, name: target.name, client, close: () => client.close() };
}

export function createMcpClientPool(options?: McpClientPoolOptions): McpClientPool {
  const connectTimeoutMs = options?.connectTimeoutMs ?? DEFAULT_CONNECT_TIMEOUT_MS;
  const logger = options?.logger;

  const connections = new Map<string, UpstreamConnection>();
  // In-flight map: ensures exactly one establish call per target under concurrent callers.
  const inFlight = new Map<string, Promise<UpstreamConnection>>();

  const defaultEstablish: EstablishConnectionFn = (target) => {
    if (target.transport === 'http') return establishHttp(target);
    return establishStdio(target, logger);
  };

  const doEstablish = options?.establish ?? defaultEstablish;

  function raceWithTimeout(
    target: UpstreamTarget,
    signal?: AbortSignal,
  ): Promise<UpstreamConnection> {
    const guards: Promise<never>[] = [
      rejectAfter(connectTimeoutMs, `connect timeout after ${connectTimeoutMs}ms: ${target.id}`),
    ];
    if (signal) guards.push(rejectOnAbort(signal));
    return Promise.race([doEstablish(target), ...guards]);
  }

  return {
    async connect(target, signal) {
      const existing = connections.get(target.id);
      if (existing) return existing;

      const pending = inFlight.get(target.id);
      if (pending) return pending;

      const promise = raceWithTimeout(target, signal)
        .then((raw) => {
          const conn: UpstreamConnection = {
            id: raw.id,
            name: raw.name,
            client: raw.client,
            close: async () => {
              await raw.close();
              connections.delete(target.id);
            },
          };
          connections.set(target.id, conn);
          return conn;
        })
        .finally(() => inFlight.delete(target.id));

      inFlight.set(target.id, promise);
      return promise;
    },

    list: () => [...connections.values()],

    async closeAll() {
      const entries = [...connections.values()];
      const results = await Promise.allSettled(entries.map((conn) => conn.close()));

      const errors = results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map((r) => {
          const error = r.reason instanceof Error ? r.reason : new Error(String(r.reason));
          logger?.error('failed to close upstream connection', { error: error.message });
          return error;
        });

      connections.clear();

      if (errors.length > 0) {
        throw new AggregateError(errors, `Failed to close ${errors.length} connection(s)`);
      }
    },
  };
}
