import { createContext } from 'react';

export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly name?: string;
  readonly role: string;
}

export interface AuthContextValue {
  readonly user: AuthUser | null;
  readonly isLoading: boolean;
  readonly isAuthenticated: boolean;
  signOut(): Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
