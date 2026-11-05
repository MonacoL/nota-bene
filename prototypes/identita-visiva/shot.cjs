const pw = require(process.argv[2]);
const out = process.argv[3];
(async () => {
  const b = await pw.chromium.launch({ executablePath: process.env.HOME + '/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome' });
  const casi = JSON.parse(process.env.CASI);
  for (const [nome, q, w = 360, scheme = 'light', full = false] of casi) {
    const p = await b.newPage({ viewport: { width: w, height: w < 500 ? 780 : 900 }, deviceScaleFactor: 2, colorScheme: scheme });
    const err = []; p.on('pageerror', (e) => err.push(e.message)); p.on('console', (m) => m.type() === 'error' && err.push(m.text()));
    await p.goto('http://localhost:8010/?bar=0&' + q); await p.waitForTimeout(600);
    await p.screenshot({ path: `${out}/${nome}.png`, fullPage: full });
    const st = await p.evaluate(() => document.querySelector('#proto-state').textContent);
    console.log('==', nome, err.length ? 'ERRORI ' + err.join(' | ') : 'ok'); if (process.env.STATO) console.log(st);
    await p.close();
  }
  await b.close();
})();
