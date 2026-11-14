// Download and pack the complete TSLA sequence already identified in the survey.
// No database writes; keep the source record and bytes with reproducible hashes.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
const id = "jackson-overton-1829-06-08";
const recordPath = "assets/travellers-rest/archive/jackson-letter.json";
let curated = {};
try { curated = JSON.parse(await readFile(recordPath, "utf8")); }
catch (error) { if (error.code !== "ENOENT") throw error; }
const folder = `assets/travellers-rest/archive/originals/letters/${id}`;
const delivery = `public/travellers-rest/archive/letters/${id}`;
await mkdir(folder, { recursive: true });
await mkdir(delivery, { recursive: true });
const get = async (url) => {
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (historical collection research)" }, signal: AbortSignal.timeout(45000) });
  if (!response.ok) throw Error(`${response.status} ${url}`);
  return Buffer.from(await response.arrayBuffer());
};
const item = "https://teva.contentdm.oclc.org/digital/collection/p15138coll33/id/144";
const manifest = "https://teva.contentdm.oclc.org/iiif/2/p15138coll33:144/manifest.json";
const source = await get("https://teva.contentdm.oclc.org/digital/api/collections/p15138coll33/items/144/false");
await writeFile(`${folder}/record.json`, source);
await writeFile(`${folder}/manifest.json`, await get(manifest));
if (!source.toString().includes("No copyright")) throw Error("The source rights field changed; review the held record before reuse.");
const pages = [];
for (let n = 1; n <= 8; n++) {
  const originalUrl = `https://teva.contentdm.oclc.org/iiif/2/p15138coll33:${135+n}/full/full/0/default.jpg`;
  const bytes = await get(originalUrl);
  const metadata = await sharp(bytes).metadata();
  const stem = "p" + String(n).padStart(2,"0");
  await writeFile(`${folder}/${stem}.jpg`, bytes);
  await sharp(bytes).webp({quality:92}).toFile(`${delivery}/${stem}.webp`);
  await sharp(bytes).resize({width:480,withoutEnlargement:true}).webp({quality:82}).toFile(`${delivery}/${stem}-small.webp`);
  pages.push({...curated.pages?.find((page) => page.n === n),n,originalUrl,sha256:createHash("sha256").update(bytes).digest("hex"),bytes:bytes.length,width:metadata.width,height:metadata.height,
    src:`/travellers-rest/archive/letters/${id}/${stem}.webp`,small:`/travellers-rest/archive/letters/${id}/${stem}-small.webp`,
    label:n<=6?`Letter · page ${n}`:n===7?"Address panel, frank and postmark":"Later storage envelope (not part of the 1829 letter)",
    alt:n<=6?`Page ${n} of Andrew Jackson’s handwritten letter to John Overton, June 8, 1829.`:n===7?"Address to the Honorable John Overton near Nashville, with Jackson’s free frank.":"Later envelope identifying the original Jackson letter."});
}
await writeFile(recordPath, JSON.stringify({...curated,id,title:"Andrew Jackson to John Overton",date:"June 8, 1829",item,manifest,
 credit:"Letter from Andrew Jackson to John Overton, June 8, 1829. Jacob McGavock Dickinson Papers, 1812–1946, ID# 43090. Courtesy Tennessee State Library & Archives.",
 rights:"No copyright — United States (NoC-US 1.0), as stated by the Tennessee State Library & Archives. Credit line required.",rightsSource:"https://rightsstatements.org/vocab/NoC-US/1.0/",
 transcriptSource:"https://tsla.tnsosfiles.com/digital/teva/transcripts/43090.pdf",
 transcriptNote:curated.transcriptNote ?? "The complete eight-image sequence is held. A checked, page-aligned transcription is not yet available in this draft. The archive’s typed transcription has known misreadings; compare The Papers of Andrew Jackson VII, pp. 270–272, and the manuscript before quoting.",pages},null,2)+"\n");
console.log(JSON.stringify({id,pages:pages.length,bytes:pages.reduce((n,p)=>n+p.bytes,0)}));
