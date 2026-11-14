"""Typeset generated art and author supplied imagery; stage files, never write the DB.
The owner explicitly requested script-set titles, natural-edge crops and readable
replacement diagrams. Image generation itself uses the built-in imagegen tool.
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / 'assets/library/posters'
PUBLIC = ROOT / 'public/library/artwork'
FONT = Path('C:/Windows/Fonts')
inventory = json.loads((WORK / 'content-inventory.json').read_text(encoding='utf-8'))
font = lambda size, bold=False: ImageFont.truetype(str(FONT / ('arialbd.ttf' if bold else 'arial.ttf')), size)
serif = lambda size: ImageFont.truetype(str(FONT / 'georgia.ttf'), size)

def lines(text, draw, face, width):
    result = ['']
    for word in text.split():
        trial = (result[-1] + ' ' + word).strip()
        if draw.textlength(trial, font=face) > width and result[-1]: result.append(word)
        else: result[-1] = trial
    return result

chosen = {'agentic-mission-control':'a', 'agent-knowledge-services':'a', 'ai-engineer-platform':'a',
 'ai-engineer-worldsfair-showcase':'a', 'biotech-knowledge-platform':'a', 'biotech-research-ingestion':'a',
 'human-upgrade-ingestion-pipeline':'a', 'polymarket-mcp-server':'a', 'the-library':'a',
 'overtech-digital-services':'a', 'vantage-lead-analytics':'a', 'vantage-movers':'b', 'gowipe':'b', 'daryl-davis':'a'}
concepts = {
 'agentic-mission-control':'One clock coordinates durable work across many agent stations.',
 'agent-knowledge-services':'Captured sources become checked, connected evidence.',
 'ai-engineer-platform':'Learning connects books, research and coding environments.',
 'ai-engineer-worldsfair-showcase':'Many recorded talks become one browsable research library.',
 'biotech-knowledge-platform':'Biological knowledge grows from connected evidence.',
 'biotech-research-ingestion':'A human checkpoint controls a staged research pipeline.',
 'human-upgrade-ingestion-pipeline':'Podcast audio becomes structured transcript archives.',
 'polymarket-mcp-server':'Agent access joins market data to gated actions.',
 'the-library':'A book opens into a place for exploring the work.',
 'overtech-digital-services':'The studio connects a portfolio visit to a conversation.',
 'vantage-lead-analytics':'Attributed leads connect spending to recorded outcomes.',
 'vantage-movers':'Software connects a quote to the moving journey.',
 'gowipe':'A bright bamboo-wipe storefront connects products to their uses.',
 'daryl-davis':'The supplied public website connects the speaker, musician and book.'}

manifest = {'version':2, 'state':'staged-not-applied', 'posters':[], 'replacements':[], 'rasterText':{}}
for row in inventory:
    slug, title = row['slug'], row['title']
    for variant in ('a','b'):
        if slug == 'daryl-davis':
            # The brief permits only owner-supplied imagery for Daryl. Preserve the
            # supplied website capture exactly; do not synthesize his likeness.
            source = WORK / 'film-frames/daryl-davis-homepage-original-2.webp' if variant == 'a' else PUBLIC / 'daryl-davis-home.webp'
            art = Image.new('RGB', (1440,1800), '#101011')
            capture = Image.open(source).convert('RGB')
            if variant == 'a':
                capture = capture.crop((280,0,1000,720)).resize((1260,1260),Image.Resampling.LANCZOS)
                art.paste(capture,(90,0))
            else:
                capture = capture.crop((0,0,1600,880))
                capture.thumbnail((1250,1000), Image.Resampling.LANCZOS)
                art.paste(capture, ((1440-capture.width)//2, 270))
        else:
            source = WORK / 'masters' / f'{slug}-{variant}-art.png'
            art = ImageOps.fit(Image.open(source).convert('RGB'), (1440,1800), Image.Resampling.LANCZOS)
        # The shared title baseline and safe area unify the set; the art differs.
        d = ImageDraw.Draw(art)
        size = 124
        while size > 98:
            face = serif(size)
            wrapped = lines(title, d, face, 1190)
            if len(wrapped) <= 3: break
            size -= 2
        y = 1310
        d.line((110,y-35,230,y-35),fill='#e9dfbd',width=3)
        for line in wrapped:
            d.text((110,y),line,font=face,fill='#fbf6e7',stroke_width=0)
            y += size + 12
        (WORK/'typeset').mkdir(exist_ok=True)
        art.save(WORK/'typeset'/f'{slug}-{variant}.png')
        if variant == chosen[slug]:
            target = PUBLIC / f'{slug}-poster-v2.webp'
            delivery = art.resize((960,1200),Image.Resampling.LANCZOS)
            for quality in (86,82,78,74,70):
                delivery.save(target, quality=quality, method=6)
                if target.stat().st_size < 150_000: break
            manifest['posters'].append({'slug':slug,'title':title,'url':'/library/artwork/'+target.name,'chosen':variant,'alternate':'b' if variant=='a' else 'a','alt':concepts[slug],'bytes':target.stat().st_size,'source':'owner-supplied original homepage film at 6.43 seconds' if slug=='daryl-davis' else 'imagegen concept illustration','nativeSourceSize':list(Image.open(source).size)})

# A deliberately simplified reading map. Labels are taken from the existing prose;
# no technology or success claim is introduced by these pictures.
maps = {
 'agentic-mission-control':['Mission manifest','Workflows','Provider lanes','Output contracts'],
 'agent-knowledge-services':['Capture','Verification','Ingestion','Retrieval'],
 'ai-engineer-platform':['Database contract','Product service','Schema workspace','Cloud agent repository'],
 'ai-engineer-worldsfair-showcase':['Transcript','Pipeline stages','Immutable artifact','Published brief'],
 'biotech-knowledge-platform':['Schema','Validated intents','Single transaction','Receipt'],
 'biotech-research-ingestion':['Conversation','Research plan','Person’s approval','Temporal workflow'],
 'human-upgrade-ingestion-pipeline':['Discover every episode','Episode page','MongoDB documents','S3 transcript files'],
 'polymarket-mcp-server':['MCP endpoint','Shared schema','Rate limiter','Client library'],
 'the-library':['Admin office','PostgreSQL','Publication rules','Rooms and shelves'],
 'overtech-digital-services':['Finished case','Inquiry','Booked call','Owner dashboard'],
 'vantage-lead-analytics':['Paid source','Dated cost schedule','Booking','Cancellation'],
 'vantage-movers':['Quote forms','System of record','Sales CRM','Booking or cancellation'],
 'gowipe':['Shopify storefront','Shopping events','Google Analytics','Google Ads'],
 'daryl-davis':['Talks and press','Shopify checkout','Booking forms','Speaking and music'],
}
for row in inventory:
    slug = row['slug']
    image = Image.new('RGB',(1200,1040),'#f2eee2')
    d = ImageDraw.Draw(image)
    d.text((65,50),'The working parts',font=serif(66),fill='#23392f')
    d.line((65,150,1135,150),fill='#a2aa94',width=3)
    for i,label in enumerate(maps[slug]):
        x=65+(i%2)*550; y=205+(i//2)*380
        d.rounded_rectangle((x,y,x+520,y+335),radius=12,fill='#e2e7d8',outline='#b3bda8',width=3)
        d.text((x+32,y+24),f'0{i+1}',font=font(52),fill='#6b7c5b')
        for j,line in enumerate(lines(label,d,font(58,True),450)):
            d.text((x+32,y+110+j*70),line,font=font(58,True),fill='#23392f')
    filename=f'{slug}-architecture-v2.webp'
    image.save(PUBLIC/filename,quality=92,method=6)
    manifest['replacements'].append({'from':f'/library/artwork/{slug}-architecture.webp','to':'/library/artwork/'+filename,'ownPage':True,'reason':'Four large authored component labels; original detailed diagram retained unchanged.'})
    manifest['rasterText']['/library/artwork/'+filename]={'sourceWidth':1200,'smallestFontPx':52,'minimumRenderedAt306Px':13.26}

# Exact natural section boundaries observed in the owner-supplied originals.
crops={'gowipe-home':(0,0,1600,880),'gowipe-collection':(0,0,1600,685),'daryl-davis-home':(0,0,1600,880),'daryl-davis-book':(0,0,1600,915),'daryl-davis-bio':(0,0,1600,840),
 'ai-engineer-worldsfair-showcase-brief':(0,0,1600,925),
 'ai-engineer-worldsfair-showcase-talks':(0,0,1600,955),
 'overtech-digital-services-services':(0,0,1600,895),
 'overtech-digital-services-start':(0,0,1600,895),
 'overtech-digital-services-work':(0,0,1600,970)}
for name,box in crops.items():
    target=PUBLIC/(name+'-v2.webp')
    Image.open(PUBLIC/(name+'.webp')).crop(box).save(target,quality=88,method=6)
    manifest['replacements'].append({'from':'/library/artwork/'+name+'.webp','to':'/library/artwork/'+target.name,'reason':'Deliberate complete section detail cropped at a natural boundary; no fabricated pixels.'})

# Full original captures contain the rest of the cards lost by viewport exports.
full_crops={
 'agentic-mission-control-case-study':('agentic-mission-control/case-study-full',(0,0,1440,1215)),
 'agentic-mission-control-episode':('agentic-mission-control/episode-live-full',(0,0,1440,1085)),
 'overtech-digital-services-home':('overtech-digital-services/home-full',(0,0,1440,950)),
 'overtech-digital-services-tools':('overtech-digital-services/tools-full',(0,0,1440,1390)),
 'ai-engineer-worldsfair-showcase-home':('ai-engineer-worldsfair-showcase/home-full',(0,0,1440,700)),
}
for name,(source,box) in full_crops.items():
    target=PUBLIC/(name+'-v2.webp')
    Image.open(ROOT/'content/media-src'/(source+'.png')).crop(box).save(target,quality=88,method=6)
    manifest['replacements'].append({'from':'/library/artwork/'+name+'.webp','to':'/library/artwork/'+target.name,'reason':'Complete section recovered from the owner-supplied full-page capture.', 'source':source+'.png'})

section_crops={'agentic-mission-control-harness':None,'agentic-mission-control-report':None,
 'agentic-mission-control-timeline':None,'gowipe-product':(0,0,1440,1260),
 'gowipe-science':(0,0,1440,1050),'gowipe-story':None}
for name,box in section_crops.items():
    source=WORK/'section-captures'/(name+'.png')
    if not source.exists(): continue
    capture=Image.open(source)
    if box: capture=capture.crop(box)
    target=PUBLIC/(name+'-v2.webp')
    capture.save(target,quality=90,method=6)
    manifest['replacements'].append({'from':'/library/artwork/'+name+'.webp','to':'/library/artwork/'+target.name,'reason':'Recaptured complete source section or complete purchasing component; source/bounds recorded in section-captures/sources.json.'})

frames={'agentic-mission-control-reel':2,'ai-engineer-worldsfair-showcase-walkthrough':1,'daryl-davis-homepage-original':2,'gowipe-walkthrough':3,'overtech-digital-services-walkthrough':1,'vantage-movers-walkthrough':1}
for stem,number in frames.items():
    target=PUBLIC/(stem+'-poster-v2.webp')
    Image.open(WORK/'film-frames'/f'{stem}-{number}.webp').save(target,quality=88,method=6)
    manifest['replacements'].append({'from':f'/library/artwork/{stem}-poster.webp','to':'/library/artwork/'+target.name,'reason':f'Real product-use frame {number} from supplied recording; selection contact sheet retained.'})
(WORK/'staged-media.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
(WORK/'concepts.json').write_text(json.dumps(concepts,indent=2)+'\n',encoding='utf-8')
for size,label in ((180,'card'),(280,'board')):
    cellw=size*2+40; cellh=int(size*1.25)+80
    sheet=Image.new('RGB',(cellw*4,cellh*4),'#eeece4'); d=ImageDraw.Draw(sheet)
    for i,row in enumerate(inventory):
        x=(i%4)*cellw;y=(i//4)*cellh
        for n,variant in enumerate((chosen[row['slug']], 'b' if chosen[row['slug']]=='a' else 'a')):
            art=Image.open(WORK/'typeset'/f"{row['slug']}-{variant}.png").resize((size,int(size*1.25)),Image.Resampling.LANCZOS)
            sheet.paste(art,(x+n*(size+10)+10,y+30))
            d.text((x+n*(size+10)+10,y+10),'CHOSEN '+variant.upper() if n==0 else 'ALTERNATE '+variant.upper(),font=font(12),fill='#354130')
        d.text((x+10,y+int(size*1.25)+40),row['title'],font=font(12),fill='#354130')
    sheet.save(WORK/f'contact-{label}.jpg',quality=92)
print('Staged 14 posters, 14 simplified diagrams and natural-edge captures; no DB writes.')
