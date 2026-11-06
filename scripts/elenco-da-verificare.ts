// L'elenco delle Letture da_verificare da portare al maestro (ticket #34, ADR-0003), in markdown sullo standard output.
// Uso: npm run elenco-da-verificare > da-verificare.md
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import config from '../astro.config.mjs';
import { catalogo } from '../src/letture/catalogo';
import { elencoDaVerificare } from '../src/letture/import';

const capitoli = (parse(readFileSync('contenuti/percorso.yml', 'utf8')) as { id: string }[]).map((v) => v.id);
const esito = catalogo('letture', { capitoli });
if (!esito.ok) {
  for (const e of esito.errori) console.error(`✗ ${e.lettura} [${e.regola}] ${e.messaggio}`);
  console.error('\nIl catalogo non è valido: prima si corregge, poi si prepara l\'elenco.');
  process.exit(1);
}
process.stdout.write(elencoDaVerificare(esito.letture, new URL(config.base!, config.site).href));
