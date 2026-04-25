import type { Updateable } from 'kysely';
import type { PrismDatabase } from '../client.ts';
import type { SettingsTable } from '../schema.types.ts';
import { boolToInt, intToBool } from '../sqlite-bool.ts';

export interface SettingsRow {
  readonly themeMode: string;
  readonly accentColor: string;
  readonly density: string;
  readonly showMetadata: boolean;
  readonly allowUserRegistration: boolean;
  readonly updatedAt: string;
}

export async function readSettings(db: PrismDatabase): Promise<SettingsRow> {
  const row = await db
    .selectFrom('settings')
    .selectAll()
    .where('id', '=', 1)
    .executeTakeFirstOrThrow();
  return {
    themeMode: row.theme_mode,
    accentColor: row.accent_color,
    density: row.density,
    showMetadata: intToBool(row.show_metadata),
    allowUserRegistration: intToBool(row.allow_user_registration),
    updatedAt: row.updated_at,
  };
}

export interface UpdateSettingsPatch {
  readonly themeMode?: string;
  readonly accentColor?: string;
  readonly density?: string;
  readonly showMetadata?: boolean;
  readonly allowUserRegistration?: boolean;
}

export async function updateSettings(
  db: PrismDatabase,
  patch: UpdateSettingsPatch,
): Promise<SettingsRow> {
  const update: Updateable<SettingsTable> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.themeMode !== undefined) update.theme_mode = patch.themeMode;
  if (patch.accentColor !== undefined) update.accent_color = patch.accentColor;
  if (patch.density !== undefined) update.density = patch.density;
  if (patch.showMetadata !== undefined) update.show_metadata = boolToInt(patch.showMetadata);
  if (patch.allowUserRegistration !== undefined) {
    update.allow_user_registration = boolToInt(patch.allowUserRegistration);
  }

  await db.updateTable('settings').set(update).where('id', '=', 1).execute();
  return readSettings(db);
}
