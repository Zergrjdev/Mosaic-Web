/* Shared script for the public pages: theme, accent colour, header state, legacy-link redirect. */
(()=>{
// Old share links and email-confirmation links pointed at the site root. Send them to the workspace.
if(/(^#|&)(r|k|room|sb)=|access_token=|error_description=|type=recovery/.test(location.hash)&&!/app\.html$/.test(location.pathname)){location.replace('app.html'+location.search+location.hash);return}
const prefs=()=>{try{return JSON.parse(localStorage['mosaic:prefs']||'{}')||{}}catch(e){return{}}};
const DEFAULT_ACCENT='#b85c5c',root=document.documentElement;
function theme(){let t=prefs().theme||localStorage.mosaicTheme||'dark';if(t==='system')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';root.dataset.t=t==='light'?'light':'dark'}
function accent(){let a=String(prefs().accent||DEFAULT_ACCENT);if(!/^#[0-9a-f]{6}$/i.test(a))a=DEFAULT_ACCENT;
 const n=parseInt(a.slice(1),16),r=n>>16,g=(n>>8)&255,b=n&255,lum=(0.299*r+0.587*g+0.114*b)/255;
 root.style.setProperty('--ac',a);root.style.setProperty('--ac-soft','rgba('+r+','+g+','+b+',.16)');root.style.setProperty('--ac-ink',lum>0.62?'#151515':'#ffffff')}
theme();accent();
addEventListener('storage',()=>{theme();accent()});
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
window.MosaicSite={esc,BAKED:{url:'https://skzlgskhgxcpyhnclrwx.supabase.co',key:'sb_publishable_G_jDrnbdkUQSS6MiTn-GrQ_zlWxzfcF'}};
function who(){try{const s=JSON.parse(localStorage['mosaic-acct']||'null'),u=s&&(s.user||(s.currentSession&&s.currentSession.user));return u?((u.user_metadata&&u.user_metadata.name)||u.email||'you'):null}catch(e){return null}}
document.addEventListener('DOMContentLoaded',()=>{
 const $=s=>document.querySelector(s),w=who();
 if(w){$('#sli').hidden=$('#ssu').hidden=true;$('#swk').hidden=false;$('#swk').title='Signed in as '+w}
 $('#sth').onclick=()=>{const t=root.dataset.t==='dark'?'light':'dark';root.dataset.t=t;try{localStorage.mosaicTheme=t;const p=prefs();if(p.theme!==undefined){p.theme=t;localStorage['mosaic:prefs']=JSON.stringify(p)}}catch(e){}};
 $('#sham').onclick=()=>{const h=$('.sh'),o=h.classList.toggle('open');$('#sham').setAttribute('aria-expanded',String(o))};
 const y=$('#yr');if(y)y.textContent=new Date().getFullYear()});
})();
