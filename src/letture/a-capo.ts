// A capo responsive della Lettura (ticket #30, prototipo #8), in TypeScript puro: niente DOM.
// L'ABC si divide per Battuta, note e righe w: insieme (le righe w: hanno un tratto per Battuta, ADR-0003 e
// src/letture/righe-w.ts), e si ricompone con un rigo per gruppo di Battute. Quante Battute stanno in un rigo lo
// decide chi disegna e misura.
// Un segno è ciò che una riga w: mette sotto una nota: un frammento di Testo o una Sillaba della Soluzione.
import { eRigaW, noteCoperte, rigaW, tratti } from './righe-w';

/** Una Battuta: le sue note con la stanghetta che la chiude, il suo tratto di ogni riga di Testo e della Soluzione. */
type Battuta = { note: string; stanghetta: string; testo: string[]; soluzione?: string };

/** L'ABC di una Lettura diviso per Battuta. */
export type Divisa = { intestazione: string[]; battute: Battuta[]; quante: number };

/**
 * Divide l'ABC di una Lettura per Battuta. Vale per l'ABC che dà conSoluzione (src/letture/soluzione.ts): una sola
 * Voce, la musica su una riga e sotto le righe w: del Testo e per ultima quella della Soluzione, con un tratto per
 * Battuta.
 */
export function dividi(abc: string): Divisa {
  const righe = abc.trimEnd().split('\n');
  const k = righe.findIndex((r) => r.startsWith('K:'));
  const intestazione = righe.slice(0, k + 1);
  const corpo = righe.slice(k + 1).filter((r) => r.trim() && !r.startsWith('%'));
  const battute = battuteDi(corpo.filter((r) => !eRigaW(r)).join(' '));
  const righeW = corpo.filter(eRigaW).map(tratti);
  const soluzione = righeW.pop();
  for (const [i, b] of battute.entries()) {
    b.testo = righeW.map((riga) => riga[i] ?? '');
    if (soluzione) b.soluzione = soluzione[i] ?? '';
  }
  return { intestazione, battute, quante: battute.length };
}

/** Le Battute della riga di musica: le "|" tra virgolette (annotazioni) o tra punti esclamativi non contano. */
function battuteDi(musica: string): Battuta[] {
  const battute: Battuta[] = [];
  let note = '';
  for (let i = 0; i < musica.length; ) {
    const c = musica[i]!;
    if (c === '"' || c === '!') {
      const fine = musica.indexOf(c, i + 1);
      const j = fine < 0 ? musica.length : fine + 1;
      note += musica.slice(i, j);
      i = j;
      continue;
    }
    const stanghetta = /^(?::*\[?\|+\]?:*|::)/.exec(musica.slice(i))?.[0];
    if (stanghetta && (c !== '[' || stanghetta.includes('|'))) {
      i += stanghetta.length;
      // Una stanghetta prima della prima nota (come "|:") apre la Battuta che segue.
      if (!note.trim()) {
        note = stanghetta;
        continue;
      }
      battute.push({ note: note.trim().replace(/\s+/g, ' '), stanghetta, testo: [] });
      note = '';
      continue;
    }
    note += c;
    i++;
  }
  if (note.trim()) battute.push({ note: note.trim().replace(/\s+/g, ' '), stanghetta: '', testo: [] });
  return battute;
}

/** L'ABC con un rigo per gruppo di Battute, ognuno con le sue righe w:. Tutti i righi, anche l'ultimo, a larghezza piena. */
export function inRighi({ intestazione, battute }: Divisa, gruppi: readonly Rigo[]): string {
  const righe = [...intestazione, '%%stretchlast 1'];
  const righeTesto = battute[0]?.testo.length ?? 0;
  const conSoluzione = battute[0]?.soluzione !== undefined;
  for (const [inizio, fine] of gruppi) {
    const rigo = battute.slice(inizio, fine);
    righe.push(rigo.map((b) => `${b.note} ${b.stanghetta || '|'}`).join(' '));
    for (let t = 0; t < righeTesto; t++) righe.push(rigaW(rigo.map((b) => b.testo[t]!)));
    if (conSoluzione) righe.push(rigaW(rigo.map((b) => b.soluzione!)));
  }
  return righe.join('\n') + '\n';
}

/**
 * L'ABC per misurare un rigo candidato come apparirà nella Lettura, e quale rigo dell'ABC è il candidato (da 0).
 * abcjs disegna chiave e Armatura su ogni rigo, il Tempo solo sul primo e dove cambia: un candidato che non comincia
 * dalla prima Battuta si disegna dopo un rigo con la Battuta che lo precede, e si misura solo lui.
 */
export function daMisurare(divisa: Divisa, [inizio, fine]: Rigo): { abc: string; riga: number } {
  if (inizio === 0) return { abc: inRighi(divisa, [[inizio, fine]]), riga: 0 };
  return { abc: inRighi(divisa, [[inizio - 1, inizio], [inizio, fine]]), riga: 1 };
}

/** Un rigo: le Battute da `inizio` (compresa) a `fine` (esclusa), contate da 0. */
export type Rigo = [inizio: number, fine: number];

/**
 * Divide `quante` Battute in righi. Ogni rigo prende quante più Battute possibile: se ne aggiunge una alla volta
 * finché `ciSta` dice che il rigo regge. Un rigo ha sempre almeno una Battuta: una Battuta che da sola non ci sta
 * resta da sola sul suo rigo, intera, e chi disegna lo segnala.
 */
export function righi(quante: number, ciSta: (inizio: number, fine: number) => boolean): Rigo[] {
  const risultato: Rigo[] = [];
  for (let inizio = 0; inizio < quante; ) {
    let fine = inizio + 1;
    while (fine < quante && ciSta(inizio, fine + 1)) fine++;
    risultato.push([inizio, fine]);
    inizio = fine;
  }
  return risultato;
}

/** La scatola di un segno disegnato (frammento di Testo o Sillaba), in px dello schermo. */
export type Scatola = { sinistra: number; destra: number; alto: number };

/** La distanza orizzontale minima tra due segni vicini della stessa riga, in px: con meno si toccano. */
export const DISTANZA_MINIMA = 4;

/** Di quanti px può cambiare l'altezza tra due segni della stessa riga w:. */
export const TOLLERANZA_RIGA = 4;

/**
 * Se due segni vicini della stessa riga (Testo o Soluzione) si toccano. Sono della stessa riga i segni che stanno
 * alla stessa altezza, a meno di TOLLERANZA_RIGA.
 */
export function siToccano(scatole: readonly Scatola[]): boolean {
  const perAltezza = [...scatole].sort((a, b) => a.alto - b.alto);
  const righe: Scatola[][] = [];
  for (const s of perAltezza) {
    const ultima = righe.at(-1);
    if (ultima && s.alto - ultima[0]!.alto < TOLLERANZA_RIGA) ultima.push(s);
    else righe.push([s]);
  }
  return righe.some((riga) => {
    riga.sort((a, b) => a.sinistra - b.sinistra);
    return riga.some((s, i) => i > 0 && s.sinistra < riga[i - 1]!.destra + DISTANZA_MINIMA);
  });
}

/**
 * Divide per Battuta l'ABC di un esempio di un Capitolo (ticket #63), scritto come viene: le righe w: possono non
 * avere un "|" per Battuta, e un esempio diviso a mano su più righi ha una riga w: sotto ogni rigo. Si porta nella
 * forma di una Lettura e si divide come lei.
 */
export function dividiEsempio(abc: string): Divisa {
  const righe = abc.trimEnd().split('\n');
  const k = righe.findIndex((r) => r.startsWith('K:'));
  const intestazione = righe.slice(0, k + 1);
  const corpo = righe.slice(k + 1).filter((r) => r.trim() && !r.startsWith('%'));
  // I righi scritti, ognuno con le righe w: che lo seguono (una per strofa).
  const scritti: { musica: string; righeW: string[] }[] = [];
  for (const riga of corpo) {
    if (!eRigaW(riga)) scritti.push({ musica: riga, righeW: [] });
    else scritti.at(-1)?.righeW.push(riga);
  }
  const strofe = Math.max(0, ...scritti.map((s) => s.righeW.length));
  const perStrofa: string[][] = Array.from({ length: strofe }, () => []);
  for (const { musica, righeW } of scritti) {
    const notePerBattuta = dividi([...intestazione, musica].join('\n')).battute.map((b) => noteDi(b.note));
    for (let s = 0; s < strofe; s++) {
      const riga = righeW[s];
      perStrofa[s]!.push(...(riga ? perBattuta(riga, notePerBattuta) : notePerBattuta.map(() => '')));
    }
  }
  const musica = scritti.map((s) => s.musica).join(' ');
  return dividi([...intestazione, musica, ...perStrofa.map(rigaW)].join('\n'));
}

/** I tratti di una riga w:, uno per Battuta: se la riga non ha "|", si dividono i segni contando le note. */
function perBattuta(riga: string, notePerBattuta: readonly number[]): string[] {
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

/**
 * Quante note di una Battuta prendono un segno della riga w:: un accordo è una nota, le pause no, e non contano
 * annotazioni, decorazioni e abbellimenti.
 */
function noteDi(note: string): number {
  const pulite = note
    .replace(/"[^"]*"|![^!]*!|\{[^}]*\}/g, '')
    .replace(/\[[^\]|]*\]/g, 'C');
  return pulite.match(/[A-Ga-g]/g)?.length ?? 0;
}
