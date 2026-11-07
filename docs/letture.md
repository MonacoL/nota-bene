# Importare un Brano

Come si porta un Brano da una Fonte a una o più Letture in `letture/<brano>/`. Il formato su disco è nell'ADR-0003, le Sillabe nell'ADR-0004, le licenze nell'ADR-0005. Le decisioni dietro questa guida sono nei ticket [#15](https://github.com/MonacoL/nota-bene/issues/15) (flusso) e [#17](https://github.com/MonacoL/nota-bene/issues/17) (catalogo iniziale).

Chi non usa git propone un Brano con il template di issue "Proponi un brano": l'import lo fa poi chi ha la repo, seguendo questa guida.

## 1. Scegliere l'Edizione

Sulla pagina del Brano (CPDL o Mutopia) ci sono spesso più Edizioni. Si sceglie con questi filtri, in ordine:

1. **licenza accettata**: Public Domain, CC BY, CC BY-SA, CPDL License. Niente NC, ND né licenze "personal";
2. **sorgente utilizzabile**: MusicXML (`.mxl` o `.xml`) su CPDL, LilyPond (`.ly`) su Mutopia;
3. **Voce in una delle tre Chiavi** trattate: violino, violino ottava bassa, basso;
4. **meno interventi editoriali** e Testo completo.

Il motivo della scelta va scritto nella PR. Due casi particolari:

- un'Edizione PD tratta da un'edizione critica moderna (art. 85-quater L. 633/1941) si scarta;
- un'Edizione PD che non dichiara la sua fonte si accetta con `fonte_dichiarata: no`. A parità di condizioni si preferiscono CC BY e CC BY-SA.

Attenzione ai file: su una stessa pagina CPDL i file di Edizioni diverse stanno uno sotto l'altro. Il blocco di ogni Edizione comincia con i suoi file e finisce con "Editor" e "Copyright": il file scaricato deve essere dell'Edizione di cui si scrivono i dati.

## 2. Creare la cartella dell'Edizione

Il nome della cartella è il Brano in kebab-case, ed è la prima parte degli id: dopo la pubblicazione non cambia più. Una seconda Edizione dello stesso Brano va in `<brano>-<editore>/`.

**Da Mutopia** lo script scarica da solo `.ly`, PDF A4 e RDF, e precompila titolo, numero dell'Edizione, curatore e licenza:

```sh
npm run nuova-edizione -- if-ye-love-me --mutopia 'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=412'
```

**Da CPDL** il file si scarica a mano, perché il sito è dietro Cloudflare. Cloudflare blocca le richieste automatiche (curl, fetch dello script, WebFetch di un agente), ma non un browser vero: con Claude in Chrome (`/chrome` in Claude Code) la pagina si apre e la verifica di Cloudflare passa da sola in pochi secondi, senza cliccare niente. Un agente può quindi leggere la pagina del Brano dal browser, confrontare le Edizioni e trovare il link del file giusto; il download lo conferma la persona, e se Cloudflare chiede una casella o un CAPTCHA la risolve lei. Poi:

```sh
npm run nuova-edizione -- on-the-resurrection-morning --file ~/Scaricati/Hornsey_Wesley_SS.mxl \
  --url 'https://www.cpdl.org/wiki/index.php/On_the_resurrection_morning_(Samuel_Sebastian_Wesley)'
```

Lo script copia il sorgente, ne calcola l'hash e scrive `edizione.yml`. Ciò che la Fonte non dice resta `DA COMPILARE` e la validazione lo elenca campo per campo:

- `brano`, `autore` (nome per esteso: Mutopia lo abbrevia), `edizione` (su CPDL il numero, come `"#42027"`, tra virgolette), `editore`;
- `licenza.tipo` (uno dei quattro accettati), `licenza.come_appare` (come la scrive la pagina), `licenza.url`;
- `licenza.prova`: uno snapshot della pagina su [archive.org](https://web.archive.org/save), nella forma `https://web.archive.org/web/<data>/…`. Se lo snapshot fallisce, si stampa la pagina in `licenza.pdf` nella cartella e si scrive `prova: licenza.pdf`.

Per un'Edizione PD lo script aggiunge `trascrizioni: CC0` (ADR-0005).

## 3. Aggiungere una Lettura

**Da un MusicXML** (CPDL):

```sh
npm run nuova-lettura -- on-the-resurrection-morning --voce soprano --battute 1-8
```

Lo script lancia xml2abc (in `strumenti/xml2abc/`, serve Python 3) sul sorgente dell'Edizione, isola la Voce, taglia le Battute e scrive `soprano-1-8.abc`. Aggiunge poi la Lettura a `edizione.yml` e l'id a `letture/pubblicate.txt`.

- Prima di scaricare conviene guardare il PDF: alcune Edizioni scrivono due Voci sullo stesso rigo come accordi (per esempio soprano e contralto con un gambo solo). xml2abc le lascia unite, la Voce non si può isolare e il catalogo rifiuta l'ABC con la regola `voce`. Si sceglie un'altra Edizione con le Voci separate, oppure si trascrive l'estratto a mano.
- Con quattro Voci vale l'ordine soprano, contralto, tenore, basso. Altrimenti lo script elenca le Voci di xml2abc e si sceglie con `--v <numero>`.
- `--musicxml <file>` usa un file diverso dal sorgente dichiarato.
- Il levare iniziale del Brano è la Battuta 0. Lo script taglia Battute intere: se l'estratto comincia con un levare a metà Brano, la parte che manca si aggiunge a mano.
- Il Testo si taglia insieme alle note se il MusicXML lo lega alle note. Alcune Edizioni scrivono le strofe come testo libero sotto la musica: allora la Lettura resta senza Testo, oppure il Testo si scrive a mano in una riga `w:`.
- La riga `w:` ha un `|` per Battuta, allineato alle note: `w: If ye | love me, | _ keep my com- |`. In ogni Battuta ogni nota prende un frammento di Testo (fino al primo spazio o `-`), un `_` (il frammento di prima continua) o un `*` (niente); le pause no. Una pausa di più Battute scritta come `Z2` è una Battuta sola dell'ABC, quindi un solo `|`. Serve all'a capo della Lettura, che divide note, Testo e Sillabe per Battuta (ticket [#30](https://github.com/MonacoL/nota-bene/issues/30)); lo script lo scrive da solo e la validazione lo controlla con la regola `testo`. Il formato sta nel codice in `src/letture/righe-w.ts`.
- Senza Andamento nella Fonte lo script non scrive il `Q:`: lo si aggiunge a mano (ADR-0008).
- Le Note di una Voce di tenore in chiave di violino ottava bassa si scrivono un'ottava sopra (ADR-0003).

**Da Mutopia** l'estratto si trascrive a mano in ABC guardando il PDF, sul modello di `letture/if-ye-love-me/soprano-1-7.abc`, e la Lettura si aggiunge a mano in `edizione.yml` e in `pubblicate.txt`.

### Le decisioni da compilare

`nuova-lettura` lascia `DA COMPILARE` tre cose che chiedono un musicista, e la CI fallisce finché restano:

- **il Modo nel `K:`**: `K:G % DA COMPILARE: major o minor` diventa `K:G major` oppure, con la stessa Armatura, `K:E minor`. Decide la melodia (dove si appoggia, dove chiude, la sensibile), non l'Armatura;
- **le Mutazioni**: `[]` se il DO non si sposta, altrimenti l'elenco con Battuta, posizione e nuova Tonalità (ADR-0004);
- **i Prerequisiti**: i Capitoli del Percorso che servono, di solito `[do-mobile]`; `do-mobile-avanzato` se ci sono Sillabe cromatiche o una Mutazione.

Se un caso è dubbio, si pubblica con la scelta di default e si aggiunge `da_verificare` con il motivo: il campo non si vede sul sito.

Poi:

```sh
npm run valida:letture
```

## 4. Criteri dell'estratto

La CI controlla da sola numero di Battute (da 4 a 12, levare escluso), durate, salti fino all'ottava, estensione fino alla decima, pause fino a 2 Battute, niente gruppi irregolari, Armatura fino a 3 alterazioni (4 nelle Letture avanzate), un `|` per Battuta nelle righe `w:`.

Non può controllare, e lo chiede la checklist della PR:

- l'estratto comincia all'inizio di una frase, levare compreso;
- finisce su una cadenza o su una pausa di respiro;
- la linea della Voce è cantabile da sola.

Più Voci possono venire dallo stesso Brano, ma non per forza dalle stesse Battute: per ogni Voce si sceglie il passaggio dove la sua linea è cantabile.

## 5. Il catalogo iniziale

La v1 punta a **32 Letture** da **8–10 Brani**. Per ogni Voce:

- 6 Letture: 3 in maggiore con Tempo semplice, 2 in minore, 1 in Tempo composto;
- 2 Letture avanzate: 1 con Sillabe cromatiche, 1 con una Mutazione.

In tutto il catalogo servono almeno 4 Tonalità diverse e il Testo in almeno 3 Letture su 4. Se una Voce non arriva al suo numero, la v1 esce lo stesso e la differenza si annota.

Differenze del catalogo iniziale (ticket [#38](https://github.com/MonacoL/nota-bene/issues/38)): 31 Letture da 10 Brani invece di 32. Manca la Lettura avanzata con Mutazione del Basso. L'unico candidato trovato su Mutopia, Hymn of Eve (Uxbridge), è stato scartato perché non si sa chi abbia scritto l'armonizzazione del Methodist Hymn Book 1933.

## 6. La PR

Il template della PR ha la checklist. La CI:

- valida il catalogo, come `npm run valida:letture`;
- fotografa a 360 px, con la Soluzione visibile, ogni Lettura nuova o modificata. Il commento sulla PR porta all'artifact "anteprime", che si confronta con il PDF della Fonte.

## 7. Il maestro

Il suo parere non blocca la pubblicazione. Per preparargli l'elenco delle Letture con `da_verificare`:

```sh
npm run -s elenco-da-verificare > da-verificare.md
```

Dopo la sua risposta si toglie il campo, o si corregge la Lettura, con una PR.

## 8. Dopo la pubblicazione

- Una correzione mantiene l'id e aggiorna `modificata`.
- Gli aggiornamenti dell'Edizione sulla Fonte non si seguono: per adottarli si rifà l'import, con nuovo hash e nuova data di consultazione.
- Una Lettura da togliere si ritira con `stato: ritirata`: resta in `edizione.yml` e in `pubblicate.txt`, da cui gli id non si tolgono mai.
