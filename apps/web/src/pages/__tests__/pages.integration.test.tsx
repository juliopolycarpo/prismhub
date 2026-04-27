import '../../../test-setup.ts';
import { cleanup, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'bun:test';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { handlers } from '../../test-utils/msw-handlers.ts';
import { createAppQueryClient } from '../../lib/query-client.ts';
import { queryKeys } from '../../lib/query-keys.ts';
import { renderWithQueryClient } from '../../test-utils.tsx';
import { CachePage } from '../cache.tsx';
import { McpsPage } from '../mcps.tsx';

const mswServer = setupServer(...handlers);
const PAGE_INTEGRATION_TIMEOUT_MS = 10_000;

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  mswServer.resetHandlers();
  cleanup();
});
afterAll(() => mswServer.close());

describe('CachePage', () => {
  test('shows loading state then renders Cache heading', async () => {
    renderWithQueryClient(<CachePage />);
    await waitFor(() => within(document.body).getByText('Cache'));
  });

  test(
    'renders stats grid with placeholder zeros after data loads',
    async () => {
      const queryClient = createAppQueryClient();
      queryClient.setQueryData(queryKeys.cacheStats(), emptyCacheStats());
      renderWithQueryClient(<CachePage />, queryClient);

      expect(within(document.body).getAllByText('0.0k').length).toBeGreaterThan(0);
    },
    PAGE_INTEGRATION_TIMEOUT_MS,
  );

  test('shows empty entries table when API returns empty list', async () => {
    renderWithQueryClient(<CachePage />);
    await waitFor(() => within(document.body).getByText('Cache'));
    expect(within(document.body).queryByRole('row')).toBeNull();
  });

  test('shows error state when stats API fails', async () => {
    mswServer.use(http.get('*/api/app/cache/stats', () => HttpResponse.error()));
    renderWithQueryClient(<CachePage />);
    await waitFor(() => within(document.body).getByText('Cache'));
    expect(within(document.body).queryByText(/tokens salvos/i)).toBeNull();
  });
});

function emptyCacheStats() {
  return {
    tokensSavedToday: 0,
    economyToday: 0,
    economyMonth: 0,
    hitRate: 0,
    entriesTotal: 0,
    entriesFresh: 0,
    entriesIdle: 0,
  };
}

describe('McpsPage', () => {
  test('shows empty state message when no servers registered', async () => {
    renderWithQueryClient(<McpsPage />);
    await waitFor(() => within(document.body).getByText('MCPs conectados'));
    expect(within(document.body).getByText(/nenhum servidor mcp registrado/i));
  });

  test('"Adicionar Servidor MCP" button visible', async () => {
    renderWithQueryClient(<McpsPage />);
    await waitFor(() =>
      within(document.body).getByRole('button', { name: /adicionar servidor mcp/i }),
    );
  });

  test('renders server cards when API returns entries', async () => {
    mswServer.use(
      http.get('*/api/app/mcp-servers', () =>
        HttpResponse.json([
          {
            id: 'srv-1',
            name: 'filesystem',
            description: null,
            enabled: true,
            transport: 'stdio',
            command: '/bin/fs',
            args: null,
            url: null,
            headers: null,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ]),
      ),
      http.get('*/api/app/mcp-servers/:id/tools', () =>
        HttpResponse.json({
          serverId: 'srv-1',
          tools: [{ name: 'read_file', description: 'reads a file' }],
        }),
      ),
    );
    renderWithQueryClient(<McpsPage />);
    await waitFor(() => within(document.body).getByText('filesystem'));
    await waitFor(() => within(document.body).getByText('read_file'));
    expect(within(document.body).queryByText(/nenhum servidor mcp registrado/i)).toBeNull();
  });

  test('opens AddMcpServerModal with stdio fields by default', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<McpsPage />);
    const openBtn = await waitFor(() =>
      within(document.body).getByRole('button', { name: /adicionar servidor mcp/i }),
    );
    await user.click(openBtn);
    await waitFor(() =>
      within(document.body).getByRole('heading', { name: 'Adicionar Servidor MCP' }),
    );
    expect(within(document.body).getByPlaceholderText('/usr/local/bin/mcp-server'));
    expect(within(document.body).getByLabelText('Argumento 1'));
  });

  test('switching to HTTP reveals URL and headers fields', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<McpsPage />);
    const openBtn = await waitFor(() =>
      within(document.body).getByRole('button', { name: /adicionar servidor mcp/i }),
    );
    await user.click(openBtn);
    const httpRadio = await waitFor(() => within(document.body).getByText('HTTP (URL remota)'));
    await user.click(httpRadio);
    await waitFor(() => within(document.body).getByPlaceholderText('https://mcp.example.com/sse'));
    expect(within(document.body).getByLabelText('Nome do header 1'));
    expect(within(document.body).getByLabelText('Valor do header 1'));
  });

  test('submits a stdio MCP server registration', async () => {
    const requests: unknown[] = [];
    mswServer.use(
      http.post('*/api/app/mcp-servers', async ({ request }) => {
        const body = await request.json();
        requests.push(body);
        return HttpResponse.json({
          id: 'srv-new',
          name: (body as Record<string, unknown>).name,
          description: null,
          enabled: true,
          transport: 'stdio',
          command: (body as Record<string, unknown>).command,
          args: (body as Record<string, unknown>).args,
          url: null,
          headers: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        });
      }),
    );
    const user = userEvent.setup();

    renderWithQueryClient(<McpsPage />);
    const openBtn = await waitFor(() =>
      within(document.body).getByRole('button', { name: /adicionar servidor mcp/i }),
    );
    await user.click(openBtn);
    await user.type(within(document.body).getByLabelText('Nome'), 'filesystem');
    await user.type(
      within(document.body).getByPlaceholderText('/usr/local/bin/mcp-server'),
      '/bin/fs',
    );
    await user.click(within(document.body).getByRole('button', { name: 'Registrar' }));

    await waitFor(() => expect(requests).toHaveLength(1));
    expect(requests[0]).toMatchObject({ name: 'filesystem', command: '/bin/fs' });
  });

  test('shows validation error when MCP registration is submitted empty', async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<McpsPage />);
    const openBtn = await waitFor(() =>
      within(document.body).getByRole('button', { name: /adicionar servidor mcp/i }),
    );
    await user.click(openBtn);
    await user.click(within(document.body).getByRole('button', { name: 'Registrar' }));

    await waitFor(() => within(document.body).getByRole('alert'));
    expect(within(document.body).getByRole('alert').textContent).toContain('nome');
  });

  test('opens settings modal from card and renders typed tool parameters', async () => {
    mswServer.use(
      http.get('*/api/app/mcp-servers', () =>
        HttpResponse.json([
          {
            id: 'srv-1',
            name: 'perplexity',
            description: null,
            enabled: true,
            transport: 'stdio',
            command: '/bin/perplexity',
            args: null,
            url: null,
            headers: null,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ]),
      ),
      http.get('*/api/app/mcp-servers/:id/tools', () =>
        HttpResponse.json({
          serverId: 'srv-1',
          tools: [
            {
              name: 'perplexity_reason',
              description: 'Reason over the web',
              inputSchema: {
                type: 'object',
                properties: {
                  strip_thinking: { type: 'boolean', description: 'Hide chain-of-thought' },
                  max_tokens: { type: 'integer', minimum: 1 },
                  query: { type: 'string' },
                },
                required: ['query'],
              },
            },
          ],
        }),
      ),
    );
    const user = userEvent.setup();
    renderWithQueryClient(<McpsPage />);
    const gear = await waitFor(() =>
      within(document.body).getByRole('button', { name: /configurar perplexity/i }),
    );
    await user.click(gear);
    await waitFor(() =>
      within(document.body).getByRole('heading', { name: /configurar perplexity/i }),
    );
    await waitFor(() => within(document.body).getByLabelText('strip_thinking'));
    const numField = within(document.body).getByLabelText('max_tokens');
    expect(numField.getAttribute('type')).toBe('number');
    const strField = within(document.body).getByLabelText('query');
    expect(strField.getAttribute('type')).toBe('text');
  });
});
