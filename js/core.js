/* Mosaic core: events, preferences, appearance, Discord notifications and the plugin system.
   Plugin authors: see PLUGINS.md. Everything here is exposed as window.Mosaic. */
(()=>{
'use strict';
const API_VERSION=2,VERSION='1.3.0';
const listeners={};
const M=window.Mosaic={
 version:VERSION,apiVersion:API_VERSION,schema:{layout:'mosaic.ui-layout/1'},
 on(ev,fn){(listeners[ev]=listeners[ev]||[]).push(fn);return()=>{listeners[ev]=(listeners[ev]||[]).filter(f=>f!==fn)}},
 emit(ev,data){(listeners[ev]||[]).slice().forEach(f=>{try{f(data)}catch(e){console.error('[mosaic] listener for',ev,e)}})},
};

/* ---------- hooks: plugins can transform values (e.g. the export manifest) ---------- */
const hooks={};
M.hooks={
 add(name,fn){(hooks[name]=hooks[name]||[]).push(fn);return()=>{hooks[name]=(hooks[name]||[]).filter(f=>f!==fn)}},
 async run(name,value,ctx){for(const f of(hooks[name]||[]).slice()){try{const r=await f(value,ctx);if(r!==undefined)value=r}catch(e){console.error('[mosaic] hook',name,e)}}return value}};

/* ---------- toast ---------- */
const ts=document.createElement('style');ts.textContent='#xtoast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:var(--tx);color:var(--bg);padding:9px 16px;border-radius:99px;font-size:13px;z-index:200;max-width:90vw;box-shadow:var(--sh)}.xpb{margin-right:6px}';document.head.appendChild(ts);
let toastEl,toastT;
M.toast=(t,o)=>{if(!toastEl){toastEl=document.createElement('div');toastEl.id='xtoast';toastEl.setAttribute('role','status');document.body.appendChild(toastEl)}
 toastEl.textContent=t;if(o&&o.action){const b=document.createElement('button');b.type='button';b.className='xta';b.textContent=o.action;b.onclick=()=>{try{o.run&&o.run()}catch(e){console.error(e)}toastEl.hidden=true};toastEl.append(' ',b)}
 toastEl.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>toastEl.hidden=true,o&&o.action?9000:3500)};

/* ---------- preferences (local, with the non-secret part synced to the account) ---------- */
const PK='mosaic:prefs',SYNC=['theme','accent','reduceMotion','files','design','perf','window','projects'];
let prefs={};try{prefs=JSON.parse(localStorage[PK]||'{}')||{}}catch(e){}
const walk=(o,path,make)=>{const k=path.split('.');for(let i=0;i<k.length-1;i++){if(o[k[i]]==null||typeof o[k[i]]!=='object'){if(!make)return undefined;o[k[i]]={}}o=o[k[i]]}return[o,k[k.length-1]]};
let syncT;
const push=()=>{clearTimeout(syncT);syncT=setTimeout(async()=>{const C=window.MosaicCtx;if(!C||!C.U||!C.A||C.U.guest)return;try{const o={};SYNC.forEach(k=>{if(prefs[k]!==undefined)o[k]=prefs[k]});await C.A.updateUser({data:{prefs:o}})}catch(e){}},1500)};
M.prefs={
 get(path,def){const w=walk(prefs,path,false);if(!w)return def;const v=w[0][w[1]];return v===undefined?def:v},
 set(path,value,opt){const[o,k]=walk(prefs,path,true);if(value===undefined)delete o[k];else o[k]=value;try{localStorage[PK]=JSON.stringify(prefs)}catch(e){}
  if(!(opt&&opt.quiet))M.emit('prefs:change',{path,value});if(SYNC.includes(path.split('.')[0])&&!(opt&&opt.noSync))push()},
 all:()=>JSON.parse(JSON.stringify(prefs))};

/* ---------- appearance: theme (system/light/dark), accent colour, reduced motion ---------- */
const DEFAULT_ACCENT='#b85c5c',mq=matchMedia('(prefers-color-scheme: dark)');let applying=false;
const motion=document.createElement('style');motion.id='xmotion';document.head.appendChild(motion);
function applyAppearance(){
 const t=M.prefs.get('theme');
 if(t&&typeof theme==='function'){const want=t==='system'?(mq.matches?'dark':'light'):t;if(document.documentElement.dataset.t!==want){applying=true;theme(want);themeObs.takeRecords();applying=false}}
 const a=M.prefs.get('accent',DEFAULT_ACCENT);
 for(const el of[document.documentElement,document.body]){if(!el)continue;if(a&&a.toLowerCase()!==DEFAULT_ACCENT)el.style.setProperty('--ac',a);else el.style.removeProperty('--ac')}
 motion.textContent=M.prefs.get('reduceMotion',false)?'*,*::before,*::after{transition:none!important;animation:none!important;scroll-behavior:auto!important}':''}
M.applyAppearance=applyAppearance;
mq.addEventListener&&mq.addEventListener('change',()=>{if(M.prefs.get('theme')==='system')applyAppearance()});
var themeObs=new MutationObserver(()=>{if(applying)return;const v=document.documentElement.dataset.t;if(M.prefs.get('theme')!==undefined&&M.prefs.get('theme')!==v)M.prefs.set('theme',v)});themeObs.observe(document.documentElement,{attributes:true,attributeFilter:['data-t']});
M.on('prefs:change',e=>{if(/^(theme|accent|reduceMotion)$/.test(e.path))applyAppearance()});
M.on('account:ready',()=>{try{const m=(window.MosaicCtx.U.user_metadata||{}).prefs;if(m&&typeof m==='object'){SYNC.forEach(k=>{if(m[k]!==undefined)M.prefs.set(k,m[k],{quiet:true,noSync:true})});applyAppearance();M.emit('prefs:change',{path:'*'})}}catch(e){}});
applyAppearance();

/* ---------- Discord webhook notifications (stored on this device only: the URL is a secret) ---------- */
const DK='mosaic:discord';
const dget=()=>{try{return JSON.parse(localStorage[DK]||'null')||{}}catch(e){return{}}};
const D={q:[],run:0};
M.discord={
 valid:u=>/^https:\/\/(?:discord|discordapp)\.com\/api\/webhooks\/\d+\/[\w-]+$/.test(String(u||'').trim()),
 get:()=>({url:'',name:'Mosaic',events:{export:true,comment:true,page:false},...dget(),events:{export:true,comment:true,page:false,...(dget().events||{})}}),
 set(c){try{localStorage[DK]=JSON.stringify(c)}catch(e){}},
 async send(title,text,color){const c=M.discord.get();if(!M.discord.valid(c.url))throw new Error('No valid Discord webhook is set.');
  const r=await fetch(c.url.trim(),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:String(c.name||'Mosaic').slice(0,80),allowed_mentions:{parse:[]},
   embeds:[{title:String(title).slice(0,200),description:String(text||'').slice(0,500),color:parseInt((color||M.prefs.get('accent',DEFAULT_ACCENT)).replace('#',''),16)||0x5b5bf0,timestamp:new Date().toISOString(),footer:{text:'Mosaic'}}]})});
  if(!r.ok)throw new Error('Discord answered '+r.status+(r.status===404?' (webhook deleted?)':''))},
 notify(event,title,text){const c=M.discord.get();if(!M.discord.valid(c.url)||!c.events[event])return;if(D.q.length>20)return;D.q.push([title,text]);pump()}};
async function pump(){if(D.run)return;D.run=1;while(D.q.length){const[a,b]=D.q.shift();try{await M.discord.send(a,b)}catch(e){console.warn('[mosaic] discord:',e.message)}await new Promise(r=>setTimeout(r,1200))}D.run=0}
M.on('export:done',d=>M.discord.notify('export','Export finished','**'+d.design+'** exported as '+d.format+' · '+d.count+' asset'+(d.count===1?'':'s')));
M.on('comment:added',d=>M.discord.notify('comment','New comment on “'+d.page+'”',(d.author?d.author+': ':'')+d.text));
M.on('page:created',d=>M.discord.notify('page','New page created','**'+d.name+'**'));

/* ---------- command palette registry (the palette itself lives in js/15.js) ---------- */
const CMDS=new Map();
M.commands={add(c){if(!c||!c.id||typeof c.run!=='function')throw new Error('A command needs an id and a run() function.');CMDS.set(c.id,{id:String(c.id),title:String(c.title||c.id),hint:c.hint?String(c.hint):'',group:String(c.group||'Commands'),run:c.run});return()=>CMDS.delete(c.id)},
 list:()=>[...CMDS.values()],run(id){const c=CMDS.get(id);if(c)c.run()},palette(){M.emit('palette:open',{})}};
M.panels={closeOthers(keep){document.querySelectorAll('.xpanel').forEach(p=>{if(p.id!==keep&&!p.hidden)p.querySelector('.xpx').click()})}};

/* ---------- observe the editor (no changes to behaviour) ---------- */
try{
 const p0=put;put=function(k,v){const isNew=v&&!v.del&&((k==='cm'&&!(S.cm&&S.cm[v.id]))||(k==='pg'&&!(S.pg&&S.pg[v.id])));const r=p0.apply(this,arguments);
  try{if(k==='it')M.emit('item:put',v);if(isNew){if(k==='cm'){const i=S.it[v.for];M.emit('comment:added',{text:v.t||'',author:v.a||'',page:(i&&S.pg[i.p]&&S.pg[i.p].n)||'a board'})}else if(k==='pg')M.emit('page:created',{name:v.n||'Untitled',kind:v.t})}}catch(e){}return r};
 const o0=open;open=function(){const r=o0.apply(this,arguments);try{M.emit('page:open',{id:cur})}catch(e){}return r};
}catch(e){console.warn('[mosaic] could not attach editor events',e)}

/* ======================= plugin system ======================= */
const PERMS={'project.read':'Read the boards, items and selection','project.write':'Change or add items','ui.toolbar':'Add buttons to the toolbar','ui.settings':'Add a settings section','export.targets':'Add export formats','export.hooks':'Modify what is exported','storage':'Keep its own small settings','network':'Contact the servers listed in its manifest','ui.panel':'Add a side panel','ui.commands':'Add commands to the command palette'};
const REG=new Map(),targets=new Map();
M.plugins={
 list:()=>[...REG.values()].map(r=>({id:r.m.id,name:r.m.name,version:r.m.version,description:r.m.description||'',author:r.m.author||'',permissions:r.m.permissions||[],hosts:r.m.hosts||[],userHosts:!!r.m.userHosts,source:r.src.store?'store':r.src.builtin?'bundled':'user folder',store:r.meta||null,state:r.state,error:r.error||'',enabled:enabled(r.m.id),settings:r.settings})),
 permissions:PERMS,
 isEnabled:id=>enabled(id),
 async enable(id){M.prefs.set('plugins.enabled.'+id,true,{noSync:true});await activate(REG.get(id));M.emit('plugins:changed')},
 async disable(id){M.prefs.set('plugins.enabled.'+id,false,{noSync:true});deactivate(REG.get(id));M.emit('plugins:changed')},
 reload:()=>discover(),
 validate:m=>validate(m,true),
 /* plugins installed from the Plugin store (js/store.js); they carry their own code */
 register(m,o){const bad=validate(m,true);if(bad)throw new Error(bad);const id=m.id,old=REG.get(id);
  if(old&&!old.src.store)throw new Error('A bundled plugin already uses the id “'+id+'”.');if(old)deactivate(old);
  const r={m,src:{store:true,builtin:false,base:''},code:String(o.code),meta:o.meta||{},state:'available',error:'',settings:[],disposers:[],def:null};
  REG.set(id,r);M.emit('plugins:changed');return enabled(id)?activate(r):undefined},
 unregister(id){const r=REG.get(id);if(!r||!r.src.store)return;deactivate(r);REG.delete(id);M.emit('plugins:changed')}};
const enabled=id=>M.prefs.get('plugins.enabled.'+id,false)===true;
M.exportTargets={list:()=>[...targets.entries()].map(([k,v])=>({key:k,label:v.label,pid:v.pid})),get:k=>targets.get(k)};

const ID=/^[a-z0-9][a-z0-9-]{2,40}$/,ENTRY=/^[\w][\w./-]*\.js$/;
function validate(m,st){
 if(!m||typeof m!=='object')return'Not a manifest object.';
 if(!ID.test(m.id||''))return'Bad id (use 3-41 characters: a-z, 0-9, -).';
 if(!m.name||String(m.name).length>60)return'Missing name.';
 if(!/^\d+\.\d+\.\d+/.test(m.version||''))return'Version must look like 1.0.0.';
 if(!st&&(!ENTRY.test(m.entry||'')||m.entry.includes('..')))return'Bad entry file.';
 if((m.apiVersion||1)>API_VERSION)return'Needs a newer Mosaic (plugin API '+m.apiVersion+').';
 for(const p of m.permissions||[])if(!PERMS[p])return'Unknown permission “'+p+'”.';
 if(m.hosts!==undefined&&(!Array.isArray(m.hosts)||m.hosts.some(h=>!/^https?:\/\/[\w.-]+(:(\d+|\*))?$/.test(h))))return'Bad hosts list.';
 if(m.userHosts!==undefined&&typeof m.userHosts!=='boolean')return'userHosts must be true or false.';
 if((m.permissions||[]).includes('network')&&!(m.hosts||[]).length&&!m.userHosts)return'The network permission needs a hosts list.';
 return''}
async function discover(){
 for(const src of[{url:'plugins/index.json',base:'plugins/',builtin:true},{url:'user-plugins/index.json',base:'user-plugins/',builtin:false}]){
  try{const r=await fetch(src.url,{cache:'no-store'});if(!r.ok)continue;const a=await r.json();
   (Array.isArray(a)?a:[]).forEach(m=>{const bad=validate(m);const id=m&&m.id;if(!id||(REG.has(id)&&REG.get(id).state==='active'))return;
    REG.set(id,{m,src,state:bad?'invalid':'available',error:bad,settings:[],disposers:[],def:null})})}catch(e){}}
 M.emit('plugins:changed');
 for(const r of REG.values())if(r.state==='available'&&enabled(r.m.id))await activate(r)}

function loadScript(r){return new Promise((ok,no)=>{
 if(r.def)return ok();
 const s=document.createElement('script');let url=null;
 if(r.code!=null){url=URL.createObjectURL(new Blob([r.code],{type:'text/javascript'}));s.src=url}else s.src=r.src.base+r.m.entry+'?v='+encodeURIComponent(r.m.version);
 s.dataset.pluginId=r.m.id;const done=()=>{if(url)try{URL.revokeObjectURL(url)}catch(e){}};
 s.onload=()=>{done();r.def?ok():no(new Error('The script did not call Mosaic.plugin().'))};s.onerror=()=>{done();no(new Error('Could not load '+(r.m.entry||r.m.id)))};document.head.appendChild(s)})}
M.plugin=def=>{const id=document.currentScript&&document.currentScript.dataset.pluginId;const r=id&&REG.get(id);
 if(!r)throw new Error('Mosaic.plugin() must be called from a plugin script loaded by Mosaic.');
 if(!def||def.id!==r.m.id||typeof def.activate!=='function')throw new Error('Plugin id must match its manifest and it needs an activate(api) function.');r.def=def};

async function activate(r){
 if(!r||r.state==='invalid'||r.state==='active')return;
 try{r.state='loading';await loadScript(r);r.disposers=[];r.settings=[];r.api=makeApi(r);await r.def.activate(r.api);r.state='active';r.error=''}
 catch(e){r.error=e.message||String(e);r.state='error';runDisposers(r);console.error('[mosaic] plugin',r.m.id,e)}
 M.emit('plugins:changed')}
function runDisposers(r){(r.disposers||[]).splice(0).forEach(f=>{try{f()}catch(e){}});r.settings=[]}
function deactivate(r){if(!r||r.state!=='active')return;try{r.def.deactivate&&r.def.deactivate()}catch(e){console.error(e)}runDisposers(r);r.state='available'}

const clone=o=>JSON.parse(JSON.stringify(o));
const hostOk=(list,u)=>(list||[]).some(h=>{try{const x=new URL(h.replace(':*',':0'));return x.protocol===u.protocol&&x.hostname===u.hostname&&(/:\*$/.test(h)||x.port===u.port)}catch(e){return false}});
const HK=id=>'mosaic:plugin-hosts:'+id,APH=id=>{try{const a=JSON.parse(localStorage[HK(id)]||'[]');return Array.isArray(a)?a.filter(x=>/^https:\/\/[\w.-]+(:\d+)?$/.test(x)).slice(0,20):[]}catch(e){return[]}};
const TXT_SKIP=['img','pen','bool','fl','swc','cn'];
const BLK={p:'',h1:'# ',h2:'## ',h3:'### ',todo:'[ ] ',q:'> ',code:'    '};
function pageText(p,max){const n=max||6000;let o='';
 if(p.t==='d')o=(p.b||[]).map(b=>(BLK[b.t]!==undefined?BLK[b.t]:'')+String(b.x||'')).join('\n');
 else if(p.t==='t')o=[(p.cols||[]).join('\t'),...(p.r||[]).map(r=>r.join('\t'))].join('\n');
 else o=Object.values(S.it).filter(i=>i.p===p.id&&!i.del&&!TXT_SKIP.includes(i.ty)&&String(i.t||'').trim()).sort((a,b)=>a.y-b.y||a.x-b.x).map(i=>'['+i.ty+(i.id?' '+i.id:'')+'] '+String(i.t).replace(/\n+/g,' / ')).join('\n');
 return o.length>n?o.slice(0,n)+'\n…(truncated)':o}

/* dialogs for plugins: small, animated, keyboard friendly */
function dlgOpen(o){return new Promise(res=>{const prev=document.activeElement,ov=document.createElement('div');ov.className='xdlg';
 ov.innerHTML='<div class="xdb" role="dialog" aria-modal="true"><div class="xdh"><b></b><button type="button" class="xdx" aria-label="Close">\u00d7</button></div><div class="xdc"></div><div class="xda"></div></div>';
 const box=ov.querySelector('.xdb'),body=ov.querySelector('.xdc'),act=ov.querySelector('.xda');ov.querySelector('b').textContent=String(o.title||'').slice(0,80);box.setAttribute('aria-label',String(o.title||'Dialog'));
 let done=false;const close=v=>{if(done)return;done=true;ov.classList.add('out');document.removeEventListener('keydown',kd,true);setTimeout(()=>{ov.remove();try{prev&&prev.focus&&prev.focus()}catch(e){}},160);res(v)};
 const kd=e=>{if(e.key==='Escape'){e.stopPropagation();close(o.cancelValue)}};document.addEventListener('keydown',kd,true);
 ov.addEventListener('pointerdown',e=>{if(e.target===ov)close(o.cancelValue)});ov.querySelector('.xdx').onclick=()=>close(o.cancelValue);
 if(o.render){try{o.render(body,close)}catch(e){body.textContent='This dialog failed: '+e.message}}else if(o.text){const q=document.createElement('p');q.textContent=String(o.text);body.appendChild(q)}
 (o.buttons||[]).forEach(b=>{const x=document.createElement('button');x.type='button';x.textContent=String(b.label||'OK').slice(0,30);if(b.primary)x.className='pri';x.onclick=()=>{let v=b.value;try{if(b.run)v=b.run(body,close)}catch(e){M.toast('Plugin error: '+e.message);return}if(!b.keepOpen)close(v)};act.appendChild(x)});
 document.body.appendChild(ov);requestAnimationFrame(()=>ov.classList.add('in'));const f=body.querySelector('input,textarea,select')||act.querySelector('.pri')||act.querySelector('button');f&&f.focus&&f.focus()})}
function makeApi(r){
 const id=r.m.id,ok=u=>hostOk(r.m.hosts,u)||(!!r.m.userHosts&&u.protocol==='https:'&&APH(id).includes(u.origin)),perms=new Set(r.m.permissions||[]),need=p=>{if(!perms.has(p))throw new Error('Plugin “'+id+'” did not request permission “'+p+'”.')},own=f=>{r.disposers.push(f);return f};
 const pg=()=>S.pg[cur];
 const confirmDlg=(text,o)=>dlgOpen({title:(o&&o.title)||r.m.name,text,cancelValue:false,buttons:[{label:(o&&o.cancel)||'Cancel',value:false},{label:(o&&o.ok)||'OK',value:true,primary:true}]});
 const promptDlg=(label,def,o)=>{let inp;return dlgOpen({title:(o&&o.title)||r.m.name,cancelValue:null,render(el,close){const l=document.createElement('label');l.textContent=String(label||'');inp=document.createElement(o&&o.multiline?'textarea':'input');if(!(o&&o.multiline))inp.type='text';inp.value=def==null?'':String(def);inp.style.cssText='display:block;width:100%;margin-top:6px';l.appendChild(inp);el.appendChild(l);inp.addEventListener('keydown',e=>{if(e.key==='Enter'&&!(o&&o.multiline)){e.preventDefault();close(inp.value)}})},buttons:[{label:'Cancel',value:null},{label:(o&&o.ok)||'OK',primary:true,run:()=>inp.value}]})};
 const modalDlg=o=>{need('ui.panel');let closeFn;const pr=dlgOpen({title:(o&&o.title)||r.m.name,cancelValue:undefined,render(el,close){closeFn=close;o.render&&o.render(el,close)},buttons:((o&&o.buttons)||[]).slice(0,4)});return{close:v=>closeFn&&closeFn(v),closed:pr}};

 return Object.freeze({
  id,version:VERSION,apiVersion:API_VERSION,schema:M.schema,
  on:(ev,fn)=>own(M.on(ev,fn)),
  toast:M.toast,
  prefs:Object.freeze({get:(p,d)=>M.prefs.get(p,d)}),
  storage:Object.freeze({
   get(k,d){need('storage');try{const v=localStorage['mosaic:plugin:'+id+':'+k];return v===undefined?d:JSON.parse(v)}catch(e){return d}},
   set(k,v){need('storage');try{localStorage['mosaic:plugin:'+id+':'+k]=JSON.stringify(v)}catch(e){}},
   remove(k){need('storage');try{delete localStorage['mosaic:plugin:'+id+':'+k]}catch(e){}}}),
  project:Object.freeze({
   page:()=>{need('project.read');const p=pg();return p?{id:p.id,name:p.n,type:p.t,kind:p.k||'board'}:null},
   items:()=>{need('project.read');return clone(Object.values(S.it).filter(i=>i.p===cur&&!i.del&&i.ty!=='cn'))},
   pages:()=>{need('project.read');return pages().map(p=>({id:p.id,name:p.n,type:p.t==='b'?'board':p.t==='d'?'doc':'table',parent:p.par||null}))},
   pageText:(pid,max)=>{need('project.read');const p=S.pg[pid];if(!p||p.del)throw new Error('No such page');return pageText(p,max)},
   search:(q,max)=>{need('project.read');q=String(q||'').toLowerCase().trim();if(!q)return[];const out=[];
    for(const p of pages()){for(const l of pageText(p,200000).split('\n'))if(l.toLowerCase().includes(q)){out.push({page:p.id,pageName:p.n,line:l.slice(0,240)});if(out.length>=(max||30))return out}}return out},
   addPage(o){need('project.write');if(RO)throw new Error('This project is read-only');const t=o&&o.type==='doc'?'d':o&&o.type==='table'?'t':'b',
    p={id:uid(),t,n:String((o&&o.name)||(t==='b'?'Untitled board':t==='t'?'Untitled table':'Untitled doc')).slice(0,80),o:Math.max(0,...pages().map(q=>q.o))+1};
    if(t==='d')p.b=[{id:uid(),t:'p',x:''}];if(t==='t'){p.cols=['Name','Status','Notes'];p.r=[['','','']]}put('pg',p);renderList();return p.id},
   appendDoc(pid,blocks){need('project.write');if(RO)throw new Error('This project is read-only');const p=S.pg[pid];if(!p||p.del||p.t!=='d')throw new Error('That page is not a doc');
    const add=(Array.isArray(blocks)?blocks:[]).slice(0,200).map(b=>({id:uid(),t:BLK[b&&b.t]!==undefined?b.t:'p',x:String((b&&b.x)||'').slice(0,5000)}));
    const cur0=(p.b||[]);p.b=(cur0.length===1&&!cur0[0].x?[]:cur0).concat(add);put('pg',p);try{yAll()}catch(e){}if(cur===pid&&typeof renderDoc==='function')try{renderDoc()}catch(e){}return add.length},

   openPage(pid){need('project.read');const p=S.pg[pid];if(!p||p.del)throw new Error('No such page');open(pid)},
   select(ids){need('project.read');const a=(Array.isArray(ids)?ids:[ids]).filter(k=>S.it[k]&&!S.it[k].del&&S.it[k].p===cur);pick(a.length?a:null);return a.length},
   renamePage(pid,name){need('project.write');if(RO)throw new Error('This project is read-only');const p=S.pg[pid];if(!p||p.del)throw new Error('No such page');p.n=String(name||'').slice(0,80)||p.n;put('pg',p);renderList()},
   deleteItem(itemId){need('project.write');if(RO)throw new Error('This project is read-only');const i=S.it[itemId];if(!i||i.del)throw new Error('No such item');if(i.lock)throw new Error('That item is locked');const e=els.get(itemId);e&&e.remove();els.delete(itemId);del('it',itemId);Object.values(S.it).forEach(c=>c.ty==='cn'&&!c.del&&(c.a===itemId||c.b===itemId)&&del('it',c.id))},
   table(pid){need('project.read');const p=S.pg[pid];if(!p||p.del||p.t!=='t')throw new Error('That page is not a table');return{columns:clone(p.cols||[]),rows:clone(p.r||[])}},
   addTableRows(pid,rows){need('project.write');if(RO)throw new Error('This project is read-only');const p=S.pg[pid];if(!p||p.del||p.t!=='t')throw new Error('That page is not a table');const n=(p.cols||[]).length,add=(Array.isArray(rows)?rows:[]).slice(0,500).map(r=>Array.from({length:n},(_,k)=>String((Array.isArray(r)?r[k]:'')==null?'':(Array.isArray(r)?r[k]:'')).slice(0,2000)));
    const cur0=p.r||[];p.r=(cur0.length===1&&cur0[0].every(x=>!x)?[]:cur0).concat(add);put('pg',p);if(cur===pid&&typeof renderTbl==='function')try{renderTbl()}catch(e){}return add.length},
   snapshot(){need('project.read');return clone({pages:pages(),items:Object.values(S.it).filter(i=>!i.del)})},
   selection:()=>{need('project.read');return[...SL].filter(k=>S.it[k]&&!S.it[k].del).map(k=>clone(S.it[k]))},
   updateItem(itemId,patch){need('project.write');const i=S.it[itemId];if(!i||i.del)throw new Error('No such item');if(RO)throw new Error('This project is read-only');Object.assign(i,clone(patch));put('it',i);const e=els.get(itemId);e&&paint(e,i)},
   addItem(o){need('project.write');if(RO)throw new Error('This project is read-only');const i={id:uid(),p:cur,z:1,x:0,y:0,w:120,h:80,c:'',t:'',ty:'rect',...clone(o)};put('it',i);sync();return i.id}}),

  env:Object.freeze({get isTouch(){return matchMedia('(pointer:coarse)').matches},get isPhone(){return matchMedia('(max-width:760px)').matches},get theme(){return document.documentElement.dataset.t==='light'?'light':'dark'},get readOnly(){return !!RO},get isApp(){return !!(window.MosaicNative||window.qt||/MosaicApp/i.test(navigator.userAgent))}}),
  download(name,data,mime){need('export.targets');const b=data instanceof Blob?data:new Blob([data],{type:mime||'application/octet-stream'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=String(name||'download').replace(/[\\/:*?"<>|]/g,'_').slice(0,120);document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)},
  clipboard:Object.freeze({async writeText(t){try{await navigator.clipboard.writeText(String(t));return true}catch(e){return false}}}),
  fetch:(url,init)=>{need('network');let u;try{u=new URL(url)}catch(e){throw new Error('Bad address')}
   if(!ok(u))throw new Error('Plugin “'+id+'” is not allowed to contact '+u.origin);return fetch(url,init)},
  network:Object.freeze({
   isAllowed:url=>{try{return ok(new URL(url))}catch(e){return false}},
   approved:()=>r.m.userHosts?APH(id):[],
   /* asks the user once; https servers only; remembered until revoked */
   async request(url){need('network');let u;try{u=new URL(url)}catch(e){return false}
    if(ok(u))return true;if(!r.m.userHosts||u.protocol!=='https:')return false;
    if(!confirm('Allow “'+r.m.name+'” to send requests to '+u.origin+'?\n\nThis is a server you chose. Anything the plugin sends there leaves this device. You can take this back later in Settings.'))return false;
    const a=APH(id);if(!a.includes(u.origin))a.push(u.origin);try{localStorage[HK(id)]=JSON.stringify(a.slice(-20))}catch(e){return false}M.emit('plugins:changed');return true},
   revoke(origin){try{localStorage[HK(id)]=JSON.stringify(APH(id).filter(x=>x!==origin));M.emit('plugins:changed')}catch(e){}}}),
  commands:Object.freeze({add(c){need('ui.commands');return own(M.commands.add({...c,id:id+':'+c.id,group:c.group||r.m.name}))}}),
  ui:Object.freeze({confirm:confirmDlg,prompt:promptDlg,modal:modalDlg,panel(o){need('ui.panel');const pid='xpanel-'+id+'-'+String((o&&o.id)||'main').replace(/[^\w-]/g,''),el=document.createElement('aside');
    el.id=pid;el.className='xpanel';el.hidden=true;el.setAttribute('role','complementary');el.setAttribute('aria-label',String((o&&o.title)||r.m.name));
    el.innerHTML='<div class="xph"><b></b><span class="grow"></span><button type="button" class="xpx" aria-label="Close panel"></button></div><div class="xpbd"></div>';
    el.querySelector('b').textContent=String((o&&o.title)||r.m.name).slice(0,40);el.querySelector('.xpx').innerHTML=window.MosaicIcons?MosaicIcons.svg('x'):'×';document.body.appendChild(el);
    const body=el.querySelector('.xpbd');let drawn=false;
    const h={el:body,get isOpen(){return!el.hidden},
     open(){M.panels.closeOthers(pid);el.hidden=false;document.body.classList.add('xpo');if(!drawn){drawn=true;try{o.render&&o.render(body)}catch(e){body.textContent='This panel failed: '+e.message}}try{o.onOpen&&o.onOpen(body)}catch(e){}},
     close(){el.hidden=true;if(![...document.querySelectorAll('.xpanel')].some(x=>!x.hidden))document.body.classList.remove('xpo');try{o.onClose&&o.onClose()}catch(e){}},
     toggle(){el.hidden?h.open():h.close()}};
    el.querySelector('.xpx').onclick=h.close;own(()=>{el.remove();if(![...document.querySelectorAll('.xpanel')].some(x=>!x.hidden))document.body.classList.remove('xpo')});return h}}),
  hooks:Object.freeze({add:(name,fn)=>{need('export.hooks');return own(M.hooks.add(name,fn))}}),
  toolbar:Object.freeze({add(o){need('ui.toolbar');const b=document.createElement('button');b.className='xpb';b.dataset.plugin=id;if(o.icon&&window.MosaicIcons){b.innerHTML=MosaicIcons.svg(String(o.icon))+'<span></span>';b.lastChild.textContent=String(o.label||'').slice(0,24)}else b.textContent=String(o.label||id).slice(0,24);if(o.title)b.title=String(o.title);
    const show=()=>{const f=typeof isF==='function'&&isF(),hid=$('#exb').hidden;b.hidden=hid||(o.where==='design'&&!f)};
    b.onclick=()=>{try{o.run&&o.run()}catch(e){M.toast('Plugin error: '+e.message)}};$('#exb').parentNode.insertBefore(b,$('#exb'));show();const off=M.on('page:open',show);own(()=>{off();b.remove()});return b}}),
  settings:Object.freeze({add(o){need('ui.settings');const s={title:String(o.title||'Settings'),render:o.render};r.settings.push(s);own(()=>{r.settings=r.settings.filter(x=>x!==s)});M.emit('plugins:changed')}}),
  exports:Object.freeze({addTarget(o){need('export.targets');if(!o||!/^[a-z0-9-]+$/.test(o.id||'')||typeof o.build!=='function')throw new Error('Export target needs an id and a build(ctx) function.');
    const key='plugin:'+id+':'+o.id;targets.set(key,{label:String(o.label||o.id),build:o.build,pid:id});M.emit('exports:changed');own(()=>{targets.delete(key);M.emit('exports:changed')})}})})}

setTimeout(discover,0);
})();
