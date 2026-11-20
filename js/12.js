(()=>{
const Q=s=>document.querySelector(s);
const resetTools=()=>{document.querySelectorAll('#tools .on-btn').forEach(b=>{if(/^(pen|cm|er|hand|laser)$/.test(b.dataset.a))b.click()});
 const L=document.getElementById('laser');if(L&&!L.hidden){const b=Q('#tools [data-a=laser]');b&&b.click()}
 PM=CM=ER=HM=0;document.body.classList.remove('pm','cm')};
const oo=open;open=function(id){if(id!==cur)resetTools();return oo.apply(this,arguments)};
let tt;const toast=t=>{let e=Q('#ftoast');if(!e){e=document.createElement('div');e.id='ftoast';e.setAttribute('role','status');document.body.appendChild(e)}e.textContent=t;e.hidden=false;clearTimeout(tt);tt=setTimeout(()=>e.hidden=true,3500)};
const safe=s=>s.replace(/[^\w.\-]+/g,'_'),isImg=f=>/^image\//.test(f.type);
const upload=(f,gz)=>new Promise((ok,no)=>{const p=safe(room)+'/'+uid()+'-'+safe(f.name)+(gz?'.gz':''),x=new XMLHttpRequest;
 x.open('POST',CFG.url+'/storage/v1/object/mosaic-files/'+p);x.setRequestHeader('apikey',CFG.key);if(CFG.key.startsWith('eyJ'))x.setRequestHeader('Authorization','Bearer '+CFG.key);
 x.setRequestHeader('Content-Type',gz?'application/gzip':(f.type||'application/octet-stream'));x.upload.onprogress=e=>e.lengthComputable&&toast('Uploading '+f.name+' '+Math.round(e.loaded/e.total*100)+'%');
 x.onload=()=>x.status<300?ok(CFG.url+'/storage/v1/object/public/mosaic-files/'+p):no(new Error('storage '+x.status));x.onerror=()=>no(new Error('network'));x.send(f)});
/* text-like files (json, svg, csv, source, 3D text formats…) are gzipped; everything else is already compressed */
const gzOf=async f=>{if(!window.MosaicPack||!MosaicPack.canGzip()||!MosaicPack.opt('gzipFiles',true)||f.size<1024||!MosaicPack.compressible(f.name,f.type))return null;
 try{const z=await MosaicPack.gzip(new Uint8Array(await f.arrayBuffer()));return z.length<f.size*.9?new Blob([z],{type:'application/gzip'}):null}catch(e){return null}};
const dataBlob=u=>{const m=/^data:([^;,]*)(;base64)?,(.*)$/s.exec(u);if(!m)throw new Error('bad data');const b=m[2]?atob(m[3]):decodeURIComponent(m[3]),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return new Blob([a],{type:m[1]||'application/octet-stream'})};
window.mosaicDownloadFile=async i=>{try{
 if(!i.gz&&!window.MOSAIC_APP&&/^https?:/.test(i.t)){const a=document.createElement('a');a.href=i.t+'?download='+encodeURIComponent(i.nm||'file');a.download=i.nm||'file';a.click();return}
 let blob;if(/^data:/.test(i.t))blob=dataBlob(i.t);else{const r=await fetch(i.t);if(!r.ok)throw new Error('server answered '+r.status);blob=await r.blob()}
 if(i.gz)blob=new Blob([await MosaicPack.gunzip(new Uint8Array(await blob.arrayBuffer()))]);
 await save(i.nm||'file',blob);toast('Saved '+(i.nm||'file'))}catch(e){toast('Could not save '+(i.nm||'file')+': '+e.message)}};
window.sendFile=async(f,at)=>{if(RO)return;const[W,H]=DEF.fl,pos=at?{x:at.x-W/2,y:at.y-H/2}:{},fin=(u,x)=>{add('fl',{t:u,nm:f.name,sz:f.size,...(x||{}),...pos});if(!fpn.hidden)draw()};
 try{const z=await gzOf(f),zx=z?{gz:1,zs:z.size}:null;
  if((z?z.size:f.size)<=1.5e6){rdU(z||f,u=>{fin(u,zx);toast('Added '+f.name+(z?' (compressed to '+fmtSz(z.size)+')':''))});return}
  if(f.size>50e6)return toast(f.name+' is over the 50 MB limit');
  if(!CFG||!CFG.url||!CFG.key)return toast(window.MZ&&MZ.local?'Local-only projects keep files up to 1.5 MB (after compression). Move the project to the cloud for bigger files.':'Connect the cloud (☁ Cloud) to send files over 1.5 MB');
  toast('Uploading '+f.name+'…');fin(await upload(z||f,!!z),zx);toast('Sent '+f.name+' ('+fmtSz(z?z.size:f.size)+(z?', compressed from '+fmtSz(f.size):'')+')')}
 catch(e){toast('Upload failed ('+e.message+'). Has the mosaic-files bucket been created?')}};
cv.addEventListener('dragover',e=>{if(!RO&&e.dataTransfer&&[...e.dataTransfer.types].includes('Files'))e.preventDefault()});
cv.addEventListener('drop',e=>{const fs=e.dataTransfer&&[...e.dataTransfer.files];if(RO||!fs||!fs.length||fs.every(isImg))return;
 e.preventDefault();e.stopImmediatePropagation();const p=pt(e);fs.forEach((f,k)=>{const a={x:p.x+k*24,y:p.y+k*24};isImg(f)?img(f,a):sendFile(f,a)})},true);
addEventListener('paste',e=>{if(RO||cv.hidden||e.target.isContentEditable||!e.clipboardData)return;[...e.clipboardData.files].filter(f=>!isImg(f)).forEach(f=>sendFile(f))});
Q('#th').insertAdjacentHTML('beforebegin','<button id="fb">📁 Files</button>');
const fpn=document.createElement('div');fpn.id='fpn';fpn.hidden=true;fpn.setAttribute('role','dialog');fpn.setAttribute('aria-label','Files');document.body.appendChild(fpn);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),ext=n=>(n.split('.').pop()||'file').toLowerCase().slice(0,4);
const dl=i=>window.mosaicDownloadFile(i);
const files=()=>Object.values(S.it).filter(i=>i.ty==='fl'&&!i.del).sort((a,b)=>(b.u||0)-(a.u||0));
function draw(){const L=files();fpn.innerHTML='<div class="fh"><b>Files</b><span>'+L.length+' · '+fmtSz(L.reduce((s,i)=>s+(i.sz||0),0))+'</span>'+(RO?'':'<button data-a="up">Upload</button>')+(L.length>1?'<button data-a="all">Save all</button>':'')+'<button data-a="x" aria-label="Close">✕</button></div>'
 +(L.length?L.map(i=>'<div class="fr"><span class="fx">'+esc(ext(i.nm||''))+'</span><span class="fn" title="'+esc(i.nm||'')+'">'+esc(i.nm||'file')+'<small>'+(i.sz?fmtSz(i.sz)+' · ':'')+(i.gz&&i.zs?'stored as '+fmtSz(i.zs)+' · ':'')+esc((S.pg[i.p]||{}).n||'')+'</small></span><button data-d="'+i.id+'">Save</button><button data-s="'+i.p+'">Show</button></div>').join(''):'<p class="fe">No files yet. Drop any file onto a board, paste one, or press Upload.</p>')}
fpn.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;
 if(d.a==='x')fpn.hidden=true;else if(d.a==='up')pkF('*/*',f=>sendFile(f));else if(d.a==='all')files().forEach((i,k)=>setTimeout(()=>dl(i),k*400));
 else if(d.d)dl(S.it[d.d]);else if(d.s){open(d.s);fpn.hidden=true}});
Q('#fb').onclick=()=>{fpn.hidden=!fpn.hidden;if(!fpn.hidden)draw()};addEventListener('keydown',e=>{if(e.key==='Escape'&&!fpn.hidden)fpn.hidden=true});
})();