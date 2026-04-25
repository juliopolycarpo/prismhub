import type { WebAsset } from '@prismhub/web-assets';
import { Elysia } from 'elysia';
import { HTTP_STATUS, IMMUTABLE_CACHE_CONTROL, NO_CACHE_CONTROL } from './constants.ts';

export interface DashboardRoutesDeps {
  readonly assets: ReadonlyMap<string, WebAsset>;
  readonly basePath?: string;
}

const DEFAULT_BASE = '/dashboard';
const INDEX_PATH = 'index.html';
const IMMUTABLE_PREFIX = 'assets/';

function makeResponse(asset: WebAsset, status = 200): Response {
  const headers: Record<string, string> = {
    'content-type': asset.contentType,
    'content-length': String(asset.bytes.byteLength),
  };
  headers['cache-control'] = asset.path.startsWith(IMMUTABLE_PREFIX)
    ? IMMUTABLE_CACHE_CONTROL
    : NO_CACHE_CONTROL;
  // Slice to a fresh ArrayBuffer (BodyInit-compatible) and avoid SharedArrayBuffer typing issues.
  const body = asset.bytes.buffer.slice(
    asset.bytes.byteOffset,
    asset.bytes.byteOffset + asset.bytes.byteLength,
  ) as ArrayBuffer;
  return new Response(body, { status, headers });
}

export function createDashboardRoutes(deps: DashboardRoutesDeps) {
  const base = deps.basePath ?? DEFAULT_BASE;
  const assets = deps.assets;
  const index = assets.get(INDEX_PATH);

  const app = new Elysia();

  if (assets.size === 0) {
    return app.get(`${base}/*`, ({ set }) => {
      set.status = HTTP_STATUS.SERVICE_UNAVAILABLE;
      return { error: 'dashboard_not_built' };
    });
  }

  app.get(base, () =>
    index ? makeResponse(index) : new Response('not found', { status: HTTP_STATUS.NOT_FOUND }),
  );
  app.get(`${base}/`, () =>
    index ? makeResponse(index) : new Response('not found', { status: HTTP_STATUS.NOT_FOUND }),
  );
  app.get(`${base}/*`, ({ params }) => {
    const wildcard = (params as { '*'?: string })['*'] ?? '';
    const cleaned = wildcard.replace(/^\/+/, '');
    if (cleaned.length > 0) {
      const asset = assets.get(cleaned);
      if (asset) return makeResponse(asset);
    }
    if (index) return makeResponse(index);
    return new Response('not found', { status: HTTP_STATUS.NOT_FOUND });
  });

  return app;
}
