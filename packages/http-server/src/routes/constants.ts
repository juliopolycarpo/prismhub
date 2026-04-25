export const HTTP_STATUS = {
  NOT_FOUND: 404,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const ONE_YEAR_SECONDS = 31_536_000;

export const IMMUTABLE_CACHE_CONTROL = `public, max-age=${ONE_YEAR_SECONDS}, immutable`;
export const NO_CACHE_CONTROL = 'no-cache';
