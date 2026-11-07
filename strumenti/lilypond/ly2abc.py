"""Da un sorgente LilyPond (Edizioni Mutopia) all'ABC di una Lettura: una Voce, un intervallo di Battute, il Testo.

LilyPond legge il brano (dopo convert-ly, su una copia) con l'event listener eventi.ly, che scrive ogni nota con
Battuta, posizione, altezza e durata: niente trascrizione a mano, e \\relative, \\partial e legature li risolve lui.
Serve LilyPond (2.24 o successivo): il comando `lilypond` nel PATH, oppure la variabile LILYPOND con il percorso.
La guida è in docs/letture.md; nuova-lettura lo usa da solo quando il sorgente dell'Edizione è un .ly.

  ly2abc.py voci    <brano.ly>                      Voci, Battute e righe di Testo del brano
  ly2abc.py mostra  <brano.ly> <voce> [da-a]        le note di una Voce, Battuta per Battuta
  ly2abc.py estrai  <brano.ly> --voce V --battute 9-16 [--levare 1/4] [--taglia 1/4]
                    [--testo L] [--clef treble|treble-8|bass] [--piu-grave]

--battute: la prima e l'ultima Battuta piena (il levare iniziale del brano è la Battuta 0).
--levare: la durata, in semibrevi, presa dalla fine della Battuta prima della prima (il levare della frase).
--taglia: la durata tolta dalla fine dell'ultima Battuta (il levare della frase dopo), che diventa pausa.
--testo: il contesto Lyrics da cui prendere la prima strofa; senza, quello legato alla Voce, se c'è.
Il Testo si allinea per istante: una nota prende la sillaba che comincia con lei, le altre "_". Per una Voce che non
ha il suo Testo (di solito è scritto solo sotto il Soprano) l'allineamento va controllato sul PDF.
"""
import argparse
import os
import re
import shutil
import subprocess
import sys
import tempfile
from collections import defaultdict
from fractions import Fraction as F
from pathlib import Path

QUI = Path(__file__).resolve().parent
LETTERE = "CDEFGAB"
DIESIS = "FCGDAEB"
MAGGIORI = ["Cb", "Gb", "Db", "Ab", "Eb", "Bb", "F", "C", "G", "D", "A", "E", "B", "F#", "C#"]


def esci(messaggio):
    print(messaggio, file=sys.stderr)
    sys.exit(1)


def eventi(brano: Path) -> list[list[str]]:
    """Le righe TSV dell'event listener per il brano, che LilyPond legge da una copia aggiornata con convert-ly."""
    lilypond = os.environ.get("LILYPOND") or shutil.which("lilypond")
    if not lilypond or not Path(lilypond).exists():
        esci("Serve LilyPond: il comando lilypond nel PATH, oppure LILYPOND=/percorso/di/lilypond")
    convert = Path(lilypond).parent / "convert-ly"
    with tempfile.TemporaryDirectory(prefix="ly2abc-") as lavoro:
        copia = Path(lavoro) / "brano.ly"
        shutil.copy(brano, copia)
        if convert.exists():
            subprocess.run([str(convert), "-e", str(copia)], capture_output=True)
        testo = copia.read_text(encoding="utf8")
        # convert-ly lascia i vecchi \cresc e \dim come \deprecated...: si rimettono i comandi di oggi.
        for vecchio, nuovo in (("deprecatedcresc", "cresc"), ("deprecateddim", "dim"),
                               ("deprecatedendcresc", "!"), ("deprecatedenddim", "!")):
            testo = testo.replace("\\" + vecchio, "\\" + nuovo)
        # Ogni \lyricsto senza nome prende il nome "testo:<voce>", così si sa di quale Voce è il Testo.
        testo = re.sub(r'\\new\s+Lyrics(\s+)\\lyricsto\s+"?(\w+)"?', r'\\new Lyrics = "testo:\2"\1\\lyricsto "\2"', testo)
        copia.write_text(testo, encoding="utf8")
        uscita = Path(lavoro) / "eventi.tsv"
        avvolto = Path(lavoro) / "avvolto.ly"
        avvolto.write_text(
            f'\\version "2.24.0"\n#(define eventi-uscita "{uscita}")\n\\include "{QUI / "eventi.ly"}"\n\\include "{copia}"\n',
            encoding="utf8",
        )
        r = subprocess.run([lilypond, "-dbackend=null", "--loglevel=ERROR", "-o", str(Path(lavoro) / "out"), str(avvolto)],
                           capture_output=True, text=True, cwd=lavoro)
        if not uscita.exists() or not uscita.read_text(encoding="utf8").strip():
            esci(f"LilyPond non ha letto il brano:\n{r.stderr[-3000:]}")
        if r.returncode:
            print(f"LilyPond ha segnalato errori, controlla il risultato:\n{r.stderr[-1500:]}", file=sys.stderr)
        return [riga.split("\t") for riga in uscita.read_text(encoding="utf8").splitlines()]


def note(righe, voce):
    """Note e pause della Voce, con la Battuta del catalogo: il levare iniziale del brano è la Battuta 0."""
    risultato = []
    for c in righe:
        if c[0] != voce or c[1] in ("K", "M", "Q", "L", "H"):
            continue
        if c[3] == "T":
            for e in reversed(risultato):
                if e["tipo"] == "N":
                    e["legata"] = True
                    break
            continue
        battuta, posizione = int(c[1]), F(c[2])
        if posizione < 0:
            battuta -= 1
        e = {"battuta": battuta, "posizione": posizione, "tipo": c[3], "durata": F(c[7]), "legata": c[8] == "1", "istante": F(c[9])}
        if c[3] == "N":
            e.update(nome=int(c[4]), alterazione=F(c[5]), ottava=int(c[6]) + 4)
        risultato.append(e)
    return risultato


def primo(righe, voce, tipo):
    """Il primo evento di un tipo (K, M, Q) della Voce, o di una Voce qualsiasi se la Voce non ne ha."""
    della = [c for c in righe if c[1] == tipo and c[0] == voce] or [c for c in righe if c[1] == tipo]
    return della[0] if della else None


def armatura(quinte):
    alterazioni = {lettera: F(0) for lettera in LETTERE}
    for lettera in (DIESIS[:quinte] if quinte > 0 else DIESIS[::-1][:-quinte]):
        alterazioni[lettera] = F(1, 2) if quinte > 0 else F(-1, 2)
    return alterazioni


def durata_abc(durata, unita):
    r = durata / unita
    if r == 1:
        return ""
    if r.denominator == 1:
        return str(r.numerator)
    if r.numerator == 1:
        return "/" if r.denominator == 2 else f"/{r.denominator}"
    return f"{r.numerator}/{r.denominator}"


def altezza_abc(nome, ottava):
    lettera = LETTERE[nome]
    return lettera.lower() + "'" * (ottava - 5) if ottava >= 5 else lettera + "," * (4 - ottava)


def cmd_voci(righe):
    voci = defaultdict(list)
    for c in righe:
        if len(c) > 3 and c[1] not in ("K", "M", "Q", "L", "H") and c[3] == "N":
            voci[c[0]].append(int(c[1]))
    for voce, battute in sorted(voci.items()):
        print(f"{voce}: Battute {min(battute)}–{max(battute)}")
    testi = sorted({c[0] for c in righe if c[1] == "L"})
    print("Testo: " + (", ".join(testi) if testi else "nessuno"))


def cmd_mostra(righe, voce, intervallo):
    nomi = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Si"]
    segni = {F(0): "", F(1, 2): "♯", F(-1, 2): "♭", F(1): "x", F(-1): "♭♭"}
    da, a = map(int, intervallo.split("-")) if intervallo else (0, 10**6)
    per_battuta = defaultdict(list)
    for e in note(righe, voce):
        if da <= e["battuta"] <= a:
            nota = f"{nomi[e['nome']]}{segni[e['alterazione']]}{e['ottava']}" if e["tipo"] == "N" else "pausa"
            per_battuta[e["battuta"]].append(f"{nota}:{e['durata']}{'~' if e['legata'] else ''}")
    if not per_battuta:
        esci(f"nessuna nota della Voce {voce}: le Voci si vedono con il comando voci")
    for b in sorted(per_battuta):
        print(f"{b:4d}  " + "  ".join(per_battuta[b]))


def cmd_estrai(righe, o):
    battute = re.fullmatch(r"(\d+)-(\d+)", o.battute)
    if not battute:
        esci("--battute vuole la prima e l'ultima Battuta, come 9-16")
    da, a = int(battute[1]), int(battute[2])
    tutte = note(righe, o.voce)
    if not tutte:
        esci(f"nessuna nota della Voce {o.voce}: le Voci si vedono con il comando voci")
    k, m, q = primo(righe, o.voce, "K"), primo(righe, o.voce, "M"), primo(righe, o.voce, "Q")
    quinte = int(k[2]) if k else 0
    num, den = (int(m[2]), int(m[3])) if m else (4, 4)
    piena = F(num, den)
    unita = F(1, 8) if den == 8 else F(1, 4)
    levare, taglia = F(o.levare), F(o.taglia)
    alterazioni = armatura(quinte)
    ottava = 1 if o.clef == "treble-8" else 0

    gruppi = []
    if levare:
        prima = [e for e in tutte if e["battuta"] == da - 1]
        fine = max((e["posizione"] + e["durata"] for e in prima), default=F(0))
        gruppi.append([e for e in prima if e["posizione"] >= fine - levare])
    for b in range(da, a + 1):
        gruppo = [e for e in tutte if e["battuta"] == b and not (b == a and taglia and e["posizione"] >= piena - taglia)]
        gruppi.append(gruppo)
    for i, gruppo in enumerate(gruppi):
        gruppo.sort(key=lambda e: e["posizione"])
        if o.piu_grave:
            tenute = {}
            for e in gruppo:
                altra = tenute.get(e["posizione"])
                if altra is None or (e["tipo"] == "N" == altra["tipo"] and e["ottava"] * 7 + e["nome"] < altra["ottava"] * 7 + altra["nome"]):
                    tenute[e["posizione"]] = e
            gruppo[:] = sorted(tenute.values(), key=lambda e: e["posizione"])
        posizioni = [e["posizione"] for e in gruppo]
        if len(set(posizioni)) != len(posizioni):
            esci(f"Battuta {da + i - (1 if levare else 0)}: più note nello stesso istante (Voce divisa): --piu-grave tiene la più grave")
    # L'ultima Battuta si completa con una pausa: piena, o quanto manca al levare.
    ultima = gruppi[-1]
    attesa = piena - levare if levare else piena
    if (totale := sum(e["durata"] for e in ultima)) < attesa:
        ultima.append({"tipo": "R", "durata": attesa - totale, "posizione": totale, "legata": False})

    musica = []
    for gruppo in gruppi:
        nella_battuta = {}
        pezzi, prima_breve = [], None
        for e in gruppo:
            d = durata_abc(e["durata"], unita)
            if e["tipo"] != "N":
                s = "z" + d
            else:
                ott = e["ottava"] + ottava
                attesa_alt = nella_battuta.get((e["nome"], ott), alterazioni[LETTERE[e["nome"]]])
                segno = ""
                if e["alterazione"] != attesa_alt:
                    segno = {F(1, 2): "^", F(-1, 2): "_", F(0): "=", F(1): "^^", F(-1): "__"}[e["alterazione"]]
                    nella_battuta[(e["nome"], ott)] = e["alterazione"]
                s = segno + altezza_abc(e["nome"], ott) + d + ("-" if e["legata"] else "")
            # Le note più brevi di una semiminima nello stesso battito si scrivono attaccate (una cerniera).
            battito = e["posizione"] // (F(3, 8) if den == 8 and num % 3 == 0 else F(1, den))
            breve = e["tipo"] == "N" and e["durata"] < F(1, 4)
            if pezzi and breve and prima_breve == battito:
                pezzi[-1] += s
            else:
                pezzi.append(s)
            prima_breve = battito if breve else None
        musica.append(" ".join(pezzi))

    testo = o.testo or (f"testo:{o.voce}" if any(c[0] == f"testo:{o.voce}" and c[1] == "L" for c in righe) else None)
    riga_w = None
    if testo:
        sillabe = {F(c[2]): c[3].strip() for c in righe if c[0] == testo and c[1] == "L" and c[3].strip() not in ("", "_")}
        trattini = {F(c[2]) for c in righe if c[0] == testo and c[1] == "H"}
        if not sillabe:
            esci(f"nessuna sillaba nel Testo {testo}: i Testi si vedono con il comando voci")
        tratti, usate, legata = [], set(), False
        for gruppo in gruppi:
            frammenti = []
            for e in gruppo:
                if e["tipo"] != "N":
                    continue
                t = e["istante"]
                if not legata and t in sillabe:
                    usate.add(t)
                    frammenti.append(sillabe[t].replace(" ", "~") + ("-" if t in trattini else ""))
                else:
                    frammenti.append("_")
                legata = e["legata"]
            tratti.append(" ".join(frammenti))
        riga_w = "w: " + " | ".join(tratti) + " |"
        istanti = [e["istante"] for g in gruppi for e in g if "istante" in e]
        fine = max(e["istante"] + e["durata"] for g in gruppi for e in g if "istante" in e)
        perse = [sillabe[t] for t in sorted(sillabe) if min(istanti) <= t < fine and t not in usate]
        if perse:
            print("Sillabe che cadono dentro una nota di questa Voce, da sistemare a mano: " + " ".join(perse), file=sys.stderr)

    clef = "" if o.clef == "treble" else f" clef={o.clef}"
    righe_abc = ["X:1", f"M:{num}/{den}", f"L:{unita}"]
    if q:
        righe_abc.append(f"Q:{F(q[3])}={q[2]}")
    righe_abc += [f"K:{MAGGIORI[quinte + 7]}{clef} % DA COMPILARE: major o minor", " | ".join(musica) + " |]"]
    if riga_w:
        righe_abc.append(riga_w)
    print("\n".join(righe_abc))


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sotto = p.add_subparsers(dest="comando", required=True)
    v = sotto.add_parser("voci")
    v.add_argument("brano", type=Path)
    m = sotto.add_parser("mostra")
    m.add_argument("brano", type=Path)
    m.add_argument("voce")
    m.add_argument("battute", nargs="?")
    e = sotto.add_parser("estrai")
    e.add_argument("brano", type=Path)
    e.add_argument("--voce", required=True)
    e.add_argument("--battute", required=True)
    e.add_argument("--levare", default="0")
    e.add_argument("--taglia", default="0")
    e.add_argument("--testo")
    e.add_argument("--clef", choices=["treble", "treble-8", "bass"], default="treble")
    e.add_argument("--piu-grave", action="store_true")
    o = p.parse_args()
    righe = eventi(o.brano)
    if o.comando == "voci":
        cmd_voci(righe)
    elif o.comando == "mostra":
        cmd_mostra(righe, o.voce, o.battute)
    else:
        cmd_estrai(righe, o)


main()
