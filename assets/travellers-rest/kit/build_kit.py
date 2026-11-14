"""Build the Travellers Rest kit from nothing (Blender 5.2, headless).

    blender -b -P assets/travellers-rest/kit/build_kit.py -- [--quick] [--no-render]

Writes
    assets/travellers-rest/kit/Travellers Rest - kit.blend   editable source, named collections
    assets/travellers-rest/kit/source.json                    what Blender says each node is
    .local-library/kit/kit-export.glb                         unpacked export for scripts/pack-kit.mjs
    docs/travellers-rest-review/kit/kit-*.jpg                 review stills

Pieces stand where the live room (components/estate/world/engine/room.ts, `ROOM`) puts
their code-built counterparts, so a node's transform in the export is its place in the
house. House coordinates are metres, Y up, south +Z; Blender is Z up, north +Y:
(x, y, z) in the house is (x, -z, y) here. Names are lower-case and dotted and are the
contract with the engine: do not rename without updating props.ts and the tests.
`--quick` skips the occlusion bake and the stills.
"""
import json
import math
import sys
from math import cos, pi, radians, sin, tau
from pathlib import Path

import bpy
import numpy as np
from mathutils import Matrix, Vector

HERE = Path(__file__).resolve().parent
sys.dont_write_bytecode = True
sys.path.insert(0, str(HERE))
from kit_tools import G, Part, bark, brushed, edges, empty, hex_rgb, hide, image, instance, laid, material, to_house, wood  # noqa: E402
from baked_finishes import shader_finish
from room_assets import build_architecture

ROOT = HERE.parents[2]
WORK = ROOT / ".local-library/kit"
REVIEW = ROOT / "docs/travellers-rest-review/kit"
TEXTURES = WORK / "textures"
ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
QUICK = "--quick" in ARGS
for folder in (WORK, REVIEW):
    folder.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.name = "Travellers Rest kit"
scene.unit_settings.system = "METRIC"


def group(name, parent=None):
    c = bpy.data.collections.new(name)
    (parent or scene.collection).children.link(c)
    return c


KIT = group("Kit")
FURNITURE = group("Furniture", KIT)
DESK = group("Desk furniture", KIT)
HEARTH = group("Hearth", KIT)
JOINERY = group("Joinery", KIT)
MOULDINGS = group("Mouldings (stock)", KIT)
MOVING = group("Moving parts (stock)", KIT)
REVIEW_SET = group("Review (not exported)")

FLOOR = 0.53


def tooled_leather():
    """The writing surface: 1.26 m x 0.64 m of green hide with two gilt lines."""
    w, h = 1024, 512
    base = hide(1024, 31, "#27382b", 0.5)[:h]
    px = w / 1.26
    yy, xx = np.mgrid[0:h, 0:w]
    inset = np.minimum(np.minimum(xx, w - 1 - xx), np.minimum(yy, h - 1 - yy)) / px
    line = lambda at, width: np.clip(1.2 - np.abs(inset - at) / (width / 2), 0, 1)
    gilt = np.maximum(line(0.02, 0.004), line(0.031, 0.0016))[..., None]
    band = np.clip(1 - np.abs(inset - 0.0255) / 0.006, 0, 1)[..., None]
    color = base * (1 - 0.18 * band) * (1 - gilt) + hex_rgb("#c9a050")[None, None, :] * gilt
    orm = np.ones((h, w, 3), np.float32)
    orm[..., 1] = 0.72 - 0.4 * gilt[..., 0]
    orm[..., 2] = 0.9 * gilt[..., 0]
    return image("leather.tooled", color, TEXTURES), image("leather.tooled.orm", orm, TEXTURES, srgb=False)


leather_color, leather_orm = tooled_leather()
M = {
    "walnut": material("walnut", "#6b4428", 0.46, img=shader_finish("walnut", "#6b4428", 512, TEXTURES), finish="walnut", tile=0.7),
    "walnut.shaded": material("walnut.shaded", "#452a18", 0.5, img=shader_finish("walnut.shaded", "#452a18", 512, TEXTURES), finish="walnutDark", tile=0.7),
    "paint.joinery": material("paint.joinery", "#ddd5bd", 0.55, img=shader_finish("paint.joinery", "#ddd5bd", 256, TEXTURES, False), finish="trim"),
    "paint.door": material("paint.door", "#8c8d73", 0.62, img=shader_finish("paint.door", "#8c8d73", 256, TEXTURES, False), finish="dado"),
    "brass": material("brass", "#c49a48", 0.3, 0.85, finish="brass"),
    "pewter": material("pewter", "#9a9b9c", 0.36, 0.8, finish="pewter"),
    "iron": material("iron", "#1a1816", 0.7, 0.5, finish="iron"),
    "tallow": material("tallow", "#efe3c4", 0.6, finish="tallow", emission=((0.1, 0.04, 0.006), 0.25)),
    "quill": material("quill", "#efe8d6", 0.7, finish="quill", double=True),
    "ink": material("ink", "#0b0c10", 0.12),
    "leather.tooled": material("leather.tooled", "#27382b", 0.72, img=leather_color, orm=leather_orm),
    "leather.calf": material("leather.calf", "#5a2f1b", 0.55, img=image("leather.calf", hide(512, 41, "#5a2f1b"), TEXTURES), finish="calf", tile=0.5),
    "paper.leaves": material("paper.leaves", "#d9c9a0", 0.92, img=image("paper.leaves", edges(256, 21, "#d9c9a0"), TEXTURES), finish="leaves", tile=0.05),
    "paper.laid": material("paper.laid", "#e9dcb8", 0.9, img=image("paper.laid", laid(512, 19, "#e9dcb8"), TEXTURES), finish="paper", tile=0.4, double=True),
    "bark": material("bark", "#4a3b30", 1.0, img=image("bark", bark(512, 61), TEXTURES), finish="log", tile=0.5),
}
W, D, P, BRASS = M["walnut"], M["walnut.shaded"], M["paint.joinery"], M["brass"]


def place(obj, house, yaw=0.0):
    obj.location = G(*house)
    obj.rotation_euler = (0, 0, yaw)
    return obj


def tag(obj, piece, role="placed", **motion):
    """role: placed (rests in the room), moving (authored to move), stock (reusable)."""
    obj["kit_piece"], obj["kit_role"] = piece, role
    for key, value in motion.items():
        obj["kit_" + key] = value
    return obj


def child(obj, parent, location=(0, 0, 0)):
    obj.parent = parent
    obj.location = location
    return obj


def toward_room(at):
    """Places a turning on a vertical face: its axis runs out toward -Y."""
    return Matrix.Translation(at) @ Matrix.Rotation(pi / 2, 4, "X")


KNOB = [(0.006, 0), (0.006, 0.006), (0.0045, 0.01), (0.008, 0.013), (0.0125, 0.018), (0.0135, 0.023), (0.011, 0.028), (0.006, 0.0305), (0, 0.031)]


# --- Windsor chair --------------------------------------------------------------------

def windsor():
    root = tag(place(empty("chair.windsor", FURNITURE), (-4.5, FLOOR, -0.12), 0.32), "chair.windsor")
    p = Part(0.7)
    n = 48

    def rim(a):
        c, s = cos(a), sin(a)
        e = 2 / 2.5
        return math.copysign(abs(c) ** e, c) * 0.235, math.copysign(abs(s) ** e, s) * (0.215 if s > 0 else 0.2)

    def saddle(rho, a):
        return 0.46 - 0.014 * (1 - min(1, rho / 0.9745) ** 3) * (1 - 0.8 * max(0, -sin(a)) ** 3 * min(1, rho * 1.6))

    def ring(rho, z):
        return [(rim(tau * j / n)[0] * rho, rim(tau * j / n)[1] * rho, z(rho, tau * j / n) if callable(z) else z) for j in range(n)]

    rings = [[(0, 0, 0.415)], ring(0.86, 0.415), ring(0.989, 0.436), ring(1.0, 0.444), ring(1.002, 0.452), ring(1.0, 0.457), ring(0.9915, 0.4595), ring(0.9745, 0.46)]
    rings += [ring(r, saddle) for r in (0.9, 0.78, 0.62, 0.44, 0.25)] + [[(0, 0, saddle(0, 0))]]
    p.rings(rings, W, grain="x")
    child(tag(p.build("chair.windsor.seat", FURNITURE, "turned", sharp=50), "chair.windsor"), root)

    p = Part(0.7)
    leg = [(0, 0.011), (0.02, 0.0125), (0.2, 0.017), (0.26, 0.0185), (0.3, 0.0125), (0.33, 0.0165), (0.36, 0.012), (0.45, 0.0155), (0.62, 0.022), (0.75, 0.0175), (0.82, 0.0125), (0.85, 0.017), (0.88, 0.012), (1, 0.013)]
    swell = [(0, 0.008), (0.1, 0.009), (0.3, 0.014), (0.5, 0.0165), (0.7, 0.014), (0.9, 0.009), (1, 0.008)]
    bead = [(0, 0.008), (0.2, 0.0095), (0.27, 0.014), (0.3, 0.0095), (0.5, 0.0155), (0.7, 0.0095), (0.73, 0.014), (0.8, 0.0095), (1, 0.008)]
    joint = {}
    for sx in (-1, 1):
        for front in (True, False):
            foot = Vector((sx * 0.235, -0.215, 0)) if front else Vector((sx * 0.215, 0.25, 0))
            head = Vector((sx * 0.165, -0.14, 0.43)) if front else Vector((sx * 0.15, 0.15, 0.43))
            p.turned(foot, head, leg, W, 16)
            joint[sx, front] = foot + (head - foot) * 0.33
        p.turned(joint[sx, True], joint[sx, False], swell, W, 10)
    p.turned((joint[-1, True] + joint[-1, False]) / 2, (joint[1, True] + joint[1, False]) / 2, bead, W, 10)
    child(tag(p.build("chair.windsor.undercarriage", FURNITURE, "turned"), "chair.windsor"), root)

    # The back: every spindle is a straight line from its seat socket through the arm
    # rail, and the bow is drawn through their upper ends.
    arm = lambda a: Vector((0.25 * cos(a), 0.02 + 0.2 * sin(a), 0.675))
    socket = lambda a: Vector((0.195 * cos(a), 0.17 * sin(a), 0.45))
    a0, a1 = radians(24), radians(156)

    def bow(a):
        h = 0.675 + 0.36 * max(0, sin(pi * (a - a0) / (a1 - a0))) ** 0.7
        return socket(a) + (arm(a) - socket(a)) * ((h - 0.45) / 0.225)

    def rail(i, f):
        edge = min(f, 1 - f)
        tip = max(0, 1 - edge / 0.09)
        close = 1 - 0.45 * max(0, 1 - edge / 0.012)
        return 0.009 * close, (0.013 + 0.011 * tip * tip * (3 - 2 * tip)) * close

    p = Part(0.7)
    p.tube([arm(radians(-28 + 236 * i / 44)) for i in range(45)], rail, W, 10)
    p.tube([bow(a0 + (a1 - a0) * i / 40) for i in range(41)], 0.0085, W, 10, ref=(0, 1, 0), caps=False)
    for d in (-51, -34, -17, 0, 17, 34, 51):
        a = radians(90 + d)
        p.turned(socket(a) - (arm(a) - socket(a)) * 0.06, bow(a), [(0, 0.0055), (0.12, 0.0075), (0.3, 0.0065), (1, 0.004)], W, 8)
    for d in (-70, 70):
        a = radians(90 + d)
        p.turned(socket(a) - (arm(a) - socket(a)) * 0.06, arm(a), [(0, 0.0055), (0.3, 0.0075), (1, 0.005)], W, 6)
    post = [(0, 0.008), (0.15, 0.012), (0.3, 0.016), (0.45, 0.011), (0.5, 0.014), (0.55, 0.0105), (1, 0.008)]
    for a in (radians(-8), radians(188)):
        p.turned(Vector((0.2 * cos(a), 0.17 * sin(a), 0.438)), arm(a), post, W, 10)
    child(tag(p.build("chair.windsor.back", FURNITURE, "turned"), "chair.windsor"), root)


# --- Writing table --------------------------------------------------------------------

def writing_table():
    root = tag(place(empty("table.writing", FURNITURE), (-4.95, FLOOR, 0.75)), "table.writing")
    p = Part(0.7)
    edge = [(-0.014, 0.78), (-0.004, 0.78), (0, 0.784), (0, 0.797), (-0.0015, 0.803), (-0.005, 0.807), (-0.011, 0.8095), (-0.018, 0.81)]
    p.sweep(edge, [(-0.8, -0.45), (0.8, -0.45), (0.8, 0.45), (-0.8, 0.45)], W, closed=True, cap_first=True, cap_last=True)
    child(tag(p.build("table.writing.top", FURNITURE, "turned"), "table.writing"), root)

    p = Part(1)
    for f in p.box(-0.63, 0.63, -0.32, 0.32, 0.8098, 0.8112, M["leather.tooled"], bevel=False):
        for loop in f.loops:
            loop[p.uv].uv = ((loop.vert.co.x + 0.63) / 1.26, (loop.vert.co.y + 0.32) / 0.64)
    child(tag(p.build("table.writing.leather", FURNITURE, "flat"), "table.writing"), root)

    p = Part(0.7)
    for sx in (-1, 1):
        for sy in (-1, 1):
            def quad(size, z, ox=sx * 0.738, oy=sy * 0.388, sx=sx, sy=sy):
                xs, ys = sorted((ox, ox - sx * size)), sorted((oy, oy - sy * size))
                return [(xs[0], ys[0], z), (xs[1], ys[0], z), (xs[1], ys[1], z), (xs[0], ys[1], z)]
            p.hexa(quad(0.027, 0), quad(0.046, 0.78), W, "z")
        p.box(sx * 0.714, sx * 0.734, -0.35, 0.35, 0.67, 0.78, W)
        p.box(sx * 0.35, sx * 0.70, -0.384, -0.364, 0.67, 0.78, W)
        p.box(sx * 0.352, sx * 0.372, -0.364, 0.3, 0.672, 0.692, D)
    p.box(-0.70, 0.70, 0.364, 0.384, 0.67, 0.78, W)
    p.box(-0.35, 0.35, -0.384, -0.364, 0.767, 0.78, W)
    p.box(-0.35, 0.35, -0.384, -0.364, 0.67, 0.692, W)
    child(tag(p.build("table.writing.frame", FURNITURE, "hard", 0.0015), "table.writing"), root)

    # The drawer's origin is on its runner, at the mouth: it slides south along house +Z.
    p = Part(0.7)
    p.box(-0.348, 0.348, 0, 0.018, 0.0015, 0.0735, W, "x")
    for sx in (-1, 1):
        p.box(sx * 0.336, sx * 0.346, 0.018, 0.42, 0.004, 0.06, D, "y")
    p.box(-0.336, 0.336, 0.41, 0.42, 0.004, 0.06, D, "x")
    p.box(-0.336, 0.336, 0.018, 0.41, 0.004, 0.01, D, "x")
    p.lathe(KNOB, BRASS, 14, toward_room((0, 0, 0.0375)))
    drawer = p.build("table.writing.drawer", FURNITURE, "hard", 0.001)
    child(tag(drawer, "table.writing", motion="slide", axis=[0, 0, 1], travel=0.3), root, (0, -0.384, 0.692))


# --- Candlesticks, inkwell, quills, pounce pot ----------------------------------------

def candlesticks():
    stick = [(0, 0), (0.046, 0), (0.052, 0.003), (0.052, 0.008), (0.047, 0.012), (0.036, 0.016), (0.026, 0.022), (0.018, 0.031), (0.0125, 0.045), (0.0115, 0.058), (0.015, 0.066), (0.019, 0.074), (0.019, 0.082), (0.014, 0.09), (0.0105, 0.1), (0.0095, 0.13), (0.0105, 0.17), (0.012, 0.186), (0.018, 0.193), (0.025, 0.198), (0.027, 0.203), (0.0255, 0.208), (0.016, 0.212), (0.0135, 0.218), (0.0115, 0.218), (0.0115, 0.2), (0, 0.2)]
    h = 0.2
    taper = [(0, -0.016), (0.0098, -0.016), (0.0098, 0), (0.0102, 0.02), (0.0098, h - 0.006), (0.0088, h - 0.0015), (0.005, h), (0.002, h - 0.0012), (0, h - 0.0018)]
    first = None
    for name, at, height in (
        ("candlestick.mantel.north", (-7.64, 1.965, -0.98), 0.2),
        ("candlestick.mantel.south", (-7.64, 1.965, 0.98), 0.2),
        ("candlestick.table", (-5.58, 1.34, 0.47), 0.15),
        ("candlestick.chest", (-3.45, 1.42, -2.76), 0.17),
    ):
        if first is None:
            p = Part()
            p.lathe(stick, BRASS, 24)
            body = first = p.build(name, DESK, "turned")
            p = Part()
            p.lathe(taper, M["tallow"], 12)
            p.tube([(0, 0, h - 0.002), (0.0004, 0, h + 0.004), (0.0018, 0, h + 0.009)], 0.0011, M["iron"], 5, ref=(0, 1, 0))
            candle = wax = p.build(name + ".taper", DESK, "turned")
        else:
            body, candle = instance(first, name, DESK), instance(wax, name + ".taper", DESK)
        tag(place(body, at), name)
        child(tag(candle, name), body, (0, 0, 0.218)).scale = (1, 1, height / h)
        child(tag(empty(name + ".flame", DESK, 0.02, "SPHERE"), name), body, (0, 0, 0.245 + height))


def inkwell():
    p = Part()
    p.lathe([(0, 0), (0.052, 0), (0.056, 0.003), (0.056, 0.008), (0.05, 0.012), (0.043, 0.016), (0.041, 0.03), (0.042, 0.045), (0.038, 0.056), (0.028, 0.064), (0.022, 0.068), (0.022, 0.072), (0.026, 0.075), (0.026, 0.079), (0.021, 0.081), (0.016, 0.081), (0.016, 0.0625)], M["pewter"], 28)
    p.lathe([(0.016, 0.0625), (0, 0.0625)], M["ink"], 28)
    well = tag(place(p.build("inkwell", DESK, "turned"), (-4.38, 1.34, 1.02)), "inkwell")
    for name, azimuth, tilt in (("inkwell.quill.a", 0.5, 0.42), ("inkwell.quill.b", -0.4, 0.3)):
        p = Part()
        spine = lambda s: Vector((0.012 * s * s, 0, 0.3 * s))
        p.tube([spine(i / 10) for i in range(11)], lambda i, f: (0.0028 - 0.0019 * f,) * 2, M["quill"], 6, ref=(0, 1, 0))
        rows = []
        for i in range(15):
            s = 0.3 + 0.7 * i / 14
            w = 0.017 * sin(pi * ((s - 0.3) / 0.7) ** 0.75) ** 0.8
            c = spine(s)
            rows.append((c + Vector((0.25 * w, w, 0)), c, c + Vector((0.25 * w, -w, 0))))
        verts = [[p.bm.verts.new(v) for v in row] for row in rows]
        for i in range(14):
            for side in (0, 1):
                a, b, c, d = verts[i][side], verts[i][side + 1], verts[i + 1][side + 1], verts[i + 1][side]
                p.face([a, b, c, d], M["quill"], [(side * 0.5, i / 14), (side * 0.5 + 0.5, i / 14), (side * 0.5 + 0.5, (i + 1) / 14), (side * 0.5, (i + 1) / 14)], curved=True)
        quill = child(tag(p.build(name, DESK, "turned"), "inkwell"), well, (0, 0, 0.058))
        lean = Vector((sin(tilt) * sin(azimuth), -sin(tilt) * cos(azimuth), cos(tilt)))
        quill.rotation_mode = "QUATERNION"
        quill.rotation_quaternion = lean.to_track_quat("Z", "Y")
    p = Part(0.7)
    p.lathe([(0, 0), (0.026, 0), (0.0285, 0.004), (0.0285, 0.012), (0.025, 0.02), (0.0235, 0.035), (0.027, 0.048), (0.03, 0.056), (0.03, 0.06), (0.026, 0.062), (0.02, 0.058), (0, 0.055)], D, 20)
    tag(place(p.build("pounce.pot", DESK, "turned"), (-4.52, 1.34, 1.07)), "pounce.pot")


# --- Mantel and hearth furniture ------------------------------------------------------

def mantel():
    """Stands on the chimney breast (house x = -7.47), projecting east into the room."""
    root = tag(place(empty("mantel", HEARTH), (-7.76, FLOOR, 0)), "mantel")
    wrap = [(0, -0.23), (0.085, -0.23), (0.085, 0.23), (0, 0.23)]
    p = Part()
    p.box(0, 0.115, -0.26, 0.26, 0, 0.17, P, "y")
    p.sweep([(0.03, 0.17), (0.03, 0.176), (0.024, 0.184), (0.012, 0.19), (0.006, 0.196), (0, 0.2)], wrap, P)
    z0, z1, zb, zt = 0.2, 0.965, 0.27, 0.9
    p.face([p.bm.verts.new(v) for v in ((0, -0.23, z0), (0.085, -0.23, z0), (0.085, -0.23, z1), (0, -0.23, z1))], P, grain="z", curved=True)
    p.face([p.bm.verts.new(v) for v in ((0.085, 0.23, z0), (0, 0.23, z0), (0, 0.23, z1), (0.085, 0.23, z1))], P, grain="z", curved=True)

    def front(y0, y1, za, zc):
        p.face([p.bm.verts.new(v) for v in ((0.085, y0, za), (0.085, y1, za), (0.085, y1, zc), (0.085, y0, zc))], P, grain="z", curved=True)

    front(-0.23, 0.23, z0, zb)
    front(-0.23, 0.23, zt, z1)
    centres = [-0.136, -0.068, 0, 0.068, 0.136]
    lands = [-0.23] + [c + s * 0.022 for c in centres for s in (-1, 1)] + [0.23]
    for i in range(0, len(lands), 2):
        front(lands[i], lands[i + 1], zb, zt)
    for c in centres:
        channel = [(0.085 - 0.012 * sin(pi * k / 6), c - 0.022 * cos(pi * k / 6)) for k in range(7)]
        low = [p.bm.verts.new((x, y, zb)) for x, y in channel]
        high = [p.bm.verts.new((x, y, zt)) for x, y in channel]
        for k in range(6):
            p.face([low[k], low[k + 1], high[k + 1], high[k]], P, grain="z", curved=True)
        p.face([p.bm.verts.new(v.co) for v in low][::-1], P, grain="y", curved=True)
        p.face([p.bm.verts.new(v.co) for v in high], P, grain="y", curved=True)
    capital = [(0, 0.965), (0.005, 0.967), (0.008, 0.972), (0.008, 0.978), (0.005, 0.983), (0, 0.985), (0, 1.0), (0.003, 1.004), (0.004, 1.02), (0.008, 1.032), (0.016, 1.04), (0.02, 1.046), (0.02, 1.07), (0, 1.07)]
    p.sweep(capital, wrap, P)
    north = child(tag(p.build("mantel.pilaster.north", HEARTH, "hard", 0.002), "mantel"), root, (0, 0.93, 0))
    child(tag(instance(north, "mantel.pilaster.south", HEARTH), "mantel"), root, (0, -0.93, 0))

    p = Part()
    p.box(0, 0.085, -1.16, 1.16, 1.07, 1.33, P, "y")
    face = Matrix(((0, 0, 1, 0.085), (1, 0, 0, 0), (0, 1, 0, 0), (0, 0, 0, 1)))
    p.sweep([(0, 0), (0, 0.006), (-0.004, 0.011), (-0.012, 0.015)], [(-0.5, 1.13), (0.5, 1.13), (0.5, 1.27), (-0.5, 1.27)], P, closed=True, M=face, cap_last=True, grain="y")
    child(tag(p.build("mantel.frieze", HEARTH, "hard", 0.002), "mantel"), root)

    # Bed mouldings and shelf in one run, returned into the wall at both ends.
    p = Part()
    bed = [(0, 1.32), (0.006, 1.32), (0.006, 1.328), (0.01, 1.332), (0.017, 1.342), (0.029, 1.349), (0.036, 1.358), (0.037, 1.366), (0.043, 1.366), (0.043, 1.374), (0.052, 1.377), (0.063, 1.385), (0.069, 1.396), (0.07, 1.405), (0.121, 1.405), (0.124, 1.409), (0.125, 1.42), (0.123, 1.431), (0.118, 1.435)]
    p.sweep(bed, [(0, -1.16), (0.085, -1.16), (0.085, 1.16), (0, 1.16)], P, cap_last=True, grain="y")
    child(tag(p.build("mantel.shelf", HEARTH, "turned"), "mantel"), root)


def hearth():
    p = Part()
    arch = [(0, 0.09 * cos(pi * i / 14), 0.01 + 0.085 * sin(pi * i / 14) ** 0.8) for i in range(15)]
    p.tube(arch, 0.0115, M["iron"], 4, ref=(1, 0, 0), phase=pi / 4)
    p.box(-0.011, 0.011, -0.011, 0.011, 0.085, 0.29, M["iron"])
    p.box(-0.37, 0.005, -0.009, 0.009, 0.07, 0.088, M["iron"])
    p.box(-0.37, -0.352, -0.009, 0.009, -0.015, 0.07, M["iron"])
    p.lathe([(0, 0.288), (0.02, 0.288), (0.026, 0.296), (0.02, 0.303), (0.011, 0.31), (0.012, 0.325), (0.022, 0.336), (0.032, 0.352), (0.035, 0.368), (0.03, 0.384), (0.018, 0.397), (0.008, 0.404), (0.006, 0.412), (0.011, 0.418), (0.011, 0.426), (0, 0.432)], BRASS, 20)
    north = tag(place(p.build("andiron.north", HEARTH, "hard", 0.0015), (-7.228, 0.565, -0.36)), "andiron.north")
    tag(place(instance(north, "andiron.south", HEARTH), (-7.228, 0.565, 0.36)), "andiron.south")
    for k, (name, z, r, x, y) in enumerate((("hearth.log.a", -0.02, 0.07, -7.56, 0.66), ("hearth.log.b", 0.05, 0.06, -7.42, 0.65), ("hearth.log.c", 0.0, 0.055, -7.5, 0.76))):
        rand = np.random.default_rng(700 + k)
        phases = rand.random(4) * tau
        p = Part(0.5)
        rings = []
        for i in range(10):
            y_at = -0.43 + 0.86 * i / 9
            bend = 0.012 * sin(pi * i / 9 + phases[3])
            ring = []
            for j in range(12):
                a = tau * j / 12
                rr = r * (1 - 0.06 * i / 9) * (1 + 0.07 * sin(3 * a + phases[0] + i * 0.3) + 0.045 * sin(7 * a + phases[1]) + 0.03 * sin(2 * a + phases[2] + i))
                ring.append((rr * cos(a) + bend, y_at, -rr * sin(a)))
            rings.append(ring)
        rings = [[(0, -0.43, 0)]] + rings + [[(0, 0.43, 0)]]
        p.rings(rings, M["bark"], grain="y")
        tag(place(p.build(name, HEARTH, "turned", sharp=50), (x, y, z), (z - 0.02) * 2.4), name)


# --- Joinery: sash windows, the six-panel door, stock mouldings -----------------------

def sashes():
    wide, total = 0.945, 1.81
    for side, centre in (("west", -6.03), ("east", -3.55)):
        name = "window.sash." + side
        root = tag(place(empty(name, JOINERY), (centre, 1.37, 2.957)), name)
        for part, rows, high, bottom, depth in (("lower", 3, total*3/7+.02, 0, 0.0005), ("upper", 4, total*4/7+.02, total*3/7-.02, -.0245)):
            p=Part()
            for x in (-wide/2, wide/2-.04):
                p.box(x, x+.04, 0, .024, 0, high, P, "z")
            for z in (0, high-.04):
                p.box(-wide/2+.04, wide/2-.04, 0, .024, z, z+.04, P, "x")
            for k in range(1,4):
                x=-wide/2+wide*k/4
                p.box(x-.008,x+.008,0,.023,.04,high-.04,P,"z")
            for k in range(1,rows):
                z=high*k/rows
                p.box(-wide/2+.04,wide/2-.04,0,.023,z-.008,z+.008,P,"x")
            sash=p.build(name+"."+part,JOINERY,"hard",.001)
            child(tag(sash,name,motion="slide",axis=[0,1 if part=="lower" else -1,0],travel=.6),root,(0,depth,bottom))


def door():
    """The six-panel door to the ell in the north wall. Origin on the hinge edge."""
    wide, high, th = 1.18, 2.19, 0.034
    paint = M["paint.door"]
    face = Matrix(((1, 0, 0, 0), (0, 0, -1, -th), (0, 1, 0, 0), (0, 0, 0, 1)))
    xs = [0, 0.115, 0.5325, 0.6475, 1.065, wide]
    zs = [0, 0.22, 0.78, 0.94, 1.5, 1.63, 2.07, high]
    field = [(0, 0), (-0.004, -0.001), (-0.008, -0.004), (-0.011, -0.008), (-0.012, -0.012), (-0.022, -0.012), (-0.07, -0.003)]
    p = Part()
    for i in range(5):
        for j in range(7):
            x0, x1, z0, z1 = xs[i], xs[i + 1], zs[j], zs[j + 1]
            if i in (1, 3) and j in (1, 3, 5):
                p.sweep(field, [(x0, z0), (x1, z0), (x1, z1), (x0, z1)], paint, closed=True, M=face, cap_last=True, grain="z")
            else:
                quad = [p.bm.verts.new(face @ Vector(v)) for v in ((x0, z0, 0), (x1, z0, 0), (x1, z1, 0), (x0, z1, 0))]
                p.face(quad, paint, grain="z" if i in (0, 4) or (i == 2 and j % 2) else "x", curved=True)
    p.face([p.bm.verts.new(v) for v in ((0, 0, 0), (0, -th, 0), (0, -th, high), (0, 0, high))], paint, grain="z", curved=True)
    p.face([p.bm.verts.new(v) for v in ((wide, -th, 0), (wide, 0, 0), (wide, 0, high), (wide, -th, high))], paint, grain="z", curved=True)
    p.face([p.bm.verts.new(v) for v in ((0, -th, high), (wide, -th, high), (wide, 0, high), (0, 0, high))], paint, grain="x", curved=True)
    rose = [(0, 0), (0.026, 0), (0.026, 0.003), (0.02, 0.005), (0.009, 0.008), (0.008, 0.022), (0.014, 0.028), (0.024, 0.036), (0.028, 0.046), (0.024, 0.056), (0.012, 0.062), (0, 0.063)]
    p.lathe(rose, BRASS, 20, toward_room((wide - 0.1, -th, 0.99)))
    leaf = p.build("door.ell", JOINERY, "turned")
    leaf.scale.x = 1.0 / wide
    tag(place(leaf, (-5.65, FLOOR, -3.0)), "door.ell", motion="hinge", axis=[0, 1, 0], travel=1.4)


def mouldings():
    """One-metre runs of the room's three profiles, for reuse along any wall."""
    profiles = {
        "moulding.chair-rail": [(0, 0), (0.01, 0.002), (0.014, 0.008), (0.014, 0.014), (0.02, 0.018), (0.028, 0.024), (0.03, 0.031), (0.028, 0.038), (0.02, 0.044), (0.014, 0.048), (0.014, 0.054), (0.01, 0.06), (0, 0.062)],
        "moulding.skirting": [(0, 0), (0.034, 0), (0.034, 0.15), (0.031, 0.158), (0.024, 0.165), (0.02, 0.175), (0.019, 0.186), (0.014, 0.194), (0.006, 0.199), (0, 0.2)],
        "moulding.cornice": [(0, 0), (0.01, 0), (0.01, 0.012), (0.016, 0.016), (0.024, 0.03), (0.026, 0.035), (0.03, 0.05), (0.04, 0.062), (0.052, 0.07), (0.058, 0.08), (0.06, 0.085), (0.066, 0.085), (0.066, 0.095), (0.074, 0.1), (0.081, 0.108), (0.085, 0.118), (0.085, 0.135), (0, 0.135)],
    }
    for k, (name, profile) in enumerate(profiles.items()):
        p = Part()
        g = p.sweep(profile, [(0, 0), (1, 0)], P, ends=True)
        p.face([g[0][0], g[0][-1], g[1][-1], g[1][0]], P, grain="x", curved=True)
        obj = tag(p.build(name, MOULDINGS, "turned"), name, "stock")
        obj.location = (-5.9, 5.3 + 0.3 * [0, 2, 1][k], 0)


# --- Chest of drawers -----------------------------------------------------------------

def chest():
    root = tag(place(empty("chest", FURNITURE), (-2.95, FLOOR, -2.7425)), "chest")
    back, front = 0.2425, -0.2425
    p = Part(0.7)
    lip = [(-0.012, 0.86), (-0.004, 0.86), (0, 0.864), (0, 0.876), (-0.002, 0.884), (-0.007, 0.889), (-0.014, 0.89)]
    p.sweep(lip, [(-0.665, front - 0.02), (0.665, front - 0.02), (0.665, back), (-0.665, back)], W, closed=True, cap_first=True, cap_last=True)
    for sx in (-1, 1):
        p.box(sx * 0.62, sx * 0.65, front, back, 0.08, 0.86, W, "z")
    p.box(-0.62, 0.62, back - 0.015, back, 0.08, 0.86, D, "x")
    p.box(-0.62, 0.62, front, back - 0.015, 0.08, 0.11, W, "x")
    for z in (0.34, 0.595):
        p.box(-0.62, 0.62, front, back - 0.015, z - 0.012, z + 0.012, W, "x")
    bracket = [(0, 0), (0.03, 0), (0.036, 0.02), (0.05, 0.042), (0.08, 0.058), (0.11, 0.064), (0.13, 0.08), (0, 0.08)]
    for sx in (-1, 1):
        p.extrude(bracket, (sx * 0.65, front + (0.022 if sx < 0 else 0), 0), (-sx, 0, 0), (0, 0, 1), 0.022, D, "x")
        p.extrude(bracket, (sx * 0.65 if sx < 0 else 0.628, front, 0), (0, 1, 0), (0, 0, 1), 0.022, D, "y")
        p.extrude(bracket, (-0.628 if sx < 0 else 0.65, back, 0), (0, -1, 0), (0, 0, 1), 0.022, D, "y")
    child(tag(p.build("chest.carcass", FURNITURE, "hard", 0.0015), "chest"), root)

    for name, z0, h, travel in (("correspondence", 0.607, 0.253, 0.3), ("campaign", 0.352, 0.231, 0.52), ("lower", 0.12, 0.2, 0.0)):
        p = Part(0.7)
        p.box(-0.608, 0.608, 0, 0.022, 0, h, W, "x")
        for sx in (-1, 1):
            p.box(sx * 0.596, sx * 0.608, 0.022, 0.44, 0.01, h - 0.03, D, "y")
            p.lathe(KNOB, BRASS, 14, toward_room((sx * 0.38, 0, h / 2)))
        p.box(-0.596, 0.596, 0.428, 0.44, 0.01, h - 0.03, D, "x")
        p.box(-0.596, 0.596, 0.022, 0.428, 0.01, 0.02, D, "x")
        p.box(-0.594, 0.594, 0.024, 0.426, 0.02, 0.0206, M["paper.laid"], "x", bevel=False)
        drawer = p.build("chest.drawer." + name, FURNITURE, "hard", 0.001)
        motion = dict(motion="slide", axis=[0, 0, 1], travel=travel) if travel else {}
        child(tag(drawer, "chest", "moving" if travel else "placed", **motion), root, (0, front, z0))


# --- Pieces authored to move: the book and the letter ---------------------------------

def book():
    """A bound volume in the frame the live Volume3D uses once exported: X across the
    page (spine at -X), Y up the page, front cover toward -Z (here: +Y)."""
    wide, high, thick, board, over = 0.2, 0.285, 0.034, 0.0042, 0.006
    root = tag(empty("book", MOVING), "book", "stock")
    root.location = (-4.55, 5.65, high / 2 + over)
    root.rotation_euler = (0, 0, radians(205))
    calf = M["leather.calf"]
    p = Part(0.05)
    for f in p.box(-wide / 2, wide / 2, -thick / 2, thick / 2, -high / 2, high / 2, M["paper.leaves"], bevel=False):
        if abs(f.normal.y) > 0.5 or f.normal.x < -0.5:
            f.material_index = p.slot(M["paper.laid"])
        p.box_uv(f, "z" if abs(f.normal.x) > 0.5 else "x")
    child(tag(p.build("book.block", MOVING, "flat"), "book", "moving"), root)
    for name, side in (("book.board.front", 1), ("book.board.back", -1)):
        p = Part(0.5)
        p.box(0, wide + over, -board / 2, board / 2, -high / 2 - over, high / 2 + over, calf, "z")
        cover = p.build(name, MOVING, "hard", 0.0008)
        child(tag(cover, "book", "moving", motion="hinge", axis=[0, side, 0], travel=pi), root, (-wide / 2, side * (thick / 2 + board / 2), 0))
    p = Part(0.5)
    reach = thick / 2 + board
    curve = [(-0.0065 * cos(a), reach * sin(a)) for a in (radians(90 - 180 * i / 12) for i in range(13))]
    rise = [(0, -high / 2 - over)]
    for band in (-0.105, -0.055, 0.03, 0.075, 0.115):
        rise += [(0, band - 0.004), (0.0015, band - 0.0025), (0.0015, band + 0.0025), (0, band + 0.004)]
    rise.append((0, high / 2 + over))
    p.sweep(rise, curve, calf, cap_first=True, cap_last=True, grain="y")
    child(tag(p.build("book.spine", MOVING, "turned"), "book", "moving"), root, (-wide / 2, 0, 0))
    child(tag(empty("book.pivot.gutter", MOVING, 0.05, "SINGLE_ARROW"), "book", "moving", motion="gutter", axis=[0, 1, 0]), root, (-wide / 2, 0, 0))


def letter():
    """A letter sheet lying flat: folded in three and once down the middle, long since
    opened, with one corner lifting. UVs span the sheet so a scan maps straight on."""
    wide, long, cols, rows = 0.2, 0.25, 12, 18
    p = Part()
    grid = []
    for j in range(rows + 1):
        row = []
        for i in range(cols + 1):
            x, y = wide * (i / cols - 0.5), long * (j / rows - 0.5)
            panel = (j / rows * 3) % 1
            z = 0.0025 * sin(pi * panel) + 0.0012 * abs(x) / (wide / 2) + 0.0035 * (y / (long / 2)) ** 2
            z += 0.007 * max(0, (x / (wide / 2)) * (y / (long / 2))) ** 3 + 0.003 * max(0, -(x / (wide / 2)) * (y / (long / 2))) ** 4
            row.append(p.bm.verts.new((x, y, z)))
        grid.append(row)
    for j in range(rows):
        for i in range(cols):
            uv = lambda a, b: (a / cols, b / rows)
            p.face([grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]], M["paper.laid"], [uv(i, j), uv(i + 1, j), uv(i + 1, j + 1), uv(i, j + 1)], curved=True)
    sheet = tag(p.build("letter.sheet", MOVING, "turned", sharp=8), "letter.sheet", "stock")
    sheet.location = (-4.5, 5.2, 0.002)


def bookcases():
    """The two live shelf carcasses, with the exact shelf/monitor apertures of ROOM."""
    for name,z0,z1,shelves,desk in (("bookcase.law",-2.92,-1.33,[1.63,1.99,2.35],False),("bookcase.family",1.33,2.92,[1.6,1.97,2.33],True)):
        p=Part(.6)
        # Build in house coordinates then convert the box axes into Blender's frame.
        def span(x0,x1,y0,y1,a0,a1,material=W): p.box(x0,x1,-a1,-a0,y0,y1,material,"z")
        back,front=-7.76,-7.4
        lower=front+.2 if desk else front+.03
        span(back,back+.018,FLOOR,2.74,z0,z1,D)
        for z in (z0,z1-.036):
            span(back,front,1.27,2.74,z,z+.036)
            span(back,lower,FLOOR,1.27,z,z+.036)
        span(back,lower+.012,FLOOR,FLOOR+.1,z0,z1)
        span(back,lower+.03,1.23,1.27,z0-.012,z1+.012)
        for y in shelves:
            end=2.185 if desk and y<1.97 else z1-.036
            span(back,front-.012,y-.024,y,z0+.036,end)
        if desk: span(back,front-.012,1.27,1.97,2.185,2.209)
        mid=(z0+z1)/2
        for a0,a1 in ((z0+.036,mid-.004),(mid+.004,z1-.036)):
            span(lower-.022,lower,FLOOR+.1,1.23,a0,a1)
        # Case cornice is furniture, distinct from the absent room cornice.
        for y0,y1,depth in ((2.7,2.74,.018),(2.74,2.775,.045),(2.775,2.8,.07)):
            span(back,front+depth,y0,y1,z0-.04,z1+.04)
        tag(p.build(name,FURNITURE,"hard",.001),name)

windsor()
writing_table()
candlesticks()
inkwell()
mantel()
hearth()
sashes()
door()
mouldings()
chest()
bookcases()
book()
letter()
bpy.context.view_layer.update()
EXPORT = [o for o in KIT.all_objects]


# --- Occlusion: one shared atlas on the second UV set ---------------------------------

def occlusion(size):
    owners = {}
    for obj in EXPORT:
        if obj.type == "MESH":
            owners.setdefault(obj.data.name, obj)
    cells = []
    for obj in owners.values():
        mesh = obj.data
        mesh.uv_layers.active = mesh.uv_layers.new(name="ao")
        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.uv.smart_project(angle_limit=radians(66), island_margin=0.02)
        bpy.ops.object.mode_set(mode="OBJECT")
        mesh.uv_layers.active = mesh.uv_layers["UVMap"]
        cells.append((max(math.sqrt(sum(f.area for f in mesh.polygons)), 0.11), obj))
    cells.sort(key=lambda c: (-c[0], c[1].name))

    def shelves(width):
        x = y = row = 0.0
        out = []
        for side, obj in cells:
            if x + side > width + 1e-9:
                x, y, row = 0.0, y + row, 0.0
            out.append((x, y, side, obj))
            x, row = x + side, max(row, side)
        return out, y + row

    low, high = cells[0][0], sum(c[0] for c in cells)
    for _ in range(40):
        mid = (low + high) / 2
        low, high = (low, mid) if shelves(mid)[1] <= mid else (mid, high)
    for x, y, side, obj in shelves(high)[0]:
        layer = obj.data.uv_layers["ao"]
        uv = np.empty(len(layer.uv) * 2, np.float32)
        layer.uv.foreach_get("vector", uv)
        uv = uv.reshape(-1, 2)
        uv = (np.array([x, y], np.float32) + (uv * 0.94 + 0.03) * side) / high
        layer.uv.foreach_set("vector", uv.ravel())
    ao = bpy.data.images.new("kit.ao", size, size, alpha=False)
    ao.colorspace_settings.name = "Non-Color"
    used = {slot.material for obj in EXPORT if obj.type == "MESH" for slot in obj.material_slots}
    output = bpy.data.node_groups.new("glTF Material Output", "ShaderNodeTree")
    output.interface.new_socket("Occlusion", socket_type="NodeSocketFloat", in_out="INPUT")
    for mat in used:
        nodes, links = mat.node_tree.nodes, mat.node_tree.links
        uv = nodes.new("ShaderNodeUVMap")
        uv.uv_map, uv.location = "ao", (-760, -320)
        tex = nodes.new("ShaderNodeTexImage")
        tex.image, tex.location, tex.label, tex.name = ao, (-460, -320), "Baked occlusion (UV set ao)", "kit.ao"
        sink = nodes.new("ShaderNodeGroup")
        sink.node_tree, sink.location = output, (-160, -320)
        links.new(uv.outputs["UV"], tex.inputs["Vector"])
        links.new(tex.outputs["Color"], sink.inputs["Occlusion"])
        for node in nodes:
            node.select = False
        tex.select = True
        nodes.active = tex
    # Drawers are baked standing open so their insides are not black when they slide.
    sliding = [o for o in EXPORT if o.get("kit_motion") == "slide" and o.name.find("sash") < 0]
    for obj in sliding:
        obj.location.y -= obj["kit_travel"]
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 48
    scene.world.light_settings.distance = 0.3
    bpy.ops.object.select_all(action="DESELECT")
    for obj in owners.values():
        obj.select_set(True)
    bpy.context.view_layer.objects.active = next(iter(owners.values()))
    bpy.ops.object.bake(type="AO", margin=6, use_clear=True, uv_layer="ao")
    for obj in sliding:
        obj.location.y += obj["kit_travel"]
    ao.filepath_raw = str(TEXTURES / "kit.ao.png")
    ao.file_format = "PNG"
    ao.save()
    ao.pack()


scene.world = bpy.data.worlds.new("Review sky")
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.78, 0.84, 0.92, 1)
scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.9
if not QUICK:
    occlusion(2048)
# Room-sized solids have no furniture AO. Their dedicated light atlas supplies
# transport; keeping them out preserves the furniture atlas's texel density.
build_architecture(JOINERY, tag, M)
EXPORT = [o for o in KIT.all_objects]
bpy.context.view_layer.update()

# --- What Blender says each node is, for the packer and the tests ---------------------
record = []
for obj in sorted(EXPORT, key=lambda o: o.name):
    location, rotation, scale = obj.matrix_world.decompose()
    entry = {
        "name": obj.name,
        "parent": obj.parent.name if obj.parent else None,
        "type": "mesh" if obj.type == "MESH" else "empty",
        "mesh": obj.data.name if obj.type == "MESH" else None,
        "piece": obj["kit_piece"],
        "role": obj["kit_role"],
        "collection": obj.users_collection[0].name,
        "pivot": to_house(location),
        "rotation": [round(v, 6) for v in (rotation.x, rotation.z, -rotation.y, rotation.w)],
        "scale": [round(v, 6) for v in (scale.x, scale.z, scale.y)],
    }
    if "kit_motion" in obj:
        entry["motion"] = {"kind": obj["kit_motion"], "axis": list(obj["kit_axis"]), "travel": round(obj.get("kit_travel", 0.0), 6)}
    record.append(entry)
(HERE / "source.json").write_text(json.dumps({"blender": bpy.app.version_string, "nodes": record}, indent=1) + "\n")


# --- Review set: a ghost of the room, lights and cameras (never exported) --------------

def review_set():
    ghost = bpy.data.materials.new("review.ghost")
    ghost.use_nodes = True
    ghost.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.62, 0.6, 0.55, 1)
    ghost.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.9

    def slab(name, a, b):
        p = Part()
        p.box(a[0], b[0], a[1], b[1], a[2], b[2], ghost, bevel=False)
        obj = p.build(name, REVIEW_SET, "flat")
        obj.hide_select = True
        return obj

    slab("review.floor", (-7.8, -2.9, FLOOR - 0.05), (-1.6, 3.04, FLOOR))
    slab("review.west wall south", (-7.8, -2.9, FLOOR), (-7.47, -0.62, 3.72))
    slab("review.west wall north", (-7.8, 0.62, FLOOR), (-7.47, 3.04, 3.72))
    slab("review.west wall over hearth", (-7.8, -0.62, 1.66), (-7.47, 0.62, 3.72))
    slab("review.fireback", (-7.8, -0.62, FLOOR), (-7.76, 0.62, 1.66))
    slab("review.north wall", (-7.47, 3.0, FLOOR), (-1.6, 3.04, 3.72))
    bench = slab("review.bench", (-6.1, 5.0, -0.03), (-4.2, 6.15, 0))
    dark = ghost.copy()
    dark.name = "review.bench"
    dark.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.16, 0.17, 0.2, 1)
    bench.data.materials[0] = dark
    sun = bpy.data.objects.new("review.sun", bpy.data.lights.new("review.sun", "SUN"))
    sun.data.energy, sun.data.angle = 3.2, radians(6)
    sun.rotation_euler = (radians(52), 0, radians(-38))
    REVIEW_SET.objects.link(sun)
    north = bpy.data.objects.new("review.bench light", bpy.data.lights.new("review.bench light", "AREA"))
    north.data.energy, north.data.size = 160, 2.0
    north.location = (-5.1, 4.5, 2.2)
    north.rotation_euler = (radians(24), 0, 0)
    REVIEW_SET.objects.link(north)

    def camera(name, at, target, lens):
        cam = bpy.data.objects.new(name, bpy.data.cameras.new(name))
        cam.location, cam.data.lens = at, lens
        cam.rotation_euler = (Vector(target) - Vector(at)).to_track_quat("-Z", "Y").to_euler()
        REVIEW_SET.objects.link(cam)
        return cam

    return [
        (camera("review.contact", (-0.3, -6.4, 5.3), (-5.0, 0.4, 1.25), 30), "kit-contact-sheet.jpg"),
        (camera("review.desk", (-3.75, -2.25, 1.95), (-4.95, -0.62, 1.22), 40), "kit-writing-table.jpg"),
        (camera("review.hearth", (-5.2, -1.5, 1.7), (-7.47, 0.05, 1.25), 30), "kit-hearth.jpg"),
        (camera("review.joinery", (-4.2, 0.2, 1.75), (-3.3, 3.0, 1.5), 22), "kit-door-chest.jpg"),
        (camera("review.bench", (-5.15, 3.9, 0.95), (-5.15, 5.5, 0.1), 32), "kit-stock-bench.jpg"),
    ]


cameras = review_set()
scene.camera = cameras[0][0]
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 16 if QUICK else 72
scene.cycles.use_denoising = True
scene.render.resolution_x, scene.render.resolution_y = 1600, 1000
scene.render.image_settings.file_format = "JPEG"
scene.render.image_settings.quality = 90
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(HERE / "Travellers Rest - kit.blend"), compress=True)

bpy.ops.object.select_all(action="DESELECT")
for obj in EXPORT:
    obj.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=str(WORK / "kit-export.glb"),
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_yup=True,
    export_extras=True,
    export_cameras=False,
    export_lights=False,
    export_animations=False,
    export_texcoords=True,
    export_normals=True,
    export_materials="EXPORT",
    export_image_format="AUTO",
)
print("KIT", len(EXPORT), "objects;", len({o.data.name for o in EXPORT if o.type == "MESH"}), "meshes")

if "--no-render" not in ARGS:
    for cam, name in cameras:
        scene.camera = cam
        scene.render.filepath = str(REVIEW / name)
        bpy.ops.render.render(write_still=True)
        print("STILL", name)
