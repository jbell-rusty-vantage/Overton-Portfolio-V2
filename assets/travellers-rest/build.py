"""Build the Travellers Rest study from the HABS TN-14 plan and elevation.

Run from a fresh Blender background process. X is east, Y north, Z up, in metres.
The exterior and the furnished southwest room share coordinates in the source.
"""
from collections import defaultdict
from pathlib import Path
import math
import random
import bpy
from mathutils import Vector

if not bpy.app.background:
    raise RuntimeError("Use a fresh background process for this study.")
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "travellers-rest"
OUT.mkdir(exist_ok=True)
rng = random.Random(1799)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = "METRIC"
scene.render.engine = "CYCLES"
scene.cycles.samples = 12
scene.cycles.use_denoising = True
scene.render.threads_mode = "FIXED"
scene.render.threads = 10
scene.world = bpy.data.worlds.new("Window light")
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs[0].default_value = (.75, .83, .92, 1)
scene.world.node_tree.nodes["Background"].inputs[1].default_value = .48
scene.render.resolution_x, scene.render.resolution_y = 1280, 860
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "JPEG"
scene.render.image_settings.quality = 90
bpy.context.preferences.filepaths.save_version = 0

def material(name, rgb, metallic=0):
    def linear(n):
        s = int(n, 16) / 255
        return ((s+.055)/1.055)**2.4 if s > .04045 else s/12.92
    rgba = tuple(linear(rgb[i:i+2]) for i in (0,2,4)) + (1,)
    m = bpy.data.materials.new(name)
    m.diffuse_color = rgba
    m.use_nodes = True
    shader = m.node_tree.nodes["Principled BSDF"]
    shader.inputs["Base Color"].default_value = rgba
    shader.inputs["Roughness"].default_value = .42 if metallic else .76
    shader.inputs["Metallic"].default_value = metallic
    return m

white = material("Painted weatherboard", "e3ddca")
trim = material("Painted joinery", "f3ead7")
sash = material("Daylit panes", "b5c6bd")
outside_glass = material("Sash reflections", "495c5a")
shutter = material("Shutter green", "324b40")
shadow = material("Dark recess", "262b26")
roof = material("Weathered shingles", "66635a")
slate = material("Shingle courses", "767369")
stone = material("Limestone", "a39d8b")
brick = material("Chimney brick", "8f6654")
brass = material("Old brass", "b49558", .61)
pewter = material("Pewter", "868888", .59)
plaster = material("Lime plaster", "e8dfc9")
panel = material("Dado and mantel", "b6ac91")
wood = material("Walnut", "62452f")
dark = material("Walnut endgrain", "463326")
paper = material("Laid paper", "ede0bc")
ink = material("Printer's ink", "5b5142")
leather = [material("Calf binding "+str(i), c) for i,c in enumerate(["593c2d","815c3d","70513e","4f4336","784939","455448"])]
planks = [material("Ash plank "+str(i), c) for i,c in enumerate(["a48966","90775d","9b8161","aa906d","a2876c"])]
grass = material("Survey base", "878e73")
baize = material("Writing surface", "425449")
woven = material("Flatwoven rug, madder", "8b5c4e")
rug_ochre = material("Rug border, flax", "bb9c72")
parts = defaultdict(lambda: [[], []])
domain = "House"

def solid(name, mat, verts, faces):
    v,f = parts[(domain,name,mat)]
    n = len(v)
    v.extend(verts)
    f.extend(tuple(i+n for i in face) for face in faces)

def box(name, mat, x,y,z, w,d,h):
    points = [(x+i*w/2,y+j*d/2,z+k*h/2) for k in (-1,1) for j in (-1,1) for i in (-1,1)]
    solid(name,mat,points,[(0,2,3,1),(4,5,7,6),(0,1,5,4),(1,3,7,5),(3,2,6,7),(2,0,4,6)])

def spindle(name, mat, a,b, r0,r1, sides=12):
    p,q = Vector(a),Vector(b)
    direction=(q-p).normalized()
    u=direction.cross(Vector((0,1,0)) if abs(direction.y)<.9 else Vector((1,0,0))).normalized()
    v=direction.cross(u)
    points=[tuple(c+r*(math.cos(i*math.tau/sides)*u+math.sin(i*math.tau/sides)*v))
            for c,r in ((p,r0),(q,r1)) for i in range(sides)]
    solid(name,mat,points,[tuple(reversed(range(sides))),tuple(range(sides,2*sides))]+
          [(i,(i+1)%sides,(i+1)%sides+sides,i+sides) for i in range(sides)])

def gable(name, mat, x,y,z, w,d,rise, along_y=False):
    verts=[(a,b,c) for a in (-w/2,w/2) for b,c in [(-d/2,0),(d/2,0),(0,rise)]]
    coords=[(x-b,y+a,z+c) if along_y else (x+a,y+b,z+c) for a,b,c in verts]
    solid(name,mat,coords,[(2,1,0),(3,4,5),(0,1,4,3),(1,2,5,4),(2,0,3,5)])

def front_window(x,z, upper=False, interior=False):
    name = "Library south windows" if interior else "South front sashes"
    y=-2.98 if interior else -3.19
    side=1 if interior else -1
    w,h=1.03,1.46 if upper else 1.64
    box(name,trim,x,y,z,w+.15,.12,h+.15)
    box(name,sash if interior else outside_glass,x,y+side*.075,z,w,.035,h)
    y+=side*.105
    for k in (1,2,3):
        box(name,trim,x-w/2+k*w/4,y,z,.023,.028,h)
    total=6 if upper else 7
    for k in range(1,total):
        box(name,trim,x,y,z-h/2+h*k/total,w,.034,.04 if k==3 else .022)
    box(name,trim,x,y,z-h/2-.06,w+.23,.18,.075)
    if interior:
        return
    for off in (-.84,.84):
        box("Shutters",shutter,x+off,y+.025,z,.48,.06,h)
        for i in range(16):
            box("Shutter louvers",shadow,x+off,y-.014,z-h*.44+i*h*.058,.375,.012,.019)

# The five-bay Federal block is the restored survey elevation, not the four-room 1799 footprint.
box("Cutaway landscape",grass,-1,6,-.18,26,38,.35)
box("Ashlar foundation",stone,0,0,.23,15.85,6.16,.46)
box("Federal block",white,0,0,3.72,15.85,6.15,6.52)
for i in range(49):
    box("Beaded clapboard courses",trim,0,-3.095,.53+i*.132,15.82,.035,.024)
for x in (-7.86,7.86):
    box("Corner boards",trim,x,-3.13,3.68,.18,.1,6.43)
for z in (2.07,5.34):
    for x in (-6.3,-3.77,0,3.77,6.3):
        if x or z>3:
            front_window(x,z,z>3)
gable("Roof",roof,0,0,6.99,16.25,6.65,1.85)
for s in (-1,1):
    for i in range(12):
        box("Roof battens",slate,0,s*(3.32-i*.27),7.0+i*.15,16.22,.06,.025)
    box("Eaves",trim,0,s*3.16,6.94,16.14,.25,.13)
    box("Gable end chimney",brick,s*7.98,0,4.62,.72,1.42,9.24)
    box("Chimney coping",brick,s*7.98,0,9.25,.84,1.54,.15)
box("South door",dark,0,-3.17,1.64,1.16,.12,2.34)
for x in (-.27,.27):
    for z in (.94,1.57,2.24):
        box("Door panels",wood,x,-3.25,z,.40,.045,.47)
box("Transom glazing",outside_glass,0,-3.19,2.96,1.16,.09,.26)
for x in (-.58,-.29,0,.29,.58):
    box("Transom muntins",trim,x,-3.25,2.96,.035,.045,.28)
for i in range(3):
    box("Doorsteps",stone,0,-4.21-i*.32,.39-i*.13,3.22,.78,.14)
box("Portico ceiling",trim,0,-4,3.63,3.65,2.05,.25)
gable("Pediment",trim,0,-4.0,3.75,2.12,3.75,.82,True)
for x in (-1.49,1.49):
    for y in (-4.77,-3.39):
        box("Porch posts",trim,x,y,2.01,.22,.22,3.06)
        box("Post capitals",white,x,y,3.49,.32,.32,.15)

# North ell and east gallery. The rear service rooms are exterior massing only.
box("North ell foundation",stone,-4.42,13.25,.22,6.98,20.4,.44)
box("Brick ell, limewash",white,-4.42,13.25,3.68,6.98,20.4,6.49)
gable("Ell roof",roof,-4.42,13.25,6.94,20.65,7.36,1.63,True)
box("Rear addition",white,-4.27,26.25,3.48,7.4,5.7,6.1)
gable("Rear roof",roof,-4.27,26.25,6.53,5.95,7.8,1.61,True)
for z in (1.98,5.18):
    for y in (5.4,8.8,12.3,15.8,19.3,22.1,25.1,27.8):
        box("Ell windows",trim,-.90,y,z,.13,1.12,1.57)
        box("Ell lights",outside_glass,-.815,y,z,.04,.95,1.42)
        for k in (-.18,.18):
            box("Ell muntins",trim,-.782,y+k,z,.03,.025,1.4)
        for k in (-.46,-.23,0,.23,.46):
            box("Ell muntins",trim,-.782,y,z+k,.03,.94,.025)
for z in (.48,3.64,6.76):
    box("East gallery decks",trim,.70,13,z,3.28,20,.15)
for y in (3.4,6.6,9.8,13,16.2,19.4,22.6):
    box("Gallery posts",trim,2.14,y,3.61,.18,.18,6.24)
for z in (1.39,4.58):
    box("Gallery handrails",trim,2.14,13,z,.11,19.3,.105)
    for i in range(101):
        box("Gallery balustrades",trim,2.14,3.41+i*.192,z-.47,.045,.045,.87)

domain="Library"
floor=.49
# Three walls and an open camera side. The west room sits to the left of a visitor entering from the south.
for i in range(28):
    for j in range(3):
        box("White ash flooring",rng.choice(planks),-7.79+(i+.5)*.225,-3.02+(j+.5)*2.02,floor,.222,2.015,.08)
box("West plaster",plaster,-7.82,0,2.13,.13,6.15,3.23)
box("North plaster",plaster,-4.67,3.07,2.13,6.30,.13,3.23)
box("South plaster",plaster,-4.67,-3.08,2.13,6.30,.13,3.23)
box("Plaster ceiling",plaster,-4.67,0,3.76,6.36,6.20,.08)
for y in (-3.0,3.0):
    box("Painted dado",panel,-4.68,y,1.00,6.28,.08,.95)
    for z,h in ((.62,.18),(1.49,.072)):
        box("Chair rail and skirting",trim,-4.68,y-(.058 if y>0 else -.058),z,6.30,.10,h)
box("West wainscot",panel,-7.72,0,1.0,.075,6.06,.95)
for z in (.64,1.49):
    box("West trim",trim,-7.65,0,z,.135,6.1,.095)
for x in (-6.30,-3.77):
    front_window(x,2.08,interior=True)
box("Six-panel door",panel,-2.64,2.974,1.65,1.18,.12,2.24)
for x in (-3.25,-2.03):
    box("Door casing",trim,x,2.87,1.65,.10,.11,2.37)
box("Door head",trim,-2.64,2.87,2.82,1.31,.11,.13)
for x in (-2.92,-2.37):
    for z in (.94,1.61,2.31):
        box("Raised door fields",white,x,2.896,z,.41,.034,.48)
box("Door latch",dark,-2.16,2.82,1.53,.09,.09,.09)

# Fireplace and freestanding case are based on the southwest-room photograph.
box("Chimney breast",plaster,-7.63,0,2.13,.32,2.55,3.20)
box("Hearthstone",stone,-7.12,0,.57,1.04,2.22,.10)
box("Firebox",shadow,-7.43,0,1.14,.09,1.51,1.15)
for y in (-.98,.98):
    box("Mantel jambs",panel,-7.32,y,1.30,.30,.32,1.43)
    box("Mantel jamb foot",trim,-7.30,y,.73,.35,.38,.28)
for z,w,h in ((1.88,2.20,.23),(2.05,2.39,.13),(2.15,2.55,.08)):
    box("Mantelshelf",panel,-7.29,0,z,.42,w,h)
for y in (-.42,.0,.39):
    spindle("Hearth logs",dark,(-7.34,y-.32,.68),(-7.1,y+.28,.72),.105,.09)
for y in (-.55,.55):
    spindle("Hearth irons",shadow,(-7.03,y,.63),(-7.03,y,.98),.023,.016)
    spindle("Andiron finials",brass,(-7.03,y,.98),(-7.03,y,1.04),.039,.022)
for y in (-.80,.79):
    spindle("Candlestick foot",brass,(-7.29,y,2.20),(-7.29,y,2.23),.074,.058)
    spindle("Candlestick stem",brass,(-7.29,y,2.23),(-7.29,y,2.39),.035,.018)
    spindle("Tallow taper",paper,(-7.29,y,2.39),(-7.29,y,2.58),.018,.016)
    spindle("Wick",shadow,(-7.29,y,2.58),(-7.29,y,2.59),.003,.002)
box("Woven hearth rug",woven,-5.03,-.08,.544,3.38,3.64,.018)
for inset in (.06,.10,.19):
    for s in (-1,1):
        box("Woven borders",rug_ochre,-5.03+s*(1.69-inset),-.08,.555,.016,3.64-2*inset,.002)
        box("Woven borders",rug_ochre,-5.03,-.08+s*(1.82-inset),.555,3.38-2*inset,.016,.002)
for i in range(9):
    for j in range(10):
        x,y=-6.30+i*.306,-1.50+j*.31
        solid("Lozenges",rug_ochre,[(x-.043,y,.556),(x,y-.067,.556),(x+.043,y,.556),(x,y+.067,.556)],[(0,1,2,3)])

for y in (-2.35,1.94):
    box("Cabinet backs",dark,-7.44,y,1.63,.14,1.20,2.15)
    for sy in (-.61,.61):
        box("Cabinet cheeks",wood,-7.22,y+sy,1.64,.54,.07,2.18)
    for z in (.66,1.05,1.42,1.80,2.18,2.59):
        box("Cabinet shelves",wood,-7.20,y,z,.59,1.31,.065)
    box("Cabinet crown",wood,-7.22,y,2.69,.64,1.40,.11)
    for row in range(4):
        yy=y-.535
        while yy<y+.47:
            w=rng.uniform(.048,.095)
            h=rng.uniform(.225,.306)
            z=1.09+row*.378
            mat=rng.choice(leather)
            box("Bound volumes",mat,-7.14,yy+w/2,z+h/2,.31,w,h)
            for band in (.048,h-.042):
                box("Spine bands",brass,-6.979,yy+w/2,z+band,.011,w*.88,.009)
            yy+=w+.009

def table(name,x,y,z,w,d,top):
    box(name,wood,x,y,top,w,d,.07)
    for sx in (-1,1):
        for sy in (-1,1):
            xx,yy=x+sx*(w/2-.095),y+sy*(d/2-.075)
            spindle(name,dark,(xx,yy,z),(xx,yy,top),.035,.052)
    box(name,wood,x,y,top-.095,w-.09,d-.07,.15)

table("Writing table",-4.95,-.75,.54,1.70,1.02,1.34)
box("Inset writing surface",baize,-4.95,-.75,1.379,1.43,.79,.008)
table("Windsor chair",-4.72,.23,.54,.54,.48,1.00)
for i in range(7):
    x=-4.98+i*.083
    spindle("Chair spindles",dark,(x,.42,1.02),(x,.50,1.57+.045*math.sin(i*math.pi/6)),.014,.012)
spindle("Chair crest",wood,(-5.02,.50,1.59),(-4.42,.50,1.59),.029,.029)
for i in range(2):
    box("Stacked reports",leather[i],-5.45,-1.0,1.42+i*.088,.35,.27,.085)
    box("Page edges",paper,-5.45,-1.007,1.42+i*.088,.33,.273,.056)
for side in (-1,1):
    x=-4.86+side*.135
    box("Open reports, boards",leather[0],x,-.72,1.408,.276,.386,.035)
    box("Open reports, leaves",paper,x,-.72,1.439,.265,.37,.042)
    for i in range(11):
        box("Lines of type",ink,x,-.858+i*.023,1.462,.186 if i%4 else .135,.002,.001)
spindle("Pewter inkwell",pewter,(-4.4,-.99,1.38),(-4.4,-.99,1.47),.086,.063)
spindle("Ink",shadow,(-4.4,-.99,1.47),(-4.4,-.99,1.48),.037,.035)
spindle("Writing quill",paper,(-4.40,-.99,1.48),(-4.33,-.98,1.71),.004,.022)

timber = [wood,dark,*planks]
for m in timber:
    image=bpy.data.images.load(str(ROOT/"assets"/"library"/("oak.jpg" if m in planks else "walnut.jpg")),check_existing=True)
    image.pack()
    texture=m.node_tree.nodes.new("ShaderNodeTexImage")
    texture.image=image
    shader=m.node_tree.nodes["Principled BSDF"]
    m.node_tree.links.new(texture.outputs["Color"],shader.inputs["Base Color"])

collections={}
for (scope,name,mat),(verts,faces) in parts.items():
    if scope not in collections:
        col=bpy.data.collections.new(scope)
        scene.collection.children.link(col)
        collections[scope]=col
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata(verts,[],faces)
    mesh.materials.append(mat)
    if mat in timber:
        uv=mesh.uv_layers.new(name="Quarter-sawn timber")
        for poly in mesh.polygons:
            direction=poly.normal
            for idx in poly.loop_indices:
                x,y,z=mesh.vertices[mesh.loops[idx].vertex_index].co
                u,v=(y,x) if abs(direction.z)>.8 else ((z,y) if abs(direction.x)>.7 else (x,z))
                uv.data[idx].uv=(u*.64,v*1.7)
    obj=bpy.data.objects.new(name,mesh)
    collections[scope].objects.link(obj)

for scope,col in collections.items():
    bpy.ops.object.select_all(action="DESELECT")
    for obj in col.objects:
        obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(OUT/(scope.lower()+".glb")),use_selection=True,export_yup=True)

def area(name,pt,aim,power,size,color):
    data=bpy.data.lights.new(name,"AREA")
    data.energy,data.shape,data.size,data.color=power,"DISK",size,color
    obj=bpy.data.objects.new(name,data)
    scene.collection.objects.link(obj)
    obj.location=pt
    obj.rotation_euler=(Vector(aim)-Vector(pt)).to_track_quat("-Z","Y").to_euler()
    return obj

collections["House"].hide_render=True
collections["House"].hide_viewport=True
area("South sash daylight",(-5.9,-2.55,2.9),(-6.8,1.2,1.14),430,1.65,(1,.89,.73))
area("Reflected window light",(-2.0,-1.4,3.4),(-6.9,.4,1.5),140,3.1,(.85,.91,1))
camera=bpy.data.cameras.new("Reading room lens")
obj=bpy.data.objects.new("Inside the library",camera)
scene.collection.objects.link(obj)
obj.location=(-2.15,1.97,2.23)
aim=Vector((-6.6,-.64,1.62))
obj.rotation_euler=(aim-obj.location).to_track_quat("-Z","Y").to_euler()
camera.lens=27
scene.camera=obj
scene.render.filepath=str(OUT/"reading-room.jpg")
# Save in the room with both collections available in the Outliner.
bpy.ops.wm.save_as_mainfile(filepath=str(Path(__file__).with_name("Travellers Rest.blend")),compress=True)
bpy.ops.render.render(write_still=True)
