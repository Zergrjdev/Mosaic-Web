
(()=>{const PS={'iPhone 15 · 393×852':[393,852],'Android · 360×800':[360,800],'iPad · 820×1180':[820,1180],'Desktop · 1440×1024':[1440,1024],'A4 · 595×842':[595,842],'Square · 1080×1080':[1080,1080],'Slide · 1920×1080':[1920,1080]},FN=['Inter','Georgia','Caveat','monospace'],TY=['text','note','rect','oval','dia','frame'],
sv=j=>{put('it',j);const e=els.get(j.id);e&&paint(e,j)},ap=f=>{SL.forEach(k=>{const j=S.it[k];if(j&&j.ty!=='cn'){f(j);sv(j)}});inspect()};
const op=paint;paint=function(e,i){op(e,i);const s=e.style;s.display=i.hd?'none':'';s.fontWeight=i.fw||'';s.fontStyle=i.fi?'italic':'';s.textAlign=i.ta||'';s.fontFamily=i.ff?FontLib.css(i.ff):'';FontLib.load(i.ff)};
const oi=inspect;inspect=function(){oi.apply(this,arguments);if(RO)return;const F=isF();
 F&&insp.querySelectorAll('[data-ly]').forEach(b=>{const j=S.it[b.dataset.ly];j&&b.insertAdjacentHTML('beforeend',`<span data-eye="${j.id}" title="Show or hide">${j.hd?'🙈':'👁'}</span><span data-lk="${j.id}" title="Lock or unlock">${j.lock?'🔒':'🔓'}</span>`)});
 const i=sel&&S.it[sel];if(!i)return;let h='';
 if(F&&i.ty==='frame')h+='<select data-fp title="Frame size"><option value="">Frame size…</option>'+Object.keys(PS).map(k=>`<option>${k}</option>`).join('')+'</select>';
 if(TY.includes(i.ty))h+='<select data-ff title="Font" hidden>'+FN.concat(i.ff&&!FN.includes(i.ff)?[i.ff]:[]).map(f=>`<option${i.ff===f?' selected':''}>${f}</option>`).join('')+'</select><button data-ffb title="Font" style="font-family:'+(i.ff?FontLib.css(i.ff).replace(/"/g,"'"):'inherit')+'">'+(i.ff||'Default font')+'</button><button data-fg="b" title="Bold">B</button><button data-fg="i" title="Italic">I</button><button data-fg="left" title="Align left">⇤</button><button data-fg="center" title="Align centre">↔</button><button data-fg="right" title="Align right">⇥</button>';
 if(SL.size>2)h+='<button data-fg="dh" title="Distribute horizontally">⇔</button><button data-fg="dv" title="Distribute vertically">⇕</button>';
 if(!F)h=h.split('<button data-fg=')[0];h&&insp.insertAdjacentHTML('afterbegin','<div style="display:flex;flex-wrap:wrap;gap:4px;width:100%">'+h+'</div>')};
insp.addEventListener('click',e=>{const d=e.target.dataset||{};if(!(d.fg||d.eye||d.lk))return;e.stopPropagation();
 if(d.eye||d.lk){const j=S.it[d.eye||d.lk];if(j){d.lk?j.lock=!j.lock:j.hd=!j.hd;sv(j);inspect()}return}
 const g=d.fg;if(g==='dh'||g==='dv'){const X=g==='dh',p=X?'x':'y',q=X?'w':'h',L=[...SL].map(k=>S.it[k]).filter(j=>j&&j.ty!=='cn').sort((a,b)=>a[p]-b[p]);if(L.length<3)return;const z=L[L.length-1],gap=(z[p]+z[q]-L[0][p]-L.reduce((t,j)=>t+j[q],0))/(L.length-1);let c=L[0][p];L.forEach(j=>{j[p]=Math.round(c);c+=j[q]+gap;sv(j)});inspect();return}
 ap(j=>{if(g==='b')j.fw=j.fw?'':700;else if(g==='i')j.fi=!j.fi;else j.ta=g})},true);
insp.addEventListener('change',e=>{const t=e.target,d=t.dataset||{};if(d.fp!==undefined&&PS[t.value])ap(j=>{if(j.ty==='frame'){j.w=PS[t.value][0];j.h=PS[t.value][1]}});else if(d.ff!==undefined)ap(j=>{j.ff=t.value})});
const P=document.createElement('div');P.id='pm';P.hidden=true;document.body.appendChild(P);let pf=[],pi=0;
const sh=()=>{const f=pf[pi];if(!f){P.hidden=true;return}P.hidden=false;const k=Math.min((innerWidth-40)/f.w,(innerHeight-60)/f.h),s=document.createElement('div');
 s.style.cssText=`position:absolute;left:50%;top:50%;width:${f.w}px;height:${f.h}px;margin:${-f.h/2}px 0 0 ${-f.w/2}px;transform:scale(${k});overflow:hidden;background:${f.g2?`linear-gradient(135deg,${f.c||'#fff'},${f.g2})`:(f.c||'#fff')}`;
 Object.values(S.it).filter(j=>j.p===cur&&!j.del&&!j.hd&&j.ty!=='cn'&&j!==f&&j.x>=f.x-1&&j.y>=f.y-1&&j.x+j.w<=f.x+f.w+1&&j.y+j.h<=f.y+f.h+1).sort((a,b)=>(a.z||0)-(b.z||0)).forEach(j=>{const e=els.get(j.id);if(!e)return;const c=e.cloneNode(true);c.classList.remove('sel');c.style.left=j.x-f.x+'px';c.style.top=j.y-f.y+'px';c.style.pointerEvents='none';s.appendChild(c)});
 P.replaceChildren(s);P.insertAdjacentHTML('beforeend',`<span class="pc">${pi+1} / ${pf.length} · arrow keys to move · Esc to exit</span>`)};
const go=()=>{pf=Object.values(S.it).filter(j=>j.p===cur&&!j.del&&!j.hd&&j.ty==='frame').sort((a,b)=>a.x-b.x||a.y-b.y);if(!pf.length){alert('Add a frame first. Each frame is one slide.');return}pi=Math.max(0,pf.findIndex(j=>j.id===sel));sh()};
const b=document.createElement('button');b.dataset.a='present';b.innerHTML='<i>▶</i> Present';$('#tools').appendChild(b);isF()&&tools('f');
$('#tools').addEventListener('click',e=>{if(e.target.closest('[data-a=present]')){e.stopPropagation();go()}},true);
P.onclick=e=>{pi=Math.max(0,Math.min(pf.length-1,pi+(e.clientX<innerWidth/2?-1:1)));sh()};
addEventListener('keydown',e=>{if(P.hidden)return;e.preventDefault();e.stopPropagation();if(e.key==='Escape')P.hidden=true;else if(/Arrow(Right|Down)|PageDown| /.test(e.key)){pi=Math.min(pf.length-1,pi+1);sh()}else if(/Arrow(Left|Up)|PageUp/.test(e.key)){pi=Math.max(0,pi-1);sh()}},true);
})();
