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

export function ascoltoDi(partitura: TuneObject): Ascolto {
  // setUpAudio mette su ogni nota le sue altezze MIDI, che TimingCallbacks riporta negli eventi.
  partitura.setUpAudio({});
  const eventi = new abcjs.TimingCallbacks(partitura, {}).noteTimings as Evento[];
  // Le durate di midiPitches sono in semibrevi.
  const msPerSemibreve = partitura.millisecondsPerMeasure() / partitura.getBarLength();
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
 * L'Ascolto di verifica di una partitura, pronto per il lettore: le note, e l'evidenziazione che illumina la nota
 * che suona con le sue sillabe (la classe "suona") e fa scorrere la pagina perché resti in vista sopra i comandi.
 */
export function ascoltoIlluminato(partitura: TuneObject, comandi: Element) {
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
      if (illuminati[0]) inVista(illuminati[0], comandi);
    },
  };
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
