# Nota Bene

Teoria musicale ed esercizi per coristi che partono da zero, fino alla lettura a prima vista con il DO mobile. Sito statico in italiano e in inglese, senza account, pubblicato su GitHub Pages (ADR-0006). Il vocabolario del progetto è in [GLOSSARY.md](GLOSSARY.md), le decisioni in [docs/adr/](docs/adr/). Come contribuire: [CONTRIBUTING.md](CONTRIBUTING.md).

```sh
npm ci
npm run dev             # sito in locale
npm run check           # controllo dei tipi
npm run valida:letture  # validazione del catalogo delle Letture
npm run test:unit       # Vitest
npm run test:e2e        # build e Playwright nell'immagine Docker
```

## Licenze

La repo contiene tre cose con tre licenze diverse (ADR-0005). Il copyright è di "Luca Monaco e i contributori di Nota Bene".

| Cartella o file | Che cosa contiene | Licenza |
| --- | --- | --- |
| tutto ciò che le righe sotto non nominano: `src/`, `scripts/`, `public/`, `tests/`, `docs/`, file di configurazione | il codice del sito, della build e della validazione, e la sua documentazione | MIT, in [`LICENSE`](LICENSE) |
| `contenuti/` | Capitoli, traduzioni, pagine di servizio | CC BY-SA 4.0, in [`LICENSE-CONTENUTI`](LICENSE-CONTENUTI) |
| `letture/<brano>/` | le Letture in ABC e il sorgente copiato dalla Fonte | quella dell'Edizione, in `edizione.yml`; le nostre trascrizioni di un'Edizione di pubblico dominio sono CC0 (`trascrizioni: CC0`) |
| `tests/e2e/letture-esempio/`, `tests/unit/letture/` | Letture d'esempio per i test | come `letture/`: quella del loro `edizione.yml` |
| `src/assets/fonts/` | i font Atkinson Hyperlegible Next e Noto Music | SIL OFL 1.1, nei file `*-LICENSE.txt` accanto ai font |
| `strumenti/xml2abc/` | xml2abc di Willem G. Vree, usato da `nuova-lettura` | GNU LGPL, in `COPYING.LESSER` e `COPYING` |

I testi degli Esercizi di teoria sono CC BY-SA 4.0 per l'ADR-0005, ma oggi stanno nel codice, in `src/esercizi/testi.ts` e nei dizionari `src/i18n/`: per quei testi vale CC BY-SA 4.0, per il resto dei due file MIT.

I contributi entrano con la licenza della parte che toccano (inbound = outbound), senza CLA: vedi [CONTRIBUTING.md](CONTRIBUTING.md).

### Asset di terzi

Ogni asset di terzi tiene la sua licenza in un file accanto. La sezione "Asset di terzi" della pagina dei crediti si genera alla build da quei file, con questa convenzione (`src/crediti/index.ts`):

1. **File di licenza.** Si chiama `LICENSE`, `LICENCE`, `COPYING` o `LICENZA`, anche con un prefisso o un'estensione: `LICENSE.txt`, `COPYING.LESSER`, `noto-music-LICENSE.txt`. Sta nella stessa cartella dell'asset.
2. **Scheda `crediti.yml`.** Nella stessa cartella, una lista con una voce per asset:

   ```yaml
   - nome: Noto Music
     autori: The Noto Project Authors
     licenza: SIL Open Font License 1.1
     url: https://github.com/notofonts/music
     file_licenza: noto-music-LICENSE.txt   # o una lista: [COPYING.LESSER, COPYING]
     nota:                                  # facoltativa, nelle due lingue
       it: ridotto ai tre glifi ♭ ♮ ♯
       en: reduced to the three glyphs ♭ ♮ ♯
   ```

3. **Pacchetti npm.** Una libreria che arriva da `node_modules` e finisce nel sito (per esempio abcjs) si dichiara in [`src/crediti.yml`](src/crediti.yml) con `pacchetto`, `autori` e `url`. Versione e licenza si leggono dal `package.json` del pacchetto installato, che deve avere un file di licenza.

La build si ferma se un file di licenza non è citato dalla scheda della sua cartella, se una scheda cita un file che non c'è o se un pacchetto non è installato. Così un asset nuovo non arriva sul sito senza crediti. Non contano i file della radice (le licenze di Nota Bene) né le cartelle `letture/`, `contenuti/`, `docs/`, `tests/` e quelle di build e dipendenze: le Letture hanno la licenza in `edizione.yml` e compaiono nella sezione "Brani" dei crediti.
