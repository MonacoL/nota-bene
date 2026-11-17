// Esercizio pratico "Semplice o composto" (Pulsazione e suddivisione, #86): un battito di mani sintetizzato, forte
// sulla pulsazione e debole sulle suddivisioni; il corista dice se la pulsazione si divide in due o in tre.
import { casuale } from './casuale';
import { nomeGenere, type Genere } from './metrica';
import type { Testi } from './testi';

export type Parametri = { importanza: number };

/** Un colpo di mani: quando, in secondi, e se è quello forte della pulsazione. */
export type Battito = { inizio: number; forte: boolean };

export type Esercizio = { tipo: 'semplice-o-composto'; genere: Genere; battiti: Battito[] };

export type Risposta = { genere: Genere };

const PULSAZIONI = 8;

export function genera(_parametri: Parametri, seed: number): Esercizio {
  const caso = casuale(seed);
  const genere = caso.scegli(['semplice', 'composto'] as const);
  const perPulsazione = genere === 'semplice' ? 2 : 3;
  // Una pulsazione fra 0,55 e 0,9 secondi: da 67 a 109 battiti al minuto.
  const passo = (0.55 + caso.intero(8) * 0.05) / perPulsazione;
  const battiti = Array.from({ length: PULSAZIONI * perPulsazione }, (_, i) => ({ inizio: i * passo, forte: i % perPulsazione === 0 }));
  return { tipo: 'semplice-o-composto', genere, battiti };
}

export function valuta(es: Esercizio, risposta: Risposta) {
  const giusto = risposta.genere === es.genere;
  const deboli = es.genere === 'semplice' ? 1 : 2;
  const spiegazione: Testi = {
    it: `Dopo ogni battito forte ${deboli === 1 ? 'ne veniva 1 debole' : `ne venivano ${deboli} deboli`}: la pulsazione si divide in ${deboli + 1}, e il tempo è ${es.genere}.`,
    en: `Each strong clap was followed by ${deboli} weak ${deboli === 1 ? 'one' : 'ones'}: the beat divides into ${deboli + 1}, so the meter is ${nomeGenere(es.genere).en}.`,
  };
  return {
    esito: giusto ? ('giusto' as const) : ('sbagliato' as const),
    data: nomeGenere(risposta.genere),
    giusta: nomeGenere(es.genere),
    spiegazione,
  };
}
