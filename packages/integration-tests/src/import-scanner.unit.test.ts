import { describe, expect, test } from 'bun:test';
import { collectImports } from './import-scanner.ts';

describe('collectImports', () => {
  test('named import', () => {
    const refs = collectImports(`import { readFile, writeFile as w } from 'node:fs/promises';`);
    expect(refs).toContainEqual({
      module: 'node:fs/promises',
      kind: 'named',
      symbols: ['readFile', 'writeFile'],
    });
  });

  test('type-only named import', () => {
    const refs = collectImports(`import type { Stats } from 'node:fs';`);
    expect(refs).toContainEqual({ module: 'node:fs', kind: 'named', symbols: ['Stats'] });
  });

  test('default import', () => {
    const refs = collectImports(`import fs from 'node:fs';`);
    expect(refs).toContainEqual({ module: 'node:fs', kind: 'default', symbols: ['fs'] });
  });

  test('default + named combined', () => {
    const refs = collectImports(`import fs, { readFile } from 'node:fs';`);
    expect(refs).toContainEqual({ module: 'node:fs', kind: 'default', symbols: ['fs'] });
    expect(refs).toContainEqual({ module: 'node:fs', kind: 'named', symbols: ['readFile'] });
  });

  test('namespace import', () => {
    const refs = collectImports(`import * as fs from 'node:fs';`);
    expect(refs).toContainEqual({ module: 'node:fs', kind: 'namespace', symbols: ['*'] });
  });

  test('side-effect import', () => {
    const refs = collectImports(`import 'node:test';`);
    expect(refs).toContainEqual({ module: 'node:test', kind: 'sideeffect', symbols: [] });
  });

  test('require call', () => {
    const refs = collectImports(`const fs = require('node:fs');`);
    expect(refs).toContainEqual({ module: 'node:fs', kind: 'require', symbols: ['*'] });
  });

  test('named re-export', () => {
    const refs = collectImports(`export { readFile } from 'node:fs/promises';`);
    expect(refs).toContainEqual({
      module: 'node:fs/promises',
      kind: 'named',
      symbols: ['readFile'],
    });
  });

  test('star re-export', () => {
    const refs = collectImports(`export * from 'node:fs';`);
    expect(refs).toContainEqual({ module: 'node:fs', kind: 'namespace', symbols: ['*'] });
  });

  test('namespace re-export', () => {
    const refs = collectImports(`export * as fs from 'node:fs';`);
    expect(refs).toContainEqual({ module: 'node:fs', kind: 'namespace', symbols: ['*'] });
  });

  test('ignores commented-out imports', () => {
    const source = `
      // import { readFile } from 'node:fs';
      /* import { writeFile } from 'node:fs'; */
      import { join } from 'node:path';
    `;
    const refs = collectImports(source);
    expect(refs).toContainEqual({ module: 'node:path', kind: 'named', symbols: ['join'] });
    expect(refs.find((r) => r.module === 'node:fs')).toBeUndefined();
  });

  test('strips type qualifier from named import members', () => {
    const refs = collectImports(`import { type Stats, readFile } from 'node:fs';`);
    expect(refs).toContainEqual({
      module: 'node:fs',
      kind: 'named',
      symbols: ['Stats', 'readFile'],
    });
  });
});
