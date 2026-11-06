// I campioni del pianoforte (ADR-0008): lo SplendidGrandPiano di smplr, un solo strato dinamico (MF), solo le
// regioni che coprono le note da C2 a C6. I file stanno in public/audio/pianoforte/, in m4a e ogg, con il loro
// file di licenza. I nomi sono quelli di smplr (che chiama C3 il Do centrale) resi sicuri per un URL:
// "MF C#1" diventa "mf-cs1".
import { pianoToPreset } from 'smplr';

/** Lo strato MF di smplr: le velocity da 85 a 100. Si suona sempre dentro questo intervallo. */
export const VELOCITY: [number, number] = [85, 100];
export const VELOCITY_SUONATA = 95;
/** Le note che i campioni coprono: da C2 (36) a C6 (84). */
export const ESTENSIONE_CAMPIONI = { da: 36, a: 84 } as const;
export const FORMATI = ['m4a', 'ogg'] as const;

/** "MF C#1" → "mf-cs1": il nome del file, senza estensione. */
export function fileCampione(nome: string): string {
  return nome.toLowerCase().replace(/\s+/g, '-').replace(/#/g, 's');
}

type Regione = { keyRange: [number, number]; sample: string };

// Le regioni dello strato MF come le costruisce smplr: ogni campione copre i tasti fino a metà strada dai vicini.
const regioni: Regione[] = pianoToPreset({ baseUrl: '', detune: 0, decayTime: 0.5 })
  .groups.filter((g) => g.velRange?.[0] === VELOCITY[0] && g.velRange?.[1] === VELOCITY[1])
  .flatMap((g) => g.regions as Regione[]);

/** Il campione che smplr carica per una nota. */
function campioneDi(nota: number): string | undefined {
  return regioni.find((r) => nota >= r.keyRange[0] && nota <= r.keyRange[1])?.sample;
}

/** I file dei campioni che servono per suonare queste note, dal più grave, senza ripetizioni. */
export function campioniPer(note: readonly number[]): string[] {
  const nomi = [...note].sort((a, b) => a - b).flatMap((n) => campioneDi(n) ?? []);
  return [...new Set(nomi.map(fileCampione))];
}
