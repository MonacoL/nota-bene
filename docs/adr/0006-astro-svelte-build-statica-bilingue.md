# Astro con isole Svelte, build statica bilingue su GitHub Pages

Il sito si costruisce con **Astro**, senza Starlight, in TypeScript strict e con npm. Le parti interattive, cioè i controlli della Lettura e gli Esercizi di teoria, sono isole **Svelte 5**. Il resto (Capitoli, Percorso, pagine di servizio) è HTML statico.

- **Contenuti**: alla radice, in `contenuti/` (per esempio `contenuti/capitoli/it/`, `contenuti/capitoli/en/`), accanto a `letture/`. Il confine delle cartelle coincide con quello delle licenze (ADR-0005). Astro li legge con le content collections, con uno schema.
- **Capitoli**: Markdown semplice, niente MDX. Gli esempi musicali sono blocchi ` ```abc ` che diventano pentagrammi. Gli Esercizi di teoria di un Capitolo si dichiarano nel frontmatter (tipo e parametri) e si generano nel browser.
- **Letture**: una pagina statica per ogni Lettura e per ogni lingua, generata da `letture/`. Le Sillabe (ADR-0004) si calcolano alla build, nello stesso modulo usato dalla validazione in CI, e arrivano nella pagina già pronte, nascoste finché il corista non chiede la Soluzione. abcjs disegna la partitura nel browser, perché larghezza del rigo e a capo dipendono dallo schermo.
- **Lingue**: `/it/…` e `/en/…`. Dopo il prefisso il percorso è identico e si basa sugli id. La radice reindirizza sempre a `/it/`, senza leggere la lingua del browser né salvarla. Se un Capitolo manca in inglese, la pagina `/en/` mostra l'italiano con un avviso e la CI lo segnala senza bloccare il deploy. I testi dell'interfaccia stanno in dizionari tipizzati (`src/i18n/it.ts`, `en.ts`): una chiave mancante fa fallire il controllo dei tipi.
- **Deploy**: `monacol.github.io/nota-bene/`, con il base path in un solo punto della configurazione. Niente dominio proprio nella v1.

## Considered Options

- **Starlight**: navigazione e i18n già pronti, ma impone l'aspetto di un sito di documentazione, scomodo per la schermata della Lettura.
- **SvelteKit con adapter-static**: adatto a un'app, ma qui quasi tutte le pagine sono testo, e Astro dà gratis le content collections con schema.
- **VitePress**: buono per i Capitoli, debole per Letture ed Esercizi.
- **Isole in Preact o in TypeScript puro**: Preact non dà vantaggi qui. TypeScript puro diventerebbe disordinato con 8 tipi di Esercizio pieni di stato.
- **MDX per i Capitoli**: più potente, ma meno leggibile per chi rivede e traduce, maestro compreso.
- **Partiture pre-generate come SVG alla build**: si caricano prima, ma hanno larghezza fissa e richiedono abcjs con un DOM finto.
- **Slug tradotti per l'inglese**: più naturali, ma raddoppiano gli id da tenere immutabili.

## Consequences

- Il calcolo delle Sillabe e i generatori degli Esercizi sono moduli TypeScript puri, testati con Vitest. La validazione in CI e la build usano lo stesso codice.
- La pipeline di CI è: controllo dei tipi, validazione delle Letture (ADR-0003), build di Astro, test Playwright, deploy su Pages.
- Font e librerie (abcjs, smplr, campioni) sono serviti dal sito stesso, mai da CDN di terzi.
- Le pagine di servizio stanno in `contenuti/pagine/it/` e `contenuti/pagine/en/`. A differenza dei Capitoli non hanno ripiego: se ne manca una in inglese la CI blocca il deploy, perché privacy e uso dell'AI non si mostrano in una lingua che il lettore potrebbe non capire. Le sezioni "Brani" e "asset di terzi" della pagina dei crediti sono generate alla build da `edizione.yml` e dai file di licenza degli asset.
- Ogni file di contenuto, cioè Capitoli e pagine di servizio in ciascuna lingua, ha nel frontmatter `revisione: { da, data }`: è la revisione umana che la pagina "Uso dell'intelligenza artificiale" dichiara. Un file senza revisione fa fallire la CI. La traduzione inglese la scrive Claude partendo dall'italiano già rivisto, e la rivede una persona.
- Un file inglese ha anche `tradotto_da: <data della revisione italiana>`. Se l'italiano è stato rivisto dopo quella data, la CI avvisa che la traduzione è indietro, senza bloccare il deploy.
- Il ripiego sull'italiano serve solo per le modifiche dopo il lancio: la v1 esce con tutti i Capitoli, i testi degli Esercizi di teoria e le pagine di servizio già in inglese.
