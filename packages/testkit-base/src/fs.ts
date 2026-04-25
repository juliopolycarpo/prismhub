import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export interface TempDirectoryHandle {
  readonly path: string;
  readonly cleanup: () => void;
}

export function createTempDirectory(prefix = 'prismhub-test-'): TempDirectoryHandle {
  const path = mkdtempSync(join(tmpdir(), prefix));
  return {
    path,
    cleanup: () => {
      rmSync(path, { recursive: true, force: true });
    },
  };
}

export async function withTempDirectory<T>(run: (path: string) => Promise<T> | T): Promise<T> {
  const handle = createTempDirectory();
  try {
    return await run(handle.path);
  } finally {
    handle.cleanup();
  }
}
