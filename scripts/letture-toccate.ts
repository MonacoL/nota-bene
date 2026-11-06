// Le Letture nuove o modificate rispetto a un ref git, una per riga (ticket #34): la CI ne fa gli screenshot per la PR.
// Un .abc cambiato tocca la sua Lettura; edizione.yml o il sorgente cambiati toccano tutte le Letture dell'Edizione.
// Uso: npm run -s letture-toccate -- <ref>
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';

const ref = process.argv[2];
if (!ref) {
  console.error('Uso: npm run -s letture-toccate -- <ref>');
  process.exit(1);
}
const cambiati = execFileSync('git', ['diff', '--name-only', '--diff-filter=AM', ref, '--', 'letture/'], { encoding: 'utf8' }).split('\n');
const toccate = new Set<string>();
for (const file of cambiati) {
  const [, brano, nome] = /^letture\/([^/]+)\/(.+)$/.exec(file) ?? [];
  if (!brano || !nome) continue;
  if (nome.endsWith('.abc')) toccate.add(`${brano}/${nome.slice(0, -4)}`);
  else if (existsSync(`letture/${brano}/edizione.yml`)) {
    const { letture } = parse(readFileSync(`letture/${brano}/edizione.yml`, 'utf8')) as { letture?: { id: string }[] };
    for (const l of letture ?? []) toccate.add(`${brano}/${l.id}`);
  }
}
for (const id of toccate) console.log(id);
