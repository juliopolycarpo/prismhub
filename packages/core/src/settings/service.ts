import type { SettingsRecord, UpdateSettingsInput } from '@prismhub/contracts';
import { type PrismDatabase, readSettings, type SettingsRow, updateSettings } from '@prismhub/db';

export interface SettingsService {
  readonly read: () => Promise<SettingsRecord>;
  readonly update: (patch: UpdateSettingsInput) => Promise<SettingsRecord>;
}

export interface SettingsServiceDeps {
  readonly db: PrismDatabase;
}

const VALID_THEME_MODES = new Set(['light', 'dark', 'system'] as const);
type ThemeMode = 'light' | 'dark' | 'system';

function toThemeMode(raw: string): ThemeMode {
  return VALID_THEME_MODES.has(raw as ThemeMode) ? (raw as ThemeMode) : 'system';
}

const VALID_DENSITIES = new Set(['compact', 'comfortable'] as const);
type Density = 'compact' | 'comfortable';

function toDensity(raw: string): Density {
  return VALID_DENSITIES.has(raw as Density) ? (raw as Density) : 'comfortable';
}

function rowToRecord(row: SettingsRow): SettingsRecord {
  return {
    themeMode: toThemeMode(row.themeMode),
    accentColor: row.accentColor,
    density: toDensity(row.density),
    showMetadata: row.showMetadata,
    allowUserRegistration: row.allowUserRegistration,
  };
}

export function createSettingsService(deps: SettingsServiceDeps): SettingsService {
  return {
    async read() {
      const row = await readSettings(deps.db);
      return rowToRecord(row);
    },
    async update(patch) {
      const row = await updateSettings(deps.db, patch);
      return rowToRecord(row);
    },
  };
}
