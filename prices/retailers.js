/* Retailer metadata shared by the updater (node) and the UI (browser).
   live:true  = prices are fetched automatically (robots.txt-compliant listing pages).
   live:false = no legitimate automated feed; the UI links to the retailer's own search instead. */
(function (root) {
  const enc = encodeURIComponent;
  const RETAILERS = [
    { id: 'scan', name: 'Scan', live: true, search: q => `https://www.scan.co.uk/search?q=${enc(q)}` },
    { id: 'awd', name: 'AWD-IT', live: true, search: q => `https://www.awd-it.co.uk/catalogsearch/result/?q=${enc(q)}` },
    { id: 'ocuk', name: 'Overclockers UK', live: false, why: 'robots.txt disallows search and the site blocks automated requests', search: q => `https://www.overclockers.co.uk/search/index/sSearch/${enc(q)}` },
    { id: 'wcuk', name: 'WaterCoolingUK', live: false, why: 'the site blocks automated requests', search: q => `https://www.watercoolinguk.co.uk/search?q=${enc(q)}` },
    { id: 'amazon', name: 'Amazon UK', live: false, why: 'Amazon prohibits scraping; a price feed needs their affiliate API', search: q => `https://www.amazon.co.uk/s?k=${enc(q)}` },
  ];
  if (typeof module !== 'undefined' && module.exports) module.exports = RETAILERS;
  else root.RETAILERS = RETAILERS;
})(typeof window !== 'undefined' ? window : globalThis);
