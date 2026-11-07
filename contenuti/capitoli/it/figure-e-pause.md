---
revisione: { da: "nessuno, bozza di Claude", data: 2026-11-07 }
esercizi:
  - { tipo: completa-la-battuta, tempi: ["4/4"] }
---

La posizione sul pentagramma dice quale nota cantare. La forma della nota dice quanto a lungo tenerla. Questo capitolo parla della seconda cosa: le figure, le pause e i segni che allungano una nota.

## Le figure

La **figura** è il disegno della nota, e dice quanto dura. Ogni figura vale la metà di quella prima:

| Figura | Come si disegna | Quante semiminime vale |
|---|---|---|
| semibreve | testa vuota, senza gambo | 4 |
| minima | testa vuota con il gambo | 2 |
| semiminima | testa piena con il gambo | 1 |
| croma | testa piena, gambo e una coda | ½ |
| semicroma | testa piena, gambo e due code | ¼ |

Quando ci sono più crome o semicrome di fila, le code si uniscono in una linea dritta, la travatura, che rende più facile vedere i gruppi.

```abc
X:1
M:4/4
L:1/4
K:C
B4 | B2 B2 | B B B B | B/B/ B/B/ B/B/ B/B/ | B/4B/4B/4B/4 B/4B/4B/4B/4 B/4B/4B/4B/4 B/4B/4B/4B/4 |]
```

Le battute qui sopra durano tutte uguale: una semibreve, poi due minime, quattro semiminime, otto crome e sedici semicrome.

Le figure non dicono quanti secondi dura una nota, solo quanto dura rispetto alle altre. Quanto vada veloce il brano lo decide l'andamento, di cui si parla nel capitolo 4.

## Le pause

Anche il silenzio si scrive, con le **pause**. Ogni figura ha la sua pausa, che dura esattamente quanto lei.

```abc
X:2
M:4/4
L:1/4
K:C
z4 | z2 z2 | z z z z | z/z/ z/z/ z/z/ z/z/ |]
```

La pausa di semibreve e quella di minima si somigliano: la prima pende sotto la 4ª riga, la seconda poggia sopra la 3ª. La pausa di semibreve si usa anche per dire "tutta la battuta in silenzio", qualunque sia la sua lunghezza.

In coro le pause contano quanto le note. Una pausa che finisce vuol dire che la tua voce deve rientrare in quel preciso momento.

## Il punto di valore

Un punto subito dopo la testa della nota la allunga della metà del suo valore. Una minima col punto vale una minima più una semiminima, cioè tre semiminime. Una semiminima col punto vale una semiminima più una croma, cioè tre crome.

```abc
X:3
M:4/4
L:1/4
K:C
B3 B | B3/ B/ B2 |]
```

Nella prima battuta una minima col punto e una semiminima; nella seconda una semiminima col punto, una croma e una minima. Le due battute durano uguale.

Anche le pause possono avere il punto, con la stessa regola.

## Due archi diversi

Sopra o sotto le note si trovano spesso degli archi. Si somigliano, ma vogliono dire cose diverse.

La **legatura di valore** unisce due note della stessa altezza. Le loro durate si sommano, e si canta una nota sola, tenuta, senza riattaccarla. Serve soprattutto per tenere una nota oltre la stanghetta, o per scrivere durate che nessuna figura da sola può dare.

La **legatura di portamento** unisce note di altezza diversa. Dice di cantarle legate, senza staccare. Nei brani corali indica spesso che più note vanno cantate sulla stessa sillaba del testo.

```abc
X:4
M:4/4
L:1/4
K:C
B2- B B | (c d e2) |]
```

Nella prima battuta la legatura di valore unisce le prime due note: si canta un Si4 lungo tre semiminime, poi un altro Si4. Nella seconda battuta la legatura di portamento lega tre note diverse.

Un errore frequente in coro è chiudere una nota lunga prima del dovuto, soprattutto alla fine di una frase. In 4/4 una semibreve dura quattro pulsazioni intere, e la si tiene fino all'ultima.

## Negli esercizi

Gli esercizi di questo capitolo usano battute da quattro semiminime, il tempo 4/4. Il prossimo capitolo spiega che cosa sono battute e tempi; per ora ti basta contare quante semiminime mancano per arrivare a quattro.
