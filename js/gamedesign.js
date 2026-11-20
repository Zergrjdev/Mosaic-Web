/* Mosaic game-design tools for design pages (no frames):
   reference-resolution guide + safe area, grid with snapping, and per-item export metadata. */
(()=>{
const M=window.Mosaic,P=(p,d)=>M.prefs.get(p,d),st=document.createElement('style');
st.textContent=`#gd-guide{position:absolute;left:0;top:0;border:2px dashed var(--ac);pointer-events:none;z-index:0;box-sizing:border-box}
#gd-guide i{position:absolute;border:1px dotted var(--ac);opacity:.7}#gd-guide b{position:absolute;left:0;top:-22px;font:600 12px/1 system-ui,sans-serif;color:var(--ac);white-space:nowrap}
#gd-grid{position:absolute;inset:0;pointer-events:none}
.gdh{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--mu)}.gdh select{font:inherit;padding:3px 6px;border-radius:8px;border:1px solid var(--bd);background:var(--pn);color:var(--tx)}
#gdm{position:fixed;right:14px;top:96px;width:268px;background:var(--pn);color:var(--tx);border:1px solid var(--bd);border-radius:12px;box-shadow:var(--sh);padding:12px;z-index:70;display:grid;gap:8px;font-size:13px}
#gdm label{display:grid;gap:3px;color:var(--mu)}#gdm input[type=text],#gdm input[type=number],#gdm select{width:100%;font:inherit;padding:5px 7px;border-radius:8px;border:1px solid var(--bd);background:var(--bg);color:var(--tx)}
#gdm .r4{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}#gdm .ck{display:flex;gap:6px;align-items:center;color:var(--tx)}#gdm h4{margin:0;font-size:13px}`;
document.head.appendChild(st);

const cvEl=$('#cv'),world=$('#w');
const guide=document.createElement('div');guide.id='gd-guide';guide.hidden=true;world.appendChild(guide);
const grid=document.createElement('div');grid.id='gd-grid';grid.hidden=true;cvEl.insertBefore(grid,world);

const PRESETS=[['none','No guide'],['1920x1080','1920×1080 · Full HD'],['1280x720','1280×720 · HD'],['2560x1440','2560×1440 · QHD'],['1080x1920','1080×1920 · phone portrait'],['844x390','844×390 · phone landscape'],['390x844','390×844 · phone (points)'],['360x800','360×800 · Android'],['custom','Custom size…']];
function size(){const g=P('design.guide','none');if(g==='none')return null;if(g==='custom')return[+P('design.cw',1920)||1920,+P('design.ch',1080)||1080];const m=/^(\d+)x(\d+)$/.exec(g);return m?[+m[1],+m[2]]:null}
const onDesign=()=>typeof isF==='function'&&isF()&&!cvEl.hidden;
function paintGuide(){
 const s=size(),on=onDesign()&&s&&P('design.showGuide',true);guide.hidden=!on;if(!on)return;
 const sf=Math.max(0,Math.min(25,+P('design.safe',5)||0));guide.style.width=s[0]+'px';guide.style.height=s[1]+'px';
 guide.innerHTML='<b>'+s[0]+' × '+s[1]+(sf?' · safe area '+sf+'%':'')+'</b>'+(sf?'<i style="left:'+sf+'%;right:'+sf+'%;top:'+sf+'%;bottom:'+sf+'%"></i>':'')}
function paintGrid(){
 const g=+P('design.grid',0)||0,z=(typeof V!=='undefined'&&V.z)||1,on=onDesign()&&g>0&&P('design.showGrid',false)&&g*z>=6;grid.hidden=!on;if(!on)return;
 const c=getComputedStyle(document.documentElement).getPropertyValue('--bd')||'#888',s=g*z+'px';
 grid.style.backgroundImage='linear-gradient(to right,'+c+' 1px,transparent 1px),linear-gradient(to bottom,'+c+' 1px,transparent 1px)';
 grid.style.backgroundSize=s+' '+s;grid.style.backgroundPosition=V.x+'px '+V.y+'px'}
const paintAll=()=>{paintGuide();paintGrid();hdr()};

/* header controls */
$('#xui').insertAdjacentHTML('beforebegin','<span class="gdh" id="gdh" hidden><select id="gd-sel" aria-label="Reference resolution guide" title="Show a screen-size guide (not a frame)">'+PRESETS.map(p=>'<option value="'+p[0]+'">'+p[1]+'</option>').join('')+'</select><label title="Snap moved items to the grid (hold Alt to bypass)"><input type="checkbox" id="gd-snap"> Snap</label></span>');
function hdr(){const h=$('#gdh');h.hidden=!(onDesign()&&!$('#exb').hidden);$('#gd-sel').value=P('design.guide','none');$('#gd-snap').checked=!!P('design.snap',false)}
$('#gd-sel').onchange=e=>M.prefs.set('design.guide',e.target.value);
$('#gd-snap').onchange=e=>{M.prefs.set('design.snap',e.target.checked);if(e.target.checked&&!(+P('design.grid',0)>0))M.prefs.set('design.grid',8)};
M.on('prefs:change',e=>{if(/^design|^\*/.test(e.path))paintAll()});
M.on('page:open',paintAll);
{const av=applyV;applyV=function(){const r=av.apply(this,arguments);try{paintGrid()}catch(e){}return r}}
paintAll();

/* snapping to the grid while dragging */
{const as0=alignSnap;alignSnap=function(dx,dy){
 const g=+P('design.grid',0);if(!P('design.snap',false)||!(g>0)||typeof D==='undefined'||!D||!D.set)return as0.apply(this,arguments);
 const o=D.set.find(q=>q.j===D.i)||D.set[0];if(!o)return as0.apply(this,arguments);
 return[Math.round((o.x+dx)/g)*g-o.x,Math.round((o.y+dy)/g)*g-o.y]}}

/* per-item game asset settings */
const panel=document.createElement('div');panel.id='gdm';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Game asset settings');document.body.appendChild(panel);
const esc2=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sel=()=>[...SL].map(k=>S.it[k]).filter(i=>i&&!i.del);
function renderPanel(){
 const L=sel();if(!L.length){panel.hidden=true;return}
 const i=L[0],multi=L.length>1,sl=Array.isArray(i.sl)?i.sl:['','','',''];
 panel.innerHTML='<h4>'+MosaicIcons.svg('gamepad-2')+' Game asset'+(multi?' ('+L.length+' items)':'')+'</h4>'
 +'<label>Export name'+(multi?' (single item only)':'')+'<input type="text" data-gx="xn" maxlength="80" placeholder="e.g. buttons/play" value="'+esc2(multi?'':i.xn)+'"'+(multi?' disabled':'')+'></label>'
 +'<label class="ck"><input type="checkbox" data-gx="nx"'+(L.every(x=>x.nx)?' checked':'')+'> Skip when exporting</label>'
 +'<label>9-slice borders in px (left, top, right, bottom)<span class="r4">'+[0,1,2,3].map(n=>'<input type="number" min="0" data-gx="sl'+n+'" value="'+esc2(sl[n]||'')+'" aria-label="9-slice '+['left','top','right','bottom'][n]+'">').join('')+'</span></label>'
 +'<label>Pivot<select data-gx="pv">'+Object.keys({center:1,'top-left':1,top:1,'top-right':1,left:1,right:1,'bottom-left':1,bottom:1,'bottom-right':1}).map(p=>'<option'+((i.pv||'center')===p?' selected':'')+'>'+p+'</option>').join('')+'</select></label>'
 +'<small style="color:var(--mu)">Saved into layout.json for your game engine.</small>'}
panel.addEventListener('change',e=>{
 const k=e.target.dataset.gx;if(!k||RO)return;
 sel().forEach(i=>{
  if(k==='xn'){const v=e.target.value.trim();if(v)i.xn=v;else delete i.xn}
  else if(k==='nx'){if(e.target.checked)i.nx=1;else delete i.nx}
  else if(k==='pv'){if(e.target.value==='center')delete i.pv;else i.pv=e.target.value}
  else if(/^sl\d$/.test(k)){const v=[0,1,2,3].map(n=>Math.max(0,+(panel.querySelector('[data-gx=sl'+n+']').value)||0));if(v.some(Boolean))i.sl=v;else delete i.sl}
  put('it',i)})});
panel.addEventListener('keydown',e=>{if(e.key==='Escape')panel.hidden=true;e.stopPropagation()});
const oi=inspect;inspect=function(){
 const r=oi.apply(this,arguments);
 try{const L=sel();$('#insp').querySelectorAll('[data-gxo]').forEach(b=>b.remove());
  if(typeof isF==='function'&&isF()&&L.length&&!RO){$('#insp').insertAdjacentHTML('beforeend','<button data-gxo title="Export name, 9-slice and pivot for game engines">'+MosaicIcons.svg('gamepad-2')+'<span class="lb">Asset</span></button>');if(!panel.hidden)renderPanel()}else panel.hidden=true}catch(e){}
 return r};
$('#insp').addEventListener('click',e=>{const b=e.target.closest('[data-gxo]');if(!b)return;e.stopPropagation();panel.hidden=!panel.hidden;if(!panel.hidden)renderPanel()},true);
})();
