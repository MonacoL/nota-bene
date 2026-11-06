// Flusso di import di un nuovo Brano (ticket #34, ADR-0003): gli strumenti di chi importa, che condividono schema e
// parser con il catalogo. Non vanno in rete: lo scaricamento da Mutopia passa da un adapter finto.
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { catalogo, SEGNAPOSTO, type Lettura } from '../../src/letture/catalogo';
import { elencoDaVerificare, estraiLettura, nuovaEdizione } from '../../src/letture/import';

const VALIDA = 'tests/unit/letture/valida';
const CAPITOLI = ['scala-maggiore', 'do-mobile', 'do-mobile-avanzato'];

/** Le Letture di una copia della cartella valida, con edizione.yml cambiato da `cambia`. */
function letture(cambia: (edizione: string) => string): Lettura[] {
  const cartella = mkdtempSync(join(tmpdir(), 'letture-'));
  cpSync(VALIDA, cartella, { recursive: true });
  const file = join(cartella, 'if-ye-love-me/edizione.yml');
  writeFileSync(file, cambia(readFileSync(file, 'utf8')));
  const esito = catalogo(cartella, { capitoli: CAPITOLI });
  if (!esito.ok) throw new Error(JSON.stringify(esito.errori));
  return esito.letture;
}

describe('nuovaEdizione', () => {
  const OGGI = new Date('2026-11-06');
  const nessunaRete = async (url: string): Promise<Uint8Array> => {
    throw new Error(`niente rete nei test: ${url}`);
  };
  const leggi = (cartella: string, file: string) => readFileSync(join(cartella, file), 'utf8');

  it('da un file scaricato a mano da CPDL crea la cartella con la copia del sorgente e edizione.yml da compilare', async () => {
    const letture = mkdtempSync(join(tmpdir(), 'letture-'));
    const url = 'https://www.cpdl.org/wiki/index.php/Ave_verum_corpus_(William_Byrd)';
    await nuovaEdizione({ cartella: letture, brano: 'ave-verum-corpus', oggi: OGGI, fonte: 'cpdl', url, file: 'tests/unit/import/sorgente.mxl' }, nessunaRete);
    const cartella = join(letture, 'ave-verum-corpus');
    expect(leggi(cartella, 'sorgente.mxl')).toBe('Sorgente di prova\n');
    expect(parse(leggi(cartella, 'edizione.yml'))).toEqual({
      brano: SEGNAPOSTO,
      autore: SEGNAPOSTO,
      fonte: 'cpdl',
      edizione: SEGNAPOSTO,
      url,
      editore: SEGNAPOSTO,
      licenza: { tipo: SEGNAPOSTO, come_appare: SEGNAPOSTO, url: SEGNAPOSTO, consultata: '2026-11-06', prova: SEGNAPOSTO },
      sorgente: { file: 'sorgente.mxl', sha256: '5b3f21e2f8acd4aa258e6bd6b2a1ac27458679626e57cdf3da369688bb81a84c' },
      letture: [],
    });
  });

  it('da un URL di Mutopia scarica .ly, PDF e RDF e precompila edizione.yml', async () => {
    const letture = mkdtempSync(join(tmpdir(), 'letture-'));
    const ftp = 'https://www.mutopiaproject.org/ftp/TallisT/tallis-love/';
    const pagina = 'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=412';
    const file: Record<string, string> = {
      [pagina]: readFileSync('tests/unit/import/mutopia/piece-info-412.html', 'utf8'),
      [`${ftp}tallis-love.rdf`]: readFileSync('tests/unit/import/mutopia/tallis-love.rdf', 'utf8'),
      [`${ftp}tallis-love.ly`]: 'ly',
      [`${ftp}tallis-love-a4.pdf`]: 'pdf',
    };
    const scarica = async (url: string) => {
      if (!(url in file)) throw new Error(`non previsto: ${url}`);
      return new TextEncoder().encode(file[url]);
    };
    await nuovaEdizione({ cartella: letture, brano: 'if-ye-love-me', oggi: OGGI, mutopia: pagina }, scarica);
    const cartella = join(letture, 'if-ye-love-me');
    expect([leggi(cartella, 'tallis-love.ly'), leggi(cartella, 'tallis-love-a4.pdf'), leggi(cartella, 'tallis-love.rdf')]).toEqual([
      'ly',
      'pdf',
      file[`${ftp}tallis-love.rdf`],
    ]);
    expect(parse(leggi(cartella, 'edizione.yml'))).toEqual({
      brano: 'If Ye Love Me',
      // La pagina dice solo "T. Tallis": il nome per esteso lo scrive chi importa.
      autore: SEGNAPOSTO,
      fonte: 'mutopia',
      edizione: 'Mutopia-2014/08/05-412',
      url: pagina,
      editore: 'Stan Sanderson',
      licenza: {
        tipo: 'PD',
        come_appare: 'Public Domain',
        url: 'https://creativecommons.org/licenses/publicdomain/',
        consultata: '2026-11-06',
        prova: SEGNAPOSTO,
      },
      trascrizioni: 'CC0',
      sorgente: { file: 'tallis-love.ly', sha256: '40cb4b342f4525e4b53ead63a36c0c3ec923d23e79bacaa724663932a19b721f' },
      letture: [],
    });
  });

  it('non sovrascrive una cartella che esiste già: una seconda Edizione va in <brano>-<editore>/', async () => {
    const letture = mkdtempSync(join(tmpdir(), 'letture-'));
    const opzioni = { cartella: letture, brano: 'ave-verum-corpus', oggi: OGGI, fonte: 'cpdl', url: 'https://www.cpdl.org/', file: 'tests/unit/import/sorgente.mxl' } as const;
    await nuovaEdizione(opzioni, nessunaRete);
    await expect(nuovaEdizione(opzioni, nessunaRete)).rejects.toThrow('esiste già');
  });
});

describe('estraiLettura', () => {
  // L'uscita vera di xml2abc 177 su Hornsey di S. S. Wesley (CPDL #15417): quattro Voci su due righi, S A e T B.
  const HORNSEY = readFileSync('tests/unit/import/hornsey-xml2abc.abc', 'utf8');

  it('isola una Voce e ne taglia le Battute, con il Modo da compilare', () => {
    expect(estraiLettura(HORNSEY, { voce: 1, inizio: 1, fine: 4 })).toBe(
      ['X:1', 'M:4/4', 'L:1/4', 'Q:1/4=90', `K:G % ${SEGNAPOSTO}: major o minor`, 'D D G B | A B c d | B A/G/ A d | E G F2 |]', ''].join('\n'),
    );
  });

  // Come lo scrive xml2abc: le righe w: seguono la riga di musica a cui si riferiscono.
  const CON_TESTO = [
    'X:1',
    'T:Title',
    'L:1/4',
    'M:3/4',
    'K:F',
    'V:1 treble nm="S"',
    'V:1',
    'C | F G A | B2 A- | A z F | %3',
    'w: Now thank we all Al- le- * lu-',
    'E2 C | F3 |] %5',
    'w: ia and hands and',
  ].join('\n');

  it('conta il levare come Battuta 0, taglia il Testo con le note e senza Andamento nella Fonte non scrive il Q:', () => {
    expect(estraiLettura(CON_TESTO, { voce: 1, inizio: 2, fine: 4 })).toBe(
      ['X:1', 'M:3/4', 'L:1/4', `K:F % ${SEGNAPOSTO}: major o minor`, 'B2 A- | A z F | E2 C |]', 'w: Al- le- * lu- ia and', ''].join('\n'),
    );
  });

  it('tiene la Chiave della Voce e toglie le annotazioni, anche quelle con le strofe', () => {
    expect(estraiLettura(HORNSEY, { voce: 4, inizio: 1, fine: 4 })).toBe(
      ['X:1', 'M:4/4', 'L:1/4', 'Q:1/4=90', `K:G clef=bass % ${SEGNAPOSTO}: major o minor`, 'G, F, E, D, | C, D, E, F, | G, G, F, B,,/A,,/ | G,, A,, D,2 |]', ''].join('\n'),
    );
  });
});

describe('elencoDaVerificare', () => {
  it('elenca per il maestro le Letture con da_verificare, con il motivo e il link alla pagina', () => {
    const daVerificare = letture((t) => t.replace('    modificata:', '    da_verificare: cromatismo o Mutazione in battuta 3?\n    modificata:'));
    expect(elencoDaVerificare(daVerificare, 'https://monacol.github.io/nota-bene/')).toBe(
      [
        '# Letture da verificare con il maestro',
        '',
        '- If Ye Love Me (Thomas Tallis), soprano, battute 1–4: cromatismo o Mutazione in battuta 3?',
        '  https://monacol.github.io/nota-bene/it/letture/if-ye-love-me/soprano-1-4/',
        '',
      ].join('\n'),
    );
  });

  it('senza Letture da verificare lo dice', () => {
    expect(elencoDaVerificare(letture((t) => t), 'https://monacol.github.io/nota-bene/')).toBe(
      '# Letture da verificare con il maestro\n\nNessuna Lettura da verificare.\n',
    );
  });
});
