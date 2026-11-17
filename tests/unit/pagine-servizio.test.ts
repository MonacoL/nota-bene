// Pagine di servizio (ADR-0006, ticket #14): quattro pagine in Markdown per lingua, senza ripiego sull'italiano.
import { describe, expect, it } from 'vitest';
import { controllaPagine } from '../../src/contenuti/pagine';
import { avvisiTraduzione } from '../../src/contenuti/percorso';
import { schemaPaginaEn, schemaPaginaIt } from '../../src/contenuti/schemi';

describe('frontmatter delle pagine di servizio', () => {
  const revisione = { da: 'Luca Monaco', data: '2026-11-06' };

  it("chiede la revisione umana e la data dell'ultimo aggiornamento", () => {
    expect(schemaPaginaIt.safeParse({ revisione, aggiornata: '2026-11-06' }).success).toBe(true);
    expect(schemaPaginaIt.safeParse({ aggiornata: '2026-11-06' }).success).toBe(false);
    expect(schemaPaginaIt.safeParse({ revisione: { da: ' ', data: '2026-11-06' }, aggiornata: '2026-11-06' }).success).toBe(false);
    expect(schemaPaginaIt.safeParse({ revisione }).success).toBe(false);
  });

  it('in inglese chiede anche da quale revisione italiana è tradotta', () => {
    expect(schemaPaginaEn.safeParse({ revisione, aggiornata: '2026-11-06' }).success).toBe(false);
    expect(schemaPaginaEn.safeParse({ revisione, aggiornata: '2026-11-06', tradotto_da: '2026-11-06' }).success).toBe(true);
  });

  it('rifiuta i campi sconosciuti', () => {
    expect(schemaPaginaIt.safeParse({ revisione, aggiornata: '2026-11-06', revsione: {} }).success).toBe(false);
  });
});

describe('avvisi di traduzione delle pagine di servizio', () => {
  const it_ = (giorno: string) => ({ revisione: { da: 'L', data: new Date(giorno) } });
  const en = (giorno: string) => ({ revisione: { da: 'L', data: new Date(giorno) }, tradotto_da: new Date(giorno) });

  it("avvisa, come per i Capitoli, se l'italiano è stato rivisto dopo la traduzione", () => {
    const avvisi = avvisiTraduzione(new Map([['privacy', it_('2026-11-10')]]), new Map([['privacy', en('2026-11-06')]]), 'pagine');
    expect(avvisi).toEqual([{ file: 'contenuti/pagine/en/privacy.md', messaggio: expect.stringContaining('traduzione indietro') }]);
  });

  it("non avvisa di una pagina che manca in inglese: quella è un errore che blocca la build", () => {
    expect(avvisiTraduzione(new Map([['privacy', it_('2026-11-06')]]), new Map(), 'pagine')).toEqual([]);
  });
});

const TUTTE = ['privacy', 'intelligenza-artificiale', 'crediti', 'contatti'];
/** In italiano ci sono anche le pagine guida (#84), che in inglese possono mancare. */
const IT = [...TUTTE, 'come-si-studia'];

describe('controllaPagine', () => {
  it('accetta le quattro pagine in tutte e due le lingue, e la pagina guida in italiano', () => {
    expect(controllaPagine(IT, TUTTE)).toEqual([]);
    expect(controllaPagine(IT, [...TUTTE, 'come-si-studia'])).toEqual([]);
  });

  it("blocca una pagina che manca in inglese: le pagine di servizio non ripiegano sull'italiano", () => {
    expect(controllaPagine(IT, ['privacy', 'crediti', 'contatti'])).toEqual([
      "contenuti/pagine/en/intelligenza-artificiale.md: manca, e le pagine di servizio non ripiegano sull'italiano",
    ]);
  });

  it('blocca una pagina che manca in italiano, compresa la pagina guida', () => {
    expect(controllaPagine(['privacy', 'crediti', 'contatti'], TUTTE)).toEqual([
      'contenuti/pagine/it/intelligenza-artificiale.md: manca',
      'contenuti/pagine/it/come-si-studia.md: manca',
    ]);
  });

  it('blocca un file che non è una pagina di servizio né una pagina guida', () => {
    expect(controllaPagine([...IT, 'chi-siamo'], TUTTE)).toEqual([
      'contenuti/pagine/it/chi-siamo.md: "chi-siamo" non è una pagina di servizio (privacy, intelligenza-artificiale, crediti, contatti) né una pagina guida (come-si-studia)',
    ]);
  });
});
