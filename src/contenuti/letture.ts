// Accesso alle Letture dalle pagine: il catalogo (src/letture/catalogo.ts) sulla cartella letture/,
// con i Capitoli del Percorso per i Prerequisiti. Un catalogo non valido fa fallire la build.
// NOTA_BENE_LETTURE sceglie un'altra cartella: la usa la build d'esempio degli e2e (astro.config.mjs).
import { catalogo, type Lettura } from '../letture/catalogo';
import { capitoli } from './capitoli';

let caricate: Lettura[] | undefined;

export async function letture(): Promise<Lettura[]> {
  if (caricate) return caricate;
  const esito = catalogo(process.env.NOTA_BENE_LETTURE ?? 'letture', { capitoli: (await capitoli('it')).map((c) => c.id) });
  if (!esito.ok) {
    throw new Error(`Catalogo delle Letture non valido:\n${esito.errori.map((e) => `${e.lettura} [${e.regola}] ${e.messaggio}`).join('\n')}`);
  }
  caricate = esito.letture;
  return caricate;
}
