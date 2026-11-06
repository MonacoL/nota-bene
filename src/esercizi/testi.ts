// Testi degli Esercizi nelle due lingue. Il modulo non dipende da src/i18n, così resta TypeScript puro.
import type { Alterazione, Lettera, Nota } from './note';

export type Testi = { it: string; en: string };

const NOMI_IT: Record<Lettera, string> = { C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si' };
const SEGNI: Record<Alterazione, string> = { [-1]: '♭', 0: '', 1: '♯' };

/** Il nome di una Nota: Sol♯ / G♯, con l'ottava Sol♯4 / G♯4 (ADR-0007). */
export function nomeNota(nota: Pick<Nota, 'lettera' | 'alterazione'> & { ottava?: number }, lingua: keyof Testi, conOttava = false): string {
  const lettera = lingua === 'it' ? NOMI_IT[nota.lettera] : nota.lettera;
  return `${lettera}${SEGNI[nota.alterazione]}${conOttava ? nota.ottava : ''}`;
}
