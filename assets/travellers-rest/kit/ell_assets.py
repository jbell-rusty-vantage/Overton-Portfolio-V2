"""Surveyed ell and gallery exterior. HABS plan plus photographs TN-14-3/4.
The restored ell's interior is deliberately not inferred from the pre-restoration plan.
"""
import math
from mathutils import Matrix
from kit_tools import Part

def rebuild_ell(collection, materials):
    p=Part(1.2)
    wall,paint,glass,roof,stone=materials
    def box(m,x0,x1,y0,y1,z0,z1): p.box(x0,x1,y0,y1,z0,z1,m,bevel=False)
    def gable(x0,x1,y0,y1,eave,ridge):
        mid=(x0+x1)/2
        p.extrude([(x0,eave),(x1,eave),(mid,ridge)],(0,y1,0),(1,0,0),(0,0,1),y1-y0,roof,grain='x')
    # Coordinate frame here is Blender: north +Y, height +Z.
    west,east=-7.914,-.984
    front,joint,rear=3.12,20.79,29.321
    box(stone,west,east,front,joint,0,.53)
    box(wall,west,east,front,joint,.53,6.81)
    gable(west-.18,east+.18,front,joint+.12,6.81,8.44)
    # The addition's plan edges are the actual scaled plan pixels (791..1057).
    rw,re=-(1057-824.5)*.027609,-(791-824.5)*.027609
    box(stone,rw,re,joint,rear,0,.53)
    box(wall,rw,re,joint,rear,.53,6.81)
    gable(rw-.18,re+.18,joint-.1,rear+.15,6.81,8.42)
    def window(x,y,z):
        box(paint,x,x+.10,y-.53,y+.53,z-.79,z+.79)
        box(glass,x+.101,x+.122,y-.46,y+.46,z-.71,z+.71)
        for k in (-1,1):box(paint,x+.122,x+.145,y+k*.153-.012,y+k*.153+.012,z-.71,z+.71)
        for k in (-2,-1,0,1,2):box(paint,x+.122,x+.145,y-.46,y+.46,z+k*.237-.012,z+k*.237+.012)
        box(paint,x-.01,x+.18,y-.58,y+.58,z-.83,z-.78)
    for y in (5.2,8.5,11.8,15.1,18.4):
        for z in (2.03,5.22):window(east,y,z)
    for y in (23.0,26.9):
        for z in (2.03,5.22):window(re,y,z)
    # L-shaped two-storey gallery, including the omitted return behind main block.
    outer=east+4.252
    for z in (.49,3.68,6.76):
        box(paint,east,outer,front,joint,z-.045,z+.045)
        box(paint,outer,7.914,front,front+4.003,z-.045,z+.045)
    posts=[(outer-.09,front+.15+i*(17.37/6)) for i in range(7)]
    posts += [(7.80,front+.15),(7.80,front+3.88),(5.5,front+3.88)]
    for x,y in posts:
        box(paint,x-.095,x+.095,y-.095,y+.095,.53,6.76)
        for z in (.62,3.62,3.81,6.62):box(paint,x-.14,x+.14,y-.14,y+.14,z-.055,z+.055)
    def balustrade(a,b,floor):
        dx,dy=b[0]-a[0],b[1]-a[1];length=math.hypot(dx,dy)
        for z,w in ((floor+.1,.045),(floor+.91,.065)):
            p.tube([(a[0],a[1],z),(b[0],b[1],z)],w/2,paint,segs=4)
        for i in range(max(1,int(length/.18))+1):
            t=i/max(1,int(length/.18));x=a[0]+dx*t;y=a[1]+dy*t
            box(paint,x-.018,x+.018,y-.018,y+.018,floor+.12,floor+.88)
    for floor in (.53,3.72):
        balustrade((outer-.09,front+.15),(outer-.09,joint-.15),floor)
        balustrade((outer-.09,front+3.88),(7.80,front+3.88),floor)
        # Lower eastern opening admits the photographed stair from the garden.
        if floor>1:balustrade((7.80,front+.15),(7.80,front+3.88),floor)
    # Lower steps beside the gallery return (photograph 3); plain square handrails.
    for i in range(4):box(stone,7.91+i*.28,8.19+i*.28,front+.5,front+1.8,0,.53-i*.1325)
    # Ell stacks and simple corbelled caps are visible in photo 4.
    for y in (7.0,16.5,27.5):
        x=-4.45 if y<joint else -2.75
        box(wall,x-.38,x+.38,y-.42,y+.42,7.7,9.15)
        box(paint,x-.43,x+.43,y-.47,y+.47,9.08,9.21)
    o=p.build('Survey ell and gallery',collection,'hard',0)
    o['survey_source']='HABS TN-14 plan p8 and photos 3/4; scaled exterior, no inferred restored interior'
    return o
