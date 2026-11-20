/* Report an issue: builds a pre-filled "new issue" page on GitHub. Nothing is sent from here and nothing is stored. */
(() => {
const repo = String(window.MOSAIC_ISSUES_REPO || '').trim();
const $ = id => document.getElementById(id);
const type = $('iss-type'), title = $('iss-title'), body = $('iss-body'), diag = $('iss-diag'), go = $('iss-go'), all = $('iss-all'), err = $('iss-err'), bl = $('iss-bl');
if (!type || !go) return;
const TAG = { bug: 'Bug', idea: 'Idea', question: 'Question', report: 'Content report' };
const HINT = {
  bug: ['What happened? What did you expect?', 'Steps to reproduce, what you saw, what you expected.'],
  idea: ['What would you like Mosaic to do?', 'Describe the idea and why it would help.'],
  question: ['What do you need help with?', 'Describe what you are trying to do.'],
  report: ['What are you reporting?', 'Paste the public project link and say what is wrong with it. Do not include your private details.']
};
const q = new URLSearchParams(location.search).get('type');
if (q && TAG[q]) type.value = q;
function hint() { const h = HINT[type.value]; bl.textContent = h[0]; body.placeholder = h[1] }
function build() {
  const t = '[' + TAG[type.value] + '] ' + title.value.trim();
  let b = body.value.trim();
  if (diag.checked) b += '\n\n---\nBrowser: ' + navigator.userAgent + '\nScreen: ' + screen.width + 'x' + screen.height + ' (window ' + innerWidth + 'x' + innerHeight + ')';
  return 'https://github.com/' + repo + '/issues/new?title=' + encodeURIComponent(t) + '&body=' + encodeURIComponent(b);
}
function refresh() {
  hint();
  if (!repo) { go.removeAttribute('href'); all.removeAttribute('href'); return }
  go.href = build(); all.href = 'https://github.com/' + repo + '/issues';
}
go.addEventListener('click', e => {
  err.hidden = true;
  if (!repo) { e.preventDefault(); err.textContent = 'Issue reporting is not set up on this copy of Mosaic.'; err.hidden = false; return }
  if (title.value.trim().length < 4 || body.value.trim().length < 10) { e.preventDefault(); err.textContent = 'Please add a short summary and a few words of detail first.'; err.hidden = false; return }
  go.href = build();
});
[type, title, body, diag].forEach(el => el.addEventListener('input', refresh));
refresh();
})();
