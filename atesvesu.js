(() => {
  const NH = window.NoruHane, T = 30, CO = 24, RO = 14, PW = 20, PH = 28;
  const PEER = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';

  /* ---------- Bölümler: her zorluk için 5 bölüm, sabit tohumdan üretilir ----------
     Tüm tehlikeler zıplanabilir genişlikte (1-2 kare) ve iki yanında güvenli zemin var,
     bu yüzden her bölüm kurala göre çözülebilir. Aynı tohum = iki oyuncuda aynı bölüm. */
  const TIERS = [
    { n: 'Kolay', w: [5, 7], g: [1, 2], up: 1, hz: 1, gems: 3 },
    { n: 'Orta',  w: [5, 6], g: [2, 3], up: 2, hz: 2, gems: 4 },
    { n: 'Zor',   w: [5, 6], g: [2, 4], up: 2, hz: 3, gems: 5 }
  ];
  const rng = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  function gen(t, i) {
    const c = TIERS[t], r = rng(9001 + t * 131 + i * 17), ri = (a, b) => a + Math.floor(r() * (b - a + 1));
    const g = [...Array(RO)].map((_, y) => [...Array(CO)].map((_, x) => y === 0 || y === RO - 1 || x === 0 || x === CO - 1 ? '#' : '.'));
    const mg = d => d >= 2 ? 2 : d === 1 ? 3 : 4, put = (x, w, f) => { for (let k = 0; k < w; k++) g[f][x + k] = '#'; };
    const P = []; let p = { x: 1, w: 6, f: 13 };
    for (;;) {
      const f = Math.max(6, Math.min(12, p.f - ri(-1, c.up))), gap = Math.min(ri(...c.g), mg(Math.max(0, p.f - f)));
      const w = ri(...c.w), x = p.x + p.w + gap;
      if (x + w + 4 > CO - 1) break;
      p = { x, w, f }; P.push(p); put(x, w, f);
    }
    const f = Math.max(5, Math.min(12, p.f - ri(0, c.up)));
    let x = p.x + p.w + Math.min(c.g[0], mg(Math.max(0, p.f - f)));
    if (CO - 1 - x < 3) x = p.x + p.w + 1;
    const dw = Math.min(5, CO - 1 - x); put(x, dw, f);
    g[f - 1][x + dw - 2] = 'f'; g[f - 1][x + dw - 1] = 'w';
    // tehlikeler: platform başına en fazla bir tane (L lav, P su, G çamur)
    const cand = P.filter(q => q.w >= 5); let hz = c.hz;
    while (hz-- > 0 && cand.length) {
      const q = cand.splice(ri(0, cand.length - 1), 1)[0], hw = ri(1, Math.min(2, q.w - 4)), o = ri(2, q.w - 2 - hw);
      for (let k = 0; k < hw; k++) g[q.f - 1][q.x + o + k] = 'LPG'[ri(0, 2)];
    }
    const all = [{ x: 1, w: 6, f: 13 }, ...P];
    for (let k = 0; k < c.gems; k++) { const q = all[ri(0, all.length - 1)], cx = q.x + ri(0, q.w - 1); if (g[q.f - 1][cx] === '.') g[q.f - 1][cx] = k % 2 ? 'b' : 'r'; }
    g[12][1] = 'F'; g[12][2] = 'W';
    const L = { rows: g.map(a => a.join('')), hz: [], gm: [], d: {}, sp: {}, trap: ((P.find(q => q.f <= 10) || { x: 1e9 }).x) * T };
    L.rows.forEach((s, y) => [...s].forEach((ch, x) => {
      if ('LPG'.includes(ch)) L.hz.push({ x: x * T + 1, y: y * T + 18, w: T - 2, h: 12, k: ch });
      else if (ch === 'r' || ch === 'b') L.gm.push({ x: x * T + T / 2, y: y * T + T / 2, t: ch, got: 0 });
      else if (ch === 'f' || ch === 'w') L.d[ch] = { x: x * T + 2, y: (y + 1) * T - 48, w: T - 4, h: 48 };
      else if (ch === 'F' || ch === 'W') L.sp[ch] = { x: x * T + 5, y: (y + 1) * T - PH };
    }));
    return L;
  }

  /* ---------- Fizik (kare adımı sabit 60 Hz) ---------- */
  const solid = (L, cx, cy) => cx < 0 || cx >= CO || cy < 0 || cy >= RO || L.rows[cy][cx] === '#';
  function hit(L, p, axisX) {
    const dn = p.vy > 0, rt = p.vx > 0; // yön, çarpışma çözülmeden ÖNCE okunmalı
    const x0 = Math.floor(p.x / T), x1 = Math.floor((p.x + PW - .01) / T), y0 = Math.floor(p.y / T), y1 = Math.floor((p.y + PH - .01) / T);
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) if (solid(L, cx, cy)) {
      if (axisX) p.x = rt ? cx * T - PW : (cx + 1) * T;
      else if (dn) { p.y = cy * T - PH; p.vy = 0; p.g = true; }
      else { p.y = (cy + 1) * T; p.vy = 0; }
    }
  }
  function move(L, p, l, r, u) {
    p.vx = l ? -3.4 : r ? 3.4 : 0; if (p.vx) p.f = p.vx > 0 ? 1 : -1;
    if (u && p.g) { p.vy = -10.4; p.g = false; }
    p.vy = Math.min(p.vy + .5, 12);
    p.x += p.vx; if (p.vx) hit(L, p, true);
    p.y += p.vy; p.g = false; hit(L, p, false);
  }
  const ov = (a, b) => a.x < b.x + b.w && a.x + PW > b.x && a.y < b.y + b.h && a.y + PH > b.y;

  /* ---------- Oyun ---------- */
  NH.games.atesvesu = {
    mount(root, arg) {
      const $ = s => root.querySelector(s), K = NH.keys, Tc = NH.touch;
      let stop = null, peer = null, conn = null, invite = '', msg = '';
      let mode = 'local', tier = 0, idx = 0, L, F, W, got = 0, frames = 0, win = 0, tx = null;
      const prog = () => JSON.parse(localStorage.getItem('nh_av') || '{}');
      const send = m => { try { if (conn && conn.open) conn.send(m); } catch {} };
      const say = t => { msg = t; const e = $('#st'); if (e) e.textContent = t; };

      /* --- lobi --- */
      function lobby() {
        if (stop) stop(); stop = null;
        root.innerHTML = `<section class="lobby"><h2>Ateş ve Su</h2>
          <p class="note">Kırmızı ve Mavi aynı anda kendi kapısına ulaşmalı. Mavi lavdan, Kırmızı su havuzundan kaçınır; yeşil çamur ikisini de yakar.</p>
          <div class="seg" id="tr">${TIERS.map((t, i) => `<button class="btn ${i === tier ? 'sel' : ''}" data-t="${i}">${t.n}</button>`).join('')}</div>
          <div class="lvs" id="lv"></div>
          <p class="note">Bölüme dokununca aynı ekranda 2 kişi başlar. Arkadaşın odaya bağlıysa online başlar.</p>
          <div class="room"><button class="btn" id="mk">Online oda kur</button>
            <input id="cd" maxlength="4" placeholder="KOD"><button class="btn" id="jn">Katıl</button>
            ${invite ? '<button class="btn" id="cp">Davet linkini kopyala</button>' : ''}</div>
          <div class="note" id="st">${msg}</div></section>`;
        const pr = prog();
        $('#lv').innerHTML = [0, 1, 2, 3, 4].map(i => `<button class="btn" data-i="${i}">${i + 1}${pr[tier + '-' + i] ? ' ' + '★'.repeat(pr[tier + '-' + i]) : ''}</button>`).join('');
        $('#tr').onclick = e => { const b = e.target.closest('[data-t]'); if (b) { tier = +b.dataset.t; lobby(); } };
        $('#lv').onclick = e => {
          const b = e.target.closest('[data-i]'); if (!b) return;
          if (peer && !(conn && conn.open) && invite) return NH.toast('Arkadaşın henüz bağlanmadı.');
          if (peer && !invite && !(conn && conn.open)) return NH.toast('Misafir bölümü host seçer.');
          const m = conn && conn.open ? 'host' : 'local';
          start(m, tier, +b.dataset.i); if (m === 'host') send({ t: 'go', ti: tier, ix: +b.dataset.i });
        };
        $('#mk').onclick = host; $('#jn').onclick = () => join($('#cd').value.trim().toUpperCase());
        const cp = $('#cp'); if (cp) cp.onclick = () => navigator.clipboard.writeText(invite).then(() => NH.toast('Link kopyalandı'), () => prompt('Linki kopyala:', invite));
      }

      /* --- ağ (PeerJS): host Kırmızı, misafir Mavi --- */
      function hook(c) {
        conn = c;
        c.on('data', m => {
          if (m.t === 'p') tx = m;
          else if (m.t === 'g') { const g = L && L.gm[m.i]; if (g && !g.got) { g.got = 1; got++; } }
          else if (m.t === 'dead') reload();
          else if (m.t === 'win') showWin(m.s);
          else if (m.t === 'go') start('guest', m.ti, m.ix);
          else if (m.t === 'lobby') lobby();
        });
        c.on('close', () => { conn = null; say('Bağlantı koptu.'); if (mode !== 'local') { NH.toast('Bağlantı koptu'); lobby(); } });
      }
      async function host() {
        say('Oda açılıyor…');
        try { await NH.load(PEER); } catch { return say('Online kütüphane yüklenemedi. İnternet bağlantını kontrol et.'); }
        const code = [...Array(4)].map(() => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.random() * 31 | 0]).join('');
        if (peer) peer.destroy();
        peer = new Peer('noruhane-av-' + code);
        peer.on('open', () => {
          invite = location.origin + location.pathname + '?oda=' + code;
          say(`Oda kodu: ${code}. Arkadaşın bağlanınca bir bölüm seç.`); lobby();
        });
        peer.on('connection', c => { if (conn && conn.open) return c.close(); c.on('open', () => { hook(c); say('Arkadaşın bağlandı! Bölüm seç.'); }); });
        peer.on('error', e => e.type === 'unavailable-id' ? host() : say('Bağlantı hatası: ' + e.type));
      }
      async function join(code) {
        if (code.length !== 4) return NH.toast('4 harfli kodu gir');
        say('Odaya bağlanılıyor…');
        try { await NH.load(PEER); } catch { return say('Online kütüphane yüklenemedi. İnternet bağlantını kontrol et.'); }
        if (peer) peer.destroy();
        peer = new Peer();
        peer.on('open', () => {
          const c = peer.connect('noruhane-av-' + code, { reliable: true });
          const to = setTimeout(() => say('Bağlanılamadı. Kod doğru mu? Mobil veride P2P bağlantı kurulamayabilir; aynı Wi-Fi\'yi dene.'), 12000);
          c.on('open', () => { clearTimeout(to); hook(c); say('Bağlandı! Host bölümü seçince oyun başlar.'); });
        });
        peer.on('error', e => say(e.type === 'peer-unavailable' ? 'Oda bulunamadı.' : 'Bağlantı hatası: ' + e.type));
      }

      /* --- oyun --- */
      function reload() {
        L = gen(tier, idx);
        F = { ...L.sp.F, vx: 0, vy: 0, g: false, f: 1 }; W = { ...L.sp.W, vx: 0, vy: 0, g: false, f: 1 };
        got = 0; tx = null; win = 0; const o = $('#ov'); if (o) o.hidden = true;
      }
      function start(m, ti, ix) {
        mode = m; tier = ti; idx = ix; frames = 0;
        const solo = m === 'local';
        root.innerHTML = `<div class="hud"><b>Ateş ve Su</b><span>${TIERS[tier].n} ${idx + 1}/5</span>
          <span>Elmas <i id="gm"></i></span><span><i id="tm">0:00</i></span><span class="sp"></span>
          <button class="btn" id="rs">Sıfırla</button><button class="btn" id="lb">Lobi</button></div>
          <div class="board"><canvas id="cv" width="${CO * T}" height="${RO * T}"></canvas><div class="ov" id="ov" hidden></div></div>
          <div class="pads ${solo ? '' : 'one'}">
            ${solo || m === 'host' ? '<div class="grp"><button class="pb r" data-k="fl">◀</button><button class="pb r" data-k="fr">▶</button><button class="pb r" data-k="fu">▲</button></div>' : ''}
            ${solo || m === 'guest' ? '<div class="grp"><button class="pb b" data-k="wl">◀</button><button class="pb b" data-k="wr">▶</button><button class="pb b" data-k="wu">▲</button></div>' : ''}
          </div>`;
        root.querySelectorAll('[data-k]').forEach(b => NH.pad(b, b.dataset.k));
        $('#rs').onclick = () => { if (m === 'guest') return NH.toast('Sıfırlamayı host yapar'); reload(); send({ t: 'dead' }); };
        $('#lb').onclick = () => { if (m === 'host') send({ t: 'lobby' }); lobby(); };
        reload();
        if (stop) stop(); stop = NH.loop(tick, draw);
      }
      const rk = () => [K.KeyA || K.ArrowLeft || Tc.fl, K.KeyD || K.ArrowRight || Tc.fr, K.KeyW || K.ArrowUp || Tc.fu];
      const bk = () => [K.ArrowLeft || K.KeyA || Tc.wl, K.ArrowRight || K.KeyD || Tc.wr, K.ArrowUp || K.KeyW || Tc.wu];
      const lerp = (p) => { if (!tx) return; p.x += (tx.x - p.x) * .5; p.y += (tx.y - p.y) * .5; p.f = tx.f; };
      function trap(p, s) { if (p.g && p.y + PH >= (RO - 1) * T - .1 && p.x > L.trap) Object.assign(p, s, { vx: 0, vy: 0 }); }

      function tick() {
        if (win) { if (mode !== 'guest' && --win <= 0) next(); return; }
        frames++;
        if (mode === 'local') { move(L, F, K.KeyA || Tc.fl, K.KeyD || Tc.fr, K.KeyW || Tc.fu); move(L, W, K.ArrowLeft || Tc.wl, K.ArrowRight || Tc.wr, K.ArrowUp || Tc.wu); trap(F, L.sp.F); trap(W, L.sp.W); }
        else if (mode === 'host') { move(L, F, ...rk()); lerp(W); trap(F, L.sp.F); }
        else { move(L, W, ...bk()); lerp(F); trap(W, L.sp.W); }
        if (mode !== 'local' && frames % 3 === 0) { const p = mode === 'host' ? F : W; send({ t: 'p', x: p.x, y: p.y, f: p.f }); }
        if (mode !== 'guest') rules();
        if (frames % 15 === 0) { $('#gm').textContent = got + '/' + L.gm.length; const s = frames / 60 | 0; $('#tm').textContent = (s / 60 | 0) + ':' + String(s % 60).padStart(2, '0'); }
      }
      function rules() { // host ve yerel mod: olayları tek yerden belirler
        for (const h of L.hz) if ((ov(F, h) && h.k !== 'L') || (ov(W, h) && h.k !== 'P')) { reload(); return send({ t: 'dead' }); }
        L.gm.forEach((g, i) => {
          if (g.got) return; const b = { x: g.x - 9, y: g.y - 9, w: 18, h: 18 };
          if (ov(g.t === 'r' ? F : W, b)) { g.got = 1; got++; send({ t: 'g', i }); }
        });
        if (ov(F, L.d.f) && ov(W, L.d.w)) {
          const s = got === L.gm.length ? 3 : got >= L.gm.length * .6 ? 2 : 1, pr = prog(), k = tier + '-' + idx;
          pr[k] = Math.max(pr[k] || 0, s); localStorage.setItem('nh_av', JSON.stringify(pr));
          showWin(s); send({ t: 'win', s }); win = 140;
        }
      }
      function showWin(s) { win = win || 1e9; const o = $('#ov'); o.hidden = false; o.innerHTML = `<b>Bölüm tamam!</b><div style="font-size:2rem;color:#fbbf24">${'★'.repeat(s)}${'☆'.repeat(3 - s)}</div>`; }
      function next() {
        if (idx < 4) { idx++; send({ t: 'go', ti: tier, ix: idx }); start(mode, tier, idx); }
        else { send({ t: 'lobby' }); say('Bu zorluğu bitirdin!'); lobby(); }
      }

      /* --- çizim --- */
      const cv = () => $('#cv');
      function rr(x, a, b, w, h, r) { x.beginPath(); x.roundRect(a, b, w, h, r); x.fill(); }
      function who(x, p, col, dark, fire, t) {
        const cx = p.x + PW / 2, m = p.vx ? Math.sin(t / 70) * 3 : 0;
        x.fillStyle = dark; rr(x, p.x + 2 + m, p.y + PH - 6, 7, 6, 3); rr(x, p.x + PW - 9 - m, p.y + PH - 6, 7, 6, 3);
        x.fillStyle = col; rr(x, p.x, p.y + 4, PW, PH - 8, 10);
        x.beginPath();
        if (fire) { x.moveTo(cx - 7, p.y + 8); x.quadraticCurveTo(cx - 7, p.y - 2, cx - 1, p.y - 8); x.quadraticCurveTo(cx + 1, p.y - 1, cx + 3, p.y - 4); x.quadraticCurveTo(cx + 8, p.y + 2, cx + 7, p.y + 8); }
        else { x.moveTo(cx, p.y - 9); x.quadraticCurveTo(cx + 9, p.y + 2, cx + 6, p.y + 8); x.lineTo(cx - 6, p.y + 8); x.quadraticCurveTo(cx - 9, p.y + 2, cx, p.y - 9); }
        x.fill();
        x.fillStyle = '#fff'; x.beginPath(); x.arc(cx - 4 + p.f, p.y + 14, 3.6, 0, 7); x.arc(cx + 4 + p.f, p.y + 14, 3.6, 0, 7); x.fill();
        x.fillStyle = '#10182c'; x.beginPath(); x.arc(cx - 4 + p.f * 2, p.y + 14.5, 1.8, 0, 7); x.arc(cx + 4 + p.f * 2, p.y + 14.5, 1.8, 0, 7); x.fill();
      }
      function draw() {
        const c = cv(); if (!c || !L) return; const x = c.getContext('2d'), t = performance.now();
        const bg = x.createLinearGradient(0, 0, 0, RO * T); bg.addColorStop(0, '#141d38'); bg.addColorStop(1, '#0a1020');
        x.fillStyle = bg; x.fillRect(0, 0, CO * T, RO * T);
        L.rows.forEach((s, y) => [...s].forEach((ch, cx) => {
          if (ch !== '#') return;
          x.fillStyle = '#2a3963'; x.fillRect(cx * T, y * T, T, T);
          if (!solid(L, cx, y - 1)) { x.fillStyle = '#5b72b8'; x.fillRect(cx * T, y * T, T, 5); }
          x.strokeStyle = '#0a102044'; x.strokeRect(cx * T + .5, y * T + .5, T - 1, T - 1);
        }));
        const hc = { L: '#ff7a2f', P: '#3b9cff', G: '#4ade80' };
        for (const h of L.hz) {
          x.fillStyle = hc[h.k]; x.beginPath(); x.moveTo(h.x, h.y + h.h);
          for (let a = 0; a <= h.w; a += 4) x.lineTo(h.x + a, h.y + 3 + Math.sin(t / 220 + h.x + a / 5) * 2);
          x.lineTo(h.x + h.w, h.y + h.h); x.fill();
        }
        for (const [k, col] of [['f', '#f04545'], ['w', '#3b82f6']]) {
          const d = L.d[k], on = ov(k === 'f' ? F : W, d);
          x.fillStyle = col + (on ? '88' : '33'); x.beginPath(); x.roundRect(d.x, d.y, d.w, d.h, [13, 13, 0, 0]); x.fill();
          x.strokeStyle = col; x.lineWidth = 2; x.stroke();
        }
        for (const g of L.gm) {
          if (g.got) continue; const bob = Math.sin(t / 250 + g.x) * 2;
          x.fillStyle = g.t === 'r' ? '#ff5a5a' : '#5aa8ff'; x.beginPath();
          x.moveTo(g.x, g.y - 10 + bob); x.lineTo(g.x + 8, g.y + bob); x.lineTo(g.x, g.y + 10 + bob); x.lineTo(g.x - 8, g.y + bob); x.fill();
          x.fillStyle = '#fff8'; x.beginPath(); x.moveTo(g.x - 2, g.y - 6 + bob); x.lineTo(g.x + 3, g.y - 1 + bob); x.lineTo(g.x - 2, g.y - 1 + bob); x.fill();
        }
        who(x, F, '#f04545', '#a52626', true, t); who(x, W, '#3b82f6', '#1f4fa8', false, t);
      }

      lobby();
      if (arg && arg.join) join(arg.join);
      this._cleanup = () => { if (stop) stop(); if (peer) peer.destroy(); };
    },
    unmount() { this._cleanup && this._cleanup(); }
  };
})();
