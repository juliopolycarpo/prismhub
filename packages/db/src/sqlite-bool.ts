/**
 * SQLite stores booleans as `0`/`1` integers. These helpers centralize that
 * convention so repositories don't sprinkle `=== 1` / `? 1 : 0` literals
 * everywhere.
 */

export function intToBool(value: number): boolean {
  return value === 1;
}

export function boolToInt(value: boolean): 0 | 1 {
  return value ? 1 : 0;
}
