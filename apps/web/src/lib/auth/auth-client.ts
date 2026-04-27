import { createAuthClient } from 'better-auth/react';
import { origin } from '../origin.ts';

export const authClient = createAuthClient({ baseURL: origin });
export type AuthClient = typeof authClient;
