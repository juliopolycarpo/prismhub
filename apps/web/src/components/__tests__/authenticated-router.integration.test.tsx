import '../../../test-setup.ts';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import { cleanup, waitFor, within } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, mock, test } from 'bun:test';
import { setupServer } from 'msw/node';
import { handlers } from '../../lib/msw-handlers.ts';
import { createAppQueryClient } from '../../lib/query-client.ts';

type SessionResult = Promise<{
  data: { user: { id: string; email: string; role?: string; name?: string } } | null;
  error: null;
}>;

interface SessionHookResult {
  readonly data: { readonly user: ReturnType<typeof sessionUser> } | null;
  readonly isPending: boolean;
}

const getSessionMock = mock<() => SessionResult>(async () => ({ data: null, error: null }));
const useSessionMock = mock<() => SessionHookResult>(() => ({ data: null, isPending: false }));

await mock.module('../../lib/auth-client.ts', () => ({
  authClient: {
    getSession: getSessionMock,
    signOut: async () => undefined,
    useSession: useSessionMock,
  },
}));

const { createAppRouter } = await import('../../router.tsx');
const { AuthProvider } = await import('../../lib/auth-context.tsx');
const { render } = await import('@testing-library/react');

const mswServer = setupServer(...handlers);

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'warn' }));
beforeEach(() => {
  getSessionMock.mockReset();
  useSessionMock.mockReset();
});
afterEach(() => {
  cleanup();
  mswServer.resetHandlers();
});
afterAll(() => mswServer.close());

function renderAppAt(path: string) {
  const queryClient = createAppQueryClient();
  const router = createAppRouter({
    queryClient,
    history: createMemoryHistory({ initialEntries: [path] }),
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('authenticated app routes', () => {
  test('renders protected route content when session is present', async () => {
    getSessionMock.mockImplementation(async () => ({ data: { user: sessionUser() }, error: null }));
    useSessionMock.mockReturnValue({ data: { user: sessionUser() }, isPending: false });

    renderAppAt('/dashboard/history');

    await waitFor(() => within(document.body).getByRole('heading', { name: 'Histórico' }));
  });

  test('redirects to /login when no session exists', async () => {
    getSessionMock.mockImplementation(async () => ({ data: null, error: null }));
    useSessionMock.mockReturnValue({ data: null, isPending: false });

    renderAppAt('/dashboard/history');

    await waitFor(() => within(document.body).getByText('entre na sua instância'));
  });
});

function sessionUser() {
  return { id: 'u1', email: 'admin@prismhub.test', role: 'admin', name: 'Admin' };
}
