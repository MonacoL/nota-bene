// PROTOTIPO: screenshot delle varianti. Uso: node shot.cjs [percorso playwright-core]
const pw = require(process.argv[2] || 'playwright-core');
const casi = process.env.CASI ? JSON.parse(process.env.CASI) : [];
(async () => {
  const b = await pw.chromium.launch({ executablePath: process.env.HOME + '/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome' });
  for (const [nome, q, w = 360, azione = null, full = false] of casi) {
    const p = await b.newPage({ viewport: { width: w, height: w < 500 ? 780 : 900 }, deviceScaleFactor: 2, hasTouch: w < 500 });
    const err = []; p.on('pageerror', (e) => err.push(e.message)); p.on('console', (m) => m.type() === 'error' && err.push(m.text()));
    await p.goto('http://localhost:8009/?' + q); await p.waitForTimeout(250);
    if (azione) { await p.evaluate(azione); await p.waitForTimeout(250); }
    await p.screenshot({ path: `screenshots/${nome}.png`, fullPage: full });
    console.log(nome, err.length ? 'ERRORI ' + err.join(' | ') : 'ok');
    await p.close();
  }
  await b.close();
})();
