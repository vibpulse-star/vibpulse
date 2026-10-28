// One-click install on Chrome/Edge (Android + Windows); menu instructions where the browser has no install API.
const btn = document.getElementById('install');
const help = document.getElementById('install-help');
let deferred = null;

if (matchMedia('(display-mode: standalone)').matches || navigator.standalone) btn.hidden = true;

addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; });
addEventListener('appinstalled', () => { btn.hidden = true; help.hidden = true; });

btn.addEventListener('click', async () => {
  if (deferred) {
    deferred.prompt();
    await deferred.userChoice;
    deferred = null;
    return;
  }
  help.textContent = /iphone|ipad/i.test(navigator.userAgent)
    ? 'Tap the Share icon, then "Add to Home Screen".'
    : 'Open the browser menu (⋮) and choose "Install app" or "Add to Home screen".';
  help.hidden = false;
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
