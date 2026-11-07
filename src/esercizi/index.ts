// Esercizi di teoria: genera(tipo, parametri, seed) → Esercizio e valuta(Esercizio, risposta) → Riscontro.
// TypeScript puro, senza Astro né DOM: gira nel browser e nei test. Ogni tipo sta nel suo file.
import * as completaLaBattuta from './completa-la-battuta';
import * as costruisciLaScala from './costruisci-la-scala';
import * as nominaLaNota from './nomina-la-nota';
import * as nominaLaSillaba from './nomina-la-sillaba';
import * as riconosciIlTempo from './riconosci-il-tempo';
import * as riconosciIntervallo from './riconosci-intervallo';
import * as rivoltaIntervallo from './rivolta-intervallo';
import * as trovaLaTonalita from './trova-la-tonalita';
import * as trovaTonicaEModo from './trova-tonica-e-modo';
import type { Testi } from './testi';

export type { Nota, Lettera, Alterazione } from './note';
export type { Testi } from './testi';
export { CHIAVI, type Chiave } from './nomina-la-nota';
export type EsercizioNominaLaNota = nominaLaNota.Esercizio;
export type EsercizioCostruisciLaScala = costruisciLaScala.Esercizio;
export type EsercizioCompletaLaBattuta = completaLaBattuta.Esercizio;
export type EsercizioRiconosciIlTempo = riconosciIlTempo.Esercizio;
export { TEMPI, FIGURE, abcBattute, durata, type Figura, type NomeTempo } from './ritmo';
export type EsercizioTrovaLaTonalita = trovaLaTonalita.Esercizio;
export type { Modo } from './trova-la-tonalita';
export type EsercizioTrovaTonicaEModo = trovaTonicaEModo.Esercizio;
export { abcScala, inScala } from './costruisci-la-scala';
export { FORME, type Forma } from './scale';
export type EsercizioNominaLaSillaba = nominaLaSillaba.Esercizio;
export type { Sillaba } from '../sillabe';
export type EsercizioRiconosciIntervallo = riconosciIntervallo.Esercizio;
export type EsercizioRivoltaIntervallo = rivoltaIntervallo.Esercizio;
export { NUMERI, QUALITA, type Numero, type Qualita, type Intervallo } from './intervalli';

/** Per ogni tipo: i parametri dichiarati nel Capitolo, l'Esercizio generato e la risposta del corista. */
type Tipi = {
  'nomina-la-nota': { parametri: nominaLaNota.Parametri; esercizio: nominaLaNota.Esercizio; risposta: nominaLaNota.Risposta };
  'nomina-la-sillaba': { parametri: nominaLaSillaba.Parametri; esercizio: nominaLaSillaba.Esercizio; risposta: nominaLaSillaba.Risposta };
  'costruisci-la-scala': { parametri: costruisciLaScala.Parametri; esercizio: costruisciLaScala.Esercizio; risposta: costruisciLaScala.Risposta };
  'riconosci-intervallo': { parametri: riconosciIntervallo.Parametri; esercizio: riconosciIntervallo.Esercizio; risposta: riconosciIntervallo.Risposta };
  'rivolta-intervallo': { parametri: rivoltaIntervallo.Parametri; esercizio: rivoltaIntervallo.Esercizio; risposta: rivoltaIntervallo.Risposta };
  'trova-la-tonalita': { parametri: trovaLaTonalita.Parametri; esercizio: trovaLaTonalita.Esercizio; risposta: trovaLaTonalita.Risposta };
  'trova-tonica-e-modo': { parametri: trovaTonicaEModo.Parametri; esercizio: trovaTonicaEModo.Esercizio; risposta: trovaTonicaEModo.Risposta };
  'completa-la-battuta': { parametri: completaLaBattuta.Parametri; esercizio: completaLaBattuta.Esercizio; risposta: completaLaBattuta.Risposta };
  'riconosci-il-tempo': { parametri: riconosciIlTempo.Parametri; esercizio: riconosciIlTempo.Esercizio; risposta: riconosciIlTempo.Risposta };
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
    case 'costruisci-la-scala':
      return costruisciLaScala.genera(parametri as Parametri<'costruisci-la-scala'>, seed) as Esercizio<T>;
    case 'trova-la-tonalita':
      return trovaLaTonalita.genera(parametri as Parametri<'trova-la-tonalita'>, seed) as Esercizio<T>;
    case 'trova-tonica-e-modo':
      return trovaTonicaEModo.genera(parametri as Parametri<'trova-tonica-e-modo'>, seed) as Esercizio<T>;
    case 'completa-la-battuta':
      return completaLaBattuta.genera(parametri as Parametri<'completa-la-battuta'>, seed) as Esercizio<T>;
    case 'riconosci-il-tempo':
      return riconosciIlTempo.genera(parametri as Parametri<'riconosci-il-tempo'>, seed) as Esercizio<T>;
    case 'riconosci-intervallo':
      return riconosciIntervallo.genera(parametri as Parametri<'riconosci-intervallo'>, seed) as Esercizio<T>;
    case 'rivolta-intervallo':
      return rivoltaIntervallo.genera(parametri as Parametri<'rivolta-intervallo'>, seed) as Esercizio<T>;
  }
}

export function valuta<T extends Tipo>(esercizio: Esercizio<T>, risposta: Risposta<T>): Riscontro {
  switch (esercizio.tipo) {
    case 'nomina-la-nota':
      return nominaLaNota.valuta(esercizio, risposta as Risposta<'nomina-la-nota'>);
    case 'nomina-la-sillaba':
      return nominaLaSillaba.valuta(esercizio, risposta as Risposta<'nomina-la-sillaba'>);
    case 'costruisci-la-scala':
      return costruisciLaScala.valuta(esercizio, risposta as Risposta<'costruisci-la-scala'>);
    case 'trova-la-tonalita':
      return trovaLaTonalita.valuta(esercizio, risposta as Risposta<'trova-la-tonalita'>);
    case 'trova-tonica-e-modo':
      return trovaTonicaEModo.valuta(esercizio, risposta as Risposta<'trova-tonica-e-modo'>);
    case 'completa-la-battuta':
      return completaLaBattuta.valuta(esercizio, risposta as Risposta<'completa-la-battuta'>);
    case 'riconosci-il-tempo':
      return riconosciIlTempo.valuta(esercizio, risposta as Risposta<'riconosci-il-tempo'>);
    case 'riconosci-intervallo':
      return riconosciIntervallo.valuta(esercizio, risposta as Risposta<'riconosci-intervallo'>);
    case 'rivolta-intervallo':
      return rivoltaIntervallo.valuta(esercizio, risposta as Risposta<'rivolta-intervallo'>);
  }
}
