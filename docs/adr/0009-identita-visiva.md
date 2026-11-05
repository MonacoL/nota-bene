# Identità visiva: Atkinson Hyperlegible, carta e bordeaux, tema scuro automatico

Il sito usa un solo font, **Atkinson Hyperlegible Next** (OFL), in due pesi: 400 per il testo e 700 per i titoli. È disegnato perché le lettere simili non si confondano, il che aiuta chi legge da telefono e chi parte da zero. I colori sono quelli di una carta da musica: fondo avorio, inchiostro quasi nero, accento **bordeaux**. Il tema scuro c'è, e segue `prefers-color-scheme`. Il segno del nome è una testa di nota col gambo, nel colore d'accento, prima della scritta "Nota Bene". La scelta viene dal prototipo [Identità visiva](https://github.com/MonacoL/nota-bene/issues/20) (branch `prototype/identita-visiva`, variante E).

## Considered Options

- **Serif per i titoli e sans per il testo** (Source Serif 4 + Source Sans 3, oppure Fraunces + Inter): più editoriali, ma pesano 90–110 KB contro 25 KB, e il serif da telefono non legge meglio.
- **Font di sistema**: zero byte, ma il sito cambierebbe aspetto da un telefono all'altro, e le Sillabe nella partitura avrebbero misure diverse a ogni dispositivo.
- **Solo tema chiaro nella v1**: meno colori da tenere, ma lo studio la sera da telefono è un caso tipico, e abcjs segue il tema senza altro lavoro.
- **Altri segni**: corona (fermata), timbro "nb", solo testo. La testa di nota si riconosce anche a 16 px come favicon.

## Consequences

- **Colori**: si definiscono come variabili CSS, una sola volta per tema. Valori di partenza:

  | Variabile | Chiaro | Scuro | Uso |
  |---|---|---|---|
  | `--bg` | `#faf7f0` | `#171411` | fondo |
  | `--surface` | `#ffffff` | `#221e1a` | barre, fogli, riquadri |
  | `--ink` | `#1e1a16` | `#ede6da` | testo e partitura |
  | `--muted` | `#5e554b` | `#b3a898` | testo secondario, attribuzione |
  | `--line` | `#d9cfbf` | `#3d352d` | bordi, separatori |
  | `--accent` | `#8a1c2c` | `#e89aa4` | link, pulsante principale, segno |
  | `--accent-ink` | `#ffffff` | `#2a0c11` | testo sul pulsante principale |
  | `--sol` | `#1f4f8f` | `#8db7f0` | Sillabe della Soluzione, segno di Mutazione |
  | `--suona` | `#c2410c` | `#f2a65a` | nota e sillaba illuminate durante l'Ascolto di verifica |
  | `--ok` / `--ok-bg` | `#1e6b3a` / `#e7f3ea` | `#7ccb93` / `#1b2e21` | riscontro giusto |
  | `--ko` / `--ko-bg` | `#a3261b` / `#fbe9e6` | `#f2958a` / `#3a1d1a` | riscontro sbagliato |

- **Contrasto**: ogni coppia rispetta WCAG 2.1 AA in entrambi i temi: 4,5:1 per il testo, comprese Sillabe e riscontri, e 3:1 per la nota illuminata, che è grafica. Un test in CI ricalcola i rapporti dalle variabili e blocca il deploy se uno scende sotto soglia.
- **Giusto e sbagliato** non si affidano al colore: hanno sempre un'icona (✓ / ✗) e una parola ("Giusto", "Non è così").
- **Tema scuro**: segue soltanto `prefers-color-scheme`. Non c'è un interruttore nel sito e non si salva niente. abcjs disegna in `currentColor`, quindi la partitura prende `--ink` da sola. Le Sillabe e la nota illuminata si colorano con le classi CSS. Le schermate Playwright (ADR-0006) si fanno in tutti e due i temi.
- **Tipografia**: corpo del testo a 17 px, Testo e Sillabe nella partitura a circa 15–16 px (vedi "Schermata della Lettura su telefono"), pulsanti alti almeno 48 px. Angoli arrotondati a 12 px. Il nome del font va passato ad abcjs tra virgolette (`%%vocalfont "Atkinson Hyperlegible Next" 15`): senza virgolette abcjs legge male il nome e scrive le sillabe minuscole.
- **♭ ♮ ♯**: Atkinson non li ha, e non li hanno nemmeno gli altri font provati nei sottoinsiemi latini. Si usa un secondo `@font-face` con `unicode-range: U+266D-266F`, ricavato da **Noto Music** (OFL) e ridotto ai tre glifi (2,6 KB), con `size-adjust: 150%`, perché senza quell'ingrandimento i segni vengono minuscoli.
- **Peso**: circa 28 KB di font in tutto (Atkinson 400 e 700 in sottoinsieme latino, più le alterazioni), serviti dal sito (ADR-0006) e con `font-display: swap`. Le licenze OFL vanno nella pagina dei crediti, tra gli asset di terzi.
- **Segno e favicon**: il segno è un SVG nel codice, colorato con `--accent`, quindi segue il tema. La favicon è lo stesso disegno, bianco su un quadrato bordeaux arrotondato. Non ha testo, perché le favicon non caricano i font web.
- **Inglese**: valgono gli stessi font e colori. Atkinson copre i caratteri dell'italiano e dell'inglese nel sottoinsieme latino.
