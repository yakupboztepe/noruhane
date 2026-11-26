(() => {
  const NH = window.NoruHane, N = 22, C = 32; // 22x22 ızgara, 704x704 tuval

  NH.games.yilan = {
    mount(root) {
      root.innerHTML = `
        <div class="hud">
          <b>Yılan</b><span>Skor <i id="sc">0</i></span><span>Rekor <i id="bs">0</i></span>
          <span class="sp"></span>
          <select class="btn" id="sp"><option value="9">Yavaş</option><option value="6" selected>Normal</option><option value="4">Hızlı</option></select>
          <select class="btn" id="md"><option value="wrap" selected>Kenardan geçiş</option><option value="wall">Duvarlı</option></select>
          <button class="btn pri" id="rs">Yeniden başla</button>
        </div>
        <div class="board" id="bd"><canvas id="cv" width="${N * C}" height="${N * C}"></canvas></div>
        <div class="pads one">
          <div class="grp mv"><button class="pb g" data-d="-1,0">◀</button><button class="pb g" data-d="1,0">▶</button></div>
          <div class="grp mv"><button class="pb g" data-d="0,-1">▲</button><button class="pb g" data-d="0,1">▼</button></div></div>`;
      const $ = s => root.querySelector(s), cv = $('#cv'), x = cv.getContext('2d');
      let s, dir, q, food, gold, score, over, started, every = 6, c = 0, best = 0;

      const key = () => `nh_yilan_${$('#md').value}_${$('#sp').value}`;
      function reset() {
        s = [{ x: 11, y: 11 }, { x: 10, y: 11 }, { x: 9, y: 11 }];
        dir = { x: 1, y: 0 }; q = []; gold = null; score = 0; over = false; started = false; c = 0;
        every = +$('#sp').value; best = +localStorage.getItem(key()) || 0;
        $('#sc').textContent = 0; $('#bs').textContent = best; food = spawn();
      }
      function spawn() {
        let p; do { p = { x: Math.random() * N | 0, y: Math.random() * N | 0 }; }
        while (s.some(a => a.x === p.x && a.y === p.y) || (gold && gold.x === p.x && gold.y === p.y));
        return p;
      }
      function turn(dx, dy) {
        if (over) return;
        const l = q.length ? q[q.length - 1] : dir;
        if ((dx === -l.x && dy === -l.y) || (dx === l.x && dy === l.y)) { started = true; return; }
        if (q.length < 2) q.push({ x: dx, y: dy });
        started = true;
      }
      function tick() {
        if (over || !started) return;
        if (q.length) dir = q.shift();
        let nx = s[0].x + dir.x, ny = s[0].y + dir.y;
        if ($('#md').value === 'wrap') { nx = (nx + N) % N; ny = (ny + N) % N; }
        else if (nx < 0 || ny < 0 || nx >= N || ny >= N) return die();
        const eat = nx === food.x && ny === food.y, bonus = gold && nx === gold.x && ny === gold.y;
        // kuyruk ucu bu adımda çekilecekse oraya girmek çarpma sayılmaz
        const body = eat || bonus ? s : s.slice(0, -1);
        if (body.some(a => a.x === nx && a.y === ny)) return die();
        s.unshift({ x: nx, y: ny });
        if (eat || bonus) {
          score += bonus ? 50 : 10; $('#sc').textContent = score;
          if (score > best) { best = score; localStorage.setItem(key(), best); $('#bs').textContent = best; }
          if (bonus) gold = null; else { food = spawn(); if (!gold && Math.random() < .15) gold = { ...spawn(), t: 45 }; }
        } else s.pop();
        if (gold && --gold.t <= 0) gold = null;
      }
      const die = () => { over = true; };

      function draw() {
        x.fillStyle = '#0a1020'; x.fillRect(0, 0, N * C, N * C);
        x.fillStyle = '#ffffff08';
        for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if ((i + j) & 1) x.fillRect(i * C, j * C, C, C);
        // elma
        x.fillStyle = '#f04545'; x.beginPath(); x.arc(food.x * C + C / 2, food.y * C + C / 2 + 1, C * .38, 0, 7); x.fill();
        x.fillStyle = '#34d399'; x.fillRect(food.x * C + C / 2 - 1, food.y * C + 3, 3, 7);
        if (gold) {
          const r = C * (.36 + .05 * Math.sin(performance.now() / 120));
          x.fillStyle = '#fbbf24'; x.beginPath(); x.arc(gold.x * C + C / 2, gold.y * C + C / 2, r, 0, 7); x.fill();
          x.strokeStyle = '#fff8'; x.lineWidth = 3; x.beginPath();
          x.arc(gold.x * C + C / 2, gold.y * C + C / 2, C * .5, -1.57, -1.57 + 6.28 * gold.t / 45); x.stroke();
        }
        // yılan
        for (let i = s.length - 1; i >= 0; i--) {
          const p = s[i], k = 1 - i / (s.length + 6) * .45;
          x.fillStyle = `rgb(${52 * k | 0},${211 * k | 0},${153 * k | 0})`;
          x.beginPath(); x.roundRect(p.x * C + 2, p.y * C + 2, C - 4, C - 4, i ? 8 : 12); x.fill();
        }
        const h = s[0], ex = dir.x * 5, ey = dir.y * 5, px = -dir.y * 7, py = dir.x * 7;
        x.fillStyle = '#fff';
        for (const m of [-1, 1]) { x.beginPath(); x.arc(h.x * C + C / 2 + ex + px * m, h.y * C + C / 2 + ey + py * m, 4.5, 0, 7); x.fill(); }
        x.fillStyle = '#0a1020';
        for (const m of [-1, 1]) { x.beginPath(); x.arc(h.x * C + C / 2 + ex * 1.4 + px * m, h.y * C + C / 2 + ey * 1.4 + py * m, 2.2, 0, 7); x.fill(); }
        if (over || !started) {
          x.fillStyle = '#0a1020cc'; x.fillRect(0, 0, N * C, N * C);
          x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = 'bold 44px sans-serif';
          x.fillText(over ? 'Kendine çarptın!' : 'Başlamak için kaydır', N * C / 2, N * C / 2 - 8);
          x.font = '26px sans-serif'; x.fillStyle = '#8e9bb8';
          x.fillText(over ? `Skor ${score} · Dokun ya da Yeniden başla` : 'ya da ok tuşlarına bas', N * C / 2, N * C / 2 + 36);
        }
      }

      // girişler
      const dirs = { ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1], ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] };
      this._kd = e => { if (dirs[e.code]) turn(...dirs[e.code]); else if (e.code === 'Space' && over) reset(); };
      addEventListener('keydown', this._kd);
      root.querySelectorAll('[data-d]').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); turn(...b.dataset.d.split(',').map(Number)); }));
      let sx, sy;
      const bd = $('#bd');
      bd.addEventListener('pointerdown', e => { if (over) reset(); sx = e.clientX; sy = e.clientY; });
      bd.addEventListener('pointermove', e => { // parmağı kaldırmadan da yön değiştirilebilir
        if (sx == null) return;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
        Math.abs(dx) > Math.abs(dy) ? turn(Math.sign(dx), 0) : turn(0, Math.sign(dy));
        sx = e.clientX; sy = e.clientY;
      });
      ['pointerup', 'pointercancel'].forEach(n => bd.addEventListener(n, () => sx = null));
      $('#rs').onclick = $('#sp').onchange = $('#md').onchange = reset;

      reset();
      this._stop = NH.loop(() => { if (++c >= every) { c = 0; tick(); } }, draw);
    },
    unmount() { this._stop && this._stop(); removeEventListener('keydown', this._kd); }
  };
})();
