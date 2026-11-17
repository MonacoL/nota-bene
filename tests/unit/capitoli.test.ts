// Regole del Percorso e dei Capitoli: schema del frontmatter, ordine, ripiego sull'italiano, avvisi di traduzione.
import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { avvisiTraduzione, controllaFile, mancanti, ordina, prerequisitiEffettivi, prossimoPasso, scegliTesto, vicini } from '../../src/contenuti/percorso';
import { schemaCapitoloEn, schemaCapitoloIt, schemaVocePercorso, type VocePercorso } from '../../src/contenuti/schemi';
import { htmlPentagramma, pentagrammi } from '../../src/markdown/pentagrammi';

const data = (s: string) => new Date(`${s}T00:00:00Z`);

function voce(id: string, numero: number, prerequisiti: string[] = [], percorso: VocePercorso['percorso'] = 'melodico'): VocePercorso {
  return { id, numero, percorso, prerequisiti, it: { titolo: id, riga: id }, en: { titolo: id, riga: id } };
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

  describe('Esercizi dichiarati', () => {
    const revisione = { da: 'Luca Monaco', data: '2026-11-06' };
    const conEsercizi = (esercizi: unknown) => schemaCapitoloIt.safeParse({ revisione, esercizi }).success;

    it('accetta un tipo con le Chiavi ammesse, e un Capitolo senza Esercizi', () => {
      expect(conEsercizi([{ tipo: 'nomina-la-nota', chiavi: ['violino'] }])).toBe(true);
      expect(conEsercizi([{ tipo: 'nomina-la-nota', chiavi: ['violino', 'violino-ottava-bassa', 'basso'] }])).toBe(true);
      expect(schemaCapitoloIt.safeParse({ revisione }).success).toBe(true);
    });

    it('rifiuta tipi e Chiavi sconosciuti, Chiavi mancanti, campi in più e un tipo dichiarato due volte', () => {
      expect(conEsercizi([{ tipo: 'nomina-la-sillaba-x', chiavi: ['violino'] }])).toBe(false);
      expect(conEsercizi([{ tipo: 'nomina-la-nota', chiavi: ['do'] }])).toBe(false);
      expect(conEsercizi([{ tipo: 'nomina-la-nota', chiavi: [] }])).toBe(false);
      expect(conEsercizi([{ tipo: 'nomina-la-nota', chiavi: ['violino'], chiave: 'basso' }])).toBe(false);
      expect(conEsercizi([])).toBe(false);
      expect(conEsercizi([
        { tipo: 'nomina-la-nota', chiavi: ['violino'] },
        { tipo: 'nomina-la-nota', chiavi: ['basso'] },
      ])).toBe(false);
    });

    it('si dichiarano solo in italiano: il Capitolo inglese usa quelli dell\'originale', () => {
      const esercizi = [{ tipo: 'nomina-la-nota', chiavi: ['violino'] }];
      expect(schemaCapitoloEn.safeParse({ revisione, tradotto_da: '2026-11-06', esercizi }).success).toBe(false);
    });
  });

  it('rifiuta i campi sconosciuti, così un errore di battitura non passa inosservato', () => {
    expect(schemaCapitoloIt.safeParse({ revisione: { da: 'L', data: '2026-11-06' }, revsione: {} }).success).toBe(false);
  });
});

describe('scaletta del Percorso', () => {
  const scaletta = ordina(parse(readFileSync('contenuti/percorso.yml', 'utf8')).map((v: unknown) => schemaVocePercorso.parse(v)));

  it('ha i 16 Capitoli, con "Prova le letture" solo nel 13 e nel 16', () => {
    expect(scaletta).toHaveLength(16);
    expect(scaletta.filter((v) => v.prova_letture).map((v) => [v.numero, v.prova_letture])).toEqual([
      [13, 'letture'],
      [16, 'avanzate'],
    ]);
  });

  it('chi entra in Scaletta senza Progressi non trova bloccato Figure e pause, che è il prossimo passo (#84)', () => {
    const conFile = scaletta.map((v) => ({ ...v, inPreparazione: !existsSync(`contenuti/capitoli/it/${v.id}.md`) }));
    const effettivi = conFile.map((v) => ({ ...v, prerequisiti: prerequisitiEffettivi(v.prerequisiti, conFile) }));
    expect(prossimoPasso(effettivi, new Set())).toBe('figure-e-pause');
    expect(effettivi.find((v) => v.id === 'do-mobile')!.prerequisiti).toEqual([
      'figure-e-pause', 'tempi-semplici-e-composti', 'chiavi', 'modo-maggiore-e-minore',
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

  it('rifiuta un Prerequisito che non è un Capitolo', () => {
    expect(() => ordina([voce('a', 1), voce('b', 2, ['zeta'])])).toThrow(/"b".*"zeta", che non è un Capitolo/);
  });

  it('rifiuta un Capitolo che nella Scaletta viene prima di un suo Prerequisito, e quindi anche i cicli', () => {
    expect(() => ordina([voce('a', 1, ['b']), voce('b', 2)])).toThrow(/"a".*"b", che nella Scaletta viene dopo/);
    expect(() => ordina([voce('a', 1, ['b']), voce('b', 2, ['a'])])).toThrow(/viene dopo/);
    expect(() => ordina([voce('a', 1, ['a'])])).toThrow(/viene dopo/);
    expect(ordina([voce('a', 1), voce('b', 2, ['a'], 'ritmico')]).map((v) => v.id)).toEqual(['a', 'b']);
  });
});

describe('Prerequisiti mancanti e prossimo passo', () => {
  // a e b senza Prerequisiti; c richiede a e b; d richiede c.
  const scaletta = [voce('a', 1), voce('b', 2, [], 'ritmico'), voce('c', 3, ['a', 'b']), voce('d', 4, ['c'])];

  it('i Prerequisiti mancanti sono quelli non completati, nell\'ordine in cui sono scritti', () => {
    expect(mancanti(['a', 'b'], new Set())).toEqual(['a', 'b']);
    expect(mancanti(['a', 'b'], new Set(['b']))).toEqual(['a']);
    expect(mancanti(['a', 'b'], new Set(['a', 'b']))).toEqual([]);
    expect(mancanti([], new Set())).toEqual([]);
  });

  it('il prossimo passo è il primo Capitolo della Scaletta non completato e con i Prerequisiti completati', () => {
    expect(prossimoPasso(scaletta, new Set())).toBe('a');
    expect(prossimoPasso(scaletta, new Set(['a']))).toBe('b');
    // Fuori ordine: b fatto prima di a. Il prossimo passo resta a, il primo della Scaletta.
    expect(prossimoPasso(scaletta, new Set(['b']))).toBe('a');
    expect(prossimoPasso(scaletta, new Set(['a', 'b']))).toBe('c');
    // d segnato come già studiato senza c: il prossimo passo è c.
    expect(prossimoPasso(scaletta, new Set(['a', 'b', 'd']))).toBe('c');
    expect(prossimoPasso(scaletta, new Set(['a', 'b', 'c', 'd']))).toBeUndefined();
  });
});

describe('Capitoli in preparazione nella Scaletta', () => {
  // La Scaletta di #84, con i Capitoli senza testo segnati: un Prerequisito in preparazione non blocca, e al suo
  // posto contano i suoi Prerequisiti, a catena.
  const p = (id: string, prerequisiti: string[] = [], inPreparazione = false) => ({ id, prerequisiti, inPreparazione });
  const scaletta = [
    p('pulsazione', [], true),
    p('unisono', [], true),
    p('figure', ['pulsazione']),
    p('scala-cantata', ['unisono'], true),
    p('tempi', ['pulsazione']),
    p('do-e-sol', ['scala-cantata'], true),
    p('indicazioni', ['figure', 'tempi'], true),
    p('note', ['scala-cantata']),
    p('chiavi', ['note']),
    p('maggiore', ['note']),
    p('minore', ['maggiore']),
    p('modo', ['minore']),
    p('do-mobile', ['do-e-sol', 'indicazioni', 'chiavi', 'modo']),
  ];

  it('un Prerequisito in preparazione lascia il posto ai suoi Prerequisiti, a catena', () => {
    expect(prerequisitiEffettivi(['do-e-sol', 'indicazioni', 'chiavi', 'modo'], scaletta)).toEqual(['figure', 'tempi', 'chiavi', 'modo']);
    expect(prerequisitiEffettivi(['pulsazione'], scaletta)).toEqual([]);
    expect(prerequisitiEffettivi(['chiavi', 'modo'], scaletta)).toEqual(['chiavi', 'modo']);
  });

  it('un Prerequisito ereditato due volte compare una volta sola, al primo posto in cui arriva', () => {
    expect(prerequisitiEffettivi(['figure', 'indicazioni'], scaletta)).toEqual(['figure', 'tempi']);
    expect(prerequisitiEffettivi(['indicazioni', 'tempi', 'figure'], scaletta)).toEqual(['figure', 'tempi']);
  });

  it('il prossimo passo salta i Capitoli in preparazione e ne eredita i Prerequisiti', () => {
    const conEffettivi = scaletta.map((c) => ({ ...c, prerequisiti: prerequisitiEffettivi(c.prerequisiti, scaletta) }));
    expect(prossimoPasso(conEffettivi, new Set())).toBe('figure');
    expect(prossimoPasso(conEffettivi, new Set(['figure']))).toBe('tempi');
    expect(prossimoPasso(conEffettivi, new Set(['figure', 'tempi']))).toBe('note');
    expect(prossimoPasso(conEffettivi, new Set(['figure', 'tempi', 'note', 'chiavi', 'maggiore', 'minore', 'modo']))).toBe('do-mobile');
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
