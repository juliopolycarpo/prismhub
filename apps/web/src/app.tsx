import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterProvider } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { AuthProvider } from './lib/auth-context.tsx';
import { appQueryClient } from './lib/query-client.ts';
import { router } from './router.tsx';

const SHOW_DEVTOOLS = import.meta.env.DEV;

export function App() {
  return (
    <QueryClientProvider client={appQueryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
      {SHOW_DEVTOOLS && (
        <>
          <ReactQueryDevtools initialIsOpen={false} />
          <TanStackRouterDevtools router={router} />
        </>
      )}
    </QueryClientProvider>
  );
}
