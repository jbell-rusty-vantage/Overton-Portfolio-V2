"""Surveyed interior solids and stock-profile joinery, authored in Blender.

House dimensions are mirrored by ROOM and tested after packing. Panels meet at
edges; mouldings are single swept profiles, never stacked coplanar face boxes.
No room cornice is added: the record does not support one here.
"""
import math
from mathutils import Matrix
from kit_tools import G, Part, empty, material

SKIRT = [(0,0),(.034,0),(.034,.15),(.031,.158),(.024,.165),(.02,.175),(.019,.186),(.014,.194),(.006,.199),(0,.2)]
CHAIR = [(0,0),(.01,.002),(.014,.008),(.014,.014),(.02,.018),(.028,.024),(.03,.031),(.028,.038),(.02,.044),(.014,.048),(.014,.054),(.01,.06),(0,.062)]


def build_study(collection, tag, finishes):
    """A broad rag-paper viewing folio in front of the cabinet's shelf divider.

    House frame: paper centre (-7.375, 1.64, 2.53), .64 m wide across Z,
    .55 m high. The flat reading area faces +X and remains behind x=-7.375;
    the live index may sit at x=-7.370. A rear stay fits entirely inside the
    right niche. Chest-top books are retained from the earlier study piece.
    """
    def finish(name, key, colour, rough=.8, source=None, metallic=0):
        # New geometry has no furniture-atlas coordinates: copy colour textures,
        # never the old kit.ao node or its unrelated second UV set.
        image = None
        if source:
            image = next((n.image for n in finishes[source].node_tree.nodes if n.type == 'TEX_IMAGE' and n.image and n.image.name != 'kit.ao'), None)
        return material('folio.'+name, colour, rough, metallic, img=image, finish=key, double=name == 'paper')

    walnut = finish('walnut', 'walnut', '#6b4428', .5, 'walnut')
    dark = finish('walnut-dark', 'walnutDark', '#452a18', .55, 'walnut.shaded')
    paper = finish('paper', 'paper', '#f0e6cb', .96, 'paper.laid')
    edge = finish('paper-edge', None, '#d9c9a0', .96)
    brass = finish('brass', 'brass', '#c49a48', .36, metallic=.8)
    leather = material('folio.closed-book', '#4a1c16', .62)
    rule = material('folio.rule', '#ab8a4e', .88)
    root = tag(empty('desk.study', collection), 'desk.study')
    root['asset_description'] = 'Walnut reading stand with folded rag-paper folio; present-day collection index'
    root['paper_front_house_x'] = -7.375
    root['paper_centre_house'] = [-7.375, 1.64, 2.53]
    root['paper_size_metres'] = [.64, .55]

    # Fit the former display niche without covering any lower project spines.
    # Longitudinal dimensions below use the original drawing's .88 m width;
    # this one mapping keeps the paper, deckle, clips and stand aligned.
    def across(z):
        return 2.53 + (z - 2.30) * (.64 / .88)
    def point(x,y,z):
        return G(x,y,across(z))

    def span(part,m,x0,x1,y0,y1,z0,z1,niche=True):
        a0,a1=(across(z0),across(z1)) if niche else (z0,z1)
        part.box(x0,x1,-a1,-a0,y0,y1,m)
    def done(part,name,style='hard',bevel=.001):
        obj = tag(part.build('desk.study.'+name, collection, style, bevel), 'desk.study')
        obj.parent = root
        return obj

    stand = Part(.7)
    # Two front rails stand clear of the vertical divider and shelf lips. The
    # fall ends at x=-7.17, leaving room for these feet in front of the shelves.
    for z in (1.96, 2.64):
        span(stand, dark, -7.403,-7.387,1.27,1.91,z-.016,z+.016)
        span(stand, walnut, -7.407,-7.21,1.27,1.292,z-.053,z+.053)
    # Open slatted back, a small shaped crest and a wide lower paper ledge.
    for y in (1.42, 1.79):
        span(stand, walnut, -7.405,-7.387,y-.018,y+.018,1.86,2.74)
    span(stand, walnut, -7.409,-7.342,1.326,1.353,1.853125,2.746875)
    span(stand, dark, -7.349,-7.339,1.35,1.367,1.86,2.74)
    stand.turned(point(-7.391,1.89,2.30), point(-7.391,1.943,2.30), [(0,.015),(.2,.021),(.55,.013),(.8,.019),(1,.007)], walnut,16)
    # The angled stay stays to the right of z=2.209: no cut through the divider.
    stand.turned(point(-7.64,1.29,2.52),point(-7.404,1.76,2.52),[(0,.013),(1,.013)],dark,8)
    span(stand, walnut, -7.678,-7.584,1.27,1.289,2.47,2.57)
    done(stand,'stand')

    leaves = Part(.4)
    # Three offset sheets make the paper's thickness visible without a bezel.
    for depth,offset,shrink in ((-.008,.006,.006),(-.004,-.004,.003)):
        span(leaves,edge,-7.380+depth,-7.379+depth,1.365+offset,1.915+offset,1.86+shrink,2.74-shrink)
    # A lightly deckled perimeter and a shallow centre fold, with a genuinely
    # flat central text area. Only the outer 2 cm undulates; it cannot cover the
    # .58 x .47 m browser index in the middle of the sheet.
    cols,rows=32,20
    grid=[]
    for j in range(rows+1):
        v=j/rows
        row=[]
        for i in range(cols+1):
            u=i/cols
            z=1.86+.88*u
            y=1.365+.55*v
            if i in (0,cols): z+=.0011*math.sin(j*2.6)+.0005*math.sin(j*5.1)
            if j in (0,rows): y+=.001*math.sin(i*2.3)+.0005*math.cos(i*4.8)
            rim=max(0,1-min(u,1-u,v,1-v)/.055)
            fold=.0022*math.exp(-((u-.5)/.025)**2)
            # The upper right corner rolls back, entirely behind the live print.
            curl=.009*max(0,(u-.91)/.09)**2*max(0,(v-.88)/.12)**2
            x=-7.375-fold-.0015*rim*(.55+.45*math.sin(u*35+v*24))-curl
            row.append(leaves.bm.verts.new(point(x,y,z)))
        grid.append(row)
    for j in range(rows):
        for i in range(cols):
            leaves.face([grid[j][i],grid[j][i+1],grid[j+1][i+1],grid[j+1][i]], paper,
                        [(i/cols,j/rows),((i+1)/cols,j/rows),((i+1)/cols,(j+1)/rows),(i/cols,(j+1)/rows)],curved=True)
    done(leaves,'paper','turned',0)

    details=Part(.4)
    # Fine printed rules lie in the paper margin, outside the runtime index.
    for y in (1.382,1.898):
        span(details,rule,-7.3749,-7.3747,y,y+.0007,1.877,2.723)
    for z in (1.878,2.722):
        span(details,rule,-7.3749,-7.3747,1.382,1.898,z,z+.0007)
    # Narrow brass fingers hold only the upper margin, like a reading stand.
    for z in (1.962,2.638):
        span(details,brass,-7.385,-7.368,1.888,1.934,z-.011,z+.011)
        details.turned(point(-7.368,1.912,z),point(-7.364,1.912,z),[(0,.005),(1,.005)],brass,12)
    done(details,'fittings','hard',.0007)

    books=Part(.5)
    for x0,x1,y0,y1,z0,z1 in [(-2.70,-2.45,1.42,1.47,-2.9,-2.72),(-2.69,-2.47,1.47,1.512,-2.89,-2.73)]:
        span(books,leather,x0,x1,y0,y1,z0,z1,niche=False)
    done(books,'chest-books','hard',0)
    return root


def build_architecture(collection, tag, finishes):
    def finish(name, key, colour, rough=.8, texture=None):
        image = None
        if texture:
            image = next((n.image for n in finishes[texture].node_tree.nodes if n.type == 'TEX_IMAGE' and n.image and n.image.name != 'kit.ao'), None)
        m = material('room.'+name, colour, rough, img=image, finish=key)
        if image: m['baked_finish'] = True
        return m
    plaster = finish('plaster','plaster','#d8cbab')
    ceiling = finish('ceiling','ceiling','#e9e2d0')
    floor = finish('ash','floor','#8a6238')
    paint = finish('joinery','trim','#ddd5bd',.55,'paint.joinery')
    dado = finish('dado','dado','#8c8d73',.62,'paint.door')
    stone = finish('stone','stone','#8b867a')
    brick = finish('firebrick','brick','#494037')
    p = Part(2.2)
    def span(part,m,x0,x1,y0,y1,z0,z1):
        part.box(x0,x1,-z1,-z0,y0,y1,m,bevel=False)
    def done(part,name):
        o=tag(part.build(name,collection,'hard',0),name)
        o['survey_source']='HABS TN-14 scaled record; owner ceiling 3.19 m'
        return o
    span(p,floor,-7.8,-1.55,.45,.53,-3.02,3)
    span(p,ceiling,-7.85,-1.49,3.72,3.80,-3.1,3.1)
    # Flush west wall and a continuous segmental-arched firebox.
    for z0,z1 in [(-3.02,-.595),(.595,3)]:span(p,plaster,-7.80,-7.76,.53,3.72,z0,z1)
    curve=[(-.595+1.19*i/32,1.18+.17*math.sqrt(max(0,1-((-1+2*i/32)**2)))) for i in range(33)]
    section=[(-.595,3.72),(.595,3.72)]+[(z,y+.065) for z,y in reversed(curve)]
    p.extrude(section[::-1],(-7.76,0,0),(0,-1,0),(0,0,1),.04,plaster,grain='z')
    arch=[(z,y) for z,y in curve]+[(z,y+.065) for z,y in reversed(curve)]
    p.extrude(arch,(-7.748,0,0),(0,-1,0),(0,0,1),.047,stone,grain='z')
    span(p,brick,-7.90,-7.88,.53,1.4,-.595,.595)
    for z0,z1 in [(-.62,-.595),(.595,.62)]:span(p,brick,-7.90,-7.76,.53,1.18,z0,z1)
    span(p,stone,-7.78,-6.72,.53,.565,-1.02,1.02)
    for z0,z1 in [(-.66,-.595),(.595,.66)]:span(p,stone,-7.76,-7.748,.53,1.18,z0,z1)
    # Ell door and hall doorway are holes through the new inner leaf.
    for x0,x1 in [(-7.76,-5.65),(-4.65,-1.605)]:span(p,plaster,x0,x1,.53,3.72,-3.04,-3)
    span(p,plaster,-5.65,-4.65,2.72,3.72,-3.04,-3)
    for z0,z1 in [(-3,.27),(1.18,2.86)]:span(p,plaster,-1.605,-1.57,.53,3.72,z0,z1)
    span(p,plaster,-1.605,-1.57,2.73,3.72,.27,1.18)
    edges=[-7.76,-6.5025,-5.5575,-4.0225,-3.0775,-1.605]
    for i in range(0,len(edges),2):span(p,plaster,edges[i],edges[i+1],1.37,3.18,2.86,3)
    span(p,plaster,-7.76,-1.605,.53,1.37,2.86,3)
    span(p,plaster,-7.76,-1.605,3.18,3.72,2.86,3)
    done(p,'room.shell')
    p=Part()
    def wallbox(w,a0,a1,y0,y1,d0,d1,m):
        axis,at,direction=w
        q0,q1=sorted((at+direction*d0,at+direction*d1))
        if axis=='x':span(p,m,a0,a1,y0,y1,q0,q1)
        else:span(p,m,q0,q1,y0,y1,a0,a1)
    north=('x',-3,1);south=('x',2.86,-1);east=('z',-1.605,-1)
    def dado_run(w,a0,a1):
        axis,at,direction=w
        if axis=='x':path=[(a0,-at),(a1,-at)] if direction<0 else [(a1,-at),(a0,-at)]
        else:path=[(at,-a1),(at,-a0)]
        p.sweep(SKIRT,path,dado,M=Matrix.Translation((0,0,.53)),ends=True)
        wallbox(w,a0,a1,.73,1.20,.001,.01,dado)
        p.sweep(CHAIR,path,paint,M=Matrix.Translation((0,0,1.20)),ends=True)
    for w,a0,a1 in [(north,-7.76,-5.76),(north,-4.54,-1.605),(east,-3,.16),(east,1.29,2.86),(south,-7.76,-1.605)]:dado_run(w,a0,a1)
    def casing(w,a0,a1,sill,head):
        # Separate jambs end at the underside of the head; no face overlaps.
        wallbox(w,a0-.11,a0,sill,head,0,.05,paint)
        wallbox(w,a1,a1+.11,sill,head,0,.05,paint)
        wallbox(w,a0-.11,a1+.11,head,head+.11,0,.05,paint)
        wallbox(w,a0-.14,a1+.14,head+.11,head+.14,0,.07,paint)
    casing(north,-5.65,-4.65,.53,2.72)
    casing(east,.27,1.18,.53,2.73)
    for centre in (-6.03,-3.55):
        a0,a1=centre-.4725,centre+.4725
        casing(south,a0,a1,1.37,3.18)
        wallbox(south,a0-.13,a1+.13,1.335,1.37,-.13,.075,paint)
        for x0,x1 in [(a0,a0+.012),(a1-.012,a1)]:span(p,paint,x0,x1,1.37,3.18,2.86,2.99)
        span(p,paint,a0+.012,a1-.012,3.168,3.18,2.86,2.99)
    done(p,'room.joinery')
    build_study(collection, tag, finishes)
