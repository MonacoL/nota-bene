# Inglese americano, con il nome britannico la prima volta, e lessico nel glossario

La versione inglese usa l'inglese americano, nella grafia e nei termini musicali: whole/half/quarter note, measure, half step/whole step. Quando un termine compare per la prima volta (Capitoli 1 e 3) si dà anche il nome britannico tra parentesi, per esempio "quarter note (UK: crotchet)". Per un principiante i nomi americani si capiscono da soli, perché dicono la frazione. Quelli britannici (crotchet, minim) somigliano di più ai nomi italiani ma sono opachi.

Il nome inglese di ogni termine sta in `GLOSSARY.md`, nella riga `_In inglese_`. È l'unica fonte per le traduzioni e per i dizionari dell'interfaccia (`src/i18n/en.ts`). La CI non controlla le parole: il lessico è la lista di controllo di chi traduce e di chi rivede. Alcune scelte sono controintuitive e vanno rispettate:

- **Tempo** (l'indicazione 3/4) diventa **Time signature**, e **Andamento** diventa **Tempo**: in inglese "tempo" è la velocità;
- **Contralto** diventa **Alto**;
- la chiave di **violino ottava bassa** diventa **octave treble clef**, non "tenor clef", che in inglese è la chiave di Do sulla 4ª riga;
- le Note si scrivono con le lettere e l'ottava (Do4 → C4), mentre le Sillabe restano DO RE MI FA SOL LA TI. Sulla pagina inglese, quindi, Nota e Sillaba si distinguono a colpo d'occhio, e l'Esercizio "nomina la Nota" ha i pulsanti C D E F G A B;
- **Mutazione** diventa **Do shift**, non "mutation", che rimanda alla solmisazione per esacordi;
- titoli dei Brani, Testo cantato, nomi di compositori ed editori e nomi delle Fonti non si traducono.

## Considered Options

- **Inglese britannico** (crotchet, bar, tone/semitone): più vicino all'Europa e ai nomi italiani, ma più difficile per chi parte da zero.
- **Controllo in CI delle parole da evitare**: scartato perché parole come "tempo" e "mode" a volte sono giuste e a volte no, e i falsi allarmi sarebbero continui.
- **Lessico in un file separato**: scartato perché il nome inglese di un concetto fa parte del linguaggio del dominio, e due file si disallineerebbero.
