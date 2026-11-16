# Stile Vox Viva: fondo nero, arancio, Oswald e Open Sans, partiture su carta

Nota Bene prende lo stile di [VoxStudio](https://github.com/ZioAnacleto/VoxStudio), lo strumento di studio delle parti del coro Vox Viva, che a sua volta riprende voxviva.it. Il sito ha solo il **tema scuro**: fondo quasi nero `#151515`, riquadri `#222222`, accento **arancio** `#ed7c2a`. I titoli sono in **Oswald**, maiuscolo e spaziato, e il testo in **Open Sans**. Partiture, esempi ed Esercizi stanno su un **foglio color carta** (`#fbf8f3`), come in VoxStudio: le note restano scure su chiaro, che da telefono si leggono meglio. Il sito resta Nota Bene, con le sue due crome legate, ora in inchiostro e arancio. Sostituisce l'[ADR-0009](0009-identita-visiva.md), deciso con l'utente nel grilling del 13 novembre 2026.

## Considered Options

- **Restare con l'ADR-0009** (avorio, bordeaux, Atkinson, due temi): più leggibile in assoluto, ma Nota Bene nasce per i coristi di Vox Viva e deve sembrare della stessa famiglia di VoxStudio.
- **Tenere i due temi, con il nero solo in quello scuro**: lo stile di Vox Viva è il nero, e un tema chiaro arancio-su-bianco non esiste da copiare. Due temi raddoppiano screenshot e contrasti senza un guadagno chiaro.
- **Partiture su fondo scuro** (abcjs in `currentColor` chiaro): niente foglio, ma note chiare su nero stancano e VoxStudio stesso usa la carta.
- **Testo bianco sui pulsanti arancio**, come VoxStudio: 2,8:1, sotto il 4,5:1 di WCAG AA. **Scurire l'arancio** fino a passare (circa `#b85a14`) toglie il colore di Vox Viva. Si scrive invece in nero sull'arancio: 6,5:1.
- **Marchio Vox Viva** (la "V" di VoxStudio): il sito si usa anche con altri cori, quindi resta il segno di Nota Bene.
- **Font da Google Fonts**, come VoxStudio: la storia 57 della specifica vieta risorse di terzi. I font si servono dal sito.

## Consequences

- **Colori**: variabili CSS in `src/styles/global.css`, in un solo blocco `:root`, più un blocco per il foglio:

  | Variabile | Valore | Uso |
  |---|---|---|
  | `--bg` | `#151515` | fondo |
  | `--surface` | `#222222` | riquadri, schede, barre |
  | `--ink` | `#dcdcdc` | testo |
  | `--muted` | `#8a8a8a` | testo secondario, attribuzione |
  | `--line` | `#2f2f2f` | bordi, separatori |
  | `--accent` | `#ed7c2a` | link, pulsante principale, segno |
  | `--accent-2` | `#f39a55` | link e pulsanti al passaggio |
  | `--accent-ink` | `#151515` | testo sul pulsante arancio |
  | `--sol` / `--suona` | `#8db7f0` / `#f2a65a` | Sillabe e nota illuminata fuori dal foglio |
  | `--ok` / `--ok-bg` | `#7ccb93` / `#1b2e21` | riscontro giusto |
  | `--ko` / `--ko-bg` | `#f2958a` / `#3a1d1a` | riscontro sbagliato |
  | `--carta` | `#fbf8f3` | foglio di partiture, esempi ed Esercizi |
  | `--carta-ink` / `--carta-sol` / `--carta-suona` | `#1e1a16` / `#1f4f8f` / `#c2410c` | note, Sillabe e nota illuminata sul foglio |

  Dentro il foglio (`.pentagramma`, `.partitura`) `--ink`, `--sol` e `--suona` prendono i valori `--carta-*`, quindi abcjs, che disegna in `currentColor`, non va toccato.
- **Contrasto**: tutte le coppie restano in WCAG 2.1 AA (4,5:1 per il testo, 3:1 per la nota illuminata), comprese quelle del foglio. Il test in CI (`tests/unit/contrasti.test.ts`) ora controlla un tema solo più il foglio.
- **Tema**: niente `prefers-color-scheme`, `color-scheme: dark`. Gli screenshot Playwright si fanno in un tema solo.
- **Tipografia**: titoli in Oswald 400, maiuscolo, spaziatura 0,06–0,08 em, con la lineetta arancio sotto i titoli di sezione. Testo in Open Sans 400 e 700, a 17 px (VoxStudio usa 14 px, ma qui si legge da telefono). Pulsanti in Open Sans 700, maiuscolo, alti almeno 48 px, angoli a 4 px. Il maiuscolo lo fa il CSS: nei sorgenti titoli e testi restano scritti come prima, con le minuscole del glossario.
- **Partitura**: Testo e Sillabe in Open Sans (`%%vocalfont "Open Sans" 15`, con le virgolette per abcjs).
- **♭ ♮ ♯**: come nell'ADR-0009, un `@font-face` ricavato da Noto Music con `unicode-range: U+266D-266F` e `size-adjust: 150%`, messo nella lista subito dopo Open Sans.
- **Peso**: circa 65 KB di font (Oswald 400 e 700, Open Sans 400 e 700, latino, più le alterazioni), contro i 28 KB di prima. Si accettano per avere lo stile di Vox Viva. Licenze OFL nella pagina dei crediti.
- **Segno e favicon**: le due crome, la prima in `--ink` e la seconda in `--accent`. La favicon è il segno in arancio su un quadrato `#151515`.
- **Intestazione**: segno, scritta (Oswald, maiuscolo spaziato come in VoxStudio), menu e lingua stanno su una riga anche a 320 px, come prima.
