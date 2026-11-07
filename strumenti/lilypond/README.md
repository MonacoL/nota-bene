# ly2abc

Dall'Edizione LilyPond di un Brano (di solito Mutopia) all'ABC di una Lettura. Lo usa `npm run nuova-lettura` quando il sorgente dell'Edizione è un `.ly`; la guida è in `docs/letture.md`, sezione 3. Serve solo a chi importa una Lettura: il sito e la CI non lo eseguono.

Codice di Nota Bene, con la licenza MIT della repo. Richiede Python 3 e LilyPond 2.24 o successivo (provato con la 2.26.0): il comando `lilypond` nel PATH, oppure la variabile `LILYPOND` con il percorso. Il pacchetto per Linux, dalle release di <https://gitlab.com/lilypond/lilypond>, si estrae in una cartella qualsiasi senza installarlo.

## Come funziona

1. `ly2abc.py` copia il `.ly` in una cartella temporanea. Con `convert-ly` lo porta alla sintassi della versione di LilyPond in uso, perché i file di Mutopia sono spesso per la 2.18. Poi dà un nome `testo:<voce>` ai Testi che non ne hanno.
2. LilyPond legge la copia con `eventi.ly` incluso prima del brano, senza disegnare niente (`-dbackend=null`). L'event listener scrive in un TSV ogni nota e pausa di ogni Voce, con Battuta, posizione, altezza, durata e legatura di valore. Scrive anche Armatura, Tempo, Andamento e le sillabe dei Testi con il loro istante. Il formato è nell'intestazione di `eventi.ly`.
3. Dal TSV `ly2abc.py` costruisce l'ABC di una Voce in un intervallo di Battute: levare e taglio dell'ultima Battuta, alterazioni secondo Armatura e Battuta, il tenore un'ottava sopra (ADR-0003), la riga `w:` con un `|` per Battuta. Il Modo resta `DA COMPILARE`, come con xml2abc.

## Comandi

```sh
python3 strumenti/lilypond/ly2abc.py voci   letture/<brano>/<file>.ly             # Voci, Battute, Testi
python3 strumenti/lilypond/ly2abc.py mostra letture/<brano>/<file>.ly Sopran 1-12 # note Battuta per Battuta
python3 strumenti/lilypond/ly2abc.py estrai letture/<brano>/<file>.ly --voce Sopran --battute 9-16 \
  --levare 1/4 --taglia 1/4 --testo verseone --clef treble                       # l'ABC su stdout
```

Le Battute sono quelle di LilyPond, e il levare iniziale del Brano è la Battuta 0, come nel catalogo.

## Verifica

Le Letture Mutopia del catalogo iniziale sono state estratte così. Dopo una modifica a questi file, `python3 strumenti/lilypond/verifica.py` ne riestrae dieci e controlla che note e Testo siano identici a quelli del catalogo. Le eccezioni sono le Letture corrette a mano dopo l'estrazione, come il Testo di Alas!, e restano fuori dall'elenco.
