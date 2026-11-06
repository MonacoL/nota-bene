// Esercizio "Trova la tonalità" (Capitoli 5 e 6): un'Armatura; la domanda dice se la Tonalità è maggiore o minore,
// e si risponde con la Tonica (♭ ♮ ♯ e nome, poi Verifica). Tra gli errori tipici c'è la relativa, e la spiegazione la nomina.
import { abcTonalita, armatura, BEMOLLE, DIESIS, tonicaMaggiore } from './armature';
import { casuale } from './casuale';
import { LETTERE, type Alterazione, type Lettera } from './note';
import { nomeNota, type Testi } from './testi';

export type Modo = 'maggiore' | 'minore';
export type Parametri = { modi: Modo[] };
type Tonica = { lettera: Lettera; alterazione: Alterazione };

export type Esercizio = {
  tipo: 'trova-la-tonalita';
  /** Alterazioni in chiave, fino a 4: n diesis (n > 0) o -n bemolle (n < 0). */
  quinte: number;
  modo: Modo;
  tonica: Tonica;
  domanda: Testi;
  abc: string;
};

export type Risposta = Tonica;

const DOMANDE: Record<Modo, Testi> = {
  maggiore: { it: 'Quale tonalità maggiore ha questa armatura?', en: 'Which major key has this key signature?' },
  minore: { it: 'Quale tonalità minore ha questa armatura?', en: 'Which minor key has this key signature?' },
};
const MODI_EN: Record<Modo, string> = { maggiore: 'major', minore: 'minor' };

/** La relativa minore: la tonica sta sul 6° grado della maggiore, una terza minore sotto. */
function tonicaMinore(quinte: number): Tonica {
  const lettera = LETTERE[(LETTERE.indexOf(tonicaMaggiore(quinte).lettera) + 5) % 7]!;
  return { lettera, alterazione: armatura(quinte)[lettera] };
}

const tonicaDi = (quinte: number, modo: Modo) => (modo === 'maggiore' ? tonicaMaggiore(quinte) : tonicaMinore(quinte));
const nomi = (t: Tonica): Testi => ({ it: nomeNota(t, 'it'), en: nomeNota(t, 'en') });
const tonalita = (t: Tonica, modo: Modo): Testi => ({ it: `${nomeNota(t, 'it')} ${modo}`, en: `${nomeNota(t, 'en')} ${MODI_EN[modo]}` });
const uguali = (a: Tonica, b: Tonica) => a.lettera === b.lettera && a.alterazione === b.alterazione;

export function genera(parametri: Parametri, seed: number): Esercizio {
  const caso = casuale(seed);
  const modo = caso.scegli(parametri.modi);
  const quinte = caso.intero(9) - 4;
  return {
    tipo: 'trova-la-tonalita', quinte, modo, tonica: tonicaDi(quinte, modo), domanda: DOMANDE[modo],
    abc: `X:1\nL:1/1\nK:${abcTonalita(quinte)} clef=treble\nx|]\n`,
  };
}

/** Come si trova la tonica maggiore dall'Armatura: le regole dell'ultimo diesis e del penultimo bemolle. */
function regola(quinte: number): Testi {
  const maggiore = nomi(tonicaMaggiore(quinte));
  const k = Math.abs(quinte);
  if (quinte === 0) return { it: 'Senza alterazioni è Do maggiore.', en: 'With no sharps or flats it is C major.' };
  if (quinte === -1) return { it: 'Con 1 bemolle è Fa maggiore.', en: 'With 1 flat it is F major.' };
  if (quinte > 0) {
    const ultimo = nomi({ lettera: DIESIS[k - 1]!, alterazione: 1 });
    return {
      it: `Con ${k} diesis l'ultimo diesis è il ${ultimo.it}: la tonica maggiore sta un semitono sopra, ${maggiore.it}. È ${maggiore.it} maggiore.`,
      en: `With ${k} ${k === 1 ? 'sharp' : 'sharps'} the last sharp is ${ultimo.en}: the major tonic is a half step above it, ${maggiore.en}. It is ${maggiore.en} major.`,
    };
  }
  const penultimo = nomi({ lettera: BEMOLLE[k - 2]!, alterazione: -1 });
  return {
    it: `Con ${k} bemolle il penultimo bemolle è il ${penultimo.it}: è la tonica maggiore. È ${maggiore.it} maggiore.`,
    en: `With ${k} flats the second-to-last flat is ${penultimo.en}: that is the major tonic. It is ${maggiore.en} major.`,
  };
}

export function valuta(es: Esercizio, risposta: Risposta) {
  const giusto = uguali(risposta, es.tonica);
  const spiegazione = regola(es.quinte);
  if (es.modo === 'minore') {
    const minore = tonalita(es.tonica, 'minore');
    spiegazione.it += ` La relativa minore sta una terza minore sotto, 3 semitoni: ${minore.it}.`;
    spiegazione.en += ` The relative minor is a minor third below, 3 half steps: ${minore.en}.`;
  }
  const altro: Modo = es.modo === 'maggiore' ? 'minore' : 'maggiore';
  if (!giusto && uguali(risposta, tonicaDi(es.quinte, altro))) {
    const data = nomi(risposta);
    spiegazione.it += ` ${data.it} è la tonica della relativa ${altro}: la domanda chiede la tonalità ${es.modo}.`;
    spiegazione.en += ` ${data.en} is the tonic of the relative ${MODI_EN[altro]}: the question asks for the ${MODI_EN[es.modo]} key.`;
  }
  return {
    esito: giusto ? ('giusto' as const) : ('sbagliato' as const),
    data: tonalita(risposta, es.modo),
    giusta: tonalita(es.tonica, es.modo),
    spiegazione,
  };
}
