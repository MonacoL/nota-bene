// "Batti la pulsazione" (Pulsazione e suddivisione, #86): il punteggio dei tocchi del corista. Non conta per il
// Capitolo completato (ADR-0012). I tocchi arrivano già corretti per la latenza dell'audio, in secondi dall'inizio.

/**
 * Entro quanto un tocco è in tempo: 100 ms, largo, perché il tocco sullo schermo e le cuffie bluetooth aggiungono
 * ritardi che il browser non dice. Da tarare provando su un telefono vero.
 */
export const FINESTRA = 0.1;

export type Tocco = { scarto: number; esito: 'in tempo' | 'in anticipo' | 'in ritardo' | 'doppio' };

export function valutaBattiti(tocchi: readonly number[], pulsazioni: readonly number[], finestra = FINESTRA) {
  const prese = new Set<number>();
  const risultato: Tocco[] = tocchi.map((t) => {
    let vicina = 0;
    for (let i = 1; i < pulsazioni.length; i++) if (Math.abs(pulsazioni[i]! - t) < Math.abs(pulsazioni[vicina]! - t)) vicina = i;
    const scarto = t - pulsazioni[vicina]!;
    if (prese.has(vicina)) return { scarto, esito: 'doppio' as const };
    prese.add(vicina);
    if (Math.abs(scarto) <= finestra) return { scarto, esito: 'in tempo' as const };
    return { scarto, esito: scarto < 0 ? ('in anticipo' as const) : ('in ritardo' as const) };
  });
  return { tocchi: risultato, inTempo: risultato.filter((r) => r.esito === 'in tempo').length, mancate: pulsazioni.length - prese.size };
}
