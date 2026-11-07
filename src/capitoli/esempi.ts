// Gli esempi musicali dei Capitoli (ticket #63) letti per l'a capo: l'ABC di un esempio, scritto come viene, si porta
// nella forma di una Lettura (un rigo di musica, righe w: con un tratto per Battuta) e si divide come lei
// (src/letture/a-capo.ts). Lo disegna src/scripts/pentagrammi.ts.
import { dividi, intestazioneECorpo, type Divisa } from '../letture/a-capo';
import { eRigaW, noteConSegno, rigaW, trattiPerBattuta } from '../letture/righe-w';

/**
 * Divide per Battuta l'ABC di un esempio di un Capitolo: le righe w: possono non avere un "|" per Battuta, e un
 * esempio diviso a mano su più righi ha una riga w: sotto ogni rigo.
 */
export function dividiEsempio(abc: string): Divisa {
  const { intestazione, corpo } = intestazioneECorpo(abc);
  // I righi scritti, ognuno con le righe w: che lo seguono (una per strofa).
  const scritti: { musica: string; righeW: string[] }[] = [];
  for (const riga of corpo) {
    if (!eRigaW(riga)) scritti.push({ musica: riga, righeW: [] });
    else scritti.at(-1)?.righeW.push(riga);
  }
  const strofe = Math.max(0, ...scritti.map((s) => s.righeW.length));
  const perStrofa: string[][] = Array.from({ length: strofe }, () => []);
  for (const { musica, righeW } of scritti) {
    const notePerBattuta = dividi([...intestazione, musica].join('\n')).battute.map((b) => noteConSegno(b.note));
    for (let s = 0; s < strofe; s++) {
      const riga = righeW[s];
      perStrofa[s]!.push(...(riga ? trattiPerBattuta(riga, notePerBattuta) : notePerBattuta.map(() => '')));
    }
  }
  const musica = scritti.map((s) => s.musica).join(' ');
  return dividi([...intestazione, musica, ...perStrofa.map(rigaW)].join('\n'));
}
