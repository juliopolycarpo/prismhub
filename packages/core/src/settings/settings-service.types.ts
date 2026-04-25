import type { SettingsRecord, UpdateSettingsInput } from '@prismhub/contracts';

export interface SettingsService {
  readonly read: () => Promise<SettingsRecord>;
  readonly update: (patch: UpdateSettingsInput) => Promise<SettingsRecord>;
}
