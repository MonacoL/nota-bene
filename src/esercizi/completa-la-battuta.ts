// Esercizio "Completa la battuta" (Capitoli 3 e 4): una Battuta a cui manca la fine; si aggiungono Figure dalla
// tavolozza (semibreve, minima, semiminima, croma, più il punto) e conta la somma (ticket "Interazione negli Esercizi
// di teoria da telefono").
import { casuale } from './casuale';
import { abcBattute, durata, durataBattuta, figura, inCrome, nomeFigura, pulsazione, RIEMPIMENTI, semplice, tempo, type Figura, type NomeTempo } from './ritmo';
import type { Testi } from './testi';

export type Parametri = { tempi: NomeTempo[] };

export type Esercizio = {
  tipo: 'completa-la-battuta';
  tempo: NomeTempo;
  /** Le Figure scritte, a gruppi per Pulsazione, in semicrome. */
  scritte: number[][];
  /** Quanto manca alla fine della Battuta, in semicrome. */
  mancano: number;
  abc: string;
};

export type Risposta = { figure: Figura[] };

export function genera(parametri: Parametri, seed: number): Esercizio {
  const caso = casuale(seed);
  const nome = caso.scegli(parametri.tempi);
  const t = tempo(nome);
  const battuta = durataBattuta(t);
  const p = pulsazione(t);
  // Manca una croma, una o due Pulsazioni, o un pezzo di Pulsazione nei composti; mai più di metà Battuta.
  const possibili = (semplice(t) ? [2, 4, 8] : [2, 4, 6, 12]).filter((m) => m <= battuta / 2);
  const mancano = caso.scegli(possibili);
  const scritte: number[][] = [];
  const intere = Math.floor((battuta - mancano) / p);
  for (let i = 0; i < intere; i++) {
    // Due Pulsazioni da un battito forte possono diventare una sola Figura: minima, o minima col punto.
    if (i % 2 === 0 && i + 1 < intere && caso.intero(3) === 0) {
      scritte.push([2 * p]);
      i++;
    } else {
      scritte.push(caso.scegli(RIEMPIMENTI[p as 4 | 6]));
    }
  }
  const resto = (battuta - mancano) % p;
  if (resto === 2) scritte.push([2]);
  if (resto === 4) scritte.push(caso.scegli([[4], [2, 2]]));
  return { tipo: 'completa-la-battuta', tempo: nome, scritte, mancano, abc: abcBattute(nome, [scritte]) };
}

export function valuta(es: Esercizio, risposta: Risposta) {
  const t = tempo(es.tempo);
  const battuta = durataBattuta(t);
  const data = durata(risposta.figure);
  const giusto = data === es.mancano;
  const crome = (s: number) => inCrome(s);
  const manca = es.mancano === 2;
  const spiegazione: Testi = {
    it:
      `Una battuta di ${es.tempo} vale ${crome(battuta)} crome. Le note scritte ne valgono ${crome(battuta - es.mancano)}: ` +
      `${manca ? 'ne manca' : 'ne mancano'} ${crome(es.mancano)}. La tua risposta ne vale ${crome(data)}`,
    en:
      `A ${es.tempo} measure is worth ${crome(battuta)} eighth notes. The written notes are worth ${crome(battuta - es.mancano)}: ` +
      `${crome(es.mancano)} ${manca ? 'is' : 'are'} missing. Your answer is worth ${crome(data)}`,
  };
  if (giusto) {
    spiegazione.it += '.';
    spiegazione.en += '.';
  } else if (data > es.mancano) {
    spiegazione.it += ': è troppo.';
    spiegazione.en += ': that is too much.';
  } else {
    spiegazione.it += ': è troppo poco.';
    spiegazione.en += ': that is too little.';
  }
  const nomi = risposta.figure.map(nomeFigura);
  return {
    esito: giusto ? ('giusto' as const) : ('sbagliato' as const),
    data: { it: nomi.map((n) => n.it).join(' + '), en: nomi.map((n) => n.en).join(' + ') },
    giusta: nomeFigura(figura(es.mancano)),
    spiegazione,
  };
}
