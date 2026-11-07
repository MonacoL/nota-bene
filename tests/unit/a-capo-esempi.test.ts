// A capo automatico degli esempi dei Capitoli (ticket #63): l'ABC di un esempio, scritto come viene nei Capitoli,
// si porta nella forma di una Lettura (un rigo di musica, righe w: con un tratto per Battuta) e va a capo con
// lo stesso algoritmo. Qui si prova la parte che legge l'esempio, senza DOM.
import { describe, expect, it } from 'vitest';
import { dividiEsempio, inRighi } from '../../src/letture/a-capo';

/** L'esempio ricomposto su `righi` (da dividiEsempio e inRighi), senza l'intestazione. */
function ricomposto(abc: string, righi?: [number, number][]): string[] {
  const divisa = dividiEsempio(abc);
  const righe = inRighi(divisa, righi ?? [[0, divisa.quante]]).trimEnd().split('\n');
  return righe.slice(righe.indexOf('%%stretchlast 1') + 1);
}

describe('dividiEsempio', () => {
  it('divide per Battuta una riga w: scritta senza "|", contando le note', () => {
    const abc = 'X:1\nL:1/4\nK:C\nC ^C D ^D | E F ^F G |]\nw: DO DI RE RI MI FA FI SOL\n';
    expect(ricomposto(abc, [[0, 1], [1, 2]])).toEqual([
      'C ^C D ^D |',
      'w: DO DI RE RI |',
      'E F ^F G |]',
      'w: MI FA FI SOL |',
    ]);
  });

  it('un esempio diviso a mano, con una riga w: sotto ogni rigo, si ricompone su un rigo solo', () => {
    const abc = [
      'X:4',
      'M:4/4',
      'L:1/4',
      'K:C',
      'C E G c | B A G2 |',
      'w: DO MI SOL DO TI LA DO',
      'D E ^F G | A ^F G2 |]',
      'w: SOL LA TI DO RE TI DO',
    ].join('\n');
    expect(ricomposto(abc)).toEqual([
      'C E G c | B A G2 | D E ^F G | A ^F G2 |]',
      'w: DO MI SOL DO | TI LA DO | SOL LA TI DO | RE TI DO |',
    ]);
  });

  it('senza righe w: tiene le annotazioni e non inventa Sillabe', () => {
    const abc = 'X:1\nL:1/2\nK:C\n"^5ª"C G | "^3ª"C E | "^4ª"C F |]\n';
    expect(ricomposto(abc, [[0, 2], [2, 3]])).toEqual(['"^5ª"C G | "^3ª"C E |', '"^4ª"C F |]']);
  });

  it('un accordo prende un segno solo, le pause nessuno', () => {
    const abc = 'X:1\nL:1/2\nK:C\nC z E | [CG] D |]\nw: DO MI SOL RE\n';
    expect(ricomposto(abc, [[0, 1], [1, 2]])).toEqual(['C z E |', 'w: DO MI |', '[CG] D |]', 'w: SOL RE |']);
  });
});
