import type { FeedEnvelope } from '@prismhub/contracts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { feedEntriesQueryOptions } from '../lib/app-queries.ts';
import { FEED_URL } from '../lib/api.ts';
import { queryKeys } from '../lib/query-keys.ts';

export type FeedStatus = 'connecting' | 'open' | 'offline' | 'invalid-event';

export interface FeedState {
  readonly status: FeedStatus;
  readonly entries: readonly FeedEnvelope[];
}

const MAX_ENTRIES = 200;

export function useFeed(): FeedState {
  const entries = useQuery(feedEntriesQueryOptions());
  const status = useFeedStream();
  return { status, entries: entries.data };
}

function useFeedStream(): FeedStatus {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<FeedStatus>('connecting');

  useEffect(() => {
    const source = new EventSource(FEED_URL, { withCredentials: true });
    const onOpen = () => setStatus('open');
    const onError = () => setStatus('offline');
    const onMessage = (raw: MessageEvent<string>) => {
      const envelope = parseFeedEnvelope(raw.data);
      if (!envelope) {
        setStatus('invalid-event');
        return;
      }
      setStatus('open');
      queryClient.setQueryData(queryKeys.feed(), (prev: readonly FeedEnvelope[] | undefined) =>
        trim([...(prev ?? []), envelope]),
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.summary() });
      if (envelope.event.kind !== 'session_event') {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sessions() });
      }
    };
    source.addEventListener('open', onOpen);
    source.addEventListener('error', onError);
    source.addEventListener('message', onMessage);
    return () => {
      source.removeEventListener('open', onOpen);
      source.removeEventListener('error', onError);
      source.removeEventListener('message', onMessage);
      source.close();
    };
  }, [queryClient]);

  return status;
}

export function parseFeedEnvelope(raw: string): FeedEnvelope | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return isFeedEnvelope(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isFeedEnvelope(value: unknown): value is FeedEnvelope {
  if (!value || typeof value !== 'object') return false;
  return hasStringProperty(value, 'id') && hasObjectProperty(value, 'event');
}

function hasStringProperty(value: object, key: string): boolean {
  const record = value as Record<string, unknown>;
  return typeof record[key] === 'string';
}

function hasObjectProperty(value: object, key: string): boolean {
  const record = value as Record<string, unknown>;
  return Boolean(record[key] && typeof record[key] === 'object');
}

function trim(list: readonly FeedEnvelope[]): readonly FeedEnvelope[] {
  return list.length > MAX_ENTRIES ? list.slice(-MAX_ENTRIES) : list;
}
