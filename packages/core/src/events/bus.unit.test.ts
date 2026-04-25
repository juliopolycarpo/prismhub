import { describe, expect, test } from 'bun:test';
import { createEventBus } from './bus.ts';
import type { FeedEnvelope } from './bus.types.ts';

function envelope(id: string): FeedEnvelope {
  return {
    id,
    event: {
      kind: 'session_started',
      at: '2026-04-21T00:00:00.000Z',
      session: {
        sessionId: '01HTESTULID00000000000000',
        source: 'claude-code',
        agent: 'Claude',
        startedAt: '2026-04-21T00:00:00.000Z',
      },
    },
  };
}

describe('EventBus', () => {
  test('delivers events to subscribers', () => {
    const bus = createEventBus();
    const seen: string[] = [];
    bus.subscribe('feed', (e) => seen.push(e.id));
    bus.publish('feed', envelope('a'));
    bus.publish('feed', envelope('b'));
    expect(seen).toEqual(['a', 'b']);
  });

  test('unsubscribe stops delivery', () => {
    const bus = createEventBus();
    const seen: string[] = [];
    const sub = bus.subscribe('feed', (e) => seen.push(e.id));
    bus.publish('feed', envelope('a'));
    sub.unsubscribe();
    bus.publish('feed', envelope('b'));
    expect(seen).toEqual(['a']);
  });

  test('replay returns buffered events up to the cap', () => {
    const bus = createEventBus({ replayBufferSize: 2 });
    bus.publish('feed', envelope('a'));
    bus.publish('feed', envelope('b'));
    bus.publish('feed', envelope('c'));
    const ids = bus.replay('feed').map((e) => e.id);
    expect(ids).toEqual(['b', 'c']);
  });

  test('faulty subscriber does not break the bus', () => {
    const bus = createEventBus();
    const seen: string[] = [];
    bus.subscribe('feed', () => {
      throw new Error('boom');
    });
    bus.subscribe('feed', (e) => seen.push(e.id));
    bus.publish('feed', envelope('a'));
    expect(seen).toEqual(['a']);
  });
});
