/* Mosaic: one-click UI asset export for design pages.
   Every item (or the selection) becomes its own transparent PNG/SVG, or a sprite atlas, plus layout.json. */
(()=>{
const enc=new TextEncoder(),M=window.Mosaic,P=(p,d)=>M.prefs.get(p,d);

/* ---- minimal ZIP writer (stored; PNGs are already compressed) ---- */
const CT=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc=u=>{let c=0xFFFFFFFF;for(let i=0;i<u.length;i++)c=CT[(c^u[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0};
function build(ents){
 const parts=[],cd=[],d=new Date(),dt=((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate(),tm=(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1);let off=0;
 for(const f of ents){
  const data=f.data,nm=enc.encode(f.name),c=crc(f.raw),n=f.raw.length,z=data.length,m=f.method,h=new DataView(new ArrayBuffer(30));
  h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(8,m,true);h.setUint16(10,tm,true);h.setUint16(12,dt,true);
  h.setUint32(14,c,true);h.setUint32(18,z,true);h.setUint32(22,n,true);h.setUint16(26,nm.length,true);
  parts.push(new Uint8Array(h.buffer),nm,data);
  const e=new DataView(new ArrayBuffer(46));
  e.setUint32(0,0x02014b50,true);e.setUint16(4,20,true);e.setUint16(6,20,true);e.setUint16(8,0x0800,true);e.setUint16(10,m,true);e.setUint16(12,tm,true);e.setUint16(14,dt,true);
  e.setUint32(16,c,true);e.setUint32(20,z,true);e.setUint32(24,n,true);e.setUint16(28,nm.length,true);e.setUint32(42,off,true);
  cd.push(new Uint8Array(e.buffer),nm);off+=30+nm.length+z}
 let cs=0;cd.forEach(x=>cs+=x.length);
 const z=new DataView(new ArrayBuffer(22));z.setUint32(0,0x06054b50,true);z.setUint16(8,ents.length,true);z.setUint16(10,ents.length,true);z.setUint32(12,cs,true);z.setUint32(16,off,true);
 return new Blob([...parts,...cd,new Uint8Array(z.buffer)],{type:'application/zip'})}
const rawOf=f=>typeof f.data==='string'?enc.encode(f.data):f.data;
/* plain "stored" zip: synchronous, kept for plugins that call Mosaic.zip() */
function zip(files){return build(files.map(f=>{const raw=rawOf(f);return{name:f.name,raw,data:raw,method:0}}))}
/* compressed zip: JSON and SVG shrink a lot; PNG/JPG are already compressed and stay stored */
async function zipPacked(files){const ents=[];
 for(const f of files){const raw=rawOf(f);let data=raw,method=0;
  if(raw.length>256&&!/\.(png|jpe?g|webp|zip|gz)$/i.test(f.name)){try{const z=await window.MosaicPack.deflateRaw(raw);if(z.length<raw.length*.95){data=z;method=8}}catch(e){}}
  ents.push({name:f.name,raw,data,method})}
 return build(ents)}
M.zipCompressed=zipPacked;
M.zip=zip;

/* ---- grouping and naming ---- */
const NOTXT=['img','pen','bool','fl','lk','swc','tc','td','bdc'];
const txt=i=>NOTXT.includes(i.ty)?'':String(i.t||'');
const slug=t=>String(t||'').split('\n')[0].trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40);
const cleanName=n=>String(n||'').replace(/\\/g,'/').split('/').map(s=>s.trim().replace(/[^\w.-]+/g,'-').replace(/^[-.]+|-+$/g,'')).filter(Boolean).join('/').slice(0,80);
const ov=(a,b)=>a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;
function groups(items,merge){
 if(!merge)return items.map(i=>[i]);
 const p=items.map((_,k)=>k),f=k=>p[k]===k?k:(p[k]=f(p[k]));
 for(let a=0;a<items.length;a++)for(let b=a+1;b<items.length;b++)if(ov(items[a],items[b]))p[f(a)]=f(b);
 const m=new Map();items.forEach((it,k)=>{const r=f(k);if(!m.has(r))m.set(r,[]);m.get(r).push(it)});return[...m.values()]}
const byArea=g=>g.slice().sort((a,b)=>b.w*b.h-a.w*a.h);
function baseName(g,mode,counter){
 const big=byArea(g),ex=big.find(i=>cleanName(i.xn));if(ex)return cleanName(ex.xn);
 if(mode==='type'){const t=big[0].ty||'item';counter[t]=(counter[t]||0)+1;return t+'-'+counter[t]}
 const withText=big.find(i=>slug(txt(i)));
 return slug(String(big[0].nm||'').replace(/\.[^.]+$/,''))||(withText&&slug(txt(withText)))||big[0].ty||'item'}
const scales=v=>{const a=String(v).split(/[\s,;]+/).map(x=>/^(\d*\.?\d+)x?$/i.exec(x)).filter(Boolean).map(m=>+m[1]).filter(n=>n>0&&n<=16);return a.length?[...new Set(a)]:[1]};
const PV={center:[.5,.5],'top-left':[0,0],top:[.5,0],'top-right':[1,0],left:[0,.5],right:[1,.5],'bottom-left':[0,1],bottom:[.5,1],'bottom-right':[1,1]};

const toPng=(svg,W,H,k)=>new Promise((ok,no)=>{
 const im=new Image,u=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
 im.onload=()=>{try{const c=document.createElement('canvas');c.width=Math.max(1,Math.round(W*k));c.height=Math.max(1,Math.round(H*k));
  c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);c.toBlob(b=>b?ok(b):no(new Error('encode')),'image/png')}catch(e){no(e)}};
 im.onerror=()=>{URL.revokeObjectURL(u);no(new Error('render'))};im.src=u});
const bytes=async b=>new Uint8Array(await b.arrayBuffer());

/* ---- sprite atlas (shelf packing, power-of-two sheet) ---- */
async function buildAtlas(recs,blobs){
 const pad=2,items=recs.map(r=>({r,w:r.w,h:r.h})).sort((a,b)=>b.h-a.h||b.w-a.w),wide=Math.max(...items.map(i=>i.w+pad*2));
 let W=1024;while(W<wide)W*=2;let x=pad,y=pad,row=0;
 items.forEach(i=>{if(x+i.w+pad>W){x=pad;y+=row+pad;row=0}i.x=x;i.y=y;x+=i.w+pad;row=Math.max(row,i.h)});
 let H=1;while(H<y+row+pad)H*=2;if(H>8192)throw new Error('atlas');
 const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
 for(const i of items){const bmp=await createImageBitmap(blobs.get(i.r.name));g.drawImage(bmp,i.x,i.y);bmp.close&&bmp.close()}
 const frames={};items.forEach(i=>{frames[i.r.name]={frame:{x:i.x,y:i.y,w:i.w,h:i.h},sourceSize:{w:i.w,h:i.h},pivot:i.r.pivot,...(i.r.nineSlice?{nineSlice:i.r.nineSlice}:{})}});
 const png=await new Promise((ok,no)=>c.toBlob(b=>b?ok(b):no(new Error('encode')),'image/png'));
 return{png:await bytes(png),json:{schema:M.schema.layout,meta:{image:'atlas.png',size:{w:W,h:H},scale:1},frames}}}

let busy=false;
async function exportAssets(fmtFull,opt){
 if(busy)return;const o=opt||{},sel=o.sel!==undefined?o.sel:($('#exs').value==='s'&&SL.size>0);
 const target=/^plugin:/.test(fmtFull)?M.exportTargets.get(fmtFull):null;
 if(/^plugin:/.test(fmtFull)&&!target){msg('That export format is no longer available');return}
 const kind=fmtFull==='zip-svg'?'svg':fmtFull==='zip-atlas'?'atlas':'png';
 const items=Object.values(S.it).filter(i=>i.p===cur&&!i.del&&!i.hd&&!i.nx&&i.ty!=='cn'&&(!sel||SL.has(i.id)));
 if(!items.length){msg('Nothing to export');$('#ex').classList.add('on');return}
 busy=true;
 try{
  M.emit('export:before',{format:fmtFull});
  const merge=$('#xmg').checked,sc=kind==='svg'||kind==='atlas'?[1]:scales($('#exk').value),used=new Set(),counter={},prefix=cleanName(P('files.prefix','')),mode=P('files.naming','text');
  const A=groups(items,merge).map(g=>{
   let b0=prefix+baseName(g,mode,counter),n=b0,c=1;while(used.has(n.toLowerCase()))n=b0+'-'+(++c);used.add(n.toLowerCase());
   const pad=Math.ceil(Math.max(0,...g.map(i=>(i.sh?40:0)+(i.bu?i.bu*3:0)))),[x1,y1]=bounds(g,pad);
   return{n,g,pad,x:x1,y:y1}}).sort((a,b)=>a.y-b.y||a.x-b.x);
  const ox=Math.min(...A.map(a=>a.x)),oy=Math.min(...A.map(a=>a.y)),files=[],man=[],blobs=new Map();let done=0;
  for(const a of A){
   const r=svgOf(false,true,a.pad,a.g);if(!r)continue;
   const big=byArea(a.g),sl=(big.find(i=>Array.isArray(i.sl)&&i.sl.some(v=>+v>0))||{}).sl,pv=PV[(big.find(i=>i.pv)||{}).pv]||PV.center;
   const rec={name:a.n,x:Math.round(a.x-ox),y:Math.round(a.y-oy),w:Math.round(r.W),h:Math.round(r.H),pad:a.pad,items:a.g.length,pivot:{x:pv[0],y:pv[1]},...(sl?{nineSlice:{l:+sl[0]||0,t:+sl[1]||0,r:+sl[2]||0,b:+sl[3]||0}}:{}),files:{}};
   if(kind==='svg'){const f='assets/'+a.n+'.svg';files.push({name:f,data:enc.encode(r.s)});rec.files['1x']=f}
   else for(const k of sc){
    const b=await toPng(r.s,r.W,r.H,k);if(kind==='atlas'){blobs.set(a.n,b)}else{const f='assets/'+a.n+(k===1?'':'@'+k+'x')+'.png';files.push({name:f,data:await bytes(b)});rec.files[k+'x']=f}}
   man.push(rec);msg('Rendering '+(++done)+' of '+A.length+'…')}
  if(!man.length){msg('Nothing to export');return}
  if(kind==='atlas'){const at=await buildAtlas(man,blobs);files.push({name:'atlas.png',data:at.png},{name:'atlas.json',data:JSON.stringify(at.json,null,2)});man.forEach(m=>m.files['atlas']='atlas.png')}
  if(kind!=='svg'&&P('files.preview',true)){const pv=svgOf(false,false,24,items);if(pv)files.unshift({name:'_preview.png',data:await bytes(await toPng(pv.s,pv.W,pv.H,1))})}
  const design=S.pg[cur].n||'design',name=design.replace(/[^\w-]+/g,'-');
  let J={schema:M.schema.layout,generator:'Mosaic '+M.version,design,exported:new Date().toISOString(),units:'px',origin:'top-left (y points down)',scales:sc,
   size:{w:Math.max(...man.map(m=>m.x+m.w)),h:Math.max(...man.map(m=>m.y+m.h))},assets:man};
  const ctx={files,format:fmtFull,design,kind};
  J=await M.hooks.run('export:manifest',J,ctx);
  files.unshift({name:'layout.json',data:JSON.stringify(J,null,2)});
  let suffix='-ui-assets';
  if(target){ctx.layout=J;const r=await target.build(ctx);if(Array.isArray(r))files.splice(0,files.length,...r);suffix='-'+fmtFull.split(':')[2]}
  else if(kind==='atlas')suffix='-ui-atlas';
  await save(name+suffix+'.zip',window.MosaicPack&&MosaicPack.canGzip()&&P('files.compressZip',true)?await zipPacked(files):zip(files));
  M.emit('export:done',{design,format:target?target.label:kind==='atlas'?'sprite atlas':kind.toUpperCase()+' assets',count:man.length,zip:true});
 }catch(e){msg(/atlas/.test(e.message)?'The atlas would be larger than 8192 px. Export as separate PNGs instead.':/render|encode/.test(e.message)?"Couldn't render an item. If it uses an image from another website, upload the image instead.":'Export failed: '+e.message)}
 finally{busy=false}}
M.exportAssets=exportAssets;

/* ---- UI: export formats, merge option, one-click button ---- */
const exf=$('#exf');
exf.insertAdjacentHTML('afterbegin','<option value="zip-png">UI assets ZIP · each item as PNG + layout.json</option><option value="zip-atlas">Sprite atlas ZIP · one sheet + atlas.json + layout.json</option><option value="zip-svg">UI assets ZIP · each item as SVG + layout.json</option><optgroup id="xplg" label="From plugins" hidden></optgroup>');
$('#exd').insertAdjacentHTML('beforebegin','<label id="xmgl"><input type="checkbox" id="xmg" checked> Merge overlapping items into one asset (button + its label)</label><p id="xmh" style="margin:0;font-size:12px;color:var(--mu)">Each asset is a transparent image cropped to its content. Size: 1x, or several like 1x,2x,3x. layout.json lists every asset’s position, pivot and 9-slice. Name an item or skip it from the Asset button when it is selected.</p>');
const isZip=v=>/^(zip-|plugin:)/.test(v);
const zipUi=()=>{const z=isZip(exf.value);$('#xmgl').hidden=$('#xmh').hidden=!z;$('#ext').closest('label').hidden=z};
exf.addEventListener('change',zipUi);
function refreshTargets(){const g=$('#xplg'),cur0=exf.value;g.innerHTML='';M.exportTargets.list().forEach(t=>{const o=document.createElement('option');o.value=t.key;o.textContent=t.label;g.appendChild(o)});g.hidden=!g.children.length;if([...exf.options].some(o=>o.value===cur0))exf.value=cur0;else exf.value=P('files.format','zip-png')||'zip-png';zipUi()}
M.on('exports:changed',refreshTargets);
const od=$('#exd').onclick;
$('#exd').onclick=()=>{const f=exf.value;if(isZip(f))exportAssets(f);else od&&od()};

$('#exb').insertAdjacentHTML('beforebegin','<button class="pri" id="xui" hidden title="Export every item (or your selection) as separate transparent images + layout.json in one ZIP">⤓ Export UI</button>');
$('#xui').onclick=()=>{const f=P('files.format','zip-png');exportAssets(isZip(f)?f:'zip-png',{sel:SL.size>0})};

let lastDesign=null;
function applyDefaults(){
 const f=P('files.format','zip-png');if([...exf.options].some(o=>o.value===f)&&exf.value!==f)exf.value=f;
 $('#exk').value=P('files.scale','1x');$('#xmg').checked=P('files.merge',true);$('#ext').checked=P('files.transparent',true);$('#exs').value='a';zipUi()}
function designUi(){
 const f=typeof isF==='function'&&isF(),onB=!$('#exb').hidden;
 $('#xui').hidden=!(f&&onB);
 if(f){if(lastDesign!==cur){lastDesign=cur;applyDefaults()}}
 else if(lastDesign!==null){lastDesign=null;if(isZip(exf.value))exf.value='png';$('#exk').value='2x'}
 zipUi()}
M.on('prefs:change',e=>{if(/^(files|\*)/.test(e.path)&&typeof isF==='function'&&isF())applyDefaults()});
const o14=open;open=function(){const r=o14.apply(this,arguments);try{designUi()}catch(e){}return r};
exf.value='png';refreshTargets();try{designUi()}catch(e){}
})();
