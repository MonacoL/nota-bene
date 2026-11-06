// Pagine che il sito linka ma che arrivano in ticket successivi (pagine di servizio).
// Finché una pagina è qui, il sito ne mostra una versione "in preparazione": quando arriva quella vera, si toglie da qui.
export const PROVVISORIE = ['privacy', 'intelligenza-artificiale', 'crediti', 'contatti'] as const;
export type Provvisoria = (typeof PROVVISORIE)[number];
