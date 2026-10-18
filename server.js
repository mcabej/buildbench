'use strict';
/* BuildBench server: serves the app and keeps prices fresh.
   node server.js            → http://127.0.0.1:8080
   PORT=3000 REFRESH_HOURS=3 HOST=0.0.0.0 node server.js */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { runUpdate, OUT_JSON } = require('./prices/update');

const PORT = +process.env.PORT || 8080;
const HOST = process.env.HOST || '127.0.0.1';
const REFRESH_HOURS = Math.max(1, +process.env.REFRESH_HOURS || 6);
const MANUAL_COOLDOWN_MS = 10 * 60 * 1000;

const STATIC = {
  '/': 'index.html', '/index.html': 'index.html', '/style.css': 'style.css',
  '/app.js': 'app.js', '/data.js': 'data.js', '/guide.js': 'guide.js', '/logic.js': 'logic.js',
  '/prices.js': 'prices.js', '/prices/retailers.js': 'prices/retailers.js',
};
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };

let refreshing = false;
let lastStart = 0;
let lastError = null;

const readPrices = () => { try { return JSON.parse(fs.readFileSync(OUT_JSON, 'utf8')); } catch { return null; } };
const ageHours = () => { const p = readPrices(); return p && p.updated ? (Date.now() - Date.parse(p.updated)) / 36e5 : Infinity; };

async function refresh(reason) {
  if (refreshing) return false;
  refreshing = true; lastStart = Date.now(); lastError = null;
  console.log(`[prices] refresh started (${reason})`);
  try {
    await runUpdate({ log: () => {} });
    console.log('[prices] refresh finished');
  } catch (e) { lastError = e.message; console.error('[prices] refresh failed:', e.message); }
  refreshing = false;
  return true;
}

const send = (res, code, body, type = 'application/json; charset=utf-8') => {
  res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  res.end(body);
};

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/prices' && req.method === 'GET') {
    const p = readPrices() || { updated: null, retailers: {}, prices: {} };
    return send(res, 200, JSON.stringify({ ...p, refreshing, refreshEveryHours: REFRESH_HOURS, lastError }));
  }
  if (url.pathname === '/api/refresh' && req.method === 'POST') {
    const local = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
    if (!local) return send(res, 403, '{"error":"manual refresh is only available from this machine"}');
    if (refreshing) return send(res, 202, '{"status":"already refreshing"}');
    if (Date.now() - lastStart < MANUAL_COOLDOWN_MS) return send(res, 429, '{"error":"refreshed recently — try again in a few minutes"}');
    refresh('manual');
    return send(res, 202, '{"status":"started"}');
  }
  const file = req.method === 'GET' && STATIC[url.pathname];
  if (!file) return send(res, 404, '{"error":"not found"}');
  fs.readFile(path.join(__dirname, file), (err, buf) => err ? send(res, 404, '{"error":"not found"}') : send(res, 200, buf, TYPES[path.extname(file)]));
}).listen(PORT, HOST, () => {
  console.log(`BuildBench on http://${HOST}:${PORT}  (prices refresh every ${REFRESH_HOURS} h)`);
  if (ageHours() > REFRESH_HOURS) refresh('startup — prices are stale');
  setInterval(() => { if (ageHours() > REFRESH_HOURS) refresh('scheduled'); }, 10 * 60 * 1000).unref?.();
});
