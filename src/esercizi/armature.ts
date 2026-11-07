// Le Armature e le Tonalità maggiori che le hanno, dal giro delle quinte: n diesis (n > 0) o -n bemolle (n < 0).
import { LETTERE, type Alterazione, type Lettera } from './note';

export const DIESIS: Lettera[] = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
export const BEMOLLE: Lettera[] = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];

/** L'alterazione che l'Armatura dà a ogni lettera. */
export function armatura(quinte: number): Record<Lettera, Alterazione> {
  const alterate = quinte >= 0 ? DIESIS.slice(0, quinte) : BEMOLLE.slice(0, -quinte);
  const segno: Alterazione = quinte >= 0 ? 1 : -1;
  return Object.fromEntries(LETTERE.map((l) => [l, alterate.includes(l) ? segno : 0])) as Record<Lettera, Alterazione>;
}

/** La Tonica maggiore dell'Armatura: ogni quinta sale di quattro lettere (Do, Sol, Re, La…). */
export function tonicaMaggiore(quinte: number): { lettera: Lettera; alterazione: Alterazione } {
  const lettera = LETTERE[(((quinte * 4) % 7) + 7) % 7]!;
  return { lettera, alterazione: armatura(quinte)[lettera] };
}

/** La Tonica della relativa minore: sta sul 6° grado della maggiore, una terza minore sotto. */
export function tonicaMinore(quinte: number): { lettera: Lettera; alterazione: Alterazione } {
  const lettera = LETTERE[(LETTERE.indexOf(tonicaMaggiore(quinte).lettera) + 5) % 7]!;
  return { lettera, alterazione: armatura(quinte)[lettera] };
}

/** La Tonalità maggiore come la scrive il `K:` dell'ABC: "Bb", "F#". */
export function abcTonalita(quinte: number): string {
  const { lettera, alterazione } = tonicaMaggiore(quinte);
  return lettera + { '-1': 'b', '0': '', '1': '#' }[alterazione];
}
