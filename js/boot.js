/* Loading screen + early theme. Loaded first, before any styles or the rest of the app.
   - Applies the saved theme straight away, so the page is not white until js/04.js runs.
   - Removes the #boot splash (markup and styles are in app.html) when the app says it is ready:
     js/13.js calls MZboot.done() when its start-up sequence ends (Home or the project is on screen,
     or the sign-in / consent dialog, which sit above the splash, took over).
   - Safety net: the splash is always removed after 12 s, so a failed script can never leave it stuck. */
(function () {
  var d = document.documentElement, done = false;
  try { d.dataset.t = localStorage.mosaicTheme || 'dark'; } catch (e) { d.dataset.t = 'dark'; }
  d.classList.add('booting');
  function finish() {
    if (done) return;
    done = true;
    d.classList.remove('booting');
    var b = document.getElementById('boot');
    if (!b) return;
    b.classList.add('out');
    setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 300);
  }
  window.MZboot = { done: finish };
  setTimeout(finish, 12000);
})();
