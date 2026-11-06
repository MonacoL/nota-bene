// Audio della Lettura (ADR-0008): che cosa suona il Riferimento tonale e quali campioni del pianoforte servono.
// Le note attese sono scritte a mano come le darebbe il maestro, in nomi MIDI (Do centrale = C4 = 60).
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Lettera } from '../../src/esercizi';
import { campioniPer } from '../../src/audio/campioni';
import { controllaCampioni } from '../../src/audio/controllo';
import { audioDellaLettura, noteDelRiferimento } from '../../src/audio/note';
import type { Tonalita } from '../../src/sillabe';

const MIDI: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
/** "Bb3" → 58: il numero MIDI standard, scritto qui a mano per non ricalcolarlo come il codice. */
const n = (nome: string) => {
  const [, l, alt, ott] = /^([A-G])(b|#)?(\d)$/.exec(nome)!;
  return 12 * (Number(ott) + 1) + MIDI[l!]! + (alt === 'b' ? -1 : alt === '#' ? 1 : 0);
};
const note = (nomi: string) => nomi.split(' ').map(n);

const tonalita = (nome: string): Tonalita => {
  const [, l, alt, modo] = /^([A-G])(b|#)? (major|minor)$/.exec(nome)!;
  return { tonica: { lettera: l as Lettera, alterazione: alt === 'b' ? -1 : alt === '#' ? 1 : 0 }, modo: modo === 'major' ? 'maggiore' : 'minore' };
};
const abc = (corpo: string, k: string) => `X:1\nM:4/4\nL:1/4\nQ:1/4=70\nK:${k}\n${corpo} |]\n`;

describe('Riferimento tonale', () => {
  it("in maggiore: la triade di tonica in stato fondamentale e posizione stretta, poi la nota di partenza", () => {
    const { riferimento } = audioDellaLettura(abc('F3 F | G2 A2 | A A G F | B2 A2', 'F major'), tonalita('F major'));
    expect(riferimento).toEqual({ accordo: note('F4 A4 C5'), partenza: n('F4') });
  });

  it('la tonica è la prima sotto la nota di partenza', () => {
    const { riferimento } = audioDellaLettura(abc('A2 G2 | F4 | G G A A | F4', 'F major'), tonalita('F major'));
    expect(riferimento).toEqual({ accordo: note('F4 A4 C5'), partenza: n('A4') });
  });

  it('in minore la triade è minore', () => {
    const { riferimento } = audioDellaLettura(abc('c2 A2 | d4 | c B A G | A4', 'F major'), tonalita('D minor'));
    expect(riferimento).toEqual({ accordo: note('D4 F4 A4'), partenza: n('C5') });
  });

  it("il tenore sente la nota un'ottava sotto la scritta", () => {
    const { riferimento } = audioDellaLettura(abc('F3 F | G2 A2 | A A G F | B2 A2', 'F major clef=treble-8'), tonalita('F major'));
    expect(riferimento).toEqual({ accordo: note('F3 A3 C4'), partenza: n('F3') });
  });

  it('il basso la sente nel suo registro', () => {
    const { riferimento } = audioDellaLettura(abc('D,3 D, | G,2 B,2 | A, A, G, F, | G,4', 'G major clef=bass'), tonalita('G major'));
    expect(riferimento).toEqual({ accordo: note('G2 B2 D3'), partenza: n('D3') });
  });

  it("se l'estratto comincia con una pausa, la nota di partenza è la prima cantata", () => {
    const { riferimento } = audioDellaLettura(abc('z2 E2 | A4 | G F E D | C4', 'C major'), tonalita('A minor'));
    expect(riferimento).toEqual({ accordo: note('A3 C4 E4'), partenza: n('E4') });
  });

  it("la tonalità è quella passata, cioè quella in vigore all'inizio dell'estratto, non quella del K:", () => {
    const { riferimento } = audioDellaLettura(abc('G2 A2 | B4 | c B A G | G4', 'C major'), tonalita('G major'));
    expect(riferimento).toEqual({ accordo: note('G4 B4 D5'), partenza: n('G4') });
  });
});

describe('tempi del Riferimento tonale', () => {
  it('accordo a note insieme per 1,5 s, pausa di 0,5 s, nota di partenza per 1,5 s, a qualunque andamento', () => {
    expect(noteDelRiferimento({ accordo: note('F4 A4 C5'), partenza: n('F4') })).toEqual([
      { midi: n('F4'), inizio: 0, durata: 1.5 },
      { midi: n('A4'), inizio: 0, durata: 1.5 },
      { midi: n('C5'), inizio: 0, durata: 1.5 },
      { midi: n('F4'), inizio: 2, durata: 1.5 },
    ]);
  });
});

describe('note da caricare', () => {
  // Nella terza battuta il Sol torna naturale: l'alterazione vale fino alla stanghetta.
  it("sono quelle dell'estratto più quelle dell'accordo, una volta sola e in ordine", () => {
    const { note: daCaricare } = audioDellaLettura(abc('A2 ^G2 | A4 | B A G A | A4', 'C major'), tonalita('A minor'));
    expect(daCaricare).toEqual(note('G4 G#4 A4 B4 C5 E5'));
  });
});

describe('campioni del pianoforte', () => {
  // I campioni MF dello SplendidGrandPiano non ci sono per ogni tasto: una nota usa il campione più vicino.
  // I nomi dei file sono quelli di smplr (che chiama C3 il Do centrale) in minuscolo, con - e s per spazio e #.
  it('ogni nota prende il campione più vicino, una volta sola', () => {
    expect(campioniPer(note('F4 F#4 A4 Bb4 C5'))).toEqual(['mf-f3', 'mf-a3', 'mf-c4']);
  });

  it('agli estremi, C2 e C6 hanno il loro campione', () => {
    expect(campioniPer(note('C2 C#2 C6'))).toEqual(['mf-b0', 'mf-cs1', 'mf-b4']);
  });
});

describe('controllo dei campioni in CI', () => {
  const cartella = mkdtempSync(join(tmpdir(), 'campioni-'));
  const file = (nome: string, byte: number) => writeFileSync(join(cartella, nome), Buffer.alloc(byte));
  // Il formato più pesante è quello che conta: Safari scarica m4a, gli altri ogg.
  file('mf-f3.m4a', 400_000);
  file('mf-f3.ogg', 300_000);
  file('mf-a3.m4a', 300_000);
  file('mf-a3.ogg', 350_000);
  file('mf-c4.m4a', 350_000);
  file('mf-c4.ogg', 200_000);

  it('una Lettura che sta in 1 MB passa', () => {
    expect(controllaCampioni([{ id: 'a/soprano-1-4', note: note('F4 A4') }], cartella)).toEqual([]);
  });

  it('blocca una Lettura che richiede più di 1 MB di campioni', () => {
    expect(controllaCampioni([{ id: 'a/soprano-1-4', note: note('F4 A4 C5') }], cartella)).toEqual([
      'a/soprano-1-4: richiede 1,05 MB di campioni (m4a), al massimo 1 MB',
    ]);
  });

  it('blocca una Lettura con note fuori da C2–C6 o senza il file del campione', () => {
    expect(controllaCampioni([{ id: 'a/basso-1-4', note: note('B1 D3') }], cartella)).toEqual([
      'a/basso-1-4: la nota MIDI 35 è fuori dai campioni C2–C6',
      'a/basso-1-4: manca il campione mf-d2.m4a',
      'a/basso-1-4: manca il campione mf-d2.ogg',
    ]);
  });

  it('blocca il deploy se i campioni in tutto superano 10 MB', () => {
    const grande = mkdtempSync(join(tmpdir(), 'campioni-'));
    writeFileSync(join(grande, 'mf-c4.m4a'), Buffer.alloc(6_000_000));
    writeFileSync(join(grande, 'mf-c4.ogg'), Buffer.alloc(4_500_000));
    expect(controllaCampioni([], grande)).toEqual(['i campioni pesano 10,50 MB in tutto, al massimo 10 MB']);
  });
});
