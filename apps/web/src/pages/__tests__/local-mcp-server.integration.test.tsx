import '../../../test-setup.ts';
import { cleanup, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'bun:test';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { handlers } from '../../test-utils/msw-handlers.ts';
import { renderWithQueryClient } from '../../test-utils.tsx';
import { LocalMcpServerPage } from '../local-mcp-server.tsx';

const mswServer = setupServer(...handlers);
beforeAll(() => mswServer.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  mswServer.resetHandlers();
  cleanup();
});
afterAll(() => mswServer.close());

describe('LocalMcpServerPage', () => {
  test('renders local endpoint and empty state when no tools', async () => {
    renderWithQueryClient(<LocalMcpServerPage />);

    await waitFor(() => within(document.body).getByText('Servidor MCP Local'));

    expect(within(document.body).getAllByText(/\/mcp$/i).length).toBeGreaterThan(0);
  });

  test('lists enabled upstream tools and lets user expose one', async () => {
    mswServer.use(...localRouterHandlers());
    const user = userEvent.setup();

    renderWithQueryClient(<LocalMcpServerPage />);
    await waitFor(() => within(document.body).getByText('web_search_exa'));

    expect(within(document.body).getByText('0 tools expostas'));
    await user.click(
      within(document.body).getByRole('button', { name: 'Expor exa.web_search_exa' }),
    );
    expect(within(document.body).getByText('1 tools expostas'));
  });

  test('disables fields when agent decides parameters on local server page', async () => {
    mswServer.use(...localRouterHandlers());
    const user = userEvent.setup();

    renderWithQueryClient(<LocalMcpServerPage />);
    const queryInput = await waitFor(() => within(document.body).getByLabelText('query'));

    await user.click(within(document.body).getByRole('radio', { name: 'Deixar o Agente decidir' }));

    expectInputDisabled(queryInput, true);
  });
});

function localRouterHandlers() {
  return [
    http.get('*/api/app/mcp-servers', () => HttpResponse.json([localMcpServer()])),
    http.get('*/api/app/mcp-servers/:id/tools', () =>
      HttpResponse.json({
        serverId: 'srv-1',
        tools: [localMcpTool()],
      }),
    ),
  ] as const;
}

function localMcpServer() {
  return {
    id: 'srv-1',
    name: 'exa',
    description: null,
    enabled: true,
    transport: 'stdio',
    command: '/bin/exa',
    args: null,
    url: null,
    headers: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function localMcpTool() {
  return {
    name: 'web_search_exa',
    description: 'Search the web.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Natural language query.' },
      },
      required: ['query'],
    },
  };
}

function expectInputDisabled(input: HTMLElement, expected: boolean) {
  if (!(input instanceof HTMLInputElement)) {
    throw new TypeError(`Expected query input, got ${input.tagName}`);
  }
  expect(input.disabled).toBe(expected);
}
