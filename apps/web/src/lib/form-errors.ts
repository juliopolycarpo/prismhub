export function requiredText(value: string, message: string): string | undefined {
  return value.trim().length === 0 ? message : undefined;
}

export function firstFormError(error: unknown): string | null {
  if (!error) return null;
  if (typeof error === 'string') return error;
  if (Array.isArray(error)) return firstFormError(error[0]);
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'form' in error) return firstFormError(error.form);
  return null;
}
