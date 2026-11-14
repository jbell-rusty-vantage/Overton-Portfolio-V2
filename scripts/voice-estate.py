"""Voice the custodian's authored cues and derive the timeline the portrait follows.

Reproducible pipeline (run from the repository root, needs OPENAI_API_KEY and ffmpeg):

    python scripts/voice-estate.py            # voice any cue whose text changed
    python scripts/voice-estate.py --force    # voice every cue again

For each cue in content/travellers-rest/narration.json:
  1. gpt-4o-mini-tts speaks the authored line (the only text sent is that line).
  2. ffmpeg normalises loudness and writes a mono MP3 delivery file.
  3. whisper-1 returns word timestamps for the delivered audio; they are matched to
     the authored words so captions show the authored text at the spoken time. The
     match is also the proof that the whole line was spoken: speech synthesis can drop
     a closing sentence, so a cue whose last words were not heard is voiced again.
  4. The mouth track is measured from the audio itself: RMS energy per 1/30 s gives
     the jaw opening, and the vowels of each timed word give the lip spread.
Output: public/travellers-rest/voice/<cue>.mp3 and timeline.json. Playback time is the
only clock at runtime, so pausing, seeking and replaying stay in sync by construction.
"""
import difflib, hashlib, json, re, subprocess, sys, tempfile
from pathlib import Path

import numpy as np
from openai import OpenAI

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "content/travellers-rest/narration.json"
OUT = ROOT / "public/travellers-rest/voice"
OUT.mkdir(parents=True, exist_ok=True)
TIMELINE = OUT / "timeline.json"
FPS = 30
force = "--force" in sys.argv

script = json.loads(SRC.read_text(encoding="utf8"))
voice = script["voice"]
previous = json.loads(TIMELINE.read_text(encoding="utf8"))["cues"] if TIMELINE.exists() else {}
client = OpenAI()


def tokens(text):
    return re.findall(r"[A-Za-z0-9'’]+", text.lower().replace("’", "'"))


def speak(text, target):
    with tempfile.TemporaryDirectory() as tmp:
        raw = Path(tmp) / "raw.wav"
        with client.audio.speech.with_streaming_response.create(
            model=voice["model"], voice=voice["voice"], input=text,
            instructions=voice["instructions"], response_format="wav",
        ) as response:
            response.stream_to_file(raw)
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw),
             "-af", "loudnorm=I=-17:TP=-1.5:LRA=9,apad=pad_dur=0.25",
             "-ac", "1", "-ar", "44100", "-b:a", "80k", str(target)],
            check=True,
        )


def samples(path):
    pcm = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-i", str(path), "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768


def align(path, text, duration):
    """Word times for the authored text, taken from a transcription of the delivery."""
    with open(path, "rb") as audio:
        heard = client.audio.transcriptions.create(
            model="whisper-1", file=audio, response_format="verbose_json",
            timestamp_granularities=["word"], language="en",
        )
    spoken = [(w.word, float(w.start), float(w.end)) for w in heard.words]
    written = text.split()
    a = [tokens(w)[0] if tokens(w) else "" for w, _, _ in spoken]
    b = [tokens(w)[0] if tokens(w) else "" for w in written]
    times = [None] * len(written)
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(a=a, b=b, autojunk=False).get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                times[j1 + k] = (spoken[i1 + k][1], spoken[i1 + k][2])
        elif tag == "replace" and i2 > i1 and j2 > j1:
            # Numbers and names are heard differently: share the heard span evenly.
            start, end = spoken[i1][1], spoken[i2 - 1][2]
            step = (end - start) / (j2 - j1)
            for k in range(j2 - j1):
                times[j1 + k] = (start + k * step, start + (k + 1) * step)
    heard_flags = [t is not None for t in times]
    # A run of untimed words shares the gap between its timed neighbours.
    i = 0
    while i < len(times):
        if times[i] is not None:
            i += 1
            continue
        j = i
        while j < len(times) and times[j] is None:
            j += 1
        before = times[i - 1][1] if i else 0.0
        after = times[j][0] if j < len(times) else max(before + 0.05, duration - 0.3)
        step = max(0.02, (after - before) / (j - i))
        for k in range(i, j):
            times[k] = (before + (k - i) * step, before + (k - i + 1) * step)
        i = j
    times = [(min(s, duration), min(e, duration)) for s, e in times]
    # The line was spoken to its end only if its closing words were actually heard.
    complete = all(heard_flags[-2:])
    return [[round(s, 2), round(e, 2), w] for (s, e), w in zip(times, written)], sum(heard_flags) / max(1, len(written)), complete


def mouth(path, words, duration):
    x = samples(path)
    hop = 16000 // FPS
    frames = int(np.ceil(duration * FPS)) + 1
    rms = np.array([np.sqrt(np.mean(x[i * hop:(i + 2) * hop] ** 2)) if i * hop < len(x) else 0 for i in range(frames)])
    level = np.clip((rms - 0.012) / max(1e-6, np.percentile(rms, 96) - 0.012), 0, 1) ** 0.7
    level = np.convolve(level, [0.25, 0.5, 0.25], mode="same")
    wide = np.full(frames, 0.5)
    for start, end, word in words:
        letters = re.sub(r"[^a-z]", "", word.lower())
        if not letters:
            continue
        span = max(1, int((end - start) * FPS))
        for k in range(span):
            f = int(start * FPS) + k
            if f >= frames:
                break
            ch = letters[min(len(letters) - 1, int(k / span * len(letters)))]
            if ch in "ou" or ch == "w":
                wide[f] = 0.12
            elif ch in "ei" or ch == "y":
                wide[f] = 0.9
            elif ch == "a":
                wide[f] = 0.62
            elif ch in "mbp":
                level[f] *= 0.15
                wide[f] = 0.45
            elif ch in "fv":
                level[f] *= 0.5
    wide = np.convolve(wide, [0.2, 0.6, 0.2], mode="same")
    digits = lambda a: "".join(str(int(round(float(np.clip(v, 0, 1)) * 9))) for v in a)
    return digits(level), digits(wide)


cues, report = {}, []
for cue in script["cues"]:
    text = cue["text"]
    digest = hashlib.sha256((text + json.dumps(voice, sort_keys=True)).encode()).hexdigest()[:16]
    target = OUT / (cue["id"] + ".mp3")
    old = previous.get(cue["id"])
    current = old and old.get("source") == digest and target.exists()
    if not force and current and old.get("spokenToEnd"):
        cues[cue["id"]] = old
        continue
    for attempt in range(4):
        # An existing recording of the same line is checked first, then replaced if short.
        if attempt or force or not current:
            speak(text, target)
        duration = float(subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(target)],
            check=True, capture_output=True, text=True).stdout.strip())
        words, score, complete = align(target, text, duration)
        if complete:
            break
        print("  retake:", cue["id"], "closing words were not spoken", flush=True)
    else:
        raise SystemExit("Could not obtain a complete reading of " + cue["id"])
    opened, spread = mouth(target, words, duration)
    gaze = []
    lowered = text.lower()
    for phrase, where in cue.get("gaze", []):
        at = lowered.find(phrase.lower())
        index = len(text[:at].split()) if at >= 0 else 0
        gaze.append([words[min(index, len(words) - 1)][0], where])
    cues[cue["id"]] = {
        "id": cue["id"], "text": text, "duration": round(duration, 2), "words": words,
        "open": opened, "wide": spread, "gaze": gaze, "source": digest, "spokenToEnd": True,
        **({"quote": cue["quote"]} if "quote" in cue else {}),
    }
    report.append((cue["id"], round(duration, 1), target.stat().st_size, round(score, 2)))
    print(*report[-1], flush=True)

TIMELINE.write_text(json.dumps({
    "note": script["note"],
    "voice": {"model": voice["model"], "voice": voice["voice"], "alignment": "whisper-1 word timestamps", "frameRate": FPS},
    "cues": cues,
}, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf8")
print("cues", len(cues), "voiced now", len(report), "timeline bytes", TIMELINE.stat().st_size)
