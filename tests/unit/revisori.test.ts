// Chi ha rivisto i Capitoli oltre al responsabile (ticket #14): compare solo con il consenso scritto,
// con una formula che dice esattamente quali Capitoli ha rivisto e niente di più.
import { describe, expect, it } from 'vitest';
import { controllaRevisori, formulaRevisione } from '../../src/contenuti/revisori';
import { schemaRevisori } from '../../src/contenuti/schemi';

describe('schemaRevisori', () => {
  it('accetta la lista vuota: finché manca il consenso scritto, nessuno compare', () => {
    expect(schemaRevisori.safeParse([]).success).toBe(true);
  });

  it('chiede la data del consenso scritto e almeno un Capitolo', () => {
    expect(schemaRevisori.safeParse([{ nome: 'Una Persona', consenso: '2026-12-01', capitoli: ['intervalli'] }]).success).toBe(true);
    expect(schemaRevisori.safeParse([{ nome: 'Una Persona', capitoli: ['intervalli'] }]).success).toBe(false);
    expect(schemaRevisori.safeParse([{ nome: 'Una Persona', consenso: '2026-12-01', capitoli: [] }]).success).toBe(false);
  });
});

describe('controllaRevisori', () => {
  it('blocca un Capitolo che non è nel Percorso', () => {
    const revisori = [{ nome: 'Una Persona', consenso: new Date('2026-12-01'), capitoli: ['intervalli', 'solfeggio'] }];
    expect(controllaRevisori(revisori, ['intervalli'])).toEqual([
      'contenuti/revisori.yml: Una Persona ha rivisto "solfeggio", che non è un Capitolo del Percorso',
    ]);
  });
});

describe('formulaRevisione', () => {
  it('dice esattamente quali capitoli ha rivisto', () => {
    expect(formulaRevisione('it', 'Una Persona', ['Intervalli'])).toBe('Una Persona ha rivisto il capitolo “Intervalli”.');
    expect(formulaRevisione('it', 'Una Persona', ['Chiavi', 'Intervalli', 'Scala minore'])).toBe(
      'Una Persona ha rivisto i capitoli “Chiavi”, “Intervalli” e “Scala minore”.',
    );
    expect(formulaRevisione('en', 'Una Persona', ['Clefs', 'Intervals'])).toBe('Una Persona reviewed the chapters “Clefs” and “Intervals”.');
    expect(formulaRevisione('en', 'Una Persona', ['Clefs'])).toBe('Una Persona reviewed the chapter “Clefs”.');
  });
});
