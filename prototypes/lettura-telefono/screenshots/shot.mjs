import { chromium } from 'playwright';
const out = process.argv[2];
const only = process.argv[3];
const base = 'http://localhost:8008/';
const browser = await chromium.launch();
const cases = [];
for (const v of ['A', 'B', 'C']) for (const sol of [0, 1]) for (const [w, h] of [[360, 800], [1280, 800]])
  cases.push({ name: `${v}-${sol ? 'soluzione' : 'testo'}-${w}`, q: `variant=${v}&resa=acapo&mut=sempre&corpo=15${sol ? '&soluzione=1' : ''}`, w, h });
cases.push(...['A','B','C'].map((v) => ({ name: `${v}-soluzione-360-pagina-intera`, q: `variant=${v}&resa=acapo&mut=sempre&corpo=15&soluzione=1`, w: 360, h: 800, full: true })));
cases.push({ name: 'A-soluzione-360-scala', q: 'variant=A&resa=scala&mut=sempre&corpo=15&soluzione=1', w: 360, h: 800 });
cases.push({ name: 'A-soluzione-360-zoom065', q: 'variant=A&resa=acapo&mut=sempre&corpo=15&zoom=0.65&soluzione=1', w: 360, h: 800 });
cases.push({ name: 'A-soluzione-360-zoom1', q: 'variant=A&resa=acapo&mut=sempre&corpo=15&zoom=1&soluzione=1', w: 360, h: 800 });
cases.push({ name: 'A-soluzione-360-spaziatura15', q: 'variant=A&resa=acapo&mut=sempre&corpo=15&spaziatura=1.5&soluzione=1', w: 360, h: 800 });
cases.push({ name: 'A-soluzione-360-spaziatura19', q: 'variant=A&resa=acapo&mut=sempre&corpo=15&spaziatura=1.9&soluzione=1', w: 360, h: 800 });
cases.push({ name: 'A-soluzione-360-corpo13', q: 'variant=A&resa=acapo&mut=sempre&corpo=13&soluzione=1', w: 360, h: 800 });
cases.push({ name: 'A-soluzione-360-corpo17', q: 'variant=A&resa=acapo&mut=sempre&corpo=17&soluzione=1', w: 360, h: 800 });
cases.push({ name: 'B-testo-360-mut-solo-con-soluzione', q: 'variant=B&resa=acapo&mut=soluzione&corpo=15', w: 360, h: 800 });
cases.push({ name: 'A-soluzione-360-freude', full: true, q: 'variant=A&resa=acapo&mut=sempre&corpo=15&soluzione=1&lettura=1', w: 360, h: 800 });
cases.push({ name: 'A-soluzione-360-freude-spaziatura15', q: 'variant=A&resa=acapo&mut=sempre&corpo=15&spaziatura=1.5&soluzione=1&lettura=1', w: 360, h: 800, full: true });
cases.push({ name: 'A-soluzione-360-freude-2perrigo', q: 'variant=A&resa=acapo&mut=sempre&corpo=15&perrigo=2&soluzione=1&lettura=1', w: 360, h: 800, full: true });
cases.push({ name: 'A-soluzione-360-2perrigo', q: 'variant=A&resa=acapo&mut=sempre&corpo=15&perrigo=2&soluzione=1', w: 360, h: 800, full: true });
for (const c of cases) {
  if (only && !c.name.includes(only)) continue;
  const p = await browser.newPage({ viewport: { width: c.w, height: c.h }, deviceScaleFactor: c.w < 500 ? 2 : 1 });
  p.on('console', (m) => m.type() === 'error' && console.log(c.name, 'CONSOLE', m.text()));
  p.on('pageerror', (e) => console.log(c.name, 'PAGEERROR', e.message));
  await p.goto(base + '?' + c.q);
  await p.waitForTimeout(300);
  const st = await p.evaluate(() => document.querySelector('#proto-state').textContent);
  const sc = JSON.parse(st);
  const scrollW = await p.evaluate(() => document.documentElement.scrollWidth);
  console.log(c.name, 'righe', sc.righe, 'corpoPx', sc.corpoEffettivoPx, 'svg', sc.svg, 'scalaSvg', sc.scalaSvg, 'scrollW', scrollW);
  await p.screenshot({ path: `${out}/${c.name}.png`, fullPage: !!c.full });
  await p.close();
}
await browser.close();
