// Il formato delle righe w: di una Lettura (ticket #30), in un posto solo: lo leggono l'a capo e il catalogo, lo
// scrivono l'import, la Soluzione e l'a capo. Il formato per chi prepara le Letture è in docs/letture.md.
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
