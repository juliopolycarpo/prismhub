/**
 * Generates a stable, filesystem-safe run identifier from a Date.
 *
 * Format: `YYYY-MM-DDTHH-MM-SS` (ISO 8601 with `:` and `.` replaced by `-`,
 * trailing `Z` and milliseconds dropped). Suitable as a directory name.
 */
export function getRunId(now: Date = new Date()): string {
  return now
    .toISOString()
    .replace(/\.\d+Z$/, '')
    .replace(/:/g, '-');
}
