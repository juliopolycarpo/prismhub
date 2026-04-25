import type { FeedEnvelope } from '@prismhub/core';
import { DEFAULT_SSE_HEARTBEAT_MS } from '@prismhub/config';
import type { AppApiDeps } from '../index.ts';
import { Elysia } from 'elysia';

function encodeEnvelope(envelope: FeedEnvelope): string {
  return `id: ${envelope.id}\ndata: ${JSON.stringify(envelope)}\n\n`;
}

export function createFeedRoutes(
  deps: Pick<AppApiDeps, 'bus'> & { readonly heartbeatMs?: number },
) {
  const heartbeat = deps.heartbeatMs ?? DEFAULT_SSE_HEARTBEAT_MS;

  return new Elysia().get('/feed', () => {
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        let closed = false;
        const safeEnqueue = (chunk: Uint8Array) => {
          if (closed) return;
          try {
            controller.enqueue(chunk);
          } catch {
            closed = true;
          }
        };

        for (const envelope of deps.bus.replay('feed')) {
          safeEnqueue(encoder.encode(encodeEnvelope(envelope)));
        }

        const subscription = deps.bus.subscribe('feed', (envelope) => {
          safeEnqueue(encoder.encode(encodeEnvelope(envelope)));
        });

        const heartbeatTimer = setInterval(() => {
          safeEnqueue(encoder.encode(': heartbeat\n\n'));
        }, heartbeat);

        const cleanup = () => {
          if (closed) return;
          closed = true;
          clearInterval(heartbeatTimer);
          subscription.unsubscribe();
          try {
            controller.close();
          } catch {
            // already closed
          }
        };

        return cleanup;
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  });
}
