/* Mosaic workspace extras: full screen (F11) and focus mode, command palette (Ctrl+Shift+P),
   a "show password" button on every password field, and a few shortcuts. */
(()=>{
'use strict';
const M=window.Mosaic,Q=s=>document.querySelector(s),Icons=window.MosaicIcons,ic=n=>Icons?Icons.svg(n):'';
const PF=(p,d)=>{try{return M.prefs.get(p,d)}catch(e){return d}};
const toast=(t,o)=>{try{M.toast(t,o)}catch(e){}};
const inApp=()=>!!window.MOSAIC_APP,H={'X-Mosaic':'1'};

/* ================= full screen and focus mode ================= */
const W=M.window={fs:false,
 async nativeState(){try{const r=await fetch('__window',{headers:H});return r.ok?await r.json():{}}catch(e){return{}}},
 async setNative(k,v){try{const r=await fetch('__window?cmd='+encodeURIComponent(k)+'&v='+(v?1:0),{method:'POST',headers:H});return r.ok}catch(e){return false}},
 isFullscreen(){return inApp()?W.fs:!!document.fullscreenElement},
 async toggleFullscreen(force){
  const want=force===undefined?!W.isFullscreen():!!force;
  if(inApp()){await W.setNative('fullscreen',want);W.fs=want;mark();setTimeout(refresh,350)}
  else{try{if(want&&!document.fullscreenElement)await document.documentElement.requestFullscreen({navigationUI:'hide'});else if(!want&&document.fullscreenElement)await document.exitFullscreen()}
   catch(e){toast('The browser did not allow full screen here.');return}}
  if(want&&PF('window.hint',true)&&!hinted){hinted=true;toast('Full screen. F11 leaves it, Shift+F11 also hides the toolbars.')}},
 toggleFocus(force){const on=force===undefined?!document.body.classList.contains('xfocus'):!!force;
  if(on&&Q('#xh')&&!Q('#xh').hidden)return;
  document.body.classList.toggle('xfocus',on);let b=Q('#xfx');
  if(on&&!b){b=document.createElement('button');b.id='xfx';b.type='button';b.textContent='Exit focus mode (Esc)';b.onclick=()=>W.toggleFocus(false);document.body.appendChild(b)}
  if(b)b.hidden=!on;window.dispatchEvent(new Event('resize'))}};
let hinted=false;
const mark=()=>{document.body.classList.toggle('xfs',W.isFullscreen());const b=Q('#xfsb');if(b){b.innerHTML=ic(W.isFullscreen()?'minimize':'maximize')+'<span class="lb">'+(W.isFullscreen()?'Leave full screen':'Full screen')+'</span>'}
 const h=Q('#xfs');if(h)h.innerHTML=ic(W.isFullscreen()?'minimize':'maximize')};
async function refresh(){if(inApp()){const s=await W.nativeState();if(typeof s.fullscreen==='boolean')W.fs=s.fullscreen}mark()}
document.addEventListener('fullscreenchange',mark);
let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{if(inApp())refresh();else mark()},250)});
(window.MosaicAppReady||Promise.resolve()).then(()=>refresh());
addEventListener('keydown',e=>{
 if(e.key==='F11'&&!e.ctrlKey&&!e.altKey&&!e.metaKey){e.preventDefault();e.stopPropagation();e.shiftKey?W.toggleFocus():W.toggleFullscreen();return}
 if(e.key==='Escape'&&document.body.classList.contains('xfocus')&&!document.querySelector('#xpal')){W.toggleFocus(false)}
},true);
/* sidebar buttons (workspace) */
const th=Q('#th');
if(th){th.insertAdjacentHTML('beforebegin','<button id="xcpb" type="button" title="Command palette (Ctrl+Shift+P)">'+ic('command')+'<span class="lb">Commands</span></button><button id="xfsb" type="button" title="Full screen (F11)"></button>');
 Q('#xcpb').onclick=()=>M.commands.palette();Q('#xfsb').onclick=()=>{W.toggleFullscreen();Q('#sd').classList.remove('open')};mark()}

/* ================= command palette ================= */
let pal=null;
const inWorkspace=()=>{const h=Q('#xh');return !h||h.hidden};
const click=sel=>()=>{const b=Q(sel);b&&b.click()};
function builtins(){
 const C=[],add=(title,run,group,hint)=>C.push({id:'b:'+title,title,run,group:group||'Mosaic',hint:hint||''}),ctx=window.MosaicCtx;
 add('Full screen',()=>W.toggleFullscreen(),'Window','F11');add('Focus mode (hide toolbars)',()=>W.toggleFocus(),'Window','Shift+F11');
 if(ctx&&ctx.U){['account','appearance','storage','performance','window','files','design','discord','plugins','about'].forEach(t=>add('Settings: '+({window:'Window & keys',files:'Files & export',design:'Game design'}[t]||t[0].toUpperCase()+t.slice(1)),()=>window.MosaicSettings&&MosaicSettings.open(t),'Settings'))}
 if(inWorkspace()&&typeof S!=='undefined'&&Q('#nb')){
  add('Go to all projects',click('#xhb'),'Navigate');
  add('Go to Discover',()=>{try{sessionStorage['mosaic:view']='discover'}catch(e){}location.assign(location.pathname+location.search)},'Navigate');
  add('New board',click('#nb'),'Create');add('New doc',click('#nd'),'Create');add('New table',click('#nt'),'Create');add('New design',click('#nf'),'Create');add('New whiteboard',click('#nw'),'Create');
  add('Export…',click('#exb'),'Project');add('Share…',click('#sh'),'Project');add('Files',click('#fb'),'Project');add('Trash',click('#trb'),'Project');
  add('Search this project',()=>{const q=Q('#sq');q&&q.focus()},'Project','Ctrl+K');add('Toggle dark or light theme',click('#th'),'Appearance');
  try{pages().forEach(p=>add('Go to page: '+p.n,()=>open(p.id),'Pages'))}catch(e){}
 }else if(ctx&&ctx.U){add('Go to Home',()=>{const b=document.querySelector('#xh [data-v=home]');b&&b.click()},'Navigate');add('Go to Discover',()=>{const b=document.querySelector('#xh [data-v=discover]');b&&b.click()},'Navigate')}
 return C}
function openPalette(){
 if(pal){closePalette();return}
 const all=[...M.commands.list(),...builtins()];let sel=0,shown=[];
 pal=document.createElement('div');pal.id='xpal';
 pal.innerHTML='<div class="xpbox" role="dialog" aria-modal="true" aria-label="Command palette"><input type="text" id="xpi" role="combobox" aria-expanded="true" aria-controls="xpl" autocomplete="off" spellcheck="false" placeholder="Type a command or a page name"><ul id="xpl" role="listbox"></ul><div class="xphint">↑ ↓ to choose · Enter to run · Esc to close</div></div>';
 document.body.appendChild(pal);const inp=pal.querySelector('#xpi'),ul=pal.querySelector('#xpl');
 const draw=()=>{const q=inp.value.toLowerCase().split(/\s+/).filter(Boolean);
  shown=all.filter(c=>q.every(w=>(c.title+' '+c.group).toLowerCase().includes(w))).slice(0,60);if(sel>=shown.length)sel=Math.max(0,shown.length-1);
  ul.innerHTML='';
  shown.forEach((c,i)=>{const li=document.createElement('li');li.setAttribute('role','option');li.id='xpo'+i;li.setAttribute('aria-selected',String(i===sel));
   const a=document.createElement('span'),g=document.createElement('small');a.textContent=c.title;g.textContent=(c.hint?c.hint+' · ':'')+c.group;li.append(a,g);
   li.onmousemove=()=>{if(sel!==i){sel=i;mark2()}};li.onclick=()=>run(c);ul.appendChild(li)});
  if(!shown.length){const li=document.createElement('li');li.className='xpe';li.textContent='Nothing matches “'+inp.value+'”.';ul.appendChild(li)}
  inp.setAttribute('aria-activedescendant',shown.length?'xpo'+sel:'')};
 const mark2=()=>{[...ul.children].forEach((li,i)=>li.setAttribute('aria-selected',String(i===sel)));const cur=ul.children[sel];cur&&cur.scrollIntoView&&cur.scrollIntoView({block:'nearest'});inp.setAttribute('aria-activedescendant','xpo'+sel)};
 const run=c=>{closePalette();setTimeout(()=>{try{c.run()}catch(e){toast('That command failed: '+e.message)}},30)};
 inp.oninput=()=>{sel=0;draw()};
 pal.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closePalette()}
  else if(e.key==='ArrowDown'){e.preventDefault();sel=Math.min(shown.length-1,sel+1);mark2()}
  else if(e.key==='ArrowUp'){e.preventDefault();sel=Math.max(0,sel-1);mark2()}
  else if(e.key==='Enter'){e.preventDefault();if(shown[sel])run(shown[sel])}
  else if(e.key==='Tab'){e.preventDefault()}};
 pal.addEventListener('mousedown',e=>{if(e.target===pal)closePalette()});
 draw();inp.focus()}
let back=null;
function closePalette(){if(!pal)return;pal.remove();pal=null;if(back&&back.focus)try{back.focus()}catch(e){}}
M.on('palette:open',()=>{back=document.activeElement;openPalette()});
addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.shiftKey&&(e.key==='P'||e.key==='p')){e.preventDefault();M.commands.palette()}},true);

/* ================= show-password buttons ================= */
const EYE=()=>ic('eye'),OFF=()=>ic('eye-off');
function reveal(inp){
 if(inp.dataset.xpw||inp.hasAttribute('data-noreveal'))return;inp.dataset.xpw='1';
 const wrap=document.createElement('span');wrap.className='xpw';inp.parentNode.insertBefore(wrap,inp);wrap.appendChild(inp);
 const b=document.createElement('button');b.type='button';b.className='xpwb';b.tabIndex=0;b.setAttribute('aria-pressed','false');b.setAttribute('aria-label','Show password');b.title='Show password';b.innerHTML=EYE();wrap.appendChild(b);
 let t=0;const set=on=>{const was=document.activeElement===inp,s=inp.selectionStart,e=inp.selectionEnd;inp.type=on?'text':'password';b.setAttribute('aria-pressed',String(on));
  const n=on?'Hide password':'Show password';b.setAttribute('aria-label',n);b.title=n;b.innerHTML=on?OFF():EYE();clearTimeout(t);if(on)t=setTimeout(()=>set(false),30000);
  if(was){inp.focus();try{inp.setSelectionRange(s,e)}catch(x){}}};
 b.addEventListener('mousedown',e=>e.preventDefault());           /* keep the caret in the field */
 b.addEventListener('click',()=>set(inp.type==='password'));
 inp.addEventListener('blur',()=>{if(inp.type==='text')t=setTimeout(()=>set(false),8000)});
 inp.addEventListener('focus',()=>clearTimeout(t))}
const scan=root=>(root||document).querySelectorAll('input[type=password]:not([data-xpw])').forEach(reveal);
scan();let q=0;new MutationObserver(()=>{if(q)return;q=requestAnimationFrame(()=>{q=0;scan()})}).observe(document.body,{childList:true,subtree:true});

/* ================= shortcut list (the "?" panel) ================= */
const kb=Q('#kb');if(kb)kb.insertAdjacentHTML('beforeend','<div><span>Full screen</span><kbd>F11</kbd></div><div><span>Focus mode</span><kbd>Shift F11</kbd></div><div><span>Command palette</span><kbd>Ctrl Shift P</kbd></div>');
})();
