// Numeri casuali ripetibili: lo stesso seed dà sempre lo stesso Esercizio (mulberry32).

export type Casuale = {
  /** Un intero fra 0 compreso e n escluso. */
  intero(n: number): number;
  scegli<T>(valori: readonly T[]): T;
};

export function casuale(seed: number): Casuale {
  let stato = seed >>> 0;
  const prossimo = () => {
    stato = (stato + 0x6d2b79f5) >>> 0;
    let t = stato;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const intero = (n: number) => Math.floor(prossimo() * n);
  return { intero, scegli: (valori) => valori[intero(valori.length)]! };
}
