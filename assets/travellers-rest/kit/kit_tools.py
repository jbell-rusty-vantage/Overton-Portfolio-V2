"""Modelling helpers for the Travellers Rest kit (Blender 5.2, run headless).

Everything is deterministic. Geometry is built with bmesh in a piece's own frame
(metres, Z up, the piece's front toward -Y). Two shading styles are used:
  "hard"   boxes carry a bevel weight; a live Bevel modifier and a Weighted Normal
           modifier round and shade them. The modifiers stay editable in the .blend and
           are applied by the glTF exporter.
  "turned" lathed, swept and bent parts: smooth, with edges sharper than 30 degrees
           marked sharp.
The first UV layer ("UVMap") is in metres divided by the material tile, with grain
along U, so a tiling timber or paint finish reads at one scale on every piece. The
second layer ("ao") is the shared occlusion atlas made by build_kit.py.
"""
import math
from math import cos, pi, sin, tau

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector

AXES = {"x": 0, "y": 1, "z": 2}


def hex_rgb(value):
    value = value.lstrip("#")
    return np.array([int(value[i:i + 2], 16) / 255 for i in (0, 2, 4)], np.float32)


# --- seeded, tileable surfaces -------------------------------------------------------

def noise(n, seed, beta=2.0, sx=1.0, sy=1.0):
    """Periodic fractal noise in 0..1. sx > 1 stretches the pattern along U."""
    white = np.random.default_rng(seed).standard_normal((n, n))
    fy = np.fft.fftfreq(n)[:, None] * n
    fx = np.fft.fftfreq(n)[None, :] * n
    k = np.sqrt((fx * sx) ** 2 + (fy * sy) ** 2)
    k[0, 0] = 1
    out = np.real(np.fft.ifft2(np.fft.fft2(white) / k ** (beta / 2)))
    out -= out.min()
    return (out / out.max()).astype(np.float32)


def tint(base, value, amount):
    """Shade a base colour by a 0..1 field centred on its mean."""
    v = (value - value.mean()) * amount
    return np.clip(hex_rgb(base)[None, None, :] * (1 + v[..., None]), 0, 1)


def wood(n, seed, base, contrast=1.0):
    streak = noise(n, seed, 1.5, 48, 1)
    fine = noise(n, seed + 1, 0.7, 14, 1)
    cloud = noise(n, seed + 2, 3.0)
    out = tint(base, 0.55 * streak + 0.27 * fine + 0.18 * cloud, 1.5 * contrast)
    pores = np.clip(fine - 0.72, 0, 1) * 2.2
    return np.clip(out * (1 - pores[..., None] * 0.5), 0, 1)


def brushed(n, seed, base):
    return tint(base, 0.6 * noise(n, seed, 1.2, 60, 1) + 0.4 * noise(n, seed + 1, 3.0), 0.16)


def hide(n, seed, base, amount=0.55):
    return tint(base, 0.5 * noise(n, seed, 2.6) + 0.3 * noise(n, seed + 1, 1.4) + 0.2 * noise(n, seed + 2, 0.4), amount)


def laid(n, seed, base):
    out = tint(base, 0.6 * noise(n, seed, 2.8) + 0.4 * noise(n, seed + 1, 0.9), 0.14)
    rows = (np.arange(n) % max(2, n // 128) == 0).astype(np.float32)[:, None, None]
    return np.clip(out * (1 - 0.035 * rows), 0, 1)


def edges(n, seed, base):
    """The fore-edge of a text block: leaves seen edge-on, running along U."""
    lines = np.random.default_rng(seed).random((n, 1)).astype(np.float32)
    return np.clip(hex_rgb(base)[None, None, :] * (0.78 + 0.3 * np.repeat(lines, n, 1))[..., None], 0, 1)


def bark(n, seed):
    v = 0.6 * noise(n, seed, 1.3, 30, 1) + 0.4 * noise(n, seed + 1, 2.4)
    out = tint("#4a3b30", v, 1.3)
    cracks = np.clip(0.32 - noise(n, seed + 2, 1.1, 22, 1), 0, 1) * 5
    return np.clip(out * (1 - cracks[..., None] * 0.6), 0, 1)


def image(name, pixels, folder, srgb=True):
    """Store an H x W x 3 array (row 0 at the top) as a packed image datablock."""
    h, w = pixels.shape[:2]
    rgba = np.ones((h, w, 4), np.float32)
    rgba[..., :3] = pixels[::-1]
    img = bpy.data.images.new(name, w, h, alpha=False)
    # Colour space first: changing it afterwards regenerates the buffer and blanks it.
    img.colorspace_settings.name = "sRGB" if srgb else "Non-Color"
    img.pixels.foreach_set(rgba.ravel())
    folder.mkdir(parents=True, exist_ok=True)
    img.filepath_raw = str(folder / (name + ".png"))
    img.file_format = "PNG"
    img.save()
    img.pack()
    return img


def material(name, color, roughness, metallic=0.0, img=None, finish=None, tile=1.0, double=False, orm=None, emission=None):
    """Principled BSDF material that the glTF exporter writes without loss.
    `finish` names the live room finish the engine substitutes (see props.ts)."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    shader = nodes["Principled BSDF"]
    rgb = hex_rgb(color)
    linear = [((c + 0.055) / 1.055) ** 2.4 if c > 0.04045 else c / 12.92 for c in rgb]
    shader.inputs["Base Color"].default_value = (*linear, 1)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    mat.diffuse_color = (*linear, 1)
    mat.roughness, mat.metallic = roughness, metallic
    if img or orm:
        uv = nodes.new("ShaderNodeUVMap")
        uv.uv_map = "UVMap"
        uv.location = (-760, 200)
    if img:
        tex = nodes.new("ShaderNodeTexImage")
        tex.image, tex.location, tex.label = img, (-460, 300), "Base colour"
        links.new(uv.outputs["UV"], tex.inputs["Vector"])
        links.new(tex.outputs["Color"], shader.inputs["Base Color"])
    if orm:
        tex = nodes.new("ShaderNodeTexImage")
        tex.image, tex.location, tex.label = orm, (-460, 0), "Roughness (G), metal (B)"
        split = nodes.new("ShaderNodeSeparateColor")
        split.location = (-200, 0)
        links.new(uv.outputs["UV"], tex.inputs["Vector"])
        links.new(tex.outputs["Color"], split.inputs["Color"])
        links.new(split.outputs["Green"], shader.inputs["Roughness"])
        links.new(split.outputs["Blue"], shader.inputs["Metallic"])
    if emission:
        shader.inputs["Emission Color"].default_value = (*emission[0], 1)
        shader.inputs["Emission Strength"].default_value = emission[1]
    mat.use_backface_culling = not double
    mat["tile"] = tile
    if finish:
        mat["finish"] = finish
    return mat


# --- geometry -------------------------------------------------------------------------

def arc(cx, cy, r, a0, a1, n, rx=None):
    """Points on an arc from angle a0 to a1 (degrees), excluding neither end."""
    return [(cx + (rx or r) * cos(math.radians(a0 + (a1 - a0) * i / n)), cy + r * sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]


class Part:
    """One mesh under construction. Materials are slots in the order first used."""

    def __init__(self, tile=1.0):
        self.bm = bmesh.new()
        self.uv = self.bm.loops.layers.uv.new("UVMap")
        self.weight = self.bm.edges.layers.float.new("bevel_weight_edge")
        self.tile = tile
        self.slots = []
        self.curved = set()
        self.shift = 0.0

    def slot(self, mat):
        if mat not in self.slots:
            self.slots.append(mat)
        return self.slots.index(mat)

    def face(self, verts, mat, uvs=None, grain=None, curved=False):
        f = self.bm.faces.new(verts)
        f.material_index = self.slot(mat)
        f.smooth = True
        if curved:
            self.curved.add(f)
        if uvs:
            for loop, uv in zip(f.loops, uvs):
                loop[self.uv].uv = uv
        else:
            f.normal_update()
            self.box_uv(f, grain or "x")
        return f

    def box_uv(self, f, grain):
        n = [abs(c) for c in f.normal]
        a = n.index(max(n))
        b, c = [i for i in (0, 1, 2) if i != a]
        g = AXES[grain]
        u, v = (g, c if g == b else b) if g != a else (b, c)
        for loop in f.loops:
            co = loop.vert.co
            loop[self.uv].uv = (co[u] / self.tile + 0.5, co[v] / self.tile + self.shift)

    def hexa(self, bottom, top, mat, grain="z", bevel=True):
        """Eight corners: bottom and top quads, both counter-clockwise seen from above."""
        self.shift += 0.173
        b = [self.bm.verts.new(p) for p in bottom]
        t = [self.bm.verts.new(p) for p in top]
        faces = [self.face(b[::-1], mat, grain=grain), self.face(t, mat, grain=grain)]
        for i in range(4):
            k = (i + 1) % 4
            faces.append(self.face([b[i], b[k], t[k], t[i]], mat, grain=grain))
        if bevel:
            for f in faces:
                for e in f.edges:
                    e[self.weight] = 1.0
        return faces

    def box(self, x0, x1, y0, y1, z0, z1, mat, grain="long", bevel=True):
        x0, x1, y0, y1, z0, z1 = min(x0, x1), max(x0, x1), min(y0, y1), max(y0, y1), min(z0, z1), max(z0, z1)
        if grain == "long":
            size = (x1 - x0, y1 - y0, z1 - z0)
            grain = "xyz"[size.index(max(size))]
        return self.hexa(
            [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0)],
            [(x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)],
            mat, grain, bevel,
        )

    def rings(self, rings, mat, uv=None, grain="x"):
        """Skin a stack of closed rings (or single-point poles), listed from the bottom
        of the outside surface to the top. uv(i, j) gives texture coordinates."""
        rows = [[self.bm.verts.new(p) for p in ring] for ring in rings]
        for i in range(len(rows) - 1):
            A, B = rows[i], rows[i + 1]
            n = max(len(A), len(B))
            if n == 1:
                continue
            for j in range(n):
                k = (j + 1) % n
                if len(A) == 1:
                    verts, at = [A[0], B[k], B[j]], [(i, j + 0.5), (i + 1, j + 1), (i + 1, j)]
                elif len(B) == 1:
                    verts, at = [A[j], A[k], B[0]], [(i, j), (i, j + 1), (i + 1, j + 0.5)]
                else:
                    verts, at = [A[j], A[k], B[k], B[j]], [(i, j), (i, j + 1), (i + 1, j + 1), (i + 1, j)]
                self.face(verts, mat, [uv(*p) for p in at] if uv else None, grain, curved=True)

    def lathe(self, profile, mat, segs=16, M=None):
        """Turn a profile [(radius, height)] about Z; M places it anywhere."""
        M = M or Matrix.Identity(4)
        rings = []
        for r, z in profile:
            if r < 1e-6:
                rings.append([M @ Vector((0, 0, z))])
            else:
                rings.append([M @ Vector((r * cos(tau * j / segs), r * sin(tau * j / segs), z)) for j in range(segs)])
        run = [0.0]
        for (r0, z0), (r1, z1) in zip(profile, profile[1:]):
            run.append(run[-1] + math.hypot(r1 - r0, z1 - z0))
        girth = tau * sum(r for r, _ in profile) / len(profile)
        self.shift += 0.173
        shift = self.shift
        self.rings(rings, mat, lambda i, j: (run[i] / self.tile, j / segs * girth / self.tile + shift))

    def turned(self, p0, p1, profile, mat, segs=12):
        """A turning between two points; profile is [(fraction along, radius)]."""
        p0, p1 = Vector(p0), Vector(p1)
        axis = p1 - p0
        M = Matrix.Translation(p0) @ axis.to_track_quat("Z", "Y").to_matrix().to_4x4()
        self.lathe([(r, t * axis.length) for t, r in profile], mat, segs, M)

    def tube(self, points, radius, mat, segs=8, ref=(0, 0, 1), phase=0.0, caps=True):
        """A section swept along a path. radius(i, fraction) returns (along ref, across)."""
        pts = [Vector(p) for p in points]
        ref = Vector(ref)
        run = [0.0]
        for a, b in zip(pts, pts[1:]):
            run.append(run[-1] + (b - a).length)
        rings = []
        girth = 0.0
        for i, p in enumerate(pts):
            t = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
            n1 = (ref - ref.dot(t) * t).normalized()
            n2 = t.cross(n1)
            ra, rb = radius(i, run[i] / run[-1]) if callable(radius) else (radius, radius)
            girth = max(girth, tau * (ra + rb) / 2)
            rings.append([p + n1 * (ra * cos(phase + tau * j / segs)) + n2 * (rb * sin(phase + tau * j / segs)) for j in range(segs)])
        self.shift += 0.173
        shift = self.shift
        uv = lambda i, j: (run[i] / self.tile, j / segs * girth / self.tile + shift)
        if caps:
            rings = [[sum(rings[0], Vector()) / segs]] + rings + [[sum(rings[-1], Vector()) / segs]]
            uv = lambda i, j: (run[min(max(i - 1, 0), len(run) - 1)] / self.tile, j / segs * girth / self.tile + shift)
        self.rings(rings, mat, uv)

    def sweep(self, profile, path, mat, closed=False, M=None, cap_first=False, cap_last=False, ends=False, grain="x"):
        """Run a moulding profile [(out, up)] along a plan path [(x, y)]. The solid lies
        to the left of travel, so a counter-clockwise closed path faces outward. List the
        profile from the bottom of the visible surface to the top. M maps the plan frame
        (x, y, up) into the part, for mouldings planted on a vertical face."""
        M = M or Matrix.Identity(4)
        pts = [Vector((x, y)) for x, y in path]
        n = len(pts)
        normals = []
        for i in range(n):
            before = pts[i] - pts[i - 1] if closed or i > 0 else None
            after = pts[(i + 1) % n] - pts[i] if closed or i < n - 1 else None
            ns = [Vector((d.y, -d.x)).normalized() for d in (before, after) if d is not None]
            normals.append(ns[0] if len(ns) == 1 else (ns[0] + ns[1]) / (1 + ns[0].dot(ns[1])))
        run = [0.0]
        for i in range(n if closed else n - 1):
            run.append(run[-1] + (pts[(i + 1) % n] - pts[i]).length)
        rise = [0.0]
        for (o0, z0), (o1, z1) in zip(profile, profile[1:]):
            rise.append(rise[-1] + math.hypot(o1 - o0, z1 - z0))
        self.shift += 0.173
        shift = self.shift
        grid = [[self.bm.verts.new(M @ Vector((*(pts[i] + normals[i] * out), up))) for out, up in profile] for i in range(n)]
        for i in range(n if closed else n - 1):
            k = (i + 1) % n
            for j in range(len(profile) - 1):
                uvs = [(run[a] / self.tile, rise[b] / self.tile + shift) for a, b in ((i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1))]
                self.face([grid[i][j], grid[k][j], grid[k][j + 1], grid[i][j + 1]], mat, uvs, curved=True)
        if cap_last:
            self.face([row[-1] for row in grid], mat, grain=grain, curved=True)
        if cap_first:
            self.face([row[0] for row in grid][::-1], mat, grain=grain, curved=True)
        if ends and not closed:
            self.face(grid[0], mat, grain=grain, curved=True)
            self.face(grid[-1][::-1], mat, grain=grain, curved=True)
        return grid

    def extrude(self, section, origin, u, v, length, mat, grain=None, caps=True):
        """Extrude a section (counter-clockwise in the u, v plane) along u x v."""
        u, v, origin = Vector(u), Vector(v), Vector(origin)
        w = u.cross(v).normalized() * length
        a = [self.bm.verts.new(origin + u * p + v * q) for p, q in section]
        b = [self.bm.verts.new(x.co + w) for x in a]
        grain = grain or "xyz"[[abs(c) for c in w].index(max(abs(c) for c in w))]
        self.shift += 0.173
        for i in range(len(a)):
            k = (i + 1) % len(a)
            self.face([a[i], a[k], b[k], b[i]], mat, grain=grain, curved=True)
        if caps:
            self.face(a[::-1], mat, grain=grain, curved=True)
            self.face(b, mat, grain=grain, curved=True)

    def build(self, name, collection, style="hard", bevel=0.0015, segments=2, sharp=30):
        bm = self.bm
        bm.normal_update()
        limit = math.radians(sharp)
        for e in bm.edges:
            faces = e.link_faces
            if len(faces) == 2 and all(f in self.curved for f in faces):
                e.smooth = e.calc_face_angle() < limit
        if style == "flat":
            for f in bm.faces:
                f.smooth = False
        mesh = bpy.data.meshes.new(name)
        bm.to_mesh(mesh)
        bm.free()
        for mat in self.slots:
            mesh.materials.append(mat)
        obj = bpy.data.objects.new(name, mesh)
        collection.objects.link(obj)
        if style == "hard":
            dress(obj, bevel, segments)
        return obj


def dress(obj, bevel, segments):
    """The live modifiers of a hard-surface piece."""
    mod = obj.modifiers.new("Worked edges", "BEVEL")
    mod.limit_method, mod.width, mod.segments = "WEIGHT", bevel, segments
    mod.miter_outer = "MITER_ARC"
    normals = obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
    normals.keep_sharp, normals.weight = True, 60
    obj["kit_bevel"] = bevel
    obj["kit_bevel_segments"] = segments


def empty(name, collection, size=0.08, kind="PLAIN_AXES"):
    obj = bpy.data.objects.new(name, None)
    obj.empty_display_size, obj.empty_display_type = size, kind
    collection.objects.link(obj)
    return obj


def instance(source, name, collection):
    """A linked duplicate: the same mesh datablock under another name."""
    obj = bpy.data.objects.new(name, source.data)
    collection.objects.link(obj)
    if "kit_bevel" in source:
        dress(obj, source["kit_bevel"], source["kit_bevel_segments"])
    return obj


def G(x, y, z):
    """House coordinates (glTF: Y up, south +Z) to Blender (Z up, north +Y)."""
    return Vector((x, -z, y))


def to_house(v):
    return [round(v.x, 6), round(v.z, 6), round(-v.y, 6)]
