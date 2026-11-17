# Prima ritmo e melodia, l'armonia più avanti, e gli Esercizi pratici

Nella lezione registrata del 16 novembre 2026 il maestro Matteo Sabetta ha dato due indicazioni. La prima: si parte dal ritmo insieme ai primi passi melodici, e l'armonia arriva più avanti. La seconda: si studia soprattutto cantando, ascoltando e battendo, e la teoria viene dopo. Abbiamo deciso così:

- La Scaletta alterna ritmico e melodico, e i Capitoli armonici stanno in fondo. Questo aggiorna l'ADR-0011, dove i tre Percorsi "partono tutti dal primo giorno".
- Il Percorso armonico raccoglie solo i Capitoli sui suoni simultanei, a cominciare da "Battimenti". Scale, Modo e Intervalli passano al melodico. Gli id restano gli stessi, quindi i Progressi salvati non si perdono.
- Accanto agli Esercizi di teoria nascono gli **Esercizi pratici**: si fanno con la voce, le mani o l'orecchio. Un Capitolo può avere tutti e due i tipi, o uno solo.
- Per il Capitolo completato contano solo gli Esercizi pratici che hanno una risposta giusta, come i riconoscimenti all'ascolto. Si fanno in Serie, con la stessa soglia degli Esercizi di teoria. Quelli in cui si canta o si batte non contano.
- Le **Sequenze melodiche** da cantare sono generate dalla piattaforma: non sono Letture, e l'ADR-0001 resta valido.
- Si parla come il maestro. **Indicazione metrica** è il segno scritto (3/4, 6/8), **Tempo** è la sua classificazione (binario composto). Prima il glossario chiamava Tempo il segno: il tipo di Esercizio "riconosci il tempo" e i testi esistenti si adeguano.

Deciso con l'utente il 17 novembre 2026, sulla lezione del giorno prima. Le lezioni future arriveranno in ordine sparso e cambieranno ordine e contenuti: la divisione dei Capitoli e la Scaletta in `contenuti/percorso.yml` restano provvisorie.

## Considered Options

- **Un Capitolo armonico da fare dal primo giorno** (domanda aperta di #80): contraddice l'indicazione del maestro.
- **Lasciare scale e intervalli nell'armonico**: il maestro definisce l'armonia come combinazione simultanea di suoni, e scale e intervalli si studiano qui come successioni.
- **Giudicare il canto con il microfono per completare il Capitolo**: un microfono di telefono in una stanza rumorosa sbaglia troppo, e il Capitolo resterebbe bloccato per colpa dello strumento.
- **Le Sequenze melodiche come Letture generate**: cancellerebbe la distinzione dell'ADR-0001 fra la musica vera delle Letture e l'allenamento su un solo concetto.

## Consequences

- **Microfono**: serve agli Esercizi pratici in cui si canta, gira tutto nel browser e l'audio non esce dal dispositivo. Ogni esercizio funziona anche senza microfono: si ascolta, si canta e ci si controlla da soli.
- **Voce del corista**: si chiede la prima volta che si apre un Esercizio pratico in cui si canta, si salva insieme ai Progressi sul dispositivo e si può cambiare. Decide il registro delle note di riferimento.
- **Importanza**: ogni Esercizio pratico ha un'importanza da 1 a 3, data dal maestro. Si mostra come etichetta e non cambia il completamento.
- **Suoni**: sono sintetizzati nel browser quando basta. Gli esempi di voce li registrano il maestro e l'utente, con la licenza dei contenuti. I brani di ascolto sono composizioni di pubblico dominio, prese da una Fonte e suonate con il pianoforte del sito (ADR-0008). Niente registrazioni commerciali. I suoni tenuti, come gli esempi dei battimenti e la nota da raggiungere con la voce, li suona un organo sintetizzato a oscillatori e non il pianoforte: il pianoforte si spegne, e un'ottava o una quinta stonate battono solo con un timbro ricco di armoniche. L'ADR-0008 resta valido per le Letture, dove l'organo era stato scartato perché suona povero.
