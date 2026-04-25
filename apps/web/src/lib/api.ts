import type { AppApi } from '@prismhub/app-api';
import { treaty } from '@elysiajs/eden';
import { origin } from './origin.ts';

// `credentials: 'include'` ensures the better-auth session cookie travels on
// every Treaty request — without it, /api/app/* would always 401 in the browser.
export const api = treaty<AppApi>(origin, {
  fetch: { credentials: 'include' },
});

export const FEED_URL = `${origin}/api/app/feed`;
