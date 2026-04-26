import type { EventBus, EventTopic, EventTopicMap, Subscriber, Subscription } from './bus.types.ts';
import { DEFAULT_EVENT_BUFFER_SIZE } from '@prismhub/config';

export interface EventBusOptions {
  readonly replayBufferSize?: number;
}

interface TopicState<T> {
  readonly subscribers: Set<Subscriber<T>>;
  readonly buffer: T[];
}

export function createEventBus(options: EventBusOptions = {}): EventBus {
  const bufferSize = options.replayBufferSize ?? DEFAULT_EVENT_BUFFER_SIZE;
  const topics = new Map<EventTopic, TopicState<EventTopicMap[EventTopic]>>();

  function getOrCreate<T extends EventTopic>(topic: T): TopicState<EventTopicMap[T]> {
    let state = topics.get(topic);
    if (!state) {
      state = { subscribers: new Set(), buffer: [] };
      topics.set(topic, state);
    }
    return state;
  }

  return {
    publish(topic, event) {
      const state = getOrCreate(topic);
      if (state.buffer.length >= bufferSize) {
        state.buffer.shift();
      }
      state.buffer.push(event);
      for (const subscriber of state.subscribers) {
        try {
          subscriber(event);
        } catch {
          // Subscribers must handle their own errors; a bad subscriber never breaks the bus.
        }
      }
    },
    subscribe(topic, subscriber): Subscription {
      const state = getOrCreate(topic);
      state.subscribers.add(subscriber);
      return {
        unsubscribe: () => {
          state.subscribers.delete(subscriber);
        },
      };
    },
    replay(topic) {
      const state = topics.get(topic);
      if (!state) return [];
      return [...state.buffer] as readonly EventTopicMap[typeof topic][];
    },
  };
}
