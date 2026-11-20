
(()=>{const B=document.body,T=$('#tools'),NK={1:'v',2:'r',3:'d',4:'o',5:'a',6:'l',7:'p',8:'t',9:'img',0:'e'};
T.insertAdjacentHTML('beforeend','<button data-a="laser" title="Laser pointer (K)"><i>⌖</i> Laser</button><button data-a="zen" title="Zen mode (Alt+Z)"><i>◱</i> Zen</button><button data-a="grid" title="Grid (Ctrl+\')"><i>▦</i> Grid</button>');TS.w+=' laser zen grid';B.dataset.k==='w'&&tools('w');
const Z=document.createElement('button');Z.id='zx';Z.className='pri';Z.textContent='Exit zen mode';Z.onclick=()=>B.classList.remove('zen');B.appendChild(Z);
const LC=document.createElement('canvas');LC.id='laser';LC.hidden=true;$('#stage').appendChild(LC);let LS=0,pts=[],raf=0,dn=0;
const draw=()=>{const g=LC.getContext('2d'),n=performance.now();g.clearRect(0,0,LC.width,LC.height);pts=pts.filter(q=>n-q.t<900);
 for(let k=1;k<pts.length;k++){const a=pts[k-1],b=pts[k],f=1-(n-b.t)/900;if(b.s)continue;g.strokeStyle=`rgba(255,40,40,${f})`;g.lineWidth=2+4*f;g.lineCap='round';g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke()}
 raf=pts.length?requestAnimationFrame(draw):0};
const add=(e,s)=>{pts.push({x:e.offsetX,y:e.offsetY,t:performance.now(),s});raf||(raf=requestAnimationFrame(draw))};
LC.onpointerdown=e=>{LC.setPointerCapture(e.pointerId);dn=1;add(e,1)};LC.onpointermove=e=>{dn&&add(e,0)};LC.onpointerup=()=>{dn=0};
const lz=()=>{LS=!LS;LC.hidden=!LS;if(LS){LC.width=LC.clientWidth;LC.height=LC.clientHeight}T.querySelector('[data-a=laser]').classList.toggle('on-btn',LS)};
const gv=()=>{const on=B.classList.contains('gm');cv.style.backgroundImage=on?'linear-gradient(var(--bd) 1px,transparent 1px),linear-gradient(90deg,var(--bd) 1px,transparent 1px)':'';cv.style.backgroundSize=on?20*V.z+'px '+20*V.z+'px':'';cv.style.backgroundPosition=on?V.x+'px '+V.y+'px':''};
try{const oa=applyV;applyV=function(){oa.apply(this,arguments);B.classList.contains('gm')&&gv()}}catch(x){}
T.addEventListener('click',e=>{const b=e.target.closest('[data-a=laser],[data-a=zen],[data-a=grid]');if(!b)return;e.stopPropagation();const a=b.dataset.a;if(a==='laser')lz();else if(a==='zen')B.classList.add('zen');else{B.classList.toggle('gm');gv()}},true);
addEventListener('keydown',e=>{if(B.dataset.pt!=='excal'||cv.hidden)return;
 if(e.altKey&&e.code==='KeyZ'){e.preventDefault();B.classList.toggle('zen');return}
 if((e.ctrlKey||e.metaKey)&&e.key==="'"){e.preventDefault();B.classList.toggle('gm');gv();return}
 if(e.key==='Escape'){B.classList.remove('zen');LS&&lz();return}
 if(e.ctrlKey||e.metaKey||e.altKey||e.target.isContentEditable||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||RO)return;
 if(e.key==='k'){lz();return}const m=NK[e.key];if(m===undefined)return;
 if(m==='img')T.querySelector('[data-a=img]').click();else dispatchEvent(new KeyboardEvent('keydown',{key:m}))},true);
})();
