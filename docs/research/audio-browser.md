# Audio nel browser per Riferimento tonale e Ascolto di verifica

Ricerca per l'issue [#4](https://github.com/MonacoL/nota-bene/issues/4). Dati raccolti il 2026-11-05 da fonti primarie (MDN, MDN browser-compat-data 8.1.8, WebKit Bugzilla, registro npm, repository e README delle librerie e dei campioni). Le dimensioni dei file sono misurate scaricandoli quel giorno.

## Domanda

Come produciamo nel browser, senza backend, l'audio del **Riferimento tonale** (tonica o accordo più la nota di partenza) e dell'**Ascolto di verifica** (esecuzione dell'estratto di una Lettura), su telefono prima di tutto?

Criteri dell'issue: funzionamento su iOS Safari e Android Chrome (sblocco con un gesto, modalità silenziosa, latenza); timbro adatto al canto e peso dei campioni; tempo e durate corretti dai dati della partitura; licenze.

## Sintesi

- Il problema vero non è la libreria, è iOS: l'audio parte solo da un gesto, e **di default la Web Audio API su iOS è muta con l'interruttore silenzioso**. Si risolve con `navigator.audioSession.type = "playback"` (Safari/iOS 16.4+), con il vecchio trucco dell'elemento `<audio>` silenzioso come riserva. Vale per qualunque candidato, perché tutti poggiano sulla Web Audio API.
- Per il timbro conviene un **pianoforte campionato** (è lo strumento con cui il maestro dà le note). I campioni Splendid Grand Piano sono di pubblico dominio e pesano 50–120 KB per nota; caricando solo le note della Lettura si resta sotto 1 MB.
- **Raccomandazione** (sezione finale): `smplr` 1.1.0 con `SplendidGrandPiano` e campioni ospitati sul nostro GitHub Pages; tempi calcolati dai dati della Lettura e programmati sull'orologio dell'`AudioContext`; oscillatore puro come riserva se i campioni non arrivano.

## Vincoli comuni a tutti i candidati

Tutti i candidati (anche Tone.js, smplr, abcjs) sono strati sopra la Web Audio API, quindi questi vincoli valgono per tutti e vanno gestiti nel nostro codice.

### Sblocco con un gesto

- Un `AudioContext` creato fuori da un gesto dell'utente nasce `suspended` e va ripreso con `resume()` dentro un gestore di evento (di solito `click`); se è creato dentro un `click` nasce `running`. MDN, [Web Audio API best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices); Chrome, [Autoplay policy](https://developer.chrome.com/blog/autoplay).
- Tone.js lo dice esplicitamente: niente suona finché `Tone.start()` non viene chiamato da un evento utente, e programmare note prima che il contesto sia `running` dà silenzio o tempi sbagliati ([README Tone.js](https://github.com/Tonejs/Tone.js#starting-audio)).
- Il pulsante "Riferimento tonale" o "Ascolto di verifica" è già un gesto: basta chiamare `resume()` **subito, in modo sincrono, all'inizio del gestore**, prima di qualunque `await` (caricamento campioni compreso). Questo ordine è una scelta prudente nostra, non una regola citata: evita di perdere l'attivazione del gesto durante il download.
- Su iOS il contesto può finire nello stato `interrupted` (telefonata, altra app che prende l'audio). Lo stato `interrupted` è supportato da Safari iOS dalla 9 e da Chrome dalla 136 ([BCD `BaseAudioContext.state.interrupted`](https://github.com/mdn/browser-compat-data); [spec](https://webaudio.github.io/web-audio-api/#dom-audiocontextstate-interrupted)). La documentazione di abcjs avverte lo stesso: su iOS il contesto può essere `suspended` o `interrupted` e richiedere un nuovo gesto ([abcjs, synthesized sound](https://docs.abcjs.net/audio/synthesized-sound.html)). A ogni pressione del pulsante va quindi controllato lo stato e ripreso se serve.

### Interruttore silenzioso su iOS

- Di default la Web Audio API su iOS usa una sessione audio di tipo *ambient*: se il telefono è in silenzioso, non si sente nulla. Jean-Yves Avenard (WebKit): «By default the type is `ambient` and so audio will be muted if the phone is muted» ([WebKit bug 237322](https://bugs.webkit.org/show_bug.cgi?id=237322)). Gli elementi `<audio>`/`<video>` invece suonano anche in silenzioso.
- Soluzione ufficiale: `navigator.audioSession.type = "playback"`. Suggerita da un ingegnere WebKit in [WebKit bug 251532](https://bugs.webkit.org/show_bug.cgi?id=251532) («should help for silent mode at least») e confermata da chi ha segnalato il bug. Supporto: Safari e Safari iOS 16.4+, non Chrome né Android ([BCD `AudioSession.type`](https://developer.mozilla.org/en-US/docs/Web/API/AudioSession/type); spec [W3C Audio Session](https://w3c.github.io/audio-session/)). MDN la marca come sperimentale.
- Effetto collaterale: `playback` è un tipo esclusivo che «will pause other playback audio on the device» ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/AudioSession/type)). Se il corista ascolta una registrazione in un'altra app, premere il pulsante la mette in pausa. Per un pulsante su richiesta è accettabile, anzi coerente.
- Riserva per iOS precedenti alla 16.4: far suonare un breve `<audio>` silenzioso nel gesto, prima di creare l'`AudioContext`. È il metodo di [unmute-ios-audio](https://github.com/feross/unmute-ios-audio) (MIT, fermo dal 2022) e del bug 237322. Controindicazione documentata nel bug: compaiono i controlli multimediali sulla schermata di blocco. Secondo noi non vale la pena: 16.4 è del 2023, e basta fare feature detection su `navigator.audioSession`.
- Tutti i browser su iPhone (Chrome per iOS compreso) usano il motore WebKit, quindi "iOS Safari" vale in pratica per tutto iOS. (Le eccezioni con altri motori ammesse nell'UE non le abbiamo verificate.)

### Android Chrome

- Non esiste un equivalente dell'interruttore silenzioso per la Web Audio API: l'audio segue il volume multimediale. Vale la stessa regola del gesto ([Autoplay policy](https://developer.chrome.com/blog/autoplay)).
- `navigator.audioSession` non esiste su Chrome ([BCD](https://developer.mozilla.org/en-US/docs/Web/API/AudioSession/type)): con la feature detection non serve un ramo dedicato.

### Latenza e precisione dei tempi

- Per noi la latenza tra tocco e suono conta poco: non c'è interazione in tempo reale (non suoniamo mentre l'utente canta), si preme un pulsante e si ascolta. Conta invece che le note dell'Ascolto di verifica abbiano tempi e durate regolari.
- Il metodo giusto è programmare ogni nota sull'orologio dell'`AudioContext` (`start(when)`/`stop(when)`), non con `setTimeout`: i timer del thread principale «can easily be skewed by tens of milliseconds or more», mentre l'audio programmato suona «at exactly the times they were told to happen» (Chris Wilson, [Scheduling web audio with precision](https://web.dev/articles/audio-scheduling)). Un estratto di poche battute si può programmare tutto in una volta all'avvio, senza lo scheduler a finestra mobile descritto nell'articolo.
- `AudioContext.baseLatency` esiste su Safari iOS 14.5+ e Chrome Android 58+, `outputLatency` su Safari iOS 18.4+ e Chrome Android 102+ (BCD). Non abbiamo trovato misure ufficiali della latenza su telefoni reali: se servisse, si misura nel prototipo con queste proprietà.

## Candidati

Versioni e date dal registro npm al 2026-11-05.

| Candidato | Versione | Ultima attività | Licenza codice | Peso libreria (gzip, misurato) | Timbri |
|---|---|---|---|---|---|
| Web Audio API pura (oscillatori) | n/a | standard | n/a | 0 (qualche decina di righe nostre) | onde sintetiche (sinusoide, triangolo…) |
| [Tone.js](https://github.com/Tonejs/Tone.js) | 15.1.22 stabile (27-04-2025); 15.5.66 `next` (31-10-2026) | commit il 31-10-2026 | MIT | ~80 KB (`build/Tone.js`) | sintetizzatori; `Tone.Sampler` con campioni nostri |
| [smplr](https://github.com/danigb/smplr) | 1.1.0 (28-09-2026) | commit il 26-10-2026 | MIT (in `package.json` e README) | ~38 KB (`dist/index.mjs`) | pianoforte Splendid Grand Piano, soundfont General MIDI, VCSL, SF2 |
| [soundfont-player](https://github.com/danigb/soundfont-player) | 0.12.0 (27-01-2020) | **archiviato** | MIT | n/a | soundfont General MIDI |
| [abcjs](https://github.com/paulrosen/abcjs) (synth) | 6.7.2 (16-10-2026) | attivo | MIT | libreria di rendering completa | soundfont General MIDI |
| [Verovio](https://book.verovio.org/toolkit-reference/output-formats.html) `renderToMIDI()` | 6.4.1 (03-11-2026) | attivo | LGPL-3.0 | libreria di rendering (WASM) | nessuno: produce solo un file MIDI |
| OpenSheetMusicDisplay | 2.2.1 (12-10-2026) | attivo | BSD-3-Clause | libreria di rendering | lettore audio ufficiale riservato agli sponsor; [osmd-audio-player](https://www.npmjs.com/package/osmd-audio-player) non più sviluppato |
| [WebAudioFont](https://github.com/surikov/webaudiofont) | 3.0.4 (2022) | fermo | **GPL-3.0** | n/a | soundfont |
| [spessasynth_lib](https://github.com/spessasus/spessasynth_lib) / [js-synthesizer](https://github.com/jet2jet/js-synthesizer) | 4.4.5 / 1.13.0 | attivi | Apache-2.0 / BSD-3 | ~27 KB + file SF2 | sintetizzatore SF2/MIDI completo |

### Web Audio API pura

- `OscillatorNode` + `GainNode` con un inviluppo (attacco e rilascio brevi per evitare click). Peso zero, nessun download, funziona offline e subito.
- Timbro: sinusoide o triangolo con inviluppo. Altezza pulita e chiara ma "elettronica". Per un Riferimento tonale è sufficiente (è quello che fanno molti diapason elettronici); per l'Ascolto di verifica di una frase è meno gradevole del pianoforte.
- La precisione dei tempi è la stessa delle librerie: le note si programmano sull'orologio del contesto.
- Ruolo naturale: **riserva** quando i campioni non sono ancora arrivati o non si caricano.

### Tone.js

- Framework completo (Transport, sintetizzatori, effetti, `Tone.Sampler` che trasporta i campioni per coprire le note mancanti). MDN lo indica come buona scelta per suoni e strumenti ([best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)).
- Gestisce `Tone.start()` ma **non** l'interruttore silenzioso: `audioSession` resta a carico nostro.
- Non ha campioni propri: con `Tone.Sampler` gli URL dei file li forniamo noi.
- Manutenzione: repository attivo, ma l'ultima versione stabile su npm (`latest`) è di aprile 2025; da allora escono solo prerelease `next` (15.5.x).
- Per due funzioni (accordo + nota, sequenza di poche note) il Transport e il resto sono più di quanto serve. Dipende da `standardized-audio-context`.

### smplr (successore di soundfont-player)

- Scritto dallo stesso autore di soundfont-player come sua «modern replacement» ([README smplr](https://github.com/danigb/smplr#soundfont)); soundfont-player è archiviato, quindi è escluso.
- Strumenti pronti, caricati da URL senza server: `SplendidGrandPiano`, `Soundfont` (General MIDI da [midi-js-soundfonts](https://github.com/gleitz/midi-js-soundfonts)), `Versilian` (VCSL), `Soundfont2`, `Sampler` con campioni propri.
- `notesToLoad` (dalla 1.1.0) carica solo i campioni delle note richieste; con `fallback: "nearest"` (predefinito per il pianoforte) le altre note si ottengono trasportando il campione più vicino ([CHANGELOG 1.1.0](https://github.com/danigb/smplr/blob/main/CHANGELOG.md)).
- Programmazione: `start({ note, time, duration })` con `time` sull'orologio del contesto, più un `Sequencer` «with sample-accurate timing». `baseUrl` permette di ospitare i campioni altrove, `CacheStorage` li tiene in cache (solo su https, quindi va bene su GitHub Pages).
- Attenzione a Safari: il codice salta di proposito OGG su Safari perché «Safari's decodeAudioData fails on OGG even though canPlayType returns "maybe"» e usa m4a ([load-audio.ts](https://github.com/danigb/smplr/blob/main/src/smplr/load-audio.ts)). Per questo i campioni vanno pubblicati in **entrambi** i formati.
- Avvertenza dell'autore: i campioni predefiniti stanno su GitHub Pages, che limita le richieste al secondo. È un motivo in più per ospitare noi i campioni.
- Licenza: MIT dichiarata in `package.json` e in fondo al README, ma nel repository **non c'è un file LICENSE**.

### Output MIDI della libreria di rendering

- **Verovio**: `renderToMIDI()` restituisce un file MIDI in base64. La documentazione dice che l'output MIDI è «basic» e che, non essendoci MIDI standard nel browser, «an additional player will be required» ([Verovio book](https://book.verovio.org/toolkit-reference/output-formats.html)). Servirebbe comunque un sintetizzatore (smplr, Tone.js, spessasynth), più un parser MIDI.
- **abcjs**: ha un sintetizzatore suo con soundfont General MIDI (default da [paulrosen/midi-js-soundfonts](https://github.com/paulrosen/midi-js-soundfonts)), `playEvent` per note singole e accordi, avvisi espliciti su iOS ([docs](https://docs.abcjs.net/audio/synthesized-sound.html)). Conviene solo se l'issue #2 sceglie abcjs per il rendering.
- **OpenSheetMusicDisplay**: il lettore audio ufficiale è riservato agli sponsor; l'alternativa della comunità non è più sviluppata.
- In generale: legarsi all'audio della libreria di rendering accoppia due decisioni (#2 e #4). E un passaggio via MIDI non serve: i dati della Lettura (Note, durate, tempo) li abbiamo già, e programmarli direttamente è più semplice che produrre e poi rileggere un file MIDI. Questo dipende dal formato deciso in #10.

### Altri

- **WebAudioFont**: GPL-3.0 e fermo dal 2022. La licenza è un rischio finché la licenza della repo (#12) non è decisa.
- **spessasynth_lib / js-synthesizer**: sintetizzatori SF2/MIDI completi (FluidSynth in WASM nel secondo caso). Sono pensati per riprodurre file MIDI interi e richiedono un file SF2 intero: troppo per due pulsanti.

## Timbro e peso dei campioni

| Opzione | Fonte campioni | Licenza campioni | Peso (misurato) | Commento |
|---|---|---|---|---|
| Oscillatore (sinusoide/triangolo) | nessuna | n/a | 0 | altezza chiarissima, timbro sintetico |
| Pianoforte Splendid Grand Piano (via smplr) | [sfzinstruments/SplendidGrandPiano](https://github.com/sfzinstruments/SplendidGrandPiano), ospitato da smpldsnds | **pubblico dominio** («Public Domain samples by AKAI», README) | 35–120 KB per campione (m4a/ogg); 303 campioni in 5 dinamiche (circa 20–25 MB in tutto) | timbro di riferimento in sala prove; un solo strato dinamico sull'estensione corale ≈ 2–3 MB; solo le note di una Lettura < 1 MB |
| General MIDI `acoustic_grand_piano` | midi-js-soundfonts, kit FluidR3_GM / MusyngKite | FluidR3_GM: CC BY 3.0; MusyngKite: CC BY-SA 3.0 ([README](https://github.com/gleitz/midi-js-soundfonts)) | 2,3–2,6 MB per strumento (1,4–1,8 MB compressi), **scaricato sempre intero** | `notesToLoad` riduce solo la decodifica, non il download ([soundfont.ts](https://github.com/danigb/smplr/blob/main/src/soundfont/soundfont.ts)) |
| General MIDI `choir_aahs` / `voice_oohs` ("voce sintetica") | idem | idem | 2,8–3,7 MB per strumento (1,9–2,6 MB compressi) | più vicino al canto, ma attacco lento e intonazione meno netta (valutazione da verificare all'ascolto) |
| General MIDI `church_organ` / `reed_organ` | idem | idem | 2,8–3,4 MB (1,8–2,4 MB compressi) | suono tenuto, adatto a un accordo lungo |
| VCSL (via `Versilian`) | [sgossner/VCSL](https://github.com/sgossner/VCSL) | CC0-1.0 | non misurato | il supporto in smplr è parziale: «Some instruments may sound incorrect» |

Note:
- Per **MusyngKite** (CC BY-SA) e **FluidR3_GM** (CC BY) basta l'attribuzione nella pagina dei crediti; la ShareAlike riguarda i campioni, non il nostro codice. Il pianoforte Splendid Grand Piano evita del tutto il problema.
- Il pianoforte è anche quello che i coristi sentono dal maestro, coerente con la definizione di Riferimento tonale nel glossario («come il La dato dal maestro»).

## Confronto con i criteri

| Criterio | Web Audio pura | Tone.js | smplr | Audio della libreria di rendering |
|---|---|---|---|---|
| Sblocco con gesto | a mano (`resume()`) | `Tone.start()` | a mano (`resume()` sul contesto che le passiamo) | a carico della libreria (abcjs ha `prime()`), da verificare |
| Interruttore silenzioso iOS | `audioSession`, a mano | a mano | a mano | a mano |
| Tempo e durate | `start/stop(when)`, preciso | Transport, preciso | `time`/`duration` o `Sequencer`, preciso | dipende dal MIDI prodotto ("basic" per Verovio) |
| Timbro | solo sintetico | sintetico o campioni nostri | pianoforte PD pronto, GM, VCSL | GM (abcjs), nessuno (Verovio) |
| Peso | 0 | ~80 KB + campioni | ~38 KB + campioni (< 1 MB per Lettura) | legato alla libreria scelta |
| Licenze | n/a | MIT | MIT (senza file LICENSE) + PD | MIT / LGPL / BSD |
| Manutenzione | standard | attiva, stabile ferma ad apr. 2025 | attiva, 1.x | attiva |
| Accoppiamento con #2 | nessuno | nessuno | nessuno | forte |

## Raccomandazione

> **Raccomandazione (proposta, da confermare in un ADR):**
>
> 1. **Libreria: `smplr` 1.1.x** con lo strumento `SplendidGrandPiano` per Riferimento tonale e Ascolto di verifica. Leggera, mantenuta, pianoforte di pubblico dominio, `notesToLoad` per scaricare solo le note della Lettura, gestisce già il problema OGG su Safari.
> 2. **Campioni ospitati da noi** sul GitHub Pages di Nota Bene (`baseUrl`), in m4a **e** ogg, limitati a uno strato dinamico (MF o MP) sull'estensione delle quattro Voci, e tenuti in cache con `CacheStorage`. Niente dipendenza dai server smpldsnds/gleitz, che hanno limiti di richieste.
> 3. **Sblocco**: in ogni gestore dei due pulsanti chiamare per prima cosa, in modo sincrono, `navigator.audioSession.type = "playback"` (se esiste) e `ctx.resume()` (anche dallo stato `interrupted`); solo dopo caricare i campioni.
> 4. **Tempi**: calcolare inizio e durata in secondi di ogni Nota dai dati della Lettura (tempo e durate, formato da #10) e programmarle tutte sull'orologio del contesto. Non usare l'output MIDI della libreria di rendering: le due decisioni (#2 e #4) restano indipendenti.
> 5. **Riserva**: se i campioni non si caricano entro pochi secondi, suonare con un oscillatore a triangolo con inviluppo (Web Audio pura, zero peso).
> 6. **Riferimento tonale**: accordo della tonica arpeggiato o tenuto, poi la nota di partenza; durate e volumi sono da decidere nella progettazione dell'interfaccia (#8).
>
> Tone.js resta l'alternativa se servissero funzioni da sequencer (metronomo, loop, cambi di tempo). Oggi non servono, e la versione stabile ferma ad aprile 2025 è un piccolo segnale contrario.

## Dubbi aperti

- **Da provare su un iPhone vero**: l'effetto di `audioSession.type = "playback"` con l'interruttore silenzioso sulle versioni iOS attuali, il ritorno da `interrupted` e il tempo di decodifica dei campioni m4a. Le fonti sono bug WebKit e MDN, non test nostri.
- **Timbro**: pianoforte o organo/voce per il Riferimento tonale è una scelta pedagogica da confermare con il maestro Sabetta. smplr può caricare anche i GM `choir_aahs`/`church_organ` (circa 2–3 MB ciascuno).
- **smplr senza file LICENSE**: la licenza MIT è dichiarata in `package.json` e nel README; si può chiedere all'autore di aggiungere il file.
- **Licenza di FluidR3_GM**: il README di midi-js-soundfonts dice CC BY 3.0; altre distribuzioni del soundfont originale potrebbero dichiarare una licenza diversa. Non serve se si usa il pianoforte Splendid Grand Piano.
- **Dipendenza da #10** (formato di una Lettura su disco): servono tempo e durate in forma leggibile per programmare l'Ascolto di verifica, comprese legature e corone.
- **Dipendenza da #12** (licenza della repo): i campioni di pubblico dominio e le librerie MIT non danno vincoli; WebAudioFont (GPL) è escluso anche per questo.

## Fonti

- MDN, Web Audio API best practices: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices
- MDN, Autoplay guide: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay
- MDN, AudioSession.type: https://developer.mozilla.org/en-US/docs/Web/API/AudioSession/type
- W3C Audio Session (editor's draft): https://w3c.github.io/audio-session/
- Web Audio API, stato `interrupted`: https://webaudio.github.io/web-audio-api/#dom-audiocontextstate-interrupted
- MDN browser-compat-data 8.1.8: https://github.com/mdn/browser-compat-data
- Chrome, Autoplay policy: https://developer.chrome.com/blog/autoplay
- Chris Wilson, Scheduling web audio with precision: https://web.dev/articles/audio-scheduling
- WebKit bug 237322 (Web Audio muta con suoneria disattivata): https://bugs.webkit.org/show_bug.cgi?id=237322
- WebKit bug 251532 (iOS 16.3, Web Audio e interruttore silenzioso): https://bugs.webkit.org/show_bug.cgi?id=251532
- Tone.js: https://github.com/Tonejs/Tone.js · npm: https://www.npmjs.com/package/tone
- smplr: https://github.com/danigb/smplr · CHANGELOG: https://github.com/danigb/smplr/blob/main/CHANGELOG.md · load-audio.ts: https://github.com/danigb/smplr/blob/main/src/smplr/load-audio.ts · soundfont.ts: https://github.com/danigb/smplr/blob/main/src/soundfont/soundfont.ts
- soundfont-player (archiviato): https://github.com/danigb/soundfont-player
- midi-js-soundfonts (licenze FluidR3_GM, MusyngKite, FatBoy): https://github.com/gleitz/midi-js-soundfonts
- Splendid Grand Piano: https://github.com/sfzinstruments/SplendidGrandPiano
- VCSL: https://github.com/sgossner/VCSL
- unmute-ios-audio: https://github.com/feross/unmute-ios-audio
- abcjs, synthesized sound: https://docs.abcjs.net/audio/synthesized-sound.html
- Verovio, output formats: https://book.verovio.org/toolkit-reference/output-formats.html
- osmd-audio-player: https://www.npmjs.com/package/osmd-audio-player
- WebAudioFont: https://github.com/surikov/webaudiofont
- spessasynth_lib: https://github.com/spessasus/spessasynth_lib · js-synthesizer: https://github.com/jet2jet/js-synthesizer
