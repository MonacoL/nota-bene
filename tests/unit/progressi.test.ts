// I Progressi (ADR-0011, ticket #78): Capitoli completati e scelta fra Scaletta e Studio libero, nel browser.
// Lo storage è passato da fuori: qui uno in memoria, nel sito localStorage.
import { describe, expect, it } from 'vitest';
import { creaProgressi, type Archivio } from '../../src/progressi';

function inMemoria(iniziale: Record<string, string> = {}): Archivio & { dati: Map<string, string> } {
  const dati = new Map(Object.entries(iniziale));
  return {
    dati,
    getItem: (k) => dati.get(k) ?? null,
    setItem: (k, v) => void dati.set(k, v),
    removeItem: (k) => void dati.delete(k),
  };
}

const CAPITOLI = [
  { id: 'chiavi', tipi: ['nomina-la-nota' as const] },
  { id: 'intervalli', tipi: ['riconosci-intervallo' as const, 'rivolta-intervallo' as const] },
];

describe('Capitolo completato con le Serie', () => {
  it('una Serie con almeno 8 giuste al primo colpo completa un Capitolo con un solo tipo di Esercizio; con 7 no', () => {
    const progressi = creaProgressi(inMemoria(), CAPITOLI);
    expect(progressi.registraSerie('chiavi', 'nomina-la-nota', 7)).toBe(false);
    expect(progressi.completato('chiavi')).toBe(false);
    expect(progressi.registraSerie('chiavi', 'nomina-la-nota', 8)).toBe(true);
    expect(progressi.completato('chiavi')).toBe(true);
  });
});

describe('Capitolo con più tipi di Esercizio', () => {
  it('è completato solo quando ogni tipo ha la sua Serie riuscita, anche in visite diverse', () => {
    const archivio = inMemoria();
    creaProgressi(archivio, CAPITOLI).registraSerie('intervalli', 'riconosci-intervallo', 10);
    expect(creaProgressi(archivio, CAPITOLI).completato('intervalli')).toBe(false);
    creaProgressi(archivio, CAPITOLI).registraSerie('intervalli', 'rivolta-intervallo', 9);
    expect(creaProgressi(archivio, CAPITOLI).completato('intervalli')).toBe(true);
    expect(creaProgressi(archivio, CAPITOLI).completato('chiavi')).toBe(false);
  });
});

describe('storage rotto o non disponibile', () => {
  it('ignora dati illeggibili o di forma sbagliata, e ricomincia da zero', () => {
    for (const rotto of ['{non json', '"stringa"', 'null', '{"serie":{"chiavi":"nomina-la-nota"}}', '{"serie":{"chiavi":[42]}}']) {
      const progressi = creaProgressi(inMemoria({ 'nota-bene:progressi:v1': rotto }), CAPITOLI);
      expect(progressi.completato('chiavi'), rotto).toBe(false);
      expect(progressi.registraSerie('chiavi', 'nomina-la-nota', 8), rotto).toBe(true);
      expect(progressi.completato('chiavi'), rotto).toBe(true);
    }
  });

  it('con uno storage che lancia errori funziona lo stesso, solo per questa visita', () => {
    const errore = () => {
      throw new DOMException('bloccato', 'SecurityError');
    };
    const progressi = creaProgressi({ getItem: errore, setItem: errore, removeItem: errore }, CAPITOLI);
    expect(progressi.registraSerie('chiavi', 'nomina-la-nota', 10)).toBe(true);
    expect(progressi.completato('chiavi')).toBe(true);
  });
});

describe('segnare e cancellare', () => {
  const CON_VUOTO = [...CAPITOLI, { id: 'in-preparazione', tipi: [] }];

  it('un Capitolo segnato come già studiato è completato, anche senza Esercizi; senza Esercizi e senza segno no', () => {
    const archivio = inMemoria();
    const progressi = creaProgressi(archivio, CON_VUOTO);
    expect(progressi.completato('in-preparazione')).toBe(false);
    progressi.segna('intervalli');
    progressi.segna('in-preparazione');
    expect(creaProgressi(archivio, CON_VUOTO).completato('intervalli')).toBe(true);
    expect(creaProgressi(archivio, CON_VUOTO).completato('in-preparazione')).toBe(true);
    expect(creaProgressi(archivio, CON_VUOTO).completati()).toEqual(new Set(['intervalli', 'in-preparazione']));
  });

  it('cancella toglie tutto dallo storage', () => {
    const archivio = inMemoria();
    const progressi = creaProgressi(archivio, CAPITOLI);
    progressi.segna('chiavi');
    progressi.registraSerie('intervalli', 'riconosci-intervallo', 10);
    progressi.cancella();
    expect(archivio.dati.size).toBe(0);
    expect(progressi.completati()).toEqual(new Set());
    expect(creaProgressi(archivio, CAPITOLI).completati()).toEqual(new Set());
  });
});

describe('Scaletta o Studio libero', () => {
  it('si parte dalla Scaletta, e la scelta si ricorda; cancellare riporta alla Scaletta', () => {
    const archivio = inMemoria();
    expect(creaProgressi(archivio, CAPITOLI).modo()).toBe('scaletta');
    creaProgressi(archivio, CAPITOLI).scegliModo('libero');
    expect(creaProgressi(archivio, CAPITOLI).modo()).toBe('libero');
    const progressi = creaProgressi(archivio, CAPITOLI);
    progressi.cancella();
    expect(progressi.modo()).toBe('scaletta');
    expect(creaProgressi(archivio, CAPITOLI).modo()).toBe('scaletta');
  });

  it('un modo sconosciuto nei dati vale Scaletta', () => {
    const progressi = creaProgressi(inMemoria({ 'nota-bene:progressi:v1': '{"serie":{},"modo":"boh"}' }), CAPITOLI);
    expect(progressi.modo()).toBe('scaletta');
  });

  it('senza storage è Studio libero: senza memoria dei Progressi il corista resterebbe bloccato', () => {
    const errore = () => {
      throw new DOMException('bloccato', 'SecurityError');
    };
    expect(creaProgressi({ getItem: errore, setItem: errore, removeItem: errore }, CAPITOLI).modo()).toBe('libero');
  });
});
