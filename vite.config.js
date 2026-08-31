import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import https from 'https'
import { URL } from 'url'

function downloadProxyPlugin() {
  return {
    name: 'download-proxy-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url.startsWith('/api/proxy-download')) {
          const query = new URL(req.url, 'http://localhost').searchParams;
          const targetUrl = query.get('url');
          if (!targetUrl) {
            res.statusCode = 400;
            return res.end('URL is required');
          }

          https.get(targetUrl, (proxyRes) => {
            const filename = targetUrl.split('/').pop().split('?')[0] || 'download';
            res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'application/octet-stream');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            proxyRes.pipe(res);
          }).on('error', (e) => {
            res.statusCode = 500;
            res.end(e.message);
          });
          return;
        }
        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [react(), downloadProxyPlugin()],
    base: '/',
    assetsInclude: ['**/*.xlsx'],
  };
})
