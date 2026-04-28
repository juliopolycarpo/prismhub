import { SKIP_DIR_SEGMENTS } from './node-api-policy.ts';

const GENERATED_FILE_RE = /\.generated\.tsx?$/;
const NODE_SPECIFIER_MARKER = 'node:';

/** Returns whether a repo file should be scanned by the Node API policy guard. */
export function shouldScanRepoFile(relPath: string): boolean {
  if (GENERATED_FILE_RE.test(relPath)) {
    return false;
  }

  return !relPath.split('/').some((segment) => SKIP_DIR_SEGMENTS.has(segment));
}

/** Fast pre-check to skip regex parsing when the file cannot match the policy. */
export function hasNodeSpecifierHint(source: string): boolean {
  return source.includes(NODE_SPECIFIER_MARKER);
}

/** Memoizes a single async computation, including the first in-flight promise. */
export function createAsyncOnce<T>(loader: () => Promise<T>): () => Promise<T> {
  let cached: Promise<T> | undefined;

  return () => {
    cached ??= loader();
    return cached;
  };
}
