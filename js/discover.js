/* Loads public projects from the Mosaic account database and renders them as cards. */
(()=>{
const S=window.MosaicSite,esc=S.esc,B=S.BAKED,box=document.querySelector('[data-discover]');if(!box)return;
const limit=+box.dataset.discover||60,searchable=box.hasAttribute('data-search');let all=[];
const RID=/^[\w-]{8,64}$/,SBR=/^https:\/\/[a-z0-9-]+\.supabase\.co$/;
const link=p=>'app.html#r='+encodeURIComponent(p.rid)+'&sb='+encodeURIComponent(p.sb_url)+'&key='+encodeURIComponent(p.sb_key)+(p.sec?'&sec=1':'')+'&n='+encodeURIComponent(p.title)+'&o='+encodeURIComponent(p.owner_name||'')+'&pub=1';
const ago=d=>{const s=(Date.now()-new Date(d))/1000;if(!(s>=0))return'';const m=[[31536000,'year'],[2592000,'month'],[86400,'day'],[3600,'hour'],[60,'minute']];for(const[n,u]of m)if(s>=n){const v=Math.floor(s/n);return v+' '+u+(v>1?'s':'')+' ago'}return'just now'};
function draw(list){
 box.innerHTML=list.length?list.map(p=>'<a class="card pc" href="'+esc(link(p))+'"><div class="th" aria-hidden="true">'+window.MosaicIcons.svg('layout-grid')+'</div><h3>'+esc(p.title)+'</h3><p>'+esc(p.description||'No description')+'</p><div class="by"><span>by '+esc(p.owner_name||'someone')+'</span><span>'+esc(ago(p.created_at))+'</span></div></a>').join('')
  :'<div class="empty" style="grid-column:1/-1">'+(all.length?'No projects match your search.':'Nothing here yet. Be the first: open a project in your workspace and choose “Make public”.')+'</div>'}
async function load(){
 box.innerHTML='<div class="empty" style="grid-column:1/-1">Loading…</div>';
 try{const r=await fetch(B.url+'/rest/v1/mosaic_public?select=rid,title,description,owner_name,sb_url,sb_key,sec,created_at&order=created_at.desc&limit='+limit,{headers:{apikey:B.key}});
  if(!r.ok)throw new Error(r.status);all=(await r.json()).filter(p=>RID.test(p.rid||'')&&SBR.test(p.sb_url||'')&&p.sb_key&&p.title);draw(all)}
 catch(e){box.innerHTML='<div class="empty" style="grid-column:1/-1">Public projects can’t be loaded right now. Please try again in a moment.</div>'}}
const q=document.querySelector('#dq');if(q&&searchable)q.addEventListener('input',()=>{const t=q.value.trim().toLowerCase();draw(!t?all:all.filter(p=>(p.title+' '+(p.description||'')+' '+(p.owner_name||'')).toLowerCase().includes(t)))});
load()})();
