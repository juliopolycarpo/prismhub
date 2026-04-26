/** Extracts a message string from any thrown value; uses `fallback` when the result is empty. */
export function getErrorMessage(error: unknown, fallback = 'Unknown error'): string {
  if (error instanceof Error) return error.message;
  const str = String(error);
  return str || fallback;
}
