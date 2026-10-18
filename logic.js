/* Compatibility + power + balance engine. Pure functions over a resolved build:
   { cpu, mb, ram, gpu, cooler, psu, case, storage: [] } — each value is a part object or null. */
(function (root) {
  const SEV_ORDER = { error: 0, warn: 1, info: 2 };
  const ceil50 = n => Math.ceil(n / 50) * 50;
  const fmtCap = gb => (gb >= 1000 ? `${+(gb / 1000).toFixed(1)} TB` : `${gb} GB`);

  function check(b) {
    const issues = [];
    // hard = blocks a part from being offered as "compatible" in the picker.
    const add = (sev, cats, title, detail, hard = false) => issues.push({ sev, cats, title, detail, hard });
    const { cpu, mb, ram, gpu, cooler, psu } = b;
    const pcase = b.case;
    const drives = b.storage || [];

    if (cpu && mb && cpu.socket !== mb.socket)
      add('error', ['cpu', 'mb'], 'CPU and motherboard sockets don\'t match', `${cpu.name} uses ${cpu.socket}, but ${mb.name} is ${mb.socket}.`, true);

    if (ram && mb && ram.type !== mb.mem)
      add('error', ['ram', 'mb'], 'Wrong memory generation for this motherboard', `${mb.name} takes ${mb.mem}; ${ram.type} won't fit the slot or work.`, true);
    if (ram && cpu && !cpu.mem.includes(ram.type))
      add('error', ['ram', 'cpu'], 'CPU doesn\'t support this memory type', `${cpu.name} supports ${cpu.mem.join(' / ')}, not ${ram.type}.`, true);
    if (ram && mb && ram.sticks > mb.slots)
      add('error', ['ram', 'mb'], 'Not enough memory slots', `This kit has ${ram.sticks} sticks but the board only has ${mb.slots} DIMM slots.`, true);
    if (ram && mb && ram.capacity > mb.maxRam)
      add('error', ['ram', 'mb'], 'Memory capacity exceeds board limit', `${ram.capacity} GB is more than the ${mb.maxRam} GB this board supports.`, true);

    if (ram) {
      if (ram.sticks === 1)
        add('warn', ['ram'], 'Single memory stick = single channel', 'One stick halves memory bandwidth. A 2-stick kit in dual-channel is noticeably faster in games and integrated graphics.');
      if (ram.type === 'DDR5' && ram.sticks >= 4)
        add('warn', ['ram', 'mb'], 'Four DDR5 sticks usually can\'t hit rated speed', 'Populating all four slots stresses the memory controller; expect to run 4800–5400 MT/s instead of the kit\'s rating. 2×larger sticks are more reliable.');
      if (cpu && cpu.socket === 'AM5' && ram.speed > 6400)
        add('warn', ['ram', 'cpu'], 'DDR5 above ~6400 is wasted on AM5', 'AM5 is happiest at 6000 MT/s with a 1:1 memory-controller ratio. Faster kits often drop to a 2:1 ratio that hurts latency.');
      if (cpu && cpu.socket === 'AM5' && ram.speed < 5600)
        add('info', ['ram', 'cpu'], 'Slow memory on AM5', 'Ryzen 7000/9000 benefit measurably from DDR5-6000 EXPO. This kit will work but leaves performance on the table.');
      if (cpu && cpu.socket === 'AM4' && ram.speed > 3800)
        add('info', ['ram', 'cpu'], 'AM4 tops out around DDR4-3600–3800', 'Higher speeds usually can\'t be matched by Infinity Fabric on Ryzen 5000.');
      if (cpu && cpu.socket === 'AM4' && ram.speed < 3600)
        add('info', ['ram', 'cpu'], 'DDR4-3600 is the Ryzen 5000 sweet spot', `This kit runs at ${ram.speed} MT/s. 3600 CL16 matches the Infinity Fabric clock and is worth a few % in games if the price gap is small.`);
      if (cpu && cpu.socket === 'AM5' && ram.speed === 6000 && ram.cl >= 36)
        add('info', ['ram', 'cpu'], 'Looser DDR5-6000 timings', `CL${ram.cl} has ~20% worse true latency than CL30 at the same speed. Fine for most use; CL30 helps X3D chips slightly.`);
      if (mb && ram.sticks === 2 && mb.slots === 4)
        add('info', ['ram', 'mb'], 'Use the right DIMM slots', 'With two sticks on a four-slot board, install them in the slots the manual names (typically A2 and B2 — second and fourth from the CPU) to get dual-channel at full speed.');
    }

    if (mb && pcase && !pcase.forms.includes(mb.form))
      add('error', ['mb', 'case'], 'Motherboard doesn\'t fit the case', `${mb.name} is ${mb.form}; ${pcase.name} supports ${pcase.forms.join(', ')}.`, true);

    if (gpu && pcase) {
      if (gpu.length > pcase.maxGpu)
        add('error', ['gpu', 'case'], 'Graphics card is too long for the case', `${gpu.name} is about ${gpu.length} mm; ${pcase.name} fits up to ${pcase.maxGpu} mm.`, true);
      else if (gpu.length > pcase.maxGpu - 15)
        add('info', ['gpu', 'case'], 'Tight GPU clearance', `Only ${pcase.maxGpu - gpu.length} mm to spare. A front-mounted radiator or fan can reduce the usable length further.`);
      if (gpu.slots > pcase.maxGpuSlots)
        add('error', ['gpu', 'case'], 'Graphics card is too thick for the case', `${gpu.name} occupies ~${gpu.slots} slots; ${pcase.name} supports ${pcase.maxGpuSlots}.`, true);
    }

    if (cooler) {
      if (cpu && !cooler.sockets.includes(cpu.socket))
        add('error', ['cooler', 'cpu'], 'Cooler doesn\'t support the CPU socket', `${cooler.name} has no ${cpu.socket} mounting hardware.`, true);
      if (cooler.type === 'Air' && pcase && cooler.height > pcase.maxCooler)
        add('error', ['cooler', 'case'], 'Air cooler is too tall for the case', `${cooler.name} is ${cooler.height} mm tall; ${pcase.name} allows ${pcase.maxCooler} mm.`, true);
      if (cooler.type === 'AIO' && pcase && cooler.rad > pcase.radMax)
        add('error', ['cooler', 'case'], 'Radiator doesn\'t fit the case', `${pcase.name} supports radiators up to ${pcase.radMax} mm; this is ${cooler.rad} mm.`, true);
      if (cpu && cooler.rating < cpu.power)
        add('warn', ['cooler', 'cpu'], 'Cooler may be underpowered for this CPU', `${cooler.name} is rated for roughly ${cooler.rating} W; ${cpu.name} can pull ${cpu.power} W. Expect thermal throttling in sustained loads.`);
      if (cooler.type === 'Air' && cooler.height >= 160 && ram && ram.height >= 50)
        add('warn', ['cooler', 'ram'], 'Check RAM clearance under the cooler', `${ram.name.split(' ').slice(0, 3).join(' ')} has ~${ram.height} mm heat spreaders; large air coolers can overhang the first DIMM slot.`);
    } else if (cpu) {
      if (cpu.stock) add('info', ['cooler'], 'Using the CPU\'s stock cooler', 'It\'s adequate for stock speeds but loud under load. A $30 tower cooler is the single best low-cost upgrade.');
      else add('warn', ['cooler', 'cpu'], 'No CPU cooler selected', `${cpu.name} does not include a cooler — you need to buy one.`);
    }

    if (psu && pcase && !pcase.psuForms.includes(psu.form))
      add('error', ['psu', 'case'], 'Power supply form factor doesn\'t fit the case', `${pcase.name} takes ${pcase.psuForms.join(' / ')} power supplies; this is ${psu.form}.`, true);

    if (psu && gpu) {
      if (gpu.conn.type === '8pin' && gpu.conn.n > psu.pcie8)
        add('error', ['psu', 'gpu'], 'PSU doesn\'t have enough PCIe power cables', `${gpu.name} needs ${gpu.conn.n}×8-pin PCIe connectors but ${psu.name.split(' (')[0]} supplies ${psu.pcie8}.`, true);
      if (gpu.conn.type === '12v') {
        if (!psu.native12v) {
          if (psu.pcie8 < gpu.conn.adapter)
            add('error', ['psu', 'gpu'], 'No way to power this GPU', `${gpu.name} needs a 16-pin cable. This PSU has no native one and only ${psu.pcie8} 8-pin cables, but the adapter needs ${gpu.conn.adapter}.`, true);
          else
            add('warn', ['psu', 'gpu'], 'GPU needs the 16-pin adapter', `This PSU lacks a native 12V-2x6 cable, so the adapter (${gpu.conn.adapter}×8-pin) must be used. Avoid tight bends and ensure it\'s fully seated.`);
        } else if (gpu.tdp >= 450) {
          add('info', ['psu', 'gpu'], 'Seat the 12V-2x6 cable fully', 'At ~575 W this connector has little margin. Push until it clicks, keep the first 35 mm of cable straight, and re-check after cable management.');
        }
      }
    }

    // Power
    const est = (cpu ? cpu.power : 0) + (gpu ? gpu.tdp : 0) + (cpu || gpu ? 50 : 0) + drives.length * 5;
    const rec = cpu || gpu ? Math.max(ceil50(est * 1.3), gpu ? gpu.rec : 0) : 0;
    if (psu && est) {
      if (psu.watts < est)
        add('error', ['psu'], 'Power supply is too weak', `Estimated peak load is ~${est} W but this PSU only delivers ${psu.watts} W. System will shut down under load.`);
      else if (psu.watts < rec)
        add('warn', ['psu'], 'Power supply has little headroom', `Peak load is ~${est} W. Aim for at least ${rec} W for spikes, ageing and the efficiency sweet spot (40–60% load).`);
    }

    // Storage
    const m2 = drives.filter(d => d.iface === 'm2');
    const sata = drives.filter(d => d.iface === 'sata');
    const hdds = drives.filter(d => d.form === '3.5"');
    const ssd25 = drives.filter(d => d.form === '2.5"');
    if (mb && m2.length > mb.m2)
      add('error', ['storage', 'mb'], 'Not enough M.2 slots', `You've picked ${m2.length} M.2 drives but ${mb.name.split(' ').slice(0, 3).join(' ')}… only has ${mb.m2}.`, true);
    if (mb && sata.length > mb.sata)
      add('error', ['storage', 'mb'], 'Not enough SATA ports', `${sata.length} SATA drives selected; the board only has ${mb.sata} ports.`, true);
    if (pcase && hdds.length > pcase.bays35)
      add('error', ['storage', 'case'], 'No room for a 3.5" drive', `${pcase.name} has ${pcase.bays35} 3.5" bay${pcase.bays35 === 1 ? '' : 's'}; you've picked ${hdds.length}.`, true);
    if (pcase && ssd25.length > pcase.bays25)
      add('error', ['storage', 'case'], 'No room for a 2.5" drive', `${pcase.name} has ${pcase.bays25} 2.5" mount${pcase.bays25 === 1 ? '' : 's'}; you've picked ${ssd25.length}.`, true);
    if (mb && m2.some(d => d.gen > mb.m2Gen)) {
      const d = m2.find(x => x.gen > mb.m2Gen);
      add('info', ['storage', 'mb'], 'Drive faster than the M.2 slot', `${d.name} is PCIe Gen${d.gen}; the board's fastest M.2 is Gen${mb.m2Gen}. It will work, just capped at Gen${mb.m2Gen} speeds — the extra cost is wasted.`);
    }
    if (mb && mb.share && m2.length >= 2)
      add('info', ['storage', 'mb'], 'Check M.2 lane sharing', mb.share);
    const gen5 = m2.find(d => d.gen === 5);
    if (gen5)
      add('info', ['storage'], 'Gen5 SSDs run hot', `${gen5.name} needs a heatsink and airflow; without them it throttles. A GPU hanging over the slot can trap heat.`);
    const weakBoot = m2.length && m2.every(d => !d.dram && d.nand === 'QLC') && m2.length === drives.length;
    if (weakBoot)
      add('info', ['storage'], 'Only a DRAM-less QLC drive', 'Fine for light use, but sustained writes (updates, game installs) drop to a crawl once the SLC cache is full. Consider a TLC drive for your boot disk.');
    if (hdds.length)
      add('info', ['storage'], 'Mechanical drive tips', 'Use it only for bulk storage/backup. Make sure it\'s CMR, not SMR, if you plan on RAID or sustained writes.');
    if (!drives.length)
      add('info', ['storage'], 'No storage selected', 'You need at least one drive to install an operating system.');

    // Platform / BIOS
    if (cpu && !gpu && !cpu.igpu)
      add('error', ['gpu', 'cpu'], 'No display output', `${cpu.name} has no integrated graphics, so you need a graphics card.`);
    if (cpu && mb && cpu.socket === mb.socket) {
      if (cpu.gen === 'zen5' && ['A620', 'B650', 'B650E', 'X670E'].includes(mb.chipset))
        add('info', ['cpu', 'mb'], 'Possible BIOS update needed', `${mb.chipset} boards made before Ryzen 9000 may not boot it until updated. Look for a "Ryzen 9000 Ready" sticker or use the board's BIOS Flashback button (flash with no CPU installed).`);
      if (cpu.gen === 'zen3' && ['A520', 'B550'].includes(mb.chipset))
        add('info', ['cpu', 'mb'], 'Check BIOS supports this Ryzen 5000 chip', 'Older stock may need an update before it boots a Zen 3 CPU. Ask the retailer or look for a "Ryzen 5000 Ready" sticker.');
      if (cpu.unlocked && !mb.oc)
        add('info', ['cpu', 'mb'], 'No CPU overclocking on this chipset', `${mb.chipset} doesn't allow raising CPU limits or Curve Optimizer. The chip still runs at its stock boost; memory profiles (EXPO/XMP) still work.`);
      if (cpu.tdp >= 105 && ['A520', 'A620', 'B840'].includes(mb.chipset))
        add('warn', ['cpu', 'mb'], 'Entry-level board for a hungry CPU', `${mb.chipset} boards have light power delivery; a ${cpu.tdp} W-class CPU will run hot on the VRM. Prefer B550/B650/B850 or better.`);
      if (cpu.pcie < 4 && gpu && gpu.lanes === 8)
        add('warn', ['cpu', 'gpu'], 'x8 graphics card on a PCIe 3.0 CPU', `${gpu.name} only has 8 lanes. On ${cpu.name}'s PCIe 3.0 link it loses real performance, most of all when VRAM overflows. A card with a full x16 link (RX 9060 XT / 9070) suits this CPU better.`);
      else if (gpu && gpu.lanes === 8 && mb.pcie < 4)
        add('warn', ['mb', 'gpu'], 'x8 graphics card on a PCIe 3.0 slot', `${gpu.name} only has 8 lanes and this board's slot runs at PCIe 3.0, which costs performance.`);
    }
    if (mb && !mb.wifi)
      add('info', ['mb'], 'No built-in Wi-Fi', 'Plan on Ethernet, or add a USB / PCIe Wi-Fi card.');
    if (pcase && pcase.fans < 2)
      add('info', ['case'], 'Case ships with few fans', `${pcase.name} includes ${pcase.fans} fan${pcase.fans === 1 ? '' : 's'}. Adding a rear exhaust and extra intake fans helps temperatures.`);

    // Balance (CPU vs GPU gaming tier)
    let balance = null;
    if (cpu && gpu) {
      const gap = gpu.perf - cpu.perf;
      balance = { cpu: cpu.perf, gpu: gpu.perf, gap, verdict: 'balanced' };
      if (gap > 30) {
        balance.verdict = 'cpu-limited';
        add('warn', ['cpu', 'gpu'], 'CPU may hold back this GPU', `${gpu.name} is much stronger than ${cpu.name}. In CPU-heavy games and at 1080p you won't see its full speed. Consider a stronger CPU.`);
      } else if (gap < -30) {
        balance.verdict = 'gpu-limited';
        add('info', ['cpu', 'gpu'], 'GPU is the weak link', `${cpu.name} is far more CPU than ${gpu.name} can use. In games, money shifted to the graphics card will go further.`);
      }
    }

    const parts = [cpu, mb, ram, gpu, cooler, psu, pcase, ...drives].filter(Boolean);
    const total = parts.reduce((s, p) => s + p.price, 0);
    const ramTotal = ram ? ram.capacity : 0;
    const storageGB = drives.reduce((s, d) => s + d.capacity, 0);

    const required = ['cpu', 'mb', 'ram', 'psu', 'case', 'storage'];
    if (!(cpu && cpu.igpu)) required.push('gpu');
    if (!(cpu && cpu.stock)) required.push('cooler');
    const has = k => (k === 'storage' ? drives.length > 0 : !!b[k]);
    const done = required.filter(has).length;

    issues.sort((a, c) => SEV_ORDER[a.sev] - SEV_ORDER[c.sev]);
    return {
      issues, total,
      power: { est, rec, psu: psu ? psu.watts : 0 },
      balance,
      progress: { done, of: required.length, missing: required.filter(k => !has(k)) },
      summary: {
        cores: cpu ? `${cpu.cores}C / ${cpu.threads}T` : '—',
        ram: ramTotal ? `${ramTotal} GB ${ram.type}` : '—',
        vram: gpu ? `${gpu.vram} GB` : '—',
        storage: storageGB ? fmtCap(storageGB) : '—',
      },
    };
  }

  const Logic = { check, fmtCap };
  if (typeof module !== 'undefined' && module.exports) module.exports = Logic;
  else root.Logic = Logic;
})(typeof window !== 'undefined' ? window : globalThis);
