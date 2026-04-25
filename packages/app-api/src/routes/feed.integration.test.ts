import type { FeedEnvelope } from '@prismhub/core';
import { describe, expect, test } from 'bun:test';
import { useAuthedAppApiClient } from './test-helpers.ts';

const getClient = useAuthedAppApiClient();

describe('feed routes', () => {
  test('streams replayed feed envelopes as SSE data', async () => {
    const client = getClient();
    const envelope = feedEnvelope();
    client.services.bus.publish('feed', envelope);

    const response = await client.request('/api/app/feed');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    expect(await firstStreamChunk(response)).toContain(`data: ${JSON.stringify(envelope)}`);
  });
});

async function firstStreamChunk(response: Response): Promise<string> {
  if (!response.body) throw new Error('feed response body is missing');
  const reader = response.body.getReader();
  const chunk = await reader.read();
  await reader.cancel();
  if (!chunk.value) throw new Error('feed response chunk is missing');
  return new TextDecoder().decode(chunk.value);
}

function feedEnvelope(): FeedEnvelope {
  return {
    id: '01HTESTULID00000000000000',
    event: {
      kind: 'session_started',
      at: '2026-04-21T00:00:00.000Z',
      session: {
        sessionId: '01HSESSION000000000000000',
        source: 'claude-code',
        agent: 'Claude',
        startedAt: '2026-04-21T00:00:00.000Z',
      },
    },
  };
}
