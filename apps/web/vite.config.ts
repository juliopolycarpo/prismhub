import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const DASHBOARD_BASE = '/dashboard/';
const API_TARGET = process.env.PRISMHUB_API ?? 'http://127.0.0.1:3030';

/**
 * Redirects dev requests that land on `/` to `${DASHBOARD_BASE}` so the
 * routed SPA shell renders. Without this, Vite + `base` serves 404 at root.
 */
function rootRedirectPlugin(): Plugin {
  return {
    name: 'prismhub-root-redirect',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/' || req.url === '') {
          res.statusCode = 302;
          res.setHeader('location', DASHBOARD_BASE);
          res.end();
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  base: DASHBOARD_BASE,
  appType: 'spa',
  plugins: [react(), tailwindcss(), rootRedirectPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
});
