import { describe, expect, test } from 'bun:test';
import { GLOBAL_THRESHOLD, LAYER_THRESHOLDS } from './coverage-config';

describe('coverage-config', () => {
  test('GLOBAL_THRESHOLD is a sensible percentage', () => {
    expect(GLOBAL_THRESHOLD).toBeGreaterThanOrEqual(50);
    expect(GLOBAL_THRESHOLD).toBeLessThanOrEqual(100);
  });

  test('every layer threshold is between 0 and 100', () => {
    for (const layer of LAYER_THRESHOLDS) {
      expect(layer.threshold).toBeGreaterThanOrEqual(0);
      expect(layer.threshold).toBeLessThanOrEqual(100);
    }
  });

  test('layer dirs are unique', () => {
    const dirs = LAYER_THRESHOLDS.map((l) => l.dir);
    expect(new Set(dirs).size).toBe(dirs.length);
  });

  test('every layer dir starts with packages/ or apps/', () => {
    for (const layer of LAYER_THRESHOLDS) {
      expect(layer.dir.startsWith('packages/') || layer.dir.startsWith('apps/')).toBe(true);
    }
  });

  test('includes the testkit and web-assets layers', () => {
    const dirs = new Set(LAYER_THRESHOLDS.map((l) => l.dir));
    expect(dirs.has('packages/testkit-base')).toBe(true);
    expect(dirs.has('packages/testkit')).toBe(true);
    expect(dirs.has('packages/web-assets')).toBe(true);
  });
});
