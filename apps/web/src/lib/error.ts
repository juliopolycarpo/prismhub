export { getErrorMessage } from '@prismhub/observability';

export function hasErrorCode(error: unknown, code: string): boolean {
  if (!error || typeof error !== 'object') return false;
  return 'code' in error && error.code === code;
}
