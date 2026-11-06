// Regole del Percorso e dei Capitoli: schema del frontmatter, ordine, ripiego sull'italiano, avvisi di traduzione.
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { avvisiTraduzione, controllaFile, ordina, scegliTesto, vicini } from '../../src/contenuti/percorso';
import { schemaCapitoloEn, schemaCapitoloIt, schemaVocePercorso, type VocePercorso } from '../../src/contenuti/schemi';
import { htmlPentagramma, pentagrammi } from '../../src/markdown/pentagrammi';

const data = (s: string) => new Date(`${s}T00:00:00Z`);

function voce(id: string, numero: number): VocePercorso {
  return { id, numero, it: { titolo: id, riga: id }, en: { titolo: id, riga: id } };
}

describe('frontmatter dei Capitoli', () => {
  it('accetta un Capitolo italiano con revisione', () => {
    expect(schemaCapitoloIt.safeParse({ revisione: { da: 'Luca Monaco', data: '2026-11-06' } }).success).toBe(true);
  });

  it('rifiuta un file senza revisione o con la revisione incompleta', () => {
    expect(schemaCapitoloIt.safeParse({}).success).toBe(false);
    expect(schemaCapitoloIt.safeParse({ revisione: { data: '2026-11-06' } }).success).toBe(false);
    expect(schemaCapitoloIt.safeParse({ revisione: { da: ' ', data: '2026-11-06' } }).success).toBe(false);
    expect(schemaCapitoloIt.safeParse({ revisione: { da: 'Luca Monaco' } }).success).toBe(false);
  });

  it('chiede tradotto_da ai Capitoli inglesi', () => {
    const revisione = { da: 'Luca Monaco', data: '2026-11-06' };
    expect(schemaCapitoloEn.safeParse({ revisione }).success).toBe(false);
    expect(schemaCapitoloEn.safeParse({ revisione, tradotto_da: '2026-11-06' }).success).toBe(true);
  });

  it('rifiuta i campi sconosciuti, così un errore di battitura non passa inosservato', () => {
    expect(schemaCapitoloIt.safeParse({ revisione: { da: 'L', data: '2026-11-06' }, revsione: {} }).success).toBe(false);
  });
});

describe('scaletta del Percorso', () => {
  const scaletta = ordina(parse(readFileSync('contenuti/percorso.yml', 'utf8')).map((v: unknown) => schemaVocePercorso.parse(v)));

  it('ha i 10 Capitoli, con "Prova le Letture" solo nel 9 e nel 10', () => {
    expect(scaletta).toHaveLength(10);
    expect(scaletta.filter((v) => v.prova_letture).map((v) => [v.numero, v.prova_letture])).toEqual([
      [9, 'letture'],
      [10, 'avanzate'],
    ]);
  });

  it('usa slug senza numero', () => {
    for (const v of scaletta) expect(v.id).not.toMatch(/\d/);
  });

  it('ordina per numero e rifiuta buchi e id ripetuti', () => {
    expect(ordina([voce('b', 2), voce('a', 1)]).map((v) => v.id)).toEqual(['a', 'b']);
    expect(() => ordina([voce('a', 1), voce('c', 3)])).toThrow(/numero 2/);
    expect(() => ordina([voce('a', 1), voce('a', 2)])).toThrow(/stesso id/);
  });
});

describe('Capitolo precedente e successivo', () => {
  const percorso = [voce('a', 1), voce('b', 2), voce('c', 3)];

  it('il primo non ha precedente, l\'ultimo non ha successivo', () => {
    expect(vicini(percorso, 'a')).toEqual({ precedente: undefined, successivo: percorso[1] });
    expect(vicini(percorso, 'b')).toEqual({ precedente: percorso[0], successivo: percorso[2] });
    expect(vicini(percorso, 'c')).toEqual({ precedente: percorso[1], successivo: undefined });
  });
});

describe('ripiego sull\'italiano', () => {
  it('in inglese usa il file inglese, se c\'è', () => {
    expect(scegliTesto('en', 'it', 'en')).toEqual({ testo: 'en', lingua: 'en', ripiego: false });
  });
  it('in inglese, senza file inglese, mostra l\'italiano con un avviso', () => {
    expect(scegliTesto('en', 'it', undefined)).toEqual({ testo: 'it', lingua: 'it', ripiego: true });
  });
  it('in italiano non guarda mai l\'inglese', () => {
    expect(scegliTesto('it', 'it', 'en')).toEqual({ testo: 'it', lingua: 'it', ripiego: false });
    expect(scegliTesto('it', undefined, 'en')).toBeUndefined();
  });
  it('senza file è in preparazione', () => {
    expect(scegliTesto('en', undefined, undefined)).toBeUndefined();
  });
});

describe('file dei Capitoli', () => {
  const percorso = [voce('a', 1), voce('b', 2)];
  it('segnala un file che non è nel Percorso e un inglese senza italiano', () => {
    expect(controllaFile(percorso, ['a', 'z'], ['b'])).toEqual([
      'contenuti/capitoli/it/z.md: "z" non è nel Percorso',
      "contenuti/capitoli/en/b.md: manca l'originale italiano",
    ]);
    expect(controllaFile(percorso, ['a', 'b'], ['a'])).toEqual([]);
  });
});

describe('avvisi di traduzione', () => {
  const it_ = (giorno: string) => ({ revisione: { da: 'L', data: data(giorno) } });
  const en = (giorno: string) => ({ revisione: { da: 'L', data: data(giorno) }, tradotto_da: data(giorno) });

  it('avvisa se un Capitolo manca in inglese', () => {
    const avvisi = avvisiTraduzione(new Map([['a', it_('2026-11-06')]]), new Map());
    expect(avvisi).toEqual([{ file: 'contenuti/capitoli/it/a.md', messaggio: expect.stringContaining('manca in inglese') }]);
  });

  it('avvisa se l\'italiano è stato rivisto dopo la traduzione', () => {
    const avvisi = avvisiTraduzione(new Map([['a', it_('2026-11-10')]]), new Map([['a', en('2026-11-06')]]));
    expect(avvisi).toEqual([{ file: 'contenuti/capitoli/en/a.md', messaggio: expect.stringContaining('2026-11-06') }]);
  });

  it('tace se la traduzione parte dall\'ultima revisione italiana', () => {
    expect(avvisiTraduzione(new Map([['a', it_('2026-11-06')]]), new Map([['a', en('2026-11-06')]]))).toEqual([]);
  });
});

describe('blocchi abc', () => {
  it('diventano un pentagramma con il sorgente in un attributo, con i caratteri speciali protetti', () => {
    expect(htmlPentagramma('X:1\nK:C\n"<a>&b" C|\n')).toBe(
      '<div class="pentagramma" data-abc="X:1\nK:C\n&quot;&lt;a&gt;&amp;b&quot; C|"></div>',
    );
  });
  it('lasciano stare gli altri blocchi di codice', () => {
    expect(pentagrammi.code({ lang: 'js', value: 'x' })).toBeUndefined();
    expect(pentagrammi.code({ lang: 'abc', value: 'K:C\nC' })).toEqual({ type: 'html', value: htmlPentagramma('K:C\nC') });
  });
});
