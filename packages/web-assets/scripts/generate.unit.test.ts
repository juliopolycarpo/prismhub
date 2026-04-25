import { describe, expect, test } from 'bun:test';

import { DashboardNotBuiltError, type AssetEntry, renderManifestSource } from './generate.ts';

const sampleEntry = (overrides: Partial<AssetEntry> = {}): AssetEntry => ({
  relPath: 'index.html',
  contentType: 'text/html;charset=utf-8',
  b64: 'PGh0bWw+aGVsbG88L2h0bWw+',
  ...overrides,
});

describe('renderManifestSource()', () => {
  test('returns empty Map when no assets', () => {
    const source = renderManifestSource([]);
    expect(source).toContain('export const ASSETS: ReadonlyMap<string, WebAsset> = new Map();');
    expect(source).toContain('export interface WebAsset');
    expect(source).toContain('function decode(b64: string): Uint8Array');
  });

  test('emits one Map entry per asset and preserves order', () => {
    const source = renderManifestSource([
      sampleEntry({ relPath: 'b.js', contentType: 'text/javascript;charset=utf-8', b64: 'Zm9v' }),
      sampleEntry({ relPath: 'a.js', contentType: 'text/javascript;charset=utf-8', b64: 'YmFy' }),
    ]);
    expect(source.match(/decode\("[^"]+"\)/g)?.length).toBe(2);
    expect(source.indexOf('"a.js"')).toBeGreaterThan(source.indexOf('"b.js"'));
  });

  test('renders every field of a single asset', () => {
    const entry = sampleEntry({
      relPath: 'assets/app-DEADBEEF.js',
      contentType: 'text/javascript;charset=utf-8',
      b64: 'Zm9vYmFy',
    });
    const source = renderManifestSource([entry]);
    expect(source).toContain('"assets/app-DEADBEEF.js"');
    expect(source).toContain('"text/javascript;charset=utf-8"');
    expect(source).toContain('decode("Zm9vYmFy")');
    expect(source).not.toContain('new Map();');
  });

  test('JSON-escapes special characters in relPath and contentType', () => {
    const source = renderManifestSource([
      sampleEntry({
        relPath: 'path/with "quotes"\\and\nnewline.html',
        contentType: 'text/html;charset="utf-8"',
        b64: 'YWJj',
      }),
    ]);
    expect(source).toContain(String.raw`"path/with \"quotes\"\\and\nnewline.html"`);
    expect(source).toContain(String.raw`"text/html;charset=\"utf-8\""`);
  });
});

describe('DashboardNotBuiltError', () => {
  test('is Error subclass with stable name and contextual message', () => {
    const err = new DashboardNotBuiltError('/some/missing/dist');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(DashboardNotBuiltError);
    expect(err.name).toBe('DashboardNotBuiltError');
    expect(err.message).toContain('/some/missing/dist');
    expect(err.message).toContain('apps/web');
  });
});
