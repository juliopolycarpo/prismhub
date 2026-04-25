import { getSessionByIdOrThrow, listSessionEvents, listSessions } from '@prismhub/db';
import type { AppApiDeps } from '../index.ts';
import { Elysia, t } from 'elysia';

const SESSIONS_DEFAULT_LIMIT = 100;
const SESSIONS_MAX_LIMIT = 500;
const EVENTS_DEFAULT_LIMIT = 500;
const EVENTS_MAX_LIMIT = 2000;

const PaginationSchema = t.Object({
  limit: t.Optional(
    t.Numeric({ minimum: 1, maximum: SESSIONS_MAX_LIMIT, default: SESSIONS_DEFAULT_LIMIT }),
  ),
  offset: t.Optional(t.Numeric({ minimum: 0, default: 0 })),
});

const EventsQuerySchema = t.Object({
  limit: t.Optional(
    t.Numeric({ minimum: 1, maximum: EVENTS_MAX_LIMIT, default: EVENTS_DEFAULT_LIMIT }),
  ),
});

export function createSessionRoutes(deps: Pick<AppApiDeps, 'db'>) {
  return new Elysia({ prefix: '/sessions' })
    .get(
      '/',
      async ({ query }) => {
        const limit = query.limit ?? SESSIONS_DEFAULT_LIMIT;
        const offset = query.offset ?? 0;
        const rows = await listSessions(deps.db, limit, offset);
        return rows.map((r) => ({
          id: r.id,
          source: r.source,
          agent: r.agent,
          title: r.title,
          status: r.status,
          startedAt: r.startedAt,
          endedAt: r.endedAt,
          messageCount: r.messageCount,
          toolCallCount: r.toolCallCount,
        }));
      },
      { query: PaginationSchema },
    )
    .get('/:id', async ({ params }) => getSessionByIdOrThrow(deps.db, params.id))
    .get(
      '/:id/events',
      async ({ params, query }) => {
        const limit = query.limit ?? EVENTS_DEFAULT_LIMIT;
        return listSessionEvents(deps.db, params.id, limit);
      },
      { query: EventsQuerySchema },
    );
}
