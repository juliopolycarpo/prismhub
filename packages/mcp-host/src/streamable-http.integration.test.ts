import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createToolRegistry } from '@prismhub/mcp-core';
import { Elysia } from 'elysia';
import { createPrismMcpServer } from './server.ts';
import { createStreamableHttpPlugin } from './streamable-http.ts';

const INIT_REQUEST = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-client', version: '0.0.0' },
  },
};

function makeApp(opts?: { stateless?: boolean; allowedOrigins?: readonly string[] }) {
  const registry = createToolRegistry([]);
  const serverFactory = () => createPrismMcpServer({ name: 'test', version: '0.0.0', registry });
  return new Elysia().use(createStreamableHttpPlugin({ serverFactory, ...opts }));
}

async function post(
  app: Elysia,
  body: unknown,
  headers: Record<string, string> = {},
): Promise<Response> {
  return app.handle(
    new Request('http://local/mcp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
        ...headers,
      },
      body: JSON.stringify(body),
    }),
  );
}

describe('Streamable HTTP MCP plugin', () => {
  let app: Elysia;

  beforeEach(() => {
    app = makeApp();
  });

  afterEach(() => {
    app = new Elysia();
  });

  test('initialize returns 200 and Mcp-Session-Id header', async () => {
    const res = await post(app, INIT_REQUEST);
    expect(res.status).toBe(200);
    expect(res.headers.get('mcp-session-id')).toBeTruthy();
  });

  test('second initialize on same session returns response', async () => {
    const init = await post(app, INIT_REQUEST);
    const sessionId = init.headers.get('mcp-session-id') ?? '';

    const list = await post(
      app,
      { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
      { 'mcp-session-id': sessionId },
    );
    expect([200, 400]).toContain(list.status);
  });

  test('two concurrent initialize calls get different session IDs', async () => {
    const [r1, r2] = await Promise.all([post(app, INIT_REQUEST), post(app, INIT_REQUEST)]);
    const s1 = r1.headers.get('mcp-session-id');
    const s2 = r2.headers.get('mcp-session-id');
    expect(s1).toBeTruthy();
    expect(s2).toBeTruthy();
    expect(s1).not.toBe(s2);
  });

  test('returns 404 for unknown session ID', async () => {
    const res = await post(
      app,
      { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
      { 'mcp-session-id': 'unknown-session-id' },
    );
    expect(res.status).toBe(404);
  });

  test('POST without session ID and non-initialize method returns 400', async () => {
    const res = await post(app, { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} });
    expect(res.status).toBe(400);
  });

  test('malformed JSON returns 400', async () => {
    const res = await app.handle(
      new Request('http://local/mcp', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: 'not-json',
      }),
    );
    expect(res.status).toBe(400);
  });

  test('DELETE with session ID removes the session', async () => {
    const init = await post(app, INIT_REQUEST);
    const sessionId = init.headers.get('mcp-session-id') ?? '';

    const del = await app.handle(
      new Request('http://local/mcp', {
        method: 'DELETE',
        headers: { 'mcp-session-id': sessionId },
      }),
    );
    expect(del.status).toBe(204);

    const afterDelete = await post(
      app,
      { jsonrpc: '2.0', id: 3, method: 'tools/list', params: {} },
      { 'mcp-session-id': sessionId },
    );
    expect(afterDelete.status).toBe(404);
  });

  test('DELETE without session ID returns 204', async () => {
    const res = await app.handle(new Request('http://local/mcp', { method: 'DELETE' }));
    expect(res.status).toBe(204);
  });

  test('GET without session ID returns 400 (session required)', async () => {
    const res = await app.handle(
      new Request('http://local/mcp', {
        method: 'GET',
        headers: { accept: 'text/event-stream' },
      }),
    );
    expect(res.status).toBe(400);
  });

  test.each([
    { origin: 'http://localhost:3030', expected: 200, name: 'localhost', appOpts: undefined },
    { origin: 'http://127.0.0.1:5173', expected: 200, name: '127.0.0.1', appOpts: undefined },
    {
      origin: 'https://evil.example.com',
      expected: 403,
      name: 'unknown external',
      appOpts: undefined,
    },
    {
      origin: 'https://trusted.example.com',
      expected: 200,
      name: 'trusted origin',
      appOpts: { allowedOrigins: ['https://trusted.example.com'] },
    },
    { origin: undefined, expected: 200, name: 'no origin header', appOpts: undefined },
  ])('origin validation: $name', async ({ origin, expected, appOpts }) => {
    const testApp = makeApp(appOpts);
    const headers: Record<string, string> = {};
    if (origin) headers.origin = origin;

    const res = await post(testApp, INIT_REQUEST, headers);
    expect(res.status).toBe(expected);
  });

  test('stateless mode: initialize returns a response without session management', async () => {
    const statelessApp = makeApp({ stateless: true });
    const res = await post(statelessApp, INIT_REQUEST);
    expect(res.status).toBe(200);
  });
});
