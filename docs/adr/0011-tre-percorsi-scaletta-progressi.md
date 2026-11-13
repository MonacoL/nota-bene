# Tre Percorsi, una Scaletta e Prerequisiti che bloccano, con i Progressi salvati nel browser

Dopo un colloquio con il maestro Matteo Sabetta, lo studio si divide dal primo giorno in tre **Percorsi**: ritmico, armonico e melodico. Ogni Capitolo appartiene a uno solo. I Percorsi si incrociano soltanto attraverso i **Prerequisiti**: un Capitolo, i suoi Esercizi o una Lettura possono richiedere Capitoli di un altro Percorso (capita soprattutto fra ritmico e melodico). Il maestro indica un ordine consigliato, la **Scaletta**: una sola sequenza che alterna i tre Percorsi. Il corista sceglie se seguire la Scaletta o fare **Studio libero**. In Scaletta, ciò di cui mancano i Prerequisiti è bloccato finché non li ha completati. In Studio libero è tutto aperto. Per sapere che cosa è completato, il sito salva i **Progressi** in `localStorage`, solo su quel dispositivo. Deciso nel grilling del 13 novembre 2026. Sostituisce la regola "non si salva niente" della specifica v1 (#21, storia 57) e la frase del glossario "ogni Capitolo è sempre accessibile".

## Considered Options

- **Un Percorso solo, come nella v1**: non rappresenta l'idea del maestro di far crescere ritmo, armonia e melodia insieme dal primo giorno.
- **Un Capitolo in più Percorsi**: complica la vista per Percorso e non serve, perché i Prerequisiti che passano da un Percorso all'altro esprimono già gli incroci.
- **Una Scaletta per Percorso, da avanzare in parallelo**: tre "prossimi passi" invece di uno, e il maestro non può dire "prima questo ritmico, poi quel melodico".
- **La Scaletta come ordine obbligato** (si apre solo il prossimo Capitolo): troppo rigido. In Scaletta blocca solo ciò che ha Prerequisiti mancanti, e la Scaletta indica il prossimo passo.
- **Prerequisiti solo indicativi, senza salvataggio**: è la v1. Ma il maestro li vuole bloccanti, e senza ricordare che cosa è completato il blocco non si può fare.
- **Un codice di avanzamento da copiare a mano, o un account**: il primo è scomodo da telefono, il secondo serve un backend e va contro "senza account".
- **Capitolo completato solo con un pulsante, o solo con le Serie**: col solo pulsante il blocco è una formalità, con le sole Serie chi arriva già preparato dalle lezioni deve rifare tutto. Valgono tutte e due.

## Consequences

- **Dati**: `contenuti/percorso.yml` dice per ogni Capitolo il Percorso, la posizione nella Scaletta e i Prerequisiti. La CI controlla che ogni Prerequisito sia un Capitolo, che non ci siano cicli e che nella Scaletta ogni Capitolo venga dopo i suoi Prerequisiti. I Prerequisiti delle Letture restano in `edizione.yml` (ADR-0003).
- **Capitolo completato**: una Serie per ogni tipo di Esercizio del Capitolo con almeno 8 risposte su 10 giuste al primo colpo, oppure il pulsante "segna come già studiato". La soglia sta in un solo posto del codice.
- **Che cosa si blocca**, in Scaletta: la pagina del Capitolo, la sua pagina di Esercizi (con gli stessi Prerequisiti del Capitolo, così ci si può mettere alla prova prima di leggere) e le Letture.
- **Pagina bloccata**: il contenuto resta nell'HTML statico ed è nascosto da JavaScript. Al suo posto un riquadro elenca i Prerequisiti mancanti, come link, ciascuno con "segna come già studiato", e offre "passa allo studio libero". Senza JavaScript non si blocca niente.
- **Partenza**: chi entra la prima volta è in Scaletta. Il cambio sta nell'intestazione e nella pagina dei Capitoli.
- **Numeri**: il numero mostrato di un Capitolo è la sua posizione nella Scaletta, con accanto il Percorso. Gli URL non cambiano.
- **Pagina dei Capitoli**: due viste, la Scaletta (elenco unico con lucchetti, completati e prossimo passo) e per Percorso (tre colonne, una sotto l'altra su telefono).
- **Progressi**: in `localStorage` solo i Capitoli completati e la scelta fra Scaletta e Studio libero. Valgono per tutte e due le lingue. Si cancellano con un pulsante "cancella i miei progressi". Niente cookie, niente invio di dati. La pagina della privacy lo dice.
- **Letture avanzate**: restano, finché il maestro non dirà come le Letture entrano nei Percorsi.
- **Contenuti**: la divisione dei 10 Capitoli della v1 nei tre Percorsi e la prima Scaletta sono provvisorie, da rivedere con il maestro. Il Percorso armonico non ha ancora un Capitolo che si possa fare dal primo giorno.
