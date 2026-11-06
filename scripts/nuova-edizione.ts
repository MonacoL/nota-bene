// Crea la cartella di una nuova Edizione in letture/ (ticket #34, ADR-0003). La guida è in docs/letture.md.
// Uso:
//   npm run nuova-edizione -- <brano> --mutopia <URL della pagina piece-info>
//   npm run nuova-edizione -- <brano> --file <sorgente scaricato a mano> --url <pagina dell'Edizione> [--fonte cpdl|mutopia]
import { parseArgs } from 'node:util';
import { nuovaEdizione, type Scarica } from '../src/letture/import';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { mutopia: { type: 'string' }, file: { type: 'string' }, url: { type: 'string' }, fonte: { type: 'string', default: 'cpdl' } },
});
const [brano] = positionals;
if (!brano || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(brano) || !(values.mutopia || (values.file && values.url))) {
  console.error('Uso: npm run nuova-edizione -- <brano-in-kebab-case> (--mutopia <URL> | --file <sorgente> --url <URL> [--fonte cpdl|mutopia])');
  process.exit(1);
}
if (values.fonte !== 'cpdl' && values.fonte !== 'mutopia') {
  console.error('--fonte è cpdl oppure mutopia');
  process.exit(1);
}

const scarica: Scarica = async (url) => {
  const risposta = await fetch(url, { headers: { 'User-Agent': 'nota-bene-import' } });
  if (!risposta.ok) throw new Error(`${url}: HTTP ${risposta.status}`);
  return new Uint8Array(await risposta.arrayBuffer());
};

const comuni = { cartella: 'letture', brano, oggi: new Date() };
const cartella = await nuovaEdizione(
  values.mutopia ? { ...comuni, mutopia: values.mutopia } : { ...comuni, fonte: values.fonte, url: values.url!, file: values.file! },
  scarica,
);
console.log(`Creata ${cartella}/. Completa ciò che è DA COMPILARE in edizione.yml, poi aggiungi le Letture con nuova-lettura.`);
