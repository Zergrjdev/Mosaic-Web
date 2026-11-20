/* Download page: picks the right build for the visitor's system (OS + CPU) and lists every other build. */
(() => {
const esc = window.MosaicSite.esc, box = document.querySelector('[data-downloads]'); if (!box) return;
const ARCH = {
  x64: ['64-bit', 'Intel / AMD, 64-bit'], x86: ['32-bit', 'Intel / AMD, 32-bit'],
  arm64: ['64-bit ARM', '64-bit ARM'], arm: ['32-bit ARM', '32-bit ARM']
};
const META = {
  chromeos: ['laptop', 'ChromeOS', 'Chromebooks and Chromeboxes', ['webapp']],
  windows: ['monitor', 'Windows', 'Windows 10 or newer', ['x64', 'arm64', 'x86']],
  macos: ['laptop', 'macOS', 'macOS 12 or newer', ['arm64', 'x64']],
  linux: ['terminal', 'Linux', 'Linux desktop (AppImage, or .deb for 32-bit)', ['x64', 'arm64', 'arm', 'x86']],
  android: ['smartphone', 'Android', 'Android 8 or newer (APK)', ['arm64', 'arm', 'x64', 'x86']],
  ios: ['tablet-smartphone', 'iPhone & iPad', 'iOS 15 or newer', ['universal']]
};
const NAMES = {
  macos: { arm64: 'Apple silicon (M1 or newer)', x64: 'Intel Mac' },
  android: { arm64: '64-bit ARM (most phones, arm64-v8a)', arm: '32-bit ARM (older phones, armeabi-v7a)', x64: 'x86_64 (emulators, some tablets)', x86: '32-bit x86 (rare)' },
  windows: { x64: '64-bit (Intel / AMD)', arm64: 'ARM64 (Snapdragon PCs)', x86: '32-bit (Intel / AMD)' },
  linux: { x64: '64-bit (Intel / AMD)', arm64: '64-bit ARM (Raspberry Pi 4/5, Apple silicon VMs)', arm: '32-bit ARM (Raspberry Pi OS 32-bit) \u00b7 .deb', x86: '32-bit (Intel / AMD) \u00b7 .deb' }
};
const label = (os, a) => (NAMES[os] && NAMES[os][a]) || (ARCH[a] ? ARCH[a][1] : 'All devices');

/* ---- detect OS and CPU ---- */
async function detect() {
  const ua = navigator.userAgent, plat = navigator.platform || '';
  let os = /CrOS/i.test(ua) ? 'chromeos' : /Android/i.test(ua) ? 'android' : /iPhone|iPad|iPod/i.test(ua) || (/Mac/i.test(plat) && navigator.maxTouchPoints > 1) ? 'ios' : /Windows/i.test(ua) ? 'windows' : /Mac/i.test(ua) ? 'macos' : /Linux|X11|CrOS/i.test(ua) ? 'linux' : '';
  let arch = '', bits = 0;
  const u = navigator.userAgentData;
  if (u && u.getHighEntropyValues) {
    try {
      const h = await u.getHighEntropyValues(['architecture', 'bitness']);
      bits = +h.bitness || 0;
      if (h.architecture === 'arm') arch = bits === 32 ? 'arm' : 'arm64';
      else if (h.architecture === 'x86') arch = bits === 32 ? 'x86' : 'x64';
    } catch (e) {}
  }
  if (!arch) {
    const s = os === 'linux' || os === 'android' ? ua + ' ' + plat : ua;
    if (/aarch64|arm64|armv8(?!l)/i.test(s)) arch = 'arm64';
    else if (/armv8l|armv7|armv6|armeabi|\barm\b/i.test(s)) arch = 'arm';
    else if (/x86_64|x64|Win64|WOW64|amd64|x86-64/i.test(s)) arch = 'x64';
    else if (os === 'windows' && !/Win64|WOW64/i.test(ua)) arch = 'x86';
    else if (/i[3-6]86|\bx86\b/i.test(s)) arch = 'x86';
  }
  if (os === 'ios') arch = 'universal';
  return { os, arch };
}

let deferred = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; const b = document.querySelector('[data-pwa]'); if (b) b.hidden = false });

const btn = (url, size, text) => '<a class="btn pri" href="' + esc(url) + '" ' + (/^https?:/.test(url) && !url.startsWith(location.origin) ? 'rel="noopener"' : 'download') + '>' + esc(text) + (size ? ' · ' + esc(size) : '') + '</a>';
const okUrl = u => /^(https?:\/\/|downloads\/|\.\/downloads\/)/.test(u || '') ? u : '';

function chromeCard(P, me) {
  const mine = me.os === 'chromeos', a = me.arch === 'arm64' || me.arch === 'arm' || me.arch === 'x64' || me.arch === 'x86' ? me.arch : 'x64';
  const row = (title, B, why) => { const keys = ['x64', 'arm64'].filter(k => B && B[k]), pick = B && B[a] ? a : keys[0], x = (B && B[pick]) || {}, u = okUrl(x.url);
    return '<li><span>' + esc(title) + '<small>' + esc(why) + '</small></span>' + (u ? '<a href="' + esc(u) + '" download>Download' + (x.size ? ' · ' + esc(x.size) : '') + '</a>' : '<span class="badge soon">Coming soon</span>') + '</li>' };
  const A = (P.android || {}).builds, L = (P.linux || {}).builds;
  return '<div class="card os' + (mine ? ' rec' : '') + '"><div class="ico">' + window.MosaicIcons.svg('laptop') + '</div><div class="row"><h3>ChromeOS</h3>' + (mine ? '<span class="badge">Your device</span>' : '') + '</div>'
    + '<p>Chromebooks and Chromeboxes. The web app is the best fit: it installs in one click, opens in its own window and works offline.</p>'
    + '<a class="btn pri" href="app.html">Open Mosaic</a><p class="dl-note" style="margin:10px 0 0">Then use the install icon in the address bar to add it to your shelf.</p>'
    + '<details class="dl-more"' + (mine ? ' open' : '') + '><summary>Other ways to run it</summary><ul>' + row('Android app (APK)', A, 'For Chromebooks that run Android apps') + row('Linux app (AppImage)', L, 'For Chromebooks with Linux turned on') + '</ul></details></div>';
}
function card(os, P, me) {
  if (os === 'chromeos') return chromeCard(P, me);
  const m = META[os], p = P[os] || {}, B = p.builds || {}, mine = os === me.os;
  /* old manifest format: one url for the whole platform */
  if (!p.builds && p.url) B[m[3][0]] = { url: p.url, size: p.size };
  const best = mine && B[me.arch] ? me.arch : mine && B.universal ? 'universal' : '';
  const b = best ? B[best] : null, url = b ? okUrl(b.url) : '';
  const native = !b || b.native !== false;
  let primary;
  if (url) primary = btn(url, b.size, 'Download for ' + (best === 'universal' ? m[1] : label(os, best))) + (b.note ? '<p class="dl-note" style="margin:10px 0 0">' + esc(b.note) + '</p>' : '');
  else if (mine && me.arch && b && b.native === false) primary = '<p class="dl-note">' + esc(b.note || 'There is no native app for this kind of device. The web app is the same Mosaic and works offline once installed.') + '</p><a class="btn pri" href="app.html">Open Mosaic in your browser</a>';
  else if (mine && me.arch && !b && os !== 'ios') primary = '<p class="dl-note">We do not have a build for ' + esc(label(os, me.arch)) + ' yet. The web app works on it today.</p><a class="btn pri" href="app.html">Open Mosaic in your browser</a>';
  else primary = '<span class="badge soon" style="align-self:flex-start">Coming soon</span>';
  const keys = Object.keys(B).length ? m[3].filter(a => B[a]) : m[3];
  const more = keys.length > 1 || (keys.length === 1 && keys[0] !== 'universal' && !best) ? '<details class="dl-more"' + (mine && !url ? ' open' : '') + '><summary>All ' + esc(m[1]) + ' versions</summary><ul>' + keys.map(a => {
    const x = B[a] || {}, u = okUrl(x.url);
    return '<li><span>' + esc(label(os, a)) + (a === best ? ' <em>(your device)</em>' : '') + '</span>' + (u ? '<a href="' + esc(u) + '" ' + (/^https?:/.test(u) && !u.startsWith(location.origin) ? 'rel="noopener"' : 'download') + '>Download' + (x.size ? ' · ' + esc(x.size) : '') + '</a>' : x.native === false ? '<span class="badge">Web app only</span>' : '<span class="badge soon">Coming soon</span>') + '</li>'
  }).join('') + '</ul></details>' : '';
  return '<div class="card os' + (mine ? ' rec' : '') + '"><div class="ico">' + window.MosaicIcons.svg(m[0]) + '</div><div class="row"><h3>' + esc(p.label || m[1]) + '</h3>' + (mine ? '<span class="badge">Your device</span>' : '') + '</div><p>' + esc(p.note || m[2]) + '</p>' + primary + more + '</div>';
}

Promise.all([detect(), fetch('downloads/downloads.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : {}).catch(() => ({}))]).then(([me, d]) => {
  const P = (d && d.platforms) || {}, v = d && d.version;
  const vv = document.querySelector('#dv'); if (vv && v) vv.textContent = 'Version ' + v;
  const order = Object.keys(META).sort((a, b) => (b === me.os) - (a === me.os));
  box.innerHTML = order.map(k => card(k, P, me)).join('');
  const sys = document.querySelector('#dsys');
  if (sys) sys.textContent = me.os ? 'We think you are on ' + META[me.os][1] + (me.arch && me.arch !== 'universal' ? ' (' + label(me.os, me.arch) + ')' : '') + '. Not right? Every version is listed under its card.' : '';
  const pw = document.querySelector('[data-pwa]');
  if (pw) { pw.hidden = !deferred; pw.onclick = async () => { if (!deferred) return; deferred.prompt(); try { await deferred.userChoice } catch (e) {} deferred = null; pw.hidden = true } }
});
})();
