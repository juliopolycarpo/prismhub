import { describe, expect, mock, test } from 'bun:test';
import {
  createMcpClientPool,
  type UpstreamConnection,
  type UpstreamHttpTarget,
  type UpstreamStdioTarget,
  type UpstreamTarget,
} from './pool.ts';

const STDIO_TARGET: UpstreamStdioTarget = {
  id: 'stdio-1',
  name: 'Test Server',
  transport: 'stdio',
  command: 'echo',
  args: ['hello'],
};

const HTTP_TARGET: UpstreamHttpTarget = {
  id: 'http-1',
  name: 'Remote Server',
  transport: 'http',
  url: new URL('http://localhost:9999/mcp'),
};

function fakeConnection(id: string, closeFn?: () => Promise<void>): UpstreamConnection {
  return {
    id,
    name: 'Test Server',
    client: null as never,
    close: closeFn ?? (async () => {}),
  };
}

describe('createMcpClientPool()', () => {
  test('establishes and returns a connection', async () => {
    const expected = fakeConnection(STDIO_TARGET.id);
    const establish = mock(async () => expected);
    const pool = createMcpClientPool({ establish });

    const conn = await pool.connect(STDIO_TARGET);
    expect(conn.id).toBe(STDIO_TARGET.id);
    expect(establish).toHaveBeenCalledTimes(1);
  });

  test('returns the cached connection on a second call', async () => {
    const establish = mock(async () => fakeConnection(STDIO_TARGET.id));
    const pool = createMcpClientPool({ establish });

    await pool.connect(STDIO_TARGET);
    await pool.connect(STDIO_TARGET);

    expect(establish).toHaveBeenCalledTimes(1);
  });

  test('concurrent calls result in exactly one establish invocation', async () => {
    let capturedResolve!: (c: UpstreamConnection) => void;
    const establish = mock(
      () =>
        new Promise<UpstreamConnection>((resolve) => {
          capturedResolve = resolve;
        }),
    );

    const pool = createMcpClientPool({ establish });
    const [p1, p2, p3] = [
      pool.connect(STDIO_TARGET),
      pool.connect(STDIO_TARGET),
      pool.connect(STDIO_TARGET),
    ];

    capturedResolve(fakeConnection(STDIO_TARGET.id));
    const [c1, c2, c3] = await Promise.all([p1, p2, p3]);

    expect(establish).toHaveBeenCalledTimes(1);
    expect(c1).toBe(c2);
    expect(c2).toBe(c3);
  });

  test('clears the inFlight entry after an establish failure so a retry works', async () => {
    let attempt = 0;
    const establish = mock(async () => {
      attempt++;
      if (attempt === 1) throw new Error('connect failed');
      return fakeConnection(STDIO_TARGET.id);
    });

    const pool = createMcpClientPool({ establish });
    const firstErr = await pool.connect(STDIO_TARGET).catch((e) => e);
    expect(firstErr).toBeInstanceOf(Error);
    expect((firstErr as Error).message).toBe('connect failed');
    const conn = await pool.connect(STDIO_TARGET);
    expect(conn.id).toBe(STDIO_TARGET.id);
    expect(establish).toHaveBeenCalledTimes(2);
  });

  test('close removes the connection from the pool', async () => {
    const pool = createMcpClientPool({
      establish: mock(async () => fakeConnection(STDIO_TARGET.id)),
    });
    await pool.connect(STDIO_TARGET);
    expect(pool.list()).toHaveLength(1);

    const [conn] = pool.list();
    await conn!.close();
    expect(pool.list()).toHaveLength(0);
  });

  test('closeAll closes every connection and empties the pool', async () => {
    const rawClose = mock(async () => {});
    const establish = mock(async (t: UpstreamTarget) => fakeConnection(t.id, rawClose));

    const pool = createMcpClientPool({ establish });
    await pool.connect({ ...STDIO_TARGET, id: 'a' });
    await pool.connect({ ...STDIO_TARGET, id: 'b' });
    await pool.closeAll();

    expect(rawClose).toHaveBeenCalledTimes(2);
    expect(pool.list()).toHaveLength(0);
  });

  test('closeAll throws AggregateError when some connections fail to close', async () => {
    const boom = mock(async () => {
      throw new Error('close failed');
    });
    const ok = mock(async () => {});
    const targets = [
      { ...STDIO_TARGET, id: 'fail-1' },
      { ...STDIO_TARGET, id: 'ok-1' },
      { ...STDIO_TARGET, id: 'fail-2' },
    ];
    const closes = [boom, ok, boom];
    let callCount = 0;
    const establish = mock(async (t: UpstreamTarget) => fakeConnection(t.id, closes[callCount++]));

    const pool = createMcpClientPool({ establish });
    for (const t of targets) await pool.connect(t);

    const err = await pool.closeAll().catch((e) => e);
    expect(err).toBeInstanceOf(AggregateError);
    expect((err as AggregateError).errors).toHaveLength(2);
  });

  test('list reflects all currently open connections', async () => {
    const pool = createMcpClientPool({
      establish: mock(async (t) => fakeConnection(t.id)),
    });
    await pool.connect({ ...STDIO_TARGET, id: 'x' });
    await pool.connect({ ...STDIO_TARGET, id: 'y' });

    const ids = pool.list().map((c) => c.id);
    expect(ids).toContain('x');
    expect(ids).toContain('y');
  });

  test('times out when establish takes longer than connectTimeoutMs', async () => {
    const establish = mock(() => new Promise<UpstreamConnection>(() => {}));
    const pool = createMcpClientPool({
      establish,
      connectTimeoutMs: 50,
    });

    const err = await pool.connect(STDIO_TARGET).catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toContain('timeout');
  }, 5_000);

  test('aborts when AbortSignal fires before establish completes', async () => {
    const establish = mock(() => new Promise<UpstreamConnection>(() => {}));
    const pool = createMcpClientPool({
      establish,
      connectTimeoutMs: 30_000,
    });

    const controller = new AbortController();
    const p = pool.connect(STDIO_TARGET, controller.signal);
    controller.abort('cancelled');

    const err = await p.catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toContain('abort');
  }, 5_000);

  test('accepts an HTTP target (passes it to establish)', async () => {
    const establish = mock(async (t) => fakeConnection(t.id));
    const pool = createMcpClientPool({ establish });

    const conn = await pool.connect(HTTP_TARGET);
    expect(conn.id).toBe(HTTP_TARGET.id);
    expect(establish).toHaveBeenCalledWith(HTTP_TARGET);
  });
});
