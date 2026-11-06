// Il lettore dell'audio di una Lettura (ADR-0008), nel browser: Riferimento tonale e Ascolto di verifica con lo
// SplendidGrandPiano di smplr, un oscillatore a triangolo di ripiego se i campioni non arrivano, una funzione alla
// volta. Le note si programmano tutte sull'orologio dell'AudioContext; l'evidenziazione segue lo stesso orologio.
//
// iOS (ricerca #4): tocca() va chiamata in modo sincrono nel gestore del click. Prima di ogni await imposta
// navigator.audioSession.type = "playback" (senza, l'interruttore silenzioso zittisce la Web Audio API) e
// chiama resume(), anche quando il contesto è "interrupted" dopo una telefonata.
import { SplendidGrandPiano } from 'smplr';
import { fileCampione, VELOCITY, VELOCITY_SUONATA } from './campioni';
import type { NotaDaSuonare } from './note';

export type Funzione = 'riferimento' | 'ascolto';

export type Opzioni = {
  /** L'indirizzo della cartella dei campioni, con la barra finale. */
  campioni: string;
  /** Le altezze MIDI che la Lettura può suonare: si caricano solo i loro campioni. */
  note: readonly number[];
  /** Chiamata quando una funzione parte o si ferma (null). */
  cambio: (funzione: Funzione | null) => void;
};

/** I campioni sono tagliati a 5 s (public/audio/pianoforte/): una nota più lunga si chiude prima, col rilascio. */
const DURATA_MASSIMA = 4.5;
const RILASCIO = 0.5;
/** Quanto si aspettano i campioni prima di suonare con l'oscillatore. */
const ATTESA_CAMPIONI = 5000;
/** Il margine fra il tocco e la prima nota, perché tutte le note siano programmate in tempo. */
const ANTICIPO = 0.1;
const CACHE = 'nota-bene-campioni-v1';

type Piano = ReturnType<typeof SplendidGrandPiano>;
type Esecuzione = { funzione: Funzione; ferma: () => void };

export function creaLettore(opzioni: Opzioni) {
  let ctx: AudioContext | undefined;
  let piano: Piano | undefined;
  /** true se tutti i campioni sono arrivati; false se ne manca almeno uno, e allora si suona con l'oscillatore. */
  let pronto: Promise<boolean> | undefined;
  let inCorso: Esecuzione | undefined;

  function sblocca(): AudioContext {
    const sessione = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (sessione) sessione.type = 'playback';
    if (!ctx) {
      ctx = new AudioContext();
      // Una telefonata su iOS porta il contesto in "interrupted": la funzione in corso si ferma, e il tocco
      // dopo lo riprende con resume().
      ctx.addEventListener('statechange', () => {
        if (ctx!.state !== 'running') ferma();
      });
    }
    if (ctx.state !== 'running') void ctx.resume();
    return ctx;
  }

  function caricaPiano(c: AudioContext): Promise<boolean> {
    let mancano = false;
    // I campioni restano in CacheStorage (solo in https, o su localhost); le risposte sbagliate non si salvano.
    const archivio = {
      async fetch(url: string) {
        const indirizzo = conNomeSicuro(url);
        const cache = 'caches' in window ? await caches.open(CACHE).catch(() => undefined) : undefined;
        const salvata = await cache?.match(indirizzo);
        if (salvata) return salvata;
        const risposta = await fetch(indirizzo).catch(() => undefined);
        if (!risposta?.ok) {
          mancano = true;
          return risposta ?? new Response(null, { status: 503 });
        }
        await cache?.put(indirizzo, risposta.clone()).catch(() => undefined);
        return risposta;
      },
    };
    piano = SplendidGrandPiano(c, {
      baseUrl: opzioni.campioni.replace(/\/$/, ''),
      storage: archivio,
      formats: ['ogg', 'm4a'],
      velocity: VELOCITY_SUONATA,
      decayTime: RILASCIO,
      notesToLoad: { notes: [...opzioni.note], velocityRange: VELOCITY },
    });
    return piano.ready.then(
      () => !mancano,
      () => false,
    ).then((ok) => {
      // Se qualche campione non è arrivato si riprova al prossimo tocco.
      if (!ok) pronto = undefined;
      return ok;
    });
  }

  /** smplr compone l'URL con il nome del campione di smplr ("MF C#1"): qui diventa quello del file ("mf-cs1"). */
  function conNomeSicuro(url: string): string {
    const barra = url.lastIndexOf('/');
    const [nome, formato] = [url.slice(barra + 1, url.lastIndexOf('.')), url.slice(url.lastIndexOf('.') + 1)];
    return `${url.slice(0, barra + 1)}${fileCampione(decodeURIComponent(nome))}.${formato}`;
  }

  function ferma() {
    const esecuzione = inCorso;
    inCorso = undefined;
    if (!esecuzione) return;
    esecuzione.ferma();
    opzioni.cambio(null);
  }

  /**
   * Il tocco su un pulsante: ferma l'altra funzione, e se questa stava suonando la ferma e basta. Va chiamata nel
   * gestore del click, prima di ogni await.
   */
  function tocca(funzione: Funzione, note: () => NotaDaSuonare[], evidenzia?: (indice: number) => void) {
    const c = sblocca();
    const eraQuesta = inCorso?.funzione === funzione;
    ferma();
    if (eraQuesta) return;
    pronto ??= caricaPiano(c);
    let fermata = false;
    const azioni: (() => void)[] = [];
    const esecuzione: Esecuzione = {
      funzione,
      ferma: () => {
        fermata = true;
        for (const a of azioni) a();
      },
    };
    inCorso = esecuzione;
    opzioni.cambio(funzione);
    const attesa = new Promise<false>((risolvi) => setTimeout(() => risolvi(false), ATTESA_CAMPIONI));
    void Promise.race([pronto, attesa]).then((conPiano) => {
      if (fermata) return;
      const daSuonare = note();
      const zero = c.currentTime + ANTICIPO;
      for (const n of daSuonare) {
        const durata = Math.min(n.durata, DURATA_MASSIMA);
        azioni.push(conPiano ? suonaPiano(n.midi, zero + n.inizio, durata) : suonaOscillatore(c, n.midi, zero + n.inizio, durata));
      }
      const fine = Math.max(0, ...daSuonare.map((n) => n.inizio + Math.min(n.durata, DURATA_MASSIMA))) + RILASCIO;
      azioni.push(segui(c, zero, daSuonare, fine, evidenzia, () => {
        if (inCorso === esecuzione) ferma();
      }));
    });
  }

  function suonaPiano(midi: number, quando: number, durata: number): () => void {
    const stop = piano!.start({ note: midi, time: quando, duration: durata, velocity: VELOCITY_SUONATA });
    return () => stop();
  }

  return {
    tocca,
    ferma,
    /** La funzione che sta suonando, o che aspetta i campioni per farlo. */
    inCorso: (): Funzione | null => inCorso?.funzione ?? null,
    /** Per lasciare la pagina: ferma tutto e chiude il contesto. */
    chiudi() {
      ferma();
      void ctx?.close();
    },
  };
}

/** L'oscillatore a triangolo, con un inviluppo breve per non fare click. */
function suonaOscillatore(c: AudioContext, midi: number, quando: number, durata: number): () => void {
  const osc = c.createOscillator();
  const volume = c.createGain();
  osc.type = 'triangle';
  osc.frequency.value = 440 * 2 ** ((midi - 69) / 12);
  volume.gain.setValueAtTime(0, quando);
  volume.gain.linearRampToValueAtTime(0.2, quando + 0.02);
  volume.gain.setValueAtTime(0.2, quando + durata);
  volume.gain.linearRampToValueAtTime(0, quando + durata + 0.15);
  osc.connect(volume).connect(c.destination);
  osc.start(quando);
  osc.stop(quando + durata + 0.2);
  return () => {
    const adesso = c.currentTime;
    volume.gain.cancelScheduledValues(adesso);
    volume.gain.setValueAtTime(volume.gain.value, adesso);
    volume.gain.linearRampToValueAtTime(0, adesso + 0.05);
    osc.stop(adesso + 0.06);
  };
}

/**
 * L'orologio dell'esecuzione: ogni 40 ms guarda l'AudioContext, evidenzia l'ultima nota partita (-1 alla fine o
 * quando si ferma) e chiama finito() quando l'ultima nota ha finito di suonare.
 */
function segui(
  c: AudioContext,
  zero: number,
  note: readonly NotaDaSuonare[],
  fine: number,
  evidenzia: ((indice: number) => void) | undefined,
  finito: () => void,
): () => void {
  let attuale = -1;
  const cambia = (indice: number) => {
    if (indice !== attuale) evidenzia?.((attuale = indice));
  };
  const orologio = setInterval(() => {
    const t = c.currentTime - zero;
    if (t >= fine) return finito();
    let indice = -1;
    for (const [i, n] of note.entries()) if (n.inizio <= t && t < n.inizio + n.durata) indice = i;
    cambia(indice);
  }, 40);
  return () => {
    clearInterval(orologio);
    cambia(-1);
  };
}
