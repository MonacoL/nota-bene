<!-- Se la PR non tocca letture/, cancella la sezione qui sotto. -->

## Letture nuove o modificate

La CI aggiunge un commento con lo screenshot a 360 px di ogni Lettura, con la Soluzione visibile. Confrontalo con il PDF della Fonte.

**Edizione scelta e perché** (filtri in ordine, vedi `docs/letture.md`): 

### Checklist

Decisioni lasciate da `nuova-lettura` (la CI fallisce finché restano `DA COMPILARE`):

- [ ] Modo nel `K:` (major o minor), deciso dalla melodia e non solo dall'Armatura
- [ ] Mutazioni, oppure `[]` se non ce ne sono
- [ ] Prerequisiti, Capitoli del Percorso; `do-mobile-avanzato` se ci sono Sillabe cromatiche o una Mutazione

Confronto con la Fonte:

- [ ] note e Testo uguali al PDF della Fonte
- [ ] attribuzione: Brano, autore, editore, licenza com'è sulla pagina, snapshot su archive.org o `licenza.pdf`

Criteri dell'estratto che la CI non controlla:

- [ ] comincia all'inizio di una frase, levare compreso
- [ ] finisce su una cadenza o su una pausa di respiro
- [ ] la linea della Voce è cantabile da sola

Casi dubbi: la scelta di default con `da_verificare` e il motivo, da portare al maestro (`npm run elenco-da-verificare`).
