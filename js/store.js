/* Mosaic Plugin store (loaded after settings.js).
   - Browse approved plugins, install / update / uninstall them (code is checked against the approved SHA-256).
   - Anyone with an account can submit a plugin; reviewers (the owner and anyone with Dev tools) approve it.
   - Installed store plugins live in this browser/app and load through Mosaic.plugins.register().
   Data lives in the central Supabase table mosaic_plugins (setup/plugin-store.sql). */
(()=>{
'use strict';
const M=window.Mosaic;if(!M||!M.plugins)return;
const KEY='mosaic:store-plugins',MAX_CODE=300000;
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const C=()=>window.MosaicCtx||{},hash=s=>MZ.sha(String(s)),toast=(t,o)=>{try{M.toast(t,o)}catch(e){}};
const date=d=>{try{return d?new Date(d).toLocaleDateString([], {dateStyle:'medium'}):''}catch(e){return''}};
const ic=n=>window.MosaicIcons?MosaicIcons.svg(n):'';

/* ---------- what is installed (on this device) ---------- */
const readAll=()=>{try{const raw=localStorage[KEY];return raw?JSON.parse(window.MosaicPack?MosaicPack.unpack(raw):raw)||{}:{}}catch(e){return{}}};
const writeAll=o=>{try{const j=JSON.stringify(o);localStorage[KEY]=window.MosaicPack?MosaicPack.pack(j,true):j;return true}catch(e){return false}};
const sv=v=>String(v).split('.').map(n=>parseInt(n,10)||0);
const newer=(a,b)=>{const x=sv(a),y=sv(b);for(let i=0;i<3;i++)if((x[i]||0)!==(y[i]||0))return(x[i]||0)>(y[i]||0);return false};
const broken=new Set();

/* ---------- code scan: helps reviewers (and authors) see what a plugin does ---------- */
const RULES=[
 ['high',/\beval\s*\(|\bnew\s+Function\b|(^|[^.\w])Function\s*\(/,'Runs code built from strings (eval / new Function)'],
 ['high',/(^|[^.\w])fetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bsendBeacon\b|\bimportScripts\b|(^|[^.\w])import\s*\(/,'Makes network requests without api.fetch (bypasses the host list)'],
 ['high',/MosaicCtx|mosaic-acct|access_token|refresh_token|\.auth\.|updateUser|\bsignOut\b|(^|[^.\w])SB\s*\./,'Touches the account or the login session'],
 ['high',/document\.cookie/,'Reads cookies'],
 ['high',/window\.open\s*\(|(^|[^.\w])location\s*(\.href|\.assign|\.replace)?\s*=[^=]|location\.(assign|replace)\s*\(/,'Navigates away or opens windows'],
 ['med',/\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b/,'Uses browser storage directly (api.storage is the safe way)'],
 ['med',/createElement\(\s*['"]script['"]\s*\)|document\.write|<script/i,'Injects scripts'],
 ['med',/\.innerHTML\s*=|insertAdjacentHTML/,'Writes HTML (check that it escapes text from projects)'],
 ['med',/postMessage|BroadcastChannel/,'Messages other windows or tabs'],
 ['med',/Mosaic\.prefs|Mosaic\.plugins|window\.Mosaic\b/,'Reaches into Mosaic internals instead of the plugin api']];
function scan(code){const lines=String(code).split('\n'),out=[];
 RULES.forEach(([sev,re,msg])=>{const at=[];lines.forEach((l,i)=>{if(re.test(l))at.push(i+1)});if(at.length)out.push({sev,msg,lines:at})});
 const apis=[...new Set((String(code).match(/\bapi\.(?:on|toast|prefs|storage|project|toolbar|settings|commands|ui|hooks|exports|fetch|network|version)(?:\.[a-zA-Z]+)?(?![\w.])/g)||[]))].sort();return{flags:out,apis}}
const flagHtml=s=>s.flags.length?'<div class="xsf">'+s.flags.map(f=>'<div class="xsf-'+f.sev+'"><b>'+(f.sev==='high'?'Look closely':'Check')+':</b> '+E(f.msg)+' <small>(line'+(f.lines.length>1?'s':'')+' '+f.lines.slice(0,8).join(', ')+(f.lines.length>8?'…':'')+')</small></div>').join('')+'</div>':'<div class="xsf"><div class="xsf-ok">Nothing unusual found by the automatic scan. That does not replace reading the code.</div></div>';
function codeHtml(code,s){const bad=new Set();s.flags.forEach(f=>f.lines.forEach(n=>bad.add(n)));
 return'<div class="xcode" tabindex="0" aria-label="Plugin source code">'+String(code).split('\n').map((l,i)=>'<span class="'+(bad.has(i+1)?'fl':'')+'"><i>'+(i+1)+'</i>'+E(l)+'\n</span>').join('')+'</div>'}

/* ---------- boot: load installed store plugins (each is verified first) ---------- */
function boot(){const all=readAll();
 Object.entries(all).forEach(([pid,p])=>{try{
  if(!p||hash(p.code)!==p.sha256){broken.add(pid);toast('A plugin from the store failed its integrity check and was not loaded: '+((p&&p.manifest&&p.manifest.name)||pid));return}
  M.plugins.register(p.manifest,{code:p.code,meta:{version:p.version,approvedAt:p.approvedAt,author:p.owner_name,rowId:p.rowId,sha256:p.sha256}})}catch(e){console.error('[mosaic] store plugin',pid,e)}})}

/* ---------- server calls ---------- */
const SB=()=>C().SB;
async function fetchApproved(){const{data,error}=await SB().from('mosaic_plugins').select('id,pid,version,name,description,author,owner_name,manifest,sha256,installs,created_at,reviewed_at,status').eq('status','approved').order('created_at',{ascending:false}).limit(300);
 if(error)throw error;const by={};(data||[]).forEach(r=>{if(!by[r.pid]||newer(r.version,by[r.pid].version))by[r.pid]=r});return Object.values(by)}
async function pendingCount(){try{const r=await SB().from('mosaic_plugins').select('id',{count:'exact',head:true}).eq('status','pending');return r.error?0:(r.count||0)}catch(e){return 0}}

/* ---------- install / uninstall ---------- */
const chips=m=>'<div class="row">'+(m.permissions||[]).map(x=>'<span class="chip" title="'+E(M.plugins.permissions[x]||'')+'">'+E(x)+'</span>').join('')+'</div>'
 +((m.hosts||[]).length||m.userHosts?'<div class="row"><small class="msg">Contacts:</small>'+(m.hosts||[]).map(h=>'<span class="chip">'+E(h)+'</span>').join('')+(m.userHosts?'<span class="chip">any https server you approve</span>':'')+'</div>':'');
async function install(sum,el,back){
 let row;try{const r=await SB().from('mosaic_plugins').select('*').eq('id',sum.id).eq('status','approved').single();if(r.error)throw r.error;row=r.data}catch(e){toast('Could not download the plugin: '+(e.message||e));return}
 const m=row.manifest||{};let bad='';
 if(hash(row.code)!==row.sha256)bad='The code does not match the version that was approved, so it was not installed.';
 else if(m.id!==row.pid||m.version!==row.version)bad='The manifest does not match the store entry.';
 else bad=M.plugins.validate(m);
 if(bad){toast('Not installed: '+bad);return}
 const cur=readAll()[row.pid];
 el.innerHTML='<div class="cd"><h4 style="margin:0">'+(cur?'Update':'Install')+' “'+E(row.name)+'” v'+E(row.version)+'?</h4><span class="msg">by '+E(row.owner_name||row.author||'unknown')+' · approved '+E(date(row.reviewed_at))+'</span>'
  +'<b>It will be able to:</b><ul class="xpl">'+(m.permissions||[]).map(x=>'<li><b>'+E(x)+'</b> · '+E(M.plugins.permissions[x]||'')+'</li>').join('')+(m.permissions&&m.permissions.length?'':'<li>Nothing beyond running.</li>')+'</ul>'
  +((m.hosts||[]).length||m.userHosts?'<b>Servers it may contact:</b><div class="row">'+(m.hosts||[]).map(h=>'<span class="chip">'+E(h)+'</span>').join('')+(m.userHosts?'<span class="chip">any https server you approve, one at a time</span>':'')+'</div>':'')
  +'<div class="xwarn">Plugins run with the same access as Mosaic itself: they can read and change your projects. Reviewers read each plugin before it is listed, but a review can miss things. Only install plugins you trust.</div>'
  +'<label class="ck"><input type="checkbox" id="xi-ok"><span>I understand and want to '+(cur?'update':'install')+' this plugin.</span></label><div class="row"><button class="pri" id="xi-go" disabled>'+(cur?'Update':'Install')+'</button><button id="xi-no">Cancel</button></div></div>';
 const ok=el.querySelector('#xi-ok'),go=el.querySelector('#xi-go');ok.onchange=()=>go.disabled=!ok.checked;el.onclick=null;
 el.querySelector('#xi-no').onclick=back;
 go.onclick=async()=>{go.disabled=true;const all=readAll();
  all[row.pid]={manifest:m,code:row.code,sha256:row.sha256,version:row.version,rowId:row.id,owner_name:row.owner_name||row.author||'',approvedAt:row.reviewed_at,installedAt:Date.now()};
  if(!writeAll(all)){toast('This device has no room to store the plugin.');go.disabled=false;return}
  broken.delete(row.pid);
  try{await M.plugins.register(m,{code:row.code,meta:{version:row.version,approvedAt:row.reviewed_at,author:row.owner_name,rowId:row.id,sha256:row.sha256}})}catch(e){toast('Installed, but it could not start: '+e.message)}
  try{await SB().rpc('plugin_install',{p_id:row.id})}catch(e){}
  toast('“'+row.name+'” '+(cur?'updated':'installed')+'. Turn it on under Plugins.');back()}}
async function uninstall(id){
 if(!confirm('Uninstall this plugin and delete the settings and keys it saved on this device?'))return false;
 const all=readAll();delete all[id];writeAll(all);broken.delete(id);M.plugins.unregister(id);
 try{M.prefs.set('plugins.enabled.'+id,undefined,{noSync:true})}catch(e){}
 try{const del=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&(k.startsWith('mosaic:plugin:'+id+':')||k==='mosaic:plugin-hosts:'+id))del.push(k)}del.forEach(k=>localStorage.removeItem(k))}catch(e){}
 toast('Plugin uninstalled.');return true}

/* ---------- views ---------- */
const reset=el=>{el.onclick=el.onchange=el.oninput=el.onsubmit=null};
const TABS=[['store','Browse'],['submit','Submit a plugin'],['mine','My submissions']];
function head(active,rev){return'<div class="row xsh"><button data-n="back">← Plugins</button><b>Plugin store</b><span class="grow"></span></div><div class="xtabs2" role="tablist">'
 +TABS.concat(rev?[['review','Review queue']]:[]).map(([v,t])=>'<button role="tab" data-n="'+v+'" aria-selected="'+(v===active)+'">'+t+'</button>').join('')+'<button data-n="docs">Docs</button></div>'}
let tok=0;
function show(el,view,back){
 reset(el);el.dataset.sv='1';const T=++tok,rev=!!C().DEV;
 const bk=()=>{reset(el);delete el.dataset.sv;back&&back()},go=v=>show(el,v,back);
 const nav=e=>{const b=e.target.closest('button[data-n]');if(!b)return false;const n=b.dataset.n;if(n==='back')bk();else if(n==='docs')docs();else go(n);return true};
 if(view==='store')return storeView(el,nav,go,T);if(view==='submit')return submitView(el,nav,go,T);if(view==='mine')return mineView(el,nav,T);if(view==='review'&&rev)return reviewView(el,nav,T);
 go('store')}

async function storeView(el,nav,go,T){
 el.innerHTML=head('store',!!C().DEV)+'<div class="row"><input type="search" id="xs-q" class="grow" placeholder="Search plugins" aria-label="Search plugins"></div><div id="xs-in"></div><div id="xs-list"><p class="msg">Loading the store…</p></div>';
 let rows=[],err='';
 try{rows=await fetchApproved()}catch(e){err=(navigator.onLine===false?'You are offline.':(e.message||'Try again in a moment.'))+(/does not exist|schema cache/i.test(e.message||'')?' The store tables are not set up yet: run setup/plugin-store.sql in the central Supabase.':'')}
 if(T!==tok)return;
 const draw=()=>{const q=el.querySelector('#xs-q').value.trim().toLowerCase(),inst=readAll();
  const mine=Object.entries(inst).map(([pid,p])=>{const r=rows.find(x=>x.pid===pid),upd=!!(r&&newer(r.version,p.version)),gone=!err&&!r;
   return'<div class="cd" data-pid="'+E(pid)+'"><div class="row"><b>'+E(p.manifest.name)+'</b><small class="msg">installed v'+E(p.version)+'</small>'+(upd?'<span class="bdg warn">update v'+E(r.version)+'</span>':'')+(gone?'<span class="bdg err">no longer in the store</span>':'')+(broken.has(pid)?'<span class="bdg err">failed its integrity check</span>':'')+'<span class="grow"></span>'+(upd?'<button class="pri" data-a="inst">Update</button>':'')+'<button class="xdg" data-a="un">Uninstall</button></div>'+(gone?'<span class="msg">A reviewer removed it or it was replaced. Uninstall it if you no longer trust it.</span>':'')+'</div>'}).join('');
  el.querySelector('#xs-in').innerHTML=mine?'<h4>Installed</h4>'+mine:'';
  const L=rows.filter(r=>!q||(r.name+' '+r.description+' '+r.pid+' '+(r.owner_name||'')).toLowerCase().includes(q));
  el.querySelector('#xs-list').innerHTML=err?'<div class="cd"><b>The store could not be loaded.</b><span class="msg">'+E(err)+'</span></div>'
   :(rows.length?'<h4>Available</h4>':'')+(L.map(r=>{const m=r.manifest||{},cur=inst[r.pid];
    return'<div class="cd" data-row="'+E(r.id)+'"><div class="row"><b>'+E(r.name)+'</b><small class="msg">v'+E(r.version)+' · by '+E(r.owner_name||r.author||'unknown')+' · '+(r.installs||0)+' install'+(r.installs===1?'':'s')+'</small><span class="grow"></span>'+(cur?(newer(r.version,cur.version)?'<button class="pri" data-a="inst">Update</button>':'<span class="bdg ok">installed</span>'):'<button class="pri" data-a="inst">Install</button>')+'</div><span class="msg">'+E(r.description)+'</span>'+chips(m)+'<small class="msg">Approved '+E(date(r.reviewed_at))+'</small></div>'}).join('')||(rows.length?'<p class="msg">No plugins match.</p>':'<p class="msg">Nothing is in the store yet. Be the first: use <b>Submit a plugin</b>.</p>'))};
 draw();
 el.oninput=e=>{if(e.target.id==='xs-q')draw()};
 el.onclick=async e=>{if(nav(e))return;const b=e.target.closest('button[data-a]');if(!b)return;const a=b.dataset.a,pidEl=b.closest('[data-pid]'),rowEl=b.closest('[data-row]');
  if(a==='un'){if(await uninstall(pidEl.dataset.pid))draw();return}
  const r=rows.find(x=>rowEl?x.id===rowEl.dataset.row:x.pid===pidEl.dataset.pid);if(r)install(r,el,()=>go('store'))}}

function readFile(inp,cb){const f=inp.files&&inp.files[0];if(!f)return;if(f.size>MAX_CODE+20000){toast('That file is too large.');return}const r=new FileReader();r.onload=()=>cb(String(r.result));r.readAsText(f)}
function submitView(el,nav,go,T){
 const ctx=C();if(!ctx.U||ctx.U.guest){el.innerHTML=head('submit',!!ctx.DEV)+'<div class="cd"><b>Sign in to submit a plugin</b><span class="msg">You need an account to upload plugins (guests can browse and install). Use “Sign in or create account” in the menu.</span></div>';el.onclick=nav;return}
 const perms=M.plugins.permissions;
 el.innerHTML=head('submit',!!ctx.DEV)+'<p class="msg">Upload a plugin for review. A reviewer reads the code before it is listed. A submission cannot be edited; to change it submit a new version. Plugin API: <button class="xlk2" data-n="docs">Docs</button>.</p>'
 +'<form id="xu-f" class="xu"><div class="row"><label class="grow">Name<input id="xu-name" maxlength="60" required></label><label>Version<input id="xu-ver" value="1.0.0" pattern="\\d+\\.\\d+\\.\\d+" required size="8"></label></div>'
 +'<label>Plugin id (3 to 41 characters: a-z, 0-9, -)<input id="xu-id" maxlength="41" pattern="[a-z0-9][a-z0-9-]{2,40}" required></label>'
 +'<label>Short description<input id="xu-desc" maxlength="400" required></label>'
 +'<label>Author name<input id="xu-by" maxlength="60" value="'+E(ctx.nm(ctx.U))+'"></label>'
 +'<fieldset><legend>Permissions it needs</legend>'+Object.keys(perms).map(k=>'<label class="ck"><input type="checkbox" name="xu-p" value="'+E(k)+'"><span><b>'+E(k)+'</b> · '+E(perms[k])+'</span></label>').join('')+'</fieldset>'
 +'<label>Servers it may contact (one per line, e.g. <code>https://api.example.com</code> or <code>http://127.0.0.1:*</code>)<textarea id="xu-hosts" rows="3" spellcheck="false"></textarea></label>'
 +'<label class="ck"><input type="checkbox" id="xu-uh"><span>Let people approve extra https servers one by one (<code>userHosts</code>)</span></label>'
 +'<div class="row"><label>Load manifest.json (optional)<input type="file" id="xu-mf" accept=".json,application/json"></label><label>Load main.js<input type="file" id="xu-cf" accept=".js,text/javascript"></label></div>'
 +'<label>Code (the contents of main.js)<textarea id="xu-code" rows="12" spellcheck="false" class="xmono" required></textarea></label>'
 +'<div id="xu-out" role="status"></div><div class="row"><button type="button" id="xu-chk">Check</button><button class="pri" id="xu-go">Submit for review</button></div></form>';
 const $=s=>el.querySelector(s);
 $('#xu-name').oninput=()=>{if(!$('#xu-id').dataset.t){$('#xu-id').value=$('#xu-name').value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,41)}};
 $('#xu-id').oninput=()=>{$('#xu-id').dataset.t='1'};
 $('#xu-mf').onchange=()=>readFile($('#xu-mf'),t=>{try{const m=JSON.parse(t);$('#xu-name').value=m.name||'';$('#xu-id').value=m.id||'';$('#xu-id').dataset.t='1';$('#xu-ver').value=m.version||'1.0.0';$('#xu-desc').value=m.description||'';if(m.author)$('#xu-by').value=m.author;
   el.querySelectorAll('input[name=xu-p]').forEach(i=>i.checked=(m.permissions||[]).includes(i.value));$('#xu-hosts').value=(m.hosts||[]).join('\n');$('#xu-uh').checked=!!m.userHosts}catch(e){toast('That is not valid JSON.')}});
 $('#xu-cf').onchange=()=>readFile($('#xu-cf'),t=>{$('#xu-code').value=t});
 const build=()=>{const manifest={id:$('#xu-id').value.trim(),name:$('#xu-name').value.trim(),version:$('#xu-ver').value.trim(),apiVersion:M.apiVersion||1,author:$('#xu-by').value.trim(),description:$('#xu-desc').value.trim(),
   permissions:[...el.querySelectorAll('input[name=xu-p]:checked')].map(i=>i.value)},hosts=$('#xu-hosts').value.split('\n').map(s=>s.trim()).filter(Boolean);
  if(hosts.length)manifest.hosts=hosts;if($('#xu-uh').checked)manifest.userHosts=true;return manifest};
 const check=()=>{const m=build(),code=$('#xu-code').value.replace(/\r\n/g,'\n').replace(/\n+$/,''),errs=[],warn=[];
  const bad=M.plugins.validate(m);if(bad)errs.push(bad);
  if(!/^\d+\.\d+\.\d+$/.test(m.version))errs.push('Version must be exactly like 1.0.0.');
  if(m.description.length<10)errs.push('Write a description of at least 10 characters.');
  if(m.id==='example-asset-report'||M.plugins.list().some(p=>p.id===m.id&&p.source==='bundled'))errs.push('That id is used by a bundled plugin.');
  if(code.length<20)errs.push('Paste or load the plugin code.');if(code.length>MAX_CODE)errs.push('The code is over '+MAX_CODE+' characters.');
  if(code&&!/Mosaic\.plugin\s*\(/.test(code))errs.push('The code must call Mosaic.plugin({ id, activate(api){…} }).');
  const lit=/Mosaic\.plugin\s*\(\s*\{[\s\S]*?\bid\s*:\s*['"]([^'"]+)['"]/.exec(code);if(code&&lit&&lit[1]!==m.id)errs.push('The id in the code (“'+lit[1]+'”) must match the plugin id.');
  const s=scan(code);if(/\bapi\.fetch\b/.test(code)&&!m.permissions.includes('network'))warn.push('The code uses api.fetch but the manifest does not ask for the network permission.');
  if(/\bapi\.project\.(addItem|updateItem|addPage|appendDoc)\b/.test(code)&&!m.permissions.includes('project.write'))warn.push('The code changes the project but the manifest does not ask for project.write.');
  $('#xu-out').innerHTML=(errs.length?'<div class="xsf"><div class="xsf-high">'+errs.map(E).join('<br>')+'</div></div>':'<div class="xsf"><div class="xsf-ok">Looks valid. SHA-256 '+hash(code).slice(0,16)+'…</div></div>')+(warn.length?'<div class="xsf"><div class="xsf-med">'+warn.map(E).join('<br>')+'</div></div>':'')+'<p class="msg">What a reviewer will see in the automatic scan:</p>'+flagHtml(s);
  return{m,code,errs}};
 $('#xu-chk').onclick=check;
 el.onclick=nav;
 el.onsubmit=async e=>{e.preventDefault();const r=check();if(r.errs.length)return;const go1=$('#xu-go');go1.disabled=true;
  const m=r.m,row={pid:m.id,version:m.version,name:m.name,description:m.description,author:m.author||'',owner:ctx.U.id,owner_name:ctx.nm(ctx.U),manifest:m,code:r.code,sha256:hash(r.code)};
  const{error}=await SB().from('mosaic_plugins').insert(row);
  if(error){go1.disabled=false;$('#xu-out').innerHTML='<div class="xsf"><div class="xsf-high">'+E(/duplicate key|23505/.test(error.message+error.code)?'That version of “'+m.id+'” was already submitted. Raise the version number.':error.message)+'</div></div>';return}
  toast('Submitted. A reviewer will look at it. Follow it under My submissions.');go('mine')}}

const BADGE={pending:['warn','waiting for review'],approved:['ok','approved'],rejected:['err','rejected'],removed:['err','removed']};
async function mineView(el,nav,T){
 const ctx=C();el.innerHTML=head('mine',!!ctx.DEV)+'<div id="xm-l"><p class="msg">Loading…</p></div>';el.onclick=nav;
 if(!ctx.U||ctx.U.guest){el.querySelector('#xm-l').innerHTML='<p class="msg">Sign in to see your submissions.</p>';return}
 const{data,error}=await SB().from('mosaic_plugins').select('id,pid,version,name,status,review_note,created_at,reviewed_at,installs').eq('owner',ctx.U.id).order('created_at',{ascending:false});
 if(T!==tok)return;const box=el.querySelector('#xm-l');if(error){box.innerHTML='<p class="msg">'+E(error.message)+'</p>';return}
 const draw=()=>{box.innerHTML=(data||[]).map(r=>{const b=BADGE[r.status]||['',r.status];
  return'<div class="cd" data-id="'+E(r.id)+'"><div class="row"><b>'+E(r.name)+'</b><small class="msg">'+E(r.pid)+' · v'+E(r.version)+' · '+E(date(r.created_at))+'</small><span class="bdg '+b[0]+'">'+b[1]+'</span><span class="grow"></span>'+(r.status==='pending'||r.status==='rejected'?'<button class="xdg" data-a="del">Delete</button>':'')+'</div>'
   +(r.review_note?'<span class="msg">Reviewer note: '+E(r.review_note)+'</span>':'')+(r.status==='approved'?'<span class="msg">'+(r.installs||0)+' installs</span>':'')+'</div>'}).join('')||'<p class="msg">You have not submitted anything yet.</p>'};
 draw();
 el.onclick=async e=>{if(nav(e))return;const b=e.target.closest('button[data-a=del]');if(!b)return;const id=b.closest('[data-id]').dataset.id;if(!confirm('Delete this submission?'))return;
  const{error:er}=await SB().from('mosaic_plugins').delete().eq('id',id);if(er){toast(er.message);return}const i=data.findIndex(x=>x.id===id);if(i>=0)data.splice(i,1);draw()}}

async function reviewView(el,nav,T){
 const ctx=C();let status='pending';
 el.innerHTML=head('review',true)+'<div class="row"><label>Show<select id="xr-s"><option value="pending">Waiting for review</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="removed">Removed</option></select></label><button id="xr-r">Refresh</button></div><div id="xr-l"><p class="msg">Loading…</p></div>';
 const box=el.querySelector('#xr-l'),sel=el.querySelector('#xr-s');let rows=[];
 const load=async()=>{status=sel.value;box.innerHTML='<p class="msg">Loading…</p>';
  const cols='id,pid,version,name,description,author,owner,owner_name,manifest,sha256,status,review_note,created_at,reviewed_at,installs'+(status==='pending'?',code':'');
  const{data,error}=await SB().from('mosaic_plugins').select(cols).eq('status',status).order('created_at',{ascending:true}).limit(100);
  if(T!==tok)return;if(error){box.innerHTML='<p class="msg">'+E(error.message)+'</p>';return}rows=data||[];draw()};
 const draw=()=>{box.innerHTML=rows.map(r=>{const m=r.manifest||{},s=r.code?scan(r.code):null,okh=r.code?hash(r.code)===r.sha256:true;
  return'<div class="cd" data-id="'+E(r.id)+'"><div class="row"><b>'+E(r.name)+'</b><small class="msg">'+E(r.pid)+' · v'+E(r.version)+' · by '+E(r.owner_name||r.author||'?')+' · '+E(date(r.created_at))+'</small></div><span class="msg">'+E(r.description)+'</span>'+chips(m)
   +(r.code?(okh?'':'<div class="xsf"><div class="xsf-high">The stored code does not match its SHA-256. Do not approve.</div></div>')+flagHtml(s)+'<small class="msg">Plugin API used: '+(s.apis.length?s.apis.map(E).join(', '):'none')+'</small>'+'<div class="row"><button data-a="code">View code ('+r.code.split('\n').length+' lines)</button><small class="msg">sha256 '+E(r.sha256.slice(0,16))+'…</small></div><div data-code hidden></div>':'')
   +(r.review_note?'<span class="msg">Note: '+E(r.review_note)+'</span>':'')
   +'<label class="ck"><input type="checkbox" data-read><span>'+(status==='pending'?'I have read this plugin’s code and its permissions.':'I have checked this.')+'</span></label><label>Note (required to reject or remove)<input data-note maxlength="500" placeholder="Why?"></label>'
   +'<div class="row">'+(status!=='approved'?'<button class="pri" data-a="approve" disabled>Approve</button>':'')+(status!=='rejected'&&status!=='removed'?'<button class="xdg" data-a="'+(status==='approved'?'remove':'reject')+'" disabled>'+(status==='approved'?'Remove from store':'Reject')+'</button>':'')+'</div></div>'}).join('')||'<p class="msg">Nothing here.</p>'};
 sel.onchange=load;el.querySelector('#xr-r').onclick=load;
 el.onchange=e=>{if(e.target.matches('[data-read]')){const c=e.target.closest('[data-id]');c.querySelectorAll('button[data-a=approve],button[data-a=reject],button[data-a=remove]').forEach(b=>b.disabled=!e.target.checked)}else if(e.target===sel)load()};
 el.onclick=async e=>{if(nav(e))return;const b=e.target.closest('button[data-a]');if(!b)return;const card=b.closest('[data-id]'),id=card.dataset.id,r=rows.find(x=>x.id===id),a=b.dataset.a;
  if(a==='code'){const d=card.querySelector('[data-code]');if(d.hidden&&!d.innerHTML)d.innerHTML=codeHtml(r.code,scan(r.code));d.hidden=!d.hidden;return}
  const note=card.querySelector('[data-note]').value.trim().slice(0,500),next=a==='approve'?'approved':a==='reject'?'rejected':'removed';
  if(next!=='approved'&&note.length<5){toast('Write a short reason first.');card.querySelector('[data-note]').focus();return}
  if(a==='approve'&&r.code&&hash(r.code)!==r.sha256){toast('The code does not match its hash.');return}
  b.disabled=true;const{error}=await SB().from('mosaic_plugins').update({status:next,review_note:note||null}).eq('id',id);
  if(error){toast(error.message);b.disabled=false;return}
  try{const au=await SB().from('mosaic_audit').insert({actor:ctx.U.id,actor_email:ctx.U.email,action:'plugin_'+next,target:r.pid+'@'+r.version});if(au.error)console.error('[mosaic] audit log',au.error.message)}catch(x){console.error('[mosaic] audit log',x)}
  toast('“'+r.name+'” '+next+'.');rows=rows.filter(x=>x.id!==id);draw()};
 load()}

/* ---------- docs inside the app ---------- */
async function docs(){
 if(!window.MOSAIC_APP){const a=document.createElement('a');a.href='docs.html';a.target='_blank';a.rel='noopener';document.body.appendChild(a);a.click();a.remove();return}
 try{const r=await fetch('docs.html',{cache:'no-store'});if(!r.ok)throw new Error(r.status);const d=new DOMParser().parseFromString(await r.text(),'text/html'),n=d.querySelector('.doc');if(!n)throw new Error('no docs');
  C().modal('Plugin API docs','<div class="xdoc">'+n.innerHTML+'</div>')}catch(e){toast('Could not open the docs: '+e.message)}}

window.MosaicStore={show,docs,uninstall,installed:readAll,pendingCount,scan,hash,newer,isBroken:id=>broken.has(id)};
boot();
})();
;
/* MOSAIC-INSPIRE: Notion, Excalidraw, Figma and Milanote interface ideas */
/* Mosaic: interface ideas borrowed from Notion (sidebar), Excalidraw (whiteboard), Figma (design) and Milanote (board rail).
   Loaded last. It only adds to the existing editor: every original control keeps working. */
(() => {
'use strict';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)], B = document.body;
const Ic = window.MosaicIcons || { svg: () => '', tool: () => '' };
const svg = n => Ic.svg(n);
const E = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem('mosaic:ui:' + k); return v == null ? d : JSON.parse(v) } catch (e) { return d } },
  set(k, v) { try { localStorage.setItem('mosaic:ui:' + k, JSON.stringify(v)) } catch (e) {} }
};
/* small extra icons (lucide style) for things the bundled icon set does not have */
const X = {
  chev: '<path d="m6 9 6 6 6-6"/>', plus: '<path d="M5 12h14M12 5v14"/>', minus: '<path d="M5 12h14"/>',
  alL: '<path d="M4 3v18"/><rect x="8" y="6" width="12" height="4" rx="1"/><rect x="8" y="14" width="7" height="4" rx="1"/>',
  alC: '<path d="M12 3v18"/><rect x="5" y="6" width="14" height="4" rx="1"/><rect x="8" y="14" width="8" height="4" rx="1"/>',
  alR: '<path d="M20 3v18"/><rect x="4" y="6" width="12" height="4" rx="1"/><rect x="9" y="14" width="7" height="4" rx="1"/>',
  alT: '<path d="M3 4h18"/><rect x="6" y="8" width="4" height="12" rx="1"/><rect x="14" y="8" width="4" height="7" rx="1"/>',
  alM: '<path d="M3 12h18"/><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="8" width="4" height="8" rx="1"/>',
  alB: '<path d="M3 20h18"/><rect x="6" y="4" width="4" height="12" rx="1"/><rect x="14" y="9" width="4" height="7" rx="1"/>',
  flowN: '<rect x="4" y="4" width="9" height="9" rx="1.5"/><rect x="11" y="11" width="9" height="9" rx="1.5"/>',
  flowV: '<rect x="6" y="4" width="12" height="6" rx="1.5"/><rect x="6" y="14" width="12" height="6" rx="1.5"/>',
  flowH: '<rect x="4" y="6" width="6" height="12" rx="1.5"/><rect x="14" y="6" width="6" height="12" rx="1.5"/>',
  flowG: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  corners: '<path d="M4 9V6a2 2 0 0 1 2-2h3M15 4h3a2 2 0 0 1 2 2v3M20 15v3a2 2 0 0 1-2 2h-3M9 20H6a2 2 0 0 1-2-2v-3"/>',
  arrowUp: '<path d="M5 12l7-7 7 7M12 19V5"/>', book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/>',
  frame: '<path d="M6 2v20M18 2v20M2 6h20M2 18h20"/>', flash: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'
};
const ico = (n, s) => '<svg class="i" viewBox="0 0 24 24" width="' + (s || 16) + '" height="' + (s || 16) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (X[n] || '') + '</svg>';
const g = n => { try { return eval(n) } catch (e) { return undefined } }; // reads the editor's globals safely

/* ------------------------------------------------------------------ tabs: clicking the icon or label now works */
$('#tabs').addEventListener('click', e => {
  const b = e.target.closest('button[data-w]');
  if (b && e.target !== b) { e.stopPropagation(); b.click() }
}, true);

/* ================================================================== NOTION: sidebar */
(function sidebar() {
  const sd = $('#sd'); if (!sd) return;
  const rows = $$('#sd > .row'); rows.forEach(r => r.classList.add('fg-hide'));
  const TYPES = [['nb', 'Board', 'layout-grid', 'Cards on a free canvas'], ['nd', 'Doc', 'file-text', 'Write with blocks'], ['nt', 'Table', 'table', 'Rows and columns'], ['nf', 'Design', 'pencil-ruler', 'Frames, layers and export'], ['nw', 'Whiteboard', 'pen-line', 'Sketch and think out loud']];

  /* "New page" row, like Notion's */
  const np = document.createElement('div'); np.className = 'fg-np';
  np.innerHTML = '<button type="button" id="fgNew" class="fg-nr" aria-haspopup="menu" aria-expanded="false">' + svg('plus') + '<span>New page</span></button>';
  const first = rows[0]; sd.insertBefore(np, first);

  /* "Private" section header over the page list */
  const sh = document.createElement('div'); sh.className = 'fg-sh';
  sh.innerHTML = '<button type="button" class="fg-shb" aria-expanded="true"><span>Private</span>' + ico('chev', 12) + '</button><button type="button" class="fg-sp" title="Add a page" aria-label="Add a page">' + ico('plus', 14) + '</button>';
  sd.insertBefore(sh, $('#pl'));
  const pl = $('#pl'), shb = sh.querySelector('.fg-shb');
  const collapse = c => { pl.classList.toggle('fg-col', c); shb.setAttribute('aria-expanded', String(!c)); sh.classList.toggle('shut', c) };
  collapse(store.get('privShut', false));
  shb.onclick = () => { const c = !pl.classList.contains('fg-col'); collapse(c); store.set('privShut', c) };

  /* second group, like "Notion apps" */
  const lab = document.createElement('div'); lab.className = 'fg-lab'; lab.textContent = 'Workspace';
  sd.insertBefore(lab, $('#fb'));

  /* create menu */
  const menu = document.createElement('div'); menu.id = 'fgNewMenu'; menu.className = 'fg-menu'; menu.hidden = true; menu.setAttribute('role', 'menu');
  menu.innerHTML = TYPES.map(([id, n, ic, d]) => '<button type="button" role="menuitem" data-n="' + id + '">' + svg(ic) + '<span><b>' + n + '</b><small>' + d + '</small></span></button>').join('');
  document.body.appendChild(menu);
  const closeMenu = () => { menu.hidden = true; $('#fgNew').setAttribute('aria-expanded', 'false') };
  const openMenu = (anchor) => {
    const r = anchor.getBoundingClientRect(); menu.hidden = false;
    menu.style.left = Math.max(8, Math.min(r.left, innerWidth - menu.offsetWidth - 8)) + 'px';
    menu.style.top = Math.min(r.bottom + 6, innerHeight - menu.offsetHeight - 8) + 'px';
    $('#fgNew').setAttribute('aria-expanded', 'true'); menu.querySelector('button').focus();
  };
  $('#fgNew').onclick = e => menu.hidden ? openMenu(e.currentTarget) : closeMenu();
  sh.querySelector('.fg-sp').onclick = e => menu.hidden ? openMenu(e.currentTarget) : closeMenu();
  menu.onclick = e => { const b = e.target.closest('button[data-n]'); if (!b) return; closeMenu(); const t = $('#' + b.dataset.n); t && t.click() };
  menu.onkeydown = e => {
    const L = [...menu.querySelectorAll('button')], i = L.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); L[(i + 1) % L.length].focus() }
    else if (e.key === 'ArrowUp') { e.preventDefault(); L[(i - 1 + L.length) % L.length].focus() }
    else if (e.key === 'Escape') { closeMenu(); $('#fgNew').focus() }
  };
  document.addEventListener('pointerdown', e => { if (!menu.hidden && !e.target.closest('#fgNewMenu,#fgNew,.fg-sp')) closeMenu() }, true);

  /* dismissible "Invite members" card */
  if (!store.get('inviteGone', false)) {
    const c = document.createElement('div'); c.id = 'fgInv'; c.className = 'fg-inv';
    c.innerHTML = '<button type="button" class="fg-invx" aria-label="Dismiss">' + svg('x') + '</button><div class="fg-invb" role="button" tabindex="0">' + svg('users') + '<span><b>Invite members</b><small>Collaborate with your team.</small></span></div>';
    sd.appendChild(c);
    const go = () => { const s = $('#sh'); s && s.click() };
    c.querySelector('.fg-invb').onclick = go;
    c.querySelector('.fg-invb').onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go() } };
    c.querySelector('.fg-invx').onclick = () => { store.set('inviteGone', true); c.remove() };
  }
})();

/* ================================================================== MILANOTE: Comment card in the left rail */
(function comment() {
  const T = $('#tools'); if (!T) return;
  T.insertAdjacentHTML('beforeend', '<button data-a="cmt" title="Comment card" aria-label="Comment card"><i>' + svg('message-square') + '</i><span class="tl">Comment</span></button>');
  T.addEventListener('click', e => {
    const b = e.target.closest('[data-a=cmt]'); if (!b) return; e.stopPropagation();
    if (g('RO')) return;
    const me = g('me') || {}; add('note', { c: '#cfe2ff', w: 230, h: 120, t: '', au: me.n || 'You', cmt: 1 });
  }, true);
})();

/* ================================================================== EXCALIDRAW: whiteboard */
(function excal() {
  const T = $('#tools'), stage = $('#stage'), cv = $('#cv');
  /* a real Select tool, and shortcut digits like Excalidraw */
  T.insertAdjacentHTML('beforeend', '<button data-a="sel" title="Select (V)" aria-label="Select"><i>' + svg('mouse-pointer-2') + '</i><span class="tl">Select</span></button>');
  try { TS.w += ' sel'; TS.f += ' sel frame' } catch (e) {}
  const digits = { sel: '1', rect: '2', dia: '3', oval: '4', cm: '5', pen: '7', text: '8', img: '9', er: '0' };
  Object.entries(digits).forEach(([a, n]) => { const b = T.querySelector('[data-a=' + a + ']'); b && b.setAttribute('data-n', n) });
  T.addEventListener('click', e => {
    const b = e.target.closest('[data-a=sel]'); if (!b) return; e.stopPropagation();
    dispatchEvent(new KeyboardEvent('keydown', { key: 'v' })); markSel();
  }, true);
  const markSel = () => {
    const s = T.querySelector('[data-a=sel]'); if (!s) return;
    const mode = !!T.querySelector('.on-btn:not([data-a=sel])'); s.classList.toggle('on-btn', !mode);
  };
  new MutationObserver(markSel).observe(T, { attributes: true, attributeFilter: ['class'], subtree: true });
  try { tools(B.dataset.k) } catch (e) {} markSel();

  /* undo / redo beside the zoom controls (bottom left, as in Excalidraw) */
  const z = $('#zoom');
  z.insertAdjacentHTML('beforeend', '<span class="fg-zs"></span><button id="fgUn" title="Undo (Ctrl+Z)" aria-label="Undo">' + svg('undo-2') + '</button><button id="fgRe" title="Redo (Ctrl+Shift+Z)" aria-label="Redo">' + svg('redo-2') + '</button>');
  $('#fgUn').onclick = () => undo(1); $('#fgRe').onclick = () => undo(-1);

  /* help button, bottom right */
  const hb = document.createElement('button'); hb.id = 'fgHelp'; hb.title = 'Keyboard shortcuts (?)'; hb.setAttribute('aria-label', 'Keyboard shortcuts'); hb.innerHTML = svg('circle-help');
  stage.appendChild(hb);
  const kb = () => $('#kb');
  hb.onclick = () => { const k = kb(); if (k) k.hidden = !k.hidden };

  /* welcome screen on an empty whiteboard */
  const wl = document.createElement('div'); wl.id = 'fgWel'; wl.hidden = true;
  const arrow = (d, head) => '<svg viewBox="0 0 90 90" width="90" height="90" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/><path d="' + head + '"/></svg>';
  wl.innerHTML =
    '<div class="fg-hint h-tool"><span>Pick a tool &amp;<br>start drawing!</span>' + arrow('M8 80C14 40 40 22 78 14', 'M66 4L78 14L65 25') + '</div>' +
    '<div class="fg-hint h-exp">' + arrow('M12 78C20 40 50 22 80 12', 'M68 3L80 12L67 24') + '<span>Export, backups<br>and sharing</span></div>' +
    '<div class="fg-hint h-help"><span>Shortcuts<br>&amp; help</span>' + arrow('M20 8C60 14 78 40 76 82', 'M64 70L76 83L87 68') + '</div>' +
    '<div class="fg-logo"><i></i><b>Mosaic</b></div>' +
    '<p class="fg-cap">Your whiteboard is saved automatically.<br>On this device, browser storage can be cleared unexpectedly.<br>Export a backup now and then to stay safe.</p>' +
    '<div class="fg-wm" role="menu">' +
    '<button type="button" data-w="open" role="menuitem">' + svg('folder') + '<span>Open backup</span><kbd>Ctrl+O</kbd></button>' +
    '<button type="button" data-w="help" role="menuitem">' + svg('circle-help') + '<span>Help</span><kbd>?</kbd></button>' +
    '<button type="button" data-w="live" role="menuitem">' + svg('users') + '<span>Live collaboration…</span></button>' +
    '<button type="button" data-w="cmd" role="menuitem">' + svg('command') + '<span>Command palette</span><kbd>Ctrl+Shift+P</kbd></button></div>';
  stage.appendChild(wl);
  wl.onclick = e => {
    const b = e.target.closest('button[data-w]'); if (!b) return; const a = b.dataset.w;
    if (a === 'open') { const f = $('#imf'); f && f.click() } else if (a === 'help') hb.click()
    else if (a === 'live') { const s = $('#sh'); s && s.click() } else if (a === 'cmd') { const c = $('#xcpb'); c && c.click() }
  };
  addEventListener('keydown', e => {
    if (B.dataset.pt !== 'excal' || !(e.ctrlKey || e.metaKey) || e.shiftKey || e.key.toLowerCase() !== 'o') return;
    const f = $('#imf'); if (f) { e.preventDefault(); f.click() }
  });
  const empty = () => { try { return !Object.values(S.it).some(i => i.p === cur && !i.del && i.ty !== 'cn') } catch (e) { return false } };
  const upd = () => { wl.hidden = !(B.dataset.pt === 'excal' && !cv.hidden && empty() && !B.classList.contains('zen')) };
  setInterval(upd, 400); upd();
  new MutationObserver(upd).observe(B, { attributes: true, attributeFilter: ['data-pt', 'class'] });
})();

/* ================================================================== FIGMA: properties panel + bottom toolbar */
(function figma() {
  const insp = $('#insp'), stage = $('#stage'), T = $('#tools');
  const NAMES = { rect: 'Rectangle', oval: 'Ellipse', dia: 'Diamond', pgn: 'Polygon', star: 'Star', text: 'Text', img: 'Image', frame: 'Frame', pen: 'Vector', note: 'Note', col: 'Column', lk: 'Link', td: 'To-do list', swc: 'Swatch', tc: 'Table', fl: 'File', bdc: 'Board', dv: 'Divider', bool: 'Boolean group' };
  const FILLABLE = ['note', 'rect', 'oval', 'dia', 'pgn', 'star', 'col', 'swc'];
  const STROKABLE = ['rect', 'oval', 'frame', 'note', 'col', 'text', 'td', 'lk', 'swc', 'tc'];
  const hexOf = v => { v = String(v || '').trim(); if (/^#?[0-9a-f]{3}$/i.test(v)) v = v.replace('#', '').split('').map(c => c + c).join(''); v = v.replace('#', ''); return /^[0-9a-f]{6}$/i.test(v) ? '#' + v.toLowerCase() : null };
  let tab = 'design', busy = false, expScale = store.get('expScale', '2x'), expFmt = store.get('expFmt', 'png');
  const items = () => [...SL].map(k => S.it[k]).filter(j => j && j.ty !== 'cn' && !j.del);
  const apply = f => SL.forEach(id => { const j = S.it[id]; if (j && j.ty !== 'cn' && !j.del) { f(j); put('it', j); const e = els.get(id); e && paint(e, j) } });

  /* ---- stroke + comment-card painting, layered over the editor's own paint() ---- */
  const op = paint;
  paint = function (e, i) {
    op.apply(this, arguments);
    const s = e.style;
    if (i.sc && i.sw > 0 && STROKABLE.includes(i.ty)) {
      const w = +i.sw, c = i.sc;
      const ring = i.sp === 'o' ? '0 0 0 ' + w + 'px ' + c : i.sp === 'c' ? '0 0 0 ' + (w / 2) + 'px ' + c + ',inset 0 0 0 ' + (w / 2) + 'px ' + c : 'inset 0 0 0 ' + w + 'px ' + c;
      s.boxShadow = i.sh ? ring + ',0 10px 28px #0005' : ring;
    }
    if (i.cmt) { e.dataset.cmtc = '1'; e.dataset.au = i.au || '' } else { delete e.dataset.cmtc; delete e.dataset.au }
  };

  /* ---- small builders ---- */
  const field = (lab, key, val, o) => { o = o || {}; return '<label class="fg-f' + (o.cls ? ' ' + o.cls : '') + '" title="' + E(o.title || '') + '"><span data-scrub="1">' + lab + '</span><input type="number" data-k="' + key + '" value="' + E(val) + '"' + (o.min != null ? ' min="' + o.min + '"' : '') + (o.step ? ' step="' + o.step + '"' : '') + ' aria-label="' + E(o.title || key) + '"></label>' };
  const fieldF = (lab, f, val, o) => { o = o || {}; return '<label class="fg-f" title="' + E(o.title || '') + '"><span data-scrub="1">' + lab + '</span><input type="number" data-f="' + f + '" value="' + E(val) + '"' + (o.min != null ? ' min="' + o.min + '"' : '') + (o.max != null ? ' max="' + o.max + '"' : '') + ' aria-label="' + E(o.title || f) + '"></label>' };
  const sec = (title, body, right) => '<section class="fg-s"><div class="fg-sh2"><h4>' + title + '</h4><span class="fg-sr">' + (right || '') + '</span></div>' + body + '</section>';
  const mini = (act, ic, title, extra) => '<button type="button" class="fg-mb" ' + act + ' title="' + E(title) + '" aria-label="' + E(title) + '"' + (extra || '') + '>' + (X[ic] ? ico(ic, 14) : svg(ic)) + '</button>';
  const colorRow = (hex, kf, extra) => '<div class="fg-cr"><label class="fg-sw" style="--c:' + hex + '"><input type="color" data-f="' + kf + '" value="' + hex + '" aria-label="Colour"' + (extra || '') + '></label><input class="fg-hex" type="text" data-h="' + kf + '" value="' + hex.slice(1).toUpperCase() + '" spellcheck="false" maxlength="7" aria-label="Hex colour"></div>';

  function exportSection(whole, name) {
    const sc = ['0.5x', '1x', '2x', '3x', '4x'], fm = [['png', 'PNG'], ['jpg', 'JPG'], ['svg', 'SVG'], ['pdf', 'PDF']];
    return sec('Export',
      '<div class="fg-ex"><select data-f="expScale" aria-label="Export scale">' + sc.map(s => '<option' + (s === expScale ? ' selected' : '') + '>' + s + '</option>').join('') + '</select>' +
      '<select data-f="expFmt" aria-label="Export format">' + fm.map(([v, l]) => '<option value="' + v + '"' + (v === expFmt ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></div>' +
      '<button type="button" class="fg-btn" data-f="export" data-whole="' + (whole ? 1 : 0) + '">Export ' + E(name) + '</button>');
  }

  function itemSections(i, old) {
    const multi = SL.size > 1, k = i.ty;
    const pre = a => { const n = old.querySelector(a); return n };
    /* claim controls we re-draw, so nothing appears twice */
    const kill = s => old.querySelectorAll(s).forEach(n => { const t = n.closest('label,.rt') || n; t.remove() });
    const swatches = [...old.querySelectorAll('button.sw[data-c]')].map(n => n.outerHTML).join('');
    kill('.dt'); kill('input[data-k=rot]'); kill('button.sw[data-c]'); kill('input[data-k="1"]'); kill('input[data-k=g2]'); kill('[data-x=g0]');
    kill('select[data-k=bm]'); kill('input[data-k=bu]'); kill('input[data-k=sh]'); kill('[data-x=al]'); kill('input[data-k=gap]'); kill('[data-x=ic]'); kill('[data-x=fit]');
    const grp = [...SL].some(q => S.it[q] && S.it[q].g);
    const title = grp || multi ? (multi ? SL.size + ' layers' : 'Group') : (i.nm || NAMES[k] || 'Layer');

    /* position */
    const al = multi ? '<div class="fg-al">' + [['l', 'alL', 'Align left'], ['c', 'alC', 'Align horizontal centres'], ['r', 'alR', 'Align right'], ['t', 'alT', 'Align top'], ['m', 'alM', 'Align vertical centres'], ['b', 'alB', 'Align bottom']].map(([a, ic, t]) => '<button type="button" data-x="al" data-a="' + a + '" title="' + t + '" aria-label="' + t + '">' + ico(ic, 16) + '</button>').join('') + '</div>' : '';
    let h = sec('Position', al + '<div class="fg-g2">' + field('X', 'x', Math.round(i.x), { title: 'X position' }) + field('Y', 'y', Math.round(i.y), { title: 'Y position' }) + '</div><div class="fg-g2">' + field('∠', 'rot', Math.round(i.r || 0), { title: 'Rotation in degrees', step: 5 }) + '</div>');

    /* layout */
    const canFlow = multi || k === 'frame' || k === 'col';
    const flow = canFlow ? '<div class="fg-lab2">Flow</div><div class="fg-flow">' + (multi
      ? '<button type="button" class="on" title="Free placement" aria-label="Free placement">' + ico('flowN') + '</button><button type="button" data-x="al" data-a="v" title="Stack vertically (auto layout)" aria-label="Stack vertically">' + ico('flowV') + '</button><button type="button" data-x="al" data-a="h" title="Stack horizontally" aria-label="Stack horizontally">' + ico('flowH') + '</button><button type="button" data-x="al" data-a="g" title="Grid layout" aria-label="Grid layout">' + ico('flowG') + '</button>'
      : '<button type="button" class="on" title="Free placement" aria-label="Free placement">' + ico('flowN') + '</button><button type="button" data-x="fit" title="Auto layout: stack everything inside" aria-label="Auto layout">' + ico('flowV') + '</button>') + '</div>' +
      (multi ? '<div class="fg-g2">' + field('↔', 'gap', typeof AG === 'number' ? AG : 16, { title: 'Gap between layers', min: 0 }) + '</div>' : '') : '';
    h += sec('Layout', flow + '<div class="fg-lab2">Dimensions</div><div class="fg-g2">' + field('W', 'w', Math.round(i.w), { title: 'Width', min: 10 }) + field('H', 'h', Math.round(i.h), { title: 'Height', min: 10 }) + '</div>');

    /* appearance */
    const a = Array.isArray(i.rd), rv = a ? i.rd : Array(4).fill(i.rd || 0);
    h += sec('Appearance',
      '<div class="fg-g2">' + field('◐', 'op', Math.round((i.o == null ? 1 : i.o) * 100), { title: 'Opacity in percent', min: 0 }) + (a ? '<label class="fg-f"><span>⌜</span><input type="text" value="Mixed" disabled aria-label="Corner radius"></label>' : field('⌜', 'rad', rv[0], { title: 'Corner radius', min: 0 })) + '</div>' +
      (a ? '<div class="fg-g2">' + rv.map((n, q) => field(['↖', '↗', '↘', '↙'][q], 'rc' + q, n, { title: 'Corner ' + (q + 1), min: 0 })).join('') + '</div>' : ''),
      mini('data-x="ic"', 'corners', a ? 'One radius for all corners' : 'Set each corner separately'));

    /* fill */
    const fillable = FILLABLE.includes(k), hx = hexOf(i.c);
    let fb;
    if (!fillable) fb = '<p class="fg-note">This layer type has no fill.</p>';
    else {
      fb = colorRow(hx || '#ffd966', 'fill');
      if (i.g2) fb += '<div class="fg-cr"><label class="fg-sw" style="--c:' + (hexOf(i.g2) || '#ffffff') + '"><input type="color" data-k="g2" value="' + (hexOf(i.g2) || '#ffffff') + '" aria-label="Gradient end colour"></label><span class="fg-gl">Gradient end</span>' + mini('data-x="g0"', 'minus', 'Remove gradient') + '</div>';
      if (swatches) fb += '<div class="fg-sws">' + swatches + '</div>';
    }
    h += sec('Fill', fb, fillable && !i.g2 ? '<label class="fg-mb" title="Add a gradient end colour" aria-label="Add a gradient"><input type="color" data-k="g2" value="#ffffff" hidden>' + ico('plus', 14) + '</label>' : '');

    /* stroke */
    const stk = STROKABLE.includes(k);
    let sb;
    if (!stk) sb = '<p class="fg-note">Strokes are not available for this layer type yet.</p>';
    else if (!i.sc) sb = '';
    else sb = colorRow(hexOf(i.sc) || '#000000', 'strokeC') + '<div class="fg-g2"><label class="fg-f"><span>▭</span><select data-f="strokeP" aria-label="Stroke position"><option value="i"' + (i.sp !== 'o' && i.sp !== 'c' ? ' selected' : '') + '>Inside</option><option value="c"' + (i.sp === 'c' ? ' selected' : '') + '>Center</option><option value="o"' + (i.sp === 'o' ? ' selected' : '') + '>Outside</option></select></label>' + fieldF('≡', 'strokeW', i.sw == null ? 1 : i.sw, { title: 'Stroke weight', min: 0, max: 200 }) + '</div>';
    h += sec('Stroke', sb, stk ? (i.sc ? mini('data-f="strokeX"', 'minus', 'Remove stroke') : mini('data-f="strokeAdd"', 'plus', 'Add a stroke')) : '');

    /* effects */
    h += sec('Effects',
      '<label class="fg-row"><span>Drop shadow</span><input type="checkbox" class="fg-tg" data-k="sh"' + (i.sh ? ' checked' : '') + ' aria-label="Drop shadow"></label>' +
      '<div class="fg-g2">' + field('◌', 'bu', i.bu || 0, { title: 'Layer blur', min: 0 }) +
      '<label class="fg-f" title="Blend mode"><span>◑</span><select data-k="bm" aria-label="Blend mode">' + [['', 'Normal'], ['multiply', 'Multiply'], ['screen', 'Screen'], ['overlay', 'Overlay'], ['difference', 'Difference']].map(([v, l]) => '<option value="' + v + '"' + ((i.bm || '') === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></label></div>');

    /* selection colours */
    const cols = []; items().forEach(j => { [j.c, j.sc].forEach(c => { const x = hexOf(c); x && !cols.includes(x) && cols.push(x) }) });
    if (cols.length) h += sec('Selection colors', cols.map(c => '<div class="fg-cr"><label class="fg-sw" style="--c:' + c + '"><input type="color" data-f="selc" data-from="' + c + '" value="' + c + '" aria-label="Replace ' + c + '"></label><input class="fg-hex" type="text" data-h="selc" data-from="' + c + '" value="' + c.slice(1).toUpperCase() + '" spellcheck="false" maxlength="7" aria-label="Hex colour"></div>').join(''));

    /* everything else the editor offers for this layer (fonts, flip, tags, duplicate, delete…) */
    const left = old.innerHTML.trim();
    if (left) h += sec('Layer', '<div class="fg-act">' + left + '</div>');
    h += exportSection(false, NAMES[k] || 'layer');
    return { title, h };
  }

  function pageSections() {
    const bg = $('#bgc'), hx = hexOf(bg && bg.value) || '#f4f1ec';
    return sec('Page', '<div class="fg-lab2">Background</div>' + colorRow(hx, 'pageBg')) + sec('Canvas', '<p class="fg-note">Select a layer to see its position, size, fill and stroke. Drag a number\'s label to scrub it.</p>') + exportSection(true, 'page');
  }

  function render() {
    const i = sel && S.it[sel];
    const old = document.createElement('div'); old.innerHTML = insp.innerHTML;
    if (i && !i.del && i.ty === 'cn') { busy = true; insp.innerHTML = '<div class="fg-panel fg-raw">' + insp.innerHTML + '</div>'; busy = false; return }
    const lay = old.querySelector('.ly'); if (lay) lay.remove();
    const has = i && !i.del;
    let title = 'Page', body;
    if (has) { const r = itemSections(i, old); title = r.title; body = r.h } else body = pageSections();
    const z = Math.round((V.z || 1) * 100);
    const ZS = [25, 50, 100, 150, 200];
    const head = '<div class="fg-tabs" role="tablist"><button type="button" role="tab" data-f="tab" data-tab="design" class="' + (tab === 'design' ? 'on' : '') + '" aria-selected="' + (tab === 'design') + '">Design</button><button type="button" role="tab" data-f="tab" data-tab="layers" class="' + (tab === 'layers' ? 'on' : '') + '" aria-selected="' + (tab === 'layers') + '">Layers</button>' +
      '<select class="fg-zoom" data-f="zoom" aria-label="Zoom"><option value="cur" selected>' + z + '%</option>' + ZS.filter(q => q !== z).map(q => '<option value="' + q + '">' + q + '%</option>').join('') + '<option value="fit">Zoom to fit</option></select></div>';
    const ttl = '<div class="fg-title"><b>' + E(title) + '</b></div>';
    const layers = '<div class="fg-layers">' + (lay ? lay.outerHTML : '<p class="fg-note">Nothing on this page yet.</p>') + '</div>';
    busy = true;
    insp.innerHTML = '<div class="fg-panel">' + head + (tab === 'design' ? ttl + '<div class="fg-body">' + body + '</div>' : layers) + '</div>';
    busy = false;
  }
  const done = () => insp.firstElementChild && insp.firstElementChild.classList.contains('fg-panel');
  new MutationObserver(() => { if (busy || B.dataset.k !== 'f' || done()) return; try { render() } catch (e) { busy = false; console.error('Mosaic panel:', e) } }).observe(insp, { childList: true });
  try { if (B.dataset.k === 'f') inspect() } catch (e) {}

  /* ---- events on the panel ---- */
  const rerender = () => { try { inspect() } catch (e) {} };
  insp.addEventListener('click', e => {
    const b = e.target.closest('[data-f]'); if (!b) return; const f = b.dataset.f;
    if (f === 'tab') { tab = b.dataset.tab; rerender() }
    else if (f === 'strokeAdd') { apply(j => { if (STROKABLE.includes(j.ty)) { j.sc = '#000000'; j.sw = 1; j.sp = 'i' } }); rerender() }
    else if (f === 'strokeX') { apply(j => { delete j.sc; delete j.sw; delete j.sp }); rerender() }
    else if (f === 'export') {
      const whole = b.dataset.whole === '1';
      const s = $('#exs'), fm = $('#exf'), k = $('#exk'); if (!s || !fm || !k) return;
      s.value = whole ? 'a' : 's'; fm.value = expFmt; k.value = expScale;
      [s, fm, k].forEach(n => n.dispatchEvent(new Event('change', { bubbles: true })));
      const d = $('#exd'); d && d.click();
    }
  });
  insp.addEventListener('input', e => {
    const t = e.target, f = t.dataset.f; if (!f) return;
    if (f === 'fill') { const v = hexOf(t.value); if (!v) return; apply(j => { if (FILLABLE.includes(j.ty)) { j.c = v; if (j.ty === 'swc') j.t = v.toUpperCase() } }); sync2(t, v) }
    else if (f === 'strokeC') { const v = hexOf(t.value); if (!v) return; apply(j => { if (STROKABLE.includes(j.ty)) { j.sc = v; j.sw = j.sw == null ? 1 : j.sw } }); sync2(t, v) }
    else if (f === 'strokeW') apply(j => { if (j.sc) j.sw = Math.max(0, +t.value || 0) });
    else if (f === 'selc') { const from = t.dataset.from, v = hexOf(t.value); if (!v) return; apply(j => { if (hexOf(j.c) === from) { j.c = v; if (j.ty === 'swc') j.t = v.toUpperCase() } if (hexOf(j.sc) === from) j.sc = v }); t.dataset.from = v; const h = t.closest('.fg-cr').querySelector('.fg-hex'); if (h) { h.value = v.slice(1).toUpperCase(); h.dataset.from = v } t.parentNode.style.setProperty('--c', v) }
    else if (f === 'pageBg') { const v = hexOf(t.value); if (!v) return; const bg = $('#bgc'); if (bg) { bg.value = v; bg.dispatchEvent(new Event('input', { bubbles: true })) } sync2(t, v) }
  });
  const sync2 = (t, v) => { const cr = t.closest('.fg-cr'); if (!cr) return; cr.querySelector('.fg-sw').style.setProperty('--c', v); const h = cr.querySelector('.fg-hex'); if (h && h !== t) h.value = v.slice(1).toUpperCase() };
  insp.addEventListener('change', e => {
    const t = e.target, f = t.dataset.f, hf = t.dataset.h;
    if (hf) { /* typed hex values */
      const v = hexOf(t.value), cr = t.closest('.fg-cr'), col = cr && cr.querySelector('input[type=color]');
      if (!v) { t.value = col ? col.value.slice(1).toUpperCase() : ''; return }
      if (col) { col.value = v; col.dispatchEvent(new Event('input', { bubbles: true })) } t.value = v.slice(1).toUpperCase(); return
    }
    if (f === 'strokeP') apply(j => { if (j.sc) j.sp = t.value });
    else if (f === 'expScale') { expScale = t.value; store.set('expScale', expScale) }
    else if (f === 'expFmt') { expFmt = t.value; store.set('expFmt', expFmt) }
    else if (f === 'zoom') {
      const v = t.value; if (v === 'fit') { const z = $('#zf'); z && z.click() } else if (v !== 'cur') zc(+v / 100 / V.z);
      setTimeout(rerender, 0);
    }
  });
  /* gradient: the editor's own handlers apply the colour; we only redraw the panel afterwards */
  insp.addEventListener('change', e => { if (e.target.dataset.k === 'g2') rerender() });
  insp.addEventListener('click', e => { if (e.target.closest('[data-x=g0]')) setTimeout(rerender, 0) });

  /* drag a number's label to scrub the value, like Figma */
  insp.addEventListener('pointerdown', e => {
    const lab = e.target.closest('[data-scrub]'); if (!lab) return; const inp = lab.parentNode.querySelector('input[type=number]'); if (!inp || inp.disabled) return;
    e.preventDefault(); const x0 = e.clientX, v0 = +inp.value || 0, st = +inp.step > 0 && +inp.step < 1 ? +inp.step : 1; lab.setPointerCapture(e.pointerId); document.body.classList.add('fg-scrub');
    const mv = ev => { let d = Math.round((ev.clientX - x0) / 2) * (ev.shiftKey ? 10 : st); let v = v0 + d; if (inp.min !== '' && v < +inp.min) v = +inp.min; if (inp.max !== '' && v > +inp.max) v = +inp.max; if (String(v) !== inp.value) { inp.value = v; inp.dispatchEvent(new Event('input', { bubbles: true })) } };
    const up = () => { lab.removeEventListener('pointermove', mv); lab.removeEventListener('pointerup', up); lab.removeEventListener('pointercancel', up); document.body.classList.remove('fg-scrub'); inp.dispatchEvent(new Event('change', { bubbles: true })) };
    lab.addEventListener('pointermove', mv); lab.addEventListener('pointerup', up); lab.addEventListener('pointercancel', up);
  });

  /* keep the zoom % in the panel up to date */
  try { const oa = applyV; applyV = function () { oa.apply(this, arguments); const o = insp.querySelector('.fg-zoom option[value=cur]'); if (o) o.textContent = Math.round(V.z * 100) + '%' } } catch (e) {}

  /* ================= bottom toolbar with grouped tools (Figma) ================= */
  const GROUPS = [
    { id: 'move', tools: [['sel', 'Move', 'V', 'mouse-pointer-2'], ['pan', 'Hand tool', 'Space', 'hand']] },
    { id: 'frame', tools: [['frame', 'Frame', 'F', 'frame']] },
    { id: 'shape', tools: [['rect', 'Rectangle', 'R', 'square'], ['oval', 'Ellipse', 'O', 'circle'], ['pgn', 'Polygon', '', 'hexagon'], ['star', 'Star', '', 'star'], ['cm', 'Arrow', 'A', 'arrow-up-right']] },
    { id: 'pen', tools: [['pen', 'Pencil', 'P', 'pen-tool']] },
    { id: 'text', tools: [['text', 'Text', 'T', 'type']] },
    { id: 'img', tools: [['img', 'Place image', '', 'image']] }
  ];
  const bar = document.createElement('div'); bar.id = 'fgt'; bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'Design tools');
  const pm = document.createElement('div'); pm.id = 'fgtm'; pm.className = 'fg-menu'; pm.hidden = true; pm.setAttribute('role', 'menu'); stage.appendChild(pm);
  const curOf = G => Math.min(store.get('fgt:' + G.id, 0), G.tools.length - 1);
  const run = a => {
    if (a === 'sel') { dispatchEvent(new KeyboardEvent('keydown', { key: 'v' })); return }
    const b = T.querySelector('[data-a=' + a + ']'); b && b.click();
  };
  function build() {
    bar.innerHTML = GROUPS.map(G => { const t = G.tools[curOf(G)]; return '<div class="fg-tg" data-g="' + G.id + '"><button type="button" class="fg-tbm" data-t="' + t[0] + '" title="' + t[1] + (t[2] ? ' (' + t[2] + ')' : '') + '" aria-label="' + t[1] + '">' + svg(t[3]) + '</button>' + (G.tools.length > 1 ? '<button type="button" class="fg-car" aria-haspopup="menu" aria-label="More ' + G.id + ' tools">' + ico('chev', 10) + '</button>' : '') + '</div>' }).join('') +
      '<span class="fg-sep"></span><button type="button" class="fg-tbm" data-x2="undo" title="Undo (Ctrl+Z)" aria-label="Undo">' + svg('undo-2') + '</button><button type="button" class="fg-tbm" data-x2="redo" title="Redo (Ctrl+Shift+Z)" aria-label="Redo">' + svg('redo-2') + '</button><span class="fg-sep"></span><button type="button" class="fg-pres" data-x2="present" title="Present frames">' + svg('play') + '<span>Present</span></button>';
    mark();
  }
  const mark = () => {
    const mode = !!T.querySelector('.on-btn:not([data-a=sel])');
    bar.querySelectorAll('.fg-tbm[data-t]').forEach(b => { const a = b.dataset.t, o = T.querySelector('[data-a=' + a + ']'); b.classList.toggle('on', a === 'sel' ? !mode : !!(o && o.classList.contains('on-btn'))) });
  };
  new MutationObserver(mark).observe(T, { attributes: true, attributeFilter: ['class'], subtree: true });
  const flash = b => { b.classList.add('on'); setTimeout(mark, 420) };
  bar.addEventListener('click', e => {
    const x2 = e.target.closest('[data-x2]');
    if (x2) { const a = x2.dataset.x2; if (a === 'undo') undo(1); else if (a === 'redo') undo(-1); else { const p = T.querySelector('[data-a=present]'); p && p.click() } return }
    const car = e.target.closest('.fg-car');
    if (car) {
      const gid = car.parentNode.dataset.g, G = GROUPS.find(q => q.id === gid), r = car.parentNode.getBoundingClientRect(), s = stage.getBoundingClientRect();
      if (!pm.hidden && pm.dataset.g === gid) { pm.hidden = true; return }
      pm.dataset.g = gid; pm.innerHTML = G.tools.map((t, n) => '<button type="button" role="menuitem" data-n="' + n + '">' + svg(t[3]) + '<span>' + t[1] + '</span><kbd>' + t[2] + '</kbd></button>').join('');
      pm.hidden = false; pm.style.left = Math.max(8, r.left - s.left) + 'px'; pm.style.bottom = (s.bottom - r.top + 8) + 'px'; pm.style.top = 'auto'; pm.querySelector('button').focus(); return
    }
    const b = e.target.closest('.fg-tbm[data-t]'); if (!b) return; pm.hidden = true; run(b.dataset.t); flash(b);
  });
  pm.addEventListener('click', e => {
    const b = e.target.closest('button[data-n]'); if (!b) return; const G = GROUPS.find(q => q.id === pm.dataset.g); if (!G) return;
    store.set('fgt:' + G.id, +b.dataset.n); pm.hidden = true; build(); run(G.tools[+b.dataset.n][0]);
    const nb = bar.querySelector('[data-g=' + G.id + '] .fg-tbm'); nb && flash(nb);
  });
  pm.addEventListener('keydown', e => { const L = [...pm.querySelectorAll('button')], i = L.indexOf(document.activeElement); if (e.key === 'ArrowDown') { e.preventDefault(); L[(i + 1) % L.length].focus() } else if (e.key === 'ArrowUp') { e.preventDefault(); L[(i - 1 + L.length) % L.length].focus() } else if (e.key === 'Escape') pm.hidden = true });
  document.addEventListener('pointerdown', e => { if (!pm.hidden && !e.target.closest('#fgtm,.fg-car')) pm.hidden = true }, true);
  stage.appendChild(bar); build();
  /* keep the shortcuts working: the editor's own keys R/O/D/A/P/T/F already click the hidden original buttons */
})();

})();
;
/* MOSAIC-INSPIRE-2: collapsible nested pages and a built-in dropdown (the desktop web view's native select popup can fail to open) */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const ST = { get() { try { return JSON.parse(localStorage.getItem('mosaic:ui:shut') || '[]') } catch (e) { return [] } }, set(v) { try { localStorage.setItem('mosaic:ui:shut', JSON.stringify(v)) } catch (e) {} } };
const chev = '<svg class="i" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>';
function decorate() {
  const pl = $('#pl'); if (!pl) return;
  const shut = new Set(ST.get()), rows = [...pl.querySelectorAll('.pg')];
  const hasKids = id => Object.values(S.pg).some(p => p && !p.del && p.par === id);
  const anc = new Set(); { let q = S.pg[cur]; while (q && q.par && S.pg[q.par]) { anc.add(q.par); q = S.pg[q.par] } }
  const depth = r => Math.round((parseInt(r.style.paddingLeft, 10) - 9) / 14);
  let hideBelow = -1;
  rows.forEach(r => {
    const id = r.dataset.id, d = depth(r), kid = hasKids(id);
    if (!r.querySelector('.fg-tw')) r.insertAdjacentHTML('afterbegin', '<button type="button" class="fg-tw" tabindex="-1" aria-label="Show or hide sub-pages">' + (kid ? chev : '') + '</button>');
    const tw = r.querySelector('.fg-tw'); tw.classList.toggle('kid', kid);
    const closed = kid && shut.has(id) && !anc.has(id);
    tw.classList.toggle('shut', closed); r.setAttribute('aria-expanded', kid ? String(!closed) : '');
    if (hideBelow >= 0 && d > hideBelow) r.hidden = true; else { r.hidden = false; hideBelow = -1 }
    if (closed && hideBelow < 0) hideBelow = d;
  });
}
const orl = renderList;
renderList = function () { orl.apply(this, arguments); try { decorate() } catch (e) { console.error(e) } };
$('#pl').addEventListener('click', e => {
  const t = e.target.closest('.fg-tw.kid'); if (!t) { if (e.target.closest('.fg-tw')) e.stopPropagation(); return }
  e.stopPropagation(); const id = t.closest('.pg').dataset.id, s = new Set(ST.get()); s.has(id) ? s.delete(id) : s.add(id); ST.set([...s]); decorate();
}, true);
try { renderList() } catch (e) {}

/* built-in dropdown for every <select> */
const menu = document.createElement('div'); menu.className = 'fg-menu fg-selmenu'; menu.hidden = true; menu.setAttribute('role', 'listbox'); document.body.appendChild(menu);
let cur_ = null;
const close = () => { menu.hidden = true; cur_ = null };
function open(sel) {
  if (sel.disabled) return; cur_ = sel; menu.innerHTML = '';
  [...sel.options].forEach((o, i) => {
    if (o.hidden) return; const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'option'); b.dataset.i = i; b.disabled = o.disabled;
    b.setAttribute('aria-selected', String(i === sel.selectedIndex)); b.className = i === sel.selectedIndex ? 'on' : ''; b.textContent = o.textContent; menu.appendChild(b);
  });
  const r = sel.getBoundingClientRect(); menu.hidden = false; menu.style.minWidth = Math.max(160, r.width) + 'px';
  const h = menu.offsetHeight, below = innerHeight - r.bottom;
  menu.style.left = Math.max(8, Math.min(r.left, innerWidth - menu.offsetWidth - 8)) + 'px';
  menu.style.top = (below > h + 12 || below > r.top ? Math.min(r.bottom + 4, innerHeight - h - 8) : Math.max(8, r.top - h - 4)) + 'px';
  (menu.querySelector('.on') || menu.querySelector('button')).focus();
}
document.addEventListener('mousedown', e => { const s = e.target.closest && e.target.closest('select'); if (!s || s.multiple || s.size > 1) return; e.preventDefault(); s.focus(); !menu.hidden && cur_ === s ? close() : open(s) }, true);
document.addEventListener('keydown', e => {
  const s = e.target; if (s && s.tagName === 'SELECT' && !s.multiple && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') && menu.hidden) { e.preventDefault(); open(s) }
}, true);
menu.addEventListener('click', e => {
  const b = e.target.closest('button[data-i]'); if (!b || !cur_) return; const s = cur_; close(); s.selectedIndex = +b.dataset.i;
  s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true })); s.focus();
});
menu.addEventListener('keydown', e => {
  const L = [...menu.querySelectorAll('button:not(:disabled)')], i = L.indexOf(document.activeElement);
  if (e.key === 'ArrowDown') { e.preventDefault(); L[(i + 1) % L.length].focus() } else if (e.key === 'ArrowUp') { e.preventDefault(); L[(i - 1 + L.length) % L.length].focus() }
  else if (e.key === 'Escape') { e.stopPropagation(); const s = cur_; close(); s && s.focus() } else if (e.key === 'Tab') close();
});
document.addEventListener('pointerdown', e => { if (!menu.hidden && !e.target.closest('.fg-selmenu') && !(e.target.closest && e.target.closest('select'))) close() }, true);
addEventListener('resize', close); addEventListener('blur', close);
})();
;
/* MOSAIC-PHONE: page-type switcher for small screens (replaces the big tab row) */
(() => {
'use strict';
const $ = s => document.querySelector(s), tabs = $('#tabs'), sh = $('#sh'); if (!tabs || !sh) return;
const NAMES = { w: 'Whiteboard', d: 'Doc', b: 'Board', f: 'Design' };
const btn = document.createElement('button'); btn.id = 'fgTy'; btn.type = 'button'; btn.setAttribute('aria-haspopup', 'menu'); btn.setAttribute('aria-label', 'Page type');
sh.before(btn);
const menu = document.createElement('div'); menu.className = 'fg-menu fg-sheetm'; menu.hidden = true; menu.setAttribute('role', 'menu'); document.body.appendChild(menu);
const close = () => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false') };
const cur = () => { const b = tabs.querySelector('.on-btn'); return b ? b.dataset.w : 'b' };
function sync() { const c = cur(); btn.innerHTML = MosaicIcons.kind(c) + '<svg class="i" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>'; btn.title = NAMES[c] + ' page' }
new MutationObserver(sync).observe(tabs, { childList: true }); sync();
btn.onclick = () => {
  if (!menu.hidden) return close();
  const c = cur(); menu.innerHTML = '<div class="fg-lab" style="margin:0;padding:2px 8px 6px">Switch to</div>' + Object.entries({ b: 'Board', d: 'Doc', w: 'Whiteboard', f: 'Design' }).map(([k, n]) => '<button type="button" role="menuitem" data-k="' + k + '"' + (k === c ? ' aria-current="true"' : '') + '>' + MosaicIcons.kind(k) + '<span><b>' + n + '</b><small>' + ({ b: 'Cards on a free canvas', d: 'Write with blocks', w: 'Sketch and think', f: 'Frames and layers' })[k] + '</small></span></button>').join('');
  menu.hidden = false; btn.setAttribute('aria-expanded', 'true');
  if (!matchMedia('(max-width:760px)').matches) { const r = btn.getBoundingClientRect(); menu.style.left = Math.max(8, r.right - 260) + 'px'; menu.style.top = r.bottom + 6 + 'px' }
};
menu.onclick = e => { const b = e.target.closest('button[data-k]'); if (!b) return; close(); const t = tabs.querySelector('[data-w=' + b.dataset.k + ']'); t && t.click() };
document.addEventListener('pointerdown', e => { if (!menu.hidden && !e.target.closest('.fg-sheetm,#fgTy')) close() }, true);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) close() });
})();

