export interface WebAsset {
  readonly path: string;
  readonly contentType: string;
  readonly bytes: Uint8Array;
}

interface ManifestModule {
  readonly ASSETS: ReadonlyMap<string, WebAsset>;
}

type ManifestLoader = () => Promise<ManifestModule>;

const GENERATED_MANIFEST_NAME = 'manifest.generated.ts';
const GENERATED_MANIFEST_URL = new URL(`./${GENERATED_MANIFEST_NAME}`, import.meta.url);
const EMPTY_ASSETS: ReadonlyMap<string, WebAsset> = new Map<string, WebAsset>();

async function importGeneratedManifest(): Promise<ManifestModule> {
  const module = await import(GENERATED_MANIFEST_URL.href);
  return { ASSETS: module.ASSETS as ReadonlyMap<string, WebAsset> };
}

function isMissingManifestError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('message' in error)) {
    return false;
  }

  const { message } = error;
  if (typeof message !== 'string') {
    return false;
  }

  return message.includes('Cannot find module') && message.includes(GENERATED_MANIFEST_NAME);
}

export async function loadAssetsManifest(
  manifestLoader: ManifestLoader = importGeneratedManifest,
): Promise<ReadonlyMap<string, WebAsset>> {
  try {
    const manifestModule = await manifestLoader();
    return manifestModule.ASSETS;
  } catch (error) {
    if (isMissingManifestError(error)) {
      return EMPTY_ASSETS;
    }

    throw error;
  }
}

export const WEB_ASSETS_VERSION = '0.1.0';

export const ASSETS = await loadAssetsManifest();

export function getAsset(path: string): WebAsset | undefined {
  return ASSETS.get(path);
}

export function listAssetPaths(): readonly string[] {
  return [...ASSETS.keys()];
}

export function hasAssets(): boolean {
  return ASSETS.size > 0;
}
