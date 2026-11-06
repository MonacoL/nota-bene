// Il controllo dei campioni del pianoforte (ADR-0008), in CI dopo la validazione del catalogo: blocca il deploy
// se una Lettura richiede più di 1 MB di campioni, accordo del Riferimento tonale compreso, se una sua nota è
// fuori da C2–C6 o se i campioni in tutto superano 10 MB.
// Uso: npm run controlla:campioni (NOTA_BENE_LETTURE sceglie un'altra cartella di Letture, come per la build).
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { audioDellaLettura } from '../src/audio/note';
import { controllaCampioni } from './limiti-campioni';
import { catalogo } from '../src/letture/catalogo';

const CARTELLA = process.env.NOTA_BENE_LETTURE ?? 'letture';
const CAMPIONI = 'public/audio/pianoforte';

const capitoli = (parse(readFileSync('contenuti/percorso.yml', 'utf8')) as { id: string }[]).map((v) => v.id);
const esito = catalogo(CARTELLA, { capitoli });
if (!esito.ok) {
  console.error('Il catalogo delle Letture non è valido: prima npm run valida:letture.');
  process.exit(1);
}
const letture = esito.letture
  .filter((l) => l.stato === 'pubblicata')
  .map((l) => ({ id: l.id, note: audioDellaLettura(l.abc, l.tonalita).note }));
const errori = controllaCampioni(letture, CAMPIONI);
if (errori.length) {
  for (const e of errori) console.error(`✗ ${e}`);
  process.exit(1);
}
console.log(`Campioni nei limiti per ${letture.length} Letture.`);
