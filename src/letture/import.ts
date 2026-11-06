// Gli strumenti di chi importa un Brano (ticket #34, ADR-0003), in TypeScript puro: li usano gli script in scripts/
// e condividono schema e parser con il catalogo. Non vanno in rete da soli: chi scarica lo passa lo script.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { stringify } from 'yaml';
import { leggiAbc } from './abc';
import { SEGNAPOSTO, type Lettura } from './catalogo';
import { rigaW } from './righe-w';

/** Lo scaricamento di un file, l'unica via verso la rete: lo script passa fetch, i test un finto. */
export type Scarica = (url: string) => Promise<Uint8Array>;

type Comuni = {
  /** La cartella delle Letture, di solito letture/. */
  cartella: string;
  /** Il nome della cartella dell'Edizione, in kebab-case: la prima parte degli id delle Letture. */
  brano: string;
  /** Il giorno della consultazione della licenza. */
  oggi: Date;
};
/** Da un file scaricato a mano (CPDL, dietro Cloudflare) o da un URL di Mutopia, che si scarica da solo. */
export type OpzioniEdizione = Comuni & ({ fonte: 'cpdl' | 'mutopia'; url: string; file: string } | { mutopia: string });

const giorno = (d: Date) => d.toISOString().slice(0, 10);
const sha256 = (dati: Uint8Array) => createHash('sha256').update(dati).digest('hex');

/** Le licenze di Mutopia come le scrive l'RDF, con il tipo accettato dal catalogo. */
function tipoDiLicenza(comeAppare: string): string {
  if (/^Public Domain/i.test(comeAppare)) return 'PD';
  if (/^Creative Commons Attribution-ShareAlike \d/i.test(comeAppare)) return 'CC BY-SA';
  if (/^Creative Commons Attribution \d/i.test(comeAppare)) return 'CC BY';
  return SEGNAPOSTO;
}

/**
 * Crea letture/<brano>/ con la copia del sorgente, il suo hash e un edizione.yml da completare: ciò che la Fonte non
 * dice resta SEGNAPOSTO e il catalogo lo rifiuta. Da Mutopia scarica .ly, PDF A4 e RDF e ne legge i dati.
 */
export async function nuovaEdizione(opzioni: OpzioniEdizione, scarica: Scarica): Promise<string> {
  const cartella = join(opzioni.cartella, opzioni.brano);
  if (existsSync(cartella)) throw new Error(`letture/${opzioni.brano}/ esiste già: una seconda Edizione va in <brano>-<editore>/`);
  const licenza = { tipo: SEGNAPOSTO, come_appare: SEGNAPOSTO, url: SEGNAPOSTO, consultata: giorno(opzioni.oggi), prova: SEGNAPOSTO };
  let edizione: Record<string, unknown>;
  let sorgente: { file: string; dati: Uint8Array };
  const file: { nome: string; dati: Uint8Array }[] = [];
  if ('mutopia' in opzioni) {
    const testo = (dati: Uint8Array) => new TextDecoder().decode(dati);
    const pagina = testo(await scarica(opzioni.mutopia));
    const ly = /href="(https:\/\/www\.mutopiaproject\.org\/ftp\/[^"]+\.ly)"/.exec(pagina)?.[1];
    if (!ly) throw new Error(`${opzioni.mutopia} non ha il link al .ly: è la pagina piece-info di un Brano?`);
    const radice = ly.slice(0, -3);
    const rdf = await scarica(`${radice}.rdf`);
    const campo = (nome: string) => new RegExp(`<mp:${nome}>([^<]*)</mp:${nome}>`).exec(testo(rdf))?.[1]?.trim() || SEGNAPOSTO;
    sorgente = { file: basename(ly), dati: await scarica(ly) };
    file.push({ nome: `${basename(radice)}-a4.pdf`, dati: await scarica(`${radice}-a4.pdf`) }, { nome: `${basename(radice)}.rdf`, dati: rdf });
    const comeAppare = campo('licence');
    const urlLicenza = /Copyright:.*?href="https?:\/\/(creativecommons\.org\/[^"]+)"/s.exec(pagina)?.[1];
    Object.assign(licenza, { tipo: tipoDiLicenza(comeAppare), come_appare: comeAppare, url: urlLicenza ? `https://${urlLicenza}` : SEGNAPOSTO });
    edizione = { brano: campo('title'), autore: SEGNAPOSTO, fonte: 'mutopia', edizione: campo('id'), url: opzioni.mutopia, editore: campo('maintainer') };
  } else {
    sorgente = { file: basename(opzioni.file), dati: readFileSync(opzioni.file) };
    edizione = { brano: SEGNAPOSTO, autore: SEGNAPOSTO, fonte: opzioni.fonte, edizione: SEGNAPOSTO, url: opzioni.url, editore: SEGNAPOSTO };
  }
  mkdirSync(cartella, { recursive: true });
  writeFileSync(join(cartella, sorgente.file), sorgente.dati);
  for (const f of file) writeFileSync(join(cartella, f.nome), f.dati);
  const yml = {
    ...edizione,
    licenza,
    // ADR-0005: le nostre trascrizioni di un'Edizione di pubblico dominio sono CC0.
    ...(licenza.tipo === 'PD' && { trascrizioni: 'CC0' }),
    sorgente: { file: sorgente.file, sha256: sha256(sorgente.dati) },
    letture: [],
  };
  const intestazione = `# Edizione ${edizione.fonte === 'cpdl' ? 'CPDL' : 'Mutopia'} (ADR-0003), creata da nuova-edizione. Il sorgente ${sorgente.file} è copiato così com'era il giorno dell'import.\n# Ciò che è ${SEGNAPOSTO} si completa a mano: la guida è in docs/letture.md.\n`;
  writeFileSync(join(cartella, 'edizione.yml'), intestazione + stringify(yml, { lineWidth: 0 }));
  return cartella;
}

export type Taglio = {
  /** Il numero della Voce nell'uscita di xml2abc (V:1, V:2…). */
  voce: number;
  /** Le Battute di origine, da 1. */
  inizio: number;
  fine: number;
};

/**
 * Dall'ABC di xml2abc (tutte le Voci) all'ABC di una Lettura: una Voce, le Battute scelte, l'intestazione che serve
 * al catalogo e il Modo da compilare nel K:, perché l'Armatura sola non dice se è maggiore o minore.
 */
export function estraiLettura(abc: string, taglio: Taglio): string {
  const righe = abc.split('\n');
  const intestazione = (campo: string) => righe.find((r) => r.startsWith(`${campo}:`))?.slice(campo.length + 1).trim();
  const inizioCorpo = righe.findIndex((r) => r.trim() === `V:${taglio.voce}`);
  if (inizioCorpo < 0) throw new Error(`l'ABC non ha la Voce V:${taglio.voce}`);
  const corpo: string[] = [];
  const testo: string[] = [];
  for (const riga of righe.slice(inizioCorpo + 1)) {
    if (/^V:/.test(riga)) break;
    if (riga.startsWith('w:')) testo.push(riga.slice(2));
    else if (!/^[A-Za-z]:/.test(riga)) corpo.push(riga);
  }
  const battute = corpo
    .join(' ')
    .replace(/"[^"]*"/g, '')
    .replace(/![^!]*!/g, '')
    .replace(/%\d+/g, '')
    .replace(/\$/g, '')
    .split(/\|\]|\|\||\|/)
    .map((b) => b.trim().replace(/\s+/g, ' '))
    .filter(Boolean);
  const k = intestazione('K')!;
  // La dichiarazione della Voce nell'intestazione, come "V:4 bass": la Chiave è la prima parola, se c'è.
  const chiave = righe.find((r) => new RegExp(`^V:${taglio.voce}[ \\t]+\\S`).test(r))?.split(/\s+/)[1];
  const clef = chiave && chiave !== 'treble' && !chiave.includes('=') ? ` clef=${chiave}` : '';
  const q = intestazione('Q');
  const testata = ['X:1', `M:${intestazione('M')}`, `L:${intestazione('L')}`, ...(q ? [`Q:${q}`] : [])];
  // Il levare si riconosce con il parser del catalogo: una prima Battuta più corta del Tempo è la Battuta 0.
  const intera = leggiAbc([...testata, `K:${k}${clef}`, `${battute.join(' | ')} |]`].join('\n'));
  const levare = battute.length > 1 && intera.durate[0]! < intera.durataBattuta - 1e-9;
  const da = taglio.inizio - (levare ? 0 : 1);
  const scelte = battute.slice(da, taglio.fine + (levare ? 1 : 0));
  // Ogni nota prende un segno del Testo, anche quella legata (con * o _); le pause no (src/letture/righe-w.ts).
  const segni = testo.join(' ').split(/\s+|(?<=[^\\]-)/).filter((t) => t && t !== '|');
  const prima = battute.slice(0, da).reduce((n, b) => n + note(b), 0);
  const scelto = segni.slice(prima, prima + scelte.reduce((n, b) => n + note(b), 0));
  // Un tratto per Battuta, allineato alle note (ticket #30): l'a capo della Lettura divide il Testo per Battuta.
  let usate = 0;
  const perBattuta = scelte.map((b) => scelto.slice(usate, (usate += note(b))).join(' '));
  return [
    ...testata,
    `K:${k}${clef} % ${SEGNAPOSTO}: major o minor`,
    `${scelte.join(' | ')} |]`,
    ...(scelto.some((t) => t !== '*' && t !== '_') ? [rigaW(perBattuta)] : []),
    '',
  ].join('\n');
}

/** Quante note ha una Battuta ABC: un accordo conta una, le pause e gli abbellimenti nessuna. */
function note(battuta: string): number {
  const pulita = battuta
    .replace(/\[[A-Za-z]:[^\]]*\]/g, '')
    .replace(/\{[^}]*\}/g, '')
    .replace(/\[[^\]]*\]/g, 'C');
  return (pulita.match(/[A-Ga-g]/g) ?? []).length;
}

/** L'elenco da portare al maestro: le Letture con da_verificare, con il motivo e il link alla pagina italiana. */
export function elencoDaVerificare(letture: readonly Lettura[], sito: string): string {
  const righe = letture
    .filter((l) => l.daVerificare)
    .map((l) => `- ${l.brano} (${l.autore}), ${l.voce}, battute ${l.battute.inizio}–${l.battute.fine}: ${l.daVerificare}\n  ${sito}it/letture/${l.id}/`);
  return `# Letture da verificare con il maestro\n\n${righe.length ? righe.join('\n') : 'Nessuna Lettura da verificare.'}\n`;
}
