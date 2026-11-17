"""Trascrive le registrazioni delle lezioni in testo con i tempi.

Uso, dalla cartella strumenti/trascrizione:

    uv run trascrivi.py ../../registrazioni/20261116

Per ogni file audio della cartella scrive accanto un .txt con una riga
per segmento, nella forma "[mm:ss] testo". I file già trascritti si saltano.
"""

import subprocess
import sys
from pathlib import Path

import numpy as np

from faster_whisper import WhisperModel

ESTENSIONI = {".mp4", ".m4a", ".mp3", ".ogg", ".opus", ".wav", ".aac", ".webm"}
MODELLO = "medium"


def leggi_audio(p: Path) -> np.ndarray:
    """Decodifica con ffmpeg in mono a 16 kHz, come vuole Whisper."""
    grezzo = subprocess.run(
        ["ffmpeg", "-nostdin", "-i", str(p), "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
        capture_output=True,
        check=True,
    ).stdout
    return np.frombuffer(grezzo, np.int16).astype(np.float32) / 32768.0


def tempo(secondi: float) -> str:
    m, s = divmod(int(secondi), 60)
    return f"{m:02d}:{s:02d}"


def main(cartella: Path) -> None:
    audio = sorted(p for p in cartella.iterdir() if p.suffix.lower() in ESTENSIONI)
    da_fare = [p for p in audio if not p.with_suffix(".txt").exists()]
    if not da_fare:
        print("Niente da trascrivere.")
        return
    modello = WhisperModel(MODELLO, device="cpu", compute_type="int8")
    for p in da_fare:
        print(f"Trascrivo {p.name}", flush=True)
        segmenti, _ = modello.transcribe(
            leggi_audio(p),
            language="it",
            vad_filter=True,
            initial_prompt="Lezione di teoria musicale per coristi: solfeggio, intervalli, "
            "tonalità, armonia, accordi, do mobile, battuta, tempo, ritmo.",
        )
        parziale = p.with_suffix(".txt.parziale")
        with parziale.open("w", encoding="utf-8") as out:
            for seg in segmenti:
                out.write(f"[{tempo(seg.start)}] {seg.text.strip()}\n")
                out.flush()
        parziale.rename(p.with_suffix(".txt"))
        print(f"Fatto {p.with_suffix('.txt').name}", flush=True)


if __name__ == "__main__":
    main(Path(sys.argv[1]))
