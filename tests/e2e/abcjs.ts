// Gli helper degli end-to-end sui pentagrammi disegnati da abcjs che vanno a capo: le Letture (ticket #30, la
// .partitura) e gli esempi dei Capitoli (ticket #63, ogni .pentagramma). Ogni helper prende i contenitori in cui
// abcjs ha disegnato; la colonna di un contenitore è il suo elemento padre.
import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Apre la pagina e aspetta che ogni contenitore abbia il suo disegno, fatto con il font del sito. `quanti` è il numero
 * di contenitori: va dato se nascono nel browser (la .partitura della Lettura, client:only), altrimenti si contano
 * nell'HTML.
 */
export async function apri(page: Page, percorso: string, contenitori: string, quanti?: number) {
  await page.goto(percorso);
  await page.evaluate(() => document.fonts.ready);
  quanti ??= await page.locator(contenitori).count();
  await expect(page.locator(`${contenitori} svg`)).toHaveCount(quanti);
}

/** Il rigo di ogni nota del contenitore (da 0), in ordine: due a capo uguali danno la stessa lista. */
export function rigoDiOgniNota(contenitore: Locator): Promise<number[]> {
  return contenitore.locator('.abcjs-note').evaluateAll((note) =>
    note.map((n) => Number(/abcjs-l(\d+)/.exec(n.getAttribute('class') ?? '')?.[1])),
  );
}

/** Quanti righi ha il disegno nel contenitore. */
export async function righiDi(contenitore: Locator): Promise<number> {
  return new Set(await rigoDiOgniNota(contenitore)).size;
}

/**
 * Le coppie di segni vicini, sullo stesso rigo dello stesso contenitore, che si toccano o si sovrappongono:
 * "sinistra | destra". `segni` sceglie quali: le Sillabe e il Testo ('.abcjs-lyric tspan'), le annotazioni
 * ('.abcjs-annotation').
 */
export function segniCheSiToccano(contenitori: Locator, segni: string): Promise<string[]> {
  return contenitori.evaluateAll(
    (tutti, segni) =>
      tutti.flatMap((c) => {
        const scatole = [...c.querySelectorAll(segni)]
          .filter((s) => s.textContent?.trim())
          .map((s) => ({ r: s.getBoundingClientRect(), testo: s.textContent!.trim() }));
        return scatole.flatMap((a) =>
          scatole
            .filter((b) => a !== b && Math.abs(a.r.top - b.r.top) < 2 && a.r.left <= b.r.left && b.r.left < a.r.right + 1)
            .map((b) => `${a.testo} | ${b.testo}`),
        );
      }),
    segni,
  );
}

/**
 * Ciò che esce dal bordo destro del foglio, dentro il suo margine: note, stanghette, annotazioni e ogni segno di Testo e Soluzione, con
 * il contenitore, il rigo e di quanti px. Una Battuta che da sola non sta nel rigo resta intera e sborda: qui si vede.
 */
export function fuoriDalBordo(contenitori: Locator): Promise<string[]> {
  return contenitori.evaluateAll((tutti) =>
    tutti.flatMap((c, i) => {
      // Dentro il margine del foglio color carta (ADR-0010), che è il bordo vero.
      const destra = c.getBoundingClientRect().right - parseFloat(getComputedStyle(c).paddingRight) + 1;
      const elementi = [...c.querySelectorAll('.abcjs-note, .abcjs-bar, .abcjs-annotation, .abcjs-lyric tspan')];
      return elementi.flatMap((e) => {
        const fuori = e.getBoundingClientRect().right - destra;
        if (fuori <= 0) return [];
        const rigo = /abcjs-l(\d+)/.exec(e.closest('[class*="abcjs-l"]')?.getAttribute('class') ?? '')?.[1];
        const cosa = e.textContent?.trim() || e.getAttribute('class');
        return [`disegno ${i + 1}, rigo ${Number(rigo) + 1}: "${cosa}" esce di ${Math.ceil(fuori)} px`];
      });
    }),
  );
}

/** Se la pagina scorre in orizzontale: la sua larghezza supera quella della finestra. */
export function scorreInOrizzontale(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
}
