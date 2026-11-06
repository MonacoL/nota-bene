// Accesso ai Capitoli dalle pagine: carica le collections, applica le regole di percorso.ts
// e, una volta per build, stampa gli avvisi di traduzione nel formato delle annotazioni di GitHub Actions.
import { getCollection, type CollectionEntry } from 'astro:content';
import { avvisiTraduzione, controllaFile, ordina, scegliTesto, vicini, type AvvisoTraduzione } from './percorso';
import type { Lingua } from '../i18n';
import type { DichiarazioneEsercizio } from './schemi';

export type Capitolo = {
  id: string;
  numero: number;
  titolo: string;
  riga: string;
  provaLetture?: 'letture' | 'avanzate';
  /** Gli Esercizi dichiarati nel file italiano, che fa fede in tutte e due le lingue; vuoto se mancano. */
  esercizi: DichiarazioneEsercizio[];
  /** Il file da mostrare in questa lingua; manca se il Capitolo è ancora in preparazione. */
  testo?: { voce: CollectionEntry<'capitoliIt'> | CollectionEntry<'capitoliEn'>; lingua: Lingua; ripiego: boolean };
};

let avvisiStampati = false;

async function carica() {
  const percorso = ordina((await getCollection('percorso')).map((v) => v.data));
  const it = new Map((await getCollection('capitoliIt')).map((c) => [c.id, c]));
  const en = new Map((await getCollection('capitoliEn')).map((c) => [c.id, c]));

  const errori = controllaFile(percorso, [...it.keys()], [...en.keys()]);
  if (errori.length) throw new Error(`Capitoli non validi:\n${errori.join('\n')}`);

  if (!avvisiStampati) {
    avvisiStampati = true;
    const avvisi = avvisiTraduzione(
      new Map([...it].map(([id, c]) => [id, c.data])),
      new Map([...en].map(([id, c]) => [id, c.data])),
    );
    stampaAvvisiTraduzione(avvisi);
  }
  return { percorso, it, en };
}

/** Stampa gli avvisi di traduzione (Capitoli e pagine di servizio) come annotazioni di GitHub Actions. */
export function stampaAvvisiTraduzione(avvisi: readonly AvvisoTraduzione[]): void {
  for (const { file, messaggio } of avvisi) console.log(`::warning file=${file},title=Traduzione::${messaggio}`);
}

/** Il Percorso in una lingua, in ordine, con il testo da mostrare per ogni Capitolo. */
export async function capitoli(lingua: Lingua): Promise<Capitolo[]> {
  const { percorso, it, en } = await carica();
  return percorso.map((v) => ({
    id: v.id,
    numero: v.numero,
    titolo: v[lingua].titolo,
    riga: v[lingua].riga,
    provaLetture: v.prova_letture,
    esercizi: it.get(v.id)?.data.esercizi ?? [],
    testo: (() => {
      const scelta = scegliTesto<CollectionEntry<'capitoliIt'> | CollectionEntry<'capitoliEn'>>(lingua, it.get(v.id), en.get(v.id));
      return scelta && { voce: scelta.testo, lingua: scelta.lingua, ripiego: scelta.ripiego };
    })(),
  }));
}

export { vicini };
