"""Rebuild the edition-two shell from the preserved guided source, without re-voicing.
Owner decision: retain the existing portico and 3.19 m library ceiling.
All dimensions follow survey/survey.json; the reconstructed winders are approximate.
Run Blender --background --python-exit-code 1 --python this-file.
"""
import bpy, math, re, sys
from pathlib import Path
from mathutils import Vector

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = ROOT / '.local-library/estate/world-survey.glb'
bpy.ops.wm.open_mainfile(filepath=str(HERE / 'Travellers Rest - guided.blend'))
scene = bpy.context.scene
hall = bpy.data.collections['Entry hall']
house = bpy.data.collections['House']
def mat(name): return bpy.data.materials[name]
chalk=mat('Limewashed plaster'); rail=mat('Painted skirting and rails'); ivory=mat('Porch joinery')
wood=bpy.data.objects['Map table'].data.materials[0]
ash=bpy.data.objects['Hall floor'].data.materials[0]
def box(name, xyz, size, material, collection=hall):
 bpy.ops.mesh.primitive_cube_add(size=1,location=xyz)
 o=bpy.context.object; o.name=name
 for c in list(o.users_collection): c.objects.unlink(o)
 collection.objects.link(o)
 for v in o.data.vertices:
  for i,s in enumerate(size): v.co[i]*=s
 o.data.materials.append(material)
 return o
def remove(names):
 for o in list(bpy.data.objects):
  if re.sub(r'\.\d+$','',o.name) in names: bpy.data.objects.remove(o,do_unlink=True)
remove({'Hall floor','Hall ceiling','Library partition','Hall dado','Hall chair rail','West doorway lintel','Library door surround','Library architrave','Closed stair riser','Ash stair tread','Square stair baluster','Stair handrail','Turned newel base','Upper landing'})
box('Hall floor',(.22,0,.49),(3.58,6.15,.08),ash)
# Keep the 3.19 m ceiling; the landing stands on the top of its 80 mm floor slab.
# Open the stairwell instead of walking the visitor through the former solid ceiling.
for x0,x1,y0,y1 in [(-1.57,-1.42,-3.1,3.1),(.73,2.01,-3.1,3.1),(-1.42,.73,-3.1,-.15),(-1.42,.73,2.83,3.1)]:
 box('Hall ceiling',((x0+x1)/2,(y0+y1)/2,3.76),(x1-x0,y1-y0,.08),chalk)
# Only this small landing is reconstructed. No upper-room plan is inferred.
for y in (1.73,2.85):
 box('Survey landing guard rail',(1.27,y,4.72),(1.08,.065,.065),wood)
 for i in range(7):box('Survey landing guard baluster',(.76+i*.17,y,4.26),(.04,.04,.92),ivory)
box('Survey upper east boundary',(1.86,2.288,5.305),(.10,1.24,3.01),chalk)
box('Survey upper north boundary',(1.27,3.02,5.305),(1.28,.10,3.01),chalk)
box('Survey upper ceiling',(1.22,2.288,6.85),(1.3,1.5,.08),chalk)
for o in bpy.data.objects:
 if re.sub(r'\.\d+$','',o.name) in {'Hall east wall','Hall east wainscot','Hall east chair rail','Map table','Map table leg','Jackson on the hall wall','A map of the Tennassee Government'}: o.location.x+=.31
# Blender north +Y, house south +Z. Clear doorway y=-1.18 .. -.27.
for y0,y1 in [(-3.07,-1.18),(-.27,3.05)]:
 box('Library partition',(-1.54,(y0+y1)/2,2.13),(.13,y1-y0,3.23),chalk)
 box('Hall dado',(-1.46,(y0+y1)/2,1),(.075,y1-y0,.92),rail)
box('West doorway lintel',(-1.54,-.725,3.235),(.13,.91,1.01),chalk)
for y in (-1.18,-.27): box('Library door surround',(-1.45,y,1.63),(.13,.075,2.2),ivory)
box('Library architrave',(-1.45,-.725,2.79),(.15,1.06,.12),ivory)
# Eight straight treads, three triangular winders turning east, five upper treads.
rise=(3.80-.53)/16
for n in range(8):
 y=-.03+(n+.5)*.226; top=.53+(n+1)*rise
 box('Survey straight riser',(-.91,y,(top+.53)/2),(1.02,.226,top-.53),rail)
 box('Survey straight tread',(-.91,y,top),(1.06,.245,.035),wood)
 box('Survey stair baluster',(-.39,y,top+.45),(.035,.035,.9),ivory)
 # Individual short rails meet exactly; no long inclined box crossing the doorway.
 if n<7:
  o=box('Survey stair rail',(-.39,y+.113,top+.45+rise/2+.45),(.065,math.hypot(.226,rise),.065),wood)
  o.rotation_euler.x=math.atan2(rise,.226)
cx,cy=-.4,1.778
for n in range(3):
 a0=math.pi-n*math.pi/6; a1=math.pi-(n+1)*math.pi/6
 top=.53+(9+n)*rise
 points=[(cx,cy,top),(cx+1.02*math.cos(a0),cy+1.02*math.sin(a0),top),(cx+1.02*math.cos(a1),cy+1.02*math.sin(a1),top)]
 points += [(x,y,.53) for x,y,z in points]
 mesh=bpy.data.meshes.new('Survey winder');mesh.from_pydata(points,[],[(0,2,1),(3,4,5),(0,1,4,3),(1,2,5,4),(2,0,3,5)]);mesh.materials.append(wood)
 uv=mesh.uv_layers.new(name='UVMap')
 for loop in mesh.loops:
  v=mesh.vertices[loop.vertex_index].co;uv.data[loop.index].uv=(v.x,v.y)
 o=bpy.data.objects.new('Survey winder',mesh);hall.objects.link(o)
for n in range(5):
 x=-.4+(n+.5)*.226;top=.53+(12+n)*rise
 box('Survey upper riser',(x,2.288,(top+.53)/2),(.226,1.02,top-.53),rail)
 box('Survey upper tread',(x,2.288,top),(.245,1.02,.04),wood)
 box('Survey upper baluster',(x,1.778,top+.45),(.035,.035,.9),ivory)
 if n<4:
  o=box('Survey upper rail',(x+.113,1.778,top+.9+rise/2),(math.hypot(.226,rise),.065,.065),wood)
  o.rotation_euler.y=-math.atan2(rise,.226)
box('Survey newel',(-.39,.03,1.1),(.12,.12,1.14),rail)
# True window openings through the entire south envelope, so outdoors is visible.
remove({'South wall beside door','Weatherboard bead','South front sashes'})
# The shell's west gable used to seal the firebox behind the room. Open only that
# low rectangular chase; the room's stone arch supplies the finished inner edge.
for o in list(bpy.data.objects):
 if re.sub(r'\.\d+$','',o.name)=='Gable wall' and o.location.x<0:bpy.data.objects.remove(o,do_unlink=True)
for y0,y1 in [(-3.08,-.595),(.595,3.08)]:box('Survey west gable',(-7.87,(y0+y1)/2,3.72),(.13,y1-y0,6.52),ivory,house)
box('Survey west gable over hearth',(-7.87,0,4.19),(.13,1.19,5.58),ivory,house)
glass=bpy.data.materials.new('Survey exterior glazing');glass.diffuse_color=(.10,.17,.20,1)
glass.use_nodes=True
glass.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(.10,.17,.20,1)
glass.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.28
openings=[(-6.03-.4725,-6.03+.4725),(-3.55-.4725,-3.55+.4725),(-.615,.615),(3.5-.4725,3.5+.4725),(5.95-.4725,5.95+.4725)]
edges=[-7.914]+[v for gap in openings for v in gap]+[7.914]
for i in range(0,len(edges),2):
 x0,x1=edges[i:i+2];box('Survey south pier',((x0+x1)/2,-3.045,3.635),(x1-x0,.12,6.35),ivory,house)
for x0,x1 in openings:
 if x0<0<x1: continue
 box('Survey window apron',((x0+x1)/2,-3.045,.915),(x1-x0,.12,.91),ivory,house)
 box('Survey wall over window',((x0+x1)/2,-3.045,4.995),(x1-x0,.12,3.63),ivory,house)
 # The library's kit supplies its sashes; the east room is a closed exhibition shell.
 if x0>0:
  box('Survey east glazing',((x0+x1)/2,-3.10,2.275),(x1-x0,.025,1.81),glass,house)
  for k in range(5):box('Survey east sash stile',(x0+(x1-x0)*k/4,-3.126,2.275),(.025,.04,1.81),ivory,house)
  for k in range(8):box('Survey east sash rail',((x0+x1)/2,-3.126,1.37+1.81*k/7),(x1-x0,.04,.025),ivory,house)
# Preserve the weatherboard rhythm without filling the openings.
for n in range(48):
 z=.54+n*.132
 segments=[(-7.914,-.615),(.615,7.914)]
 if 1.37<z<3.18: segments=[(edges[i],edges[i+1]) for i in range(0,len(edges),2)]
 for x0,x1 in segments:box('Survey weatherboard bead',((x0+x1)/2,-3.119,z),(x1-x0,.032,.018),ivory,house)
# Upper rooms remain an opaque exhibition shell, but preserve the five-bay
# twelve-over-twelve elevation when replacing the original sash objects.
for x in (-6.03,-3.55,0,3.5,5.95):
 sill,head=4.571,6.102;w=.945;z=(sill+head)/2
 box('Survey upper surround',(x,-3.145,z),(w+.14,.10,head-sill+.14),ivory,house)
 box('Survey upper glazing',(x,-3.21,z),(w,.035,head-sill),glass,house)
 for k in range(5):box('Survey upper stile',(x-w/2+w*k/4,-3.24,z),(.025,.035,head-sill),ivory,house)
 for k in range(7):box('Survey upper rail',(x,-3.24,sill+(head-sill)*k/6),(w,.035,.04 if k==3 else .025),ivory,house)
# Roof and exterior chimneys: transform the surveyed main block only.
for o in bpy.data.objects:
 name=re.sub(r'\.\d+$','',o.name)
 if name in {'Shutters','Shutter louvers'}:
  centre=sum(v.co.x for v in o.data.vertices)/len(o.data.vertices)
  old,new=min(zip((-6.3,-3.77,0,3.77,6.3),(-6.03,-3.55,0,3.5,5.95)),key=lambda p:abs(abs(centre-p[0])-.84))
  side=1 if centre>old else -1
  upper=sum(v.co.z for v in o.data.vertices)/len(o.data.vertices)>3.7
  for v in o.data.vertices:
   v.co.x+=new-old+side*(.80-.84)
   v.co.z=(5.3365+(v.co.z-5.34)*1.531/1.46) if upper else (2.275+(v.co.z-2.07)*1.81/1.64)
 elif name=='Gable end chimney':
  # The preserved builder authors vertices in world coordinates, not at a local
  # box origin. Keep the inner masonry face outside the clapboard wall.
  sign=1 if sum(v.co.x for v in o.data.vertices)>0 else -1
  for v in o.data.vertices:
   v.co.x+=sign*(8.274-7.98);v.co.y*=2.07/1.42;v.co.z*=10.015/9.24
 elif name=='Chimney coping':
  sign=1 if sum(v.co.x for v in o.data.vertices)>0 else -1
  for v in o.data.vertices:
   v.co.x+=sign*(8.274-7.98);v.co.y*=2.19/1.54;v.co.z+=10.015-9.25
 elif name=='South door, swung inward':o.scale.y*=1.09/1.15;o.scale.z*=2.08/2.3;o.location.z=.53+1.04
 elif name in {'Roof','Roof battens'}:
  # vertices are authored in world coordinates in the preserved study.
  for v in o.data.vertices:
   v.co.z=6.81+(v.co.z-6.99)*2.06/1.85
 elif name=='Eaves':
  for v in o.data.vertices:v.co.z-=.18
remove({'North ell foundation','Brick ell, limewash','Ell roof','Rear addition','Rear roof','Ell windows','Ell lights','Ell muntins','East gallery decks','Gallery posts','Gallery handrails','Gallery balustrades'})
sys.path.insert(0,str(HERE/'kit'))
from ell_assets import rebuild_ell
rebuild_ell(house,[mat('Painted weatherboard'),ivory,glass,mat('Weathered shingles'),mat('Limestone')])
scene['survey_source']='survey/survey.json; HABS TN-14 scaled record, medium confidence'
scene['owner_decisions']='Existing portico retained; ceiling 3.19 m retained'
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(HERE/'Travellers Rest - surveyed.blend'),compress=True)
bpy.ops.object.select_all(action='DESELECT')
for c in ('House','Library','Entry hall','Portrait performance','Visitor anchors'):
 for o in bpy.data.collections[c].objects: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT),use_selection=True,export_animations=False,export_yup=True)
print('SURVEY_SHELL',OUT)
