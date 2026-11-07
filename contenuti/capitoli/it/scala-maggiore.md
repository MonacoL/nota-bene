---
revisione: { da: "nessuno, bozza di Claude", data: 2026-11-07 }
esercizi:
  - { tipo: costruisci-la-scala, forme: [maggiore] }
  - { tipo: trova-la-tonalita, modi: [maggiore] }
---

Quasi tutti i brani che canterai usano un gruppo preciso di note, e fra queste ce n'è una che fa da centro. Questo gruppo di note, messo in ordine, è una scala. Saperla costruire vuol dire capire perché in un brano ci sono certi diesis o certi bemolle, e non altri.

## La scala e i suoi gradi

Una scala parte da una nota, la **tonica**, e sale una nota alla volta fino alla tonica un'ottava sopra. Ogni nome di nota compare una sola volta: dopo il Do viene un Re, mai un Do♯. Le note della scala si chiamano gradi e si numerano dalla tonica: 1° grado, 2° grado, fino al 7°, e l'8° è di nuovo la tonica.

Alcuni gradi hanno anche un nome. Il 1° è la tonica, il 5° la dominante, il 7° la sensibile, perché sta subito sotto la tonica e la melodia tende a salire verso di lei.

```abc
X:1
L:1/4
K:C
C D E F | G A B c |]
```

Questa è la scala di Do maggiore, da Do4 a Do5: tutti tasti bianchi, nessuna alterazione.

## Toni e semitoni in fila

Una scala maggiore non è una fila qualsiasi di note: le distanze fra un grado e il successivo seguono sempre lo stesso ordine. Chiamando T il tono e S il semitono, l'ordine è T T S T T T S.

Nella scala di Do maggiore lo si vede sulla tastiera. Do e Re distano un tono, Re e Mi un tono, Mi e Fa un semitono, poi tre toni (Fa Sol, Sol La, La Si) e infine un semitono fra Si e Do. I due semitoni cadono fra il 3° e il 4° grado e fra il 7° e l'8°.

## Scale maggiori su altre note

Se la scala parte da un'altra nota, l'ordine T T S T T T S resta lo stesso, e per rispettarlo servono delle alterazioni. Prova con il Re: Re e Mi distano un tono, giusto. Fra Mi e il grado successivo serve un tono, ma Mi e Fa distano un semitono; il 3° grado allora diventa Fa♯, e Fa♯ e Sol distano il semitono che serve. Allo stesso modo, alla fine, il 7° grado diventa Do♯.

```abc
X:2
L:1/4
K:C
D E ^F G | A B ^c d |]
```

Re maggiore ha quindi due diesis, Fa♯ e Do♯. Partendo dal Fa, invece, fra il 3° e il 4° grado (La e Si) serve un semitono, e il Si diventa Si♭. Si scrive Si♭ e non La♯, anche se sulla tastiera è lo stesso tasto, perché in una scala ogni nome compare una volta e il La c'è già.

## Tonalità e armatura

Un brano costruito sulla scala di Re maggiore è **in Re maggiore**: la tonalità è la coppia fra la tonica (Re) e il modo (maggiore). Riscrivere Fa♯ e Do♯ davanti a ogni Fa e ogni Do sarebbe scomodo. Si scrivono allora una volta sola, all'inizio di ogni rigo, subito dopo la chiave: è l'armatura.

```abc
X:3
L:1/4
K:D
D E F G | A B c d |]
```

Le note sono le stesse dell'esempio precedente, ma i due diesis stanno nell'armatura. Un diesis in armatura vale per tutte le note con quel nome, in ogni ottava e per tutto il brano, finché l'armatura non cambia.

## L'ordine dei diesis e dei bemolle

I diesis compaiono in armatura sempre nello stesso ordine: Fa, Do, Sol, Re, La, Mi, Si. Una tonalità con due diesis ha Fa♯ e Do♯, una con tre aggiunge il Sol♯, e così via. I bemolle hanno l'ordine opposto: Si, Mi, La, Re, Sol, Do, Fa.

```abc
X:4
L:1/1
K:C#
x |]
```

```abc
X:5
L:1/1
K:Cb
x |]
```

Qui sopra le due armature complete, con sette diesis e con sette bemolle.

Due regole permettono di trovare la tonalità maggiore guardando l'armatura:

- con i diesis, la tonica sta un semitono sopra l'ultimo diesis: con tre diesis l'ultimo è il Sol♯, e la tonica è La;
- con i bemolle, la tonica è il penultimo bemolle: con tre bemolle il penultimo è il Mi♭, e la tonica è Mi♭.

Restano fuori due casi da ricordare a memoria: senza alterazioni è Do maggiore, con un solo bemolle è Fa maggiore.

## Il circolo delle quinte

Ogni diesis in più sposta la tonica cinque note più in alto, contando anche la nota di partenza: Do, Sol, Re, La, Mi, Si, Fa♯, Do♯. Ogni bemolle in più la sposta cinque note più in basso: Do, Fa, Si♭, Mi♭, La♭, Re♭, Sol♭, Do♭. Questa distanza si chiama quinta, e la ritroverai nel capitolo 8.

Disposte in cerchio, con il Do in alto, i diesis da un lato e i bemolle dall'altro, le tonalità formano il circolo delle quinte. In basso i due lati si incontrano: Fa♯ maggiore, con sei diesis, e Sol♭ maggiore, con sei bemolle, suonano uguali e sono due nomi della stessa tonalità.

Il circolo serve soprattutto a vedere quali tonalità sono vicine. Due tonalità affiancate hanno armature che differiscono per una sola alterazione, e un brano passa più facilmente dall'una all'altra.
