import type { FeedEnvelope } from '@prismhub/contracts';

export type { FeedEnvelope };

export interface EventTopicMap {
  readonly feed: FeedEnvelope;
}

export type EventTopic = keyof EventTopicMap;

export type Subscriber<T> = (event: T) => void;

export interface Subscription {
  readonly unsubscribe: () => void;
}

export interface EventBus {
  readonly publish: <T extends EventTopic>(topic: T, event: EventTopicMap[T]) => void;
  readonly subscribe: <T extends EventTopic>(
    topic: T,
    subscriber: Subscriber<EventTopicMap[T]>,
  ) => Subscription;
  readonly replay: <T extends EventTopic>(topic: T) => readonly EventTopicMap[T][];
}
