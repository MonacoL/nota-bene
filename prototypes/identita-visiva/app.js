// PROTOTIPO usa-e-getta (issue #20). Nessuna astrazione, nessun test, nessuna persistenza.
/* global ABCJS */

const VARIANTI = {
  A: 'Partitura: serif + bordeaux',
  B: 'Leggibile: Atkinson + blu',
  C: 'Caldo: Fraunces/Inter + verde',
  D: 'Sistema: font del telefono + viola',
};
const CHIAVI = Object.keys(VARIANTI);
const SCHERMATE = ['percorso', 'capitolo', 'esercizio', 'lettura'];

const params = new URLSearchParams(location.search);
const state = {
  variant: CHIAVI.includes(params.get('variant')) ? params.get('variant') : 'A',
  schermata: SCHERMATE.includes(params.get('schermata')) ? params.get('schermata') : 'percorso',
  tema: ['chiaro', 'scuro'].includes(params.get('tema')) ? params.get('tema') : 'auto',
  esito: ['giusto', 'sbagliato'].includes(params.get('esito')) ? params.get('esito') : 'nessuno',
  soluzione: params.get('soluzione') === '1',
  suona: params.has('suona') ? Number(params.get('suona')) : null, // nota illuminata fissa, per le schermate
};
if (params.get('bar') === '0') document.body.classList.add('nobar');

const $ = (s, r = document) => r.querySelector(s);
const mq = matchMedia('(prefers-color-scheme: dark)');
const scuro = () => state.tema === 'scuro' || (state.tema === 'auto' && mq.matches);

function syncUrl() {
  const p = new URLSearchParams();
  p.set('variant', state.variant);
  p.set('schermata', state.schermata);
  if (state.tema !== 'auto') p.set('tema', state.tema);
  if (state.esito !== 'nessuno') p.set('esito', state.esito);
  if (state.soluzione) p.set('soluzione', '1');
  if (params.get('bar') === '0') p.set('bar', '0');
  history.replaceState(null, '', '?' + p.toString());
}

// ---------- Segni del nome (intestazione + favicon) ----------

const SEGNO = {
  // A: corona (fermata) sopra il nome in maiuscoletto: "fermati e nota bene".
  A: () => `<svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><path d="M3 17a10 10 0 0 1 20 0" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-linecap="round"/><circle cx="13" cy="15.5" r="2.6" fill="var(--accent)"/></svg>`,
  // B: testa di nota inclinata con gambo, nel colore d'accento.
  B: () => `<svg width="22" height="28" viewBox="0 0 22 28" aria-hidden="true"><ellipse cx="9" cy="21" rx="7.2" ry="5" transform="rotate(-22 9 21)" fill="var(--accent)"/><rect x="14.6" y="2" width="2.6" height="19" rx="1.3" fill="var(--accent)"/></svg>`,
  // C: timbro tondo con "nb".
  C: () => `<svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="14" fill="var(--accent)"/><text x="15" y="20.5" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="700" font-size="16" fill="var(--accent-ink)">nb</text></svg>`,
  // D: solo testo.
  D: () => '',
};
// Le favicon non vedono i font web: solo forme.
const FAVICON = {
  A: (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="${c}"/><path d="M5 22a11 11 0 0 1 22 0" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/><circle cx="16" cy="20" r="3.4" fill="#fff"/></svg>`,
  B: (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="${c}"/><ellipse cx="13" cy="22" rx="7" ry="5" transform="rotate(-22 13 22)" fill="#fff"/><rect x="18.2" y="5" width="3" height="17" rx="1.5" fill="#fff"/></svg>`,
  C: (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="${c}"/><text x="16" y="22" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="17" fill="#fff">nb</text></svg>`,
  D: (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="${c}"/><text x="16" y="23" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="700" font-size="20" fill="#fff">N</text></svg>`,
};

function intestazione() {
  return `<header class="top"><div class="wrap">
    <a class="marchio" href="#">${SEGNO[state.variant]()}<span class="nome">Nota Bene</span></a>
    <span class="lingua"><b>IT</b> · EN</span>
  </div></header>`;
}

// ---------- Icone ----------
const ICONA = {
  diapason: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 3v8a3 3 0 0 0 6 0V3M12 14v7"/></svg>',
  ascolta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" stroke-linecap="round"/></svg>',
  occhio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  avanti: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  ok: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>',
  ko: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
};

// ---------- Schermate ----------

const CAPITOLI = [
  ['Note, toni e semitoni', 'Il pentagramma, i nomi delle Note, diesis e bemolle'],
  ['Chiavi', 'Violino, violino ottava bassa, basso'],
  ['Figure e pause', 'Quanto dura una nota'],
  ['Tempi semplici e composti', 'Battuta, Pulsazione, levare'],
  ['Scala maggiore', 'Gradi, Tonalità, Armatura'],
  ['Scala minore', 'Relativa, naturale, armonica, melodica'],
  ['Modo maggiore e minore', 'Riconoscere Tonica e Modo'],
  ['Intervalli', 'Quinta, terza, quarta, poi gli altri'],
  ['DO mobile', 'Le Sillabe DO…TI'],
  ['DO mobile avanzato', 'Sillabe cromatiche e Mutazione'],
];

function percorso() {
  return `${intestazione()}<main class="wrap">
    <h1>Percorso</h1>
    <p class="muted">Dieci Capitoli, dalla scala maggiore al DO mobile. L’ordine è un consiglio: puoi aprire qualunque Capitolo.</p>
    <ol class="capitoli">${CAPITOLI.map(([t, d], i) => `<li><a href="#"><span class="n">${i + 1}</span><span class="t">${t}</span><span class="d">${d}</span></a></li>`).join('')}</ol>
    <div class="blocco"><h2 style="margin-top:0">Letture</h2><p>Estratti di Brani corali veri da cantare a prima vista con il DO mobile.</p>
    <a class="btn primario" style="display:inline-flex;align-items:center;text-decoration:none" href="#">Vai alle Letture</a></div>
  </main>`;
}

function capitolo() {
  return `${intestazione()}<main class="wrap">
    <p class="muted" style="margin:14px 0 0">Capitolo 8</p>
    <h1>Intervalli</h1>
    <p>Un intervallo è la distanza fra due Note. Si dice con un <strong>numero</strong>, che conta le Note scritte comprese le due estreme, e con una <strong>qualità</strong>, che conta i semitoni.</p>
    <p>Da Do4 a Sol4 ci sono cinque Note (Do, Re, Mi, Fa, Sol): è una quinta. I semitoni sono sette, quindi è una <em>quinta giusta</em>. Da Do4 a Sol♭4 la quinta diventa diminuita; da Fa♯4 a Do♯5 resta giusta.</p>
    <div id="esempio" class="rigo-es" style="max-width:340px"></div>
    <p class="muted" style="font-size:.9rem;text-align:center">Quinta giusta, poi quinta diminuita.</p>
    <h2>La terza</h2>
    <p>La terza maggiore ha quattro semitoni (Do–Mi), la terza minore tre (La–Do). È l’intervallo che decide il Modo di una scala.</p>
    <p><a href="#">Esercizi del Capitolo →</a></p>
  </main>`;
}

function esercizio() {
  const foglio = state.esito === 'nessuno' ? '' : state.esito === 'giusto'
    ? `<div class="foglio"><div class="in">
        <span class="esito">${ICONA.ok} Giusto</span>
        <p style="margin:10px 0 4px">È il <strong>Sol♯4</strong>: secondo rigo, con il diesis davanti.</p>
        <button class="btn primario">Avanti →</button></div></div>`
    : `<div class="foglio ko"><div class="in">
        <span class="esito">${ICONA.ko} Non è così</span>
        <p style="margin:10px 0 2px">Hai risposto <strong>La♭</strong>. La risposta giusta è <strong>Sol♯</strong>.</p>
        <p class="muted" style="font-size:.95rem;margin:0 0 4px">Sul pianoforte è lo stesso tasto, ma qui la nota è scritta sul rigo del Sol con il diesis.</p>
        <button class="btn primario">Avanti →</button></div></div>`;
  return `${intestazione()}<main class="wrap">
    <div class="schede" role="tablist" style="margin-top:12px"><button role="tab" aria-selected="true">Nomina la nota</button><button role="tab" aria-selected="false">Chiavi miste</button></div>
    <div class="avanz" aria-label="3 di 10"><i></i></div>
    <p class="muted" style="font-size:.9rem;margin:6px 0 0">3 di 10</p>
    <p class="domanda">Che nota è questa?</p>
    <div id="esempio" class="rigo-es"></div>
  </main>
  <div class="tastiera"><div class="righe">
    <div class="r alt"><button class="btn">♭</button><button class="btn" >♮</button><button class="btn" aria-pressed="true">♯</button></div>
    <div class="r nomi">${['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'].map((n) => `<button class="btn"${n === 'Sol' ? ' aria-pressed="true"' : ''}>${n}</button>`).join('')}</div>
    <button class="btn primario">Verifica</button>
  </div></div>${foglio}`;
}

const ADESTE = {
  head: 'M:4/4\nL:1/4\nQ:1/4=84\nK:G',
  note: 'G | G2 D G | A2 D2 | B A B c | B2 A G | G2 F "^DO→Re"E | F G A B | F2 (E3/2 D/2-) | D3 |]',
  testo: 'A-|des-te fi-|de-les,|lae-ti tri-um-|phan-tes, ve-|ni-te ve-|ni-te in Beth-|le-hem. _|',
  sillabe: 'DO|DO SOL DO|RE SOL|MI RE MI FA|MI RE DO|DO TI RE|MI FA SOL LA|MI RE DO|',
};

function lettura() {
  return `${intestazione()}<main class="wrap">
    <div class="titolo-lettura"><h1 style="margin-bottom:0">Adeste fideles</h1><span class="voce">Soprano · battute 1–8</span></div>
    <div id="score"></div>
    <p class="attrib">Adeste fideles, attr. J. F. Wade · CPDL, edizione di esempio · CPDL License <a href="#">Dettagli</a></p>
  </main>
  <nav class="barra"><div class="in">
    <button><span class="pill">${ICONA.diapason}</span>Riferimento tonale</button>
    <button data-azione="ascolto"><span class="pill">${ICONA.ascolta}</span>Ascolto di verifica</button>
    <button data-azione="soluzione" aria-pressed="${state.soluzione}"><span class="pill">${ICONA.occhio}</span>${state.soluzione ? 'Nascondi' : 'Mostra'} Soluzione</button>
    <button><span class="pill">${ICONA.avanti}</span>Lettura successiva</button>
  </div></nav>`;
}

// ---------- Partiture ----------

let visualObj = null;
let cursore = null;

function vocalfont() {
  const f = getComputedStyle($('#app')).getPropertyValue('--vocal').trim().replace(/"/g, '');
  return `%%vocalfont "${f}" 15\n%%annotationfont "${f}" bold 13\n`;
}

function renderPartiture() {
  const es = $('#esempio');
  if (es) {
    const abc = state.schermata === 'esercizio'
      ? 'X:1\nL:1/1\nK:C clef=treble\n^G |]\n'
      : 'X:1\nL:1/2\nK:C\n[CG] [C_G] |]\n';
    ABCJS.renderAbc(es, abc, { responsive: 'resize', staffwidth: 220, scale: 1.4, paddingleft: 0, paddingright: 0 });
  }
  const el = $('#score');
  if (!el) return;
  const l = ADESTE;
  const w = Math.floor(el.clientWidth);
  // A capo fissi (2 Battute su telefono, 4 su desktop): l'a capo vero è quello di #8,
  // qui serve solo che le sillabe non si tocchino per giudicare font e colori.
  const note = l.note.split('|').map((x) => x.trim()).filter((x) => x && x !== ']');
  const dividi = (t) => t.split('|').map((x) => x.trim());
  const [te, si] = [dividi(l.testo), dividi(l.sillabe)];
  const k = w < 500 ? 2 : 4;
  let corpo = '';
  for (let i = 0; i < note.length; i += k) {
    const j = Math.min(i + k, note.length);
    corpo += note.slice(i, j).join(' | ') + (j === note.length ? ' |]' : ' |') + '\n';
    corpo += 'w: ' + te.slice(i, j).join(' | ') + ' |\nw: ' + si.slice(i, j).join(' | ') + ' |\n';
  }
  visualObj = ABCJS.renderAbc(el, `X:1\n%%stretchlast 1\n${vocalfont()}${l.head}\n${corpo}`, {
    add_classes: true, scale: 0.8, staffwidth: w - 44, paddingleft: 0, paddingright: 0,
  })[0];
  el.querySelectorAll('.abcjs-lyric tspan:nth-child(2)').forEach((t) => t.classList.add('riga-sillabe'));
  el.classList.toggle('sillabe-nascoste', !state.soluzione);
  if (state.suona !== null) {
    const n = el.querySelectorAll('.abcjs-note')[state.suona];
    if (n) n.classList.add('suona');
    const ly = el.querySelectorAll('.abcjs-lyric')[state.suona];
    if (ly) ly.classList.add('suona');
  }
}

// Ascolto simulato: illumina le note senza suono (il suono è già deciso in ADR-0008).
function ascolto() {
  if (cursore) { cursore.stop(); cursore = null; evidenzia(null); return; }
  cursore = new ABCJS.TimingCallbacks(visualObj, { eventCallback: (ev) => { evidenzia(ev); if (!ev) cursore = null; } });
  cursore.start();
}
function evidenzia(ev) {
  document.querySelectorAll('#score .suona').forEach((e) => e.classList.remove('suona'));
  if (ev && ev.elements) ev.elements.flat().forEach((e) => e.classList.add('suona'));
}

// ---------- Contrasti WCAG ----------

function lum(hex) {
  const v = hex.replace('#', '').match(/../g).map((x) => parseInt(x, 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}
function ratio(a, b) { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); }

function contrasti() {
  const cs = getComputedStyle($('#app'));
  const t = (k) => cs.getPropertyValue('--' + k).trim();
  // [cosa, primo piano, sfondo, soglia AA]
  const coppie = [
    ['testo / sfondo', 'ink', 'bg', 4.5], ['testo / superficie', 'ink', 'surface', 4.5],
    ['secondario / sfondo', 'muted', 'bg', 4.5], ['accento / sfondo (link)', 'accent', 'bg', 4.5],
    ['su accento (pulsante)', 'accent-ink', 'accent', 4.5], ['Sillabe / sfondo', 'sol', 'bg', 4.5],
    ['nota che suona / sfondo', 'suona', 'bg', 3], ['giusto / suo fondo', 'ok', 'ok-bg', 4.5],
    ['sbagliato / suo fondo', 'ko', 'ko-bg', 4.5], ['bordo pulsante / superficie', 'line', 'surface', 1],
  ];
  return coppie.map(([n, a, b, s]) => {
    const r = ratio(t(a), t(b));
    return `${r >= s ? '✓' : '✗'} ${r.toFixed(1).padStart(4)}  ${n}${s > 1 ? ' (AA ' + s + ')' : ''}`;
  }).join('\n');
}

const PESI = { A: 'Source Serif 4 600/700 + Source Sans 3 400/600/700 = 90 KB', B: 'Atkinson Hyperlegible Next 400/700 = 25 KB', C: 'Fraunces 600/700 + Inter 400/600/700 = 109 KB', D: 'nessun font scaricato = 0 KB' };

function renderProtoState() {
  $('#proto-label').textContent = `${state.variant} (${VARIANTI[state.variant]})`;
  $('#proto-schermata').value = state.schermata;
  $('#proto-tema').value = state.tema;
  $('#proto-esito').value = state.esito;
  $('#proto-state').textContent = `tema effettivo: ${scuro() ? 'scuro' : 'chiaro'}\nfont: ${PESI[state.variant]}\n  + ♭♮♯ da Noto Music ridotto = 2,6 KB\n\nContrasti WCAG 2.1 (tema corrente)\n${contrasti()}`;
}

// ---------- Montaggio ----------

function render() {
  const app = $('#app');
  app.dataset.v = state.variant;
  if (scuro()) app.dataset.scuro = ''; else delete app.dataset.scuro;
  document.documentElement.style.colorScheme = scuro() ? 'dark' : 'light';
  app.innerHTML = { percorso, capitolo, esercizio, lettura }[state.schermata]();
  const accent = getComputedStyle(app).getPropertyValue('--accent').trim();
  $('#favicon').href = 'data:image/svg+xml,' + encodeURIComponent(FAVICON[state.variant](accent));
  document.fonts.ready.then(renderPartiture);
  syncUrl();
  renderProtoState();
}

document.addEventListener('click', (e) => {
  const p = e.target.closest('[data-proto]');
  if (p) {
    const i = CHIAVI.indexOf(state.variant);
    if (p.dataset.proto === 'more') { $('#proto-more').hidden = !$('#proto-more').hidden; return; }
    state.variant = CHIAVI[(i + (p.dataset.proto === 'next' ? 1 : CHIAVI.length - 1)) % CHIAVI.length];
    render();
    return;
  }
  const a = e.target.closest('[data-azione]');
  if (a && a.dataset.azione === 'soluzione') { state.soluzione = !state.soluzione; render(); }
  if (a && a.dataset.azione === 'ascolto') ascolto();
});
$('#proto-schermata').addEventListener('change', (e) => { state.schermata = e.target.value; render(); });
$('#proto-tema').addEventListener('change', (e) => { state.tema = e.target.value; render(); });
$('#proto-esito').addEventListener('change', (e) => { state.esito = e.target.value; render(); });
mq.addEventListener('change', render);
addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea, select, [contenteditable]')) return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') $(`[data-proto="${e.key === 'ArrowRight' ? 'next' : 'prev'}"]`).click();
});
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(renderPartiture, 150); });
render();
