'use strict';
/* Refresh prices.json / prices.js from the retailers we can read legitimately.
   Usage: node prices/update.js [--only=cpu,gpu] [--dry]   (also imported by server.js)

   Politeness rules (learned the hard way: ~70 searches in 6 minutes got us a 403 from Scan):
   - read whole category listing pages, never one search per part  (~10 requests per retailer per run)
   - one request every few seconds per retailer, robots.txt honoured
   - on 403/429/503 stop talking to that retailer and back off for hours (doubling on repeated blocks) */
const fs = require('fs');
const path = require('path');
const DATA = require('../data');
const { politeGet, parseScan, parseAwd } = require('./lib');
const { matches, plausible } = require('./match');

const ROOT = path.join(__dirname, '..');
const OUT_JSON = path.join(ROOT, 'prices.json');
const OUT_JS = path.join(ROOT, 'prices.js');
const MANUAL = path.join(__dirname, 'manual.json');
const HOUR = 36e5;

const SOURCES = {
  scan: {
    base: 'https://www.scan.co.uk/', delayMs: 8000, maxPages: 1, parse: parseScan,
    cats: {
      cpu: ['shop/computer-hardware/cpu-amd/all'],
      mb: ['shop/computer-hardware/motherboards-amd/all'],
      ram: ['shop/computer-hardware/memory-ram/all'],
      gpu: ['shop/computer-hardware/gpu-amd/all', 'shop/computer-hardware/gpu-nvidia-gaming/all'],
      psu: ['shop/computer-hardware/power-supplies/all'],
      case: ['shop/computer-hardware/cases/all'],
      cooler: ['shop/computer-hardware/cooling-air/all'],
      storage: [],
    },
  },
  awd: {
    base: 'https://www.awd-it.co.uk/', delayMs: 5000, maxPages: 4, parse: parseAwd, pageParam: 'p',
    cats: {
      cpu: ['components/cpu-processors/amd-cpu.html'],
      mb: ['components/motherboards/am4-motherboards.html', 'components/motherboards/am5-motherboards.html'],
      ram: ['components/memory.html'],
      gpu: ['components/graphics-cards/nvidia.html', 'components/graphics-cards/radeon.html'],
      storage: ['components/solid-state-drives-ssd.html', 'components/hard-disk-drives.html'],
      cooler: ['components/cooling-silencing/cpu-coolers.html', 'components/water-cooling/complete-kits.html'],
      psu: ['components/power-supplies.html'],
      case: ['components/cases.html'],
    },
  },
};

class Blocked extends Error {}
const cheapest = list => [...list].sort((a, b) => (b.inStock - a.inStock) || (a.price - b.price))[0];

async function readListing(src, urls, log) {
  const items = [];
  const seen = new Set();
  for (const u of urls) {
    for (let p = 1; p <= src.maxPages; p++) {
      const url = src.base + u + (p > 1 ? `?${src.pageParam}=${p}` : '');
      let page;
      try { page = src.parse(await politeGet(url, { delayMs: src.delayMs })); }
      catch (e) {
        if (/HTTP (403|429|503)/.test(e.message)) throw new Blocked(e.message);
        if (p === 1) throw e;
        break;
      }
      const fresh = page.filter(i => i.url && !seen.has(i.url));
      fresh.forEach(i => seen.add(i.url));
      items.push(...fresh);
      if (!fresh.length) break;
    }
  }
  log(`  ${urls[0].split('/')[2] || urls[0]}: ${items.length} listings`);
  return items;
}

async function runUpdate({ only, log = console.log } = {}) {
  const prev = fs.existsSync(OUT_JSON) ? JSON.parse(fs.readFileSync(OUT_JSON, 'utf8')) : {};
  const out = { updated: null, retailers: { ...(prev.retailers || {}) }, prices: JSON.parse(JSON.stringify(prev.prices || {})), known: { ...(prev.known || {}) } };
  const cats = DATA.categories.map(c => c.id).filter(c => !only || only.includes(c));
  const now = new Date().toISOString();

  const only_r = (process.argv.find(a => a.startsWith('--retailers=')) || '').slice(12).split(',').filter(Boolean);
  for (const [rid, src] of Object.entries(SOURCES)) {
    if (only_r.length && !only_r.includes(rid)) continue;
    const st = (out.retailers[rid] = { matched: 0, error: null, strikes: 0, ...out.retailers[rid] });
    if (st.blockedUntil && Date.now() < Date.parse(st.blockedUntil)) { log(`${rid}: backing off until ${st.blockedUntil}`); continue; }
    let blocked = false;
    st.matched = 0; st.error = null;
    for (const cat of cats) {
      if (blocked) break;
      if (!src.cats[cat] || !src.cats[cat].length) continue;
      let listing;
      try { listing = await readListing(src, src.cats[cat], log); }
      catch (e) {
        st.error = e.message;
        if (e instanceof Blocked) {
          st.strikes = (st.strikes || 0) + 1;
          st.blockedUntil = new Date(Date.now() + Math.min(48, 6 * 2 ** (st.strikes - 1)) * HOUR).toISOString();
          log(`${rid}: BLOCKED (${e.message}) — backing off until ${st.blockedUntil}`);
          blocked = true;
        } else log(`${rid} ${cat}: ${e.message}`);
        continue;
      }
      for (const part of DATA.parts[cat]) {
        const ref = (out.known[part.id] || {}).price || part.fallback;
        const hits = listing.filter(i => matches(part, i.title) && plausible(part, i.price, ref));
        const offer = hits.length ? cheapest(hits) : null;
        out.prices[part.id] = out.prices[part.id] || {};
        if (offer) { out.prices[part.id][rid] = { price: offer.price, url: offer.url, inStock: offer.inStock, title: offer.title, checked: now }; st.matched++; }
        else delete out.prices[part.id][rid];
        log(`${rid.padEnd(5)} ${part.id.padEnd(22)} ${offer ? '£' + offer.price.toFixed(2) + (offer.inStock ? ' in stock' : ' OUT') : '— not found'}`);
      }
    }
    if (!blocked) { st.strikes = 0; st.blockedUntil = null; }
    st.lastRun = now;
  }

  // manual entries for retailers without a legitimate feed (prices/manual.json)
  if (fs.existsSync(MANUAL)) {
    try {
      const manual = JSON.parse(fs.readFileSync(MANUAL, 'utf8'));
      for (const [pid, byR] of Object.entries(manual)) for (const [rid, o] of Object.entries(byR)) {
        if (!DATA.byId[pid] || !(o.price > 0)) continue;
        out.prices[pid] = out.prices[pid] || {};
        out.prices[pid][rid] = { price: o.price, url: o.url || null, inStock: o.inStock !== false, title: 'manual entry', checked: o.checked || now, manual: true };
      }
    } catch (e) { log('manual.json ignored: ' + e.message); }
  }

  // remember the last live price per part so the UI can still show a realistic figure if every retailer drops it
  for (const [pid, byR] of Object.entries(out.prices)) {
    const list = Object.values(byR).filter(o => o.price > 0 && !o.manual);
    if (list.length) { const best = cheapest(list); out.known[pid] = { price: best.price, at: best.checked }; }
  }
  out.updated = now;
  if (!process.argv.includes('--dry')) {
    fs.writeFileSync(OUT_JSON, JSON.stringify(out, null, 1));
    fs.writeFileSync(OUT_JS, 'window.PRICES = ' + JSON.stringify(out) + ';\n');
  }
  return out;
}

module.exports = { runUpdate, OUT_JSON, SOURCES };

if (require.main === module) {
  const only = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
  runUpdate({ only: only.length ? only : undefined })
    .then(o => console.log('\nDone.', JSON.stringify(o.retailers)))
    .catch(e => { console.error(e); process.exit(1); });
}
