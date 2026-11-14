"""Extract review candidates from the six supplied films. Never regenerates footage."""
import json, subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
root=Path(__file__).resolve().parents[1]
work=root/'assets/library/posters/film-frames';work.mkdir(exist_ok=True)
records=[]
for film in sorted((root/'public/library/recordings').glob('*.mp4')):
    duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(film)],text=True).strip())
    frames=[]
    for i,share in enumerate((.12,.34,.57,.78)):
        target=work/f'{film.stem}-{i+1}.webp'
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',str(round(duration*share,2)),'-i',str(film),'-frames:v','1','-vf','scale=1280:-1','-quality','88',str(target)],check=True)
        frames.append({'file':target.name,'seconds':round(duration*share,2)})
    records.append({'film':film.name,'frames':frames})
sheet=Image.new('RGB',(1600,len(records)*290),'#eceae2');d=ImageDraw.Draw(sheet)
face=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',14)
for i,record in enumerate(records):
    for j,frame in enumerate(record['frames']):
        img=Image.open(work/frame['file']);img.thumbnail((390,245))
        sheet.paste(img,(j*400,i*290+30));d.text((j*400,i*290+7),f"{record['film']} · {frame['seconds']}s",font=face,fill='black')
sheet.save(work/'contact.jpg',quality=90)
(work/'frames.json').write_text(json.dumps(records,indent=2)+'\n')
print('Extracted 24 real film-frame candidates.')
