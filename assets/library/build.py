"""Build The Library in a fresh background Blender process. Coordinates in the manifest are glTF Y-up meters."""
import json
import math
import random
import sys
from collections import defaultdict
from pathlib import Path

import numpy as np
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
DEST = ROOT / "public" / "library"
DEST.mkdir(parents=True, exist_ok=True)
manifest = json.loads((Path(__file__).parent / "manifest.json").read_text())
LOW = "--low" in sys.argv
rng = random.Random(1842)
pi = math.pi

if not bpy.app.background:
    raise RuntimeError("Run in a separate background Blender process")
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = "METRIC"
scene.render.engine = "CYCLES"
scene.cycles.samples = 20
scene.cycles.use_denoising = True
scene.render.threads_mode = "FIXED"
scene.render.threads = 10
scene.world = bpy.data.worlds.new("Daylit hall")
scene.world.color = (.10, .10, .10)

def xyz(p):
    return (p[0], -p[2], p[1])

def linear(value):
    v = value / 255
    return v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4

def material(name, color, metal=0, glow=0):
    mat = bpy.data.materials.new(name)
    c = tuple(linear(int(color[i:i+2],16)) for i in (0,2,4)) + (1,)
    mat.diffuse_color = c
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = c
    shader.inputs["Roughness"].default_value = .43 if metal else .72
    shader.inputs["Metallic"].default_value = metal
    if glow:
        shader.inputs["Emission Color"].default_value = c
        shader.inputs["Emission Strength"].default_value = glow
    return name

oak = material("Oiled quarter-sawn oak","83583d")
dark = material("Walnut joinery","442e25")
trim = material("Carved oak molding","a17a51")
shadow = material("Recessed cabinet back","352a25")
brass = material("Brushed champagne brass","c9a76a",.56)
bronze = material("Antiqued bronze","8a6d42",.35)
stone = material("Warm limestone","c9bba2")
plaster = material("Limewashed plaster","dfd3b9")
green = material("Library green wool","304c40")
border = material("Woven runner border","8c7953")
paper = material("Ivory laid paper","d0bc91")
bulb = material("Opal lamp glass","ffe7ab",0,2.4)
sky = material("Daylight glazing","f6e4be",0,1.6)
leaf = material("Fern fronds","476746")
cloth = [material("Cloth "+str(i),color) for i,color in enumerate(
    ["3c5144","735040","86583f","a08b63","5e3431","596369","354747","534339","8d795a","343333"])]
floors = [material("Parquet "+str(i),c) for i,c in enumerate(["845e43","977555","a7835d","8d694d","b18e68"])]

# Preserve editable architectural parts in the source, batch static parts by material for export.
parts = defaultdict(lambda: [[],[]])
section = "Architecture"
frame = (0,0,0)
def place(p):
    x,z,a = frame
    c,s = math.cos(a),math.sin(a)
    return xyz((x+c*p[0]+s*p[2],p[1],z-s*p[0]+c*p[2]))

def mesh(mat, verts, faces):
    v,f = parts[(section,mat)]
    offset = len(v)
    v.extend(place(p) for p in verts)
    f.extend(tuple(offset+i for i in face) for face in faces)

def box(mat,x,y,z,w,h,d):
    verts = [(x+i*w/2,y+j*h/2,z+k*d/2) for k in (-1,1) for j in (-1,1) for i in (-1,1)]
    mesh(mat,verts,[(0,2,3,1),(4,5,7,6),(0,4,6,2),(1,3,7,5),(0,1,5,4),(2,6,7,3)])

def rod(mat,p,q,r=0.035,r2=None,n=10):
    if LOW: n=min(n,6)
    a,b = Vector(p),Vector(q)
    axis = (b-a).normalized()
    u = axis.cross(Vector((1,0,0)) if abs(axis.x)<.9 else Vector((0,1,0))).normalized()
    v = axis.cross(u)
    verts = [center + radius*(u*math.cos(i*2*pi/n)+v*math.sin(i*2*pi/n))
             for center,radius in ((a,r),(b,r if r2 is None else r2)) for i in range(n)]
    mesh(mat,verts,[tuple(reversed(range(n))),tuple(range(n,n*2))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)])

def arc(mat,cx,cy,z,r,start=0,end=2*pi,width=.045,n=40):
    if LOW: n=min(n,24)
    pts=[(cx+r*math.cos(start+(end-start)*i/n),cy+r*math.sin(start+(end-start)*i/n),z) for i in range(n+1)]
    for p,q in zip(pts,pts[1:]):
        rod(mat,p,q,width,n=6)

def globe(mat,x,y,z,r):
    rings,steps=(6,12) if LOW else (10,20)
    verts=[(x+r*math.sin(pi*j/rings)*math.cos(i*2*pi/steps),y+r*math.cos(pi*j/rings),
            z+r*math.sin(pi*j/rings)*math.sin(i*2*pi/steps)) for j in range(rings+1) for i in range(steps)]
    mesh(mat,verts,[(j*steps+i,j*steps+(i+1)%steps,(j+1)*steps+(i+1)%steps,(j+1)*steps+i)
                    for j in range(rings) for i in range(steps)])

def anchor(name,pos,yaw=0):
    obj=bpy.data.objects.new(name,None)
    scene.collection.objects.link(obj)
    obj.location=xyz(pos)
    obj.rotation_euler.z=math.radians(yaw)
    obj.empty_display_size=.25

def lettering(title,at,yaw,size=.16,mat=paper):
    curve=bpy.data.curves.new(title,"FONT")
    curve.body=title
    curve.align_x="CENTER"
    curve.align_y="CENTER"
    curve.size=size
    curve.space_character=1.12
    curve.resolution_u=2
    curve.materials.append(bpy.data.materials[mat])
    obj=bpy.data.objects.new("Inscription · "+title,curve)
    scene.collection.objects.link(obj)
    obj.location=xyz(at)
    obj.rotation_euler=(pi/2,0,math.radians(yaw))
    # Convert a private copy so the source labels travel through the batching and bake.
    depsgraph=bpy.context.evaluated_depsgraph_get()
    data=bpy.data.meshes.new_from_object(obj.evaluated_get(depsgraph))
    replacement=bpy.data.objects.new(obj.name+" mesh",data)
    scene.collection.objects.link(replacement)
    replacement.matrix_world=obj.matrix_world.copy()
    bpy.data.objects.remove(obj,do_unlink=True)

def panel(x,y,z,w,h):
    box(dark,x,y,z,w,h,.12)
    box(oak,x,y,z+.08,w-.10,h-.10,.08)
    box(trim,x,y,z+.13,w-.26,h-.26,.04)
    box(oak,x,y,z+.16,w-.32,h-.32,.03)

def books(xmin,xmax,y,z,scale=1):
    x=xmin
    while x < xmax-.12:
        color=rng.choice(cloth)
        for _ in range(rng.randrange(2,7)):
            w=rng.uniform(.095,.185)*scale
            if x+w>xmax: return
            h=rng.uniform(.46,.75)*scale
            front=z+rng.uniform(-.025,.018)
            box(color,x+w/2,y+h/2,front,w-.012,h,.30*scale)
            for pos in ((.82,) if LOW else (.14,.82)):
                box(bronze,x+w/2,y+h*pos,front+.151*scale,w-.024,.016*scale,.012)
            if rng.random()<.45:
                box(paper,x+w/2,y+h*.65,front+.154*scale,w*.59,.068*scale,.009)
            x+=w
        x+=rng.uniform(.035,.20)

def cabinet(x,z,yaw,w,name):
    global frame,section
    section=name
    frame=(x,z,math.radians(yaw))
    box(shadow,0,1.9,-.24,w,3.8,.3)
    box(dark,0,.14,.08,w+.18,.28,.82)
    for dx in (-w/2,w/2):
        box(oak,dx,1.9,.15,.16,3.8,.64)
        box(trim,dx,1.96,.49,.09,3.7,.055)
    for yy in (.75,1.66,2.57,3.49):
        box(oak,0,yy,.13,w,.12,.68)
        box(trim,0,yy+.013,.483,w+.04,.05,.035)
    for row,yy in enumerate((.82,1.73,2.64)):
        if name=="Evolution timeline":
            for k in range(2):
                dx=(k-.5)*w*.46
                box(bronze,dx,yy+.39,.18,1.13,.72,.09)
                box(green,dx,yy+.39,.24,1.05,.64,.045)
                arc(brass,dx,yy+.39,.27,.21,width=.012)
                for n in range(row*2+k+1):
                    t=2*pi*n/(row*2+k+1)
                    rod(paper,(dx,yy+.39,.28),(dx+.17*math.cos(t),yy+.39+.17*math.sin(t),.28),.011)
        elif name=="Journal":
            for k in range(4):
                dx=(k-1.5)*w*.23
                box(cloth[(row+k)%len(cloth)],dx,yy+.37,.24,.53,.71,.1)
                box(paper,dx,yy+.49,.30,.43,.33,.015)
                for line in range(4):
                    box(dark,dx,yy+.58-line*.052,.314,.32-line*.034,.014,.008)
        else:
            books(-w/2+.14,w/2-.14,yy,.18)
    for xx in (-w/4,w/4):
        panel(xx,.45,.38,w/2-.12,.49)
        box(brass,xx,.48,.57,.27,.035,.035)
    box(dark,0,3.67,.13,w+.26,.26,.77)
    box(trim,0,3.79,.13,w+.36,.09,.86)
    box(brass,0,3.64,.53,2.60,.25,.03)
    box(green,0,3.64,.55,2.54,.21,.025)
    angle=math.radians(yaw)
    lettering(name.upper(),(x+.575*math.sin(angle),3.64,z+.575*math.cos(angle)),yaw,.142)
    frame=(0,0,0)

# Parquet floor and bordered wool aisle runner.
for k in range(42):
    z=-10.65+k*.53
    for j in range(-3,4):
        a=max(-10.86,j*3.9+(k%2)*1.95)
        b=min(10.86,(j+1)*3.9+(k%2)*1.95)
        if b>a: box(rng.choice(floors),(a+b)/2,-.07,z,b-a-.012,.14,.522)
box(green,0,.014,-.1,3.85,.025,20.9)
for x in (-1.82,-1.71,1.71,1.82):
    box(border,x,.029,-.1,.024,.004,20.9)
for z in (-10.3,10.1):
    box(border,0,.031,z,3.6,.004,.04)
for side in (-1,1):
    box(stone,side*10.83,4,0,.28,8,22)
box(stone,0,4,-10.83,21.8,8,.26)
box(plaster,0,7.94,0,22,.18,22)
for z in (-10,-6,-2,2,6,10):
    box(dark,0,7.72,z,21.8,.42,.32)
    box(trim,0,7.47,z,21.8,.08,.44)
for x in (-9,-5.4,-1.8,1.8,5.4,9):
    box(oak,x,7.72,0,.19,.26,22)

# Rear clerestory and a radial rose window.
def window(x,y,z,w,h):
    r=w/2
    box(sky,x,y+(h-r)/2,z,w,h-r,.08)
    verts=[(x,y+h-r,z+.05)]+[(x+r*math.cos(pi*i/32),y+h-r+r*math.sin(pi*i/32),z+.05) for i in range(33)]
    mesh(sky,verts,[(0,i,i+1) for i in range(1,33)])
    arc(trim,x,y+h-r,z+.09,r,0,pi,.10)
    arc(bronze,x,y+h-r,z+.13,r-.10,0,pi,.025)
    for xx in (-r,r):
        box(trim,x+xx,y+(h-r)/2,z+.09,.16,h-r,.15)
    for xx in (-r*.5,0,r*.5):
        top=h-r+math.sqrt(r*r-xx*xx)
        box(bronze,x+xx,y+top/2,z+.14,.047,top,.05)
    for yy in (y+.53,y+h-r):
        box(bronze,x,yy,z+.14,w,.055,.05)
    box(trim,x,y-.04,z+.12,w+.3,.13,.31)

section="Clerestory"
for x in (-8.6,-5.1,5.1,8.6):
    window(x,4.67,-10.58,2.6,2.60)
def rose():
    x,y,z,r=0,5.74,-10.49,1.72
    verts=[(x,y,z)]+[(r*math.cos(2*pi*i/64),y+r*math.sin(2*pi*i/64),z) for i in range(64)]
    mesh(sky,verts,[(0,1+i,1+(i+1)%64) for i in range(64)])
    for rad,m,w in ((r+.08,stone,.17),(r,trim,.11),(r-.09,brass,.035),(.38,brass,.045),(.21,bronze,.022)):
        arc(m,x,y,z+.11,rad,width=w)
    for i in range(16):
        a=i*pi/8
        rod(bronze,(.4*math.cos(a),y+.4*math.sin(a),z+.12),(r*math.cos(a),y+r*math.sin(a),z+.12),.022)
rose()
for side in (-1,1):
    frame=(side*10.6,0,math.radians(-side*90))
    for xx in (-8,-4,0,4,8):
        window(xx,4.65,0,2.48,2.64)
    frame=(0,0,0)

# Carved fascia, pilasters and a continuous upper balustrade along three walls.
for x,z,angle,length in [(0,-9.93,0,21),(10,0,-90,21),(-10,0,90,21)]:
    frame=(x,z,math.radians(angle))
    for y,w,d,m in ((3.96,.28,1.2,dark),(4.15,.12,1.36,trim),(4.23,.08,1.44,oak),(4.82,.10,.11,oak)):
        box(m,0,y,.54 if y>4.3 else .16,length,w,d)
    for i in range(43):
        xx=-length/2+i*length/42
        rod(bronze,(xx,4.22,.54),(xx,4.81,.54),.032,n=8)
    for xx in (-9.64,-4.86,0,4.86,9.64):
        box(dark,xx,2,.45,.31,4,.5)
        for dx in (-.09,0,.09): box(trim,xx+dx,2,.707,.035,3.8,.025)
    frame=(0,0,0)

for shelf in manifest["shelves"]:
    cabinet(shelf["x"],shelf["z"],shelf["yaw"],4.50 if shelf["zone"]=="stacks" else 3.6,shelf["title"])
    anchor(shelf["node"],(shelf["x"],0,shelf["z"]),shelf["yaw"])
for zone in manifest["zones"]:
    anchor(zone["node"],zone["target"])

def table(x,z,w,d,desk=False):
    box(dark,x,1.03,z,w+.18,.12,d+.14)
    box(trim,x,1.11,z,w+.22,.055,d+.18)
    box(oak,x,1.16,z,w+.25,.06,d+.20)
    for dx in (-w*.42,w*.42):
        for dz in (-d*.37,d*.37):
            box(dark,x+dx,.53,z+dz,.16,1.06,.16)
            box(trim,x+dx,.16,z+dz,.22,.14,.22)
    if desk:
        box(dark,x,.54,z,w,1.05,d)
        for i in range(3):
            panel(x+(i-1)*w/3,.54,z+d/2,w/3-.1,.82)
        box(brass,x,.76,z+d/2+.18,.63,.12,.03)

def lamp(x,z,y):
    rod(brass,(x,y,z),(x,y+.06,z),.18,n=20)
    rod(brass,(x,y+.06,z),(x,y+.64,z),.035)
    rod(brass,(x-.28,y+.64,z),(x+.28,y+.64,z),.025)
    rod(green,(x-.33,y+.62,z),(x+.33,y+.62,z),.154,n=20)
    box(bulb,x,y+.51,z+.03,.54,.05,.19)

section="Welcome desk"
table(2.1,2.4,3.75,1.32,True)
lamp(3.39,2.48,1.19)
# Armillary sphere, meridian, pole, and latitudes.
cx,cy,cz=1.04,1.95,2.4
rod(bronze,(cx,1.19,cz),(cx,1.26,cz),.28,n=24)
rod(brass,(cx,1.26,cz),(cx,1.6,cz),.11,.055)
arc(brass,cx,cy,cz,.45,width=.035)
for tilt in (-.64,.5,1.2):
    pts=[(cx+.425*math.cos(i*pi/24),cy+.425*math.sin(i*pi/24)*math.sin(tilt),
          cz+.425*math.sin(i*pi/24)*math.cos(tilt)) for i in range(49)]
    for p,q in zip(pts,pts[1:]): rod(brass,p,q,.018,n=6)
globe(bronze,cx,cy,cz,.15)
for i in range(3): box(cloth[3+i],2.1,1.22+i*.073,2.54,.47,.068,.61)

section="Reading tables"
table(-6.8,-4.65,2.7,1)
lamp(-6.8,-4.65,1.19)
for x in (-7.6,-6):
    for z in (-5.50,-3.79):
        box(green,x,.52,z,.51,.13,.51)
        for dx in (-.20,.20):
            for dz in (-.2,.2): box(oak,x+dx,.25,z+dz,.055,.5,.055)
        box(oak,x,.83,z+(.24 if z>-4.65 else -.24),.51,.57,.085)
section="Workstation"
table(8.54,5.4,1.36,3)
for scr in manifest["screens"]:
    x,y,z=scr["pos"]
    box(dark,x,y,z,.11,.73,1.14)
    box(green,x-.063,y,z,.022,.64,1.05)
    for i in range(5): box(bronze,x-.08,y+.20-i*.078,z+.12-(i%2)*.03,.01,.013,.36+i*.06)
    box(bronze,x,1.23,z,.1,.21,.1)
    anchor(scr["node"],scr["pos"])
box(dark,8.1,1.22,5.97,.27,.035,.63)
for k in range(10):
    for row in range(4):
        box(cloth[6],8.0+row*.053,1.244,5.71+k*.056,.039,.013,.045)
box(green,7.5,.59,5.9,.65,.14,.67)
rod(bronze,(7.5,.09,5.9),(7.5,.57,5.9),.07)
for i in range(5):
    rod(dark,(7.5,.12,5.9),(7.5+.36*math.cos(i*2*pi/5),.07,5.9+.36*math.sin(i*2*pi/5)),.035)
box(oak,7.18,.89,5.9,.09,.56,.65)
lettering("CATALOG",(8.41,1.76,6.10),-90,.087)
lettering("REFERENCE",(8.41,1.76,4.70),-90,.087)
lettering("LIBRARY GUIDE",(2.1,.76,3.255),0,.064)

section="Pendant fixtures"
for z in (-6.2,1.4,8):
    rod(bronze,(0,7.75,z),(0,5.55,z),.035)
    rod(brass,(0,5.48,z),(0,5.63,z),.14,.09)
    for i in range(6):
        a=i*pi/3
        x,dz=math.cos(a)*.98,math.sin(a)*.98
        rod(brass,(0,5.56,z),(x,5.47,z+dz),.027)
        rod(brass,(x,5.47,z+dz),(x,5.64,z+dz),.058)
        globe(bulb,x,5.82,z+dz,.205)

section="Botanicals"
for x,z in ((4.55,2.3),(4.4,-7.8),(-8.6,3.1),(8.9,8.3)):
    rod(bronze,(x,.02,z),(x,.66,z),.29,.41,24)
    rod(brass,(x,.63,z),(x,.69,z),.43,n=24)
    for i in range(33):
        a=i*2.4
        h=rng.uniform(.55,1.34)
        end=(x+math.cos(a)*h*.50,.68+h,z+math.sin(a)*h*.50)
        rod(leaf,(x,.62,z),end,.021,.008,5)
        for j in range(2,9):
            t=j/10
            p=Vector((x+(end[0]-x)*t,.62+(end[1]-.62)*t,z+(end[2]-z)*t))
            for sign in (-1,1):
                tip=p+Vector((math.sin(a)*sign*.25*(1-t/2),.12,math.cos(a)*sign*.25*(1-t/2)))
                mesh(leaf,[p,p+Vector((.022,.06,.012)),tip,p+Vector((-.022,.02,-.012))],[(0,1,2),(0,2,3)])

timbers={oak:"oak",dark:"walnut",trim:"trim", **{f:"parquet" for f in floors}}
for label,filename in timbers.items():
    mat=bpy.data.materials[label]
    tex=mat.node_tree.nodes.new("ShaderNodeTexImage")
    tex.image=bpy.data.images.load(str(Path(__file__).parent/(filename+".jpg")),check_existing=True)
    tex.image.pack()
    mat.node_tree.links.new(tex.outputs["Color"],mat.node_tree.nodes.get("Principled BSDF").inputs["Base Color"])

for (label,mat),(verts,faces) in parts.items():
    data=bpy.data.meshes.new(label+" · "+mat)
    data.from_pydata(verts,[],faces)
    if mat in timbers:
        uv=data.uv_layers.new(name="Timber grain")
        for poly in data.polygons:
            coords=[data.vertices[i].co for i in poly.vertices]
            axes=sorted(range(3),key=lambda a:max(v[a] for v in coords)-min(v[a] for v in coords),reverse=True)
            for index,v in zip(poly.loop_indices,coords):
                uv.data[index].uv=(v[axes[0]]/3.7,v[axes[1]]/1.3)
    data.materials.append(bpy.data.materials[mat])
    data.update()
    obj=bpy.data.objects.new(data.name,data)
    scene.collection.objects.link(obj)

def area(name,pos,target,power,size,color):
    light=bpy.data.lights.new(name,"AREA")
    light.energy=power
    light.shape="DISK"
    light.size=size
    light.color=color
    obj=bpy.data.objects.new(name,light)
    scene.collection.objects.link(obj)
    obj.location=xyz(pos)
    obj.rotation_euler=(Vector(xyz(target))-obj.location).to_track_quat("-Z","Y").to_euler()

for side in (-1,1):
    for z in (-7,0,7):
        area("Clerestory daylight",(side*9.75,6.15,z),(0,1,z-1),700,3,(1,.86,.69))
for z in (-6.2,1.4,8):
    area("Pendant pool",(0,5.36,z),(0,0,z),310,2.2,(1,.76,.49))
area("Rear window",(0,5.8,-9.9),(-2,1,2),1600,3.2,(1,.86,.64))
area("Entrance fill",(5,4.5,9),(0,1,-4),640,5,(.91,.94,1))
camera_data=bpy.data.cameras.new("Entrance")
cam=bpy.data.objects.new("Entrance camera",camera_data)
scene.collection.objects.link(cam)
zone=manifest["zones"][0]
cam.location=xyz(zone["eye"])
cam.rotation_euler=(Vector(xyz(zone["target"]))-cam.location).to_track_quat("-Z","Y").to_euler()
camera_data.lens=25
scene.view_settings.look="AgX - Medium High Contrast"
scene.view_settings.exposure=-0.38
scene.camera=cam
scene.render.resolution_x=1600
scene.render.resolution_y=840
scene.render.resolution_percentage=100
scene.render.image_settings.file_format="WEBP"
scene.render.image_settings.quality=86
scene.render.filepath=str(DEST/"entrance.webp")
bpy.context.preferences.filepaths.save_version=0
if not LOW: bpy.ops.wm.save_as_mainfile(filepath=str(Path(__file__).parent/"The Library.blend"),compress=True)
# Merge by material in export only. The .blend retains named furniture and architectural components.
bpy.ops.object.select_all(action="DESELECT")
buckets=defaultdict(list)
for obj in scene.objects:
    if obj.type=="MESH": buckets[obj.data.materials[0].name].append(obj)
for mat,objects in buckets.items():
    for obj in objects: obj.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    if len(objects)>1: bpy.ops.object.join()
    bpy.context.view_layer.objects.active.name="Hall · "+mat
    bpy.ops.object.select_all(action="DESELECT")
# Bake diffuse irradiance at mesh corners. This preserves window light, contact
# shadows and bounced light in the browser without real-time shadow passes.
static_meshes=[obj for obj in scene.objects if obj.type=="MESH"]
for obj in static_meshes:
    attr=obj.data.color_attributes.new(name="Daylight",type="BYTE_COLOR",domain="CORNER")
    obj.data.color_attributes.active_color=attr
    obj.select_set(True)
bpy.context.view_layer.objects.active=static_meshes[0]
scene.cycles.samples=12
bpy.ops.object.bake(type="DIFFUSE",pass_filter={"DIRECT","INDIRECT"},target="VERTEX_COLORS")
# Retain contact shading without crushing dark interiors when the PBR lights
# in the viewer multiply the baked irradiance a second time.
for obj in static_meshes:
    colors=obj.data.color_attributes["Daylight"].data
    rgba=np.empty(len(colors)*4,dtype=np.float32)
    colors.foreach_get("color",rgba)
    channels=rgba.reshape((-1,4))
    channels[:,:3]=.36+.64*np.sqrt(np.clip(channels[:,:3],0,1))
    channels[:,3]=1
    colors.foreach_set("color",rgba)
bpy.ops.object.select_all(action="DESELECT")
(ROOT/".local-library").mkdir(exist_ok=True)
bpy.ops.export_scene.gltf(export_vertex_color="ACTIVE",filepath=str(ROOT/".local-library"/("hall-low-master.glb" if LOW else "hall-master.glb")),export_format="GLB",export_cameras=False,
    export_lights=False,export_animations=False,export_yup=True,export_materials="EXPORT")
if not LOW:
    bpy.ops.render.render(write_still=True)
    scene.render.resolution_x=650
    scene.render.resolution_y=840
    camera_data.lens=21
    scene.render.filepath=str(DEST/"entrance-portrait.webp")
    bpy.ops.render.render(write_still=True)
print("Library assets written to",DEST)

