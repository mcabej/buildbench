'use strict';
// One-off: merge Scan prices captured by an earlier (interrupted) run's log into prices.json, and put Scan into back-off
// because the site began answering 403 after too many requests. Usage: node tools/seed-scan.js /tmp/update.log
const fs = require('fs');
const path = require('path');
const out = path.join(__dirname, '..', 'prices.json');
const data = JSON.parse(fs.readFileSync(out, 'utf8'));
const checked = fs.statSync(process.argv[2]).mtime.toISOString();
let n = 0;
for (const line of fs.readFileSync(process.argv[2], 'utf8').split('\n')) {
  const m = line.match(/^scan\s+(\S+)\s+£([\d.]+) (in stock|OUT)/);
  if (!m) continue;
  data.prices[m[1]] = data.prices[m[1]] || {};
  data.prices[m[1]].scan = { price: parseFloat(m[2]), url: null, inStock: m[3] === 'in stock', title: 'Scan search result (seeded)', checked };
  n++;
}
data.retailers.scan = { matched: n, error: 'HTTP 403 from scan.co.uk after too many requests', strikes: 1, blockedUntil: new Date(Date.now() + 6 * 36e5).toISOString(), lastRun: checked };
fs.writeFileSync(out, JSON.stringify(data, null, 1));
fs.writeFileSync(path.join(__dirname, '..', 'prices.js'), 'window.PRICES = ' + JSON.stringify(data) + ';\n');
console.log('seeded', n, 'Scan prices');
