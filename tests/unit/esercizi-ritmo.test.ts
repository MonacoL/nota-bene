// "Completa la battuta" (Figure e pause, Indicazioni metriche) e "Riconosci il tempo" (Indicazioni metriche, #85). L'ABC si legge con abcjs, indipendente dal modulo.
import abcjs from 'abcjs';
import { describe, expect, it } from 'vitest';
import { genera, valuta, INDICAZIONI, TEMPI, type EsercizioCompletaLaBattuta, type EsercizioRiconosciIlTempo, type Figura, type NomeIndicazione } from '../../src/esercizi';

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

const BATTUTA: Record<string, number> = { '2/4': 8, '3/4': 12, '4/4': 16, '6/8': 12, '9/8': 18, '12/8': 24 };
const PULSAZIONE: Record<string, number> = { '2/4': 4, '3/4': 4, '4/4': 4, '6/8': 6, '9/8': 6, '12/8': 6 };
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
  it('in Figure e pause solo 4/4; alla Battuta scritta mancano almeno una croma e mai più di metà', () => {
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

  it('in Indicazioni metriche semplici e composti, e la Battuta ha la durata giusta', () => {
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

// Il Tempo di ogni Indicazione metrica, dalla lezione del maestro Sabetta (ADR-0012): il numero sopra decide.
// Semplici 2 3 4 5 7 (contano le Pulsazioni), composti 6 9 12 15 21 (contano le Suddivisioni).
const TEMPO_ATTESO: Record<NomeIndicazione, [string, string]> = {
  '2/2': ['binario', 'semplice'],
  '2/4': ['binario', 'semplice'],
  '3/4': ['ternario', 'semplice'],
  '4/4': ['quaternario', 'semplice'],
  '5/4': ['quinario', 'semplice'],
  '7/4': ['misto', 'semplice'],
  '3/8': ['ternario', 'semplice'],
  '6/4': ['binario', 'composto'],
  '6/8': ['binario', 'composto'],
  '9/8': ['ternario', 'composto'],
  '12/8': ['quaternario', 'composto'],
  '15/8': ['quinario', 'composto'],
  '21/8': ['misto', 'composto'],
};

const riconosci = (indicazione: NomeIndicazione): EsercizioRiconosciIlTempo => ({ tipo: 'riconosci-il-tempo', indicazione });

describe('Riconosci il tempo: genera', () => {
  it("propone solo le Indicazioni metriche dichiarate nel Capitolo, e prima o poi tutte", () => {
    const visti = new Set<string>();
    for (const s of SEED) visti.add(genera('riconosci-il-tempo', { indicazioni: [...INDICAZIONI] }, s).indicazione);
    expect([...visti].sort()).toEqual(Object.keys(TEMPO_ATTESO).sort());
    for (const s of SEED.slice(0, 50)) expect(['6/8', '3/4']).toContain(genera('riconosci-il-tempo', { indicazioni: ['6/8', '3/4'] }, s).indicazione);
  });
});

describe('Riconosci il tempo: valuta', () => {
  it.each(Object.entries(TEMPO_ATTESO).map(([i, [n, g]]) => [i, n, g]))('%s è %s %s', (indicazione, numero, genere) => {
    const r = valuta(riconosci(indicazione as NomeIndicazione), { numero, genere } as never);
    expect(r.esito).toBe('giusto');
    expect(r.giusta.it).toBe(`${numero} ${genere}`);
  });

  it('il 3/8 è semplice: il 3 sopra conta le Pulsazioni, anche se sotto c\'è 8', () => {
    const r = valuta(riconosci('3/8'), { numero: 'binario', genere: 'composto' });
    expect(r.esito).toBe('sbagliato');
    expect(r.data).toEqual({ it: 'binario composto', en: 'compound duple' });
    expect(r.giusta).toEqual({ it: 'ternario semplice', en: 'simple triple' });
    expect(r.spiegazione.it).toBe('Il 3 sopra è uno dei numeri dei tempi semplici (2, 3, 4, 5, 7) e conta le pulsazioni: 3 pulsazioni, ognuna divisa in 2 suddivisioni. È un tempo ternario semplice.');
    expect(r.spiegazione.en).toBe('The top 3 is one of the simple-meter numbers (2, 3, 4, 5, 7) and counts the beats: 3 beats, each divided into 2 subdivisions. It is simple triple meter.');
  });

  it('nei composti il numero sopra conta le Suddivisioni, a gruppi di 3', () => {
    const r = valuta(riconosci('12/8'), { numero: 'quaternario', genere: 'composto' });
    expect(r.esito).toBe('giusto');
    expect(r.giusta).toEqual({ it: 'quaternario composto', en: 'compound quadruple' });
    expect(r.spiegazione.it).toBe('Il 12 sopra è uno dei numeri dei tempi composti (6, 9, 12, 15, 21) e conta le suddivisioni: 12 suddivisioni a gruppi di 3 fanno 4 pulsazioni. È un tempo quaternario composto.');
    expect(r.spiegazione.en).toBe('The top 12 is one of the compound-meter numbers (6, 9, 12, 15, 21) and counts the subdivisions: 12 subdivisions in groups of 3 make 4 beats. It is compound quadruple meter.');
  });

  it('va indovinato tutto: il numero di Pulsazioni giusto con la Suddivisione sbagliata è un errore', () => {
    expect(valuta(riconosci('6/8'), { numero: 'binario', genere: 'semplice' }).esito).toBe('sbagliato');
    expect(valuta(riconosci('6/8'), { numero: 'ternario', genere: 'composto' }).esito).toBe('sbagliato');
    expect(valuta(riconosci('21/8'), { numero: 'misto', genere: 'composto' }).giusta.en).toBe('compound septuple');
    expect(valuta(riconosci('5/4'), { numero: 'quinario', genere: 'semplice' }).giusta.en).toBe('simple quintuple');
  });
});
