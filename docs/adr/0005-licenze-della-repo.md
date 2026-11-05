# Tre licenze nella repo: codice MIT, contenuti CC BY-SA 4.0, Letture come la loro Edizione

La repo contiene tre cose diverse e ognuna ha la sua licenza:

- **il codice** (sito, build, validazione, generatori degli Esercizi di teoria) è **MIT**, nel `LICENSE` alla radice;
- **i contenuti originali** (Capitoli, testi degli Esercizi di teoria, traduzioni, pagine di servizio) sono **CC BY-SA 4.0**, in `LICENSE-CONTENUTI`;
- **le Letture** e il sorgente copiato in `letture/<brano>/` seguono la licenza della loro Edizione, dichiarata in `edizione.yml`. Fa eccezione l'Edizione di pubblico dominio: le nostre trascrizioni ABC si rilasciano in **CC0**, così restano libere quanto l'originale.

Il README ha una sezione "Licenze" che dice cartella per cartella che cosa vale. Gli asset di terzi (campioni audio, font, librerie vendorizzate) tengono la loro licenza in un file accanto. Il copyright è di "Luca Monaco e i contributori di Nota Bene". I contributi entrano con la licenza della parte che toccano (inbound = outbound), senza CLA, come dice il `CONTRIBUTING.md`.

Agli utenti si mostrano tre cose: un piè di pagina breve con le licenze di testi e codice, l'attribuzione completa di ogni Lettura accanto alla partitura e l'elenco degli asset di terzi nella pagina dei crediti.

## Considered Options

- **Una sola licenza per tutto** (per esempio CC BY-SA anche sul codice): scartata perché CC sconsiglia le sue licenze per il software e perché le Letture non si possono rilicenziare.
- **CC BY 4.0 per i contenuti**: permette più riusi, anche in materiali chiusi. Si è preferito lo share-alike, perché i derivati dei Capitoli restino aperti e i contenuti siano allineati alle Edizioni CC BY-SA.
- **Lo standard REUSE** (`REUSE.toml` con controllo in CI): scartato perché è uno strumento in più. Le licenze delle Letture le controlla già la validazione di ADR-0003, e il resto ha un confine netto per cartella.

## Consequences

- Una Lettura non può mai "salire" a CC BY-SA perché sta in una repo CC BY-SA: la sua licenza è sempre quella di `edizione.yml`.
- Per una trascrizione di un'Edizione PD, `edizione.yml` deve poter indicare CC0 per i nostri file, separato dallo stato PD dell'originale.
