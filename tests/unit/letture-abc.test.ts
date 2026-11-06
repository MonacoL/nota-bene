// Lettura delle note da un ABC di Lettura (ADR-0003, ADR-0004): le Note come si leggono in partitura,
// con Battuta e posizione, pronte per il modulo Sillabe. Le Note attese sono lette a mano dal pentagramma.
import { describe, expect, it } from 'vitest';
import { leggiAbc } from '../../src/letture/abc';
import type { NotaScritta } from '../../src/sillabe';

/** Le note in una riga: "F4 Bb4 r F4-", con "-" per una nota legata alla precedente e "|" fra le Battute. */
function inRiga(note: NotaScritta[]): string {
  let battuta = note[0]?.battuta;
  return note
    .map((n) => {
      const sep = n.battuta !== battuta ? '| ' : '';
      battuta = n.battuta;
      if (n.pausa) return `${sep}r`;
      const alt = { '-2': 'bb', '-1': 'b', '0': '', '1': '#', '2': '##' }[n.nota.alterazione];
      return `${sep}${n.legata ? '-' : ''}${n.nota.lettera}${alt}${n.nota.ottava}`;
    })
    .join(' ');
}

const testa = (k: string) => `X:1\nM:4/4\nL:1/4\nQ:1/4=70\nK:${k}\n`;

describe('leggiAbc', () => {
  it("l'Armatura vale per le note senza alterazione scritta", () => {
    const { note } = leggiAbc(`${testa('F major')}F G A B | c4 |]\n`);
    expect(inRiga(note)).toBe('F4 G4 A4 Bb4 | C5');
  });

  it.each([
    ['un diesis vale fino alla stanghetta', 'C major', '^F G F2 | F4 |]', 'F#4 G4 F#4 | F4'],
    ["un bequadro toglie l'Armatura fino alla stanghetta", 'F major', '=B A B2 | B4 |]', 'B4 A4 B4 | Bb4'],
    ["l'alterazione non passa all'altra ottava", 'C major', '^c C c2 | C4 |]', 'C#5 C4 C#5 | C4'],
    ['una nota legata è segnata come legata', 'C major', 'C2- C2 | D4 |]', 'C4 -C4 | D4'],
    ["oltre la stanghetta la legatura porta con sé l'alterazione", 'C major', 'A2 ^F2- | F G F2 |]', 'A4 F#4 | -F#4 G4 F4'],
    ['le pause occupano una posizione e non hanno Nota', 'C major', 'C z D2 | z4 |]', 'C4 r D4 | r'],
    ['un ABC su più righe continua la numerazione delle Battute', 'C major', 'C D E F |\nG A B c |]', 'C4 D4 E4 F4 | G4 A4 B4 C5'],
    // ADR-0003: abcjs disegna treble-8 senza spostare le note, quindi l'ABC del tenore è un'ottava sopra le Note reali.
    ["in chiave di violino ottava bassa le Note reali sono un'ottava sotto", 'C major clef=treble-8', 'c d e2 | G4 |]', 'C4 D4 E4 | G3'],
  ])('%s', (_, k, corpo, attese) => {
    expect(inRiga(leggiAbc(`${testa(k)}${corpo}\n`).note)).toBe(attese);
  });

  it.each([
    ['F major', { tonica: { lettera: 'F', alterazione: 0 }, modo: 'maggiore' }],
    ['Bb major', { tonica: { lettera: 'B', alterazione: -1 }, modo: 'maggiore' }],
    ['F# minor clef=treble-8', { tonica: { lettera: 'F', alterazione: 1 }, modo: 'minore' }],
  ])('la Tonalità viene dal K: con il Modo esplicito (K:%s)', (k, tonalita) => {
    expect(leggiAbc(`${testa(k)}C4 |]\n`).tonalita).toEqual(tonalita);
  });

  it.each(['F', 'Dm', 'D dorian'])('senza Modo maggiore o minore scritto per esteso non c\'è Tonalità (K:%s)', (k) => {
    expect(leggiAbc(`${testa(k)}C4 |]\n`).tonalita).toBeUndefined();
  });
});
