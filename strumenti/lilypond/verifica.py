"""Riestrae con ly2abc.py alcune Letture Mutopia del catalogo e controlla che note e Testo siano identici.
Uso, dalla radice della repo: python3 strumenti/lilypond/verifica.py   (serve LilyPond, come per ly2abc.py)"""
import subprocess
import sys
from pathlib import Path

RADICE = Path(__file__).resolve().parents[2]
VOCI = ("soprano", "contralto", "tenore", "basso")
# cartella, file .ly, nomi delle Voci S A T B in LilyPond, Testo (None: quello legato alla Voce)
BRANI = {
    "wiegenlied-der-hirten": ("Wiegenlied.ly", ("Sopran", "Alt", "Tenor", "Bass"), "verseone"),
    "annchen-von-tharau": ("Tharau.ly", ("Sopran", "Alt", "Tenor", "Bass"), "verseone"),
    "der-gute-kamerad": ("DerguteKamerad.ly", ("Sopran", "Alt", "Tenor", "Bass"), "verseone"),
    "der-grimmig-tod": ("DergrimmigTod.ly", ("Sopran", "Alt", "Tenor", "Bass"), "verseone"),
    "ein-geistlich-abendlied": ("Abendlied.ly", ("Sopran", "Alt", "Tenor", "Bass"), "verseone"),
    "wer-bis-an-das-ende-beharrt": ("elias_32.ly", ("soprano", "alto", "tenor", "bass"), None),
    "if-ye-love-me": ("tallis-love.ly", ("Sop", "Alto", "Tenor", "Bass"), None),
}
# cartella, voce, Battute, levare, taglia, altre opzioni
CASI = [
    ("wiegenlied-der-hirten", "soprano", "1-8", "1/8", "1/8", []),
    ("wiegenlied-der-hirten", "contralto", "1-8", "1/8", "1/8", []),
    ("wiegenlied-der-hirten", "tenore", "9-12", "1/8", "0", []),
    ("wiegenlied-der-hirten", "basso", "5-8", "1/8", "1/8", []),
    ("annchen-von-tharau", "contralto", "17-24", "0", "0", []),
    ("der-gute-kamerad", "basso", "5-12", "1/4", "0", ["--piu-grave"]),
    ("der-grimmig-tod", "tenore", "1-8", "0", "1/4", []),
    ("ein-geistlich-abendlied", "soprano", "1-8", "1/4", "1/4", []),
    ("wer-bis-an-das-ende-beharrt", "contralto", "17-24", "0", "0", []),
    ("if-ye-love-me", "basso", "7-13", "0", "0", []),
]


def corpo(abc: str) -> list[str]:
    """Le righe di note e Testo, senza intestazione."""
    return [r for r in abc.splitlines() if r[:2] not in ("X:", "M:", "L:", "Q:", "K:")]


diversi = 0
for cartella, voce, battute, levare, taglia, altre in CASI:
    ly, nomi, testo = BRANI[cartella]
    comando = [sys.executable, "-I", str(Path(__file__).with_name("ly2abc.py")), "estrai", str(RADICE / "letture" / cartella / ly),
               "--voce", nomi[VOCI.index(voce)], "--battute", battute, "--levare", levare, "--taglia", taglia,
               "--clef", {"tenore": "treble-8", "basso": "bass"}.get(voce, "treble"), *altre]
    if testo:
        comando += ["--testo", testo]
    r = subprocess.run(comando, capture_output=True, text=True)
    atteso = corpo((RADICE / "letture" / cartella / f"{voce}-{battute}.abc").read_text(encoding="utf8"))
    uguale = r.returncode == 0 and corpo(r.stdout) == atteso
    diversi += not uguale
    print(f"{'ok' if uguale else 'DIVERSO'}  {cartella}/{voce}-{battute}")
    if not uguale:
        print("  estratto:", corpo(r.stdout) or r.stderr.strip()[-500:])
        print("  catalogo:", atteso)
sys.exit(1 if diversi else 0)
