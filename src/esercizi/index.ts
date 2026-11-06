// Esercizi di teoria: genera(tipo, parametri, seed) → Esercizio e valuta(Esercizio, risposta) → Riscontro.
// TypeScript puro, senza Astro né DOM: gira nel browser e nei test. Ogni tipo sta nel suo file.
import * as nominaLaNota from './nomina-la-nota';
import * as nominaLaSillaba from './nomina-la-sillaba';
import type { Testi } from './testi';

export type { Nota, Lettera, Alterazione } from './note';
export type { Testi } from './testi';
export { CHIAVI, type Chiave } from './nomina-la-nota';
export type EsercizioNominaLaNota = nominaLaNota.Esercizio;
export type EsercizioNominaLaSillaba = nominaLaSillaba.Esercizio;
export type { Sillaba } from '../sillabe';

/** Per ogni tipo: i parametri dichiarati nel Capitolo, l'Esercizio generato e la risposta del corista. */
type Tipi = {
  'nomina-la-nota': { parametri: nominaLaNota.Parametri; esercizio: nominaLaNota.Esercizio; risposta: nominaLaNota.Risposta };
  'nomina-la-sillaba': { parametri: nominaLaSillaba.Parametri; esercizio: nominaLaSillaba.Esercizio; risposta: nominaLaSillaba.Risposta };
};
export type Tipo = keyof Tipi;
export type Parametri<T extends Tipo = Tipo> = Tipi[T]['parametri'];
export type Esercizio<T extends Tipo = Tipo> = Tipi[T]['esercizio'];
export type Risposta<T extends Tipo = Tipo> = Tipi[T]['risposta'];

export type Riscontro = {
  esito: 'giusto' | 'sbagliato';
  /** La risposta data e quella giusta, come si leggono nel foglio di riscontro. */
  data: Testi;
  giusta: Testi;
  /** C'è sempre, anche quando la risposta è giusta. */
  spiegazione: Testi;
};

export function genera<T extends Tipo>(tipo: T, parametri: Parametri<T>, seed: number): Esercizio<T> {
  switch (tipo) {
    case 'nomina-la-nota':
      return nominaLaNota.genera(parametri as Parametri<'nomina-la-nota'>, seed) as Esercizio<T>;
    case 'nomina-la-sillaba':
      return nominaLaSillaba.genera(parametri as Parametri<'nomina-la-sillaba'>, seed) as Esercizio<T>;
  }
}

export function valuta<T extends Tipo>(esercizio: Esercizio<T>, risposta: Risposta<T>): Riscontro {
  switch (esercizio.tipo) {
    case 'nomina-la-nota':
      return nominaLaNota.valuta(esercizio, risposta as Risposta<'nomina-la-nota'>);
    case 'nomina-la-sillaba':
      return nominaLaSillaba.valuta(esercizio, risposta as Risposta<'nomina-la-sillaba'>);
  }
}
