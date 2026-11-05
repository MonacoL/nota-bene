# Le Letture si salvano in ABC, in una cartella per Edizione

Ogni Lettura è un piccolo file ABC: una sola Voce, solo le battute scelte, il Testo su una riga `w:`. È questo file che fa fede e si corregge a mano. Le Fonti forniscono MusicXML (CPDL) o LilyPond (Mutopia), mai ABC: la conversione, per esempio con xml2abc o con una trascrizione a mano, si fa quando si prepara la Lettura e non entra nel sito. Le Letture di uno stesso Brano stanno in una cartella `letture/<brano>/`, che corrisponde a una sola Edizione. Lì ci sono `edizione.yml`, con i dati dell'Edizione e l'elenco delle sue Letture, il file sorgente originale e un `.abc` per ogni Lettura. L'identificativo `<brano>/<voce>-<inizio>-<fine>` si assegna alla pubblicazione e poi non cambia più.

Si sceglie ABC perché abcjs (MIT, circa 148 KB gzip) disegna e suona sia le Letture sia gli Esercizi di teoria. Inoltre l'estratto di una Voce si legge e si corregge in una PR.

## Considered Options

- **MusicXML con OSMD**: niente conversione, perché la Voce e le battute si scelgono a runtime. Scartato perché OSMD pesa di più (circa 360 KB), il suo audio player è riservato agli sponsor e il MusicXML non si corregge a mano.
- **Un file autosufficiente per Lettura**, che ripete i dati dell'Edizione: scartato perché le stesse informazioni su licenza e Fonte comparirebbero in più posti.
- **Solo un link all'Edizione, senza copia del sorgente**: scartato perché le edizioni CPDL si scaricano solo a mano e possono cambiare o sparire.

## Consequences

- Nei metadati si scrive a mano solo ciò che la musica non dice: Voce, battute di origine, Prerequisiti, Mutazioni e data della modifica. Chiave, Tempo, Testo e Tonalità si ricavano dall'ABC: la Tonalità sta nel `K:` con il Modo esplicito (vedi ADR-0004).
- La nota delle modifiche, richiesta dalla CPDL License, si genera dai dati in italiano e in inglese. Un campo libero facoltativo copre le eccezioni.
- La CI blocca il deploy se uno di questi controlli fallisce:
  - lo schema di `edizione.yml`;
  - la licenza, che deve essere tra quelle accettate;
  - i Prerequisiti, che devono esistere nella scaletta;
  - gli id, che devono essere unici e corrispondere ai nomi dei file;
  - il file sorgente, che deve esserci e avere l'hash dichiarato;
  - il parsing di abcjs, che non deve dare avvisi;
  - la Voce, che deve essere una sola;
  - il numero di battute;
  - la durata di ogni Battuta;
  - il registro `letture/pubblicate.txt`, a cui gli id si aggiungono e da cui non si tolgono mai.
- La licenza si documenta com'era il giorno dell'import. In `edizione.yml` vanno la licenza come compare nella pagina, l'URL, la data di consultazione e almeno una prova: uno snapshot su archive.org oppure `licenza.pdf` nella cartella. Un'Edizione PD che non dichiara la sua fonte porta `fonte_dichiarata: no`.
- Una seconda Edizione dello stesso Brano va in una cartella `<brano>-<editore>/`. La prima non si rinomina, perché gli id pubblicati non cambiano. La CI vieta due cartelle con la stessa Fonte e lo stesso numero di Edizione.
- Gli aggiornamenti dell'Edizione sulla Fonte non si seguono: fa fede il sorgente copiato. Per adottarli si rifà l'import, aggiornando hash e data di consultazione. Correggere una Lettura non ne cambia l'id, cambia solo la data della modifica.
- Una Lettura ritirata resta nel registro e la sua pagina rimane, con un avviso e un link all'elenco, invece di un 404.
- Una Lettura può avere `da_verificare` con un motivo, quando la scelta tra cromatismo e Mutazione o i Prerequisiti vanno confermati dal maestro. Il campo non si vede sul sito.
- Il flusso di import è descritto in `docs/letture.md`.
