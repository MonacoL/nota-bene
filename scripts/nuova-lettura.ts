// Aggiunge una Lettura a un'Edizione da un MusicXML (ticket #34, ADR-0003). La guida è in docs/letture.md.
// Lancia xml2abc (strumenti/xml2abc, serve Python 3), isola la Voce, taglia le Battute e scrive <voce>-<inizio>-<fine>.abc;
// in edizione.yml aggiunge la Lettura con Prerequisiti e Mutazioni DA COMPILARE, e l'id in letture/pubblicate.txt.
// Uso: npm run nuova-lettura -- <brano> --voce soprano --battute 1-8 [--v <numero della Voce in xml2abc>] [--musicxml <file>]
// Senza --musicxml usa il sorgente dichiarato in edizione.yml. Senza --v, con quattro Voci, vale l'ordine S A T B.
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { parseDocument, type YAMLMap, type YAMLSeq } from 'yaml';
import { SEGNAPOSTO, VOCI, type Voce } from '../src/letture/catalogo';
import { estraiLettura } from '../src/letture/import';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { voce: { type: 'string' }, battute: { type: 'string' }, v: { type: 'string' }, musicxml: { type: 'string' } },
});
const esci = (messaggio: string): never => {
  console.error(messaggio);
  process.exit(1);
};
const [brano] = positionals;
const battute = /^(\d+)-(\d+)$/.exec(values.battute ?? '');
if (!brano || !values.voce || !battute) esci('Uso: npm run nuova-lettura -- <brano> --voce soprano --battute 1-8 [--v N] [--musicxml <file>]');
const voce = values.voce as Voce;
if (!VOCI.includes(voce)) esci(`--voce è una tra ${VOCI.join(', ')}`);
const [inizio, fine] = [Number(battute![1]), Number(battute![2])];

const cartella = join('letture', brano!);
const yml = join(cartella, 'edizione.yml');
const documento = parseDocument(readFileSync(yml, 'utf8'));
const musicxml = resolve(values.musicxml ?? join(cartella, String(documento.getIn(['sorgente', 'file']))));

// xml2abc scrive in una cartella temporanea, lontano dal file scaricato.
const uscita = mkdtempSync(join(tmpdir(), 'xml2abc-'));
try {
  execFileSync('python3', ['-I', resolve('strumenti/xml2abc/xml2abc.py'), '-o', uscita, musicxml], { stdio: ['ignore', 'ignore', 'inherit'] });
  const [file] = readdirSync(uscita).filter((f) => f.endsWith('.abc'));
  if (!file) esci(`xml2abc non ha prodotto un ABC da ${musicxml}`);
  const abc = readFileSync(join(uscita, file!), 'utf8');
  const voci = abc.match(/^V:\d+[ \t]+\S.*$/gm) ?? [];
  const v = values.v ? Number(values.v) : voci.length === 4 ? VOCI.indexOf(voce) + 1 : undefined;
  if (!v) esci(`L'ABC ha ${voci.length} Voci: scegli quella giusta con --v\n${voci.join('\n')}`);

  const id = `${voce}-${inizio}-${fine}`;
  if (existsSync(join(cartella, `${id}.abc`))) esci(`${cartella}/${id}.abc esiste già: per correggere una Lettura si modifica il suo file`);
  writeFileSync(join(cartella, `${id}.abc`), estraiLettura(abc, { voce: v!, inizio, fine }));
  const letture = documento.get('letture') as YAMLSeq;
  letture.flow = false;
  const nuova = documento.createNode({
    id,
    voce,
    battute: [inizio, fine],
    prerequisiti: [SEGNAPOSTO],
    mutazioni: SEGNAPOSTO,
    modificata: new Date().toISOString().slice(0, 10),
  }) as YAMLMap;
  nuova.commentBefore = ` Da ${basename(musicxml)} con nuova-lettura (V:${v}).`;
  for (const campo of ['battute', 'prerequisiti']) (nuova.get(campo, true) as unknown as YAMLSeq).flow = true;
  letture.add(nuova);
  writeFileSync(yml, documento.toString({ lineWidth: 0, flowCollectionPadding: false }));
  appendFileSync('letture/pubblicate.txt', `${brano}/${id}\n`);
  console.log(`Scritta ${cartella}/${id}.abc. Ora compila ciò che è ${SEGNAPOSTO} (Modo nel K:, Prerequisiti, Mutazioni) e lancia npm run valida:letture.`);
} finally {
  rmSync(uscita, { recursive: true, force: true });
}
