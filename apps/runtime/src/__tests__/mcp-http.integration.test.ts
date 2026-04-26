import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import {
  cleanupRuntimeServer,
  RUNTIME_SERVER_TEST_TIMEOUT_MS,
  shutdownRuntimeServer,
  startRuntimeServer,
  type RuntimeServerHandle,
} from './runtime-server.ts';

const INIT_REQUEST = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'runtime-mcp-test', version: '0.0.0' },
  },
} as const;

let runtime: RuntimeServerHandle;

async function postMcp(baseUrl: string, body: unknown, sessionId?: string): Promise<Response> {
  return fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      ...(sessionId === undefined ? {} : { 'mcp-session-id': sessionId }),
    },
    body: JSON.stringify(body),
  });
}

async function openMcpSession(baseUrl: string): Promise<string> {
  const response = await postMcp(baseUrl, INIT_REQUEST);
  expect(response.status).toBe(200);
  const sessionId = response.headers.get('mcp-session-id');
  expect(sessionId).toBeTruthy();
  return sessionId!;
}

async function closeMcpSession(baseUrl: string, sessionId: string): Promise<void> {
  await fetch(`${baseUrl}/mcp`, {
    method: 'DELETE',
    headers: { 'mcp-session-id': sessionId },
  });
}

beforeAll(async () => {
  runtime = await startRuntimeServer();
}, RUNTIME_SERVER_TEST_TIMEOUT_MS);

afterAll(async () => {
  await shutdownRuntimeServer(runtime);
  cleanupRuntimeServer(runtime);
}, RUNTIME_SERVER_TEST_TIMEOUT_MS);

describe('runtime MCP over HTTP', () => {
  test('lists and calls runtime MCP tools', async () => {
    const sessionId = await openMcpSession(runtime.baseUrl);

    try {
      const toolsResponse = await postMcp(
        runtime.baseUrl,
        { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
        sessionId,
      );
      expect(toolsResponse.status).toBe(200);

      const toolsBody = await toolsResponse.text();
      const contentType = toolsResponse.headers.get('content-type') ?? '';
      const payload = contentType.includes('text/event-stream')
        ? toolsBody
            .split(/\r?\n/)
            .filter((l) => l.startsWith('data:'))
            .map((l) => l.replace(/^data:\s?/, ''))
            .join('\n')
        : toolsBody;
      const toolsPayload = JSON.parse(payload) as {
        id: number;
        jsonrpc: '2.0';
        result?: { tools?: { name?: string }[] };
      };
      const toolNames = toolsPayload.result?.tools?.map((tool) => tool.name) ?? [];

      expect(toolNames).toContain('status');
      expect(toolNames).toContain('list_upstream_mcp_servers');

      const statusResponse = await postMcp(
        runtime.baseUrl,
        { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'status', arguments: {} } },
        sessionId,
      );
      expect(statusResponse.status).toBe(200);

      const statusBody = await statusResponse.text();
      const statusContentType = statusResponse.headers.get('content-type') ?? '';
      const statusRaw = statusContentType.includes('text/event-stream')
        ? statusBody
            .split(/\r?\n/)
            .filter((l) => l.startsWith('data:'))
            .map((l) => l.replace(/^data:\s?/, ''))
            .join('\n')
        : statusBody;
      const statusPayload = JSON.parse(statusRaw) as {
        id: number;
        jsonrpc: '2.0';
        result?: { content?: { text?: string }[] };
      };
      const snapshotText = statusPayload.result?.content?.[0]?.text;

      expect(snapshotText).toBeDefined();
      const snapshot = JSON.parse(snapshotText ?? '{}') as {
        dbReady: boolean;
        upstreamsCount: number;
        version: string;
      };
      expect(snapshot.dbReady).toBe(true);
      expect(snapshot.upstreamsCount).toBe(0);
      expect(snapshot.version).toMatch(/^\d+\.\d+\.\d+/);
    } finally {
      await closeMcpSession(runtime.baseUrl, sessionId);
    }
  });
});
