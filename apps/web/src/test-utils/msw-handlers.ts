import { http, HttpResponse } from 'msw';

const MOCK_USER = { id: 'user_mock', email: 'admin@prismhub.test', name: 'Admin', role: 'admin' };

export const handlers = [
  http.get('*/api/v1/registration-status', () =>
    HttpResponse.json({ firstUser: false, registrationOpen: true }),
  ),
  http.get('*/api/auth/get-session', () =>
    HttpResponse.json({
      session: {
        id: 'sess_mock',
        userId: 'user_mock',
        expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      },
      user: MOCK_USER,
    }),
  ),
  http.post('*/api/auth/sign-in/email', () =>
    HttpResponse.json({ token: 'mock-token', user: MOCK_USER }),
  ),
  http.post('*/api/auth/sign-up/email', () =>
    HttpResponse.json({ token: 'mock-token', user: MOCK_USER }),
  ),
  http.post('*/api/auth/sign-out', () => HttpResponse.json({ success: true })),
  http.get('*/api/app/status', () =>
    HttpResponse.json({
      version: '0.1.0',
      uptimeSec: 42,
      dbReady: true,
      upstreamsCount: 0,
    }),
  ),
  http.get('*/api/app/settings', () =>
    HttpResponse.json({
      themeMode: 'system',
      accentColor: '#6366f1',
      density: 'comfortable',
      showMetadata: false,
      allowUserRegistration: false,
    }),
  ),
  http.patch('*/api/app/settings', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      themeMode: body.themeMode ?? 'system',
      accentColor: '#6366f1',
      density: 'comfortable',
      showMetadata: false,
      allowUserRegistration: false,
    });
  }),
  http.get('*/api/app/sessions', () => HttpResponse.json([])),
  http.get('*/api/app/mcp-servers', () => HttpResponse.json([])),
  http.post('*/api/app/mcp-servers', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      id: '01HMOCK000000000000000MCP1',
      name: body.name ?? 'mock',
      description: null,
      transport: body.transport ?? 'stdio',
      command: body.command ?? null,
      args: body.args ?? null,
      url: body.url ?? null,
      headers: body.headers ?? null,
      enabled: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
  }),
  http.get('*/api/app/mcp-servers/:id/tools', ({ params }) =>
    HttpResponse.json({
      serverId: params.id,
      tools: [],
    }),
  ),
  http.get('*/api/app/summary', () =>
    HttpResponse.json({
      sessions: { total: 0, active: 0, latestId: null },
      upstreams: { total: 0, enabled: 0 },
    }),
  ),
  http.get('*/api/app/cache/stats', () =>
    HttpResponse.json({
      tokensSavedToday: 0,
      economyToday: 0,
      economyMonth: 0,
      hitRate: 0,
      entriesTotal: 0,
      entriesFresh: 0,
      entriesIdle: 0,
    }),
  ),
  http.get('*/api/app/cache/entries', () => HttpResponse.json([])),
];
