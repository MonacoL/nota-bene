// "Scegli le figure" (Indicazioni metriche, #85): data un'Indicazione metrica, le Figure di Suddivisione, Pulsazione
// e Battuta. Gli attesi vengono dalla lezione del maestro Sabetta e dai libri di teoria, non dal codice.
import { describe, expect, it } from 'vitest';
import { genera, valuta, INDICAZIONI_FIGURE, type EsercizioScegliLeFigure, type Figura, type NomeIndicazione } from '../../src/esercizi';

const SEED = Array.from({ length: 300 }, (_, i) => i * 7919 + 17);

/** "minima." è una minima col punto; più Figure legate si scrivono "minima. + semiminima.". */
const f = (s: string): Figura => ({ figura: s.replace('.', '') as Figura['figura'], punto: s.endsWith('.') });
const legate = (s: string) => s.split(' + ').map(f);
const risposta = (suddivisione: string, pulsazione: string, battuta: string) => ({ suddivisione: f(suddivisione), pulsazione: f(pulsazione), battuta: legate(battuta) });
const es = (indicazione: NomeIndicazione): EsercizioScegliLeFigure => ({ tipo: 'scegli-le-figure', indicazione });

// Suddivisione, Pulsazione e una Battuta giusta per ogni Indicazione metrica dell'Esercizio.
const ATTESE: Record<string, [string, string, string]> = {
  '2/2': ['semiminima', 'minima', 'semibreve'],
  '2/4': ['croma', 'semiminima', 'minima'],
  '3/4': ['croma', 'semiminima', 'minima.'],
  '4/4': ['croma', 'semiminima', 'semibreve'],
  '5/4': ['croma', 'semiminima', 'semibreve + semiminima'],
  '7/4': ['croma', 'semiminima', 'semibreve. + semiminima'],
  '3/8': ['semicroma', 'croma', 'semiminima.'],
  '6/4': ['semiminima', 'minima.', 'semibreve.'],
  '6/8': ['croma', 'semiminima.', 'minima.'],
  '9/8': ['croma', 'semiminima.', 'minima. + semiminima.'],
  '12/8': ['croma', 'semiminima.', 'semibreve.'],
  '15/8': ['croma', 'semiminima.', 'semibreve. + semiminima.'],
};

describe('Scegli le figure: genera', () => {
  it('propone le Indicazioni metriche dichiarate, e prima o poi tutte', () => {
    const viste = new Set<string>();
    for (const s of SEED) viste.add(genera('scegli-le-figure', { indicazioni: [...INDICAZIONI_FIGURE] }, s).indicazione);
    expect([...viste].sort()).toEqual(Object.keys(ATTESE).sort());
  });

  it('il 21/8 non c\'è: la sua Battuta vorrebbe tre Figure legate', () => {
    expect(INDICAZIONI_FIGURE).not.toContain('21/8');
  });
});

describe('Scegli le figure: valuta', () => {
  it.each(Object.entries(ATTESE).map(([i, [s, p, b]]) => [i, s, p, b]))('%s: %s, %s, %s', (indicazione, s, p, b) => {
    expect(valuta(es(indicazione as NomeIndicazione), risposta(s!, p!, b!)).esito).toBe('giusto');
  });

  it('nel 9/8 la Battuta è una minima col punto legata a una semiminima col punto, in qualunque ordine', () => {
    const r = valuta(es('9/8'), risposta('croma', 'semiminima.', 'minima. + semiminima.'));
    expect(r.giusta).toEqual({
      it: 'croma, semiminima col punto, minima col punto legata a semiminima col punto',
      en: 'eighth note, dotted quarter note, dotted half note tied to dotted quarter note',
    });
    expect(r.spiegazione.it).toBe(
      "Nel 9/8 il 9 sopra conta le suddivisioni e l'8 sotto dice che ognuna è una croma. Tre suddivisioni fanno la pulsazione, una semiminima col punto. " +
        'Tre pulsazioni fanno la battuta, e nessuna figura da sola la riempie: minima col punto legata a semiminima col punto.',
    );
    expect(valuta(es('9/8'), risposta('croma', 'semiminima.', 'semiminima. + minima.')).esito).toBe('giusto');
  });

  it('una somma giusta non basta: la Battuta va riempita con il minor numero di Figure, ognuna fatta di Pulsazioni intere', () => {
    // Durano tutte quanto la Battuta, ma non la riassumono.
    expect(valuta(es('9/8'), risposta('croma', 'semiminima.', 'semiminima. + semiminima. + semiminima.')).esito).toBe('sbagliato');
    expect(valuta(es('9/8'), risposta('croma', 'semiminima.', 'semibreve + croma')).esito).toBe('sbagliato');
    expect(valuta(es('4/4'), risposta('croma', 'semiminima', 'minima + minima')).esito).toBe('sbagliato');
    expect(valuta(es('5/4'), risposta('croma', 'semiminima', 'minima + minima + semiminima')).esito).toBe('sbagliato');
  });

  it('nei quinari e nei misti valgono le due legature possibili', () => {
    expect(valuta(es('5/4'), risposta('croma', 'semiminima', 'minima. + minima')).esito).toBe('giusto');
    expect(valuta(es('7/4'), risposta('croma', 'semiminima', 'semibreve + minima.')).esito).toBe('giusto');
  });

  it('va indovinato tutto: Pulsazione e Suddivisione scambiate sono un errore', () => {
    const r = valuta(es('6/8'), risposta('semiminima.', 'croma', 'minima.'));
    expect(r.esito).toBe('sbagliato');
    expect(r.data.it).toBe('semiminima col punto, croma, minima col punto');
  });

  it('nei semplici la Suddivisione è metà della Pulsazione', () => {
    const r = valuta(es('3/4'), risposta('croma', 'semiminima', 'minima.'));
    expect(r.spiegazione.it).toBe(
      'Nel 3/4 il 3 sopra conta le pulsazioni e il 4 sotto dice che ognuna è una semiminima. La suddivisione è la sua metà, una croma. Tre pulsazioni fanno la battuta: una minima col punto.',
    );
    expect(r.spiegazione.en).toBe(
      'In 3/4 the top 3 counts the beats and the bottom 4 says each one is a quarter note. The subdivision is half of it, an eighth note. Three beats make the measure: a dotted half note.',
    );
  });
});
