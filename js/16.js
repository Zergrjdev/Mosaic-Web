/* Mosaic collaboration extras (loaded after the editor).
   Comments: replies, resolve / reopen, edit, @mentions, reactions, and an "all comments" panel.
   Live cursors: smoother and idle-aware cursors, what other people have selected, cursor chat (press /),
   follow a person's view, and a people panel (click "N people here").
   Everything is built on the existing comment records ("cm") and cursor messages, with extra optional fields,
   so older clients still work (they simply show replies as separate comments). */
(()=>{
'use strict';
if(typeof S==='undefined'||!document.getElementById('cv')||!document.getElementById('cmp'))return;
const E=esc,ID=/^[\w-]{1,40}$/,MN=/@\[([^\]]{1,30})\]/g,Q1=s=>document.querySelector(s),ic=n=>window.MosaicIcons?MosaicIcons.svg(n):'';
const toast=(t,o)=>{try{Mosaic.toast(t,o)}catch(e){}};

/* ================= comment threads ================= */
const live=()=>Object.values(S.cm).filter(c=>!c.del&&c.for&&typeof c.t==='string'&&S.it[c.for]&&!S.it[c.for].del);
const isRoot=c=>!c.par||!S.cm[c.par]||S.cm[c.par].del;
const mentionsOf=t=>[...new Set([...String(t).matchAll(MN)].map(m=>m[1]))].slice(0,10);
const fmt=t=>E(t).replace(MN,(_,n)=>'<span class="mn'+(n===me.n?' me':'')+'">@'+n+'</span>');
function threadsFor(itemId,L){L=L||live().filter(c=>c.for===itemId);return L.filter(isRoot).sort((a,b)=>a.ts-b.ts).map(r=>({root:r,replies:L.filter(c=>c.par===r.id).sort((a,b)=>a.ts-b.ts)}))}
window.openCount=itemId=>threadsFor(itemId).reduce((n,t)=>n+(t.root.res?0:1+t.replies.length),0);
const allThreads=()=>{const by={};live().forEach(c=>(by[c.for]=by[c.for]||[]).push(c));const out=[];Object.entries(by).forEach(([it,L])=>threadsFor(it,L).forEach(t=>out.push({...t,item:S.it[it],last:Math.max(t.root.ts,...t.replies.map(r=>r.ts))})));return out.sort((a,b)=>b.last-a.last)};

let CF='open',CE=null,CR=null,CX=null,MI=null,MSI=0;                 /* filter, editing, replying, reaction picker, mention input/index */
const RXS=['👍','❤️','🎉','👀','✅'],when=t=>{try{return new Date(t).toLocaleString([], {dateStyle:'medium',timeStyle:'short'})}catch(e){return''}};
function cHtml(c,isR){const own=c.a===me.n,rx=c.rx||{};
 const rxh=RXS.filter(e=>Array.isArray(rx[e])&&rx[e].length).map(e=>'<button type="button" data-rx="'+E(c.id)+'|'+e+'" aria-pressed="'+rx[e].includes(me.n)+'" title="'+E(rx[e].join(', '))+'">'+e+' '+rx[e].length+'</button>').join('');
 const pick=CX===c.id?'<div class="cmpk">'+RXS.map(e=>'<button type="button" data-rx="'+E(c.id)+'|'+e+'">'+e+'</button>').join('')+'</div>':'';
 return'<div class="cmc'+(own?' own':'')+'" data-id="'+E(c.id)+'"><small>'+E(c.a)+' · '+E(when(c.ts))+(c.ed?' · edited':'')+'</small>'
  +(CE===c.id?'<input data-edit="'+E(c.id)+'" value="'+E(c.t)+'" aria-label="Edit comment" maxlength="1000">':'<div class="cmx">'+fmt(c.t)+'</div>')
  +'<div class="cmr">'+rxh+(RO?'':'<button type="button" data-rxp="'+E(c.id)+'" aria-label="Add a reaction" title="React">'+'☺</button>')+'</div>'+pick
  +(RO?'':'<div class="cma">'+(isR?'<button type="button" data-rp="'+E(c.id)+'">Reply</button>':'')+(own?'<button type="button" data-ed="'+E(c.id)+'">Edit</button><button type="button" data-d="'+E(c.id)+'" aria-label="Delete comment">Delete</button>':'')+'</div>')+'</div>'}
function tHtml(t){const r=t.root,res=!!r.res;
 return'<div class="cmt'+(res?' res':'')+'" data-t="'+E(r.id)+'">'+(res?'<small class="cmres">✓ Resolved'+(r.rby?' by '+E(r.rby):'')+'</small>':'')+cHtml(r,true)
  +t.replies.map(x=>'<div class="cmrp">'+cHtml(x,false)+'</div>').join('')
  +(CR===r.id&&!RO?'<input data-reply="'+E(r.id)+'" placeholder="Reply…  (@ to mention)" aria-label="Reply" maxlength="1000">':'')
  +(RO?'':'<div class="cma"><button type="button" data-rs="'+E(r.id)+'">'+(res?'Reopen':'Resolve')+'</button></div>')+'</div>'}
const P=document.getElementById('cmp');
window.cmts=function(){
 P.hidden=!(CP&&CP===sel);if(P.hidden)return;
 const a=document.activeElement,keep=a&&P.contains(a)&&a.tagName==='INPUT'?{sel:a.dataset.new!==undefined?'[data-new]':a.dataset.reply?'[data-reply="'+a.dataset.reply+'"]':a.dataset.edit?'[data-edit="'+a.dataset.edit+'"]':null,v:a.value,s:a.selectionStart}:null;
 const all=threadsFor(CP),open=all.filter(t=>!t.root.res).length,done=all.length-open,vis=all.filter(t=>CF==='all'||(CF==='open')!==!!t.root.res);
 P.innerHTML='<div class="cmh"><b>Comments</b><select data-f aria-label="Show threads">'+[['open','Open ('+open+')'],['resolved','Resolved ('+done+')'],['all','All ('+all.length+')']].map(([v,l])=>'<option value="'+v+'"'+(v===CF?' selected':'')+'>'+l+'</option>').join('')+'</select></div>'
  +(vis.map(tHtml).join('')||'<small>'+(all.length?(CF==='open'?'No open comments here. Switch to Resolved or All to see the rest.':'Nothing to show.'):'No comments yet')+'</small>')
  +(RO?'':'<input data-new placeholder="Write a comment…  (@ to mention), press Enter" aria-label="New comment" maxlength="1000">')+'<div class="cmm" hidden></div><button type="button" data-x="close">Close</button>';
 if(keep&&keep.sel){const i=P.querySelector(keep.sel);if(i){i.value=keep.v;i.focus();try{i.setSelectionRange(keep.s,keep.s)}catch(e){}}}
 const em=P.querySelector('input[data-edit],input[data-reply]');if(em&&!keep)em.focus()};
const after=()=>{cmts();try{rb()}catch(e){}pUpdate()};
function submit(t){const txt=t.value.trim().slice(0,1000);if(!txt||RO)return;const mn=mentionsOf(txt),now=Date.now(),extra=mn.length?{mn}:{};
 if(t.dataset.new!==undefined)put('cm',{id:uid(),for:CP,a:me.n,t:txt,ts:now,...extra});
 else if(t.dataset.reply){const r=S.cm[t.dataset.reply];if(r&&!r.del)put('cm',{id:uid(),for:CP,par:r.id,a:me.n,t:txt,ts:now,...extra});CR=null}
 else if(t.dataset.edit){const c=S.cm[t.dataset.edit];if(c&&!c.del&&c.a===me.n){const n={...c,t:txt,ed:now};if(mn.length)n.mn=mn;else delete n.mn;put('cm',n)}CE=null}
 after();const n=P.querySelector('[data-new]');n&&n.focus()}
/* @mention suggestions */
const names=()=>{const s=new Set();Object.values(users).forEach(u=>u&&u.n&&s.add(String(u.n).slice(0,30)));Object.values(S.cm).forEach(c=>c&&!c.del&&c.a&&s.add(String(c.a).slice(0,30)));s.delete(me.n);return[...s].filter(n=>n&&!/[\[\]]/.test(n)).sort((a,b)=>a.localeCompare(b))};
function suggest(inp){const box=P.querySelector('.cmm');if(!box)return;const m=/(^|\s)@([^\s@\[\]]{0,20})$/.exec(inp.value.slice(0,inp.selectionStart==null?inp.value.length:inp.selectionStart));
 if(!m){box.hidden=true;return}const q=m[2].toLowerCase(),L=names().filter(n=>n.toLowerCase().includes(q)).slice(0,5);if(!L.length){box.hidden=true;return}
 MI=inp;MSI=Math.min(MSI,L.length-1);box.innerHTML=L.map((n,i)=>'<button type="button" data-mn="'+E(n)+'"'+(i===MSI?' class="on"':'')+'>@'+E(n)+'</button>').join('');box.hidden=false;inp.after(box)}
function chooseMention(name){if(!MI)return;const pos=MI.selectionStart==null?MI.value.length:MI.selectionStart,head=MI.value.slice(0,pos).replace(/@([^\s@\[\]]{0,20})$/,'@['+name+'] '),tail=MI.value.slice(pos);
 MI.value=head+tail;MI.focus();try{MI.setSelectionRange(head.length,head.length)}catch(e){}const box=P.querySelector('.cmm');if(box)box.hidden=true;MSI=0}
P.onkeydown=e=>{const t=e.target;if(t.tagName!=='INPUT')return;const box=P.querySelector('.cmm');
 if(box&&!box.hidden&&t===MI){const bs=[...box.querySelectorAll('button')];
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();MSI=(MSI+(e.key==='ArrowDown'?1:-1)+bs.length)%bs.length;bs.forEach((b,i)=>b.classList.toggle('on',i===MSI));return}
  if(e.key==='Enter'||e.key==='Tab'){e.preventDefault();chooseMention(bs[MSI].dataset.mn);return}
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();box.hidden=true;return}}
 if(e.key==='Enter'&&t.value.trim()){e.preventDefault();submit(t)}
 else if(e.key==='Escape'&&(t.dataset.edit||t.dataset.reply)){e.preventDefault();e.stopPropagation();CE=null;CR=null;cmts()}};
P.oninput=e=>{if(e.target.tagName==='INPUT'){MSI=0;suggest(e.target)}};
P.onchange=e=>{if(e.target.dataset&&e.target.dataset.f!==undefined){CF=e.target.value;cmts()}};
P.onclick=e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;
 if(d.mn!==undefined){chooseMention(d.mn);return}
 if(d.x==='close'){CP=null;after();return}
 if(d.d){const c=S.cm[d.d];if(c&&c.a===me.n){live().filter(r=>r.par===c.id).forEach(r=>del('cm',r.id));del('cm',c.id)}}
 else if(d.rs){const r=S.cm[d.rs];if(r&&!r.del)put('cm',{...r,res:r.res?0:1,rby:me.n,rts:Date.now()})}
 else if(d.ed){CE=d.ed;CR=null}
 else if(d.rp){CR=CR===d.rp?null:d.rp;CE=null}
 else if(d.rxp){CX=CX===d.rxp?null:d.rxp}
 else if(d.rx){const[id,em]=d.rx.split('|'),c=S.cm[id];if(c&&!c.del&&RXS.includes(em)){const rx={...(c.rx||{})},a=(rx[em]||[]).slice(),i=a.indexOf(me.n);if(i>=0)a.splice(i,1);else a.push(me.n);if(a.length)rx[em]=a;else delete rx[em];put('cm',{...c,rx});CX=null}}
 else return;after()};

/* ---------- all-comments panel ---------- */
const pan=document.createElement('aside');pan.id='xcpanel';pan.className='xpanel';pan.hidden=true;pan.setAttribute('role','complementary');pan.setAttribute('aria-label','All comments');
pan.innerHTML='<div class="xph"><b>Comments</b><span class="grow"></span><select id="xcf" aria-label="Show"><option value="open">Open</option><option value="resolved">Resolved</option><option value="all">All</option></select><button type="button" class="xpx" aria-label="Close panel"></button></div><div class="xpbd" id="xcl2" style="overflow:auto;padding:10px"></div>';
document.body.appendChild(pan);pan.querySelector('.xpx').innerHTML=ic('x');
let PF='open';
function pUpdate(){const th=allThreads(),n=th.filter(t=>!t.root.res).length,b=Q1('#xcmb .lb');if(b)b.textContent='Comments'+(n?' ('+n+')':'');
 if(pan.hidden)return;const L=th.filter(t=>PF==='all'||(PF==='open')!==!!t.root.res),box=pan.querySelector('#xcl2');
 box.innerHTML=L.map(t=>{const i=t.item,pg=S.pg[i.p],lab=(i.t&&String(i.t).trim()?String(i.t).trim().replace(/\s+/g,' ').slice(0,40):i.ty);
  return'<div class="xct'+(t.root.res?' res':'')+'" data-p="'+E(i.p)+'" data-i="'+E(i.id)+'" tabindex="0" role="button"><small>'+E(pg?pg.n:'')+' · '+E(lab)+'</small><div class="cmx">'+fmt(t.root.t)+'</div><small>'+E(t.root.a)+' · '+t.replies.length+' repl'+(t.replies.length===1?'y':'ies')+' · '+E(when(t.last))+'</small>'
   +(RO?'':'<span><button type="button" data-pr="'+E(t.root.id)+'">'+(t.root.res?'Reopen':'Resolve')+'</button></span>')+'</div>'}).join('')||'<p class="xcem">'+(th.length?'Nothing in this view.':'No comments yet. Select an item on a board and press the speech bubble to start a thread.')+'</p>'}
function jump(el){const p=el.dataset.p,i=el.dataset.i;if(!S.pg[p])return;go(p,i);CP=i;cmts()}
pan.onclick=e=>{const r=e.target.closest('[data-pr]');if(r){const c=S.cm[r.dataset.pr];if(c&&!c.del){put('cm',{...c,res:c.res?0:1,rby:me.n,rts:Date.now()});after()}return}
 if(e.target.closest('.xpx')){togglePanel(false);return}const row=e.target.closest('.xct');if(row)jump(row)};
pan.onkeydown=e=>{if((e.key==='Enter'||e.key===' ')&&e.target.classList&&e.target.classList.contains('xct')){e.preventDefault();jump(e.target)}else if(e.key==='Escape')togglePanel(false)};
pan.querySelector('#xcf').onchange=e=>{PF=e.target.value;pUpdate()};
function togglePanel(on){on=on===undefined?pan.hidden:on;if(on){try{Mosaic.panels.closeOthers('xcpanel')}catch(e){}pan.hidden=false;document.body.classList.add('xpo');pUpdate()}
 else{pan.hidden=true;if(![...document.querySelectorAll('.xpanel')].some(x=>!x.hidden))document.body.classList.remove('xpo')}}
{const th=Q1('#th');if(th){th.insertAdjacentHTML('beforebegin','<button id="xcmb" type="button" title="All comments on this project">'+ic('message-circle')+'<span class="lb">Comments</span></button>');
  Q1('#xcmb').onclick=()=>{togglePanel();const s=Q1('#sd');s&&s.classList.remove('open')}}}
try{Mosaic.commands.add({id:'comments:panel',title:'Show all comments',group:'Project',run:()=>togglePanel(true)})}catch(e){}
{const r0=window.refresh;window.refresh=function(){const r=r0.apply(this,arguments);try{pUpdate();if(CP&&CP===sel)cmts()}catch(e){}return r}}

/* ================= live cursors and presence ================= */
const COL=/^#[0-9a-f]{3,8}$/i,CHAT={text:'',until:0},FOL={id:null};let APPLY=0,LP={x:0,y:0};
const cvEl=document.getElementById('cv'),wEl=()=>document.getElementById('w');
const num=v=>typeof v==='number'&&isFinite(v);
function cleanCur(m){const o={k:'cur',id:String(m.id||'').slice(0,40),n:String(m.n||'Guest').slice(0,30),c:COL.test(m.c)?m.c:'#5b5bf0',p:String(m.p||'').slice(0,40),x:num(m.x)?m.x:-1e5,y:num(m.y)?m.y:-1e5};
 if(typeof m.s==='string'&&ID.test(m.s))o.s=m.s;if(Array.isArray(m.v)&&m.v.length===3&&m.v.every(num))o.v=m.v;if(typeof m.m==='string'&&m.m.trim())o.m=m.m.slice(0,80);return o}
{const r0=window.recv;window.recv=function(m,from,host){if(m&&m.k==='cur')m=cleanCur(m);const r=r0.call(this,m,from,host);if(m&&m.k==='cur'&&m.id===FOL.id)follow();return r}}
window.beat=function(){const m={k:'cur',id:me.id,n:me.n,c:me.c,p:cur,x:me.x,y:me.y};
 if(sel&&ID.test(sel))m.s=sel;
 try{m.v=[Math.round((cvEl.clientWidth/2-V.x)/V.z),Math.round((cvEl.clientHeight/2-V.y)/V.z),+V.z.toFixed(3)]}catch(e){}
 if(CHAT.text&&Date.now()<CHAT.until)m.m=CHAT.text;out(m)};
{let t=0;const a0=window.applyV;window.applyV=function(){const r=a0.apply(this,arguments);if(!APPLY&&!t){t=setTimeout(()=>{t=0;try{beat()}catch(e){}},120)}try{drawCur()}catch(e){}return r}}
{const p0=window.pick;window.pick=function(){const r=p0.apply(this,arguments);try{beat()}catch(e){}return r}}
const SIDE={};          /* per-person state that must survive a new cursor message: last position, last move */
const dropEl=id=>{[curs[id],SIDE[id]&&SIDE[id].sl].forEach(e=>e&&e.remove());delete curs[id];delete SIDE[id]};
let dq=0;
window.drawCur=function(){if(dq)return;dq=requestAnimationFrame(()=>{dq=0;paintCur()})};
function paintCur(){const now=Date.now(),W=wEl();if(!W)return;
 for(const[id,u]of Object.entries(users)){
  if(now-u.t>60000){delete users[id];dropEl(id);continue}
  const sd=SIDE[id]||(SIDE[id]={x:0,y:0,mv:now}),here=now-u.t<=9000&&u.p===cur&&u.x>-9e4;let e=curs[id];
  if(!here){if(e)e.style.display='none';if(sd.sl)sd.sl.style.display='none';continue}
  if(sd.x!==u.x||sd.y!==u.y){sd.x=u.x;sd.y=u.y;sd.mv=now}
  if(!e){e=curs[id]=document.createElement('div');e.className='cu';e.innerHTML='<svg width="16" height="16" viewBox="0 0 16 16"><path d="M1 1l5.5 14 2-5.5L14 7.5z"/></svg><span class="cn"></span><span class="cb" hidden></span>';W.appendChild(e)}
  e.style.display='';e.style.setProperty('--c',u.c);e.querySelector('.cn').textContent=u.n;e.classList.toggle('idle',now-sd.mv>8000);
  const cb=e.querySelector('.cb'),say=u.m&&now-u.t<7000;cb.hidden=!say;if(say)cb.textContent=u.m;
  e.style.transform='translate('+u.x+'px,'+u.y+'px) scale('+1/V.z+')';
  /* what they have selected */
  const it=u.s&&S.it[u.s];
  if(it&&!it.del&&it.p===cur){let sl=sd.sl;if(!sl){sl=sd.sl=document.createElement('div');sl.className='xsl';sl.innerHTML='<span></span>';W.appendChild(sl)}
   sl.style.display='';sl.style.setProperty('--c',u.c);sl.firstChild.textContent=u.n;sl.style.cssText+=';left:'+it.x+'px;top:'+it.y+'px;width:'+it.w+'px;height:'+it.h+'px;transform:'+(it.r?'rotate('+it.r+'deg)':'none')}
  else if(sd.sl)sd.sl.style.display='none'}
 pplUpdate()}

/* follow a person's view */
let ban=null;
function setFollow(id){FOL.id=id;if(!id){ban&&ban.remove();ban=null;pplUpdate();return}
 const u=users[id];if(!ban){ban=document.createElement('button');ban.type='button';ban.id='xfol';ban.onclick=()=>setFollow(null);document.body.appendChild(ban)}
 ban.textContent='Following '+(u?u.n:'someone')+'. Click here or move the canvas to stop.';follow();pplUpdate()}
function follow(){const u=FOL.id&&users[FOL.id];if(!u||Date.now()-u.t>9000)return;
 if(u.p!==cur){if(S.pg[u.p]&&!S.pg[u.p].del)open(u.p);return}
 if(!u.v)return;APPLY=1;try{V.z=Math.min(4,Math.max(.1,u.v[2]));V.x=cvEl.clientWidth/2-u.v[0]*V.z;V.y=cvEl.clientHeight/2-u.v[1]*V.z;applyV()}finally{APPLY=0}}
['wheel','pointerdown'].forEach(ev=>cvEl.addEventListener(ev,()=>{if(FOL.id)setFollow(null)},{capture:true,passive:true}));
cvEl.addEventListener('pointermove',e=>{LP={x:e.clientX,y:e.clientY}},{passive:true});

/* people panel: click "N people here" */
const st0=document.getElementById('st'),pp=document.createElement('div');pp.id='xppl';pp.hidden=true;pp.setAttribute('role','dialog');pp.setAttribute('aria-label','People here');document.body.appendChild(pp);
st0.setAttribute('role','button');st0.tabIndex=0;st0.title='Who is here';st0.classList.add('xpeople');
const crowd=()=>Object.values(users).filter(u=>Date.now()-u.t<9000);
function pplUpdate(){if(pp.hidden)return;const L=crowd();
 pp.innerHTML='<b>People here</b><div class="xpr"><i style="background:'+E(me.c)+'"></i><span>'+E(me.n)+' (you)</span><small>'+E((S.pg[cur]||{}).n||'')+'</small></div>'
  +(L.map(u=>'<div class="xpr"><i style="background:'+E(u.c)+'"></i><span>'+E(u.n)+'</span><small>'+E((S.pg[u.p]||{}).n||'another page')+'</small><button type="button" data-fl="'+E(u.id)+'">'+(FOL.id===u.id?'Stop following':'Follow')+'</button></div>').join('')||'<small>Nobody else is here right now.</small>')}
function togglePeople(){pp.hidden=!pp.hidden;if(pp.hidden)return;const r=st0.getBoundingClientRect();pp.style.top=Math.round(r.bottom+6)+'px';pp.style.left=Math.max(8,Math.min(r.left,innerWidth-300))+'px';pplUpdate()}
st0.onclick=togglePeople;st0.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();togglePeople()}};
pp.onclick=e=>{const b=e.target.closest('[data-fl]');if(!b)return;setFollow(FOL.id===b.dataset.fl?null:b.dataset.fl)};
addEventListener('pointerdown',e=>{if(!pp.hidden&&!e.target.closest('#xppl,#st'))pp.hidden=true},true);

/* cursor chat: press / on a board */
let chatEl=null;
function closeChat(){chatEl&&chatEl.remove();chatEl=null}
function openChat(){const pg=S.pg[cur];if(!pg||pg.t!=='b'||chatEl)return;
 chatEl=document.createElement('input');chatEl.id='xcc';chatEl.maxLength=80;chatEl.placeholder='Say something…  (Enter)';chatEl.setAttribute('aria-label','Cursor chat');chatEl.style.setProperty('--c',me.c);
 chatEl.style.left=Math.min(innerWidth-230,Math.max(8,LP.x+14))+'px';chatEl.style.top=Math.min(innerHeight-44,Math.max(8,LP.y+14))+'px';document.body.appendChild(chatEl);chatEl.focus();
 chatEl.onkeydown=e=>{e.stopPropagation();if(e.key==='Escape'){closeChat();return}
  if(e.key==='Enter'){const t=chatEl.value.trim();if(!t){closeChat();return}CHAT.text=t.slice(0,80);CHAT.until=Date.now()+6000;beat();setTimeout(beat,160);
   chatEl.readOnly=true;chatEl.classList.add('sent');const me2=chatEl;setTimeout(()=>{if(chatEl===me2)closeChat();CHAT.text=''},6000)}}}
addEventListener('keydown',e=>{if(e.key!=='/'||e.ctrlKey||e.metaKey||e.altKey||e.isComposing)return;const t=e.target,tg=(t&&t.tagName)||'';
 if(/INPUT|TEXTAREA|SELECT/.test(tg)||(t&&t.isContentEditable))return;const h=document.getElementById('xh');if(h&&!h.hidden)return;
 if(!S.pg[cur]||S.pg[cur].t!=='b')return;e.preventDefault();openChat()});
{const kb=Q1('#kb');if(kb)kb.insertAdjacentHTML('beforeend','<div><span>Cursor chat</span><kbd>/</kbd></div>')}
try{Mosaic.commands.add({id:'cursor:chat',title:'Cursor chat (say something at your cursor)',group:'Project',hint:'/',run:openChat});Mosaic.commands.add({id:'people:show',title:'Who is here: show people and follow',group:'Project',run:togglePeople})}catch(e){}
setInterval(()=>{if(!pp.hidden)pplUpdate()},4000);
pUpdate();
})();
