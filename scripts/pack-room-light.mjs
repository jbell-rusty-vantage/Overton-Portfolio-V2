// Pack a bounded static interior light bake. Run after kit/bake_room.py.
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dedup,join,weld,meshopt} from '@gltf-transform/functions';
import {MeshoptEncoder} from 'meshoptimizer';
import {writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import validator from 'gltf-validator';
await MeshoptEncoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder});
const doc=await io.read('.local-library/kit/interior-light-export.glb');
await doc.transform(join(),weld(),dedup());
const dimensions = [];
for(const tex of doc.getRoot().listTextures()) {
  dimensions.push(await sharp(tex.getImage()).metadata());
  tex.setImage(await sharp(tex.getImage()).jpeg({quality:95,chromaSubsampling:'4:4:4'}).toBuffer()).setMimeType('image/jpeg');
}
await doc.transform(meshopt({encoder:MeshoptEncoder,level:'medium'}));
const bytes=await io.writeBinary(doc);
const report=await validator.validateBytes(bytes,{maxIssues:32});
if(report.issues.numErrors||bytes.length>4*1024*1024)throw Error(JSON.stringify({bytes:bytes.length,budget:4*1024*1024,issues:report.issues}));
await writeFile('public/travellers-rest/interior-light.glb',bytes);
await writeFile('assets/travellers-rest/kit/lightmap.json',JSON.stringify({file:'public/travellers-rest/interior-light.glb',bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),errors:report.issues.numErrors,texture:dimensions[0]?.width,samples:48,cleanup:'CPU compositor denoise; raw atlas preserved in editable blend'},null,2)+'\n');
console.log({bytes:bytes.length,errors:report.issues.numErrors});
