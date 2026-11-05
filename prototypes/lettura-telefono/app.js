// PROTOTIPO usa-e-getta (issue #8). Nessuna astrazione, nessun test, nessuna persistenza.
/* global ABCJS, LETTURE */

const VARIANTI = {
  A: 'Barra comandi in basso',
  B: 'Comandi sopra la partitura',
  C: 'Percorso a passi',
};
const CHIAVI = Object.keys(VARIANTI);

const params = new URLSearchParams(location.search);
const state = {
  variant: CHIAVI.includes(params.get('variant')) ? params.get('variant') : 'A',
  resa: params.get('resa') === 'scala' ? 'scala' : 'acapo',
  mut: params.get('mut') === 'sempre' ? 'sempre' : 'soluzione',
  corpo: Number(params.get('corpo')) || 15,
  zoom: Number(params.get('zoom')) || 0.8,
  spaziatura: Number(params.get('spaziatura')) || 1.1,
  perRigo: Number(params.get('perrigo')) || 0,   // 0 = decide abcjs
  idx: Math.min(Number(params.get('lettura')) || 0, LETTURE.length - 1),
  soluzione: params.get('soluzione') === '1',
  passo: 1,          // solo variante C
  audio: 'fermo',    // fermo | riferimento | ascolto | caricamento | errore
  audioMsg: '',
  render: {},        // ultima resa abcjs, per il pannello di stato
};

const $ = (s, r = document) => r.querySelector(s);
const lettura = () => LETTURE[state.idx];

function syncUrl() {
  const p = new URLSearchParams();
  p.set('variant', state.variant);
  p.set('resa', state.resa);
  p.set('mut', state.mut);
  p.set('corpo', state.corpo);
  p.set('zoom', state.zoom);
  p.set('spaziatura', state.spaziatura);
  if (state.perRigo) p.set('perrigo', state.perRigo);
  if (state.idx) p.set('lettura', state.idx);
  if (state.soluzione) p.set('soluzione', '1');
  history.replaceState(null, '', '?' + p.toString());
}

// ---------- ABC ----------

function buildAbc(l) {
  // Sillabe e segno di Mutazione si disegnano SEMPRE, così lo spazio è riservato e
  // mostrare la Soluzione non sposta gli a capo; quando sono nascosti li rende
  // invisibili il CSS (decisione Q3 del ticket).
  const note = l.note.replace('{MUT}', l.mutazione ? `"^${l.mutazione.etichetta}"` : '');
  return `X:1\n%%vocalfont Helvetica ${state.corpo}\n%%annotationfont Helvetica-Bold 13\n${l.head}\n${note}\nw: ${l.testo}\nw: ${l.sillabe}\n`;
}

// Divide note, Testo e Sillabe per Battuta (le righe w: usano | allineato alle Battute).
function battuteDi(l) {
  const note = l.note.replace('{MUT}', l.mutazione ? `"^${l.mutazione.etichetta}"` : '')
    .split(/\|\]?/).map((x) => x.trim()).filter(Boolean);
  const dividi = (t) => { const v = t.split('|').map((x) => x.trim()); while (v.length < note.length) v.push(''); return v; };
  return { n: note.length, note, testo: dividi(l.testo), sillabe: dividi(l.sillabe) };
}

// ABC con a capo espliciti: ogni gruppo [i, j) di Battute è un rigo con le sue righe w:.
function abcRighe(l, b, gruppi) {
  let abc = `X:1\n%%stretchlast 1\n%%vocalfont Helvetica ${state.corpo}\n%%annotationfont Helvetica-Bold 13\n${l.head}\n`;
  for (const [i, j] of gruppi) {
    abc += b.note.slice(i, j).join(' | ') + (j === b.n ? ' |]' : ' |') + '\n';
    abc += 'w: ' + b.testo.slice(i, j).join(' | ') + ' |\n';
    abc += 'w: ' + b.sillabe.slice(i, j).join(' | ') + ' |\n';
  }
  return abc;
}

let visualObj = null;

function renderScore() {
  const el = $('#score');
  if (!el) return;
  const l = lettura();
  const w = Math.floor(el.clientWidth);
  const opts = { add_classes: true, paddingleft: 0, paddingright: 0, paddingtop: 6, paddingbottom: 6 };
  if (state.resa === 'acapo') {
    // Misurato: in abcjs 6.7.2 staffwidth è già in px di uscita; scale rimpicciolisce
    // solo i simboli, quindi con scale < 1 in un rigo ci stanno più Battute.
    opts.scale = state.zoom;
    opts.staffwidth = w - 24;   // margine a destra per l'etichetta della Mutazione
    opts.wrap = { minSpacing: state.spaziatura, maxSpacing: 2.6, lastLineLimit: 0.5 };
    if (state.perRigo) opts.wrap.preferredMeasuresPerLine = state.perRigo;
  } else {
    opts.staffwidth = 860;
    opts.responsive = 'resize';
  }
  // Responsive: si riempie ogni rigo con quante più Battute possibile. Si aggiunge
  // una Battuta alla volta e la si tiene solo se il rigo, disegnato da solo alla
  // larghezza dello schermo, non fa toccare nessuna sillaba (Testo o Soluzione)
  // e non esce dal bordo. Se l'intero estratto ci sta, resta su un rigo solo.
  let tentativi = 0;
  let urti = 0;
  if (state.resa === 'acapo' && !state.perRigo) {
    const b = battuteDi(l);
    const prova = { ...opts };
    delete prova.wrap;
    const ciSta = (i, j) => {
      tentativi++;
      const vo = ABCJS.renderAbc(el, abcRighe(l, b, [[i, j]]), prova)[0];
      const svg = el.querySelector('svg');
      const destra = el.getBoundingClientRect().right + 2;
      const esce = [...svg.querySelectorAll('.abcjs-note, .abcjs-bar, .abcjs-lyric')]
        .some((e) => e.getBoundingClientRect().right > destra);
      const dbg = { righe: vo.lines.filter((x) => x.staff).length, urti: contaUrti(el), esce };
      return dbg.righe === 1 && dbg.urti === 0 && !esce;
    };
    const gruppi = [];
    for (let i = 0; i < b.n;) {
      let j = i + 1;
      while (j < b.n && ciSta(i, j + 1)) j++;
      gruppi.push([i, j]);
      i = j;
    }
    visualObj = ABCJS.renderAbc(el, abcRighe(l, b, gruppi), prova)[0];
    urti = contaUrti(el);
    opts.wrap = { battutePerRigo: gruppi.map(([i, j]) => j - i).join('+') };
  } else {
    visualObj = ABCJS.renderAbc(el, buildAbc(l), opts)[0];
    urti = contaUrti(el);
  }

  // abcjs mette Testo e Sillabe della stessa nota in un solo <text> con un <tspan>
  // per riga w:. Il secondo tspan è la Soluzione: lo marchiamo per colorarlo.
  el.querySelectorAll('.abcjs-lyric tspan:nth-child(2)').forEach((t) => t.classList.add('riga-sillabe'));
  el.classList.toggle('sillabe-nascoste', !state.soluzione);
  el.classList.toggle('mut-nascosta', !(state.mut === 'sempre' || state.soluzione));

  const svg = el.querySelector('svg');
  const vb = svg && svg.viewBox && svg.viewBox.baseVal;
  state.render = {
    contenitore: w + 'px',
    spaziaturaUsata: opts.wrap ? opts.wrap.minSpacing : '-',
    battutePerRigoUsate: opts.wrap && (opts.wrap.battutePerRigo || opts.wrap.preferredMeasuresPerLine) || 'auto',
    candidatiProvati: tentativi,
    urtiRimasti: urti,
    staffwidth: opts.staffwidth,
    righe: visualObj.lines.filter((x) => x.staff).length,
    svg: svg ? Math.round(svg.getBoundingClientRect().width) + '×' + Math.round(svg.getBoundingClientRect().height) + 'px' : '-',
    scalaSvg: vb && vb.width ? +(svg.getBoundingClientRect().width / vb.width).toFixed(2) : 1,
  };
  renderProtoState();
}

// Conta le coppie di sillabe vicine sulla stessa riga che si toccano (meno di 4px).
function contaUrti(el) {
  const righe = new Map();
  el.querySelectorAll('.abcjs-lyric').forEach((t) => {
    const parti = t.querySelectorAll('tspan');
    (parti.length ? [...parti] : [t]).forEach((p) => {
      if (!p.textContent.trim()) return;
      const r = p.getBoundingClientRect();
      if (!r.width) return;
      const k = Math.round(r.top / 4);
      if (!righe.has(k)) righe.set(k, []);
      righe.get(k).push({ left: r.left, right: r.right, t: p.textContent });
    });
  });
  let n = 0;
  righe.forEach((rs) => {
    rs.sort((a, b) => a.left - b.left);
    for (let i = 1; i < rs.length; i++) if (rs[i].left < rs[i - 1].right + 4) n++;
  });
  return n;
}

// ---------- Audio ----------

let AC = null;
let synth = null;
let cursore = null;   // ABCJS.TimingCallbacks che illumina le note durante l'Ascolto

function evidenzia(ev) {
  document.querySelectorAll('#score .suona').forEach((e) => e.classList.remove('suona'));
  if (!ev || !ev.elements) return;
  ev.elements.flat().forEach((e) => e.classList.add('suona'));
  // Su telefono la partitura è più alta dello schermo: tieni in vista la nota che suona.
  const primo = ev.elements.flat()[0];
  if (primo) {
    const r = primo.getBoundingClientRect();
    const barra = document.querySelector('.va-bar');
    const basso = innerHeight - (barra ? barra.offsetHeight : 0) - 40;
    if (r.top < 60 || r.bottom > basso) primo.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
}

function audioCtx() {
  // Sblocco nel gesto, prima di qualunque await (vedi research/audio-browser).
  if (navigator.audioSession) { try { navigator.audioSession.type = 'playback'; } catch (e) { /* ignora */ } }
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
  if (AC.state !== 'running') AC.resume();
  return AC;
}

function freq(nome) {
  const m = /^([A-G])(#|b)?(\d)$/.exec(nome);
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  const midi = 12 * (Number(m[3]) + 1) + base;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function tono(ctx, f, t0, dur) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.value = f;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(0.18, t0 + 0.02);
  g.gain.setValueAtTime(0.18, t0 + dur - 0.08);
  g.gain.linearRampToValueAtTime(0, t0 + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function riferimentoTonale() {
  const ctx = audioCtx();
  stopAscolto();
  const r = lettura().riferimento;
  let t = ctx.currentTime + 0.05;
  r.tonica.forEach((n) => { tono(ctx, freq(n), t, 0.4); t += 0.4; });
  r.tonica.forEach((n) => tono(ctx, freq(n), t, 1.1));
  t += 1.5;
  tono(ctx, freq(r.partenza), t, 1.4);
  setAudio('riferimento', 'Tonica, accordo, poi la nota di partenza');
  setTimeout(() => state.audio === 'riferimento' && setAudio('fermo', ''), (t + 1.5 - ctx.currentTime) * 1000);
}

async function ascoltoDiVerifica() {
  const ctx = audioCtx();
  if (state.audio === 'ascolto' || state.audio === 'caricamento') { stopAscolto(); return; }
  setAudio('caricamento', 'Carico i suoni…');
  try {
    synth = new ABCJS.synth.CreateSynth();
    // Prototipo: soundfont di default di abcjs (scaricato da paulrosen.github.io).
    await synth.init({ audioContext: ctx, visualObj, options: { program: 0 } });
    await synth.prime();
    synth.start();
    cursore = new ABCJS.TimingCallbacks(visualObj, {
      eventCallback: (ev) => { evidenzia(ev); return ev ? undefined : 'continue'; },
    });
    cursore.start();
    setAudio('ascolto', 'Ascolto di verifica in corso (tocca di nuovo per fermare)');
    const durata = visualObj.getTotalTime ? visualObj.getTotalTime() : 20;
    setTimeout(() => { if (state.audio === 'ascolto') { evidenzia(null); setAudio('fermo', ''); } }, (durata + 1) * 1000);
  } catch (e) {
    console.error(e);
    setAudio('errore', 'Suoni non disponibili (serve la rete per il soundfont nel prototipo)');
  }
}

function stopAscolto() {
  if (synth) { try { synth.stop(); } catch (e) { /* ignora */ } synth = null; }
  if (cursore) { cursore.stop(); cursore = null; }
  evidenzia(null);
  if (state.audio === 'ascolto' || state.audio === 'caricamento') setAudio('fermo', '');
}

function setAudio(stato, msg) {
  state.audio = stato;
  state.audioMsg = msg;
  document.querySelectorAll('[data-azione="ascolto"]').forEach((b) => {
    b.classList.toggle('attivo', stato === 'ascolto' || stato === 'caricamento');
    const lab = b.querySelector('.lab');
    if (lab) lab.textContent = stato === 'ascolto' ? 'Ferma' : (b.dataset.lab || 'Ascolto di verifica');
  });
  document.querySelectorAll('[data-azione="riferimento"]').forEach((b) => b.classList.toggle('attivo', stato === 'riferimento'));
  document.querySelectorAll('.stato-audio').forEach((s) => { s.textContent = msg; s.hidden = !msg; });
  renderProtoState();
}

// ---------- Pezzi di interfaccia ----------

function btn(azione, icona, etichetta, cls = '') {
  return `<button class="az ${cls}" data-azione="${azione}" data-lab="${etichetta}"><span class="ic" aria-hidden="true">${icona}</span><span class="lab">${etichetta}</span></button>`;
}

function btnSoluzione(cls = '') {
  return `<button class="az ${cls} ${state.soluzione ? 'attivo' : ''}" data-azione="soluzione" aria-pressed="${state.soluzione}">
    <span class="ic" aria-hidden="true">DO</span><span class="lab">${state.soluzione ? 'Nascondi Soluzione' : 'Mostra Soluzione'}</span></button>`;
}

function fonteDl(l) {
  return `<dl class="meta">
    <dt>Brano</dt><dd>${l.brano}<br><small>${l.autore}</small></dd>
    <dt>Voce</dt><dd>${l.voce} · ${l.battute}</dd>
    <dt>Prerequisiti</dt><dd>${l.prerequisiti.join(', ')}</dd>
    <dt>Fonte</dt><dd><a href="${l.fonte.url}" target="_blank" rel="noopener">${l.fonte.archivio}</a> · ${l.fonte.edizione}<br><small>${l.fonte.editore}</small></dd>
    <dt>Licenza</dt><dd>${l.fonte.licenza}</dd>
  </dl>`;
}

function boxSoluzione(l) {
  if (!state.soluzione) return '';
  return `<div class="box-soluzione">
    <p><strong>Tonalità:</strong> ${l.tonalita}</p>
    ${l.mutazione ? `<p><span class="tag-mut">Mutazione</span> battuta ${l.mutazione.battuta}: ${l.mutazione.spiegazione}</p>` : '<p>Nessuna Mutazione in questa Lettura.</p>'}
  </div>`;
}

function contatore() {
  return `Lettura ${state.idx + 1} di ${LETTURE.length}`;
}

// ---------- Varianti ----------

function VariantA(l) {
  return `<main class="va">
    <header class="va-head">
      <div class="kicker">${contatore()} · ${l.voce}</div>
      <h1>${l.brano}</h1>
    </header>
    <section class="score-card"><div id="score"></div>${boxSoluzione(l)}</section>
    <p class="stato-audio" hidden></p>
    <p class="vc-attrib">${l.autore}. Fonte <a href="${l.fonte.url}" target="_blank" rel="noopener">${l.fonte.archivio}</a>, ${l.fonte.edizione}. Licenza: ${l.fonte.licenza}.</p>
    <details class="va-fonte">
      <summary>Dettagli su Brano, Voce e Fonte</summary>
      ${fonteDl(l)}
    </details>
    <nav class="va-bar" aria-label="Comandi della Lettura">
      ${btn('riferimento', '♩', 'Riferimento')}
      ${btn('ascolto', '▶', 'Ascolto')}
      ${btnSoluzione()}
      ${btn('successiva', '→', 'Successiva')}
    </nav>
  </main>`;
}

function VariantB(l) {
  return `<main class="vb">
    <aside class="vb-side">
      <div class="kicker">${contatore()}</div>
      <h1>${l.brano}</h1>
      <p class="vb-voce"><strong>${l.voce}</strong> · ${l.battute}</p>
      <p class="vb-fonte-breve">${l.autore}<br>Fonte: <a href="${l.fonte.url}" target="_blank" rel="noopener">${l.fonte.archivio}</a> · ${l.fonte.licenza} <button class="link" data-azione="info">dettagli</button></p>
      <div class="vb-info" hidden>${fonteDl(l)}</div>
      <div class="vb-comandi">
        ${btn('riferimento', '♩', 'Riferimento tonale')}
        ${btn('ascolto', '▶', 'Ascolto di verifica')}
        ${btnSoluzione()}
      </div>
      <p class="stato-audio" hidden></p>
    </aside>
    <section class="vb-main">
      <div class="score-card"><div id="score"></div>${boxSoluzione(l)}</div>
      <button class="grande" data-azione="successiva">Lettura successiva →</button>
    </section>
  </main>`;
}

function VariantC(l) {
  const passi = [
    { n: 1, t: 'Prendi il tono', d: 'Ascolta tonica, accordo e nota di partenza, come il La dato dal maestro.', b: btn('riferimento', '♩', 'Riferimento tonale', 'primario') },
    { n: 2, t: 'Canta la Lettura', d: 'Con il DO mobile, senza aiuti. Prima trova la Tonica.', b: '<button class="az primario" data-azione="passo" data-passo="3"><span class="lab">Ho cantato</span></button>' },
    { n: 3, t: 'Verifica', d: 'Ascolta l’estratto e confronta con le Sillabe.', b: btn('ascolto', '▶', 'Ascolto di verifica') + btnSoluzione() },
    { n: 4, t: 'Avanti', d: 'Passa a un’altra Lettura con gli stessi Prerequisiti.', b: btn('successiva', '→', 'Lettura successiva', 'primario') },
  ];
  return `<main class="vc">
    <section class="vc-score">
      <div class="kicker">${contatore()} · ${l.voce}</div>
      <h1>${l.brano}</h1>
      <div class="score-card"><div id="score"></div>${boxSoluzione(l)}</div>
      <p class="vc-attrib">${l.autore}. Fonte <a href="${l.fonte.url}" target="_blank" rel="noopener">${l.fonte.archivio}</a>, ${l.fonte.edizione}. Licenza: ${l.fonte.licenza}.</p>
    </section>
    <ol class="vc-passi">
      ${passi.map((p) => `<li class="${p.n === state.passo ? 'corrente' : ''} ${p.n < state.passo ? 'fatto' : ''}">
        <button class="vc-tit" data-azione="passo" data-passo="${p.n}"><span class="num">${p.n}</span>${p.t}</button>
        <div class="vc-corpo"><p>${p.d}</p><div class="vc-az">${p.b}</div></div>
      </li>`).join('')}
      <p class="stato-audio" hidden></p>
    </ol>
  </main>`;
}

const RENDER = { A: VariantA, B: VariantB, C: VariantC };

// ---------- Ciclo principale ----------

function render() {
  const app = $('#app');
  app.className = 'variante-' + state.variant;
  app.innerHTML = RENDER[state.variant](lettura());
  $('#proto-label').textContent = `${state.variant} · ${VARIANTI[state.variant]}`;
  $('#proto-resa').value = state.resa;
  $('#proto-mut').value = state.mut;
  $('#proto-corpo').value = String(state.corpo);
  $('#proto-zoom').value = String(state.zoom);
  $('#proto-spaziatura').value = String(state.spaziatura);
  $('#proto-perrigo').value = String(state.perRigo);
  syncUrl();
  renderScore();
  setAudio(state.audio, state.audioMsg);
}

function renderProtoState() {
  const s = $('#proto-state');
  if (!s) return;
  s.textContent = JSON.stringify({
    variante: state.variant,
    lettura: lettura().id,
    soluzione: state.soluzione,
    mutazione: state.mut,
    passo: state.variant === 'C' ? state.passo : undefined,
    audio: state.audio,
    viewport: innerWidth + '×' + innerHeight,
    corpoTesto: state.corpo,
    zoom: state.zoom,
    spaziatura: state.spaziatura,
    battutePerRigo: state.perRigo || 'auto',
    // %%vocalfont è in pt: abcjs lo porta a px (×4/3) e poi applica scale.
    corpoEffettivoPx: +(state.corpo * 4 / 3 * (state.resa === 'acapo' ? state.zoom : (state.render.scalaSvg || 1))).toFixed(1),
    resa: state.resa,
    ...state.render,
  }, null, 1);
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-azione]');
  if (b) {
    const a = b.dataset.azione;
    if (a === 'riferimento') { riferimentoTonale(); if (state.variant === 'C' && state.passo === 1) { state.passo = 2; render(); } }
    if (a === 'ascolto') ascoltoDiVerifica();
    if (a === 'soluzione') { state.soluzione = !state.soluzione; render(); }
    if (a === 'successiva') { stopAscolto(); state.idx = (state.idx + 1) % LETTURE.length; state.soluzione = false; state.passo = 1; render(); window.scrollTo(0, 0); }
    if (a === 'passo') { state.passo = Number(b.dataset.passo); render(); }
    if (a === 'info') { const i = $('.vb-info'); i.hidden = !i.hidden; }
    return;
  }
  const p = e.target.closest('[data-proto]');
  if (p) {
    const k = p.dataset.proto;
    if (k === 'more') { const m = $('#proto-more'); m.hidden = !m.hidden; return; }
    cambiaVariante(k === 'next' ? 1 : -1);
  }
});

function cambiaVariante(d) {
  const i = CHIAVI.indexOf(state.variant);
  state.variant = CHIAVI[(i + d + CHIAVI.length) % CHIAVI.length];
  render();
}

document.addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea, select, [contenteditable]')) return;
  if (e.key === 'ArrowRight') cambiaVariante(1);
  if (e.key === 'ArrowLeft') cambiaVariante(-1);
});

$('#proto-resa').addEventListener('change', (e) => { state.resa = e.target.value; render(); });
$('#proto-perrigo').addEventListener('change', (e) => { state.perRigo = Number(e.target.value); render(); });
$('#proto-spaziatura').addEventListener('change', (e) => { state.spaziatura = Number(e.target.value); render(); });
$('#proto-zoom').addEventListener('change', (e) => { state.zoom = Number(e.target.value); render(); });
$('#proto-corpo').addEventListener('change', (e) => { state.corpo = Number(e.target.value); render(); });
$('#proto-mut').addEventListener('change', (e) => { state.mut = e.target.value; render(); });

let rt;
addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(renderScore, 120); });

render();
