# Come mostrare le partiture nel browser

Ricerca per l'issue #2. Dati raccolti il 2026-11-05 da fonti primarie: repository GitHub, registry npm, documentazione ufficiale. Le dimensioni dei bundle le ho misurate scaricando i file da jsDelivr e comprimendoli con gzip -9. Un server reale con brotli darebbe numeri un po' più bassi, ma l'ordine di grandezza è quello.

## Domanda

Quale libreria (o approccio) usiamo per mostrare nel browser le partiture delle Letture e degli Esercizi di teoria?

## Un'osservazione che cambia il peso dei criteri

Per l'ADR-0001 le Letture sono estratti scelti a mano da Brani reali e non vengono mai generate. Quindi l'estrazione di poche battute di una sola Voce non deve per forza avvenire nel browser: si può fare una volta, quando si prepara la Lettura, e salvare nel repo un file piccolo con un solo rigo e qualche battuta. Il criterio "estrarre una Voce da una partitura corale" pesa allora sulla preparazione dei contenuti, non sulla libreria che disegna a runtime. Di conseguenza:

- a runtime basta disegnare un rigo con al massimo due righe di testo sotto (Testo e Soluzione);
- gli Esercizi di teoria invece sono generati dalla piattaforma, quindi a runtime serve poter costruire al volo una Nota o un Intervallo in una delle tre Chiavi.

## Candidati: stato attuale

| | Ultima versione | Data | Licenza | Manutenzione |
|---|---|---|---|---|
| Verovio | 6.4.1 | 2026-11-03 | LGPL-3.0-only | molto attiva: ultimo push il 2026-11-05, più di 100 commit nell'ultimo anno |
| OpenSheetMusicDisplay (OSMD) | 2.2.1 | 2026-10-12 | BSD-3-Clause | molto attiva: più di 100 commit nell'ultimo anno |
| VexFlow | 5.0.0 | 2025-03-05 | MIT | lenta: nessuna release da 20 mesi, 16 commit nell'ultimo anno |
| abcjs | 6.7.2 | 2026-10-16 | MIT | molto attiva: più di 100 commit nell'ultimo anno |
| LilyPond (pre-render in build) | 2.26.0 (stabile) | n.d. | GPL-3.0 (lo strumento) | attiva |

Fonti: registry npm (`https://registry.npmjs.org/<pacchetto>`), API GitHub dei repository [rism-digital/verovio](https://github.com/rism-digital/verovio), [opensheetmusicdisplay/opensheetmusicdisplay](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay), [vexflow/vexflow](https://github.com/vexflow/vexflow) e [paulrosen/abcjs](https://github.com/paulrosen/abcjs), e la [pagina download di LilyPond](https://lilypond.org/download.html).

## Peso del bundle (misurato)

| File | Grezzo | gzip -9 |
|---|---|---|
| `verovio@6.4.1/dist/verovio-toolkit-wasm.js` (WASM incluso) | 7,4 MB | 2,37 MB |
| `opensheetmusicdisplay@2.2.1/build/opensheetmusicdisplay.min.js` (VexFlow incluso) | 1,42 MB | 360 KB |
| `vexflow@5.0.0/build/cjs/vexflow-core.js` (senza font) | 337 KB | 91 KB |
| `vexflow@5.0.0/build/cjs/vexflow-bravura.js` (con il font Bravura) | 728 KB | 389 KB |
| `abcjs@6.7.2/dist/abcjs-basic-min.js` (rendering e sintesi audio) | 512 KB | 148 KB |
| SVG pre-renderizzati con LilyPond | 0 KB di libreria | qualche KB per Lettura |

Per abcjs vanno aggiunti i soundfont, scaricati a parte e solo se si suona (vedi sotto).

## Confronto sui criteri dell'issue

| Criterio | Verovio | OSMD | VexFlow diretto | abcjs | LilyPond → SVG in build |
|---|---|---|---|---|---|
| **Testo e rigo delle Sillabe (Soluzione), mostrabile e nascondibile** | Sì: più strofe (`verse`) per nota e molte opzioni `lyric*`. Per nascondere si ridisegna o si agisce sull'SVG | Sì: più strofe da MusicXML (`<lyric number>`). `drawLyrics` però le spegne tutte insieme, quindi per nasconderne una sola si ridisegna senza o si agisce sull'SVG | Sì, ma a mano: ogni sillaba è una `Annotation` da posizionare | Sì: più righe `w:` danno più righe di testo per nota (`el.lyric` è un array). Si nasconde ridisegnando senza la seconda riga `w:` | Sì (`\lyricsto`, più `Lyrics`), ma servono due SVG per Lettura, uno con e uno senza Soluzione |
| **Estrarre poche battute di una Voce** | Battute sì, a runtime: `select({measureRange: "5-8"})`. Per un singolo rigo non c'è un'opzione documentata | Battute sì: `drawFromMeasureNumber` / `drawUpToMeasureNumber`. Voce sì: `sheet.Instruments[i].Visible = false` | No: nessun parser, si costruisce tutto a mano | No a runtime: l'estrazione avviene quando si prepara il file ABC della Lettura | Sì, in build, modificando il sorgente `.ly` |
| **Leggibilità a ~360 px, reflow e zoom** | Buona: `pageWidth`, `scale`, `breaks: auto`, `adjustPageHeight`. Il layout si rifà alla larghezza dello schermo | Buona: `autoResize` (attivo di default), `zoom` | A carico nostro: si calcola la larghezza delle battute | Buona: `responsive: "resize"` scala l'SVG; `wrap` + `staffwidth` ricalcolano gli a capo | Debole: l'SVG si può solo scalare, non va a capo da sé. Si potrebbero generare più larghezze |
| **Peso e caricamento su mobile** | Pesante: 2,4 MB gzip più l'inizializzazione del WASM | Medio: 360 KB gzip | Leggero: 91 KB più il font | Leggero: 148 KB gzip | Nullo |
| **Tre Chiavi (violino, violino ottava bassa, basso)** | Sì (MEI/MusicXML con `clef-octave-change`) | Sì (patch VexFlow con `8vb`) | Sì: `Clef('treble', ..., '8vb')` | Sì: `clef=treble-8`, `clef=bass` | Sì: `\clef "treble_8"`, `\clef bass` |
| **Singola Nota o Intervallo per gli Esercizi di teoria** | Sì, generando un piccolo MEI, ma 2,4 MB per una nota sono troppi | Sì, ma bisogna generare MusicXML: verboso | Ottimo: è il suo caso d'uso | Ottimo: bastano 3-4 righe di stringa ABC | No: gli Esercizi sono generati a runtime, non si possono pre-renderizzare tutti (o si limita lo spazio delle domande) |
| **Licenza per una repo pubblica** | LGPL-3.0: va bene usando il pacchetto non modificato come file separato, citando la licenza | BSD-3-Clause: nessun problema | MIT: nessun problema | MIT: nessun problema | GPL-3.0 per lo strumento; l'output (gli SVG) non è coperto dalla GPL |
| **Dati per l'audio (altezze e durate)** | Ottimo: `renderToMIDI`, `renderToTimemap`, `getMIDIValuesForElement`, `getTimeForElement` | Parziale: il cursore dà note e durate; l'audio player ufficiale è in accesso anticipato per gli sponsor GitHub | A carico nostro (ma i dati li abbiamo già, perché le note le costruiamo noi) | Ottimo: `CreateSynth`, `SynthController`, `getMidiFile`, `SynthSequence`. Soundfont di default da rete, sostituibile con `soundFontUrl` | Sì, ma a parte: LilyPond produce MIDI in build, da tenere allineato agli SVG |
| **Formato sorgente delle Letture** | MEI, MusicXML, Humdrum, ABC (senza multi-voce né terzine), PAE, CMME | Solo MusicXML | Nessuno (API JS) | ABC (testo leggibile e modificabile a mano) | LilyPond (`.ly`), il formato dei file di Mutopia |

## Note per candidato

### Verovio
- Il motore di incisione più completo dei cinque, ed è lo strumento del progetto RISM/MEI. Accetta MusicXML direttamente ([formati di input](https://book.verovio.org/toolkit-reference/input-formats.html)).
- La selezione delle battute è documentata: "Verovio only supports a single measure range" ([selezione del contenuto](https://book.verovio.org/interactive-notation/content-selection.html), [metodi del toolkit](https://book.verovio.org/toolkit-reference/toolkit-methods.html)).
- Opzioni di layout e testo: [opzioni del toolkit](https://book.verovio.org/toolkit-reference/toolkit-options.html).
- Il vero limite è il peso: il file WASM-in-JS raccomandato ([installazione JS](https://book.verovio.org/installing-or-building-from-sources/javascript-and-webassembly.html)) pesa 2,4 MB compresso. Su un telefono con rete mobile è un costo alto per disegnare quattro battute.
- Si può usare anche **in build** (Node), producendo SVG e timemap: è un'alternativa a LilyPond con MusicXML in ingresso, ma eredita il limite del reflow.
- Licenza: [LGPL-3.0](https://www.gnu.org/licenses/lgpl-3.0.html).

### OpenSheetMusicDisplay
- Pensato per MusicXML; per disegnare usa VexFlow, in un fork 1.2.93 con patch incluso nel bundle ([README](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/blob/develop/README.md), `package.json`).
- Ha a runtime sia la selezione delle battute ([IOSMDOptions](https://opensheetmusicdisplay.github.io/classdoc/interfaces/IOSMDOptions.html)) sia quella della parte, con `Instruments[i].Visible` ([wiki "Exploring the Demo"](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/wiki/Exploring-the-Demo)).
- La riproduzione audio non c'è nel pacchetto libero: il README la dà in accesso anticipato per gli sponsor GitHub. Le altezze e le durate si leggono comunque dal modello e dal cursore (wiki "Tutorial - Extracting note timing for playing").

### VexFlow diretto
- Molto leggero e ideale per una Nota o un Intervallo, ma non legge nessun formato: impaginazione e testo sono a nostro carico. Per le Letture vorrebbe dire scrivere un piccolo motore di impaginazione.
- La manutenzione è rallentata: l'ultima release è la 5.0.0 del 2025-03-05.
- La chiave di violino ottava bassa è supportata (`src/clef.ts`, annotazione `8vb`).

### abcjs
- Un solo pacchetto MIT da 148 KB gzip per disegnare e suonare ([opzioni di renderAbc](https://docs.abcjs.net/visual/render-abc-options.html), [audio](https://docs.abcjs.net/audio/synthesized-sound.html)).
- Il formato ABC è testo: una Lettura di 4-8 battute di una Voce occupa poche righe, si legge e si corregge a mano in una PR, e una Soluzione è una seconda riga `w:` sotto il Testo. Nello standard ABC 2.1 `w:` è il testo allineato alle note e i campi possono ripetersi ([standard ABC 2.1](https://abcnotation.com/wiki/abc:standard:v2.1), §3, §4.6 per le chiavi, §5 per il testo). Nel parser di abcjs ogni nota ha un array `lyric` ([`src/parse/abc_parse.js`](https://github.com/paulrosen/abcjs/blob/main/src/parse/abc_parse.js)).
- Chiave di violino ottava bassa: `clef=treble-8`, gestita in [`src/write/creation/create-clef.js`](https://github.com/paulrosen/abcjs/blob/main/src/write/creation/create-clef.js). Nelle note di release c'è una correzione recente del suono delle chiavi con ottava.
- I soundfont di default arrivano da GitHub ([paulrosen/midi-js-soundfonts](https://github.com/paulrosen/midi-js-soundfonts)). Per non dipendere da terzi conviene copiarne uno strumento (per esempio un pianoforte o un "choir aahs") su GitHub Pages e puntarci con `soundFontUrl`.
- Limite: le Letture vanno trascritte in ABC. Le Fonti (CPDL, Mutopia) danno di solito PDF, MusicXML, MuseScore o LilyPond, quindi serve un passaggio di conversione o di trascrizione a mano. Per pochi estratti curati è sostenibile, perché il lavoro di selezione lo fa già una persona (ADR-0001).

### LilyPond → SVG in build
- Incisione di qualità tipografica e zero JavaScript per disegnare. `--svg` equivale a `-dbackend=svg` ([opzioni di base](https://lilypond.org/doc/v2.26/Documentation/usage/basic-command_002dline-options-for-lilypond)).
- La GPL copre il programma, non i file che produce ([GPL FAQ, "GPLOutput"](https://www.gnu.org/licenses/gpl-faq.html#GPLOutput)).
- Contro: niente reflow vero sui telefoni; la Soluzione richiede due SVG per Lettura; gli Esercizi di teoria, generati a runtime, avrebbero bisogno comunque di un secondo renderer; serve LilyPond installato nella CI di GitHub Pages.

## Raccomandazione

> **Questa è una raccomandazione: la decisione spetta a te.**

**abcjs come unico renderer a runtime, sia per le Letture sia per gli Esercizi di teoria.**

Perché:
1. Copre tutti i criteri dell'issue con un solo pacchetto MIT e attivo (6.7.2, ottobre 2026): Testo e Soluzione come due righe `w:`, le tre Chiavi, layout `responsive`, una Nota o un Intervallo generati come stringa, e altezze e durate per il Riferimento tonale e l'Ascolto di verifica dallo stesso oggetto.
2. È il più leggero tra quelli che leggono un formato: 148 KB gzip, contro 360 KB di OSMD e 2,4 MB di Verovio.
3. L'estrazione della Voce e delle battute si sposta, come vuole l'ADR-0001, nel lavoro di preparazione della Lettura, che è già manuale. Il file ABC che ne esce è piccolo, si legge e si rivede in una PR.

Alternativa se preferisci tenere le Letture in MusicXML, il formato più comune su CPDL: **OSMD** (BSD, 360 KB, selezione di parte e battute a runtime), eventualmente con VexFlow per gli Esercizi di teoria. Per l'audio, però, le altezze e le durate andrebbero lette dal modello di OSMD e suonate con codice nostro.

Scartati come renderer principale:
- **Verovio**, per il peso su mobile, anche se resta il migliore come qualità e come strumento di conversione.
- **VexFlow diretto**, perché non legge nessun formato e la manutenzione è lenta.
- **LilyPond**, perché non fa reflow e non copre gli Esercizi generati.

## Dubbi aperti da verificare con un prototipo

- **Resa a 360 px con due righe di testo sotto il rigo.** Le Sillabe allargano le note. Bisogna vedere se `wrap` + `staffwidth` di abcjs danno a capo leggibili su un estratto reale, per esempio 8 battute di un Tenore in chiave di violino ottava bassa con testo latino.
- **Conversione dalle Fonti.** Bisogna decidere se trascrivere a mano in ABC o usare un convertitore da MusicXML (per esempio `xml2abc`, di cui non ho verificato licenza e manutenzione) e quanto ritocco serve dopo.
- **Mutazione e Sillabe cromatiche.** Sono solo testo nella riga `w:`, quindi non pongono problemi di rendering; resta da decidere se generarle in automatico o scriverle a mano (è un tema separato da questo).
- **Soundfont.** Va scelto quale timbro ospitare in proprio e quanto pesa: non l'ho misurato.
