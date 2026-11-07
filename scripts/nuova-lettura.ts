// Aggiunge una Lettura a un'Edizione (ticket #34, ADR-0003). La guida è in docs/letture.md.
// Da un MusicXML lancia xml2abc (strumenti/xml2abc), isola la Voce e taglia le Battute; da un sorgente LilyPond (.ly, le
// Edizioni Mutopia) lancia strumenti/lilypond/ly2abc.py, che serve LilyPond. Scrive <voce>-<inizio>-<fine>.abc, aggiunge
// la Lettura a edizione.yml con Prerequisiti e Mutazioni DA COMPILARE e l'id a letture/pubblicate.txt. Serve Python 3.
// Uso: npm run nuova-lettura -- <brano> --voce soprano --battute 1-8 [--v <Voce>] [--musicxml <file>]
//        [--levare 1/4] [--taglia 1/4] [--testo <Lyrics>] [--piu-grave]      (le ultime quattro solo per un .ly)
// Senza --musicxml usa il sorgente dichiarato in edizione.yml. --v è il numero della Voce in xml2abc (senza, con quattro
// Voci vale l'ordine S A T B) oppure, per un .ly, il nome della Voce in LilyPond: senza, si vedono le Voci del brano.
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
  options: {
    voce: { type: 'string' },
    battute: { type: 'string' },
    v: { type: 'string' },
    musicxml: { type: 'string' },
    levare: { type: 'string' },
    taglia: { type: 'string' },
    testo: { type: 'string' },
    'piu-grave': { type: 'boolean' },
  },
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
const sorgente = resolve(values.musicxml ?? join(cartella, String(documento.getIn(['sorgente', 'file']))));
const id = `${voce}-${inizio}-${fine}`;
if (existsSync(join(cartella, `${id}.abc`))) esci(`${cartella}/${id}.abc esiste già: per correggere una Lettura si modifica il suo file`);

/** L'ABC della Lettura da un MusicXML, con xml2abc: si sceglie una delle sue Voci e si tagliano le Battute. */
function daMusicXml(): { abc: string; come: string } {
  // xml2abc scrive in una cartella temporanea, lontano dal file scaricato.
  const uscita = mkdtempSync(join(tmpdir(), 'xml2abc-'));
  try {
    execFileSync('python3', ['-I', resolve('strumenti/xml2abc/xml2abc.py'), '-o', uscita, sorgente], { stdio: ['ignore', 'ignore', 'inherit'] });
    const [file] = readdirSync(uscita).filter((f) => f.endsWith('.abc'));
    if (!file) esci(`xml2abc non ha prodotto un ABC da ${sorgente}`);
    const abc = readFileSync(join(uscita, file!), 'utf8');
    const voci = abc.match(/^V:\d+[ \t]+\S.*$/gm) ?? [];
    const v = values.v ? Number(values.v) : voci.length === 4 ? VOCI.indexOf(voce) + 1 : undefined;
    if (!v) esci(`L'ABC ha ${voci.length} Voci: scegli quella giusta con --v\n${voci.join('\n')}`);
    return { abc: estraiLettura(abc, { voce: v!, inizio, fine }), come: `V:${v}` };
  } finally {
    rmSync(uscita, { recursive: true, force: true });
  }
}

/** L'ABC della Lettura da un sorgente LilyPond, con ly2abc: LilyPond legge il brano e dà note e Testo della Voce. */
function daLilyPond(): { abc: string; come: string } {
  const ly2abc = ['-I', resolve('strumenti/lilypond/ly2abc.py')];
  if (!values.v) {
    execFileSync('python3', [...ly2abc, 'voci', sorgente], { stdio: 'inherit' });
    esci('Scegli la Voce di LilyPond con --v (e il Testo con --testo, se non è legato alla Voce).');
  }
  const clef = voce === 'tenore' ? 'treble-8' : voce === 'basso' ? 'bass' : 'treble';
  const opzioni = ['--voce', values.v!, '--battute', `${inizio}-${fine}`, '--clef', clef];
  if (values.levare) opzioni.push('--levare', values.levare);
  if (values.taglia) opzioni.push('--taglia', values.taglia);
  if (values.testo) opzioni.push('--testo', values.testo);
  if (values['piu-grave']) opzioni.push('--piu-grave');
  const abc = execFileSync('python3', [...ly2abc, 'estrai', sorgente, ...opzioni], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
  return { abc, come: `LilyPond, Voce ${values.v}` };
}

const { abc, come } = sorgente.endsWith('.ly') ? daLilyPond() : daMusicXml();
writeFileSync(join(cartella, `${id}.abc`), abc);
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
nuova.commentBefore = ` Da ${basename(sorgente)} con nuova-lettura (${come}).`;
for (const campo of ['battute', 'prerequisiti']) (nuova.get(campo, true) as unknown as YAMLSeq).flow = true;
letture.add(nuova);
writeFileSync(yml, documento.toString({ lineWidth: 0, flowCollectionPadding: false }));
appendFileSync('letture/pubblicate.txt', `${brano}/${id}\n`);
console.log(`Scritta ${cartella}/${id}.abc. Ora compila ciò che è ${SEGNAPOSTO} (Modo nel K:, Prerequisiti, Mutazioni) e lancia npm run valida:letture.`);
