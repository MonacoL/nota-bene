// Modulo Esercizi: genera(tipo, parametri, seed) e valuta(Esercizio, risposta).
// L'ABC generato si controlla con il parser di abcjs, che è indipendente dal modulo.
import abcjs from 'abcjs';
import { describe, expect, it } from 'vitest';
import { genera, valuta, type EsercizioNominaLaNota, type Nota } from '../../src/esercizi';

const LETTERE = 'CDEFGAB';
const SEED = Array.from({ length: 200 }, (_, i) => i * 7919 + 1);

/** Clef e Nota scritta, come le legge abcjs: pitch 0 è il Do4, uno per ogni grado della scala. */
function letto(abc: string): { clef: string; scritta: Nota } {
  const [brano] = abcjs.parseOnly(abc);
  expect(brano!.warnings ?? []).toEqual([]);
  const rigo = brano!.lines[0]!.staff![0]!;
  const note = rigo.voices![0]!.filter((e) => e.el_type === 'note');
  expect(note).toHaveLength(1);
  const [p] = note[0]!.pitches!;
  const grado = 28 + p!.pitch;
  const alterazione = { sharp: 1, flat: -1, natural: 0, undefined: 0 }[String(p!.accidental)] as -1 | 0 | 1;
  return {
    clef: rigo.clef!.type,
    scritta: { lettera: LETTERE[((grado % 7) + 7) % 7] as Nota['lettera'], alterazione, ottava: Math.floor(grado / 7) },
  };
}

/** Posizione di una Nota sui tasti bianchi: Do4 = 28. */
const grado = (n: Nota) => n.ottava * 7 + LETTERE.indexOf(n.lettera);

describe('Nomina la nota: genera', () => {
  it('in chiave di violino scrive una sola nota, la stessa della Nota reale, fra Do4 e La5', () => {
    for (const seed of SEED) {
      const es = genera('nomina-la-nota', { chiavi: ['violino'] }, seed);
      expect(es.chiave).toBe('violino');
      const { clef, scritta } = letto(es.abc);
      expect(clef).toBe('treble');
      expect(scritta).toEqual(es.nota);
      expect(grado(es.nota)).toBeGreaterThanOrEqual(grado({ lettera: 'C', alterazione: 0, ottava: 4 }));
      expect(grado(es.nota)).toBeLessThanOrEqual(grado({ lettera: 'A', alterazione: 0, ottava: 5 }));
    }
  });

  it('usa tutte e sole le Chiavi ammesse; in violino ottava bassa la Nota reale è un\'ottava sotto la scritta', () => {
    // Note reali da un taglio sotto il rigo a un taglio sopra.
    const estremi = { violino: ['C4', 'A5'], 'violino-ottava-bassa': ['C3', 'A4'], basso: ['E2', 'C4'] } as const;
    const clef = { violino: 'treble', 'violino-ottava-bassa': 'treble-8', basso: 'bass' } as const;
    const viste = new Set<string>();
    for (const seed of SEED) {
      const es = genera('nomina-la-nota', { chiavi: ['violino', 'violino-ottava-bassa', 'basso'] }, seed);
      viste.add(es.chiave);
      const letta = letto(es.abc);
      expect(letta.clef).toBe(clef[es.chiave]);
      const ottavaSopra = es.chiave === 'violino-ottava-bassa' ? 1 : 0;
      expect(letta.scritta).toEqual({ ...es.nota, ottava: es.nota.ottava + ottavaSopra });
      const [da, a] = estremi[es.chiave].map((s) => grado({ lettera: s[0] as Nota['lettera'], alterazione: 0, ottava: Number(s[1]) }));
      expect(grado(es.nota)).toBeGreaterThanOrEqual(da!);
      expect(grado(es.nota)).toBeLessThanOrEqual(a!);
    }
    expect([...viste].sort()).toEqual(['basso', 'violino', 'violino-ottava-bassa']);
  });

  it('a volte altera la nota con ♯ o ♭, ma mai Mi♯, Si♯, Do♭, Fa♭', () => {
    const nomi = new Set(SEED.map((s) => genera('nomina-la-nota', { chiavi: ['violino'] }, s).nota).map((n) => `${n.lettera}${n.alterazione}`));
    expect([...nomi].some((n) => n.endsWith('-1'))).toBe(true);
    expect([...nomi].some((n) => n.endsWith('1') && !n.endsWith('-1'))).toBe(true);
    for (const vietata of ['E1', 'B1', 'C-1', 'F-1']) expect(nomi).not.toContain(vietata);
  });
});

const solDiesis4: EsercizioNominaLaNota = {
  tipo: 'nomina-la-nota',
  chiave: 'violino',
  nota: { lettera: 'G', alterazione: 1, ottava: 4 },
  abc: 'X:1\nL:1/1\nK:C clef=treble\n^G|]\n',
};

describe('Nomina la nota: valuta', () => {
  it('la risposta giusta è giusta, con il nome in italiano e in inglese e la spiegazione che dà l\'ottava', () => {
    const r = valuta(solDiesis4, { lettera: 'G', alterazione: 1 });
    expect(r.esito).toBe('giusto');
    expect(r.data).toEqual({ it: 'Sol♯', en: 'G♯' });
    expect(r.giusta).toEqual({ it: 'Sol♯', en: 'G♯' });
    expect(r.spiegazione.it).toContain('Sol♯4');
    expect(r.spiegazione.en).toContain('G♯4');
  });

  it('un altro nome per lo stesso tasto è sbagliato, e la spiegazione lo dice', () => {
    const r = valuta(solDiesis4, { lettera: 'A', alterazione: -1 });
    expect(r.esito).toBe('sbagliato');
    expect(r.data).toEqual({ it: 'La♭', en: 'A♭' });
    expect(r.giusta).toEqual({ it: 'Sol♯', en: 'G♯' });
    expect(r.spiegazione.it).toContain('stesso tasto');
    expect(r.spiegazione.en).toContain('same key');

    const siBemolle: EsercizioNominaLaNota = { tipo: 'nomina-la-nota', chiave: 'basso', nota: { lettera: 'B', alterazione: -1, ottava: 2 }, abc: '' };
    expect(valuta(siBemolle, { lettera: 'A', alterazione: 1 }).spiegazione.it).toContain('stesso tasto');
  });

  it('una nota sbagliata che non è lo stesso tasto non parla di enarmonia', () => {
    const r = valuta(solDiesis4, { lettera: 'G', alterazione: 0 });
    expect(r.esito).toBe('sbagliato');
    expect(r.data).toEqual({ it: 'Sol', en: 'G' });
    expect(r.spiegazione.it).not.toContain('stesso tasto');
    expect(r.spiegazione.en).not.toContain('same key');
  });

  it('la spiegazione dice dove sta la nota scritta e l\'ottava della Nota reale', () => {
    const es = (chiave: EsercizioNominaLaNota['chiave'], lettera: Nota['lettera'], ottava: number): EsercizioNominaLaNota =>
      ({ tipo: 'nomina-la-nota', chiave, nota: { lettera, alterazione: 0, ottava }, abc: '' });
    const casi = [
      // Il Sol3 del tenore si scrive sulla 2ª riga, come il Sol4 in chiave di violino.
      [es('violino-ottava-bassa', 'G', 3), 'sulla 2ª riga: è il Sol3', 'on the 2nd line: it is G3'],
      [es('violino', 'G', 4), 'sulla 2ª riga: è il Sol4', 'on the 2nd line: it is G4'],
      [es('basso', 'F', 3), 'sulla 4ª riga: è il Fa3', 'on the 4th line: it is F3'],
      [es('violino', 'C', 4), 'sul taglio addizionale sotto il rigo: è il Do4', 'on the ledger line below the staff: it is C4'],
      [es('basso', 'C', 4), 'sul taglio addizionale sopra il rigo: è il Do4', 'on the ledger line above the staff: it is C4'],
      [es('violino-ottava-bassa', 'A', 3), 'nel 2° spazio: è il La3', 'in the 2nd space: it is A3'],
      [es('violino', 'D', 4), 'appena sotto la 1ª riga: è il Re4', 'just below the 1st line: it is D4'],
    ] as const;
    for (const [esercizio, it, en] of casi) {
      const r = valuta(esercizio, { lettera: 'C', alterazione: 1 });
      expect(r.spiegazione.it).toContain(it);
      expect(r.spiegazione.en).toContain(en);
    }
  });

  it('per ogni seed la risposta col nome della Nota è giusta e ha una spiegazione nelle due lingue', () => {
    for (const seed of SEED) {
      const es = genera('nomina-la-nota', { chiavi: ['violino', 'violino-ottava-bassa', 'basso'] }, seed);
      const r = valuta(es, { lettera: es.nota.lettera, alterazione: es.nota.alterazione });
      expect(r.esito).toBe('giusto');
      expect(r.spiegazione.it.length).toBeGreaterThan(20);
      expect(r.spiegazione.en.length).toBeGreaterThan(20);
    }
  });
});
