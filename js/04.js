
const $=s=>document.querySelector(s),uid=()=>Math.random().toString(36).slice(2,9),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const COL=['#ffd966','#ff9f80','#ffb3d9','#d0b8ff','#9ad0ff','#b5ead7','#ececec','#2d2d34'],CC=['#e84393','#0984e3','#00a383','#e17055','#6c5ce7','#d63031'];
const cv=$('#cv'),w=$('#w'),ttl=$('#ttl'),dbk=$('#db'),insp=$('#insp');
const HP=new URLSearchParams(location.hash.slice(1)),SBR=/^https:\/\/[a-z0-9-]+\.supabase\.co$/;const BAKED={url:'https://skzlgskhgxcpyhnclrwx.supabase.co',key:'sb_publishable_G_jDrnbdkUQSS6MiTn-GrQ_zlWxzfcF'};let CFG={...BAKED,own:1};
try{const c=JSON.parse(localStorage.mosaicCloud||'null');if(c&&SBR.test(c.url))CFG={url:c.url,key:c.key,own:1}}catch(e){}
if(HP.get('sb')&&HP.get('key')&&SBR.test(HP.get('sb')))CFG={url:HP.get('sb'),key:HP.get('key')};
if(window.MZ&&MZ.local)CFG=null; /* local-only project: nothing is ever sent to Supabase */
const MP=window.MosaicPack||{unpack:s=>s,pack:s=>s,opt:(k,d)=>d};
if(!HP.get('room')){let r=null;try{r=localStorage.mosaicRoom}catch(e){}if(!r){r=Math.random().toString(36).slice(2,10)+Math.random().toString(36).slice(2,10);try{localStorage.mosaicRoom=r}catch(e){}}history.replaceState(null,'','#room='+r);HP.set('room',r)}
let room=HP.get('room');const RO=HP.get('ro')==='1';if(RO)document.body.classList.add('ro');
const K='mosaic:'+room,peers=new Set(),els=new Map(),users={},curs={},Vs={};
let S,cur,sel=null,V,D=null,fi=0,bc=null,pr=null,lc=0,lf=0,tp,SL=new Set(),TF="",CM=0,TL=null,mvd=0,DB=0,cs=CFG?'connecting to cloud…':(window.MZ&&MZ.local?'saved on this device only':'browser-only — press ☁ Cloud to store online'),tc2;
const me={id:uid(),n:'Guest '+(10+Math.random()*90|0),c:CC[Math.random()*6|0],x:-1e5,y:-1e5};try{me.n=localStorage.mosaicName||me.n}catch(e){}
function seed(){const n=(id,ty,x,y,W,H,c,t)=>({id,p:'p1',ty,x,y,w:W,h:H,c,t,z:1,u:0}),it={};
[n('a','frame',-40,-50,580,340,'','Ideas'),n('b','note',-10,10,200,150,COL[0],'Double-click a note to edit. Drag to move, pull the corner to resize.'),n('c','note',220,10,200,150,COL[4],'Press Share and open the link on another device to work together live.'),n('d','rect',-10,185,170,80,COL[3],'Shape'),n('e','oval',190,170,110,110,COL[2],''),n('f','text',330,200,200,44,'','Hello, Mosaic'),{id:'g',p:'p1',ty:'cn',a:'b',b:'c',z:0,u:0}].forEach(i=>it[i.id]=i);
return{pg:{p1:{id:'p1',t:'b',n:'Welcome board',o:1,u:0},p2:{id:'p2',t:'d',n:'Getting started',o:2,u:0,b:[{t:'h1',x:'Getting started'},{t:'p',x:'Mosaic combines a canvas board, a block editor and live collaboration.'},{t:'h2',x:'Things to try'},{t:'todo',x:'Add notes, shapes, frames and images on a board'},{t:'todo',x:'Type "# ", "- ", "[] " or "> " to format a block'},{t:'todo',x:'Press Share and open the link in another tab',d:1},{t:'q',x:'Everything saves in your browser automatically.'}]}},it}}
try{const raw=localStorage[K];if(raw){try{S=JSON.parse(MP.unpack(raw))}catch(e){try{localStorage[K+':damaged']=raw}catch(x){}throw e}}}catch(e){console.error('[mosaic] The stored project could not be read. A copy of the raw data was kept under '+K+':damaged',e)}
if(!S||!S.pg)S=seed();if(!S.cm)S.cm={};
/* ---------- sync ---------- */
try{bc=new BroadcastChannel('mosaic-'+room);bc.onmessage=e=>recv(e.data)}catch(e){}
function persist(){clearTimeout(tp);tp=setTimeout(()=>{try{localStorage[K]=MP.pack(JSON.stringify(S))}catch(e){cs='NOT saved in this browser: storage full — export a backup';st()}snap();verSave()},250)}
function out(m){try{bc&&bc.postMessage(m)}catch(e){}if(CH&&RT&&(m.k==='yu'||(m.k==='cur'&&Date.now()-CL.b>100))){if(m.k==='cur')CL.b=Date.now();try{CH.send({type:'broadcast',event:'m',payload:m})}catch(e){}}}
function put(k,v){if(RO)return;v.u=Date.now();S[k][v.id]=v;out({k,v});cloudPush(k,v);persist()}
const del=(k,id)=>put(k,(k==='it'||k==='pg')&&S[k][id]&&!S[k][id].del?{...S[k][id],del:1}:{id,del:1}),pages=()=>Object.values(S.pg).filter(p=>!p.del).sort((a,b)=>a.o-b.o),zmax=()=>Math.max(1,...Object.values(S.it).map(i=>i.z||0));
function recv(m,from,host){
 if(host)peers.forEach(c=>c!==from&&c.open&&c.send(m));
 if(m.k==='cur'){if(m.id===me.id)return;m.t=Date.now();users[m.id]=m;drawCur();st();return}
 if(m.k==='yu'){if(/^[\w-]{1,40}$/.test(m.id)&&typeof m.u==='string')try{yIn(m.id,b64d(m.u))}catch(_){}return}
 if(m.k==='hi'){out({k:'all',s:S});return}
 if(m.k==='rows')m.a.forEach(o=>o&&o.k==='yt'&&yRow(o.id,o.v));
 const L=m.k==='rows'?['pg','it','cm'].map(k=>[k,m.a.filter(o=>o.k===k).map(o=>o.v)]):m.k==='all'?[['pg',Object.values(m.s.pg)],['it',Object.values(m.s.it)],['cm',Object.values(m.s.cm||{})]]:[[m.k,[m.v]]];let ch=0;
 L.forEach(([k,a])=>a.forEach(v=>{if(!(v&&S[k]&&/^[\w-]{1,40}$/.test(v.id)&&typeof v.u==='number'))return;const o=S[k][v.id];if(!o||o.u<v.u){S[k][v.id]=v;ch=1}}));
 if(ch){persist();refresh()}}
/* cloud (Supabase REST: one row per object, polled) */
var CL={since:'',seen:{},q:{},t:0,b:0},CH=null,RT=0;
const hdr=()=>({apikey:CFG.key,...(CFG.key.startsWith('eyJ')?{Authorization:'Bearer '+CFG.key}:{}),'Content-Type':'application/json',...(window.MZ&&MZ.sec?{'x-room':room,...(MZ.k?{'x-edit':MZ.k}:{})}:{})}),EP=()=>CFG.url+'/rest/v1/mosaic_items';
function cloudPush(k,v){if(!CFG||RO)return;CL.q[k+'/'+v.id]={room,k,id:v.id,v,u:v.u};if(!CL.t)CL.t=setTimeout(()=>{CL.t=0;flushCloud()},200)}
async function flushCloud(){const rows=Object.values(CL.q);if(!rows.length)return;CL.q={};cs='saving…';st();
 try{const r=await fetch(EP()+'?on_conflict=room,k,id',{method:'POST',headers:{...hdr(),Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(rows.map(o=>({room:o.room,k:o.k,id:o.id,v:o.v})))});if(!r.ok)throw new Error(r.status+' '+(await r.text()).slice(0,100));cs='saved online'}
 catch(e){rows.forEach(o=>CL.q[o.k+'/'+o.id]=o);cs='cloud save failed ('+e.message+') — kept in this browser, retrying'}st()}
async function pull(first){if(!CFG)return;try{let a;do{const r=await fetch(EP()+'?room=eq.'+encodeURIComponent(room)+(CL.since?'&updated_at=gt.'+encodeURIComponent(CL.since):'')+'&select=k,id,v,updated_at&order=updated_at.asc&limit=1000',{headers:hdr()});if(!r.ok)throw new Error(r.status);a=await r.json();
  if(a.length){CL.since=a[a.length-1].updated_at;a.forEach(o=>CL.seen[o.k+'/'+o.id]=(o.v&&o.v.u)||0);recv({k:'rows',a})}}while(a.length>=1000);
 CL.ok=1;if(!YRd){YRd=1;yGo()}if(first)['pg','it','cm'].forEach(k=>Object.values(S[k]).forEach(v=>v.u>(CL.seen[k+'/'+v.id]||0)&&cloudPush(k,v)));
 if(Object.keys(CL.q).length)flushCloud();else cs='saved online'}catch(e){cs='cloud unreachable ('+e.message+') — working in this browser'}st()}
async function cloudInit(){if(!CFG)return;await pull(1);let pt=0;setInterval(()=>{if(document.hidden)return;if(RT&&++pt%4)return;pull()},15000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)pull()});
 if(!window.supabase){cs+=' · live updates unavailable (library blocked), checking every 15s';st();return}
 try{const c=supabase.createClient(CFG.url,CFG.key);CH=c.channel('mosaic-'+room);
  CH.on('postgres_changes',{event:'*',schema:'public',table:'mosaic_items',filter:'room=eq.'+room},p=>{const o=p.new;if(o&&o.k&&o.v)recv({k:'rows',a:[o]})});
  CH.on('broadcast',{event:'m'},p=>recv(p.payload));
  CH.subscribe(z=>{RT=z==='SUBSCRIBED';st();if(RT)pull()})}catch(e){}}
/* ---------- Yjs: character-level merging for document blocks ---------- */
var Y=null,YA=0,YRd=!CFG,YM=0,YD={},YRAW={},YQ={},YTm=0;
const b64e=u=>{let s='';for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(s)},b64d=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)),YID=/^[\w-]{1,40}$/;
import(new URL('vendor/yjs.js?v=c412263c',document.baseURI).href).then(m=>{Y=m;yGo()}).catch(()=>{});
function yGo(){if(!Y||!YRd||YA)return;YA=1;const p=S.pg[cur];if(p&&p.t==='d'&&!$('#doc').hidden)renderDoc()}
function ydoc(id,seed){if(!YA)return null;let e=YD[id];if(e)return e;const d=new Y.Doc(),t=d.getText('t');e=YD[id]={d,t};
 if(YRAW[id]){YRAW[id].forEach(u=>{try{Y.applyUpdate(d,u,'remote')}catch(_){}});delete YRAW[id]}
 else if(seed){const z=new Y.Doc();z.clientID=1;z.getText('t').insert(0,seed);Y.applyUpdate(d,Y.encodeStateAsUpdate(z),'seed')}
 d.on('update',(u,o)=>{if(o==='remote'||o==='seed')return;(YQ[id]=YQ[id]||[]).push(u);clearTimeout(YTm);YTm=setTimeout(yFlush,120)});
 t.observe(ev=>{if(ev.transaction.origin==='remote')yDom(id,t,ev)});return e}
function yFlush(){Object.keys(YQ).forEach(id=>{const u=Y.mergeUpdates(YQ[id]);delete YQ[id];out({k:'yu',id,u:b64e(u)});yPersist(id)})}
function yPersist(id){if(!CFG||!YD[id])return;const d=YD[id].d;CL.q['yt/'+id]={room,k:'yt',id,v:{s:b64e(Y.encodeStateAsUpdate(d)),v:b64e(Y.encodeStateVector(d)),u:Date.now()}};if(!CL.t)CL.t=setTimeout(()=>{CL.t=0;flushCloud()},200)}
function yIn(id,u){const e=YD[id];if(e){try{Y.applyUpdate(e.d,u,'remote')}catch(_){}}else(YRAW[id]=YRAW[id]||[]).push(u)}
function yRow(id,v){if(!YID.test(id)||!v||typeof v.s!=='string')return;let u;try{u=b64d(v.s)}catch(_){return}yIn(id,u);const e=YD[id];if(e&&Y&&typeof v.v==='string'&&b64e(Y.encodeStateVector(e.d))!==v.v)yPersist(id)}
function ySet(k,x){if(!Y||!YA||!k||!k.id)return;const e=YD[k.id]||(YRAW[k.id]?ydoc(k.id):null);if(!e)return;const o=e.t.toString();if(o===x)return;let a=0,b1=o.length,b2=x.length;while(a<b1&&a<b2&&o[a]===x[a])a++;while(b1>a&&b2>a&&o[b1-1]===x[b2-1]){b1--;b2--}
 e.d.transact(()=>{if(b1>a)e.t.delete(a,b1-a);if(b2>a)e.t.insert(a,x.slice(a,b2))},'local')}
function yAll(){Object.values(S.pg).forEach(p=>p.t==='d'&&!p.del&&(p.b||[]).forEach(k=>ySet(k,k.x||'')))}
function mir(p){if(!Y||!YA||YM||!p.b)return;let ch=0;p.b.forEach(k=>{if(!YID.test(k.id||'')){k.id=uid()+uid();k.s=k.x||'';ch=1}const e=ydoc(k.id,k.s||'');k.x=e.t.toString()});if(ch)put('pg',p)}
function getOff(el){const g=getSelection();if(!g.rangeCount)return 0;const a=g.getRangeAt(0),q=a.cloneRange();q.selectNodeContents(el);q.setEnd(a.endContainer,a.endOffset);return q.toString().length}
function setOff(el,n){const g=getSelection(),r=document.createRange(),w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let nd;while(nd=w.nextNode()){if(n<=nd.length){r.setStart(nd,n);r.collapse(true);g.removeAllRanges();g.addRange(r);return}n-=nd.length}r.selectNodeContents(el);r.collapse(false);g.removeAllRanges();g.addRange(r)}
function yDom(id,t,ev){const x=t.toString(),p=S.pg[cur],b=p&&p.b&&p.b.find(z=>z.id===id);if(b)b.x=x;const el=[...dbk.children].find(r=>r.dataset.b===id),e=el&&el.querySelector('.e');if(!e||$('#doc').hidden)return;
 const act=document.activeElement===e;let n=act?getOff(e):0;if(act){let c=0;ev.delta.forEach(o=>{if(o.retain)c+=o.retain;else if(o.insert){if(c<n)n+=o.insert.length}else if(o.delete){if(c<n)n-=Math.min(o.delete,n-c);c+=o.delete}})}
 e.innerText=x;if(act)setOff(e,Math.max(0,Math.min(n,x.length)));persist()}
function beat(){out({k:'cur',id:me.id,n:me.n,c:me.c,p:cur,x:me.x,y:me.y})}
function st(){const n=1+Object.values(users).filter(u=>Date.now()-u.t<9000).length;$('#st').textContent=n+(n>1?' people here':' person here')+(cs?' · '+cs:'')+(RT?' · live':'')}
function drawCur(){const now=Date.now();for(const u of Object.values(users)){let e=curs[u.id];
 if(now-u.t>9000||u.p!==cur||u.x<-9e4){e&&(e.style.display='none');continue}
 if(!e){e=curs[u.id]=document.createElement('div');e.className='cu';e.innerHTML='<svg width="16" height="16" viewBox="0 0 16 16"><path d="M1 1l5.5 14 2-5.5L14 7.5z"/></svg><span></span>';w.appendChild(e)}
 e.style.display='';e.style.setProperty('--c',u.c);e.lastChild.textContent=u.n;e.style.transform=`translate(${u.x}px,${u.y}px) scale(${1/V.z})`}}
function refresh(){bell();usR();const p=S.pg[cur];if(!p||p.del){const f=pages()[0];f?open(f.id):newPage('b');return}
 renderList();if(document.activeElement!==ttl)ttl.value=p.n;
 if(p.t==='b'){sync();const i=S.it[sel];if(sel&&(!i||i.del))pick(null)}else if(p.t==='t'){if(!$('#tbl').contains(document.activeElement))renderTbl()}else patchDoc()}
/* ---------- pages ---------- */
function renderList(){const P=pages(),H=new Set(P.map(p=>p.id)),K=q=>q===''?P.filter(p=>!p.par||!H.has(p.par)):P.filter(p=>p.par===q),
 R=(q,d)=>K(q).map(p=>`<div class="pg${p.id===cur?' on':''}" role="button" tabindex="0" draggable="true" data-id="${esc(p.id)}" style="padding-left:${9+d*14}px"><em>${MosaicIcons.svg(p.t==='b'?(p.k==='f'?'pencil-ruler':p.k==='w'?'pen-line':'layout-grid'):p.t==='t'?'table':'file-text')}</em><span>${esc(p.n)}</span><button type="button" class="px" title="Delete page" aria-label="Delete page ${esc(p.n)}">${MosaicIcons.svg('x')}</button></div>`+R(p.id,d+1)).join('');
 $('#pl').innerHTML=R('',0);const ch=[];let q=S.pg[cur];while(q&&q.par&&S.pg[q.par]&&!S.pg[q.par].del){q=S.pg[q.par];ch.unshift(q)}
 $('#bc').innerHTML=ch.map(p=>`<button data-id="${esc(p.id)}">${esc(p.n)} ›</button>`).join('')}
function open(id){cur=id;const p=S.pg[id],b=p.t==='b';pick(null);els.forEach(e=>e.remove());els.clear();
 cv.hidden=!b;document.body.dataset.k=p.k||'b';cv.style.backgroundColor=p.bg||'';$('#bgc').hidden=!b;$('#bgc').value=p.bg||'#f4f1ec';tools(p.k);$('#usb').hidden=$('#tpb').hidden=!b||p.k==='f';if($('#usb').hidden)$('#us').hidden=true;$('#doc').hidden=b||p.t==='t';$('#tbl').hidden=p.t!=='t';$('#tools').hidden=$('#zoom').hidden=$('#tf').hidden=$('#exb').hidden=!b;
 ttl.value=p.n;renderList();$('#sd').classList.remove('open');
 if(b){V=Vs[id]||(Vs[id]={x:90,y:90,z:1});applyV();sync()}else if(p.t==='t')renderTbl();else{renderDoc();if(!p.b[0].x)foc(0)}insp.hidden=!b;if(b)inspect();usR();tabs();snap()}
function newPage(t){const p={id:uid(),t,n:t==='b'?'Untitled board':t==='t'?'Untitled table':'Untitled doc',o:Math.max(0,...pages().map(q=>q.o))+1};if(t==='d')p.b=[{t:'p',x:''}];if(t==='t'){p.cols=['Name','Status','Notes'];p.r=[['','','']]}put('pg',p);open(p.id);ttl.focus();ttl.select()}
function rmPage(id){const ids=[id],its=[],wk=q=>pages().filter(p=>p.par===q).forEach(p=>{ids.push(p.id);wk(p.id)});wk(id);const par=S.pg[id].par;ids.forEach(x=>del('pg',x));Object.values(S.it).forEach(i=>{if(i.ty==='bdc'&&!i.del&&ids.includes(i.ref)){its.push(i.id);del('it',i.id)}});if(ids.includes(cur)){const f=S.pg[par]&&!S.pg[par].del?S.pg[par]:pages()[0];f?open(f.id):newPage('b')}else{renderList();S.pg[cur].t==='b'&&sync()}
 return()=>{ids.forEach(x=>{const v=S.pg[x];if(v&&v.del){const n={...v};delete n.del;put('pg',n)}});its.forEach(x=>{const v=S.it[x];if(v&&v.del){const n={...v};delete n.del;put('it',n)}});renderList();try{const p=S.pg[cur];p&&p.t==='b'&&sync()}catch(e){}}}
$('#nb').onclick=()=>newPage('b');$('#nd').onclick=()=>newPage('d');$('#mb').onclick=()=>$('#sd').classList.toggle('open');
$('#pl').onclick=e=>{const r=e.target.closest('.pg');if(!r)return;if(e.target.closest('.px')){if(RO)return;const nm=(S.pg[r.dataset.id]||{}).n||'page',undo=rmPage(r.dataset.id);try{Mosaic.toast('Deleted “'+nm+'”. It is in the Trash.',{action:'Undo',run:undo})}catch(x){}}else open(r.dataset.id)};
$('#pl').ondblclick=e=>{if(RO)return;const r=e.target.closest('.pg');if(!r)return;const p=S.pg[r.dataset.id],n=prompt('Rename page',p.n);if(n){p.n=n;put('pg',p);renderList();if(cur===p.id)ttl.value=n}};
ttl.oninput=()=>{const p=S.pg[cur];p.n=ttl.value;put('pg',p);renderList()};
ttl.onkeydown=e=>{if(e.key==='Enter'){ttl.blur();if(S.pg[cur].t==='d')foc(0)}};
/* ---------- board ---------- */
const PH={note:'Write a note…',text:'Type…',frame:'Frame name',rect:'',oval:'',col:'Column name',td:'',swc:'',bdc:''},DEF={note:[200,150,COL[0],''],text:[220,44,'','Text'],rect:[170,110,COL[4],''],oval:[130,130,COL[2],''],frame:[420,300,'','Frame'],img:[260,180,'',''],lk:[250,64,'','']};DEF.dia=[150,150,COL[5],''];DEF.dv=[320,26,'',''];DEF.tc=[300,110,'',''];PH.dv=PH.tc='';DEF.pgn=[150,150,COL[3],''];DEF.star=[150,150,COL[1],''];DEF.fl=[230,64,'',''];PH.pgn=PH.star=PH.fl='';DEF.col=[260,320,COL[4],'Column'];DEF.td=[240,110,'','Task one\nTask two'];DEF.swc=[130,110,'#5b5bf0','#5B5BF0'];DEF.bdc=[210,90,'',''];
const pt=e=>{const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left-V.x)/V.z,y:(e.clientY-r.top-V.y)/V.z}};
function applyV(){w.style.transform=`translate(${V.x}px,${V.y}px) scale(${V.z})`;const g=24*V.z+'px';cv.style.backgroundSize=g+' '+g;cv.style.backgroundPosition=V.x+'px '+V.y+'px';$('#zr').textContent=Math.round(V.z*100)+'%';drawCur()}
function zoom(f,cx,cy){const r=cv.getBoundingClientRect(),x=cx-r.left,y=cy-r.top,z=Math.min(3,Math.max(.15,V.z*f));f=z/V.z;V.x=x-(x-V.x)*f;V.y=y-(y-V.y)*f;V.z=z;applyV()}
const zc=f=>{const r=cv.getBoundingClientRect();zoom(f,r.left+r.width/2,r.top+r.height/2)};
$('#zi').onclick=()=>zc(1.2);$('#zo').onclick=()=>zc(1/1.2);$('#zr').onclick=()=>zc(1/V.z);
function build(i){const e=document.createElement('div');e.className='it '+i.ty;e.dataset.id=i.id;
 e.innerHTML=(i.ty==='img'?'<img alt="" draggable="false">':i.ty==='pen'?'<svg preserveAspectRatio="none" width="100%" height="100%"><path fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>':i.ty==='lk'||i.ty==='bdc'?'<div class="tx"></div><small></small>':`<div class="tx" data-ph="${PH[i.ty]}"></div>`)+'<i class="rz"></i><i class="ch t"></i><i class="ch b"></i><i class="ch l"></i><i class="ch r"></i><div class="tgs"></div>';return e}
function paint(e,i){const s=e.style;s.left=i.x+'px';s.top=i.y+'px';s.width=i.w+'px';s.height=i.h+'px';s.zIndex=i.ty==='frame'||i.ty==='col'?-1:i.z||1;s.setProperty('--c',i.g2?`linear-gradient(135deg,${i.c||'#fff'},${i.g2})`:i.c||'transparent');e.classList.toggle('dk',i.c===COL[7]);
 const tg=i.tg||[];e.querySelector('.tgs').innerHTML=tg.map(n=>`<b style="--c:${tc(n)}">${esc(n)}</b>`).join('');s.opacity=!TF||tg.includes(TF)?(i.o==null?'':i.o):.18;s.borderRadius=i.rd==null?'':Array.isArray(i.rd)?i.rd.map(v=>v+'px').join(' '):i.rd+'px';
 const t=e.querySelector('.tx');
 {const nc=window.openCount?window.openCount(i.id):Object.values(S.cm).filter(c=>c.for===i.id&&!c.del).length;nc?e.dataset.cm=nc:delete e.dataset.cm}s.fontSize=i.fs?i.fs+'px':'';s.transform=(i.r?`rotate(${i.r}deg)`:'')+(i.fx?' scaleX(-1)':'')+(i.fy?' scaleY(-1)':'');s.mixBlendMode=i.bm||'';s.filter=i.bu?`blur(${i.bu}px)`:'';s.boxShadow=i.sh?'0 10px 28px #0005':'';if(i.ty==='pgn'||i.ty==='star')s.clipPath='polygon('+PT(i.ty,0,0,100,100).split(' ').map(p=>p.split(',').map(v=>v+'%').join(' ')).join(',')+')';if(document.body.dataset.k==='w'&&['rect','oval','dia'].includes(i.ty))rough(e,i);if(i.ty==='bool')boolSvg(e,i);e.classList.toggle('cpm',!!i.cp);e.classList.toggle('cpi',!!i.inst);e.classList.toggle('lkd',!!i.lock);if(i.ty==='tc')tcPaint(e,i);if(i.ty==='pen'){const v=e.firstChild;v.setAttribute('viewBox','0 0 '+i.vw+' '+i.vh);const q=v.firstChild;q.setAttribute('d',i.t);q.setAttribute('stroke',i.c);return}if(i.ty==='bdc'){const p=S.pg[i.ref],n=Object.values(S.it).filter(j=>j.p===i.ref&&!j.del&&j.ty!=='cn').length;t.textContent=(p&&p.t==='d'?'☰ ':'▦ ')+(p&&!p.del?p.n:'(deleted)');e.querySelector('small').textContent=n+(n===1?' item':' items')+' · double-click to open';return}
 if(i.ty==='tc')return;
 if(i.ty==='fl'){t.textContent='📎 '+(i.nm||'file')+(i.sz?' · '+fmtSz(i.sz):'')+' · double-click to save';return}
 if(e._t===i.t)return;
 if(i.ty==='img')e.firstChild.src=i.t;
 else if(i.ty==='lk'){let h=i.t;try{h=new URL(i.t).hostname}catch(x){}t.textContent=h;e.querySelector('small').textContent=i.t}
 else if(i.ty==='td'){if(t===document.activeElement)return;t.innerHTML=(i.t||'').split('\n').map((l,n)=>`<div class="ck${/^✓ /.test(l)?' d':''}" data-n="${n}"><i>${/^✓ /.test(l)?'✓':''}</i><span>${esc(l.replace(/^✓ /,''))}</span></div>`).join('')}
 else if(t===document.activeElement)return;else t.innerText=i.t||'';
 e._t=i.t}
function sync(){const L=Object.values(S.it).filter(i=>i.p===cur&&!i.del&&i.ty!=='cn'),ids=new Set(L.map(i=>i.id));
 els.forEach((e,id)=>{if(!ids.has(id)){e.remove();els.delete(id)}});
 L.forEach(i=>{let e=els.get(i.id);if(!e){e=build(i);els.set(i.id,e);w.appendChild(e);if(SL.has(i.id))e.classList.add('sel')}paint(e,i)});drawCn();tagSel();cmts()}
function add(ty,o){if(RO)return;const[W,H,c,t]=DEF[ty],r=cv.getBoundingClientRect(),j=Math.random()*40-20,i={id:uid(),p:cur,ty,w:W,h:H,c,t,z:ty==='frame'?0:zmax()+1,x:(r.width/2-V.x)/V.z-W/2+j,y:(r.height/2-V.y)/V.z-H/2+j,...o};
 put('it',i);sync();pick(i.id);if(ty!=='img'&&ty!=='lk'&&ty!=='bdc')edit(els.get(i.id))}
function img(f,at){const R=new FileReader;R.onload=()=>{const m=new Image;m.onload=()=>{const k=Math.min(1,MP.opt('imgMax',900)/Math.max(m.width,m.height)),c=document.createElement('canvas');c.width=m.width*k;c.height=m.height*k;c.getContext('2d').drawImage(m,0,0,c.width,c.height);
 const W=260,H=W*c.height/c.width;add('img',{t:c.toDataURL('image/jpeg',MP.opt('imgQuality',.82)),w:W,h:H,...(at&&{x:at.x-W/2,y:at.y-H/2})})};m.src=R.result};R.readAsDataURL(f)}
$('#tools').innerHTML=[['note','▤ Note'],['text','T Text'],['rect','▢ Rect'],['oval','◯ Oval'],['dia','◇ Diamond'],['pgn','⬡ Polygon'],['star','★ Star'],['frame','▭ Frame'],['img','▣ Image'],['lk','↗ Link'],['col','▥ Column'],['td','☑ To-do'],['swc','◧ Swatch'],['bdc','▦ Sub-board'],['cm','⤳ Arrow'],['pen','✎ Pen'],['dv','― Divider'],['tc','▦ Table'],['dc','☰ Doc'],['fl','📎 File'],['sk','✏ Sketch'],['er','⌫ Erase'],['undo','↶'],['redo','↷']].map(([k,l])=>`<button data-a="${k}" title="${[...l].slice(2).join('')||k}" aria-label="${[...l].slice(2).join('')||k}"><i>${MosaicIcons.tool(k)}</i><span class="tl">${[...l].slice(2).join('')}</span></button>`).join('');
$('#tools').onclick=e=>{const a=e.target.dataset.a;if(!a)return;
 if(a==='lk'){const u=prompt('Paste a link');if(u)add('lk',{t:/^https?:/i.test(u)?u:'https://'+u})}
 else if(a==='img'){const u=prompt('Image address (leave empty to upload a file)');if(u)add('img',{t:u});else if(u==='')$('#fi').click()}
 else if(a==='fl')pkF('*/*',f=>sendFile(f));else if(a==='sk')sketch();else if(a==='dc')subDoc();else if(a==='er'){ER=!ER;e.target.classList.toggle('on-btn',ER)}else if(a==='bdc')subBoard();else if(a==='pen'){PM=!PM;document.body.classList.toggle('pm',PM);e.target.classList.toggle('on-btn',PM)}else if(a==='undo')undo(1);else if(a==='redo')undo(-1);else if(a==='cm'){CM=!CM;document.body.classList.toggle('cm',CM);e.target.classList.toggle('on-btn',CM)}else add(a)};
$('#fi').onchange=e=>{[...e.target.files].forEach(f=>img(f));e.target.value=''};
cv.ondragover=e=>e.preventDefault();
cv.ondrop=e=>{e.preventDefault();if(RO)return;{const u=e.dataTransfer.getData('text/mosaic-us'),i=S.it[u];if(u){if(i&&!i.del){const p=pt(e);i.p=cur;i.x=p.x-i.w/2;i.y=p.y-i.h/2;i.z=zmax()+1;put('it',i);sync();pick(i.id);usR()}return}}const p=pt(e),dt=e.dataTransfer,tl=dt.getData('text/mosaic-tool'),pg=dt.getData('text/mosaic-page'),at=(W,H)=>({x:p.x-W/2,y:p.y-H/2});
 if(pg)return dropPage(pg,p);
 if(tl){if(tl==='bdc')subBoard(p);else if(DEF[tl])add(tl,at(DEF[tl][0],DEF[tl][1]));return}
 const fs=[...dt.files].filter(f=>/^image/.test(f.type));if(fs.length)return fs.forEach(f=>img(f,p));
 const u=(dt.getData('text/uri-list')||dt.getData('text/plain')).trim();if(u)/^https?:\/\/\S+$/.test(u)?add('lk',{t:u,...at(250,64)}):add('note',{t:u.slice(0,2000),...at(200,150)})};
addEventListener('paste',e=>{if(e.target.isContentEditable||cv.hidden||!e.clipboardData)return;[...e.clipboardData.files].filter(f=>/^image/.test(f.type)).forEach(f=>img(f))});
function edit(e){const t=e&&e.querySelector('.tx');if(!t||e.classList.contains('tc'))return;const q=S.it[e.dataset.id];if(q&&q.ty==='td')t.innerText=q.t;t.contentEditable='true';t.focus();const r=document.createRange();r.selectNodeContents(t);const s=getSelection();s.removeAllRanges();s.addRange(r)}
w.addEventListener('input',e=>{const el=e.target.closest('.it'),i=el&&S.it[el.dataset.id];if(!i)return;i.t=el._t=e.target.innerText;put('it',i);if(i.ty==='swc'&&/^#[0-9a-f]{6}$/i.test(i.t.trim())){i.c=i.t.trim();put('it',i);paint(el,i)}});
w.addEventListener('focusout',e=>{if(e.target.contentEditable==='true'){e.target.contentEditable='false';const el=e.target.closest('.it'),i=el&&S.it[el.dataset.id];i&&setTimeout(()=>{el._t=null;paint(el,i)},0)}});
const tc=n=>`hsl(${Math.abs([...n].reduce((a,c)=>(a*31+c.charCodeAt(0))|0,7))%360},60%,45%)`;
function pick(id,add){if(Array.isArray(id)){SL=new Set(id);id=id[0]}else if(!add||!id)SL=new Set(id?[id]:[]);else SL.has(id)?SL.delete(id):SL.add(id);
 [...SL].forEach(k=>{const g=S.it[k]&&S.it[k].g;g&&Object.values(S.it).forEach(j=>j.g===g&&!j.del&&j.p===cur&&SL.add(j.id))});
 sel=SL.has(id)?id:[...SL][0]||null;els.forEach((e,k)=>e.classList.toggle('sel',SL.has(k)));drawCn();inspect()}
function inspect(){cmts();const i=sel&&S.it[sel];if(!i||i.del){insp.hidden=!isF();insp.innerHTML=isF()?LAY():'';return}insp.hidden=false;const gp=[...SL].some(k=>S.it[k]&&S.it[k].g),hx=/^#[0-9a-f]{6}$/i.test(i.c||'')?i.c:'#ffd966';
 insp.innerHTML=i.ty==='cn'?`<button data-x="ah" title="Arrow heads">${['—','→','↔'][i.ah==null?1:i.ah]}</button><button data-x="ds" title="Dashed">┅</button><button data-x="eb" title="Elbow arrow">⌐</button><input type="color" data-k="1" value="${hx}" title="Line colour"><button data-x="r" title="Delete">🗑</button>`
 :DET(i)+(['note','rect','oval','dia','col'].includes(i.ty)?COL.map(c=>`<button class="sw" data-c="${c}" style="background:${c}" aria-label="Color"></button>`).join(''):'')+(['note','rect','oval','dia','col','swc','pen'].includes(i.ty)?`<input type="color" data-k="1" value="${hx}" title="Custom colour">`:'')
 +(['note','text','rect','oval','dia','col','frame'].includes(i.ty)?'<button data-x="fs" data-d="-2" title="Smaller text">A−</button><button data-x="fs" data-d="2" title="Larger text">A+</button>':'')+(SL.size>1?[['l','⇤','Align left'],['c','⇹','Align centre'],['r','⇥','Align right'],['t','⤒','Align top'],['m','⇳','Align middle'],['b','⊥','Align bottom'],['v','⇣','Stack vertically (auto layout)'],['h','⇢','Stack horizontally']].map(([a,g,t])=>`<button data-x="al" data-a="${a}" title="${t}">${g}</button>`).join(''):'')+ROT(i)+AL(i)+STY(i)+'<button data-x="cm" title="Comments">💬</button><button data-x="tg" title="Add / remove tag">#</button>'+(SL.size>1||gp?`<button data-x="g">${gp?'⊟ Ungroup':'⊞ Group'}</button>`:'')+(i.ty==='bdc'?'<button data-x="un" title="Move this board out of the current board">⤴ Move out</button>':'')+'<button data-x="d" title="Duplicate (Ctrl+D)">⧉</button><button data-x="f" title="Bring to front">⬆</button><button data-x="ex" title="Export selection">⤓</button><button data-x="r" title="Delete">🗑</button>'+(isF()?LAY():'')}
function rm(){[...SL].forEach(id=>{if(S.it[id]&&S.it[id].lock)return;const e=els.get(id);e&&e.remove();els.delete(id);del('it',id);Object.values(S.it).forEach(c=>c.ty==='cn'&&!c.del&&(c.a===id||c.b===id)&&del('it',c.id))});pick(null)}
function dup(){const m={},gm={},N=[];[...SL].forEach(id=>{const i=S.it[id];if(!i||i.ty==='cn')return;const n={...i,id:uid(),x:i.x+24,y:i.y+24,z:zmax()+1};if(i.tg)n.tg=[...i.tg];if(i.g)n.g=gm[i.g]||(gm[i.g]=uid());m[id]=n.id;put('it',n);N.push(n.id)});
 Object.values(S.it).forEach(c=>c.ty==='cn'&&!c.del&&m[c.a]&&m[c.b]&&put('it',{...c,id:uid(),a:m[c.a],b:m[c.b]}));sync();SL=new Set(N);sel=N[0]||null;els.forEach((e,k)=>e.classList.toggle('sel',SL.has(k)));drawCn();inspect()}
function grp(){const ids=[...SL].filter(k=>S.it[k]&&S.it[k].ty!=='cn'),un=ids.some(k=>S.it[k].g),g=uid();if(!un&&ids.length<2)return;ids.forEach(k=>{const j=S.it[k];un?delete j.g:j.g=g;put('it',j)});pick(un?ids[0]:sel)}
function ask(l,cb){const a=$('#ask'),n=a.querySelector('input');a.hidden=false;a.firstChild.textContent=l;n.value='';n.focus();n.onkeydown=e=>{if(e.key==='Enter'){a.hidden=true;n.value.trim()&&cb(n.value.trim())}else if(e.key==='Escape')a.hidden=true}}
insp.onclick=e=>{if(e.target.dataset.ly){pick(e.target.dataset.ly);return}const i=S.it[sel],b=e.target,x=b.dataset.x,ap=f=>SL.forEach(k=>{const j=S.it[k];if(j&&j.ty!=='cn'){f(j);put('it',j);els.get(k)&&paint(els.get(k),j)}});if(!i)return;
 if(b.dataset.c)ap(j=>j.c=b.dataset.c);
 else if(x==='un'){const q=S.pg[i.ref],c=S.pg[cur];if(q&&c){c.par?q.par=c.par:delete q.par;put('pg',q);rm();renderList()}}else if(x==='d')dup();else if(x==='f')ap(j=>j.z=zmax()+1);else if(x==='r')rm();else if(x==='g')grp();
 else if(x==='tg')ask('Tag name (type an existing tag to remove it)',n=>{ap(j=>{const t=j.tg||[];j.tg=t.includes(n)?t.filter(y=>y!==n):[...t,n]});tagSel()});
 else if(x==='ex'){$('#ex').classList.add('on');$('#exs').value='s'}
 else if(x==='cm'){CP=CP===sel?null:sel;cmts();CP&&$('#cmp input').focus()}else if(x==='us'){[...SL].forEach(id=>{const j=S.it[id];if(j&&j.ty!=='cn'){j.p='~'+cur;put('it',j);Object.values(S.it).forEach(c=>c.ty==='cn'&&!c.del&&(c.a===id||c.b===id)&&del('it',c.id))}});pick(null);sync();$('#us').hidden=false;usR()}else if(x==='ic'){i.rd=Array.isArray(i.rd)?(i.rd[0]||0):Array(4).fill(i.rd||0);put('it',i);paint(els.get(i.id),i);inspect()}else if(x==='lc'){[...SL].forEach(id=>{const j=S.it[id];if(j&&j.ty!=='cn'){j.lock=!j.lock;put('it',j);const e=els.get(id);e&&paint(e,j)}});inspect()}else if(x==='tr'||x==='tcc'){x==='tr'?i.g.push(Array(i.g[0].length).fill('')):i.g.forEach(r=>r.push(''));put('it',i);const e=els.get(i.id);e.querySelector('.tx').blur();tcPaint(e,i)}else if(x==='pz'){[i.w,i.h]=b.dataset.v.split(',').map(Number);put('it',i);paint(els.get(i.id),i);drawCn();inspect()}else if(x==='fl2'){const q=b.dataset.v;i[q]=!i[q];put('it',i);paint(els.get(i.id),i)}else if(x==='bo')boolean(b.dataset.a);else if(x==='cp'){i.cp=!i.cp;put('it',i);paint(els.get(i.id),i);inspect()}else if(x==='in'){const n={...i,id:uid(),x:i.x+i.w+30,cp:0,inst:i.id,z:zmax()+1};put('it',n);sync();pick(n.id)}else if(x==='dt'){delete i.inst;put('it',i);paint(els.get(i.id),i);inspect()}else if(x==='g0'){delete i.g2;put('it',i);paint(els.get(i.id),i);inspect()}else if(x==='eb'){i.el=!i.el;put('it',i);drawCn();inspect()}else if(x==='fit')fit(i);else if(x==='al')align(b.dataset.a);else if(x==='fs')ap(j=>j.fs=Math.max(8,(j.fs||(j.ty==='text'?22:14))+ +b.dataset.d));else if(x==='ah'){i.ah=((i.ah==null?1:i.ah)+1)%3;put('it',i);drawCn();inspect()}
 else if(x==='ds'){i.dsh=!i.dsh;put('it',i);drawCn()}};
insp.oninput=e=>{const q=e.target.dataset.k;if(!q)return;const v=e.target.value,i=S.it[sel];if(q==='gap'){AG=Math.max(0,+v||0);return}if(q==='rot'){SL.forEach(id=>{const j=S.it[id];if(j&&j.ty!=='cn'){j.r=+v||0;put('it',j);const t=els.get(id);t&&paint(t,j)}});return}if(['x','y','w','h','op','rad','rc0','rc1','rc2','rc3'].includes(q)){if(i&&i.ty!=='cn'){if(q==='op')i.o=Math.min(1,Math.max(0,v/100));else if(q==='rad')i.rd=Math.max(0,+v||0);else if(q[0]==='r'&&q[1]==='c'){const a=Array.isArray(i.rd)?i.rd.slice():Array(4).fill(i.rd||0);a[+q[2]]=Math.max(0,+v||0);i.rd=a}else i[q]=q==='w'||q==='h'?Math.max(10,+v||10):+v||0;put('it',i);paint(els.get(i.id),i);drawCn()}return}if(['ro','fz','g2','bm','bu','sh'].includes(q)){SL.forEach(id=>{const j=S.it[id];if(j&&j.ty!=='cn'){j[q]=q==='sh'?e.target.checked:q==='ro'||q==='bu'?+v:v;put('it',j);paint(els.get(id),j)}});return}if(q!=='1')return;if(i&&i.ty==='cn'){i.c=v;put('it',i);drawCn();return}
 SL.forEach(k=>{const j=S.it[k];if(j&&['note','rect','oval','dia','col','swc','pen'].includes(j.ty)){j.c=v;if(j.ty==='swc')j.t=v.toUpperCase();put('it',j);els.get(k)&&paint(els.get(k),j)}})};
/* connectors */
var SV=document.createElementNS('http://www.w3.org/2000/svg','svg');SV.id='cn';w.insertBefore(SV,w.firstChild);
function ep(a,b){const cx=a.x+a.w/2,cy=a.y+a.h/2,tx=b.x+b.w/2-cx,ty=b.y+b.h/2-cy;if(!tx&&!ty)return[cx,cy];const k=a.ty==='oval'?1/Math.hypot(tx/(a.w/2),ty/(a.h/2)):Math.min(a.w/2/(Math.abs(tx)||1e-9),a.h/2/(Math.abs(ty)||1e-9));return[cx+tx*k,cy+ty*k]}
function head(p,q,c){const a=Math.atan2(p[1]-q[1],p[0]-q[0]),L=13,f=d=>`${p[0]-L*Math.cos(a+d)} ${p[1]-L*Math.sin(a+d)}`;return`<path d="M${p[0]} ${p[1]}L${f(-.42)}L${f(.42)}z" fill="${c}"/>`}
function cnSvg(c,ex){const a=S.it[c.a],b=S.it[c.b],p=ep(a,b),q=ep(b,a),on=!ex&&SL.has(c.id),col=on?'#5b5bf0':c.c||'#8a8ea0',ah=c.ah==null?1:c.ah;
 return`<path d="${EL(c,p,q)}" stroke="${col}" stroke-width="${on?3:2}" fill="none"${c.dsh?' stroke-dasharray="7 5"':''}/>`+(ah?head(q,c.el?[q[0]-(q[0]>p[0]?9:-9),q[1]]:p,col):'')+(ah==2?head(p,c.el?[p[0]+(q[0]>p[0]?9:-9),p[1]]:q,col):'')}
function drawCn(){if(!SV)return;let h='';Object.values(S.it).forEach(c=>{if(c.ty!=='cn'||c.del||c.p!==cur)return;const a=S.it[c.a],b=S.it[c.b];if(!a||!b||a.del||b.del)return;const p=ep(a,b),q=ep(b,a);h+=`<path class="h" data-cn="${c.id}" d="${EL(c,p,q)}"/>`+cnSvg(c)});
 if(TL)h+=`<path d="M${TL[0]} ${TL[1]}L${TL[2]} ${TL[3]}" stroke="#5b5bf0" stroke-width="2" stroke-dasharray="5 4" fill="none"/>`;if(MQ)h+=`<rect x="${Math.min(MQ[0],MQ[2])}" y="${Math.min(MQ[1],MQ[3])}" width="${Math.abs(MQ[2]-MQ[0])}" height="${Math.abs(MQ[3]-MQ[1])}" fill="#5b5bf01f" stroke="#5b5bf0"/>`;if(PD)h+=`<path d="${pth(PD)}" stroke="${PC}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;SV.innerHTML=h+(self.GD||[]).map(g=>`<path d="${g[0]==='v'?`M${g[1]} -99999V99999`:`M-99999 ${g[1]}H99999`}" stroke="#f24e8b" stroke-width="1" vector-effect="non-scaling-stroke"/>`).join('')}
function subBoard(at){const p={id:uid(),t:'b',n:'Sub-board',o:Math.max(0,...pages().map(q=>q.o))+1,par:cur};put('pg',p);add('bdc',{ref:p.id,t:'',...(at&&{x:at.x-105,y:at.y-45})});renderList()}
/* tags */
function tagSel(){const s=$('#tf'),T=[...new Set(Object.values(S.it).filter(i=>i.p===cur&&!i.del&&i.tg).flatMap(i=>i.tg))].sort();if(TF&&!T.includes(TF)){TF='';els.forEach((e,k)=>S.it[k]&&paint(e,S.it[k]))}
 s.innerHTML='<option value="">All tags</option>'+T.map(n=>`<option${n===TF?' selected':''}>${esc(n)}</option>`).join('');s.style.display=T.length?'':'none'}
$('#tf').onchange=e=>{TF=e.target.value;els.forEach((el,k)=>S.it[k]&&paint(el,S.it[k]))};
$('#bc').onclick=e=>{const b=e.target.closest('button');b&&open(b.dataset.id)};
w.addEventListener('click',e=>{const k=e.target.closest('.ck');if(!k||mvd)return;const el=k.closest('.it'),i=S.it[el.dataset.id],L=i.t.split('\n'),n=+k.dataset.n;L[n]=/^✓ /.test(L[n])?L[n].slice(2):'✓ '+L[n];i.t=L.join('\n');put('it',i);paint(el,i)});
var PM=0,HM=0,PD=null,MQ=null,PC='#5b5bf0',hist=[],hi=-1,ing=0;
const pth=P=>'M'+P.map(q=>q.join(' ')).join('L'),strip=j=>j.replace(/,"u":\d+/g,'');
function penAdd(P){const X=P.map(q=>q[0]),Y=P.map(q=>q[1]),x=Math.min(...X)-4,y=Math.min(...Y)-4,W=Math.max(...X)-x+4,H=Math.max(...Y)-y+4;put('it',{id:uid(),p:cur,ty:'pen',x,y,w:W,h:H,vw:W,vh:H,c:PC,z:zmax()+1,t:pth(P.map(q=>[Math.round(q[0]-x),Math.round(q[1]-y)]))});sync()}
var HS={};
function jsn(){const p=S.pg[cur];if(!p)return'';const it={};Object.values(S.it).forEach(i=>{if(i.p===cur&&!i.del)it[i.id]=i});const cm={};Object.values(S.cm).forEach(c=>{const o=S.it[c.for];if(!c.del&&o&&o.p===cur)cm[c.id]=c});return strip(JSON.stringify({it,g:p,cm}))}
function snap(){if(ing||!cur)return;const h=HS[cur]||(HS[cur]={a:[],i:-1}),j=jsn();if(h.a[h.i]!==j){h.a.splice(h.i+1);h.a.push(j);h.a.length>60&&h.a.shift();h.i=h.a.length-1}}
function undo(d){const h=HS[cur];if(!h)return;const n=h.i-d;if(n<0||n>=h.a.length)return;ing=1;h.i=n;const T=JSON.parse(h.a[n]),same=(a,b)=>strip(JSON.stringify(a))===strip(JSON.stringify(b));
 Object.values(S.it).forEach(i=>{if(i.p===cur&&!i.del&&!T.it[i.id])del('it',i.id)});Object.values(T.it).forEach(v=>{const o=S.it[v.id];if(!o||o.del||!same(o,v))put('it',v)});if(!same(S.pg[cur],T.g)){put('pg',T.g);if(T.g.t==='d')(T.g.b||[]).forEach(k=>ySet(k,k.x||''))}const C=T.cm||{};Object.values(S.cm).forEach(c=>{const o=S.it[c.for];!c.del&&o&&o.p===cur&&!C[c.id]&&del('cm',c.id)});Object.values(C).forEach(c=>{const o=S.cm[c.id];(!o||o.del)&&put('cm',{...c})});ing=0;pick(null);
 const p=S.pg[cur];ttl.value=p.n;renderList();if(p.t==='b')sync();else if(p.t==='t')renderTbl();else{renderDoc();foc(Math.min(fi,p.b.length-1))}}
var AG=16;
const ROT=i=>`<span class="rt" title="Rotation">⟳<input type="number" data-k="rot" value="${i.r||0}" step="5" aria-label="Rotation in degrees" style="width:58px"></span>`,
AL=i=>(SL.size>1?`<span class="rt">gap<input type="number" data-k="gap" value="${AG}" min="0" aria-label="Layout gap" style="width:50px"></span><button data-x="al" data-a="g" title="Grid layout">▦</button>`:'')+(i.ty==='frame'||i.ty==='col'?'<button data-x="fit" title="Auto layout: stack everything inside">⇣ Auto layout</button>':'')+(isF()?'':'<button data-x="us" title="Send to Unsorted">⇥ Unsorted</button>')+LK(i);
function fit(f){const K=Object.values(S.it).filter(j=>j.p===cur&&!j.del&&j.ty!=='cn'&&j!==f&&j.x+j.w/2>f.x&&j.x+j.w/2<f.x+f.w&&j.y+j.h/2>f.y&&j.y+j.h/2<f.y+f.h).sort((a,b)=>a.y-b.y);if(!K.length)return;let y=f.y+46;
 K.forEach(j=>{j.x=f.x+16;j.w=Math.max(60,f.w-32);j.y=y;y+=j.h+AG;put('it',j);const e=els.get(j.id);e&&paint(e,j)});f.h=y-AG+16-f.y;put('it',f);paint(els.get(f.id),f);drawCn()}
function align(a){const L=[...SL].map(k=>S.it[k]).filter(j=>j&&j.ty!=='cn');if(L.length<2)return;const mn=f=>Math.min(...L.map(f)),mx=f=>Math.max(...L.map(f)),x1=mn(j=>j.x),x2=mx(j=>j.x+j.w),y1=mn(j=>j.y),y2=mx(j=>j.y+j.h);
 if(a==='g'){L.sort((p,q)=>p.y-q.y||p.x-q.x);const n=Math.ceil(Math.sqrt(L.length));let cx=x1,cy=y1,rh=0;L.forEach((j,k)=>{if(k&&k%n===0){cx=x1;cy+=rh+AG;rh=0}j.x=cx;j.y=cy;cx+=j.w+AG;rh=Math.max(rh,j.h)})}else if(a==='v'||a==='h'){const H=a==='h';L.sort((p,q)=>H?p.x-q.x:p.y-q.y);let c=H?x1:y1;L.forEach(j=>{if(H){j.x=c;j.y=y1;c+=j.w+AG}else{j.y=c;j.x=x1;c+=j.h+AG}})}
 else L.forEach(j=>{if(a==='l')j.x=x1;if(a==='r')j.x=x2-j.w;if(a==='c')j.x=(x1+x2-j.w)/2;if(a==='t')j.y=y1;if(a==='b')j.y=y2-j.h;if(a==='m')j.y=(y1+y2-j.h)/2});
 L.forEach(j=>{put('it',j);const e=els.get(j.id);e&&paint(e,j)});drawCn()}
function slash(r){const m=$('#sl'),b=r.getBoundingClientRect(),g=$('#stage').getBoundingClientRect();m.hidden=false;m.style.left=Math.max(8,Math.min(b.left-g.left+30,g.width-190))+'px';m.style.top=Math.min(b.bottom-g.top+4,g.height-330)+'px';m._i=+r.dataset.i}
$('#sl').onmousedown=e=>e.preventDefault();$('#sl').onclick=e=>{const t=e.target.dataset.t,m=$('#sl');if(!t)return;m.hidden=true;B()[m._i].x='';sv();blk(m._i,t)};

function dropPage(id,p){const pg=S.pg[id];if(!pg||pg.del||id===cur)return;let q=S.pg[cur];while(q&&q.id!==id)q=S.pg[q.par];if(q)return;pg.par=cur;put('pg',pg);add('bdc',{ref:id,t:'',x:p.x-105,y:p.y-45});renderList()}
$('#tools').querySelectorAll('button').forEach(b=>{b.draggable=!['hand','undo','redo','cm','pen','img','lk'].includes(b.dataset.a);b.ondragstart=e=>e.dataTransfer.setData('text/mosaic-tool',b.dataset.a)});
$('#pl').ondragstart=e=>{const r=e.target.closest('.pg');r&&e.dataTransfer.setData('text/mosaic-page',r.dataset.id)};$('#pl').ondragover=e=>e.preventDefault();
$('#pl').ondrop=e=>{if(RO)return;const r=e.target.closest('.pg'),id=e.dataTransfer.getData('text/mosaic-page');if(id&&!r){const pg=S.pg[id];if(pg&&pg.par){delete pg.par;put('pg',pg);renderList()}return}if(!r||!id||id===r.dataset.id)return;let q=S.pg[r.dataset.id];while(q&&q.id!==id)q=S.pg[q.par];if(q)return;const pg=S.pg[id];pg.par=r.dataset.id;put('pg',pg);renderList()};
$('#pl').onkeydown=e=>{if((e.key==='Enter'||e.key===' ')&&e.target.classList.contains('pg')){e.preventDefault();open(e.target.dataset.id)}};
$('#stage').addEventListener('pointerdown',()=>$('#sd').classList.remove('open'),true);
new MutationObserver(()=>insp.querySelectorAll('button[title]:not([aria-label])').forEach(b=>b.setAttribute('aria-label',b.title))).observe(insp,{childList:true});
/* comments (own records, so simultaneous comments never overwrite each other) */
var CP=null;
function cmts(){const p=$('#cmp');p.hidden=!(CP&&CP===sel);if(p.hidden)return;const L=Object.values(S.cm).filter(c=>c.for===CP&&!c.del).sort((a,b)=>a.ts-b.ts);
 p.innerHTML='<b>Comments</b>'+(L.map(c=>`<div><small>${esc(c.a)} · ${new Date(c.ts).toLocaleString()}</small><div>${esc(c.t)}</div>${c.a===me.n?`<button data-d="${esc(c.id)}" aria-label="Delete comment">Delete</button>`:''}</div>`).join('')||'<small>No comments yet</small>')+'<input placeholder="Write a comment, press Enter" aria-label="New comment"><button data-x="close">Close</button>'}
const rb=()=>{const e=els.get(CP);e&&S.it[CP]&&paint(e,S.it[CP])};
$('#cmp').onkeydown=e=>{if(e.key==='Enter'&&e.target.tagName==='INPUT'&&e.target.value.trim()){put('cm',{id:uid(),for:CP,a:me.n,t:e.target.value.trim(),ts:Date.now()});cmts();rb();$('#cmp input').focus()}};
$('#cmp').onclick=e=>{const d=e.target.dataset;if(d.d)del('cm',d.d);else if(d.x==='close')CP=null;else return;cmts();rb()};
/* database views */
var TQ='';
function renderTbl(){const p=S.pg[cur],v=p.v||'t',g=Math.min(p.gc==null?1:p.gc,p.cols.length-1),R=p.r.map((r,i)=>({r,i})).filter(o=>!TQ||o.r.join(' ').toLowerCase().includes(TQ.toLowerCase()));
 const bar=`<div class="tb">${[['t','▤ Table'],['k','▥ Board'],['g','▦ Gallery']].map(([k,l])=>`<button data-t="v" data-v="${k}"${v===k?' class="on-btn"':''}>${l}</button>`).join('')}${v==='k'?`<label>Group by <select data-t="gc">${p.cols.map((c,j)=>`<option value="${j}"${j===g?' selected':''}>${esc(c)}</option>`).join('')}</select></label>`:''}<input id="tq" placeholder="Filter…" aria-label="Filter rows" value="${esc(TQ)}"><button data-t="csv">⤓ CSV</button></div>`,
 card=o=>`<div class="kc" draggable="true" data-i="${o.i}"><b>${esc(o.r[0]||'Untitled')}</b>${p.cols.map((c,j)=>j&&j!==g&&o.r[j]?`<div><small>${esc(c)}</small> ${esc(o.r[j])}</div>`:'').join('')}<button data-t="dr" data-i="${o.i}" aria-label="Delete row">×</button></div>`;let b;
 if(v==='t')b=`<table id="tt"><thead><tr>${p.cols.map((c,j)=>`<th><div style="display:flex"><input data-j="${j}" aria-label="Column name" value="${esc(c)}"><button data-t="dc" data-j="${j}" aria-label="Delete column">×</button></div></th>`).join('')}<th><button data-t="ac" aria-label="Add column">＋</button></th></tr></thead><tbody>${R.map(o=>`<tr>${p.cols.map((c,j)=>`<td><input data-i="${o.i}" data-j="${j}" aria-label="${esc(c)}" value="${esc(o.r[j]||'')}"></td>`).join('')}<td><button data-t="dr" data-i="${o.i}" aria-label="Delete row">×</button></td></tr>`).join('')}</tbody></table><button data-t="ar">＋ New row</button>`;
 else if(v==='g')b=`<div class="gal">${R.map(card).join('')}</div><button data-t="ar">＋ New row</button>`;
 else{const V=[...new Set(R.map(o=>o.r[g]||''))];if(!V.includes(''))V.unshift('');b=`<div class="kb">${V.map(x=>`<div class="kcol" data-val="${esc(x)}"><h4>${esc(x||'No '+p.cols[g])}</h4>${R.filter(o=>(o.r[g]||'')===x).map(card).join('')}<button data-t="ar" data-val="${esc(x)}">＋ New</button></div>`).join('')}<button data-t="ag">＋ Group</button></div>`}
 $('#tbl').innerHTML=bar+b}
$('#tbl').oninput=e=>{const t=e.target.dataset,p=S.pg[cur];if(e.target.id==='tq'){TQ=e.target.value;renderTbl();const q=$('#tq');q.focus();q.setSelectionRange(TQ.length,TQ.length);return}if(t.j==null)return;if(t.i!=null)p.r[+t.i][+t.j]=e.target.value;else p.cols[+t.j]=e.target.value;put('pg',p)};
$('#tbl').onchange=e=>{if(e.target.dataset.t==='gc'){const p=S.pg[cur];p.gc=+e.target.value;put('pg',p);renderTbl()}};
$('#tbl').onclick=e=>{const d=e.target.dataset,t=d.t,p=S.pg[cur],g=p.gc==null?1:p.gc;if(!t)return;
 if(t==='ar'){const r=p.cols.map(()=>'');if(d.val!=null)r[g]=d.val;p.r.push(r)}
 else if(t==='ac'){p.cols.push('Column');p.r.forEach(r=>r.push(''))}
 else if(t==='dc'){if(p.cols.length>1){p.cols.splice(+d.j,1);p.r.forEach(r=>r.splice(+d.j,1))}}
 else if(t==='dr')p.r.splice(+d.i,1);else if(t==='v')p.v=d.v;
 else if(t==='ag')return ask('New group name',n=>{const r=p.cols.map(()=>'');r[g]=n;p.r.push(r);put('pg',p);renderTbl()});
 else if(t==='csv')return save((p.n||'table')+'.csv',new Blob([[p.cols,...p.r].map(r=>r.map(c=>'"'+String(c||'').replace(/"/g,'""')+'"').join(',')).join('\n')],{type:'text/csv'}));else return;put('pg',p);renderTbl()};
$('#tbl').ondragstart=e=>{const c=e.target.closest('.kc');c&&e.dataTransfer.setData('text/mosaic-row',c.dataset.i)};$('#tbl').ondragover=e=>{if(e.target.closest('.kcol'))e.preventDefault()};
$('#tbl').ondrop=e=>{const k=e.target.closest('.kcol'),i=e.dataTransfer.getData('text/mosaic-row'),p=S.pg[cur];if(!k||i==='')return;p.r[+i][p.gc==null?1:p.gc]=k.dataset.val;put('pg',p);renderTbl()};
$('#imb').onclick=()=>$('#imf').click();
function okBackup(x){const R=/^[\w-]{1,40}$/,o=v=>v&&typeof v==='object';return o(x)&&o(x.pg)&&o(x.it)&&['pg','it','cm'].every(k=>Object.entries(x[k]||{}).every(([id,v])=>R.test(id)&&o(v)&&v.id===id&&typeof v.u==='number'))
 &&Object.values(x.pg).every(p=>p.del||(['b','d','t'].includes(p.t)&&typeof p.n==='string'&&(p.t==='b'||(p.t==='t'?Array.isArray(p.cols)&&Array.isArray(p.r):Array.isArray(p.b)))))
 &&Object.values(x.it).every(i=>i.del||(typeof i.ty==='string'&&(i.ty==='cn'||['x','y','w','h'].every(f=>Number.isFinite(i[f])))))}
function replaceAll(x){['pg','it','cm'].forEach(k=>{Object.values(S[k]).forEach(v=>{if(!v.del&&!(x[k]&&x[k][v.id]))put(k,{id:v.id,del:1})});Object.values(x[k]||{}).forEach(v=>put(k,{...v}))});yAll();refresh()}
$('#imf').onchange=async e=>{try{const bf=e.target.files[0],x=JSON.parse(window.MosaicPack?await MosaicPack.readBackup(bf):await bf.text());if(!okBackup(x))throw 0;if(confirm('Replace everything here with this backup?\n\nOK = replace (current pages and items are removed)\nCancel = merge the backup into what is already here')){verSave(1);replaceAll(x);msg('Backup restored (replaced)')}else{x.cm=x.cm||{};const n=Date.now();['pg','it','cm'].forEach(k=>Object.values(x[k]).forEach(v=>v.u=n));YM=1;recv({k:'all',s:x});yAll();YM=0;msg('Backup merged into current content')}}catch(_){msg('Not a valid Mosaic backup')}e.target.value=''};
var VK='mosaic-ver:'+room;
function verList(){try{return JSON.parse(localStorage[VK]||'[]')}catch(e){return[]}}
var lastV=(verList().pop()||{ts:0}).ts;
function verSave(f){const n=Date.now();if(!f&&n-lastV<3e5)return;lastV=n;const L=verList();L.push({ts:n,s:MP.pack(JSON.stringify(S))});while(L.length>12||(L.length>1&&JSON.stringify(L).length>3e6))L.shift();for(;;){try{localStorage[VK]=JSON.stringify(L);break}catch(e){if(L.length<=1)break;L.shift()}}}
$('#rvb').onclick=()=>{const L=verList();$('#rvl').innerHTML=L.length?L.map((v,i)=>`<button data-v="${i}">Restore ${new Date(v.ts).toLocaleString()}</button>`).reverse().join(''):'<p>No restore points yet (one is saved every 5 minutes of editing)</p>'};
$('#rvl').onclick=e=>{const i=e.target.dataset.v;if(i==null)return;const v=verList()[+i];if(v&&confirm('Replace everything with this restore point? Your current state is saved as a new restore point first.')){verSave(1);replaceAll(JSON.parse(MP.unpack(v.s)));msg('Restored')}};

$('#nt').onclick=()=>newPage('t');
/* export */
const msg=t=>$('#exm').textContent=t;
function bounds(L,pd){const q=pd==null?24:pd;let a=1e9,b=1e9,c=-1e9,d=-1e9;L.forEach(i=>{let x0=i.x,y0=i.y,x1=i.x+i.w,y1=i.y+i.h;if(i.r&&pd!=null){const t=i.r*Math.PI/180,s=Math.abs(Math.sin(t)),k=Math.abs(Math.cos(t)),cx=i.x+i.w/2,cy=i.y+i.h/2,hw=(i.w*k+i.h*s)/2,hh=(i.w*s+i.h*k)/2;x0=cx-hw;x1=cx+hw;y0=cy-hh;y1=cy+hh}a=Math.min(a,x0);b=Math.min(b,y0);c=Math.max(c,x1);d=Math.max(d,y1+(i.tg&&i.tg.length&&pd==null?26:0))});return[a-q,b-q,c+q,d+q]}
function wrap(t,W,fs){const m=Math.max(4,Math.floor((W-24)/(fs*.56))),o=[];String(t||'').split('\n').forEach(l=>{let c='';l.split(' ').forEach(x=>{if((c+' '+x).trim().length>m&&c){o.push(c);c=x}else c=(c+' '+x).trim()});o.push(c)});return o}
function svgOf(sl,tr,pd,only){const all=Object.values(S.it).filter(i=>i.p===cur&&!i.del&&!i.hd&&i.ty!=='cn'),L=only?only.slice():sl?all.filter(i=>SL.has(i.id)):all;if(!L.length)return null;
 const dk=document.documentElement.dataset.t==='dark',pn=dk?'#181a21':'#fff',tx=dk?'#e9eaf2':'#191b24',bd=dk?'#2a2d3a':'#dcdfe8',mu='#7b7f90',ids=new Set(L.map(i=>i.id)),[x1,y1,x2,y2]=bounds(L,pd),W=x2-x1,H=y2-y1,
 T=(t,x,y,fs,c,ww,wt)=>{const q=CI||{},al=q.ta||(['oval','dia','pgn','star'].includes(q.ty)?'center':''),ax=al==='center'?q.x+q.w/2:al==='right'?q.x+q.w-(q.ty==='text'?0:12):x,an=al==='center'?' text-anchor="middle"':al==='right'?' text-anchor="end"':'',fw=q.fw||wt,st=(q.fi?'font-style:italic;':'')+(q.ff&&typeof FontLib!=='undefined'?'font-family:'+String(FontLib.css(q.ff)).replace(/"/g,"'")+';':'');return wrap(t,ww,fs).map((l,n)=>`<text x="${ax}" y="${y+n*fs*1.4}" font-size="${fs}" fill="${c}"${an}${fw?` font-weight="${fw}"`:''}${st?` style="${st}"`:''}>${esc(l)}</text>`).join('')},
 SD=i=>i.sc&&i.sw>0?(i.sp==='o'?-i.sw/2:i.sp==='c'?0:i.sw/2):0,SK=(i,st)=>i.sc&&i.sw>0?` stroke="${i.sc}" stroke-width="${i.sw}"`:(st?` stroke="${bd}"`:''),R=(i,f,r,st)=>(f=f===i.c&&i.g2?GF(i,f):f,Array.isArray(i.rd)?`<path d="${rrPath(i)}" fill="${f}"${SK(i,st)}/>`:`<rect x="${i.x+SD(i)}" y="${i.y+SD(i)}" width="${i.w-2*SD(i)}" height="${i.h-2*SD(i)}" rx="${Math.max(0,(i.rd==null?r:i.rd)-SD(i))}" fill="${f}"${SK(i,st)}/>`);let a='',b='',CI=null,defs='',gc=0,GF2=i=>i.g2?GF(i,i.c):i.c,GF=(i,f)=>{const id='g'+(gc++);defs+=`<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${i.c||'#fff'}"/><stop offset="1" stop-color="${i.g2}"/></linearGradient>`;return`url(#${id})`};
 L.sort((p,q)=>(p.z||1)-(q.z||1)).forEach(i=>{CI=i;const{x,y,w:ww,h,ty}=i,fg=i.c===COL[7]?'#fff':'#191b24',fr=ty==='frame'||ty==='col';let o='';
  if(ty==='note'||ty==='rect')o=R(i,i.c,ty==='note'?10:12)+T(i.t,x+12,y+13+(i.fs||15),i.fs||15,fg,ww);
  else if(ty==='bool')o=`<g transform="translate(${x} ${y}) scale(${ww/i.bw} ${h/i.bh})">${boolMk(i)}</g>`;
  else if(ty==='dia'||ty==='pgn'||ty==='star')o=`<polygon points="${PT(ty,x,y,ww,h)}" fill="${GF2(i)}"/>`+T(i.t,x+ww*.25,y+h/2,15,fg,ww*.5);
  else if(ty==='oval')o=`<ellipse cx="${x+ww/2}" cy="${y+h/2}" rx="${ww/2-SD(i)}" ry="${h/2-SD(i)}" fill="${GF2(i)}"${SK(i)}/>`+T(i.t,x+ww*.18,y+h/2,15,fg,ww*.64);
  else if(fr)o=R(i,pn,16,1)+(ty==='col'?`<rect x="${x+8}" y="${y}" width="${ww-16}" height="4" fill="${i.c}"/>`:'')+T(i.t,x+14,y+26,14,mu,ww,600);
  else if(ty==='text')o=T(i.t,x,y+6+(i.fs||22),i.fs||22,tx,ww,650);
  else if(ty==='pen')o=`<svg x="${x}" y="${y}" width="${ww}" height="${h}" viewBox="0 0 ${i.vw} ${i.vh}" preserveAspectRatio="none" overflow="visible"><path d="${i.t}" stroke="${i.c}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  else if(ty==='img')o=`<svg x="${x}" y="${y}" width="${ww}" height="${h}"><image href="${esc(i.t)}" width="${ww}" height="${h}" preserveAspectRatio="xMidYMid slice"/></svg>`;
  else if(ty==='swc')o=R(i,i.c,10)+`<rect x="${x}" y="${y+h-30}" width="${ww}" height="30" fill="#0000004d"/>`+T(i.t,x+10,y+h-10,13,'#fff',ww);
  else if(ty==='td')o=R(i,pn,10,1)+(i.t||'').split('\n').map((l,n)=>{const d=/^✓ /.test(l);return`<rect x="${x+12}" y="${y+14+n*24}" width="14" height="14" rx="4" fill="${d?'#5b5bf0':'none'}" stroke="${d?'#5b5bf0':mu}" stroke-width="2"/><text x="${x+34}" y="${y+26+n*24}" font-size="14" fill="${tx}" opacity="${d?.5:1}">${esc(l.replace(/^✓ /,''))}</text>`}).join('');
  else o=R(i,pn,12,1)+T(ty==='bdc'?'▦ '+((S.pg[i.ref]||{}).n||''):i.t,x+14,y+28,15,tx,ww,650);
  (pd==null?i.tg||[]:[]).reduce((cx,n)=>{const cw=n.length*7+16;o+=`<rect x="${x+cx}" y="${y+h+4}" width="${cw}" height="18" rx="9" fill="${tc(n)}"/><text x="${x+cx+8}" y="${y+h+17}" font-size="11" font-weight="600" fill="#fff">${esc(n)}</text>`;return cx+cw+4},0);
  {const op=i.o==null?1:i.o;let fl='';if(i.sh||i.bu){const id='f'+(gc++);defs+=`<filter id="${id}" x="-60%" y="-60%" width="220%" height="220%" color-interpolation-filters="sRGB">`+(i.sh?'<feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000" flood-opacity=".33"/>':'')+(i.bu?`<feGaussianBlur stdDeviation="${i.bu}"/>`:'')+'</filter>';fl=` filter="url(#${id})"`}
   if(op<1||fl||i.bm)o=`<g${op<1?` opacity="${op}"`:''}${fl}${i.bm?` style="mix-blend-mode:${i.bm}"`:''}>${o}</g>`;
   const cx=x+ww/2,cy=y+h/2,tf=(i.r?`rotate(${i.r} ${cx} ${cy})`:'')+(i.fx||i.fy?` translate(${cx} ${cy}) scale(${i.fx?-1:1} ${i.fy?-1:1}) translate(${-cx} ${-cy})`:'');tf&&(o=`<g transform="${tf}">${o}</g>`)}
  fr?(a+=o):(b+=o)});
 const cn=Object.values(S.it).filter(c=>c.ty==='cn'&&!c.del&&c.p===cur&&ids.has(c.a)&&ids.has(c.b)).map(c=>cnSvg(c,1)).join('');
 return{W,H,s:`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${x1} ${y1} ${W} ${H}" font-family="Avenir Next,Segoe UI,Roboto,sans-serif">`+(defs?'<defs>'+defs+'</defs>':'')+(tr?'':`<rect x="${x1}" y="${y1}" width="${W}" height="${H}" fill="${dk?'#101116':'#eceef3'}"/>`)+a+cn+b+'</svg>'}}
async function save(n,b){try{const d=window.claude&&await claude.use('downloads');if(d){await d.save({filename:n,data:b});msg('Saved '+n)}else{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=n;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4e3);msg('Downloaded '+n)}}catch(e){msg('Download cancelled')}}
function doExport(){const f=$('#exf').value,r=svgOf($('#exs').value==='s'&&SL.size>0,$('#ext').checked&&f==='png'),nm=(S.pg[cur].n||'board').replace(/[^\w-]+/g,'-');const k=r&&f!=='svg'&&f!=='json'&&f!=='mosaic'?exK(r):1;if(k<0)return;if(f==='json')return save('mosaic-backup.json',new Blob([JSON.stringify(S)],{type:'application/json'}));
 if(f==='mosaic')return MosaicPack.gzipBlob(JSON.stringify(S)).then(b=>save('mosaic-backup.mosaic',b),()=>msg('This browser cannot compress files. Use the .json backup instead.'));if(!r)return msg('Nothing to export');
 if(f==='svg')return save(nm+'.svg',new Blob([r.s],{type:'image/svg+xml'}));
 msg('Rendering…');
 const im=new Image,u=URL.createObjectURL(new Blob([r.s],{type:'image/svg+xml'}));im.onload=()=>{try{const c=document.createElement('canvas');c.width=Math.round(r.W*k);c.height=Math.round(r.H*k);const g=c.getContext('2d');if(f==='jpg'||f==='pdf'){g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height)}g.drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);
  c.toBlob(async b=>{if(!b)return msg('Export failed');if(f==='clip'){try{await navigator.clipboard.write([new ClipboardItem({'image/png':b})]);msg('Copied to clipboard')}catch(x){msg('Your browser blocked copying images')}return}save(nm+(k>1?'@'+k+'x':'')+'.'+f,f==='pdf'?await pdf(b,c.width,c.height):b)},f==='png'||f==='clip'?'image/png':'image/jpeg',.95)}catch(x){msg("Export blocked: an image from another site can't be drawn. Use SVG, or upload that image.")}};im.onerror=()=>msg('Export failed (an external image may be blocking it)');im.src=u}
$('#exb').onclick=()=>$('#ex').classList.toggle('on');$('#exd').onclick=doExport;
function flush(){const n=Date.now();if(n-lf>50){lf=n;(D.set||[{j:D.i}]).forEach(o=>put('it',o.j))}}
cv.addEventListener('pointerdown',e=>{if(e.button===1||(SP&&e.button===0)){e.preventDefault();D={m:'p',cx:e.clientX,cy:e.clientY,x:V.x,y:V.y};return}if(e.button||e.target.isContentEditable)return;mvd=0;
 const cn=e.target.dataset&&e.target.dataset.cn;if(cn){pick(cn,e.shiftKey);if(ER)rm();return}
 const el=e.target.closest('.it'),p=pt(e);
 if(ER){if(el){pick(el.dataset.id);rm()}return}if(PM){PD=[[p.x,p.y]];D={m:'d'};return}
 if(!el){if(e.pointerType==='touch'){pick(null);D={m:'p',cx:e.clientX,cy:e.clientY,x:V.x,y:V.y}}else{if(!e.shiftKey)pick(null);D={m:'q',sx:p.x,sy:p.y,add:e.shiftKey}}return}
 const i=S.it[el.dataset.id];
 if(CM||e.target.classList.contains('ch')){D={m:'c',i,sx:p.x,sy:p.y};pick(i.id);return}
 if(e.shiftKey){pick(i.id,1);D=null;return}
 const ws=SL.size===1&&sel===i.id;if(!SL.has(i.id))pick(i.id);
 if(e.target.classList.contains('rz')&&!i.lock){D={m:'r',i,sx:p.x,sy:p.y,w:i.w,h:i.h};return}
 const set=[...SL].map(k=>S.it[k]).filter(j=>j&&j.ty!=='cn'&&!j.lock);
 set.filter(j=>j.ty==='frame'||j.ty==='col').forEach(f=>Object.values(S.it).forEach(j=>{const cx=j.x+j.w/2,cy=j.y+j.h/2;if(j.p===cur&&!j.del&&j.ty!=='cn'&&j!==f&&!set.includes(j)&&cx>f.x&&cx<f.x+f.w&&cy>f.y&&cy<f.y+f.h)set.push(j)}));
 D={m:'m',i,el,ws,sx:p.x,sy:p.y,set:set.map(j=>({j,x:j.x,y:j.y}))}});
addEventListener('pointercancel',()=>{if(D){D=null;TL=MQ=PD=null;drawCn()}});
addEventListener('pointermove',e=>{if(!D)return;if(!D.cap&&(D.m!=='m'||D.mv)){D.cap=1;try{cv.setPointerCapture(e.pointerId)}catch(_){}}
 if(D.m==='p'){V.x=D.x+e.clientX-D.cx;V.y=D.y+e.clientY-D.cy;applyV();return}
 let p=pt(e),dx=p.x-D.sx,dy=p.y-D.sy,i=D.i;
 if(D.m==='c'){TL=[i.x+i.w/2,i.y+i.h/2,p.x,p.y];drawCn();return}
 if(D.m==='d'){PD.push([p.x,p.y]);drawCn();return}
 if(D.m==='q'){MQ=[D.sx,D.sy,p.x,p.y];drawCn();return}
 if(D.m==='r'){i.w=Math.max(40,D.w+dx);i.h=Math.max(30,D.h+dy);paint(els.get(i.id),i);drawCn();flush()}
 else{if(!D.mv&&Math.hypot(dx,dy)*V.z<4)return;D.mv=1;if(isF()&&!e.altKey)[dx,dy]=alignSnap(dx,dy);D.set.forEach(o=>{o.j.x=o.x+dx;o.j.y=o.y+dy;const q=els.get(o.j.id);q&&paint(q,o.j)});drawCn();flush()}});
addEventListener('pointerup',e=>{if(!D)return;const{m,i,el}=D;mvd=!!D.mv;
 if(m==='d'){const P=PD;PD=null;D=null;P&&P.length>1&&penAdd(P);drawCn();return}
 if(m==='q'){const r=MQ,ad=D.add;MQ=null;D=null;if(r){const a=Math.min(r[0],r[2]),b=Math.min(r[1],r[3]),c=Math.max(r[0],r[2]),d=Math.max(r[1],r[3]),ids=Object.values(S.it).filter(j=>j.p===cur&&!j.del&&j.ty!=='cn'&&j.x<c&&j.x+j.w>a&&j.y<d&&j.y+j.h>b).map(j=>j.id);pick(ad?[...SL,...ids]:ids)}else drawCn();return}
 if(m==='c'){TL=null;const t=document.elementFromPoint(e.clientX,e.clientY),e2=t&&t.closest&&t.closest('.it'),b=e2&&S.it[e2.dataset.id];D=null;if(b&&b!==i&&b.ty!=='cn'){const c={id:uid(),p:cur,ty:'cn',a:i.id,b:b.id,z:0};put('it',c);pick(c.id)}else drawCn();return}
 if(m==='r')put('it',i);else if(D.mv)D.set.forEach(o=>put('it',o.j));
 else if(m==='m'){if(SL.size>1&&!e.shiftKey)pick(i.id);else if(D.ws&&!['img','lk','td','bdc'].includes(i.ty))edit(el)}
 if(m==='m'&&D.mv)dockCols(D);GD=[];D=null;inspect()});
cv.addEventListener('pointermove',e=>{const p=pt(e);me.x=p.x;me.y=p.y;if(Date.now()-lc>40){lc=Date.now();beat()}});
cv.addEventListener('wheel',e=>{e.preventDefault();if(e.ctrlKey||e.metaKey)zoom(Math.exp(-e.deltaY*.01),e.clientX,e.clientY);else{V.x-=e.deltaX;V.y-=e.deltaY;applyV()}},{passive:false});
cv.ondblclick=e=>{if(e.target.dataset&&e.target.dataset.cn)return;const el=e.target.closest('.it');
 if(el){const i=S.it[el.dataset.id];pick(i.id);if(i.ty==='bdc'){S.pg[i.ref]&&!S.pg[i.ref].del&&open(i.ref);return}if(i.ty==='lk'){/^https?:\/\//i.test(i.t)&&window.open(i.t,'_blank','noopener')}else edit(el)}
 else{const p=pt(e);add('note',{x:p.x-100,y:p.y-75})}};
addEventListener('keydown',e=>{const ed=e.target.isContentEditable||e.target.tagName==='INPUT';if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();$('#sq').focus();return}
 if(e.key==='Escape'){ed?e.target.blur():pick(null);return}
 if((!ed||e.target.closest('#db,#tbl'))&&(e.ctrlKey||e.metaKey)&&(e.key==='z'||e.key==='y')){e.preventDefault();undo(e.key==='y'||e.shiftKey?-1:1);return}if(ed||cv.hidden||!sel)return;
 if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();rm()}
 else if((e.ctrlKey||e.metaKey)&&e.key==='d'){e.preventDefault();dup()}
 else if((e.ctrlKey||e.metaKey)&&e.key==='g'){e.preventDefault();grp()}});
/* ---------- docs ---------- */
const PHT={h1:'Heading 1',h2:'Heading 2',p:'Type "# ", "- ", "[] " or "> " to format',li:'List item',todo:'To-do',q:'Quote',h3:'Heading 3',code:'Code',call:'Callout',hr:''},B=()=>S.pg[cur].b,sv=()=>put('pg',S.pg[cur]);
const DT=[['h1','Heading 1','heading-1'],['h2','Heading 2','heading-2'],['h3','Heading 3','heading-3'],['p','Text','pilcrow'],['li','List','list'],['todo','To-do','square-check'],['q','Quote','quote'],['call','Callout','lightbulb'],['code','Code','code-xml'],['hr','Divider','minus'],['im','Image','image'],['bm','Bookmark','bookmark'],['ol','Numbered','list-ordered'],['tg','Toggle','list-collapse'],['tb','Table','table'],['cl','Columns','columns-3']],DTH=([k,l,ic])=>`<button data-t="${k}" title="${l}" aria-label="${l}">${MosaicIcons.svg(ic)}<span class="lb">${/^h\d$/.test(k)?k.slice(1):l}</span></button>`;$('#sl').innerHTML=DT.map(DTH).join('');$('#dtb').innerHTML=DT.map(DTH).join('');
$('#dtb').onmousedown=e=>e.preventDefault();
$('#dtb').onclick=e=>{const d=e.target.dataset;if(d.e)dexp(d.e);else if(d.t)blk(fi,d.t)};
function row(k,i){return`<div class="b ${k.t}${k.d?' dn':''}" data-i="${i}" data-t="${k.t}" data-b="${esc(k.id||'')}"><u>${k.t==='todo'?`<input type="checkbox"${k.d?' checked':''}>`:k.t==='li'?'•':k.t==='call'?MosaicIcons.svg('lightbulb'):''}</u><div class="e" contenteditable="true" data-ph="${esc(PHT[k.t])}">${fmtH(k)}</div>${ext(k)}</div>`}
function renderDoc(){dhead();const p=S.pg[cur];if(!p.b||!p.b.length)p.b=[{t:'p',x:''}];mir(p);dbk.innerHTML=p.b.map(row).join('')}
function foc(i,end=1){const e=dbk.children[i]&&dbk.children[i].querySelector('.e');if(!e)return;e.focus();const r=document.createRange();r.selectNodeContents(e);r.collapse(!end);const s=getSelection();s.removeAllRanges();s.addRange(r)}
function blk(i,t){const b=B();if(!b[i])return;b[i].t=t;if(t==='tb')b[i].tb=b[i].tb||Array.from({length:3},()=>['','','']);if(t==='cl')b[i].cols=b[i].cols||['',''];if((t==='tb'||t==='cl')&&i===b.length-1)b.push({t:'p',x:''});sv();renderDoc();foc(i);if(t==='im'&&!RO)pkF('image/*',f=>imD(f,900,u=>{b[i].x=u;ySet(b[i],u);sv();renderDoc()}))}
function edge(el,up){const s=getSelection();if(!s.rangeCount)return 1;const c=s.getRangeAt(0).getClientRects()[0],r=el.getBoundingClientRect();return c?(up?c.top-r.top<14:r.bottom-c.bottom<14):1}
function patchDoc(){dhead();mir(S.pg[cur]);const b=S.pg[cur].b||[],rows=[...dbk.children],a=document.activeElement.closest('.b');
 if(rows.length!==b.length||rows.some((r,i)=>r.dataset.t!==b[i].t)){const f=a?+a.dataset.i:-1;renderDoc();if(f>=0)foc(Math.min(f,b.length-1));return}
 rows.forEach((r,i)=>{if(r===a)return;const e=r.querySelector('.e'),c=r.querySelector('input');if(e.innerText!==b[i].x)e.innerText=b[i].x;r.classList.toggle('dn',!!b[i].d);if(c)c.checked=!!b[i].d})}
dbk.addEventListener('focusin',e=>{const r=e.target.closest('.b');if(r)fi=+r.dataset.i});
dbk.addEventListener('input',e=>{const r=e.target.closest('.b'),i=+r.dataset.i,k=B()[i],x=e.target.innerText.replace(/\u00a0/g,' ').replace(/\n$/,''),m={'# ':'h1','## ':'h2','- ':'li','* ':'li','[] ':'todo','> ':'q','### ':'h3','```':'code','!! ':'call','---':'hr','1. ':'ol'}[x];$('#sl').hidden=x!=='/';if(x==='/'){slash(r);return}
 if(m&&k.t==='p'){k.t=m;k.x='';ySet(k,'');sv();renderDoc();foc(i);return}k.x=x;ySet(k,x);k.h=cleanH(e.target.innerHTML);sv()});
dbk.addEventListener('keydown',e=>{const r=e.target.closest('.b');if(!r)return;const i=+r.dataset.i,b=B(),k=b[i],em=!e.target.innerText.replace(/\n/g,'');
 if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();if(em&&(k.t==='li'||k.t==='todo')){k.t='p';sv();renderDoc();foc(i);return}
  {const g=getSelection(),x=k.x||'';let o=x.length;if(g.rangeCount){const a=g.getRangeAt(0),q=a.cloneRange();q.selectNodeContents(e.target);q.setEnd(a.endContainer,a.endOffset);o=Math.min(x.length,q.toString().length)}k.x=x.slice(0,o);ySet(k,k.x);{const tl=x.slice(o);b.splice(i+1,0,{id:uid()+uid(),s:tl,t:k.t==='li'||k.t==='todo'?k.t:'p',x:tl})}sv();renderDoc();foc(i+1,0)}}
 else if(e.key==='Backspace'&&em){e.preventDefault();if(k.t!=='p'){k.t='p';sv();renderDoc();foc(i)}else if(b.length>1){b.splice(i,1);sv();renderDoc();foc(Math.max(0,i-1))}}
 else if(e.key==='ArrowUp'&&i>0&&edge(e.target,1)){e.preventDefault();foc(i-1)}
 else if(e.key==='ArrowDown'&&i<b.length-1&&edge(e.target,0)){e.preventDefault();foc(i+1,0)}});
dbk.addEventListener('change',e=>{if(e.target.type!=='checkbox')return;const r=e.target.closest('.b'),k=B()[+r.dataset.i];k.d=e.target.checked?1:0;r.classList.toggle('dn',!!k.d);sv()});
dbk.addEventListener('paste',e=>{e.preventDefault();document.execCommand('insertText',false,e.clipboardData.getData('text/plain'))});
/* ---------- design / whiteboard / details / unsorted / templates ---------- */
const isF=()=>{const p=S.pg[cur];return!!p&&p.t==='b'&&p.k==='f'},TS={f:'rect oval pgn star text img pen cm undo redo',w:'note text rect oval dia er img lk td col cm pen undo redo'};
function tools(k){const t=TS[k];document.querySelectorAll('#tools button').forEach(b=>b.hidden=!!t&&!t.split(' ').includes(b.dataset.a))}
const DET=i=>'<div class="dt">'+[['x','X',i.x],['y','Y',i.y],['w','W',i.w],['h','H',i.h],['op','Opacity %',(i.o==null?1:i.o)*100]].map(([k,l,v])=>`<label>${l}<input type="number" data-k="${k}" value="${Math.round(v)}"></label>`).join('')+'</div>'+RAD(i),
LAY=()=>'<div class="ly"><b>Layers</b>'+Object.values(S.it).filter(j=>j.p===cur&&!j.del&&j.ty!=='cn').sort((a,b)=>(b.z||0)-(a.z||0)).map(j=>`<button data-ly="${j.id}"${SL.has(j.id)?' class="on-btn"':''}>${j.ty} · ${esc((j.t||'').slice(0,18))}</button>`).join('')+'</div>';
function newKind(k){const p={id:uid(),t:'b',k,n:k==='f'?'Untitled design':'Untitled whiteboard',o:Math.max(0,...pages().map(q=>q.o))+1};put('pg',p);open(p.id);ttl.focus();ttl.select()}
$('#nf').onclick=()=>newKind('f');$('#nw').onclick=()=>newKind('w');
function usR(){const L=Object.values(S.it).filter(i=>i.p==='~'+cur&&!i.del),p=$('#us');$('#usb').textContent='Unsorted'+(L.length?' ('+L.length+')':'');if(p.hidden||(p.contains(document.activeElement)&&document.activeElement.isContentEditable))return;
 p.innerHTML='<b>Unsorted</b><small>Drop images, links or text here, then drag them onto the board.</small><button id="usn">＋ Note</button>'+(L.map(i=>`<div class="usi" draggable="true" data-id="${i.id}">${i.ty==='img'?`<img src="${esc(i.t)}" alt="" style="width:100%;border-radius:8px" draggable="false">`:i.ty==='lk'?`<a href="${/^https?:\/\//i.test(i.t)?esc(i.t):'#'}" target="_blank" rel="noopener noreferrer">${esc(i.t)}</a>`:`<div class="ut" contenteditable="true" data-id="${i.id}">${esc(i.t)}</div>`}<button data-del="${i.id}" aria-label="Delete">×</button></div>`).join('')||'<p>Nothing here yet.</p>')}
function mkUs(ty,t,h){if(RO)return;put('it',{id:uid(),p:'~'+cur,ty,t,w:ty==='lk'?250:ty==='img'?260:200,h:h||(ty==='lk'?64:150),c:ty==='note'?COL[0]:'',x:0,y:0,z:1});usR()}
$('#usb').onclick=()=>{const p=$('#us');p.hidden=!p.hidden;usR()};
$('#us').onclick=e=>{if(RO)return;if(e.target.id==='usn')mkUs('note','');else if(e.target.dataset.del){del('it',e.target.dataset.del);usR()}};
$('#us').oninput=e=>{const i=S.it[e.target.dataset.id];if(i&&!RO){i.t=e.target.innerText;put('it',i)}};
$('#us').ondragstart=e=>{const d=e.target.closest('.usi');d&&e.dataTransfer.setData('text/mosaic-us',d.dataset.id)};$('#us').ondragover=e=>e.preventDefault();
$('#us').ondrop=e=>{e.preventDefault();const dt=e.dataTransfer;if(dt.getData('text/mosaic-us'))return;
 [...dt.files].filter(f=>/^image/.test(f.type)).forEach(f=>{const r=new FileReader;r.onload=()=>{const m=new Image;m.onload=()=>{const k=Math.min(1,600/Math.max(m.width,m.height)),c=document.createElement('canvas');c.width=m.width*k;c.height=m.height*k;c.getContext('2d').drawImage(m,0,0,c.width,c.height);mkUs('img',c.toDataURL('image/jpeg',.8),260*c.height/c.width)};m.src=r.result};r.readAsDataURL(f)});
 const u=(dt.getData('text/uri-list')||dt.getData('text/plain')).trim();if(u)/^https?:\/\/\S+$/.test(u)?mkUs('lk',u):mkUs('note',u.slice(0,2000))};
const N=(ty,x,y,w,h,t,c)=>({ty,x,y,w,h,t,c}),CO=(n,x)=>N('col',x,0,260,420,n,COL[x/290%6|0]),
TP={'Kanban board':{i:[CO('To do',0),CO('Doing',290),CO('Done',580),N('note',16,60,228,90,'First task',COL[0]),N('note',16,170,228,90,'Second task',COL[4])]},
'Weekly planner':{i:['Mon','Tue','Wed','Thu','Fri'].flatMap((d,k)=>[CO(d,k*290),N('td',k*290+16,60,228,120,'Task\nTask',''),])},
'Mind map':{i:[N('oval',200,160,160,160,'Main idea',COL[2]),N('note',-60,0,170,100,'Idea',COL[0]),N('note',460,0,170,100,'Idea',COL[4]),N('note',-60,380,170,100,'Idea',COL[3]),N('note',460,380,170,100,'Idea',COL[1])],c:[[0,1],[0,2],[0,3],[0,4]]},
'User flow':{i:['Start','Sign up','Dashboard','Done'].map((t,k)=>N('rect',k*250,0,170,90,t,COL[k+3])),c:[[0,1],[1,2],[2,3]]},
'Meeting notes':{i:[N('text',0,0,500,44,'Meeting title',''),N('note',0,70,300,220,'Agenda',COL[0]),N('note',330,70,300,220,'Notes',COL[4]),N('td',0,320,300,140,'Action item\nAction item','')]},
'Mood board':{i:[N('swc',0,0,130,110,'#5B5BF0','#5b5bf0'),N('swc',150,0,130,110,'#FF7EB3','#ff7eb3'),N('swc',300,0,130,110,'#FFD966','#ffd966'),N('rect',0,140,200,200,'Image',COL[6]),N('rect',220,140,200,200,'Image',COL[6]),N('note',0,370,420,100,'Keywords',COL[0])]}};
$('#tp').innerHTML='<b>Start from a template</b>'+Object.keys(TP).map(k=>`<button data-t="${esc(k)}">${esc(k)}</button>`).join('');
$('#tpb').onclick=()=>{$('#tp').hidden=!$('#tp').hidden;$('#sr').hidden=$('#np').hidden=true};
$('#tp').onclick=e=>{const t=TP[e.target.dataset.t];if(!t||RO)return;const L=Object.values(S.it).filter(i=>i.p===cur&&!i.del&&i.ty!=='cn'),x0=L.length?Math.min(...L.map(i=>i.x)):0,y0=L.length?Math.max(...L.map(i=>i.y+i.h))+80:0,ids=[];
 t.i.forEach(o=>{const i={...o,id:uid(),p:cur,x:o.x+x0,y:o.y+y0,z:o.ty==='col'?0:zmax()+1};ids.push(i.id);put('it',i)});(t.c||[]).forEach(([a,b])=>put('it',{id:uid(),p:cur,ty:'cn',a:ids[a],b:ids[b],z:0}));
 $('#tp').hidden=true;sync();V.z=Math.min(V.z,.8);V.x=100-x0*V.z;V.y=100-y0*V.z;applyV()};
/* ---------- shapes, rough, elbow, effects, rulers, pdf, rich doc, files ---------- */
const PT=(t,x,y,w,h)=>(t==='dia'?[[.5,0],[1,.5],[.5,1],[0,.5]]:t==='pgn'?Array.from({length:6},(_,k)=>[.5+.5*Math.cos(k*1.0472-1.5708),.5+.5*Math.sin(k*1.0472-1.5708)]):Array.from({length:10},(_,k)=>{const r=k%2?.2:.5,a=k*.6283-1.5708;return[.5+r*Math.cos(a),.5+r*Math.sin(a)]})).map(([a,b])=>(x+a*w)+','+(y+b*h)).join(' '),
EL=(c,p,q)=>c.el?`M${p[0]} ${p[1]}H${(p[0]+q[0])/2}V${q[1]}H${q[0]}`:`M${p[0]} ${p[1]}L${q[0]} ${q[1]}`;
function rough(e,i){let g=e.querySelector('.rg');if(!g){g=document.createElementNS('http://www.w3.org/2000/svg','svg');g.setAttribute('class','rg');e.prepend(g)}
 const{w,h}=i,r=i.ro==null?1:i.ro,sd=[...i.id].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7),rn=n=>((Math.sin(sd+n*12.9898)*43758.5453)%1)*r*2.5,
 P=i.ty==='rect'?[[0,0],[w,0],[w,h],[0,h],[0,0]]:i.ty==='dia'?[[w/2,0],[w,h/2],[w/2,h],[0,h/2],[w/2,0]]:Array.from({length:25},(_,k)=>[w/2+w/2*Math.cos(k/24*6.2832),h/2+h/2*Math.sin(k/24*6.2832)]),
 L=(a,b,n)=>`M${a[0]+rn(n)} ${a[1]+rn(n+1)}L${b[0]+rn(n+2)} ${b[1]+rn(n+3)}`,d=P.slice(1).map((p,k)=>L(P[k],p,k*4)+L(P[k],p,k*4+90)).join(''),c=i.c||'#999',z=i.fz||'solid';
 g.innerHTML=`<defs><pattern id="p${i.id}" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V9" stroke="${c}" stroke-width="2"/>${z==='cross'?`<path d="M0 0H9" stroke="${c}" stroke-width="2"/>`:''}</pattern></defs><path d="M${P.map(p=>p.join(' ')).join('L')}z" fill="${z==='solid'?(i.c||'none'):`url(#p${i.id})`}" opacity=".92"/><path d="${d}" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>`}
const STY=i=>{const o=(k,v,l)=>`<select data-k="${k}" aria-label="${k}">${l.map(([a,b])=>`<option value="${a}"${String(v)===String(a)?' selected':''}>${b}</option>`).join('')}</select>`,k=document.body.dataset.k;let h='';
 if(k==='w'&&['rect','oval','dia'].includes(i.ty))h+=o('ro',i.ro==null?1:i.ro,[[0,'Architect'],[1,'Artist'],[2,'Cartoonist']])+o('fz',i.fz||'solid',[['solid','Solid'],['hatch','Hatch'],['cross','Cross-hatch']]);
 if(k==='f')h+=`<input type="color" data-k="g2" value="${i.g2||'#ffffff'}" title="Gradient end colour"><button data-x="g0" title="Remove gradient">∅</button>`+o('bm',i.bm||'',[['','Normal'],['multiply','Multiply'],['screen','Screen'],['overlay','Overlay'],['difference','Difference']])+`<label class="rt">Blur<input type="number" data-k="bu" min="0" value="${i.bu||0}" style="width:48px"></label><label class="rt"><input type="checkbox" data-k="sh"${i.sh?' checked':''}>Shadow</label>`+FX(i);return h};
function rulers(){const c=$('#rx'),d=$('#ry');if(!isF()||!c)return;const r=cv.getBoundingClientRect(),st=V.z<.5?200:V.z<1?100:V.z<2?50:20;c.width=r.width;c.height=18;d.width=18;d.height=r.height;const X=c.getContext('2d'),Y=d.getContext('2d'),col=getComputedStyle(document.body).color;[X,Y].forEach(g=>{g.fillStyle=col;g.font='9px Inter,sans-serif';g.globalAlpha=.7});
 for(let v=Math.floor(-V.x/V.z/st)*st;v*V.z+V.x<r.width;v+=st){const p=v*V.z+V.x;X.fillRect(p,10,1,8);X.fillText(v,p+3,9)}
 for(let v=Math.floor(-V.y/V.z/st)*st;v*V.z+V.y<r.height;v+=st){const p=v*V.z+V.y;Y.fillRect(10,p,8,1);Y.save();Y.translate(9,p-3);Y.rotate(-1.5708);Y.fillText(v,0,0);Y.restore()}}
['rx','ry'].forEach(id=>{const c=document.createElement('canvas');c.id=id;insp.before(c)});{const A=applyV;applyV=()=>{A();rulers()}}
async function pdf(b,W,H){const j=new Uint8Array(await b.arrayBuffer()),P=[],O=[];let n=0;const w=x=>{x=typeof x==='string'?new TextEncoder().encode(x):x;P.push(x);n+=x.length},ob=(i,t)=>{O[i]=n;w(i+' 0 obj\n'+t+'\nendobj\n')},cs=`q ${W} 0 0 ${H} 0 0 cm /I Do Q`;
 w('%PDF-1.4\n');ob(1,'<</Type/Catalog/Pages 2 0 R>>');ob(2,'<</Type/Pages/Kids[3 0 R]/Count 1>>');ob(3,`<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${W} ${H}]/Resources<</XObject<</I 5 0 R>>>>/Contents 4 0 R>>`);ob(4,`<</Length ${cs.length}>>stream\n${cs}\nendstream`);
 O[5]=n;w(`5 0 obj\n<</Type/XObject/Subtype/Image/Width ${W}/Height ${H}/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length ${j.length}>>stream\n`);w(j);w('\nendstream\nendobj\n');const x=n;
 w('xref\n0 6\n0000000000 65535 f \n'+[1,2,3,4,5].map(i=>String(O[i]).padStart(10,'0')+' 00000 n \n').join('')+`trailer<</Size 6/Root 1 0 R>>\nstartxref\n${x}\n%%EOF`);return new Blob(P,{type:'application/pdf'})}
const pkF=(a,cb)=>{const i=document.createElement('input');i.type='file';i.accept=a;i.onchange=()=>i.files[0]&&cb(i.files[0]);i.click()},rdU=(f,cb)=>{const r=new FileReader;r.onload=()=>cb(r.result);r.readAsDataURL(f)},
imD=(f,m,cb)=>rdU(f,u=>{const g=new Image;g.onload=()=>{const k=Math.min(1,m/Math.max(g.width,g.height)),c=document.createElement('canvas');c.width=g.width*k;c.height=g.height*k;c.getContext('2d').drawImage(g,0,0,c.width,c.height);cb(c.toDataURL('image/jpeg',.85))};g.src=u});
function sketch(){const d=document.createElement('div');d.className='fl';d.style.cssText='position:fixed;inset:0;margin:auto;width:392px;height:326px;z-index:90;padding:14px;gap:8px;flex-direction:column;align-items:stretch';d.innerHTML='<canvas width=360 height=240 style="background:#fff;border-radius:12px;touch-action:none"></canvas><div><button class="pri">Add sketch</button> <button>Cancel</button></div>';document.body.appendChild(d);
 const c=d.firstChild,g=c.getContext('2d'),xy=e=>{const r=c.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};let on=0;g.lineWidth=3;g.lineCap='round';
 c.onpointerdown=e=>{on=1;c.setPointerCapture(e.pointerId);g.beginPath();g.moveTo(...xy(e))};c.onpointermove=e=>{if(on){g.lineTo(...xy(e));g.stroke()}};c.onpointerup=()=>on=0;d.lastChild.onclick=e=>{if(e.target.className==='pri')add('img',{t:c.toDataURL(),w:240,h:160});if(e.target.tagName==='BUTTON')d.remove()}}
cv.addEventListener('dblclick',e=>{const el=e.target.closest('.it'),i=el&&S.it[el.dataset.id];if(i&&i.ty==='fl')window.mosaicDownloadFile(i)});
const cleanH=h=>{const d=document.createElement('div');d.innerHTML=h;d.querySelectorAll('*').forEach(n=>{if(!['b','i','u','s','strike','strong','em','code','a','span'].includes(n.tagName.toLowerCase())){n.replaceWith(...n.childNodes);return}[...n.attributes].forEach(a=>{const ok=a.name==='href'&&/^https?:/i.test(a.value)||a.name==='style'&&/^(\s*(color|background-color)\s*:\s*[#\w(),. %]+;?)+$/i.test(a.value);if(!ok)n.removeAttribute(a.name);else if(a.name==='href'){n.target='_blank';n.rel='noopener'}})});return d.querySelector('*')?d.innerHTML:''},
fmtH=k=>{const d=document.createElement('div');d.innerHTML=cleanH(k.h||'');return k.h&&d.textContent===k.x?d.innerHTML:esc(k.x)},
ext=k=>k.t==='im'&&/^(https?:|data:image\/)/i.test(k.x)?`<img src="${esc(k.x)}" alt="">`:k.t==='bm'&&/^https?:\/\//i.test(k.x)?`<a class="bmk" href="${esc(k.x)}" target="_blank" rel="noopener">↗ ${esc(k.x.replace(/^https?:\/\//,'').split('/')[0])}</a>`:'';
PHT.im='Choose an image, or paste its URL';PHT.bm='Paste a link';
dbk.addEventListener('focusout',e=>{const r=e.target.closest('.b');if(r&&/^(im|bm)$/.test(r.dataset.t)){const i=+r.dataset.i;r.outerHTML=row(B()[i],i)}});
const CVG=['linear-gradient(135deg,#f6d365,#fda085)','linear-gradient(135deg,#a1c4fd,#c2e9fb)','linear-gradient(135deg,#d4fc79,#96e6a1)','linear-gradient(135deg,#fbc2eb,#a6c1ee)','linear-gradient(135deg,#667eea,#764ba2)','linear-gradient(135deg,#43cea2,#185a9d)','linear-gradient(135deg,#ff9a9e,#fad0c4)','linear-gradient(135deg,#2c3e50,#4ca1af)','linear-gradient(135deg,#232526,#414345)','linear-gradient(135deg,#f093fb,#f5576c)'],CVS=['#e5533d','#f2a93b','#4caf7d','#3b82f6','#8b5cf6','#2b2a28','#d9d3c8','#ffffff'],
EMO='😀 😄 😉 😍 🤩 😎 🤔 😴 🥳 🤓 📄 📝 📚 📖 📒 📌 📎 ✏️ 📅 🗓️ 📊 📈 💡 🔥 ⭐ ✨ 🎯 🏆 🎨 🎬 🎵 🎮 🧩 🚀 🛠️ ⚙️ 💻 📱 🔒 🔑 🌍 🌱 🌸 🌈 ☀️ 🌙 ⚡ ❄️ 🍎 🍕 ☕ 🍰 🎁 🏠 🏢 🏫 🚗 ✈️ 🧠 ❤️ 💙 💚 💛 🧡 💜 🖤 ✅ ❌ ❓ ❗ 📣 🔔 🧭 🗂️ 📁 📋 🧾 💬 👥 🙌 👍 👏 🤝 🐶 🐱 🦊 🐼 🦋 🐝'.split(' '),
okCv=v=>/^(#[0-9a-f]{3,8}|linear-gradient\([#\w(),.% -]+\)|url\("data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+"\) center\/cover)$/i.test(v||'');
function dhead(){let h=$('#dh');if(!h){h=document.createElement('div');h.id='dh';h.innerHTML='<div class="cvr"></div><div class="dhi"><div class="dha"><button data-a="ic" class="ib"></button><button data-a="cv" class="cb"></button></div><input id="dti" placeholder="Untitled" aria-label="Page title"></div><div id="dpp" class="fl" hidden></div>';$('#dc').before(h);
  h.onclick=e=>{const a=e.target.closest('[data-a],[data-q]');if(!a||RO)return;const p=S.pg[cur],d=$('#dpp'),t=a.dataset.a,q=a.dataset.q,v=a.dataset.v;
   if(t==='ic')d.innerHTML='<input id="dpe" placeholder="Type or paste an emoji" aria-label="Emoji"><div class="eg">'+EMO.map(m=>`<button data-q="e" data-v="${m}">${m}</button>`).join('')+'</div><div><button data-q="r">🎲 Random</button> <button data-q="ri">Remove icon</button></div>';
   else if(t==='cv')d.innerHTML='<div class="cg">'+CVG.concat(CVS).map(c=>`<button data-q="c" data-v="${c}" style="background:${c}" aria-label="Cover colour"></button>`).join('')+'</div><div><button data-q="up">Upload image…</button> <button data-q="rc">Remove cover</button></div>';
   if(t){const o=d.hidden||d.dataset.m!==t;d.hidden=!o;d.dataset.m=t;return}
   if(q==='e')p.ic=v;else if(q==='r')p.ic=EMO[Math.random()*EMO.length|0];else if(q==='ri')p.ic='';else if(q==='c'&&okCv(v))p.cv=v;else if(q==='rc')p.cv='';
   else if(q==='up'){pkF('image/*',f=>imD(f,1600,u=>{p.cv=`url("${u}") center/cover`;put('pg',p);d.hidden=true;dhead()}));return}
   put('pg',p);d.hidden=true;dhead()};
  h.addEventListener('input',e=>{const t=e.target;if(RO)return;const p=S.pg[cur];if(t.id==='dti'){p.n=t.value;put('pg',p);ttl.value=p.n;renderList()}
   else if(t.id==='dpe'){const v=t.value.trim(),g=(typeof Intl.Segmenter==='function'?[...new Intl.Segmenter().segment(v)].map(x=>x.segment):[...v])[0];if(g){p.ic=g;put('pg',p);$('#dpp').hidden=true;dhead()}}});
  h.addEventListener('keydown',e=>{if(e.target.id==='dti'&&e.key==='Enter'){e.preventDefault();foc(0)}});
  document.addEventListener('pointerdown',e=>{const d=$('#dpp');if(d&&!d.hidden&&!e.target.closest('#dpp,[data-a]'))d.hidden=true},true)}
 const p=S.pg[cur],ok=okCv(p.cv),t=$('#dti');h.hidden=p.t!=='d';h.classList.toggle('hc',ok);h.querySelector('.cvr').style.background=ok?p.cv:'';
 const ib=h.querySelector('.ib');ib.textContent=p.ic||'☺ Add icon';ib.className='ib'+(p.ic?' big':'');h.querySelector('.cb').textContent=ok?'Change cover':'Add cover';if(t!==document.activeElement)t.value=p.n||'';t.readOnly=RO}
const fm=document.createElement('div'),FC=['#e5533d','#2f7de1','#2e9e5b','#c28b00'];let ci=0;fm.className='fmt';fm.hidden=true;fm.innerHTML=[['bold','<b>B</b>'],['italic','<i>I</i>'],['underline','<u>U</u>'],['strikeThrough','<s>S</s>'],['code','&lt;/&gt;'],['link',MosaicIcons.svg('link')],['color','A'],['hilite',MosaicIcons.svg('highlighter')]].map(([c,l])=>`<button data-c="${c}">${l}</button>`).join('');document.body.appendChild(fm);fm.onmousedown=e=>e.preventDefault();
fm.onclick=e=>{const c=e.target.closest('button')?.dataset.c,x=(...a)=>document.execCommand(...a);if(!c||RO)return;x('styleWithCSS',false,true);
 if(c==='code')x('insertHTML',false,'<code>'+esc(getSelection().toString())+'</code>');else if(c==='link'){const g=getSelection().getRangeAt(0).cloneRange();ask('Link URL',u=>{if(!/^https?:\/\//i.test(u))return;const s=getSelection();s.removeAllRanges();s.addRange(g);x('createLink',false,u)})}else if(c==='color')x('foreColor',false,FC[ci++%4]);else if(c==='hilite')x('hiliteColor',false,'#fff1a6');else x(c)};
document.addEventListener('selectionchange',()=>{const s=getSelection(),n=s.anchorNode,a=n&&(n.nodeType===1?n:n.parentElement)?.closest('#dbk .e');if(!a||s.isCollapsed||RO){fm.hidden=true;return}const r=s.getRangeAt(0).getBoundingClientRect();fm.hidden=false;fm.style.left=Math.max(8,r.left+r.width/2-120)+'px';fm.style.top=Math.max(8,r.top-46)+'px'});
/* ---------- doc blocks, snapping, boolean, components, column docking ---------- */
{const r0=row;row=(k,i)=>{const h=r0(k,i),a=`data-i="${i}" data-t="${k.t}" data-b="${esc(k.id||'')}"`;
 if(k.t==='tg')return h.replace('<u>','<u data-a="tg">').replace('class="b tg','class="b tg'+(k.o?' open':'')).replace(/<\/div>$/,`<div class="tgb" contenteditable="true" data-f="tg" data-ph="Toggle contents">${esc(k.y||'')}</div></div>`);
 if(k.t==='tb')return`<div class="b tb" ${a}><div class="e" hidden></div><table>${(k.tb||[['']]).map((w,y)=>`<tr>${w.map((c,x)=>`<td contenteditable="true" data-f="tb" data-r="${y}" data-c="${x}">${esc(c)}</td>`).join('')}</tr>`).join('')}</table><span class="tba"><button data-a="tr">＋ Row</button><button data-a="tc">＋ Column</button></span></div>`;
 if(k.t==='cl')return`<div class="b cl" ${a}><div class="e" hidden></div>${(k.cols||['','']).map((c,x)=>`<div class="cc" contenteditable="true" data-f="cl" data-c="${x}">${esc(c)}</div>`).join('')}<button data-a="ca">＋</button></div>`;return h}}
dbk.addEventListener('input',e=>{const a=e.target;if(!a.dataset||!a.dataset.f)return;e.stopPropagation();const k=B()[+a.closest('.b').dataset.i],v=a.innerText.replace(/\n$/,'');if(a.dataset.f==='tb')k.tb[a.dataset.r][a.dataset.c]=v;else if(a.dataset.f==='tg')k.y=v;else k.cols[a.dataset.c]=v;sv()},true);
dbk.addEventListener('keydown',e=>{const a=e.target;if(!a.dataset||!a.dataset.f)return;e.stopPropagation();if(a.dataset.f==='tb'&&(e.key==='Tab'||e.key==='Enter')){e.preventDefault();const c=[...a.closest('table').querySelectorAll('td')],n=c[c.indexOf(a)+(e.shiftKey?-1:1)];n&&n.focus()}},true);
dbk.addEventListener('click',e=>{const a=e.target.dataset.a;if(!a||RO||!e.target.closest('.b'))return;const r=e.target.closest('.b'),k=B()[+r.dataset.i];if(a==='tg'){k.o=!k.o;r.classList.toggle('open',k.o);sv()}else if(a==='tr'||a==='tc'||a==='ca'){if(a==='tr')k.tb.push(Array(k.tb[0].length).fill(''));else if(a==='tc')k.tb.forEach(w=>w.push(''));else k.cols.push('');sv();renderDoc()}});
var GD=[];PH.bool='';
function alignSnap(dx,dy){const I=new Set(D.set.map(o=>o.j.id)),M=D.set.filter(o=>o.j.ty!=='cn');if(!M.length)return[dx,dy];const a=Math.min(...M.map(o=>o.x))+dx,b=Math.min(...M.map(o=>o.y))+dy,c=Math.max(...M.map(o=>o.x+o.j.w))+dx,d=Math.max(...M.map(o=>o.y+o.j.h))+dy,T=6/V.z,X=[a,(a+c)/2,c],Y=[b,(b+d)/2,d],
 O=Object.values(S.it).filter(j=>j.p===cur&&!j.del&&j.ty!=='cn'&&!I.has(j.id)),ex=j=>[j.x,j.x+j.w/2,j.x+j.w],ey=j=>[j.y,j.y+j.h/2,j.y+j.h];let bx=T,by=T,sx=0,sy=0;
 O.forEach(j=>{ex(j).forEach(t=>X.forEach(v=>{if(Math.abs(t-v)<bx){bx=Math.abs(t-v);sx=t-v}}));ey(j).forEach(t=>Y.forEach(v=>{if(Math.abs(t-v)<by){by=Math.abs(t-v);sy=t-v}}))});
 GD=[];O.forEach(j=>{ex(j).forEach(t=>X.forEach(v=>Math.abs(t-v-sx)<.5&&GD.push(['v',t])));ey(j).forEach(t=>Y.forEach(v=>Math.abs(t-v-sy)<.5&&GD.push(['h',t])))});return[dx+sx,dy+sy]}
const SH=p=>p.ty==='rect'?`<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="${p.rd||0}"/>`:p.ty==='oval'?`<ellipse cx="${p.x+p.w/2}" cy="${p.y+p.h/2}" rx="${p.w/2}" ry="${p.h/2}"/>`:`<polygon points="${PT(p.ty,p.x,p.y,p.w,p.h)}"/>`;
function boolMk(i){const P=i.parts,id='b'+i.id,f=i.c||'#999',[a,...r]=P,all=`<rect width="${i.bw}" height="${i.bh}" fill="${f}" mask="url(#${id})"/>`;
 if(i.op==='u')return`<g fill="${f}">${P.map(SH).join('')}</g>`;
 if(i.op==='s')return`<mask id="${id}"><g fill="#fff">${SH(a)}</g><g fill="#000">${r.map(SH).join('')}</g></mask>`+all;
 if(i.op==='i')return r.map((p,k)=>`<clipPath id="${id}${k}">${SH(p)}</clipPath>`).join('')+r.map((p,k)=>`<g clip-path="url(#${id}${k})">`).join('')+`<g fill="${f}">${SH(a)}</g>`+r.map(()=>'</g>').join('');
 return`<mask id="${id}"><rect width="${i.bw}" height="${i.bh}" fill="#000"/><g fill="#fff">${P.map(p=>SH(p).replace('/>',' style="mix-blend-mode:difference"/>')).join('')}</g></mask>`+all}
function boolSvg(e,i){let g=e.querySelector('.rg');if(!g){g=document.createElementNS('http://www.w3.org/2000/svg','svg');g.setAttribute('class','rg');g.setAttribute('preserveAspectRatio','none');e.prepend(g)}g.setAttribute('viewBox',`0 0 ${i.bw} ${i.bh}`);g.innerHTML=boolMk(i)}
function boolean(op){const L=[...SL].map(k=>S.it[k]).filter(j=>j&&['rect','oval','dia','pgn','star'].includes(j.ty)).sort((a,b)=>(a.z||0)-(b.z||0));if(L.length<2||RO)return;
 const x=Math.min(...L.map(j=>j.x)),y=Math.min(...L.map(j=>j.y)),w=Math.max(...L.map(j=>j.x+j.w))-x,h=Math.max(...L.map(j=>j.y+j.h))-y,n={id:uid(),p:cur,ty:'bool',op,x,y,w,h,bw:w,bh:h,c:L[0].c||'#999',z:zmax()+1,parts:L.map(j=>({ty:j.ty,x:j.x-x,y:j.y-y,w:j.w,h:j.h,rd:j.rd||0}))};L.forEach(j=>del('it',j.id));put('it',n);sync();pick(n.id)}
const FX=i=>(SL.size>1?[['u','∪ Union'],['s','− Subtract'],['i','∩ Intersect'],['x','⊻ Exclude']].map(([a,l])=>`<button data-x="bo" data-a="${a}">${l}</button>`).join(''):'')+(i.inst?'<button data-x="dt">⌥ Detach</button>':`<button data-x="cp">${i.cp?'◆ Remove component':'◇ Create component'}</button>`)+(i.cp?'<button data-x="in">⧉ Instance</button>':'')+PRE(i);
{const P0=put;put=(k,v)=>{P0(k,v);if(k==='it'&&v.cp){Object.values(S.it).forEach(j=>{if(j.inst===v.id&&!j.del){['w','h','c','g2','rd','o','t','fs','bu','sh','bm','parts','op','bw','bh'].forEach(q=>{if(v[q]!==undefined)j[q]=v[q]});P0('it',j)}});sync()}}}
const colAt=(x,y,ex)=>Object.values(S.it).find(c=>c.ty==='col'&&c.p===cur&&!c.del&&!ex.has(c.id)&&x>c.x&&x<c.x+c.w&&y>c.y&&y<c.y+c.h);
function dockCols(D){const I=new Set(D.set.map(o=>o.j.id)),cs=new Set;D.set.forEach(o=>{const j=o.j;if(j.ty==='col'||j.ty==='frame'||j.ty==='cn')return;const a=colAt(o.x+j.w/2,o.y+j.h/2,I),b=colAt(j.x+j.w/2,j.y+j.h/2,I);if(a!==b){a&&cs.add(a);b&&cs.add(b)}});cs.forEach(fit)}
/* ---------- corners + typed export size ---------- */
const RAD=i=>{const a=Array.isArray(i.rd),v=a?i.rd:Array(4).fill(i.rd||0),t=['↖','↗','↘','↙'];return`<div class="dt"><label>Corner radius<input type="number" min="0" data-k="rad" value="${a?'':v[0]}" placeholder="${a?'mixed':'0'}"></label><button data-x="ic" title="Set each corner separately">${a?'▢ One value':'⌜⌟ Each corner'}</button>${a?v.map((n,k)=>`<label>${t[k]} corner<input type="number" min="0" data-k="rc${k}" value="${n}"></label>`).join(''):''}</div>`},
rrPath=i=>{const m=Math.min(i.w,i.h)/2,[a,b,c,d]=i.rd.map(v=>Math.min(v,m)),{x,y,w,h}=i;return`M${x+a} ${y}H${x+w-b}A${b} ${b} 0 0 1 ${x+w} ${y+b}V${y+h-c}A${c} ${c} 0 0 1 ${x+w-c} ${y+h}H${x+d}A${d} ${d} 0 0 1 ${x} ${y+h-d}V${y+a}A${a} ${a} 0 0 1 ${x+a} ${y}z`};
function exK(r){const m=/^\s*(\d*\.?\d+)\s*(x|w|h|px)?\s*$/i.exec($('#exk').value);if(!m){msg('Type a size like 2x, 0.5x, 1920w or 2048h');return-1}
 const n=+m[1],u=(m[2]||'x').toLowerCase(),mx=Math.min(2048,16384/Math.max(r.W,r.H),Math.sqrt(2.6e8/(r.W*r.H)));let k=u==='x'?n:u==='h'?n/r.H:n/r.W;
 if(!(k>0)){msg('Size must be above 0');return-1}if(k>mx){k=mx;$('#exk').value=(Math.floor(mx*100)/100)+'x';msg('Capped at '+$('#exk').value+' ('+Math.floor(r.W*mx)+'×'+Math.floor(r.H*mx)+' px), the most a browser can draw.')}return Math.floor(k*1e4)/1e4}
/* ---------- trash, tables, locks, shortcuts, drag handles, presets ---------- */
PHT.ol='List item';var DI=-1;
const LK=i=>`<button data-x="lc">${i.lock?'🔒 Unlock':'🔓 Lock'}</button>`+(i.ty==='tc'?'<button data-x="tr">＋ Row</button><button data-x="tcc">＋ Col</button>':''),
PRE=i=>(i.ty==='frame'?[['390,844','📱 Phone'],['768,1024','▭ Tablet'],['1440,900','🖥 Desktop'],['595,842','A4']].map(([v,l])=>`<button data-x="pz" data-v="${v}">${l}</button>`).join(''):'')+'<button data-x="fl2" data-v="fx" title="Flip horizontal">⇋</button><button data-x="fl2" data-v="fy" title="Flip vertical">⇵</button>';
function tcPaint(e,i){const t=e.querySelector('.tx');if(t.contains(document.activeElement))return;i.g=i.g||[['','',''],['','',''],['','','']];t.innerHTML='<table>'+i.g.map((r,y)=>'<tr>'+r.map((c,x)=>`<td contenteditable="true" data-y="${y}" data-x="${x}">${esc(c)}</td>`).join('')+'</tr>').join('')+'</table>'}
w.addEventListener('input',e=>{const c=e.target;if(c.tagName!=='TD'||RO)return;e.stopPropagation();const i=S.it[c.closest('.it').dataset.id];i.g[c.dataset.y][c.dataset.x]=c.innerText.replace(/\n$/,'');put('it',i)},true);
function subDoc(){const p={id:uid(),t:'d',n:'Untitled doc',o:Math.max(0,...pages().map(q=>q.o))+1,par:cur,b:[{t:'p',x:''}]};put('pg',p);add('bdc',{ref:p.id,t:''})}
function trash(){const I=Object.values(S.it).filter(i=>i.del&&i.ty&&i.ty!=='cn'&&!String(i.p).startsWith('~')).sort((a,b)=>b.u-a.u).slice(0,40),P=Object.values(S.pg).filter(p=>p.del&&p.n);
 $('#trp').innerHTML='<b>Trash</b>'+(P.map(p=>`<div class="tr"><span>▦ ${esc(p.n)}</span><button data-r="pg" data-id="${p.id}">Restore</button></div>`).concat(I.map(i=>`<div class="tr"><span>${esc(i.ty)} · ${esc(String(i.t||'').slice(0,24))}</span><button data-r="it" data-id="${i.id}">Restore</button></div>`)).join('')||'<small>Trash is empty.</small>')+(P.length+I.length?'<button data-r="x">Empty trash</button>':'')}
$('#trb').onclick=()=>{const p=$('#trp');p.hidden=!p.hidden;if(!p.hidden)trash()};
$('#trp').onclick=e=>{const r=e.target.dataset.r;if(!r||RO)return;if(r==='x'){Object.values(S.it).filter(i=>i.del&&i.ty).forEach(i=>put('it',{id:i.id,del:1}));Object.values(S.pg).filter(p=>p.del&&p.n).forEach(p=>put('pg',{id:p.id,del:1}))}else{const o=S[r][e.target.dataset.id];delete o.del;put(r,o);sync();renderList()}trash()};
addEventListener('pointerdown',e=>{if(!e.target.closest('#trp,#trb'))$('#trp').hidden=true},true);
$('#bgc').oninput=e=>{if(RO)return;const p=S.pg[cur];p.bg=e.target.value;put('pg',p);cv.style.backgroundColor=p.bg};
addEventListener('keydown',e=>{if(e.key==='!'&&!e.ctrlKey&&!e.metaKey&&!cv.hidden&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)&&!e.target.isContentEditable)$('#zf').click()});
{const r1=row;row=(k,i)=>r1(k,i).replace(/^(<div class="b[^"]*"[^>]*>)/,'$1<s class="dg" draggable="true" title="Drag to move">⋮⋮</s>')}
dbk.addEventListener('dragstart',e=>{const r=e.target.closest&&e.target.closest('.dg')&&e.target.closest('.b');if(r){DI=+r.dataset.i;e.dataTransfer.setData('text/mosaic-b',''+DI)}});
dbk.addEventListener('dragover',e=>{if(DI>=0)e.preventDefault()});
dbk.addEventListener('drop',e=>{if(DI<0)return;e.preventDefault();const r=e.target.closest('.b'),b=B();if(r&&!RO){const j=+r.dataset.i,[m]=b.splice(DI,1);b.splice(j,0,m);sv();renderDoc()}DI=-1});
/* ---------- workspaces, whiteboard keys, doc export ---------- */
var ER=0,SP=0;const WS=[['w','Whiteboard','✎'],['d','Doc','☰'],['b','Board','▦'],['f','Design','◩']],LW={},kind=p=>p.t==='d'?'d':p.t==='b'?(p.k||'b'):'x';
function tabs(){document.body.classList.toggle('isdoc',S.pg[cur].t==='d');rulers();const k=kind(S.pg[cur]);LW[k]=cur;$('#tabs').innerHTML=WS.map(([c,n,g])=>`<button data-w="${c}"${c===k?' class="on-btn"':''}>${MosaicIcons.kind(c)}<span class="lb">${n}</span></button>`).join('')}
$('#tabs').onclick=e=>{const c=e.target.dataset.w;if(!c)return;const l=LW[c],L=pages().filter(p=>kind(p)===c);if(l&&S.pg[l]&&!S.pg[l].del)open(l);else if(L.length)open(L[L.length-1].id);else if(!RO)c==='d'||c==='b'?newPage(c):newKind(c)};
$('#zf').onclick=()=>{const L=Object.values(S.it).filter(i=>i.p===cur&&!i.del&&i.ty!=='cn');if(!L.length)return;const[a,b,c,d]=bounds(L),r=cv.getBoundingClientRect();V.z=Math.min(2,Math.max(.15,Math.min(r.width/(c-a),r.height/(d-b))));V.x=(r.width-(c-a)*V.z)/2-a*V.z;V.y=(r.height-(d-b)*V.z)/2-b*V.z;applyV()};
const KM={r:'rect',d:'dia',o:'oval',a:'cm',l:'cm',p:'pen',t:'text',e:'er',n:'note',f:'frame'};
addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.target.isContentEditable||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||cv.hidden||RO)return;const k=e.key.toLowerCase();
 if(k==='v'){PM=CM=ER=0;document.body.classList.remove('pm','cm');document.querySelectorAll('#tools .on-btn').forEach(b=>b.classList.remove('on-btn'))}else{const b=KM[k]&&document.querySelector('#tools [data-a="'+KM[k]+'"]');b&&!b.hidden&&b.click()}});
addEventListener('keydown',e=>{if(e.code==='Space'&&!e.target.isContentEditable&&!/INPUT|SELECT|TEXTAREA|BUTTON/.test(e.target.tagName)&&!cv.hidden){SP=1;cv.style.cursor='grab';e.preventDefault()}});addEventListener('keyup',e=>{if(e.code==='Space'){SP=0;cv.style.cursor=''}});
$('#dtb').insertAdjacentHTML('beforeend','<button data-e="md">⤓ MD</button><button data-e="html">⤓ HTML</button><button data-e="pdf">⎙ PDF</button>');
function dexp(f){if(f==='pdf')return print();const p=S.pg[cur],T={h1:'h1',h2:'h2',h3:'h3',q:'blockquote',code:'pre',li:'li'},M={h1:'# ',h2:'## ',h3:'### ',li:'- ',q:'> ',call:'> 💡 ',ol:'1. '};
 if(f==='md')return save(p.n+'.md',new Blob([p.b.map(k=>k.t==='tb'?(k.tb||[]).map(r=>'| '+r.join(' | ')+' |').join('\n'):k.t==='cl'?(k.cols||[]).join('\n\n'):k.t==='tg'?'**'+k.x+'**\n\n'+(k.y||''):k.t==='hr'?'---':k.t==='code'?'```\n'+k.x+'\n```':k.t==='todo'?(k.d?'- [x] ':'- [ ] ')+k.x:(M[k.t]||'')+k.x).join('\n\n')],{type:'text/markdown'}));
 save(p.n+'.html',new Blob(['<!doctype html><meta charset=utf-8><title>'+esc(p.n)+'</title><body style="font:16px/1.6 Inter,sans-serif;max-width:720px;margin:40px auto"><h1>'+esc(p.n)+'</h1>'+p.b.map(k=>k.t==='tb'?'<table border=1 cellpadding=6>'+(k.tb||[]).map(r=>'<tr>'+r.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join('')+'</table>':k.t==='cl'?'<div style="display:flex;gap:24px">'+(k.cols||[]).map(c=>'<div style="flex:1">'+esc(c)+'</div>').join('')+'</div>':k.t==='tg'?'<details><summary>'+esc(k.x)+'</summary>'+esc(k.y||'')+'</details>':k.t==='hr'?'<hr>':k.t==='todo'?`<p>${k.d?'☑':'☐'} ${esc(k.x)}</p>`:(t=>`<${t}>${esc(k.x)}</${t}>`)(T[k.t]||'p')).join('')],{type:'text/html'}))}
/* ---------- search, notifications, name, view-only ---------- */
function srch(q){q=q.toLowerCase();const o=[],has=t=>String(t||'').toLowerCase().includes(q);
 pages().forEach(p=>{has(p.n)&&o.push(['▦',p.n,'Page',p.id]);if(p.t==='d')(p.b||[]).forEach(k=>has(k.x)&&o.push(['☰',k.x,p.n,p.id]));if(p.t==='t')p.r.forEach(r=>has(r.join(' '))&&o.push(['▤',r.join(' · '),p.n,p.id]))});
 Object.values(S.it).forEach(i=>{const p=S.pg[i.p];p&&!p.del&&!i.del&&i.ty!=='cn'&&i.ty!=='img'&&i.ty!=='pen'&&(has(i.t)||(i.tg||[]).some(has))&&o.push(['▤',i.t||'',p.n,i.p,i.id])});
 Object.values(S.cm).forEach(c=>{const i=S.it[c.for],p=i&&S.pg[i.p];!c.del&&p&&!p.del&&!i.del&&has(c.t)&&o.push(['💬',c.t,p.n,i.p,i.id])});return o.slice(0,40)}
function go(p,id){$('#sr').hidden=$('#np').hidden=true;if(!S.pg[p])return;if(cur!==p)open(p);const i=id&&S.it[id];if(i&&S.pg[p].t==='b'){pick(id);V.x=cv.clientWidth/2-(i.x+i.w/2)*V.z;V.y=cv.clientHeight/2-(i.y+i.h/2)*V.z;applyV()}}
$('#sq').oninput=$('#sq').onfocus=()=>{const q=$('#sq').value.trim(),r=$('#sr');$('#np').hidden=true;if(!q){r.hidden=true;return}
 r.hidden=false;r.innerHTML=srch(q).map(o=>`<button data-p="${esc(o[3])}" data-i="${esc(o[4]||'')}"><small>${o[0]} ${esc(o[2])}</small><br>${esc(String(o[1]).slice(0,80))}</button>`).join('')||'<small>No matches</small>'};
$('#sq').onkeydown=e=>{if(e.key==='Escape'){$('#sr').hidden=true;e.target.blur()}else if(e.key==='Enter'){const b=$('#sr button');b&&go(b.dataset.p,b.dataset.i)}};
$('#sr').onclick=$('#np').onclick=e=>{const b=e.target.closest('button');b&&b.dataset.p&&go(b.dataset.p,b.dataset.i)};
addEventListener('pointerdown',e=>{if(!e.target.closest('#sr,#np,#sq,#bl,#tp,#tpb'))$('#sr').hidden=$('#np').hidden=$('#tp').hidden=true},true);
const SK='mosaic-seen:'+room;let seen=0;try{seen=+localStorage[SK]||0}catch(e){}if(!seen){seen=Date.now();try{localStorage[SK]=seen}catch(e){}}
const cmO=()=>Object.values(S.cm).filter(c=>!c.del&&c.a!==me.n&&S.it[c.for]&&!S.it[c.for].del).sort((a,b)=>b.ts-a.ts);
function bell(){const n=cmO().filter(c=>c.ts>seen).length,b=$('#bl');b.textContent='🔔'+(n?' '+n:'');b.classList.toggle('on-btn',n>0)}
$('#bl').onclick=()=>{const p=$('#np'),was=p.hidden;$('#sr').hidden=true;p.hidden=!was;if(!was)return;
 p.innerHTML='<b>Notifications</b>'+(cmO().slice(0,15).map(c=>`<button data-p="${esc(S.it[c.for].p)}" data-i="${esc(c.for)}" style="${c.ts>seen?'font-weight:700':''}"><small>${esc(c.a)} ${c.mn&&c.mn.includes(me.n)?'mentioned you':c.par?'replied':'commented'} · ${new Date(c.ts).toLocaleString()}</small><br>${esc(c.t.slice(0,80))}</button>`).join('')||'<small>Nothing yet. Comments from other people show up here.</small>');
 seen=Date.now();try{localStorage[SK]=seen}catch(e){}bell()};
const nmT=()=>$('#nm').textContent='👤 '+me.n;nmT();
$('#nm').onclick=()=>ask('Your name',n=>{me.n=n.slice(0,30);try{localStorage.mosaicName=me.n}catch(e){}nmT();beat()});
$('#cp2').onclick=async()=>{try{await navigator.clipboard.writeText($('#lnk2').value);$('#cp2').textContent='Copied'}catch(e){$('#lnk2').select()}setTimeout(()=>$('#cp2').textContent='Copy view-only link',1500)};$('#lnk2').onfocus=e=>e.target.select();
addEventListener('focusin',e=>{if(RO&&e.target.matches&&e.target.matches('[contenteditable=true],#tt input,#tbl input:not(#tq)'))e.target.blur()});bell();
/* ---------- share, theme, boot ---------- */
$('#sh').onclick=()=>{if(!CFG){$('#clp').hidden=false;$('#cm2').textContent='Connect cloud storage first; then Share makes a private link.';return}
 if(!HP.get('room')||room==='home'){const id=uid()+uid();try{localStorage['mosaic:'+id]=JSON.stringify(S)}catch(e){}location.hash='room='+id;location.reload();return}
 $('#lnk').value=location.origin+location.pathname+'#room='+room+'&sb='+encodeURIComponent(CFG.url)+'&key='+encodeURIComponent(CFG.key);$('#lnk2').value=$('#lnk').value+'&ro=1';$('#shp').textContent='Anyone with this link can view and edit this board. The room code in the link is the only secret, so share it carefully. The view-only link hides the editing tools, but it is not a lock: anyone who has the key can still write to the database.';$('#pop').classList.toggle('on')};
$('#clb').onclick=()=>{const p=$('#clp');p.hidden=!p.hidden;$('#cu').value=CFG&&CFG.own?CFG.url:'';$('#ck').value=CFG&&CFG.own?CFG.key:''};
$('#cs').onclick=()=>{const u=$('#cu').value.trim().replace(/\/+$/,''),k=$('#ck').value.trim();if(!SBR.test(u)||k.length<20){$('#cm2').textContent='Enter the https://xxxx.supabase.co URL and the anon public key';return}try{localStorage.mosaicCloud=JSON.stringify({url:u,key:k})}catch(e){}location.hash='';location.reload()};
$('#lnk').onfocus=e=>e.target.select();
$('#cp').onclick=async()=>{try{await navigator.clipboard.writeText($('#lnk').value);$('#cp').textContent='Copied'}catch(e){$('#lnk').select()}setTimeout(()=>$('#cp').textContent='Copy link',1500)};
const theme=t=>{document.documentElement.dataset.t=t;try{localStorage.mosaicTheme=t}catch(e){}};
let t0;try{t0=localStorage.mosaicTheme}catch(e){}
theme(t0||'dark');ttl.readOnly=RO;
$('#th').onclick=()=>theme(document.documentElement.dataset.t==='dark'?'light':'dark');
{const f=pages()[0];f?open(f.id):newPage('b')}
out({k:'hi'});beat();st();snap();verSave();cloudInit();cv.addEventListener('mousedown',e=>{if(e.button===1)e.preventDefault()});cv.addEventListener('auxclick',e=>e.preventDefault());
setInterval(()=>{beat();drawCur();st();bell()},3000);
