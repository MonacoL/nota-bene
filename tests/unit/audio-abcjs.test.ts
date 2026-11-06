// Le note caricate e le note suonate (ADR-0008): i campioni da caricare li sceglie audioDellaLettura alla build,
// con leggiAbc; l'Ascolto di verifica suona le altezze che dà abcjs. Se le due letture dell'ABC divergono
// (alterazioni, chiave di tenore ottava bassa), una nota non ha il suo campione e resta muta.
import { readFileSync } from 'node:fs';
import abcjs from 'abcjs';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { audioDellaLettura } from '../../src/audio/note';
import { catalogo } from '../../src/letture/catalogo';
import { conSoluzione } from '../../src/letture/soluzione';
import type { Tonalita } from '../../src/sillabe';

const capitoli = (parse(readFileSync('contenuti/percorso.yml', 'utf8')) as { id: string }[]).map((v) => v.id);

type Elemento = { midiPitches?: { pitch: number }[] };

/**
 * Le altezze che l'Ascolto di verifica suona, dall'ABC che la pagina dà ad abcjs. ascoltoDi le legge dagli eventi
 * di TimingCallbacks, che in Node non partono perché la partitura non è disegnata; gli eventi però riportano i
 * midiPitches che setUpAudio mette su ogni nota, e questi si leggono anche qui.
 */
function suonate(abc: string): number[] {
  const [partitura] = abcjs.parseOnly(abc);
  partitura!.setUpAudio({});
  const elementi = partitura!.lines.flatMap((r) => r.staff ?? []).flatMap((s) => s.voices ?? []).flat() as Elemento[];
  const altezze = elementi.flatMap((e) => e.midiPitches ?? []).map((p) => p.pitch);
  return [...new Set(altezze)].sort((a, b) => a - b);
}

/** Le altezze suonate che non hanno un campione caricato. */
function senzaCampione(abc: string, tonalita: Tonalita): number[] {
  const caricate = audioDellaLettura(abc, tonalita).note;
  return suonate(abc).filter((n) => !caricate.includes(n));
}

describe('ogni nota suonata ha il suo campione', () => {
  for (const cartella of ['letture', 'tests/e2e/letture-esempio']) {
    const esito = catalogo(cartella, { capitoli });
    if (!esito.ok) throw new Error(`il catalogo di ${cartella} non è valido`);
    for (const l of esito.letture.filter((l) => l.stato === 'pubblicata')) {
      it(`${cartella}: ${l.id}`, () => {
        expect(suonate(l.abc).length).toBeGreaterThan(0);
        expect(senzaCampione(conSoluzione(l.abc, l.sillabe), l.tonalita)).toEqual([]);
      });
    }
  }

  const fa: Tonalita = { tonica: { lettera: 'F', alterazione: 0 }, modo: 'maggiore' };
  const abc = (k: string, corpo: string) => `X:1\nM:4/4\nL:1/4\nQ:1/4=70\nK:${k}\n${corpo} |]\n`;

  // I cambi [K:...] nella musica non arrivano al sito: il catalogo li rifiuta (le Mutazioni stanno in edizione.yml).
  it("con alterazioni che valgono fino alla stanghetta, bequadri e legature anche oltre la stanghetta", () => {
    expect(senzaCampione(abc('F major', '^F F =B B | _e e- e ^c- | c ^G G z |'), fa)).toEqual([]);
  });

  it("in chiave di tenore ottava bassa e di basso", () => {
    // Fa3 = 53, Sol♯3 = 56: abcjs suona il tenore un'ottava sotto la scritta.
    expect(suonate(abc('F major clef=treble-8', 'F ^G'))).toEqual([53, 56]);
    expect(senzaCampione(abc('F major clef=treble-8', 'F ^G A B | c d =B2'), fa)).toEqual([]);
    expect(senzaCampione(abc('F major clef=bass', 'F, ^G, A, B, | C D =B,2'), fa)).toEqual([]);
  });
});
