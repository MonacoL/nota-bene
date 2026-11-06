// Esercizio "Rivolta l'intervallo" (Capitolo 8): un intervallo armonico; si risponde con numero e qualità del rivolto.
// Niente ottava, che si rivolterebbe in un unisono.
import { casuale } from './casuale';
import { conArticolo, dueNote, nomeIntervallo, NUMERI, QUALITA_EN, rivolto, semitoniDi, type Intervallo } from './intervalli';
import { RIGHI, type Chiave } from './nomina-la-nota';
import type { Nota } from './note';
import { nomeNota, type Testi } from './testi';
import { abcIntervallo } from './riconosci-intervallo';

export type Parametri = { chiavi: Chiave[] };

export type Esercizio = {
  tipo: 'rivolta-intervallo';
  chiave: Chiave;
  armonico: true;
  /** Le Note reali: la prima è quella in basso. */
  prima: Nota;
  seconda: Nota;
  /** L'intervallo scritto, non il rivolto. */
  intervallo: Intervallo;
  abc: string;
};

export type Risposta = Intervallo;

export function genera(parametri: Parametri, seed: number): Esercizio {
  const caso = casuale(seed);
  const chiave = caso.scegli(parametri.chiavi);
  const { basso, alto, intervallo } = dueNote(caso, RIGHI[chiave], NUMERI.filter((n) => n !== 8));
  return { tipo: 'rivolta-intervallo', chiave, armonico: true, prima: basso, seconda: alto, intervallo, abc: abcIntervallo(chiave, true, basso, alto) };
}

const conOttava = (nota: Nota): Testi => ({ it: nomeNota(nota, 'it', true), en: nomeNota(nota, 'en', true) });

export function valuta(es: Esercizio, risposta: Risposta) {
  const r = rivolto(es.intervallo);
  const giusto = risposta.numero === r.numero && risposta.qualita === r.qualita;
  const scritto = nomeIntervallo(es.intervallo);
  const giusta = nomeIntervallo(r);
  const [basso, alto] = [conOttava(es.prima), conOttava(es.seconda)];
  const su = conOttava({ ...es.prima, ottava: es.prima.ottava + 1 });
  const s = semitoniDi(es.intervallo);
  const cambio =
    es.intervallo.qualita === 'giusta'
      ? { it: 'giusta resta giusta', en: 'perfect stays perfect' }
      : { it: `${es.intervallo.qualita} diventa ${r.qualita}`, en: `${QUALITA_EN[es.intervallo.qualita]} becomes ${QUALITA_EN[r.qualita]}` };
  const spiegazione: Testi = {
    it:
      `L'intervallo è una ${scritto.it} (${basso.it}–${alto.it}). Nel rivolto la nota in basso sale di un'ottava: ${alto.it}–${su.it}. ` +
      `I numeri sommano 9 (${es.intervallo.numero} + ${r.numero}), i semitoni 12 (${s} + ${12 - s}), e ${cambio.it}: ${giusta.it}.`,
    en:
      `The interval is ${conArticolo(scritto.en)} (${basso.en}–${alto.en}). In the inversion the lower note moves up an octave: ${alto.en}–${su.en}. ` +
      `The numbers add up to 9 (${es.intervallo.numero} + ${r.numero}), the half steps to 12 (${s} + ${12 - s}), and ${cambio.en}: ${conArticolo(giusta.en)}.`,
  };
  if (!giusto && risposta.numero === es.intervallo.numero && risposta.qualita === es.intervallo.qualita) {
    spiegazione.it += ` La ${scritto.it} è l'intervallo scritto: si chiede il suo rivolto.`;
    spiegazione.en += ` The ${scritto.en} is the written interval: the question asks for its inversion.`;
  }
  return { esito: giusto ? ('giusto' as const) : ('sbagliato' as const), data: nomeIntervallo(risposta), giusta, spiegazione };
}
