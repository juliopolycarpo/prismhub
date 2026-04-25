import type { FeedEnvelope } from '@prismhub/contracts';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { FeedItem } from './live-feed-item.tsx';

const ESTIMATED_EVENT_HEIGHT = 120;
const FEED_OVERSCAN = 6;

export function LiveFeedVirtualList({ entries }: { readonly entries: readonly FeedEnvelope[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ESTIMATED_EVENT_HEIGHT,
    getItemKey: (index) => entries[index]?.id ?? index,
    overscan: FEED_OVERSCAN,
  });

  if (entries.length === 0) return <EmptyFeed />;

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8">
      <div className="relative" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((item) => (
          <VirtualFeedRow
            key={item.key}
            envelope={entries[item.index]}
            index={item.index}
            start={item.start}
            measureElement={virtualizer.measureElement}
          />
        ))}
      </div>
      <NowDivider />
    </div>
  );
}

function VirtualFeedRow({
  envelope,
  index,
  start,
  measureElement,
}: {
  readonly envelope: FeedEnvelope | undefined;
  readonly index: number;
  readonly start: number;
  readonly measureElement: (node: Element | null) => void;
}) {
  if (!envelope) return null;
  return (
    <div
      ref={measureElement}
      data-index={index}
      className="absolute left-0 top-0 w-full pb-6"
      style={{ transform: `translateY(${start}px)` }}
    >
      <FeedItem envelope={envelope} />
    </div>
  );
}

function EmptyFeed() {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 flex items-center justify-center">
      <p className="text-sm text-stone-500">
        Sem eventos ainda. Envie um hook para{' '}
        <code className="text-stone-400">/api/v1/hooks/session-start</code>.
      </p>
    </div>
  );
}

function NowDivider() {
  return (
    <div className="relative pt-4">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-stone-800" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-stone-900 px-2 text-stone-600">agora</span>
      </div>
    </div>
  );
}
