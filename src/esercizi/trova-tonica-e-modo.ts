// Esercizio "Trova Tonica e Modo" (Capitolo 7, ticket #35): una melodia di tre Battute con l'Armatura della sua
// Tonalità, da leggere e ascoltare; si risponde in due passi, prima la Tonica (♭ ♮ ♯ e nome) e poi maggiore o
// minore. La melodia segue le regole del Capitolo, così una sola Tonalità le rispetta tutte: comincia su una nota
// dell'accordo di tonica, finisce sulla tonica, contiene il 3° grado e, in minore, la sensibile alzata della
// minore armonica, che la relativa maggiore non ha.
import { abcTonalita, armatura, tonicaMaggiore, tonicaMinore } from './armature';
import { casuale, type Casuale } from './casuale';
import { RIGHI, type Chiave } from './nomina-la-nota';
import { abcNota, LETTERE, type Alterazione, type Lettera, type Nota } from './note';
import { scala } from './scale';
import { nomeNota, type Testi } from './testi';
import type { Modo } from './trova-la-tonalita';

export type Parametri = { chiavi: Chiave[] };
type Tonica = { lettera: Lettera; alterazione: Alterazione };

export type Esercizio = {
  tipo: 'trova-tonica-e-modo';
  chiave: Chiave;
  /** Alterazioni in chiave, fino a 4: n diesis (n > 0) o -n bemolle (n < 0). */
  quinte: number;
  tonica: Tonica;
  modo: Modo;
  /** Le Note reali della melodia. */
  melodia: Nota[];
  abc: string;
};

export type Risposta = { tonica: Tonica; modo: Modo };

/** Quattro semiminime, quattro semiminime, due semiminime e la tonica finale lunga una minima. */
const NOTE = 11;

/**
 * I gradi della melodia contati dalla tonica (0), anche sotto (-1 è la sensibile sotto la tonica) o sopra
 * l'ottava. Si riprova finché la melodia non rispetta le regole: lo stesso seed dà sempre la stessa.
 */
function gradi(caso: Casuale, modo: Modo, basso: number, alto: number): number[] {
  for (;;) {
    const inizio = caso.scegli([0, 2, 4, -3].filter((g) => g >= basso && g <= alto));
    const melodia = [inizio];
    while (melodia.length < NOTE - 2) {
      const passo = caso.scegli([-2, -1, -1, 1, 1, 2]);
      melodia.push(Math.min(alto, Math.max(basso, melodia.at(-1)! + passo)));
    }
    // Si arriva alla tonica per grado congiunto: in minore dalla sensibile, in maggiore anche dal 2° grado.
    melodia.push(modo === 'minore' ? -1 : caso.scegli([-1, 1]), 0);
    if (valida(melodia, modo, basso)) return melodia;
  }
}

const classe = (g: number) => ((g % 7) + 7) % 7;

function valida(melodia: number[], modo: Modo, basso: number): boolean {
  if (melodia.includes(-1) && basso > -1) return false;
  if (!melodia.some((g) => classe(g) === 2)) return false;
  // Niente note ribattute, e in minore niente seconda eccedente fra il 6° grado e la sensibile.
  for (let i = 1; i < melodia.length; i++) {
    const [a, b] = [melodia[i - 1]!, melodia[i]!];
    if (a === b) return false;
    if (Math.abs(a - b) > 2) return false;
    if (modo === 'minore' && Math.abs(a - b) === 1 && [a, b].map(classe).sort().join() === '5,6') return false;
  }
  return true;
}

/** L'ABC della melodia: l'alterazione si scrive solo se cambia quella in vigore nella Battuta, come in partitura. */
function abcMelodia(chiave: Chiave, quinte: number, melodia: Nota[]): string {
  const { clef, ottavaSopra } = RIGHI[chiave];
  const inChiave = armatura(quinte);
  const battute: string[][] = [[]];
  let inVigore = new Map<string, Alterazione>();
  melodia.forEach((nota, i) => {
    if (i > 0 && i % 4 === 0) {
      battute.push([]);
      inVigore = new Map();
    }
    const scritta = { ...nota, ottava: nota.ottava + ottavaSopra };
    const chiaveNota = `${scritta.lettera}${scritta.ottava}`;
    const attuale = inVigore.get(chiaveNota) ?? inChiave[scritta.lettera];
    inVigore.set(chiaveNota, scritta.alterazione);
    const testo = attuale === scritta.alterazione ? abcNota({ ...scritta, alterazione: 0 }) : abcNotaConBequadro(scritta);
    battute.at(-1)!.push(i === melodia.length - 1 ? `${testo}2` : testo);
  });
  return `X:1\nM:4/4\nL:1/4\nK:${abcTonalita(quinte)} clef=${clef}\n${battute.map((b) => b.join(' ')).join(' | ')} |]\n`;
}

/** Come abcNota, ma il bequadro si scrive ("=F"): serve quando la nota toglie un'alterazione in vigore. */
function abcNotaConBequadro(nota: Nota): string {
  return nota.alterazione === 0 ? `=${abcNota(nota)}` : abcNota(nota);
}

export function genera(parametri: Parametri, seed: number): Esercizio {
  const caso = casuale(seed);
  const chiave = caso.scegli(parametri.chiavi);
  const modo = caso.scegli(['maggiore', 'minore'] as const);
  const quinte = caso.intero(9) - 4;
  const tonica = modo === 'maggiore' ? tonicaMaggiore(quinte) : tonicaMinore(quinte);
  // La tonica è la sua lettera più vicina al centro del rigo; la melodia resta sul rigo, un taglio addizionale al più.
  const { da, a } = RIGHI[chiave];
  const centro = Math.round((da + a) / 2);
  const scarto = classe(LETTERE.indexOf(tonica.lettera) - centro);
  const t = centro + (scarto > 3 ? scarto - 7 : scarto);
  const note = scala({ ...tonica, ottava: Math.floor(t / 7) }, modo === 'maggiore' ? 'maggiore' : 'armonica');
  const melodia = gradi(caso, modo, Math.max(da - t, -4), Math.min(a - t, 5)).map((g) => {
    const n = note[classe(g)]!;
    return { ...n, ottava: n.ottava + Math.floor(g / 7) };
  });
  return { tipo: 'trova-tonica-e-modo', chiave, quinte, tonica, modo, melodia, abc: abcMelodia(chiave, quinte, melodia) };
}

const MODI_EN: Record<Modo, string> = { maggiore: 'major', minore: 'minor' };
const nomi = (t: Tonica): Testi => ({ it: nomeNota(t, 'it'), en: nomeNota(t, 'en') });
const tonalita = (t: Tonica, modo: Modo): Testi => ({ it: `${nomeNota(t, 'it')} ${modo}`, en: `${nomeNota(t, 'en')} ${MODI_EN[modo]}` });
const uguali = (a: Tonica, b: Tonica) => a.lettera === b.lettera && a.alterazione === b.alterazione;
const relativa = (es: Esercizio): Risposta =>
  es.modo === 'maggiore' ? { tonica: tonicaMinore(es.quinte), modo: 'minore' } : { tonica: tonicaMaggiore(es.quinte), modo: 'maggiore' };

/** La spiegazione segue i passi del Capitolo 7: l'ultima nota, il 3° grado, e in minore la sensibile. */
export function valuta(es: Esercizio, risposta: Risposta) {
  const giusto = uguali(risposta.tonica, es.tonica) && risposta.modo === es.modo;
  const [, , terza, , , , settima] = scala({ ...es.tonica, ottava: 4 }, es.modo === 'maggiore' ? 'maggiore' : 'armonica');
  const t = nomi(es.tonica);
  const iii = nomi(terza!);
  const semitoni = es.modo === 'maggiore' ? 4 : 3;
  const qualita: Testi = es.modo === 'maggiore' ? { it: 'maggiore', en: 'major' } : { it: 'minore', en: 'minor' };
  const spiegazione: Testi = {
    it: `La melodia finisce sul ${t.it}: è la tonica. Dal ${t.it} al ${iii.it}, il 3° grado, ci sono ${semitoni} semitoni, una terza ${qualita.it}: il modo è ${es.modo}.`,
    en: `The melody ends on ${t.en}: that is the tonic. From ${t.en} to ${iii.en}, the 3rd degree, there are ${semitoni} half steps, a ${qualita.en} third: the mode is ${MODI_EN[es.modo]}.`,
  };
  if (es.modo === 'minore') {
    const vii = nomi(settima!);
    spiegazione.it += ` Il ${vii.it} è la sensibile alzata della minore armonica, che la relativa maggiore non ha.`;
    spiegazione.en += ` ${vii.en} is the raised leading tone of the harmonic minor, which the relative major does not have.`;
  }
  const rel = relativa(es);
  if (!giusto && uguali(risposta.tonica, rel.tonica) && risposta.modo === rel.modo) {
    const r = tonalita(rel.tonica, rel.modo);
    spiegazione.it += ` ${r.it} è la relativa ${rel.modo}: ha la stessa armatura, ma la melodia non finisce sul ${nomi(rel.tonica).it}.`;
    spiegazione.en += ` ${r.en} is the relative ${MODI_EN[rel.modo]}: it has the same key signature, but the melody does not end on ${nomi(rel.tonica).en}.`;
  }
  return {
    esito: giusto ? ('giusto' as const) : ('sbagliato' as const),
    data: tonalita(risposta.tonica, risposta.modo),
    giusta: tonalita(es.tonica, es.modo),
    spiegazione,
  };
}
