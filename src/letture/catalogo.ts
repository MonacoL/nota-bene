// Catalogo delle Letture (ADR-0003, ADR-0004, ADR-0005), in TypeScript puro: dalla cartella delle Letture
// restituisce le Letture pronte per le pagine oppure gli errori, ciascuno con Lettura e regola. Non va in rete.
// Lo usano la build delle pagine e la validazione in CI.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'astro/zod';
import { parse } from 'yaml';
import { sillabe as calcolaSillabe, type Mutazione, type NotaScritta, type Sillaba, type Tonalita } from '../sillabe';
import { leggiAbc, leggiTonalita } from './abc';

export const VOCI = ['soprano', 'contralto', 'tenore', 'basso'] as const;
export type Voce = (typeof VOCI)[number];

const FONTI = { mutopia: 'Mutopia', cpdl: 'CPDL' } as const;
/** Le licenze accettate (ricerca "Formati e licenze di CPDL e Mutopia", #3): niente NC, ND né "Personal". */
export const LICENZE = ['PD', 'CC BY', 'CC BY-SA', 'CPDL License'] as const;
const CC0 = { nome: 'CC0 1.0', url: 'https://creativecommons.org/publicdomain/zero/1.0/' };

const schemaLettura = z
  .object({
    id: z.string(),
    voce: z.enum(VOCI),
    battute: z.tuple([z.number().int().positive(), z.number().int().positive()]),
    prerequisiti: z.array(z.string()).nonempty(),
    /** ADR-0004: battuta di origine, posizione della nota nella Battuta e nuova Tonalità, per esempio "C major". */
    mutazioni: z
      .array(
        z
          .object({
            battuta: z.number().int().positive(),
            posizione: z.number().int().positive(),
            tonalita: z.string().transform((t, ctx) => {
              const tonalita = leggiTonalita(t);
              if (!tonalita) ctx.addIssue({ code: 'custom', message: `"${t}" non è una Tonalità con il Modo per esteso, come "C major"` });
              return tonalita!;
            }),
          })
          .strict(),
      )
      .default([]),
    modificata: z.coerce.date(),
    stato: z.enum(['pubblicata', 'ritirata']).default('pubblicata'),
  })
  .strict();

const schemaEdizione = z
  .object({
    brano: z.string().min(1),
    autore: z.string().min(1),
    fonte: z.enum(['mutopia', 'cpdl']),
    edizione: z.string().min(1),
    url: z.url(),
    editore: z.string().min(1),
    licenza: z
      .object({
        tipo: z.string(),
        come_appare: z.string().min(1),
        url: z.url(),
        consultata: z.coerce.date(),
        prova: z.string().min(1),
      })
      .strict(),
    trascrizioni: z.literal('CC0').optional(),
    sorgente: z.object({ file: z.string().min(1), sha256: z.string().regex(/^[0-9a-f]{64}$/) }).strict(),
    letture: z.array(schemaLettura).nonempty(),
  })
  .strict();

export type Lettura = {
  /** `<brano>/<voce>-<inizio>-<fine>`: si assegna alla pubblicazione e non cambia più. */
  id: string;
  brano: string;
  autore: string;
  voce: Voce;
  /** Le Battute di origine nel Brano. */
  battute: { inizio: number; fine: number };
  abc: string;
  testo: string;
  /** Una Sillaba per ogni nota attaccata, in ordine. */
  sillabe: Sillaba[];
  /** La Tonalità in vigore all'inizio dell'estratto. */
  tonalita: Tonalita;
  mutazioni: Mutazione[];
  prerequisiti: string[];
  /** Avanzata se tra i Prerequisiti c'è il Capitolo "DO mobile avanzato". */
  blocco: 'normale' | 'avanzata';
  attribuzione: {
    fonte: (typeof FONTI)[keyof typeof FONTI];
    edizione: string;
    url: string;
    editore: string;
    licenza: { nome: string; url: string };
    /** Solo per le Edizioni di pubblico dominio: la licenza delle nostre trascrizioni (ADR-0005). */
    trascrizione?: { nome: string; url: string };
  };
  stato: 'pubblicata' | 'ritirata';
};

export type Errore = { lettura: string; regola: string; messaggio: string };
export type Esito = { ok: true; letture: Lettura[] } | { ok: false; errori: Errore[] };

export type Opzioni = {
  /** Gli id dei Capitoli del Percorso: i Prerequisiti devono essere tra questi. */
  capitoli: readonly string[];
  /** Il registro della versione pubblicata (in CI da origin/main): nessuno dei suoi id può sparire. */
  registroPrecedente?: readonly string[];
};

const REGISTRO = 'pubblicate.txt';

/** Gli id del registro, uno per riga; le righe vuote e i commenti con # non contano. */
export function leggiRegistro(testo: string): string[] {
  return testo
    .split('\n')
    .map((r) => r.trim())
    .filter((r) => r && !r.startsWith('#'));
}

export function catalogo(cartella: string, opzioni: Opzioni): Esito {
  const errori: Errore[] = [];
  const letture: Lettura[] = [];
  // Tutti gli id dichiarati in edizione.yml, anche delle Letture con errori o ritirate.
  const dichiaratiOvunque: string[] = [];
  // Le Edizioni con edizione.yml fuori schema: il registro non si confronta con le loro Letture.
  const illeggibili: string[] = [];
  const brani = readdirSync(cartella, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  for (const brano of brani) {
    const erroriEdizione = (regola: string, messaggio: string) => errori.push({ lettura: brano, regola, messaggio });
    const letta = schemaEdizione.safeParse(parse(readFileSync(join(cartella, brano, 'edizione.yml'), 'utf8')));
    if (!letta.success) {
      for (const p of letta.error.issues) erroriEdizione('schema', `edizione.yml, ${p.path.join('.') || 'radice'}: ${p.message}`);
      illeggibili.push(brano);
      continue;
    }
    const edizione = letta.data;
    if (!(LICENZE as readonly string[]).includes(edizione.licenza.tipo)) {
      erroriEdizione('licenza', `licenza "${edizione.licenza.tipo}" non accettata: valgono ${LICENZE.join(', ')}`);
    } else if (edizione.licenza.tipo === 'PD' && edizione.trascrizioni !== 'CC0') {
      erroriEdizione('licenza', "le trascrizioni di un'Edizione PD si rilasciano in CC0 (ADR-0005): manca \"trascrizioni: CC0\"");
    } else if (edizione.licenza.tipo !== 'PD' && edizione.trascrizioni) {
      erroriEdizione('licenza', `le trascrizioni seguono la licenza dell'Edizione (${edizione.licenza.tipo}): CC0 vale solo per le Edizioni PD`);
    }
    const sorgente = join(cartella, brano, edizione.sorgente.file);
    if (!existsSync(sorgente)) erroriEdizione('sorgente', `manca il sorgente ${edizione.sorgente.file}`);
    else if (createHash('sha256').update(readFileSync(sorgente)).digest('hex') !== edizione.sorgente.sha256) {
      erroriEdizione('sorgente', `${edizione.sorgente.file} non ha l'hash dichiarato: per adottare una nuova versione si rifà l'import`);
    }
    const dichiarati = edizione.letture.map((l) => l.id);
    dichiaratiOvunque.push(...dichiarati.map((l) => `${brano}/${l}`));
    for (const file of readdirSync(join(cartella, brano)).filter((f) => f.endsWith('.abc'))) {
      if (!dichiarati.includes(file.slice(0, -4))) erroriEdizione('id', `${file} non è una Lettura di edizione.yml`);
    }
    for (const [i, l] of edizione.letture.entries()) {
      const id = `${brano}/${l.id}`;
      const erroreLettura = (regola: string, messaggio: string) => errori.push({ lettura: id, regola, messaggio });
      if (dichiarati.indexOf(l.id) !== i) {
        erroreLettura('id', 'due Letture hanno lo stesso id');
        continue;
      }
      const atteso = `${l.voce}-${l.battute[0]}-${l.battute[1]}`;
      if (l.id !== atteso) erroreLettura('id', `l'id deve essere <voce>-<inizio>-<fine>, cioè "${atteso}"`);
      for (const p of l.prerequisiti) {
        if (!opzioni.capitoli.includes(p)) erroreLettura('prerequisiti', `il Prerequisito "${p}" non è un Capitolo del Percorso`);
      }
      const file = join(cartella, brano, `${l.id}.abc`);
      if (!existsSync(file)) {
        erroreLettura('id', `manca il file ${l.id}.abc`);
        continue;
      }
      const abc = readFileSync(file, 'utf8');
      const letto = leggiAbc(abc);
      for (const a of letto.avvisi) erroreLettura('abc', `abcjs: ${a}`);
      if (!letto.unaSolaVoce) erroreLettura('voce', "l'ABC di una Lettura ha una sola Voce, su un rigo, senza accordi");
      const tonalita = letto.tonalita;
      if (!tonalita) {
        erroreLettura('tonalita', 'il K: deve dire il Modo per esteso, per esempio "K:F major" o "K:D minor"');
        continue;
      }
      // Le Note dell'ABC contano le Battute da 1; le Mutazioni usano le Battute di origine nel Brano.
      const nellEstratto = l.mutazioni.map((m) => ({ ...m, battuta: m.battuta - l.battute[0] + 1 }));
      const esiti = calcolaSillabe(letto.note, tonalita, nellEstratto);
      esiti.forEach((e, i) => {
        if (e.tipo !== 'errore') return;
        const { battuta, posizione } = letto.note[i]!;
        erroreLettura('sillabe', `battuta ${l.battute[0] + battuta - 1}, nota ${posizione}: ${e.motivo}; si riscrive la nota in modo enarmonico o si annota una Mutazione`);
      });
      const sillabe = esiti.flatMap((e) => (e.tipo === 'sillaba' ? [e.sillaba] : []));
      letture.push({
        id,
        brano: edizione.brano,
        autore: edizione.autore,
        voce: l.voce,
        battute: { inizio: l.battute[0], fine: l.battute[1] },
        abc,
        testo: letto.testo,
        sillabe,
        tonalita: tonalitaIniziale(letto.note, tonalita, nellEstratto),
        mutazioni: l.mutazioni,
        prerequisiti: l.prerequisiti,
        blocco: l.prerequisiti.includes('do-mobile-avanzato') ? 'avanzata' : 'normale',
        attribuzione: {
          fonte: FONTI[edizione.fonte],
          edizione: edizione.edizione,
          url: edizione.url,
          editore: edizione.editore,
          licenza: { nome: edizione.licenza.come_appare, url: edizione.licenza.url },
          ...(edizione.trascrizioni === 'CC0' && { trascrizione: CC0 }),
        },
        stato: l.stato,
      });
    }
  }
  errori.push(
    ...controllaRegistro(cartella, dichiaratiOvunque, opzioni.registroPrecedente ?? []).filter(
      (e) => !illeggibili.some((b) => e.lettura.startsWith(`${b}/`)),
    ),
  );
  return errori.length ? { ok: false, errori } : { ok: true, letture };
}

/** ADR-0004: la Tonalità in vigore alla prima nota, che è quella di una Mutazione se l'estratto comincia già modulato. */
function tonalitaIniziale(note: readonly NotaScritta[], delK: Tonalita, mutazioni: readonly Mutazione[]): Tonalita {
  const prima = note.find((n) => !n.pausa);
  if (!prima) return delK;
  const valide = mutazioni.filter((m) => m.battuta < prima.battuta || (m.battuta === prima.battuta && m.posizione <= prima.posizione));
  return valide.sort((a, b) => a.battuta - b.battuta || a.posizione - b.posizione).at(-1)?.tonalita ?? delK;
}

/** ADR-0003: ogni Lettura è nel registro, ogni id del registro ha la sua Lettura e nessun id se ne va. */
function controllaRegistro(cartella: string, dichiarati: readonly string[], precedente: readonly string[]): Errore[] {
  const file = join(cartella, REGISTRO);
  if (!existsSync(file)) return [{ lettura: REGISTRO, regola: 'registro', messaggio: `manca ${REGISTRO}` }];
  const registro = leggiRegistro(readFileSync(file, 'utf8'));
  const errori: Errore[] = [];
  for (const id of dichiarati) {
    if (!registro.includes(id)) errori.push({ lettura: id, regola: 'registro', messaggio: `manca in ${REGISTRO}` });
  }
  for (const id of registro) {
    if (!dichiarati.includes(id)) {
      errori.push({ lettura: id, regola: 'registro', messaggio: `è in ${REGISTRO} ma non in edizione.yml: una Lettura ritirata resta, con "stato: ritirata"` });
    }
  }
  for (const id of precedente) {
    if (!registro.includes(id)) errori.push({ lettura: id, regola: 'registro', messaggio: `è stato tolto da ${REGISTRO}: gli id pubblicati non si tolgono mai` });
  }
  return errori;
}
