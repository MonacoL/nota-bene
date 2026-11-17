// Il lettore dell'audio di una Lettura (ADR-0008), nel browser: Riferimento tonale e Ascolto di verifica con lo
// SplendidGrandPiano di smplr, un oscillatore a triangolo di ripiego se i campioni non arrivano, una funzione alla
// volta. Le note si programmano tutte sull'orologio dell'AudioContext; l'evidenziazione segue lo stesso orologio.
// Fuori dalle Letture suona anche il battito di mani (#86) e i suoni tenuti dell'organo sintetizzato (#90, ADR-0012).
//
// iOS (ricerca #4): tocca() va chiamata in modo sincrono nel gestore del click. Prima di ogni await imposta
// navigator.audioSession.type = "playback" (senza, l'interruttore silenzioso zittisce la Web Audio API) e
// chiama resume(), anche quando il contesto è "interrupted" dopo una telefonata.
import { SplendidGrandPiano } from 'smplr';
import { fileCampione, VELOCITY, VELOCITY_SUONATA } from './campioni';
import type { NotaDaSuonare } from './note';
import { ARMONICHE, type SuonoTenuto } from './battimenti';

/** Nelle Letture il Riferimento tonale e l'Ascolto di verifica; nei Capitoli un Ascolto dell'esempio per esempio. */
export type Funzione = string;

export type Opzioni<F extends Funzione> = {
  /** L'indirizzo della cartella dei campioni, con la barra finale. */
  campioni: string;
  /** Le altezze MIDI che la Lettura può suonare: si caricano solo i loro campioni. */
  note: readonly number[];
  /** Chiamata quando una funzione parte o si ferma (null). */
  cambio: (funzione: F | null) => void;
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
type Esecuzione<F> = { funzione: F; ferma: () => void };

export function creaLettore<F extends Funzione = 'riferimento' | 'ascolto'>(opzioni: Opzioni<F>) {
  let ctx: AudioContext | undefined;
  let piano: Piano | undefined;
  /** true se tutti i campioni sono arrivati; false se ne manca almeno uno, e allora si suona con l'oscillatore. */
  let pronto: Promise<boolean> | undefined;
  let inCorso: Esecuzione<F> | undefined;
  /** Il volume dei suoni tenuti, da 0 a 1, e l'uscita di quelli che suonano adesso. */
  let livello = 1;
  let uscitaTenuti: GainNode | undefined;

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

  function caricaPiano(ctx: AudioContext): Promise<boolean> {
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
    piano = SplendidGrandPiano(ctx, {
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
  function tocca(
    funzione: F,
    note: () => NotaDaSuonare[],
    evidenzia?: (indice: number) => void,
    /** Quando le note sono programmate: l'istante della prima, sull'orologio del contesto ("Batti la pulsazione", #86). */
    partito?: (zero: number, ctx: AudioContext) => void,
  ) {
    const ctx = sblocca();
    const eraQuesta = inCorso?.funzione === funzione;
    ferma();
    if (eraQuesta) return;
    pronto ??= caricaPiano(ctx);
    let fermata = false;
    const azioni: (() => void)[] = [];
    const esecuzione: Esecuzione<F> = {
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
      const troncate = daSuonare.map((n) => ({ ...n, durata: Math.min(n.durata, DURATA_MASSIMA) }));
      const zero = ctx.currentTime + ANTICIPO;
      for (const n of troncate) {
        azioni.push(conPiano ? suonaPiano(n.midi, zero + n.inizio, n.durata) : suonaOscillatore(ctx, n.midi, zero + n.inizio, n.durata));
      }
      const fine = Math.max(0, ...troncate.map((n) => n.inizio + n.durata)) + RILASCIO;
      azioni.push(segui(ctx, zero, daSuonare, fine, evidenzia, () => {
        if (inCorso === esecuzione) ferma();
      }));
      partito?.(zero, ctx);
    });
  }

  /**
   * Il battito di mani sintetizzato di "Semplice o composto" (#86): forte sulla pulsazione, debole sulle
   * suddivisioni. Come tocca(), va chiamata nel gestore del click; non aspetta i campioni.
   */
  function toccaBattiti(funzione: F, battiti: readonly { inizio: number; forte: boolean }[]) {
    const ctx = sblocca();
    const eraQuesta = inCorso?.funzione === funzione;
    ferma();
    if (eraQuesta) return;
    const azioni: (() => void)[] = [];
    const esecuzione: Esecuzione<F> = { funzione, ferma: () => azioni.forEach((a) => a()) };
    inCorso = esecuzione;
    opzioni.cambio(funzione);
    const zero = ctx.currentTime + ANTICIPO;
    for (const b of battiti) azioni.push(suonaBattito(ctx, zero + b.inizio, b.forte));
    const fine = Math.max(0, ...battiti.map((b) => b.inizio)) + 0.3;
    azioni.push(segui(ctx, zero, [], fine, undefined, () => {
      if (inCorso === esecuzione) ferma();
    }));
  }

  /**
   * Suoni tenuti con l'organo (#90): gli esempi dei battimenti e la nota tenuta di "Trova l'unisono". Un suono con
   * fine Infinity suona finché non si ferma. Come tocca(), va chiamata nel gestore del click; non aspetta i campioni.
   */
  function toccaTenuti(funzione: F, suoni: readonly SuonoTenuto[]) {
    const ctx = sblocca();
    const eraQuesta = inCorso?.funzione === funzione;
    ferma();
    if (eraQuesta) return;
    const uscita = ctx.createGain();
    uscita.gain.value = livello;
    uscita.connect(ctx.destination);
    uscitaTenuti = uscita;
    const azioni: (() => void)[] = [];
    const esecuzione: Esecuzione<F> = {
      funzione,
      ferma: () => {
        azioni.forEach((a) => a());
        if (uscitaTenuti === uscita) uscitaTenuti = undefined;
      },
    };
    inCorso = esecuzione;
    opzioni.cambio(funzione);
    const zero = ctx.currentTime + ANTICIPO;
    for (const s of suoni) azioni.push(suonaOrgano(ctx, uscita, zero, s));
    const fine = Math.max(...suoni.map((s) => s.fine));
    if (Number.isFinite(fine)) {
      azioni.push(segui(ctx, zero, [], fine + 0.2, undefined, () => {
        if (inCorso === esecuzione) ferma();
      }));
    }
  }

  /** Il volume dei suoni tenuti, da 0 a 1: cambia anche quello che sta suonando. */
  function volume(v: number) {
    livello = v;
    if (uscitaTenuti && ctx) uscitaTenuti.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
  }

  function suonaPiano(midi: number, quando: number, durata: number): () => void {
    const stop = piano!.start({ note: midi, time: quando, duration: durata, velocity: VELOCITY_SUONATA });
    return () => stop();
  }

  return {
    tocca,
    toccaBattiti,
    toccaTenuti,
    volume,
    ferma,
    /** La funzione che sta suonando, o che aspetta i campioni per farlo. */
    inCorso: (): F | null => inCorso?.funzione ?? null,
    /** Per lasciare la pagina: ferma tutto e chiude il contesto. */
    chiudi() {
      ferma();
      void ctx?.close();
    },
  };
}

/** Il rumore bianco del battito di mani, uno per contesto. */
const rumori = new WeakMap<AudioContext, AudioBuffer>();

/** Un battito di mani: rumore filtrato attorno ai 1200 Hz, che si spegne in 80 ms. Il debole è un terzo del forte. */
function suonaBattito(ctx: AudioContext, quando: number, forte: boolean): () => void {
  let rumore = rumori.get(ctx);
  if (!rumore) {
    rumore = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.1), ctx.sampleRate);
    const dati = rumore.getChannelData(0);
    for (let i = 0; i < dati.length; i++) dati[i] = Math.random() * 2 - 1;
    rumori.set(ctx, rumore);
  }
  const sorgente = ctx.createBufferSource();
  sorgente.buffer = rumore;
  const filtro = ctx.createBiquadFilter();
  filtro.type = 'bandpass';
  filtro.frequency.value = 1200;
  const volume = ctx.createGain();
  volume.gain.setValueAtTime(forte ? 0.9 : 0.3, quando);
  volume.gain.exponentialRampToValueAtTime(0.001, quando + 0.08);
  sorgente.connect(filtro).connect(volume).connect(ctx.destination);
  sorgente.start(quando);
  sorgente.stop(quando + 0.1);
  return () => sorgente.stop();
}

/** L'oscillatore a triangolo, con un inviluppo breve per non fare click. */
function suonaOscillatore(ctx: AudioContext, midi: number, quando: number, durata: number): () => void {
  const osc = ctx.createOscillator();
  const volume = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = 440 * 2 ** ((midi - 69) / 12);
  volume.gain.setValueAtTime(0, quando);
  volume.gain.linearRampToValueAtTime(0.2, quando + 0.02);
  volume.gain.setValueAtTime(0.2, quando + durata);
  volume.gain.linearRampToValueAtTime(0, quando + durata + 0.15);
  osc.connect(volume).connect(ctx.destination);
  osc.start(quando);
  osc.stop(quando + durata + 0.2);
  return () => {
    const adesso = ctx.currentTime;
    volume.gain.cancelScheduledValues(adesso);
    volume.gain.setValueAtTime(volume.gain.value, adesso);
    volume.gain.linearRampToValueAtTime(0, adesso + 0.05);
    osc.stop(adesso + 0.06);
  };
}

/** Le onde dell'organo, una per contesto. */
const onde = new WeakMap<AudioContext, PeriodicWave>();

/** Un suono tenuto con l'organo: la frequenza segue i punti, e l'inviluppo è morbido all'inizio e alla fine. */
function suonaOrgano(ctx: AudioContext, uscita: AudioNode, zero: number, suono: SuonoTenuto): () => void {
  let onda = onde.get(ctx);
  if (!onda) {
    const reale = new Float32Array([0, ...ARMONICHE]);
    onda = ctx.createPeriodicWave(reale, new Float32Array(reale.length));
    onde.set(ctx, onda);
  }
  const osc = ctx.createOscillator();
  osc.setPeriodicWave(onda);
  const [primo, ...altri] = suono.punti;
  osc.frequency.setValueAtTime(primo![1], zero + primo![0]);
  for (const [t, f] of altri) osc.frequency.linearRampToValueAtTime(f, zero + t);
  const volume = ctx.createGain();
  const [inizio, fine] = [zero + suono.inizio, zero + suono.fine];
  volume.gain.setValueAtTime(0, inizio);
  volume.gain.linearRampToValueAtTime(0.25, inizio + 0.1);
  if (Number.isFinite(fine)) {
    volume.gain.setValueAtTime(0.25, fine - 0.3);
    volume.gain.linearRampToValueAtTime(0, fine);
  }
  osc.connect(volume).connect(uscita);
  osc.start(inizio);
  if (Number.isFinite(fine)) osc.stop(fine + 0.05);
  return () => {
    const adesso = ctx.currentTime;
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
  ctx: AudioContext,
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
    const t = ctx.currentTime - zero;
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
