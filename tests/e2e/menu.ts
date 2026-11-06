// Il menu dell'intestazione: link da 440 px in su, pulsante con le lineette sotto.
import type { Page } from '@playwright/test';

export const LARGHEZZA_LINK = 440;

export function telefono(page: Page): boolean {
  return page.viewportSize()!.width < LARGHEZZA_LINK;
}

/** I link del menu visibili: sul telefono apre prima il pulsante con le lineette. */
export async function vociDelMenu(page: Page) {
  const header = page.locator('header');
  if (!telefono(page)) return header.locator('nav.nav').getByRole('link');
  await header.locator('.menu summary').click();
  return header.locator('.menu nav').getByRole('link');
}
