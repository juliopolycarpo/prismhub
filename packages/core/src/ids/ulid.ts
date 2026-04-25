const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const TIME_LEN = 10;
const RAND_LEN = 16;

function encodeTime(now: number): string {
  let value = now;
  let out = '';
  for (let i = TIME_LEN - 1; i >= 0; i--) {
    const mod = value % 32;
    out = (ALPHABET[mod] ?? '0') + out;
    value = Math.floor(value / 32);
  }
  return out;
}

function encodeRandom(): string {
  const bytes = new Uint8Array(RAND_LEN);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < RAND_LEN; i++) {
    out += ALPHABET[(bytes[i] ?? 0) % 32];
  }
  return out;
}

export function ulid(now: number = Date.now()): string {
  return encodeTime(now) + encodeRandom();
}

const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/;

export function isUlid(value: string): boolean {
  return ULID_RE.test(value);
}
