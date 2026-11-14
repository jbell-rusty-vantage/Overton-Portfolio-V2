"""Bounded Cycles shader bakes for timber and brush-painted joinery.
The procedural source materials stay in the editable .blend; delivery uses the baked
images, so neither the browser nor a glTF viewer needs Blender's shader graph.
"""
import bpy

def shader_finish(name, colour, size, folder, timber=True):
    source=bpy.data.materials.new('source.'+name)
    source.use_nodes=True; source.use_fake_user=True
    nodes,links=source.node_tree.nodes,source.node_tree.links
    nodes.clear()
    output=nodes.new('ShaderNodeOutputMaterial')
    emission=nodes.new('ShaderNodeEmission');links.new(emission.outputs[0],output.inputs['Surface'])
    uv=nodes.new('ShaderNodeTexCoord')
    scale=nodes.new('ShaderNodeVectorMath');scale.operation='MULTIPLY'
    scale.inputs[1].default_value=(3,140,1) if timber else (4,100,1)
    links.new(uv.outputs['UV'],scale.inputs[0])
    noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=2
    noise.inputs['Detail'].default_value=4;noise.inputs['Roughness'].default_value=.7
    links.new(scale.outputs[0],noise.inputs['Vector'])
    ramp=nodes.new('ShaderNodeValToRGB')
    rgb=[int(colour.lstrip('#')[i:i+2],16)/255 for i in (0,2,4)]
    # Shader values are linear; preserve the intended sRGB finish in the output image.
    linear=lambda v:v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
    rgb=[linear(v) for v in rgb]
    for element,factor in zip(ramp.color_ramp.elements, (.55,1.45) if timber else (.88,1.12)):
        element.color=(*(v*factor for v in rgb),1)
    links.new(noise.outputs['Fac'],ramp.inputs[0]);links.new(ramp.outputs['Color'],emission.inputs[0])
    image=bpy.data.images.new(name+'.shader-bake',width=size,height=size,alpha=False)
    texture=nodes.new('ShaderNodeTexImage');texture.image=image;nodes.active=texture
    bpy.ops.mesh.primitive_plane_add(size=2)
    plane=bpy.context.object;plane.data.materials.append(source)
    bpy.context.scene.render.engine='CYCLES';bpy.context.scene.cycles.samples=1
    bpy.ops.object.bake(type='EMIT',margin=4)
    folder.mkdir(parents=True,exist_ok=True)
    image.filepath_raw=str(folder/(name+'.png'));image.file_format='PNG';image.save();image.pack()
    bpy.data.objects.remove(plane,do_unlink=True)
    return image
