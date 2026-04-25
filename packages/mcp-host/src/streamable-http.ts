import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { Elysia } from 'elysia';

// Matches http(s)://localhost[:<port>] and http(s)://127.0.0.1[:<port>].
// Protects against DNS-rebinding attacks from browser contexts.
const LOCAL_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export interface StreamableHttpPluginOptions {
  /**
   * Factory called once per MCP session to create a fresh Server instance.
   * Each session must have its own Server so that session-scoped state
   * (initialized flag, capabilities, etc.) does not leak across clients.
   *
   * Usage example:
   *   const registry = createToolRegistry([...]);
   *   createStreamableHttpPlugin({
   *     serverFactory: () => createPrismMcpServer({ name, version, registry }),
   *   });
   */
  readonly serverFactory: () => Server;
  /**
   * Origins permitted in addition to localhost/127.0.0.1.
   * Exact string match — scheme + host + optional port must match.
   */
  readonly allowedOrigins?: readonly string[];
  /** Mount path. Defaults to "/mcp". */
  readonly path?: string;
  /**
   * Stateless mode: skip session tracking and create a new transport per
   * request. Useful for simple deployments or testing.
   */
  readonly stateless?: boolean;
}

function isAllowedOrigin(origin: string, extra: readonly string[] = []): boolean {
  return LOCAL_ORIGIN_RE.test(origin) || extra.includes(origin);
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function allowOrigin(request: Request, allowedOrigins?: readonly string[]): Response | null {
  const origin = request.headers.get('origin');
  if (origin !== null && !isAllowedOrigin(origin, allowedOrigins)) {
    return jsonResponse({ error: 'origin_not_allowed' }, 403);
  }
  return null;
}

/**
 * Creates an Elysia plugin that exposes a Streamable HTTP MCP endpoint.
 *
 * Stateful mode (default): maintains a session map keyed by Mcp-Session-Id.
 * Each session gets its own transport + Server instance. Supports:
 *   - POST (initialize or tool call)
 *   - GET  (SSE listening stream)
 *   - DELETE (explicit session termination)
 *
 * Stateless mode: one transport per request — no session tracking.
 */
export function createStreamableHttpPlugin(options: StreamableHttpPluginOptions) {
  const path = options.path ?? '/mcp';

  if (options.stateless) {
    return buildStatelessPlugin(path, options);
  }
  return buildStatefulPlugin(path, options);
}

function buildStatelessPlugin(path: string, options: StreamableHttpPluginOptions) {
  return new Elysia().all(path, async ({ request }) => {
    const rejected = allowOrigin(request, options.allowedOrigins);
    if (rejected) return rejected;

    const transport = new WebStandardStreamableHTTPServerTransport(
      // No sessionIdGenerator → stateless mode: each request is independent.
      {},
    );
    const server = options.serverFactory();
    await server.connect(transport);
    return transport.handleRequest(request);
  });
}

function buildStatefulPlugin(path: string, options: StreamableHttpPluginOptions) {
  const sessions = new Map<string, WebStandardStreamableHTTPServerTransport>();

  return new Elysia().all(path, async ({ request }) => {
    const rejected = allowOrigin(request, options.allowedOrigins);
    if (rejected) return rejected;

    const sessionId = request.headers.get('mcp-session-id');

    // Explicit session termination
    if (request.method === 'DELETE') {
      if (sessionId !== null) sessions.delete(sessionId);
      return new Response(null, { status: 204 });
    }

    // Route to an existing session
    if (sessionId !== null) {
      const transport = sessions.get(sessionId);
      if (!transport) {
        return jsonResponse({ error: 'session_not_found' }, 404);
      }
      return transport.handleRequest(request);
    }

    // New connection — only POST/initialize is allowed without a session ID
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'session_required' }, 400);
    }

    const bodyText = await request.text();
    let body: unknown;
    try {
      body = JSON.parse(bodyText) as unknown;
    } catch {
      return jsonResponse({ error: 'invalid_json' }, 400);
    }

    if (!isInitializeRequest(body)) {
      return jsonResponse({ error: 'must_initialize_first' }, 400);
    }

    // Create a new transport + server for this session.
    // The closure in onsessioninitialized captures `transport` by reference;
    // by the time it fires the assignment is complete.
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
      onsessioninitialized: (id) => {
        sessions.set(id, transport);
      },
      onsessionclosed: (id) => {
        sessions.delete(id);
      },
    });

    const server = options.serverFactory();
    await server.connect(transport);

    // Reconstruct the request with the already-consumed body so the transport
    // can parse the initialize message without reading a drained stream.
    const initRequest = new Request(request, { body: bodyText });
    return transport.handleRequest(initRequest);
  });
}
