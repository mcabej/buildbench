'use strict';
// Dump a retailer listing page: node tools/discover.js scan|awd <url> [pages]
const { politeGet, parseScan, parseAwd } = require('../prices/lib');
(async () => {
  const [kind, url, pages = '1'] = process.argv.slice(2);
  const parse = kind === 'scan' ? parseScan : parseAwd;
  for (let p = 1; p <= +pages; p++) {
    const u = p === 1 ? url : url + (url.includes('?') ? '&' : '?') + 'p=' + p;
    const items = parse(await politeGet(u));
    for (const i of items) console.log([i.price.toFixed(2), i.inStock ? 'IN ' : 'OUT', i.title].join(' | '));
    console.error(`page ${p}: ${items.length}`);
    if (!items.length) break;
  }
})().catch(e => { console.error(e.message); process.exit(1); });
