// Esercizio "Costruisci la scala" (Capitoli 5 e 6): la tonica è data; si aggiungono le altre 7 note, alterazione e
// poi nome, e ognuna compare sul rigo (ticket "Interazione negli Esercizi di teoria da telefono").
// Le toniche sono quelle delle armature fino a 4 alterazioni, come nelle Letture (ADR-0003).
import { armatura, tonicaMaggiore } from './armature';
import { casuale } from './casuale';
import { abcNota, daGrado, grado, LETTERE, tasto, type Nota } from './note';
import { GRADI, scala, type Forma } from './scale';
import { nomeNota, type Testi } from './testi';

export type Parametri = { forme: Forma[] };

export type Esercizio = {
  tipo: 'costruisci-la-scala';
  forma: Forma;
  tonica: Nota;
  /** Le 8 note giuste, dalla tonica all'ottava. */
  scala: Nota[];
  /** "Costruisci la scala di Re maggiore." */
  domanda: Testi;
  /** Il rigo con la sola tonica. */
  abc: string;
};

/** Le note dalla 2ª all'8ª, senza ottava: l'ottava la dà l'ordine, sempre a salire. */
export type Risposta = { note: Pick<Nota, 'lettera' | 'alterazione'>[] };

/** Il rigo con le note date, in chiave di violino e senza armatura: le alterazioni si scrivono tutte. */
export function abcScala(note: Nota[]): string {
  return `X:1\nL:1/4\nK:C clef=treble\n${note.map(abcNota).join(' ')}|]\n`;
}

/** Dove va la nota scritta dopo la tonica: la stessa lettera della scala, sempre a salire. */
export function inScala(tonica: Nota, note: Pick<Nota, 'lettera' | 'alterazione'>[]): Nota[] {
  let g = grado(tonica);
  return note.map((n) => {
    g += ((LETTERE.indexOf(n.lettera) - (g % 7) + 7) % 7) || 7;
    return { ...daGrado(g), alterazione: n.alterazione };
  });
}

export function genera(parametri: Parametri, seed: number): Esercizio {
  const caso = casuale(seed);
  const forma = caso.scegli(parametri.forme);
  const quinte = caso.intero(9) - 4;
  const maggiore = tonicaMaggiore(quinte);
  // La relativa minore ha la tonica sul 6° grado della maggiore.
  const lettera = forma === 'maggiore' ? maggiore.lettera : LETTERE[(LETTERE.indexOf(maggiore.lettera) + 5) % 7]!;
  // Fra Do4 e Si4: la scala sale al massimo al Si5, due tagli sopra il rigo.
  const altezza = Array.from({ length: 7 }, (_, i) => 28 + i).find((g) => daGrado(g).lettera === lettera)!;
  const tonica: Nota = { ...daGrado(altezza), alterazione: armatura(quinte)[lettera] };
  const domanda = {
    it: `Costruisci la scala di ${nomeNota(tonica, 'it')} ${NOMI_FORMA[forma].it}.`,
    en: `Build the ${nomeNota(tonica, 'en')} ${NOMI_FORMA[forma].en} scale.`,
  };
  return { tipo: 'costruisci-la-scala', forma, tonica, scala: scala(tonica, forma), domanda, abc: abcScala([tonica]) };
}

const NOMI_FORMA: Record<Forma, Testi> = {
  maggiore: { it: 'maggiore', en: 'major' },
  naturale: { it: 'minore naturale', en: 'natural minor' },
  armonica: { it: 'minore armonica', en: 'harmonic minor' },
  melodica: { it: 'minore melodica', en: 'melodic minor' },
};
const PASSI: Record<number, Testi & { segno: Testi }> = {
  1: { it: 'un semitono', en: 'a half step', segno: { it: 'S', en: 'H' } },
  2: { it: 'un tono', en: 'a whole step', segno: { it: 'T', en: 'W' } },
  3: { it: 'un tono e mezzo', en: 'a step and a half', segno: { it: '1½', en: '1½' } },
};

const ordinale = (n: number) => `${n}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n] ?? 'th'}`;
const nomi = (n: Pick<Nota, 'lettera' | 'alterazione'>): Testi => ({ it: nomeNota(n, 'it'), en: nomeNota(n, 'en') });
const elenco = (note: Pick<Nota, 'lettera' | 'alterazione'>[]): Testi => ({
  it: note.map((x) => nomeNota(x, 'it')).join(' '),
  en: note.map((x) => nomeNota(x, 'en')).join(' '),
});

export function valuta(es: Esercizio, risposta: Risposta) {
  const giuste = es.scala.slice(1);
  const sbagliata = giuste.findIndex((g, i) => risposta.note[i]?.lettera !== g.lettera || risposta.note[i]?.alterazione !== g.alterazione);
  const tonica = nomi(es.tonica);
  const forma = NOMI_FORMA[es.forma];
  const passi = GRADI[es.forma].slice(1).map((s, i) => PASSI[s - GRADI[es.forma][i]!]!.segno);
  const giusta = elenco(es.scala);
  const spiegazione: Testi = {
    it: `La scala di ${tonica.it} ${forma.it}: ${giusta.it}. Toni e semitoni: ${passi.map((p) => p.it).join(' ')}.`,
    en: `The ${tonica.en} ${forma.en} scale: ${giusta.en}. Whole and half steps: ${passi.map((p) => p.en).join(' ')}.`,
  };
  if (sbagliata >= 0) {
    const attesa = nomi(giuste[sbagliata]!);
    const prima = nomi(es.scala[sbagliata]!);
    const passo = PASSI[GRADI[es.forma][sbagliata + 1]! - GRADI[es.forma][sbagliata]!]!;
    spiegazione.it += ` La ${sbagliata + 2}ª nota è ${attesa.it}: dal ${prima.it} ci vuole ${passo.it}.`;
    spiegazione.en += ` The ${ordinale(sbagliata + 2)} note is ${attesa.en}: ${passo.en} up from ${prima.en}.`;
    const data = risposta.note[sbagliata];
    if (data && data.lettera !== giuste[sbagliata]!.lettera && tasto(data) === tasto(giuste[sbagliata]!)) {
      const altra = nomi(data);
      const lettera = nomi({ lettera: giuste[sbagliata]!.lettera, alterazione: 0 });
      spiegazione.it += ` Il ${altra.it} è lo stesso tasto, ma nella scala ogni lettera compare una volta sola: dopo il ${prima.it} viene un ${lettera.it}.`;
      spiegazione.en += ` ${altra.en} is the same key, but in a scale each letter appears only once: after ${prima.en} comes an ${lettera.en}.`;
    }
  }
  return {
    esito: sbagliata < 0 ? ('giusto' as const) : ('sbagliato' as const),
    data: elenco([es.tonica, ...risposta.note]),
    giusta,
    spiegazione,
  };
}
