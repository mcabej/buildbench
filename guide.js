/* Intricacies guide — each component in depth, kept short. AM4 / AM5 focused. Static, trusted HTML. */
(function (root) {
  const ARTICLES = [
    {
      id: 'platform', title: 'AM4 vs AM5', tag: 'Platform',
      summary: 'Pick the platform first — it decides CPU, motherboard and RAM type at once.',
      body: `
<table class="spec"><thead><tr><th></th><th>AM4</th><th>AM5</th></tr></thead><tbody>
<tr><td>Memory</td><td>DDR4 only</td><td>DDR5 only</td></tr>
<tr><td>CPUs</td><td>Ryzen 1000–5000 (Zen 3 is the last)</td><td>Ryzen 7000 / 8000G / 9000 and newer</td></tr>
<tr><td>PCIe</td><td>3.0 or 4.0</td><td>5.0 GPU/SSD on higher chipsets, 4.0 on budget</td></tr>
<tr><td>Future</td><td>Finished — nothing new is coming</td><td>Still supported; upgrade by swapping the CPU</td></tr>
<tr><td>Coolers</td><td colspan="2">Same mounting holes — any AM4 cooler fits AM5 with the supplied bracket</td></tr>
</tbody></table>
<h4>How to choose</h4>
<ul>
<li><b>AM4</b> wins only on price while DDR4 is available: a Ryzen 5 5600 or 5700X3D with cheap B550 board gives great 1080p/1440p gaming. The trade-off is zero upgrade path.</li>
<li><b>AM5</b> costs more up front (DDR5 plus pricier boards), but buys PCIe 5.0, faster CPUs, and a socket you can upgrade for years.</li>
<li><b>Memory prices have swung hard.</b> DRAM has been unusually expensive and scarce, with DDR4 sometimes costing as much as DDR5. Always price the <i>whole</i> platform (CPU + board + RAM) rather than comparing CPUs alone.</li>
<li>Sticking with AM4 means DDR4-3600 CL16 is the target; AM5 targets DDR5-6000 CL30.</li>
</ul>`,
    },
    {
      id: 'chipsets', title: 'Chipsets in one table', tag: 'Platform',
      summary: 'What the letter-and-number on a board actually changes.',
      body: `
<table class="spec"><thead><tr><th>Chipset</th><th>Socket</th><th>CPU overclock</th><th>Notes</th></tr></thead><tbody>
<tr><td>A520</td><td>AM4</td><td>No</td><td>Budget. PCIe 3.0 on most boards, few M.2/SATA, light VRM.</td></tr>
<tr><td>B550</td><td>AM4</td><td>Yes</td><td>The AM4 sweet spot: PCIe 4.0 GPU slot and first M.2.</td></tr>
<tr><td>X570</td><td>AM4</td><td>Yes</td><td>Most lanes and USB; fan on chipset; rarely worth the extra.</td></tr>
<tr><td>A620</td><td>AM5</td><td>No</td><td>Entry AM5: PCIe 4.0 only, light VRM, fewer ports. Fine with 65 W CPUs.</td></tr>
<tr><td>B840</td><td>AM5</td><td>No</td><td>Cheaper-than-B850 AM5: PCIe 4.0 only, fewer lanes.</td></tr>
<tr><td>B650 / B650E</td><td>AM5</td><td>Yes</td><td>B650 = PCIe 5.0 SSD, 4.0 GPU. B650E adds a 5.0 GPU slot.</td></tr>
<tr><td>B850</td><td>AM5</td><td>Yes</td><td>B650E successor: PCIe 5.0 GPU slot, newer I/O.</td></tr>
<tr><td>X870 / X870E</td><td>AM5</td><td>Yes</td><td>USB4 required; X870E adds more PCIe 5.0 lanes (usually two chipsets).</td></tr>
</tbody></table>
<p>Rule of thumb: buy the cheapest chipset that has the ports, M.2 slots and VRM your CPU needs. X-series boards add connectivity, not frame rate.</p>`,
    },
    {
      id: 'cpu', title: 'CPUs', tag: 'Components',
      summary: 'Cores, cache, power limits and why X3D chips are different.',
      body: `
<h4>In a nutshell</h4>
<p>For gaming, <b>cache and per-core speed</b> matter most (hence the X3D chips). For rendering, compiling and VMs, <b>core count</b> does. Most games stop scaling beyond 8 cores.</p>
<h4>The intricacies</h4>
<ul>
<li><b>Reading the name:</b> <b>X</b> = higher clocks, <b>X3D</b> = stacked 3D V-Cache, <b>G</b> = integrated graphics (APU), <b>F</b> = no iGPU, no suffix = efficient 65 W part.</li>
<li><b>TDP ≠ power draw.</b> A 65 W Ryzen can pull 88 W (PPT); a 105 W part 142 W; a 120 W part 162 W; a 170 W part 230 W. Size coolers and PSUs against the PPT.</li>
<li><b>3D V-Cache:</b> a huge L3 helps game frame-times. First-gen (5800X3D/5700X3D/7800X3D) caches sit on top of the cores, so voltage is locked and heat is trapped. Second-gen (9800X3D) puts cache underneath — higher clocks, easier cooling, overclockable.</li>
<li><b>Dual-chiplet chips</b> (X3D with 12/16 cores): only one chiplet has V-Cache. Games must run on that one — keep the AMD chipset driver and Xbox Game Bar enabled so Windows schedules correctly.</li>
<li><b>Cut-down variants:</b> the Ryzen 5 5500 has 16 MB L3 and PCIe 3.0 (only), unlike the 5600. The 8600G APU has 16 MB L3 and a PCIe 4.0 x8 link to the GPU.</li>
<li><b>Stock coolers:</b> only the 65 W "non-X" parts and a few others ship with one (Wraith Stealth/Prism). X, X3D and Ryzen 9000 chips ship without.</li>
<li><b>BIOS support:</b> boards built before a CPU launched may need a flash. Ryzen 9000 on older A620/B650/X670E boards, or Ryzen 5000 on older A520/B550, needs a BIOS update (look for a "Ready" sticker or BIOS Flashback).</li>
<li><b>Boost behaviour:</b> PBO and Curve Optimizer give small gains and need a chipset that allows CPU overclocking; A-series and B840 do not.</li>
</ul>`,
    },
    {
      id: 'mb', title: 'Motherboards', tag: 'Components',
      summary: 'Form factor, VRM, lanes, M.2 sharing and BIOS support.',
      body: `
<h4>In a nutshell</h4>
<p>The board sets your platform (socket + RAM type), how many drives you can fit, and how well it feeds a hungry CPU. You are paying for <b>power delivery and connectivity</b>, not speed.</p>
<h4>The intricacies</h4>
<ul>
<li><b>Form factor:</b> ATX &gt; mATX &gt; Mini-ITX. Smaller boards fit bigger cases, never the reverse. Smaller = fewer slots, fewer SATA ports, higher price per feature.</li>
<li><b>VRM:</b> the power stage that feeds the CPU. Match tier to CPU — a basic A520/A620 board with a 105 W+ CPU runs hot and may throttle. Look for VRM heatsinks.</li>
<li><b>M.2 lane sharing:</b> extra M.2 slots hang off the chipset or steal lanes from the second PCIe slot or SATA ports. Always check the "M.2 / SATA sharing" table in the manual before filling a board.</li>
<li><b>PCIe versions:</b> a Gen5 SSD in a Gen4 slot runs at Gen4. A card with only 8 lanes (RTX 5050/5060/5060 Ti) loses real performance on a PCIe 3.0 link (A520 boards, Ryzen 5500).</li>
<li><b>DIMM slots:</b> 2-DIMM boards (some mATX/ITX) cap you at two sticks, so buy the capacity up front. On 4-slot boards, use A2 + B2 for two sticks.</li>
<li><b>Wi-Fi, 2.5G, USB4:</b> cheap boards often omit Wi-Fi or have only a few rear USB ports. Check the rear I/O.</li>
<li><b>BIOS Flashback:</b> a button that updates the BIOS from a USB stick <i>without a CPU installed</i>. Very handy when a new CPU is older than the board's BIOS.</li>
<li><b>First boot on AM5</b> can take several minutes while memory trains. Don't power-cycle; wait.</li>
</ul>`,
    },
    {
      id: 'ram', title: 'Memory (RAM)', tag: 'Components',
      summary: 'Channels, speed vs. latency, EXPO/XMP and why four sticks are trouble.',
      body: `
<h4>In a nutshell</h4>
<p>Buy <b>two matched sticks</b> (dual channel), enable the <b>EXPO/XMP</b> profile in BIOS, and aim for the platform sweet spot: <b>DDR5-6000 CL30</b> on AM5, <b>DDR4-3600 CL16</b> on AM4.</p>
<h4>The intricacies</h4>
<ul>
<li><b>True latency</b> (ns) = <code>CL × 2000 ÷ MT/s</code>. DDR5-6000 CL30 = 10.0 ns; CL36 = 12.0 ns; DDR4-3600 CL16 = 8.9 ns.</li>
<li><b>AM5 ratios:</b> up to ~6000–6400 MT/s the memory controller runs 1:1 (UCLK=MCLK) for best latency. Faster kits can push it to 2:1 and lose performance.</li>
<li><b>AM4 fabric:</b> Ryzen 5000's Infinity Fabric tops out near 1800–1900 MHz, i.e. DDR4-3600/3800. Faster DDR4 gets no benefit.</li>
<li><b>Single stick = single channel,</b> which can cost 10–25% in games and integrated graphics.</li>
<li><b>Four DDR5 sticks</b> load the controller; AM5 often falls back to 4800–5400 MT/s. Two larger sticks (2×32 GB) beat four smaller ones.</li>
<li><b>Kit vs. kits:</b> buy one matched kit; mixing kits often fails to hit the rated speed.</li>
<li><b>EXPO vs XMP:</b> AMD's and Intel's profile standards. Dual-profile kits work everywhere; EXPO is validated for Ryzen. Without enabling a profile, RAM runs at slow default speed.</li>
<li><b>Capacity:</b> 16 GB is the floor, 32 GB is the sweet spot, 64 GB+ is for editing, VMs, big projects.</li>
<li><b>Clearance:</b> tall heat spreaders (≈50 mm+) can collide with large air coolers.</li>
</ul>
<h4>Market note</h4>
<p>RAM prices have been unusually high and volatile; a 32 GB kit can cost as much as a mid-range CPU. Check live prices and consider buying less now (a 2×16 kit) if the board has spare slots.</p>`,
    },
    {
      id: 'gpu', title: 'Graphics cards', tag: 'Components',
      summary: 'VRAM, board power, lanes, connectors and physical size.',
      body: `
<h4>In a nutshell</h4>
<p>The GPU is the biggest lever for gaming performance. Buy for your <b>resolution and VRAM</b>, then size the PSU and case around it.</p>
<h4>The intricacies</h4>
<ul>
<li><b>VRAM:</b> 8 GB is tight in new games even at 1080p; 12 GB for 1440p; 16 GB+ for high-detail 1440p and 4K. When VRAM runs out, performance collapses (stutter, missing textures).</li>
<li><b>PCIe x8 cards</b> (RTX 5050/5060/5060 Ti): fine on PCIe 4.0/5.0, but on a PCIe 3.0 board (A520 / Ryzen 5500) they lose noticeable performance. Radeon RX 9060 XT / 9070 use a full x16 link, so they suit older platforms better.</li>
<li><b>Power connectors:</b> each 8-pin carries 150 W. Cards with two 8-pin connectors need <i>two separate PSU cables</i> (not a daisy-chain). The 16-pin 12V-2x6 carries up to 600 W.</li>
<li><b>12V-2x6 (16-pin):</b> use the PSU's native cable if it has one; push until it clicks; keep the first ~35 mm straight. An RTX 5090 draws 575 W through one plug with almost no margin.</li>
<li><b>Size:</b> check length <i>and</i> thickness. 3–4 slot cards can block lower slots and M.2 heatsinks, and long ones hit front radiators.</li>
<li><b>Partner variation:</b> the same chip comes in many models with different lengths, coolers, and connector counts (a 9070 XT may use three 8-pin plugs). The price shown is the cheapest listed model — check the exact one.</li>
<li><b>Upscaling and frame generation</b> (DLSS 4, FSR 4) can double frame rates, but add latency and are game-dependent.</li>
<li><b>Resizable BAR</b> should be on (needs a modern BIOS, especially on older AM4 boards).</li>
</ul>`,
    },
    {
      id: 'storage', title: 'Storage', tag: 'Components',
      summary: 'NVMe vs SATA, DRAM and NAND type, heat, SMR hard drives.',
      body: `
<h4>In a nutshell</h4>
<p>One <b>good Gen4 NVMe SSD (1–2 TB)</b> as boot/games drive covers most builds. Gen5 costs a lot more and barely changes real-world speed.</p>
<h4>The intricacies</h4>
<ul>
<li><b>Interfaces:</b> NVMe M.2 Gen3 ≈ 3.5 GB/s, Gen4 ≈ 7 GB/s, Gen5 ≈ 12–14 GB/s; SATA SSD ≈ 550 MB/s; HDD ≈ 150–250 MB/s.</li>
<li><b>DRAM vs DRAM-less:</b> a DRAM cache keeps performance steady under mixed loads. DRAM-less drives that use Host Memory Buffer (e.g., Lexar NM790) are fine; those without it can get slow.</li>
<li><b>TLC vs QLC:</b> TLC holds speed and lasts longer. QLC is cheaper and falls to a crawl once its fast "SLC cache" fills (large installs, updates).</li>
<li><b>Heat:</b> fast drives throttle when hot. Use the board's M.2 heatsink; Gen5 drives <i>need</i> one plus airflow. A big GPU cooler above the top M.2 slot traps heat.</li>
<li><b>PCIe generation:</b> a Gen5 SSD only reaches full speed in a Gen5 M.2 slot (AM5 B650E/B850/X870). It runs at Gen4 otherwise; AM4's M.2 slots top out at Gen4 (B550) or Gen3 (A520).</li>
<li><b>Capacity:</b> modern games are 80–150 GB each. 2 TB is the practical sweet spot; larger drives also write faster and have higher endurance (TBW).</li>
<li><b>HDDs:</b> <b>CMR</b> drives keep sustained writes steady; <b>SMR</b> (cheap Barracuda/WD Blue 4 TB etc.) collapses during long writes and is poor in RAID. Never boot from a hard drive; make sure the case has a 3.5" bay.</li>
<li><b>SSD pricing:</b> flash prices rise and fall in cycles — price 1 TB vs 2 TB at checkout rather than assuming the usual ratio.</li>
</ul>`,
    },
    {
      id: 'cooler', title: 'CPU coolers', tag: 'Components',
      summary: 'Air vs AIO, ratings, clearances, mounting and airflow.',
      body: `
<h4>In a nutshell</h4>
<p>Match the cooler to the CPU's <b>peak power</b>, then check it physically fits the case and RAM. A good $35 dual-tower air cooler matches most 240 mm AIOs.</p>
<h4>The intricacies</h4>
<ul>
<li><b>Air vs AIO:</b> air is cheaper, quieter at idle, has no pump to fail. AIOs move heat to a radiator — better for 200 W+ chips and cramped CPU areas, but have shorter lifetimes.</li>
<li><b>Ratings are loose.</b> Compare a cooler's rated watts against the CPU's PPT (88 / 142 / 162 / 230 W), with margin. 65 W chips are fine with a £25 tower; 16-core chips want a 280–360 mm AIO or top air cooler.</li>
<li><b>Fit:</b> check case max cooler height (air) or radiator size and thickness (AIO). RAM height matters under big air coolers.</li>
<li><b>AM4 ↔ AM5:</b> same mounting holes. Any AM4 cooler fits AM5, but check you have the right backplate/brackets in the box.</li>
<li><b>X3D chips</b> are easy to cool in watts, but their stacked cache limits heat transfer, so they can read high temperatures at low power. That is normal.</li>
<li><b>Installation:</b> remove the base plastic film, pea-sized paste (unless pre-applied), tighten screws in an X pattern, plug the pump into <code>AIO_PUMP</code> / <code>CPU_FAN</code>, and set a gentle fan curve so fans don't ramp on brief boosts.</li>
<li><b>Radiator placement:</b> front radiator = cooler CPU but warmer GPU; top = exhausts heat but uses case air.</li>
</ul>`,
    },
    {
      id: 'psu', title: 'Power supplies', tag: 'Components',
      summary: 'Wattage, efficiency, ATX 3.x, 12V-2x6 and cables.',
      body: `
<h4>In a nutshell</h4>
<p>Quality over wattage. Choose a reputable <b>ATX 3.x, Gold-rated, fully modular</b> unit with ≥30% headroom over your estimated peak load.</p>
<h4>The intricacies</h4>
<ul>
<li><b>Sizing:</b> CPU peak + GPU board power + ~50 W, × 1.3. That covers transient spikes (modern GPUs briefly draw ~2× rated), ageing and the efficiency sweet spot (40–60% load).</li>
<li><b>80 PLUS / Cybenetics</b> rates efficiency, not quality. A good Bronze can beat a bad Gold; check reviews and warranty length (7–10 years is a good sign).</li>
<li><b>ATX 3.x:</b> tolerates GPU power excursions and includes a native 12V-2x6 cable. Without it, you use the GPU's adapter, which needs 3–4 separate 8-pin PSU cables.</li>
<li><b>Never mix cables between PSU brands/models</b> — pinouts differ and can destroy parts.</li>
<li><b>EPS 8-pin (CPU) vs PCIe 8-pin (GPU)</b> look similar but aren't interchangeable.</li>
<li><b>Modular:</b> only plug in the cables you need — easier builds and better airflow, especially in small cases.</li>
<li><b>Form factor:</b> ATX is standard; SFX/SFX-L for small cases. Check the <i>case</i> supports your PSU type and length.</li>
<li><b>12V-2x6 seating:</b> push until it clicks, avoid sharp bends right by the plug, and re-check after closing the panel.</li>
</ul>`,
    },
    {
      id: 'case', title: 'Cases', tag: 'Components',
      summary: 'The clearance numbers and airflow traits that decide fit and temps.',
      body: `
<h4>In a nutshell</h4>
<p>A case is a set of numbers. Confirm each before buying — and favour <b>mesh fronts and included fans</b> over glass fronts.</p>
<h4>The intricacies</h4>
<ul>
<li><b>Motherboard form factor</b> (ATX / mATX / ITX), and <b>PSU type</b> (ATX vs SFX).</li>
<li><b>GPU length and thickness:</b> front radiators or fans reduce usable length. Slot-thickness limits matter in SFF cases.</li>
<li><b>CPU cooler height</b> (air) and <b>radiator support</b> (240 / 280 / 360 mm, and thickness).</li>
<li><b>Drive bays:</b> many modern cases have no 3.5" bays at all.</li>
<li><b>Fans included:</b> three decent fans is a real saving; zero fans (some showpiece cases) is a hidden cost.</li>
<li><b>Airflow:</b> mesh/perforated fronts breathe best; tempered-glass fronts trap heat. Aim for front/bottom intake, rear/top exhaust, slight positive pressure with filters.</li>
<li><b>Behind-the-tray space:</b> ≥25 mm makes cable management comfortable.</li>
<li><b>Front I/O:</b> a front USB-C port needs a matching USB-C header on the board.</li>
<li><b>SFF builds:</b> need an SFX PSU, a low-profile or small AIO, and careful GPU choice. They are compact but more expensive and harder to build.</li>
</ul>`,
    },
    {
      id: 'balance', title: 'Balance & bottlenecks', tag: 'Buying & building',
      summary: 'Where to spend money and how CPU/GPU mismatches show up.',
      body: `
<ul>
<li><b>Resolution decides:</b> 1080p / high refresh is CPU-sensitive; 1440p is balanced; 4K is almost purely GPU-bound.</li>
<li><b>Spending guide for gaming:</b> ~35–45% GPU, 15–25% CPU, the rest across board, RAM, SSD, PSU, cooler and case. For productivity, shift money towards CPU and RAM.</li>
<li><b>Signs of a bottleneck:</b> GPU usage well below 95% with a CPU core pinned → CPU-bound. GPU at 99% → GPU-bound (normal). Stutters rather than low averages often point to VRAM, RAM capacity or slow storage.</li>
<li><b>Look at 1% lows,</b> not just average FPS — they show smoothness.</li>
<li>The balance bar in the builder compares rough gaming tiers; treat it as a guide, not a benchmark.</li>
</ul>`,
    },
    {
      id: 'build', title: 'Build order & first boot', tag: 'Buying & building',
      summary: 'A reliable assembly sequence and the BIOS steps people forget.',
      body: `
<ol>
<li><b>Outside the case:</b> CPU, RAM, M.2 SSD (with heatsink) and — if it fits — the cooler on the bare board.</li>
<li>Check the case has the right <b>standoffs</b> for your board size.</li>
<li>Install the PSU, route cables, mount the board, connect <b>CPU EPS power</b>, the 24-pin, and fan headers.</li>
<li>Install the GPU last (it blocks screwdriver access); connect its power cables.</li>
<li>Connect <b>front-panel headers</b> carefully against the manual.</li>
</ol>
<h4>First boot</h4>
<ul>
<li>Monitor goes into the <b>graphics card</b>, not the motherboard.</li>
<li>Be patient: AM5 can take minutes on first boot to train memory.</li>
<li>In BIOS: update if needed, enable <b>EXPO/XMP</b>, <b>Resizable BAR</b>, check fan curves and boot order.</li>
<li>Install Windows, then chipset and GPU drivers (the AMD chipset driver matters for X3D scheduling).</li>
<li>Stress-test for 20–30 minutes and confirm RAM speed in the OS.</li>
</ul>
<h4>If it won't POST</h4>
<ul>
<li>Reseat RAM until both clips click; try one stick in the recommended slot.</li>
<li>Check the CPU EPS and GPU power connectors.</li>
<li>Use the board's debug LEDs/codes, and try BIOS Flashback if the BIOS is too old.</li>
</ul>`,
    },
    {
      id: 'mistakes', title: 'Common mistakes', tag: 'Buying & building',
      summary: 'The classic ways a perfectly good parts list goes wrong.',
      body: `
<ul>
<li>Monitor plugged into the motherboard, not the graphics card.</li>
<li>Forgetting to enable EXPO/XMP — fast RAM running at default speed.</li>
<li>A single RAM stick or the wrong slots — single-channel performance.</li>
<li>Buying an F-series (no iGPU) CPU with no graphics card yet.</li>
<li>Skipping case measurements — GPU or cooler doesn't fit.</li>
<li>An unknown cheap PSU — the one part that can take others with it.</li>
<li>A half-seated 16-pin GPU cable.</li>
<li>Leaving plastic film on the cooler base; uneven mounting pressure.</li>
<li>PCIe 3.0 platform (A520/Ryzen 5500) with an x8 GPU like the RTX 5060.</li>
<li>Gen5 SSD without a heatsink; SMR hard drive in a RAID.</li>
<li>No Wi-Fi on the board and no Ethernet nearby; no USB stick for the OS.</li>
<li>Buying a matching board with an old BIOS for a new CPU, with no Flashback.</li>
</ul>`,
    },
  ];

  const GLOSSARY = [
    ['TDP / PPT', 'Marketing "thermal design power" versus the real power limit (PPT) a Ryzen boosts to. Use PPT for PSU/cooler sizing.'],
    ['CL (CAS latency)', 'RAM delay in clock cycles. True latency in ns = CL × 2000 ÷ MT/s.'],
    ['MT/s', 'Mega-transfers per second — the RAM\'s data rate (e.g., DDR5-6000).'],
    ['EXPO / XMP', 'Memory overclock profiles (AMD / Intel). Must be enabled in BIOS to reach advertised speed.'],
    ['1:1 / 2:1 mode', 'Ratio of memory-controller to memory clock on AM5. 1:1 is faster; 2:1 kicks in at very high speeds.'],
    ['VRM', 'Voltage regulator module — the board\'s power delivery to the CPU.'],
    ['PCIe lanes', 'Data links between CPU/chipset and cards or SSDs. More lanes = more bandwidth.'],
    ['x8 / x16', 'How many PCIe lanes a card uses. x8 cards lose performance on PCIe 3.0.'],
    ['Resizable BAR', 'Lets the CPU access all GPU memory at once; small gains, and required for Intel Arc.'],
    ['3D V-Cache', 'AMD\'s stacked L3 cache that boosts gaming performance (X3D chips).'],
    ['CCD', 'A chiplet of cores. Dual-CCD chips have cross-chiplet latency; X3D 12/16-core parts put V-Cache on one CCD only.'],
    ['PBO / Curve Optimizer', 'AMD\'s automatic boost tuning. Disabled on A-series/B840 boards.'],
    ['HMB', 'Host Memory Buffer: DRAM-less SSDs borrow a little system RAM for mapping tables.'],
    ['SLC cache', 'A fast buffer region on TLC/QLC SSDs; writes slow dramatically once it fills.'],
    ['TBW', 'Terabytes Written — the endurance rating covered by an SSD\'s warranty.'],
    ['CMR / SMR', 'Conventional vs shingled magnetic recording on HDDs; SMR slows sustained writes.'],
    ['AIO', 'All-in-one liquid cooler: a sealed pump, tubes and radiator.'],
    ['ATX 3.1 / 12V-2x6', 'The current PSU standard and its 16-pin GPU power connector; tolerates large power excursions.'],
    ['EPS 8-pin', 'The CPU power connector (4+4). Do not confuse with GPU PCIe power.'],
    ['iGPU / APU', 'Integrated graphics inside the CPU; APUs (G-series) have a stronger one.'],
    ['POST', 'Power-On Self Test: the board\'s startup check before it hands off to the OS.'],
    ['QVL', 'Qualified Vendor List: memory/drives the board maker has tested.'],
    ['BIOS Flashback', 'A button that updates the BIOS from a USB stick without a CPU installed.'],
  ];

  const GUIDE = { articles: ARTICLES, glossary: GLOSSARY };
  if (typeof module !== 'undefined' && module.exports) module.exports = GUIDE;
  else root.GUIDE = GUIDE;
})(typeof window !== 'undefined' ? window : globalThis);
