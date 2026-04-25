import { describe, expect, test } from 'bun:test';
import type { FeedEnvelope } from '@prismhub/contracts';
import { createEventBus } from '@prismhub/core';
import { eventBusRecorder } from './events.ts';

function makeEnvelope(id: string): FeedEnvelope {
  return {
    id,
    event: {
      kind: 'session_started',
      at: '2024-01-01T00:00:00.000Z',
      session: {
        sessionId: id,
        source: 'claude-code',
        agent: 'claude',
        startedAt: '2024-01-01T00:00:00.000Z',
      },
    },
  };
}

describe('eventBusRecorder()', () => {
  test('records every envelope published after subscribing', () => {
    const bus = createEventBus();
    const recorder = eventBusRecorder(bus);

    const first = makeEnvelope('01HMZTESTAAAAAAAAAAAAAAAAA');
    const second = makeEnvelope('01HMZTESTBBBBBBBBBBBBBBBBB');
    bus.publish('feed', first);
    bus.publish('feed', second);

    expect(recorder.recorded).toHaveLength(2);
    expect(recorder.recorded[0]).toBe(first);
    expect(recorder.recorded[1]).toBe(second);

    recorder.stop();
  });

  test('stop() unsubscribes so further publishes are not recorded', () => {
    const bus = createEventBus();
    const recorder = eventBusRecorder(bus);

    bus.publish('feed', makeEnvelope('01HMZTESTCCCCCCCCCCCCCCCCC'));
    recorder.stop();
    bus.publish('feed', makeEnvelope('01HMZTESTDDDDDDDDDDDDDDDDD'));

    expect(recorder.recorded).toHaveLength(1);
  });

  test('starts with an empty recording', () => {
    const bus = createEventBus();
    const recorder = eventBusRecorder(bus);

    expect(recorder.recorded).toHaveLength(0);

    recorder.stop();
  });
});
