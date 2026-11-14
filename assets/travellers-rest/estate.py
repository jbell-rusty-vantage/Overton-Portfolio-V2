"""Build the integrated draft from the preserved architectural study in Blender 5.2."""
import bpy
import json
import math
from mathutils import Vector
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = ROOT / "public/travellers-rest"
WORK = ROOT / ".local-library/estate"
WORK.mkdir(exist_ok=True, parents=True)
bpy.ops.wm.open_mainfile(filepath=str(HERE / "Travellers Rest.blend"))
scene = bpy.context.scene
house, library = (bpy.data.collections[name] for name in ("House", "Library"))
house.hide_viewport = house.hide_render = False
hall = bpy.data.collections.new("Entry hall")
rig = bpy.data.collections.new("Portrait performance")
anchors = bpy.data.collections.new("Visitor anchors")
for collection in (hall, rig, anchors):
    scene.collection.children.link(collection)

def material(name, color, roughness=.65, metallic=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    return mat

def box(name, center, size, mat, group=hall, bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    obj = bpy.context.object
    obj.name = name
    group.objects.link(obj)
    for col in list(obj.users_collection):
        if col != group:
            col.objects.unlink(obj)
    for vert in obj.data.vertices:
        for axis, scale in enumerate(size):
            vert.co[axis] *= scale
    obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new("Soft worked edges", "BEVEL")
        mod.width, mod.segments = bevel, 2
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj

def picture_material(name, path, unlit=False):
    mat = material(name, (.6,.5,.4))
    nt = mat.node_tree
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(str(path), check_existing=True)
    tex.image.pack()
    shader = nt.nodes["Principled BSDF"]
    if unlit:
        shader = nt.nodes.new("ShaderNodeEmission")
        nt.links.new(shader.outputs[0], nt.nodes["Material Output"].inputs["Surface"])
        nt.links.new(tex.outputs["Color"], shader.inputs["Color"])
    else:
        nt.links.new(tex.outputs["Color"], shader.inputs["Base Color"])
    return mat

chalk = material("Limewashed plaster", (.69,.635,.50))
rail = material("Painted skirting and rails", (.32,.34,.255))
ivory = material("Porch joinery", (.79,.76,.66))
bronze = material("Time-darkened gilt", (.37,.22,.085), .28, .62)
black = material("Ebonized moulding", (.04,.027,.02), .37)
wood = bpy.data.objects["Writing table"].data.materials[0]
linen = material("Cream laid paper", (.77,.68,.46))
ash = bpy.data.objects["White ash flooring"].data.materials[0]

# Replace the massing block with an open south doorway, retaining the study's envelope.
for name in ("Federal block", "Beaded clapboard courses", "South door", "Door panels"):
    bpy.data.objects.remove(bpy.data.objects[name], do_unlink=True)
for side in (-1, 1):
    box("South wall beside door", (side*4.264,-3.045,3.72),(7.3,.12,6.52),ivory,house)
    for n in range(49):
        box("Weatherboard bead", (side*4.264,-3.119,.54+n*.132),(7.30,.032,.018),ivory,house)
box("South wall above transom",(0,-3.045,5.02),(1.23,.12,3.96),ivory,house)
box("North wall",(0,3.08,3.72),(15.85,.15,6.52),ivory,house)
for side in (-1,1):
    box("Gable wall",(side*7.87,0,3.72),(.13,6.16,6.52),ivory,house)
box("South door, swung inward",(-.59,-2.52,1.67),(.085,1.15,2.3),rail)
for y in (-2.79,-2.25):
    for z in (.97,1.63,2.34):
        box("Raised field on open door",(-.54,y,z),(.036,.42,.48),ivory,bevel=.014)
box("Door rim lock",(-.507,-2.06,1.63),(.063,.10,.09),black)

# Left opening joins the hall to the surveyed southwest room.
box("Hall floor",(.07,0,.49),(3.27,6.15,.08),ash)
box("Hall east wall",(1.73,0,2.13),(.13,6.18,3.23),chalk)
box("Hall ceiling",(.07,0,3.76),(3.28,6.2,.08),chalk)
for y, length in ((-2.77,.59),(.97,4.16)):
    box("Library partition",(-1.54,y,2.13),(.13,length,3.23),chalk)
    box("Hall dado",(-1.46,y,1.0),(.075,length,.92),rail)
    box("Hall chair rail",(-1.40,y,1.48),(.087,length,.075),ivory)
box("West doorway lintel",(-1.54,-1.76,3.27),(.16,1.4,1.0),chalk)
for y in (-2.41,-1.13):
    box("Library door surround",(-1.45,y,1.65),(.13,.092,2.26),ivory)
box("Library architrave",(-1.45,-1.77,2.79),(.15,1.43,.12),ivory)
box("Hall east wainscot",(1.62,0,1.01),(.07,6.10,.93),rail)
box("Hall east chair rail",(1.56,0,1.49),(.095,6.10,.07),ivory)
for n in range(16):
    y, top = -.85+n*.232, .715+n*.193
    box("Closed stair riser",(-.91,y,(top+.525)/2),(1.02,.236,top-.525),rail)
    box("Ash stair tread",(-.91,y,top),(1.08,.256,.052),wood,bevel=.008)
    box("Square stair baluster",(-.39,y,top+.46),(.036,.036,.94),ivory)
handrail = box("Stair handrail",(-.39,.90,3.11),(.076,4.70,.088),wood,bevel=.016)
handrail.rotation_euler.x = math.atan2(.193,.232)
box("Turned newel base",(-.39,-.98,1.12),(.12,.12,1.17),rail,bevel=.015)
box("Upper landing",(-.86,2.92,3.67),(1.33,.48,.13),wood)
box("Map table",(1.18,.38,1.37),(.79,1.42,.07),wood,bevel=.017)
for x in (.87,1.48):
    for y in (-.20,.97):
        box("Map table leg",(x,y,.94),(.057,.057,.83),wood,bevel=.006)

def panel(name, verts, mat, group):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], [(0,1,2,3)])
    mesh.materials.append(mat)
    uv = mesh.uv_layers.new()
    for i, xy in enumerate(((0,0),(1,0),(1,1),(0,1))):
        uv.data[i].uv = xy
    obj = bpy.data.objects.new(name, mesh)
    group.objects.link(obj)
    return obj

archive = OUT / "archive"
panel("A map of the Tennassee Government",[(.87,-.08,1.408),(1.49,-.08,1.408),(1.49,.83,1.408),(.87,.83,1.408)],
      picture_material("1795 map",archive/"tennessee-map.webp"),hall)
panel("Letter on the writing table",[(-4.64,-.61,1.387),(-4.30,-.61,1.387),(-4.30,-.30,1.387),(-4.64,-.30,1.387)],
      picture_material("1832 letter",archive/"overton-letter.webp"),library)
panel("Jackson on the hall wall",[(1.641,.67,1.70),(1.641,-.01,1.70),(1.641,-.01,2.80),(1.641,.67,2.80)],
      picture_material("Earl's Jackson",archive/"andrew-jackson.webp"),hall)
for y in (-.445,.445):
    box("Portrait gilt side",(-7.37,y,2.8),(.086,.065,1.18),bronze,library,.009)
for z in (2.24,3.36):
    box("Portrait gilt rail",(-7.37,0,z),(.086,.95,.067),bronze,library,.009)
box("Portrait rabbet",(-7.4,0,2.80),(.045,.90,1.15),black,library)

# A registered relief rig uses the actual photograph at every pose. Coordinates are
# normalized in the photograph, with the origin at its top-left. The sitter's hands
# are outside the composition; his near shoulder and gaze indicate the books.
nx, ny = 81, 101
verts, faces, uvpoints = [], [], []
def gauss(x,y,cx,cy,rx,ry):
    return math.exp(-((x-cx)/rx)**2 - ((y-cy)/ry)**2)
for j in range(ny):
    for i in range(nx):
        u,v = i/(nx-1),j/(ny-1)
        verts.append((-7.324,(u-.5)*.848,2.80+(.5-v)*1.064))
        uvpoints.append((u,1-v))
        n = j*nx+i
        if i and j:
            faces.append((n-nx-1,n-nx,n,n-1)[::-1])
mesh = bpy.data.meshes.new("Registered photographic relief")
mesh.from_pydata(verts,[],faces)
uv = mesh.uv_layers.new()
for loop in mesh.loops:
    uv.data[loop.index].uv=uvpoints[loop.vertex_index]
portrait=bpy.data.objects.new("Overton · registered likeness",mesh)
rig.objects.link(portrait)
mesh.materials.append(picture_material("TeVA portrait, original tones",archive/"judge-overton.webp",True))
portrait.shape_key_add(name="Earl resting pose")
for keyname, keys in [
    ("Look to visitor", [(1,0),(19,0),(31,1),(68,1),(92,0),(136,0)]),
    ("Recognition and head turn", [(1,0),(32,0),(57,1),(76,.85),(106,0),(136,0)]),
    ("Indicate the reports", [(1,0),(70,0),(103,1),(136,.85)]),
    ("Blink", [(1,0),(36,0),(39,1),(43,0),(84,0),(86,.8),(90,0),(136,0)])
]:
    key=portrait.shape_key_add(name=keyname)
    for idx,p in enumerate(key.data):
        u,v=uvpoints[idx][0],1-uvpoints[idx][1]
        eyes = gauss(u,v,.467,.290,.013,.010)+gauss(u,v,.554,.299,.012,.009)
        head = gauss(u,v,.458,.304,.153,.174)
        shoulder = gauss(u,v,.665,.676,.16,.105)
        if keyname.startswith("Look"):
            p.co.y -= .0065*eyes
        elif keyname.startswith("Recognition"):
            p.co.y -= .014*head
            p.co.z += .004*head
            p.co.x += .009*head
        elif keyname.startswith("Indicate"):
            p.co.y += .011*head+.015*shoulder+.005*eyes
            p.co.z -= .012*head-.007*shoulder+.003*eyes
        else:
            p.co.z += (v-.296)*.58*(gauss(u,v,.467,.29,.024,.014)+gauss(u,v,.554,.299,.02,.012))
    for frame,value in keys:
        key.value=value
        key.keyframe_insert(data_path="value",frame=frame)
mesh.shape_keys.animation_data.action.name="Custodian recognition"
scene.frame_start,scene.frame_end,scene.render.fps=1,136,24
scene.frame_set(1)
for name,(x,y,z) in json.loads((HERE/"anchors.json").read_text()).items():
    obj=bpy.data.objects.new(name,None)
    anchors.objects.link(obj)
    obj.empty_display_size=.09
    obj.location=(x,-z,y)

def aim(obj, target):
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat("-Z","Y").to_euler()
def lamp(name,position,target,power,size,color):
    light=bpy.data.lights.new(name,"AREA")
    light.energy,light.size,light.color=power,size,color
    obj=bpy.data.objects.new(name,light)
    scene.collection.objects.link(obj)
    obj.location=position
    aim(obj,target)
lamp("Light through south transom",(.22,-2.8,2.98),(.30,2.30,1),225,1.15,(1,.83,.60))
lamp("Parlor bounce",(1.51,-.30,2.74),(-1.20,1.5,1.3),100,2.3,(.83,.89,1))
scene.render.engine="CYCLES"
scene.cycles.samples=12
scene.render.resolution_percentage=100
scene.render.image_settings.file_format="JPEG"
scene.render.image_settings.quality=90
scene.render.resolution_x,scene.render.resolution_y=1200,750
scene.camera.location=(.37,-2.76,2.06)
scene.camera.data.lens=24
aim(scene.camera,(.12,1.70,1.87))
scene.render.filepath=str(WORK/"entry.jpg")
bpy.ops.render.render(write_still=True)

# Bake the hall's window and stair shadows to a separate floor surface for the browser.
floor=bpy.data.objects["Hall floor"]
bake_mat=ash.copy()
floor.data.materials[0]=bake_mat
for poly in floor.data.polygons:
    for li in poly.loop_indices:
        v=floor.data.vertices[floor.data.loops[li].vertex_index].co
        floor.data.uv_layers.active.data[li].uv=(v.x/3.27+.5,v.y/6.15+.5)
lightmap=bpy.data.images.new("Hall floor, baked indirect daylight",width=512,height=512)
tex=bake_mat.node_tree.nodes.new("ShaderNodeTexImage")
tex.image=lightmap
bake_mat.node_tree.nodes.active=tex
bpy.ops.object.select_all(action="DESELECT")
floor.select_set(True)
bpy.context.view_layer.objects.active=floor
bpy.ops.object.bake(type="DIFFUSE",pass_filter={"COLOR","DIRECT","INDIRECT"},margin=4)
lightmap.pack()
bake_mat.node_tree.links.new(tex.outputs["Color"],bake_mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"])

# Preserve a usable editable source with both architectural collections in place.
bpy.context.preferences.filepaths.save_version=0
scene.render.filepath="//entry.jpg"
bpy.ops.wm.save_as_mainfile(filepath=str(HERE/"Travellers Rest - guided.blend"),compress=True)
bpy.ops.object.select_all(action="DESELECT")
for collection in (house,library,hall,rig,anchors):
    for obj in collection.objects:
        obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(WORK/"world.glb"),use_selection=True,export_animations=True,export_yup=True)

# Orthographic plate uses the same facial animation, texture and camera alignment as the GLB.
portrait.select_set(True)
for obj in scene.objects:
    if obj.type=="MESH" and obj!=portrait:
        obj.hide_render=True
scene.camera.location=(-5.7,0,2.80)
aim(scene.camera,(-7.324,0,2.80))
scene.camera.data.type="ORTHO"
scene.camera.data.ortho_scale=1.064
scene.render.resolution_x,scene.render.resolution_y=640,802
scene.view_settings.view_transform="Standard"
scene.view_settings.look="None"
scene.cycles.samples=1
scene.render.filepath=str(WORK/"portrait-")
scene.render.image_settings.quality=94
bpy.ops.render.render(animation=True)
