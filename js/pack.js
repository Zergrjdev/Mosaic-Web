/* Mosaic pack: compression helpers shared by the whole app (loaded before the editor).
   - pack / unpack   synchronous LZ compression for what Mosaic keeps in localStorage (project data, restore points)
   - gzip / gunzip   streaming gzip for compressed backups (.mosaic) and attached text-like files
   - readBackup      reads a backup that is either plain .json or gzip-compressed .mosaic
   - usage / compressAll   used by Settings > Performance
   Everything here is optional and falls back to the old uncompressed behaviour. */
(()=>{
'use strict';
const MARK='Z1~';                                   /* marks a compressed localStorage value; JSON never starts with this */
const prefs=()=>{try{return JSON.parse(localStorage['mosaic:prefs']||'{}')||{}}catch(e){return{}}};
const opt=(k,d)=>{const p=prefs().perf;return p&&p[k]!==undefined?p[k]:d};
const enc=new TextEncoder(),dec=new TextDecoder();
const toBytes=x=>typeof x==='string'?enc.encode(x):x instanceof Uint8Array?x:new Uint8Array(x);
async function pipe(bytes,stream){return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer())}
const PROJECT_KEY=/^mosaic:([\w-]{8,64})$/,VERSION_KEY=/^mosaic-ver:([\w-]{8,64})$/;

const P=window.MosaicPack={
 MARK,opt,
 packed:s=>typeof s==='string'&&s.startsWith(MARK),
 /* string -> string for localStorage. Small values and anything that would not shrink are stored as they are. */
 pack(str,force){
  if(typeof str!=='string'||!window.LZString||(!force&&!opt('compress',true))||str.length<1500)return str;
  try{const z=MARK+LZString.compressToUTF16(str);return z.length<str.length?z:str}catch(e){return str}},
 /* string from localStorage -> original string. Throws if a compressed value cannot be read (never returns garbage). */
 unpack(raw){
  if(!P.packed(raw))return raw;
  if(!window.LZString)throw new Error('The compression library did not load.');
  const s=LZString.decompressFromUTF16(raw.slice(MARK.length));
  if(s==null||s==='')throw new Error('Stored data could not be decompressed.');
  return s},
 canGzip:()=>typeof CompressionStream==='function'&&typeof DecompressionStream==='function',
 isGzip:u=>!!u&&u.length>2&&u[0]===0x1f&&u[1]===0x8b,
 async gzip(data){return pipe(toBytes(data),new CompressionStream('gzip'))},
 async gunzip(data){return pipe(toBytes(data),new DecompressionStream('gzip'))},
 async deflateRaw(data){return pipe(toBytes(data),new CompressionStream('deflate-raw'))},
 async gzipBlob(str){return new Blob([await P.gzip(str)],{type:'application/gzip'})},
 async readBackup(file){const u=new Uint8Array(await file.arrayBuffer());return P.isGzip(u)?dec.decode(await P.gunzip(u)):dec.decode(u)},

 /* Attached files: only text-like formats are worth gzipping (images, video, zips and office files are already compressed). */
 compressible(name,type){
  const n=String(name||'').toLowerCase(),t=String(type||'').toLowerCase();
  return /^text\//.test(t)||/(json|xml|svg|javascript|yaml|csv|markdown|x-sh|sql|wasm)/.test(t)
   ||/\.(txt|md|csv|tsv|json|xml|svg|html?|css|js|mjs|ts|tsx|jsx|yaml|yml|toml|ini|log|sql|glsl|shader|cs|cpp|h|c|gd|lua|py|java|obj|gltf|tmx|tsx|ldtk|unity|prefab|mat|anim|asset)$/.test(n)},

 /* What Mosaic keeps on this device. bytes are UTF-16 (2 per character), which is how browsers count localStorage. */
 usage(){
  const out={total:0,projects:[],other:0};let mine=0;
  const names={};
  try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i),v=localStorage.getItem(k)||'',b=(k.length+v.length)*2;out.total+=b;
   let m=PROJECT_KEY.exec(k);
   if(m){const e=names[m[1]]||(names[m[1]]={rid:m[1],bytes:0,raw:0,versions:0,packed:false});e.bytes+=b;e.packed=P.packed(v);
    try{e.raw=(P.packed(v)?P.unpack(v):v).length*2}catch(x){e.raw=b}mine+=b;continue}
   m=VERSION_KEY.exec(k);
   if(m){const e=names[m[1]]||(names[m[1]]={rid:m[1],bytes:0,raw:0,versions:0,packed:false});e.versions+=b;e.bytes+=b;mine+=b}}}catch(e){}
  out.projects=Object.values(names).sort((a,b)=>b.bytes-a.bytes);out.other=out.total-mine;return out},
 /* Re-store every project and restore point in compressed form. Returns bytes saved. */
 compressAll(){
  let saved=0,n=0;
  try{const keys=[];for(let i=0;i<localStorage.length;i++)keys.push(localStorage.key(i));
   for(const k of keys){
    if(PROJECT_KEY.test(k)){const v=localStorage.getItem(k);if(P.packed(v))continue;const z=P.pack(v,true);if(z!==v){try{localStorage.setItem(k,z);saved+=(v.length-z.length)*2;n++}catch(e){}}}
    else if(VERSION_KEY.test(k)){const v=localStorage.getItem(k);try{const L=JSON.parse(v||'[]');let ch=false;
      L.forEach(r=>{if(r&&typeof r.s==='string'&&!P.packed(r.s)){const z=P.pack(r.s,true);if(z!==r.s){r.s=z;ch=true}}});
      if(ch){const w=JSON.stringify(L);localStorage.setItem(k,w);saved+=(v.length-w.length)*2;n++}}catch(e){}}}}catch(e){}
  return{saved,count:n}},
 /* Delete the restore points of one project (or of all of them). */
 clearRestorePoints(rid){let n=0;try{const keys=[];for(let i=0;i<localStorage.length;i++)keys.push(localStorage.key(i));
  keys.forEach(k=>{const m=VERSION_KEY.exec(k);if(m&&(!rid||m[1]===rid)){localStorage.removeItem(k);n++}})}catch(e){}return n},
 fmt:n=>n<1024?n+' B':n<1048576?(n/1024).toFixed(n<10240?1:0)+' KB':(n/1048576).toFixed(1)+' MB'
};
})();
