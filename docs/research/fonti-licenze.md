# Formati e licenze di CPDL e Mutopia

Ricerca per l'issue #3. Data: 5 novembre 2026.

> **Non è consulenza legale.** Questa nota riporta il testo delle licenze e delle pagine dei siti, con una lettura ragionata per orientare le scelte del progetto. Le conclusioni sono interpretazioni, non pareri.

## Domanda

Quali formati e quali licenze offrono CPDL e Mutopia, e che cosa possiamo pubblicare in una repo pubblica servita da GitHub Pages, sapendo che ogni Lettura è un estratto **modificato** di un Brano: una sola Voce, poche battute, con le Sillabe del DO mobile aggiunte (la Soluzione)?

## Riepilogo

| | CPDL | Mutopia |
|---|---|---|
| Dimensione | ~49.000 opere (dichiarato in home page) | 1.420 brani in totale, **287 corali**, di cui **170 SATB** (conteggio sul repository) |
| Formato sorgente | MusicXML compresso (`.mxl`) in circa metà delle edizioni del campione; LilyPond raro (~7%); MEI mai visto | **LilyPond (`.ly`) sempre** |
| Altri file | PDF (quasi sempre), MIDI, MP3, formati proprietari (Sibelius, Finale, Capella, Encore, NoteWorthy, MuseScore) | PDF A4 e Letter, PostScript, MIDI, anteprima PNG/SVG, metadati RDF |
| Licenze | Una per edizione: CPDL License, Public Domain, "Personal", varie Creative Commons (anche NC e ND) | Solo Public Domain, CC BY, CC BY-SA |
| Edizioni usabili per noi | ~47% del campione ha licenza accettabile **e** un file leggibile da programma | Tutti i brani |
| API / dump | MediaWiki `api.php` esiste ma è dietro una verifica Cloudflare: da script risponde 403. Nessun dump trovato | Repository GitHub pubblico con tutti i sorgenti; un file RDF per brano; feed RSS |
| Download automatico | Di fatto bloccato da Cloudflare; robots.txt vieta i crawler di AI e dichiara `ai-train=no` | robots.txt consente tutto; nessun termine d'uso che lo limiti |

## 1. CPDL (Choral Public Domain Library)

### Accesso alle fonti

Da questa sessione `cpdl.org` risponde sempre con una verifica Cloudflare (HTTP 403, header `cf-mitigated: challenge`), anche per `api.php`. Le pagine di CPDL citate sotto sono quindi lette dalle copie dell'Internet Archive (Wayback Machine), con la data della copia indicata. I link puntano comunque alle pagine originali.

### Licenze

CPDL non ha una licenza unica: **ogni edizione** dichiara la sua nella riga "Copyright:" della pagina del Brano. La pagina [ChoralWiki:Copyright](https://www.cpdl.org/wiki/index.php/ChoralWiki:Copyright) (copia del 28/04/2026) dice: "The CPDL copyright license applies to all scores and texts which reside on the CPDL server, unless otherwise indicated. Be sure to check the specific edition for the type of copyright license indicated for that edition." Aggiunge che CPDL accetta anche licenze Creative Commons "provided such licensing allows cost-free use (including performance and derivative works)".

Le categorie che compaiono nella pratica:

**CPDL License** ([ChoralWiki:CPDL](https://www.cpdl.org/wiki/index.php/ChoralWiki:CPDL), versione 4 del 9/10/2000, copia del 28/04/2026). È una licenza copyleft ricalcata sulla GNU GPL.
- Copre anche gli estratti: "a work based on the Edition" è "a work containing the Edition or a portion of it, either verbatim or with modifications" (§0).
- Permette di modificare l'edizione "or any portion of it" e di distribuire le modifiche (§2) a tre condizioni:
  - (a) "a notice stating that you changed the files and the date of any change";
  - (b) l'opera derivata va "licensed as a whole under the terms of this License";
  - (c) mostrare "an appropriate copyright notice and a notice that users may redistribute the Edition under these conditions, and telling the user how to view a copy of this License".
- Le parti indipendenti non derivate dall'edizione non ricadono nella licenza se distribuite separatamente, e una raccolta che include l'edizione non porta le altre opere sotto la licenza (§2, ultimi paragrafi). Per noi: il codice del sito e le Letture tratte da altre Fonti non diventano CPDL License.
- Non c'è clausola non commerciale: si può anche far pagare la copia (§1).
- Se l'edizione non indica la versione, si può scegliere qualunque versione pubblicata (§9).
- Non è tra le licenze dichiarate compatibili con CC BY-SA ([creativecommons.org/compatiblelicenses](https://creativecommons.org/compatiblelicenses) cita solo Free Art License 1.3 e GPLv3). Quindi un'opera derivata da un'edizione CPDL License non può essere rilasciata in CC BY-SA, e viceversa: ogni Lettura deve restare sotto la licenza della sua edizione.

**Public Domain** ([ChoralWiki:Public_Domain](https://www.cpdl.org/wiki/index.php/ChoralWiki:Public_Domain), copia del 16/11/2024). Indica che chi ha caricato l'edizione "believes the work is free of restrictions"; se lo è, si può usare "for any purpose ... in any way". La pagina avverte che i contributi creativi di un editore possono restare protetti anche se l'opera originale è libera.

**Personal** ([ChoralWiki:Personal](https://www.cpdl.org/wiki/index.php/ChoralWiki:Personal), copia del 28/04/2026). Il copyright è dell'editore, che "does not wish to specify the licensing terms using one of the other copyright categories". Le condizioni vanno cercate sul PDF, sulla pagina utente dell'editore o chiedendogli per email. **Non dà di per sé alcun permesso** di modificare e ripubblicare.

**Creative Commons** ([ChoralWiki:Creative_Commons](https://www.cpdl.org/wiki/index.php/ChoralWiki:Creative_Commons), copia del 28/04/2026). Elenca BY, BY-SA, BY-NC, BY-NC-SA e BY-NC-ND in varie versioni e giurisdizioni, e avverte: "Not all varieties of Creative Commons licenses are compatible with the terms of use of this site." Nonostante la regola sul "cost-free use (including ... derivative works)", nel campione compaiono edizioni BY-NC-ND.

**Testi della wiki.** Le traduzioni e gli altri testi delle pagine sono sotto GNU FDL 1.2 o successive ([ChoralWiki:General_disclaimer](https://www.cpdl.org/wiki/index.php/ChoralWiki:General_disclaimer), copia del 28/04/2026). Rilevante se un giorno mostrassimo le traduzioni di CPDL accanto al Testo.

### Formati

Le edizioni possono avere: PDF, MIDI, MP3, MusicXML (quasi sempre `.mxl` compresso, che CPDL raccomanda in [Help:Format choice](https://www.cpdl.org/wiki/index.php/Help:Format_choice)), LilyPond, e i formati proprietari di Sibelius, Finale, Capella, Encore, NoteWorthy e MuseScore. Alcune edizioni sono solo un link a un sito esterno.

### Campione

Cinque Brani SATB molto eseguiti, tutte le edizioni elencate sulla pagina, lette dalla copia Wayback più recente disponibile. I file sono contati dai link della riga di ogni edizione.

| Brano (copia Wayback) | Edizioni | con MusicXML | con LilyPond | senza sorgente modificabile¹ | CPDL License | Personal | PD / CC BY / CC BY-SA | NC o ND |
|---|---|---|---|---|---|---|---|---|
| [Tallis, If ye love me](https://www.cpdl.org/wiki/index.php/If_ye_love_me_(Thomas_Tallis)) (06/08/2024) | 27 | 18 | 2 | 7 | 21 | 3 | 3 | 0 |
| [Palestrina, Sicut cervus](https://www.cpdl.org/wiki/index.php/Sicut_cervus_(Giovanni_Pierluigi_da_Palestrina)) (08/02/2026) | 21 | 15 | 4 | 5 | 9 | 9 | 3 | 0 |
| [Victoria, O magnum mysterium](https://www.cpdl.org/wiki/index.php/O_magnum_mysterium_(Tom%C3%A1s_Luis_de_Victoria)) (08/09/2024) | 24 | 11 | 1 | 11 | 11 | 9 | 2 | 2 |
| [Bruckner, Locus iste](https://www.cpdl.org/wiki/index.php/Locus_iste_(Anton_Bruckner)) (06/12/2024) | 17 | 8 | 0 | 8 | 10 | 6 | 1 | 0 |
| [Mozart, Ave verum corpus K. 618](https://www.cpdl.org/wiki/index.php/Ave_verum_corpus,_KV_618_(Wolfgang_Amadeus_Mozart)) (26/01/2025) | 22 | 5 | 1 | 14 | 7 | 13 | 1 | 1 |
| **Totale** | **111** | **57 (51%)** | **8 (7%)** | **45 (41%)** | **58 (52%)** | **40 (36%)** | **10 (9%)** | **3 (3%)** |

¹ Solo PDF/MIDI/MP3, solo link esterno, o solo un formato proprietario.

Edizioni con licenza accettabile (CPDL License, PD, CC BY, CC BY-SA) **e** un sorgente MusicXML o LilyPond: 52 su 111 (47%). Ogni Brano del campione ne ha almeno 4. Nessun file MEI. Il campione è piccolo e sbilanciato verso Brani famosi, che hanno molte edizioni: per Brani meno noti la scelta sarà più stretta. Le quote vanno lette come ordine di grandezza.

### API, dump e download automatico

- CPDL è una MediaWiki, quindi espone `https://www.cpdl.org/wiki/api.php`. Da script la richiesta riceve la verifica Cloudflare (403), come ogni altra pagina. Non ho trovato documentazione di CPDL sull'uso dell'API, né dump scaricabili, né una pagina di termini d'uso (le pagine `ChoralWiki:Terms_of_use` e `ChoralWiki:Bots` non risultano nemmeno nell'archivio).
- [robots.txt](https://www.cpdl.org/robots.txt), letto il 5/11/2026, è quello gestito da Cloudflare: `User-agent: *` con `Allow: /` e `Content-Signal: search=yes,ai-train=no,use=reference`, più il blocco totale di una lunga lista di crawler di AI (tra cui GPTBot, ClaudeBot, CCBot). Il file presenta questi segnali come "express reservations of rights under Article 4" della Direttiva UE 2019/790 (eccezione per text and data mining).
- In pratica: **il download automatico non è praticabile e non è gradito**. Le edizioni vanno scelte e scaricate a mano dal browser. Con ADR 0001 (Letture selezionate e trascritte a mano, in numero limitato) non è un problema.

## 2. Mutopia

### Licenze

[legal.html](https://www.mutopiaproject.org/legal.html) elenca tre licenze, tutte di cultura libera:
- **Public Domain** (link alla vecchia dedica CC [publicdomain](https://creativecommons.org/licenses/publicdomain/)): "The contributor of this music has dedicated their contribution into the public domain."
- **CC BY** 2.5, 3.0, 4.0: "You must, however, give the original author credit."
- **CC BY-SA** da 1.0 a 4.0: "if you alter, transform, or build upon the work, you must distribute the resulting work under an identical license."

Per i nuovi contributi [contribute.html](https://www.mutopiaproject.org/contribute.html) accetta solo CC BY-SA 4.0, CC BY 4.0 e Public Domain, e chiede che l'edizione di partenza sia di pubblico dominio: compositore, autore del testo, arrangiatore e curatore morti da almeno 70 anni, opera pubblicata prima del 1923.

### Formati

Ogni brano ha il sorgente LilyPond (`.ly`, a volte uno zip di più file) e i file generati: PDF A4 e Letter, PostScript, MIDI, anteprima PNG o SVG. Esempio: [brani di Tallis](https://www.mutopiaproject.org/cgibin/make-table.cgi?Composer=TallisT). Ogni brano ha anche un file RDF di metadati con titolo, autore del testo, organico, licenza, curatore e nomi dei file (es. [tallis-love.rdf](https://www.mutopiaproject.org/ftp/TallisT/tallis-love/tallis-love.rdf)). Nei sorgenti SATB guardati le Voci sono di solito in variabili separate (`Soprano = { ... }`, `Alto = { ... }`), il che rende semplice estrarre una Voce.

### Quanti brani corali

Conteggio sul [repository GitHub](https://github.com/MutopiaProject/MutopiaProject) (commit `2144afd`, ultimo commit del 7/11/2024), leggendo le intestazioni `mutopiainstrument` e `license`/`copyright` dei file `.ly`:

- 1.420 brani in totale;
- **287 corali** (organico con SATB, TTBB, SSA o "choir"), di cui **170 SATB**;
- licenze dei corali: Public Domain 208, CC BY 42, CC BY-SA 37.

Molti dei 170 SATB sono melodie di innari a quattro voci (Dykes, Mason, Bradbury, corali luterani); ci sono anche Tallis, Monteverdi, Gesualdo, Lasso, Janequin, Mendelssohn, Brahms, Bruckner, Mozart (Requiem). Da Mutopia viene quindi una base piccola ma completamente usabile.

### API, dump e download automatico

- Il repository GitHub contiene tutti i sorgenti LilyPond (cartella `ftp/`, circa 5.700 file `.ly`); si clona con `git clone`. Non ha un file LICENSE: la licenza è quella scritta nell'intestazione di ogni brano. I PDF e i MIDI non sono nel repository; si scaricano dal sito.
- C'è un feed delle novità ([latestadditions.rss](https://www.mutopiaproject.org/latestadditions.rss)) e i file RDF per brano.
- [robots.txt](https://www.mutopiaproject.org/robots.txt) consente tutto (`Disallow:` vuoto). Il sito non ha pagine di termini d'uso; la pagina legale dice che "All music on Mutopia may be freely downloaded, printed, copied, distributed, modified, performed and recorded."
- Il progetto è poco attivo: l'ultimo commit è di un anno fa.

## 3. Che cosa permettono le licenze per una Lettura

Una Lettura prende una Voce e poche battute, ne cambia la codifica (da MusicXML o LilyPond al formato del sito) e aggiunge le Sillabe. Va trattata come **opera derivata**:
- per CC 4.0 è "Adapted Material", cioè materiale "translated, altered, arranged, transformed, or otherwise modified" ([CC BY-SA 4.0, §1(a)](https://creativecommons.org/licenses/by-sa/4.0/legalcode.en));
- per la CPDL License anche un estratto non modificato è già "a work based on the Edition" (§0).

| Licenza dell'edizione | Estratto modificato in repo pubblica | Licenza della Lettura | Obblighi principali |
|---|---|---|---|
| Public Domain | Sì | Libera; consigliato dichiararla PD o CC0 | Nessuno per legge; citare la Fonte resta buona pratica e serve ad ADR 0001 |
| CC BY (2.5, 3.0, 4.0) | Sì | Qualsiasi, anche diversa | Autore, titolo/nota di copyright se forniti, licenza con link, indicazione delle modifiche ([BY 4.0 §3(a)](https://creativecommons.org/licenses/by/4.0/legalcode.en); per la 3.0 anche "a credit identifying the use of the Work in the Adaptation", [BY 3.0 §4(b)](https://creativecommons.org/licenses/by/3.0/legalcode)) |
| CC BY-SA (1.0–4.0) | Sì | **CC BY-SA** stessa versione o successiva (§3(b)(1)); da 3.0 si può passare a 4.0 | Come BY, più testo o link della licenza della Lettura (§3(b)(2)); niente misure tecniche che ne limitino l'uso (§3(b)(3)) |
| CPDL License | Sì | **CPDL License** (non compatibile con CC BY-SA) | Nota "modificato il [data]: estratto della Voce X, batt. a–b, aggiunte le Sillabe"; nota di copyright; avviso che si può ridistribuire alle stesse condizioni; link al testo della licenza |
| CC BY-NC, BY-NC-SA | Sì, ma solo per uso non commerciale | BY-NC-SA se SA | Come sopra; vincola il progetto a restare non commerciale ("not primarily intended for or directed towards commercial advantage", [BY-NC-ND 4.0 §1](https://creativecommons.org/licenses/by-nc-nd/4.0/legalcode.en)) |
| CC BY-ND, BY-NC-ND | **No.** Si può condividere una parte non modificata, ma non "Share Adapted Material" (§2(a)(1)(B) e §3(a)(1)) | — | — |
| Personal (CPDL) | **No**, salvo permesso scritto dell'editore | — | — |

Due conseguenze per la repo:
- **Ogni Lettura ha la sua licenza**, ereditata dall'edizione. La licenza della repo (per il codice e i testi dei Capitoli) non può coprire le Letture. Va detto in modo esplicito, ad esempio in un README nella cartella delle Letture e in un campo `licenza` di ogni Lettura.
- Le licenze copyleft (CPDL License, BY-SA) si applicano alla Lettura, Soluzione compresa, ma **non** contagiano il resto del sito: la CPDL License lo dice al §2 e CC BY-SA vale solo per l'Adapted Material.

## 4. Attribuzione accanto a ogni Lettura

ADR 0001 chiede già Brano, Voce, battute, Fonte, editore e licenza. Unendo ADR e licenze, per ogni Lettura servono:

1. Brano e compositore (e autore del Testo, se noto);
2. Voce e battute dell'estratto;
3. Fonte con link alla pagina dell'edizione e identificativo (es. "CPDL #53949", oppure "Mutopia-2014/08/05-412");
4. editore dell'edizione (CPDL: "Editor"; Mutopia: "maintainer"), con la nota di copyright se presente;
5. licenza con link al testo;
6. nota delle modifiche con data, ad esempio "Estratto della Voce di Tenore, batt. 1–8; aggiunte le Sillabe del DO mobile; [data]" (obbligatoria per CPDL License, richiesta da CC);
7. licenza della Lettura stessa (per CPDL License e BY-SA è la stessa dell'edizione).

CC 4.0 ammette di soddisfare questi obblighi "in any reasonable manner", anche con un link a una pagina che contiene le informazioni (§3(a)(2)). Una riga breve sotto la Lettura (Brano, Voce, Fonte, licenza) con un link a una pagina "Crediti e licenze" completa dovrebbe bastare. Per la CPDL License, più vecchia e meno precisa, conviene che la riga sotto la Lettura dica già "modificato" e linki la licenza.

## 5. Dubbi aperti

- **Edizioni dichiarate Public Domain ma copiate da edizioni moderne.** Su CPDL l'etichetta PD è una dichiarazione di chi carica. Se l'edizione riproduce una moderna edizione critica, in Italia potrebbe valere l'art. 85-quater della L. 633/1941 (20 anni di diritti per le edizioni critiche e scientifiche di opere di pubblico dominio). Testo letto su una fonte secondaria ([Brocardi](https://brocardi.it/legge-diritto-autore/titolo-ii/capo-iii-ter/art85quater.html)), non su Normattiva. Il rischio sembra basso per Letture di poche battute, ma esiste.
- **Testi cantati.** Quasi tutti i Testi di questo repertorio sono liturgici o antichi, quindi liberi. Le traduzioni prese dalle pagine di CPDL sono sotto GNU FDL, che ha obblighi più pesanti (includere la licenza intera).
- **La Soluzione è una modifica?** Si potrebbe sostenere che le Sillabe su un rigo separato siano un'aggiunta indipendente e non una modifica. La lettura prudente adottata qui la tratta come parte dell'opera derivata. Cambia poco: l'estratto ricodificato è comunque derivato.
- **Il campione CPDL è piccolo** (5 Brani, 111 edizioni) e letto da copie dell'archivio vecchie fino a due anni, perché il sito blocca l'accesso da script.
- **Versione CPDL License.** Le edizioni non indicano la versione; per il §9 si può scegliere qualunque versione pubblicata. Ho trovato solo la versione 4 (2000).

## Raccomandazione

> **Raccomandazione, la decisione spetta all'utente.**

1. **Licenze da accettare:** Public Domain, CC BY (tutte le versioni), CC BY-SA (tutte le versioni) e CPDL License. Coprono tutto Mutopia e circa metà delle edizioni CPDL del campione, con più edizioni usabili per ogni Brano famoso.
2. **Licenze da escludere:** tutte le ND, "Personal" (salvo permesso scritto dell'editore, da archiviare) e, per semplicità, le NC. Le NC sarebbero legalmente usabili finché il sito è gratuito, ma legano il progetto al non commerciale e aggiungono un caso. Escluderle costa poco: nel campione sono il 3%.
3. **Formati:** partire solo da edizioni con sorgente leggibile, cioè MusicXML (`.mxl`) per CPDL e LilyPond per Mutopia. Le edizioni solo PDF si possono trascrivere a mano se la licenza è accettabile, ma costano lavoro e a parità di licenza non servono.
4. **Licenza per Lettura:** ogni Lettura conserva la licenza della sua edizione e porta i sette dati della sezione 4. Nella repo va scritto chiaramente che la licenza del codice non copre le Letture.
5. **Download:** a mano per CPDL, nessuno scraping. Per Mutopia va bene clonare il repository GitHub e leggere i file RDF per filtrare i brani corali.
