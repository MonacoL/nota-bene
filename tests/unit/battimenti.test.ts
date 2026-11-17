// I battimenti (#90): le frequenze degli esempi del Capitolo e dell'esempio di "Trova l'unisono". Senza audio: si
// controlla che cosa si suonerebbe e quanto batterebbe, con le armoniche dell'organo del sito.
import { describe, expect, it } from 'vitest';
import { battimenti, esempio, esempioUnisono, seconda } from '../../src/audio/battimenti';
import { nomeNota, noteNaturali, VOCI } from '../../src/audio/voci';

describe('battimenti: le pulsazioni fra due suoni con le loro armoniche', () => {
  it('due suoni a 220 e 223 Hz battono 3 volte al secondo', () => {
    expect(battimenti(220, 223)[0]).toBeCloseTo(3);
  });

  it('unisono, ottava e quinta giusta intonati non battono', () => {
    expect(battimenti(220, 220)).toEqual([]);
    expect(battimenti(220, 440)).toEqual([]);
    expect(battimenti(220, 330)).toEqual([]);
  });

  it("un'ottava crescente di 2 Hz batte 2 volte al secondo, fra la seconda armonica del basso e l'acuto", () => {
    expect(battimenti(220, 442)[0]).toBeCloseTo(2);
  });

  it('una quinta 220–332 Hz batte 4 volte al secondo, fra la terza armonica del basso e la seconda dell\'acuto', () => {
    expect(battimenti(220, 332)[0]).toBeCloseTo(4);
  });

  it('la quinta temperata del pianoforte batte piano, meno di una volta al secondo', () => {
    const b = battimenti(220, 220 * 2 ** (7 / 12))[0]!;
    expect(b).toBeGreaterThan(0.5);
    expect(b).toBeLessThan(1);
  });

  it("senza armoniche, come una sinusoide, un'ottava stonata non batte: per questo il sito suona con l'organo", () => {
    expect(battimenti(220, 442, 1)).toEqual([]);
  });
});

describe('seconda: la nota sopra che batte quanto si chiede', () => {
  it('stonata di 3 battiti al secondo: 223 Hz sull\'unisono, 443 sull\'ottava, 331,5 sulla quinta', () => {
    expect(seconda('unisono', 220, 3)).toBeCloseTo(223);
    expect(seconda('ottava', 220, 3)).toBeCloseTo(443);
    expect(seconda('quinta', 220, 3)).toBeCloseTo(331.5);
  });

  it('intonata: rapporti giusti, 1:1, 2:1 e 3:2', () => {
    expect(seconda('unisono', 220, 0)).toBe(220);
    expect(seconda('ottava', 220, 0)).toBe(440);
    expect(seconda('quinta', 220, 0)).toBe(330);
  });
});

describe("esempio: la prima nota da sola, poi la seconda entra stonata e scivola fino all'intervallo giusto", () => {
  for (const intervallo of ['unisono', 'ottava', 'quinta'] as const) {
    it(intervallo, () => {
      const [prima, sopra] = esempio(intervallo, 220);
      expect(prima!.inizio).toBe(0);
      expect(prima!.punti).toEqual([[0, 220]]);
      expect(sopra!.inizio).toBeGreaterThan(1);
      expect(sopra!.fine).toBe(prima!.fine);
      const [primoPunto, ultimo] = [sopra!.punti[0]!, sopra!.punti.at(-1)!];
      expect(battimenti(220, primoPunto[1])[0]).toBeCloseTo(3);
      expect(ultimo[1]).toBe(seconda(intervallo, 220, 0));
      // Dopo il glissando resta ferma sull'intervallo giusto almeno due secondi, senza battimenti.
      expect(sopra!.fine - ultimo[0]).toBeGreaterThanOrEqual(2);
    });
  }
});

describe("esempioUnisono: una voce scivola sull'unisono da sopra, poi da sotto (Trova l'unisono)", () => {
  it('parte crescente, arriva all\'unisono e ci resta; poi cala, e risale all\'unisono', () => {
    const [nota, voce] = esempioUnisono(220);
    expect(nota!.punti).toEqual([[0, 220]]);
    const frequenze = voce!.punti.map(([, f]) => f);
    expect(frequenze[0]).toBeGreaterThan(220);
    expect(frequenze).toContain(220);
    expect(Math.min(...frequenze)).toBeLessThan(220);
    expect(frequenze.at(-1)).toBe(220);
    expect(battimenti(220, frequenze[0]!)[0]).toBeGreaterThan(2);
  });
});

describe('le Voci: la nota tenuta di "Trova l\'unisono" sta nel registro della Voce', () => {
  it('ogni Voce parte da una nota comoda, dentro la sua estensione', () => {
    expect(VOCI.basso.base).toBe(53); // Fa3
    expect(VOCI.soprano.base).toBe(67); // Sol4
    for (const v of Object.values(VOCI)) {
      expect(v.base).toBeGreaterThanOrEqual(v.da);
      expect(v.base).toBeLessThanOrEqual(v.a);
    }
  });

  it('i nomi delle note, con il numero dell\'ottava', () => {
    expect(nomeNota(60, 'it')).toBe('Do4');
    expect(nomeNota(53, 'it')).toBe('Fa3');
    expect(nomeNota(67, 'en')).toBe('G4');
  });

  it('le altre note della Voce sono naturali e stanno nella sua estensione', () => {
    const note = noteNaturali('tenore');
    expect(note[0]).toBe(53);
    expect(note.at(-1)).toBe(65);
    expect(note).not.toContain(54);
  });
});
