// Catalogo delle Letture (ADR-0003, ADR-0004, ADR-0005): dalla cartella delle Letture, le Letture pronte o gli errori.
// La cartella valida è in tests/unit/letture/valida; ogni controllo ha la sua variante, una copia con una sola modifica.
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { catalogo, type Opzioni } from '../../src/letture/catalogo';

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
        },
      ],
    });
  });

  it.each([
    ['schema', 'manca un campo obbligatorio', EDIZIONE, sostituisci('editore: Stan Sanderson\n', ''), 'if-ye-love-me'],
    ['licenza', 'NC non è tra le licenze accettate', EDIZIONE, sostituisci('tipo: PD', 'tipo: CC BY-NC'), 'if-ye-love-me'],
    // ADR-0005: le trascrizioni di un'Edizione PD sono CC0; le altre seguono la licenza dell'Edizione.
    ['licenza', "un'Edizione PD senza trascrizioni CC0", EDIZIONE, sostituisci('trascrizioni: CC0\n', ''), 'if-ye-love-me'],
    ['licenza', "trascrizioni CC0 di un'Edizione CC BY-SA", EDIZIONE, sostituisci('tipo: PD', 'tipo: CC BY-SA'), 'if-ye-love-me'],
    ['prerequisiti', 'un Prerequisito che non è nel Percorso', EDIZIONE, sostituisci('[do-mobile]', '[solfeggio]'), 'if-ye-love-me/soprano-1-4'],
    ['id', "l'id non è <voce>-<inizio>-<fine>", EDIZIONE, sostituisci('battute: [1, 4]', 'battute: [1, 5]'), 'if-ye-love-me/soprano-1-4'],
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
  ] as const)('controllo "%s": %s', (regola, _, file, cambia, lettura) => {
    expect(errori(variante(file, cambia))).toEqual([{ lettura, regola }]);
  });

  describe('Mutazioni', () => {
    const conMutazione = (battuta: number) =>
      variante(EDIZIONE, sostituisci('    modificata:', `    mutazioni:\n      - { battuta: ${battuta}, posizione: 1, tonalita: C major }\n    modificata:`));
    const lettura = (cartella: string) => {
      const esito = catalogo(cartella, { capitoli: CAPITOLI });
      if (!esito.ok) throw new Error(JSON.stringify(esito.errori));
      return esito.letture[0]!;
    };
    const DO_MAGGIORE = { tonica: { lettera: 'C', alterazione: 0 }, modo: 'maggiore' };

    it('dalla nota della Mutazione in poi le Sillabe sono della nuova Tonalità', () => {
      const l = lettura(conMutazione(3));
      // Battute 1–2 in Fa maggiore; dalla battuta 3 il DO è il Do: La→LA, Sol→SOL, Fa→FA, Si♭→TE.
      expect(l.sillabe).toEqual(['DO', 'DO', 'RE', 'MI', 'LA', 'SOL', 'FA', 'TE', 'LA']);
      expect(l.mutazioni).toEqual([{ battuta: 3, posizione: 1, tonalita: DO_MAGGIORE }]);
      expect(l.tonalita.tonica.lettera).toBe('F');
    });

    it("un estratto che comincia già modulato ha come Tonalità iniziale quella della Mutazione sulla prima nota", () => {
      expect(lettura(conMutazione(1)).tonalita).toEqual(DO_MAGGIORE);
    });
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
