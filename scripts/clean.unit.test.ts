import { describe, expect, test } from 'bun:test';
import { createCleanPlan } from './clean';

describe('createCleanPlan()', () => {
  test('forwards turbo filters without appending them to root artifact cleanup', () => {
    const plan = createCleanPlan('/repo', ['--filter=@prismhub/runtime']);

    expect(plan.turboCommand).toEqual([
      process.execPath,
      'x',
      'turbo',
      'run',
      'clean',
      '--filter=@prismhub/runtime',
    ]);
    expect(plan.rootArtifacts).toEqual([
      '/repo/dist',
      '/repo/coverage',
      '/repo/.turbo',
      '/repo/scripts/tsconfig.tsbuildinfo',
    ]);
  });

  test('keeps root artifact cleanup stable when multiple turbo args are present', () => {
    const plan = createCleanPlan('/repo', ['--filter=@prismhub/web', '--continue']);

    expect(plan.turboCommand.slice(-2)).toEqual(['--filter=@prismhub/web', '--continue']);
    expect(plan.rootArtifacts).toEqual([
      '/repo/dist',
      '/repo/coverage',
      '/repo/.turbo',
      '/repo/scripts/tsconfig.tsbuildinfo',
    ]);
  });
});
