% Event listener per ly2abc.py (docs/letture.md): mentre LilyPond legge un brano, scrive in un file TSV ogni evento di
% ogni Voce. Non disegna niente: si usa con -dbackend=null, includendo questo file prima del brano.
%
% Righe, separate da tabulazioni (posizione e durate in semibrevi, come razionali):
%   <voce> <battuta> <posizione> N <nome 0-6> <alterazione> <ottava> <durata> <legata 0/1> <istante>   una nota
%   <voce> <battuta> <posizione> R|S|M ... <durata> 0 <istante>    pausa, spazio (s) o pausa di più Battute
%   <voce> <battuta> <posizione> T                                legatura di valore sulla nota appena scritta
%   <voce> K <quinte> | M <numeratore> <denominatore> | Q <battiti al minuto> <unità in semibrevi>
%   (M alla prima nota della Voce e dove il Tempo cambia)
%   <testo> L <istante> <sillaba> | <testo> H <istante>           sillaba, e trattino dopo la sillaba
% La battuta è currentBarNumber: nel levare iniziale la posizione è negativa. La voce è l'id del contesto Voice,
% altrimenti "staff:" più l'id o il nome del rigo. Il testo è l'id del contesto Lyrics.

#(define eventi-porta (open-output-file eventi-uscita))

#(define (eventi-voce context)
   (let ((id (ly:context-id context))
         (rigo (ly:context-find context 'Staff)))
     (cond
      ((not (string-null? id)) id)
      ((not rigo) "?")
      ((not (string-null? (ly:context-id rigo))) (string-append "staff:" (ly:context-id rigo)))
      (else
       (let ((nome (ly:context-property rigo 'instrumentName)))
         (string-append "staff:" (cond ((string? nome) nome) ((markup? nome) (markup->string nome)) (else "?"))))))))

% Il Tempo si legge dalla proprietà timeSignatureFraction del contesto, alla prima nota e quando cambia.
#(define eventi-tempi (make-hash-table))

#(define (eventi-scrivi context tipo event)
   (let ((f (ly:context-property context 'timeSignatureFraction))
         (voce (eventi-voce context)))
     (if (and (pair? f) (not (equal? f (hash-ref eventi-tempi voce))))
         (begin
           (hash-set! eventi-tempi voce f)
           (format eventi-porta "~a\tM\t~a\t~a\n" voce (car f) (cdr f)))))
   (let* ((d (ly:event-property event 'duration))
          (p (ly:event-property event 'pitch))
          (arts (ly:event-property event 'articulations '()))
          (legata (any (lambda (a) (memq 'tie-event (ly:event-property a 'class))) arts)))
     (format eventi-porta "~a\t~a\t~a\t~a\t~a\t~a\t~a\t~a\t~a\t~a\n"
             (eventi-voce context)
             (ly:context-property context 'currentBarNumber)
             (ly:moment-main (ly:context-property context 'measurePosition))
             tipo
             (if (ly:pitch? p) (ly:pitch-notename p) "")
             (if (ly:pitch? p) (ly:pitch-alteration p) "")
             (if (ly:pitch? p) (ly:pitch-octave p) "")
             (if (ly:duration? d) (ly:duration->number d) 0)
             (if legata 1 0)
             (ly:moment-main (ly:context-current-moment context)))))

% Le quinte dell'Armatura: diesis positivi, bemolli negativi.
#(define (eventi-quinte event)
   (apply + (map (lambda (coppia) (* 2 (cdr coppia))) (ly:event-property event 'pitch-alist '()))))

#(define (eventi-engraver context)
   (make-engraver
    (listeners
     ((note-event engraver event) (eventi-scrivi context "N" event))
     ((rest-event engraver event) (eventi-scrivi context "R" event))
     ((skip-event engraver event) (eventi-scrivi context "S" event))
     ((multi-measure-rest-event engraver event) (eventi-scrivi context "M" event))
     ((tie-event engraver event)
      (format eventi-porta "~a\t~a\t~a\tT\n"
              (eventi-voce context)
              (ly:context-property context 'currentBarNumber)
              (ly:moment-main (ly:context-property context 'measurePosition))))
     ((key-change-event engraver event)
      (format eventi-porta "~a\tK\t~a\n" (eventi-voce context) (eventi-quinte event)))
     ((tempo-change-event engraver event)
      (let ((battiti (ly:event-property event 'metronome-count))
            (unita (ly:event-property event 'tempo-unit)))
        (if (and (number? battiti) (ly:duration? unita))
            (format eventi-porta "~a\tQ\t~a\t~a\n" (eventi-voce context) battiti (ly:duration->number unita))))))))

#(define (eventi-testo context)
   (make-engraver
    (listeners
     ((lyric-event engraver event)
      (let ((t (ly:event-property event 'text)))
        (format eventi-porta "~a\tL\t~a\t~a\n" (ly:context-id context)
                (ly:moment-main (ly:context-current-moment context))
                (if (string? t) t (markup->string t)))))
     ((hyphen-event engraver event)
      (format eventi-porta "~a\tH\t~a\n" (ly:context-id context)
              (ly:moment-main (ly:context-current-moment context)))))))

\layout {
  \context { \Voice \consists #eventi-engraver }
  \context { \Lyrics \consists #eventi-testo }
}
