/* Mosaic workspace responsiveness: phone header sheet, touch pan/pinch, browser theme colour. */
(()=>{
const $=s=>document.querySelector(s),Icons=window.MosaicIcons;
const mqPhone=matchMedia('(max-width:760px),(max-height:520px) and (pointer:coarse)'),mqSheet=matchMedia('(max-width:1100px),(max-height:520px) and (pointer:coarse)');
const main=$('main'),header=$('header'),tools=$('#tools'),cv=$('#cv');

/* ---- browser / status bar colour follows the interface ---- */
let meta=document.querySelector('meta[name=theme-color]');
if(!meta){meta=document.createElement('meta');meta.name='theme-color';document.head.appendChild(meta)}
const paintBar=()=>{try{const c=getComputedStyle($('#tabs')).backgroundColor;if(c&&c!=='rgba(0, 0, 0, 0)')meta.content=c}catch(e){}};
new MutationObserver(paintBar).observe(document.documentElement,{attributes:true,attributeFilter:['data-t','style']});
new MutationObserver(paintBar).observe(document.body,{attributes:true,attributeFilter:['data-pt','data-k','style']});
setTimeout(paintBar,50);addEventListener('load',paintBar);

/* ---- drawer backdrop (sidebar) and "more" sheet ---- */
const bd=document.createElement('div');bd.id='xbd';document.body.appendChild(bd);
const sheet=document.createElement('div');sheet.id='xsheet';sheet.setAttribute('role','dialog');sheet.setAttribute('aria-label','More options');sheet.setAttribute('aria-modal','true');
sheet.innerHTML='<div class="xgrab"><b>Page options</b><button type="button" id="xsx" aria-label="Close">'+Icons.svg('x')+'</button></div>';document.body.appendChild(sheet);
const more=document.createElement('button');more.id='xmorebtn';more.type='button';more.setAttribute('aria-label','More options');more.setAttribute('aria-haspopup','dialog');more.innerHTML=Icons.svg('ellipsis');
$('#sh').parentNode.insertBefore(more,$('#sh'));
const aside=$('aside');
const sync=()=>{bd.classList.toggle('on',sheet.classList.contains('on')||(aside.classList.contains('open')&&matchMedia('(max-width:1024px)').matches))};
const openSheet=o=>{sheet.classList.toggle('on',o);more.setAttribute('aria-expanded',String(o));sync();if(o)sheet.querySelector('#xsx').focus()};
more.onclick=()=>openSheet(true);$('#xsx').onclick=()=>openSheet(false);
bd.onclick=()=>{openSheet(false);aside.classList.remove('open');sync()};
new MutationObserver(sync).observe(aside,{attributes:true,attributeFilter:['class']});
addEventListener('keydown',e=>{if(e.key==='Escape'){if(sheet.classList.contains('on'))openSheet(false);else if(aside.classList.contains('open')){aside.classList.remove('open');sync()}}});
sheet.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&b.id!=='xsx'&&!b.closest('.xgrab'))setTimeout(()=>openSheet(false),60)});
aside.addEventListener('click',e=>{if(matchMedia('(max-width:1024px)').matches&&e.target.closest('.pg,#nb,#nd,#nt,#nf,#nw'))setTimeout(()=>{aside.classList.remove('open');sync()},60)});

/* ---- move the rarely used header controls into the sheet on phones, and back on larger screens ---- */
const KEEP=new Set(['mb','ttl','tools','sh','xmorebtn']);const marks=new Map();
const LABELS={bgc:'Board background',sq:'Search this project'};
function toPhone(){[...header.children].forEach(el=>{if(KEEP.has(el.id)||el.contains(tools))return;const m=document.createComment('x');header.insertBefore(m,el);marks.set(el,m);
 if(LABELS[el.id]){const l=document.createElement('div');l.className='xlab';l.textContent=LABELS[el.id];sheet.appendChild(l)}sheet.appendChild(el)})}
function toDesktop(){[...sheet.children].forEach(el=>{if(el.classList.contains('xgrab'))return;if(el.classList.contains('xlab')){el.remove();return}const m=marks.get(el);if(m&&m.parentNode){m.parentNode.replaceChild(el,m);marks.delete(el);m.remove?.()}else header.insertBefore(el,more)});openSheet(false)}
const layout=()=>{mqSheet.matches?toPhone():toDesktop();syncBar()};

/* ---- reserve room for the bottom tool bar only while it is visible ---- */
function syncBar(){main.classList.toggle('xtb',mqPhone.matches&&!tools.hidden)}
new MutationObserver(syncBar).observe(tools,{attributes:true,attributeFilter:['hidden']});
mqSheet.addEventListener&&mqSheet.addEventListener('change',layout);mqPhone.addEventListener&&mqPhone.addEventListener('change',syncBar);
layout();

/* ---- pan button for touch: one finger moves the canvas instead of selecting ---- */
const pan=document.createElement('button');pan.dataset.a='pan';pan.id='xpan';pan.type='button';pan.title='Pan (drag to move the canvas)';pan.setAttribute('aria-label','Pan');pan.setAttribute('aria-pressed','false');
pan.innerHTML='<i>'+Icons.svg('hand')+'</i><span class="tl">Pan</span>';
tools.insertBefore(pan,tools.firstChild);
let panMode=false;
pan.addEventListener('click',e=>{e.stopPropagation();panMode=!panMode;document.body.classList.toggle('xpanmode',panMode);pan.classList.toggle('on-btn',panMode);pan.setAttribute('aria-pressed',String(panMode))});
try{['f','w'].forEach(k=>{if(typeof TS!=='undefined'&&TS[k]&&!/\bpan\b/.test(TS[k]))TS[k]+=' pan'})}catch(e){}
try{tools(S.pg[cur].k)}catch(e){}

/* ---- the properties sheet only appears when something is selected ---- */
try{const oi=inspect;inspect=function(){const r=oi.apply(this,arguments);try{$('#insp').classList.toggle('xnosel',!SL.size)}catch(e){}return r}}catch(e){}
/* ---- touch gestures on the canvas: two-finger pinch zoom and pan ---- */
const ptr=new Map();let g=null;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const inCanvas=e=>cv.contains(e.target);
addEventListener('pointerdown',e=>{
 if(e.pointerType!=='touch')return;
 if(!inCanvas(e)&&!ptr.size)return;      /* a second finger may land on a panel; it still belongs to the gesture */
 ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(ptr.size>=2){
  try{D=null}catch(x){}
  const[a,b]=[...ptr.values()],r=cv.getBoundingClientRect(),mx=(a.x+b.x)/2-r.left,my=(a.y+b.y)/2-r.top;
  g={t:'pinch',d0:Math.max(10,Math.hypot(a.x-b.x,a.y-b.y)),z0:V.z,wx:(mx-V.x)/V.z,wy:(my-V.y)/V.z};
  e.stopImmediatePropagation();e.preventDefault();return}
 if(panMode&&ptr.size===1){g={t:'pan',x0:e.clientX,y0:e.clientY,vx:V.x,vy:V.y};e.stopImmediatePropagation();e.preventDefault()}
},{capture:true,passive:false});
addEventListener('pointermove',e=>{
 if(!ptr.has(e.pointerId))return;ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});if(!g)return;
 if(g.t==='pinch'&&ptr.size>=2){
  const[a,b]=[...ptr.values()],r=cv.getBoundingClientRect(),z=clamp(g.z0*Math.hypot(a.x-b.x,a.y-b.y)/g.d0,.1,8),mx=(a.x+b.x)/2-r.left,my=(a.y+b.y)/2-r.top;
  V.z=z;V.x=mx-g.wx*z;V.y=my-g.wy*z;applyV()}
 else if(g.t==='pan'){V.x=g.vx+e.clientX-g.x0;V.y=g.vy+e.clientY-g.y0;applyV()}
 e.stopImmediatePropagation();e.preventDefault()
},{capture:true,passive:false});
const up=e=>{if(!ptr.has(e.pointerId))return;ptr.delete(e.pointerId);if(g){if(g.t==='pan'||ptr.size<2)g=ptr.size?{t:'wait'}:null;e.stopImmediatePropagation()}};
addEventListener('pointerup',up,{capture:true});addEventListener('pointercancel',up,{capture:true});
})();
