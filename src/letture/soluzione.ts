// La Soluzione sulla partitura (ticket "Schermata della Lettura su telefono", #8): una riga w: in più sotto il Testo,
// con la Sillaba di ogni nota attaccata. Si disegna sempre, così il suo spazio è riservato; la nasconde il CSS.
import type { Sillaba } from '../sillabe';
import { leggiAbc } from './abc';

/**
 * L'ABC della Lettura con la riga w: delle Sillabe dopo l'ultima riga di Testo. Le pause non prendono sillabe
 * nelle righe w:; le note legate alla precedente prendono "*" (nessuna sillaba). Un "|" per Battuta.
 */
export function conSoluzione(abc: string, sillabe: readonly Sillaba[]): string {
  const { note } = leggiAbc(abc);
  const parti: string[] = [];
  let battuta = note[0]?.battuta;
  let i = 0;
  for (const n of note) {
    if (n.battuta !== battuta) parti.push('|');
    battuta = n.battuta;
    if (n.pausa) continue;
    parti.push(n.legata ? '*' : (sillabe[i++] ?? '*'));
  }
  const riga = `w: ${parti.join(' ')} |`;
  const righe = abc.trimEnd().split('\n');
  const ultimaW = righe.findLastIndex((r) => r.startsWith('w:'));
  righe.splice(ultimaW < 0 ? righe.length : ultimaW + 1, 0, riga);
  return righe.join('\n') + '\n';
}
