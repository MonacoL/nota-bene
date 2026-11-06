// Pagine di servizio (ADR-0006, ticket #14): quattro pagine in Markdown per lingua, senza ripiego sull'italiano.
import { describe, expect, it } from 'vitest';
import { controllaPagine } from '../../src/contenuti/pagine';
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

const TUTTE = ['privacy', 'intelligenza-artificiale', 'crediti', 'contatti'];

describe('controllaPagine', () => {
  it('accetta le quattro pagine in tutte e due le lingue', () => {
    expect(controllaPagine(TUTTE, TUTTE)).toEqual([]);
  });

  it("blocca una pagina che manca in inglese: le pagine di servizio non ripiegano sull'italiano", () => {
    expect(controllaPagine(TUTTE, ['privacy', 'crediti', 'contatti'])).toEqual([
      "contenuti/pagine/en/intelligenza-artificiale.md: manca, e le pagine di servizio non ripiegano sull'italiano",
    ]);
  });

  it('blocca una pagina che manca in italiano', () => {
    expect(controllaPagine(['privacy', 'crediti', 'contatti'], TUTTE)).toEqual([
      'contenuti/pagine/it/intelligenza-artificiale.md: manca',
    ]);
  });

  it('blocca un file che non è una pagina di servizio', () => {
    expect(controllaPagine([...TUTTE, 'chi-siamo'], TUTTE)).toEqual([
      'contenuti/pagine/it/chi-siamo.md: "chi-siamo" non è una pagina di servizio (privacy, intelligenza-artificiale, crediti, contatti)',
    ]);
  });
});
