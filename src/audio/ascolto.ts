// Le note dell'Ascolto di verifica (ADR-0008), dalla partitura disegnata da abcjs: abcjs dà i tempi (al Q: della
// Lettura), le altezze reali (con la chiave di violino ottava bassa già un'ottava sotto) e gli elementi SVG da
// illuminare. Le note legate arrivano già unite in una sola, con la durata intera.
import abcjs, { type TuneObject } from 'abcjs';
import type { NotaDaSuonare } from './note';

type Evento = {
  type: string;
  milliseconds: number;
  elements?: Element[][];
  midiPitches?: { pitch: number; duration: number }[];
};

export type Ascolto = {
  note: NotaDaSuonare[];
  /** Per ogni nota, gli elementi SVG della partitura (la nota e le sue sillabe) da illuminare. */
  elementi: Element[][];
};

/** L'Andamento degli esempi dei Capitoli senza Q: (ticket #35), in semiminime al minuto: Q:1/4=80. */
export const SEMIMINIME_AL_MINUTO = 80;

/**
 * Le note di una partitura, ai suoi tempi. Senza Q: suona a SEMIMINIME_AL_MINUTO: abcjs conta le pulsazioni del
 * Tempo (in 6/8 la semiminima puntata), quindi l'Andamento si converte, e si arrotonda come fa TimingCallbacks.
 */
export function ascoltoDi(partitura: TuneObject): Ascolto {
  // setUpAudio mette su ogni nota le sue altezze MIDI, che TimingCallbacks riporta negli eventi.
  partitura.setUpAudio({});
  const conQ = !!partitura.metaText?.tempo;
  const pulsazioni = conQ ? undefined : Math.round((SEMIMINIME_AL_MINUTO * 0.25) / partitura.getBeatLength());
  const eventi = new abcjs.TimingCallbacks(partitura, pulsazioni ? { qpm: pulsazioni } : {}).noteTimings as Evento[];
  // Le durate di midiPitches sono in semibrevi.
  const msPerSemibreve = partitura.millisecondsPerMeasure(pulsazioni) / partitura.getBarLength();
  const note: NotaDaSuonare[] = [];
  const elementi: Element[][] = [];
  for (const e of eventi) {
    if (e.type !== 'event') continue;
    for (const p of e.midiPitches ?? []) {
      note.push({ midi: p.pitch, inizio: e.milliseconds / 1000, durata: (p.duration * msPerSemibreve) / 1000 });
      elementi.push((e.elements ?? []).flat());
    }
  }
  return { note, elementi };
}

/**
 * L'Ascolto di una partitura, pronto per il lettore: le note, e l'evidenziazione che illumina la nota che suona con
 * le sue sillabe (la classe "suona"). Con i comandi, la pagina scorre perché la nota resti in vista sopra di loro:
 * serve alle Letture, lunghe; gli esempi dei Capitoli e degli Esercizi stanno accanto al loro pulsante.
 */
export function ascoltoIlluminato(partitura: TuneObject, comandi?: Element) {
  let elementi: Element[][] = [];
  let illuminati: Element[] = [];
  return {
    note: () => {
      const a = ascoltoDi(partitura);
      elementi = a.elementi;
      return a.note;
    },
    evidenzia: (indice: number) => {
      for (const e of illuminati) e.classList.remove('suona');
      illuminati = elementi[indice] ?? [];
      for (const e of illuminati) e.classList.add('suona');
      if (illuminati[0] && comandi) inVista(illuminati[0], comandi);
    },
  };
}

/** Le altezze MIDI reali di un ABC, senza ripetizioni: quelle di cui caricare i campioni prima di suonarlo. */
export function altezzeDi(abc: string): number[] {
  const [partitura] = abcjs.parseOnly(abc);
  if (!partitura) return [];
  partitura.setUpAudio({});
  const altezze = partitura.lines
    .flatMap((r) => r.staff ?? [])
    .flatMap((s) => s.voices ?? [])
    .flat()
    .flatMap((e) => (e as { midiPitches?: { pitch: number }[] }).midiPitches ?? [])
    .map((p) => p.pitch);
  return [...new Set(altezze)].sort((a, b) => a - b);
}

/** Scorre la pagina se l'elemento è uscito dallo schermo o sta sotto la barra dei comandi (su telefono è in basso). */
function inVista(elemento: Element, comandi: Element) {
  const r = elemento.getBoundingClientRect();
  const barra = comandi.getBoundingClientRect();
  const basso = barra.top > window.innerHeight / 2 ? barra.top : window.innerHeight;
  if (r.top >= 0 && r.bottom <= basso) return;
  const subito = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollBy({ top: r.top - basso / 3, behavior: subito ? 'auto' : 'smooth' });
}
