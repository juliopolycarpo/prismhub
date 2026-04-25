import { createTempDirectory, type TempDirectoryHandle } from '@prismhub/testkit-base';

const RUNTIME_BIN = `${import.meta.dir}/../main.ts`;
const TEST_HOST = '127.0.0.1';
const TEST_PORT_BASE = 39_741;
const TEST_PORT_RANGE = 1_000;
const TEST_AUTH_SECRET = 'prismhub-test-only-secret-do-not-use-in-production-xxxxxxxxxxxxxxxx';

export interface RuntimeServerHandle {
  readonly baseUrl: string;
  readonly host: string;
  readonly port: number;
  readonly process: ReturnType<typeof Bun.spawn>;
  readonly tempDir: TempDirectoryHandle;
  /** Whether `tempDir.cleanup()` should be skipped (set when the caller owns the dir). */
  readonly skipCleanup: boolean;
  stopped: boolean;
}

export interface StartRuntimeServerOptions {
  /** Use this directory instead of creating a temp one (caller owns cleanup). */
  readonly dataDirOverride?: string;
  /** Additional env vars passed to the spawned runtime. */
  readonly extraEnv?: Readonly<Record<string, string>>;
}

function nextPort(): number {
  return TEST_PORT_BASE + Math.floor(Math.random() * TEST_PORT_RANGE);
}

async function waitForHealth(baseUrl: string, timeoutMs = 10_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/healthz`);
      if (response.ok) return;
    } catch {
      // Server still starting.
    }

    await Bun.sleep(100);
  }

  throw new Error(`Server did not become healthy at ${baseUrl}/healthz within ${timeoutMs}ms`);
}

export async function startRuntimeServer(
  options: StartRuntimeServerOptions = {},
): Promise<RuntimeServerHandle> {
  const tempDir: TempDirectoryHandle = options.dataDirOverride
    ? { path: options.dataDirOverride, cleanup: () => undefined }
    : createTempDirectory('prismhub-runtime-test-');
  const skipCleanup = Boolean(options.dataDirOverride);
  const port = nextPort();
  const baseUrl = `http://${TEST_HOST}:${port}`;
  const runtimeProcess = Bun.spawn(['bun', 'run', RUNTIME_BIN, 'serve'], {
    env: {
      ...Bun.env,
      PRISMHUB_PORT: String(port),
      PRISMHUB_DATA_DIR: tempDir.path,
      NODE_ENV: 'test',
      PRISMHUB_LOG_LEVEL: 'error',
      BETTER_AUTH_SECRET: TEST_AUTH_SECRET,
      BETTER_AUTH_URL: baseUrl,
      ...(options.extraEnv ?? {}),
    },
    stdout: 'ignore',
    stderr: 'ignore',
  });

  try {
    await waitForHealth(baseUrl);
  } catch (error) {
    runtimeProcess.kill('SIGTERM');
    await runtimeProcess.exited;
    if (!skipCleanup) tempDir.cleanup();
    throw error;
  }

  return {
    baseUrl,
    host: TEST_HOST,
    port,
    process: runtimeProcess,
    tempDir,
    skipCleanup,
    stopped: false,
  };
}

export async function shutdownRuntimeServer(runtime: RuntimeServerHandle): Promise<void> {
  if (runtime.stopped) return;

  runtime.stopped = true;
  runtime.process.kill('SIGTERM');
  await runtime.process.exited;
}

export function cleanupRuntimeServer(runtime: RuntimeServerHandle): void {
  if (runtime.skipCleanup) return;
  runtime.tempDir.cleanup();
}

/**
 * Helper for tests: signs up the very first user (auto-promoted to admin) and
 * returns the session cookie value (without the attributes).
 */
export async function bootstrapAdminCookie(
  baseUrl: string,
  credentials: { email?: string; password?: string } = {},
): Promise<string> {
  const email = credentials.email ?? 'admin@prismhub.test';
  const password = credentials.password ?? 'admin-test-password';
  const res = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, name: 'Admin' }),
  });
  if (res.status !== 200) {
    throw new Error(`bootstrap admin failed: HTTP ${res.status} ${await res.text()}`);
  }
  const setCookie = res.headers.get('set-cookie') ?? '';
  const cookie = setCookie.split(';')[0] ?? '';
  if (!cookie) throw new Error('missing set-cookie on sign-up');
  return cookie;
}
