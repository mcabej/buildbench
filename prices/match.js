'use strict';
/* Decide whether a retailer listing title is the catalogue part (and not a bundle, refurb, prebuilt, accessory…). */

const NOISE = /refurb|open box|\bbundle\b|pre-?built|gaming pc|\b3xs\b|\bscan (gamer|view|sim)|\+ ?(amd|intel|ryzen|\d+gb|asus|msi|gigabyte|corsair)|with (an? )?(amd|intel|ryzen)|laptop|so-?dimm|\becc\b(?!.*non-ecc)|waterblock|water block|backplate|support bracket|riser|extension cable|\bsample\b/i;

function ramMatch(r, title) {
  const t = title.toLowerCase();
  if (!t.includes(r.type.toLowerCase())) return false;
  if (r.type === 'DDR4' && t.includes('ddr5')) return false;
  const kit = t.match(/(\d+) ?gb \((\d)x(\d+) ?gb\)/) || t.match(/()(\d)x(\d+) ?gb/);
  if (!kit) return false;
  if (`${kit[2]}x${kit[3]}` !== r.kit) return false;
  if (+kit[2] * +kit[3] !== r.cap) return false;
  if (!new RegExp('(?<!\\d)' + r.speed + '(?!\\d)').test(t)) return false;
  const cl = t.match(/\b(?:cas|cl|c)[ -]?(\d{2})\b/);
  if (cl && +cl[1] !== r.cl) return false;
  return true;
}

function matches(part, title) {
  if (NOISE.test(title)) return false;
  return part.ram ? ramMatch(part.ram, title) : part.re.test(title);
}

// Reject listings whose price is implausible next to our fallback (POA placeholders, accessories, wrong product).
function plausible(part, price, ref = part.fallback) {
  return price >= 5 && price < 99999 && price >= ref * 0.4 && price <= ref * 2.6;
}

module.exports = { matches, plausible, NOISE };
