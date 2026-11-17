---
revisione: { da: "nessuno, bozza di Claude", data: 2026-11-17 }
esercizi:
  - { tipo: riconosci-il-tempo, indicazioni: ["2/2", "2/4", "3/4", "4/4", "5/4", "7/4", "3/8", "6/4", "6/8", "9/8", "12/8", "15/8", "21/8"] }
  - { tipo: scegli-le-figure, indicazioni: ["2/2", "2/4", "3/4", "4/4", "5/4", "7/4", "3/8", "6/4", "6/8", "9/8", "12/8", "15/8"] }
  - { tipo: completa-la-battuta, tempi: ["2/4", "3/4", "4/4", "6/8", "9/8", "12/8"] }
---

All'inizio del rigo, dopo la chiave e l'armatura, ci sono due numeri uno sopra l'altro, come 3/4 o 6/8. È l'**indicazione metrica**, e dice in che tempo è il brano: quante pulsazioni ha la battuta e se si suddividono in due o in tre. Questo capitolo spiega come si legge.

## Non è una frazione

L'indicazione metrica somiglia a una frazione, ma non lo è: non si fa nessun calcolo, e 3/4 e 6/8 non sono la stessa cosa. Il numero sopra e il numero sotto rispondono a due domande diverse, e cambia il modo di leggerli fra tempi semplici e tempi composti. Per riconoscerli basta il numero sopra.

| Tempo | Semplice | Composto |
|---|---|---|
| binario | 2/4 | 6/8 |
| ternario | 3/4 | 9/8 |
| quaternario | 4/4 | 12/8 |
| quinario | 5/4 | 15/8 |
| misto | 7/4 | 21/8 |

Nei tempi semplici il numero sopra è 2, 3, 4, 5 o 7. Nei composti è 6, 9, 12, 15 o 21. Il numero sotto può cambiare: 3/4 e 3/8 sono tutti e due ternari semplici, 6/8 e 6/4 tutti e due binari composti.

## I tempi semplici

Nei tempi semplici il numero sopra conta le pulsazioni della battuta. Il numero sotto dice quale figura vale una pulsazione, con il nome numerico delle figure: 4 vuol dire quarto, cioè semiminima; 2 vuol dire mezzo, cioè minima; 8 vuol dire ottavo, cioè croma.

Il 2/4 si legge "due quarti": due pulsazioni per battuta, ognuna di una semiminima.

```abc
X:1
M:2/4
L:1/4
K:C
B B | B2 | B B | B2 |]
```

```abc
X:2
M:3/4
L:1/4
K:C
B B B | B2 B | B3 |]
```

```abc
X:3
M:4/4
L:1/4
K:C
B B B B | B2 B2 | B4 |]
```

Nel 2/4 si contano due semiminime per battuta, nel 3/4 tre, nel 4/4 quattro. La suddivisione è la metà della pulsazione: nei tre esempi, la croma.

Il 4/4 si trova spesso scritto con una C al posto dei numeri. Una C tagliata da una linea verticale (₵), il tempo tagliato, vuol dire invece 2/2: due pulsazioni di minima per battuta. Le note sono le stesse del 4/4, ma si contano in due, e la musica suona più distesa.

## I tempi composti

Nei tempi composti il numero sopra non conta le pulsazioni ma le suddivisioni della battuta. Il numero sotto dice quale figura vale una suddivisione. Le pulsazioni si trovano dividendo per tre il numero sopra, perché ogni pulsazione contiene tre suddivisioni.

Il 6/8 si legge "sei ottavi": sei suddivisioni per battuta, ognuna di una croma, raggruppate in due pulsazioni. Tre crome fanno una semiminima col punto, ed è questa la figura della pulsazione.

```abc
X:4
M:6/8
L:1/8
K:C
BBB BBB | B3 B3 | B3 BBB | B6 |]
```

Allo stesso modo 9/8 ha tre pulsazioni di semiminima col punto, 12/8 ne ha quattro. Nel 6/4 la suddivisione è la semiminima, e la pulsazione è una minima col punto.

## Battuta, pulsazioni e suddivisioni

Aiuta pensare alla battuta come a una scatola. Dentro ci sono le pulsazioni, e dentro ogni pulsazione le suddivisioni. Ogni livello si può scrivere con una figura: nel 4/4 la suddivisione è una croma, la pulsazione una semiminima, e l'intera battuta una semibreve.

A volte nessuna figura da sola riempie la battuta, e ne servono due legate:

- nel 5/4 la battuta vale cinque semiminime: una semibreve legata a una semiminima;
- nel 9/8 vale tre semiminime col punto: una minima col punto legata a una semiminima col punto;
- nel 7/4 vale sette semiminime: una semibreve col punto legata a una semiminima.

## Il levare

Non tutti i brani cominciano sul battere. Spesso la prima battuta è incompleta e contiene solo le ultime pulsazioni: si dice che il brano comincia in levare, perché il gesto del maestro per quelle note è verso l'alto.

```abc
X:5
M:3/4
L:1/4
K:C
G | c2 B | A G A | c2 |]
```

Qui il brano parte sulla terza pulsazione. L'ultima battuta ha solo due pulsazioni: il levare e la fine, messe insieme, fanno una battuta intera.

In prova, un attacco in levare vuol dire respirare sulla pulsazione prima, insieme al gesto del maestro, e cantare sulla successiva.

## Negli esercizi

Gli esercizi di questo capitolo sono tre. In "Riconosci il tempo" vedi un'indicazione metrica e dici che tempo è, per esempio binario composto. In "Scegli le figure" scegli le figure della suddivisione, della pulsazione e della battuta; quando la battuta vuole due figure legate, le metti una dopo l'altra. In "Completa la battuta" aggiungi le figure che mancano per arrivare alla fine della battuta.
