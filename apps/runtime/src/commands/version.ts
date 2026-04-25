import { APP_VERSION } from '@prismhub/config';

export function versionCommand(): number {
  process.stdout.write(`${APP_VERSION}\n`);
  return 0;
}
