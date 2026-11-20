-- OPTIONAL: publish the AI assistant & MCP plugin to the Plugin store as an APPROVED plugin, owned by the owner account.
-- Run in the CENTRAL Supabase SQL Editor after plugin-store.sql. (Alternative: Settings > Plugins > Submit a plugin with the two files in
-- store-plugins/ai-assistant/, then approve it yourself in the Review queue.) Safe to run again.
-- sha256 of the code below: c974ab1325c1e6164d2bfcac50d3e5322e71a7a58fad65a35bc2004d26aeb76d
insert into public.mosaic_plugins(pid, version, name, description, author, owner, owner_name, manifest, code, sha256, status, review_note)
select 'ai-assistant', '1.0.0', 'AI assistant & MCP', 'Chat about your project with Ollama (on your computer), Claude, ChatGPT, Gemini, OpenRouter and more, and connect MCP tool servers. Nothing is sent until you press Send, and every change to your project asks first.', 'Mosaic', u.id, 'Mosaic',
  $mosaic_man${"id": "ai-assistant", "name": "AI assistant & MCP", "version": "1.0.0", "apiVersion": 1, "author": "Mosaic", "description": "Chat about your project with Ollama (on your computer), Claude, ChatGPT, Gemini, OpenRouter and more, and connect MCP tool servers. Nothing is sent until you press Send, and every change to your project asks first.", "permissions": ["project.read", "project.write", "ui.toolbar", "ui.settings", "ui.panel", "ui.commands", "network", "storage"], "hosts": ["http://127.0.0.1:*", "http://localhost:*", "https://api.anthropic.com", "https://api.openai.com", "https://generativelanguage.googleapis.com", "https://openrouter.ai", "https://api.groq.com", "https://api.mistral.ai", "https://api.deepseek.com", "https://api.x.ai"], "userHosts": true}$mosaic_man$::jsonb,
  $mosaic_code$/* Mosaic plugin: AI assistant & MCP.
   Chat about your project with Ollama (local), Claude, ChatGPT, Gemini, OpenRouter, Groq, Mistral, DeepSeek, xAI or any
   OpenAI-compatible server, and connect MCP tool servers (Streamable HTTP). Off until the user turns it on; nothing is sent
   until they press Send. Keys stay on this device (plugin storage), they are never synced to the account.
   Network access is limited by the "hosts" list in plugins/index.json and by the page's Content-Security-Policy. */
(()=>{let cleanup=()=>{};
Mosaic.plugin({
id:'ai-assistant',
activate(api){
'use strict';
const $=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isLocalUrl=u=>{try{const h=new URL(u).hostname;return h==='127.0.0.1'||h==='localhost'}catch(e){return false}};

/* ---------------- providers ---------------- */
const PROV={
 ollama:{label:'Ollama (on this computer)',kind:'openai',base:'http://127.0.0.1:11434',keyless:true,editBase:true},
 anthropic:{label:'Claude (Anthropic)',kind:'anthropic',base:'https://api.anthropic.com'},
 openai:{label:'ChatGPT (OpenAI)',kind:'openai',base:'https://api.openai.com/v1'},
 gemini:{label:'Gemini (Google)',kind:'openai',base:'https://generativelanguage.googleapis.com/v1beta/openai'},
 openrouter:{label:'OpenRouter',kind:'openai',base:'https://openrouter.ai/api/v1'},
 groq:{label:'Groq',kind:'openai',base:'https://api.groq.com/openai/v1'},
 mistral:{label:'Mistral',kind:'openai',base:'https://api.mistral.ai/v1'},
 deepseek:{label:'DeepSeek',kind:'openai',base:'https://api.deepseek.com/v1'},
 xai:{label:'xAI (Grok)',kind:'openai',base:'https://api.x.ai/v1'},
 custom:{label:'Other, OpenAI-compatible (LM Studio, llama.cpp…)',kind:'openai',base:'http://127.0.0.1:1234/v1',keyless:true,editBase:true}};
const DEF={provider:'ollama',p:{},system:'',temperature:0.7,maxSteps:6,read:'smart',write:false,keep:false,mcp:[]};
let cfg={...DEF,...api.storage.get('cfg',{})};if(!PROV[cfg.provider])cfg.provider='ollama';if(!Array.isArray(cfg.mcp))cfg.mcp=[];if(!cfg.p||typeof cfg.p!=='object')cfg.p={};
const save=()=>api.storage.set('cfg',cfg);
const pc=pid=>cfg.p[pid]||(cfg.p[pid]={});
const baseOf=pid=>String(pc(pid).base||PROV[pid].base).trim().replace(/\/+$/,'');
const chatUrl=pid=>pid==='ollama'?baseOf(pid)+'/v1/chat/completions':PROV[pid].kind==='anthropic'?baseOf(pid)+'/v1/messages':baseOf(pid)+'/chat/completions';
const hostOf=pid=>{try{return new URL(baseOf(pid)).host}catch(e){return baseOf(pid)}};
const localProv=pid=>isLocalUrl(baseOf(pid));
const headersFor=pid=>{const k=String(pc(pid).key||'').trim(),h={'Content-Type':'application/json'};
 if(PROV[pid].kind==='anthropic'){h['x-api-key']=k;h['anthropic-version']='2023-06-01';h['anthropic-dangerous-direct-browser-access']='true'}else if(k)h.Authorization='Bearer '+k;return h};
function explain(pid,e){const m=String(e&&e.message||e);
 if(e&&e.name==='AbortError')return'Stopped.';
 if(/^Not allowed/.test(m))return m+'. Any https server works once you approve it; plain http only works for this computer (127.0.0.1 or localhost).';
 if(/failed to fetch|fetch failed|networkerror|load failed|network request failed/i.test(m)){
  if(pid==='ollama')return'Could not reach Ollama at '+baseOf(pid)+'. Start it, and allow this address: set OLLAMA_ORIGINS='+location.origin+' (or *) and restart Ollama.';
  if(localProv(pid))return'Could not reach '+baseOf(pid)+'. Is the server running, and does it allow requests from '+location.origin+' (CORS)?';
  return'Could not reach '+hostOf(pid)+'. Check your connection, or whether the Content-Security-Policy allows this host.'}
 if(/\b(401|403)\b/.test(m))return'The provider rejected the request ('+m+'). Check the API key.';
 if(/\b404\b/.test(m)&&pid!=='ollama')return'Not found ('+m+'). Check the model name; “Load models” lists what your key can use.';
 return m}
async function net(url,init){if(!api.network.isAllowed(url)&&!(await api.network.request(url)))throw new Error('Not allowed: you did not approve '+(()=>{try{return new URL(url).origin}catch(e){return url}})());return api.fetch(url,init)}
async function http(pid,url,init){const r=await net(url,init);if(!r.ok){let t='';try{t=(await r.text()).slice(0,300)}catch(e){}let d=t;try{const j=JSON.parse(t);d=(j.error&&(j.error.message||j.error))||j.message||t}catch(e){}throw new Error(r.status+' '+(typeof d==='string'?d:JSON.stringify(d)))}return r}
async function listModels(pid){const P=PROV[pid];
 if(pid==='ollama'){const j=await(await http(pid,baseOf(pid)+'/api/tags',{headers:{}})).json();return(j.models||[]).map(m=>m.name).sort()}
 if(P.kind==='anthropic'){const j=await(await http(pid,baseOf(pid)+'/v1/models?limit=100',{headers:headersFor(pid)})).json();return(j.data||[]).map(m=>m.id)}
 const j=await(await http(pid,baseOf(pid)+'/models',{headers:headersFor(pid)})).json();return(j.data||j.models||[]).map(m=>String(m.id||m.name).replace(/^models\//,'')).sort()}

/* ---------------- streaming ---------------- */
async function* sse(res){const rd=res.body.getReader(),dec=new TextDecoder();let buf='';
 for(;;){const{done,value}=await rd.read();if(done)break;buf+=dec.decode(value,{stream:true});let i;
  while((i=buf.search(/\r?\n\r?\n/))>=0){const block=buf.slice(0,i);buf=buf.slice(i).replace(/^\r?\n\r?\n/,'');
   const data=block.split(/\r?\n/).filter(l=>l.startsWith('data:')).map(l=>l.slice(5).replace(/^ /,'')).join('\n');if(!data||data==='[DONE]')continue;try{yield JSON.parse(data)}catch(e){}}}
 const tail=buf.split(/\r?\n/).filter(l=>l.startsWith('data:')).map(l=>l.slice(5).trim()).join('');if(tail&&tail!=='[DONE]')try{yield JSON.parse(tail)}catch(e){}}
async function* ndjson(res){const rd=res.body.getReader(),dec=new TextDecoder();let buf='';for(;;){const{done,value}=await rd.read();if(done)break;buf+=dec.decode(value,{stream:true});let i;while((i=buf.indexOf('\n'))>=0){const l=buf.slice(0,i).trim();buf=buf.slice(i+1);if(l)try{yield JSON.parse(l)}catch(e){}}}}
const asArgs=a=>{if(a&&typeof a==='object')return a;try{return JSON.parse(a||'{}')}catch(e){return{_raw:String(a)}}};

const toOpenAI=(sys,msgs)=>{const o=[];if(sys)o.push({role:'system',content:sys});
 for(const m of msgs){if(m.role==='user')o.push({role:'user',content:m.content});
  else if(m.role==='assistant'){const x={role:'assistant',content:m.content||null};if(m.calls&&m.calls.length)x.tool_calls=m.calls.map(c=>({id:c.id,type:'function',function:{name:c.name,arguments:JSON.stringify(c.args||{})}}));o.push(x)}
  else if(m.role==='tool')o.push({role:'tool',tool_call_id:m.id,content:m.content})}return o};
const toAnthropic=msgs=>{const o=[];
 for(const m of msgs){if(m.role==='user')o.push({role:'user',content:m.content});
  else if(m.role==='assistant'){const b=[];if(m.content)b.push({type:'text',text:m.content});(m.calls||[]).forEach(c=>b.push({type:'tool_use',id:c.id,name:c.name,input:c.args||{}}));o.push({role:'assistant',content:b.length?b:[{type:'text',text:'…'}]})}
  else if(m.role==='tool'){const blk={type:'tool_result',tool_use_id:m.id,content:m.content},last=o[o.length-1];if(last&&last.role==='user'&&Array.isArray(last.content)&&last.content[0]&&last.content[0].type==='tool_result')last.content.push(blk);else o.push({role:'user',content:[blk]})}}return o};

/* one model turn. Returns {text,calls:[{id,name,args}]} and calls onText with each streamed piece */
async function turn(pid,sys,msgs,tools,onText,signal){const P=PROV[pid],model=String(pc(pid).model||'').trim();
 if(!model)throw new Error('Pick a model first (Settings → Plugins → AI assistant → Load models).');
 if(!P.keyless&&!String(pc(pid).key||'').trim())throw new Error('Add your '+P.label+' API key in Settings → Plugins (AI assistant).');
 let text='';const acc=[];const emit=s=>{if(s){text+=s;onText(s)}};
 if(P.kind==='anthropic'){
  const body={model,max_tokens:4096,stream:true,messages:toAnthropic(msgs),temperature:cfg.temperature};if(sys)body.system=sys;
  if(tools.length)body.tools=tools.map(t=>({name:t.name,description:t.description,input_schema:t.parameters}));
  const res=await http(pid,chatUrl(pid),{method:'POST',headers:headersFor(pid),body:JSON.stringify(body),signal});
  if(!res.body){const j=await res.json();for(const b of j.content||[]){if(b.type==='text')emit(b.text);else if(b.type==='tool_use')acc.push({id:b.id,name:b.name,args:b.input||{}})}return{text,calls:acc}}
  const blocks={};
  for await(const ev of sse(res)){
   if(ev.type==='content_block_start'){const b=ev.content_block||{};blocks[ev.index]=b.type==='tool_use'?{id:b.id,name:b.name,json:''}:null}
   else if(ev.type==='content_block_delta'){const d=ev.delta||{};if(d.type==='text_delta')emit(d.text);else if(d.type==='input_json_delta'&&blocks[ev.index])blocks[ev.index].json+=d.partial_json||''}
   else if(ev.type==='content_block_stop'){const b=blocks[ev.index];if(b){acc.push({id:b.id,name:b.name,args:asArgs(b.json||'{}')});blocks[ev.index]=null}}
   else if(ev.type==='error')throw new Error((ev.error&&ev.error.message)||'The provider reported an error')}
  return{text,calls:acc}}
 const body={model,stream:true,messages:toOpenAI(sys,msgs),temperature:cfg.temperature};
 if(tools.length)body.tools=tools.map(t=>({type:'function',function:{name:t.name,description:t.description,parameters:t.parameters}}));
 const res=await http(pid,chatUrl(pid),{method:'POST',headers:headersFor(pid),body:JSON.stringify(body),signal});
 const ct=res.headers.get('content-type')||'';
 if(!res.body||/application\/json/.test(ct)){const j=await res.json(),m=(j.choices&&j.choices[0]&&j.choices[0].message)||{};emit(m.content||'');(m.tool_calls||[]).forEach((c,i)=>acc.push({id:c.id||'call_'+i,name:c.function.name,args:asArgs(c.function.arguments)}));return{text,calls:acc}}
 const parts=[];
 for await(const ch of sse(res)){const d=ch.choices&&ch.choices[0];if(!d)continue;const dl=d.delta||d.message||{};
  if(typeof dl.content==='string')emit(dl.content);
  for(const tc of dl.tool_calls||[]){const i=tc.index==null?0:tc.index,x=parts[i]||(parts[i]={id:'',name:'',args:''});if(tc.id&&!x.id)x.id=tc.id;
   if(tc.function){if(tc.function.name&&!x.name)x.name=tc.function.name;const a=tc.function.arguments;if(a!=null)x.args+=typeof a==='string'?a:JSON.stringify(a)}}}
 parts.forEach((x,i)=>{if(x&&x.name)acc.push({id:x.id||'call_'+Date.now().toString(36)+i,name:x.name,args:asArgs(x.args||'{}')})});
 return{text,calls:acc}}

/* ---------------- MCP client (Streamable HTTP) ---------------- */
class Mcp{
 constructor(s){this.s=s;this.sid=null;this.n=0;this.tools=[];this.state='idle';this.err='';this.proto=''}
 async rpc(method,params,notify,retry){const id=notify?undefined:++this.n,h={'Content-Type':'application/json','Accept':'application/json, text/event-stream'};
  if(this.s.token)h.Authorization='Bearer '+this.s.token;if(this.sid)h['Mcp-Session-Id']=this.sid;if(this.proto)h['MCP-Protocol-Version']=this.proto;
  const body={jsonrpc:'2.0',method,...(params!==undefined?{params}:{}),...(id!==undefined?{id}:{})};
  const r=await net(this.s.url,{method:'POST',headers:h,body:JSON.stringify(body)});
  const sid=r.headers.get('Mcp-Session-Id');if(sid)this.sid=sid;
  if(r.status===404&&this.sid&&!retry&&method!=='initialize'){this.sid=null;this.proto='';await this.init();return this.rpc(method,params,notify,true)}
  if(!r.ok){let t='';try{t=(await r.text()).slice(0,200)}catch(e){}throw new Error('MCP server answered '+r.status+(t?': '+t:''))}
  if(notify||r.status===202)return null;
  const ct=r.headers.get('content-type')||'';let msg=null;
  if(/text\/event-stream/.test(ct)){for await(const ev of sse(r)){if(ev&&ev.id===id&&(ev.result!==undefined||ev.error)){msg=ev;break}}}
  else msg=await r.json();
  if(Array.isArray(msg))msg=msg.find(x=>x.id===id);
  if(!msg)throw new Error('The MCP server sent no answer.');
  if(msg.error)throw new Error(msg.error.message||'MCP error');return msg.result}
 async init(){const r=await this.rpc('initialize',{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'Mosaic',version:api.version}});this.proto=(r&&r.protocolVersion)||'2025-06-18';this.info=r&&r.serverInfo;await this.rpc('notifications/initialized',undefined,true)}
 async connect(){this.state='connecting';this.err='';try{this.sid=null;this.proto='';await this.init();const out=[];let cursor;
   for(let i=0;i<10;i++){const r=await this.rpc('tools/list',cursor?{cursor}:{});(r.tools||[]).forEach(t=>out.push(t));cursor=r.nextCursor;if(!cursor)break}
   this.tools=out;this.state='ready'}catch(e){this.state='error';this.err=explain('mcp',e)}return this.state==='ready'}
 async call(name,args){const r=await this.rpc('tools/call',{name,arguments:args||{}});
  const t=(r.content||[]).map(c=>c.type==='text'?c.text:c.type==='resource'&&c.resource&&c.resource.text?c.resource.text:'['+c.type+']').join('\n');if(r.isError)throw new Error(t||'The tool reported an error');return t||JSON.stringify(r.structuredContent||{})}}
const servers=new Map();
const srv=s=>{let m=servers.get(s.id);if(!m||m.s.url!==s.url||m.s.token!==s.token){m=new Mcp(s);servers.set(s.id,m)}m.s=s;return m};

/* ---------------- tools the model can use ---------------- */
const CAP=12000,cut=s=>{s=String(s);return s.length>CAP?s.slice(0,CAP)+'\n…(truncated)':s};
const norm=p=>p&&{id:p.id,name:p.name,type:p.type==='d'?'doc':p.type==='t'?'table':'board'};
const curPage=()=>norm(api.project.page());
const current=()=>{const p=curPage();if(!p)throw new Error('No page is open.');return p};
const resolvePage=ref=>{const L=api.project.pages();ref=String(ref||'').trim();if(!ref)return current();const l=ref.toLowerCase();
 const p=L.find(x=>x.id===ref)||L.find(x=>x.name.toLowerCase()===l)||L.find(x=>x.name.toLowerCase().includes(l));if(!p)throw new Error('No page matches “'+ref+'”. Use list_pages.');return p};
const O=(props,req)=>({type:'object',properties:props,required:req||[]});
const BUILTIN=[
 {name:'list_pages',desc:'List every page (boards, docs, tables) with its id, name and type.',params:O({}),risk:'read',run:()=>JSON.stringify(api.project.pages())},
 {name:'get_current_page',desc:'Return the page the user is looking at and the items they have selected.',params:O({}),risk:'read',run:()=>JSON.stringify({page:curPage(),selection:api.project.selection().map(i=>({id:i.id,type:i.ty,text:i.t}))})},
 {name:'read_page',desc:'Read the text content of a page. "page" is an id or a name (leave empty for the current page).',params:O({page:{type:'string'},max_chars:{type:'integer'}}),risk:'read',run:a=>{const p=resolvePage(a.page);return'Page “'+p.name+'” ('+p.type+', id '+p.id+'):\n'+api.project.pageText(p.id,Math.min(+a.max_chars||6000,CAP))}},
 {name:'search_project',desc:'Search all pages for a word or phrase. Returns matching lines with their page.',params:O({query:{type:'string'}},['query']),risk:'read',run:a=>JSON.stringify(api.project.search(a.query,30))},
 {name:'add_note',desc:'Add a sticky note to a board page (the current page unless "page" is given).',params:O({text:{type:'string'},page:{type:'string'},color:{type:'string',description:'hex colour such as #ffd966'}},['text']),risk:'write',
  run:a=>{const p=resolvePage(a.page);if(p.type!=='board')throw new Error('“'+p.name+'” is not a board.');let x=40+(Math.random()*400|0),y=40+(Math.random()*300|0);
   if(curPage()&&curPage().id===p.id){const it=api.project.items();if(it.length){x=Math.min(...it.map(i=>i.x));y=Math.max(...it.map(i=>i.y+i.h))+30}}
   const col=/^#[0-9a-f]{6}$/i.test(a.color||'')?a.color:'#ffd966';api.project.addItem({ty:'note',p:p.id,x,y,w:220,h:150,c:col,t:String(a.text).slice(0,2000)});return'Added a note to “'+p.name+'”.'}},
 {name:'append_to_doc',desc:'Append blocks to a doc page. Each block has type (p, h1, h2, h3, todo, q, code) and text.',params:O({page:{type:'string'},blocks:{type:'array',items:O({type:{type:'string'},text:{type:'string'}},['text'])}},['blocks']),risk:'write',
  run:a=>{const p=resolvePage(a.page);if(p.type!=='doc')throw new Error('“'+p.name+'” is not a doc.');const n=api.project.appendDoc(p.id,(a.blocks||[]).map(b=>({t:b.type,x:b.text})));return'Added '+n+' block(s) to “'+p.name+'”.'}},
 {name:'create_page',desc:'Create a new page. type is board, doc or table.',params:O({name:{type:'string'},type:{type:'string',enum:['board','doc','table']}},['name']),risk:'write',run:a=>{const id=api.project.addPage({name:a.name,type:a.type});return'Created page “'+a.name+'” (id '+id+').'}},
 {name:'update_item_text',desc:'Replace the text of an existing board item by its id (ids come from read_page).',params:O({id:{type:'string'},text:{type:'string'}},['id','text']),risk:'write',run:a=>{api.project.updateItem(a.id,{t:String(a.text).slice(0,2000)});return'Updated item '+a.id+'.'}}];
const nameMap=new Map();
function toolList(){nameMap.clear();const out=[];
 BUILTIN.forEach(t=>{nameMap.set(t.name,{kind:'builtin',t});out.push({name:t.name,description:t.desc,parameters:t.params})});
 cfg.mcp.filter(s=>s.on!==false).forEach(s=>{const m=servers.get(s.id);if(!m||m.state!=='ready')return;
  m.tools.forEach(t=>{let n=(s.id+'__'+t.name).replace(/[^\w-]/g,'_').slice(0,64);while(nameMap.has(n))n=n.slice(0,60)+Math.random().toString(36).slice(2,5);
   nameMap.set(n,{kind:'mcp',m,t,server:s.name});out.push({name:n,description:('['+s.name+'] '+(t.description||'')).slice(0,1000),parameters:t.inputSchema&&t.inputSchema.type?t.inputSchema:O({})})})});
 return out}

/* ---------------- conversation state ---------------- */
const S={msgs:[],busy:false,ctl:null,allow:new Set(),consented:new Set(),shown:[]};
const SYS0='You are the assistant built into Mosaic, a workspace of boards, docs and tables for game and product design. Be concise. When you need to know what is in the project, use the tools instead of guessing. Only change the project when the user asks you to; changes are approved by the user. Reply in the language the user writes in.';
const sysPrompt=()=>(cfg.system.trim()||SYS0)+(curPage()?'\nThe user currently has the page “'+curPage().name+'” ('+curPage().type+') open.':'');
const UI={log:null,input:null,send:null,status:null,sel:null,mod:null,dl:null};

/* approvals */
function approve(call,info){return new Promise(ok=>{
 const risk=info.kind==='builtin'?info.t.risk:(info.t.annotations&&info.t.annotations.readOnlyHint?'read':'write');
 const pid=cfg.provider,auto=risk==='read'?(cfg.read==='always'||(cfg.read==='smart'&&localProv(pid))):cfg.write;
 if(auto||S.allow.has(call.name))return ok(true);
 const box=$('div','xai-appr');box.append($('b','',(risk==='read'?'Allow reading? ':'Allow this change? ')+call.name.replace(/__/,' › ')));
 const pre=$('pre','',JSON.stringify(call.args,null,2).slice(0,800));box.append(pre);
 const row=$('div','xai-row'),go=(v,always)=>{if(always)S.allow.add(call.name);box.remove();ok(v)};
 const a=$('button','xai-btn pri','Allow'),b=$('button','xai-btn','Always allow “'+call.name.split('__').pop()+'” in this chat'),c=$('button','xai-btn','Deny');
 a.onclick=()=>go(true);b.onclick=()=>go(true,true);c.onclick=()=>go(false);row.append(a,b,c);box.append(row);UI.log.append(box);UI.log.scrollTop=UI.log.scrollHeight;a.focus()})}
async function execTool(call){const info=nameMap.get(call.name);if(!info)return'Unknown tool “'+call.name+'”.';
 if(!(await approve(call,info)))return'The user denied this action.';
 try{return cut(info.kind==='builtin'?await info.t.run(call.args||{}):await info.m.call(info.t.name,call.args))}catch(e){return'Error: '+e.message}}

/* ---------------- run ---------------- */
async function run(userText,attach){
 if(S.busy)return;const pid=cfg.provider,P=PROV[pid];
 if(!localProv(pid)&&!S.consented.has(pid)){
  if(!confirm('Your messages, and anything you attach or let the assistant read, will be sent to '+hostOf(pid)+'.\n\nMosaic does not control what that service does with it. Continue?'))return;S.consented.add(pid)}
 S.busy=true;S.ctl=new AbortController();setBusy(true);
 const full=(attach&&attach.length?attach.map(a=>'['+a.label+']\n```\n'+a.text+'\n```').join('\n\n')+'\n\n':'')+userText;
 S.msgs.push({role:'user',content:full});addBubble('user',userText,attach);
 try{
  for(const m of cfg.mcp.filter(s=>s.on!==false)){const x=srv(m);if(x.state==='idle')await x.connect()}
  for(let step=0;step<Math.max(1,cfg.maxSteps);step++){
   const tools=toolList(),live=addBubble('assistant','');let got=false;
   const out=await turn(pid,sysPrompt(),S.msgs,tools,s=>{got=true;live.raw+=s;live.paint()},S.ctl.signal);
   if(!out.text&&!out.calls.length)live.set('(no answer)');else live.set(out.text);
   S.msgs.push({role:'assistant',content:out.text,calls:out.calls});
   if(!out.calls.length)break;
   if(!out.text)live.el.remove();
   for(const c of out.calls){const t=addTool(c);const res=await execTool(c);t.done(res);S.msgs.push({role:'tool',id:c.id,name:c.name,content:res})}
   if(step===cfg.maxSteps-1)addBubble('note','Stopped after '+cfg.maxSteps+' tool steps. Send another message to continue.')}
 }catch(e){const m=explain(pid,e);if(e&&e.name!=='AbortError')addBubble('error',m);else addBubble('note','Stopped.');
  const last=S.msgs[S.msgs.length-1];if(last&&last.role==='user')S.msgs.pop()}
 finally{S.busy=false;S.ctl=null;setBusy(false);persist()}}
const stop=()=>{if(S.ctl)S.ctl.abort()};

/* ---------------- tiny markdown (everything is escaped first) ---------------- */
function md(src){let t=esc(src);const code=[];
 t=t.replace(/```(?:[\w-]*)\n?([\s\S]*?)```/g,(_,c)=>{code.push(c);return'\u0000'+(code.length-1)+'\u0000'});
 t=t.replace(/`([^`\n]+)`/g,'<code>$1</code>').replace(/\*\*([^*\n]+)\*\*/g,'<b>$1</b>').replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g,'$1 ($2)');
 t=t.replace(/^(#{1,3}) (.+)$/gm,(_,h,x)=>'<b>'+x+'</b>').replace(/^[-*] (.+)$/gm,'• $1');
 t=t.replace(/\n/g,'<br>').replace(/\u0000(\d+)\u0000/g,(_,i)=>'<pre>'+code[+i].replace(/\n$/,'')+'</pre>');return t}

/* ---------------- chat panel ---------------- */
const css=$('style');css.textContent=`
.xai{display:flex;flex-direction:column;height:100%;min-height:0}
.xai-top{display:flex;gap:6px;flex-wrap:wrap;padding:8px 10px;border-bottom:1px solid var(--bd);align-items:center}
.xai-top select,.xai-top input{min-width:0;flex:1 1 120px;border:1px solid var(--bd);background:var(--bg);color:var(--tx);border-radius:8px;padding:5px 8px;font:inherit;font-size:13px}
.xai-log{flex:1;min-height:0;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:10px}
.xai-b{max-width:94%;padding:8px 11px;border-radius:12px;line-height:1.45;word-break:break-word;font-size:14px}
.xai-b.user{align-self:flex-end;background:var(--ac);color:#fff}.xai-b.assistant{align-self:flex-start;background:var(--hv)}
.xai-b.error{align-self:stretch;background:#d9302018;border:1px solid #d9302055;color:var(--tx)}.xai-b.note{align-self:center;color:var(--mu);font-size:12px;padding:2px}
.xai-b pre{margin:6px 0;padding:8px;border-radius:8px;background:var(--bg);overflow:auto;font:12px/1.4 ui-monospace,monospace;white-space:pre-wrap}.xai-b code{background:var(--bg);border-radius:4px;padding:0 4px;font:12px ui-monospace,monospace}
.xai-act{display:flex;gap:4px;margin-top:6px;flex-wrap:wrap}.xai-act button,.xai-btn{font:inherit;font-size:12px;border:1px solid var(--bd);background:transparent;color:inherit;border-radius:8px;padding:3px 10px;cursor:pointer}
.xai-btn.pri{background:var(--ac);color:#fff;border-color:transparent}.xai-act button:hover,.xai-btn:hover{background:var(--hv)}.xai-btn.pri:hover{filter:brightness(1.1);background:var(--ac)}
.xai-chip{align-self:flex-end;font-size:11px;color:var(--mu);border:1px dashed var(--bd);border-radius:8px;padding:2px 8px}
.xai-tool{align-self:flex-start;font-size:12px;color:var(--mu);border:1px solid var(--bd);border-radius:10px;padding:4px 8px;max-width:94%}.xai-tool summary{cursor:pointer}.xai-tool pre{margin:6px 0 0;max-height:160px;overflow:auto;white-space:pre-wrap;font:11px/1.4 ui-monospace,monospace}
.xai-appr{align-self:stretch;border:1px solid var(--ac);border-radius:12px;padding:10px;background:var(--bg)}.xai-appr pre{margin:6px 0;max-height:140px;overflow:auto;white-space:pre-wrap;font:11px/1.4 ui-monospace,monospace}.xai-row{display:flex;gap:6px;flex-wrap:wrap}
.xai-foot{border-top:1px solid var(--bd);padding:8px 10px;display:flex;flex-direction:column;gap:6px}
.xai-foot textarea{width:100%;box-sizing:border-box;resize:none;min-height:54px;max-height:160px;border:1px solid var(--bd);background:var(--bg);color:var(--tx);border-radius:10px;padding:8px 10px;font:inherit;font-size:14px}
.xai-bar{display:flex;gap:6px;align-items:center}.xai-bar .grow{flex:1}.xai-st{font-size:11px;color:var(--mu)}
.xai-empty{margin:auto;text-align:center;color:var(--mu);max-width:300px;font-size:13px;line-height:1.5}
`;document.head.appendChild(css);cleanup=()=>{try{stop()}catch(e){}css.remove();servers.clear()};

function setBusy(b){if(!UI.send)return;UI.send.textContent=b?'Stop':'Send';UI.send.onclick=b?stop:submit;UI.input.disabled=false;status()}
function status(){if(!UI.status)return;const pid=cfg.provider,m=pc(pid).model||'no model chosen';
 UI.status.textContent=PROV[pid].label+' · '+m+' · '+(localProv(pid)?'stays on this computer':'sends to '+hostOf(pid))+(cfg.mcp.some(s=>s.on!==false)?' · MCP on':'')}
function placeholder(){if(UI.log&&!UI.log.children.length){const e=$('div','xai-empty');e.innerHTML='Ask about this project, summarise a doc, or turn notes into a plan.<br><br>Nothing is sent until you press Send. Use “Attach page” to include what you are looking at; the assistant can also read pages when you approve it.';UI.log.append(e)}}
function addBubble(role,text,attach){if(UI.log){const ph=UI.log.querySelector('.xai-empty');if(ph)ph.remove()}
 const el=$('div','xai-b '+role),o={el,raw:text||'',paint(){el.innerHTML=md(o.raw);UI.log.scrollTop=UI.log.scrollHeight},set(t){o.raw=t;o.paint();if(role==='assistant'&&t)actions()}};
 if(role==='user'||role==='error'||role==='note')el.textContent=text;else el.innerHTML=md(text);
 if(attach&&attach.length){const c=$('div','xai-chip','Attached: '+attach.map(a=>a.label).join(', '));UI.log.append(c)}
 UI.log.append(el);UI.log.scrollTop=UI.log.scrollHeight;
 function actions(){if(el.querySelector('.xai-act'))return;const row=$('div','xai-act'),cp=$('button','','Copy');cp.onclick=async()=>{try{await navigator.clipboard.writeText(o.raw);cp.textContent='Copied'}catch(e){cp.textContent='Press Ctrl+C'}};row.append(cp);
  const pg=curPage();
  if(pg&&pg.type==='board'){const b=$('button','','Add as note');b.onclick=()=>{try{BUILTIN.find(t=>t.name==='add_note').run({text:o.raw});b.textContent='Added'}catch(e){b.textContent=e.message}};row.append(b)}
  if(pg&&pg.type==='doc'){const b=$('button','','Add to doc');b.onclick=()=>{try{api.project.appendDoc(pg.id,o.raw.split(/\n{2,}/).map(x=>({t:'p',x:x.trim()})).filter(x=>x.x));b.textContent='Added'}catch(e){b.textContent=e.message}};row.append(b)}
  el.append(row)}
 return o}
function addTool(c){const d=$('details','xai-tool'),s=$('summary','','Using '+c.name.replace(/__/,' › ')+'…');const pre=$('pre','',JSON.stringify(c.args,null,2).slice(0,600));d.append(s,pre);
 UI.log.append(d);UI.log.scrollTop=UI.log.scrollHeight;return{done(res){s.textContent='Used '+c.name.replace(/__/,' › ');pre.textContent=JSON.stringify(c.args,null,2).slice(0,600)+'\n\n→ '+String(res).slice(0,1200)}}}
function persist(){if(!cfg.keep)return;try{const key='chat:'+(typeof room==='string'?room:'x');api.storage.set(key,S.msgs.filter(m=>m.role!=='tool'&&!(m.calls&&m.calls.length)).slice(-30).map(m=>({role:m.role,content:String(m.content).slice(0,6000)})))}catch(e){}}
function restore(){if(!cfg.keep)return;try{const key='chat:'+(typeof room==='string'?room:'x'),a=api.storage.get(key,[]);a.forEach(m=>{S.msgs.push(m);addBubble(m.role==='user'?'user':'assistant',m.content)})}catch(e){}}
function clearChat(){stop();S.msgs=[];S.allow.clear();if(UI.log){UI.log.innerHTML='';placeholder()}if(cfg.keep)try{api.storage.remove('chat:'+(typeof room==='string'?room:'x'))}catch(e){}}

let attached=[];
function attachPage(){try{const p=current(),t=api.project.pageText(p.id,8000);attached.push({label:'page “'+p.name+'”',text:t});chips()}catch(e){Mosaic.toast(e.message)}}
function attachSel(){try{const s=api.project.selection();if(!s.length){Mosaic.toast('Select something on the board first.');return}attached.push({label:s.length+' selected item'+(s.length>1?'s':''),text:s.map(i=>'['+i.ty+'] '+(i.t||'')).join('\n')});chips()}catch(e){Mosaic.toast(e.message)}}
function chips(){if(!UI.st2)return;UI.st2.innerHTML='';attached.forEach((a,i)=>{const b=$('button','xai-btn','✕ '+a.label);b.title='Remove';b.onclick=()=>{attached.splice(i,1);chips()};UI.st2.append(b)})}
function submit(){const t=UI.input.value.trim();if(!t||S.busy)return;UI.input.value='';const at=attached;attached=[];chips();run(t,at)}

function render(el){
 el.classList.add('xai');
 const top=$('div','xai-top'),prov=$('select');prov.setAttribute('aria-label','Provider');Object.keys(PROV).forEach(k=>{const o=$('option','',PROV[k].label);o.value=k;prov.append(o)});prov.value=cfg.provider;
 const mod=$('input');mod.setAttribute('list','xai-models');mod.placeholder='model';mod.setAttribute('aria-label','Model');mod.value=pc(cfg.provider).model||'';const dl=$('datalist');dl.id='xai-models';
 const load=$('button','xai-btn','Load models'),gear=$('button','xai-btn','Settings'),neu=$('button','xai-btn','New chat');
 top.append(prov,mod,dl,load,gear,neu);
 const log=$('div','xai-log');log.setAttribute('role','log');log.setAttribute('aria-live','polite');
 const foot=$('div','xai-foot'),st2=$('div','xai-act'),ta=$('textarea');ta.placeholder='Ask something…  (Enter sends, Shift+Enter adds a line)';ta.setAttribute('aria-label','Message');
 const bar=$('div','xai-bar'),ap=$('button','xai-btn','Attach page'),as=$('button','xai-btn','Attach selection'),send=$('button','xai-btn pri','Send'),sp=$('span','grow'),stt=$('div','xai-st');
 bar.append(ap,as,sp,send);foot.append(st2,ta,bar,stt);el.append(top,log,foot);
 Object.assign(UI,{log,input:ta,send,status:stt,mod,dl,st2});
 prov.onchange=()=>{cfg.provider=prov.value;save();mod.value=pc(cfg.provider).model||'';dl.innerHTML='';status()};
 mod.onchange=()=>{pc(cfg.provider).model=mod.value.trim();save();status()};
 load.onclick=async()=>{load.disabled=true;try{const L=await listModels(cfg.provider);dl.innerHTML='';L.forEach(m=>{const o=$('option');o.value=m;dl.append(o)});if(!mod.value&&L[0]){mod.value=L[0];mod.onchange()}Mosaic.toast(L.length+' model'+(L.length===1?'':'s')+' found. Click the model box to choose.')}catch(e){addBubble('error',explain(cfg.provider,e))}load.disabled=false};
 gear.onclick=()=>window.MosaicSettings&&MosaicSettings.open('plugins');neu.onclick=clearChat;ap.onclick=attachPage;as.onclick=attachSel;send.onclick=submit;
 ta.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();submit()}};
 placeholder();restore();status()}
const panel=api.ui.panel({id:'chat',title:'AI assistant',render,onOpen:()=>{if(UI.input)UI.input.focus();for(const m of cfg.mcp.filter(s=>s.on!==false)){const x=srv(m);if(x.state==='idle')x.connect()}}});
api.toolbar.add({label:'AI',title:'AI assistant (chat about this project)',where:'any',run:()=>panel.toggle()});
api.commands.add({id:'open',title:'AI assistant: open chat',run:()=>panel.open()});
api.commands.add({id:'sel',title:'AI assistant: ask about the selection',run:()=>{panel.open();attachSel();UI.input&&UI.input.focus()}});
api.commands.add({id:'new',title:'AI assistant: new chat',run:()=>{panel.open();clearChat()}});

/* ---------------- settings (shown under Settings → Plugins) ---------------- */
const field=(label,input)=>{const l=$('label');l.append($('span','',label),input);return l};
const inp=(type,val,ph)=>{const i=$('input');i.type=type;i.value=val||'';if(ph)i.placeholder=ph;i.autocomplete='off';i.spellcheck=false;return i};
api.settings.add({title:'Provider and model',render(el){
 const msg=$('p','msg');msg.setAttribute('role','status');
 const prov=$('select');Object.keys(PROV).forEach(k=>{const o=$('option','',PROV[k].label);o.value=k;prov.append(o)});prov.value=cfg.provider;
 const box=$('div','xai-set');
 const draw=()=>{box.innerHTML='';const pid=cfg.provider,P=PROV[pid],c=pc(pid);
  if(P.editBase){const b=inp('text',c.base||'',P.base);b.onchange=()=>{c.base=b.value.trim();save();status()};box.append(field('Server address',b))}
  if(!P.keyless||pid==='custom'){const k=inp('password',c.key||'',P.keyless?'optional':'paste your API key');k.onchange=()=>{c.key=k.value.trim();save()};box.append(field(P.keyless?'API key (optional)':'API key (stored on this device only)',k))}
  const m=inp('text',c.model||'','click “Load models”');m.setAttribute('list','xai-set-models');const dl=$('datalist');dl.id='xai-set-models';m.onchange=()=>{c.model=m.value.trim();save();status()};box.append(field('Model',m),dl);
  const row=$('div','row'),ld=$('button','','Load models'),ts=$('button','pri','Test connection');
  ld.type=ts.type='button';ld.onclick=async()=>{msg.textContent='Loading…';try{const L=await listModels(pid);dl.innerHTML='';L.forEach(x=>{const o=$('option');o.value=x;dl.append(o)});if(!m.value&&L[0]){m.value=L[0];m.onchange()}msg.textContent=L.length+' model(s) available. Click the Model box to pick one.'}catch(e){msg.textContent=explain(pid,e)}};
  ts.onclick=async()=>{msg.textContent='Testing…';try{await listModels(pid);msg.textContent='Connected to '+hostOf(pid)+'.'}catch(e){msg.textContent=explain(pid,e)}};row.append(ld,ts);box.append(row);
  const n=$('p','msg');n.textContent=pid==='ollama'?'Ollama runs models on your own computer, so nothing leaves it. If the test fails, set OLLAMA_ORIGINS='+location.origin+' and restart Ollama.':localProv(pid)?'This server is on your computer, so nothing leaves it.':'Your messages are sent to '+hostOf(pid)+' only when you press Send. The key is kept in this browser or app and is never synced to your account.';box.append(n)};
 prov.onchange=()=>{cfg.provider=prov.value;save();draw();status()};el.append(field('Provider',prov),box,msg);draw()}});

api.settings.add({title:'Behaviour and safety',render(el){
 const sys=$('textarea');sys.rows=3;sys.value=cfg.system;sys.placeholder=SYS0;sys.onchange=()=>{cfg.system=sys.value;save()};
 const temp=inp('number',cfg.temperature);temp.min=0;temp.max=2;temp.step=0.1;temp.onchange=()=>{cfg.temperature=Math.min(2,Math.max(0,+temp.value||0));save()};
 const steps=inp('number',cfg.maxSteps);steps.min=1;steps.max=15;steps.onchange=()=>{cfg.maxSteps=Math.min(15,Math.max(1,Math.round(+steps.value)||6));save()};
 const rd=$('select');[['smart','Ask me, except for local models (default)'],['ask','Always ask before it reads'],['always','Let it read without asking']].forEach(([v,t])=>{const o=$('option','',t);o.value=v;rd.append(o)});rd.value=cfg.read;rd.onchange=()=>{cfg.read=rd.value;save()};
 const ck=(label,key)=>{const l=$('label','ck'),i=$('input');i.type='checkbox';i.checked=!!cfg[key];i.onchange=()=>{cfg[key]=i.checked;save()};l.append(i,$('span','',label));return l};
 el.append(field('Instructions for the assistant (optional)',sys),field('Creativity (0 precise, 2 loose)',temp),field('Most tool steps per message',steps),field('When the assistant wants to read your project',rd),
  ck('Approve changes automatically (not recommended: it can edit your project without asking)','write'),ck('Remember chats on this device','keep'),
  Object.assign($('p','msg'),{textContent:'Changes to your project (new notes, doc text, pages) always show an Allow / Deny card unless you turn that off. Reading is controlled above.'}))}});

api.settings.add({title:'Servers you approved',render(el){
 const box=$('div');const draw=()=>{box.innerHTML='';const a=api.network.approved();
  if(!a.length){box.append(Object.assign($('p','msg'),{textContent:'None yet. The first time you use an https server that is not on the built-in list (a custom provider, a remote Ollama, an MCP server), Mosaic asks before it sends anything there.'}));return}
  a.forEach(o=>{const row=$('div','row'),b=$('button','xdg','Revoke');b.type='button';b.onclick=()=>{api.network.revoke(o);draw()};row.append(Object.assign($('span','grow'),{textContent:o}),b);box.append(row)})};
 el.append(box);draw()}});

api.settings.add({title:'MCP servers',render(el){
 const list=$('div'),msg=$('p','msg');msg.setAttribute('role','status');
 const draw=()=>{list.innerHTML='';if(!cfg.mcp.length)list.append(Object.assign($('p','msg'),{textContent:'No MCP servers yet.'}));
  cfg.mcp.forEach(s=>{const m=srv(s),row=$('div','cd'),h=$('div','row');
   h.append($('b','',s.name),Object.assign($('small','msg'),{textContent:s.url}),Object.assign($('span','bdg '+(m.state==='ready'?'ok':m.state==='error'?'err':'')),{textContent:m.state==='ready'?m.tools.length+' tools':m.state}),$('span','grow'));
   const on=$('button','',s.on===false?'Turn on':'Turn off'),cn=$('button','','Connect'),rm=$('button','xdg','Remove');on.type=cn.type=rm.type='button';
   on.onclick=()=>{s.on=s.on===false;save();draw();status()};cn.onclick=async()=>{msg.textContent='Connecting to '+s.name+'…';await srv(s).connect();msg.textContent=srv(s).state==='ready'?'Connected: '+srv(s).tools.length+' tools.':srv(s).err;draw()};
   rm.onclick=()=>{cfg.mcp=cfg.mcp.filter(x=>x!==s);servers.delete(s.id);save();draw();status()};h.append(on,cn,rm);row.append(h);
   if(m.state==='error')row.append(Object.assign($('span','msg'),{textContent:m.err,style:'color:#d23'}));
   if(m.tools.length){const r=$('div','row');m.tools.slice(0,30).forEach(t=>r.append(Object.assign($('span','chip'),{textContent:t.name,title:t.description||''})));row.append(r)}list.append(row)})};
 const f=$('form','cd'),nm=inp('text','','Name, e.g. Filesystem'),url=inp('url','','http://127.0.0.1:8080/mcp'),tok=inp('password','','Access token (optional)'),add=$('button','pri','Add and connect');add.type='submit';
 f.append(field('Name',nm),field('Server address (Streamable HTTP)',url),field('Access token',tok),add);
 f.onsubmit=async e=>{e.preventDefault();let u;try{u=new URL(url.value.trim())}catch(x){msg.textContent='That is not a web address.';return}
  if(!/^https?:$/.test(u.protocol)){msg.textContent='Use an http or https address.';return}
  const s={id:'m'+Date.now().toString(36),name:(nm.value.trim()||u.hostname).slice(0,30),url:u.href,token:tok.value.trim(),on:true};
  if(!api.network.isAllowed(u.href)&&!(await api.network.request(u.href))){msg.textContent=u.protocol==='https:'?'Not added: you did not approve '+u.origin+'.':'Plain http only works for this computer (127.0.0.1 or localhost). Use an https address for other servers.';return}
  cfg.mcp.push(s);save();msg.textContent='Connecting…';await srv(s).connect();msg.textContent=srv(s).state==='ready'?'Connected: '+srv(s).tools.length+' tools.':srv(s).err;nm.value=url.value=tok.value='';draw();status()};
 el.append(Object.assign($('p','msg'),{textContent:'MCP servers give the assistant extra tools (files, databases, web…). Mosaic connects over HTTP(S): servers on this computer need no approval, any other https server asks you once. stdio-only servers need an HTTP bridge. The server must allow requests from '+location.origin+' (CORS) and expose the Mcp-Session-Id header. Every MCP tool call asks for your approval unless the server marks it read-only and you allow reading.'}),list,f,msg);draw()}});

if(window.__MOSAIC_AI_TEST)window.__MOSAIC_AI_TEST={turn,Mcp,PROV,cfg:()=>cfg,setCfg:c=>{cfg=c},toolList,execTool,run,S,BUILTIN,md,listModels,UI,explain,srv};
},
deactivate(){cleanup()}
});})();$mosaic_code$,
  'c974ab1325c1e6164d2bfcac50d3e5322e71a7a58fad65a35bc2004d26aeb76d', 'approved', 'Published by the Mosaic owner.'
from auth.users u where lower(u.email) = 'egertonzac@gmail.com'
on conflict (pid, version) do nothing;
