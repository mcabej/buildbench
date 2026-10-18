/* Parts catalogue — AM4 and AM5 platforms only. Prices are GBP (inc. VAT).
   `price` is only a fallback "typical" figure; live prices come from prices.json (see prices/update.js).
   `q` is the Scan search term, `re` identifies the product in retailer titles (see prices/match.js). */
(function (root) {
  const CATEGORIES = [
    { id: 'cpu', label: 'Processor', short: 'CPU', plural: 'Processors' },
    { id: 'mb', label: 'Motherboard', short: 'MB', plural: 'Motherboards' },
    { id: 'ram', label: 'Memory', short: 'RAM', plural: 'Memory kits' },
    { id: 'gpu', label: 'Graphics card', short: 'GPU', plural: 'Graphics cards' },
    { id: 'storage', label: 'Storage', short: 'SSD', plural: 'Storage drives', multi: true },
    { id: 'cooler', label: 'CPU cooler', short: 'COOL', plural: 'CPU coolers' },
    { id: 'psu', label: 'Power supply', short: 'PSU', plural: 'Power supplies' },
    { id: 'case', label: 'Case', short: 'CASE', plural: 'Cases' },
  ];

  const SOCKETS = ['AM4', 'AM5'];
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // word-bounded product match that won't swallow variants (7700 vs 7700X, 5600 vs 5600X / 5600 XT)
  const word = s => new RegExp('\\b' + esc(s) + '(?![a-z0-9])(?! xt)', 'i');
  const re = (src, flags = 'i') => new RegExp(src, flags);

  /* ---------------- CPUs ---------------- */
  const C = (id, name, socket, cores, threads, base, boost, tdp, l3, o) => ({
    id, name, brand: 'AMD', socket, cores, threads, base, boost, tdp,
    power: tdp <= 65 ? 88 : tdp <= 105 ? 142 : tdp <= 120 ? 162 : 230,
    l3, mem: [socket === 'AM4' ? 'DDR4' : 'DDR5'], igpu: false, stock: false, unlocked: true, pcie: socket === 'AM4' ? 4 : 5, ...o,
  });
  const cpu = [
    C('cpu-5500', 'AMD Ryzen 5 5500', 'AM4', 6, 12, 3.6, 4.2, 65, 16, { pcie: 3, stock: true, gen: 'zen3', perf: 40, price: 80, q: 'ryzen 5 5500', re: word('ryzen 5 5500'),
      note: 'Cheapest sensible AM4 chip, but it is a cut-down Zen 3: 16 MB L3 cache and PCIe 3.0 only. Fine at 1080p, though the small cache costs a few % in games versus the 5600. Boxed with a Wraith Stealth cooler.' }),
    C('cpu-5600', 'AMD Ryzen 5 5600', 'AM4', 6, 12, 3.5, 4.4, 65, 32, { stock: true, gen: 'zen3', perf: 45, price: 100, q: 'ryzen 5 5600', re: word('ryzen 5 5600'),
      note: 'The classic budget AM4 gaming CPU: full 32 MB L3 and PCIe 4.0, boxed with a Wraith Stealth cooler. Best paired with DDR4-3600 CL16. AM4 is a finished platform — cheap now, but no upgrade path beyond Zen 3.' }),
    C('cpu-5700x', 'AMD Ryzen 7 5700X', 'AM4', 8, 16, 3.4, 4.6, 65, 32, { gen: 'zen3', perf: 50, price: 180, q: 'ryzen 7 5700x', re: word('ryzen 7 5700x'),
      note: 'Eight Zen 3 cores at 65 W, no cooler in the box. A sweet drop-in upgrade for existing B450/B550 boards; for a new build the 5700X3D or an AM5 chip is usually the better spend.' }),
    C('cpu-5700x3d', 'AMD Ryzen 7 5700X3D', 'AM4', 8, 16, 3.0, 4.1, 105, 96, { unlocked: false, gen: 'zen3', perf: 66, price: 230, q: 'ryzen 7 5700x3d', re: word('ryzen 7 5700x3d'),
      note: '3D V-Cache on AM4: 96 MB L3 makes it a gaming monster for the money. Locked multiplier, no cooler included. Uses the same cooler mounts as AM5.' }),
    C('cpu-5800x3d', 'AMD Ryzen 7 5800X3D', 'AM4', 8, 16, 3.4, 4.5, 105, 96, { unlocked: false, gen: 'zen3', perf: 70, price: 310, q: 'ryzen 7 5800x3d', re: word('ryzen 7 5800x3d'),
      note: 'The AM4 swansong. Current stock is the 10th Anniversary re-release. 96 MB V-Cache with locked voltage/multiplier, so no overclocking — and it is sensitive to cooling because the stacked cache limits heat transfer.' }),
    C('cpu-5800xt', 'AMD Ryzen 7 5800XT', 'AM4', 8, 16, 3.8, 4.8, 105, 32, { gen: 'zen3', perf: 52, price: 225, q: 'ryzen 7 5800xt', re: word('ryzen 7 5800xt'),
      note: 'A refreshed 5800X with higher clocks, boxed with a Wraith Prism. Hard to justify against a 5700X3D for gaming, but strong for multi-threaded work on an old board.' }),
    C('cpu-5900xt', 'AMD Ryzen 9 5900XT', 'AM4', 16, 32, 3.3, 4.8, 105, 64, { gen: 'zen3', perf: 54, price: 290, q: 'ryzen 9 5900xt', re: word('ryzen 9 5900xt'),
      note: 'Sixteen Zen 3 cores for AM4 — a cheap productivity chip. It needs a decent VRM (B550/X570 class) and a strong cooler; gaming is no better than an 8-core Zen 3.' }),
    C('cpu-7500f', 'AMD Ryzen 5 7500F', 'AM5', 6, 12, 3.7, 5.0, 65, 32, { stock: true, gen: 'zen4', perf: 58, price: 150, q: 'ryzen 5 7500f', re: word('ryzen 5 7500f'),
      note: 'Cheapest road onto AM5. No integrated graphics, so a graphics card is mandatory. Practically a Ryzen 5 7600 without the iGPU.' }),
    C('cpu-7600', 'AMD Ryzen 5 7600', 'AM5', 6, 12, 3.8, 5.1, 65, 32, { igpu: true, stock: true, gen: 'zen4', perf: 60, price: 170, q: 'ryzen 5 7600', re: word('ryzen 5 7600'),
      note: 'Efficient six-core with a basic iGPU for display output and troubleshooting. Peaks near 88 W, so even a cheap tower cooler is plenty. Needs DDR5, which is the pricey part of AM5 right now.' }),
    C('cpu-7600x', 'AMD Ryzen 5 7600X', 'AM5', 6, 12, 4.7, 5.3, 105, 32, { igpu: true, gen: 'zen4', perf: 63, price: 180, q: 'ryzen 5 7600x', re: word('ryzen 5 7600x'),
      note: 'Higher clocks than the 7600 for a small premium, but it runs hotter and has no cooler in the box. Only worth it when the price gap is under about £15.' }),
    C('cpu-7700', 'AMD Ryzen 7 7700', 'AM5', 8, 16, 3.8, 5.3, 65, 32, { igpu: true, stock: true, gen: 'zen4', perf: 66, price: 260, q: 'ryzen 7 7700', re: word('ryzen 7 7700'),
      note: 'Eight cores at 65 W with a Wraith Prism cooler in the box. A good all-rounder when the X3D chips cost too much.' }),
    C('cpu-7700x', 'AMD Ryzen 7 7700X', 'AM5', 8, 16, 4.5, 5.4, 105, 32, { igpu: true, gen: 'zen4', perf: 67, price: 250, q: 'ryzen 7 7700x', re: word('ryzen 7 7700x'),
      note: 'Faster out of the box than the 7700 but hotter (142 W peak) and with no cooler. Check pricing — it is sometimes cheaper than the non-X.' }),
    C('cpu-7800x3d', 'AMD Ryzen 7 7800X3D', 'AM5', 8, 16, 4.2, 5.0, 120, 96, { igpu: true, unlocked: false, gen: 'zen4', perf: 88, price: 340, q: 'ryzen 7 7800x3d', re: word('ryzen 7 7800x3d'),
      note: '96 MB 3D V-Cache with lower clocks but huge gaming performance. Real gaming power is only ~60–90 W, so it is easy to cool and ideal for small cases. Voltage-locked; tune via EXPO memory instead of overclocking.' }),
    C('cpu-7900x', 'AMD Ryzen 9 7900X', 'AM5', 12, 24, 4.7, 5.6, 170, 64, { igpu: true, gen: 'zen4', perf: 69, price: 330, q: 'ryzen 9 7900x', re: word('ryzen 9 7900x'),
      note: 'Twelve cores across two chiplets — great for rendering and compiling, no better than a 7700X in most games. 230 W peak needs a 240 mm AIO or a top-end air cooler.' }),
    C('cpu-8600g', 'AMD Ryzen 5 8600G', 'AM5', 6, 12, 4.3, 5.0, 65, 16, { igpu: true, stock: true, pcie: 4, gen: 'zen4', perf: 52, price: 173, q: 'ryzen 5 8600g', re: word('ryzen 5 8600g'),
      note: 'APU with a capable Radeon 760M-class iGPU — handy for an HTPC or a "GPU later" build. Small cache (16 MB L3) and PCIe 4.0 x8 to a graphics card make it slower than a Ryzen 5 7600 with a dedicated card.' }),
    C('cpu-9600x', 'AMD Ryzen 5 9600X', 'AM5', 6, 12, 3.9, 5.4, 65, 32, { igpu: true, gen: 'zen5', perf: 66, price: 190, q: 'ryzen 5 9600x', re: word('ryzen 5 9600x'),
      note: 'Zen 5 six-core at 65 W. Faster than a 7600 in games and apps; no stock cooler in the box. Older A620/B650 boards need a BIOS with Zen 5 support.' }),
    C('cpu-9700x', 'AMD Ryzen 7 9700X', 'AM5', 8, 16, 3.8, 5.5, 65, 32, { igpu: true, gen: 'zen5', perf: 72, price: 275, q: 'ryzen 7 9700x', re: word('ryzen 7 9700x'),
      note: 'Efficient Zen 5 eight-core. A strong productivity/gaming blend, but for games alone the 7800X3D or 9800X3D beat it at similar money.' }),
    C('cpu-9800x3d', 'AMD Ryzen 7 9800X3D', 'AM5', 8, 16, 4.7, 5.2, 120, 96, { igpu: true, gen: 'zen5', perf: 95, price: 380, q: 'ryzen 7 9800x3d', re: word('ryzen 7 9800x3d'),
      note: 'Second-generation V-Cache: the cache sits under the cores, so clocks are higher and heat escapes more easily. Unlocked for overclocking. The gaming benchmark leader; no cooler in the box.' }),
    C('cpu-9850x3d', 'AMD Ryzen 7 9850X3D', 'AM5', 8, 16, 4.7, 5.6, 120, 96, { igpu: true, gen: 'zen5', perf: 98, price: 400, q: 'ryzen 7 9850x3d', re: word('ryzen 7 9850x3d'),
      note: 'A higher-clocked 9800X3D (5.6 GHz boost). Often only a few pounds more — choose it if stock and price line up.' }),
    C('cpu-9900x', 'AMD Ryzen 9 9900X', 'AM5', 12, 24, 4.4, 5.6, 120, 64, { igpu: true, gen: 'zen5', perf: 71, price: 360, q: 'ryzen 9 9900x', re: word('ryzen 9 9900x'),
      note: 'Twelve Zen 5 cores at a more manageable 162 W peak than the 7900X. Great for content creation; games prefer the X3D parts.' }),
    C('cpu-9900x3d', 'AMD Ryzen 9 9900X3D', 'AM5', 12, 24, 4.4, 5.5, 120, 140, { igpu: true, gen: 'zen5', perf: 90, price: 500, q: 'ryzen 9 9900x3d', re: word('ryzen 9 9900x3d'),
      note: 'V-Cache on only one of two chiplets: games use that fast 6-core CCD (Windows needs the AMD chipset driver and Game Bar to schedule correctly), other work uses all 12 cores.' }),
    C('cpu-9950x', 'AMD Ryzen 9 9950X', 'AM5', 16, 32, 4.3, 5.7, 170, 64, { igpu: true, gen: 'zen5', perf: 76, price: 500, q: 'ryzen 9 9950x', re: word('ryzen 9 9950x'),
      note: 'Sixteen Zen 5 cores for rendering, compiling and virtual machines. 230 W peak needs a 280–360 mm AIO or a top-tier dual-tower air cooler.' }),
    C('cpu-9950x3d', 'AMD Ryzen 9 9950X3D', 'AM5', 16, 32, 4.3, 5.7, 170, 144, { igpu: true, gen: 'zen5', perf: 93, price: 570, q: 'ryzen 9 9950x3d', re: word('ryzen 9 9950x3d'),
      note: 'The "do everything" chip: 16 cores plus V-Cache on one chiplet for gaming. Expensive, and it still needs a big cooler. Keep AMD chipset drivers current for correct game scheduling.' }),
  ];

  /* ---------------- Motherboards ---------------- */
  const B = (id, name, brand, socket, chipset, form, slots, m2, m2Gen, sata, pcie, wifi, price, q, rx, note, o = {}) => ({
    id, name, brand, socket, chipset, form, mem: socket === 'AM4' ? 'DDR4' : 'DDR5', slots,
    maxRam: socket === 'AM4' ? 128 : slots === 2 ? 128 : ['X870', 'X870E', 'B850'].includes(chipset) ? 256 : 192,
    m2, m2Gen, sata, pcie, wifi, oc: !['A520', 'A620', 'B840'].includes(chipset), price, q, re: rx, note, ...o,
  });
  const mb = [
    B('mb-a520m-ds3h', 'Gigabyte A520M DS3H V2', 'Gigabyte', 'AM4', 'A520', 'mATX', 4, 1, 3, 4, 3, false, 56, 'gigabyte a520m ds3h v2', re('a520m ds3h v2'),
      'Rock-bottom AM4: one M.2 slot at PCIe 3.0, GPU slot at 3.0, no CPU overclocking. Fine for a Ryzen 5 5500/5600, not for a 105 W chip. Zen 3 CPUs need a recent BIOS (V2 boards usually ship with it).'),
    B('mb-a520i-ac', 'Gigabyte A520I AC', 'Gigabyte', 'AM4', 'A520', 'ITX', 2, 1, 3, 4, 3, true, 93, 'gigabyte a520i ac', re('a520i ac'),
      'The cheap route into a mini-ITX AM4 build. Two DIMM slots, one M.2 and Wi-Fi, but a basic VRM — stay with 65 W CPUs.'),
    B('mb-b550m-pro-vdh', 'MSI B550M PRO-VDH', 'MSI', 'AM4', 'B550', 'mATX', 4, 2, 4, 4, 4, false, 90, 'msi b550m pro-vdh', re('b550m pro-vdh'),
      'The budget B550 workhorse: PCIe 4.0 GPU slot and M.2, but a light VRM and no Wi-Fi.',
      { share: 'The second M.2 slot is chipset-fed (PCIe 3.0 x4) and shares bandwidth with SATA ports.' }),
    B('mb-b550-gaming-plus', 'MSI MPG B550 Gaming Plus', 'MSI', 'AM4', 'B550', 'ATX', 4, 2, 4, 6, 4, false, 110, 'msi mpg b550 gaming plus', re('b550 gaming plus'),
      'Full ATX B550 with six SATA ports and a better VRM than the mATX boards — a good match for a 5700X3D. No Wi-Fi.',
      { share: 'The second M.2 slot is chipset-fed PCIe 3.0 x4 and shares lanes with some SATA ports.' }),
    B('mb-b550-tuf', 'ASUS TUF Gaming B550-Plus WiFi II', 'ASUS', 'AM4', 'B550', 'ATX', 4, 2, 4, 6, 4, true, 119, 'asus tuf gaming b550-plus wifi ii', re('tuf gaming b550-plus'),
      'Well-regarded AM4 ATX board with a solid VRM, Wi-Fi 6 and good fan headers. A safe pairing for anything up to a 5900XT.'),
    B('mb-b550f-wifi2', 'ASUS ROG Strix B550-F Gaming WiFi II', 'ASUS', 'AM4', 'B550', 'ATX', 4, 2, 4, 6, 4, true, 143, 'asus rog strix b550-f gaming wifi ii', re('strix b550-f gaming wi-?fi ii'),
      'Premium B550: stronger VRM heatsinks, 2.5 GbE, Wi-Fi 6E. More board than a 5600 needs; justified for a 16-core 5900XT.'),

    B('mb-a620m-ds3h', 'Gigabyte A620M DS3H', 'Gigabyte', 'AM5', 'A620', 'mATX', 4, 1, 4, 4, 4, false, 83, 'gigabyte a620m ds3h', re('a620m ds3h'),
      'Entry AM5: one M.2 slot, no CPU overclocking and a light VRM. Pair with a 65 W CPU (7500F/7600/9600X); avoid 105 W+ parts. DDR5-6000 EXPO usually works.'),
    B('mb-a620m-tuf-wifi', 'ASUS TUF Gaming A620M-Plus WiFi', 'ASUS', 'AM5', 'A620', 'mATX', 4, 2, 4, 4, 4, true, 115, 'asus tuf gaming a620m-plus wifi', re('a620m-plus wifi'),
      'A620 with Wi-Fi and a second M.2 slot — a sensible budget AM5 board. Still no CPU overclocking and a modest VRM.'),
    B('mb-b840-s-evo', 'MSI PRO B840-S EVO WiFi 6E', 'MSI', 'AM5', 'B840', 'ATX', 4, 3, 4, 4, 4, true, 137, 'msi pro b840-s evo', re('b840-s evo'),
      'B840 is a cheaper-than-B850 platform: PCIe 4.0 only, no CPU overclocking, fewer lanes. Fine for a mid-range build; skip it if you want PCIe 5.0 later.'),
    B('mb-b650m-hdv', 'ASRock B650M-HDV/M.2', 'ASRock', 'AM5', 'B650', 'mATX', 2, 2, 4, 4, 4, false, 93, 'asrock b650m-hdv/m.2', re('b650m-hdv'),
      'Bargain B650 with only two DIMM slots and no Wi-Fi. Fine for 2×16 GB kits; buy the capacity you need up front.'),
    B('mb-b650-eagle-ax', 'Gigabyte B650 Eagle AX', 'Gigabyte', 'AM5', 'B650', 'ATX', 4, 3, 4, 4, 4, true, 135, 'gigabyte b650 eagle ax', re('b650 eagle ax'),
      'Honest mid-range AM5 board with Wi-Fi 6E and three M.2 slots. A good fit for a 7600 up to a 7800X3D.'),
    B('mb-b650m-aorus-elite', 'Gigabyte B650M Aorus Elite AX', 'Gigabyte', 'AM5', 'B650', 'mATX', 4, 2, 4, 4, 4, true, 150, 'gigabyte b650m aorus elite ax', re('b650m aorus elite ax'),
      'Strong mATX B650 with a decent VRM and Wi-Fi. Great for compact builds that still run an X3D chip.'),
    B('mb-b650m-tuf-wifi', 'ASUS TUF Gaming B650M-Plus WiFi', 'ASUS', 'AM5', 'B650', 'mATX', 4, 2, 4, 4, 4, true, 170, 'asus tuf gaming b650m-plus wifi', re('b650m-plus wifi'),
      'Dependable mATX B650 with a good VRM and fan headers. Priced above B650 average — compare against B850 boards.'),
    B('mb-b650e-max', 'ASUS B650E MAX Gaming WiFi', 'ASUS', 'AM5', 'B650E', 'ATX', 4, 3, 5, 4, 5, true, 171, 'asus b650e max gaming wifi', re('b650e max gaming'),
      'B650E adds PCIe 5.0 for the GPU slot and a Gen5 M.2 slot. Good if you want a Gen5 SSD without paying X870 money.'),
    B('mb-b650i-lightning', 'ASRock B650I Lightning WiFi', 'ASRock', 'AM5', 'B650', 'ITX', 2, 2, 4, 2, 4, true, 146, 'asrock b650i lightning wifi', re('b650i lightning'),
      'Affordable mini-ITX AM5. Two DIMM slots, two M.2 slots, two SATA ports — the compact route for a 7800X3D or 9800X3D.'),
    B('mb-b850-pro-a', 'ASRock B850 Pro-A', 'ASRock', 'AM5', 'B850', 'ATX', 4, 4, 5, 4, 5, false, 135, 'asrock b850 pro-a', re('b850 pro-a(?! wifi)'),
      'Cheap B850: PCIe 5.0 GPU slot and four M.2 slots but no Wi-Fi. The WiFi variant costs a bit more.'),
    B('mb-b850-prime-wifi', 'ASUS PRIME B850-PLUS WIFI', 'ASUS', 'AM5', 'B850', 'ATX', 4, 3, 5, 4, 5, true, 160, 'asus prime b850-plus wifi', re('prime b850-plus wifi'),
      'Sensible B850: PCIe 5.0 GPU slot, Gen5 M.2, Wi-Fi 6E, understated design.'),
    B('mb-b850m-eagle', 'Gigabyte B850M Eagle WiFi6E', 'Gigabyte', 'AM5', 'B850', 'mATX', 4, 2, 5, 4, 5, true, 160, 'gigabyte b850m eagle wifi6e', re('b850m eagle'),
      'Compact B850 with PCIe 5.0 and Wi-Fi 6E. Only two M.2 slots, so plan storage.'),
    B('mb-b850-tuf-e', 'ASUS TUF Gaming B850-E WiFi', 'ASUS', 'AM5', 'B850', 'ATX', 4, 3, 5, 4, 5, true, 170, 'asus tuf gaming b850-e wifi', re('tuf gaming b850-e'),
      'The popular upper-mid B850: strong VRM for 9800X3D/9950X3D, three M.2 slots (one Gen5), Wi-Fi 6E.'),
    B('mb-x870-prime-p', 'ASUS PRIME X870-P', 'ASUS', 'AM5', 'X870', 'ATX', 4, 4, 5, 4, 5, false, 190, 'asus prime x870-p', re('prime x870-p(?! wifi)'),
      'X870 means USB4 and Gen5 on the GPU slot and M.2. No Wi-Fi on this model (the WiFi version costs more).'),
    B('mb-x870-aorus-elite', 'Gigabyte X870 Aorus Elite WiFi7', 'Gigabyte', 'AM5', 'X870', 'ATX', 4, 4, 5, 4, 5, true, 272, 'gigabyte x870 aorus elite wifi7', re('x870 aorus elite wifi7'),
      'Well-rounded X870 with Wi-Fi 7, USB4 and four M.2 slots. You are paying for I/O and a tidy layout.',
      { share: 'Populating all M.2 slots may disable SATA ports or drop the second PCIe slot to x2 (check the manual).' }),
    B('mb-x870e-gaming-plus', 'MSI X870E Gaming Plus WiFi', 'MSI', 'AM5', 'X870E', 'ATX', 4, 3, 5, 4, 5, true, 200, 'msi x870e gaming plus wifi', re('x870e gaming plus'),
      'The cheapest X870E here — PCIe 5.0 x16 plus Gen5 M.2 and USB4. A sound base for a 9800X3D/9950X3D if you want the top chipset.'),
    B('mb-x870e-tomahawk', 'MSI MAG X870E Tomahawk WiFi', 'MSI', 'AM5', 'X870E', 'ATX', 4, 4, 5, 4, 5, true, 300, 'msi mag x870e tomahawk wifi', re('x870e tomahawk wifi(?! max)'),
      'Strong VRM, Wi-Fi 7, USB4 and four M.2 slots. A premium board for overclocking enthusiasts and heavy multi-drive builds.',
      { share: 'Using all M.2 slots can reduce the second x16 slot to x4.' }),
    B('mb-x870-aorus-pro-ice', 'Gigabyte X870 Aorus Pro ICE', 'Gigabyte', 'AM5', 'X870', 'ITX', 2, 2, 5, 2, 5, true, 265, 'gigabyte x870 aorus pro ice', re('x870 aorus pro ice'),
      'High-end mini-ITX: Wi-Fi 7, USB4, a strong VRM and a white finish. Two DIMM slots mean you should buy 2×24/32 GB kits up front.'),
    B('mb-x870e-hero', 'ASUS ROG Crosshair X870E Hero', 'ASUS', 'AM5', 'X870E', 'ATX', 4, 5, 5, 4, 5, true, 480, 'asus rog crosshair x870e hero', re('crosshair x870e hero(?! btf)'),
      'Flagship-class features: five M.2 slots, 5 GbE, premium VRM and debug tools. You pay for headroom and extras, not gaming FPS.'),
  ];

  /* ---------------- Memory (matched by spec: any brand) ---------------- */
  const R = (id, type, capacity, sticks, speed, cl, price, o) => ({
    id, name: `${capacity}GB (${sticks}×${capacity / sticks}GB) ${type}-${speed} CL${cl}`, brand: 'Various', type, capacity, sticks, speed, cl,
    profile: type === 'DDR4' ? 'XMP' : 'EXPO/XMP', height: 35, price,
    ram: { type, cap: capacity, kit: `${sticks}x${capacity / sticks}`, speed, cl }, ...o,
  });
  const ram = [
    R('ram-d4-16-3200', 'DDR4', 16, 2, 3200, 16, 155, { note: 'The budget AM4 kit — but with DRAM prices at records even 16 GB is no longer cheap. 3200 CL16 is fine; 3600 CL16 is the AM4 sweet spot if the gap is small.' }),
    R('ram-d4-32-3200', 'DDR4', 32, 2, 3200, 16, 295, { note: 'DDR4 is end-of-life and supply is thin, so 32 GB now costs about as much as a mid-range CPU. Compare DDR5 pricing before committing to AM4.' }),
    R('ram-d4-32-3600', 'DDR4', 32, 2, 3600, 18, 300, { note: 'DDR4-3600 is the Infinity Fabric sweet spot (1800 MHz FCLK) for Ryzen 5000. CL18 is looser than the ideal CL16 but fine in practice.' }),
    R('ram-d4-32-3600c16', 'DDR4', 32, 2, 3600, 16, 330, { note: 'The ideal AM4 kit: DDR4-3600 CL16 gives ~8.9 ns true latency and runs 1:1 with the fabric on almost every Ryzen 5000.' }),
    R('ram-d5-16-6000', 'DDR5', 16, 2, 6000, 36, 260, { note: '16 GB is the floor for new builds, and at today\'s prices it is tempting — but 32 GB avoids a paid upgrade later.' }),
    R('ram-d5-32-6000c30', 'DDR5', 32, 2, 6000, 30, 520, { note: 'AM5\'s sweet spot: 6000 MT/s at CL30 runs memory controller and fabric 1:1 (≈10 ns true latency). Dual-profile EXPO/XMP kits are the safest. Pricey right now.' }),
    R('ram-d5-32-6000c36', 'DDR5', 32, 2, 6000, 36, 500, { note: 'Same bandwidth as CL30 but ~20% worse true latency. Acceptable for non-X3D builds when it is meaningfully cheaper.' }),
    R('ram-d5-32-6400c32', 'DDR5', 32, 2, 6400, 32, 550, { note: '6400 CL32 matches 6000 CL30 for true latency, but on AM5 anything above ~6400 may need a 2:1 ratio. Fine if the board is stable at 6400; otherwise run 6000.' }),
    R('ram-d5-64-6000c30', 'DDR5', 64, 2, 6000, 30, 1000, { height: 44, note: '2×32 GB at 6000 CL30: stable on most AM5 boards and leaves two slots free. Only for editing, VMs or very large projects at today\'s prices.' }),
    R('ram-d5-64x4-6000', 'DDR5', 64, 4, 6000, 36, 985, { note: 'Four DDR5 sticks load the memory controller hard; AM5 often falls back to 4800–5400 MT/s for stability. Two larger sticks are almost always the better route.' }),
  ];

  /* ---------------- Graphics cards ---------------- */
  const G = (id, name, brand, vram, tdp, length, slots, conn, rec, perf, lanes, price, q, rx, note) =>
    ({ id, name, brand, vram, tdp, length, slots, conn, rec, perf, lanes, price, q, re: rx, note });
  const gpu = [
    G('gpu-5050', 'NVIDIA GeForce RTX 5050 8GB', 'NVIDIA', 8, 130, 240, 2, { type: '8pin', n: 1 }, 550, 32, 8, 320, 'rtx 5050 8gb', re('rtx ?5050.*8 ?gb'),
      'Entry Blackwell card with DLSS 4. 8 GB of VRAM and a PCIe x8 link limit it to 1080p; on a PCIe 3.0 board (A520 + 5500) it loses extra performance.'),
    G('gpu-5060', 'NVIDIA GeForce RTX 5060 8GB', 'NVIDIA', 8, 145, 240, 2, { type: '8pin', n: 1 }, 550, 42, 8, 385, 'rtx 5060 8gb', re('rtx ?5060(?! ?ti).*8 ?gb'),
      'A solid 1080p card with multi-frame generation, but 8 GB is already tight in new games. Prices vary by partner; the cheapest listing is shown.'),
    G('gpu-5060ti-16', 'NVIDIA GeForce RTX 5060 Ti 16GB', 'NVIDIA', 16, 180, 300, 2.5, { type: '8pin', n: 1 }, 600, 54, 8, 650, 'rtx 5060 ti 16gb', re('rtx ?5060 ?ti.*16 ?gb'),
      'The 16 GB version removes the VRAM limit that cripples the 8 GB model. PCIe x8: on PCIe 3.0 boards it loses noticeable speed.'),
    G('gpu-5070', 'NVIDIA GeForce RTX 5070 12GB', 'NVIDIA', 12, 250, 300, 2.5, { type: '12v', adapter: 2 }, 650, 66, 16, 770, 'rtx 5070 12gb', re('rtx ?5070(?! ?ti).*12 ?gb'),
      'Capable 1440p card with DLSS 4. 12 GB is workable but is the future limiter. Seat the 12V-2x6 connector fully.'),
    G('gpu-5070ti', 'NVIDIA GeForce RTX 5070 Ti 16GB', 'NVIDIA', 16, 300, 330, 3, { type: '12v', adapter: 3 }, 750, 82, 16, 1140, 'rtx 5070 ti 16gb', re('rtx ?5070 ?ti.*16 ?gb'),
      'Comfortable 4K-with-upscaling card and the sweet spot of the Blackwell range. Big triple-slot coolers are common.'),
    G('gpu-5080', 'NVIDIA GeForce RTX 5080 16GB', 'NVIDIA', 16, 360, 340, 3, { type: '12v', adapter: 3 }, 850, 90, 16, 1400, 'rtx 5080 16gb', re('rtx ?5080.*16 ?gb'),
      'Fast 4K card; 16 GB is the long-term question. Wants a quality 850 W+ ATX 3.1 PSU with a native 12V-2x6 cable.'),
    G('gpu-5090', 'NVIDIA GeForce RTX 5090 32GB', 'NVIDIA', 32, 575, 358, 3.5, { type: '12v', adapter: 4 }, 1000, 100, 16, 2500, 'rtx 5090 32gb', re('rtx ?5090.*32 ?gb'),
      'The halo card: 575 W through one connector with almost no margin. Use a native ATX 3.1 cable, seat it fully, avoid tight bends, and have a 1000 W+ PSU. Many models are 4 slots thick.'),
    G('gpu-9060xt-8', 'AMD Radeon RX 9060 XT 8GB', 'AMD', 8, 150, 270, 2, { type: '8pin', n: 1 }, 500, 46, 16, 350, 'rx 9060 xt 8gb', re('rx ?9060 ?xt.*8 ?gb'),
      'RDNA 4 at 1080p with FSR 4. Full x16 link (kinder on PCIe 3.0 boards) but only 8 GB — consider the 16 GB version.'),
    G('gpu-9060xt-16', 'AMD Radeon RX 9060 XT 16GB', 'AMD', 16, 160, 280, 2.5, { type: '8pin', n: 1 }, 500, 48, 16, 500, 'rx 9060 xt 16gb', re('rx ?9060 ?xt.*16 ?gb'),
      'Great-value 16 GB card with a full x16 PCIe link — a sensible partner for older PCIe 3.0/4.0 platforms.'),
    G('gpu-9070gre', 'AMD Radeon RX 9070 GRE 12GB', 'AMD', 12, 220, 300, 2.5, { type: '8pin', n: 2 }, 650, 66, 16, 530, 'rx 9070 gre 12gb', re('rx ?9070 ?gre'),
      'Cut-down 9070 with 12 GB. Needs two separate 8-pin cables.'),
    G('gpu-9070', 'AMD Radeon RX 9070 16GB', 'AMD', 16, 220, 300, 2.5, { type: '8pin', n: 2 }, 650, 72, 16, 650, 'rx 9070 16gb', re('rx ?9070(?! ?xt)(?! ?gre).*16 ?gb'),
      'Efficient 16 GB card with strong ray tracing for AMD. Two 8-pin connectors; use two separate PSU cables.'),
    G('gpu-9070xt', 'AMD Radeon RX 9070 XT 16GB', 'AMD', 16, 304, 320, 3, { type: '8pin', n: 2 }, 750, 80, 16, 800, 'rx 9070 xt 16gb', re('rx ?9070 ?xt.*16 ?gb'),
      'AMD\'s high-end 4K-with-upscaling card. Many partner models use three 8-pin connectors — check your chosen model before buying a PSU.'),
  ];

  /* ---------------- Storage ---------------- */
  const S = (id, name, brand, iface, gen, form, capacity, dram, nand, speed, price, q, rx, note) =>
    ({ id, name, brand, iface, gen, form, capacity, dram, nand, speed, price, q, re: rx, note });
  const storage = [
    S('st-p310-1tb', 'Crucial P310 1TB', 'Crucial', 'm2', 4, 'M.2', 1000, false, 'QLC', 7100, 70, 'crucial p310 1tb', re('p310.*1 ?tb|1 ?tb.*p310'),
      'Gen4 but DRAM-less QLC: quick in bursts, falls off once the SLC cache fills. A fine games drive, a so-so boot drive.'),
    S('st-t500-1tb', 'Crucial T500 1TB', 'Crucial', 'm2', 4, 'M.2', 1000, true, 'TLC', 7300, 95, 'crucial t500 1tb', re('t500.*1 ?tb|1 ?tb.*t500'),
      'DRAM-equipped Gen4 TLC: consistent under load. The heatsink version helps in cramped cases.'),
    S('st-t500-2tb', 'Crucial T500 2TB', 'Crucial', 'm2', 4, 'M.2', 2000, true, 'TLC', 7400, 150, 'crucial t500 2tb', re('t500.*2 ?tb|2 ?tb.*t500'),
      '2 TB is the practical sweet spot: game installs now run 100 GB+ each, and larger drives write faster and last longer.'),
    S('st-990pro-1tb', 'Samsung 990 Pro 1TB', 'Samsung', 'm2', 4, 'M.2', 1000, true, 'TLC', 7450, 110, 'samsung 990 pro 1tb', re('990 pro.*1 ?tb|1 ?tb.*990 pro'),
      'Top-tier Gen4: DRAM cache and strong sustained writes. You pay for consistency, not peak speed.'),
    S('st-990pro-2tb', 'Samsung 990 Pro 2TB', 'Samsung', 'm2', 4, 'M.2', 2000, true, 'TLC', 7450, 190, 'samsung 990 pro 2tb', re('990 pro.*2 ?tb|2 ?tb.*990 pro'),
      'The easy "buy once" boot-and-games drive. The heatsink version is worth it for slots with no board heatsink.'),
    S('st-sn850x-1tb', 'WD_BLACK SN850X 1TB', 'WD', 'm2', 4, 'M.2', 1000, true, 'TLC', 7300, 105, 'wd black sn850x 1tb', re('sn850x.*1 ?tb|1 ?tb.*sn850x'),
      'One of the best-value Gen4 drives with a DRAM cache.'),
    S('st-sn850x-2tb', 'WD_BLACK SN850X 2TB', 'WD', 'm2', 4, 'M.2', 2000, true, 'TLC', 7300, 175, 'wd black sn850x 2tb', re('sn850x.*2 ?tb|2 ?tb.*sn850x'),
      'A fast, DRAM-equipped 2 TB drive. The heatsink version is a near-must in a slot with no board heatsink.'),
    S('st-nm790-2tb', 'Lexar NM790 2TB', 'Lexar', 'm2', 4, 'M.2', 2000, false, 'TLC', 7400, 140, 'lexar nm790 2tb', re('nm790.*2 ?tb|2 ?tb.*nm790'),
      'DRAM-less but uses Host Memory Buffer and TLC NAND, so it punches above its price. A smart budget 2 TB boot drive.'),
    S('st-t705-2tb', 'Crucial T705 2TB (Gen5)', 'Crucial', 'm2', 5, 'M.2', 2000, true, 'TLC', 14500, 300, 'crucial t705 2tb', re('t705.*2 ?tb|2 ?tb.*t705'),
      'Gen5 speeds that barely improve game load times over Gen4. Runs very hot: needs a heatsink and airflow, plus a Gen5 M.2 slot (AM5 X870/B850/B650E).'),
    S('st-870evo-1tb', 'Samsung 870 EVO 1TB (SATA SSD)', 'Samsung', 'sata', 0, '2.5"', 1000, true, 'TLC', 560, 90, 'samsung 870 evo 1tb', re('870 evo.*1 ?tb|1 ?tb.*870 evo'),
      'Capped by SATA at ~560 MB/s but dependable. Handy when M.2 slots run out; needs a SATA port and SATA power.'),
    S('st-wd20ezbx', 'WD Blue 2TB 7200rpm (CMR HDD)', 'WD', 'sata', 0, '3.5"', 2000, false, 'HDD', 180, 140, 'wd blue wd20ezbx', re('wd20ezbx'),
      'A 7200 rpm CMR hard drive for bulk storage and backups. CMR recording keeps sustained writes consistent; never use it as a boot drive.'),
    S('st-st4000dm004', 'Seagate BarraCuda 4TB (SMR HDD)', 'Seagate', 'sata', 0, '3.5"', 4000, false, 'HDD', 150, 150, 'seagate barracuda 4tb st4000dm004', re('st4000dm004'),
      'Cheap capacity but SMR (shingled) recording: sustained writes collapse and it is a poor RAID choice. Fine for cold storage only.'),
  ];

  /* ---------------- CPU coolers ---------------- */
  const K = (id, name, brand, type, size, rating, noise, price, q, rx, note) => ({
    id, name, brand, type, ...(type === 'Air' ? { height: size } : { rad: size }), rating, sockets: SOCKETS, noise, price, q, re: rx, note,
  });
  const cooler = [
    K('cl-ak400', 'DeepCool AK400', 'DeepCool', 'Air', 155, 220, 'Medium', 25, 'deepcool ak400', re('ak400(?! digital)(?! zero)'),
      'Cheap, reliable single tower and a perfect upgrade over a stock cooler for 65–105 W chips. All AM4 cooler brackets also fit AM5.'),
    K('cl-pa120se', 'Thermalright Peerless Assassin 120 SE', 'Thermalright', 'Air', 155, 245, 'Medium', 35, 'thermalright peerless assassin 120 se', re('peerless assassin 120 se'),
      'Dual-tower air cooler that rivals AIOs costing three times more. Check case width (155 mm) and tall-RAM clearance.'),
    K('cl-ak620', 'DeepCool AK620', 'DeepCool', 'Air', 160, 260, 'Medium', 45, 'deepcool ak620', re('ak620'),
      'Dual-tower with strong cooling for 7800X3D/9800X3D; a step up from the AK400 with similar noise.'),
    K('cl-nhu12s-redux', 'Noctua NH-U12S Redux', 'Noctua', 'Air', 158, 150, 'Low', 50, 'noctua nh-u12s redux', re('nh-u12s redux'),
      'Quiet slim single tower from a brand known for a long warranty and mounting hardware. Not for 200 W+ chips.'),
    K('cl-d15g2', 'Noctua NH-D15 G2', 'Noctua', 'Air', 168, 300, 'Low', 130, 'noctua nh-d15 g2', re('nh-d15 g2(?! (lbc|hbc))'),
      'Flagship air cooler: quiet and extremely capable, but huge. Measure RAM and GPU clearance — it is wide as well as tall.'),
    K('cl-l12s', 'Noctua NH-L12S (low profile)', 'Noctua', 'Air', 70, 130, 'Low', 60, 'noctua nh-l12s', re('nh-l12s'),
      'Low-profile cooler for SFF cases. Great with efficient chips (X3D, 65 W), not for 200 W+ processors.'),
    K('cl-axp120', 'Thermalright AXP120-X67', 'Thermalright', 'Air', 67, 130, 'Medium', 25, 'thermalright axp120-x67', re('axp120'),
      'Ultra-cheap low-profile cooler. Fits SFF builds; fan noise rises quickly under load.'),
    K('cl-lf3-240', 'Arctic Liquid Freezer III 240', 'Arctic', 'AIO', 240, 300, 'Low', 75, 'arctic liquid freezer iii 240', re('liquid freezer iii.*240|lf iii 240'),
      'Outstanding-value 240 mm AIO with an integrated VRM fan. Check the case supports a 240 mm radiator and its thickness.'),
    K('cl-lf3-360', 'Arctic Liquid Freezer III 360', 'Arctic', 'AIO', 360, 350, 'Low', 100, 'arctic liquid freezer iii 360', re('liquid freezer iii.*360|lf iii 360'),
      'Big 360 mm radiator for hot chips (9950X, 9900X). Needs a case that supports a 360 mm radiator.'),
  ];

  /* ---------------- Power supplies ---------------- */
  const P = (id, name, brand, watts, eff, modular, form, native12v, pcie8, price, q, rx, note) =>
    ({ id, name, brand, watts, eff, modular, form, native12v, pcie8, price, q, re: rx, note });
  const psu = [
    P('psu-cx650', 'Corsair CX650 (650W Bronze)', 'Corsair', 650, 'Bronze', 'Non-modular', 'ATX', false, 2, 70, 'corsair cx650', re('\\bcx650(?!m)'),
      'Budget unit for modest 1080p builds. Non-modular, no native 16-pin cable, only two 8-pin GPU connectors.'),
    P('psu-rm750e', 'Corsair RM750e (750W Gold, ATX 3.1)', 'Corsair', 750, 'Gold', 'Fully modular', 'ATX', true, 4, 100, 'corsair rm750e', re('rm750e'),
      'Excellent mainstream pick: ATX 3.1, native 12V-2x6 cable and plenty of 8-pin headroom for mid-range GPUs.'),
    P('psu-rm850e', 'Corsair RM850e (850W Gold, ATX 3.1)', 'Corsair', 850, 'Gold', 'Fully modular', 'ATX', true, 4, 115, 'corsair rm850e', re('rm850e'),
      'The default recommendation for RTX 5070 Ti / RX 9070 XT class systems.'),
    P('psu-rm1000e', 'Corsair RM1000e (1000W Gold, ATX 3.1)', 'Corsair', 1000, 'Gold', 'Fully modular', 'ATX', true, 6, 120, 'corsair rm1000e', re('rm1000e'),
      'Headroom for an RTX 5090 or a power-hungry CPU. Priced almost the same as 850 W units — fair value.'),
    P('psu-pp12m-750', 'be quiet! Pure Power 12 M 750W (Gold)', 'be quiet!', 750, 'Gold', 'Fully modular', 'ATX', true, 4, 105, 'be quiet pure power 12 m 750w', re('pure power 12 m.*750|750w.*pure power 12 m'),
      'Quiet, fully modular Gold unit with a native 12V-2x6 cable.'),
    P('psu-a850gl', 'MSI MAG A850GL PCIE5 (850W Gold)', 'MSI', 850, 'Gold', 'Fully modular', 'ATX', true, 4, 110, 'msi mag a850gl', re('a850gl'),
      'Value ATX 3.x unit with a native 12V-2x6 cable.'),
    P('psu-hx1200i', 'Corsair HX1200i (1200W Platinum, ATX 3.1)', 'Corsair', 1200, 'Platinum', 'Fully modular', 'ATX', true, 6, 245, 'corsair hx1200i', re('hx1200i(?! shift)'),
      'Overhead for an RTX 5090 plus a hungry CPU. Efficiency peaks at 40–60% load, so spare capacity is not wasted so much as quiet.'),
    P('psu-sf750', 'Corsair SF750 (750W Platinum, SFX)', 'Corsair', 750, 'Platinum', 'Fully modular', 'SFX', true, 3, 175, 'corsair sf750', re('sf750'),
      'SFX unit for small cases. Cable lengths and the limited 8-pin count matter — check it powers your GPU directly.'),
    P('psu-v850sfx', 'Cooler Master V850 SFX Gold (850W)', 'Cooler Master', 850, 'Gold', 'Fully modular', 'SFX', true, 3, 160, 'cooler master v850 sfx gold', re('v850 sfx'),
      'More wattage in SFX for hungrier compact builds. Smaller fans can be louder under load.'),
  ];

  /* ---------------- Cases ---------------- */
  const Z = (id, name, brand, forms, psuForms, maxGpu, maxGpuSlots, maxCooler, radMax, fans, bays35, bays25, price, q, rx, note) =>
    ({ id, name, brand, forms, psuForms, maxGpu, maxGpuSlots, maxCooler, radMax, fans, bays35, bays25, price, q, re: rx, note });
  const ATX = ['ATX', 'mATX', 'ITX'];
  const pcase = [
    Z('case-q300l', 'Cooler Master Q300L V2', 'Cooler Master', ['mATX', 'ITX'], ['ATX'], 360, 3, 159, 240, 1, 1, 2, 55, 'cooler master q300l v2', re('q300l'),
      'Budget mATX cube with a mesh front. Very limited cooler height (159 mm), one fan, little cable space.'),
    Z('case-h5flow', 'NZXT H5 Flow', 'NZXT', ATX, ['ATX'], 365, 4, 165, 280, 2, 1, 2, 90, 'nzxt h5 flow', re('h5 flow'),
      'Compact mid-tower with a perforated front and two fans. Tight rear cable space, so a modular PSU helps.'),
    Z('case-4000d', 'Corsair 4000D Airflow', 'Corsair', ATX, ['ATX'], 360, 4, 170, 360, 2, 2, 2, 90, 'corsair 4000d airflow', re('4000d airflow'),
      'Easy to build in with good cable routing. The mesh front is a bit restrictive compared with true high-airflow designs.'),
    Z('case-lancool216', 'Lian Li Lancool 216', 'Lian Li', ATX, ['ATX'], 392, 4, 180, 360, 3, 2, 2, 95, 'lian li lancool 216', re('lancool 216|lancool ii'),
      'Outstanding airflow per pound: large front fans, space for long GPUs, tall coolers and 360 mm radiators.'),
    Z('case-north', 'Fractal Design North', 'Fractal', ATX, ['ATX'], 355, 4, 170, 360, 2, 2, 2, 130, 'fractal design north', re('fractal design north'),
      'Design-led case with a wood-effect front. The mesh variant keeps temps in check; solid-front/glass variants run warmer.'),
    Z('case-torrent', 'Fractal Design Torrent', 'Fractal', ATX, ['ATX'], 423, 4, 188, 420, 5, 2, 2, 180, 'fractal design torrent', re('fractal design torrent'),
      'An airflow monster with huge front fans and bottom intake. The trade-off is fan noise and footprint.'),
    Z('case-o11-evo', 'Lian Li O11 Dynamic EVO', 'Lian Li', ATX, ['ATX'], 426, 4, 167, 360, 0, 2, 2, 130, 'lian li o11 dynamic evo', re('o11 dynamic evo'),
      'Showpiece dual-chamber case with room for three 360 mm radiators. Ships with no fans — budget for them — and glass on two sides limits airflow.'),
    Z('case-nr200p', 'Cooler Master NR200P', 'Cooler Master', ['ITX'], ['SFX', 'SFX-L'], 336, 3, 155, 280, 2, 0, 2, 110, 'cooler master nr200p', re('nr200p'),
      'The default SFF case: real component clearance. Requires an SFX/SFX-L PSU, cable-management patience and careful part picking.'),
  ];

  const presets = [
    { id: 'p-am4', name: 'AM4 Budget 1080p', blurb: 'Ryzen 5 5600 + RTX 5060 on DDR4 — the cheapest sensible new build.', parts: ['cpu-5600', 'mb-b550m-pro-vdh', 'ram-d4-32-3200', 'gpu-5060', 'st-nm790-2tb', 'psu-cx650', 'case-q300l', 'cl-ak400'] },
    { id: 'p-am4x3d', name: 'AM4 Value 1440p', blurb: 'Ryzen 7 5700X3D + RX 9060 XT 16GB — a cache-fed gaming chip on a proven board.', parts: ['cpu-5700x3d', 'mb-b550-tuf', 'ram-d4-32-3600', 'gpu-9060xt-16', 'st-t500-1tb', 'psu-rm750e', 'case-h5flow', 'cl-pa120se'] },
    { id: 'p-am5-mid', name: 'AM5 1440p', blurb: 'Ryzen 5 7600 + RX 9070 — balanced, with an upgrade path.', parts: ['cpu-7600', 'mb-b650-eagle-ax', 'ram-d5-32-6000c36', 'gpu-9070', 'st-990pro-1tb', 'psu-rm750e', 'case-lancool216', 'cl-pa120se'] },
    { id: 'p-am5-4k', name: 'AM5 4K Gaming', blurb: 'Ryzen 7 9800X3D + RTX 5070 Ti with a 360 mm AIO.', parts: ['cpu-9800x3d', 'mb-b850-tuf-e', 'ram-d5-32-6000c30', 'gpu-5070ti', 'st-sn850x-2tb', 'psu-rm850e', 'case-north', 'cl-lf3-360'] },
    { id: 'p-sff', name: 'AM5 Compact (ITX)', blurb: 'Ryzen 7 7800X3D + RTX 5070 in an NR200P.', parts: ['cpu-7800x3d', 'mb-b650i-lightning', 'ram-d5-32-6000c30', 'gpu-5070', 'st-990pro-1tb', 'psu-sf750', 'case-nr200p', 'cl-lf3-240'] },
    { id: 'p-halo', name: 'AM5 No-Limits Halo', blurb: 'Ryzen 9 9950X3D + RTX 5090, Gen5 SSD, 1200 W PSU.', parts: ['cpu-9950x3d', 'mb-x870e-hero', 'ram-d5-64-6000c30', 'gpu-5090', 'st-t705-2tb', 'st-990pro-2tb', 'psu-hx1200i', 'case-torrent', 'cl-lf3-360'] },
  ];

  const DATA = { categories: CATEGORIES, parts: { cpu, mb, ram, gpu, storage, cooler, psu, case: pcase }, presets };
  DATA.byId = {};
  for (const c of CATEGORIES) for (const p of DATA.parts[c.id]) { p.cat = c.id; p.fallback = p.price; DATA.byId[p.id] = p; }

  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
  else root.DATA = DATA;
})(typeof window !== 'undefined' ? window : globalThis);
