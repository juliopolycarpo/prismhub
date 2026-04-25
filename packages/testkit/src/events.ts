import type { FeedEnvelope } from '@prismhub/contracts';
import type { EventBus } from '@prismhub/core';

export interface EventBusRecorder {
  /** All envelopes published to the bus since the recorder was created. */
  readonly recorded: readonly FeedEnvelope[];
  /** Stop listening; call in afterEach to prevent leaks. */
  readonly stop: () => void;
}

/**
 * Subscribes to an event bus and records every envelope published.
 * Useful for asserting side-effects without inspecting the database.
 *
 * @example
 * const recorder = eventBusRecorder(services.bus);
 * await services.sessionService.ingestStart(payload);
 * expect(recorder.recorded).toHaveLength(1);
 * recorder.stop();
 */
export function eventBusRecorder(bus: EventBus): EventBusRecorder {
  const recorded: FeedEnvelope[] = [];
  const subscription = bus.subscribe('feed', (envelope) => {
    recorded.push(envelope);
  });
  return {
    get recorded() {
      return recorded as readonly FeedEnvelope[];
    },
    stop: () => subscription.unsubscribe(),
  };
}
