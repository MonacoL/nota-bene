// Le sezioni generate della pagina dei crediti (ticket #14, ADR-0005, ADR-0006), in TypeScript puro.
// La convenzione degli asset di terzi è spiegata nel README, sezione "Licenze".
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import { z } from 'astro/zod';
import { parse } from 'yaml';
import type { Lettura } from '../letture/catalogo';

/** Il nome della scheda che descrive gli asset di terzi di una cartella. */
export const SCHEDA = 'crediti.yml';

/** Un file di licenza: LICENSE, LICENCE, COPYING o LICENZA, anche con un prefisso o un'estensione (noto-music-LICENSE.txt, COPYING.LESSER). */
export const FILE_DI_LICENZA = /^(.*[-_.])?(licen[cs]e|copying|licenza)([-_.].*)?$/i;

/**
 * Le cartelle della radice che non contengono asset di terzi del sito: dipendenze e build, la Letture
 * (che hanno la licenza in edizione.yml e stanno nella sezione "Brani"), i contenuti e i test.
 * Nemmeno i file della radice contano: LICENSE e LICENSE-CONTENUTI sono le licenze di Nota Bene.
 */
const ESCLUSE = new Set([
  'node_modules', '.git', '.github', '.claude', '.astro', 'dist', 'dist-esempio', 'test-results', 'playwright-report',
  'anteprime', 'letture', 'contenuti', 'docs', 'tests',
]);

const testiPerLingua = z.object({ it: z.string().min(1), en: z.string().min(1) }).strict();

/** Un asset nel repo, con i suoi file di licenza nella stessa cartella. */
const schedaFile = z
  .object({
    nome: z.string().min(1),
    autori: z.string().min(1),
    licenza: z.string().min(1),
    url: z.url(),
    file_licenza: z.union([z.string().min(1), z.array(z.string().min(1)).nonempty()]),
    nota: testiPerLingua.optional(),
  })
  .strict();

/** Un pacchetto npm che finisce nel sito: nome con versione, licenza e file di licenza si leggono dal pacchetto installato. */
const schedaPacchetto = z
  .object({
    pacchetto: z.string().min(1),
    autori: z.string().min(1),
    url: z.url(),
    nota: testiPerLingua.optional(),
  })
  .strict();

const scheda = z.array(z.union([schedaFile, schedaPacchetto])).nonempty();

/** Un asset di terzi nei crediti. `fileLicenza` sono i percorsi nel repo dei testi di licenza (vuoto per un pacchetto npm). */
export type Asset = {
  nome: string;
  autori: string;
  licenza: string;
  url: string;
  fileLicenza: string[];
  nota?: { it: string; en: string };
};

export type EsitoAsset = { ok: true; asset: Asset[] } | { ok: false; errori: string[] };

export type OpzioniAsset = {
  /** Dove sono installati i pacchetti npm; di solito node_modules nella radice. */
  pacchetti?: string;
};

/** Le cartelle sotto `radice` (percorsi relativi, con /), saltando quelle escluse. */
function cartelle(radice: string): string[] {
  const trovate: string[] = [];
  const visita = (relativa: string) => {
    for (const voce of readdirSync(join(radice, relativa), { withFileTypes: true })) {
      if (!voce.isDirectory()) continue;
      if (relativa === '' && ESCLUSE.has(voce.name)) continue;
      const figlia = relativa ? `${relativa}/${voce.name}` : voce.name;
      trovate.push(figlia);
      visita(figlia);
    }
  };
  visita('');
  return trovate;
}

function fileDi(radice: string, cartella: string): string[] {
  return readdirSync(join(radice, cartella), { withFileTypes: true }).filter((v) => v.isFile()).map((v) => v.name);
}

/**
 * Gli asset di terzi, dalle schede crediti.yml. Ogni file di licenza trovato fuori dalle cartelle escluse
 * deve comparire nella scheda della sua cartella, e ogni file citato da una scheda deve esistere:
 * altrimenti la build si ferma, così un asset nuovo non resta senza crediti.
 */
export function assetDiTerzi(radice: string, opzioni: OpzioniAsset = {}): EsitoAsset {
  const pacchetti = opzioni.pacchetti ?? join(radice, 'node_modules');
  const asset: Asset[] = [];
  const errori: string[] = [];

  for (const cartella of cartelle(radice)) {
    const file = fileDi(radice, cartella);
    const licenze = file.filter((f) => FILE_DI_LICENZA.test(f));
    const citati = new Set<string>();
    if (file.includes(SCHEDA)) {
      const percorsoScheda = posix.join(cartella, SCHEDA);
      const letta = scheda.safeParse(parse(readFileSync(join(radice, percorsoScheda), 'utf8')));
      if (!letta.success) {
        errori.push(`${percorsoScheda}: ${letta.error.issues.map((i) => `${i.path.join('.') || 'scheda'}: ${i.message}`).join('; ')}`);
        continue;
      }
      for (const voce of letta.data) {
        let dati: Pick<Asset, 'nome' | 'licenza' | 'fileLicenza'>;
        if ('pacchetto' in voce) {
          const cartellaPacchetto = join(pacchetti, voce.pacchetto);
          const manifesto = join(cartellaPacchetto, 'package.json');
          if (!existsSync(manifesto)) {
            errori.push(`${percorsoScheda}: il pacchetto "${voce.pacchetto}" non è installato`);
            continue;
          }
          const { version, license } = JSON.parse(readFileSync(manifesto, 'utf8')) as { version?: string; license?: string };
          if (!readdirSync(cartellaPacchetto).some((f) => FILE_DI_LICENZA.test(f))) {
            errori.push(`${percorsoScheda}: il pacchetto "${voce.pacchetto}" non ha un file di licenza`);
          }
          if (!license) errori.push(`${percorsoScheda}: il pacchetto "${voce.pacchetto}" non dichiara la licenza nel package.json`);
          dati = { nome: `${voce.pacchetto} ${version ?? ''}`.trim(), licenza: license ?? '', fileLicenza: [] };
        } else {
          const nomi = typeof voce.file_licenza === 'string' ? [voce.file_licenza] : voce.file_licenza;
          for (const n of nomi) {
            citati.add(n);
            if (!file.includes(n)) errori.push(`${percorsoScheda}: "${voce.nome}" cita ${n}, che non c'è nella cartella`);
          }
          dati = { nome: voce.nome, licenza: voce.licenza, fileLicenza: nomi.map((n) => posix.join(cartella, n)) };
        }
        asset.push({ ...dati, autori: voce.autori, url: voce.url, ...(voce.nota && { nota: voce.nota }) });
      }
    }
    for (const l of licenze) {
      if (!citati.has(l)) {
        errori.push(`${posix.join(cartella, l)}: file di licenza senza una voce che lo citi in ${posix.join(cartella, SCHEDA)}`);
      }
    }
  }

  if (errori.length) return { ok: false, errori };
  return { ok: true, asset: asset.sort((a, b) => a.nome.localeCompare(b.nome, 'en')) };
}

/** Un Brano nei crediti: l'attribuzione della sua Edizione. */
export type BranoDeiCrediti = { brano: string; autore: string } & Lettura['attribuzione'];

/**
 * I Brani da cui vengono le Letture pubblicate, uno per Edizione (cioè per cartella in letture/), in ordine di titolo.
 * Un Brano con sole Letture ritirate non compare.
 */
export function braniDeiCrediti(letture: readonly Lettura[]): BranoDeiCrediti[] {
  const perEdizione = new Map<string, BranoDeiCrediti>();
  for (const l of letture) {
    if (l.stato !== 'pubblicata') continue;
    const cartella = l.id.split('/')[0]!;
    if (!perEdizione.has(cartella)) perEdizione.set(cartella, { brano: l.brano, autore: l.autore, ...l.attribuzione });
  }
  return [...perEdizione.values()].sort((a, b) => a.brano.localeCompare(b.brano, 'en'));
}
