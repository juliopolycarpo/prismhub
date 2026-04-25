import { describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { listUnitTestFiles } from './test-files.ts';

function createTempRoot(): string {
  return mkdtempSync(join(tmpdir(), 'prismhub-test-files-'));
}

async function writeFile(filePath: string, content = ''): Promise<void> {
  await Bun.write(filePath, content);
}

describe('listUnitTestFiles()', () => {
  test('returns sorted unit tests for requested directory', async () => {
    const rootDir = createTempRoot();
    try {
      mkdirSync(join(rootDir, 'scripts', '_lib', 'parsers'), { recursive: true });
      mkdirSync(join(rootDir, 'packages', 'core'), { recursive: true });

      await writeFile(join(rootDir, 'scripts', 'check.unit.test.ts'));
      await writeFile(join(rootDir, 'scripts', '_lib', 'gate.unit.test.ts'));
      await writeFile(join(rootDir, 'scripts', '_lib', 'parsers', 'bunTest.unit.test.ts'));
      await writeFile(join(rootDir, 'scripts', 'skip.integration.test.ts'));
      await writeFile(join(rootDir, 'packages', 'core', 'env.unit.test.ts'));

      const files = await listUnitTestFiles(rootDir, 'scripts');
      expect(files).toEqual([
        'scripts/_lib/gate.unit.test.ts',
        'scripts/_lib/parsers/bunTest.unit.test.ts',
        'scripts/check.unit.test.ts',
      ]);
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  test('returns empty array when no unit tests exist', async () => {
    const rootDir = createTempRoot();
    try {
      mkdirSync(join(rootDir, 'scripts'), { recursive: true });
      await writeFile(join(rootDir, 'scripts', 'check.integration.test.ts'));

      const files = await listUnitTestFiles(rootDir, 'scripts');
      expect(files).toEqual([]);
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });
});
