// A capo responsive della Lettura (ticket #30, prototipo #8), in TypeScript puro: niente DOM.
// L'ABC si divide per Battuta, note e righe w: insieme (le righe w: hanno un "|" per Battuta, ADR-0003), e si
// ricompone con un rigo per gruppo di Battute. Quante Battute stanno in un rigo lo decide chi disegna e misura.

/** Una Battuta: le sue note con la stanghetta che la chiude, e il suo pezzo di ogni riga w:. */
type Battuta = { note: string; stanghetta: string; parole: string[] };

/** L'ABC di una Lettura diviso per Battuta. */
export type Divisa = { intestazione: string[]; battute: Battuta[]; quante: number };

/** Le righe w: che seguono la musica: ognuna diventa un pezzo per Battuta. */
const RIGA_W = /^w:/;

/**
 * Divide l'ABC di una Lettura per Battuta. Vale per il formato delle Letture: una sola Voce, la musica su una riga
 * e sotto le righe w: (il Testo, poi la Soluzione), con un "|" per Battuta.
 */
export function dividi(abc: string): Divisa {
  const righe = abc.trimEnd().split('\n');
  const k = righe.findIndex((r) => r.startsWith('K:'));
  const intestazione = righe.slice(0, k + 1);
  const corpo = righe.slice(k + 1).filter((r) => r.trim() && !r.startsWith('%'));
  const musica = corpo.filter((r) => !RIGA_W.test(r)).join(' ');
  const battute = battuteDi(musica);
  for (const w of corpo.filter((r) => RIGA_W.test(r))) {
    const pezzi = w.slice(2).split('|').map((p) => p.trim());
    if (pezzi.at(-1) === '') pezzi.pop();
    battute.forEach((b, i) => b.parole.push(pezzi[i] ?? ''));
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
      battute.push({ note: note.trim().replace(/\s+/g, ' '), stanghetta, parole: [] });
      note = '';
      continue;
    }
    note += c;
    i++;
  }
  if (note.trim()) battute.push({ note: note.trim().replace(/\s+/g, ' '), stanghetta: '', parole: [] });
  return battute;
}

/** L'ABC con un rigo per gruppo di Battute, ognuno con le sue righe w:. Tutti i righi, anche l'ultimo, a larghezza piena. */
export function inRighi({ intestazione, battute }: Divisa, gruppi: readonly Rigo[]): string {
  const righe = [...intestazione, '%%stretchlast 1'];
  const quanteW = battute[0]?.parole.length ?? 0;
  for (const [inizio, fine] of gruppi) {
    const rigo = battute.slice(inizio, fine);
    righe.push(rigo.map((b) => `${b.note} ${b.stanghetta || '|'}`).join(' '));
    for (let w = 0; w < quanteW; w++) righe.push(`w: ${rigo.map((b) => b.parole[w]).join(' | ')} |`);
  }
  return righe.join('\n') + '\n';
}

/** Un rigo: le Battute da `inizio` (compresa) a `fine` (esclusa), contate da 0. */
export type Rigo = [inizio: number, fine: number];

/**
 * Divide `quante` Battute in righi. Ogni rigo prende quante più Battute possibile: se ne aggiunge una alla volta
 * finché `ciSta` dice che il rigo regge. Un rigo ha sempre almeno una Battuta, anche se non ci sta.
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

/** La scatola di una sillaba disegnata, in px dello schermo. */
export type Scatola = { sinistra: number; destra: number; alto: number };

/** Lo spazio minimo tra due sillabe vicine della stessa riga, in px: con meno si toccano. */
export const SPAZIO_MINIMO = 4;

/**
 * Se due sillabe vicine della stessa riga (Testo o Soluzione) si toccano. Sono della stessa riga le sillabe che
 * stanno alla stessa altezza, a meno di qualche px.
 */
export function siToccano(scatole: readonly Scatola[]): boolean {
  const perAltezza = [...scatole].sort((a, b) => a.alto - b.alto);
  const righe: Scatola[][] = [];
  for (const s of perAltezza) {
    const ultima = righe.at(-1);
    if (ultima && s.alto - ultima[0]!.alto < SPAZIO_MINIMO) ultima.push(s);
    else righe.push([s]);
  }
  return righe.some((riga) => {
    riga.sort((a, b) => a.sinistra - b.sinistra);
    return riga.some((s, i) => i > 0 && s.sinistra < riga[i - 1]!.destra + SPAZIO_MINIMO);
  });
}
