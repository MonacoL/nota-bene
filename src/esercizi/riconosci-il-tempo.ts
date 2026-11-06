// Esercizio "Riconosci il tempo" (Capitolo 4): due Battute di ritmo senza il Tempo scritto; scelta multipla fra i
// Tempi, semplici e composti. Ogni Figura sta in una Pulsazione e le crome si raggruppano per Pulsazione, così
// si distinguono 3/4 (crome a 2) e 6/8 (crome a 3). Il 2/2 non c'è: sulla carta coincide con il 4/4.
import { casuale } from './casuale';
import { abcBattute, durataBattuta, pulsazione, RIEMPIMENTI, semplice, tempo, type NomeTempo } from './ritmo';
import type { Testi } from './testi';

export type Parametri = { tempi: NomeTempo[] };

export type Esercizio = {
  tipo: 'riconosci-il-tempo';
  tempo: NomeTempo;
  /** Le due Battute, a gruppi per Pulsazione, in semicrome. */
  battute: number[][][];
  /** I Tempi fra cui si sceglie. */
  scelte: NomeTempo[];
  abc: string;
};

export type Risposta = { tempo: NomeTempo };

export function genera(parametri: Parametri, seed: number): Esercizio {
  const caso = casuale(seed);
  const nome = caso.scegli(parametri.tempi);
  const t = tempo(nome);
  const p = pulsazione(t) as 4 | 6;
  const battute = [0, 1].map(() => Array.from({ length: durataBattuta(t) / p }, () => caso.scegli(RIEMPIMENTI[p])));
  return { tipo: 'riconosci-il-tempo', tempo: nome, battute, scelte: [...parametri.tempi], abc: abcBattute(undefined, battute, { aCapo: true }) };
}

export function valuta(es: Esercizio, risposta: Risposta) {
  const t = tempo(es.tempo);
  const giusto = risposta.tempo === es.tempo;
  const quante = durataBattuta(t) / pulsazione(t);
  const s = semplice(t);
  const pulsazioni = { it: quante === 1 ? 'pulsazione' : 'pulsazioni', en: quante === 1 ? 'beat' : 'beats' };
  const figura = s ? { it: 'semiminima', en: 'a quarter note' } : { it: 'semiminima col punto', en: 'a dotted quarter note' };
  const gruppi = s ? 2 : 3;
  const genere = s ? { it: 'semplice', en: 'simple' } : { it: 'composto', en: 'compound' };
  const spiegazione: Testi = {
    it: `Ogni battuta ha ${quante} ${pulsazioni.it} di ${figura.it}, e le crome vanno a gruppi di ${gruppi}: è un tempo ${genere.it}, ${es.tempo}.`,
    en: `Each measure has ${quante} ${pulsazioni.en} of ${figura.en}, and the eighth notes go in groups of ${gruppi}: it is ${genere.en} time, ${es.tempo}.`,
  };
  const dato = tempo(risposta.tempo);
  // La trappola: un Tempo che dura lo stesso ma si conta in un altro modo (3/4 e 6/8).
  if (!giusto && durataBattuta(dato) === durataBattuta(t) && semplice(dato) !== s) {
    const suoi = semplice(dato) ? 2 : 3;
    spiegazione.it += ` Il ${risposta.tempo} dura lo stesso, ma le sue crome andrebbero a gruppi di ${suoi}.`;
    spiegazione.en += ` ${risposta.tempo} lasts the same, but its eighth notes would go in groups of ${suoi}.`;
  }
  return {
    esito: giusto ? ('giusto' as const) : ('sbagliato' as const),
    data: { it: risposta.tempo, en: risposta.tempo },
    giusta: { it: es.tempo, en: es.tempo },
    spiegazione,
  };
}
