---
revisione: { da: "nessuno, bozza di Claude", data: 2026-11-07 }
esercizi:
  - { tipo: riconosci-intervallo, chiavi: [violino, violino-ottava-bassa, basso] }
  - { tipo: rivolta-intervallo, chiavi: [violino, violino-ottava-bassa, basso] }
---

Leggendo una parte, si passa da una nota all'altra con un salto più o meno grande. Ognuno di questi passaggi è un intervallo. Riconoscerli sulla carta e a orecchio è gran parte di quello che serve per leggere a prima vista.

## Il numero

Un **intervallo** è la distanza fra due note, e si indica con un numero e una qualità. Il numero si trova contando i nomi delle note, la prima e l'ultima comprese. Da Do a Mi ci sono Do, Re, Mi: tre note, è una terza. Da Do a Sol ci sono Do, Re, Mi, Fa, Sol: è una quinta. Due note uguali formano un unisono, due Do vicini un'ottava.

Le alterazioni non cambiano il numero. Da Do a Mi♭ è sempre una terza, perché i nomi delle note sono sempre Do, Re, Mi.

Sul pentagramma il numero si vede anche senza leggere le note. Due note su righe vicine, o in spazi vicini, formano una terza. Da una riga a quella dopo la successiva, saltandone una, c'è una quinta. Gli intervalli con numero dispari vanno da riga a riga o da spazio a spazio; quelli con numero pari da riga a spazio.

```abc
X:1
L:1/2
K:C
"^5ª"C G | "^3ª"C E | "^4ª"C F |]
```

## La qualità

Lo stesso numero può corrispondere a distanze diverse: Do e Mi distano quattro semitoni, Re e Fa solo tre, eppure sono due terze. La qualità dice quale delle due è, e si trova contando i semitoni.

Unisono, quarta, quinta e ottava si chiamano giuste. Seconde, terze, seste e settime possono essere maggiori o minori, e la minore ha un semitono in meno della maggiore.

| Intervallo | Semitoni |
|---|---|
| seconda minore e maggiore | 1 e 2 |
| terza minore e maggiore | 3 e 4 |
| quarta giusta | 5 |
| quinta giusta | 7 |
| sesta minore e maggiore | 8 e 9 |
| settima minore e maggiore | 10 e 11 |
| ottava giusta | 12 |

```abc
X:2
L:1/2
K:C
"^3ª maggiore"C E | "^3ª minore"D F | "^3ª minore"C _E |]
```

C'è anche una scorciatoia. Se la nota più alta fa parte della scala maggiore della nota più bassa, l'intervallo è maggiore o giusto. Mi sta nella scala di Do maggiore, quindi Do e Mi formano una terza maggiore; Mi♭ non c'è, e Do e Mi♭ formano una terza minore.

## Quinta, terza e quarta

Conviene imparare prima tre intervalli, in quest'ordine: la quinta, la terza e la quarta. Sono quelli che reggono le melodie dei brani corali e gli accordi.

La quinta giusta è la distanza fra il 1° e il 5° grado della scala, fra tonica e dominante. Suona piena e stabile, ed è il salto che molti brani usano per partire.

La terza è la distanza fra il 1° e il 3° grado. Maggiore o minore, è la terza a decidere il modo, come hai visto nel capitolo 7. Tonica, terza e quinta insieme formano l'accordo su cui si regge una tonalità.

La quarta giusta è la distanza fra il 5° grado e la tonica sopra. È il salto tipico di un attacco in levare che arriva sulla tonica.

Gli altri intervalli si imparano dopo, spesso a partire da questi: una sesta, per esempio, è una quinta allargata di un grado.

## Il tritono

Fra la quarta giusta e la quinta giusta c'è un intervallo di sei semitoni, esattamente metà ottava: il tritono, così chiamato perché vale tre toni. In Do maggiore è la distanza fra Fa e Si.

Si scrive come quarta aumentata (Fa e Si) o come quinta diminuita (Si e Fa), a seconda dei nomi delle note. È uno degli intervalli più difficili da intonare, perché non si appoggia a nessuno dei suoni vicini.

```abc
X:3
L:1/2
K:C
"^4ª aumentata"F B | "^5ª diminuita"B f |]
```

## Aumentati e diminuiti

Il tritono è il caso più comune di una regola generale. Un intervallo con un semitono in più del maggiore o del giusto si dice aumentato; uno con un semitono in meno del minore o del giusto si dice diminuito. Da Do a Sol♯, per esempio, c'è una quinta aumentata. Nella musica corale questi intervalli, tritono a parte, si incontrano poco.

## Melodici e armonici

Un intervallo è melodico quando le due note si cantano una dopo l'altra, come nella tua parte. È armonico quando suonano insieme, come fra la tua voce e quella vicina. Il nome e la qualità si trovano allo stesso modo.

```abc
X:4
L:1/2
K:C
C G | [CG]2 |]
```

La prima battuta è una quinta melodica, la seconda la stessa quinta armonica.

## Il rivolto

Se la nota più bassa di un intervallo sale di un'ottava, le due note si scambiano di posto e l'intervallo cambia: è il suo rivolto. Da Do4 a Mi4 c'è una terza maggiore; da Mi4 a Do5 una sesta minore.

```abc
X:5
L:1/2
K:C
"^3ª maggiore"C E | "^6ª minore"E c |]
```

Il rivolto segue regole fisse:

- i numeri dell'intervallo e del suo rivolto sommano sempre 9: la terza diventa sesta, la seconda settima, la quarta quinta;
- maggiore diventa minore e minore diventa maggiore;
- giusto resta giusto;
- aumentato diventa diminuito e diminuito diventa aumentato.

Il rivolto è utile per riconoscere gli intervalli grandi. Una sesta minore che sale arriva alla stessa nota di una terza maggiore che scende, un'ottava più in alto: se senti la terza, trovi la sesta.
