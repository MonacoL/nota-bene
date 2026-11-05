// PROTOTIPO usa-e-getta (issue #7 "Interazione negli Esercizi di teoria da telefono").
// Quattro varianti di risposta sulla stessa pagina Esercizi, scelte con ?variant=A|B|C|D.
const qs = new URLSearchParams(location.search);
const DEF = { variant: 'A', cap: 'scala-maggiore', tipo: '0', dopo: 'avanti', errore: 'soluzione', serie: '10', riscontro: 'linea', tasti: 'no', rigo: '20', modo: 'caso' };
const S = {}; for (const k in DEF) S[k] = qs.get(k) ?? DEF[k];
if (qs.get('seed')) T.seed(+qs.get('seed'));

const VARIANTI = { A: 'Scelta multipla', B: 'Pulsanti', C: 'Tastiera di pianoforte', D: 'Tocco sul pentagramma' };
const CAP = {
  note: { n: 1, titolo: 'Note, toni e semitoni', tipi: [['nota', { chiavi: ['treble'] }]] },
  chiavi: { n: 2, titolo: 'Chiavi', tipi: [['nota', { chiavi: ['treble', 'treble-8', 'bass'] }]] },
  'figure-e-pause': { n: 3, titolo: 'Figure e pause', tipi: [['battuta', {}]] },
  'scala-maggiore': { n: 5, titolo: 'Scala maggiore', tipi: [['scala', {}], ['tonalita', {}]] },
  intervalli: { n: 8, titolo: 'Intervalli', tipi: [['intervallo', {}]] },
  'do-mobile': { n: 9, titolo: 'DO mobile', tipi: [['sillaba', {}]] },
};
const TITOLI = { nota: 'Nomina la nota', sillaba: 'Nomina la sillaba', intervallo: 'Riconosci l\'intervallo', scala: 'Costruisci la scala', tonalita: 'Trova la tonalità', battuta: 'Completa la battuta' };
const SUPPORTO = { A: Object.keys(TITOLI), B: Object.keys(TITOLI), C: ['nota', 'scala', 'tonalita'], D: ['nota', 'sillaba', 'intervallo', 'scala'] };
const FIG_PAD = [{ v: 4, nome: 'semibreve', g: '𝅝' }, { v: 2, nome: 'minima', g: '𝅗𝅥' }, { v: 1, nome: 'semiminima', g: '♩' }, { v: 0.5, nome: 'croma', g: '♪' }];

let ex, ans, esito, timer;
let serie = { i: 0, giuste: 0, fatti: 0, finita: false };
const freshAns = () => ({ acc: 0, l: null, seq: [], num: null, qual: null, fig: [], punto: false, note: [], ghost: null, primo: true, mostrata: false });
function nuovo() {
  const tipi = CAP[S.cap].tipi;
  const [tipo, opt] = tipi[+S.tipo] || tipi[0];
  ex = T.G[tipo]({ ...opt, modo: S.modo });
  ans = freshAns(); esito = null;
}
const supportato = () => SUPPORTO[S.variant].includes(ex.tipo);

// ---------- valutazione ----------
function valuta(ok, tua) {
  if (ok) {
    if (ans.primo) serie.giuste++;
    serie.fatti++;
    esito = { ok: true, tua };
  } else if (S.errore === 'riprova' && !ans.mostrata) {
    if (ans.primo) serie.fatti++;
    esito = { ok: false, riprova: true, tua };
  } else {
    if (ans.primo) serie.fatti++;
    esito = { ok: false, tua };
  }
  ans.primo = false;
  render();
  if (ok && S.dopo === 'auto') timer = setTimeout(avanti, 1400);
}
function avanti() {
  serie.i++;
  if (S.serie === '10' && serie.i >= 10) { serie.finita = true; esito = null; render(); return; }
  nuovo(); render();
  window.scrollTo(0, 0);
}
function riprova() { esito = null; ans = { ...freshAns(), primo: false }; render(); }

// ---------- pezzi di HTML ----------
const btn = (act, v, label, cls = '') => `<button data-act="${act}" data-v="${v}" class="${cls}">${label}</button>`;
const accRow = () => `<div class="riga acc">${[[-1, '♭'], [0, '♮'], [1, '♯']].map(([v, g]) => btn('acc', v, g, ans.acc === v ? 'on' : '')).join('')}</div>`;
const nomiRow = (act = 'nome') => `<div class="riga nomi">${T.NOMI.map((n, i) => btn(act, i, n)).join('')}</div>`;

function opzioniA() {
  return `<div class="opzioni ${ex.tipo === 'scala' ? 'col' : ''}">${ex.opzioni.map((o, i) => {
    let c = '';
    if (esito && !esito.riprova) { if (o === ex.giusta) c = 'giusta'; else if (o === esito.tua) c = 'sbagliata'; }
    else if (esito && esito.riprova && o === esito.tua) c = 'sbagliata';
    return btn('opz', i, o, c);
  }).join('')}</div>`;
}

function slot(txt, pronto) {
  return `<div class="riga slotrow"><span class="slot ${txt ? '' : 'vuoto'}">${txt || '…'}</span>${btn('verifica', 0, 'Verifica', 'primario' + (pronto ? '' : ' spento'))}</div>`;
}

function padB() {
  const t = ex.tipo;
  if (t === 'sillaba') return `<div class="riga nomi">${T.SIL.map((s, i) => btn('sil', i, s)).join('')}</div>`;
  if (t === 'nota' || t === 'tonalita') {
    const txt = ans.l === null ? '' : T.nome(T.N(ans.l, ans.acc, 0)) + (t === 'tonalita' ? ' ' + ex.modo : '');
    return accRow() + nomiRow() + slot(txt, ans.l !== null);
  }
  if (t === 'scala') {
    return accRow() + nomiRow('aggiungi') + `<div class="riga slotrow"><span class="slot">${ans.seq.length} di 7 note</span>${btn('cancella', 0, '⌫', 'quadro')}${btn('verifica', 0, 'Verifica', 'primario' + (ans.seq.length === 7 ? '' : ' spento'))}</div>`;
  }
  if (t === 'intervallo') {
    const txt = ans.num ? T.NUM[ans.num] + (ans.qual ? ' ' + ans.qual : ' …') : '';
    return `<div class="riga nomi">${[2, 3, 4, 5, 6, 7, 8].map((n) => btn('num', n, n + 'ª', ans.num === n ? 'on' : '')).join('')}</div>`
      + `<div class="riga qual">${T.QUAL.map((q) => btn('qual', q, q === 'aumentata' ? 'aum.' : q === 'diminuita' ? 'dim.' : q, ans.qual === q ? 'on' : '')).join('')}</div>`
      + slot(txt, ans.num && ans.qual);
  }
  if (t === 'battuta') {
    const somma = ans.fig.reduce((s, f) => s + f.v, 0);
    return `<div class="riga figure">${FIG_PAD.map((f, i) => btn('fig', i, `<span class="glifo">${f.g}</span><small>${f.nome}</small>`)).join('')}${btn('punto', 0, '<span class="glifo">·</span><small>punto</small>', ans.punto ? 'on' : '')}</div>`
      + `<div class="riga slotrow"><span class="slot ${ans.fig.length ? '' : 'vuoto'}">${ans.fig.map((f) => f.nome).join(' + ') || 'tocca le Figure'}${ans.fig.length ? ` <small>(= ${String(somma).replace('.', ',')})</small>` : ''}</span>${btn('cancella', 0, '⌫', 'quadro')}${btn('verifica', 0, 'Verifica', 'primario' + (ans.fig.length ? '' : ' spento'))}</div>`;
  }
  return '';
}

function piano() {
  const bianchi = [0, 2, 4, 5, 7, 9, 11], neri = [[1, 0], [3, 1], [6, 3], [8, 4], [10, 5]];
  const nomeNero = (pc) => ({ 1: 'Do♯ Re♭', 3: 'Re♯ Mi♭', 6: 'Fa♯ Sol♭', 8: 'Sol♯ La♭', 10: 'La♯ Si♭' })[pc];
  let h = '<div class="piano">';
  bianchi.forEach((pc, i) => { h += `<button class="bianco" data-act="tasto" data-v="${pc}">${S.tasti === 'si' ? T.NOMI[i] : ''}</button>`; });
  neri.forEach(([pc, dopo]) => { h += `<button class="nero" style="left:calc(${(dopo + 1) * 100 / 7}% - 4.5%)" data-act="tasto" data-v="${pc}">${S.tasti === 'si' ? `<small>${nomeNero(pc).replace(' ', '<br>')}</small>` : ''}</button>`; });
  h += '</div>';
  if (ex.tipo === 'scala') h = `<div class="riga slotrow"><span class="slot">${ans.seq.length} di 7 note</span>${btn('cancella', 0, '⌫', 'quadro')}${btn('verifica', 0, 'Verifica', 'primario' + (ans.seq.length === 7 ? '' : ' spento'))}</div>` + h;
  return h;
}

function controlliD() {
  const t = ex.tipo;
  const acc = t === 'sillaba' ? '' : `<div class="riga acc piccola"><span class="aiuto">Altera l'ultima nota:</span>${[[-1, '♭'], [0, '♮'], [1, '♯']].map(([v, g]) => btn('accD', v, g, ans.note.length && ans.note.at(-1).a === v ? 'on' : '')).join('')}</div>`;
  const pronto = t === 'scala' ? ans.note.length === 7 : ans.note.length === 1;
  const info = t === 'scala' ? `<span class="slot">${ans.note.length} di 7 note</span>${btn('cancella', 0, '⌫', 'quadro')}` : `<span class="aiuto">Trascina e lascia per scegliere il punto.</span>`;
  return acc + `<div class="riga slotrow">${info}${btn('verifica', 0, 'Verifica', 'primario' + (pronto ? '' : ' spento'))}</div>`;
}

function esitoHTML() {
  if (!esito) return '';
  const e = esito;
  let h = `<div class="esito ${e.ok ? 'ok' : 'no'}" role="status"><p class="titolo">${e.ok ? '✓ Giusto' : e.riprova ? '✗ Non ancora' : '✗ Non è così'}</p>`;
  if (!e.ok && e.tua) h += `<p>Hai risposto: <b>${e.tua}</b>.</p>`;
  if (!e.ok && !e.riprova) h += `<p>La risposta è <b>${ex.giusta}</b>.</p>`;
  if (!e.riprova) h += `<p class="spieg">${ex.spiegazione}</p>`;
  if (e.riprova) h += `<div class="riga">${btn('riprova', 0, 'Riprova', 'primario')}${btn('mostra', 0, 'Mostra la risposta', 'link')}</div>`;
  else if (e.ok && S.dopo === 'auto') h += '<p class="aiuto">Passo al prossimo…</p>';
  else h += `<div class="riga">${btn('avanti', 0, serie.i + 1 >= 10 && S.serie === '10' ? 'Vedi com\'è andata' : 'Avanti →', 'primario largo')}</div>`;
  return h + '</div>';
}

function contatore() {
  if (S.serie === '10') return `<div class="contatore"><span>Esercizio ${serie.i + 1} di 10</span><span class="barra"><i style="width:${serie.i * 10}%"></i></span></div>`;
  return `<div class="contatore"><span>Giuste al primo colpo: ${serie.giuste} su ${serie.fatti}</span></div>`;
}

function render() {
  clearTimeout(timer);
  const C = CAP[S.cap];
  const fisso = (S.variant === 'B' || S.variant === 'C') && supportato() && !serie.finita;
  const foglio = S.riscontro === 'foglio' && esito;
  let h = `<header class="sito"><a href="#" class="logo">Nota Bene</a><nav><a href="#">Letture</a><span class="lingue"><b>IT</b> · <a href="#">EN</a></span></nav></header>`;
  h += `<main class="pag v${S.variant} ${fisso ? 'con-fisso' : ''} ${ex.tipo === 'scala' && fisso ? 'fisso-alto' : ''}">`;
  h += `<a class="indietro" href="#">← Torna al Capitolo</a><div class="kicker">Capitolo ${C.n} · Esercizi</div><h1>${C.titolo}</h1>`;
  if (C.tipi.length > 1) h += `<div class="schede">${C.tipi.map(([t], i) => btn('tipo', i, TITOLI[t], i === +S.tipo ? 'on' : '')).join('')}</div>`;
  if (serie.finita) {
    h += `<section class="fine"><h2>Serie finita</h2><p class="grande-num">${serie.giuste} su 10</p><p>giuste al primo colpo. Non salviamo niente: se chiudi la pagina, si riparte da capo.</p>${btn('ancora', 0, 'Altri 10 esercizi', 'primario largo')}<p><a href="#">Capitolo successivo →</a></p></section></main>`;
    document.getElementById('app').innerHTML = h; return;
  }
  h += contatore();
  const inverso = S.variant === 'D' && supportato() && ex.testoInverso;
  h += `<section class="esercizio"><p class="domanda">${inverso ? ex.testoInverso : ex.testo}</p>`;
  if (S.variant === 'D' && supportato()) h += '<div id="tocco" class="tocco"></div>';
  else h += '<div id="pent" class="pent"></div>';
  if (!supportato()) h += `<div class="na">«${TITOLI[ex.tipo]}» non si presta a <b>${VARIANTI[S.variant]}</b>: qui si userebbe un'altra modalità. Cambia variante o Capitolo dalla barra in alto.</div>`;
  else if (S.variant === 'A') h += opzioniA();
  else if (S.variant === 'D') h += controlliD();
  if (S.riscontro === 'linea') h += esitoHTML();
  h += '</section></main>';
  if (fisso) h += `<div class="fisso ${esito && !esito.riprova ? 'spento-tutto' : ''}">${S.variant === 'B' ? padB() : piano()}</div>`;
  if (foglio) h += `<div class="foglio">${esitoHTML()}</div>`;
  document.getElementById('app').innerHTML = h;

  const pent = document.getElementById('pent');
  if (pent) {
    let abc = ex.abc;
    if (ex.tipo === 'scala' && ans.seq.length) abc = T.testa([ex.tonica, ...ans.seq].map((n) => T.abc(n) + '2').join(' '), { l: '1/2' });
    ABCJS.renderAbc(pent, abc, { staffwidth: ex.tipo === 'scala' ? Math.min(pent.clientWidth - 20, 640) : 170, scale: ex.tipo === 'scala' ? 1.15 : 1.5, paddingtop: 0, paddingbottom: 0, paddingleft: 0, paddingright: 0, add_classes: true });
  }
  if (document.getElementById('tocco')) disegnaTocco();
  aggiornaBarra();
}

// ---------- variante D: pentagramma toccabile ----------
function chiaveD() { return ex.tipo === 'nota' ? ex.chiave : 'treble'; }
function noteDate() { // note scritte dall'esercizio, non toccabili
  if (ex.tipo === 'scala') return [ex.tonica];
  if (ex.tipo === 'intervallo') return [ex.giu];
  return [];
}
function disegnaTocco() {
  const box = document.getElementById('tocco');
  const W = box.clientWidth, g = +S.rigo, st = g / 2, PMAX = 13, PMIN = -5, top = 6;
  const yP = (p) => top + (PMAX - p) * st, H = top * 2 + (PMAX - PMIN) * st;
  const C = T.CHIAVI[chiaveD()];
  let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  for (let p = 0; p <= 8; p += 2) s += `<line x1="4" x2="${W - 4}" y1="${yP(p)}" y2="${yP(p)}" class="linea"/>`;
  if (chiaveD() === 'bass') s += `<text x="6" y="${yP(3.2)}" font-size="${g * 2.6}" class="chiave">𝄢</text>`;
  else s += `<text x="4" y="${yP(-0.6)}" font-size="${g * 3.6}" class="chiave">𝄞</text>${chiaveD() === 'treble-8' ? `<text x="${g * 0.9}" y="${yP(-3.4)}" font-size="${g * 0.8}" class="chiave">8</text>` : ''}`;
  let x0 = g * 3.6;
  if (ex.tipo === 'sillaba') {
    const alt = T.alterazioni(ex.tonica);
    const POS = alt.segno > 0 ? { F: 8, C: 5, G: 9, D: 6, A: 3, E: 7, B: 4 } : { B: 4, E: 7, A: 3, D: 6, G: 2, C: 5, F: 1 };
    alt.note.forEach((n, i) => { s += `<text x="${x0 + i * st * 1.7}" y="${yP(POS[T.LET[n.l]]) + st * 0.7}" font-size="${g * 1.4}" class="alt">${alt.segno > 0 ? '♯' : '♭'}</text>`; });
    x0 += alt.note.length * st * 1.7 + st;
  }
  const date = noteDate(), mie = ans.note;
  const slots = ex.tipo === 'scala' ? 8 : ex.tipo === 'intervallo' ? 2 : 1;
  const dx = (W - x0 - g) / slots;
  const xS = (i) => x0 + dx * (i + 0.5);
  const nota = (n, i, cls) => {
    const p = T.dia(n) - C.base, x = xS(i), y = yP(p);
    let t = '';
    for (let q = -2; q >= p; q -= 2) t += `<line x1="${x - st * 2}" x2="${x + st * 2}" y1="${yP(q)}" y2="${yP(q)}" class="linea"/>`;
    for (let q = 10; q <= p; q += 2) t += `<line x1="${x - st * 2}" x2="${x + st * 2}" y1="${yP(q)}" y2="${yP(q)}" class="linea"/>`;
    if (n.a) t += `<text x="${x - st * 3.1}" y="${y + st * 0.7}" font-size="${g * 1.3}" class="alt ${cls}">${n.a > 0 ? '♯' : '♭'}</text>`;
    return t + `<ellipse cx="${x}" cy="${y}" rx="${st * 1.3}" ry="${st * 0.92}" transform="rotate(-20 ${x} ${y})" class="testa ${cls}"/>`;
  };
  date.forEach((n, i) => { s += nota(n, i, 'data'); });
  mie.forEach((n, i) => { s += nota(n, date.length + i, 'mia'); });
  if (ans.ghost !== null) {
    const i = ex.tipo === 'scala' ? date.length + mie.length : date.length;
    s += `<line x1="0" x2="${W}" y1="${yP(ans.ghost)}" y2="${yP(ans.ghost)}" class="guida"/>` + nota(T.fromDia(C.base + ans.ghost), Math.min(i, slots - 1), 'fantasma');
  }
  s += '</svg>';
  box.innerHTML = s;
  box.style.height = H + 'px';
  if (box.dataset.legato) return;
  box.dataset.legato = 1;
  const pDa = (ev) => { const r = box.getBoundingClientRect(); return Math.max(PMIN, Math.min(PMAX, Math.round(PMAX - (ev.clientY - r.top - top) / st))); };
  let giu = false;
  box.addEventListener('pointerdown', (ev) => { if (esito && !esito.riprova) return; giu = true; box.setPointerCapture(ev.pointerId); ans.ghost = pDa(ev); disegnaTocco(); });
  box.addEventListener('pointermove', (ev) => { if (!giu) return; ans.ghost = pDa(ev); disegnaTocco(); });
  box.addEventListener('pointerup', () => {
    if (!giu) return; giu = false;
    const n = T.fromDia(T.CHIAVI[chiaveD()].base + ans.ghost);
    if (ex.tipo === 'sillaba') n.a = 0;
    ans.ghost = null;
    if (ex.tipo === 'scala') { if (ans.note.length < 7) ans.note.push(n); } else ans.note = [n];
    render();
  });
}

// ---------- azioni ----------
function sequenzaDaPiano(pc) { // il nome della nota si deduce dalla lettera successiva
  const prev = ans.seq.at(-1) || ex.tonica;
  const l = (prev.l + 1) % 7;
  let a = ((pc - T.PC[l]) % 12 + 18) % 12 - 6;
  const n = T.fromDia(T.dia(prev) + 1, a);
  return n;
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (!b || b.classList.contains('spento')) return;
  const v = b.dataset.v, act = b.dataset.act;
  if (b.closest('#proto-bar')) return;
  const t = ex.tipo;
  if (esito && !esito.riprova && !['avanti', 'tipo', 'ancora'].includes(act)) return;
  switch (act) {
    case 'tipo': S.tipo = v; sync(); nuovo(); serie = { i: 0, giuste: 0, fatti: 0, finita: false }; break;
    case 'avanti': return avanti();
    case 'riprova': return riprova();
    case 'mostra': ans.mostrata = true; esito = { ok: false, tua: esito.tua }; break;
    case 'ancora': serie = { i: 0, giuste: 0, fatti: 0, finita: false }; nuovo(); break;
    case 'opz': return valuta(ex.opzioni[+v] === ex.giusta, ex.opzioni[+v]);
    case 'acc': ans.acc = +v; break;
    case 'nome': ans.l = +v; break;
    case 'aggiungi': {
      if (ans.seq.length >= 7) break;
      const prev = ans.seq.at(-1) || ex.tonica;
      let d = T.dia(prev) + 1; while (((d % 7) + 7) % 7 !== +v) d++;
      ans.seq.push(T.fromDia(d, ans.acc)); ans.acc = 0; break;
    }
    case 'cancella': if (S.variant === 'D') ans.note.pop(); else if (t === 'battuta') ans.fig.pop(); else ans.seq.pop(); break;
    case 'sil': return valuta(+v === ex.grado, T.SIL[+v]);
    case 'num': ans.num = +v; break;
    case 'qual': ans.qual = v; break;
    case 'fig': { const f = FIG_PAD[+v]; ans.fig.push(ans.punto ? { v: f.v * 1.5, nome: f.nome + ' puntata' } : f); ans.punto = false; break; }
    case 'punto': ans.punto = !ans.punto; break;
    case 'accD': if (ans.note.length) ans.note.at(-1).a = +v; break;
    case 'tasto': {
      const pc = +v;
      if (t === 'scala') { if (ans.seq.length < 7) ans.seq.push(sequenzaDaPiano(pc)); break; }
      const giusta = t === 'nota' ? ex.nota : ex.tonica;
      const nomi = { 0: 'Do', 1: 'Do♯/Re♭', 2: 'Re', 3: 'Re♯/Mi♭', 4: 'Mi', 5: 'Fa', 6: 'Fa♯/Sol♭', 7: 'Sol', 8: 'Sol♯/La♭', 9: 'La', 10: 'La♯/Si♭', 11: 'Si' };
      return valuta(T.pc(giusta) === pc, 'il tasto ' + nomi[pc]);
    }
    case 'verifica': return verifica();
  }
  render();
});
function verifica() {
  const t = ex.tipo, v = S.variant;
  if (v === 'D') {
    if (t === 'scala') return valuta(ans.note.every((n, i) => T.stessa(n, ex.scala[i + 1]) && T.dia(n) === T.dia(ex.scala[i + 1])), T.testoScala([ex.tonica, ...ans.note]));
    const n = ans.note[0];
    if (t === 'nota') return valuta(T.dia(n) === T.dia(ex.nota) && n.a === ex.nota.a, T.nomeOtt(n));
    if (t === 'sillaba') { const g = ((T.dia(n) - T.dia(ex.tonica)) % 7 + 7) % 7; return valuta(g === ex.grado, 'una nota che si canta ' + T.SIL[g]); }
    if (t === 'intervallo') return valuta(T.dia(n) === T.dia(ex.su) && n.a === ex.su.a, T.nomeOtt(n));
  }
  if (t === 'nota') return valuta(ans.l === ex.nota.l && ans.acc === ex.nota.a, T.nome(T.N(ans.l, ans.acc, 0)));
  if (t === 'tonalita') return valuta(ans.l === ex.tonica.l && ans.acc === ex.tonica.a, T.nome(T.N(ans.l, ans.acc, 0)) + ' ' + ex.modo);
  if (t === 'scala') return valuta(ans.seq.every((n, i) => T.stessa(n, ex.scala[i + 1])), T.testoScala([ex.tonica, ...ans.seq]));
  if (t === 'intervallo') { const l = T.NUM[ans.num] + ' ' + ans.qual; return valuta(l === ex.giusta, l); }
  if (t === 'battuta') { const s = ans.fig.reduce((a, f) => a + f.v, 0); return valuta(s === ex.manca, ans.fig.map((f) => f.nome).join(' + ')); }
}

// ---------- barra del prototipo ----------
const OPZ = {
  cap: ['Capitolo', Object.entries(CAP).map(([k, c]) => [k, `${c.n} · ${c.titolo}`])],
  dopo: ['Dopo una risposta giusta', [['avanti', 'bottone Avanti'], ['auto', 'passa da solo dopo 1,4 s']]],
  errore: ['Dopo una risposta sbagliata', [['soluzione', 'mostra subito la soluzione'], ['riprova', 'Riprova (con "Mostra la risposta")']]],
  riscontro: ['Dove compare il riscontro', [['linea', 'nella pagina, sotto la domanda'], ['foglio', 'foglio fisso in basso']]],
  serie: ['Serie', [['10', 'serie di 10 con riepilogo'], ['infinita', 'senza fine, con conteggio']]],
  tasti: ['Nomi sui tasti (C)', [['no', 'no'], ['si', 'sì']]],
  rigo: ['Distanza tra le righe (D)', [['16', '16 px'], ['20', '20 px'], ['26', '26 px']]],
  modo: ['Trova la tonalità: Modo', [['caso', 'a caso'], ['maggiore', 'solo maggiore'], ['minore', 'solo minore']]],
};
function sync() {
  const p = new URLSearchParams(); for (const k in DEF) if (S[k] !== DEF[k]) p.set(k, S[k]);
  if (qs.get('seed')) p.set('seed', qs.get('seed'));
  history.replaceState(null, '', '?' + p.toString());
}
function barra() {
  const el = document.getElementById('proto-more');
  el.innerHTML = Object.entries(OPZ).map(([k, [lab, vv]]) => `<label>${lab}<select data-k="${k}">${vv.map(([v, l]) => `<option value="${v}" ${S[k] === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`).join('') + '<pre id="proto-state"></pre>';
  el.addEventListener('change', (e) => {
    const k = e.target.dataset.k; S[k] = e.target.value; sync();
    if (k === 'cap') { S.tipo = '0'; sync(); serie = { i: 0, giuste: 0, fatti: 0, finita: false }; nuovo(); }
    if (k === 'modo' || k === 'serie') { serie = { i: 0, giuste: 0, fatti: 0, finita: false }; nuovo(); }
    render();
  });
}
function cambiaVariante(d) {
  const k = Object.keys(VARIANTI); S.variant = k[(k.indexOf(S.variant) + d + k.length) % k.length];
  sync(); ans = freshAns(); esito = null; render();
}
function aggiornaBarra() {
  document.getElementById('proto-label').textContent = `${S.variant} · ${VARIANTI[S.variant]}`;
  const st = document.getElementById('proto-state');
  if (st) st.textContent = JSON.stringify({ variante: S.variant, tipo: ex.tipo, giusta: ex.giusta, risposta: { acc: ans.acc, l: ans.l, seq: ans.seq.map(T.nome), note: ans.note.map(T.nomeOtt), num: ans.num, qual: ans.qual, fig: ans.fig.map((f) => f.nome) }, esito, serie }, null, 1);
}
document.getElementById('proto-bar').addEventListener('click', (e) => {
  const b = e.target.closest('[data-proto]'); if (!b) return;
  if (b.dataset.proto === 'prev') cambiaVariante(-1);
  if (b.dataset.proto === 'next') cambiaVariante(1);
  if (b.dataset.proto === 'more') document.getElementById('proto-more').hidden ^= 1;
});
document.addEventListener('keydown', (e) => {
  if (e.target.closest('input,textarea,select,[contenteditable]')) return;
  if (e.key === 'ArrowLeft') cambiaVariante(-1);
  if (e.key === 'ArrowRight') cambiaVariante(1);
});
// per gli screenshot: rispondi giusto o sbagliato senza toccare
window.__demo = (ok) => valuta(ok, ok ? ex.giusta : ex.opzioni.find((o) => o !== ex.giusta));

barra(); nuovo(); render();
window.addEventListener('resize', () => { if (document.getElementById('tocco')) disegnaTocco(); });
