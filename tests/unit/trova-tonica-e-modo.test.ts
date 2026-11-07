// "Trova Tonica e Modo" (Capitolo 7, ticket #35). Le altezze della melodia si leggono con abcjs, come le suona
// l'audio (armatura, alterazioni e chiave di violino ottava bassa comprese): il test non usa il generatore per
// capire che cosa c'è scritto.
import abcjs from 'abcjs';
import { describe, expect, it } from 'vitest';
import { genera, valuta, type Chiave } from '../../src/esercizi';

const SEED = Array.from({ length: 300 }, (_, i) => i * 7919 + 11);
const CHIAVI: Chiave[] = ['violino', 'violino-ottava-bassa', 'basso'];
const SEMITONI: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Le altezze MIDI reali della melodia, nell'ordine, come le suona abcjs. */
function altezze(abc: string): number[] {
  const [brano] = abcjs.parseOnly(abc);
  expect(brano!.warnings ?? []).toEqual([]);
  brano!.setUpAudio({});
  return brano!.lines
    .flatMap((r) => r.staff ?? [])
    .flatMap((s) => s.voices ?? [])
    .flat()
    .flatMap((e) => (e as { midiPitches?: { pitch: number }[] }).midiPitches ?? [])
    .map((p) => p.pitch);
}

const MAGGIORE = [0, 2, 4, 5, 7, 9, 11];
/** La minore naturale con la sensibile alzata della armonica. */
const MINORE = [0, 2, 3, 5, 7, 8, 10, 11];

/**
 * Le regole del Capitolo 7, su tutte le 24 tonalità: la melodia finisce sulla tonica, comincia su una nota
 * dell'accordo di tonica, contiene il 3° grado, usa solo note della scala e, in minore, la sensibile alzata.
 */
function tonalitaCompatibili(note: number[]): string[] {
  const classi = note.map((n) => ((n % 12) + 12) % 12);
  const compatibili: string[] = [];
  for (let tonica = 0; tonica < 12; tonica++) {
    for (const modo of ['maggiore', 'minore'] as const) {
      const grado = (c: number) => (c - tonica + 12) % 12;
      const terza = modo === 'maggiore' ? 4 : 3;
      const scala = modo === 'maggiore' ? MAGGIORE : MINORE;
      if (grado(classi.at(-1)!) !== 0) continue;
      if (![0, terza, 7].includes(grado(classi[0]!))) continue;
      if (!classi.some((c) => grado(c) === terza)) continue;
      if (!classi.every((c) => scala.includes(grado(c)))) continue;
      if (modo === 'minore' && !classi.some((c) => grado(c) === 11)) continue;
      compatibili.push(`${tonica} ${modo}`);
    }
  }
  return compatibili;
}

const classeDi = (t: { lettera: string; alterazione: number }) => (SEMITONI[t.lettera]! + t.alterazione + 12) % 12;

describe('Trova Tonica e Modo: genera', () => {
  it('la melodia ha una sola tonalità compatibile con le regole del Capitolo 7, ed è quella della risposta', () => {
    for (const s of SEED) {
      const es = genera('trova-tonica-e-modo', { chiavi: CHIAVI }, s);
      expect(tonalitaCompatibili(altezze(es.abc)), `seed ${s}: ${es.abc}`).toEqual([`${classeDi(es.tonica)} ${es.modo}`]);
    }
  });

  it('usa solo le chiavi dichiarate, sta sul rigo con al più un taglio addizionale, armatura fino a 4 alterazioni', () => {
    // Le note reali, dal taglio sotto al taglio sopra: violino Do4–La5, ottava bassa Do3–La4, basso Mi2–Do4.
    const ESTENSIONI: Record<Chiave, [number, number]> = { violino: [60, 81], 'violino-ottava-bassa': [48, 69], basso: [40, 60] };
    const viste = new Set<string>();
    for (const chiavi of [['violino'], ['basso'], CHIAVI] as Chiave[][]) {
      for (const s of SEED) {
        const es = genera('trova-tonica-e-modo', { chiavi }, s);
        expect(chiavi).toContain(es.chiave);
        viste.add(`${es.chiave} ${es.modo}`);
        expect(Math.abs(es.quinte)).toBeLessThanOrEqual(4);
        const [basso, alto] = ESTENSIONI[es.chiave];
        for (const n of altezze(es.abc)) expect(n, `seed ${s}: ${es.abc}`).toBeGreaterThanOrEqual(basso - 1);
        for (const n of altezze(es.abc)) expect(n, `seed ${s}: ${es.abc}`).toBeLessThanOrEqual(alto + 1);
      }
    }
    expect(viste.size).toBe(6);
  });
});

describe('Trova Tonica e Modo: valuta', () => {
  /** Il primo seed che dà la tonalità chiesta, in chiave di violino. */
  function esercizio(tonica: string, modo: 'maggiore' | 'minore') {
    for (const s of SEED) {
      const es = genera('trova-tonica-e-modo', { chiavi: ['violino'] }, s);
      if (`${es.tonica.lettera}${es.tonica.alterazione}` === tonica && es.modo === modo) return es;
    }
    throw new Error(`nessun seed per ${tonica} ${modo}`);
  }

  it('è giusto solo con la tonica e il modo giusti, e la spiegazione c\'è sempre', () => {
    const es = esercizio('D0', 'minore');
    const giusto = valuta(es, { tonica: { lettera: 'D', alterazione: 0 }, modo: 'minore' });
    expect(giusto).toMatchObject({ esito: 'giusto', data: { it: 'Re minore', en: 'D minor' }, giusta: { it: 'Re minore', en: 'D minor' } });
    expect(giusto.spiegazione.it).toContain('Re');
    expect(giusto.spiegazione.it).toContain('Do♯');
    expect(giusto.spiegazione.en).toContain('C♯');
    expect(valuta(es, { tonica: { lettera: 'D', alterazione: 0 }, modo: 'maggiore' }).esito).toBe('sbagliato');
    expect(valuta(es, { tonica: { lettera: 'D', alterazione: 1 }, modo: 'minore' }).esito).toBe('sbagliato');
  });

  it('la relativa è la trappola tipica, e la spiegazione la nomina', () => {
    const minore = esercizio('A0', 'minore');
    const r = valuta(minore, { tonica: { lettera: 'C', alterazione: 0 }, modo: 'maggiore' });
    expect(r).toMatchObject({ esito: 'sbagliato', data: { it: 'Do maggiore' }, giusta: { it: 'La minore' } });
    expect(r.spiegazione.it).toContain('relativa');
    expect(r.spiegazione.en).toContain('relative');
    const maggiore = esercizio('F0', 'maggiore');
    const m = valuta(maggiore, { tonica: { lettera: 'D', alterazione: 0 }, modo: 'minore' });
    expect(m.esito).toBe('sbagliato');
    expect(m.spiegazione.it).toContain('relativa');
  });
});
