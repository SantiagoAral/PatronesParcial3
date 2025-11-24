// Minimal smoke test for API health
const fetch = require('node-fetch');

(async () => {
  const r = await fetch('http://localhost:3000/health');
  const j = await r.json();
  console.log('health', j);
})();
