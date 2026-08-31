/**
 * server.js — Production server for PlayerRegistry Pro
 *
 * Serves the built static files from /dist and handles the
 * /api/proxy-download endpoint so file downloads work in production
 * (the Vite dev-server proxy plugin only runs during `npm run dev`).
 *
 * Usage:
 *   node server.js
 *   PORT=8080 node server.js
 */

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { URL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;
const DIST_DIR = path.join(__dirname, 'dist');

// MIME type map for static assets
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.pdf': 'application/pdf',
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname;

  // ─── Download Proxy ──────────────────────────────────────────────
  // Handle the root-hosted proxy endpoint.
  if (pathname.includes('/api/proxy-download')) {
    const targetUrl = parsedUrl.searchParams.get('url');

    if (!targetUrl) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      return res.end('Missing url parameter');
    }

    const filename = decodeURIComponent(targetUrl)
      .split('/')
      .pop()
      .split('?')[0] || 'download';

    https.get(targetUrl, (proxyRes) => {
      res.writeHead(200, {
        'Content-Type': proxyRes.headers['content-type'] || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      });
      proxyRes.pipe(res);
    }).on('error', (err) => {
      console.error('[proxy-download] Error:', err.message);
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end(`Proxy error: ${err.message}`);
    });

    return;
  }

  // ─── Static Files ────────────────────────────────────────────────
  let filePath = path.join(DIST_DIR, pathname);

  const serveFile = (fp) => {
    fs.readFile(fp, (err, data) => {
      if (err) {
        // SPA fallback — serve index.html for all unknown routes
        fs.readFile(path.join(DIST_DIR, 'index.html'), (err2, indexData) => {
          if (err2) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('Not found');
          }
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(indexData);
        });
        return;
      }
      const ext = path.extname(fp).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  };

  // If no extension, treat as SPA route → serve index.html
  if (!path.extname(filePath)) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  serveFile(filePath);
});

server.listen(PORT, () => {
  console.log(`\n✅ PlayerRegistry Pro production server running`);
  console.log(`   http://localhost:${PORT}/\n`);
});
