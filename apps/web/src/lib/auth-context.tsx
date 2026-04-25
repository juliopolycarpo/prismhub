import { useCallback, useMemo, type ReactNode } from 'react';
import { authClient } from './auth-client.ts';
import { AuthContext, type AuthContextValue, type AuthUser } from './auth-context-ref.ts';

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const session = authClient.useSession();
  const sessionData = session.data;
  const isLoading = session.isPending ?? false;

  const user = useMemo<AuthUser | null>(() => {
    if (!sessionData?.user) return null;
    return {
      id: sessionData.user.id,
      email: sessionData.user.email,
      name: sessionData.user.name ?? undefined,
      role: (sessionData.user as { role?: string }).role ?? 'user',
    };
  }, [sessionData?.user]);

  const signOut = useCallback(async () => {
    await authClient.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, isAuthenticated: user !== null, signOut }),
    [user, isLoading, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
