// Il controllo dei campioni in CI (ADR-0008): ogni Lettura richiede al massimo 1 MB di campioni, accordo del
// Riferimento tonale compreso, e tutti i campioni insieme pesano al massimo 10 MB. Una Lettura scarica un solo
// formato (Safari m4a, gli altri ogg): conta il più pesante dei due.
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { campioniPer, FORMATI, GAMMA } from './campioni';

export const MASSIMO_LETTURA = 1_000_000;
export const MASSIMO_TOTALE = 10_000_000;

const mb = (byte: number) => (byte / 1_000_000).toFixed(2).replace('.', ',');

export function controllaCampioni(letture: readonly { id: string; note: readonly number[] }[], cartella: string): string[] {
  const errori: string[] = [];
  for (const { id, note } of letture) {
    const fuori = note.filter((n) => n < GAMMA.da || n > GAMMA.a);
    for (const n of fuori) errori.push(`${id}: la nota MIDI ${n} è fuori dai campioni C2–C6`);
    const campioni = campioniPer(note.filter((n) => !fuori.includes(n)));
    let peggiore = { formato: '', byte: 0 };
    for (const formato of FORMATI) {
      let byte = 0;
      for (const c of campioni) {
        const file = join(cartella, `${c}.${formato}`);
        if (existsSync(file)) byte += statSync(file).size;
        else errori.push(`${id}: manca il campione ${c}.${formato}`);
      }
      if (byte > peggiore.byte) peggiore = { formato, byte };
    }
    if (peggiore.byte > MASSIMO_LETTURA) {
      errori.push(`${id}: richiede ${mb(peggiore.byte)} MB di campioni (${peggiore.formato}), al massimo 1 MB`);
    }
  }
  const totale = readdirSync(cartella)
    .filter((f) => FORMATI.some((formato) => f.endsWith(`.${formato}`)))
    .reduce((somma, f) => somma + statSync(join(cartella, f)).size, 0);
  if (totale > MASSIMO_TOTALE) errori.push(`i campioni pesano ${mb(totale)} MB in tutto, al massimo 10 MB`);
  return errori;
}
