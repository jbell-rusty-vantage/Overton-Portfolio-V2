"""Inspection and in-room derivatives for objects handled in the continuous library.

Run from the repository root: python assets/travellers-rest/archive/prepare-world.py
Each held original yields a close-inspection WebP (longest edge up to 2400 px, never
enlarged) and a 640 px room texture. Letters are prepared separately and recorded in
letters.json. Output hashes and sizes are written to world-files.json.
"""
import hashlib, io, json
from pathlib import Path
from PIL import Image
import fitz

HERE = Path(__file__).resolve().parent
OUT = HERE.parents[2] / "public/travellers-rest/archive/world"
OUT.mkdir(parents=True, exist_ok=True)
Image.MAX_IMAGE_PIXELS = None

def pages(item):
    src = HERE / "originals" / item["asset"]
    if src.suffix == ".pdf":
        doc = fitz.open(src)
        for page in doc:
            pix = page.get_pixmap(matrix=fitz.Matrix(4, 4), alpha=False)
            yield Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
    else:
        yield Image.open(src).convert("RGB")

def save(image, name, edge, quality):
    scale = min(1, edge / max(image.size))
    if scale < 1:
        image = image.resize((round(image.width * scale), round(image.height * scale)), Image.LANCZOS)
    path = OUT / name
    image.save(path, "WEBP", quality=quality, method=6)
    data = path.read_bytes()
    return {"url": "/travellers-rest/archive/world/" + name, "pixels": list(image.size),
            "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}

catalog = json.loads((HERE / "catalog.json").read_text(encoding="utf8"))
record = {}
for item in catalog["plates"]:
    if item["id"] not in ("tennessee-map", "election-invitation", "andrew-jackson", "murfree-leeper"):
        continue
    record[item["id"]] = []
    for n, image in enumerate(pages(item), 1):
        stem = f'{item["id"]}-p{n:02d}'
        record[item["id"]].append({
            "page": n,
            "original": item["asset"],
            "full": save(image, stem + ".webp", 2400, 84),
            "small": save(image, stem + "-small.webp", 640, 72),
        })
(HERE / "world-files.json").write_text(json.dumps(record, indent=2) + "\n", encoding="utf8")
for key, rows in record.items():
    for r in rows:
        print(key, r["page"], r["full"]["pixels"], r["full"]["bytes"], r["small"]["bytes"])
