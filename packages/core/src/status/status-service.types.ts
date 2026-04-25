export interface StatusSnapshot {
  readonly version: string;
  readonly uptimeSec: number;
  readonly dbReady: boolean;
  readonly upstreamsCount: number;
}

export interface StatusService {
  readonly snapshot: () => Promise<StatusSnapshot>;
}
