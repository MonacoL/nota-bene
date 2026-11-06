# xml2abc 177

Convertitore da MusicXML ad ABC di Willem G. Vree, usato da `npm run nuova-lettura` (ticket #34, ADR-0003). Serve solo a chi importa una Lettura: il sito e la CI non lo eseguono.

- Fonte: <https://wim.vree.org/svgParse/xml2abc.html>, archivio `xml2abc.py-177.zip`
- `xml2abc.py` è copiato senza modifiche (sha256 `6957bd88cdeedafa7a7cc5e2eec3f3ffc6449ef84e5337c46f0aa673f83725b4`)
- Licenza: GNU Lesser General Public License, come dice l'intestazione del file, che non ne indica la versione. Qui ci sono i testi della LGPL 3.0 (`COPYING.LESSER`) e della GPL 3.0 che la LGPL richiama (`COPYING`).
- Richiede Python 3.

Per aggiornarlo si sostituisce `xml2abc.py` con la nuova versione, si aggiornano numero e hash in questo file e si riprova `nuova-lettura` sul MusicXML della prova end-to-end.
