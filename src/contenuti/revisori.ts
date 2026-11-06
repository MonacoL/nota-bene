// Chi ha rivisto i Capitoli oltre al responsabile (ticket #14), in TypeScript puro.
// Compare in Contatti e nei Crediti, nella sezione "Revisione dei capitoli", solo se è in contenuti/revisori.yml, cioè con il consenso scritto.
import type { Lingua } from '../i18n';
import type { Revisore } from './schemi';

/** Gli errori che bloccano la build: un Capitolo che non è nel Percorso. */
export function controllaRevisori(revisori: readonly Revisore[], capitoli: readonly string[]): string[] {
  return revisori.flatMap((r) =>
    r.capitoli
      .filter((c) => !capitoli.includes(c))
      .map((c) => `contenuti/revisori.yml: ${r.nome} ha rivisto "${c}", che non è un Capitolo del Percorso`),
  );
}

/**
 * La formula esatta del ticket #14, "<nome> ha rivisto i capitoli X, Y", che nomina i soli Capitoli rivisti
 * e non fa intendere una garanzia sul resto del sito. "capitoli" è minuscolo come i termini del glossario nel testo.
 */
export function formulaRevisione(lingua: Lingua, nome: string, titoli: readonly string[]): string {
  const elenco = titoli.join(', ');
  if (lingua === 'it') return `${nome} ha rivisto ${titoli.length > 1 ? 'i capitoli' : 'il capitolo'} ${elenco}`;
  return `${nome} reviewed ${titoli.length > 1 ? 'the chapters' : 'the chapter'} ${elenco}`;
}
