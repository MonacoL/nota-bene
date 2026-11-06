// Validazione del catalogo delle Letture (ADR-0003), il passo della CI tra il controllo dei tipi e la build.
// Uso: npm run valida:letture -- [ref]
// Con un ref git (in CI la base della PR, o il commit prima del push) controlla anche che il registro
// letture/pubblicate.txt di quel ref non abbia perso id. Esce con 1 se c'è anche un solo errore.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { catalogo, leggiRegistro } from '../src/letture/catalogo';

const CARTELLA = 'letture';
const ref = process.argv[2];

const capitoli = (parse(readFileSync('contenuti/percorso.yml', 'utf8')) as { id: string }[]).map((v) => v.id);

let registroPrecedente: string[] | undefined;
if (ref) {
  try {
    const testo = execFileSync('git', ['show', `${ref}:${CARTELLA}/pubblicate.txt`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    registroPrecedente = leggiRegistro(testo);
  } catch {
    // Il registro non c'era ancora in quel ref: non c'è niente da confrontare.
    console.log(`Nessun ${CARTELLA}/pubblicate.txt in ${ref}: salto il confronto del registro.`);
  }
}

const esito = catalogo(CARTELLA, { capitoli, registroPrecedente });
if (esito.ok) {
  console.log(`Catalogo valido: ${esito.letture.length} Letture.`);
} else {
  for (const e of esito.errori) console.error(`✗ ${e.lettura} [${e.regola}] ${e.messaggio}`);
  console.error(`\n${esito.errori.length} errori nel catalogo delle Letture.`);
  process.exit(1);
}
