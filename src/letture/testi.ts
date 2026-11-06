// Testi della pagina di una Lettura costruiti dai dati del catalogo, nella lingua della pagina.
// Il catalogo passa solo i dati; le parole stanno nei dizionari di src/i18n.
import { nomeNota } from '../esercizi/testi';
import type { Lingua } from '../i18n';
import type { Dizionario } from '../i18n/it';
import type { Tonalita } from '../sillabe';
import type { Lettura } from './catalogo';

const LOCALI: Record<Lingua, string> = { it: 'it-IT', en: 'en-US' };

/** Sostituisce i segnaposto {nome} di un modello. */
export const riempi = (modello: string, valori: Record<string, string | number>) =>
  modello.replace(/\{(\w+)\}/g, (_, k: string) => String(valori[k]));

/** "6 novembre 2026" / "November 6, 2026". */
export const dataEstesa = (data: Date, lingua: Lingua) =>
  new Intl.DateTimeFormat(LOCALI[lingua], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(data);

/** "Fa maggiore" / "F major". */
export const nomeTonalita = ({ tonica, modo }: Tonalita, t: Dizionario, lingua: Lingua) =>
  `${nomeNota(tonica, lingua)} ${t.lettura.modi[modo]}`;

/** La nota delle modifiche richiesta dalla CPDL License (ADR-0003): estratto e trascrizione, Mutazioni, campo libero, data. */
export function notaDelleModifiche(lettura: Lettura, t: Dizionario, lingua: Lingua): string {
  const tl = t.lettura;
  const data = dataEstesa(lettura.modificata, lingua);
  return [
    riempi(tl.notaEstratto, { voce: tl.voci[lettura.voce], inizio: lettura.battute.inizio, fine: lettura.battute.fine }),
    ...lettura.mutazioni.map((m) => riempi(tl.notaMutazione, { battuta: m.battuta, tonalita: nomeTonalita(m.tonalita, t, lingua) })),
    ...(lettura.modifiche ? [lettura.modifiche[lingua]] : []),
    riempi(tl.notaData, { data }),
  ].join(' ');
}
