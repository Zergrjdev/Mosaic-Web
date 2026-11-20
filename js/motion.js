/* Scroll reveal, sticky-header shadow and copy buttons for the public site. */
(() => {
const calm = matchMedia('(prefers-reduced-motion:reduce)').matches;
const sh = document.querySelector('.sh');
if (sh) { const f = () => sh.classList.toggle('scrolled', scrollY > 8); addEventListener('scroll', f, { passive: true }); f() }
if (!calm && 'IntersectionObserver' in window) {
  const els = [...document.querySelectorAll('.s .wrap > *, .page .wrap > .card, .grid > *, .cta-band, .trust, .tabs-mock, footer .wrap')].filter(e => !e.closest('.hero') && !e.closest('.sh') && !e.classList.contains('doc-toc-m'));
  const seen = new Set(), io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), { rootMargin: '0px 0px -8% 0px', threshold: .05 });
  els.forEach(e => { if (e.parentNode && e.parentNode.classList.contains('grid')) { const i = [...e.parentNode.children].indexOf(e); e.style.setProperty('--d', Math.min(i, 6) * 70 + 'ms') } e.classList.add('rv'); io.observe(e) });
  setTimeout(() => document.querySelectorAll('.rv:not(.in)').forEach(e => { const r = e.getBoundingClientRect(); if (r.top < innerHeight) e.classList.add('in') }), 1200);
}
document.querySelectorAll('pre').forEach(p => {
  if (p.querySelector('.cp')) return; const b = document.createElement('button'); b.type = 'button'; b.className = 'cp'; b.textContent = 'Copy'; b.setAttribute('aria-label', 'Copy code');
  b.onclick = async () => { try { await navigator.clipboard.writeText((p.querySelector('code') || p).textContent); b.textContent = 'Copied'; b.classList.add('ok') } catch (e) { b.textContent = 'Press Ctrl+C' } setTimeout(() => { b.textContent = 'Copy'; b.classList.remove('ok') }, 1600) };
  p.appendChild(b);
});
})();
