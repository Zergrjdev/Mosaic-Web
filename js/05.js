
(()=>{const g=N;
TP['Game design document']={i:[g('text',0,0,520,44,'Game title: design document',''),...['Pitch','Core loop','Mechanics','World and story','Art direction','Audio','Business','Roadmap'].flatMap((n,k)=>{const x=k%4*290,y=70+(k>>2)*340;return[g('col',x,y,260,320,n,COL[k%6]),g('note',x+16,y+50,228,100,'Write here',COL[0])]})]};
TP['Novel outline']={i:[g('text',0,0,520,44,'Novel title: outline',''),...['Act 1: Setup','Act 2: Confrontation','Act 3: Resolution'].flatMap((n,k)=>[g('col',k*290,70,260,420,n,COL[k+2]),g('note',k*290+16,130,228,90,'Key scene',COL[0]),g('note',k*290+16,236,228,90,'Key scene',COL[4])]),g('note',0,520,400,120,'Characters',COL[2]),g('note',430,520,400,120,'Themes and setting',COL[5])]};
$('#tp').innerHTML='<b>Start from a template</b>'+Object.keys(TP).map(k=>`<button data-t="${esc(k)}">${esc(k)}</button>`).join('');
const E=document.createElement('div');E.id='emp';E.className='fl';E.hidden=true;E.innerHTML='<b>This board is empty</b><span>Double-click to add a note, drag in images or links, or start from a template.</span><button class="pri">Start from a template</button>';$('#stage').appendChild(E);
E.querySelector('button').onclick=()=>{$('#tp').hidden=false};
setInterval(()=>{let ok=false;try{ok=!RO&&!cv.hidden&&S.pg[cur].t==='b'&&!!$('#tools [data-a="bdc"]:not([hidden])')&&!Object.values(S.it).some(i=>i.p===cur&&!i.del&&i.ty!=='cn')}catch(e){}E.hidden=!ok},400);
const K=document.createElement('div');K.id='kb';K.className='fl';K.hidden=true;K.innerHTML='<b>Keyboard shortcuts</b>'+[['V','Select'],['N','Note'],['T','Text'],['R','Rectangle'],['O','Oval'],['D','Diamond'],['F','Frame'],['A or L','Arrow'],['P','Pen'],['E','Eraser'],['Space + drag','Pan'],['Middle mouse + drag','Pan'],['Ctrl K','Search'],['?','Show or hide this list']].map(([a,b])=>`<div><span>${b}</span><kbd>${a}</kbd></div>`).join('');$('#stage').appendChild(K);
addEventListener('keydown',e=>{if(e.key==='Escape')K.hidden=true;else if(e.key==='?'&&!e.ctrlKey&&!e.metaKey&&!e.target.isContentEditable&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))K.hidden=!K.hidden});
})();
