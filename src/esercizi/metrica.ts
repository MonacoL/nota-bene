// Le Indicazioni metriche e il loro Tempo (Capitolo "Indicazioni metriche", #85, ADR-0012). Decide il numero sopra:
// 2 3 4 5 7 nei Tempi semplici, dove conta le Pulsazioni; 6 9 12 15 21 nei composti, dove conta le Suddivisioni.
// Il numero sotto dà la Figura della Pulsazione (semplici) o della Suddivisione (composti). Durate in semicrome.
import type { Testi } from './testi';

export const INDICAZIONI = ['2/2', '2/4', '3/4', '4/4', '5/4', '7/4', '3/8', '6/4', '6/8', '9/8', '12/8', '15/8', '21/8'] as const;
export type NomeIndicazione = (typeof INDICAZIONI)[number];

export const NUMERI_TEMPO = ['binario', 'ternario', 'quaternario', 'quinario', 'misto'] as const;
export type NumeroTempo = (typeof NUMERI_TEMPO)[number];
export const GENERI = ['semplice', 'composto'] as const;
export type Genere = (typeof GENERI)[number];

const SEMPLICI = [2, 3, 4, 5, 7];
const COMPOSTI = [6, 9, 12, 15, 21];

const PER_PULSAZIONI: Record<number, NumeroTempo> = { 2: 'binario', 3: 'ternario', 4: 'quaternario', 5: 'quinario', 7: 'misto' };

/** Nomi inglesi dal glossario: "compound duple". Il misto a 7 Pulsazioni è "septuple" (da confermare, #85). */
const NUMERI_EN: Record<NumeroTempo, string> = { binario: 'duple', ternario: 'triple', quaternario: 'quadruple', quinario: 'quintuple', misto: 'septuple' };
const GENERI_EN: Record<Genere, string> = { semplice: 'simple', composto: 'compound' };

export type Metrica = {
  sopra: number;
  sotto: number;
  genere: Genere;
  pulsazioni: number;
  numero: NumeroTempo;
  /** In semicrome. */
  suddivisione: number;
  pulsazione: number;
  battuta: number;
};

export function metrica(nome: NomeIndicazione): Metrica {
  const [sopra, sotto] = nome.split('/').map(Number) as [number, number];
  const figuraSotto = 16 / sotto;
  if (SEMPLICI.includes(sopra)) {
    return { sopra, sotto, genere: 'semplice', pulsazioni: sopra, numero: PER_PULSAZIONI[sopra]!, suddivisione: figuraSotto / 2, pulsazione: figuraSotto, battuta: sopra * figuraSotto };
  }
  if (!COMPOSTI.includes(sopra)) throw new Error(`Indicazione metrica senza Tempo tradizionale: ${nome}`);
  const pulsazioni = sopra / 3;
  return { sopra, sotto, genere: 'composto', pulsazioni, numero: PER_PULSAZIONI[pulsazioni]!, suddivisione: figuraSotto, pulsazione: 3 * figuraSotto, battuta: sopra * figuraSotto };
}

/** "binario composto" / "compound duple". */
export function nomeTempo(numero: NumeroTempo, genere: Genere): Testi {
  return { it: `${numero} ${genere}`, en: `${GENERI_EN[genere]} ${NUMERI_EN[numero]}` };
}
