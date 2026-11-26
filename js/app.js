(() => {
  const NH = window.NoruHane, $ = s => document.querySelector(s);
  let cur = null;

  NH.toast = t => {
    const e = $('#toast'); e.textContent = t; e.classList.add('on');
    clearTimeout(NH._t); NH._t = setTimeout(() => e.classList.remove('on'), 3200);
  };

  // Betik yükleyici (oyunlar ve PeerJS ihtiyaç anında yüklenir)
  NH._l = {};
  NH.load = src => new Promise((ok, no) => {
    if (NH._l[src]) return ok();
    const s = document.createElement('script');
    s.src = src; s.onload = () => { NH._l[src] = 1; ok(); }; s.onerror = no;
    document.head.appendChild(s);
  });

  // Sabit zaman adımlı döngü: 60 Hz de 120 Hz de aynı hızda oynar
  NH.loop = (step, draw, hz = 60) => {
    const dt = 1000 / hz; let acc = 0, last = performance.now(), id, on = true;
    const f = t => {
      if (!on) return;
      acc += Math.min(t - last, 100); last = t;
      while (acc >= dt) { step(); acc -= dt; }
      draw(); id = requestAnimationFrame(f);
    };
    id = requestAnimationFrame(f);
    return () => { on = false; cancelAnimationFrame(id); };
  };

  // Giriş: klavye + ekran butonları (pointer olayları; parmak kayınca/iptalde tuş takılı kalmaz)
  NH.keys = {}; NH.touch = {};
  addEventListener('keydown', e => {
    NH.keys[e.code] = 1;
    if (cur && /^(Arrow|Space)/.test(e.code)) e.preventDefault();
  });
  addEventListener('keyup', e => NH.keys[e.code] = 0);
  const clear = () => { for (const o of [NH.keys, NH.touch]) for (const k in o) delete o[k]; };
  addEventListener('blur', clear);
  document.addEventListener('visibilitychange', clear);
  NH.pad = (el, k) => {
    const off = () => NH.touch[k] = 0;
    el.addEventListener('pointerdown', e => { e.preventDefault(); NH.touch[k] = 1; try { el.setPointerCapture(e.pointerId); } catch {} });
    ['pointerup', 'pointercancel', 'lostpointercapture', 'pointerleave'].forEach(n => el.addEventListener(n, off));
    el.oncontextmenu = e => e.preventDefault();
  };

  // Tam ekran (iPhone Safari desteklemez: Ana Ekrana Ekle önerilir)
  NH.fs = () => {
    const d = document, e = d.documentElement;
    const req = e.requestFullscreen || e.webkitRequestFullscreen;
    if (!req || /iPhone|iPod/.test(navigator.userAgent))
      return NH.toast('iPhone Safari tam ekranı desteklemiyor. Paylaş → Ana Ekrana Ekle ile ekle, sonra ana ekrandaki simgeden aç.');
    if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    else {
      Promise.resolve(req.call(e)).then(() => { if (cur === 'atesvesu') screen.orientation?.lock?.('landscape').catch(() => {}); })
        .catch(err => NH.toast('Tam ekran açılamadı: ' + (err && err.message || err)));
    }
  };

  async function open(id, arg) {
    const g = NH.registry.find(x => x.id === id);
    if (!g || g.soon) return;
    try { for (const s of g.scripts) await NH.load(s); }
    catch { return NH.toast('Oyun yüklenemedi, bağlantını kontrol et.'); }
    if (cur) NH.games[cur].unmount();
    cur = id; clear();
    $('#home').hidden = true; $('#homeBtn').hidden = false;
    const st = $('#stage'); st.hidden = false; st.innerHTML = '';
    if (!history.state || history.state.g !== id) history.pushState({ g: id }, '');
    NH.games[id].mount(st, arg);
  }

  function close() {
    if (cur) NH.games[cur].unmount();
    cur = null; $('#stage').hidden = true; $('#stage').innerHTML = '';
    $('#home').hidden = false; $('#homeBtn').hidden = true;
  }

  $('#grid').innerHTML = NH.registry.map(g => `
    <article class="card ${g.soon ? 'soon' : ''}" style="--c:${g.color}">
      <div class="art">${g.art || ''}</div><h2>${g.title}</h2><p>${g.desc}</p>
      <div class="meta">${g.meta}</div>
      <button class="btn go" data-id="${g.id}" ${g.soon ? 'disabled' : ''}>${g.soon ? 'Yakında' : 'Oyna'}</button>
    </article>`).join('');
  $('#grid').onclick = e => { const b = e.target.closest('[data-id]'); if (b) open(b.dataset.id); };
  $('#fsBtn').onclick = NH.fs;
  if (navigator.standalone || matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches) $('#fsBtn').hidden = true; // zaten uygulama modunda
  $('#homeBtn').onclick = () => history.state && history.state.g ? history.back() : (close(), history.replaceState({}, '', location.pathname));
  $('#logo').onclick = () => { if (cur) $('#homeBtn').onclick(); };
  addEventListener('popstate', close);
  addEventListener('keydown', e => { if (e.code === 'KeyF' && !e.repeat && cur) NH.fs(); });

  const room = new URLSearchParams(location.search).get('oda'); // davet linki
  if (room) open('atesvesu', { join: room.trim().toUpperCase() });
})();
