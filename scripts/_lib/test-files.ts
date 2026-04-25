import { Glob } from 'bun';
import { resolve } from 'node:path';

const UNIT_TEST_FILES = new Glob('**/*.unit.test.ts');

export async function listUnitTestFiles(rootDir: string, relativeDir: string): Promise<string[]> {
  const matches: string[] = [];

  for await (const file of UNIT_TEST_FILES.scan({
    cwd: resolve(rootDir, relativeDir),
    onlyFiles: true,
  })) {
    matches.push(`${relativeDir}/${file.replaceAll('\\', '/')}`);
  }

  return matches.sort();
}

export function listRootScriptUnitTests(): Promise<string[]> {
  return listUnitTestFiles(resolve(import.meta.dir, '../..'), 'scripts');
}
