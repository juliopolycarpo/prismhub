import type { SessionEventPayload, SessionRecord } from '@prismhub/contracts';
import { describe, expect, test } from 'bun:test';
import { ulid } from '@prismhub/core';
import { jsonInit, useAuthedAppApiClient } from './test-helpers.ts';

const getClient = useAuthedAppApiClient({ version: '9.9.9' });

describe('session and hook routes', () => {
  test('persists hook lifecycle and exposes sessions, events, and summary', async () => {
    const client = getClient();
    const sessionId = ulid();
    const invocationId = ulid();

    expect(
      (
        await client.request(
          '/api/v1/hooks/session-start',
          jsonInit('POST', {
            sessionId,
            source: 'claude-code',
            agent: 'Claude',
            title: 'Investigate test split',
            workingDir: '/repo/prismhub',
            startedAt: '2026-04-23T10:00:00.000Z',
            metadata: { project: 'prismhub' },
          }),
        )
      ).status,
    ).toBe(200);

    expect(
      (
        await client.request(
          '/api/v1/hooks/session-event',
          jsonInit('POST', {
            sessionId,
            kind: 'message',
            role: 'user',
            content: 'split unit and integration tests',
            at: '2026-04-23T10:01:00.000Z',
          }),
        )
      ).status,
    ).toBe(200);

    expect(
      (
        await client.request(
          '/api/v1/hooks/session-event',
          jsonInit('POST', {
            sessionId,
            kind: 'tool_call',
            invocationId,
            toolName: 'search-files',
            input: { query: 'integration.test.ts' },
            at: '2026-04-23T10:02:00.000Z',
          }),
        )
      ).status,
    ).toBe(200);

    expect(
      (
        await client.request(
          '/api/v1/hooks/session-end',
          jsonInit('POST', {
            sessionId,
            endedAt: '2026-04-23T10:03:00.000Z',
            reason: 'completed',
            stats: { messages: 1, toolCalls: 1 },
          }),
        )
      ).status,
    ).toBe(200);

    const listRes = await client.request('/api/app/sessions?limit=10&offset=0');
    expect(listRes.status).toBe(200);

    const sessions = (await listRes.json()) as SessionRecord[];
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({
      id: sessionId,
      source: 'claude-code',
      agent: 'Claude',
      title: 'Investigate test split',
      status: 'completed',
      endedAt: '2026-04-23T10:03:00.000Z',
      messageCount: 1,
      toolCallCount: 1,
    });

    const detailRes = await client.request(`/api/app/sessions/${sessionId}`);
    expect(detailRes.status).toBe(200);

    const detail = (await detailRes.json()) as SessionRecord & {
      readonly metadata: Record<string, unknown> | null;
    };
    expect(detail).toMatchObject({
      id: sessionId,
      workingDir: '/repo/prismhub',
      metadata: { project: 'prismhub' },
    });

    const eventsRes = await client.request(`/api/app/sessions/${sessionId}/events?limit=10`);
    expect(eventsRes.status).toBe(200);

    const events = (await eventsRes.json()) as Array<{
      readonly kind: SessionEventPayload['kind'];
      readonly at: string;
      readonly payload: SessionEventPayload;
    }>;
    expect(events).toHaveLength(2);
    expect(events.map((event) => event.kind)).toEqual(['message', 'tool_call']);
    expect(events.map((event) => event.at)).toEqual([
      '2026-04-23T10:01:00.000Z',
      '2026-04-23T10:02:00.000Z',
    ]);
    expect(events[0]?.payload).toMatchObject({ role: 'user' });
    expect(events[1]?.payload).toMatchObject({ toolName: 'search-files' });

    const summaryRes = await client.request('/api/app/summary');
    expect(summaryRes.status).toBe(200);

    const summary = (await summaryRes.json()) as {
      version: string;
      sessions: { total: number; active: number; latestId: string | null };
      upstreams: { total: number; enabled: number };
    };
    expect(summary).toMatchObject({
      version: '9.9.9',
      sessions: { total: 1, active: 0, latestId: sessionId },
      upstreams: { total: 0, enabled: 0 },
    });
  });
});
