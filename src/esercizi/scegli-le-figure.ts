// Esercizio "Scegli le figure" (Indicazioni metriche, #85): data un'Indicazione metrica, si scelgono le Figure di
// Suddivisione, Pulsazione e Battuta. Quando nessuna Figura da sola riempie la Battuta (quinari, misti, 9/8, 15/8) se
// ne legano due. La Battuta è giusta se dura quanto deve, con il minor numero di Figure, ognuna fatta di Pulsazioni
// intere: così nel 9/8 vale minima col punto legata a semiminima col punto, non tre semiminime col punto.
import { casuale } from './casuale';
import { metrica, type NomeIndicazione } from './metrica';
import { durata, nomeFigura, type Figura, type NomeFigura } from './ritmo';
import type { Testi } from './testi';

/** Il 21/8 non c'è: la sua Battuta vorrebbe tre Figure legate. */
export const INDICAZIONI_FIGURE = ['2/2', '2/4', '3/4', '4/4', '5/4', '7/4', '3/8', '6/4', '6/8', '9/8', '12/8', '15/8'] as const satisfies readonly NomeIndicazione[];

/** La tavolozza dell'Esercizio, dalla più lunga. */
export const FIGURE_METRICA = ['semibreve', 'minima', 'semiminima', 'croma', 'semicroma'] as const satisfies readonly NomeFigura[];

export type Parametri = { indicazioni: (typeof INDICAZIONI_FIGURE)[number][] };

export type Esercizio = { tipo: 'scegli-le-figure'; indicazione: NomeIndicazione };

export type Risposta = { suddivisione: Figura; pulsazione: Figura; battuta: Figura[] };

export function genera(parametri: Parametri, seed: number): Esercizio {
  return { tipo: 'scegli-le-figure', indicazione: casuale(seed).scegli(parametri.indicazioni) };
}

/** Tutte le Figure della tavolozza, con e senza punto, dalla più lunga. */
const TUTTE: Figura[] = FIGURE_METRICA.flatMap((figura) => [{ figura, punto: true }, { figura, punto: false }]).sort((a, b) => durata([b]) - durata([a]));

/** La Battuta con il minor numero di Figure fatte di Pulsazioni intere, dalla più lunga. */
function battutaGiusta(battuta: number, pulsazione: number): Figura[] {
  const adatte = TUTTE.filter((f) => durata([f]) % pulsazione === 0);
  const scelte: Figura[] = [];
  let resta = battuta;
  while (resta > 0) {
    const f = adatte.find((x) => durata([x]) <= resta)!;
    scelte.push(f);
    resta -= durata([f]);
  }
  return scelte;
}

const legate = (figure: Figura[]): Testi => {
  const nomi = figure.map(nomeFigura);
  return { it: nomi.map((n) => n.it).join(' legata a '), en: nomi.map((n) => n.en).join(' tied to ') };
};
const elenco = (r: Risposta): Testi => {
  const parti = [nomeFigura(r.suddivisione), nomeFigura(r.pulsazione), legate(r.battuta)];
  return { it: parti.map((p) => p.it).join(', '), en: parti.map((p) => p.en).join(', ') };
};

const uguale = (a: Figura, b: Figura) => a.figura === b.figura && a.punto === b.punto;
const NUMERI_IT: Record<number, string> = { 2: 'Due', 3: 'Tre', 4: 'Quattro', 5: 'Cinque', 7: 'Sette' };
const NUMERI_EN: Record<number, string> = { 2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five', 7: 'Seven' };
const il = (n: number) => (n === 8 ? "l'8" : `il ${n}`);
const un = (s: string) => `${/^[aeiou]/.test(s) ? 'an' : 'a'} ${s}`;

export function valuta(es: Esercizio, risposta: Risposta) {
  const m = metrica(es.indicazione);
  const battuta = battutaGiusta(m.battuta, m.pulsazione);
  const giusta: Risposta = {
    suddivisione: TUTTE.find((f) => durata([f]) === m.suddivisione)!,
    pulsazione: TUTTE.find((f) => durata([f]) === m.pulsazione)!,
    battuta,
  };
  const battutaOk =
    durata(risposta.battuta) === m.battuta && risposta.battuta.length === battuta.length && risposta.battuta.every((f) => durata([f]) % m.pulsazione === 0);
  const giusto = uguale(risposta.suddivisione, giusta.suddivisione) && uguale(risposta.pulsazione, giusta.pulsazione) && battutaOk;

  const sud = nomeFigura(giusta.suddivisione);
  const pul = nomeFigura(giusta.pulsazione);
  const bat = legate(battuta);
  const coda: Testi =
    battuta.length === 1
      ? { it: `: una ${bat.it}.`, en: `: ${un(bat.en)}.` }
      : { it: `, e nessuna figura da sola la riempie: ${bat.it}.`, en: `, and no single note value fills it: ${bat.en}.` };
  const quante = { it: NUMERI_IT[m.pulsazioni]!, en: NUMERI_EN[m.pulsazioni]! };
  const spiegazione: Testi =
    m.genere === 'semplice'
      ? {
          it: `Nel ${es.indicazione} ${il(m.sopra)} sopra conta le pulsazioni e ${il(m.sotto)} sotto dice che ognuna è una ${pul.it}. La suddivisione è la sua metà, una ${sud.it}. ${quante.it} pulsazioni fanno la battuta${coda.it}`,
          en: `In ${es.indicazione} the top ${m.sopra} counts the beats and the bottom ${m.sotto} says each one is ${un(pul.en)}. The subdivision is half of it, ${un(sud.en)}. ${quante.en} beats make the measure${coda.en}`,
        }
      : {
          it: `Nel ${es.indicazione} ${il(m.sopra)} sopra conta le suddivisioni e ${il(m.sotto)} sotto dice che ognuna è una ${sud.it}. Tre suddivisioni fanno la pulsazione, una ${pul.it}. ${quante.it} pulsazioni fanno la battuta${coda.it}`,
          en: `In ${es.indicazione} the top ${m.sopra} counts the subdivisions and the bottom ${m.sotto} says each one is ${un(sud.en)}. Three subdivisions make the beat, ${un(pul.en)}. ${quante.en} beats make the measure${coda.en}`,
        };
  return {
    esito: giusto ? ('giusto' as const) : ('sbagliato' as const),
    data: elenco(risposta),
    giusta: elenco(giusta),
    spiegazione,
  };
}
