"""CPU-only compositor denoise for a Cycles bake (render denoise does not affect bake).
The raw atlas and editable denoise graph remain in the source .blend.
"""
import bpy


def denoise_atlas(atlas, destination):
    owner = bpy.context.scene
    scene = bpy.data.scenes.new('Atlas cleanup — CPU compositor')
    scene.render.engine = 'CYCLES'
    scene.cycles.device, scene.cycles.samples = 'CPU', 1
    scene.render.threads_mode, scene.render.threads = 'FIXED', 4
    scene.render.compositor_device = 'CPU'
    scene.render.resolution_x, scene.render.resolution_y = atlas.size
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = str(destination)
    scene.view_settings.view_transform = 'Standard'
    camera = bpy.data.objects.new('Atlas cleanup camera', bpy.data.cameras.new('Atlas cleanup camera'))
    scene.collection.objects.link(camera)
    scene.camera = camera
    graph = bpy.data.node_groups.new('Denoise baked radiance', 'CompositorNodeTree')
    scene.compositing_node_group = graph
    graph.interface.new_socket(name='Image', in_out='OUTPUT', socket_type='NodeSocketColor')
    source = graph.nodes.new('CompositorNodeImage')
    source.image = atlas
    denoise = graph.nodes.new('CompositorNodeDenoise')
    sink = graph.nodes.new('NodeGroupOutput')
    graph.links.new(source.outputs['Image'], denoise.inputs['Image'])
    graph.links.new(denoise.outputs['Image'], sink.inputs['Image'])
    bpy.ops.render.render(write_still=True, scene=scene.name)
    bpy.context.window.scene = owner
    clean = bpy.data.images.load(str(destination), check_existing=False)
    clean.name = 'interior.light.denoised'
    clean.pack()
    return clean
