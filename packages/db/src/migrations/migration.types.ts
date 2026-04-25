import type { PrismDatabase } from '../client.ts';

export interface Migration {
  readonly name: string;
  readonly up: (db: PrismDatabase) => Promise<void>;
  readonly down: (db: PrismDatabase) => Promise<void>;
}
