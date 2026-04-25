import type {
  SessionEndPayload,
  SessionEventPayload,
  SessionStartPayload,
} from '@prismhub/contracts';

export interface SessionService {
  readonly ingestStart: (payload: SessionStartPayload) => Promise<void>;
  readonly ingestEvent: (payload: SessionEventPayload) => Promise<void>;
  readonly ingestEnd: (payload: SessionEndPayload) => Promise<void>;
}
