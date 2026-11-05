# Obblighi legali di Nota Bene: privacy, cookie, AI Act e altro

Ricerca per l'issue #13. Data: 5 novembre 2026.

> **Non è consulenza legale.** Questa nota raccoglie fonti primarie e ne dà una lettura ragionata per orientare le scelte del progetto. Le conclusioni sono interpretazioni, non pareri. Per decisioni con conseguenze reali (ad esempio aggiungere analytics o raccolta di dati) conviene sentire un professionista o il Garante.

## Ipotesi di partenza

Le conclusioni valgono per Nota Bene com'è oggi:

- sito statico, solo frontend, ospitato su GitHub Pages;
- gestito da una persona fisica in Italia, gratuito, senza pubblicità, senza scopo di lucro;
- niente account, form, commenti, newsletter, progressi salvati sul server;
- nessuna risorsa caricata da domini di terzi (font, librerie, video, analytics): tutto è servito da GitHub Pages;
- al massimo `localStorage` (o simili) per una preferenza scelta dall'utente, come la lingua;
- i testi dei Capitoli sono bozze scritte da Claude e riviste da una persona; le Letture vengono da Brani di CPDL o Mutopia.

Se una di queste ipotesi cambia, cambia anche il quadro (vedi [Che cosa cambia se...](#che-cosa-cambia-se)).

## Riepilogo

| Tema | Esito | Che cosa fare |
|---|---|---|
| Informativa privacy (GDPR art. 13) | Probabilmente non obbligatoria oggi; **consigliata** | Pagina breve "Privacy e cookie" |
| Banner cookie | **Non applicabile** (nessun cookie o strumento che richieda consenso) | Nessun banner |
| Informazioni su `localStorage` per la lingua | **Richiesta** secondo le linee guida del Garante, se usato | Una riga nella pagina "Privacy e cookie" e, meglio, accanto al selettore lingua |
| AI Act art. 50(4), testi pubblicati generati da AI | **Non applicabile** (tre motivi indipendenti, vedi sotto) | Nota di trasparenza **consigliata** e volontaria |
| Accessibilità (Legge Stanca, EAA) | **Non applicabile** a un privato non commerciale | Seguire comunque WCAG 2.1 AA, **consigliato** |
| Note legali da e-commerce (D.lgs. 70/2003 art. 7) | Verosimilmente **non applicabile** (nessuna attività economica) | Contatto del responsabile **consigliato** |
| Attribuzioni e licenze delle Letture | **Richieste** dalle licenze (CC BY, CC BY-SA, CPDL License) | Pagina "Crediti e licenze" + riferimento accanto a ogni Lettura |
| Termini di GitHub Pages | **Richiesto** rispettarli | Nessun uso commerciale; già coerente |

## 1. Privacy (GDPR, Reg. UE 2016/679)

Fonte: testo del GDPR su EUR-Lex, <https://eur-lex.europa.eu/legal-content/IT/TXT/?uri=CELEX:32016R0679> (letto nella versione consolidata con i considerando pubblicata dal Garante, <https://www.garanteprivacy.it/documents/10160/0/Regolamento+UE+2016+679.+Arricchito+con+riferimenti+ai+Considerando+Aggiornato+alle+rettifiche+pubblicate+sulla+Gazzetta+Ufficiale++dell%27Unione+europea+127+del+23+maggio+2018>).

### Quali dati personali passano dal sito

- Un indirizzo IP è un "identificativo online" che può rendere identificabile una persona (considerando 30: "indirizzi IP, marcatori temporanei (cookies) o identificativi di altro tipo"). La Corte di giustizia ha riconosciuto che anche un IP dinamico può essere dato personale (C-582/14, *Breyer*, ECLI:EU:C:2016:779; citato a memoria, non riletto in questa sessione perché EUR-Lex e Curia non erano raggiungibili dagli strumenti).
- Nota Bene non ha un server proprio: chi riceve le richieste HTTP è GitHub. La documentazione di GitHub Pages dice: "When a GitHub Pages site is visited, the visitor's IP address is logged and stored for security purposes, regardless of whether the visitor has signed into GitHub or not" (<https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages>, sezione *Data collection*).
- Il titolare di quel trattamento è GitHub: il Privacy Statement si applica ai dati che "GitHub, Inc. or GitHub B.V., processes as the 'Data Controller'" e dice che GitHub raccoglie automaticamente "IP address, device information" (<https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement>, in vigore dal 27 aprile 2026). Per i trasferimenti verso gli USA GitHub dichiara di aderire all'EU-U.S. Data Privacy Framework e di usare le clausole contrattuali tipo. Il gestore del sito non vede questi log, non ne decide finalità né mezzi.

### Il gestore di Nota Bene è titolare di qualche trattamento?

Oggi verosimilmente no:

- non raccoglie dati (niente form, account, analytics, log propri);
- non sceglie le finalità del log di GitHub (sicurezza della piattaforma) né vi ha accesso.

Resta un margine di incertezza: la Corte di giustizia ha interpretato in modo ampio la contitolarità (es. C-210/16 *Wirtschaftsakademie*, gestore di una fan page Facebook contitolare anche senza accesso ai dati; C-40/17 *Fashion ID*, sito che incorpora un plugin di terzi contitolare della raccolta e trasmissione dei dati). In quei casi però il gestore *sceglieva* di attivare uno strumento di terzi che raccoglie dati per finalità anche sue; un hosting statico che logga IP per la propria sicurezza è un caso diverso. Le sentenze sono citate a memoria (ECLI:EU:C:2018:388 e ECLI:EU:C:2019:629), non rilette in questa sessione.

### L'esenzione "domestica" (art. 2 par. 2 lett. c)

Il GDPR non si applica ai trattamenti "effettuati da una persona fisica per l'esercizio di attività a carattere esclusivamente personale o domestico". Il considerando 18 aggiunge che l'esenzione vale "senza una connessione con un'attività commerciale o professionale" e può comprendere "attività online intraprese nel quadro di tali attività".

Non conviene contarci: la Corte di giustizia ha escluso che pubblicare dati su Internet, rendendoli accessibili a un numero indefinito di persone, sia attività personale o domestica (C-101/01 *Lindqvist*, ECLI:EU:C:2003:596, punto 47; citato a memoria). Un sito pubblico per un pubblico internazionale non è "domestico". Il punto pratico è però che oggi il gestore non tratta dati, quindi l'esenzione non serve.

### Conclusione privacy

- **Informativa art. 13**: probabilmente **non obbligatoria** finché il gestore non raccoglie dati. È **consigliata** comunque, perché costa poco, chiarisce che il gestore non raccoglie nulla e rimanda a GitHub per i log, e diventa obbligatoria al primo cambiamento (analytics, CDN, form).
- **Registro dei trattamenti (art. 30), DPO, valutazione d'impatto**: non applicabili.

## 2. Cookie e altri strumenti di tracciamento

Fonti:

- Direttiva 2002/58/CE (ePrivacy), art. 5 par. 3: <https://eur-lex.europa.eu/legal-content/IT/TXT/?uri=CELEX:32002L0058>; recepita in Italia dall'art. 122 del Codice privacy (D.lgs. 196/2003): <https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2003-06-30;196>.
- Garante privacy, *Linee guida cookie e altri strumenti di tracciamento*, 10 giugno 2021 (doc. web 9677876): <https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9677876>.
- EDPB, *Guidelines 2/2023 on Technical Scope of Art. 5(3) of ePrivacy Directive*, versione 2.0 adottata il 7 ottobre 2024: <https://www.edpb.europa.eu/system/files/documents/2024-10/edpb_guidelines_202302_technical_scope_art_53_eprivacydirective_v2_en_0.pdf>.
- Gruppo Articolo 29, *Opinion 04/2012 on Cookie Consent Exemption* (WP194): <https://ec.europa.eu/justice/article-29/documentation/opinion-recommendation/files/2012/wp194_en.pdf>.

### La regola

Salvare o leggere informazioni sul dispositivo dell'utente richiede consenso, **salvo** che sia "strettamente necessario" per fornire un servizio esplicitamente richiesto dall'utente (art. 5(3) ePrivacy, art. 122 Codice privacy). La regola non riguarda solo i cookie: l'EDPB include `localStorage` e tecnologie simili (Guidelines 2/2023, par. 44, che cita "cookies, local storage, WebSQL").

### Banner

Le linee guida del Garante (par. 7.1) dicono che, se si usano solo cookie tecnici, l'informazione può stare "nella homepage o nell'informativa generale", senza banner. Per i cookie tecnici il titolare è soggetto "al solo obbligo di fornire specifica informativa" ed è esente dal consenso (par. 5); l'informativa sui cookie tecnici può essere "eventualmente inserita all'interno di quella di carattere generale" (par. 5).

**Banner: non applicabile** a Nota Bene oggi.

### `localStorage` per la lingua

- Ricordare la lingua scelta dall'utente è l'esempio tipico di "UI customization" esente da consenso nel parere WP194 (par. 3.6: "Language preference cookies that are used to remember the language selected by a user on a multilingual website"). Il parere precisa che l'esenzione copre una memorizzazione di sessione o di breve durata; per conservarla più a lungo basta un'informazione ben visibile, ad esempio "uses cookies" scritto accanto al selettore della lingua.
- L'EDPB osserva che se l'informazione resta nel browser e non viene inviata a nessuno, la sua lettura da parte dell'applicazione non costituisce "accesso" ai sensi dell'art. 5(3) (Guidelines 2/2023, par. 44: "as long as the information does not leave the device"). Una preferenza di lingua letta solo da JavaScript locale ricade in questo caso; la scrittura resta comunque un'"archiviazione".

**Conclusione**: `localStorage` usato solo per la lingua scelta dall'utente è **strettamente necessario**, non serve consenso né banner. Secondo le linee guida del Garante va però **menzionato** (una riga nella pagina "Privacy e cookie", meglio anche vicino al selettore).

Alternativa di progetto che toglie il problema alla radice: mettere la lingua nell'URL (`/it/...`, `/en/...`) e non salvare nulla nel browser.

### Cookie policy separata

Non serve un documento a parte: basta una sezione nella pagina "Privacy e cookie" che dica che il sito non usa cookie e, se c'è, che cosa salva in `localStorage` e perché.

## 3. AI Act (Reg. UE 2024/1689), art. 50

Fonti:

- Testo consolidato (versione EUR-Lex al 27 luglio 2026, con le modifiche del "Digital Omnibus on AI") sul servizio ufficiale della Commissione AI Act Service Desk: art. 50 <https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50>, art. 2 <https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-2>, art. 113 <https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-113>. Testo originale: <https://eur-lex.europa.eu/eli/reg/2024/1689/oj/ita>.
- Commissione europea, *Guidelines on the implementation of the transparency obligations for certain AI systems under Article 50 of Regulation (EU) 2024/1689*; pagina <https://digital-strategy.ec.europa.eu/en/library/guidelines-transparency-obligations-providers-and-deployers-ai-systems> (pubblicate il 20 luglio 2026), PDF <https://ec.europa.eu/newsroom/dae/redirection/document/131215>. Il PDF scaricato oggi riporta "Brussels, 5.11.2026, C(2026) 7702 final": vedi i dubbi aperti.
- FAQ della Commissione sull'art. 50: <https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act>.
- *Code of Practice on Transparency of AI-Generated Content*, versione finale pubblicata il 10 giugno 2026: <https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content>, PDF <https://ec.europa.eu/newsroom/dae/redirection/document/129555>. Commissione e AI Board lo hanno giudicato adeguato per l'art. 50(2), (4) e (5): <https://digital-strategy.ec.europa.eu/en/library/commission-opinion-assessment-code-practice-transparency-ai-generated-content>.

### Che cosa dice l'art. 50(4), secondo comma

I *deployer* di un sistema di AI che genera o manipola testo "pubblicato allo scopo di informare il pubblico su questioni di interesse pubblico" devono rendere noto che il testo è stato generato o manipolato artificialmente. L'obbligo **non si applica** "where the AI-generated content has undergone a process of human review or editorial control and where a natural or legal person holds editorial responsibility for the publication of the content" (testo dell'articolo come riportato nel Code of Practice, p. 32 circa). L'informazione va data in modo chiaro e distinguibile al più tardi alla prima esposizione (art. 50(5)).

**Data di applicazione**: 2 agosto 2026 (art. 113; FAQ: "Article 50 of the AI Act applies as from 2 August 2026"). Il periodo transitorio fino al 2 dicembre 2026 introdotto dall'Omnibus riguarda solo la marcatura tecnica a carico dei *provider* (art. 50(2)), non i deployer (Linee guida, par. 153). I testi pubblicati prima del 2 agosto 2026 non vanno etichettati retroattivamente, ma quelli generati prima e pubblicati dopo sì (Linee guida, par. 154).

### Perché a Nota Bene non si applica

Tre motivi, ognuno sufficiente da solo.

1. **Uso personale non professionale (art. 2(10))**. L'AI Act "does not apply to obligations of deployers who are natural persons using AI systems in the course of a purely personal non-professional activity". Le Linee guida (par. 19) considerano professionale "any activity through which natural persons gain an economic benefit on a regular basis or are otherwise involved in a professional, business, trade, occupational or freelance activity", e tra gli esempi esclusi citano "individuals using an AI system in a personal capacity to generate text on various topics" e perfino deepfake "disseminated on social media". Un progetto gratuito, senza ricavi, gestito da un privato nel tempo libero rientra verosimilmente nell'esclusione. Attenzione: basterebbero ricavi regolari (pubblicità, abbonamenti, corsi a pagamento collegati) o un legame con l'attività professionale del gestore per perderla.
2. **Non è testo "su questioni di interesse pubblico"**. Le Linee guida (par. 131) chiedono tre condizioni: testo pubblicato, che informa, su questioni "relevant to society at large ... and meriting public debate or scrutiny" (politica, amministrazione, giustizia, diritti fondamentali, sicurezza e salute pubblica, ambiente, consumatori, sviluppi economici, scientifici o culturali "that may be relevant subject of public debate"). Le prime due ci sono; la terza no: spiegare la scala maggiore o il DO mobile è contenuto didattico, non un tema di dibattito pubblico. Gli esempi esclusi includono romanzi fantasy e descrizioni di prodotto; gli esempi inclusi sono notizie, salute, informazioni finanziarie, allerte meteo.
3. **Revisione umana con responsabilità editoriale**. Anche se i primi due punti cadessero, l'eccezione si applica a due condizioni cumulative (Linee guida, par. 133-138):
   - *revisione umana sostanziale*: "deliberate examination of the substance of the content by one or more natural persons possessing relevant knowledge", con il controllo dei fatti come "minimum requirement" (par. 134). Non bastano correzioni ortografiche o un'approvazione frettolosa (par. 135). Se l'AI rimaneggia il testo **dopo** la revisione, l'eccezione decade (par. 136);
   - *responsabilità editoriale* di una persona fisica o giuridica, la cui identità e i cui contatti "should be made publicly available on an easily findable location" (par. 138).

### Conclusione AI Act

- Dichiarare l'uso di AI nei testi è **non obbligatorio** per Nota Bene oggi, ma **opportuno**: è coerente con il progetto, costa una pagina e copre il caso in cui una delle tre ragioni venga meno.
- Per tenere in piedi la terza ragione conviene un flusso di lavoro esplicito: ogni Capitolo è rivisto da una persona competente che controlla i contenuti; nessuna modifica fatta dall'AI dopo la revisione senza una nuova revisione; nome e contatto del responsabile pubblicati.
- Gli obblighi di marcatura tecnica (art. 50(2)) sono a carico del *provider* del modello (Anthropic), non di Nota Bene.
- Il Code of Practice è volontario; non firmarlo non è una violazione (FAQ). Per un sito privato non ha senso firmarlo, ma il suo Commitment 4 è una buona traccia: indicare chi ha la responsabilità editoriale (nome, ruolo, contatto) e descrivere in breve come avviene la revisione.

## 4. Accessibilità

- **Legge 4/2004 (Legge Stanca)**: si applica alle pubbliche amministrazioni e ai soggetti a esse assimilati; per i privati, dall'art. 3 comma 1-bis, solo ai soggetti giuridici che offrono servizi al pubblico con fatturato medio superiore a 500 milioni di euro negli ultimi tre anni (AgID, <https://www.agid.gov.it/it/design-servizi/accessibilita>; testo: <https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2004-01-09;4>). **Non applicabile.**
- **D.lgs. 82/2022 (European Accessibility Act)**: riguarda operatori economici che forniscono determinati prodotti e servizi (es. commercio elettronico, servizi bancari, trasporti). Nota Bene non è un operatore economico né offre quei servizi. **Non applicabile** (stessa pagina AgID; testo: <https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2022-05-27;82>).
- **Consigliato**: seguire WCAG 2.1 livello AA, perché il pubblico è ampio e perché le notazioni musicali, gli audio e gli esercizi interattivi sono punti critici. Una dichiarazione di accessibilità volontaria è facoltativa.

## 5. Altri obblighi da sito web

### Note legali (D.lgs. 70/2003)

L'art. 7 del D.lgs. 70/2003 impone al "prestatore" di servizi della società dell'informazione di indicare nome, indirizzo, contatti, partita IVA ecc. Il decreto definisce quei servizi come attività economiche svolte online (art. 2; testo: <https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2003-04-09;70>). Un sito gratuito, senza pubblicità né ricavi, verosimilmente **non** rientra. **Consigliato** comunque: una pagina "Chi siamo / contatti" con il nome del responsabile e un contatto, che serve anche per la responsabilità editoriale dell'AI Act (par. 138 delle Linee guida) e per le segnalazioni di errori o di licenze.

### Termini d'uso di GitHub Pages

I termini di GitHub per i prodotti aggiuntivi dicono che Pages è "intended to host static web pages, but primarily as a showcase for personal and organizational projects" e non può essere usato come hosting gratuito per un'attività commerciale, e-commerce o SaaS; sono ammessi pulsanti per donazioni e link di crowdfunding (<https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features>, sezione GitHub Pages). **Richiesto** rispettarli; Nota Bene oggi è conforme.

### Attribuzioni e licenze delle Letture

Le Letture sono estratti di edizioni con licenze che impongono obblighi precisi:

- **Mutopia** (<https://www.mutopiaproject.org/legal.html>): edizioni in pubblico dominio, CC BY o CC BY-SA. Con CC BY bisogna citare l'autore dell'edizione; con CC BY-SA anche ridistribuire le opere derivate (un estratto modificato, ad esempio trasposto o con le Sillabe aggiunte) con la stessa licenza.
- **CPDL**: ogni edizione ha la sua licenza, indicata nella pagina dell'edizione (pubblico dominio, CC, oppure la *CPDL License*). La CPDL License (versione 4, 9 ottobre 2000, pagina <https://www.cpdl.org/wiki/index.php/ChoralWiki:CPDL>) richiede, per copie e opere derivate, di pubblicare un'avvertenza di copyright adeguata, conservare i riferimenti alla licenza, licenziare l'opera derivata alle stesse condizioni e dire come consultare il testo della licenza (punti 1 e 2.b-c). Il sito CPDL rifiuta le richieste automatiche, quindi la pagina è stata letta da una copia salvata in questa sessione di lavoro e va ricontrollata a mano.
- **Richiesto**: per ogni Lettura, accanto all'estratto o in una pagina collegata, indicare Brano, compositore, editore dell'edizione, Fonte con link e licenza con link; nella pagina "Crediti e licenze", l'elenco completo. Annotare nel repository la licenza di ogni edizione usata.

### Licenza dei contenuti propri

Non è un obbligo, ma è **consigliato** dichiarare la licenza del codice e dei testi dei Capitoli (ad esempio una licenza Creative Commons per i testi e una open source per il codice). Va controllato che sia compatibile con le licenze share-alike delle Letture: la clausola SA si estende all'estratto modificato, non a tutto il sito.

## Che cosa cambia se...

### Si aggiungono analytics

- Il gestore diventa **titolare** di un trattamento: l'informativa art. 13 GDPR diventa **obbligatoria**, con base giuridica, finalità, destinatari (il fornitore di analytics come responsabile ex art. 28, con relativo contratto), conservazione, diritti, eventuali trasferimenti fuori UE.
- **Cookie o identificatori di analytics di terze parti**: richiedono consenso preventivo, quindi **banner**, salvo che rispettino le condizioni del Garante per essere assimilati ai tecnici (linee guida, par. 7.2): IP mascherato (almeno l'ultimo ottetto per IPv4), solo statistiche aggregate su un solo sito, e il fornitore non combina i dati con altri né li cede.
- **Analytics senza cookie e senza identificativi del dispositivo**, gestiti da un fornitore UE o in self-hosting e con IP anonimizzato, riducono gli adempimenti a informativa senza banner; vanno comunque verificati caso per caso.
- Trasferimenti verso gli USA: dal 10 luglio 2023 c'è la decisione di adeguatezza sull'EU-U.S. Data Privacy Framework (C(2023) 4745), valida solo se il fornitore è certificato. Il Garante aveva dichiarato illecito l'uso di Google Analytics prima di quella decisione (provvedimento 9 giugno 2022, doc. web 9782890; citato a memoria, da ricontrollare).

### Si usano font, librerie o video serviti da CDN di terzi

- Ogni pagina aperta fa inviare dal browser l'IP del visitatore (e il referer) al terzo: font da Google Fonts, librerie da jsDelivr, unpkg o cdnjs, video YouTube incorporati.
- Il gestore che sceglie di incorporare la risorsa è verosimilmente **contitolare** della raccolta e della trasmissione (logica di *Fashion ID*, C-40/17): serve l'**informativa**, una base giuridica (interesse legittimo, da motivare) e, se il terzo imposta cookie o identificatori (tipico di YouTube), il **consenso** e quindi il banner.
- **Consigliato**: servire font e librerie dallo stesso dominio (self-hosting). Così il quadro resta quello di oggi. Per i video, usare la modalità senza cookie e un clic di attivazione ("clicca per caricare il video"), oppure linkare invece di incorporare.

### Si aggiungono account, salvataggio dei progressi sul server o form

Informativa obbligatoria, base giuridica, misure di sicurezza, gestione dei diritti, eventuale registro: è un cambio di categoria, da valutare con un'issue a parte.

### Arrivano ricavi o il progetto diventa professionale

Cadono l'esclusione dell'art. 2(10) AI Act e verosimilmente la non applicabilità del D.lgs. 70/2003; vanno riviste anche le condizioni d'uso di GitHub Pages.

## Pagine da pubblicare

Tutte in italiano e inglese, raggiungibili dal piè di pagina.

1. **Privacy e cookie** (consigliata oggi; obbligatoria al primo cambiamento). Contenuto minimo:
   - chi gestisce il sito e come contattarlo;
   - il sito non raccoglie dati personali, non usa cookie, non ha analytics né risorse di terzi;
   - l'hosting è GitHub Pages, che registra gli IP dei visitatori per sicurezza come titolare autonomo, con link al GitHub Privacy Statement;
   - se usato, che cosa salva `localStorage` (solo la lingua scelta), perché e come cancellarlo;
   - data dell'ultimo aggiornamento.
2. **Uso dell'intelligenza artificiale** (volontaria, consigliata). Contenuto minimo:
   - i testi dei Capitoli sono scritti in bozza con l'aiuto di Claude (Anthropic) e poi rivisti e verificati da una persona, che ne ha la responsabilità;
   - le Letture non sono generate dall'AI, vengono da Brani reali (CPDL, Mutopia);
   - nome e contatto del responsabile editoriale, come segnalare errori;
   - eventualmente, una piccola indicazione in ogni Capitolo ("Testo scritto con l'aiuto di un'AI e rivisto da ...").
3. **Crediti e licenze** (richiesta per gli obblighi di attribuzione). Contenuto minimo:
   - per ogni Brano: titolo, compositore, editore dell'edizione, Fonte con link, licenza con link, eventuali modifiche fatte all'estratto;
   - licenza del codice e dei testi di Nota Bene;
   - crediti di font, librerie e suoni con le loro licenze.
4. **Chi siamo / contatti** (consigliata; può coincidere con la pagina 2). Nome del responsabile, contatto, natura del progetto (gratuito, non commerciale, amatoriale), avvertenza che il sito non sostituisce un insegnante.

Nessun banner cookie e nessuna pagina "Note legali" separata servono finché valgono le ipotesi di partenza.

## Dubbi aperti

- **Riferimento delle Linee guida art. 50**: la pagina della Commissione indica la pubblicazione il 20 luglio 2026, ma il PDF scaricato il 5 novembre 2026 riporta "Brussels, 5.11.2026, C(2026) 7702 final". Potrebbe essere la versione formalmente adottata che sostituisce quella di luglio; i passaggi citati qui vanno ricontrollati sulla versione definitiva.
- **Fonti non rilette**: EUR-Lex e Curia non rispondevano agli strumenti usati, quindi le sentenze *Lindqvist*, *Breyer*, *Wirtschaftsakademie*, *Fashion ID*, la decisione sul Data Privacy Framework e il provvedimento del Garante su Google Analytics sono citati a memoria. Il testo dell'AI Act è stato letto sull'AI Act Service Desk della Commissione (versione consolidata) e il GDPR sulla versione pubblicata dal Garante.
- **Contitolarità con GitHub**: la lettura "GitHub titolare autonomo, il gestore non tratta dati" è la più ragionevole ma non è confermata da una decisione su un caso di hosting statico.
- **"Puramente personale" e pubblicazione al pubblico**: le Linee guida AI Act includono tra gli usi personali i contenuti diffusi sui social; non dicono nulla di un sito didattico pubblico. Per questo la nota di trasparenza è consigliata anche se l'esclusione regge.
- **CPDL License e copyleft**: va verificato, edizione per edizione, se gli estratti modificati (con Sillabe o trasposti) obbligano a licenziare con la stessa licenza anche la pagina che li contiene o solo l'estratto.
