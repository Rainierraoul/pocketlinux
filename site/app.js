/* Mobile controls for Bellard's 2019 self-hosted JSLinux demo.
 * This launcher does not replace the emulator, and does not claim that the
 * Linux guest's disk is persistent. Its command history stays on this device.
 */
(() => {
  'use strict';
  const frame = document.getElementById('vm');
  const status = document.getElementById('vm-status');
  const notice = document.getElementById('notice');
  const input = document.getElementById('command');
  const progress = document.getElementById('download-progress');
  const form = document.getElementById('command-form');
  const offline = document.getElementById('offline');
  const base = new URL('./', window.location.href);
  let history = [];
  try {
    const stored = JSON.parse(localStorage.getItem('pocketlinux-commands') || '[]');
    if (Array.isArray(stored)) history = stored.filter(v => typeof v === 'string').slice(-100);
  } catch (_error) { /* private browsing or invalid local data */ }
  let historyIndex = history.length;
  let probe;

  function setNotice(message) { notice.textContent = message; }
  function getVM() {
    try {
      const vm = frame.contentWindow;
      if (vm && ((typeof vm.term_handler === 'function' && typeof vm.console_write1 === 'function') || typeof vm.console_queue_char === 'function')) return vm;
    } catch (_error) { /* cross-origin protection, or VM has not loaded */ }
    return null;
  }
  function send(bytes) {
    const vm = getVM();
    if (!vm) { setNotice('Emulator is loading. Try again shortly.'); return false; }
    // Bellard's console_queue_char expects raw single-byte input.
    if (/[^\x00-\x7f]/.test(bytes)) { setNotice('This prototype currently supports ASCII terminal input only.'); return false; }
    try {
      if (typeof vm.term_handler === 'function') {
        vm.term_handler(bytes);
      } else {
        for (let i = 0; i < bytes.length; i++) vm.console_queue_char(bytes.charCodeAt(i));
      }
      return true;
    } catch (error) {
      setNotice('Console input failed: ' + error.message);
      return false;
    }
  }
  function ctrl(letter) { return String.fromCharCode(letter.toUpperCase().charCodeAt(0) & 31); }

  function boot() {
    window.clearInterval(probe);
    status.textContent = 'Booting';
    const cols = Math.max(38, Math.min(98, Math.floor(window.innerWidth / 7.5)));
    const rows = Math.max(20, Math.min(45, Math.floor((window.innerHeight - 235) / 15)));
    const url = new URL('vm/index.html', base);
    url.searchParams.set('cpu', 'riscv64');
    url.searchParams.set('url', 'root-riscv64.cfg');
    url.searchParams.set('mem', '128');
    url.searchParams.set('cols', String(cols));
    url.searchParams.set('rows', String(rows));
    url.searchParams.set('font_size', '12');
    url.searchParams.set('net_url', ''); // No third-party VPN, no account needed.
    frame.src = url.href;
  }

  frame.addEventListener('load', () => {
    let tries = 0;
    window.clearInterval(probe);
    probe = window.setInterval(() => {
      if (getVM()) {
        status.textContent = 'Console connected';
        window.clearInterval(probe);
      } else if (++tries >= 180) {
        status.textContent = 'Load failed';
        setNotice('Console did not initialise. Check the VM assets and Safari developer console.');
        window.clearInterval(probe);
      }
    }, 500);
  });

  document.getElementById('reset').addEventListener('click', () => {
    if (window.confirm('Restart Linux? Unsaved guest files and processes will be lost.')) boot();
  });

  document.getElementById('keys').addEventListener('click', event => {
    const b = event.target.closest('button');
    if (!b) return;
    const sequence = b.dataset.ctrl ? ctrl(b.dataset.ctrl) : JSON.parse('"' + b.dataset.send.replace(/"/g, '\\"') + '"');
    // The HTML attribute contains literal JavaScript escape text; JSON.parse turns it into control bytes.
    send(sequence);
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    const command = input.value;
    if (send(command + '\r')) {
      if (command.trim()) {
        history.push(command);
        if (history.length > 100) history.shift();
        try { localStorage.setItem('pocketlinux-commands', JSON.stringify(history)); } catch (_error) {}
      }
      historyIndex = history.length;
      input.value = '';
    }
    input.focus();
  });

  input.addEventListener('keydown', event => {
    if (event.key === 'ArrowUp' && history.length) {
      event.preventDefault();
      historyIndex = Math.max(0, historyIndex - 1);
      input.value = history[historyIndex] || '';
    } else if (event.key === 'ArrowDown' && history.length) {
      event.preventDefault();
      historyIndex = Math.min(history.length, historyIndex + 1);
      input.value = history[historyIndex] || '';
    }
  });

  async function registerSW() {
    if (!('serviceWorker' in navigator)) { offline.disabled = true; setNotice('This browser does not support offline caching.'); return; }
    try {
      await navigator.serviceWorker.register(new URL('sw.js', base), {scope: base.pathname});
      await navigator.serviceWorker.ready;
    } catch (err) { setNotice('Offline support unavailable: ' + err.message); }
  }

  offline.addEventListener('click', async () => {
    offline.disabled = true;
    progress.hidden = false;
    progress.value = 0;
    try {
      const response = await fetch(new URL('asset-list.json', base), {cache:'no-store'});
      if (!response.ok) throw Error('asset manifest HTTP ' + response.status);
      const manifest = await response.json();
      const cache = await caches.open('pocketlinux-assets-v1');
      let i = 0;
      for (const entry of manifest.files) {
        const asset = new URL(entry.path, base);
        let already = await cache.match(asset);
        if (!already) {
          const downloaded = await fetch(asset, {cache:'no-store'});
          if (!downloaded.ok) throw Error('download failed: ' + entry.path);
          await cache.put(asset, downloaded);
        }
        i++;
        progress.value = Math.round(100 * i / manifest.files.length);
        setNotice(`Caching ${i}/${manifest.files.length} files (${Math.round(manifest.bytes / 1048576)} MB total). Keep Safari open.`);
      }
      setNotice('Offline assets cached. iOS can still evict browser storage; guest writes remain temporary.');
    } catch (err) {
      setNotice('Offline cache incomplete: ' + err.message);
    } finally {
      offline.disabled = false;
      progress.hidden = true;
    }
  });

  registerSW();
  boot();
})();
