// Esercizio "Nomina la sillaba" (Capitoli 9 e 10): un'Armatura e una nota; si risponde con la Sillaba, a un tocco.
// La Sillaba la calcola il modulo Sillabe, lo stesso della Soluzione delle Letture (ADR-0004).
// Col minore su LA (ADR-0002) una Tonalità minore ha le Sillabe della sua relativa maggiore: basta l'Armatura.
import { abcTonalita, armatura, tonicaMaggiore } from './armature';
import { casuale } from './casuale';
import { RIGHI, type Chiave } from './nomina-la-nota';
import { abcNota, daGrado, LETTERE, type Alterazione, type Nota } from './note';
import { sillabe, type Sillaba } from '../sillabe';
import { nomeNota, type Testi } from './testi';

export type Parametri = {
  chiavi: Chiave[];
  /** Capitolo 10: anche le Sillabe cromatiche, e Armature fino a 4 alterazioni come nelle Letture avanzate. */
  cromatiche: boolean;
};

export type Esercizio = {
  tipo: 'nomina-la-sillaba';
  chiave: Chiave;
  /** Alterazioni in chiave: n diesis (n > 0) o -n bemolle (n < 0). */
  quinte: number;
  /** La Nota reale. */
  nota: Nota;
  sillaba: Sillaba;
  abc: string;
};

export type Risposta = { sillaba: Sillaba };

const SEGNO_ABC: Record<Alterazione, string> = { [-1]: '_', 0: '=', 1: '^' };

export function genera(parametri: Parametri, seed: number): Esercizio {
  const caso = casuale(seed);
  const chiave = caso.scegli(parametri.chiavi);
  const massimo = parametri.cromatiche ? 4 : 3;
  const quinte = caso.intero(2 * massimo + 1) - massimo;
  const inChiave = armatura(quinte);
  const doDi = tonicaMaggiore(quinte);
  const { clef, da, a, ottavaSopra } = RIGHI[chiave];

  // Un grado della scala, a volte alzato o abbassato di un semitono; si riprova se non ha Sillaba (Do𝄫, Mi♯…).
  for (;;) {
    const grado = caso.intero(7);
    const lettera = LETTERE[(LETTERE.indexOf(doDi.lettera) + grado) % 7]!;
    const scarto = parametri.cromatiche && caso.intero(10) < 4 ? caso.scegli([-1, 1] as const) : 0;
    const alterazione = inChiave[lettera] + scarto;
    if (Math.abs(alterazione) > 1) continue;
    const altezze = Array.from({ length: a - da + 1 }, (_, i) => da + i).filter((g) => daGrado(g).lettera === lettera);
    const nota: Nota = { ...daGrado(caso.scegli(altezze)), alterazione: alterazione as Alterazione };
    const [esito] = sillabe([{ battuta: 1, posizione: 1, nota }], { tonica: doDi, modo: 'maggiore' });
    if (esito?.tipo !== 'sillaba') continue;

    const scritta = abcNota({ ...nota, ottava: nota.ottava + ottavaSopra, alterazione: 0 });
    const segno = nota.alterazione === inChiave[lettera] ? '' : SEGNO_ABC[nota.alterazione];
    const abc = `X:1\nL:1/1\nK:${abcTonalita(quinte)} clef=${clef}\n${segno}${scritta}|]\n`;
    return { tipo: 'nomina-la-sillaba', chiave, quinte, nota, sillaba: esito.sillaba, abc };
  }
}

const DIATONICHE: Sillaba[] = ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'TI'];
/** La Sillaba che coincide col nome italiano della nota: chi la sceglie sta leggendo il nome fisso. Il Si vale sia TI sia SI. */
const NOME_FISSO: Record<Nota['lettera'], Sillaba[]> = { C: ['DO'], D: ['RE'], E: ['MI'], F: ['FA'], G: ['SOL'], A: ['LA'], B: ['TI', 'SI'] };

const ordinale = (n: number) => `${n}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n] ?? 'th'}`;
const nomi = (nota: Pick<Nota, 'lettera' | 'alterazione'>): Testi => ({ it: nomeNota(nota, 'it'), en: nomeNota(nota, 'en') });

/** Dove sta il DO: le due Tonalità dell'Armatura, maggiore e relativa minore. */
function trovaIlDo(quinte: number): Testi {
  const doDi = nomi(tonicaMaggiore(quinte));
  const lettera = LETTERE[(LETTERE.indexOf(tonicaMaggiore(quinte).lettera) + 5) % 7]!;
  const la = nomi({ lettera, alterazione: armatura(quinte)[lettera] });
  if (quinte === 0) {
    return { it: 'Senza alterazioni in chiave è Do maggiore o La minore: il DO è il Do.', en: 'With no sharps or flats it is C major or A minor: DO is C.' };
  }
  const k = Math.abs(quinte);
  const segni = quinte > 0 ? { it: 'diesis', en: k === 1 ? 'sharp' : 'sharps' } : { it: 'bemolle', en: k === 1 ? 'flat' : 'flats' };
  return {
    it: `L'armatura con ${k} ${segni.it} è di ${doDi.it} maggiore e di ${la.it} minore: in tutte e due il DO è il ${doDi.it}.`,
    en: `The key signature with ${k} ${segni.en} belongs to ${doDi.en} major and ${la.en} minor: in both, DO is ${doDi.en}.`,
  };
}

export function valuta(es: Esercizio, risposta: Risposta) {
  const giusto = risposta.sillaba === es.sillaba;
  const doDi = tonicaMaggiore(es.quinte);
  const grado = (LETTERE.indexOf(es.nota.lettera) - LETTERE.indexOf(doDi.lettera) + 7) % 7;
  const nota = nomi(es.nota);
  const scarto = es.nota.alterazione - armatura(es.quinte)[es.nota.lettera];
  const spiegazione = trovaIlDo(es.quinte);

  if (scarto === 0) {
    spiegazione.it += ` Il ${nota.it} è il ${grado + 1}° grado: ${es.sillaba}.`;
    spiegazione.en += ` ${nota.en} is the ${ordinale(grado + 1)} degree: ${es.sillaba}.`;
  } else {
    // Il bequadro che toglie l'alterazione in chiave fa parte del nome della nota.
    if (es.nota.alterazione === 0) {
      nota.it += '♮';
      nota.en += '♮';
    }
    const verso = scarto > 0 ? { it: 'alzato', en: 'raised' } : { it: 'abbassato', en: 'lowered' };
    const base = DIATONICHE[grado]!;
    spiegazione.it += ` Il ${nota.it} non è nell'armatura: è il ${base} ${verso.it} di un semitono, e diventa ${es.sillaba}.`;
    spiegazione.en += ` ${nota.en} is not in the key signature: it is ${base} ${verso.en} by a half step, so it becomes ${es.sillaba}.`;
  }
  if (es.sillaba === 'SI') {
    const la = LETTERE[(LETTERE.indexOf(doDi.lettera) + 5) % 7]!;
    const minore = nomi({ lettera: la, alterazione: armatura(es.quinte)[la] });
    spiegazione.it += ` In ${minore.it} minore è la sensibile della scala minore armonica.`;
    spiegazione.en += ` In ${minore.en} minor it is the leading tone of the harmonic minor scale.`;
  }
  if (!giusto && NOME_FISSO[es.nota.lettera].includes(risposta.sillaba)) {
    const doNomi = nomi(doDi);
    spiegazione.it += ` ${risposta.sillaba} è il nome fisso della nota: nel DO mobile si conta dal DO, che qui è il ${doNomi.it}.`;
    spiegazione.en += ` ${risposta.sillaba} is the fixed name of the note: in movable do you count from DO, which here is ${doNomi.en}.`;
  }
  const testo = (s: Sillaba): Testi => ({ it: s, en: s });
  return { esito: giusto ? ('giusto' as const) : ('sbagliato' as const), data: testo(risposta.sillaba), giusta: testo(es.sillaba), spiegazione };
}
