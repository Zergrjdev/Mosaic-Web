/* Desktop/mobile app bridge. Inside the Mosaic app (which serves this site from 127.0.0.1) downloads
   are handed to the app so it can show a native "Save as" dialog, and the app reports its plugins folder.
   On the normal website this does nothing. */
(()=>{const H={'X-Mosaic':'1'};
 const probe=fetch('__app',{headers:H}).then(r=>r.ok?r.json():null).then(j=>{if(j&&j.app){window.MOSAIC_APP=j;return true}return false}).catch(()=>false);
 window.MosaicAppReady=probe;
 window.claude={use:async n=>n==='downloads'&&await probe?{save:async({filename,data})=>{
  const r=await fetch('__save?name='+encodeURIComponent(filename),{method:'POST',headers:H,body:data});
  if(!r.ok)throw new Error('cancelled')}}:null}})();
