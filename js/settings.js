/* Mosaic settings window, organised into categories. Replaces the old single-page settings. */
(()=>{
const M=window.Mosaic,C=()=>window.MosaicCtx,P=(p,d)=>M.prefs.get(p,d);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const st=document.createElement('style');
st.textContent=`.mb.xsw{width:min(920px,96vw)!important;max-width:none!important}
.xs{display:grid;grid-template-columns:176px minmax(0,1fr);gap:18px;min-height:430px}
.xsn{display:flex;flex-direction:column;gap:2px}.xsn button{display:flex;align-items:center;text-align:left;border:0;background:none;padding:8px 10px;border-radius:8px;cursor:pointer;color:var(--tx);font:inherit}
.xsn button:hover{background:var(--hv)}.xsn button[aria-selected=true]{background:var(--hv);font-weight:600;box-shadow:inset 3px 0 var(--ac)}
.xsc{min-width:0;max-height:68vh;overflow:auto;padding:0 4px 8px 0}.xsc h3{margin:.1em 0 .5em}.xsc h4{margin:1em 0 .4em}
.xsc .cd{border:1px solid var(--bd);border-radius:12px;padding:10px 12px;margin:0 0 10px;display:grid;gap:8px}
.xsc label{display:grid;gap:4px}.xsc label.xck,.xsc label.ck{display:flex;gap:8px;align-items:center}.xsc input[type=text],.xsc input[type=url],.xsc input[type=password],.xsc input[type=number],.xsc select{font:inherit;padding:7px 9px;border-radius:9px;border:1px solid var(--bd);background:var(--bg);color:var(--tx);width:100%}
.xsc .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.xsc .grow{flex:1}.bdg{font-size:11px;padding:2px 8px;border-radius:99px;background:var(--hv);color:var(--mu)}.bdg.ok{color:#1a8f4d}.bdg.warn{color:#c47a00}.bdg.err{color:#d23}
.sw{width:30px;height:30px;border-radius:50%;border:2px solid transparent;cursor:pointer;padding:0}.sw[aria-pressed=true]{border-color:var(--tx)}
.chip{font-size:11px;padding:2px 7px;border-radius:6px;border:1px solid var(--bd);color:var(--mu)}.msg{min-height:1.2em;color:var(--mu);margin:0}
@media(max-width:700px){.xs{grid-template-columns:1fr}.xsn{flex-direction:row;overflow-x:auto}.xsn button{white-space:nowrap}}`;
document.head.appendChild(st);

const TABS=[['account','Account','user'],['appearance','Appearance','palette'],['storage','Storage','database'],['performance','Performance','gauge'],['window','Window & keys','maximize'],['files','Files & export','package'],['design','Game design','gamepad-2'],['discord','Discord','message-circle'],['plugins','Plugins','puzzle'],['about','About','info']];
let tab='account',pane=null,unsub=null;

function open(t){
 const c=C();if(!c||!c.U)return;if(t)tab=t;
 const mc=c.modal('Settings','<div class="xs"><nav class="xsn" role="tablist" aria-label="Settings categories">'+TABS.map(x=>'<button role="tab" data-t="'+x[0]+'">'+MosaicIcons.svg(x[2])+'<span class="lb">'+x[1]+'</span></button>').join('')+'</nav><section class="xsc" id="xs-c" role="tabpanel"></section></div>');
 c.M.querySelector('.mb').classList.add('xsw');pane=mc.querySelector('#xs-c');
 mc.querySelector('.xsn').onclick=e=>{const b=e.target.closest('button');if(b)show(b.dataset.t)};
 show(tab)}
function show(t){
 tab=t;if(unsub){unsub();unsub=null}
 document.querySelectorAll('.xsn button').forEach(b=>b.setAttribute('aria-selected',b.dataset.t===t));
 pane.onclick=pane.onchange=pane.oninput=pane.onsubmit=null;pane.scrollTop=0;
 (PANELS[t]||PANELS.account)(pane)}

/* generic binder: any element with data-p="pref.path" writes straight to preferences */
function bindPrefs(el){
 const set=e=>{const t=e.target,p=t.dataset&&t.dataset.p;if(!p)return;
  let v=t.type==='checkbox'?t.checked:t.type==='radio'?(t.checked?t.value:undefined):(t.type==='number'||t.type==='range')?(t.value===''?undefined:+t.value):t.value;if(v===undefined&&t.type!=='number')return;M.prefs.set(p,v)};
 el.addEventListener('change',set);el.addEventListener('input',e=>{if(e.target.type==='color'||e.target.type==='range')set(e)})}
const val=(p,d)=>esc(P(p,d));
const sel=(p,d,opts)=>'<select data-p="'+p+'">'+opts.map(o=>'<option value="'+esc(o[0])+'"'+(String(P(p,d))===String(o[0])?' selected':'')+'>'+esc(o[1])+'</option>').join('')+'</select>';
const chk=(p,d,label)=>'<label class="ck"><input type="checkbox" data-p="'+p+'"'+(P(p,d)?' checked':'')+'><span>'+label+'</span></label>';

const PANELS={
/* ---------------- Account ---------------- */
account(el){const c=C(),U=c.U;
 if(U.guest){el.innerHTML='<h3>Account</h3><div class="cd"><b>You are using Mosaic without an account</b><p class="msg">Your projects live on this device only. Nothing is sent to Mosaic or to Supabase. Sign in or create an account to share projects and use several devices.</p><form id="xgf" class="row"><label class="grow">Display name<input id="xgn" maxlength="30" value="'+esc(c.nm(U))+'" required></label><button class="pri">Save</button></form><div class="row"><button class="pri" id="xgs">Sign in or create an account</button></div></div>';
  el.querySelector('#xgf').onsubmit=e=>{e.preventDefault();const n=el.querySelector('#xgn').value.trim().slice(0,30);if(n)try{localStorage.mosaicName=n;U.user_metadata.name=n}catch(x){}};
  el.querySelector('#xgs').onclick=()=>{try{localStorage.removeItem('mosaic-guest')}catch(x){}location.assign(location.pathname+'?auth=signup')};return}
 el.innerHTML='<h3>Account</h3><div class="cd"><form id="xpf" class="row"><label class="grow">Display name<input id="xnm" maxlength="30" value="'+esc(c.nm(U))+'" required></label><button class="pri">Save</button></form><p class="msg">Signed in as <b>'+esc(U.email)+'</b></p></div>'
 +'<div class="cd"><h4>Email</h4><form id="xef"><label>New email<input id="xen" type="email" placeholder="you@example.com" autocomplete="email" required></label><button>Change email</button></form>'
 +'<h4>Password</h4><form id="xwf" class="cd" style="border:0;padding:0"><label>New password (8 or more characters)<input id="xnp" type="password" minlength="8" autocomplete="new-password" required></label><label>Confirm new password<input id="xnq" type="password" minlength="8" autocomplete="new-password" required></label><button>Change password</button></form><p id="xme" role="alert" class="msg"></p></div>'
 +'<div class="cd"><h4>Sessions and data</h4><div class="row"><button id="xsi">Sign out</button><button id="xsg">Sign out everywhere</button><button id="xex">Download my data</button><button class="xdg" id="xda">Delete my account</button></div></div>'},

/* ---------------- Appearance ---------------- */
appearance(el){
 const AC=['#b85c5c','#5b5bf0','#0984e3','#00a383','#e17055','#e84393','#8e44ad','#f5a623'],cur=P('accent','#b85c5c').toLowerCase();
 el.innerHTML='<h3>Appearance</h3><div class="cd"><b>Theme</b><div class="row">'+[['system','System'],['light','Light'],['dark','Dark']].map(o=>'<label class="ck"><input type="radio" name="th" value="'+o[0]+'" data-p="theme"'+((P('theme')||document.documentElement.dataset.t||'light')===o[0]?' checked':'')+'><span>'+o[1]+'</span></label>').join('')+'</div></div>'
 +'<div class="cd"><b>Accent colour</b><div class="row" id="xsw">'+AC.map(a=>'<button class="sw" style="background:'+a+'" data-accent="'+a+'" aria-label="Accent '+a+'" aria-pressed="'+(a===cur)+'"></button>').join('')+'<label class="ck"><input type="color" id="xac" data-p="accent" value="'+esc(cur)+'" aria-label="Custom accent colour"><span>Custom</span></label><button data-accent="#b85c5c">Reset</button></div></div>'
 +'<div class="cd">'+chk('reduceMotion',false,'Reduce motion (turn off animations)')+'</div><p class="msg">Appearance settings follow your account on every device.</p>';
 bindPrefs(el);
 el.addEventListener('click',e=>{const b=e.target.closest('[data-accent]');if(!b)return;e.preventDefault();M.prefs.set('accent',b.dataset.accent);PANELS.appearance(el)})},

/* ---------------- Storage (several Supabases) ---------------- */
storage(el){const c=C(),list=c.connList(),def=(c.conn()||{}).u;
 if(c.U.guest){const lps=c.lpList();el.innerHTML='<h3>Storage</h3><div class="cd"><b>On this device only</b><span class="msg">Without an account every project is stored in this browser or app and never leaves it. Sign in to connect a Supabase and share projects.</span>'+chk('perf.compress',true,'Compress project data on this device')+'</div>'+(lps.length?lps.map(x=>'<div class="cd" data-lp="'+esc(x.r)+'"><div class="row"><b>'+esc(x.t)+'</b><span class="bdg ok">this device only</span></div><div class="row"><a class="btn-l" href="#k='+esc(x.k)+'" data-open>Open</a><button class="xdg" data-a="lp-del">Delete from this device…</button></div></div>').join(''):'<p class="msg">No projects yet.</p>');
  bindPrefs(el);el.onclick=e=>{const b=e.target.closest('button[data-a=lp-del]');if(e.target.closest('a[data-open]')){c.closeM();return}if(b){const rid=b.closest('[data-lp]').dataset.lp;c.closeM();c.act('delete',rid)}};return}
 const row=x=>'<div class="cd" data-id="'+esc(x.id)+'"><div class="row"><b>'+esc(x.label||c.host(x.u))+'</b><small class="msg">'+esc(c.host(x.u))+'.supabase.co</small>'+(x.u===def?'<span class="bdg ok">default</span>':'')+'<span class="bdg '+(x.sec?'ok':'warn')+'">'+(x.sec?'protected':'open access')+'</span></div>'
  +'<div class="row"><button data-a="def"'+(x.u===def?' disabled':'')+'>Make default</button><button data-a="test">Test</button><button data-a="ren">Rename</button><button class="xdg" data-a="clr" title="Delete the projects you own that are stored here">Clear…</button><button class="xdg" data-a="del">Remove</button></div>'
  +'<label class="ck"><input type="checkbox" data-a="pool"'+(x.pool?' checked':'')+'><span>Let the owner use this as extra storage</span></label></div>';
 const lps=c.lpList?c.lpList():[],lpRow=x=>'<div class="cd" data-lp="'+esc(x.r)+'"><div class="row"><b>'+esc(x.t)+'</b><span class="bdg ok">this device only</span></div><div class="row"><a class="btn-l" href="#k='+esc(x.k)+'" data-open>Open</a><button data-a="lp-cloud">Move to cloud…</button><button class="xdg" data-a="lp-del">Delete from this device…</button></div></div>',
 localCard='<div class="cd"><h4 style="margin:0">Local-only projects</h4><span class="msg">A local-only project is kept in this browser or app and is never sent to Supabase: no uploads, no sync, no sharing. Create one from Home by choosing “This device only”, or make an existing project local from its card.</span>'+chk('storage.localDefault',false,'Create new projects as local-only by default')+chk('projects.wipeDefault',true,'When I delete a project I own, wipe its data from Supabase by default')+'</div>'+(lps.length?lps.map(lpRow).join(''):'<p class="msg">No local-only projects yet.</p>');
 el.innerHTML='<h3>Storage</h3>'+localCard+'<h4>Supabase</h4><p class="msg">Projects are stored in Supabase projects you own. Add as many as you like, pick a default, and choose where each new project goes when you create it. Existing projects keep working if you remove a connection.</p>'
 +(list.map(row).join('')||'<div class="cd"><b>No Supabase connected yet.</b><span class="msg">Add one below to start creating projects.</span></div>')
 +'<p class="msg" id="sv-m" role="status"></p>'
 +'<div class="cd"><h4 style="margin:0">Add a Supabase</h4><form id="s-add"><label>Name<input type="text" id="sa-l" maxlength="30" placeholder="e.g. Game project"></label><label>Project URL<input type="url" id="sa-u" placeholder="https://abcd1234.supabase.co" required></label><label>Publishable (anon) key<input type="password" id="sa-k" autocomplete="off" required></label><label class="ck"><input type="checkbox" id="sa-p"><span>Let the owner use this as extra storage</span></label><button class="pri">Test and add</button></form></div>'
 +(c.DEV?'<div class="cd"><h4 style="margin:0">Owner storage pool</h4><span class="msg">Connections people have opted in to share as extra storage ('+c.POOL.length+'). New projects can use them from the storage picker, including an automatic “least used” option.</span>'+(c.POOL.map(x=>'<div class="row"><span>'+esc(x.label||c.host(x.sb_url))+'</span><small class="msg">'+esc(x.owner_email||'')+'</small></div>').join('')||'')+'<div class="row"><button id="s-dev">Open dev tools</button></div></div>':'')
 +'<details><summary>Setup SQL (run once in each Supabase SQL Editor)</summary><textarea readonly rows="8" id="xsq">'+esc(c.SQL)+'</textarea><button type="button" id="xcp">Copy SQL</button></details><details><summary>Fallback SQL (only if secure mode is blocked)</summary><textarea readonly rows="5" id="xsq2">'+esc(c.SQL2)+'</textarea><button type="button" id="xcp2">Copy fallback SQL</button></details>'
 +'<p class="msg">Sign-in accounts always live in Mosaic’s own account database; the storage above holds project data and files.</p>';
 const say=t=>{const m=el.querySelector('#sv-m');if(m)m.textContent=t},refresh=()=>{PANELS.storage(el);const h=document.getElementById('xh');if(h&&!h.hidden)c.home()};
 const commit=async(l,d,okmsg)=>{try{const n=await c.saveConns(l,d);PANELS.storage(el);say((okmsg||'Saved.')+(n?' '+n:''));const h=document.getElementById('xh');if(h&&!h.hidden)c.home()}catch(e){say(e.message)}};
 el.onclick=async e=>{const b=e.target.closest('button[data-a]');if(!b)return;const id=b.closest('[data-id]').dataset.id,x=list.find(q=>q.id===id);if(!x)return;
  if(b.dataset.a==='def')await commit(list,id,'Default changed.');
  else if(b.dataset.a==='test'){say('Testing…');say((await c.testConn(x.u,x.k))||'Connection works.')}
  else if(b.dataset.a==='ren'){const n=prompt('Name for this connection',x.label||c.host(x.u));if(n&&n.trim()){x.label=n.trim().slice(0,30);await commit(list,def&&list.find(q=>q.u===def)?list.find(q=>q.u===def).id:list[0].id,'Renamed.')}}
  else if(b.dataset.a==='clr'){c.closeM();c.act('clear',id)}
  else if(b.dataset.a==='del'){if(!confirm('Remove “'+(x.label||c.host(x.u))+'”? Projects already stored there keep working; it just disappears from this list.'))return;
   const rest=list.filter(q=>q.id!==id),dd=list.find(q=>q.u===def);await commit(rest,dd&&dd.id!==id?dd.id:(rest[0]&&rest[0].id),'Removed.')}};
 el.onchange=async e=>{const t=e.target;if(t.dataset.a!=='pool')return;const x=list.find(q=>q.id===t.closest('[data-id]').dataset.id);if(!x)return;
  if(t.checked&&!confirm('The owner (egertonzac@gmail.com) will be able to see this connection’s URL and key and store other people’s project data and files in it. Continue?')){t.checked=false;return}
  x.pool=t.checked;const dd=list.find(q=>q.u===def);await commit(list,dd?dd.id:list[0].id,t.checked?'Shared as extra storage.':'No longer shared.')};
 el.onsubmit=async e=>{e.preventDefault();if(e.target.id!=='s-add')return;
  const u=el.querySelector('#sa-u').value.trim().replace(/\/+$/,''),k=el.querySelector('#sa-k').value.trim(),lb=el.querySelector('#sa-l').value.trim().slice(0,30),pool=el.querySelector('#sa-p').checked;
  if(list.some(x=>x.u===u)){say('That Supabase is already in the list.');return}
  say('Testing…');const m=await c.testConn(u,k);if(m){say(m);return}
  say('Checking protection…');const sc=await c.testSecure(u,k);if(sc==='cors'){say('Your Supabase blocked the extra security headers. Run the fallback SQL below, then try again.');return}
  if(pool&&!confirm('The owner (egertonzac@gmail.com) will be able to see this connection’s URL and key and store other people’s project data and files in it. Continue?'))return;
  const x={id:'c'+Date.now().toString(36),label:lb||c.host(u),u,k,sec:sc==='secure',pool};const l=[...list,x],dd=list.find(q=>q.u===def);
  await commit(l,dd?dd.id:x.id,sc==='secure'?'Added. Database-level protection is on.':'Added, but this Supabase still uses open access. Run the setup SQL to switch protection on.')};
 const dv=el.querySelector('#s-dev');if(dv)dv.onclick=()=>c.devtools();
 bindPrefs(el);
 const prev=el.onclick;el.onclick=e=>{const b=e.target.closest('button[data-a^=lp-]'),a=e.target.closest('a[data-open]');
  if(a){c.closeM();return}
  if(b){const rid=b.closest('[data-lp]').dataset.lp;c.closeM();c.act(b.dataset.a==='lp-cloud'?'cloud':'delete',rid);return}
  return prev&&prev(e)}},

/* ---------------- Performance & storage ---------------- */
performance(el){
 const projName=rid=>{try{const c=C(),l=[...(c.list?c.list():[]),...(c.lpList?c.lpList():[])],p=l.find(x=>x.r===rid);return esc(p?p.t:rid.slice(0,8)+'…')}catch(e){return esc(String(rid).slice(0,8))}};
 const draw=()=>{const u=window.MosaicPack?MosaicPack.usage():{total:0,projects:[],other:0},F=window.MosaicPack?MosaicPack.fmt:String;
  el.innerHTML='<h3>Performance &amp; storage</h3>'
  +'<div class="cd"><b>Compression</b>'+chk('perf.compress',true,'Compress project data kept on this device (usually 5× smaller, nothing is lost)')+chk('perf.gzipFiles',true,'Compress text-like attachments (JSON, SVG, CSV, source files) before storing or uploading')+chk('files.compressZip',true,'Compress ZIP exports (JSON and SVG shrink; PNGs stay as they are)')+'<span class="msg">Backups: choose “Backup (.mosaic, compressed)” in the Export panel. It restores like any backup.</span></div>'
  +'<div class="cd"><b>Images</b><label>Longest side when importing an image (px)<input type="number" min="256" max="4096" step="64" data-p="perf.imgMax" value="'+val('perf.imgMax',900)+'"></label><label>JPEG quality<input type="range" min="0.4" max="1" step="0.02" data-p="perf.imgQuality" value="'+val('perf.imgQuality',.82)+'"></label><span class="msg">Applies to images you add from now on. Smaller images keep boards quick and projects small.</span></div>'
  +'<div class="cd"><b>On this device</b><span class="msg">'+F(u.total)+' used by Mosaic here. Most browsers allow roughly 10 MB of this kind of storage.</span><div class="bar"><i style="width:'+Math.min(100,u.total/10485760*100).toFixed(1)+'%"></i></div>'
  +(u.projects.length?u.projects.map(p=>'<div class="row"><span class="grow">'+projName(p.rid)+'</span><small class="msg">'+F(p.bytes)+(p.packed?' · compressed':'')+(p.versions?' · restore points '+F(p.versions):'')+'</small></div>').join(''):'<span class="msg">No projects stored here yet.</span>')
  +'<div class="row"><button data-a="pk">Compress everything now</button><button data-a="rp">Delete all restore points</button></div><p class="msg" id="pf-m" role="status"></p></div>'
  +'<div class="cd"><b>Sync and motion</b><span class="msg">With live updates connected Mosaic only checks the server about once a minute, and not at all while the tab is hidden.</span>'+chk('reduceMotion',false,'Reduce motion (turn off animations)')+'</div>';
  bindPrefs(el)};
 draw();
 el.onclick=e=>{const b=e.target.closest('button[data-a]');if(!b||!window.MosaicPack)return;
  if(b.dataset.a==='pk'){const r=MosaicPack.compressAll();draw();el.querySelector('#pf-m').textContent=r.count?'Compressed '+r.count+' item(s) and saved '+MosaicPack.fmt(r.saved)+'.':'Everything is already compressed.'}
  else if(b.dataset.a==='rp'){if(!confirm('Delete every restore point on this device? Your projects are not touched.'))return;const n=MosaicPack.clearRestorePoints();draw();el.querySelector('#pf-m').textContent='Deleted restore points for '+n+' project(s).'}}},

/* ---------------- Window & keys ---------------- */
window(el){const app=!!window.MOSAIC_APP,W=M.window||{};
 el.innerHTML='<h3>Window &amp; keyboard</h3><div class="cd"><b>Full screen</b><span class="msg">Press <kbd>F11</kbd> any time to switch full screen on or off. <kbd>Shift</kbd>+<kbd>F11</kbd> hides the toolbars too (focus mode) and <kbd>Esc</kbd> brings them back.</span><div class="row"><button id="w-fs">Toggle full screen</button><button id="w-fm">Toggle focus mode</button></div>'+chk('window.hint',true,'Show a short hint when entering full screen')+'</div>'
 +(app?'<div class="cd"><b>This app</b><label class="ck"><input type="checkbox" data-n="startFullscreen"><span>Start in full screen</span></label><label class="ck"><input type="checkbox" data-n="remember"><span>Remember window size and position</span></label></div>':'')
 +'<div class="cd"><b>Shortcuts</b><div class="ksh">'+[['F11','Full screen'],['Shift+F11','Focus mode (hide toolbars)'],['Ctrl+Shift+P','Command palette'],['Ctrl+K','Search this project'],['/','Search (Home and Discover)'],['Esc','Close panels, leave focus mode'],['?','All board shortcuts']].map(k=>'<span><kbd>'+k[0]+'</kbd></span><span>'+k[1]+'</span>').join('')+'</div><span class="msg">On a Mac use Cmd instead of Ctrl.</span></div>';
 bindPrefs(el);
 el.querySelector('#w-fs').onclick=()=>W.toggleFullscreen&&W.toggleFullscreen();el.querySelector('#w-fm').onclick=()=>{C().closeM();W.toggleFocus&&W.toggleFocus()};
 if(app&&W.nativeState)W.nativeState().then(s=>{el.querySelectorAll('[data-n]').forEach(i=>{i.checked=!!s[i.dataset.n]})});
 el.onchange=e=>{const t=e.target;if(t.dataset&&t.dataset.n&&W.setNative)W.setNative(t.dataset.n,t.checked)}},

/* ---------------- Files & export ---------------- */
files(el){
 el.innerHTML='<h3>Files &amp; export</h3><div class="cd"><b>Design export defaults</b>'
 +'<label>Default format'+sel('files.format','zip-png',[['zip-png','UI assets ZIP (PNG per item)'],['zip-atlas','Sprite atlas ZIP'],['zip-svg','UI assets ZIP (SVG per item)']])+'</label>'
 +'<label>Image scale (1x, or several like 1x,2x,3x)<input type="text" data-p="files.scale" value="'+val('files.scale','1x')+'"></label>'
 +chk('files.merge',true,'Merge overlapping items into one asset (button + label)')+chk('files.preview',true,'Include a preview image in the ZIP')
 +'</div><div class="cd"><b>Asset names</b><label>Name assets from'+sel('files.naming','text',[['text','Their text (Play, Settings…)'],['type','Their type (rect-1, oval-2…)']])+'</label>'
 +'<label>Prefix for every asset name (optional)<input type="text" data-p="files.prefix" maxlength="30" placeholder="e.g. ui_" value="'+val('files.prefix','')+'"></label><span class="msg">You can also name or skip individual items with the Asset button when an item is selected.</span></div>'
 +'<div class="cd"><b>Other exports</b>'+chk('files.transparent',true,'Transparent background for single PNG exports')+'<span class="msg">Backups, PDF, JPG and SVG are in the Export panel. In the desktop/mobile app every export opens a native Save dialog.</span></div>';
 bindPrefs(el)},

/* ---------------- Game design ---------------- */
design(el){const g=P('design.guide','none');
 el.innerHTML='<h3>Game design</h3><div class="cd"><b>Reference resolution</b><span class="msg">Draws an outline of your target screen on design pages so you can lay out UI to scale. It is a guide only, not a frame, and is never exported.</span>'
 +'<label>Guide'+sel('design.guide','none',[['none','None'],['1920x1080','1920×1080 · Full HD'],['1280x720','1280×720 · HD'],['2560x1440','2560×1440 · QHD'],['1080x1920','1080×1920 · phone portrait'],['844x390','844×390 · phone landscape'],['390x844','390×844 · phone (points)'],['360x800','360×800 · Android'],['custom','Custom size…']])+'</label>'
 +'<div class="row" id="xcs"'+(g==='custom'?'':' hidden')+'><label class="grow">Width<input type="number" min="16" max="16384" data-p="design.cw" value="'+val('design.cw',1920)+'"></label><label class="grow">Height<input type="number" min="16" max="16384" data-p="design.ch" value="'+val('design.ch',1080)+'"></label></div>'
 +'<label>Safe-area margin (% of each edge)<input type="number" min="0" max="25" data-p="design.safe" value="'+val('design.safe',5)+'"></label>'+chk('design.showGuide',true,'Show the guide')+'</div>'
 +'<div class="cd"><b>Grid</b><label>Grid size in px (0 = off)<input type="number" min="0" max="256" data-p="design.grid" value="'+val('design.grid',0)+'"></label>'+chk('design.snap',false,'Snap to grid while moving (hold Alt to bypass)')+chk('design.showGrid',false,'Show the grid')+'</div>'
 +'<div class="cd"><b>Per-item game settings</b><span class="msg">Select an item on a design page and press Asset to set its export name, 9-slice borders and pivot. They are written into layout.json for your game engine.</span></div>';
 bindPrefs(el);el.addEventListener('change',e=>{if(e.target.dataset.p==='design.guide')el.querySelector('#xcs').hidden=e.target.value!=='custom'})},

/* ---------------- Discord ---------------- */
discord(el){const d=M.discord.get();
 el.innerHTML='<h3>Discord</h3><div class="cd"><span class="msg">Post updates from Mosaic into a Discord channel through a webhook (Server Settings → Integrations → Webhooks → New Webhook → Copy URL). This is a one-way notification link; a full interactive bot needs its own always-on server. The webhook address is a secret, so it is kept on this device only.</span>'
 +'<form id="s-dc"><label>Webhook URL<input type="password" id="dc-u" autocomplete="off" placeholder="https://discord.com/api/webhooks/…" value="'+esc(d.url)+'"></label><label>Name shown in Discord<input type="text" id="dc-n" maxlength="80" value="'+esc(d.name||'Mosaic')+'"></label>'
 +'<b>Send a message when…</b><label class="ck"><input type="checkbox" id="dc-e" '+(d.events.export?'checked':'')+'><span>an export finishes</span></label><label class="ck"><input type="checkbox" id="dc-c" '+(d.events.comment?'checked':'')+'><span>a comment is added</span></label><label class="ck"><input type="checkbox" id="dc-p" '+(d.events.page?'checked':'')+'><span>a page is created</span></label>'
 +'<div class="row"><button class="pri">Save</button><button type="button" id="dc-t">Send test message</button><button type="button" id="dc-x" class="xdg">Disconnect</button></div></form><p class="msg" id="dc-m" role="status"></p></div>';
 const say=t=>el.querySelector('#dc-m').textContent=t,read=()=>({url:el.querySelector('#dc-u').value.trim(),name:el.querySelector('#dc-n').value.trim()||'Mosaic',events:{export:el.querySelector('#dc-e').checked,comment:el.querySelector('#dc-c').checked,page:el.querySelector('#dc-p').checked}});
 el.onsubmit=e=>{e.preventDefault();const c=read();if(c.url&&!M.discord.valid(c.url)){say('That does not look like a Discord webhook URL.');return}M.discord.set(c);say(c.url?'Saved.':'Saved (no webhook set).')};
 el.onclick=async e=>{const b=e.target.closest('button');if(!b)return;
  if(b.id==='dc-t'){const c=read();if(!M.discord.valid(c.url)){say('Paste a valid Discord webhook URL first.');return}M.discord.set(c);say('Sending…');try{await M.discord.send('Test from Mosaic','Notifications are working.');say('Sent. Check your Discord channel.')}catch(x){say(x.message)}}
  else if(b.id==='dc-x'){M.discord.set({...read(),url:''});el.querySelector('#dc-u').value='';say('Disconnected.')}}},

/* ---------------- Plugins ---------------- */
plugins(el){
 delete el.dataset.sv;el.onsubmit=el.oninput=el.onchange=null;
 const draw=()=>{const L=M.plugins.list();
  el.innerHTML='<h3>Plugins</h3><p class="msg">Plugins add buttons, settings and export formats. They run with the same access as Mosaic itself, so only turn on plugins you trust.</p>'
  +'<div class="row xstb"><button class="pri" data-s="store">Plugin store</button><button data-s="submit">Submit a plugin</button><button data-s="mine">My submissions</button>'+(C().DEV?'<button data-s="review">Review queue <span class="bdg warn" id="xrq" hidden></span></button>':'')+'<button data-s="docs">Docs</button></div>'
  +(L.map(p=>'<div class="cd" data-id="'+esc(p.id)+'"><div class="row"><b>'+esc(p.name)+'</b><small class="msg">v'+esc(p.version)+' · '+esc(p.source)+(p.author?' · '+esc(p.author):'')+'</small><span class="bdg '+(p.state==='active'?'ok':p.state==='error'||p.state==='invalid'?'err':'')+'">'+esc(p.state)+'</span><span class="grow"></span>'
   +(p.state==='invalid'?'':'<button data-a="tg" class="'+(p.enabled?'':'pri')+'">'+(p.enabled?'Turn off':'Turn on')+'</button>')+(p.source==='store'?'<button class="xdg" data-a="un">Uninstall</button>':'')+'</div>'
   +'<span class="msg">'+esc(p.description)+'</span>'+(p.error?'<span class="msg" style="color:#d23">'+esc(p.error)+'</span>':'')
   +'<div class="row">'+p.permissions.map(x=>'<span class="chip" title="'+esc(M.plugins.permissions[x]||'')+'">'+esc(x)+'</span>').join('')+'</div>'
   +p.settings.map((s,i)=>'<div class="cd"><b>'+esc(s.title)+'</b><div data-ps="'+esc(p.id)+':'+i+'"></div></div>').join('')+'</div>').join('')||'<div class="cd"><b>No plugins found.</b></div>')
  +'<div class="cd"><b>Add your own</b><span class="msg" id="xpd"></span><span class="msg">Or share it with everyone: <b>Submit a plugin</b> sends it to the Plugin store for review.</span><div class="row"><button data-a="rl">Reload plugin list</button></div></div>';
  if(C().DEV&&window.MosaicStore)MosaicStore.pendingCount().then(n=>{const b=el.querySelector('#xrq');if(b&&n){b.textContent=n;b.hidden=false}});
  L.forEach(p=>p.settings.forEach((s,i)=>{const d=el.querySelector('[data-ps="'+p.id+':'+i+'"]');try{s.render(d)}catch(e){d.textContent='This settings section failed: '+e.message}}));
  (window.MosaicAppReady||Promise.resolve()).then(()=>{const a=window.MOSAIC_APP,x=el.querySelector('#xpd');if(x)x.innerHTML=a&&a.pluginsDir?'Put a plugin folder (with <code>manifest.json</code> and its script) in <code>'+esc(a.pluginsDir)+'</code>, then press Reload. See PLUGINS.md.':'Add a folder under <code>plugins/</code> on your site and list it in <code>plugins/index.json</code>. See PLUGINS.md.'})};
 draw();unsub=M.on('plugins:changed',()=>{if(document.body.contains(el)&&tab==='plugins'&&!el.dataset.sv&&!el.contains(document.activeElement))draw()});
 el.onclick=async e=>{const sb=e.target.closest('button[data-s]');if(sb&&window.MosaicStore){if(sb.dataset.s==='docs')return MosaicStore.docs();unsub&&unsub();MosaicStore.show(el,sb.dataset.s,()=>PANELS.plugins(el));return}
  const b=e.target.closest('button[data-a]');if(!b)return;
  if(b.dataset.a==='un'){if(window.MosaicStore&&await MosaicStore.uninstall(b.closest('[data-id]').dataset.id))draw();return}
  if(b.dataset.a==='rl'){await M.plugins.reload();draw();return}
  const id=b.closest('[data-id]').dataset.id;if(b.dataset.a==='tg'){if(M.plugins.isEnabled(id))await M.plugins.disable(id);else await M.plugins.enable(id);draw()}}},

/* ---------------- About ---------------- */
about(el){
 el.innerHTML='<h3>About Mosaic</h3><div class="cd"><span>Version <b>'+esc(M.version)+'</b> · plugin API '+M.apiVersion+(window.MOSAIC_APP?' · desktop/mobile app':' · web')+'</span><div class="row"><a href="legal.html#terms" target="_blank" rel="noopener">Terms of Service</a><a href="legal.html#privacy" target="_blank" rel="noopener">Privacy Policy</a><a href="mailto:egertonzac@gmail.com">Contact</a></div></div>'
 +'<div class="cd"><b>Privacy</b><span class="msg">'+MosaicIcons.svg('eye-off')+' <b>No telemetry.</b> Mosaic has no analytics, advertising or tracking and does not phone home. It only talks to Mosaic’s account service, the Supabase projects you connect, a Discord webhook if you add one, the servers that plugins you install from the Plugin store contact (each plugin lists them), and Google Fonts only if you pick a custom font in a design.</span><span class="msg">'+MosaicIcons.svg('bot')+' <b>No AI in Mosaic.</b> Mosaic has no AI of its own and sends nothing to an AI service. Plugins from the Plugin store are written by other people and reviewed before they are listed; one may add an AI assistant, but only after you install and turn it on, and each plugin lists the servers it can contact. Mosaic itself was built with help from AI tools.</span></div>'
 +'<div class="cd"><b>Connection check</b><span class="msg">If sign-in or saving fails, this tells you whether the Mosaic account server is reachable.</span><div class="row"><button id="s-chk">Check account server</button></div><p class="msg" id="s-cm" role="status"></p></div>';
 el.onclick=async e=>{if(e.target.id!=='s-chk')return;const m=el.querySelector('#s-cm'),c=C();m.textContent='Checking…';
  try{const r=await fetch(c.SB.supabaseUrl+'/auth/v1/health',{headers:{apikey:c.SB.supabaseKey}});m.textContent=r.ok?'The account server is reachable.':'The server answered with error '+r.status+'. If you run this site, check the Supabase project status.'}
  catch(x){m.textContent='Cannot reach the account server. If you run this site, make sure the Supabase project is not paused; otherwise check your connection, VPN or ad blocker.'}}}
};

window.MosaicSettings={open,show};
})();
