import { bunxCommand } from './spawn';

export const ROOT_SCRIPTS_TSCONFIG = 'scripts/tsconfig.json';

export function rootScriptsTypecheckCommand(): readonly string[] {
  return bunxCommand('tsc', ['-b', ROOT_SCRIPTS_TSCONFIG]);
}
