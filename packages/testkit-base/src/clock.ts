/**
 * Returns a clock function that always returns `epochMs`.
 * Pass as `options.now` to `createTestServices()` or `composeServices()` to freeze time.
 *
 * @example
 * const services = await createTestServices({ now: frozenClock(1_700_000_000_000) });
 */
export function frozenClock(epochMs: number): () => number {
  return () => epochMs;
}
