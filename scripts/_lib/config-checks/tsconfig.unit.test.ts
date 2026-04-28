import { describe, expect, test } from 'bun:test';
import { ROOT_SCRIPTS_TSCONFIG } from '../commands/typecheck-command';

interface TsConfigJson {
  readonly extends?: string;
  readonly include?: readonly string[];
  readonly compilerOptions?: {
    readonly moduleResolution?: string;
    readonly types?: readonly string[];
  };
}

async function readTsConfig(path: string): Promise<TsConfigJson> {
  return (await Bun.file(`${import.meta.dir}/../../../${path}`).json()) as TsConfigJson;
}

describe('root scripts tsconfig', () => {
  test('inherits Bun globals and import-meta support', async () => {
    const scriptsConfig = await readTsConfig(ROOT_SCRIPTS_TSCONFIG);
    const scriptBaseConfig = await readTsConfig('tsconfig.script.json');
    const baseConfig = await readTsConfig('tsconfig.base.json');

    expect(scriptsConfig.extends).toBe('../tsconfig.script.json');
    expect(scriptsConfig.include).toEqual(['./**/*']);
    expect(scriptBaseConfig.extends).toBe('./tsconfig.base.json');
    expect(baseConfig.compilerOptions?.moduleResolution).toBe('Bundler');
    expect(baseConfig.compilerOptions?.types).toContain('bun');
  });
});
