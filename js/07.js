
document.querySelectorAll('#tools button').forEach(b=>{const i=b.querySelector('i');if(!b.title)b.title=b.textContent.replace(i?i.textContent:'','').trim()});
