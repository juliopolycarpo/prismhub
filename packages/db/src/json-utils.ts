/**
 * JSON column decoders. Rows may contain malformed JSON written by older
 * schema versions or corrupted migrations — returning `null` here lets
 * callers surface a safe default instead of failing the whole read.
 */

function tryParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch (_ignoredMalformedJson) {
    return null;
  }
}

export function parseJsonUnknown(raw: string | null): unknown {
  if (raw === null) return null;
  return tryParse(raw);
}

export function parseJsonObject(raw: string | null): Record<string, unknown> | null {
  if (raw === null) return null;
  const parsed = tryParse(raw);
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  return parsed as Record<string, unknown>;
}

export function parseJsonStringArray(raw: string | null): readonly string[] | null {
  if (raw === null) return null;
  const parsed = tryParse(raw);
  if (!Array.isArray(parsed)) return null;
  return parsed.every((item): item is string => typeof item === 'string') ? parsed : null;
}

export function parseJsonStringRecord(raw: string | null): Readonly<Record<string, string>> | null {
  const parsed = parseJsonObject(raw);
  if (parsed === null) return null;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === 'string') out[key] = value;
  }
  return out;
}
