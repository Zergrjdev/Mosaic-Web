/* "On this page" navigation for the docs: a sticky list on wide screens, a folded list on small ones, with scroll tracking. */
(() => {
const wrap = document.querySelector('main .wrap'); if (!wrap) return;
const hs = [...wrap.querySelectorAll('h2')]; if (hs.length < 3) return;
hs.forEach(h => { if (!h.id) h.id = h.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') });
const list = hs.map(h => '<li><a href="#' + h.id + '">' + h.textContent.replace(/[<>&]/g, '') + '</a></li>').join('');
const side = document.createElement('nav'); side.className = 'doc-toc'; side.setAttribute('aria-label', 'On this page'); side.innerHTML = '<b>On this page</b><ul>' + list + '</ul>';
const fold = document.createElement('details'); fold.className = 'doc-toc-m'; fold.innerHTML = '<summary>On this page</summary><ul>' + list + '</ul>';
document.body.appendChild(side); const h1 = wrap.querySelector('h1'); (h1 ? h1.parentNode : wrap).insertBefore(fold, h1 ? h1.nextSibling : wrap.firstChild);
const links = [...side.querySelectorAll('a')], map = new Map(hs.map((h, i) => [h, links[i]]));
const io = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) { links.forEach(l => l.classList.remove('on')); map.get(e.target).classList.add('on') } }) }, { rootMargin: '-80px 0px -70% 0px' });
hs.forEach(h => io.observe(h));
fold.addEventListener('click', e => { if (e.target.closest('a')) fold.open = false });
})();
