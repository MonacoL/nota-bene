# Audio con un solo pianoforte campionato, suonato da smplr

Il Riferimento tonale e l'Ascolto di verifica hanno lo stesso timbro, un pianoforte: lo **SplendidGrandPiano**, i cui campioni sono di pubblico dominio, suonato da **smplr** (MIT). L'attacco netto rende subito chiara l'altezza, ed è il suono con cui il maestro dà le note in prova. abcjs disegna la partitura e fornisce i tempi delle note e le chiamate per illuminarle (`TimingCallbacks`), ma non produce il suono. La scelta del timbro va sentita con il maestro Sabetta, senza bloccare il lavoro.

## Considered Options

- **Organo o voce sintetica ("aah")**: il suono sostenuto è più vicino al canto, ma i soundfont pesano 2–3,7 MB per strumento, si scaricano interi e sono CC BY o CC BY-SA. Un organo sintetizzato a oscillatori suona povero.
- **Due timbri diversi per le due funzioni**: raddoppia il peso e non aiuta il corista.
- **Il sintetizzatore di abcjs**: meno codice, ma usa soundfont General MIDI interi in formato MIDI.js, per default scaricati da un sito di terzi (contro ADR-0006).

## Consequences

- **Riferimento tonale**: l'accordo di tonica con le tre note insieme (circa 1,5 s), una pausa (circa 0,5 s) e poi la nota di partenza (circa 1,5 s). Le durate sono fisse e non dipendono dall'Andamento della Lettura. In minore l'accordo è la triade minore. La Tonalità è quella in vigore all'inizio dell'estratto (ADR-0004). La nota di partenza è la prima nota cantata, anche se l'estratto comincia con una pausa.
- **Altezza reale per ogni Voce**: il tenore sente la nota un'ottava sotto la scritta (ADR-0003), il basso la sente nel suo registro. L'accordo è in stato fondamentale, in posizione stretta, con la tonica alla prima occorrenza sotto la nota di partenza, o su di essa.
- **Ascolto di verifica**: suona all'Andamento del `Q:` della Lettura, che è obbligatorio e si sceglie all'import come velocità comoda per studiare, non per forza quella del Brano. Niente regolazione della velocità e niente conteggio nella v1.
- Un secondo tocco su un pulsante ferma il suono. Far partire una funzione ferma l'altra.
- **Campioni**: ospitati sul sito in m4a e ogg, con un solo strato dinamico, solo da C2 a C6. Ogni Lettura scarica soltanto le note che le servono, accordo compreso, tramite `notesToLoad`, e le tiene in cache con `CacheStorage`. La CI blocca il deploy se una Lettura richiede più di 1 MB di campioni o se l'insieme dei campioni supera i 10 MB.
- **Campioni tagliati a 5 s**, senza ricodificarli, per stare sotto 1 MB per Lettura. Di conseguenza ogni nota suona al massimo 4,5 s più il rilascio, anche se è legata e anche se il `Q:` la vorrebbe più lunga.
- **Nomi dei file**: vanno da `mf-b0` a `mf-b4` secondo la numerazione di smplr, che chiama C3 il Do centrale, ma coprono da C2 a C6 (Do centrale = C4).
- **Cache**: la cache si chiama `nota-bene-campioni-v1`. Se un campione cambia si cambia il nome della cache (`-v2`), altrimenti chi ha già visitato il sito continua a sentire quello vecchio.
- **Licenze**: i campioni e smplr tengono la loro licenza accanto ai campioni, in `public/audio/pianoforte/`, così si pubblica con il sito (ADR-0005).
- **iOS**: all'inizio del gestore del pulsante, prima di ogni `await`, si imposta `navigator.audioSession.type = "playback"` (se esiste) e si chiama `ctx.resume()`. Lo stesso vale per il ritorno dallo stato `interrupted`. Se i campioni non arrivano, si ripiega su un oscillatore a triangolo. Va provato su un iPhone vero (vedi [Audio nel browser per Riferimento tonale e Ascolto di verifica](https://github.com/MonacoL/nota-bene/issues/4)).
