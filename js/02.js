(()=>{
const sha=s=>{const u=new TextEncoder().encode(s),l=u.length,n=l+9+63&~63,B=new Uint8Array(n),V=new DataView(B.buffer),K=[],H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19],W=new Int32Array(64),R=(x,k)=>x>>>k|x<<32-k;
 B.set(u);B[l]=128;V.setUint32(n-4,l*8);
 for(let p=2,c=0;c<64;p++){let q=1;for(let d=2;d*d<=p;d++)if(p%d==0){q=0;break}if(q)K[c++]=Math.floor(Math.cbrt(p)%1*4294967296)}
 for(let o=0;o<n;o+=64){for(let i=0;i<16;i++)W[i]=V.getUint32(o+i*4);
  for(let i=16;i<64;i++){const x=W[i-15],y=W[i-2];W[i]=W[i-16]+(R(x,7)^R(x,18)^x>>>3)+W[i-7]+(R(y,17)^R(y,19)^y>>>10)|0}
  let[a,b,c,d,e,f,g,h]=H;
  for(let i=0;i<64;i++){const t=h+(R(e,6)^R(e,11)^R(e,25))+(e&f^~e&g)+K[i]+W[i]|0,v=(R(a,2)^R(a,13)^R(a,22))+(a&b^a&c^b&c)|0;h=g;g=f;f=e;e=d+t|0;d=c;c=b;b=a;a=t+v|0}
  [a,b,c,d,e,f,g,h].forEach((x,i)=>H[i]=H[i]+x|0)}
 return H.map(x=>(x>>>0).toString(16).padStart(8,'0')).join('')};
const P=new URLSearchParams(location.hash.slice(1)),k=P.get('k'),r=P.get('r'),lg=P.get('room'),ok=/^[\w-]{8,64}$/,
Z=window.MZ={sha,key:()=>[...crypto.getRandomValues(new Uint8Array(16))].map(x=>x.toString(16).padStart(2,'0')).join(''),k:'',rid:'',role:'',legacy:0,home:0,cfg:'',n:P.get('n')||'',o:P.get('o')||'',pub:P.get('pub')==='1',dv:P.get('dv')==='1',auth:/access_token=|error_description=/.test(location.hash)?location.hash:''};
if(k&&ok.test(k)){Z.k=k;Z.rid=sha(k).slice(0,32);Z.role='e'}
else if(r&&ok.test(r)){Z.rid=r;Z.role='r'}
else if(lg&&lg!=='home'){Z.rid=lg;Z.role=P.get('ro')==='1'?'r':'e';Z.legacy=1}
else Z.home=1;
const N=new URLSearchParams();N.set('room',Z.home?'home':Z.rid);if(Z.home||Z.role==='r')N.set('ro','1');
try{localStorage.removeItem('mosaicCloud')}catch(e){}
Z.local=0;if(!Z.home){try{Z.local=localStorage['mosaic-local:'+Z.rid]==='1'?1:0}catch(e){}}
const rx=/^https:\/\/[a-z0-9-]+\.supabase\.co$/;let C=null;
if(!Z.home&&!Z.local){const ck='mosaic:cfg:'+Z.rid;if(P.get('sb')&&P.get('key')&&rx.test(P.get('sb'))){C={u:P.get('sb'),k:P.get('key')};try{localStorage[ck]=JSON.stringify(C)}catch(e){}}else try{C=JSON.parse(localStorage[ck]||'null')}catch(e){}}
if(C&&rx.test(C.u)){if(P.get('sec')==='1')C.sec=1;try{localStorage['mosaic:cfg:'+Z.rid]=JSON.stringify(C)}catch(e){}N.set('sb',C.u);N.set('key',C.k);Z.c=C;Z.sec=!!C.sec}
history.replaceState(null,'','#'+N)})();