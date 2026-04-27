import type { FeedEnvelope } from '@prismhub/contracts';
import { describe, expect, test } from 'bun:test';
import { parseFeedEnvelope } from './feed.ts';

describe('parseFeedEnvelope', () => {
  test('returns a feed envelope when SSE data contains the envelope shape', () => {
    const envelope = feedEnvelope();

    expect(parseFeedEnvelope(JSON.stringify(envelope))).toEqual(envelope);
  });

  test('returns null for malformed JSON', () => {
    expect(parseFeedEnvelope('{not-json')).toBeNull();
  });

  test('returns null when data only contains the inner event', () => {
    expect(parseFeedEnvelope(JSON.stringify(feedEnvelope().event))).toBeNull();
  });
});

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
