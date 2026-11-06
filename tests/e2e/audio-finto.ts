// Un AudioContext finto per gli e2e dell'audio (ADR-0008): registra quali suoni partono, quando e quando si
// fermano, senza suonare niente. I campioni del pianoforte arrivano dalla rete finta di Playwright con il nome
// del file come contenuto, così la decodifica finta sa quale campione è. Il tempo del contesto scorre
// `velocita` volte più in fretta di quello vero, perché i test non aspettino un estratto intero.
import type { Page } from '@playwright/test';

/** Un suono registrato: un campione del pianoforte (con il detune di smplr) o l'oscillatore di ripiego. */
export type Suono = {
  tipo: 'campione' | 'oscillatore';
  /** Il nome del file del campione, come "mf-f3", oppure la frequenza dell'oscillatore. */
  campione?: string;
  detune?: number;
  frequenza?: number;
  /** La forma d'onda dell'oscillatore. */
  onda?: string;
  /** Il momento chiesto a start(), sull'orologio del contesto: è quello in cui la nota suona. */
  inizio: number;
  fine?: number;
};

export type Registro = {
  suoni: Suono[];
  /** Ogni chiamata a resume(): lo stato di prima, se è dentro il gestore di un click, e l'audioSession di quel momento. */
  resume: { stato: string; nelGesto: boolean; sessione?: string }[];
  stato: string;
  adesso: number;
};

export async function installaAudioFinto(page: Page, opzioni: { velocita?: number; campioni?: 'ok' | 'mancano'; ios?: boolean } = {}) {
  /** I file dei campioni chiesti alla rete, come "mf-f3.ogg". */
  const richieste: string[] = [];
  await page.route('**/audio/pianoforte/*', (route) => {
    const file = decodeURIComponent(new URL(route.request().url()).pathname.split('/').at(-1)!);
    richieste.push(file);
    if (opzioni.campioni === 'mancano') return route.fulfill({ status: 404, body: '' });
    return route.fulfill({ status: 200, body: file.replace(/\.(m4a|ogg)$/, ''), contentType: 'audio/mp4' });
  });
  await page.addInitScript(
    ({ velocita, ios }) => {
      const registro: Registro = { suoni: [], resume: [], stato: 'suspended', adesso: 0 };
      (window as unknown as { __audio: Registro }).__audio = registro;
      let nelGesto = false;
      // Il click in cattura arriva prima del gestore della pagina, quello in bolla dopo: in mezzo c'è il gesto
      // sincrono. Quello che succede dopo un await cade fuori.
      window.addEventListener('click', () => (nelGesto = true), true);
      window.addEventListener('click', () => (nelGesto = false));
      if (ios) (navigator as unknown as { audioSession: { type: string } }).audioSession = { type: 'auto' };

      const parametro = (value = 0) => ({
        value,
        setValueAtTime(v: number) { this.value = v; return this; },
        linearRampToValueAtTime(v: number) { this.value = v; return this; },
        exponentialRampToValueAtTime(v: number) { this.value = v; return this; },
        setTargetAtTime() { return this; },
        cancelScheduledValues() { return this; },
        cancelAndHoldAtTime() { return this; },
      });
      const nodo = <T extends object>(extra: T) => ({
        connect(destinazione: unknown) { return destinazione; },
        disconnect() {},
        ...extra,
      });

      class AudioContextFinto extends EventTarget {
        sampleRate = 48000;
        baseLatency = 0.01;
        destination = nodo({});
        audioWorklet = { addModule: () => Promise.resolve() };
        #stato = 'suspended';
        #partenza = performance.now();
        #fermo = 0;
        onstatechange: (() => void) | null = null;
        get state() { return this.#stato; }
        get currentTime() {
          if (this.#stato !== 'running') return this.#fermo;
          return this.#fermo + ((performance.now() - this.#partenza) / 1000) * velocita;
        }
        #cambia(stato: string) {
          this.#fermo = this.currentTime;
          this.#partenza = performance.now();
          this.#stato = stato;
          registro.stato = stato;
          this.onstatechange?.();
          this.dispatchEvent(new Event('statechange'));
        }
        resume() {
          registro.resume.push({ stato: this.#stato, nelGesto, sessione: (navigator as unknown as { audioSession?: { type: string } }).audioSession?.type });
          this.#cambia('running');
          return Promise.resolve();
        }
        suspend() { this.#cambia('suspended'); return Promise.resolve(); }
        close() { this.#cambia('closed'); return Promise.resolve(); }
        /** Solo per i test: il telefono interrompe l'audio, come per una chiamata su iOS. */
        interrompi() { this.#cambia('interrupted'); }
        createGain() { return nodo({ gain: parametro(1) }); }
        createBiquadFilter() { return nodo({ type: 'lowpass', frequency: parametro(350), Q: parametro(1), gain: parametro(0) }); }
        createStereoPanner() { return nodo({ pan: parametro(0) }); }
        createChannelSplitter() { return nodo({}); }
        createChannelMerger() { return nodo({}); }
        createBuffer(canali: number, lunghezza: number, frequenza: number) {
          return { numberOfChannels: canali, length: lunghezza, sampleRate: frequenza, duration: lunghezza / frequenza, getChannelData: () => new Float32Array(lunghezza) };
        }
        decodeAudioData(dati: ArrayBuffer) {
          const campione = new TextDecoder().decode(dati);
          return Promise.resolve({ ...this.createBuffer(2, 5 * 48000, 48000), campione });
        }
        createBufferSource() {
          const ctx = this;
          const sorgente = nodo({
            buffer: null as null | { campione: string },
            detune: parametro(0),
            playbackRate: parametro(1),
            loop: false,
            loopStart: 0,
            loopEnd: 0,
            onended: null as null | (() => void),
            suono: undefined as Suono | undefined,
            start(quando = 0) {
              this.suono = { tipo: 'campione', campione: this.buffer?.campione, detune: this.detune.value, inizio: quando || ctx.currentTime };
              registro.suoni.push(this.suono);
            },
            stop(quando = 0) {
              if (this.suono) this.suono.fine = Math.max(quando, ctx.currentTime);
            },
          });
          return sorgente;
        }
        createOscillator() {
          const ctx = this;
          return nodo({
            type: 'sine',
            frequency: parametro(440),
            detune: parametro(0),
            onended: null as null | (() => void),
            suono: undefined as Suono | undefined,
            start(quando = 0) {
              this.suono = { tipo: 'oscillatore', onda: this.type, frequenza: this.frequency.value, inizio: quando || ctx.currentTime };
              registro.suoni.push(this.suono);
            },
            stop(quando = 0) {
              if (this.suono) this.suono.fine = Math.max(quando, ctx.currentTime);
            },
          });
        }
      }
      let ultimo: AudioContextFinto | undefined;
      const Costruttore = function () {
        ultimo = new AudioContextFinto();
        return ultimo;
      } as unknown as typeof AudioContext;
      Object.defineProperty(window, 'AudioContext', { value: Costruttore, configurable: true, writable: true });
      Object.defineProperty(window, 'webkitAudioContext', { value: Costruttore, configurable: true, writable: true });
      Object.defineProperty(registro, 'adesso', { get: () => ultimo?.currentTime ?? 0 });
      (window as unknown as { __interrompiAudio: () => void }).__interrompiAudio = () => ultimo?.interrompi();
    },
    { velocita: opzioni.velocita ?? 1, ios: opzioni.ios ?? false },
  );
  return richieste;
}

export const registro = (page: Page) => page.evaluate(() => {
  const r = (window as unknown as { __audio: Registro }).__audio;
  return { suoni: r.suoni.map((s) => ({ ...s })), resume: [...r.resume], stato: r.stato, adesso: r.adesso };
});

// smplr chiama i campioni come nella SplendidGrandPiano: C3 è il Do centrale (MIDI 60).
const CLASSI: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
/** L'altezza MIDI che suona un campione: la nota del file più il detune in centesimi. */
export function altezza(s: Suono): number {
  if (s.tipo === 'oscillatore') return Math.round(69 + 12 * Math.log2(s.frequenza! / 440));
  const [, lettera, diesis, ottava] = /^mf-([a-g])(s?)(\d)$/.exec(s.campione!)!;
  return 12 * (Number(ottava) + 2) + CLASSI[lettera!]! + (diesis ? 1 : 0) + Math.round((s.detune ?? 0) / 100);
}
