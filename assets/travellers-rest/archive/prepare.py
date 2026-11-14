"""Prepare web plates and a checksum inventory from the offline archive originals."""
import hashlib
import json
from pathlib import Path

import pymupdf
from PIL import Image, ImageOps

ARCHIVE = Path(__file__).resolve().parent
PUBLIC = ARCHIVE.parents[2] / "public" / "travellers-rest" / "archive"


def fingerprint(path):
    return {"bytes": path.stat().st_size, "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}


def prepare():
    records = json.loads((ARCHIVE / "catalog.json").read_text(encoding="utf-8"))
    PUBLIC.mkdir(parents=True, exist_ok=True)
    inventory = {}
    for plate in records["plates"]:
        source = ARCHIVE / "originals" / plate["asset"]
        entry = {"original": {"file": plate["asset"], **fingerprint(source)}}
        inventory[plate["id"]] = entry
        if source.suffix == ".pdf":
            with pymupdf.open(source) as doc:
                entry["original"]["pages"] = len(doc)
                if plate.get("referenceOnly"):
                    continue
                pix = doc[plate["page"] - 1].get_pixmap(matrix=pymupdf.Matrix(2, 2), alpha=False)
                image = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        else:
            with Image.open(source) as raster:
                entry["original"]["pixels"] = raster.size
                image = ImageOps.exif_transpose(raster).convert("RGB")
        image.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
        delivery = PUBLIC / (plate["id"] + ".webp")
        image.save(delivery, format="WEBP", quality=89, method=6)
        with Image.open(delivery) as verified:
            verified.load()
            entry["delivery"] = {"url": "/travellers-rest/archive/" + delivery.name,
                                 "pixels": verified.size, **fingerprint(delivery)}
    (ARCHIVE / "files.json").write_text(json.dumps(inventory, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    prepare()
