// Esercizi pratici di ascolto (#86, ADR-0012): quali contano per il Capitolo completato, la generazione dei
// riconoscimenti e il punteggio di "Batti la pulsazione". Senza audio: si controllano i suoni programmati.
import { describe, expect, it } from 'vitest';
import { genera, metrica, tipiCheContano, valuta, valutaBattiti, BRANI_DI_PROVA, type Brano } from '../../src/esercizi';
import { creaProgressi, type Archivio } from '../../src/progressi';
import { schemaCapitoloIt } from '../../src/contenuti/schemi';

const inMemoria = (): Archivio => {
  const dati = new Map<string, string>();
  return { getItem: (k) => dati.get(k) ?? null, setItem: (k, v) => void dati.set(k, v), removeItem: (k) => void dati.delete(k) };
};

describe('Esercizi pratici: quali contano per il Capitolo completato', () => {
  it('"Batti la pulsazione" non conta, "Semplice o composto" sì', () => {
    expect(tipiCheContano([{ tipo: 'batti-la-pulsazione', importanza: 1 }, { tipo: 'semplice-o-composto', importanza: 3 }])).toEqual(['semplice-o-composto']);
  });

  it('un Capitolo con un Esercizio pratico che conta e uno che non conta si completa con la sola Serie del primo', () => {
    const tipi = tipiCheContano([{ tipo: 'batti-la-pulsazione', importanza: 1 }, { tipo: 'semplice-o-composto', importanza: 3 }]);
    const progressi = creaProgressi(inMemoria(), [{ id: 'pulsazione-e-suddivisione', tipi }]);
    expect(progressi.completato('pulsazione-e-suddivisione')).toBe(false);
    progressi.registraSerie('pulsazione-e-suddivisione', 'semplice-o-composto', 8);
    expect(progressi.completato('pulsazione-e-suddivisione')).toBe(true);
  });

  it('"Trova l\'unisono" si dichiara con l\'Importanza e non conta: si canta (#90)', () => {
    const revisione = { da: 'nessuno, bozza di Claude', data: '2026-11-17' };
    expect(schemaCapitoloIt.safeParse({ revisione, esercizi: [{ tipo: 'trova-l-unisono', importanza: 2 }] }).success).toBe(true);
    expect(schemaCapitoloIt.safeParse({ revisione, esercizi: [{ tipo: 'trova-l-unisono' }] }).success).toBe(false);
    expect(tipiCheContano([{ tipo: 'trova-l-unisono', importanza: 2 }])).toEqual([]);
  });

  it('Esercizi di teoria e pratici insieme contano tutti, tranne quelli in cui si batte', () => {
    expect(tipiCheContano([{ tipo: 'completa-la-battuta', indicazioni: ['4/4'] }, { tipo: 'pallini', importanza: 3 }, { tipo: 'batti-la-pulsazione', importanza: 1 }])).toEqual([
      'completa-la-battuta',
      'pallini',
    ]);
  });
});

const SEED = Array.from({ length: 200 }, (_, i) => i * 7919 + 17);
const vicino = (a: number, b: number) => Math.abs(a - b) < 1e-6;

describe('Semplice o composto: battito di mani', () => {
  it('otto battiti forti, e fra uno e l\'altro 1 debole nei semplici, 2 nei composti, a distanze uguali', () => {
    const generi = new Set<string>();
    for (const s of SEED) {
      const es = genera('semplice-o-composto', { importanza: 3 }, s);
      generi.add(es.genere);
      const forti = es.battiti.filter((b) => b.forte);
      expect(forti).toHaveLength(8);
      const deboliDopo = es.genere === 'semplice' ? 1 : 2;
      const passo = es.battiti[1]!.inizio - es.battiti[0]!.inizio;
      es.battiti.forEach((b, i) => {
        expect(b.forte).toBe(i % (deboliDopo + 1) === 0);
        expect(vicino(b.inizio, es.battiti[0]!.inizio + i * passo)).toBe(true);
      });
    }
    expect([...generi].sort()).toEqual(['composto', 'semplice']);
  });

  it('il riscontro dice quanti battiti deboli seguivano quello forte', () => {
    const es = { tipo: 'semplice-o-composto' as const, genere: 'composto' as const, battiti: [] };
    const r = valuta(es, { genere: 'semplice' });
    expect(r.esito).toBe('sbagliato');
    expect(r.data).toEqual({ it: 'semplice', en: 'simple' });
    expect(r.giusta).toEqual({ it: 'composto', en: 'compound' });
    expect(r.spiegazione.it).toBe('Dopo ogni battito forte ne venivano 2 deboli: la pulsazione si divide in 3, e il tempo è composto.');
    expect(r.spiegazione.en).toBe('Each strong clap was followed by 2 weak ones: the beat divides into 3, so the meter is compound.');
    const semplice = valuta({ ...es, genere: 'semplice' }, { genere: 'semplice' });
    expect(semplice.esito).toBe('giusto');
    expect(semplice.spiegazione.it).toBe('Dopo ogni battito forte ne veniva 1 debole: la pulsazione si divide in 2, e il tempo è semplice.');
  });
});

/** Le note che suonano a un istante, come le vede l'evidenziazione del lettore: l'ultima della lista vince. */
const ultimaCheSuona = (b: Brano, t: number) => b.note.findLastIndex((n) => n.inizio <= t + 1e-9 && t + 1e-9 < n.inizio + n.durata);

describe('I brani di prova (segnaposto finché non ci sono i brani di #87)', () => {
  it.each([...BRANI_DI_PROVA])('%s: pulsazioni e suddivisioni giuste, una nota su ogni suddivisione, dentro i campioni', (indicazione) => {
    const m = metrica(indicazione);
    const perPulsazione = m.genere === 'semplice' ? 2 : 3;
    const b = genera('pallini', { importanza: 3, indicazioni: [indicazione] }, 5).brano;
    expect(b.indicazione).toBe(indicazione);
    expect(b.pulsazioni.length % m.pulsazioni).toBe(0);
    expect(b.suddivisioni).toHaveLength(b.pulsazioni.length * perPulsazione);
    for (const p of b.pulsazioni) expect(b.suddivisioni.some((s) => vicino(s, p))).toBe(true);
    // Ogni suddivisione accende la sua nota: è quella che il lettore evidenzia, e il pallino che si illumina.
    b.suddivisioni.forEach((s, i) => expect(ultimaCheSuona(b, s)).toBe(b.indiceSuddivisione[i]));
    for (const n of b.note) {
      expect(n.midi).toBeGreaterThanOrEqual(36);
      expect(n.midi).toBeLessThanOrEqual(84);
    }
  });
});

describe('Pallini', () => {
  it('propone tutti i brani di prova, e il riscontro conta pallini grandi e gruppi', () => {
    const viste = new Set<string>();
    for (const s of SEED) viste.add(genera('pallini', { importanza: 3 }, s).brano.indicazione);
    expect([...viste].sort()).toEqual([...BRANI_DI_PROVA].sort());
    const es = genera('pallini', { importanza: 3, indicazioni: ['6/8'] }, 1);
    const r = valuta(es, { numero: 'binario', genere: 'composto' });
    expect(r.esito).toBe('giusto');
    expect(r.giusta).toEqual({ it: 'binario composto', en: 'compound duple' });
    expect(r.spiegazione.it).toBe('Ogni battuta ha 2 pallini grandi, cioè 2 pulsazioni, e ognuno apre un gruppo di 3 pallini: è un tempo binario composto.');
    expect(r.spiegazione.en).toBe('Each measure has 2 big dots, that is 2 beats, and each one starts a group of 3 dots: it is compound duple meter.');
    expect(valuta(es, { numero: 'ternario', genere: 'semplice' }).esito).toBe('sbagliato');
  });
});

describe('Semplice o composto all\'ascolto', () => {
  it('il riscontro svela l\'indicazione metrica del brano', () => {
    const es = genera('semplice-o-composto-ascolto', { importanza: 3, indicazioni: ['9/8'] }, 3);
    const r = valuta(es, { genere: 'semplice' });
    expect(r.esito).toBe('sbagliato');
    expect(r.spiegazione.it).toBe('Il brano era in 9/8: ogni pulsazione si divide in 3, e il tempo è composto.');
    expect(r.spiegazione.en).toBe('The piece was in 9/8: each beat divides into 3, so the meter is compound.');
    expect(valuta(genera('semplice-o-composto-ascolto', { importanza: 3, indicazioni: ['2/4'] }, 3), { genere: 'semplice' }).esito).toBe('giusto');
  });
});

describe('Batti la pulsazione: punteggio', () => {
  // Pulsazioni ogni mezzo secondo; i tocchi sono già corretti per la latenza.
  const pulsazioni = [0, 0.5, 1, 1.5, 2];

  it('ogni tocco va alla pulsazione più vicina: entro 80 ms è in tempo, altrimenti in anticipo o in ritardo', () => {
    const r = valutaBattiti([0.02, 0.38, 1.12, 1.5], pulsazioni);
    expect(r.tocchi.map((t) => t.esito)).toEqual(['in tempo', 'in anticipo', 'in ritardo', 'in tempo']);
    expect(r.tocchi.map((t) => Math.round(t.scarto * 1000))).toEqual([20, -120, 120, 0]);
    expect(r.inTempo).toBe(2);
    // La pulsazione a 2 s non ha avuto tocchi.
    expect(r.mancate).toBe(1);
  });

  it('due tocchi sulla stessa pulsazione: il secondo non conta come in tempo', () => {
    const r = valutaBattiti([0.49, 0.51], pulsazioni);
    expect(r.inTempo).toBe(1);
    expect(r.tocchi[1]!.esito).toBe('doppio');
    expect(r.mancate).toBe(4);
  });
});
