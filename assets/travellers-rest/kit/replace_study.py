"""Replace only desk.study in the saved kit; preserve all other geometry and AO.

    blender --background --python-exit-code 1 --python assets/travellers-rest/kit/replace_study.py
    node scripts/pack-kit.mjs

The first run saves a dated source backup before changing the editable kit. The
same build_study() is used by build_kit.py for a complete procedural rebuild.
"""
import json
import shutil
import sys
from pathlib import Path

import bpy
from mathutils import Vector

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
WORK = ROOT / '.local-library/kit'
REVIEW = ROOT / 'docs/travellers-rest-review/kit'
SOURCE = HERE / 'Travellers Rest - kit.blend'
BACKUP = WORK / 'backups/Travellers Rest - kit-before-viewing-folio-20261113.blend'
sys.dont_write_bytecode = True
sys.path.insert(0,str(HERE))
from kit_tools import G, Part, material, to_house
from room_assets import build_study

BACKUP.parent.mkdir(parents=True,exist_ok=True)
REVIEW.mkdir(parents=True,exist_ok=True)
if not BACKUP.exists():
    shutil.copy2(SOURCE,BACKUP)
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
scene=bpy.context.scene
kit=bpy.data.collections['Kit']
print('INSPECT',json.dumps({'source':bpy.data.filepath,'kit_objects':len(kit.all_objects),'collections':[c.name for c in kit.children],'study':[o.name for o in kit.all_objects if o.name=='desk.study' or o.name.startswith('desk.study.')]}))

for obj in list(kit.all_objects):
    if obj.name=='desk.study' or obj.name.startswith('desk.study.'):
        bpy.data.objects.remove(obj,do_unlink=True)
# Replacement materials are owned only by this piece. Drop orphan meshes first,
# so rerunning the script retains clean names and no stale modern material.
for mesh in list(bpy.data.meshes):
    if mesh.users==0 and (mesh.name=='desk.study' or mesh.name.startswith('desk.study.')):
        bpy.data.meshes.remove(mesh)
for mat in list(bpy.data.materials):
    if mat.users==0 and (mat.name.startswith('folio.') or mat.name=='room.aluminium'):
        bpy.data.materials.remove(mat)

def tag(obj,piece,role='placed'):
    obj['kit_piece'],obj['kit_role']=piece,role
    return obj

finishes={name:bpy.data.materials[name] for name in ('walnut','walnut.shaded','paper.laid')}
root=build_study(bpy.data.collections['Joinery'],tag,finishes)
bpy.context.view_layer.update()
exports=list(kit.all_objects)
record=[]
for obj in sorted(exports,key=lambda o:o.name):
    location,rotation,scale=obj.matrix_world.decompose()
    entry={'name':obj.name,'parent':obj.parent.name if obj.parent else None,
           'type':'mesh' if obj.type=='MESH' else 'empty',
           'mesh':obj.data.name if obj.type=='MESH' else None,
           'piece':obj['kit_piece'],'role':obj['kit_role'],
           'collection':obj.users_collection[0].name,'pivot':to_house(location),
           'rotation':[round(v,6) for v in (rotation.x,rotation.z,-rotation.y,rotation.w)],
           'scale':[round(v,6) for v in (scale.x,scale.z,scale.y)]}
    if 'kit_motion' in obj:
        entry['motion']={'kind':obj['kit_motion'],'axis':list(obj['kit_axis']),'travel':round(obj.get('kit_travel',0),6)}
    record.append(entry)
(HERE/'source.json').write_text(json.dumps({'blender':bpy.app.version_string,'nodes':record},indent=1)+'\n')

# Save with the original room and review visibility intact. All images remain
# packed, including the existing furniture occlusion atlas.
bpy.context.preferences.filepaths.save_version=0
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE),compress=True)
bpy.ops.object.select_all(action='DESELECT')
for obj in exports:
    obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(WORK/'kit-export.glb'),export_format='GLB',use_selection=True,
                         export_apply=True,export_yup=True,export_extras=True,export_cameras=False,
                         export_lights=False,export_animations=False,export_texcoords=True,
                         export_normals=True,export_materials='EXPORT',export_image_format='AUTO')
print('EXPORTED',len(exports),'objects; paper',list(root['paper_centre_house']),list(root['paper_size_metres']))

# A modest asset proof, then a close view in the actual cabinet. Review-only
# staging is not saved into or exported with the kit.
review=bpy.data.collections.new('Folio review (temporary)')
scene.collection.children.link(review)
for obj in scene.objects:
    obj.hide_render=True
for obj in root.children:
    obj.hide_render=obj.name.endswith('chest-books')
root.hide_render=False
stage=Part()
stage.box(-7.85,-6.85,-2.95,-2.08,1.242,1.268,material('folio.review-table','#715037',.7))
table=stage.build('folio.review-table',review,'hard',.002)

def light(name,at,power,size,target):
    obj=bpy.data.objects.new(name,bpy.data.lights.new(name,'AREA'))
    review.objects.link(obj)
    obj.location=G(*at)
    obj.data.energy,obj.data.size=power,size
    obj.rotation_euler=(G(*target)-obj.location).to_track_quat('-Z','Y').to_euler()
    return obj

light('folio.review-key',(-6.55,2.8,1.9),130,1.5,(-7.38,1.64,2.53))
light('folio.review-fill',(-6.9,2.25,3.4),55,1.1,(-7.38,1.64,2.53))
world=bpy.data.worlds.new('Folio review sky')
world.use_nodes=True
world.node_tree.nodes['Background'].inputs['Color'].default_value=(.75,.70,.62,1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value=.45
scene.world=world
camera=bpy.data.objects.new('folio.review-camera',bpy.data.cameras.new('folio.review-camera'))
review.objects.link(camera)
camera.location=G(-6.16,1.94,3.08)
camera.rotation_euler=(G(-7.38,1.62,2.53)-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO'
camera.data.ortho_scale=1.08
scene.camera=camera
scene.render.engine='CYCLES'
scene.cycles.device='CPU'
scene.cycles.samples=24
scene.cycles.use_denoising=True
scene.render.threads_mode='FIXED'
scene.render.threads=4
scene.render.resolution_x,scene.render.resolution_y=1280,960
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.filepath=str(REVIEW/'viewing-folio.png')
bpy.ops.render.render(write_still=True)

table.hide_render=True
bpy.data.objects['bookcase.family'].hide_render=False
camera.location=G(-5.94,1.90,2.88)
camera.rotation_euler=(G(-7.43,1.60,2.22)-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.ortho_scale=1.63
scene.render.filepath=str(REVIEW/'viewing-folio-cabinet.png')
bpy.ops.render.render(write_still=True)
print('REVIEW',str(REVIEW/'viewing-folio.png'),str(REVIEW/'viewing-folio-cabinet.png'))
