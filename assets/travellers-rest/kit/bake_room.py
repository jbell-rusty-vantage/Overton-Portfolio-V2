"""Bake the static browser interior to a shared light/colour atlas, preserving source.
Requires scripts/export-room.mjs --static-light. Moving books/letters/drawers and
transparent glass are excluded from that export. Forty-eight CPU samples, bounded 4096px.
"""
import bpy, math, sys
from pathlib import Path
from mathutils import Vector
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[2];WORK=ROOT/'.local-library/kit'
sys.path.insert(0,str(HERE))
from denoise_atlas import denoise_atlas
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene;scene.name='Static library light bake';scene.render.engine='CYCLES'
scene.cycles.samples=48;scene.cycles.device='CPU';scene.cycles.use_denoising=True
bpy.ops.import_scene.gltf(filepath=str(WORK/'static-room-export.glb'))
meshes=[o for o in scene.objects if o.type=='MESH']
bpy.ops.object.select_all(action='DESELECT')
for o in meshes:o.select_set(True)
bpy.context.view_layer.objects.active=meshes[0]
bpy.ops.object.join();room=bpy.context.object;room.name='Library — baked static interior'
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
# Merge exactly coincident vertices and remove doubled faces before path tracing;
# trim remains real geometry instead of disabling all its shadows as the old assembly did.
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.remove_doubles(threshold=.00005)
bpy.ops.object.mode_set(mode='OBJECT')
room.data.uv_layers.new(name='lightmap');room.data.uv_layers.active=room.data.uv_layers['lightmap']
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.0008)
bpy.ops.object.mode_set(mode='OBJECT')
atlas=bpy.data.images.new('interior.light',width=4096,height=4096,alpha=False)
for slot in room.material_slots:
 mat=slot.material
 if not mat:continue
 nodes=mat.node_tree.nodes
 # Freeze every existing texture to its original UV map before selecting the bake map.
 for node in list(nodes):
  if node.type=='TEX_IMAGE' and not node.inputs['Vector'].is_linked:
   uv=nodes.new('ShaderNodeUVMap');uv.uv_map='UVMap';mat.node_tree.links.new(uv.outputs[0],node.inputs['Vector'])
 tex=nodes.new('ShaderNodeTexImage');tex.image=atlas;nodes.active=tex
def light(name,kind,at,energy,colour):
 data=bpy.data.lights.new(name,kind);data.energy=energy;data.color=colour
 o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);o.location=(at[0],-at[2],at[1]);return o
sun=light('Late sun','SUN',(-4,8,10),3.5,(1,.81,.58))
sun.rotation_euler=Vector((.36,.75,-.56)).to_track_quat('-Z','Y').to_euler()
light('Sky fill','POINT',(-5,2.5,2.35),140,(1,.945,.86))
light('Warm floor bounce','POINT',(-5.1,.95,.4),35,(1,.69,.45))
light('Hearth','POINT',(-6.95,.95,0),35,(1,.54,.24))
scene.world=bpy.data.worlds.new('Afternoon sky');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.55,.68,.85,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.5
bpy.context.view_layer.objects.active=room
bpy.ops.object.select_all(action='DESELECT');room.select_set(True)
bpy.ops.object.bake(type='DIFFUSE',pass_filter={'COLOR','DIRECT','INDIRECT'},margin=4,uv_layer='lightmap')
atlas.filepath_raw=str(WORK/'interior-light.png');atlas.file_format='PNG';atlas.save();atlas.pack()
atlas=denoise_atlas(atlas,WORK/'interior-light-clean.png')
source=room.copy();source.data=room.data.copy();source.name='Source materials — hidden';scene.collection.objects.link(source);source.hide_render=source.hide_viewport=True
material=bpy.data.materials.new('interior.baked');material.use_nodes=True
nodes,links=material.node_tree.nodes,material.node_tree.links;nodes.clear()
output=nodes.new('ShaderNodeOutputMaterial');emission=nodes.new('ShaderNodeEmission');tex=nodes.new('ShaderNodeTexImage');tex.image=atlas
uv=nodes.new('ShaderNodeUVMap');uv.uv_map='lightmap';links.new(uv.outputs[0],tex.inputs[0]);links.new(tex.outputs['Color'],emission.inputs[0]);links.new(emission.outputs[0],output.inputs[0])
room.data.materials.clear();room.data.materials.append(material)
for face in room.data.polygons:face.material_index=0
for layer in list(room.data.uv_layers):
 if layer.name!='lightmap':room.data.uv_layers.remove(layer)
room.data.uv_layers.active=room.data.uv_layers['lightmap']
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(HERE/'Travellers Rest - light bake.blend'),compress=True)
bpy.ops.object.select_all(action='DESELECT');room.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(WORK/'interior-light-export.glb'),use_selection=True,use_active_scene=True,export_animations=False,export_yup=True)
print('STATIC_LIGHT_BAKED',len(room.data.polygons))
