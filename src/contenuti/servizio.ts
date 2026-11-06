// Accesso alle pagine di servizio dalle pagine Astro (ticket #14): carica le collections e applica le regole
// di pagine.ts e revisori.ts, e prepara le sezioni generate dei crediti. Un errore fa fallire la build.
import { readFileSync } from 'node:fs';
import { getCollection, type CollectionEntry } from 'astro:content';
import { parse } from 'yaml';
import { assetDiTerzi, braniDeiCrediti, type Asset, type BranoDeiCrediti } from '../crediti';
import type { Lingua } from '../i18n';
import { capitoli } from './capitoli';
import { letture } from './letture';
import { controllaPagine, type PaginaServizio } from './pagine';
import { controllaRevisori, formulaRevisione } from './revisori';
import { schemaRevisori } from './schemi';

export type Pagina = CollectionEntry<'pagineIt'> | CollectionEntry<'pagineEn'>;

/** Il file Markdown di una pagina di servizio in una lingua. La build si ferma se ne manca uno, in qualunque lingua. */
export async function paginaServizio(lingua: Lingua, id: PaginaServizio): Promise<Pagina> {
  const it = await getCollection('pagineIt');
  const en = await getCollection('pagineEn');
  const errori = controllaPagine(it.map((p) => p.id), en.map((p) => p.id));
  if (errori.length) throw new Error(`Pagine di servizio non valide:\n${errori.join('\n')}`);
  return (lingua === 'it' ? it : en).find((p) => p.id === id)!;
}

/**
 * Le frasi su chi ha rivisto i Capitoli, da contenuti/revisori.yml. Vuoto finché nessuno ha dato il consenso scritto.
 */
export async function revisioni(lingua: Lingua): Promise<string[]> {
  const revisori = schemaRevisori.parse(parse(readFileSync('contenuti/revisori.yml', 'utf8')) ?? []);
  const percorso = await capitoli(lingua);
  const errori = controllaRevisori(revisori, percorso.map((c) => c.id));
  if (errori.length) throw new Error(errori.join('\n'));
  const titoli = new Map(percorso.map((c) => [c.id, c.titolo]));
  return revisori.map((r) => formulaRevisione(lingua, r.nome, r.capitoli.map((c) => titoli.get(c)!)));
}

/** Le due sezioni generate dei crediti: i Brani delle Letture pubblicate e gli asset di terzi. */
export async function crediti(): Promise<{ brani: BranoDeiCrediti[]; asset: Asset[] }> {
  const esito = assetDiTerzi('.');
  if (!esito.ok) throw new Error(`Asset di terzi senza crediti:\n${esito.errori.join('\n')}`);
  return { brani: braniDeiCrediti(await letture()), asset: esito.asset };
}
