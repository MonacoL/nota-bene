// PROTOTIPO usa-e-getta (issue #7). Modello musicale minimo e generatori di Esercizi di teoria.
// Nessun test, nessuna cura: serve solo a far girare le varianti di interazione.
const T = (() => {
  const LET = 'CDEFGAB';
  const NOMI = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
  const SIL = ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'TI'];
  const PC = [0, 2, 4, 5, 7, 9, 11];

  // RNG con seme (per screenshot ripetibili): ?seed=n
  let s = (Math.random() * 2 ** 32) >>> 0;
  const seed = (n) => { s = n >>> 0; };
  const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const r = (n) => Math.floor(rnd() * n);
  const pick = (a) => a[r(a.length)];
  const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = r(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  const N = (l, a, o) => ({ l, a, o });
  const midi = (n) => 12 * (n.o + 1) + PC[n.l] + n.a;
  const pc = (n) => ((PC[n.l] + n.a) % 12 + 12) % 12;
  const dia = (n) => n.o * 7 + n.l;
  const fromDia = (d, a = 0) => N(((d % 7) + 7) % 7, a, Math.floor(d / 7));
  const accTxt = (a) => ({ 1: '♯', '-1': '♭', 0: '', 2: '𝄪', '-2': '𝄫' })[a];
  const nome = (n) => NOMI[n.l] + accTxt(n.a);
  const nomeOtt = (n) => nome(n) + n.o;
  const stessa = (x, y) => x.l === y.l && x.a === y.a;
  const abc = (n, { key = false } = {}) => {
    const acc = key ? '' : ({ 1: '^', '-1': '_', 2: '^^', '-2': '__', 0: '' })[n.a];
    let t = LET[n.l];
    t = n.o >= 5 ? t.toLowerCase() + "'".repeat(n.o - 5) : t + ','.repeat(4 - n.o);
    return acc + t;
  };

  // Scala maggiore da una tonica con ottava
  const PASSI = [0, 2, 4, 5, 7, 9, 11, 12];
  const scala = (t) => PASSI.map((st, i) => { const n = fromDia(dia(t) + i); n.a = midi(t) + st - (12 * (n.o + 1) + PC[n.l]); return n; });
  // Tonalità maggiori con armatura fino a 6 alterazioni
  const TONICHE = [[0, 0], [4, 0], [1, 0], [5, 0], [2, 0], [6, 0], [3, 1], [3, 0], [6, -1], [2, -1], [5, -1], [1, -1], [4, -1]]
    .map(([l, a]) => N(l, a, 4));
  const kAbc = (t) => LET[t.l] + (t.a === 1 ? '#' : t.a === -1 ? 'b' : '');
  const alterazioni = (t) => { // in ordine di armatura
    const sc = scala(t).slice(0, 7);
    const diesis = ['F', 'C', 'G', 'D', 'A', 'E', 'B'], bem = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];
    const alt = sc.filter((n) => n.a !== 0);
    if (!alt.length) return { segno: 0, note: [] };
    const segno = alt[0].a;
    const ord = segno > 0 ? diesis : bem;
    return { segno, note: ord.filter((L) => alt.some((n) => LET[n.l] === L)).map((L) => N(LET.indexOf(L), segno, 4)) };
  };
  const relMin = (t) => scala(t)[5];

  const INT = [[2, 1, 'seconda minore'], [2, 2, 'seconda maggiore'], [3, 3, 'terza minore'], [3, 4, 'terza maggiore'], [4, 5, 'quarta giusta'],
    [4, 6, 'quarta aumentata'], [5, 6, 'quinta diminuita'], [5, 7, 'quinta giusta'], [6, 8, 'sesta minore'], [6, 9, 'sesta maggiore'],
    [7, 10, 'settima minore'], [7, 11, 'settima maggiore'], [8, 12, 'ottava giusta']];
  const NUM = { 2: 'seconda', 3: 'terza', 4: 'quarta', 5: 'quinta', 6: 'sesta', 7: 'settima', 8: 'ottava' };
  const QUAL = ['minore', 'maggiore', 'giusta', 'aumentata', 'diminuita'];
  const sopra = (n, num, semi) => { const u = fromDia(dia(n) + num - 1); u.a = midi(n) + semi - (12 * (u.o + 1) + PC[u.l]); return u; };

  // Chiavi: dia della 1ª riga (in basso) e intervallo di note proposte (Note reali, non scritte)
  const CHIAVI = {
    treble: { nome: 'chiave di violino', base: 30, da: 28, a: 40, abc: 'treble', ancora: 'La chiave di violino si avvolge attorno alla 2ª riga: lì c\'è il Sol4.' },
    'treble-8': { nome: 'chiave di violino ottava bassa', base: 23, da: 21, a: 33, abc: 'treble-8', ancora: 'È la chiave di violino un\'ottava sotto: sulla 2ª riga c\'è il Sol3.' },
    bass: { nome: 'chiave di basso', base: 18, da: 16, a: 28, abc: 'bass', ancora: 'I due punti della chiave di basso stanno attorno alla 4ª riga: lì c\'è il Fa3.' },
  };
  const posizione = (p) => {
    if (p >= 0 && p <= 8) return p % 2 === 0 ? `sulla ${p / 2 + 1}ª riga` : `nel ${(p + 1) / 2}° spazio`;
    return p < 0 ? 'sotto il rigo, con i tagli addizionali' : 'sopra il rigo, con i tagli addizionali';
  };
  const testa = (abcBody, { clef = 'treble', k = 'C', m = null, l = '1/1' } = {}) =>
    `X:1\n${m ? 'M:' + m + '\n' : ''}L:${l}\nK:${k} clef=${clef}\n${abcBody}|]\n`;

  // ---------- Generatori ----------
  const G = {};

  G.nota = ({ chiavi = ['treble'] } = {}) => {
    const ck = pick(chiavi), C = CHIAVI[ck];
    const d = C.da + r(C.a - C.da + 1);
    const a = rnd() < 0.3 ? pick([1, -1]) : 0;
    const n = fromDia(d, a);
    const altri = shuffle([N((n.l + 1) % 7, n.a, 0), N((n.l + 6) % 7, n.a, 0), N((n.l + 2) % 7, n.a, 0), N(n.l, n.a === 0 ? pick([1, -1]) : 0, 0), N((n.l + 5) % 7, n.a, 0)])
      .filter((x, i, arr) => arr.findIndex((y) => stessa(x, y)) === i).slice(0, 3);
    const p = d - C.base;
    return {
      tipo: 'nota', titolo: 'Nomina la nota', chiave: ck, nota: n,
      testo: 'Come si chiama questa nota?',
      testoInverso: `Tocca il pentagramma dove sta il ${nomeOtt(n)}.`,
      abc: testa(abc(ck === 'treble-8' ? { ...n, o: n.o + 1 } : n), { clef: C.abc }), // abcjs disegna treble-8 come treble: si scrive un'ottava sopra
      giusta: nome(n), opzioni: shuffle([nome(n), ...altri.map(nome)]),
      spiegazione: `${C.ancora} La nota è ${posizione(p)}: è il ${nomeOtt(n)}${n.a ? ` (${n.a > 0 ? 'il diesis alza' : 'il bemolle abbassa'} di un semitono)` : ''}.`,
    };
  };

  G.sillaba = () => {
    const t = pick(TONICHE);
    const grado = r(7);
    const n = fromDia(dia(t) + grado - (t.l >= 5 ? 7 : 0));
    n.a = scala(t)[grado].a;
    const altri = shuffle([1, 2, 3, 4, 5, 6].map((k) => SIL[(grado + k) % 7])).slice(0, 3);
    return {
      tipo: 'sillaba', titolo: 'Nomina la sillaba', tonica: t, grado, nota: n,
      testo: 'Con questa Armatura, quale Sillaba si canta?',
      testoInverso: `Con questa Armatura, tocca una nota che si canta ${SIL[grado]}.`,
      abc: testa(abc(n, { key: true }), { k: kAbc(t) }),
      giusta: SIL[grado], opzioni: shuffle([SIL[grado], ...altri]),
      spiegazione: `L'Armatura è di ${nome(t)} maggiore, quindi il DO è il ${nome(t)}. ${nome(n)} è il ${grado + 1}° grado: si canta ${SIL[grado]}.`,
    };
  };

  G.intervallo = () => {
    for (;;) {
      const [num, semi, nomeI] = pick(INT);
      const giu = fromDia(28 + r(6), rnd() < 0.2 ? pick([1, -1]) : 0);
      const su = sopra(giu, num, semi);
      if (Math.abs(su.a) > 1) continue;
      const pari = INT.filter(([nn]) => Math.abs(nn - num) <= 1).map((x) => x[2]).filter((x) => x !== nomeI);
      const lett = []; for (let i = 0; i < num; i++) lett.push(NOMI[(giu.l + i) % 7]);
      return {
        tipo: 'intervallo', titolo: 'Riconosci l\'intervallo', giu, su, num, semi,
        testo: 'Che Intervallo c\'è tra queste due note?',
        testoInverso: `Scrivi la nota una ${nomeI} sopra il ${nomeOtt(giu)}.`,
        abc: testa(abc(giu) + '2' + abc(su) + '2', { l: '1/4' }),
        giusta: nomeI, opzioni: shuffle([nomeI, ...shuffle(pari).slice(0, 3)]),
        spiegazione: `Da ${nome(giu)} a ${nome(su)} si contano ${num} note (${lett.join(' ')}): ${NUM[num]}. Ci sono ${semi} semitoni: ${nomeI}.`,
      };
    }
  };

  const testoScala = (sc) => sc.map(nome).join(' ');
  G.scala = () => {
    const t = { ...pick(TONICHE) };
    const sc = scala(t);
    const sbagliate = new Set();
    let tent = 0;
    while (sbagliate.size < 3 && tent++ < 50) {
      const x = sc.map((n) => ({ ...n }));
      const i = 1 + r(6);
      const m = r(3);
      if (m === 0) x[i].a += pick([1, -1]); // un grado alterato male
      else if (m === 1) { const e = fromDia(dia(x[i]) + 1); e.a = midi(x[i]) - (12 * (e.o + 1) + PC[e.l]); x[i] = e; } // enarmonico sopra
      else { const e = fromDia(dia(x[i]) - 1); e.a = midi(x[i]) - (12 * (e.o + 1) + PC[e.l]); x[i] = e; } // enarmonico sotto
      if (x.some((n) => Math.abs(n.a) > 1)) continue;
      const tx = testoScala(x);
      if (tx !== testoScala(sc)) sbagliate.add(tx);
    }
    return {
      tipo: 'scala', titolo: 'Costruisci la scala', tonica: t, scala: sc,
      testo: `Costruisci la scala di ${nome(t)} maggiore.`,
      abc: testa(abc(t) + '2', { l: '1/2' }),
      giusta: testoScala(sc), opzioni: shuffle([testoScala(sc), ...sbagliate]),
      spiegazione: `Toni e semitoni: T T S T T T S. Ogni nota ha un nome diverso, in ordine: ${testoScala(sc)}.`,
    };
  };

  G.tonalita = ({ modo = 'caso' } = {}) => {
    const t = pick(TONICHE);
    const m = modo === 'caso' ? pick(['maggiore', 'minore']) : modo;
    const rm = relMin(t);
    const tonica = m === 'maggiore' ? t : rm;
    const alt = alterazioni(t);
    const i = TONICHE.findIndex((x) => stessa(x, t));
    const vicini = [TONICHE[(i + 1) % 13], TONICHE[(i + 12) % 13]].filter(Boolean);
    const lab = (x, mm) => `${nome(x)} ${mm}`;
    const altri = m === 'maggiore'
      ? [lab(rm, 'minore'), ...vicini.map((v) => lab(v, 'maggiore'))]
      : [lab(t, 'maggiore'), ...vicini.map((v) => lab(relMin(v), 'minore'))];
    let regola;
    if (!alt.note.length) regola = 'Nessuna alterazione: Do maggiore, o la sua relativa La minore.';
    else if (alt.segno > 0) regola = `${alt.note.length} diesis (${alt.note.map(nome).join(', ')}). L'ultimo diesis, ${nome(alt.note.at(-1))}, è il 7° grado: la tonica maggiore è un semitono sopra, ${nome(t)}.`;
    else if (alt.note.length === 1) regola = '1 bemolle (Si♭): è Fa maggiore, da ricordare a memoria.';
    else regola = `${alt.note.length} bemolle (${alt.note.map(nome).join(', ')}). Il penultimo bemolle, ${nome(alt.note.at(-2))}, è la tonica maggiore.`;
    return {
      tipo: 'tonalita', titolo: 'Trova la tonalità', modo: m, tonica,
      testo: `Quale Tonalità ${m} ha questa Armatura?`,
      abc: `X:1\nL:1/1\nK:${kAbc(t)} clef=treble\nx|]\n`,
      giusta: lab(tonica, m), opzioni: shuffle([lab(tonica, m), ...altri.slice(0, 3)]),
      spiegazione: regola + (m === 'minore' ? ` La relativa minore sta una terza minore sotto: ${nome(rm)} minore.` : ''),
    };
  };

  const FIG = [
    { v: 4, abc: '4', nome: 'semibreve' }, { v: 3, abc: '3', nome: 'minima puntata' }, { v: 2, abc: '2', nome: 'minima' },
    { v: 1.5, abc: '3/2', nome: 'semiminima puntata' }, { v: 1, abc: '', nome: 'semiminima' }, { v: 0.5, abc: '/2', nome: 'croma' },
  ];
  G.battuta = () => {
    const manca = pick([2, 1, 0.5, 3, 1.5]);
    const fm = FIG.find((f) => f.v === manca);
    const pezzi = []; let rest = 4 - manca;
    while (rest > 0) { const f = pick(FIG.filter((x) => [2, 1, 0.5].includes(x.v) && x.v <= rest)); pezzi.push(f); rest -= f.v; }
    const pos = r(pezzi.length + 1);
    const corpo = pezzi.map((f) => abc(fromDia(30 + r(7))) + f.abc);
    corpo.splice(pos, 0, `"^?"x${fm.abc}`);
    const altri = shuffle(FIG.filter((f) => f.v !== manca && f.v < 4)).slice(0, 3).map((f) => f.nome);
    return {
      tipo: 'battuta', titolo: 'Completa la battuta', manca,
      testo: 'Quale Figura manca al posto del punto di domanda?',
      abc: testa(corpo.join(' '), { m: '4/4', l: '1/4' }),
      giusta: fm.nome, opzioni: shuffle([fm.nome, ...altri]),
      spiegazione: `In 4/4 la Battuta vale 4 semiminime. Le note scritte valgono ${4 - manca}: ne manca ${String(manca).replace('.', ',')}, cioè una ${fm.nome}.`,
    };
  };

  return { seed, G, N, NOMI, SIL, PC, LET, INT, NUM, QUAL, FIG, CHIAVI, midi, pc, dia, fromDia, nome, nomeOtt, abc, testa, scala, alterazioni, kAbc, sopra, testoScala, stessa, accTxt };
})();
