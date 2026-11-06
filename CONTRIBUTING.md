# Contribuire a Nota Bene

Grazie se vuoi dare una mano. Per proporre un Brano senza usare git c'è il template di issue "Proponi un Brano"; per aggiungere una Lettura la guida è [docs/letture.md](docs/letture.md). Il vocabolario è quello di [GLOSSARY.md](GLOSSARY.md).

## Licenza dei contributi

Un contributo entra con la licenza della parte che tocca (inbound = outbound), senza CLA (ADR-0005):

- il codice con la licenza MIT ([`LICENSE`](LICENSE));
- i contenuti originali (Capitoli, testi degli Esercizi di teoria, traduzioni, pagine di servizio) con la CC BY-SA 4.0 ([`LICENSE-CONTENUTI`](LICENSE-CONTENUTI));
- una Lettura con la licenza della sua Edizione, in `edizione.yml`.

Chi apre una pull request accetta che il suo contributo si pubblichi così. La sezione "Licenze" del [README](README.md) dice cartella per cartella che cosa vale. Un asset di terzi (font, libreria, campioni audio) entra con il suo file di licenza accanto e la sua voce in `crediti.yml`, come spiega il README: senza, la build si ferma.

## Privacy

Oggi il sito non raccoglie dati, non usa cookie né storage nel browser e non carica niente da altri siti, e la pagina Privacy lo dice. Chi aggiunge analytics, un form o una risorsa da una CDN di terzi deve prima aggiornare la pagina Privacy (`contenuti/pagine/it/privacy.md` e la sua traduzione), nella stessa pull request e prima del deploy. Il test Playwright "niente cookie, storage o risorse di terzi" fallisce con una risorsa di terzi: si aggiorna insieme alla pagina Privacy.

## Testi, AI e revisione umana

I testi dei Capitoli e delle pagine di servizio partono da una bozza di Claude e li rivede una persona, che ne è responsabile (pagina "Uso dell'intelligenza artificiale"). Ogni file Markdown in `contenuti/` ha nel frontmatter `revisione: { da, data }` con chi l'ha rivisto e quando; un file inglese ha anche `tradotto_da` (ADR-0006).

**Regola: l'AI non rimette mano a un testo dopo la revisione umana.** Quando `revisione.da` nomina una persona, il testo si corregge solo a mano, e chi lo corregge aggiorna `revisione`. Una bozza non ancora rivista ha `da: "nessuno, …"` e l'AI può ancora lavorarci. La CI non controlla le modifiche dopo la data di revisione: la regola si rispetta in revisione della pull request.
