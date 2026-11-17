// Le Voci del corista e il registro della nota tenuta negli Esercizi pratici in cui si canta (#90). Le estensioni
// vengono dal prototipo dell'accordatore (#88) e il maestro le deve ancora confermare.

export type Voce = 'basso' | 'tenore' | 'contralto' | 'soprano';
export const NOMI_VOCI: readonly Voce[] = ['basso', 'tenore', 'contralto', 'soprano'];

/** Altezze MIDI: da e a sono l'estensione comoda, base la prima nota proposta. */
export const VOCI: Record<Voce, { da: number; a: number; base: number }> = {
  basso: { da: 48, a: 60, base: 53 }, // Do3–Do4, Fa3
  tenore: { da: 53, a: 65, base: 57 }, // Fa3–Fa4, La3
  contralto: { da: 55, a: 67, base: 60 }, // Sol3–Sol4, Do4
  soprano: { da: 60, a: 72, base: 67 }, // Do4–Do5, Sol4
};

const NATURALI: Record<number, { it: string; en: string }> = {
  0: { it: 'Do', en: 'C' }, 2: { it: 'Re', en: 'D' }, 4: { it: 'Mi', en: 'E' }, 5: { it: 'Fa', en: 'F' },
  7: { it: 'Sol', en: 'G' }, 9: { it: 'La', en: 'A' }, 11: { it: 'Si', en: 'B' },
};

/** Le note senza alterazioni nell'estensione della Voce, dal grave all'acuto. */
export function noteNaturali(voce: Voce): number[] {
  const { da, a } = VOCI[voce];
  return Array.from({ length: a - da + 1 }, (_, i) => da + i).filter((m) => (m % 12) in NATURALI);
}

/** Il nome di una nota naturale con l'ottava, come lo scrive il sito: Do4 è il Do centrale (C4 in inglese). */
export function nomeNota(midi: number, lingua: 'it' | 'en'): string {
  const nome = NATURALI[midi % 12];
  if (!nome) throw new Error(`${midi} non è una nota naturale`);
  return `${nome[lingua]}${Math.floor(midi / 12) - 1}`;
}

/** La frequenza temperata di un'altezza MIDI, con il La4 a 440 Hz. */
export const frequenza = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
