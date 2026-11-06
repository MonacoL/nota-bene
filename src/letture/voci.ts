// Le Voci delle Letture, nell'ordine dell'elenco. Modulo a parte perché serve anche nel browser (filtro ?voce=),
// dove il catalogo, che legge il disco, non può andare.
export const VOCI = ['soprano', 'contralto', 'tenore', 'basso'] as const;
export type Voce = (typeof VOCI)[number];
