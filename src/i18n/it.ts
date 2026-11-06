// Testi dell'interfaccia in italiano: è il dizionario di riferimento.
// Ogni chiave qui deve esistere anche in en.ts, altrimenti il controllo dei tipi fallisce.
export const it = {
  lingua: 'Italiano',
  nomeSito: 'Nota Bene',
  descrizioneSito:
    'Teoria musicale ed esercizi per coristi che partono da zero, fino alla lettura a prima vista con il DO mobile.',
  home: 'Home',
  navPrincipale: 'Navigazione principale',
  vaiAlContenuto: 'Vai al contenuto',
  letture: 'Letture',
  cambiaLingua: 'Lingua',
  inCostruzione: 'Sito in costruzione: i contenuti arriveranno presto.',
  percorso: 'Percorso',
  capitolo: 'Capitolo',
  capitoloInPreparazione: 'Questo Capitolo è in preparazione.',
  esercizi: 'Esercizi',
  eserciziDi: 'Esercizi: {titolo}',
  eserciziInPreparazione: 'Gli Esercizi di questo Capitolo sono in preparazione.',
  tornaAlCapitolo: '← Torna al Capitolo',
  capitoloPrecedente: '← Capitolo precedente',
  capitoloSuccessivo: 'Capitolo successivo →',
  provaLetture: 'Prova le Letture',
  provaLettureAvanzate: 'Prova le Letture avanzate',
  navCapitoli: 'Capitoli',
  avvisoNonTradotto: 'Questo Capitolo non è ancora tradotto: lo trovi in italiano.',
  ingressoLetture: 'Quando conosci il DO mobile, metti alla prova la lettura a prima vista con estratti di Brani corali veri.',
  vaiAlleLetture: 'Vai alle Letture',
  paginaInPreparazione: 'Pagina in preparazione.',
  tornaAllaHome: 'Torna alla home',
  piePagina: {
    licenze:
      'Codice con licenza MIT. Testi con licenza CC BY-SA 4.0. Ogni Lettura ha la licenza della sua Edizione.',
    paginaServizio: 'Pagine di servizio',
  },
  pagine: {
    letture: 'Letture',
    privacy: 'Privacy',
    'intelligenza-artificiale': "Uso dell'intelligenza artificiale",
    crediti: 'Crediti',
    contatti: 'Contatti',
  },
} as const;

/** La forma che ogni dizionario deve avere: le stesse chiavi dell'italiano, con testi qualsiasi. */
type Forma<T> = { readonly [K in keyof T]: T[K] extends string ? string : Forma<T[K]> };
export type Dizionario = Forma<typeof it>;
