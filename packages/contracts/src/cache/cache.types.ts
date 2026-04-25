export interface CacheEntry {
  readonly id: string;
  readonly path: string;
  readonly size: number;
  readonly hits: number;
  readonly age: string;
  readonly ttl: string;
  readonly tokensSaved: number;
  readonly status: 'fresh' | 'stale' | 'expired';
}
