'use strict';
/* Polite fetching + robots.txt compliance + listing parsers for the retailers we can read legitimately. */

const UA = 'Mozilla/5.0 (X11; Linux x86_64) BuildBenchPriceBot/1.0 (personal price tracker; low rate)';
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---- robots.txt (Google-style: longest matching rule wins, Allow beats Disallow on ties, * wildcards, $ anchors) ---- */
const robotsCache = new Map();
function ruleToRegex(rule) {
  const esc = rule.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp('^' + esc.replace(/\\\$$/, '$'));
}
function parseRobots(text) {
  const rules = [];
  let applies = false, prevAgent = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === 'user-agent') {
      applies = (prevAgent && applies) || v === '*';
      prevAgent = true;
      continue;
    }
    prevAgent = false;
    if (applies && (k === 'allow' || k === 'disallow') && v) {
      rules.push({ allow: k === 'allow', len: v.length, re: ruleToRegex(v) });
    }
  }
  return rules;
}
async function robotsAllows(url) {
  const u = new URL(url);
  let rules = robotsCache.get(u.origin);
  if (!rules) {
    try {
      const res = await fetch(u.origin + '/robots.txt', { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(15000) });
      const text = await res.text();
      // A Cloudflare challenge page is not a robots file: refuse rather than guess.
      if (!res.ok || /<html/i.test(text)) throw new Error('robots.txt unreadable (' + res.status + ')');
      rules = parseRobots(text);
    } catch (e) {
      throw new Error(`cannot confirm robots.txt for ${u.origin}: ${e.message}`);
    }
    robotsCache.set(u.origin, rules);
  }
  const target = u.pathname + u.search;
  let best = null;
  for (const r of rules) if (r.re.test(target) && (!best || r.len > best.len || (r.len === best.len && r.allow))) best = r;
  return !best || best.allow;
}

const lastHit = new Map();
async function politeGet(url, { delayMs = 1500 } = {}) {
  if (!(await robotsAllows(url))) throw new Error('blocked by robots.txt: ' + url);
  const host = new URL(url).host;
  const wait = (lastHit.get(host) || 0) + delayMs - Date.now();
  if (wait > 0) await sleep(wait);
  lastHit.set(host, Date.now());
  const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html' }, signal: AbortSignal.timeout(30000), redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

/* ---- parsers ---- */
const decode = s => s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/™|®/g, '');

// Scan: <li class="product" data-description="…" data-price="338.99" …> … data-instock="1" …
function parseScan(html) {
  const out = [];
  const re = /<li class="[^"]*\bproduct\b[^"]*" data-description="([^"]*)"[^>]*?data-price="([\d.]+)"[^>]*>/g;
  let m;
  while ((m = re.exec(html))) {
    const chunk = html.slice(m.index, m.index + 14000);
    const next = chunk.indexOf('<li class="', 20);
    const body = next > 0 ? chunk.slice(0, next) : chunk;
    const href = (body.match(/href="(\/products\/[^"#]+)"/) || [])[1];
    const stock = (body.match(/data-instock="(\d)"/) || [])[1];
    out.push({ title: decode(m[1]), price: parseFloat(m[2]), url: href ? 'https://www.scan.co.uk' + href : null, inStock: stock === '1' });
  }
  return out;
}

// AWD-IT (Magento) category listing: <li class="item product product-item"> … product-item-link … data-price-amount (inc. VAT) …
// (the home-page style widgets use different markup and are deliberately ignored)
function parseAwd(html) {
  const out = [];
  for (const chunk of html.split('<li class="item product product-item">').slice(1)) {
    const body = chunk.slice(0, 9000);
    const link = body.match(/class="product-item-link"\s+href="([^"]+)"\s*>\s*([^<]+?)\s*<\/a>/);
    const price = body.match(/data-label="Incl\.(?:&#x20;|\s)Tax"\s+data-price-amount="([\d.]+)"/);
    const stock = (body.match(/class="stock-status ([a-z-]+)"/) || [])[1];
    if (link && price) out.push({ title: decode(link[2]).trim(), price: parseFloat(price[1]), url: link[1], inStock: stock === 'available' });
  }
  return out;
}

module.exports = { UA, sleep, politeGet, robotsAllows, parseRobots, parseScan, parseAwd };
