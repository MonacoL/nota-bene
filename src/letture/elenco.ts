// Elenco delle Letture e Lettura successiva (ticket #32, decisioni nel #16): due blocchi, Letture e Letture
// avanzate, ordinati per Brano, poi Voce, poi Battuta di inizio, con il filtro facoltativo per Voce.
// Le Letture ritirate restano nel catalogo (ADR-0003) ma non si elencano.
import { VOCI, type Lettura, type Voce } from './catalogo';

export type Blocchi = Record<Lettura['blocco'], Lettura[]>;

const confronta = (a: Lettura, b: Lettura) =>
  a.brano.localeCompare(b.brano, 'it') || VOCI.indexOf(a.voce) - VOCI.indexOf(b.voce) || a.battute.inizio - b.battute.inizio;

export function elenco(letture: readonly Lettura[], voce?: Voce): Blocchi {
  const elencate = letture
    .filter((l) => l.stato === 'pubblicata' && (!voce || l.voce === voce))
    .sort(confronta);
  return {
    normale: elencate.filter((l) => l.blocco === 'normale'),
    avanzata: elencate.filter((l) => l.blocco === 'avanzata'),
  };
}

/**
 * La Lettura che viene dopo `id` nel suo blocco, con lo stesso filtro per Voce; dopo l'ultima si ricomincia dalla
 * prima. Se il filtro esclude la Lettura di partenza, è la prima di quella Voce che la segue nell'ordine.
 * Nessuna, se il blocco non ha Letture della Voce scelta.
 */
export function successiva(letture: readonly Lettura[], id: string, voce?: Voce): Lettura | undefined {
  const corrente = letture.find((l) => l.id === id);
  if (!corrente) return undefined;
  const blocco = elenco(letture, voce)[corrente.blocco];
  return blocco.find((l) => confronta(l, corrente) > 0) ?? blocco[0];
}
