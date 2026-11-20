/* Registers the service worker so Mosaic works offline and can be installed. */
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1'))
  addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}) });
