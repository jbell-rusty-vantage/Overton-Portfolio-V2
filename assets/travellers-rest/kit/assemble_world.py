"""Assemble the whole continuous library as one Blender scene (Blender 5.2, headless).

    blender -b -P assets/travellers-rest/kit/assemble_world.py -- [--no-render]

Reads
    .local-library/estate/world.glb                     the shell as estate.py exported it
        (or public/travellers-rest/world-v2.glb when the unpacked export is absent)
    .local-library/kit/room-export.glb                  the code-built interior, from scripts/export-room.mjs
    assets/travellers-rest/kit/Travellers Rest - kit.blend
    assets/travellers-rest/anchors-v2.json
Writes
    assets/travellers-rest/Travellers Rest - continuous.blend
    docs/travellers-rest-review/kit/world-doorway.jpg, world-writing-table.jpg

The scene is a place to look and to model against, not a source of truth for the room:
remaining page/display props are generated from browser code; the room, trim and desk
come from the appended authored kit.
Edit kit pieces in the kit .blend (they are appended here), then rebuild.
House coordinates (x, y, z), Y up, south +Z, are (x, -z, y) in Blender.
"""
import json
import re
import sys
from math import radians
from pathlib import Path

import bpy
from mathutils import Vector

HERE = Path(__file__).resolve().parent
ASSETS = HERE.parent
ROOT = HERE.parents[2]
WORK = ROOT / ".local-library/kit"
REVIEW = ROOT / "docs/travellers-rest-review/kit"
ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.name = "Travellers Rest - continuous"
scene.unit_settings.system = "METRIC"
house = lambda x, y, z: Vector((x, -z, y))


def group(name, parent=None):
    c = bpy.data.collections.new(name)
    (parent or scene.collection).children.link(c)
    return c


def bring(path, collection):
    """Import a glTF file and move everything it made into one collection."""
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(path))
    made = [o for o in bpy.data.objects if o not in before]
    for obj in made:
        for owner in list(obj.users_collection):
            owner.objects.unlink(obj)
        collection.objects.link(obj)
    return made


# --- The shell: exterior and hall ------------------------------------------------------
shell = group("Shell - exterior and hall (from estate.py)")
unpacked = ROOT / ".local-library/estate/world-survey.glb"
if unpacked.exists():
    # The same list the packer uses to clear the southwest room for the live interior.
    packer = (ROOT / "scripts/pack-estate.mjs").read_text(encoding="utf8")
    interior = set(re.findall(r'"([^"]+)"', re.search(r"const interior = \[(.*?)\];", packer, re.S).group(1)))
    for obj in bring(unpacked, shell):
        base = re.sub(r"\.\d+$", "", obj.name)
        if (obj.type == "MESH" and base in interior) or (obj.type == "EMPTY" and re.fullmatch(r"[a-z]+\.[a-z]+", obj.name)):
            bpy.data.objects.remove(obj, do_unlink=True)
    for action in list(bpy.data.actions):
        bpy.data.actions.remove(action)
    shell["source"] = ".local-library/estate/world.glb minus the interior list in scripts/pack-estate.mjs"
else:
    bring(ROOT / "public/travellers-rest/world-v2.glb", shell)
    shell["source"] = "public/travellers-rest/world-v2.glb (packed)"
# As in the engine, the envelope does not shadow the room: the low sun enters by the
# openings of the code-built inner wall.
for obj in shell.objects:
    obj.visible_shadow = False

# --- The interior the browser builds in code ------------------------------------------
interior_set = group("Interior - GENERATED FROM CODE (re-export, do not edit)")
interior_set["source"] = "scripts/export-room.mjs -> .local-library/kit/room-export.glb"
superseded = group("Interior - superseded here by kit pieces (hidden)", interior_set)
for obj in bring(WORK / "room-export.glb", interior_set):
    if obj.name.startswith("Drawer"):
        interior_set.objects.unlink(obj)
        superseded.objects.link(obj)
        obj.hide_render = True
superseded.hide_render = True
superseded.hide_viewport = True
# Room trim now comes from single swept Blender profiles; no render-only shadow suppression.

# --- The kit, where the room puts each piece -------------------------------------------
with bpy.data.libraries.load(str(HERE / "Travellers Rest - kit.blend"), link=False) as (source, target):
    target.collections = ["Kit"]
kit = target.collections[0]
kit.name = "Kit - appended from kit/Travellers Rest - kit.blend"
scene.collection.children.link(kit)

# --- Anchors: camera stops and resting places ------------------------------------------
anchors = group("Visitor anchors (anchors-v2.json)")
points = json.loads((ASSETS / "anchors-v2.json").read_text())
for name, (x, y, z) in points.items():
    obj = bpy.data.objects.new(name, None)
    obj.empty_display_type = "CONE" if name.startswith("camera.") else "PLAIN_AXES"
    obj.empty_display_size = 0.12 if name.startswith("camera.") else 0.08
    obj.location = house(x, y, z)
    anchors.objects.link(obj)

# --- Light as the engine sets it, and two review cameras -------------------------------
review = group("Review - lights and cameras")


def lamp(name, kind, at, energy, color, **settings):
    data = bpy.data.lights.new(name, kind)
    data.energy, data.color = energy, color
    for key, value in settings.items():
        setattr(data, key, value)
    obj = bpy.data.objects.new(name, data)
    obj.location = at
    review.objects.link(obj)
    return obj


sun = lamp("Late sun (engine: 0.36, -0.56, -0.75)", "SUN", (-4.6, -8, 8), 7.0, (1, 0.81, 0.58), angle=radians(1.5))
sun.rotation_euler = Vector((0.36, 0.75, -0.56)).to_track_quat("-Z", "Y").to_euler()
lamp("Sky through the sashes", "POINT", house(-5.0, 2.5, 2.35), 180, (1, 0.945, 0.86), shadow_soft_size=0.5)
lamp("Return from the sunlit boards", "POINT", house(-5.1, 0.95, 0.4), 45, (1, 0.69, 0.45), shadow_soft_size=0.4)
lamp("Fire", "POINT", house(-6.95, 0.95, 0), 60, (1, 0.54, 0.24), shadow_soft_size=0.15)
lamp("Hall", "POINT", house(0.15, 3.05, 1.5), 220, (1, 0.9, 0.76), shadow_soft_size=0.4)
scene.world = bpy.data.worlds.new("Afternoon sky")
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.55, 0.68, 0.85, 1)
scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.2


def camera(name, at, target, fov):
    data = bpy.data.cameras.new(name)
    data.sensor_fit, data.angle_y, data.clip_start = "VERTICAL", radians(fov), 0.04
    obj = bpy.data.objects.new(name, data)
    obj.location = at
    obj.rotation_euler = (Vector(target) - Vector(at)).to_track_quat("-Z", "Y").to_euler()
    review.objects.link(obj)
    return obj


stills = [
    (camera("From the hall doorway", house(*points["camera.library"]), house(-7.4, 1.95, 0.1), 55), "world-doorway.jpg"),
    (camera("At the writing table", house(*points["camera.desk"]), house(-4.95, 1.34, 0.72), 55), "world-writing-table.jpg"),
]
scene.camera = stills[0][0]
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 96
scene.cycles.use_denoising = True
scene.render.resolution_x, scene.render.resolution_y = 1600, 1000
scene.render.image_settings.file_format = "JPEG"
scene.render.image_settings.quality = 90
scene.view_settings.exposure = 0.3

bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(ASSETS / "Travellers Rest - continuous.blend"), compress=True)
count = lambda c: len(c.all_objects)
print("WORLD shell", count(shell), "interior", count(interior_set), "kit", count(kit), "anchors", count(anchors))

if "--no-render" not in ARGS:
    REVIEW.mkdir(parents=True, exist_ok=True)
    for cam, name in stills:
        scene.camera = cam
        scene.render.filepath = str(REVIEW / name)
        bpy.ops.render.render(write_still=True)
        print("STILL", name)
