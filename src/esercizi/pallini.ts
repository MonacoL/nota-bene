// Esercizio pratico "I pallini" (Tempi semplici e composti, #86): mentre suona un brano si vede la battuta come una
// fila di pallini, grandi per le pulsazioni e piccoli per le suddivisioni (il grande è anche la prima suddivisione).
// Il corista dice il tempo: binario … misto e semplice o composto.
import { branoDiProva, BRANI_DI_PROVA, type Brano, type IndicazioneBrano } from './brani';
import { casuale } from './casuale';
import { metrica, nomeTempo, type Genere, type NumeroTempo } from './metrica';
import type { Testi } from './testi';

export type Parametri = { importanza: 1 | 2 | 3; indicazioni?: IndicazioneBrano[] };

export type Esercizio = { tipo: 'pallini'; brano: Brano };

export type Risposta = { numero: NumeroTempo; genere: Genere };

export function genera(parametri: Parametri, seed: number): Esercizio {
  const caso = casuale(seed);
  return { tipo: 'pallini', brano: branoDiProva(caso.scegli(parametri.indicazioni ?? BRANI_DI_PROVA), caso) };
}

export function valuta(es: Esercizio, risposta: Risposta) {
  const m = metrica(es.brano.indicazione);
  const giusto = risposta.numero === m.numero && risposta.genere === m.genere;
  const tempo = nomeTempo(m.numero, m.genere);
  const spiegazione: Testi = {
    it: `Ogni battuta ha ${m.pulsazioni} pallini grandi, cioè ${m.pulsazioni} pulsazioni, e ognuno apre un gruppo di ${m.perPulsazione} pallini: è un tempo ${tempo.it}.`,
    en: `Each measure has ${m.pulsazioni} big dots, that is ${m.pulsazioni} beats, and each one starts a group of ${m.perPulsazione} dots: it is ${tempo.en} meter.`,
  };
  return {
    esito: giusto ? ('giusto' as const) : ('sbagliato' as const),
    data: nomeTempo(risposta.numero, risposta.genere),
    giusta: tempo,
    spiegazione,
  };
}
