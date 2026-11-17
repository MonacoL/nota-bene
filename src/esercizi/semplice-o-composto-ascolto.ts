// Esercizio pratico "Semplice o composto all'ascolto" (Tempi semplici e composti, #86): un brano per pianoforte,
// senza spartito; il corista dice se il tempo è semplice o composto. I brani veri arrivano con #87 (brani.ts).
import { branoDiProva, BRANI_DI_PROVA, type Brano, type IndicazioneBrano } from './brani';
import { casuale } from './casuale';
import { metrica, nomeGenere, type Genere } from './metrica';
import type { Testi } from './testi';

export type Parametri = { importanza: number; indicazioni?: IndicazioneBrano[] };

export type Esercizio = { tipo: 'semplice-o-composto-ascolto'; brano: Brano };

export type Risposta = { genere: Genere };

export function genera(parametri: Parametri, seed: number): Esercizio {
  const caso = casuale(seed);
  return { tipo: 'semplice-o-composto-ascolto', brano: branoDiProva(caso.scegli(parametri.indicazioni ?? BRANI_DI_PROVA), caso) };
}

export function valuta(es: Esercizio, risposta: Risposta) {
  const m = metrica(es.brano.indicazione);
  const giusto = risposta.genere === m.genere;
  const parti = m.genere === 'semplice' ? 2 : 3;
  const spiegazione: Testi = {
    it: `Il brano era in ${es.brano.indicazione}: ogni pulsazione si divide in ${parti}, e il tempo è ${m.genere}.`,
    en: `The piece was in ${es.brano.indicazione}: each beat divides into ${parti}, so the meter is ${nomeGenere(m.genere).en}.`,
  };
  return {
    esito: giusto ? ('giusto' as const) : ('sbagliato' as const),
    data: nomeGenere(risposta.genere),
    giusta: nomeGenere(m.genere),
    spiegazione,
  };
}
