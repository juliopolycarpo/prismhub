const SSR_FALLBACK = 'http://127.0.0.1:3030';

export const origin = typeof window === 'undefined' ? SSR_FALLBACK : window.location.origin;
