// Il formato delle righe w: di una Lettura (ticket #30), in un posto solo: lo leggono l'a capo e il catalogo, lo
// scrivono l'import, la Soluzione e l'a capo. Qui sta anche la variante degli esempi dei Capitoli (ticket #63), che
// possono scrivere una riga w: senza "|": i tratti si ricavano contando le note di ogni Battuta. Il formato per chi prepara le Letture è in docs/letture.md.
// Una riga w: (il Testo, o la Soluzione con le Sillabe) ha un tratto per Battuta dell'ABC, chiuso da un "|". In ogni
// tratto ogni nota prende un segno: un frammento di Testo, una Sillaba, un "_" (continua il segno di prima) o un "*"
// (nessun segno); le pause no. Una pausa multipla (Z2) è una Battuta sola dell'ABC, quindi un tratto solo.

/** Se una riga dell'ABC è una riga w:. */
export const eRigaW = (riga: string): boolean => riga.startsWith('w:');

/** Le righe w: dell'ABC, in ordine: prima il Testo, poi la Soluzione se c'è. */
export const righeW = (abc: string): string[] => abc.split('\n').filter(eRigaW);

/** I tratti di una riga w:, uno per Battuta. */
export function tratti(riga: string): string[] {
  const risultato = riga.slice(2).split('|').map((t) => t.trim());
  if (risultato.at(-1) === '') risultato.pop();
  return risultato;
}

/** La riga w: con un tratto per Battuta, ognuno chiuso da un "|". */
export const rigaW = (perBattuta: readonly string[]): string => `w: ${perBattuta.join(' | ')} |`;

/**
 * Quante note copre un tratto (ABC 2.1, 4.3): uno spazio o un "-" chiude un segno; "_" e "*" coprono una nota senza
 * segno nuovo; "~" unisce due frammenti di Testo sotto una nota; un "-" dopo uno spazio o un altro "-" copre una nota.
 */
export function noteCoperte(tratto: string): number {
  let quante = 0;
  // Se si è dentro un segno non ancora contato.
  let inSegno = false;
  for (let i = 0; i < tratto.length; i++) {
    const c = tratto[i]!;
    if (c === ' ' || c === '\t') {
      if (inSegno) quante++;
      inSegno = false;
    } else if (c === '-' || c === '_' || c === '*') {
      // Il "-" chiude il segno in corso; senza segno in corso è lui a coprire una nota. "_" e "*" la coprono sempre.
      if (inSegno) quante++;
      if (c !== '-' || !inSegno) quante++;
      inSegno = false;
    } else {
      // "\-" è un trattino scritto, dentro il segno.
      if (c === '\\') i++;
      inSegno = true;
    }
  }
  return quante + (inSegno ? 1 : 0);
}

/**
 * Quante note di una Battuta ABC prendono un segno della riga w:: un accordo conta una, le pause e gli abbellimenti
 * nessuna, e non contano i campi dentro la musica ([M:3/4]), le annotazioni ("^5ª") e le decorazioni (!fermata!).
 */
export function noteConSegno(battuta: string): number {
  const pulita = battuta
    .replace(/\[[A-Za-z]:[^\]]*\]/g, '')
    .replace(/"[^"]*"|![^!]*!|\{[^}]*\}/g, '')
    .replace(/\[[^\]]*\]/g, 'C');
  return (pulita.match(/[A-Ga-g]/g) ?? []).length;
}

/**
 * I tratti di una riga w:, uno per Battuta. Una riga senza "|" (come negli esempi dei Capitoli) si divide contando:
 * ogni Battuta prende i segni che coprono le sue `notePerBattuta`.
 */
export function trattiPerBattuta(riga: string, notePerBattuta: readonly number[]): string[] {
  if (riga.includes('|')) return tratti(riga);
  let resto = riga.slice(2).trim();
  return notePerBattuta.map((quante) => {
    const fine = fineDelTratto(resto, quante);
    const tratto = resto.slice(0, fine).trim();
    resto = resto.slice(fine).trim();
    return tratto;
  });
}

/** Dove finisce il tratto che copre `quante` note: al primo confine tra segni dopo cui le note coperte sono tante. */
function fineDelTratto(testo: string, quante: number): number {
  if (quante === 0) return 0;
  for (let i = 1; i <= testo.length; i++) {
    const confine = i === testo.length || testo[i] === ' ' || '-_*'.includes(testo[i - 1]!);
    if (confine && noteCoperte(testo.slice(0, i)) >= quante) return i;
  }
  return testo.length;
}
