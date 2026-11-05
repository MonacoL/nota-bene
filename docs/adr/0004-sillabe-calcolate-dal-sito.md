# Le Sillabe le calcola il sito, non si scrivono nei file

La Soluzione di una Lettura non si salva. Il sito la calcola da tre cose: le Note dell'ABC così come sono scritte, la Tonalità del `K:` (con il Modo esplicito, LA come Tonica in minore secondo l'ADR-0002) e le Mutazioni annotate a mano in `edizione.yml` (battuta di origine, posizione della nota, nuova Tonalità). È la stessa funzione che genera l'Esercizio di teoria "Nomina la sillaba". Per le Sillabe esiste così una sola fonte di verità.

Se un'alterazione sia un cromatismo o l'inizio di una modulazione non lo decide nessuna analisi automatica: lo decide chi prepara la Lettura, se serve sentito il maestro. Per default una Nota alterata è una Sillaba cromatica.

## Considered Options

- **Soluzione scritta nell'ABC come seconda riga `w:`**, generata da uno script e corretta a mano: scartata perché a ogni modifica delle note va rigenerata e può smettere di coincidere con la musica.
- **Mutazioni come cambio `[K:...]` nell'ABC**: scartato perché abcjs disegnerebbe una nuova Armatura, mentre in partitura di solito l'Armatura non cambia.
- **Riconoscimento automatico delle modulazioni**: scartato perché sbaglia proprio nei casi ambigui.

## Consequences

- Ogni nota attaccata ha una Sillaba. Una nota legata alla precedente con una legatura di valore non ne prende una nuova, e le pause non ne hanno. Dalla nota della Mutazione in poi si usano le Sillabe della nuova Tonalità.
- Se una Nota non ha una Sillaba prevista (Mi# o Dob in Do, doppie alterazioni), la CI fallisce. Si risolve scrivendo la nota in modo enarmonico nell'ABC, annotando una Mutazione o cambiando estratto. Non si corregge mai a mano la singola Sillaba.
- Un estratto che comincia già modulato ha una Mutazione sulla prima nota. Il Riferimento tonale usa la Tonalità in vigore all'inizio dell'estratto, non quella del `K:`.
