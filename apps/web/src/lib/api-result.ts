interface ApiResult<T> {
  readonly data?: T | null;
  readonly error?: unknown;
  readonly status: number;
}

export class ApiResponseError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiResponseError';
  }
}

export function requireApiData<T>(response: ApiResult<T>, fallback: string): T {
  if (response.data !== null && response.data !== undefined) return response.data;
  throw new ApiResponseError(apiErrorMessage(response, fallback), response.status);
}

function apiErrorMessage<T>(response: ApiResult<T>, fallback: string): string {
  const message = errorMessage(response.error);
  if (message) return `${fallback}: ${message}`;
  return `${fallback} (HTTP ${response.status})`;
}

function errorMessage(error: unknown): string | null {
  if (error instanceof Error) return error.message;
  if (!error || typeof error !== 'object') return null;
  if (!('message' in error) || typeof error.message !== 'string') return null;
  return error.message;
}
