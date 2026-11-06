// A capo responsive della Lettura (ticket #30): come si dividono le Battute in righi, senza DOM.
// Il disegno e la misura stanno nel browser; qui si prova la parte che decide.
import { describe, expect, it } from 'vitest';
import { dividi, inRighi, righi, siToccano } from '../../src/letture/a-capo';

describe('righi', () => {
  it("se l'estratto ci sta resta su un rigo", () => {
    expect(righi(5, () => true)).toEqual([[0, 5]]);
  });

  // Un rigo "ci sta" se la somma delle larghezze delle sue Battute non supera quella dello schermo.
  const conLarghezze = (larghezze: number[], schermo: number) => (inizio: number, fine: number) =>
    larghezze.slice(inizio, fine).reduce((a, b) => a + b, 0) <= schermo;

  it('ogni rigo prende quante più Battute possibile', () => {
    expect(righi(7, conLarghezze([3, 3, 4, 2, 5, 4, 1], 10))).toEqual([[0, 3], [3, 5], [5, 7]]);
  });

  it('una Battuta che da sola non ci sta prende comunque un rigo', () => {
    expect(righi(3, conLarghezze([2, 12, 2], 10))).toEqual([[0, 1], [1, 2], [2, 3]]);
  });

  it('senza Battute non ci sono righi', () => {
    expect(righi(0, () => true)).toEqual([]);
  });
});

describe('inRighi', () => {
  // If Ye Love Me, soprano 1–7, con la riga w: della Soluzione dopo il Testo (src/letture/soluzione.ts).
  const ABC = [
    'X:1',
    'M:C',
    'L:1/4',
    'Q:1/4=70',
    'K:F major',
    'F3 F | G2 A2- | A A G F | B2 A2 | z A A A | c2 B A- | A/ (B/ G) A2 |]',
    'w: If ye | love me, | _ keep my com- | mand- ments, | and I will | pray the Fa- | _ _ _ ther, |',
    'w: DO DO | RE MI | * MI RE DO | FA MI | MI MI MI | SOL FA MI | * FA RE MI |',
    '',
  ].join('\n');

  it('conta le Battute', () => {
    expect(dividi(ABC).quante).toBe(7);
  });

  it('ogni rigo ha le sue note e il suo pezzo di ogni riga w:, e tutti i righi vanno a larghezza piena', () => {
    expect(inRighi(dividi(ABC), [[0, 3], [3, 7]])).toBe(
      [
        'X:1',
        'M:C',
        'L:1/4',
        'Q:1/4=70',
        'K:F major',
        '%%stretchlast 1',
        'F3 F | G2 A2- | A A G F |',
        'w: If ye | love me, | _ keep my com- |',
        'w: DO DO | RE MI | * MI RE DO |',
        'B2 A2 | z A A A | c2 B A- | A/ (B/ G) A2 |]',
        'w: mand- ments, | and I will | pray the Fa- | _ _ _ ther, |',
        'w: FA MI | MI MI MI | SOL FA MI | * FA RE MI |',
        '',
      ].join('\n'),
    );
  });

  it('tiene le stanghette come sono scritte e ignora le "|" tra virgolette', () => {
    const abc = 'X:1\nM:3/4\nL:1/4\nK:C major\n|: C "^a|b"D E :| F2 G || A3 |]\n';
    const divisa = dividi(abc);
    expect(divisa.quante).toBe(3);
    expect(inRighi(divisa, [[0, 1], [1, 3]])).toBe(
      'X:1\nM:3/4\nL:1/4\nK:C major\n%%stretchlast 1\n|: C "^a|b"D E :|\nF2 G || A3 |]\n',
    );
  });
});

describe('siToccano', () => {
  // Le scatole dei segni disegnati, in px: due segni della stessa riga si toccano se tra loro restano meno di 4 px.
  const segno = (sinistra: number, destra: number, alto = 100) => ({ sinistra, destra, alto });

  it('due segni vicini con lo spazio giusto non si toccano', () => {
    expect(siToccano([segno(0, 20), segno(24, 40), segno(50, 60)])).toBe(false);
  });

  it('due segni vicini troppo stretti si toccano, anche in disordine', () => {
    expect(siToccano([segno(50, 60), segno(0, 20), segno(22, 40)])).toBe(true);
  });

  it('Testo e Soluzione sono righe diverse: un segno sotto l’altro non lo tocca', () => {
    expect(siToccano([segno(0, 20, 100), segno(0, 20, 120)])).toBe(false);
  });
});
