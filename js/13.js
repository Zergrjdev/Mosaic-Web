(()=>{
const Q=s=>document.querySelector(s),Z=MZ,E=s=>String(s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';'),SITE=String(window.MOSAIC_SITE||'https://zergrjdev.github.io/Mosaic/').replace(/\/?$/,'/'),siteBase=()=>location.protocol==='https:'?location.origin+location.pathname.replace(/[^\/]*$/,'')+'app.html':SITE+'app.html';
let A,SB;try{SB=supabase.createClient(BAKED.url,BAKED.key,{auth:{storageKey:'mosaic-acct',detectSessionInUrl:false}});A=SB.auth}catch(e){}
const diag=async()=>{let v='';const h=e=>{v=e.violatedDirective+' '+(e.blockedURI||'')};addEventListener('securitypolicyviolation',h);let res='';
 try{const r=await fetch(BAKED.url+'/auth/v1/health',{headers:{apikey:BAKED.key}});res=r.ok?'ok':'http '+r.status}catch(e){res='net'}
 await new Promise(r=>setTimeout(r,80));removeEventListener('securitypolicyviolation',h);const hn=new URL(BAKED.url).host;
 if(v)return'Sign-in is blocked by this site’s security policy ('+v.trim()+'). The host must allow https://*.supabase.co in connect-src.';
 if(navigator.onLine===false)return'You appear to be offline. Check your connection and try again.';
 if(res==='ok')return'The account server is reachable now, so that was probably a brief network hiccup. Please try again.';
 if(res==='net')return'Can’t reach the Mosaic account server ('+hn+'). If you run this site: open the Supabase dashboard and check the project is not paused (press Restore if it is) and that the URL and key are right. Otherwise check your VPN, ad blocker or firewall.';
 return'The account server answered with '+res.replace('http ','error ')+'. If you run this site, check the Supabase project status and API keys.'};
let U=null,title='',done=null,mode='in',fails=0,lock=0;const pn=Q('#pn');pn.setAttribute('aria-label','Project title');
const nm=u=>(u.user_metadata&&u.user_metadata.name)||(u.email||'').split('@')[0]||'Guest',
 list=()=>[...((U&&U.user_metadata&&U.user_metadata.projects)||[])],
 save=async l=>{if(U&&U.guest)return;const{data,error}=await A.updateUser({data:{projects:l}});if(error)throw error;U=data.user},
 GK='mosaic-guest',isGuest=()=>{try{return localStorage[GK]==='1'}catch(e){return false}},
 guestUser=()=>({id:'guest',guest:true,email:'',aud:'guest',user_metadata:{name:(()=>{try{return localStorage.mosaicName||'Guest'}catch(e){return'Guest'}})(),projects:[]}}),
 hs=p=>p.k?'k='+p.k:p.g?'room='+encodeURIComponent(p.r)+(p.s==='r'?'&ro=1':''):'r='+p.r,
 LPK='mosaic-local-projects',lpList=()=>{try{const a=JSON.parse(localStorage[LPK]||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}},lpSave=l=>{try{localStorage[LPK]=JSON.stringify(l)}catch(e){}},
 lpClean=r=>{['mosaic:'+r,'mosaic:'+r+':damaged','mosaic:cfg:'+r,'mosaic-ver:'+r,'mosaic-seen:'+r,'mosaic-local:'+r].forEach(k=>{try{localStorage.removeItem(k)}catch(e){}})};
history.replaceState(null,'',location.pathname+location.search+(Z.home?'':'#'+(Z.k?'k='+Z.k:Z.legacy?'room='+encodeURIComponent(Z.rid)+(Z.role==='r'?'&ro=1':''):'r='+Z.rid)+Z.cfg+(Z.pub?'&pub=1':'')));
addEventListener('hashchange',()=>location.reload());
const X=document.createElement('div');X.id='xa';X.className='wait';X.innerHTML='<form id="xaf"><b class="lg">Mosaic</b><h2 id="xat">Sign in</h2><p id="xac"></p><div class="xtabs" id="xtb"><button type="button" data-m="in" class="on">Sign in</button><button type="button" data-m="up">Create account</button></div><label id="xnl" hidden>Your name<input id="xan" autocomplete="name" maxlength="30"></label><label id="xel">Email<input id="xae" type="email" required autocomplete="email"></label><label id="xpl"><span>Password</span><input id="xap" type="password" required minlength="8" autocomplete="current-password"></label><label id="xcl" hidden>Confirm new password<input id="xaq" type="password" required minlength="8" autocomplete="new-password" disabled></label><label id="xtl" class="xck" hidden><input type="checkbox" id="xtc" required disabled><span>I agree to the <a href="legal.html#terms" target="_blank" rel="noopener">Terms of Service</a> and <a href="legal.html#privacy" target="_blank" rel="noopener">Privacy Policy</a>.</span></label><p id="xer" role="alert"></p><button class="pri" id="xgo">Sign in</button><button type="button" class="xlk" id="xrs" hidden>Resend confirmation email</button><button type="button" class="xlk" id="xfg">Forgot your password?</button><button type="button" class="xlk" id="xbk" hidden>Back to sign in</button><div id="xgw" hidden><hr><button type="button" class="xgb2" id="xgu">Continue without an account</button><p class="xgh">Projects stay on this device only. You can sign in later.</p></div><p class="lgl"><a href="legal.html#terms" target="_blank" rel="noopener">Terms</a> · <a href="legal.html#privacy" target="_blank" rel="noopener">Privacy</a></p></form>';document.body.appendChild(X);
const V={in:'xtb xel xpl xfg',up:'xtb xnl xel xpl xtl',reset:'xel xbk',new:'xpl xcl'},T={in:['Sign in','Sign in'],up:['Create your account','Create account'],reset:['Reset your password','Send reset link'],new:['Choose a new password','Update password']};
const tab=m=>{mode=m;const v=V[m].split(' ');for(const i of['xtb','xnl','xel','xpl','xcl','xfg','xbk','xtl','xrs'])Q('#'+i).hidden=!v.includes(i);
 [['xan','xnl'],['xae','xel'],['xap','xpl'],['xaq','xcl'],['xtc','xtl']].forEach(([i,l])=>Q('#'+i).disabled=Q('#'+l).hidden);
 X.querySelectorAll('.xtabs button').forEach(b=>b.classList.toggle('on',b.dataset.m===m));Q('#xat').textContent=T[m][0];Q('#xgo').textContent=T[m][1];
 Q('#xpl span').textContent=m==='new'?'New password':'Password';Q('#xap').autocomplete=m==='in'?'current-password':'new-password'};
X.querySelector('.xtabs').onclick=e=>{const b=e.target.closest('button');if(b){Q('#xer').textContent='';tab(b.dataset.m)}};Q('#xrs').onclick=async()=>{const er=Q('#xer'),{error}=await A.resend({type:'signup',email:Q('#xae').value.trim(),options:{emailRedirectTo:siteBase()}});er.style.color=error?'':'var(--tx)';er.textContent=error?error.message:'Confirmation email sent. Check your inbox and spam folder.'};Q('#xfg').onclick=()=>{Q('#xer').textContent='';tab('reset')};Q('#xbk').onclick=()=>{Q('#xer').textContent='';tab('in')};tab('in');
Q('#xaf').onsubmit=async e=>{e.preventDefault();const em=Q('#xae').value.trim(),pw=Q('#xap').value,er=Q('#xer'),go=Q('#xgo');er.textContent='';er.style.color='';if(Date.now()<lock){er.textContent='Too many attempts. Try again in '+Math.ceil((lock-Date.now())/1000)+' seconds.';return}go.disabled=true;
 try{if(mode==='reset'){const{error}=await A.resetPasswordForEmail(em,{redirectTo:siteBase()});if(error)throw error;er.style.color='var(--tx)';er.textContent='If an account exists for '+em+', a reset link is on its way. Check your inbox and spam folder.';return}
  if(mode==='new'){if(pw!==Q('#xaq').value){er.textContent='The two passwords do not match.';return}const{data,error}=await A.updateUser({password:pw});if(error)throw error;U=data.user;X.hidden=true;done&&done();return}
  if(mode==='up'){const{data,error}=await A.signUp({email:em,password:pw,options:{emailRedirectTo:siteBase(),data:{name:Q('#xan').value.trim()||em.split('@')[0],projects:[],terms:TV,terms_at:new Date().toISOString()}}});if(error)throw error;if(!data.session){er.style.color='var(--tx)';er.textContent='Account created. Check your email to confirm it, then sign in.';tab('in');return}}
  else{const{error}=await A.signInWithPassword({email:em,password:pw});if(error)throw error}
  U=(await A.getSession()).data.session.user;X.hidden=true;done&&done()}catch(x){er.style.color='';er.textContent=x.message||'Something went wrong';if(/failed to fetch|networkerror|load failed|network request failed/i.test(x.message||''))diag().then(m=>{er.textContent=m});Q('#xrs').hidden=!/not confirmed/i.test(x.message||'');if(mode==='in'&&++fails>=5){lock=Date.now()+3e4;fails=0}}finally{go.disabled=false}};
const need=c=>new Promise(ok=>{done=ok;Q('#xgw').hidden=!(Z.home||Z.local);Q('#xac').textContent=c;X.classList.remove('wait');X.hidden=false;X.querySelector('input:not(:disabled)').focus()});
Q('#xgu').onclick=()=>{U=guestUser();try{localStorage[GK]='1'}catch(e){}done&&done()};
const reg=async()=>{if(Z.dv){title=Z.n||'Project';pn.value=title;pn.disabled=true;document.title=title+' · dev view';return}
 if(Z.local){const lp=lpList(),q=lp.find(x=>x.r===Z.rid);if(q){q.d=Date.now();lpSave(lp);title=q.t}else title='Local project';pn.value=title;document.title=title+' · Mosaic';return}
 const l=list();let p=l.find(x=>x.r===Z.rid);
 if(!p){if(Z.c&&!confirm('Open “'+(Z.n||'this project')+'”'+(Z.o?' shared by '+Z.o:'')+'?\n\nIt is stored on '+host(Z.c.u)+', a Supabase project run by someone else. Only continue if you trust the person who sent you this link.')){location.assign(location.pathname+location.search);return}p={r:Z.rid,k:Z.k,t:Z.n||'Shared project',s:Z.role,w:Z.o,g:Z.legacy,c:Z.c||null,a:Date.now()};l.unshift(p)}
 else{if(Z.c&&!p.c)p.c=Z.c;if(Z.k&&!p.k){p.k=Z.k;if(p.s==='r')p.s='e'}if(Z.role==='r'&&p.s!=='r'){location.hash=hs(p);return}}
 p.d=Date.now();title=p.t;pn.value=title;document.title=title+' · Mosaic';try{await save(l)}catch(e){}};
pn.addEventListener('change',async()=>{if(Z.local){const t=pn.value.trim().slice(0,60)||title;pn.value=t;title=t;document.title=t+' · Mosaic';const lp=lpList(),q=lp.find(x=>x.r===Z.rid);if(q){q.t=t;lpSave(lp)}return}const t=pn.value.trim().slice(0,60)||title;pn.value=t;const l=list(),p=l.find(x=>x.r===Z.rid);title=t;document.title=t+' · Mosaic';if(p){p.t=t;try{await save(l)}catch(e){}if(p.s==='o')try{await SB.from('mosaic_projects').update({title:t}).eq('rid',Z.rid)}catch(e){}}});
pn.addEventListener('keydown',e=>{if(e.key==='Enter')pn.blur()});
Q('#sd .brand').insertAdjacentHTML('afterend','<button id="xhb">⌂ All projects</button>');Q('#xhb').onclick=()=>location.assign(location.pathname+location.search);
Q('#th').insertAdjacentHTML('beforebegin','<button id="xsb">⚙ Settings</button>');Q('#xsb').onclick=()=>U&&settings();
if(matchMedia('(pointer:coarse)').matches&&Math.min(screen.width,screen.height)<=600&&innerWidth>900){let d=false;try{d=sessionStorage.xdt}catch(e){}if(!d){const b=document.createElement('div');b.id='xdt';b.setAttribute('role','status');b.style.fontSize=Math.round(14*innerWidth/screen.width)+'px';b.innerHTML='<span>This page is in “Desktop site” mode, so everything looks tiny. Open your browser menu and turn off Desktop site to get the phone layout.</span><button>Got it</button>';b.querySelector('button').onclick=()=>{b.remove();try{sessionStorage.xdt=1}catch(e){}};document.body.appendChild(b)}}
const sh=Q('#sh'),o=sh.onclick;sh.onclick=()=>{if(Z.local){try{Mosaic.toast('This project is local-only, so it cannot be shared. Use Home → Move to cloud… first.')}catch(e){}return}o&&o();const p=list().find(x=>x.r===Z.rid)||{},b=siteBase(),m='&n='+encodeURIComponent(title)+'&o='+encodeURIComponent(me.n),x=Z.c||CFG.url!==BAKED.url?'&sb='+encodeURIComponent(CFG.url)+'&key='+encodeURIComponent(CFG.key)+(Z.sec?'&sec=1':''):'';
 Q('#lnk').value=p.s==='r'?'':b+'#'+(p.k?'k='+p.k:'room='+encodeURIComponent(Z.rid))+m+x;Q('#lnk').placeholder='Read-only access: no edit link to share';
 Q('#lnk2').value=b+'#'+(p.g?'room='+encodeURIComponent(Z.rid)+'&ro=1':'r='+Z.rid)+m+x;
 Q('#shp').textContent='Whoever opens a link signs in and the project is added to their account. Edit links let them change the board. Read-only links cannot be turned into edit links by changing the address. Treat both as secrets: the app enforces this, the database does not.'};
const OWNER='egertonzac@gmail.com',TV='2026-10-09',SQL="-- Run once in YOUR OWN Supabase project (SQL Editor). Projects you create are stored here.\n-- This version protects your data in the database itself:\n--   * a project can only be READ by someone who knows its project id (x-room header)\n--   * a project can only be CHANGED by someone who holds its edit key (x-edit header)\n-- so read-only links really are read-only, and nobody can list other projects.\ncreate table if not exists public.mosaic_items(\n  room text not null, k text not null, id text not null, v jsonb,\n  updated_at timestamptz not null default now(),\n  primary key (room, k, id));\ncreate index if not exists mosaic_items_room_updated on public.mosaic_items(room, updated_at);\ncreate or replace function public.mosaic_touch() returns trigger language plpgsql as $$ begin new.updated_at := now(); return new; end $$;\ndrop trigger if exists mosaic_touch on public.mosaic_items;\ncreate trigger mosaic_touch before insert or update on public.mosaic_items for each row execute function public.mosaic_touch();\n\ncreate or replace function public.mosaic_hdr(n text) returns text language sql stable as\n$$ select coalesce((nullif(current_setting('request.headers', true), '')::json) ->> n, '') $$;\ncreate or replace function public.mosaic_room_of(edit text) returns text language sql immutable as\n$$ select case when coalesce(edit, '') = '' then null else left(encode(sha256(convert_to(edit, 'UTF8')), 'hex'), 32) end $$;\ngrant execute on function public.mosaic_hdr(text), public.mosaic_room_of(text) to anon;\n\nalter table public.mosaic_items enable row level security;\ndrop policy if exists \"mosaic anon access\" on public.mosaic_items;\ndrop policy if exists mosaic_read on public.mosaic_items;\ndrop policy if exists mosaic_ins on public.mosaic_items;\ndrop policy if exists mosaic_upd on public.mosaic_items;\ndrop policy if exists mosaic_del on public.mosaic_items;\ncreate policy mosaic_read on public.mosaic_items for select to anon using (room = public.mosaic_hdr('x-room'));\ncreate policy mosaic_ins on public.mosaic_items for insert to anon with check (room = public.mosaic_room_of(public.mosaic_hdr('x-edit')));\ncreate policy mosaic_upd on public.mosaic_items for update to anon using (room = public.mosaic_room_of(public.mosaic_hdr('x-edit'))) with check (room = public.mosaic_room_of(public.mosaic_hdr('x-edit')));\ncreate policy mosaic_del on public.mosaic_items for delete to anon using (room = public.mosaic_room_of(public.mosaic_hdr('x-edit')));\n\n-- File uploads (files live in a public bucket under an unguessable folder per project)\ninsert into storage.buckets (id, name, public, file_size_limit) values ('mosaic-files', 'mosaic-files', true, 52428800) on conflict (id) do nothing;\ndrop policy if exists \"mosaic-files insert\" on storage.objects;\ncreate policy \"mosaic-files insert\" on storage.objects for insert to anon with check (bucket_id = 'mosaic-files');\ndrop policy if exists \"mosaic-files select\" on storage.objects;\ncreate policy \"mosaic-files select\" on storage.objects for select to anon using (bucket_id = 'mosaic-files');\ndrop policy if exists \"mosaic-files delete\" on storage.objects;\ncreate policy \"mosaic-files delete\" on storage.objects for delete to anon using (bucket_id = 'mosaic-files');\n",SQL2="-- FALLBACK ONLY. Use this if the app says your Supabase blocked the extra security headers.\n-- It returns your table to open access (anyone with your anon key can read and write every project).\ndrop policy if exists mosaic_read on public.mosaic_items;\ndrop policy if exists mosaic_ins on public.mosaic_items;\ndrop policy if exists mosaic_upd on public.mosaic_items;\ndrop policy if exists mosaic_del on public.mosaic_items;\ndrop policy if exists \"mosaic anon access\" on public.mosaic_items;\ncreate policy \"mosaic anon access\" on public.mosaic_items for all to anon using (true) with check (true);\n",rx=/^https:\/\/[a-z0-9-]+\.supabase\.co$/;
let DEV=false,POOL=[],PJ={},lk_=false,NOTE='';
const connList=()=>{const m=(U&&U.user_metadata)||{};if(Array.isArray(m.sbs))return m.sbs;return m.sb?[{id:'c1',label:host(m.sb.u),u:m.sb.u,k:m.sb.k,sec:!!m.sb.sec,pool:!!m.sb.pool}]:[]},
 conn=()=>{const m=(U&&U.user_metadata)||{},l=connList(),d=l.find(x=>x.id===m.sbd)||l[0];return d?{u:d.u,k:d.k,pool:!!d.pool,sec:!!d.sec}:(m.sb||null)},
 syncPool=async l=>{let note='';const want=l.filter(x=>x.pool);try{const mine=(await SB.from('mosaic_pool').select('sb_url').eq('owner',U.id)).data||[];
   for(const r of mine)if(!want.some(x=>x.u===r.sb_url))await SB.from('mosaic_pool').delete().eq('owner',U.id).eq('sb_url',r.sb_url);
   for(const x of want){const row={owner:U.id,owner_email:U.email,label:x.label||host(x.u),sb_url:x.u,sb_key:x.k,sec:!!x.sec};
    let r=await SB.from('mosaic_pool').upsert(row,{onConflict:'owner,sb_url'});
    if(r.error&&want.indexOf(x)===0){r=await SB.from('mosaic_pool').upsert(row);if(!r.error)note='Only one connection can be pooled until the central database is upgraded (re-run central-setup.sql).'}
    else if(r.error)note='Could not pool “'+(x.label||host(x.u))+'”: '+r.error.message}}catch(e){note=e.message}return note},
 saveConns=async(l,def)=>{const d=l.find(x=>x.id===def)||l[0]||null;await A.updateUser({data:{sbs:l,sbd:d?d.id:null,sb:d?{u:d.u,k:d.k,pool:!!d.pool,sec:!!d.sec}:null}});U=(await A.getSession()).data.session.user;return await syncPool(l)},host=u=>String(u).replace('https://','').replace('.supabase.co',''),
 hd=c=>({apikey:c.k,...(c.k.startsWith('eyJ')?{Authorization:'Bearer '+c.k}:{}),'Content-Type':'application/json'});
const M=document.createElement('div');M.id='xm';M.hidden=true;document.body.appendChild(M);
const closeM=()=>{M.hidden=true;M.innerHTML=''};
function modal(t,html,lock){lk_=!!lock;M.innerHTML='<div class="mb" role="dialog" aria-modal="true" aria-label="'+E(t)+'"><div class="mh"><b>'+E(t)+'</b>'+(lock?'':'<button class="x" aria-label="Close">✕</button>')+'</div><div class="mc">'+html+'</div></div>';M.hidden=false;const x=M.querySelector('.x');if(x)x.onclick=closeM;const f=M.querySelector('input:not([type=checkbox])');f&&f.focus();return M.querySelector('.mc')}
addEventListener('keydown',e=>{if(e.key==='Escape'&&!M.hidden&&!lk_)closeM()});
const secret=k=>{if(/^sb_secret_/.test(k))return true;try{return JSON.parse(atob(k.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).role==='service_role'}catch(e){return false}};
async function testConn(u,k){if(!rx.test(u))return'Use the Project URL from Supabase, like https://abcd1234.supabase.co';if(k.length<20)return'Paste the publishable (anon) key.';if(secret(k))return'That is a secret key. Never paste it here. Use the publishable (anon) key instead.';
 try{const r=await fetch(u+'/rest/v1/mosaic_items?select=room&limit=1',{headers:hd({u,k})});if(r.ok)return'';if(r.status===404)return'Connected, but the mosaic_items table is missing. Run the setup SQL, then test again.';if(r.status===401||r.status===403)return'Supabase rejected that key, or the table has no access policy yet.';return'Supabase answered with status '+r.status}catch(e){return'Could not reach that Supabase project.'}}
async function testSecure(u,k){const ek=Z.key(),rid=Z.sha(ek).slice(0,32),base=u+'/rest/v1/mosaic_items',h=x=>({...hd({u,k}),...x}),row={room:rid,k:'t',id:'t',v:{}};
 try{const a=await fetch(base,{method:'POST',headers:h({'x-room':rid,'x-edit':ek,Prefer:'return=minimal'}),body:JSON.stringify(row)});if(!a.ok)return'open';
  const b=await(await fetch(base+'?room=eq.'+rid,{headers:h({'x-room':rid})})).json(),c=await(await fetch(base+'?room=eq.'+rid,{headers:h({})})).json(),d=await fetch(base,{method:'POST',headers:h({'x-room':rid,'x-edit':'0'.repeat(32),Prefer:'return=minimal'}),body:JSON.stringify({...row,id:'t2'})});
  const ok=Array.isArray(b)&&b.length===1&&Array.isArray(c)&&c.length===0&&!d.ok;await fetch(base+'?room=eq.'+rid,{method:'DELETE',headers:h(ok?{'x-room':rid,'x-edit':ek}:{})}).catch(()=>{});return ok?'secure':'open'}catch(e){return'cors'}}
async function wipe(p,keep){const c=p.c?{u:p.c.u,k:p.c.k}:{u:BAKED.url,k:BAKED.key},h={...hd(c),...(p.c&&p.c.sec?{'x-room':p.r,'x-edit':p.k}:{})},r=await fetch(c.u+'/rest/v1/mosaic_items?room=eq.'+encodeURIComponent(p.r),{method:'DELETE',headers:h});if(!r.ok)throw new Error('Could not delete the project data ('+r.status+')');
 try{const l=await(await fetch(c.u+'/storage/v1/object/list/mosaic-files',{method:'POST',headers:h,body:JSON.stringify({prefix:p.r+'/',limit:1000})})).json();if(Array.isArray(l)&&l.length)await fetch(c.u+'/storage/v1/object/mosaic-files',{method:'DELETE',headers:h,body:JSON.stringify({prefixes:l.map(o=>p.r+'/'+o.name)})})}catch(e){}
 try{await SB.from('mosaic_projects').delete().eq('rid',p.r)}catch(e){}
 if(!keep)lpClean(p.r);else try{localStorage.removeItem('mosaic:cfg:'+p.r)}catch(e){}}
async function consent(){if(U.guest){try{if(localStorage['mosaic-guest-terms']===TV)return}catch(e){}}else if((U.user_metadata||{}).terms===TV)return;
 await new Promise(ok=>{const b=modal('Terms and Privacy Policy','<p>Please read and accept our <a href="legal.html#terms" target="_blank" rel="noopener">Terms of Service</a> and <a href="legal.html#privacy" target="_blank" rel="noopener">Privacy Policy</a> to continue.</p><label class="xck"><input type="checkbox" id="xtk"><span>I agree to both.</span></label><div class="xrow"><button class="pri" id="xag" disabled>Agree and continue</button><button id="xdc">Sign out</button></div>',true);
  b.querySelector('#xtk').onchange=e=>b.querySelector('#xag').disabled=!e.target.checked;
  b.querySelector('#xag').onclick=async()=>{try{if(U.guest){localStorage['mosaic-guest-terms']=TV}else{await A.updateUser({data:{terms:TV,terms_at:new Date().toISOString()}});U=(await A.getSession()).data.session.user}closeM();ok()}catch(x){alert(x.message)}};
  b.querySelector('#xdc').onclick=async()=>{if(U.guest){try{localStorage.removeItem(GK)}catch(e){}}else await A.signOut();location.assign(location.pathname+location.search)}})}
let PUBS=new Set();
async function loadPub(){if(U&&U.guest)return;try{const r=await SB.from('mosaic_public').select('rid').eq('owner',U.id);if(r.error)return;PUBS=new Set((r.data||[]).map(x=>x.rid));H.querySelectorAll('[data-pb]').forEach(b=>{const on=PUBS.has(b.dataset.pb);b.textContent=on?'Public ✓':'Make public…';b.classList.toggle('on',on)})}catch(e){}}
function pubToggle(rid){const p=list().find(x=>x.r===rid&&x.s==='o');if(!p||!p.c){alert('Only projects stored on your own Supabase can be made public.');return}
 if(PUBS.has(rid)){if(!confirm('Remove “'+p.t+'” from Discover? People who already have its link can still open it.'))return;SB.from('mosaic_public').delete().eq('rid',rid).then(({error})=>{if(error)alert(error.message);else{PUBS.delete(rid);loadPub()}});return}
 const b=modal('Make “'+p.t+'” public','<form id="xpb"><p class="mu">It will appear on the Discover page. Anyone can open it <b>read-only</b>; only people with your edit link can change it. You can remove it at any time.</p><label>Title<input id="xpt" maxlength="60" value="'+E(p.t)+'" required></label><label>Short description (optional)<input id="xpd" maxlength="160" placeholder="What is this project?"></label><input type="hidden" id="xpr" value="'+E(rid)+'"><label class="xck"><input type="checkbox" id="xpk" required><span>I understand this project will be visible to everyone.</span></label><p id="xpe" role="alert"></p><div class="xrow"><button class="pri">Publish to Discover</button><button type="button" id="xpx">Cancel</button></div></form>');b.querySelector('#xpx').onclick=closeM}
async function pubSave(){const rid=Qm('#xpr').value,p=list().find(x=>x.r===rid&&x.s==='o'),er=Qm('#xpe');if(!p||!p.c)return;er.textContent='Publishing…';
 const{error}=await SB.from('mosaic_public').upsert({rid,owner:U.id,owner_name:nm(U),title:Qm('#xpt').value.trim().slice(0,60)||p.t,description:Qm('#xpd').value.trim().slice(0,160),sb_url:p.c.u,sb_key:p.c.k,sec:!!p.c.sec},{onConflict:'rid'});
 if(error){er.textContent=/mosaic_public/.test(error.message)?'Discover is not set up on the server yet. The site owner needs to re-run central-setup.sql.':error.message;return}PUBS.add(rid);closeM();loadPub()}
function guestBar(){if(document.getElementById('xgb'))return;const d=document.createElement('div');d.id='xgb';d.innerHTML='You are viewing a public project (read-only). <a href="app.html?auth=signup">Sign up</a> to make your own · <a href="app.html" id="xgbd">Back to Discover</a>';document.body.appendChild(d);d.querySelector('#xgbd').onclick=()=>{try{sessionStorage['mosaic:view']='discover'}catch(e){}}}
async function poolPick(sel){if(!DEV||!POOL.length)return null;if(sel==='auto'){const cnt={};try{((await SB.from('mosaic_projects').select('sb_url')).data||[]).forEach(r=>cnt[r.sb_url]=(cnt[r.sb_url]||0)+1)}catch(e){}return[...POOL].sort((a,b)=>(cnt[a.sb_url]||0)-(cnt[b.sb_url]||0))[0]}return sel.startsWith('p:')?POOL.find(x=>'p:'+x.sb_url===sel):null}
async function devCheck(){if(U.guest)return;try{if((U.email||'').toLowerCase()===OWNER)await SB.rpc('claim_owner');const r=await SB.from('mosaic_devs').select('user_id').eq('user_id',U.id);DEV=!!(r.data&&r.data.length);if(DEV){POOL=(await SB.from('mosaic_pool').select('*')).data||[];if(!Q('#xdb')){Q('#th').insertAdjacentHTML('beforebegin','<button id="xdb">🛠 Dev tools</button>');Q('#xdb').onclick=devtools}}}catch(e){}}
function settings(){if(window.MosaicSettings){window.MosaicSettings.open();return}const c=conn();modal('Settings','<h3>Profile</h3><form id="xpf" class="xrow"><label class="grow">Display name<input id="xnm" maxlength="30" value="'+E(nm(U))+'" required></label><button class="pri">Save</button></form><p class="mu">Signed in as <b>'+E(U.email)+'</b></p>'
 +'<h3>Email and password</h3><form id="xef"><label>New email<input id="xen" type="email" placeholder="you@example.com" autocomplete="email" required></label><button>Change email</button></form><form id="xwf"><label>New password (8 or more characters)<input id="xnp" type="password" minlength="8" autocomplete="new-password" required></label><label>Confirm new password<input id="xnq" type="password" minlength="8" autocomplete="new-password" required></label><button>Change password</button></form><p id="xme" role="alert"></p>'
 +'<h3>Sessions and data</h3><div class="xrow"><button id="xsi">Sign out</button><button id="xsg">Sign out everywhere</button><button id="xex">Download my data</button><button class="xdg" id="xda">Delete my account</button></div>'
 +'<h3>Your Supabase</h3><p class="mu">'+(c?'Connected to <b>'+E(host(c.u))+'</b>. Protection: <b>'+(c.sec?'database-level (secure)':'open access, run the setup SQL to turn protection on')+'</b>. ':'Not connected yet. ')+'New projects are stored here. Use the Project URL and the <b>publishable (anon)</b> key only, never a secret key.</p><form id="xsf"><label>Project URL<input id="xsu" placeholder="https://abcd1234.supabase.co" value="'+E(c?c.u:'')+'" required autocomplete="off"></label><label>Publishable key<input id="xsk" placeholder="sb_publishable_…" value="'+E(c?c.k:'')+'" required autocomplete="off"></label><label class="xck"><input type="checkbox" id="xsp"'+(c&&c.pool?' checked':'')+'><span>Optional: let Mosaic developers use this Supabase as overflow storage for other people’s projects.</span></label><p id="xse" role="alert"></p><div class="xrow"><button class="pri">Test and save</button>'+(c?'<button type="button" id="xsx">Disconnect</button>':'')+'</div></form>'
 +'<details><summary>Setup SQL (run once in your Supabase SQL Editor)</summary><textarea readonly rows="8" id="xsq">'+E(SQL)+'</textarea><button type="button" id="xcp">Copy SQL</button></details><details><summary>Fallback SQL (only if secure mode is blocked)</summary><textarea readonly rows="5" id="xsq2">'+E(SQL2)+'</textarea><button type="button" id="xcp2">Copy fallback SQL</button></details><p class="mu"><a href="legal.html#terms" target="_blank" rel="noopener">Terms</a> · <a href="legal.html#privacy" target="_blank" rel="noopener">Privacy</a></p>')}
async function devtools(){const b=modal('Dev tools','<p class="mu">Loading…</p>');
 const[pj,dv,pl,pu]=await Promise.all([SB.from('mosaic_projects').select('*').order('created_at',{ascending:false}).limit(200),SB.from('mosaic_devs').select('*'),SB.from('mosaic_pool').select('*'),SB.from('mosaic_public').select('rid,title,owner_name').order('created_at',{ascending:false}).limit(100)]),er=pj.error||dv.error||pl.error;
 if(er){b.innerHTML='<p>Could not load: '+E(er.message)+'. Run central-setup.sql in your central Supabase first.</p>';return}
 PJ=Object.fromEntries(pj.data.map(p=>[p.rid,p]));POOL=pl.data||[];
 b.innerHTML='<h3>All projects ('+pj.data.length+')</h3><input id="xdq" placeholder="Filter by title or owner" aria-label="Filter projects"><div id="xdl">'+(pj.data.map(p=>'<div class="dr" data-q="'+E((p.title+' '+p.owner_email).toLowerCase())+'"><span><b>'+E(p.title||'Untitled')+'</b><small>'+E(p.owner_email||'')+' · '+E(host(p.sb_url))+'</small></span><button data-vw="'+E(p.rid)+'">View read-only</button></div>').join('')||'<p class="mu">No projects yet.</p>')+'</div><h3>People with dev tools</h3>'+dv.data.map(d=>'<div class="dr"><span>'+E(d.email||d.user_id)+'</span>'+(String(d.email).toLowerCase()===OWNER?'<small>owner</small>':'<button data-rv="'+E(d.email)+'">Remove</button>')+'</div>').join('')+'<form id="xdg" class="xrow"><input id="xdm" type="email" placeholder="Email of an existing account" aria-label="Email" required><button class="pri">Give dev tools</button></form><p id="xde" role="alert"></p><h3>Public projects on Discover ('+((pu.data||[]).length)+')</h3>'+((pu.data||[]).map(x=>'<div class="dr"><span><b>'+E(x.title||'Untitled')+'</b><small>'+E(x.owner_name||'')+'</small></span><button data-up="'+E(x.rid)+'">Remove from Discover</button></div>').join('')||'<p class="mu">Nothing is public yet.</p>')+'<h3>Storage pool (people who opted in)</h3>'+(POOL.map(x=>'<div class="dr"><span>'+E(x.label||host(x.sb_url))+'<small>'+E(x.owner_email||'')+'</small></span></div>').join('')||'<p class="mu">Nobody has opted in yet. When someone does, they appear in the “create project” menu.</p>');
 b.querySelector('#xdq').oninput=e=>{const q=e.target.value.toLowerCase();b.querySelectorAll('.dr[data-q]').forEach(r=>r.hidden=!r.dataset.q.includes(q))}}
const Qm=s=>M.querySelector(s);addEventListener('keydown',e=>{if(e.key==='Escape'){const mi=H.querySelector('.xmi');if(mi&&!mi.hidden){mi.hidden=true;const am=H.querySelector('#xam');am.setAttribute('aria-expanded','false');am.focus()}}});
M.addEventListener('submit',async e=>{e.preventDefault();const id=e.target.id,say=t=>{const x=Qm('#xme');if(x)x.textContent=t};
 if(id==='xpb'){await pubSave()}else if(id==='xsf'){const u=Qm('#xsu').value.trim().replace(/\/+$/,''),k=Qm('#xsk').value.trim(),pool=Qm('#xsp').checked,er=Qm('#xse');er.textContent='Testing…';const m=await testConn(u,k);if(m){er.textContent=m;return}
  er.textContent='Checking protection…';const sc=await testSecure(u,k);if(sc==='cors'){er.textContent='Your Supabase blocked the extra security headers. Run the fallback SQL below, then try again.';return}const sec=sc==='secure';
  try{await A.updateUser({data:{sb:{u,k,pool,sec}}});U=(await A.getSession()).data.session.user;if(pool)await SB.from('mosaic_pool').upsert({owner:U.id,owner_email:U.email,label:host(u),sb_url:u,sb_key:k,sec});else await SB.from('mosaic_pool').delete().eq('owner',U.id);NOTE=sec?'Connected. Database-level protection is on.':'Connected, but your Supabase still uses open access. Run the setup SQL to switch protection on.';closeM();home()}catch(x){er.textContent=x.message}}
 else if(id==='xpf'){const n=Qm('#xnm').value.trim().slice(0,30);if(!n)return;try{await A.updateUser({data:{name:n}});U=(await A.getSession()).data.session.user;me.n=n;try{localStorage.mosaicName=n;nmT();beat()}catch(x){}say('Name saved.')}catch(x){say(x.message)}}
 else if(id==='xef'){const{error}=await A.updateUser({email:Qm('#xen').value.trim()},{emailRedirectTo:siteBase()});say(error?error.message:'Check both your old and new inbox to confirm the change.')}
 else if(id==='xwf'){const a=Qm('#xnp').value;if(a!==Qm('#xnq').value){say('The two passwords do not match.');return}const{error}=await A.updateUser({password:a});say(error?error.message:'Password changed.');if(!error){Qm('#xnp').value='';Qm('#xnq').value=''}}
 else if(id==='xdg'){const{error}=await SB.rpc('grant_dev',{target:Qm('#xdm').value.trim()});if(error){Qm('#xde').textContent=error.message;return}devtools()}});
M.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;const id=b.id,d=b.dataset;
 if(id==='xcp'){try{await navigator.clipboard.writeText(SQL)}catch(x){Qm('#xsq').select()}b.textContent='Copied'}
 else if(id==='xsx'){await A.updateUser({data:{sb:null}});await SB.from('mosaic_pool').delete().eq('owner',U.id);U=(await A.getSession()).data.session.user;closeM();home()}
 else if(id==='xsi'){await A.signOut();location.assign(location.pathname+location.search)}
 else if(id==='xcp2'){try{await navigator.clipboard.writeText(SQL2)}catch(x){Qm('#xsq2').select()}b.textContent='Copied'}
 else if(id==='xsg'){await A.signOut({scope:'global'});location.assign(location.pathname+location.search)}
 else if(id==='xex'){const mine=await SB.from('mosaic_projects').select('*').eq('owner',U.id),m=U.user_metadata||{},o={exported_at:new Date().toISOString(),account:{id:U.id,email:U.email,name:nm(U),created_at:U.created_at,terms:m.terms,terms_at:m.terms_at},supabase_connection:conn(),projects:list(),directory_entries:mine.data||[]},a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(o,null,2)],{type:'application/json'}));a.download='mosaic-my-data.json';a.click()}
 else if(id==='xda'){if(prompt('This permanently deletes your account and every project you own, including its data and files. Type DELETE to confirm.')!=='DELETE')return;
  for(const p of list().filter(x=>x.s==='o')){try{await wipe(p)}catch(x){if(!confirm('Could not delete “'+p.t+'”: '+x.message+'\n\nContinue anyway? Its data may stay in your Supabase.'))return}}
  const{error}=await SB.rpc('delete_my_account');if(error){alert(error.message);return}try{await A.signOut()}catch(x){}location.assign(location.pathname+location.search)}
 else if(d.vw){const p=PJ[d.vw];await SB.from('mosaic_audit').insert({actor:U.id,actor_email:U.email,action:'view_project',target:p.rid});closeM();location.hash='r='+p.rid+'&sb='+encodeURIComponent(p.sb_url)+'&key='+encodeURIComponent(p.sb_key)+'&n='+encodeURIComponent(p.title||'')+(p.sec?'&sec=1':'')+'&dv=1'}
 else if(d.rv){const{error}=await SB.rpc('revoke_dev',{target:d.rv});if(error)alert(error.message);devtools()}});
const H=document.createElement('div');H.id='xh';H.hidden=true;document.body.appendChild(H);
const RL={o:['ow','Owner'],e:['ed','Can edit'],r:['rd','Read only'],l:['lo','This device only']};
const PF=(p,d)=>{try{return Mosaic.prefs.get(p,d)}catch(e){return d}};
let view='home',LV='';
const ago=d=>{const s=(Date.now()-new Date(d))/1000;if(!(s>=0))return'';for(const[n,u]of[[31536000,'year'],[2592000,'month'],[86400,'day'],[3600,'hour'],[60,'minute']])if(s>=n){const v=Math.floor(s/n);return v+' '+u+(v>1?'s':'')+' ago'}return'just now'};
const ic=n=>window.MosaicIcons?MosaicIcons.svg(n):'';
const allProjects=()=>[...list(),...lpList().map(x=>({...x,s:'o',lo:1,w:nm(U)}))].sort((a,b)=>(b.d||b.a||0)-(a.d||a.a||0));
const findP=id=>{const l=list();let p=l.find(x=>x.r===id);if(p)return{l,p,lo:false};const lp=lpList();p=lp.find(x=>x.r===id);return p?{l:lp,p,lo:true}:{l,p:null,lo:false}};
const card=p=>{const lo=!!p.lo,rl=lo?RL.l:RL[p.s],when=p.d||p.a,
 where=lo?'Stored only on this device. Never sent to Supabase.':p.s==='o'?'Stored on '+(p.c?E(host(p.c.u)):'the shared server'):'Shared by '+E(p.w||'someone');
 return'<article class="pc" data-q="'+E((p.t+' '+(p.w||'')).toLowerCase())+'"><a class="pn" data-r="'+E(p.r)+'" href="#'+E(hs(p))+'">'+E(p.t)+'</a><span class="rl '+rl[0]+'">'+rl[1]+'</span><small>'+where+(when?' · opened '+E(ago(when)):'')+'</small><span class="ac">'
 +'<button data-rn="'+E(p.r)+'">Rename</button>'
 +(lo?'<button data-cl="'+E(p.r)+'">Move to cloud…</button>':'')
 +(p.s==='o'&&!lo?'<button data-lc="'+E(p.r)+'">Make local-only…</button>':'')
 +(p.s!=='o'&&!lo?'<button data-rm="'+E(p.r)+'">Remove</button>':'')
 +(p.s==='o'&&p.c&&!lo?'<button data-pb="'+E(p.r)+'">Make public…</button>':'')
 +(p.s==='o'?'<button class="xdg" data-dl="'+E(p.r)+'">Delete…</button>':'')+'</span></article>'};
const hdr=active=>'<header class="xhh"><button type="button" class="xlogo" id="xlg" aria-label="Mosaic, all projects"><span class="mk" aria-hidden="true"><i></i><i></i><i></i><i></i></span><b>Mosaic</b></button>'
 +'<nav class="xnav" aria-label="Workspace">'+[['home','Home'],['discover','Discover']].map(([v,t])=>'<button type="button" data-v="'+v+'"'+(active===v?' class="on" aria-current="page"':'')+'>'+t+'</button>').join('')+'</nav><span class="sp"></span>'
 +'<button type="button" class="xic" id="xfs" title="Full screen (F11)" aria-label="Toggle full screen">'+ic('maximize')+'</button>'
 +'<div class="xmn"><button id="xam" aria-haspopup="menu" aria-expanded="false">'+ic('user')+'<span>'+E(nm(U))+'</span></button><div class="xmi" role="menu" hidden>'
 +(DEV?'<button role="menuitem" id="xdv">Dev tools</button>':'')+'<button role="menuitem" id="xst">Settings</button><button role="menuitem" id="xcp3">Command palette<kbd>Ctrl+Shift+P</kbd></button>'
 +(window.MOSAIC_APP?'':'<a role="menuitem" class="xmia" data-web href="./">Website</a>')+'<button role="menuitem" id="xso">'+(U&&U.guest?'Sign in or create account':'Sign out')+'</button></div></div></header>';
const storageOpts=(c,cons,pp,def,noLocal)=>(noLocal?'':'<option value="local"'+(def==='local'||(!c&&!pp)?' selected':'')+'>This device only (no Supabase)</option>')+(c?'<option value=""'+(noLocal||def!=='local'?' selected':'')+'>Cloud: '+E(host(c.u))+'</option>':'')
 +cons.filter(x=>!c||x.u!==c.u).map(x=>'<option value="c:'+E(x.id)+'">Cloud: '+E(x.label||host(x.u))+'</option>').join('')
 +(DEV&&POOL.length?'<option value="auto">Pool: automatic (least used)</option>'+POOL.map(x=>'<option value="p:'+E(x.sb_url)+'">Pool: '+E(x.label||host(x.sb_url))+'</option>').join(''):'');
function home(){view='home';document.title='Mosaic';H.hidden=false;const gst=!!(U&&U.guest),L=allProjects(),c=gst?null:conn(),cons=gst?[]:connList(),pp=!gst&&((DEV&&POOL.length)||cons.length>1),def=PF('storage.localDefault',false)?'local':'',off=navigator.onLine===false,
 use=window.MosaicPack?MosaicPack.usage():null;
 H.innerHTML=hdr('home')+'<main><div class="xt"><h1>Projects</h1><input id="xhq" type="search" placeholder="Filter projects" aria-label="Filter projects" value="'+E(LV)+'"></div>'
 +(gst?'<div class="xnote"><b>You are using Mosaic without an account.</b><p>Your projects are stored only on this device. <button type="button" class="xlk2" id="xgin">Sign in or create an account</button> to share projects or use several devices. Projects you made here stay on this device until you move them to the cloud.</p></div>':'')
 +(off?'<div class="xnote"><b>You are offline.</b><p>Projects stored on this device still open and save. Cloud projects need a connection to sync.</p></div>':'')
 +'<form id="xhn"><label class="sr" for="xht">New project name</label><input id="xht" placeholder="Name your new project" maxlength="60" required><select id="xhs" aria-label="Where to store it">'+storageOpts(c,cons,pp,def)+'</select><button class="pri">Create project</button></form>'
 +(c||gst?'':'<p class="mu xhint">Want to share projects or work on several devices? <button type="button" class="xlk2" id="xst2">Connect your Supabase</button>. Each project is then stored in a Supabase you own.</p>')
 +'<h2>Yours</h2><div class="xg" id="xg-own">'+(L.filter(p=>p.s==='o').map(card).join('')||'<p class="em">Nothing here yet.</p>')+'</div>'
 +'<h2>Shared with you</h2><div class="xg" id="xg-sh">'+(L.filter(p=>p.s!=='o').map(card).join('')||'<p class="em">Projects that other people share appear here once you open their link.</p>')+'</div>'
 +'<h2>Open a link</h2><form id="xhl"><label class="sr" for="xhk">Project link</label><input id="xhk" placeholder="Paste a project link" required><button>Open</button></form>'
 +'<p id="xhe" class="em" role="alert">'+NOTE+'</p>'
 +(use?'<p class="mu xhint">On this device: '+MosaicPack.fmt(use.total)+' used by Mosaic'+(use.projects.length?' across '+use.projects.length+' project'+(use.projects.length>1?'s':''):'')+'. <button type="button" class="xlk2" id="xperf">Storage and compression settings</button></p>':'')
 +'<footer class="lgl"><a href="legal.html#terms" target="_blank" rel="noopener">Terms</a> · <a href="legal.html#privacy" target="_blank" rel="noopener">Privacy</a> · <a href="legal.html#copyright" target="_blank" rel="noopener">Report content</a> · <a href="mailto:egertonzac@gmail.com">Contact</a></footer></main>';NOTE='';
 if(LV)filterHome(LV)}
function filterHome(q){q=String(q||'').trim().toLowerCase();H.querySelectorAll('.xg .pc[data-q]').forEach(c=>c.hidden=!!q&&!c.dataset.q.includes(q))}

/* ---------- Discover, built into the workspace (no website pages) ---------- */
let DV={rows:null,err:'',busy:false,q:'',sort:'new'};
const RIDX=/^[\w-]{8,64}$/,SBRX=/^https:\/\/[a-z0-9-]+\.supabase\.co$/;
const dlink=p=>'#r='+encodeURIComponent(p.rid)+'&sb='+encodeURIComponent(p.sb_url)+'&key='+encodeURIComponent(p.sb_key)+(p.sec?'&sec=1':'')+'&n='+encodeURIComponent(p.title)+'&o='+encodeURIComponent(p.owner_name||'')+'&pub=1';
const grad=rid=>{let h=0;for(const ch of String(rid))h=(h*31+ch.charCodeAt(0))%360;return'linear-gradient(135deg,hsl('+h+' 52% 46%),hsl('+((h+55)%360)+' 58% 34%))'};
const dcard=p=>'<article class="pc xdcard" data-rid="'+E(p.rid)+'"><div class="xth" style="background:'+grad(p.rid)+'" aria-hidden="true">'+ic('layout-grid')+'</div><a class="pn" href="'+E(dlink(p))+'">'+E(p.title)+'</a><small class="xdesc">'+E(p.description||'No description')+'</small><div class="xby"><span>by '+E(p.owner_name||'someone')+(U&&p.owner===U.id?' <span class="rl ow">You</span>':'')+'</span><span>'+E(ago(p.created_at))+'</span></div><span class="ac"><a class="xbtn pri" href="'+E(dlink(p))+'">Open read-only</a>'+(U&&p.owner===U.id?'<button data-unp="'+E(p.rid)+'">Unpublish</button>':'')+'</span></article>';
async function loadDiscover(){DV.busy=true;DV.err='';paintDiscover();
 try{let r=await SB.from('mosaic_public').select('rid,title,description,owner,owner_name,sb_url,sb_key,sec,created_at').order('created_at',{ascending:false}).limit(300);
  if(r.error)r=await SB.from('mosaic_public').select('rid,title,description,owner_name,sb_url,sb_key,sec,created_at').order('created_at',{ascending:false}).limit(300);
  if(r.error)throw r.error;DV.rows=(r.data||[]).filter(p=>RIDX.test(p.rid||'')&&SBRX.test(p.sb_url||'')&&p.sb_key&&p.title)}
 catch(e){DV.err=(navigator.onLine===false?'You are offline.':'Public projects can’t be loaded right now.')+' Please try again in a moment.'}
 DV.busy=false;paintDiscover()}
function discover(){view='discover';document.title='Discover · Mosaic';H.hidden=false;shellDiscover();if(!DV.rows&&!DV.busy)loadDiscover();else paintDiscover()}
function shellDiscover(){H.innerHTML=hdr('discover')+'<main class="xdc"><div class="xt"><div><h1>Discover</h1><p class="mu xlead">Projects shared by the Mosaic community. Open one to look around, read-only.</p></div></div>'
 +'<div class="xdtools"><input id="xdq" type="search" placeholder="Search projects, descriptions or authors" aria-label="Search public projects" value="'+E(DV.q)+'"><select id="xds" aria-label="Sort"><option value="new">Newest first</option><option value="old">Oldest first</option><option value="az">Title A to Z</option><option value="by">Author</option></select><button type="button" id="xdr" title="Reload the list">Refresh</button></div>'
 +'<p class="mu xcount" id="xdn" role="status" aria-live="polite"></p><div id="xdy"></div><div class="xg" id="xdg"></div>'
 +'<p class="em">Want to be listed? Open one of your cloud projects on Home and choose “Make public…”. Something that should not be here? <a href="mailto:egertonzac@gmail.com?subject=Report%20a%20public%20Mosaic%20project">Report it</a>.</p></main>';
 H.querySelector('#xds').value=DV.sort}
function paintDiscover(){if(view!=='discover')return;const g=H.querySelector('#xdg'),n=H.querySelector('#xdn');if(!g)return;
 if(DV.busy&&!DV.rows){g.innerHTML='<div class="xskel"></div><div class="xskel"></div><div class="xskel"></div>';n.textContent='Loading…';return}
 if(DV.err&&!DV.rows){g.innerHTML='<div class="xnote xerr"><b>'+E(DV.err)+'</b><button class="pri" id="xdr2" type="button">Try again</button></div>';n.textContent='';return}
 const q=DV.q.trim().toLowerCase();let a=(DV.rows||[]).filter(p=>!q||(p.title+' '+(p.description||'')+' '+(p.owner_name||'')).toLowerCase().includes(q));
 const by={new:(x,y)=>new Date(y.created_at)-new Date(x.created_at),old:(x,y)=>new Date(x.created_at)-new Date(y.created_at),az:(x,y)=>x.title.localeCompare(y.title),by:(x,y)=>String(x.owner_name||'').localeCompare(String(y.owner_name||''))};
 a=a.slice().sort(by[DV.sort]||by.new);
 g.innerHTML=a.length?a.map(dcard).join(''):'<p class="em" style="grid-column:1/-1">'+((DV.rows||[]).length?'No projects match your search.':'Nothing here yet. Be the first: open a project on Home and choose “Make public…”.')+'</p>';
 n.textContent=(DV.rows||[]).length?(a.length===DV.rows.length?a.length+' public project'+(a.length===1?'':'s'):a.length+' of '+DV.rows.length+' shown'):''}
const refreshView=()=>{view==='discover'?discover():home()};

/* ---------- local-only projects ---------- */
async function fetchRows(p){const c=p.c?{u:p.c.u,k:p.c.k}:{u:BAKED.url,k:BAKED.key},h={...hd(c),...(p.c&&p.c.sec?{'x-room':p.r,'x-edit':p.k}:{})},out=[];
 for(let off=0;;off+=1000){const r=await fetch(c.u+'/rest/v1/mosaic_items?room=eq.'+encodeURIComponent(p.r)+'&select=k,id,v&order=updated_at.asc&limit=1000&offset='+off,{headers:h});if(!r.ok)throw new Error('Could not download the project ('+r.status+')');const a=await r.json();out.push(...a);if(a.length<1000)break}return out}
const idok=/^[\w-]{1,40}$/;
function openModalChoose(title,intro,okText,extra){return modal(title,'<form id="xchf"><p>'+intro+'</p>'+(extra||'')+'<p id="xche" role="alert"></p><div class="xrow"><button class="pri" id="xchgo">'+okText+'</button><button type="button" id="xchx">Cancel</button></div></form>')}
function toCloudModal(rid){const q=lpList().find(x=>x.r===rid);if(!q)return;const c=conn(),cons=connList(),pp=(DEV&&POOL.length)||cons.length>1;
 if(!c&&!pp){const m0=modal('Move to cloud','<p>Connect a Supabase first (Settings → Storage), then move this project.</p><div class="xrow"><button class="pri" id="xst3">Open settings</button></div>');m0.querySelector('#xst3').onclick=()=>{closeM();settings()};return}
 const b=openModalChoose('Move “'+E(q.t)+'” to the cloud','The boards, comments and small files are uploaded the first time you open the project. The copy on this device is kept.','Move to cloud','<label>Store it in<select id="xchs">'+storageOpts(c,cons,pp,'',true)+'</select></label>');
 b.querySelector('#xchx').onclick=closeM;
 b.querySelector('#xchf').onsubmit=async e=>{e.preventDefault();const er=b.querySelector('#xche'),go=b.querySelector('#xchgo');go.disabled=true;er.textContent='Moving…';
  try{const sel=b.querySelector('#xchs').value,pk=sel&&await poolPick(sel),cc=sel&&sel.startsWith('c:')&&cons.find(x=>'c:'+x.id===sel),c0=cc?{u:cc.u,k:cc.k,sec:!!cc.sec}:pk?{u:pk.sb_url,k:pk.sb_key,sec:!!pk.sec}:c,c1=c0&&c0.u?{u:c0.u,k:c0.k,sec:!!c0.sec}:null;
   if(!c1)throw new Error('Pick where to store it.');
   const l=list();l.unshift({r:q.r,k:q.k,t:q.t,s:'o',w:nm(U),a:q.a||Date.now(),c:c1});await save(l);
   try{await SB.from('mosaic_projects').insert({rid:q.r,owner:U.id,owner_email:U.email,title:q.t,sb_url:c1.u,sb_key:c1.k,sec:!!c1.sec})}catch(x){}
   try{localStorage['mosaic:cfg:'+q.r]=JSON.stringify(c1);localStorage.removeItem('mosaic-local:'+q.r)}catch(x){}
   lpSave(lpList().filter(x=>x.r!==q.r));NOTE='“'+q.t+'” now syncs to '+host(c1.u)+'. It uploads the first time you open it.';closeM();home()}catch(x){er.textContent=x.message;go.disabled=false}}}
function makeLocalModal(rid){const l=list(),p=l.find(x=>x.r===rid&&x.s==='o');if(!p)return;
 const b=openModalChoose('Make “'+E(p.t)+'” local-only','This copies the project from Supabase onto this device and stops syncing it. People you shared it with keep the cloud copy but will not see changes you make from now on. Needs a connection once, to download it.','Make local-only',
  '<label class="xck"><input type="checkbox" id="xchw"><span>Also delete the cloud copy (wipes its data and files from '+(p.c?E(host(p.c.u)):'the shared server')+'). Others lose access.</span></label>');
 b.querySelector('#xchx').onclick=closeM;
 b.querySelector('#xchf').onsubmit=async e=>{e.preventDefault();const er=b.querySelector('#xche'),go=b.querySelector('#xchgo'),wp=b.querySelector('#xchw').checked;go.disabled=true;er.textContent='Downloading…';
  try{const rows=await fetchRows(p),S2={pg:{},it:{},cm:{}};
   try{const old=JSON.parse(MosaicPack.unpack(localStorage['mosaic:'+p.r]||'null')||'null');if(old&&old.pg){['pg','it','cm'].forEach(k=>Object.assign(S2[k],old[k]||{}))}}catch(x){}
   rows.forEach(o=>{if(o&&S2[o.k]&&o.v&&idok.test(o.id||'')&&typeof o.v.u==='number'){const cur0=S2[o.k][o.id];if(!cur0||cur0.u<o.v.u)S2[o.k][o.id]=o.v}});
   if(!Object.values(S2.pg).some(x=>x&&!x.del))throw new Error('The project has no pages to copy.');
   try{localStorage['mosaic:'+p.r]=MosaicPack.pack(JSON.stringify(S2))}catch(x){throw new Error('This device has no room to store it. Export a backup, or free some space in Settings → Performance.')}
   localStorage['mosaic-local:'+p.r]='1';const lp=lpList().filter(x=>x.r!==p.r);lp.unshift({r:p.r,k:p.k,t:p.t,a:p.a||Date.now(),d:Date.now()});lpSave(lp);
   if(wp){er.textContent='Deleting the cloud copy…';try{await wipe(p,true)}catch(x){if(!confirm('The local copy is safe, but the cloud copy could not be wiped: '+x.message+'\n\nContinue anyway?')){go.disabled=false;er.textContent=x.message;return}}}
   await save(list().filter(x=>x.r!==p.r));try{localStorage.removeItem('mosaic:cfg:'+p.r)}catch(x){}
   NOTE='“'+p.t+'” now lives only on this device.';closeM();home()}catch(x){er.textContent=x.message;go.disabled=false}}}

/* ---------- delete a project, with an optional wipe of its Supabase data (owners only) ---------- */
function deleteModal(rid){const f=findP(rid);if(!f.p||(!f.lo&&f.p.s!=='o'))return;const p=f.p,lo=f.lo,wd=PF('projects.wipeDefault',true);
 const b=modal('Delete “'+p.t+'”','<form id="xdlf" data-r="'+E(rid)+'" data-lo="'+(lo?1:0)+'"><p>'+(lo?'This project exists only on this device. Deleting it removes it for good. There is no copy to restore from.':'Choose what happens to the project’s data in Supabase:')+'</p>'
  +(lo?'':'<label class="xck"><input type="radio" name="dm" value="wipe"'+(wd?' checked':'')+'><span><b>Delete everywhere.</b> Also wipe its boards, comments and files from '+(p.c?'your Supabase ('+E(host(p.c.u))+')':'the shared server')+'. Anyone with a link loses access. This cannot be undone.</span></label>'
   +'<label class="xck"><input type="radio" name="dm" value="keep"'+(wd?'':' checked')+'><span><b>Remove from my account only.</b> The data stays in Supabase and the project can be opened again from its link.</span></label>')
  +'<label>Type <b>DELETE</b> to confirm<input id="xdlc" autocomplete="off" required></label><p id="xdle" role="alert"></p><div class="xrow"><button class="pri xdg" id="xdlgo">Delete project</button><button type="button" id="xdlx">Cancel</button></div></form>');
 b.querySelector('#xdlx').onclick=closeM}
/* ---------- clear one of MY Supabases: wipes only projects I own that live there ---------- */
function clearModal(connId){const c=connList().find(x=>x.id===connId);if(!c)return;const name=host(c.u),label=c.label||name,
 mine=list().filter(p=>p.s==='o'&&p.c&&p.c.u===c.u),others=list().filter(p=>p.s!=='o'&&p.c&&p.c.u===c.u);
 const b=modal('Clear “'+label+'”','<form id="xclf"><p>This wipes the projects <b>you own</b> that are stored on this Supabase (<b>'+E(name)+'</b>): their boards, comments and files are deleted from it, and they are removed from your account.</p>'
  +'<p class="xokn">Projects owned by other people are <b>never touched</b>, even when they are stored on this Supabase'+(others.length?' ('+others.length+' shared with you right now)':'')+'. Nothing in Mosaic can delete them from here.</p>'
  +(mine.length?'<div class="xcl-list" role="group" aria-label="Projects to clear">'+mine.map(p=>'<label class="xck"><input type="checkbox" name="cl" value="'+E(p.r)+'" checked><span>'+E(p.t)+'</span></label>').join('')+'</div>'
   +'<label class="xck"><input type="checkbox" id="xcll" checked><span>Also remove their copies from this device</span></label>'
   +'<label>Type <b>'+E(name)+'</b> to confirm<input id="xclc" autocomplete="off" required></label>':'<p>You do not own any projects on this Supabase, so there is nothing to clear.</p>')
  +'<p id="xcle" role="alert"></p><div class="xrow">'+(mine.length?'<button class="pri xdg" id="xclgo">Clear selected projects</button>':'')+'<button type="button" id="xclx">'+(mine.length?'Cancel':'Close')+'</button></div></form>');
 b.querySelector('#xclx').onclick=closeM;if(!mine.length)return;
 b.querySelector('#xclf').onsubmit=async e=>{e.preventDefault();const er=b.querySelector('#xcle'),go=b.querySelector('#xclgo');
  if(b.querySelector('#xclc').value.trim().toLowerCase()!==name.toLowerCase()){er.textContent='Type the project id “'+name+'” to confirm.';return}
  const ids=[...b.querySelectorAll('input[name=cl]:checked')].map(i=>i.value),keepLocal=!b.querySelector('#xcll').checked;
  if(!ids.length){er.textContent='Pick at least one project.';return}
  go.disabled=true;const done=new Set(),fail=[];
  for(const rid of ids){const p=list().find(x=>x.r===rid&&x.s==='o'&&x.c&&x.c.u===c.u);if(!p)continue;     /* re-checked: only mine, only on this Supabase */
   er.textContent='Clearing “'+p.t+'” ('+(done.size+fail.length+1)+' of '+ids.length+')…';
   try{await wipe(p,keepLocal);done.add(rid)}catch(x){fail.push(p.t+': '+x.message)}}
  try{if(done.size)await save(list().filter(x=>!done.has(x.r)))}catch(x){fail.push('Could not update your project list: '+x.message)}
  if(fail.length){er.textContent='Cleared '+done.size+'. Could not clear: '+fail.join(' · ');go.disabled=false;home();return}
  NOTE='Cleared '+done.size+' project'+(done.size===1?'':'s')+' from '+label+'.';closeM();home()}}

M.addEventListener('submit',async e=>{if(e.target.id!=='xdlf')return;e.preventDefault();const f=e.target,rid=f.dataset.r,lo=f.dataset.lo==='1',er=Qm('#xdle'),go=Qm('#xdlgo');
 if(Qm('#xdlc').value.trim()!=='DELETE'){er.textContent='Type DELETE in capital letters to confirm.';return}
 const mode=(f.querySelector('input[name=dm]:checked')||{}).value||'wipe';go.disabled=true;er.textContent=lo?'Deleting…':mode==='wipe'?'Wiping from Supabase…':'Removing…';
 try{if(lo){lpSave(lpList().filter(x=>x.r!==rid));lpClean(rid)}
  else{const l=list(),p=l.find(x=>x.r===rid);if(!p||p.s!=='o')throw new Error('Only the owner can delete a project.');
   if(mode==='wipe'){try{await wipe(p)}catch(x){if(!confirm('Could not wipe “'+p.t+'” from Supabase: '+x.message+'\n\nRemove it from your account anyway? Its data may stay in Supabase.')){go.disabled=false;er.textContent=x.message;return}lpClean(rid)}}
   await save(l.filter(x=>x!==p))}
  closeM();home()}catch(x){er.textContent=x.message;go.disabled=false}});

H.addEventListener('submit',async e=>{e.preventDefault();const f=e.target.id;
 if(f==='xhn'){const t=Q('#xht').value.trim().slice(0,60);if(!t)return;const sel=Q('#xhs')&&Q('#xhs').value,k=Z.key(),r=Z.sha(k).slice(0,32);
  if(sel==='local'){const lp=lpList();lp.unshift({r,k,t,a:Date.now(),d:Date.now()});try{localStorage['mosaic-local:'+r]='1';lpSave(lp)}catch(x){Q('#xhe').textContent='This device has no room to create a project. Free some space in Settings → Performance.';return}location.hash='k='+k;return}
  const pp=sel&&await poolPick(sel),cc=sel&&sel.startsWith('c:')&&connList().find(x=>'c:'+x.id===sel),c0=cc?{u:cc.u,k:cc.k,sec:!!cc.sec}:pp?{u:pp.sb_url,k:pp.sb_key,sec:!!pp.sec}:conn(),c1=c0&&c0.u?{u:c0.u,k:c0.k,sec:!!c0.sec}:null;
  if(!c1){Q('#xhe').textContent='Connect your Supabase first (Settings), or choose “This device only”.';return}
  const l=list();l.unshift({r,k,t,s:'o',w:nm(U),a:Date.now(),c:c1});
  try{await save(l)}catch(x){Q('#xhe').textContent='Could not save: '+x.message;return}
  try{await SB.from('mosaic_projects').insert({rid:r,owner:U.id,owner_email:U.email,title:t,sb_url:c1.u,sb_key:c1.k,sec:!!c1.sec})}catch(x){}
  try{localStorage['mosaic:cfg:'+r]=JSON.stringify(c1)}catch(x){}location.hash='k='+k}
 else if(f==='xhl'){const v=Q('#xhk').value.trim(),P=new URLSearchParams(v.includes('#')?v.slice(v.indexOf('#')+1):v);if(!(P.get('k')||P.get('r')||P.get('room'))){Q('#xhe').textContent='That does not look like a Mosaic project link.';return}location.hash=P.toString()}});
H.addEventListener('input',e=>{if(e.target.id==='xhq'){LV=e.target.value;filterHome(LV)}else if(e.target.id==='xdq'){DV.q=e.target.value;paintDiscover()}});
H.addEventListener('change',e=>{if(e.target.id==='xds'){DV.sort=e.target.value;paintDiscover()}});
addEventListener('keydown',e=>{if(e.key==='/'&&!H.hidden&&!/input|textarea|select/i.test((document.activeElement||{}).tagName||'')&&M.hidden){const q=H.querySelector('#xdq')||H.querySelector('#xhq');if(q){e.preventDefault();q.focus()}}});
H.addEventListener('click',async e=>{const mi=H.querySelector('.xmi'),am=H.querySelector('#xam');if(mi&&!mi.hidden&&!e.target.closest('#xam')){mi.hidden=true;am.setAttribute('aria-expanded','false')}const a=e.target.closest('a.pn');if(a){const p=list().find(x=>x.r===a.dataset.r);if(p&&p.c)try{localStorage['mosaic:cfg:'+p.r]=JSON.stringify(p.c)}catch(x){}return}
 const b=e.target.closest('button');if(!b)return;
 const mm=b.closest('.xmi');if(mm){mm.hidden=true;am.setAttribute('aria-expanded','false')}
 if(b.dataset.v){b.dataset.v==='discover'?discover():home();return}
 if(b.id==='xlg'){home();return}
 if(b.id==='xfs'){try{Mosaic.window.toggleFullscreen()}catch(x){}return}
 if(b.id==='xcp3'){try{Mosaic.commands.palette()}catch(x){}return}
 if(b.id==='xdr'||b.id==='xdr2'){DV.rows=null;loadDiscover();return}
 if(b.id==='xperf'){if(window.MosaicSettings)MosaicSettings.open('performance');return}
 if(b.dataset.unp){if(!confirm('Remove this project from Discover? People who already have its link can still open it.'))return;const{error}=await SB.from('mosaic_public').delete().eq('rid',b.dataset.unp);if(error){alert(error.message);return}DV.rows=(DV.rows||[]).filter(p=>p.rid!==b.dataset.unp);PUBS.delete(b.dataset.unp);paintDiscover();return}
 if(b.id==='xam'){mi.hidden=!mi.hidden;b.setAttribute('aria-expanded',String(!mi.hidden));if(!mi.hidden){const f=mi.querySelector('button');f&&f.focus()}return}
 if(b.id==='xso'){if(U&&U.guest){try{localStorage.removeItem(GK)}catch(x){}location.assign(location.pathname+'?auth=login')}else{await A.signOut();location.assign(location.pathname+location.search)}return}
 if(b.id==='xgin'){try{localStorage.removeItem(GK)}catch(x){}location.assign(location.pathname+'?auth=signup');return}
 if(b.id==='xst'||b.id==='xst2')return settings();if(b.id==='xdv')return devtools();
 if(b.dataset.pb)return pubToggle(b.dataset.pb);
 if(b.dataset.up){const{error}=await SB.from('mosaic_public').delete().eq('rid',b.dataset.up);if(error)alert(error.message);else b.closest('.dr').remove();return}
 if(b.dataset.dl)return deleteModal(b.dataset.dl);
 if(b.dataset.cl)return toCloudModal(b.dataset.cl);
 if(b.dataset.lc)return makeLocalModal(b.dataset.lc);
 const id=b.dataset.rn||b.dataset.rm;if(!id)return;const f=findP(id);if(!f.p)return;const p=f.p;
 try{if(b.dataset.rn){const t=prompt('Rename project',p.t);if(t&&t.trim()){p.t=t.trim().slice(0,60);f.lo?lpSave(f.l):await save(f.l);if(!f.lo&&p.s==='o')try{await SB.from('mosaic_projects').update({title:p.t}).eq('rid',p.r)}catch(x){}home()}}
  else if(confirm('Remove “'+p.t+'” from your account?\n\nThe project itself is not deleted. You can open it again from its link.')){await save(f.l.filter(x=>x!==p));home()}}catch(x){Q('#xhe').textContent=x.message}});
(async()=>{try{
 if(!A){X.classList.remove('wait');X.innerHTML='<p style="padding:24px">Accounts need a connection to Supabase, which could not be reached. Reload to try again.</p>';return}
 const P=new URLSearchParams((Z.auth||'#').slice(1)),eh=P.get('error_description');
 try{if(P.get('access_token'))await A.setSession({access_token:P.get('access_token'),refresh_token:P.get('refresh_token')});const s=(await A.getSession()).data.session;U=s&&s.user}catch(e){}
 if(!U&&navigator.onLine===false){try{const cs=JSON.parse(localStorage['mosaic-acct']||'null');if(cs&&cs.user)U=cs.user}catch(e){}}
 if(!U&&isGuest()&&(Z.home||Z.local))U=guestUser();
 if(U&&P.get('type')==='recovery'){tab('new');await need('Choose a new password for '+U.email+'.')}
 else if(!U&&!(Z.pub&&Z.role==='r')){{const au=new URLSearchParams(location.search).get('auth');if(au==='signup')tab('up');else if(au==='login')tab('in')}if(eh)tab('reset');const w=need(Z.home?'Sign in to open your projects, or create an account.':'Sign in or create an account to open “'+(Z.n||'this project')+'” ('+(Z.role==='r'?'read-only':'can edit')+').');if(eh)Q('#xer').textContent=eh;await w}
 X.hidden=true;if(!U){guestBar();return}me.n=nm(U);try{window.Mosaic&&Mosaic.emit('account:ready',{})}catch(e){}try{localStorage.mosaicName=me.n;nmT();beat()}catch(e){}
 if(P.get('type')==='signup')NOTE='Your email is confirmed. Welcome to Mosaic!';await consent();await devCheck();Z.home?((()=>{let v='';try{v=sessionStorage['mosaic:view']||'';sessionStorage.removeItem('mosaic:view')}catch(e){}return v==='discover'})()?discover():home()):await reg()}finally{try{window.MZboot&&MZboot.done()}catch(e){}}})();
{const h0=home;home=function(){const r=h0.apply(this,arguments);try{loadPub()}catch(e){}return r}}
window.MosaicCtx={get U(){return U},get A(){return A},get SB(){return SB},get DEV(){return DEV},isGuest:()=>!!(U&&U.guest),get POOL(){return POOL},M,E,OWNER,SQL,SQL2,host,rx,testConn,testSecure,secret,modal,closeM,connList,conn,saveConns,devtools,home:refreshView,discover,nm,lpList,lpSave,lpClean,list,
 act:(kind,rid)=>{if(kind==='clear')clearModal(rid);else if(kind==='delete')deleteModal(rid);else if(kind==='cloud')toCloudModal(rid);else if(kind==='local')makeLocalModal(rid)}};
})();