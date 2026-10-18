(function () {
  const { categories: CATS, parts: PARTS, presets: PRESETS, byId } = window.DATA;
  const { articles: ARTICLES, glossary: GLOSSARY } = window.GUIDE;
  const { check, fmtCap } = window.Logic;

  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const GBP = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });
  const money = n => GBP.format(n);
  const catOf = id => CATS.find(c => c.id === id);
  const SLOT_ORDER = ['cpu', 'mb', 'ram', 'gpu', 'storage', 'cooler', 'psu', 'case'];

  /* ---------- live prices ---------- */
  const RETAILERS = window.RETAILERS;
  const retailer = id => RETAILERS.find(r => r.id === id);
  const STALE_MS = 48 * 36e5;
  let priceMeta = { updated: null, retailers: {}, refreshing: false, api: false, everyHours: null, error: null };

  const ago = iso => {
    if (!iso) return 'never';
    const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 6e4));
    return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 2880 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`;
  };
  const isStale = o => Date.now() - Date.parse(o.checked) > STALE_MS;

  // Each part gets the cheapest in-stock live offer (else cheapest out-of-stock one, else its fallback estimate).
  function applyPrices(data) {
    if (!data) return;
    priceMeta = { ...priceMeta, updated: data.updated, retailers: data.retailers || {} };
    for (const c of CATS) for (const p of PARTS[c.id]) {
      const offers = (data.prices && data.prices[p.id]) || {};
      const list = Object.entries(offers).filter(([, o]) => o.price > 0).map(([rid, o]) => ({ rid, ...o }));
      list.sort((a, b) => (b.inStock - a.inStock) || (a.price - b.price));
      p.offers = offers;
      if (list.length) { p.price = list[0].price; p.best = list[0]; p.priceState = 'live'; }
      else if (data.known && data.known[p.id]) { p.price = data.known[p.id].price; p.best = null; p.priceState = 'known'; p.knownAt = data.known[p.id].at; }
      else { p.price = p.fallback; p.best = null; p.priceState = 'est'; }
    }
  }
  const priceNote = p => !p.best
    ? (p.priceState === 'known'
      ? `<span class="src est" title="No retailer we can read lists this part right now">last seen ${esc(ago(p.knownAt))} · no live listing</span>`
      : '<span class="src est" title="No retailer we can read lists this part right now — this is a rough estimate">est. · no live listing</span>')
    : `<span class="src ${p.best.inStock ? 'ok' : 'oos'}${isStale(p.best) ? ' stale' : ''}">${esc(retailer(p.best.rid).name)} · ${p.best.inStock ? 'in stock' : 'out of stock'}${isStale(p.best) ? ' · old price' : ''}</span>`;

  function offersTable(p) {
    const rows = RETAILERS.map(r => {
      const o = p.offers && p.offers[r.id];
      const q = p.q || p.name;
      if (o) return `<tr><td>${esc(r.name)}</td><td class="num">${money(o.price)}</td><td>${o.inStock ? '<span class="badge ok">in stock</span>' : '<span class="badge bad">out of stock</span>'}</td><td class="muted">${esc(ago(o.checked))}${o.manual ? ' (manual)' : ''}</td><td>${o.url ? `<a href="${esc(o.url)}" target="_blank" rel="noopener noreferrer">View ↗</a>` : ''}</td></tr>`;
      return `<tr><td>${esc(r.name)}</td><td colspan="3" class="muted">${r.live ? 'not listed / not matched' : 'no automatic feed — ' + esc(r.why)}</td><td><a href="${esc(r.search(q))}" target="_blank" rel="noopener noreferrer">Check ↗</a></td></tr>`;
    }).join('');
    return `<table class="offers"><thead><tr><th>Retailer</th><th>Price</th><th>Stock</th><th>Checked</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  function basketByRetailer(parts) {
    return RETAILERS.filter(r => r.live || parts.some(p => p.offers && p.offers[r.id])).map(r => {
      let total = 0, have = 0, oos = 0;
      for (const p of parts) { const o = p.offers && p.offers[r.id]; if (o) { total += o.price; have++; if (!o.inStock) oos++; } }
      return { r, total, have, oos, of: parts.length };
    }).filter(b => b.have);
  }

  function renderPriceBar() {
    const live = RETAILERS.filter(r => r.live).map(r => r.name).join(' + ');
    const bar = $('#price-bar');
    const st = priceMeta.updated ? `updated ${ago(priceMeta.updated)}` : 'no price snapshot yet';
    bar.innerHTML = `<span><b>GBP, inc. VAT.</b> Live prices from ${esc(live)} · ${priceMeta.refreshing ? 'refreshing now…' : esc(st)}${priceMeta.api ? ` · auto-refresh every ${priceMeta.everyHours} h` : ' · <em>static snapshot — run <code>node server.js</code> for automatic updates</em>'}</span>
      ${priceMeta.api ? `<button class="btn btn-sm" data-act="refresh-prices" ${priceMeta.refreshing ? 'disabled' : ''}>Refresh now</button>` : ''}
      <button class="btn btn-sm" data-act="price-info">About prices</button>`;
  }

  function rerenderAll() {
    renderPriceBar(); renderPresets(); renderBuilder();
    if (tab === 'library') renderLibrary();
  }
  async function pollPrices() {
    try {
      const res = await fetch('/api/prices', { cache: 'no-store' });
      if (!res.ok) throw new Error(res.status);
      const d = await res.json();
      priceMeta.api = true; priceMeta.refreshing = !!d.refreshing; priceMeta.everyHours = d.refreshEveryHours; priceMeta.error = d.lastError;
      if (d.updated !== priceMeta.updated) applyPrices(d);
      rerenderAll();
      if (d.refreshing) setTimeout(pollPrices, 15000);
    } catch { priceMeta.api = false; renderPriceBar(); }
  }

  /* ---------- spec rows ---------- */
  // l: label, g: display, v: sort value, t: show in library table, s: show in short spec line
  const ROWS = {
    cpu: [
      { l: 'Socket', g: p => p.socket, t: 1, s: 1 },
      { l: 'Cores / threads', g: p => `${p.cores}C/${p.threads}T`, v: p => p.cores, t: 1, s: 1 },
      { l: 'Boost clock', g: p => p.boost + ' GHz', v: p => p.boost, t: 1, s: 1 },
      { l: 'Base clock', g: p => p.base + ' GHz', v: p => p.base },
      { l: 'L3 cache', g: p => p.l3 + ' MB', v: p => p.l3, t: 1 },
      { l: 'Rated TDP', g: p => p.tdp + ' W', v: p => p.tdp },
      { l: 'Peak power', g: p => p.power + ' W', v: p => p.power, t: 1, s: 1 },
      { l: 'Memory', g: p => p.mem.join(' / '), t: 1 },
      { l: 'CPU PCIe', g: p => 'PCIe ' + p.pcie + '.0', v: p => p.pcie },
      { l: 'Integrated GPU', g: p => (p.igpu ? 'Yes' : 'No'), t: 1 },
      { l: 'Unlocked', g: p => (p.unlocked ? 'Yes' : 'No') },
      { l: 'Stock cooler', g: p => (p.stock ? 'Included' : 'Not included') },
      { l: 'Gaming tier', g: p => p.perf + ' / 100', v: p => p.perf, t: 1 },
    ],
    mb: [
      { l: 'Socket', g: p => p.socket, t: 1, s: 1 },
      { l: 'Chipset', g: p => p.chipset, t: 1, s: 1 },
      { l: 'Form factor', g: p => p.form, t: 1, s: 1 },
      { l: 'Memory', g: p => `${p.mem} ×${p.slots}`, t: 1, s: 1 },
      { l: 'Max RAM', g: p => p.maxRam + ' GB', v: p => p.maxRam },
      { l: 'M.2 slots', g: p => `${p.m2} (Gen${p.m2Gen})`, v: p => p.m2, t: 1, s: 1 },
      { l: 'SATA ports', g: p => p.sata, v: p => p.sata },
      { l: 'GPU slot', g: p => `PCIe ${p.pcie}.0 x16`, v: p => p.pcie },
      { l: 'Wi-Fi', g: p => (p.wifi ? 'Yes' : 'No'), t: 1 },
      { l: 'CPU overclocking', g: p => (p.oc ? 'Yes' : 'No') },
    ],
    ram: [
      { l: 'Type', g: p => p.type, t: 1, s: 1 },
      { l: 'Capacity', g: p => `${p.capacity} GB`, v: p => p.capacity, t: 1, s: 1 },
      { l: 'Sticks', g: p => `${p.sticks}×${p.capacity / p.sticks} GB`, v: p => p.sticks, t: 1, s: 1 },
      { l: 'Speed', g: p => `${p.speed} MT/s`, v: p => p.speed, t: 1, s: 1 },
      { l: 'CAS latency', g: p => 'CL' + p.cl, v: p => p.cl, t: 1, s: 1 },
      { l: 'True latency', g: p => (p.cl * 2000 / p.speed).toFixed(1) + ' ns', v: p => p.cl * 2000 / p.speed, t: 1 },
      { l: 'Profile', g: p => p.profile, t: 1 },
      { l: 'Height', g: p => p.height + ' mm', v: p => p.height },
    ],
    gpu: [
      { l: 'VRAM', g: p => p.vram + ' GB', v: p => p.vram, t: 1, s: 1 },
      { l: 'Board power', g: p => p.tdp + ' W', v: p => p.tdp, t: 1, s: 1 },
      { l: 'Length', g: p => p.length + ' mm', v: p => p.length, t: 1, s: 1 },
      { l: 'Thickness', g: p => p.slots + ' slot', v: p => p.slots, t: 1 },
      { l: 'Power connector', g: p => (p.conn.type === '8pin' ? `${p.conn.n}× 8-pin` : '16-pin 12V-2x6'), t: 1, s: 1 },
      { l: 'Recommended PSU', g: p => p.rec + ' W', v: p => p.rec, t: 1 },
      { l: 'PCIe link', g: p => 'x' + p.lanes, v: p => p.lanes },
      { l: 'Gaming tier', g: p => p.perf + ' / 100', v: p => p.perf, t: 1 },
    ],
    storage: [
      { l: 'Capacity', g: p => fmtCap(p.capacity), v: p => p.capacity, t: 1, s: 1 },
      { l: 'Interface', g: p => (p.iface === 'm2' ? `NVMe Gen${p.gen}` : p.nand === 'HDD' ? 'SATA HDD' : 'SATA SSD'), t: 1, s: 1 },
      { l: 'Form', g: p => p.form, t: 1 },
      { l: 'Speed', g: p => p.speed.toLocaleString() + ' MB/s', v: p => p.speed, t: 1, s: 1 },
      { l: 'NAND', g: p => p.nand, t: 1 },
      { l: 'DRAM cache', g: p => (p.nand === 'HDD' ? 'n/a' : p.dram ? 'Yes' : 'No'), t: 1 },
    ],
    cooler: [
      { l: 'Type', g: p => p.type, t: 1, s: 1 },
      { l: 'Size', g: p => (p.type === 'Air' ? `${p.height} mm tall` : `${p.rad} mm radiator`), v: p => p.height || p.rad, t: 1, s: 1 },
      { l: 'Rated for', g: p => p.rating + ' W', v: p => p.rating, t: 1, s: 1 },
      { l: 'Noise', g: p => p.noise, t: 1 },
      { l: 'Sockets', g: p => p.sockets.join(', ') },
    ],
    psu: [
      { l: 'Wattage', g: p => p.watts + ' W', v: p => p.watts, t: 1, s: 1 },
      { l: 'Efficiency', g: p => '80+ ' + p.eff, t: 1, s: 1 },
      { l: 'Modularity', g: p => p.modular, t: 1 },
      { l: 'Form factor', g: p => p.form, t: 1, s: 1 },
      { l: '16-pin cable', g: p => (p.native12v ? 'Native' : 'Adapter only'), t: 1 },
      { l: '8-pin PCIe cables', g: p => p.pcie8, v: p => p.pcie8, t: 1 },
    ],
    case: [
      { l: 'Motherboards', g: p => p.forms.join(' / '), t: 1, s: 1 },
      { l: 'Max GPU length', g: p => p.maxGpu + ' mm', v: p => p.maxGpu, t: 1, s: 1 },
      { l: 'Max GPU thickness', g: p => p.maxGpuSlots + ' slot', v: p => p.maxGpuSlots },
      { l: 'Max cooler height', g: p => p.maxCooler + ' mm', v: p => p.maxCooler, t: 1, s: 1 },
      { l: 'Max radiator', g: p => (p.radMax ? p.radMax + ' mm' : 'None'), v: p => p.radMax, t: 1 },
      { l: 'PSU type', g: p => p.psuForms.join(' / '), t: 1 },
      { l: 'Fans included', g: p => p.fans, v: p => p.fans, t: 1 },
      { l: 'Drive bays', g: p => `${p.bays35}× 3.5" · ${p.bays25}× 2.5"` },
    ],
  };
  const specLine = p => ROWS[p.cat].filter(r => r.s).map(r => r.g(p)).join(' · ');

  /* ---------- state ---------- */
  const emptyBuild = () => ({ cpu: null, mb: null, ram: null, gpu: null, cooler: null, psu: null, case: null, storage: [] });
  let build = emptyBuild();
  let tab = 'builder';
  let lib = { cat: 'cpu', q: '', key: null, dir: 1 };
  let picker = null;

  const resolve = b => {
    const r = { storage: b.storage.map(id => byId[id]).filter(Boolean) };
    for (const k of SLOT_ORDER) if (k !== 'storage') r[k] = b[k] ? byId[b[k]] || null : null;
    return r;
  };
  const buildIds = () => [...SLOT_ORDER.filter(k => k !== 'storage').map(k => build[k]), ...build.storage].filter(Boolean);
  const loadIds = ids => {
    build = emptyBuild();
    for (const id of ids) {
      const p = byId[id];
      if (!p) continue;
      if (p.cat === 'storage') build.storage.push(id);
      else build[p.cat] = id;
    }
    persist();
  };
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };
  const persist = () => store.set('buildbench.current', buildIds());

  /* ---------- UI helpers ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }
  let lastFocus = null;
  function openModal(html, narrow = false) {
    lastFocus = document.activeElement;
    const box = $('#modal-box');
    box.className = 'modal' + (narrow ? ' narrow' : '');
    box.innerHTML = html;
    $('#modal').hidden = false;
    document.body.style.overflow = 'hidden';
    const f = box.querySelector('input,button.btn-primary,button');
    if (f) f.focus();
  }
  function closeModal() {
    $('#modal').hidden = true;
    document.body.style.overflow = '';
    picker = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  async function copyText(text, msg) {
    try { await navigator.clipboard.writeText(text); toast(msg); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast(msg); } catch { toast('Copy failed'); }
      ta.remove();
    }
  }

  /* ---------- builder ---------- */
  function slotIssueLevel(res, cat) {
    const rel = res.issues.filter(i => i.cats.includes(cat));
    return rel.some(i => i.sev === 'error') ? 'error' : rel.some(i => i.sev === 'warn') ? 'warn' : '';
  }

  function renderPresets() {
    $('#presets').innerHTML = PRESETS.map(p => `
      <button class="preset" data-act="preset" data-id="${p.id}">
        <div class="p-name"><span>${esc(p.name)}</span><span class="p-tag">${money(p.parts.reduce((t, id) => t + (byId[id] ? byId[id].price : 0), 0))}</span></div>
        <div class="p-blurb">${esc(p.blurb)}</div>
      </button>`).join('');
  }

  function renderSlots(res) {
    const r = resolve(build);
    $('#slots').innerHTML = SLOT_ORDER.map(cat => {
      const c = catOf(cat);
      const lvl = slotIssueLevel(res, cat);
      const flag = lvl ? `<span class="flag ${lvl}" title="${lvl === 'error' ? 'Problem' : 'Warning'} — see the panel"></span>` : '';
      if (cat === 'storage') {
        const rows = r.storage.map((p, i) => `
          <div class="drive">
            <div><div class="slot-name">${esc(p.name)}</div><div class="slot-specs">${esc(specLine(p))}</div></div>
            <div class="slot-actions"><span class="slot-price">${money(p.price)}</span>${priceNote(p)}
              <div class="slot-btns"><button class="btn btn-sm" data-act="detail" data-id="${p.id}">Info</button><button class="btn btn-sm btn-danger" data-act="remove" data-cat="storage" data-idx="${i}" aria-label="Remove ${esc(p.name)}">Remove</button></div></div>
          </div>`).join('');
        return `<div class="slot ${lvl ? 'has-' + lvl : ''}">
          <div class="slot-badge">${c.short}</div>
          <div><div class="slot-label">${flag}${c.label}${r.storage.length ? ` · ${r.storage.length}` : ''}</div>
            ${rows || '<div class="slot-empty">No drives chosen</div>'}</div>
          <div class="slot-actions"><button class="btn ${r.storage.length ? '' : 'btn-primary'} btn-sm" data-act="pick" data-cat="storage">${r.storage.length ? 'Add drive' : 'Choose'}</button></div>
        </div>`;
      }
      const p = r[cat];
      return `<div class="slot ${lvl ? 'has-' + lvl : ''}">
        <div class="slot-badge">${c.short}</div>
        <div>
          <div class="slot-label">${flag}${c.label}</div>
          ${p ? `<div class="slot-name">${esc(p.name)}</div><div class="slot-specs">${esc(specLine(p))}</div>`
              : `<div class="slot-empty">${cat === 'cooler' && r.cpu && r.cpu.stock ? 'Optional — CPU includes a cooler' : cat === 'gpu' && r.cpu && r.cpu.igpu ? 'Optional — CPU has integrated graphics' : 'Nothing chosen yet'}</div>`}
        </div>
        <div class="slot-actions">
          ${p ? `<span class="slot-price">${money(p.price)}</span>${priceNote(p)}
            <div class="slot-btns"><button class="btn btn-sm" data-act="detail" data-id="${p.id}">Info</button><button class="btn btn-sm" data-act="pick" data-cat="${cat}">Change</button><button class="btn btn-sm btn-danger" data-act="remove" data-cat="${cat}" aria-label="Remove ${esc(p.name)}">✕</button></div>`
            : `<button class="btn btn-primary btn-sm" data-act="pick" data-cat="${cat}">Choose</button>`}
        </div>
      </div>`;
    }).join('');
  }

  const ICON = { error: '!', warn: '!', info: 'i' };
  function basketCard() {
    const r = resolve(build);
    const parts = [...SLOT_ORDER.filter(k => k !== 'storage').map(k => r[k]), ...r.storage].filter(Boolean);
    if (!parts.length) return '';
    const baskets = basketByRetailer(parts);
    const full = baskets.filter(b => b.have === b.of);
    const best = full.length ? full.reduce((a, b) => (b.total < a.total ? b : a)) : null;
    return `<div class="card"><h3>Basket by retailer</h3>
      ${baskets.length ? baskets.map(b => `<div class="basket-row ${best && b === best ? 'best' : ''}"><span>${esc(b.r.name)}</span><span class="muted">${b.have}/${b.of} parts${b.oos ? ` · ${b.oos} out of stock` : ''}</span><b>${money(b.total)}</b></div>`).join('') : '<div class="balance-note">No live prices for these parts yet.</div>'}
      <div class="balance-note">${best ? `Cheapest single-retailer basket: <b>${esc(best.r.name)}</b>. ` : 'No single retailer stocks every part. '}The total above uses the cheapest in-stock offer per part, so it may mean buying from more than one shop.</div></div>`;
  }

  function renderSummary(res) {
    const { power, balance, progress, summary, issues } = res;
    const counts = { error: 0, warn: 0, info: 0 };
    issues.forEach(i => counts[i.sev]++);
    const pct = Math.round(progress.done / progress.of * 100);
    const usable = power.psu || power.rec || 1;
    const scale = Math.max(power.rec, power.psu, power.est, 1) * 1.05;
    const fillCls = power.psu && power.psu < power.est ? 'error' : power.psu && power.psu < power.rec ? 'warn' : '';
    const complete = progress.done === progress.of;

    let verdict = '';
    if (balance) {
      verdict = { balanced: 'CPU and GPU are well matched.', 'cpu-limited': 'GPU is much stronger than the CPU — expect CPU limits at 1080p.', 'gpu-limited': 'CPU outclasses the GPU — shift budget to graphics.' }[balance.verdict];
    }

    $('#summary').innerHTML = `
      <div class="card">
        <h3>Total</h3>
        <div class="total">${money(res.total)}</div>
        <div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>
        <div class="meter-legend"><span>${progress.done}/${progress.of} essential parts</span><span>${complete ? 'complete' : 'missing: ' + progress.missing.map(k => catOf(k).short).join(', ')}</span></div>
      </div>
      <div class="card">
        <h3>At a glance</h3>
        <div class="stat-grid">
          <div class="stat"><span>CPU</span><b>${esc(summary.cores)}</b></div>
          <div class="stat"><span>Memory</span><b>${esc(summary.ram)}</b></div>
          <div class="stat"><span>Video memory</span><b>${esc(summary.vram)}</b></div>
          <div class="stat"><span>Storage</span><b>${esc(summary.storage)}</b></div>
        </div>
      </div>
      <div class="card">
        <h3>Power</h3>
        ${power.est ? `
          <div class="meter" title="Estimated peak load vs PSU rating">
            <div class="fill ${fillCls}" style="width:${Math.min(100, power.est / scale * 100)}%"></div>
          </div>
          <div class="meter-legend"><span>Peak load ≈ ${power.est} W</span><span>PSU: ${power.psu ? power.psu + ' W' : '—'}</span></div>
          <div class="balance-note">Recommended PSU: <b>${power.rec} W</b> or more. ${power.psu ? `Load is ~${Math.round(power.est / usable * 100)}% of your PSU at peak.` : ''}</div>`
          : '<div class="balance-note">Pick a CPU and graphics card to estimate power draw.</div>'}
      </div>
      <div class="card">
        <h3>CPU / GPU balance</h3>
        ${balance ? `
          <div class="bar-row"><span>CPU</span><div class="bar"><i style="width:${balance.cpu}%"></i></div><b>${balance.cpu}</b></div>
          <div class="bar-row"><span>GPU</span><div class="bar gpu"><i style="width:${balance.gpu}%"></i></div><b>${balance.gpu}</b></div>
          <div class="balance-note">${verdict}</div>`
          : '<div class="balance-note">Choose a CPU and a graphics card to compare their gaming tiers.</div>'}
      </div>
      ${basketCard()}
      <div class="card">
        <h3>Compatibility &amp; tips</h3>
        <div class="issues-count"><span class="count error">${counts.error} problem${counts.error === 1 ? '' : 's'}</span><span class="count warn">${counts.warn} warning${counts.warn === 1 ? '' : 's'}</span><span class="count info">${counts.info} note${counts.info === 1 ? '' : 's'}</span></div>
        ${!counts.error && complete ? '<div class="all-good">✓ No compatibility problems found.</div>' : ''}
        ${!issues.length && !complete ? '<div class="balance-note">Add parts and issues will show up here.</div>' : ''}
        ${issues.map(i => `<div class="issue ${i.sev}"><span class="ic">${ICON[i.sev]}</span><div><div class="issue-title">${esc(i.title)}</div><div class="issue-detail">${esc(i.detail)}</div></div></div>`).join('')}
      </div>`;
  }

  function renderBuilder() {
    const res = check(resolve(build));
    renderSlots(res);
    renderSummary(res);
    $('#top-total').innerHTML = `<b>${money(res.total)}</b> · ${res.power.est ? '~' + res.power.est + ' W' : '— W'}`;
    return res;
  }
  const update = () => { persist(); renderBuilder(); };

  /* ---------- picker ---------- */
  function withPart(cat, p) {
    const r = resolve(build);
    if (cat === 'storage') r.storage = [...r.storage, p]; else r[cat] = p;
    return r;
  }
  function incompat(cat, p) {
    const hard = check(withPart(cat, p)).issues.find(i => i.hard && i.cats.includes(cat));
    return hard ? hard.title : null;
  }

  function openPicker(cat) {
    picker = { cat, q: '', sort: 'price-asc', hide: true, stock: false, open: new Set() };
    const c = catOf(cat);
    const hasPerf = cat === 'cpu' || cat === 'gpu';
    openModal(`
      <div class="modal-head"><h2>${cat === 'storage' ? 'Add a drive' : 'Choose'} · ${esc(c.label)}</h2><button class="icon-btn" data-act="close" aria-label="Close">×</button></div>
      <div class="modal-body">
        <div class="picker-controls">
          <input type="search" class="input" id="pk-q" placeholder="Search ${esc(c.plural.toLowerCase())}…" aria-label="Search">
          <select class="input" id="pk-sort" aria-label="Sort">
            <option value="price-asc">Price: low → high</option>
            <option value="price-desc">Price: high → low</option>
            ${hasPerf ? '<option value="perf-desc">Performance: high → low</option>' : ''}
            <option value="name">Name</option>
          </select>
          <label class="check"><input type="checkbox" id="pk-hide" checked> Hide incompatible</label>
          <label class="check"><input type="checkbox" id="pk-stock"> In stock only</label>
        </div>
        <div id="pk-list"></div>
      </div>`);
    renderPickerList();
  }

  function renderPickerList() {
    if (!picker) return;
    const { cat, q, sort, hide, stock, open } = picker;
    const needle = q.trim().toLowerCase();
    let list = PARTS[cat].filter(p => !needle || (p.name + ' ' + p.brand).toLowerCase().includes(needle))
      .map(p => ({ p, why: incompat(cat, p) }));
    const hidden = list.filter(x => x.why).length;
    if (hide) list = list.filter(x => !x.why);
    if (stock) list = list.filter(x => x.p.best && x.p.best.inStock);
    const cmp = {
      'price-asc': (a, b) => a.p.price - b.p.price,
      'price-desc': (a, b) => b.p.price - a.p.price,
      'perf-desc': (a, b) => b.p.perf - a.p.perf,
      name: (a, b) => a.p.name.localeCompare(b.p.name),
    }[sort];
    list.sort(cmp);
    const cur = cat === 'storage' ? [] : [build[cat]];
    $('#pk-list').innerHTML = (list.length ? list.map(({ p, why }) => `
      <div class="cand ${why ? 'bad' : ''}">
        <div>
          <div class="cand-name">${esc(p.name)} ${cur.includes(p.id) ? '<span class="badge ok">selected</span>' : ''}</div>
          <div class="cand-specs">${esc(specLine(p))}</div>
        </div>
        <div class="cand-side">
          <span class="cand-price">${money(p.price)}</span>${priceNote(p)}
          ${why ? `<span class="badge bad">✕ ${esc(why)}</span>` : '<span class="badge ok">✓ compatible</span>'}
          <div class="slot-btns">
            <button class="btn btn-sm" data-act="toggle-note" data-id="${p.id}" aria-expanded="${open.has(p.id)}">Details</button>
            <button class="btn btn-sm ${why ? '' : 'btn-primary'}" data-act="select" data-id="${p.id}">${cat === 'storage' ? 'Add' : 'Select'}</button>
          </div>
        </div>
        ${open.has(p.id) ? `<div class="cand-note">${esc(p.note)}</div>` : ''}
      </div>`).join('') : `<div class="empty">No matching parts.${hidden ? ' Try un-ticking "Hide incompatible".' : ''}</div>`)
      + (hide && hidden ? `<p class="fineprint">${hidden} part${hidden === 1 ? '' : 's'} hidden because ${hidden === 1 ? 'it doesn\'t' : 'they don\'t'} work with your current build.</p>` : '');
  }

  function select(id) {
    const p = byId[id];
    if (!p) return;
    if (p.cat === 'storage') build.storage.push(id);
    else build[p.cat] = id;
    closeModal();
    update();
    toast(`${p.cat === 'storage' ? 'Added' : 'Selected'} ${p.name}`);
  }

  /* ---------- detail modal ---------- */
  function openDetail(id) {
    const p = byId[id];
    if (!p) return;
    const inBuild = p.cat === 'storage' ? build.storage.includes(id) : build[p.cat] === id;
    const why = incompat(p.cat, p);
    openModal(`
      <div class="modal-head"><h2>${esc(p.name)}</h2><button class="icon-btn" data-act="close" aria-label="Close">×</button></div>
      <div class="modal-body">
        <div class="cand-price" style="font-size:22px">${money(p.price)} <span class="badge">${esc(catOf(p.cat).label)}</span></div>
        <div style="margin-top:4px">${priceNote(p)}</div>
        <div class="spec-list">${ROWS[p.cat].map(r => `<div><span>${r.l}</span><b>${esc(r.g(p))}</b></div>`).join('')}</div>
        <h4>Where to buy</h4>
        ${offersTable(p)}
        <p class="fineprint">The headline price is the cheapest <em>in-stock</em> offer we could read. Overclockers UK, WaterCoolingUK and Amazon UK can't be checked automatically — use the Check links.</p>
        <h4>Things to know</h4>
        <p>${esc(p.note)}</p>
        ${why && !inBuild ? `<p><span class="badge bad">✕ ${esc(why)}</span> with your current build.</p>` : ''}
        <div class="form-row" style="margin-top:16px">
          <button class="btn btn-primary" data-act="select" data-id="${p.id}" ${inBuild && p.cat !== 'storage' ? 'disabled' : ''}>${inBuild && p.cat !== 'storage' ? 'In your build' : p.cat === 'storage' ? 'Add to build' : build[p.cat] ? 'Replace in build' : 'Add to build'}</button>
        </div>
      </div>`);
  }

  /* ---------- save / share / export ---------- */
  function listText() {
    const res = check(resolve(build));
    const r = resolve(build);
    const lines = ['PC build — BuildBench', ''];
    for (const cat of SLOT_ORDER) {
      const items = cat === 'storage' ? r.storage : r[cat] ? [r[cat]] : [];
      for (const p of items) lines.push(`${catOf(cat).label.padEnd(14)} ${p.name} — ${money(p.price)}`);
    }
    lines.push('', `Total: ${money(res.total)}`, `Estimated peak load: ${res.power.est} W (recommended PSU ${res.power.rec} W+)`);
    return lines.join('\n');
  }
  function csvText() {
    const r = resolve(build);
    const q = s => `"${String(s).replace(/"/g, '""')}"`;
    const rows = [['Category', 'Part', 'Price']];
    for (const cat of SLOT_ORDER) for (const p of cat === 'storage' ? r.storage : r[cat] ? [r[cat]] : []) rows.push([catOf(cat).label, p.name, p.price]);
    return rows.map(x => x.map(q).join(',')).join('\n');
  }
  function shareUrl() {
    const u = new URL(location.href);
    u.hash = 'b=' + buildIds().join(',');
    return u.toString();
  }

  function openSave() {
    if (!buildIds().length) return toast('Add some parts first');
    openModal(`
      <div class="modal-head"><h2>Save build</h2><button class="icon-btn" data-act="close" aria-label="Close">×</button></div>
      <div class="modal-body"><form id="save-form" class="form-row">
        <input class="input" id="save-name" maxlength="60" placeholder="Name this build" aria-label="Build name" required>
        <button class="btn btn-primary" type="submit">Save</button>
      </form></div>`, true);
  }
  function openSaved() {
    const saved = store.get('buildbench.saved', []);
    openModal(`
      <div class="modal-head"><h2>Saved builds</h2><button class="icon-btn" data-act="close" aria-label="Close">×</button></div>
      <div class="modal-body">${saved.length ? saved.map((s, i) => {
        const total = s.ids.map(id => byId[id]).filter(Boolean).reduce((t, p) => t + p.price, 0);
        return `<div class="saved-item"><div class="grow"><b>${esc(s.name)}</b><small>${s.ids.length} parts · ${money(total)} · ${esc(new Date(s.date).toLocaleDateString())}</small></div>
          <button class="btn btn-sm btn-primary" data-act="load-saved" data-idx="${i}">Load</button>
          <button class="btn btn-sm btn-danger" data-act="del-saved" data-idx="${i}">Delete</button></div>`;
      }).join('') : '<div class="empty">Nothing saved yet. Use "Save build" to keep a build in this browser.</div>'}</div>`, true);
  }

  function openPriceInfo() {
    const rows = RETAILERS.map(r => {
      const st = priceMeta.retailers[r.id];
      return `<tr><td>${esc(r.name)}</td><td>${r.live ? '<span class="badge ok">automatic</span>' : '<span class="badge">link only</span>'}</td><td class="muted">${r.live ? (st ? `${st.matched || 0} parts matched · checked ${esc(ago(st.lastRun))}${st.blockedUntil && Date.parse(st.blockedUntil) > Date.now() ? ' · <b>paused</b> after the site refused requests — resumes ' + esc(new Date(st.blockedUntil).toLocaleString('en-GB')) : st.error ? ' · last error: ' + esc(st.error) : ''}` : 'not checked yet') : esc(r.why)}</td></tr>`;
    }).join('');
    openModal(`
      <div class="modal-head"><h2>About these prices</h2><button class="icon-btn" data-act="close" aria-label="Close">×</button></div>
      <div class="modal-body">
        <table class="offers"><thead><tr><th>Retailer</th><th>Feed</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>
        <h4>How it works</h4>
        <ul class="plain">
          <li>The server fetches public listing pages politely (whole category pages, one request every few seconds, honouring each site's robots.txt) every few hours, backing off for hours if a site pushes back, and matches products to this catalogue by model name.</li>
          <li>Each part shows the cheapest <b>in-stock</b> price found. If nothing is in stock it shows the cheapest out-of-stock price; if nothing is listed it shows a rough estimate marked <em>est.</em></li>
          <li>Overclockers UK and WaterCoolingUK block automated access and Amazon UK prohibits scraping, so their prices can't be fetched here. Every part has a Check link to their own search, and you can add prices by hand in <code>prices/manual.json</code>.</li>
          <li>Matching is automatic and can be wrong (variants, bundles). Always confirm the exact product and price on the retailer's page before buying.</li>
        </ul>
      </div>`);
  }

  /* ---------- library ---------- */
  function renderLibrary() {
    $('#lib-chips').innerHTML = CATS.map(c => `<button class="chip ${c.id === lib.cat ? 'active' : ''}" data-act="lib-cat" data-cat="${c.id}">${esc(c.plural)}</button>`).join('');
    const cols = ROWS[lib.cat].filter(r => r.t);
    const needle = lib.q.trim().toLowerCase();
    let list = PARTS[lib.cat].filter(p => !needle || (p.name + ' ' + p.brand + ' ' + p.note).toLowerCase().includes(needle));
    if (lib.key !== null) {
      const get = lib.key === 'price' ? p => p.price : lib.key === 'name' ? p => p.name : (p => { const r = cols[lib.key]; return r.v ? r.v(p) : r.g(p); });
      list = [...list].sort((a, b) => {
        const x = get(a), y = get(b);
        return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true })) * lib.dir;
      });
    }
    const th = (label, key) => `<th data-act="lib-sort" data-key="${key}" class="${lib.key === key ? 'sorted' : ''}" data-dir="${lib.dir === 1 ? '↑' : '↓'}" aria-sort="${lib.key === key ? (lib.dir === 1 ? 'ascending' : 'descending') : 'none'}">${esc(label)}</th>`;
    $('#lib-table').innerHTML = `<thead><tr>${th('Name', 'name')}${cols.map((c, i) => th(c.l, i)).join('')}${th('Price', 'price')}</tr></thead>
      <tbody>${list.length ? list.map(p => `<tr class="row-click" tabindex="0" data-act="detail" data-id="${p.id}"><td>${esc(p.name)}</td>${cols.map(c => `<td${c.v ? ' class="num"' : ''}>${esc(c.g(p))}</td>`).join('')}<td class="num">${money(p.price)}${p.best ? '' : ` <span class="est-mark" title="no live listing right now">${p.priceState === 'known' ? 'last seen' : 'est.'}</span>`}</td></tr>`).join('') : `<tr><td colspan="${cols.length + 2}" class="empty">No parts match.</td></tr>`}</tbody>`;
  }

  /* ---------- guide ---------- */
  function renderGuide() {
    const groups = [...new Set(ARTICLES.map(a => a.tag))];
    $('#guide-toc').innerHTML = groups.map(g => `<div class="group">${esc(g)}</div>` + ARTICLES.filter(a => a.tag === g).map(a => `<a href="#a-${a.id}" data-act="toc" data-id="${a.id}">${esc(a.title)}</a>`).join('')).join('')
      + '<div class="group">Reference</div><a href="#glossary" data-act="toc" data-id="glossary">Glossary</a>';
    $('#glossary-list').innerHTML = GLOSSARY.map(([t, d]) => `<dt>${esc(t)}</dt><dd>${esc(d)}</dd>`).join('');
    filterGuide('');
  }
  function filterGuide(q) {
    const n = q.trim().toLowerCase();
    const strip = html => html.replace(/<[^>]+>/g, ' ').toLowerCase();
    const list = ARTICLES.filter(a => !n || (a.title + ' ' + a.summary + ' ' + strip(a.body)).toLowerCase().includes(n));
    $('#guide-articles').innerHTML = list.length ? list.map(a => `
      <article class="article" id="a-${a.id}">
        <h2>${esc(a.title)}</h2><div class="tagline">${esc(a.summary)}</div>${a.body}
      </article>`).join('') : '<div class="empty">No articles match.</div>';
  }

  /* ---------- tabs ---------- */
  function setTab(t) {
    tab = t;
    document.querySelectorAll('.tab').forEach(b => { const on = b.dataset.tab === t; b.classList.toggle('active', on); b.setAttribute('aria-selected', on); });
    for (const v of ['builder', 'library', 'guide']) $('#view-' + v).hidden = v !== t;
    if (t === 'library') renderLibrary();
    window.scrollTo({ top: 0 });
  }

  /* ---------- events ---------- */
  document.addEventListener('click', e => {
    if (e.target.id === 'modal') return closeModal();
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const d = el.dataset;
    switch (d.act) {
      case 'tab': return setTab(d.tab);
      case 'refresh-prices':
        fetch('/api/refresh', { method: 'POST' }).then(async r => {
          const j = await r.json().catch(() => ({}));
          toast(r.ok ? 'Refreshing prices — this takes a few minutes' : j.error || 'Could not refresh');
          if (r.ok) { priceMeta.refreshing = true; renderPriceBar(); setTimeout(pollPrices, 15000); }
        }).catch(() => toast('Price server not reachable'));
        return;
      case 'price-info': return openPriceInfo();
      case 'close': return closeModal();
      case 'preset': { const p = PRESETS.find(x => x.id === d.id); loadIds(p.parts); renderBuilder(); return toast(`Loaded "${p.name}"`); }
      case 'pick': return openPicker(d.cat);
      case 'select': return select(d.id);
      case 'detail': return openDetail(d.id);
      case 'toggle-note': { picker.open.has(d.id) ? picker.open.delete(d.id) : picker.open.add(d.id); const y = $('.modal-body').scrollTop; renderPickerList(); $('.modal-body').scrollTop = y; return; }
      case 'remove':
        if (d.cat === 'storage') build.storage.splice(+d.idx, 1); else build[d.cat] = null;
        return update();
      case 'clear': if (!buildIds().length) return; build = emptyBuild(); update(); return toast('Build cleared');
      case 'save': return openSave();
      case 'saved': return openSaved();
      case 'copy': return buildIds().length ? copyText(listText(), 'Parts list copied') : toast('Nothing to copy yet');
      case 'share': return buildIds().length ? copyText(shareUrl(), 'Share link copied') : toast('Nothing to share yet');
      case 'csv': {
        if (!buildIds().length) return toast('Nothing to export yet');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csvText()], { type: 'text/csv' }));
        a.download = 'pc-build.csv'; a.click(); URL.revokeObjectURL(a.href);
        return;
      }
      case 'load-saved': { const s = store.get('buildbench.saved', [])[+d.idx]; if (s) { loadIds(s.ids); closeModal(); renderBuilder(); toast(`Loaded "${s.name}"`); } return; }
      case 'del-saved': { const arr = store.get('buildbench.saved', []); arr.splice(+d.idx, 1); store.set('buildbench.saved', arr); return openSaved(); }
      case 'lib-cat': lib = { ...lib, cat: d.cat, key: null, dir: 1 }; return renderLibrary();
      case 'lib-sort': { const k = d.key === 'price' || d.key === 'name' ? d.key : +d.key; lib.dir = lib.key === k ? -lib.dir : 1; lib.key = k; return renderLibrary(); }
      case 'toc': { e.preventDefault(); const t = document.getElementById(d.id === 'glossary' ? 'glossary' : 'a-' + d.id); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    }
  });
  document.addEventListener('input', e => {
    if (e.target.id === 'pk-q') { picker.q = e.target.value; renderPickerList(); }
    else if (e.target.id === 'pk-hide') { picker.hide = e.target.checked; renderPickerList(); }
    else if (e.target.id === 'pk-stock') { picker.stock = e.target.checked; renderPickerList(); }
    else if (e.target.id === 'lib-search') { lib.q = e.target.value; renderLibrary(); }
    else if (e.target.id === 'guide-search') filterGuide(e.target.value);
  });
  document.addEventListener('change', e => { if (e.target.id === 'pk-sort') { picker.sort = e.target.value; renderPickerList(); } });
  document.addEventListener('submit', e => {
    if (e.target.id !== 'save-form') return;
    e.preventDefault();
    const name = $('#save-name').value.trim();
    if (!name) return;
    const saved = store.get('buildbench.saved', []);
    saved.unshift({ name, ids: buildIds(), date: Date.now() });
    store.set('buildbench.saved', saved.slice(0, 50));
    closeModal();
    toast(`Saved "${name}"`);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !$('#modal').hidden) closeModal();
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('tr[data-act]')) { e.preventDefault(); openDetail(e.target.dataset.id); }
    if (e.key === 'Tab' && !$('#modal').hidden) { // keep focus inside the dialog
      const f = [...$('#modal-box').querySelectorAll('button:not(:disabled),input,select,[tabindex="0"]')];
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- init ---------- */
  function init() {
    const m = location.hash.match(/^#b=(.*)$/);
    if (m) {
      loadIds(m[1].split(',').filter(Boolean));
      history.replaceState(null, '', location.pathname + location.search);
    } else {
      loadIds(store.get('buildbench.current', []));
    }
    applyPrices(window.PRICES);
    renderPriceBar();
    renderPresets();
    renderBuilder();
    renderGuide();
    pollPrices();
    setInterval(() => { if (!document.hidden) pollPrices(); }, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) pollPrices(); });
  }
  init();
})();
