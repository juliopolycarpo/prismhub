import type {
  SessionEndPayload,
  SessionEventPayload,
  SessionStartPayload,
} from '@prismhub/contracts';
import {
  closeSession,
  incrementSessionCounter,
  insertSession,
  insertSessionEvent,
  type PrismDatabase,
} from '@prismhub/db';
import type { EventBus } from '../events/bus.types.ts';
import { ulid } from '../ids/ulid.ts';
import type { SessionService } from './session-service.types.ts';

export interface SessionServiceDeps {
  readonly db: PrismDatabase;
  readonly bus: EventBus;
  readonly now?: () => Date;
}

function nowIso(now: () => Date): string {
  return now().toISOString();
}

export function createSessionService(deps: SessionServiceDeps): SessionService {
  const now = deps.now ?? (() => new Date());

  return {
    async ingestStart(payload: SessionStartPayload) {
      await insertSession(deps.db, {
        id: payload.sessionId,
        source: payload.source,
        agent: payload.agent,
        title: payload.title ?? null,
        workingDir: payload.workingDir ?? null,
        startedAt: payload.startedAt,
        metadata: payload.metadata ?? null,
      });
      deps.bus.publish('feed', {
        id: ulid(),
        event: { kind: 'session_started', at: nowIso(now), session: payload },
      });
    },

    async ingestEvent(payload: SessionEventPayload) {
      await insertSessionEvent(deps.db, {
        id: ulid(),
        sessionId: payload.sessionId,
        kind: payload.kind,
        payload,
        at: payload.at,
      });
      if (payload.kind === 'message') {
        await incrementSessionCounter(deps.db, payload.sessionId, 'message_count');
      } else if (payload.kind === 'tool_call') {
        await incrementSessionCounter(deps.db, payload.sessionId, 'tool_call_count');
      }
      deps.bus.publish('feed', {
        id: ulid(),
        event: { kind: 'session_event', at: nowIso(now), event: payload },
      });
    },

    async ingestEnd(payload: SessionEndPayload) {
      await closeSession(deps.db, {
        id: payload.sessionId,
        endedAt: payload.endedAt,
        status: payload.reason ?? 'completed',
      });
      deps.bus.publish('feed', {
        id: ulid(),
        event: { kind: 'session_ended', at: nowIso(now), summary: payload },
      });
    },
  };
}
