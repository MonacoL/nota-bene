// La Soluzione sulla partitura (ticket "Schermata della Lettura su telefono", #8): una riga w: in più sotto il Testo,
// con la Sillaba di ogni nota attaccata. Si disegna sempre, così il suo spazio è riservato; la nasconde il CSS.
import type { Sillaba } from '../sillabe';
import { leggiAbc } from './abc';
import { eRigaW, rigaW } from './righe-w';

/**
 * L'ABC della Lettura con la riga w: delle Sillabe dopo l'ultima riga di Testo, nel formato di src/letture/righe-w.ts:
 * un tratto per Battuta. Le pause non prendono segni; le note legate alla precedente prendono "*" (nessun segno).
 */
export function conSoluzione(abc: string, sillabe: readonly Sillaba[]): string {
  const { note } = leggiAbc(abc);
  const perBattuta = new Map<number, string[]>();
  let i = 0;
  for (const n of note) {
    const tratto = perBattuta.get(n.battuta) ?? [];
    perBattuta.set(n.battuta, tratto);
    if (n.pausa) continue;
    tratto.push(n.legata ? '*' : (sillabe[i++] ?? '*'));
  }
  const riga = rigaW([...perBattuta.values()].map((tratto) => tratto.join(' ')));
  const righe = abc.trimEnd().split('\n');
  const ultimaW = righe.findLastIndex(eRigaW);
  righe.splice(ultimaW < 0 ? righe.length : ultimaW + 1, 0, riga);
  return righe.join('\n') + '\n';
}
