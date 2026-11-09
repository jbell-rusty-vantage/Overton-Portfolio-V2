"""Original cover engravings and tileable timber textures for the Library."""
from pathlib import Path
from math import cos, sin, pi
import numpy as np
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[2]
dst=ROOT/"public"/"library"
rng=np.random.default_rng(410)
for idx,(base,ink) in enumerate([((36,66,55),(215,190,136)),((125,59,40),(237,200,149)),((48,69,82),(209,197,155)),((112,90,50),(240,218,161))]):
    w,h=480,600
    noise=rng.normal(0,3.4,(h,w,1))+np.sin(np.arange(w)[None,:,None]*2)*2
    im=Image.fromarray(np.uint8(np.clip(np.array(base)+noise,0,255)))
    d=ImageDraw.Draw(im)
    for n in (18,23,31):
        d.rectangle((n,n,w-n,h-n),outline=ink,width=1)
    for x in (32,w-32):
        for y in (32,h-32):
            dx=1 if x<w/2 else -1
            dy=1 if y<h/2 else -1
            d.line([(x+29*dx,y),(x+29*dx,y+10*dy),(x+10*dx,y+10*dy),(x+10*dx,y+29*dy),(x,y+29*dy)],fill=ink,width=2)
    cx,cy=240,297
    def ring(rx,ry,tilt=0,width=2):
        pts=[]
        for j in range(241):
            a=2*pi*j/240
            x,y=rx*cos(a),ry*sin(a)
            pts.append((cx+x*cos(tilt)-y*sin(tilt),cy+x*sin(tilt)+y*cos(tilt)))
        d.line(pts,fill=ink,width=width)
    if idx==0:
        for pair in [(135,135,0),(129,129,0),(115,47,-.6),(116,37,1.0),(120,21,.52),(74,124,-.35),(32,32,0),(24,24,0)]:ring(*pair)
        for j in range(72):
            a=j*pi/36
            r=142 if j%6 else 150
            d.line((cx+137*cos(a),cy+137*sin(a),cx+r*cos(a),cy+r*sin(a)),fill=ink,width=2)
        d.line((cx-85,cy+145,cx+91,cy-153),fill=ink,width=3)
    elif idx==1:
        for r in (141,136):ring(r,r)
        nodes=[(cx,cy)]+[(cx+r*cos(i*2*pi/n+a),cy+r*sin(i*2*pi/n+a)) for r,n,a in [(62,5,.2),(110,9,.54)] for i in range(n)]
        for i,p in enumerate(nodes):
            for q in nodes[i+1:]:
                if (p[0]-q[0])**2+(p[1]-q[1])**2<105**2:d.line((p,q),fill=ink,width=2)
        for i,(x,y) in enumerate(nodes):d.ellipse((x-6,y-6,x+6,y+6),fill=base,outline=ink,width=2)
    else:
        for j in range(15):ring(140-j*5,110-j*4,j*pi/30)
    for yy in (107,486):
        d.line((167,yy,227,yy),fill=ink,width=1)
        d.polygon([(240,yy-5),(245,yy),(240,yy+5),(235,yy)],fill=ink)
        d.line((253,yy,313,yy),fill=ink,width=1)
    im.save(dst/f"plate-{idx}.webp",quality=88)
for name,color in [("oak",(126,81,52)),("walnut",(75,48,37)),("trim",(155,110,73)),("parquet",(149,108,74))]:
    w,h=512,256
    y,x=np.mgrid[:h,:w]
    ripple=np.sin(2*pi*x/w)*2.6+np.cos(4*pi*x/w+2*pi*y/h)*1.4
    tone=np.sin(2*pi*y/h*17+ripple)*4+np.sin(2*pi*y/h*64+ripple)*2+rng.normal(0,1.6,(h,w))
    arr=np.clip(np.array(color)+tone[:,:,None],0,255).astype(np.uint8)
    Image.fromarray(arr).save(Path(__file__).parent/(name+".jpg"),quality=89)

