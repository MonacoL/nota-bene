// Le sezioni generate della pagina dei crediti (ticket #14, ADR-0005): "Brani" dalle Edizioni delle Letture
// e "asset di terzi" dai file di licenza accanto agli asset.
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Lettura } from '../../src/letture/catalogo';
import { assetDiTerzi, braniDeiCrediti } from '../../src/crediti';

const ESEMPIO = 'tests/unit/crediti/esempio';
const PACCHETTI = 'tests/unit/crediti/pacchetti';

describe('assetDiTerzi', () => {
  it('legge le schede crediti.yml accanto ai file di licenza, e i pacchetti npm dal pacchetto installato', () => {
    expect(assetDiTerzi(ESEMPIO, { pacchetti: PACCHETTI })).toEqual({
      ok: true,
      asset: [
        {
          nome: 'conv 12',
          autori: 'Una Persona',
          licenza: 'GNU LGPL',
          url: 'https://example.org/conv',
          fileLicenza: ['strumenti/conv/COPYING.LESSER', 'strumenti/conv/COPYING'],
        },
        {
          nome: 'finto 1.2.3',
          autori: 'Chi ha scritto finto',
          licenza: 'MIT',
          url: 'https://example.org/finto',
          fileLicenza: [],
        },
        {
          nome: 'Font Finto',
          autori: 'Gli autori di Font Finto',
          licenza: 'SIL Open Font License 1.1',
          url: 'https://example.org/font-finto',
          fileLicenza: ['src/assets/fonts/font-finto-LICENSE.txt'],
          nota: { it: 'ridotto a tre glifi', en: 'reduced to three glyphs' },
        },
      ],
    });
  });

  /** Gli errori su una copia della cartella d'esempio in cui `file` è scritto con `testo` (o tolto, con null). */
  function errori(modifiche: Record<string, string | null>): string[] {
    const cartella = mkdtempSync(join(tmpdir(), 'crediti-'));
    cpSync(ESEMPIO, cartella, { recursive: true });
    for (const [file, testo] of Object.entries(modifiche)) {
      const percorso = join(cartella, file);
      if (testo === null) rmSync(percorso);
      else {
        mkdirSync(dirname(percorso), { recursive: true });
        writeFileSync(percorso, testo);
      }
    }
    const esito = assetDiTerzi(cartella, { pacchetti: PACCHETTI });
    return esito.ok ? [] : esito.errori;
  }

  it('si ferma su un file di licenza che nessuna scheda cita, per esempio i campioni nuovi senza crediti.yml', () => {
    expect(errori({ 'public/campioni/LICENSE.txt': 'CC BY 3.0' })).toEqual([
      'public/campioni/LICENSE.txt: file di licenza senza una voce che lo citi in public/campioni/crediti.yml',
    ]);
    expect(errori({ 'strumenti/conv/crediti.yml': '- { nome: conv, autori: A, licenza: LGPL, url: "https://example.org", file_licenza: COPYING }' })).toEqual([
      'strumenti/conv/COPYING.LESSER: file di licenza senza una voce che lo citi in strumenti/conv/crediti.yml',
    ]);
  });

  it('si ferma su una scheda che cita un file di licenza che non c\'è', () => {
    expect(errori({ 'src/assets/fonts/font-finto-LICENSE.txt': null })).toEqual([
      'src/assets/fonts/crediti.yml: "Font Finto" cita font-finto-LICENSE.txt, che non c\'è nella cartella',
    ]);
  });

  it('si ferma su un pacchetto npm che non è installato', () => {
    expect(errori({ 'src/crediti.yml': '- { pacchetto: assente, autori: A, url: "https://example.org" }' })).toEqual([
      'src/crediti.yml: il pacchetto "assente" non è installato',
    ]);
  });

  it('si ferma su una scheda senza licenza o con un campo sconosciuto', () => {
    expect(errori({ 'public/x/crediti.yml': '- { nome: X, autori: A, url: "https://example.org", file_licenza: LICENSE }', 'public/x/LICENSE': 'x' })).toHaveLength(1);
    expect(errori({ 'public/x/crediti.yml': '- { pacchetto: finto, autori: A, url: "https://example.org", licenza: MIT }' })).toHaveLength(1);
  });

  it('trova nel repo font, abcjs e xml2abc, senza file di licenza dimenticati', () => {
    const esito = assetDiTerzi('.');
    expect(esito.ok ? [] : esito.errori).toEqual([]);
    const nomi = esito.ok ? esito.asset.map((a) => a.nome) : [];
    expect(nomi).toEqual(expect.arrayContaining(['Oswald', 'Open Sans', 'Noto Music', 'xml2abc 177']));
    expect(nomi.some((n) => /^abcjs \d/.test(n))).toBe(true);
  });

  it('ignora le licenze di Nota Bene nella radice e le cartelle delle letture', () => {
    expect(errori({ LICENSE: 'MIT', 'letture/brano/licenza.pdf': 'pdf', 'node_modules/x/LICENSE': 'MIT' })).toEqual([]);
  });
});

const ATTRIBUZIONE_TALLIS: Lettura['attribuzione'] = {
  fonte: 'Mutopia',
  edizione: 'Mutopia-2014/08/05-412',
  url: 'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=412',
  editore: 'Stan Sanderson',
  licenza: { nome: 'Public Domain', url: 'https://creativecommons.org/licenses/publicdomain/' },
  trascrizione: { nome: 'CC0 1.0', url: 'https://creativecommons.org/publicdomain/zero/1.0/' },
};
const ATTRIBUZIONE_WESLEY: Lettura['attribuzione'] = {
  fonte: 'CPDL',
  edizione: '#42027',
  url: 'https://www.cpdl.org/wiki/index.php/On_the_resurrection_morning_(Samuel_Sebastian_Wesley)',
  editore: 'James Gibb',
  licenza: { nome: 'CPDL', url: 'https://www.cpdl.org/wiki/index.php/ChoralWiki:CPDL' },
};

/** Una Lettura con i soli campi che contano per i crediti. */
function lettura(id: string, brano: string, autore: string, attribuzione: Lettura['attribuzione'], stato: Lettura['stato'] = 'pubblicata'): Lettura {
  return { id, brano, autore, attribuzione, stato } as Lettura;
}

describe('braniDeiCrediti', () => {
  it("dà un Brano per Edizione, con compositore, fonte, editore, licenza e link, in ordine di titolo", () => {
    const letture = [
      lettura('on-the-resurrection-morning/soprano-1-8', 'On the Resurrection Morning', 'Samuel Sebastian Wesley', ATTRIBUZIONE_WESLEY),
      lettura('if-ye-love-me/soprano-1-7', 'If Ye Love Me', 'Thomas Tallis', ATTRIBUZIONE_TALLIS),
      lettura('if-ye-love-me/basso-1-7', 'If Ye Love Me', 'Thomas Tallis', ATTRIBUZIONE_TALLIS),
    ];
    expect(braniDeiCrediti(letture)).toEqual([
      { brano: 'If Ye Love Me', autore: 'Thomas Tallis', ...ATTRIBUZIONE_TALLIS },
      { brano: 'On the Resurrection Morning', autore: 'Samuel Sebastian Wesley', ...ATTRIBUZIONE_WESLEY },
    ]);
  });

  it('non mostra un Brano che ha solo Letture ritirate', () => {
    const letture = [
      lettura('if-ye-love-me/soprano-1-7', 'If Ye Love Me', 'Thomas Tallis', ATTRIBUZIONE_TALLIS, 'ritirata'),
      lettura('on-the-resurrection-morning/soprano-1-8', 'On the Resurrection Morning', 'Samuel Sebastian Wesley', ATTRIBUZIONE_WESLEY),
    ];
    expect(braniDeiCrediti(letture).map((b) => b.brano)).toEqual(['On the Resurrection Morning']);
  });

  it('tiene un Brano che ha ancora una Lettura pubblicata', () => {
    const letture = [
      lettura('if-ye-love-me/soprano-1-7', 'If Ye Love Me', 'Thomas Tallis', ATTRIBUZIONE_TALLIS, 'ritirata'),
      lettura('if-ye-love-me/basso-1-7', 'If Ye Love Me', 'Thomas Tallis', ATTRIBUZIONE_TALLIS),
    ];
    expect(braniDeiCrediti(letture).map((b) => b.brano)).toEqual(['If Ye Love Me']);
  });
});
