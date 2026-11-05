// PROTOTIPO usa-e-getta (issue #8). Dati di esempio, NON contenuti definitivi.
// Le note sono trascritte a memoria dalla melodia nota e vanno verificate contro
// l'edizione della Fonte prima di diventare una Lettura vera.
//
// Convenzioni:
// - `note`: corpo ABC della sola Voce; il segnaposto {MUT} indica la nota su cui
//   cade la Mutazione e viene sostituito da un'annotazione (o da niente).
// - `testo`: riga w: del Testo. `sillabe`: riga w: della Soluzione (DO mobile, ADR-0002).

window.LETTURE = [
  {
    id: 'adeste-s-1',
    brano: 'Adeste fideles',
    autore: 'attribuito a John Francis Wade (c. 1743–1751)',
    voce: 'Soprano',
    battute: 'battute 1–8 (con anacrusi)',
    prerequisiti: ['Scala maggiore', 'DO mobile', 'Mutazione'],
    fonte: {
      archivio: 'CPDL',
      edizione: 'edizione da scegliere (segnaposto)',
      editore: 'curatore dell’edizione (segnaposto)',
      licenza: 'CPDL (ChoralWiki Public Domain License)',
      url: 'https://www.cpdl.org/wiki/index.php/Adeste_fideles',
    },
    tonalita: 'Sol maggiore (DO = Sol), poi Re maggiore (DO = Re) dalla battuta 5',
    mutazione: { battuta: 5, etichetta: 'DO→Re', spiegazione: 'Il passaggio va verso Re maggiore: il DO si sposta sulla Nota Re. Il Mi della battuta 5 era LA, ora si canta RE.' },
    riferimento: { tonica: ['G3', 'B3', 'D4'], partenza: 'G4' },
    head: 'M:4/4\nL:1/4\nQ:1/4=84\nK:G',
    note: 'G | G2 D G | A2 D2 | B A B c | B2 A G | G2 F {MUT}E | F G A B | F2 (E3/2 D/2-) | D3 |]',
    testo: 'A-|des-te fi-|de-les,|lae-ti tri-um-|phan-tes, ve-|ni-te ve-|ni-te in Beth-|le-hem. _|',
    sillabe: 'DO|DO SOL DO|RE SOL|MI RE MI FA|MI RE DO|DO TI RE|MI FA SOL LA|MI RE DO|',
  },
  {
    id: 'freude-s-1',
    brano: 'Sinfonia n. 9, op. 125 – IV: «Freude, schöner Götterfunken»',
    autore: 'Ludwig van Beethoven (1824), testo di Friedrich Schiller',
    voce: 'Soprano',
    battute: 'tema, 8 battute',
    prerequisiti: ['Scala maggiore', 'DO mobile'],
    fonte: {
      archivio: 'CPDL',
      edizione: 'edizione da scegliere (segnaposto)',
      editore: 'curatore dell’edizione (segnaposto)',
      licenza: 'CPDL (ChoralWiki Public Domain License)',
      url: 'https://www.cpdl.org/wiki/index.php/Symphony_No._9,_Op._125_(Ludwig_van_Beethoven)',
    },
    tonalita: 'Re maggiore (DO = Re)',
    mutazione: null,
    riferimento: { tonica: ['D3', 'F#3', 'A3'], partenza: 'F#4' },
    head: 'M:4/4\nL:1/4\nQ:1/4=100\nK:D',
    note: 'F F G A | A G F E | D D E F | F3/2 E/2 E2 | F F G A | A G F E | D D E F | E3/2 D/2 D2 |]',
    testo: 'Freu-de, schö-ner | Göt-ter-fun-ken, | Toch-ter aus E-| ly-si-um, | Wir be-tre-ten | feu-er-trun-ken, | Himm-li-sche, dein | Hei-lig-tum!',
    sillabe: 'MI MI FA SOL | SOL FA MI RE | DO DO RE MI | MI RE RE | MI MI FA SOL | SOL FA MI RE | DO DO RE MI | RE DO DO',
  },
];
