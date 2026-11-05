# Test responsive e visual regression in CI

Ricerca per l'issue #5. Data: 2026-11-05. Domanda: come verificare in automatico, su GitHub Actions, che Nota Bene funzioni e si veda bene a più risoluzioni e nei tre motori (Chromium, WebKit, Firefox), con confronto degli screenshot, audio gestito e deploy su GitHub Pages solo se i test passano.

Le sezioni 1-7 riportano fatti con la fonte. La sezione 8 è la **raccomandazione** ed è un'opinione, marcata come tale. Le stime di tempo sono stime, non misure.

## 1. Strumento e versioni correnti

- **Playwright Test** è l'unico strumento considerato in dettaglio: un solo runner pilota Chromium, Firefox e WebKit, ha l'emulazione dei dispositivi e il confronto screenshot integrato (`toHaveScreenshot`). Fonte: https://playwright.dev/docs/emulation, https://playwright.dev/docs/test-snapshots
- Versione stabile corrente di `@playwright/test`: **1.64.1**, pubblicata su npm il 2026-10-14 (1.64.0 il 2026-10-07; 1.65 è ancora in beta al 2026-11-05). Fonte: `npm view @playwright/test time` (registro npm, https://www.npmjs.com/package/@playwright/test).
- Browser inclusi in 1.64: Chromium 156.0.8078.4, Firefox 157.0, WebKit 27.2. Fonte: https://playwright.dev/docs/release-notes e `browsers.json` del pacchetto `playwright-core@1.64.1`.
- Novità rilevanti delle ultime release: in 1.64 `--update-snapshots=missing` fa passare il run, e la modalità di default si chiama `'default'`; da 1.62 gli screenshot possono essere salvati in WebP senza perdita (nome che finisce in `.webp`), in 1.64 c'è l'opzione `type` in `expect` per farlo anche sugli screenshot senza nome. Fonte: https://playwright.dev/docs/release-notes
- Immagine Docker ufficiale: `mcr.microsoft.com/playwright:v1.64.1-noble` (Ubuntu 24.04). Esistono anche `-jammy` (22.04) e `-resolute` (26.04). La documentazione dice: "It is recommended to always pin your Docker image to a specific version if possible." Fonte: https://playwright.dev/docs/docker
- Versioni correnti delle action GitHub (ultima release, verificata con `gh api repos/<owner>/<repo>/releases/latest`): `actions/checkout` v7.0.1, `actions/setup-node` v7.1.0, `actions/upload-artifact` v7.0.2, `actions/configure-pages` v6.0.0, `actions/upload-pages-artifact` v5.0.0, `actions/deploy-pages` v5.0.1. Gli esempi nella documentazione Playwright e GitHub sono ancora su major precedenti (checkout@v6, upload-artifact@v4/v5, configure-pages@v5, upload-pages-artifact@v4, deploy-pages@v4): https://playwright.dev/docs/ci-intro, https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## 2. Matrice di viewport e dispositivi

- I dispositivi si dichiarano come **project** in `playwright.config.ts`, ciascuno con `use: { ...devices['<nome>'] }`. Il viewport si può sovrascrivere, ma va scritto dopo lo spread del preset. Fonte: https://playwright.dev/docs/emulation
- `isMobile`: "Whether the `meta viewport` tag is taken into account and touch events are enabled." `hasTouch` abilita gli eventi touch; `deviceScaleFactor` è il DPR, default 1. Fonte: https://playwright.dev/docs/api/class-browser#browser-new-context-option-is-mobile
- Si possono emulare anche `locale` (utile per IT/EN) e `colorScheme` (`'light'`, `'dark'`, `'no-preference'`). Fonte: https://playwright.dev/docs/emulation
- Preset rilevanti nel registro di 1.64.1 (file `packages/isomorphic/deviceDescriptorsSource.json`, https://github.com/microsoft/playwright/blob/v1.64.1/packages/isomorphic/deviceDescriptorsSource.json), con viewport CSS, DPR e motore:

| Preset | Viewport | DPR | Motore |
|---|---|---|---|
| iPhone SE | 320×568 | 2 | webkit |
| Galaxy S8 | 360×740 | 3 | chromium |
| Galaxy S24 | 360×780 | 3 | chromium |
| Pixel 10 | 360×732 | 3 | chromium |
| iPhone SE (3rd gen) | 375×667 | 2 | webkit |
| iPhone 15 | 393×659 | 3 | webkit |
| iPhone 17 | 402×681 | 3 | webkit |
| Pixel 7 | 412×839 | 2.625 | chromium |
| iPhone 15 Pro Max | 430×739 | 3 | webkit |
| iPad Mini | 768×1024 | 2 | webkit |
| iPad Pro 11 | 834×1194 | 2 | webkit |
| Desktop Chrome | 1280×720 | 1 | chromium |
| Desktop Firefox | 1280×720 | 1 | firefox |
| Desktop Safari | 1280×720 | 2 | webkit |

- Per Firefox il registro ha solo preset desktop (`Desktop Firefox`, `Desktop Firefox HiDPI`): i telefoni sono definiti su Chromium o WebKit. (Osservazione sul file sopra.)
- **WebKit non è Safari**: "Playwright's WebKit is derived from the latest WebKit main branch sources" e non funziona con il Safari ufficiale. "running WebKit on Linux CI is usually the most affordable option, for the closest-to-Safari experience you should run WebKit on mac." Anche i codec multimediali cambiano molto fra Linux, macOS e Windows. Fonte: https://playwright.dev/docs/browsers. Quindi il WebKit su Linux in CI approssima iOS Safari, non lo sostituisce.

## 3. Screenshot e determinismo

- Funzionamento: al primo run `toHaveScreenshot` salva una baseline; nei run successivi confronta. Le baseline stanno accanto al test in una cartella `<file>.spec.ts-snapshots`, da mettere sotto version control. Il nome di default contiene progetto e piattaforma (es. `example-test-1-chromium-darwin.png`). Fonte: https://playwright.dev/docs/test-snapshots
- La documentazione avverte: "Browser rendering can vary based on the host OS, version, settings, hardware" e "Screenshots differ between browsers and platforms due to different rendering, fonts and more". Per screenshot coerenti: "run tests in the same environment where the baseline screenshots were generated." Fonte: https://playwright.dev/docs/test-snapshots
- La pagina CI di Playwright propone il job GitHub Actions dentro il container ufficiale (`container: image: mcr.microsoft.com/playwright:v1.64.1-noble`, `options: --user 1001`), utile anche per avere un ambiente coerente per i confronti degli screenshot. Fonte: https://playwright.dev/docs/ci
- Il percorso delle baseline si controlla con `snapshotPathTemplate`; i token includono `{projectName}`, `{platform}`, `{testFilePath}`, `{arg}`, `{ext}`. Esempio dalla documentazione: `'{testDir}/__screenshots__/{testFilePath}/{arg}{ext}'`. Togliendo `{platform}` si tiene un solo set di baseline (quello Linux del container). Fonte: https://playwright.dev/docs/api/class-testconfig#test-config-snapshot-path-template
- Opzioni utili di `toHaveScreenshot` (default fra parentesi): `animations` (`"disabled"`: le animazioni finite vanno a fine corsa, quelle infinite tornano allo stato iniziale), `caret` (`"hide"`), `scale` (`"css"`, quindi un'immagine per pixel CSS anche con DPR 3), `fullPage` (false), `mask` (locator coperti da un riquadro, colore `#FF00FF`), `stylePath` (CSS applicato solo durante lo scatto), `threshold` (0.2, tolleranza di colore per pixel da 0 a 1), `maxDiffPixels` e `maxDiffPixelRatio` (non impostati di default). Si impostano globalmente o per progetto in `expect.toHaveScreenshot`. Fonti: https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-screenshot-1, https://playwright.dev/docs/test-snapshots, https://playwright.dev/docs/test-configuration
- Font: `document.fonts.ready` "will only resolve once the document has completed loading fonts, layout operations are completed, and no further font loads are needed." Fonte: https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet/ready. Attendere questa promise prima dello scatto, e servire i font (testo e font musicale SMuFL dello SVG) dalla repo invece di affidarsi ai font di sistema, riduce le differenze fra macchine. (La seconda parte è una deduzione dalla nota sui font della pagina snapshot, non un'indicazione esplicita di Playwright.)
- Hover: un puntatore rimasto sopra un elemento finisce nello screenshot; la documentazione suggerisce di spostarlo fuori (es. `page.mouse.move(-1, -1)`). Fonte: https://playwright.dev/docs/test-snapshots

## 4. Aggiornare le baseline

- Comando: `npx playwright test --update-snapshots[=mode]`. Senza valore vale `changed`. Modalità: `all` (riscrive tutto), `changed` (riscrive solo quelle diverse e crea le mancanti), `missing` (crea solo le mancanti; da 1.64 il run passa), `none`, `default` ("Missing snapshots are created, but the tests that create them fail, so that the run does not silently pass in CI"). Fonti: https://playwright.dev/docs/test-cli, https://playwright.dev/docs/api/class-testconfig#test-config-snapshot-path-template, https://playwright.dev/docs/release-notes
- Le baseline vanno generate nello stesso ambiente del confronto (sezione 3): sul PC si esegue il comando dentro lo stesso container `mcr.microsoft.com/playwright:v1.64.1-noble`, con i flag consigliati `--init` e `--ipc=host`. Fonte: https://playwright.dev/docs/docker
- Il report HTML (artifact `playwright-report`) mostra atteso, ottenuto e differenza; si apre con `npx playwright show-report <cartella>`. Fonte: https://playwright.dev/docs/ci-intro
- Se un job di CI fa commit delle nuove baseline con `GITHUB_TOKEN`, quel push non fa ripartire la CI: "events triggered by the `GITHUB_TOKEN` will not create a new workflow run", salvo `workflow_dispatch` e `repository_dispatch`. Fonte: https://docs.github.com/en/actions/concepts/security/github_token

## 5. Audio (Web Audio)

- Autoplay in Chrome: un `AudioContext` creato prima di un gesto dell'utente nasce `"suspended"` e va ripreso con `resume()` dopo il gesto; il flag `--autoplay-policy=no-user-gesture-required` disattiva la policy. Fonte: https://developer.chrome.com/blog/autoplay. Nei test un `click()` di Playwright sul pulsante del Riferimento tonale o dell'Ascolto di verifica conta come gesto, quindi il flag non dovrebbe servire (da verificare nel prototipo).
- `OfflineAudioContext` "doesn't render the audio to the device hardware; instead, it generates it, as fast as it can, and outputs the result to an `AudioBuffer`." Fonte: https://developer.mozilla.org/en-US/docs/Web/API/OfflineAudioContext. Permette di verificare il segnale prodotto (durata, presenza di suono) senza scheda audio.
- Il suono non si può confrontare con uno screenshot. Le strade possibili sono tre: (a) test unitari della parte pura (da Lettura a lista di eventi: frequenza, istante, durata), senza browser; (b) nei test e2e, sostituire `AudioContext` con uno stub registrato prima del caricamento della pagina (`page.addInitScript`) che annota le chiamate, e controllare che il click produca gli eventi attesi; (c) un test di smoke con `OfflineAudioContext` in Chromium. Le tre strade sono una proposta di metodo, non pratiche documentate da Playwright.

## 6. Costi, limiti e tempi su GitHub Actions

- "GitHub Actions usage is free for standard GitHub-hosted runners in public repositories". Fonte: https://docs.github.com/en/actions/concepts/billing-and-usage
- Runner standard per repo pubbliche: `ubuntu-latest` 4 CPU, 16 GB RAM, 14 GB SSD, x64 (oggi Ubuntu 24.04); `macos-latest` 3 CPU M1, 7 GB. Fonte: https://docs.github.com/en/actions/reference/runners/github-hosted-runners
- Limiti: 6 ore per job; fino a 20 job in parallelo sul piano Free (max 5 macOS); una matrice genera al massimo 256 job; 500 MB di storage artifact sul piano Free. Fonte: https://docs.github.com/en/actions/reference/limits
- Playwright consiglia `workers: 1` in CI "to prioritize stability and reproducibility", e per parallelizzare lo **sharding** su più job (`--shard=i/n`, reporter `blob`, job finale `merge-reports`); con `fullyParallel: true` le shard sono più bilanciate. Fonti: https://playwright.dev/docs/ci, https://playwright.dev/docs/test-sharding
- Non è consigliato mettere in cache i browser ("Caching browser binaries is not recommended"): il ripristino costa quanto il download. Con il container i browser sono già nell'immagine. Fonte: https://playwright.dev/docs/ci
- Con `--only-shell` si evita di scaricare il Chromium completo se si gira solo headless. Fonte: https://playwright.dev/docs/browsers
- Stima (non misurata): con poche pagine statiche e una decina di progetti, un run completo dovrebbe restare sotto i 10 minuti di orologio con tre job paralleli (uno per motore). Va misurata sul prototipo.

## 7. Collegamento con il deploy su GitHub Pages

- Deploy con workflow personalizzato: `actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`. Il job di deploy richiede `pages: write` e `id-token: write`, usa l'environment `github-pages` e deve avere `needs:` verso il job che carica l'artifact. Fonte: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- Limiti di Pages: sito pubblicato massimo 1 GB; un deploy va in timeout dopo 10 minuti; banda "soft" circa 100 GB al mese; il limite di 10 build all'ora non vale per i workflow Actions personalizzati. Fonte: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- Playwright descrive anche test dopo il deploy, attivati da `deployment_status`. Fonte: https://playwright.dev/docs/ci. Però il deploy fatto da `actions/deploy-pages` con `GITHUB_TOKEN` probabilmente non crea un nuovo workflow run (vedi sezione 4): un eventuale smoke test sul sito pubblicato conviene metterlo come job successivo nello stesso workflow, usando l'output `page_url` del deploy (deduzione, da verificare).
- `webServer` in `playwright.config.ts` avvia un server locale prima dei test (`command`, `url`, `reuseExistingServer: !process.env.CI`). Fonte: https://playwright.dev/docs/test-configuration. Così i test girano sul sito statico già costruito, prima di pubblicarlo.

## 8. Raccomandazione

> **Raccomandazione (opinione dell'autore della ricerca, da discutere)**

**Strumento.** Playwright Test 1.64.1, versione bloccata in `package.json` e uguale al tag dell'immagine Docker. Tutti i test, in CI e in locale quando si aggiornano le baseline, girano in `mcr.microsoft.com/playwright:v1.64.1-noble`. Si aggiornano insieme pacchetto e immagine, e dopo ogni aggiornamento si rigenerano le baseline in un commit dedicato.

**Due livelli di test.**
1. *Test funzionali e di layout* (su tutti i progetti): la pagina carica, la navigazione funziona, i controlli rispondono al tocco, e una verifica senza screenshot che non ci sia scorrimento orizzontale (`document.documentElement.scrollWidth <= innerWidth`) e che lo SVG della partitura stia nel viewport.
2. *Visual regression* (su un sottoinsieme di progetti): `toHaveScreenshot` sulle pagine principali e sugli SVG delle Letture, in IT; in EN solo sul telefono piccolo e sul desktop Chromium, dove si vede se un testo più lungo rompe il layout.

**Matrice di viewport proposta** (project Playwright):

| Project | Preset | Viewport | Motore | Funzionali | Screenshot |
|---|---|---|---|---|---|
| `phone-320` | iPhone SE | 320×568 | webkit | sì | no (solo overflow) |
| `phone-360` | Galaxy S8 | 360×740 | chromium | sì | sì (IT + EN) |
| `iphone` | iPhone 15 | 393×659 | webkit | sì | sì |
| `phone-large` | Pixel 7 | 412×839 | chromium | sì | no |
| `phone-firefox` | Desktop Firefox con viewport 360×740 | 360×740 | firefox | sì | no |
| `tablet` | iPad Mini | 768×1024 | webkit | sì | sì |
| `tablet-landscape` | iPad Mini landscape | 1024×768 | webkit | sì | no |
| `desktop-chromium` | Desktop Chrome | 1280×720 | chromium | sì | sì (IT + EN) |
| `desktop-firefox` | Desktop Firefox | 1280×720 | firefox | sì | sì |
| `desktop-webkit` | Desktop Safari | 1280×720 | webkit | sì | no |
| `desktop-wide` | Desktop Chrome con viewport 1920×1080 | 1920×1080 | chromium | sì | sì |

Sono circa 7 set di baseline per pagina. Prima di aggiungere dispositivi si aspetta di vedere quanti falsi positivi danno questi.

**Impostazioni degli screenshot.** `snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}'` (senza `{platform}`, perché c'è un solo ambiente); `scale: 'css'` e `animations: 'disabled'` (sono già i default); `reducedMotion: 'reduce'` nei project; `await page.evaluate(() => document.fonts.ready)` prima di ogni scatto; font del sito e font musicale serviti dalla repo; `mask` per gli elementi che variano (date, contenuti casuali degli Esercizi di teoria). Per gli Esercizi di teoria, che la piattaforma genera, il generatore deve accettare un seed fisso nei test. Soglie di partenza: `threshold: 0.2` (default) e `maxDiffPixelRatio: 0.001`; si allentano solo per un singolo test, e con un commento che spieghi perché. Valutare il formato WebP (1.62+) se la cartella delle baseline cresce troppo.

**Aggiornamento delle baseline.** Uno script `npm run test:update` che lancia `docker run --rm --init --ipc=host -v "$PWD":/work -w /work mcr.microsoft.com/playwright:v1.64.1-noble npx playwright test --update-snapshots=changed`. Le baseline cambiate entrano nella stessa PR della modifica alla UI, così la revisione le vede. In aggiunta, un workflow manuale (`workflow_dispatch`) che rigenera le baseline e le carica come artifact, per chi non ha Docker. Lo si preferisce a un commit automatico, perché un commit fatto con `GITHUB_TOKEN` non fa ripartire la CI.

**Audio.** Niente suono nei test e2e. La logica musicale (da Lettura e Tonalità a eventi con frequenza e tempo) sta in un modulo puro con test unitari in Node. Nei test e2e uno stub di `AudioContext` iniettato con `addInitScript` controlla che il click su Riferimento tonale e Ascolto di verifica produca gli eventi attesi. In più, un solo test Chromium con `OfflineAudioContext` verifica che esca un segnale non nullo della durata giusta.

**Workflow (bozza)** `.github/workflows/ci.yml`, su `pull_request` e `push` a `main`:

```yaml
jobs:
  build:            # costruisce il sito statico, lo carica come artifact interno
  test:
    needs: build
    runs-on: ubuntu-latest
    container:
      image: mcr.microsoft.com/playwright:v1.64.1-noble
      options: --user 1001
    strategy:
      fail-fast: false
      matrix:
        engine: [chromium, webkit, firefox]   # un job per motore, in parallelo
    steps:
      # checkout, npm ci, scarica il sito costruito
      # npx playwright test --project=<project di quel motore>
      # (es. nomi di project con suffisso del motore e --project="*-${{ matrix.engine }}")
      # upload-artifact del report (if: !cancelled())
  deploy:
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    needs: [build, test]
    permissions: { pages: write, id-token: write }
    environment: { name: github-pages, url: "${{ steps.deployment.outputs.page_url }}" }
    # upload-pages-artifact + deploy-pages
  smoke:            # facoltativo: pochi test Chromium sull'URL pubblicato
    needs: deploy
```

I test girano sul sito costruito, servito da `webServer` con lo stesso base path di Pages (`/nota-bene/`). Il deploy parte solo se tutti i job di test passano. In CI `workers` va da 1 (consigliato dalla documentazione) a 2-4 (il runner ha 4 CPU): si decide misurando. Lo sharding con `merge-reports` si aggiunge solo se un job supera circa 10 minuti.

## 9. Dubbi aperti

- **Soglie.** Il valore di `maxDiffPixelRatio` va tarato su SVG reali (Verovio, VexFlow o altro: dipende dalla scelta del motore di rendering, che è un'altra issue).
- **WebKit Linux e iOS reale.** WebKit su Linux non replica iOS Safari (font, codec, Web Audio). Va deciso se servono controlli manuali periodici su un iPhone vero, o un job `macos-latest` occasionale (gratuito per le repo pubbliche, ma con 3 CPU e 7 GB).
- **Firefox mobile.** Non ci sono preset Firefox per telefoni: il progetto `phone-firefox` verifica solo il viewport stretto, non il comportamento di Firefox per Android.
- **Commit delle baseline da CI.** Se in futuro si vuole il commit automatico, serve un PAT o una GitHub App per far ripartire i test: è da valutare per la sicurezza.
- **Action alla versione più recente.** Le action sono a major più nuove di quelle degli esempi ufficiali (es. `deploy-pages` v5, `upload-pages-artifact` v5): prima di adottarle vanno lette le note di rilascio per eventuali breaking change.
- **Stima dei tempi.** È da misurare sul primo prototipo.
