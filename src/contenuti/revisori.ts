// Chi ha rivisto i Capitoli oltre al responsabile (ticket #14), in TypeScript puro.
// Compare in Contatti e nei Ringraziamenti dei Crediti solo se è in contenuti/revisori.yml, cioè con il consenso scritto.
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

/** La formula esatta, che nomina i Capitoli rivisti e non fa intendere una garanzia sul resto del sito. */
export function formulaRevisione(lingua: Lingua, nome: string, titoli: readonly string[]): string {
  const citati = titoli.map((t) => `“${t}”`);
  const congiunzione = lingua === 'it' ? ' e ' : ' and ';
  const elenco = citati.length > 1 ? `${citati.slice(0, -1).join(', ')}${congiunzione}${citati.at(-1)}` : citati[0];
  if (lingua === 'it') return `${nome} ha rivisto ${citati.length > 1 ? 'i capitoli' : 'il capitolo'} ${elenco}.`;
  return `${nome} reviewed ${citati.length > 1 ? 'the chapters' : 'the chapter'} ${elenco}.`;
}
