import {
  SessionEndPayloadSchema,
  SessionEventPayloadSchema,
  SessionStartPayloadSchema,
} from '@prismhub/contracts';
import type { AppApiDeps } from '../index.ts';
import { Elysia } from 'elysia';

export function createHookRoutes(deps: Pick<AppApiDeps, 'sessionService'>) {
  return new Elysia({ prefix: '/hooks' })
    .post(
      '/session-start',
      async ({ body }) => {
        await deps.sessionService.ingestStart(body);
        return { ok: true };
      },
      { body: SessionStartPayloadSchema },
    )
    .post(
      '/session-event',
      async ({ body }) => {
        await deps.sessionService.ingestEvent(body);
        return { ok: true };
      },
      { body: SessionEventPayloadSchema },
    )
    .post(
      '/session-end',
      async ({ body }) => {
        await deps.sessionService.ingestEnd(body);
        return { ok: true };
      },
      { body: SessionEndPayloadSchema },
    );
}
