// I Progressi del corista (ADR-0011): i Capitoli completati e la scelta fra Scaletta e Studio libero. Stanno solo
// sul dispositivo, in localStorage nel sito; qui lo storage arriva da fuori, così i test ne usano uno in memoria.
import type { Tipo } from '../esercizi';

/** Quante risposte giuste al primo colpo, su 10, servono perché una Serie conti per il Capitolo completato. */
export const SOGLIA_COMPLETATO = 8;

/** Quello che serve di Storage: localStorage lo è. */
export type Archivio = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** Un Capitolo con i tipi dei suoi Esercizi: è completato quando li ha riusciti tutti. */
export type CapitoloDaCompletare = { id: string; tipi: readonly Tipo[] };

/** Seguire la Scaletta, con i Prerequisiti che bloccano, o Studio libero, tutto aperto. */
export type Modo = 'scaletta' | 'libero';

/**
 * serie: i tipi di Esercizio riusciti per Capitolo. segnati: i Capitoli segnati come già studiati. modo: la scelta
 * del corista, che manca finché non ne fa una (vale la Scaletta).
 */
type Dati = { serie: Record<string, Tipo[]>; segnati: string[]; modo?: Modo };

const CHIAVE = 'nota-bene:progressi:v1';

const vuoti = (): Dati => ({ serie: {}, segnati: [] });

const elencoDiStringhe = (x: unknown): x is string[] => Array.isArray(x) && x.every((e) => typeof e === 'string');

/** I dati salvati, se hanno la forma giusta; altrimenti si ricomincia da zero, senza errori. */
function leggi(archivio: Archivio): Dati {
  try {
    const letto: unknown = JSON.parse(archivio.getItem(CHIAVE) ?? 'null');
    if (typeof letto !== 'object' || letto === null) return vuoti();
    const { serie, segnati = [], modo } = letto as Record<string, unknown>;
    if (typeof serie !== 'object' || serie === null || !Object.values(serie).every(elencoDiStringhe)) return vuoti();
    if (!elencoDiStringhe(segnati)) return vuoti();
    return { serie: serie as Dati['serie'], segnati, ...(modo === 'scaletta' || modo === 'libero' ? { modo } : {}) };
  } catch {
    // JSON rotto, o storage non disponibile (navigazione privata, dati del sito bloccati).
    return vuoti();
  }
}

/** Se l'archivio si lascia leggere: in navigazione privata o con i dati del sito bloccati lancia errori. */
function funziona(archivio: Archivio): boolean {
  try {
    archivio.getItem(CHIAVE);
    return true;
  } catch {
    return false;
  }
}

/**
 * I Progressi letti dall'archivio. Se l'archivio non funziona i Progressi valgono per questa visita: niente errori,
 * il corista studia lo stesso.
 */
export function creaProgressi(archivio: Archivio, capitoli: readonly CapitoloDaCompletare[]) {
  const tipi = new Map(capitoli.map((c) => [c.id, c.tipi]));
  const dati = leggi(archivio);
  const disponibile = funziona(archivio);
  const salva = () => {
    try {
      archivio.setItem(CHIAVE, JSON.stringify(dati));
    } catch {
      // Storage pieno o bloccato: i Progressi restano in memoria.
    }
  };

  function completato(id: string): boolean {
    if (dati.segnati.includes(id)) return true;
    const riusciti = dati.serie[id] ?? [];
    const daFare = tipi.get(id) ?? [];
    return daFare.length > 0 && daFare.every((t) => riusciti.includes(t));
  }

  /** Registra una Serie finita: dice se ha contato, cioè se ha raggiunto la soglia. */
  function registraSerie(id: string, tipo: Tipo, giuste: number): boolean {
    if (giuste < SOGLIA_COMPLETATO) return false;
    const riusciti = (dati.serie[id] ??= []);
    if (!riusciti.includes(tipo)) riusciti.push(tipo);
    salva();
    return true;
  }

  /** "Segna come già studiato": per chi arriva preparato dalle lezioni. */
  function segna(id: string): void {
    if (!dati.segnati.includes(id)) dati.segnati.push(id);
    salva();
  }

  /** I Capitoli completati, fra quelli conosciuti. */
  function completati(): Set<string> {
    return new Set([...tipi.keys()].filter(completato));
  }

  /** "Cancella i miei progressi": toglie tutto anche dallo storage. */
  function cancella(): void {
    delete dati.modo;
    Object.assign(dati, vuoti());
    try {
      archivio.removeItem(CHIAVE);
    } catch {
      // Storage non disponibile: non c'era niente da togliere.
    }
  }

  /** Senza storage è Studio libero: senza memoria dei Progressi un Capitolo resterebbe bloccato per sempre. */
  function modo(): Modo {
    return disponibile ? (dati.modo ?? 'scaletta') : 'libero';
  }

  function scegliModo(m: Modo): void {
    dati.modo = m;
    salva();
  }

  return { completato, completati, registraSerie, segna, cancella, modo, scegliModo };
}
