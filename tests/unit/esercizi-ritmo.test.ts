// "Completa la battuta" e "Riconosci il tempo" (Capitoli 3 e 4). L'ABC si legge con abcjs, indipendente dal modulo.
import abcjs from 'abcjs';
import { describe, expect, it } from 'vitest';
import { genera, valuta, TEMPI, type EsercizioCompletaLaBattuta, type EsercizioRiconosciIlTempo, type Figura } from '../../src/esercizi';

const SEED = Array.from({ length: 300 }, (_, i) => i * 7919 + 17);

/** Il Tempo scritto (se c'è) e le Battute, come durate in semicrome con le travature, lette da abcjs. */
function letto(abc: string) {
  const [brano] = abcjs.parseOnly(abc);
  expect(brano!.warnings ?? []).toEqual([]);
  // Le Battute possono andare a capo: si leggono tutti i righi.
  const righi = brano!.lines.map((l) => l.staff![0]!);
  const rigo = righi[0]!;
  const battute: { durata: number; trave: 'inizio' | 'fine' | undefined }[][] = [[]];
  // startBeam, endBeam e startTriplet li dà il parser, ma i tipi di abcjs non li dichiarano.
  type Elemento = { el_type: string; duration?: number; startBeam?: boolean; endBeam?: boolean; startTriplet?: number };
  for (const e of righi.flatMap((r) => r.voices![0]!) as unknown as Elemento[]) {
    expect(e.startTriplet, 'gruppo irregolare').toBeUndefined();
    if (e.el_type === 'bar') battute.push([]);
    else if (e.el_type === 'note') battute.at(-1)!.push({ durata: e.duration! * 16, trave: e.startBeam ? 'inizio' : e.endBeam ? 'fine' : undefined });
  }
  const m = rigo.meter?.value?.[0];
  return { tempo: m ? `${m.num}/${m.den}` : undefined, battute: battute.filter((b) => b.length) };
}

const BATTUTA: Record<string, number> = { '2/4': 8, '3/4': 12, '4/4': 16, '3/8': 6, '6/8': 12, '9/8': 18, '12/8': 24 };
const PULSAZIONE: Record<string, number> = { '2/4': 4, '3/4': 4, '4/4': 4, '3/8': 6, '6/8': 6, '9/8': 6, '12/8': 6 };
const somma = (b: { durata: number }[]) => b.reduce((s, x) => s + x.durata, 0);

/** Ogni gruppo con la trave comincia su una Pulsazione e ci sta dentro. */
function travePerPulsazione(battuta: { durata: number; trave?: string }[], pulsazione: number) {
  let t = 0;
  let inizio: number | undefined;
  for (const n of battuta) {
    if (n.trave === 'inizio') {
      inizio = t;
      expect(t % pulsazione, 'la trave comincia su una pulsazione').toBe(0);
    }
    t += n.durata;
    if (n.trave === 'fine') {
      expect(t - inizio!, 'la trave sta in una pulsazione').toBeLessThanOrEqual(pulsazione);
      inizio = undefined;
    }
  }
}

describe('Completa la battuta: genera', () => {
  it('nel Capitolo 3 solo 4/4; alla Battuta scritta mancano almeno una croma e mai più di metà', () => {
    for (const s of SEED) {
      const es = genera('completa-la-battuta', { tempi: ['4/4'] }, s);
      const l = letto(es.abc);
      expect(l.tempo).toBe('4/4');
      expect(l.battute).toHaveLength(1);
      expect(somma(l.battute[0]!) + es.mancano).toBe(16);
      expect(es.mancano).toBeGreaterThanOrEqual(2);
      expect(es.mancano).toBeLessThanOrEqual(8);
      expect(es.mancano % 2).toBe(0);
      travePerPulsazione(l.battute[0]!, 4);
    }
  });

  it('nel Capitolo 4 tutti i Tempi, semplici e composti, e la Battuta ha la durata giusta', () => {
    const visti = new Set<string>();
    for (const s of SEED) {
      const es = genera('completa-la-battuta', { tempi: [...TEMPI] }, s);
      const l = letto(es.abc);
      visti.add(l.tempo!);
      expect(somma(l.battute[0]!) + es.mancano).toBe(BATTUTA[l.tempo!]);
      travePerPulsazione(l.battute[0]!, PULSAZIONE[l.tempo!]!);
    }
    expect([...visti].sort()).toEqual(Object.keys(BATTUTA).sort());
  });
});

describe('Riconosci il tempo: genera', () => {
  it('due Battute senza Tempo scritto, ognuna lunga quanto il Tempo, con le travi per Pulsazione', () => {
    const visti = new Set<string>();
    for (const s of SEED) {
      const es = genera('riconosci-il-tempo', { tempi: [...TEMPI] }, s);
      visti.add(es.tempo);
      const l = letto(es.abc);
      expect(l.tempo).toBeUndefined();
      expect(l.battute).toHaveLength(2);
      for (const b of l.battute) {
        expect(somma(b)).toBe(BATTUTA[es.tempo]);
        travePerPulsazione(b, PULSAZIONE[es.tempo]!);
        // Ogni Figura sta dentro una Pulsazione: niente minime che coprono due battiti, così 3/4 e 6/8 non si confondono.
        expect(Math.max(...b.map((n) => n.durata))).toBeLessThanOrEqual(PULSAZIONE[es.tempo]!);
      }
    }
    expect([...visti].sort()).toEqual(Object.keys(BATTUTA).sort());
  });
});

const f = (s: string): Figura => ({ figura: s.replace('.', '') as Figura['figura'], punto: s.endsWith('.') });
const figure = (s: string) => ({ figure: s.split(' ').map(f) });
const completa = (tempo: EsercizioCompletaLaBattuta['tempo'], scritte: number[][], mancano: number): EsercizioCompletaLaBattuta =>
  ({ tipo: 'completa-la-battuta', tempo, scritte, mancano, abc: '' });

describe('Completa la battuta: valuta', () => {
  const mancaMinima = completa('4/4', [[4], [2, 2]], 8);

  it.each(['minima', 'semiminima semiminima', 'semiminima. croma', 'croma semiminima.', 'croma croma croma croma', 'croma semiminima croma'])(
    'accetta ogni combinazione con la somma giusta: %s',
    (risposta) => {
      expect(valuta(mancaMinima, figure(risposta)).esito).toBe('giusto');
    },
  );

  it.each(['semiminima', 'minima croma', 'semibreve', 'minima.', 'croma. croma'])('rifiuta una somma sbagliata: %s', (risposta) => {
    expect(valuta(mancaMinima, figure(risposta)).esito).toBe('sbagliato');
  });

  it('la spiegazione conta in crome', () => {
    const r = valuta(completa('4/4', [[4], [4], [2, 2]], 4), figure('croma croma'));
    expect(r.esito).toBe('giusto');
    expect(r.data).toEqual({ it: 'croma + croma', en: 'eighth note + eighth note' });
    expect(r.giusta).toEqual({ it: 'semiminima', en: 'quarter note' });
    expect(r.spiegazione.it).toBe('Una battuta di 4/4 vale 8 crome. Le note scritte ne valgono 6: ne mancano 2. La tua risposta ne vale 2.');
    expect(r.spiegazione.en).toBe('A 4/4 measure is worth 8 eighth notes. The written notes are worth 6: 2 are missing. Your answer is worth 2.');
  });

  it('troppo o troppo poco; il punto vale metà della Figura', () => {
    const r = valuta(completa('6/8', [[6], [4]], 2), figure('semiminima'));
    expect(r.esito).toBe('sbagliato');
    expect(r.giusta).toEqual({ it: 'croma', en: 'eighth note' });
    expect(r.spiegazione.it).toBe('Una battuta di 6/8 vale 6 crome. Le note scritte ne valgono 5: ne manca 1. La tua risposta ne vale 2: è troppo.');
    expect(r.spiegazione.en).toBe('A 6/8 measure is worth 6 eighth notes. The written notes are worth 5: 1 is missing. Your answer is worth 2: that is too much.');
    const poco = valuta(mancaMinima, figure('croma.'));
    expect(poco.data).toEqual({ it: 'croma col punto', en: 'dotted eighth note' });
    expect(poco.spiegazione.it).toContain('La tua risposta ne vale 1½: è troppo poco.');
    expect(poco.spiegazione.en).toContain('Your answer is worth 1½: that is too little.');
    expect(valuta(completa('6/8', [[6]], 6), figure('semiminima.')).giusta).toEqual({ it: 'semiminima col punto', en: 'dotted quarter note' });
  });

  it('per ogni seed la Figura giusta completa la Battuta', () => {
    for (const s of SEED) {
      const es = genera('completa-la-battuta', { tempi: [...TEMPI] }, s);
      const croma = { figura: 'croma', punto: false } as const;
      expect(valuta(es, { figure: Array(es.mancano / 2).fill(croma) }).esito).toBe('giusto');
    }
  });
});

const riconosci = (tempo: EsercizioRiconosciIlTempo['tempo'], battute: number[][][]): EsercizioRiconosciIlTempo =>
  ({ tipo: 'riconosci-il-tempo', tempo, battute, scelte: [...TEMPI], abc: '' });

describe('Riconosci il tempo: valuta', () => {
  it('composto: pulsazioni di semiminima col punto, crome a gruppi di 3', () => {
    const r = valuta(riconosci('6/8', [[[2, 2, 2], [6]], [[4, 2], [6]]]), { tempo: '6/8' });
    expect(r.esito).toBe('giusto');
    expect(r.giusta).toEqual({ it: '6/8', en: '6/8' });
    expect(r.spiegazione.it).toBe('Ogni battuta ha 2 pulsazioni di semiminima col punto, e le crome vanno a gruppi di 3: è un tempo composto, 6/8.');
    expect(r.spiegazione.en).toBe('Each measure has 2 beats of a dotted quarter note, and the eighth notes go in groups of 3: it is compound time, 6/8.');
  });

  it('semplice: pulsazioni di semiminima, crome a gruppi di 2', () => {
    const r = valuta(riconosci('3/4', [[[4], [2, 2], [4]], [[4], [4], [4]]]), { tempo: '3/4' });
    expect(r.spiegazione.it).toBe('Ogni battuta ha 3 pulsazioni di semiminima, e le crome vanno a gruppi di 2: è un tempo semplice, 3/4.');
    expect(r.spiegazione.en).toBe('Each measure has 3 beats of a quarter note, and the eighth notes go in groups of 2: it is simple time, 3/4.');
    expect(valuta(riconosci('3/8', [[[6]], [[2, 2, 2]]]), { tempo: '3/8' }).spiegazione.it).toContain('Ogni battuta ha 1 pulsazione di semiminima col punto');
  });

  it('3/4 al posto di 6/8 è sbagliato: stessa durata, ma le crome andrebbero a gruppi di 2', () => {
    const r = valuta(riconosci('6/8', [[[2, 2, 2], [6]], [[6], [6]]]), { tempo: '3/4' });
    expect(r.esito).toBe('sbagliato');
    expect(r.spiegazione.it).toContain('Il 3/4 dura lo stesso, ma le sue crome andrebbero a gruppi di 2.');
    expect(r.spiegazione.en).toContain('3/4 lasts the same, but its eighth notes would go in groups of 2.');
    expect(valuta(riconosci('12/8', [[[6], [6], [6], [6]], [[6], [6], [6], [6]]]), { tempo: '2/4' }).spiegazione.it).not.toContain('dura lo stesso');
  });
});
