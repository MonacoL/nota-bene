// Catalogo delle Letture (ADR-0003, ADR-0004, ADR-0005): dalla cartella delle Letture, le Letture pronte o gli errori.
// La cartella valida è in tests/unit/letture/valida; ogni controllo ha la sua variante, una copia con una sola modifica.
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { testi } from '../../src/i18n';
import { catalogo, type Lettura, type Opzioni } from '../../src/letture/catalogo';
import { notaDelleModifiche } from '../../src/letture/testi';

const VALIDA = 'tests/unit/letture/valida';
const CAPITOLI = ['scala-maggiore', 'do-mobile', 'do-mobile-avanzato'];
const EDIZIONE = 'if-ye-love-me/edizione.yml';
const ABC = 'if-ye-love-me/soprano-1-4.abc';
const SORGENTE = 'if-ye-love-me/sorgente.ly';

/** Una copia della cartella valida in cui `file` è cambiato da `cambia`: creato se non c'era, tolto se `cambia` dà null. */
function variante(file: string, cambia: (testo: string) => string | null): string {
  const cartella = mkdtempSync(join(tmpdir(), 'letture-'));
  cpSync(VALIDA, cartella, { recursive: true });
  const percorso = join(cartella, file);
  const nuovo = cambia(existsSync(percorso) ? readFileSync(percorso, 'utf8') : '');
  if (nuovo === null) rmSync(percorso);
  else writeFileSync(percorso, nuovo);
  return cartella;
}

const togli = () => null;
const MUSICA = 'F3 F | G2 A2- | A A G F | B2 A2 |]';
const SECONDA_LETTURA = `
  - id: soprano-1-4
    voce: soprano
    battute: [1, 4]
    prerequisiti: [do-mobile]
    modificata: 2026-11-06
`;

/** Le regole violate, con la Lettura (o l'Edizione) a cui si riferiscono. */
function errori(cartella: string, opzioni: Partial<Opzioni> = {}): { lettura: string; regola: string }[] {
  const esito = catalogo(cartella, { capitoli: CAPITOLI, ...opzioni });
  return esito.ok ? [] : esito.errori.map(({ lettura, regola }) => ({ lettura, regola }));
}

/** La prima Lettura della cartella, che deve essere valida. */
function lettura(cartella: string): Lettura {
  const esito = catalogo(cartella, { capitoli: CAPITOLI });
  if (!esito.ok) throw new Error(JSON.stringify(esito.errori));
  return esito.letture[0]!;
}

const sostituisci = (da: string, a: string) => (testo: string) => {
  if (!testo.includes(da)) throw new Error(`"${da}" non c'è nel file da cambiare`);
  return testo.replace(da, a);
};

describe('catalogo', () => {
  it('dalla cartella valida produce la Lettura attesa', () => {
    const esito = catalogo(VALIDA, { capitoli: CAPITOLI });
    expect(esito).toEqual({
      ok: true,
      letture: [
        {
          id: 'if-ye-love-me/soprano-1-4',
          brano: 'If Ye Love Me',
          autore: 'Thomas Tallis',
          voce: 'soprano',
          battute: { inizio: 1, fine: 4 },
          abc: expect.stringContaining('K:F major'),
          testo: 'If ye love me, keep my com-mand-ments.',
          // Fa maggiore, DO = Fa. Il La legato della battuta 2 non prende una nuova Sillaba.
          sillabe: ['DO', 'DO', 'RE', 'MI', 'MI', 'RE', 'DO', 'FA', 'MI'],
          tonalita: { tonica: { lettera: 'F', alterazione: 0 }, modo: 'maggiore' },
          mutazioni: [],
          prerequisiti: ['do-mobile'],
          blocco: 'normale',
          attribuzione: {
            fonte: 'Mutopia',
            edizione: 'Mutopia-2014/08/05-412',
            url: 'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=412',
            editore: 'Stan Sanderson',
            licenza: { nome: 'Public Domain', url: 'https://creativecommons.org/licenses/publicdomain/' },
            trascrizione: { nome: 'CC0 1.0', url: 'https://creativecommons.org/publicdomain/zero/1.0/' },
          },
          stato: 'pubblicata',
          modificata: new Date('2026-11-06'),
        },
      ],
    });
  });

  // La nota delle modifiche richiesta dalla CPDL License, generata dai dati della Lettura (ADR-0003).
  const nota = (l: Lettura) => ({ it: notaDelleModifiche(l, testi('it'), 'it'), en: notaDelleModifiche(l, testi('en'), 'en') });

  it('la nota delle modifiche dice estratto, trascrizione e data, in italiano e in inglese', () => {
    expect(nota(lettura(VALIDA))).toEqual({
      it: 'Estratto della voce di soprano, battute 1–4, trascritto in notazione ABC con le sillabe del DO mobile. Ultima modifica: 6 novembre 2026.',
      en: 'Excerpt of the soprano voice part, measures 1–4, transcribed into ABC notation with movable-do syllables. Last modified: November 6, 2026.',
    });
  });

  it.each([
    ['schema', 'manca un campo obbligatorio', EDIZIONE, sostituisci('editore: Stan Sanderson\n', ''), 'if-ye-love-me'],
    ['licenza', 'NC non è tra le licenze accettate', EDIZIONE, sostituisci('tipo: PD', 'tipo: CC BY-NC'), 'if-ye-love-me'],
    // ADR-0005: le trascrizioni di un'Edizione PD sono CC0; le altre seguono la licenza dell'Edizione.
    ['licenza', "un'Edizione PD senza trascrizioni CC0", EDIZIONE, sostituisci('trascrizioni: CC0\n', ''), 'if-ye-love-me'],
    ['licenza', "trascrizioni CC0 di un'Edizione CC BY-SA", EDIZIONE, sostituisci('tipo: PD', 'tipo: CC BY-SA'), 'if-ye-love-me'],
    // ADR-0003: la licenza com'era il giorno dell'import, con una prova: snapshot su archive.org o licenza.pdf.
    ['licenza', 'una prova che non è uno snapshot su archive.org', EDIZIONE, sostituisci('https://web.archive.org/web/2026/', ''), 'if-ye-love-me'],
    ['licenza', 'manca il licenza.pdf indicato come prova', EDIZIONE, (t: string) => t.replace(/prova: .*/, 'prova: licenza.pdf'), 'if-ye-love-me'],
    ['licenza', "fonte_dichiarata: no in un'Edizione che non è PD", EDIZIONE, (t: string) => t.replace('tipo: PD', 'tipo: CC BY-SA').replace('trascrizioni: CC0\n', 'fonte_dichiarata: no\n'), 'if-ye-love-me'],
    ['prerequisiti', 'un Prerequisito che non è nel Percorso', EDIZIONE, sostituisci('[do-mobile]', '[solfeggio]'), 'if-ye-love-me/soprano-1-4'],
    ['id', "l'id non è <voce>-<inizio>-<fine>", EDIZIONE, sostituisci('voce: soprano', 'voce: contralto'), 'if-ye-love-me/soprano-1-4'],
    ['id', 'due Letture con lo stesso id', EDIZIONE, (t: string) => t + SECONDA_LETTURA, 'if-ye-love-me/soprano-1-4'],
    ['id', 'manca il file .abc della Lettura', ABC, togli, 'if-ye-love-me/soprano-1-4'],
    ['id', 'un file .abc che non è una Lettura', 'if-ye-love-me/contralto-1-4.abc', () => 'X:1', 'if-ye-love-me'],
    ['sorgente', "il sorgente non ha l'hash dichiarato", SORGENTE, (t: string) => t + '% una riga in più\n', 'if-ye-love-me'],
    ['sorgente', 'manca il sorgente', SORGENTE, togli, 'if-ye-love-me'],
    ['abc', 'abcjs dà un avviso', ABC, sostituisci('F3 F', '!pippo!F3 F'), 'if-ye-love-me/soprano-1-4'],
    ['voce', 'due Voci', ABC, (t: string) => t.replace('K:F major\n', 'K:F major\nV:1\n') + 'V:2\nC4 | C4 | C4 | C4 |]\n', 'if-ye-love-me/soprano-1-4'],
    ['voce', 'un accordo', ABC, sostituisci('F3 F', '[FA]3 F'), 'if-ye-love-me/soprano-1-4'],
    ['tonalita', 'il K: senza Modo esplicito', ABC, sostituisci('K:F major', 'K:F'), 'if-ye-love-me/soprano-1-4'],
    // ADR-0004: Mi♯ in Fa maggiore non ha Sillaba; si riscrive la nota, non si corregge la Sillaba.
    ['sillabe', 'una Nota senza Sillaba prevista', ABC, sostituisci('F3 F', 'F3 ^E'), 'if-ye-love-me/soprano-1-4'],
    // ADR-0008: l'Ascolto di verifica va al Q: della Lettura.
    ['andamento', 'manca il Q:', ABC, sostituisci('Q:1/4=70\n', ''), 'if-ye-love-me/soprano-1-4'],
    // Limiti musicali (ticket "Catalogo iniziale di Letture", #17): ciò che il Percorso non insegna o un principiante non regge.
    ['gruppi-irregolari', 'una terzina', ABC, sostituisci('A A G F', '(3AAG F2'), 'if-ye-love-me/soprano-1-4'],
    // Fa4 → Sol5 è una nona; l'estensione Fa4–Sol5 resta entro la decima.
    ['salti', "un salto più ampio di un'ottava", ABC, sostituisci('F3 F', 'F3 g'), 'if-ye-love-me/soprano-1-4'],
    ['battute', 'meno di 4 Battute', ABC, sostituisci(' B2 A2 |]', ']'), 'if-ye-love-me/soprano-1-4'],
    ['battute', 'più di 12 Battute', ABC, sostituisci('B2 A2 |]', 'B2 A2 |' + ' F4 |'.repeat(9) + ']'), 'if-ye-love-me/soprano-1-4'],
    ['battute', "5 Battute nell'ABC, 4 in edizione.yml", ABC, sostituisci('B2 A2 |]', 'B2 A2 | F4 |]'), 'if-ye-love-me/soprano-1-4'],
    ['battute', '3 Battute più il levare', ABC, sostituisci(MUSICA, 'F | F2 G A- | A A G F | B2 A |]'), 'if-ye-love-me/soprano-1-4'],
    ['durata', "l'ultima Battuta incompleta senza levare", ABC, sostituisci('B2 A2', 'B2 A'), 'if-ye-love-me/soprano-1-4'],
    ['durata', 'una Battuta in mezzo troppo lunga', ABC, sostituisci('G2 A2-', 'G2 A3-'), 'if-ye-love-me/soprano-1-4'],
    ['pause', 'una pausa di 3 Battute', ABC, sostituisci(MUSICA, 'F4 | z4 | z4 | z4 |]'), 'if-ye-love-me/soprano-1-4'],
    ['pause', 'una pausa multipla di 3 Battute', ABC, sostituisci(MUSICA, 'F4 | Z3 |]'), 'if-ye-love-me/soprano-1-4'],
    ['armatura', '4 diesis in una Lettura', ABC, sostituisci('K:F major', 'K:E major'), 'if-ye-love-me/soprano-1-4'],
    // Fa4–Si♭5 è un'undicesima, raggiunta senza salti oltre l'ottava; Fa4–La5, la decima, è ancora ammessa.
    ['estensione', "un'estensione oltre la decima", ABC, sostituisci('B2 A2', 'f2 b2'), 'if-ye-love-me/soprano-1-4'],
  ] as const)('controllo "%s": %s', (regola, _, file, cambia, lettura) => {
    expect(errori(variante(file, cambia))).toEqual([{ lettura, regola }]);
  });

  it('la prova della licenza può essere licenza.pdf nella cartella', () => {
    const cartella = variante(EDIZIONE, (t) => t.replace(/prova: .*/, 'prova: licenza.pdf'));
    writeFileSync(join(cartella, 'if-ye-love-me/licenza.pdf'), '%PDF-1.4');
    expect(errori(cartella)).toEqual([]);
  });

  it("un'Edizione PD che non dichiara la sua fonte porta fonte_dichiarata: no", () => {
    expect(errori(variante(EDIZIONE, sostituisci('trascrizioni: CC0\n', 'trascrizioni: CC0\nfonte_dichiarata: no\n')))).toEqual([]);
  });

  it("un levare con l'ultima Battuta che lo completa è ammesso, e non conta tra le 4 Battute", () => {
    expect(errori(variante(ABC, sostituisci(MUSICA, 'F | F2 G A- | A A G F | B2 A2 | G A G |]')))).toEqual([]);
  });

  describe('Armatura nelle Letture avanzate', () => {
    const avanzata = (k: string) => {
      const cartella = variante(EDIZIONE, sostituisci('[do-mobile]', '[do-mobile-avanzato]'));
      writeFileSync(join(cartella, ABC), readFileSync(join(cartella, ABC), 'utf8').replace('K:F major', `K:${k}`));
      return errori(cartella);
    };

    it('ammette 4 alterazioni', () => {
      expect(avanzata('Ab major')).toEqual([]);
    });

    it('non ne ammette 5', () => {
      expect(avanzata('Db major')).toEqual([{ lettura: 'if-ye-love-me/soprano-1-4', regola: 'armatura' }]);
    });
  });

  it('una pausa di 2 Battute è ammessa', () => {
    expect(errori(variante(ABC, sostituisci(MUSICA, 'F3 z | z4 | z3 A | B2 A2 |]')))).toEqual([]);
  });

  it("un'estensione di una decima esatta è ammessa", () => {
    // Fa4–La5: 16 semitoni.
    expect(errori(variante(ABC, sostituisci('B2 A2', 'f2 a2')))).toEqual([]);
  });

  describe('Mutazioni', () => {
    const conMutazione = (battuta: number) =>
      variante(EDIZIONE, sostituisci('    modificata:', `    mutazioni:\n      - { battuta: ${battuta}, posizione: 1, tonalita: C major }\n    modificata:`));
    const DO_MAGGIORE = { tonica: { lettera: 'C', alterazione: 0 }, modo: 'maggiore' };

    it.each([
      ['una Battuta fuori dall\'estratto', 5, 1],
      ['una posizione che la Battuta non ha', 2, 3],
      // ADR-0004: "dalla nota della Mutazione"; una nota legata va bene, una pausa no.
      ['una pausa', 4, 2],
    ])('una Mutazione su %s', (_, battuta, posizione) => {
      const cartella = variante(
        EDIZIONE,
        sostituisci('    modificata:', `    mutazioni:\n      - { battuta: ${battuta}, posizione: ${posizione}, tonalita: C major }\n    modificata:`),
      );
      const abc = join(cartella, ABC);
      writeFileSync(abc, readFileSync(abc, 'utf8').replace('B2 A2', 'B2 z A'));
      expect(errori(cartella)).toEqual([{ lettura: 'if-ye-love-me/soprano-1-4', regola: 'mutazioni' }]);
    });

    it("una Mutazione scritta come [K:] nell'ABC", () => {
      expect(errori(variante(ABC, sostituisci('| A A G F', '| [K:C major] A A G F')))).toEqual([
        { lettura: 'if-ye-love-me/soprano-1-4', regola: 'mutazioni' },
      ]);
    });

    it('dalla nota della Mutazione in poi le Sillabe sono della nuova Tonalità', () => {
      const l = lettura(conMutazione(3));
      // Battute 1–2 in Fa maggiore; dalla battuta 3 il DO è il Do: La→LA, Sol→SOL, Fa→FA, Si♭→TE.
      expect(l.sillabe).toEqual(['DO', 'DO', 'RE', 'MI', 'LA', 'SOL', 'FA', 'TE', 'LA']);
      expect(l.mutazioni).toEqual([{ battuta: 3, posizione: 1, tonalita: DO_MAGGIORE }]);
      expect(l.tonalita.tonica.lettera).toBe('F');
    });

    it('la nota delle modifiche dice le Mutazioni e chiude con il campo libero', () => {
      const cartella = variante(
        EDIZIONE,
        sostituisci(
          '    modificata:',
          '    mutazioni:\n      - { battuta: 3, posizione: 1, tonalita: Bb major }\n' +
            '    modifiche:\n      it: Legature di portamento scritte come legature di valore.\n      en: Slurs written as ties.\n    modificata:',
        ),
      );
      expect(nota(lettura(cartella))).toEqual({
        it:
          'Estratto della voce di soprano, battute 1–4, trascritto in notazione ABC con le sillabe del DO mobile. ' +
          'Mutazione annotata alla battuta 3: Si♭ maggiore. Legature di portamento scritte come legature di valore. Ultima modifica: 6 novembre 2026.',
        en:
          'Excerpt of the soprano voice part, measures 1–4, transcribed into ABC notation with movable-do syllables. ' +
          'Do shift marked at measure 3: B♭ major. Slurs written as ties. Last modified: November 6, 2026.',
      });
    });

    it("il levare ha il numero della Battuta prima di inizio, come in partitura", () => {
      const cartella = variante(
        EDIZIONE,
        sostituisci('    modificata:', '    mutazioni:\n      - { battuta: 0, posizione: 1, tonalita: C major }\n    modificata:'),
      );
      const abc = join(cartella, ABC);
      writeFileSync(abc, readFileSync(abc, 'utf8').replace(MUSICA, 'F | F2 G A- | A A G F | B2 A2 | G A G |]'));
      // Il Fa del levare è già in Do maggiore: FA.
      expect(lettura(cartella).sillabe[0]).toBe('FA');
    });

    it("un estratto che comincia già modulato ha come Tonalità iniziale quella della Mutazione sulla prima nota", () => {
      expect(lettura(conMutazione(1)).tonalita).toEqual(DO_MAGGIORE);
    });
  });

  describe('da_verificare', () => {
    it('porta il motivo nella Lettura', () => {
      const cartella = variante(EDIZIONE, sostituisci('    modificata:', '    da_verificare: cromatismo o Mutazione in battuta 3?\n    modificata:'));
      expect(lettura(cartella).daVerificare).toBe('cromatismo o Mutazione in battuta 3?');
    });

    it('senza motivo è un errore di schema', () => {
      const cartella = variante(EDIZIONE, sostituisci('    modificata:', "    da_verificare: ''\n    modificata:"));
      expect(errori(cartella)).toEqual([{ lettura: 'if-ye-love-me', regola: 'schema' }]);
    });
  });

  it('due cartelle con la stessa Fonte e la stessa Edizione', () => {
    const cartella = variante('pubblicate.txt', (t) => t + 'if-ye-love-me-sanderson/soprano-1-4\n');
    cpSync(join(cartella, 'if-ye-love-me'), join(cartella, 'if-ye-love-me-sanderson'), { recursive: true });
    expect(errori(cartella)).toEqual([{ lettura: 'if-ye-love-me-sanderson', regola: 'edizione' }]);
  });

  describe('registro delle Letture pubblicate', () => {
    const REGISTRO = 'pubblicate.txt';

    it('una Lettura che non è nel registro', () => {
      expect(errori(variante(REGISTRO, sostituisci('if-ye-love-me/soprano-1-4\n', '')))).toEqual([
        { lettura: 'if-ye-love-me/soprano-1-4', regola: 'registro' },
      ]);
    });

    it('un id del registro senza Lettura: una Lettura ritirata resta in edizione.yml', () => {
      expect(errori(variante(REGISTRO, (t) => t + 'if-ye-love-me/alto-5-8\n'))).toEqual([
        { lettura: 'if-ye-love-me/alto-5-8', regola: 'registro' },
      ]);
    });

    it('il registro cresce soltanto: un id del registro precedente non si toglie', () => {
      const precedente = ['if-ye-love-me/soprano-1-4', 'if-ye-love-me/basso-1-4'];
      expect(errori(VALIDA, { registroPrecedente: precedente })).toEqual([
        { lettura: 'if-ye-love-me/basso-1-4', regola: 'registro' },
      ]);
    });

    it('manca il registro', () => {
      expect(errori(variante(REGISTRO, togli))).toEqual([{ lettura: 'pubblicate.txt', regola: 'registro' }]);
    });
  });
});
