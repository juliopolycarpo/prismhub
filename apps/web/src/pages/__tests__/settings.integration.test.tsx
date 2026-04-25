import '../../../test-setup.ts';
import { cleanup, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'bun:test';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { handlers } from '../../lib/msw-handlers.ts';
import { renderWithQueryClient } from '../../test-utils.tsx';
import { SettingsPage } from '../settings.tsx';

const mswServer = setupServer(...handlers);
beforeAll(() => mswServer.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  mswServer.resetHandlers();
  cleanup();
});
afterAll(() => mswServer.close());

describe('SettingsPage', () => {
  test('shows loading state on first render', () => {
    renderWithQueryClient(<SettingsPage />);
    expect(within(document.body).getByText('Carregando…'));
  });

  test('transitions from loading to settings form after data loads', async () => {
    renderWithQueryClient(<SettingsPage />);
    await waitFor(() => within(document.body).getByText('Configurações'), { timeout: 5000 });
    expect(within(document.body).getByText('Aparência'));
    expect(within(document.body).getByText('Interface'));
  });

  test('clicking a theme button sends PATCH with selected themeMode', async () => {
    const patches: unknown[] = [];
    mswServer.use(
      http.patch('*/api/app/settings', async ({ request }) => {
        const body = await request.clone().json();
        patches.push(body);
        return HttpResponse.json({
          themeMode: (body as Record<string, unknown>).themeMode ?? 'system',
          accentColor: '#6366f1',
          density: 'comfortable',
          showMetadata: false,
        });
      }),
    );

    const user = userEvent.setup();
    renderWithQueryClient(<SettingsPage />);
    await waitFor(() => within(document.body).getByText('Claro'));

    await user.click(within(document.body).getByText('Claro'));

    await waitFor(() => patches.length > 0);
    expect(patches[0]).toMatchObject({ themeMode: 'light' });
  });

  test('Toggle for showMetadata sends PATCH with toggled value', async () => {
    const patches: unknown[] = [];
    mswServer.use(
      http.patch('*/api/app/settings', async ({ request }) => {
        const body = await request.clone().json();
        patches.push(body);
        return HttpResponse.json({
          themeMode: 'system',
          accentColor: '#6366f1',
          density: 'comfortable',
          showMetadata: true,
        });
      }),
    );

    const user = userEvent.setup();
    renderWithQueryClient(<SettingsPage />);
    await waitFor(() => within(document.body).getByText('Interface'));

    // The showMetadata toggle is the first button with aria-pressed="false".
    // (theme/density pickers use plain buttons without aria-pressed)
    const toggles = within(document.body).getAllByRole('button', { pressed: false });
    await user.click(toggles[0]!);

    await waitFor(() => patches.length > 0);
    expect(patches[0]).toMatchObject({ showMetadata: true });
  });
});
