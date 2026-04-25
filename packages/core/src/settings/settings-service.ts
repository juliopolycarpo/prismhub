import type { SettingsRecord } from '@prismhub/contracts';
import { type PrismDatabase, readSettings, type SettingsRow, updateSettings } from '@prismhub/db';
import type { SettingsService } from './settings-service.types.ts';

export interface SettingsServiceDeps {
  readonly db: PrismDatabase;
}

const VALID_THEME_MODES = new Set(['light', 'dark', 'system'] as const);
type ThemeMode = 'light' | 'dark' | 'system';

function toThemeMode(raw: string): ThemeMode {
  return VALID_THEME_MODES.has(raw as ThemeMode) ? (raw as ThemeMode) : 'system';
}

function rowToRecord(row: SettingsRow): SettingsRecord {
  return {
    themeMode: toThemeMode(row.themeMode),
    accentColor: row.accentColor,
    density: row.density === 'compact' ? 'compact' : 'comfortable',
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
