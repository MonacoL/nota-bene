// Esercizio "Riconosci l'intervallo" (Capitolo 8): due note, melodiche o armoniche; si risponde con numero e qualità.
import { casuale } from './casuale';
import { conArticolo, dueNote, haQualita, intervallo, nomeIntervallo, NUMERI, numeroTesti, qualitaImpossibile, semitoniDi, type Intervallo } from './intervalli';
import { RIGHI, type Chiave } from './nomina-la-nota';
import { abcNota, daGrado, grado, type Nota } from './note';
import { nomeNota, type Testi } from './testi';

export type Parametri = { chiavi: Chiave[] };

export type Esercizio = {
  tipo: 'riconosci-intervallo';
  chiave: Chiave;
  /** Le due note insieme (armonico) o una dopo l'altra (melodico, a salire o a scendere). */
  armonico: boolean;
  /** Le Note reali, nell'ordine in cui si leggono. */
  prima: Nota;
  seconda: Nota;
  intervallo: Intervallo;
  abc: string;
};

export type Risposta = Intervallo;

/** Le due note in ABC, con l'alterazione scritta su ognuna; il violino ottava bassa si scrive un'ottava sopra (ADR-0003). */
export function abcIntervallo(chiave: Chiave, armonico: boolean, prima: Nota, seconda: Nota): string {
  const { clef, ottavaSopra } = RIGHI[chiave];
  const [a, b] = [prima, seconda].map((n) => abcNota({ ...n, ottava: n.ottava + ottavaSopra }));
  return armonico ? `X:1\nL:1/1\nK:C clef=${clef}\n[${a}${b}]|]\n` : `X:1\nL:1/2\nK:C clef=${clef}\n${a} ${b}|]\n`;
}

export function genera(parametri: Parametri, seed: number): Esercizio {
  const caso = casuale(seed);
  const chiave = caso.scegli(parametri.chiavi);
  const { basso, alto, intervallo } = dueNote(caso, RIGHI[chiave], NUMERI);
  const armonico = caso.intero(2) === 0;
  const [prima, seconda] = armonico || caso.intero(2) === 0 ? [basso, alto] : [alto, basso];
  return { tipo: 'riconosci-intervallo', chiave, armonico, prima, seconda, intervallo, abc: abcIntervallo(chiave, armonico, prima, seconda) };
}

/** Il nome di una Nota con l'ottava, nelle due lingue. */
const conOttava = (nota: Nota): Testi => ({ it: nomeNota(nota, 'it', true), en: nomeNota(nota, 'en', true) });

export function valuta(es: Esercizio, risposta: Risposta) {
  const giusto = risposta.numero === es.intervallo.numero && risposta.qualita === es.intervallo.qualita;
  const [basso, alto] = grado(es.prima) <= grado(es.seconda) ? [es.prima, es.seconda] : [es.seconda, es.prima];
  const { numero, semitoni } = intervallo(basso, alto);
  const lettere = Array.from({ length: numero }, (_, i) => daGrado(grado(basso) + i));
  const nome = numeroTesti(numero);
  const qualita = nomeIntervallo(es.intervallo);
  const da = conOttava(basso);
  const a = conOttava(alto);
  const spiegazione: Testi = {
    it: `Dal ${da.it} al ${a.it} si contano ${numero} note (${lettere.map((l) => nomeNota(l, 'it')).join(', ')}): è una ${nome.it}. I semitoni sono ${semitoni}: ${qualita.it}.`,
    en: `From ${da.en} to ${a.en} you count ${numero} notes (${lettere.map((l) => nomeNota(l, 'en')).join(', ')}): it is a ${nome.en}. It spans ${semitoni} half steps: ${conArticolo(qualita.en)}.`,
  };
  if (!giusto && risposta.numero === numero) {
    const aggiunta = haQualita(numero, risposta.qualita)
      ? (() => {
          const data = nomeIntervallo(risposta);
          const s = semitoniDi(risposta);
          return { it: `Una ${data.it} avrebbe ${s} semitoni.`, en: `${capitale(conArticolo(data.en))} would span ${s} half steps.` };
        })()
      : qualitaImpossibile(numero);
    spiegazione.it += ` ${aggiunta.it}`;
    spiegazione.en += ` ${aggiunta.en}`;
  }
  if (risposta.numero === numero - 1) {
    spiegazione.it += " Si contano anche la prima e l'ultima nota.";
    spiegazione.en += ' Count the first and the last note too.';
  }
  return { esito: giusto ? ('giusto' as const) : ('sbagliato' as const), data: nomeIntervallo(risposta), giusta: qualita, spiegazione };
}

const capitale = (s: string) => s[0]!.toUpperCase() + s.slice(1);
