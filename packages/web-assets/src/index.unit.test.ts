import { describe, expect, test } from 'bun:test';
import { loadAssetsManifest, type WebAsset } from './index.ts';

describe('loadAssetsManifest()', () => {
  test('returns an empty map when the generated manifest is absent', async () => {
    const assets = await loadAssetsManifest(async () => {
      throw new Error("Cannot find module './manifest.generated.ts' from '/tmp/index.ts'");
    });

    expect(assets.size).toBe(0);
  });

  test('returns the generated assets when the manifest is available', async () => {
    const expectedAsset: WebAsset = {
      path: 'index.html',
      contentType: 'text/html; charset=utf-8',
      bytes: new Uint8Array([60, 104, 49, 62]),
    };

    const assets = await loadAssetsManifest(async () => {
      return {
        ASSETS: new Map<string, WebAsset>([['index.html', expectedAsset]]),
      };
    });

    expect(assets.get('index.html')).toEqual(expectedAsset);
  });

  test('rethrows unexpected manifest loading errors', async () => {
    const expectedError = new Error('manifest parsing failed');

    const error = await loadAssetsManifest(async () => {
      throw expectedError;
    }).catch((caughtError: unknown) => caughtError);

    expect(error).toBe(expectedError);
  });
});
