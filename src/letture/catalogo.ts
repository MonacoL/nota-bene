// Catalogo delle Letture (ADR-0003, ADR-0004, ADR-0005), in TypeScript puro: dalla cartella delle Letture
// restituisce le Letture pronte per le pagine oppure gli errori, ciascuno con Lettura e regola. Non va in rete.
// Lo usano la build delle pagine e la validazione in CI.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'astro/zod';
import { parse } from 'yaml';
import { sillabe as calcolaSillabe, type Mutazione, type NotaScritta, type Sillaba, type Tonalita } from '../sillabe';
import { semitoni, type Nota } from '../esercizi/note';
import { leggiAbc, leggiTonalita } from './abc';
import { VOCI, type Voce } from './voci';

export { VOCI, type Voce };

const FONTI = { mutopia: 'Mutopia', cpdl: 'CPDL' } as const;
/** Le licenze accettate (ricerca "Formati e licenze di CPDL e Mutopia", #3): niente NC, ND né "Personal". */
export const LICENZE = ['PD', 'CC BY', 'CC BY-SA', 'CPDL License'] as const;
const CC0 = { nome: 'CC0 1.0', url: 'https://creativecommons.org/publicdomain/zero/1.0/' };
/** Ciò che nuova-lettura lascia da decidere (Modo, Mutazioni, Prerequisiti): la CI fallisce finché c'è. */
export const SEGNAPOSTO = 'DA COMPILARE';

const schemaLettura = z
  .object({
    id: z.string(),
    voce: z.enum(VOCI),
    battute: z.tuple([z.number().int().positive(), z.number().int().positive()]),
    prerequisiti: z.union([z.tuple([z.literal(SEGNAPOSTO)]), z.array(z.string()).nonempty()]),
    /** ADR-0004: battuta di origine, posizione della nota nella Battuta e nuova Tonalità, per esempio "C major". */
    mutazioni: z.literal(SEGNAPOSTO).or(z
      .array(
        z
          .object({
            // 0 è il levare di un estratto che comincia dall'inizio del Brano.
            battuta: z.number().int().nonnegative(),
            posizione: z.number().int().positive(),
            tonalita: z.string().transform((t, ctx) => {
              const tonalita = leggiTonalita(t);
              if (!tonalita) ctx.addIssue({ code: 'custom', message: `"${t}" non è una Tonalità con il Modo per esteso, come "C major"` });
              return tonalita!;
            }),
          })
          .strict(),
      ))
      .default([]),
    modificata: z.coerce.date(),
    stato: z.enum(['pubblicata', 'ritirata']).default('pubblicata'),
    /** ADR-0003: il motivo per cui va sentito il maestro; non si vede sul sito. */
    da_verificare: z.string().min(1).optional(),
    /** Il campo libero della nota delle modifiche, per le eccezioni: si aggiunge al testo generato. */
    modifiche: z.object({ it: z.string().min(1), en: z.string().min(1) }).strict().optional(),
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
    /** ADR-0003: un'Edizione PD che non dichiara la sua fonte. */
    fonte_dichiarata: z.literal('no').optional(),
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
  /** La data dell'ultima modifica della Lettura, per la nota delle modifiche. */
  modificata: Date;
  /** Il campo libero della nota delle modifiche, per le eccezioni. */
  modifiche?: { it: string; en: string };
  /** Il motivo per cui la Lettura va confermata dal maestro. Non si mostra sul sito. */
  daVerificare?: string;
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
  // Fonte e numero di Edizione già visti, con la cartella che li ha.
  const edizioni = new Map<string, string>();
  const brani = readdirSync(cartella, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  for (const brano of brani) {
    const erroriEdizione = (regola: string, messaggio: string) => errori.push({ lettura: brano, regola, messaggio });
    const grezza: unknown = parse(readFileSync(join(cartella, brano, 'edizione.yml'), 'utf8'));
    // I campi dell'Edizione che nuova-edizione lascia da compilare: si dicono tutti, prima dello schema.
    const { letture: _, ...campi } = (grezza ?? {}) as Record<string, unknown>;
    const daCompilare = segnaposto(campi);
    if (daCompilare.length) {
      for (const campo of daCompilare) erroriEdizione('segnaposto', `edizione.yml, ${campo} è ancora da compilare (${SEGNAPOSTO})`);
      illeggibili.push(brano);
      continue;
    }
    const letta = schemaEdizione.safeParse(grezza);
    if (!letta.success) {
      for (const p of letta.error.issues) erroriEdizione('schema', `edizione.yml, ${p.path.join('.') || 'radice'}: ${p.message}`);
      illeggibili.push(brano);
      continue;
    }
    const edizione = letta.data;
    const chiave = `${edizione.fonte} ${edizione.edizione}`;
    const gia = edizioni.get(chiave);
    if (gia) {
      erroriEdizione('edizione', `${FONTI[edizione.fonte]} ${edizione.edizione} è già in letture/${gia}/: una cartella per Edizione`);
    } else edizioni.set(chiave, brano);
    if (!(LICENZE as readonly string[]).includes(edizione.licenza.tipo)) {
      erroriEdizione('licenza', `licenza "${edizione.licenza.tipo}" non accettata: valgono ${LICENZE.join(', ')}`);
    } else if (edizione.licenza.tipo === 'PD' && edizione.trascrizioni !== 'CC0') {
      erroriEdizione('licenza', "le trascrizioni di un'Edizione PD si rilasciano in CC0 (ADR-0005): manca \"trascrizioni: CC0\"");
    } else if (edizione.licenza.tipo !== 'PD' && edizione.trascrizioni) {
      erroriEdizione('licenza', `le trascrizioni seguono la licenza dell'Edizione (${edizione.licenza.tipo}): CC0 vale solo per le Edizioni PD`);
    }
    const { prova } = edizione.licenza;
    if (prova === 'licenza.pdf') {
      if (!existsSync(join(cartella, brano, prova))) erroriEdizione('licenza', 'manca licenza.pdf, indicato come prova della licenza');
    } else if (!/^https:\/\/web\.archive\.org\/web\/\d+\//.test(prova)) {
      erroriEdizione('licenza', 'la prova della licenza è uno snapshot su archive.org (https://web.archive.org/web/…) oppure licenza.pdf');
    }
    if (edizione.fonte_dichiarata && edizione.licenza.tipo !== 'PD') {
      erroriEdizione('licenza', '"fonte_dichiarata: no" vale solo per le Edizioni PD');
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
      const daCompilare = (cosa: string) => erroreLettura('segnaposto', `${cosa} è ancora da compilare (${SEGNAPOSTO})`);
      if (l.prerequisiti[0] === SEGNAPOSTO) daCompilare('prerequisiti in edizione.yml');
      if (l.mutazioni === SEGNAPOSTO) daCompilare('mutazioni in edizione.yml');
      const mutazioni = l.mutazioni === SEGNAPOSTO ? [] : l.mutazioni;
      const prerequisiti = l.prerequisiti[0] === SEGNAPOSTO ? [] : l.prerequisiti;
      for (const p of prerequisiti) {
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
      if (!/^Q:/m.test(abc)) erroreLettura('andamento', "manca l'Andamento: l'ABC lo scrive nel Q:, per esempio \"Q:1/4=70\" (ADR-0008)");
      const { sbagliate, numero, levare } = battute(letto.durate, letto.durataBattuta);
      // Le Battute dell'ABC contano da 1; quelle di origine nel Brano partono da inizio, e il levare è la Battuta prima.
      const scarto = l.battute[0] - 1 - (levare ? 1 : 0);
      const origine = (battuta: number) => battuta + scarto;
      for (const b of letto.gruppiIrregolari) {
        erroreLettura('gruppi-irregolari', `battuta ${origine(b)}: niente gruppi irregolari (terzine e simili), il Percorso non li insegna`);
      }
      for (const b of sbagliate) erroreLettura('durata', `battuta ${origine(b)}: la durata non corrisponde al Tempo`);
      const dueBattute = 2 * letto.durataBattuta;
      if (letto.pausaMassima > dueBattute && !uguali(letto.pausaMassima, dueBattute)) erroreLettura('pause', 'una pausa più lunga di 2 Battute');
      const dichiarate = l.battute[1] - l.battute[0] + 1;
      if (numero < 4 || numero > 12) erroreLettura('battute', `${numero} Battute: una Lettura ne ha da 4 a 12, levare escluso`);
      else if (numero !== dichiarate) {
        erroreLettura('battute', `l'ABC ha ${numero} Battute, levare escluso, ma edizione.yml ne dichiara ${dichiarate} (${l.battute[0]}–${l.battute[1]})`);
      }
      const avanzata = prerequisiti.includes('do-mobile-avanzato');
      const massimo = avanzata ? 4 : 3;
      if (letto.armatura > massimo) {
        erroreLettura('armatura', `${letto.armatura} alterazioni in Armatura: al massimo ${massimo} ${avanzata ? 'in una Lettura avanzata' : 'in una Lettura'}`);
      }
      const attaccate = letto.note.flatMap((n) => (n.pausa || n.legata ? [] : [{ ...n, altezza: semitoni(n.nota as Nota) }]));
      attaccate.slice(1).forEach((n, i) => {
        if (Math.abs(n.altezza - attaccate[i]!.altezza) > 12) {
          erroreLettura('salti', `battuta ${origine(n.battuta)}, nota ${n.posizione}: un salto più ampio di un'ottava`);
        }
      });
      const altezze = attaccate.map((n) => n.altezza);
      // Una decima maggiore sono 16 semitoni.
      if (altezze.length && Math.max(...altezze) - Math.min(...altezze) > 16) {
        erroreLettura('estensione', "l'estensione supera la decima tra la nota più grave e la più acuta");
      }
      for (const problema of testoNonAllineato(abc, letto.note)) erroreLettura('testo', problema);
      if (letto.cambiaTonalita) {
        erroreLettura('mutazioni', "niente cambi [K:] nell'ABC: una Mutazione si annota in edizione.yml, con Battuta, posizione e nuova Tonalità");
      }
      for (const m of mutazioni) {
        if (!letto.note.some((n) => !n.pausa && origine(n.battuta) === m.battuta && n.posizione === m.posizione)) {
          erroreLettura('mutazioni', `la Mutazione in battuta ${m.battuta}, nota ${m.posizione}, non cade su una nota dell'estratto`);
        }
      }
      const tonalita = letto.tonalita;
      if (new RegExp(`^K:.*${SEGNAPOSTO}`, 'm').test(abc)) {
        daCompilare('il Modo nel K:');
        continue;
      }
      if (!tonalita) {
        erroreLettura('tonalita', 'il K: deve dire il Modo per esteso, per esempio "K:F major" o "K:D minor"');
        continue;
      }
      const nellEstratto = mutazioni.map((m) => ({ ...m, battuta: m.battuta - scarto }));
      const esiti = calcolaSillabe(letto.note, tonalita, nellEstratto);
      esiti.forEach((e, i) => {
        if (e.tipo !== 'errore') return;
        const { battuta, posizione } = letto.note[i]!;
        erroreLettura('sillabe', `battuta ${origine(battuta)}, nota ${posizione}: ${e.motivo}; si riscrive la nota in modo enarmonico o si annota una Mutazione`);
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
        mutazioni: mutazioni,
        prerequisiti: prerequisiti,
        blocco: avanzata ? 'avanzata' : 'normale',
        attribuzione: {
          fonte: FONTI[edizione.fonte],
          edizione: edizione.edizione,
          url: edizione.url,
          editore: edizione.editore,
          licenza: { nome: edizione.licenza.come_appare, url: edizione.licenza.url },
          ...(edizione.trascrizioni === 'CC0' && { trascrizione: CC0 }),
        },
        stato: l.stato,
        modificata: l.modificata,
        ...(l.modifiche && { modifiche: l.modifiche }),
        ...(l.da_verificare && { daVerificare: l.da_verificare }),
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

/** I percorsi dei campi che valgono SEGNAPOSTO, come "licenza.url". */
function segnaposto(valore: unknown, percorso = ''): string[] {
  if (valore === SEGNAPOSTO) return [percorso];
  if (valore && typeof valore === 'object') {
    return Object.entries(valore).flatMap(([k, v]) => segnaposto(v, percorso ? `${percorso}.${k}` : k));
  }
  return [];
}

const uguali = (a: number, b: number) => Math.abs(a - b) < 1e-9;

/**
 * Ticket #30: l'a capo divide note, Testo e Sillabe per Battuta, quindi ogni riga w: ha un "|" per Battuta e in ogni
 * Battuta una sillaba (o un "_" o un "*") per nota, pause escluse. Le Battute qui contano da 1, come nell'ABC.
 */
function testoNonAllineato(abc: string, note: readonly NotaScritta[]): string[] {
  const quante = note.at(-1)?.battuta ?? 0;
  const perBattuta = Array.from({ length: quante }, (_, i) => note.filter((n) => n.battuta === i + 1 && !n.pausa).length);
  const problemi: string[] = [];
  const righe = abc.split('\n').filter((r) => r.startsWith('w:'));
  righe.forEach((riga, r) => {
    const quale = righe.length > 1 ? ` n. ${r + 1}` : '';
    const pezzi = riga.slice(2).split('|');
    if (!pezzi.at(-1)!.trim()) pezzi.pop();
    if (pezzi.length !== quante) {
      problemi.push(`la riga w:${quale} ha ${pezzi.length} Battute e la musica ${quante}: serve un "|" per Battuta, allineato alle note`);
      return;
    }
    pezzi.forEach((pezzo, b) => {
      const sillabe = contaSillabe(pezzo);
      if (sillabe !== perBattuta[b]) {
        problemi.push(`riga w:${quale}, Battuta ${b + 1} dell'ABC: ${sillabe} sillabe per ${perBattuta[b]} note`);
      }
    });
  });
  return problemi;
}

/**
 * Quante note copre un pezzo di riga w: (ABC 2.1, 4.3): uno spazio o un "-" chiude una sillaba; "_" e "*" coprono una
 * nota senza sillaba nuova; "~" unisce due parole sotto una nota; un "-" dopo uno spazio o un altro "-" copre una nota.
 */
function contaSillabe(pezzo: string): number {
  let quante = 0;
  // Se si è dentro una sillaba non ancora contata.
  let inSillaba = false;
  for (let i = 0; i < pezzo.length; i++) {
    const c = pezzo[i]!;
    if (c === ' ' || c === '\t') {
      if (inSillaba) quante++;
      inSillaba = false;
    } else if (c === '-' || c === '_' || c === '*') {
      // Il "-" chiude la sillaba in corso; senza sillaba in corso è lui a coprire una nota. "_" e "*" la coprono sempre.
      if (inSillaba) quante++;
      if (c !== '-' || !inSillaba) quante++;
      inSillaba = false;
    } else {
      // "\-" è un trattino scritto, dentro la sillaba.
      if (c === '\\') i++;
      inSillaba = true;
    }
  }
  return quante + (inSillaba ? 1 : 0);
}

/**
 * Le Battute dell'estratto secondo il Tempo: quelle (da 1) che non durano quanto devono e quante sono. La prima può
 * essere più corta, se è un levare, e allora l'ultima può essere più corta per completarlo. Il levare non si conta.
 */
function battute(durate: readonly number[], completa: number): { sbagliate: number[]; numero: number; levare: boolean } {
  const levare = durate.length > 1 && durate[0]! < completa && !uguali(durate[0]!, completa) ? durate[0]! : 0;
  const sbagliate = durate.flatMap((d, i) => {
    if (i === 0 && levare) return [];
    if (i === durate.length - 1 && levare && uguali(d + levare, completa)) return [];
    return uguali(d, completa) ? [] : [i + 1];
  });
  return { sbagliate, numero: durate.length - (levare ? 1 : 0), levare: levare > 0 };
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
