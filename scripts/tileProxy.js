/**
 * scripts/tileProxy.js
 *
 * Local tile proxy for Android emulator development.
 *
 * The Android emulator sometimes has broken DNS and cannot resolve external
 * hostnames. This proxy runs on the HOST machine and rewrites all
 * tiles.openfreemap.org URLs so the emulator can reach them via IP
 * (10.0.2.2 = host machine alias inside the Android emulator).
 *
 * Usage:
 *   npm run tile-proxy
 *
 * Then in CarteScreen.tsx the STYLE_* constants use http://10.0.2.2:7777
 * automatically when __DEV__ is true.
 */

const http  = require('http');
const https = require('https');
const url   = require('url');

const PORT            = 7777;
const UPSTREAM_HOST   = 'tiles.openfreemap.org';
const EMULATOR_ORIGIN = `http://10.0.2.2:${PORT}`;

function proxy(reqPath, res) {
  const options = {
    hostname: UPSTREAM_HOST,
    port: 443,
    path: reqPath,
    method: 'GET',
    headers: { 'Host': UPSTREAM_HOST, 'User-Agent': 'ProxiSportDevProxy/1.0' },
  };

  const upstream = https.request(options, (upRes) => {
    const contentType = upRes.headers['content-type'] || '';
    const isJson = contentType.includes('json');

    const headers = {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    };

    if (!isJson) {
      // Binary tile/sprite/font data — stream directly
      res.writeHead(upRes.statusCode, headers);
      upRes.pipe(res);
      return;
    }

    // JSON (style manifest) — rewrite all upstream URLs to go through proxy
    let body = '';
    upRes.on('data', chunk => { body += chunk; });
    upRes.on('end', () => {
      const rewritten = body.replace(
        /https:\/\/tiles\.openfreemap\.org/g,
        EMULATOR_ORIGIN,
      );
      res.writeHead(upRes.statusCode, headers);
      res.end(rewritten);
    });
  });

  upstream.on('error', (err) => {
    console.error(`[proxy] upstream error for ${reqPath}: ${err.message}`);
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end(`Upstream error: ${err.message}`);
  });

  upstream.end();
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*' });
    res.end();
    return;
  }

  const parsedPath = url.parse(req.url).path || '/';
  console.log(`[proxy] ${req.method} ${parsedPath}`);
  proxy(parsedPath, res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  MapLibre tile proxy ready');
  console.log(`  Listening on http://0.0.0.0:${PORT}`);
  console.log(`  Emulator style URL: ${EMULATOR_ORIGIN}/styles/bright`);
  console.log('');
});
