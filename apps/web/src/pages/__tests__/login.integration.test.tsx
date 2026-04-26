import '../../../test-setup.ts';
import { cleanup, render, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { authenticatedPathOrDefault } from '../../lib/dashboard-paths.ts';

const signInMock = mock<() => Promise<{ error?: { message?: string; status?: number } }>>(
  async () => ({}),
);
const LOGIN_SUBMIT_TIMEOUT_MS = 15_000;

await mock.module('../../lib/auth-client.ts', () => ({
  authClient: {
    getSession: async () => ({ data: null, error: null }),
    signIn: { email: signInMock },
    signOut: async () => undefined,
    useSession: () => ({ data: null, isPending: false }),
  },
}));

const { LoginPage } = await import('../login.tsx');
const { AuthProvider } = await import('../../lib/auth-context.tsx');

beforeEach(() => {
  signInMock.mockImplementation(async () => ({}));
});

afterEach(() => {
  cleanup();
});

function renderLogin() {
  const rootRoute = createRootRoute({ component: TestOutlet });
  const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: 'login',
    validateSearch: (search: Record<string, unknown>) => ({
      redirect: authenticatedPathOrDefault(search.redirect),
    }),
    component: LoginPage,
  });
  const liveRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: 'live',
    component: () => <div>Live page</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([loginRoute, liveRoute]),
    history: createMemoryHistory({ initialEntries: ['/login'] }),
  });
  return render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  );
}

function TestOutlet() {
  return <Outlet />;
}

describe('LoginPage', () => {
  test('renders email and password fields', async () => {
    renderLogin();
    await waitFor(() => within(document.body).getByLabelText('E-mail'));
    expect(within(document.body).getByLabelText('Senha'));
  });

  test(
    'submits credentials and redirects to /live on success',
    async () => {
      const user = userEvent.setup();
      renderLogin();

      await waitFor(() => within(document.body).getByLabelText('E-mail'));
      await user.type(within(document.body).getByLabelText('E-mail'), 'admin@prismhub.test');
      await user.type(within(document.body).getByLabelText('Senha'), 'admin-test-password');
      await user.click(within(document.body).getByRole('button', { name: /Entrar/ }));

      await waitFor(() => within(document.body).getByText('Live page'));
      expect(signInMock).toHaveBeenCalledWith({
        email: 'admin@prismhub.test',
        password: 'admin-test-password',
      });
    },
    LOGIN_SUBMIT_TIMEOUT_MS,
  );

  test('shows error message on invalid credentials', async () => {
    signInMock.mockImplementation(async () => ({
      error: { message: 'Invalid email or password', status: 401 },
    }));

    const user = userEvent.setup();
    renderLogin();

    await waitFor(() => within(document.body).getByLabelText('E-mail'));
    await user.type(within(document.body).getByLabelText('E-mail'), 'wrong@prismhub.test');
    await user.type(within(document.body).getByLabelText('Senha'), 'wrong');
    await user.click(within(document.body).getByRole('button', { name: /Entrar/ }));

    await waitFor(() => within(document.body).getByRole('alert'));
    expect(within(document.body).getByRole('alert').textContent).toContain('Invalid');
  });
});
