// Esercizio "Riconosci il tempo" (Indicazioni metriche, #85): data un'Indicazione metrica, si dice il Tempo,
// binario/ternario/quaternario/quinario/misto e semplice/composto. Il numero sopra decide (vedi metrica.ts).
import { casuale } from './casuale';
import { metrica, nomeTempo, type Genere, type NomeIndicazione, type NumeroTempo } from './metrica';
import type { Testi } from './testi';

export type Parametri = { indicazioni: NomeIndicazione[] };

export type Esercizio = { tipo: 'riconosci-il-tempo'; indicazione: NomeIndicazione };

export type Risposta = { numero: NumeroTempo; genere: Genere };

export function genera(parametri: Parametri, seed: number): Esercizio {
  return { tipo: 'riconosci-il-tempo', indicazione: casuale(seed).scegli(parametri.indicazioni) };
}

export function valuta(es: Esercizio, risposta: Risposta) {
  const m = metrica(es.indicazione);
  const giusto = risposta.numero === m.numero && risposta.genere === m.genere;
  const tempo = nomeTempo(m.numero, m.genere);
  const spiegazione: Testi =
    m.genere === 'semplice'
      ? {
          it: `Il ${m.sopra} sopra è uno dei numeri dei tempi semplici (2, 3, 4, 5, 7) e conta le pulsazioni: ${m.pulsazioni} pulsazioni, ognuna divisa in 2 suddivisioni. È un tempo ${tempo.it}.`,
          en: `The top ${m.sopra} is one of the simple-meter numbers (2, 3, 4, 5, 7) and counts the beats: ${m.pulsazioni} beats, each divided into 2 subdivisions. It is ${tempo.en} meter.`,
        }
      : {
          it: `Il ${m.sopra} sopra è uno dei numeri dei tempi composti (6, 9, 12, 15, 21) e conta le suddivisioni: ${m.sopra} suddivisioni a gruppi di 3 fanno ${m.pulsazioni} pulsazioni. È un tempo ${tempo.it}.`,
          en: `The top ${m.sopra} is one of the compound-meter numbers (6, 9, 12, 15, 21) and counts the subdivisions: ${m.sopra} subdivisions in groups of 3 make ${m.pulsazioni} beats. It is ${tempo.en} meter.`,
        };
  return {
    esito: giusto ? ('giusto' as const) : ('sbagliato' as const),
    data: nomeTempo(risposta.numero, risposta.genere),
    giusta: tempo,
    spiegazione,
  };
}
