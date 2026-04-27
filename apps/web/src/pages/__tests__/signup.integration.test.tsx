import '../../../test-setup.ts';
import { cleanup, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { handlers } from '../../lib/msw-handlers.ts';
import { renderWithQueryClient } from '../../test-utils.tsx';

const signUpMock = mock<
  () => Promise<{ error?: { message?: string; status?: number; code?: string } }>
>(async () => ({}));

await mock.module('../../lib/auth-client.ts', () => ({
  authClient: {
    getSession: async () => ({ data: null, error: null }),
    signUp: { email: signUpMock },
    signOut: async () => undefined,
    useSession: () => ({ data: null, isPending: false }),
  },
}));

const { SignupPage } = await import('../signup.tsx');
const { AuthProvider } = await import('../../lib/auth/auth-context.tsx');

const mswServer = setupServer(...handlers);

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'bypass' }));
afterAll(() => mswServer.close());

beforeEach(() => {
  signUpMock.mockImplementation(async () => ({}));
});

afterEach(() => {
  cleanup();
  mswServer.resetHandlers();
});

function renderSignup() {
  const rootRoute = createRootRoute({ component: TestOutlet });
  const signupRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: 'signup',
    component: SignupPage,
  });
  const liveRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: 'live',
    component: () => <div>Live page</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([signupRoute, liveRoute]),
    history: createMemoryHistory({ initialEntries: ['/signup'] }),
  });
  return renderWithQueryClient(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  );
}

function TestOutlet() {
  return <Outlet />;
}

describe('SignupPage', () => {
  test('renders the three form fields when registration open', async () => {
    renderSignup();
    await waitFor(() => within(document.body).getByLabelText('Nome'));
    expect(within(document.body).getByLabelText('E-mail'));
    expect(within(document.body).getByLabelText('Senha'));
  });

  test('shows "first user" subtitle when no users exist yet', async () => {
    mswServer.use(
      http.get('*/api/v1/registration-status', () =>
        HttpResponse.json({ firstUser: true, registrationOpen: true }),
      ),
    );
    renderSignup();
    await waitFor(() => within(document.body).getByText(/primeiro usuário vira administrador/));
  });

  test('shows disabled state when registration closed', async () => {
    mswServer.use(
      http.get('*/api/v1/registration-status', () =>
        HttpResponse.json({ firstUser: false, registrationOpen: false }),
      ),
    );
    renderSignup();
    await waitFor(() => within(document.body).getByText(/cadastro público está desativado/));
    expect(within(document.body).queryByLabelText('Nome')).toBeNull();
  });

  test('navigates to /live after successful signup', async () => {
    const user = userEvent.setup();
    renderSignup();

    await waitFor(() => within(document.body).getByLabelText('Nome'));
    await user.type(within(document.body).getByLabelText('Nome'), 'Admin');
    await user.type(within(document.body).getByLabelText('E-mail'), 'admin@prismhub.test');
    await user.type(within(document.body).getByLabelText('Senha'), 'admin-test-password');
    await user.click(within(document.body).getByRole('button', { name: /Criar/ }));

    await waitFor(() => within(document.body).getByText('Live page'));
  });

  test('renders registration-disabled message on 403', async () => {
    signUpMock.mockImplementation(async () => ({
      error: { code: 'REGISTRATION_DISABLED', status: 403, message: 'Registration disabled' },
    }));

    const user = userEvent.setup();
    renderSignup();

    await waitFor(() => within(document.body).getByLabelText('Nome'));
    await user.type(within(document.body).getByLabelText('Nome'), 'Bob');
    await user.type(within(document.body).getByLabelText('E-mail'), 'bob@prismhub.test');
    await user.type(within(document.body).getByLabelText('Senha'), 'bob-pass');
    await user.click(within(document.body).getByRole('button', { name: /Criar/ }));

    await waitFor(() => within(document.body).getByRole('alert'));
    expect(within(document.body).getByRole('alert').textContent).toContain(
      'cadastro público está desativado',
    );
  });
});
