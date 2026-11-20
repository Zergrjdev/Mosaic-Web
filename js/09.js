
(()=>{const IC=[[/match|fight|battle|war|combat|weapon|sword|attack/,'⚔'],[/enemy|boss|monster|death|zombie|threat/,'☠'],[/money|currenc|coin|gold|price|shop|store|econom|buy|cash/,'◈'],[/level|xp|progress|rank|stat|skill|upgrade|system/,'▲'],[/char|player|people|team|user|hero|npc|cast/,'☺'],[/map|world|place|location|region|environment|scene/,'◎'],[/story|plot|lore|script|narrat|dialog|write|quest/,'✎'],[/art|design|ui|ux|style|colou?r|visual|concept|model|texture|anim/,'✦'],[/audio|music|sound|sfx|voice/,'♪'],[/code|tech|dev|engine|tool|build|network|server|data|api/,'⚙'],[/todo|task|plan|roadmap|schedule|goal|idea|backlog|list/,'☑'],[/bug|issue|fix|test|qa|risk/,'⚠'],[/photo|image|mood|inspir|refer|screenshot|video/,'▣'],[/doc|note|research|wiki|rule|guide|brief|pitch|gdd/,'☰']],
PAL=['#ef6f6c','#8f84c2','#e8a96b','#5fb3a8','#6e9be0','#e58fb4','#8dbf7a','#d9b94f'];
const bd=(e,i)=>{const p=S.pg[i.ref]||{},n=p.n||'',l=n.toLowerCase(),m=IC.find(([r])=>r.test(l)),h=[...n].reduce((a,c)=>(a*31+c.charCodeAt(0))|0,7);
 i.w=128;i.h=130;e.style.width='128px';e.style.height='130px';e.dataset.g=m?m[1]+'\uFE0E':(n.trim()[0]||'▦').toUpperCase();e.style.setProperty('--bc',PAL[Math.abs(h)%8]);
 e.querySelector('.tx').textContent=p.del?'(deleted)':n;
 const ch=Object.values(S.it).filter(j=>j.p===i.ref&&!j.del&&j.ty!=='cn'),b=ch.filter(j=>j.ty==='bdc').length,c=ch.length-b;
 e.querySelector('small').textContent=[b&&b+(b>1?' boards':' board'),c&&c+(c>1?' cards':' card')].filter(Boolean).join(', ')||'Empty'};
const o2=paint;paint=function(e,i){o2(e,i);if(i.ty==='bdc')bd(e,i)};
const RN={cm:'Line',bdc:'Board',img:'Add image',fl:'Upload',pen:'Draw'},T=$('#tools');
T.querySelectorAll('button').forEach(b=>{const n=RN[b.dataset.a],g=b.querySelector('i');if(n&&g)b.innerHTML='<i>'+g.innerHTML+'</i><span class="tl">'+n+'</span>'});
T.insertAdjacentHTML('beforeend','<button data-a="more" title="More cards and shapes" aria-label="More tools"><i>'+MosaicIcons.tool('more')+'</i><span class="tl">More</span></button><button data-a="trash" title="Trash" aria-label="Trash"><i>'+MosaicIcons.tool('trash')+'</i><span class="tl">Trash</span></button>');TS.f+=' ';
T.addEventListener('click',e=>{const b=e.target.closest('[data-a=more],[data-a=trash]');if(!b)return;e.stopPropagation();b.dataset.a==='more'?T.classList.toggle('mo'):$('#trb').click()},true);
try{sync()}catch(x){}})();
