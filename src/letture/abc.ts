// Lettura di un ABC di Lettura (ADR-0003, ADR-0004), in TypeScript puro: le Note come si leggono in partitura,
// con Battuta e posizione, per il modulo Sillabe. Lo usa il catalogo alla build e in CI; non va in rete.
import abcjs from 'abcjs';
import type { Lettera } from '../esercizi/note';
import type { NotaScritta, Tonalita } from '../sillabe';

type Accidentale = { acc: string; note: string };
type Sillabato = { syllable: string; divider: string };
type Altezza = { pitch: number; accidental?: string; startTie?: object; endTie?: boolean };

const LETTERE_ABC: Lettera[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const VALORE: Record<string, -2 | -1 | 0 | 1 | 2> = { dblflat: -2, flat: -1, natural: 0, sharp: 1, dblsharp: 2 };

export type AbcLetto = {
  note: NotaScritta[];
  /** Dal K:, solo se il Modo è scritto per esteso (major o minor): ADR-0003 vuole il Modo esplicito. */
  tonalita?: Tonalita;
  /** Il Testo delle righe w:, in una riga: "If ye love me, keep my com-mand-ments." */
  testo: string;
  /** Gli avvisi di abcjs.parseOnly, senza l'HTML con cui abcjs li sottolinea. */
  avvisi: string[];
  /** Un solo rigo, una sola Voce e nessun accordo in tutto l'ABC. */
  unaSolaVoce: boolean;
};

/** "F major", "C# minor": la Tonalità con il Modo per esteso, come nel K: e nelle Mutazioni di edizione.yml. */
export function leggiTonalita(testo: string): Tonalita | undefined {
  const k = /^\s*([A-G])([b#]?)\s+(major|minor)\b/.exec(testo);
  if (!k) return undefined;
  const alterazione = k[2] === 'b' ? -1 : k[2] === '#' ? 1 : 0;
  return { tonica: { lettera: k[1] as Lettera, alterazione }, modo: k[3] === 'major' ? 'maggiore' : 'minore' };
}

export function leggiAbc(abc: string): AbcLetto {
  const [brano] = abcjs.parseOnly(abc);
  const note: NotaScritta[] = [];
  const righe = brano!.lines.filter((l) => l.staff);
  const rigo = righe[0]!.staff![0]!;
  let unaSolaVoce = righe.every((l) => l.staff!.length === 1 && l.staff![0]!.voices!.length === 1);
  const armatura = new Map<Lettera, number>(
    (rigo.key?.accidentals as Accidentale[] | undefined ?? []).map((a) => [a.note.toUpperCase() as Lettera, VALORE[a.acc] ?? 0]),
  );
  const spostamento = rigo.clef?.type === 'treble-8' ? -1 : 0;
  let testo = '';
  let battuta = 1;
  let posizione = 0;
  // Le alterazioni scritte nella Battuta, per altezza (lettera e ottava): valgono fino alla stanghetta.
  let nellaBattuta = new Map<number, -2 | -1 | 0 | 1 | 2>();
  // La nota che apre una legatura di valore: quella che la chiude ne prende l'alterazione, anche oltre la stanghetta.
  let aperta: { pitch: number; alterazione: -2 | -1 | 0 | 1 | 2 } | undefined;
  const elementi = righe.flatMap((l) => l.staff![0]!.voices![0]!) as { el_type: string; pitches?: Altezza[]; lyric?: Sillabato[] }[];
  for (const el of elementi) {
    if (el.el_type === 'bar') {
      if (posizione > 0) battuta += 1;
      posizione = 0;
      nellaBattuta = new Map();
      continue;
    }
    if (el.el_type !== 'note') continue;
    const sillaba = el.lyric?.[0];
    if (sillaba?.syllable) testo += sillaba.syllable + (sillaba.divider === '-' ? '-' : ' ');
    posizione += 1;
    const p = el.pitches?.[0];
    if ((el.pitches?.length ?? 0) > 1) unaSolaVoce = false;
    if (!p) {
      note.push({ battuta, posizione, pausa: true });
      continue;
    }
    // pitch 0 è il Do4 scritto; ogni 7 gradi un'ottava. In treble-8 le Note reali sono un'ottava sotto.
    const lettera = LETTERE_ABC[((p.pitch % 7) + 7) % 7]!;
    const ottava = 4 + Math.floor(p.pitch / 7) + spostamento;
    if (p.accidental) nellaBattuta.set(p.pitch, VALORE[p.accidental]!);
    const legata = !!p.endTie && aperta?.pitch === p.pitch;
    const alterazione =
      legata && !p.accidental ? aperta!.alterazione : (nellaBattuta.get(p.pitch) ?? ((armatura.get(lettera) ?? 0) as -1 | 0 | 1));
    aperta = p.startTie ? { pitch: p.pitch, alterazione } : undefined;
    note.push({ battuta, posizione, nota: { lettera, alterazione, ottava }, ...(legata && { legata }) });
  }
  const avvisi = (brano!.warnings ?? []).map((a) => a.replace(/<[^>]*>/g, ''));
  return { note, tonalita: leggiTonalita(/^K:(.*)$/m.exec(abc)?.[1] ?? ''), testo: testo.trim(), avvisi, unaSolaVoce };
}
