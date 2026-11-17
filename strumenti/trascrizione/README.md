# trascrizione

Trascrive in testo le registrazioni delle lezioni con il maestro Sabetta, da cui nascono Capitoli, Esercizi e Percorsi. Serve solo a chi prepara i contenuti: il sito e la CI non lo eseguono.

Le registrazioni e le trascrizioni stanno in `registrazioni/<data>/`, fuori da git: sono materiale privato e la repo è pubblica. Tutto gira in locale, niente viene inviato fuori; al primo uso si scarica il modello Whisper `medium`.

Codice di Nota Bene, con la licenza MIT della repo. Richiede [uv](https://docs.astral.sh/uv/) e `ffmpeg` nel PATH.

## Comando

```sh
cd strumenti/trascrizione
uv run trascrivi.py ../../registrazioni/<data>
```

Per ogni file audio scrive accanto un `.txt` con una riga per segmento, `[mm:ss] testo`, e salta quelli già trascritti. Un'ora di audio richiede circa mezz'ora su una CPU a 16 core. Le trascrizioni non distinguono chi parla e sbagliano spesso i nomi delle note (do, re, la sono anche parole comuni): ogni passaggio che conta va riascoltato.
