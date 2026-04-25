import { afterEach, beforeEach, describe, expect, test } from 'bun:test';

import {
  DashboardNotBuiltError,
  type GenerateMode,
  generateManifest,
  loadAssets,
} from './generate.ts';

async function makeTmpDir(): Promise<string> {
  const raw = await Bun.$`mktemp -d`.text();
  return raw.trim();
}

async function rmTmpDir(dir: string): Promise<void> {
  await Bun.$`rm -rf ${dir}`.quiet();
}

async function writeFixtureTree(
  dir: string,
  files: Readonly<Record<string, string | Uint8Array>>,
): Promise<void> {
  for (const [relPath, content] of Object.entries(files)) {
    await Bun.write(`${dir}/${relPath}`, content);
  }
}

const INDEX_HTML = '<!doctype html><html><head><title>Prism</title></head><body></body></html>';
const APP_JS = 'export const app = () => globalThis.document.title;';
const MAIN_CSS = 'body{font-family:system-ui}';
const PNG_BYTES = new Uint8Array([0, 1, 2, 255]);
const PNG_BYTES_BASE64 = 'AAEC/w==';

describe('loadAssets()', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await makeTmpDir();
  });

  afterEach(async () => {
    await rmTmpDir(dir);
  });

  test('returns entries sorted by relPath', async () => {
    await writeFixtureTree(dir, {
      'index.html': INDEX_HTML,
      'assets/main.css': MAIN_CSS,
      'assets/app-DEADBEEF.js': APP_JS,
    });

    const result = await loadAssets(dir);
    expect(result.map((e) => e.relPath)).toEqual([
      'assets/app-DEADBEEF.js',
      'assets/main.css',
      'index.html',
    ]);
  });

  test('base64-encodes text files faithfully', async () => {
    await writeFixtureTree(dir, { 'index.html': INDEX_HTML });
    const [entry] = await loadAssets(dir);
    expect(entry).toBeDefined();
    expect(Buffer.from(entry!.b64, 'base64').toString('utf-8')).toBe(INDEX_HTML);
  });

  test('base64-encodes binary files faithfully', async () => {
    await writeFixtureTree(dir, { 'icon.png': PNG_BYTES });
    const [entry] = await loadAssets(dir);
    expect(entry?.b64).toBe(PNG_BYTES_BASE64);
  });

  test('derives content-type from file extension', async () => {
    await writeFixtureTree(dir, {
      'index.html': INDEX_HTML,
      'assets/main.css': MAIN_CSS,
      'assets/app.js': APP_JS,
      'icon.png': PNG_BYTES,
    });

    const result = await loadAssets(dir);
    const byPath = new Map(result.map((e) => [e.relPath, e.contentType]));

    expect(byPath.get('index.html')).toMatch(/^text\/html/);
    expect(byPath.get('assets/main.css')).toMatch(/^text\/css/);
    expect(byPath.get('assets/app.js')).toMatch(/javascript/);
    expect(byPath.get('icon.png')).toMatch(/^image\/png/);
  });

  test('falls back to octet-stream for unknown extensions', async () => {
    await writeFixtureTree(dir, { 'data.unknownext': 'payload' });
    const [entry] = await loadAssets(dir);
    expect(entry?.contentType).toBe('application/octet-stream');
  });

  test('uses POSIX / separator for nested paths', async () => {
    await writeFixtureTree(dir, { 'nested/deep/file.html': INDEX_HTML });
    const [entry] = await loadAssets(dir);
    expect(entry?.relPath).toBe('nested/deep/file.html');
    expect(entry?.relPath).not.toContain('\\');
  });

  test('returns empty array for empty directory', async () => {
    const result = await loadAssets(dir);
    expect(result).toEqual([]);
  });
});

describe('generateManifest()', () => {
  let dir: string;
  let outputPath: string;

  beforeEach(async () => {
    dir = await makeTmpDir();
    outputPath = `${dir}/manifest.generated.ts`;
  });

  afterEach(async () => {
    await rmTmpDir(dir);
  });

  test('throws DashboardNotBuiltError in release mode when dist is missing', async () => {
    const missingDist = `${dir}/does-not-exist`;
    const err = await generateManifest({
      mode: 'release',
      distPath: missingDist,
      outputPath,
    }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(DashboardNotBuiltError);
  });

  test('includes missing distPath in error message', async () => {
    const missingDist = `${dir}/does-not-exist`;
    try {
      await generateManifest({ mode: 'release', distPath: missingDist, outputPath });
      throw new Error('expected DashboardNotBuiltError but promise resolved');
    } catch (err) {
      expect(err).toBeInstanceOf(DashboardNotBuiltError);
      expect((err as DashboardNotBuiltError).message).toContain(missingDist);
    }
  });

  test('treats directory without build marker as missing in release mode', async () => {
    const distWithoutMarker = `${dir}/dist`;
    await writeFixtureTree(distWithoutMarker, { 'other-file.txt': 'no index.html here' });

    const err = await generateManifest({
      mode: 'release',
      distPath: distWithoutMarker,
      outputPath,
    }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(DashboardNotBuiltError);
  });

  test('writes empty manifest in dev mode when dist is missing', async () => {
    const missingDist = `${dir}/does-not-exist`;
    await generateManifest({ mode: 'dev', distPath: missingDist, outputPath });
    const written = await Bun.file(outputPath).text();
    expect(written).toContain('new Map();');
  });

  test('writes empty manifest in package-local mode when dist is missing', async () => {
    const missingDist = `${dir}/does-not-exist`;
    await generateManifest({ mode: 'package-local', distPath: missingDist, outputPath });
    const written = await Bun.file(outputPath).text();
    expect(written).toContain('new Map();');
  });

  test.each<GenerateMode>(['release', 'dev', 'package-local'])(
    'writes populated manifest in %s mode when build marker exists',
    async (mode) => {
      const distDir = `${dir}/dist`;
      await writeFixtureTree(distDir, {
        'index.html': INDEX_HTML,
        'assets/app-DEADBEEF.js': APP_JS,
      });

      await generateManifest({ mode, distPath: distDir, outputPath });
      const written = await Bun.file(outputPath).text();
      expect(written).toContain('new Map([');
      expect(written).toContain('"index.html"');
      expect(written).toContain('"assets/app-DEADBEEF.js"');
    },
  );
});
