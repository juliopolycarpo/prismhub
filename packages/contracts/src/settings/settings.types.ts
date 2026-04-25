import { Type, type Static } from '@sinclair/typebox';

export const ThemeModeSchema = Type.Union([
  Type.Literal('light'),
  Type.Literal('dark'),
  Type.Literal('system'),
]);
export type ThemeMode = Static<typeof ThemeModeSchema>;

export const SettingsRecordSchema = Type.Object({
  themeMode: ThemeModeSchema,
  accentColor: Type.String({ pattern: '^#[0-9A-Fa-f]{6}$' }),
  density: Type.Union([Type.Literal('compact'), Type.Literal('comfortable')]),
  showMetadata: Type.Boolean(),
  allowUserRegistration: Type.Boolean(),
});
export type SettingsRecord = Static<typeof SettingsRecordSchema>;

export const UpdateSettingsInputSchema = Type.Partial(SettingsRecordSchema);
export type UpdateSettingsInput = Static<typeof UpdateSettingsInputSchema>;
