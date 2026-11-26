// Kullanım: node tools/seviye-kontrol.js
// Her bölüm için, oyundaki GERÇEK fiziği kullanarak iki karakterin de kapıya ulaşıp ulaşamadığını arar
// ve çözülebilir (ve yeterince zor) olan ilk üretim numarasını bulur. Çıkan SEEDS satırını atesvesu.js'e yapıştır.
globalThis.window = { NoruHane: { games: {} } };
const { gen, move, ov } = require('../games/atesvesu/atesvesu.js');
const T = 30, RO = 14, PH = 28;
function solvable(L, col) {
  const S = { ...L.sp[col], vx: 0, vy: 0, g: true, f: 1 }, goal = L.d[col === 'F' ? 'f' : 'w'];
  const kill = h => col === 'F' ? h.k !== 'L' : h.k !== 'P';
  const alive = p => !L.hz.some(h => kill(h) && ov(p, h));
  const trapped = p => p.g && p.y + PH >= (RO - 1) * T - .1 && p.x > L.trap;
  const seen = new Set(), st = [S], key = p => Math.round(p.x / 3) + ',' + Math.round(p.y), cl = p => ({ ...p });
  let win = false;
  const push = p => { if (trapped(p)) return; const k = key(p); if (!seen.has(k)) { seen.add(k); st.push(cl(p)); } };
  const fly = (p0, jump) => {
    for (const d1 of [-1, 0, 1]) for (let n1 = 0; n1 <= 40; n1 += 5) for (const d2 of [-1, 0, 1]) {
      if (d1 === d2 && n1) continue;
      const p = cl(p0);
      for (let f = 0; f < 130; f++) {
        const d = f < n1 ? d1 : d2; move(L, p, d < 0, d > 0, jump && f === 0);
        if (!alive(p)) break; if (ov(p, goal)) { win = true; return; } if (p.g) { push(p); break; }
      }
    }
  };
  seen.add(key(S));
  while (st.length && !win) {
    const s = st.pop(); if (ov(s, goal)) return true;
    for (const d of [-1, 1]) { const p = cl(s); move(L, p, d < 0, d > 0, 0); if (!alive(p)) continue; p.g ? push(p) : fly(p, false); }
    fly(s, true);
  }
  return win;
}
const QK = [3, 5, 6], QTOP = [10, 8, 7], out = [];
for (let t = 0; t < 3; t++) {
  out.push([]);
  for (let i = 0; i < 5; i++) {
    let found = -1;
    for (let off = 0; off < 80 && found < 0; off++) {
      const L = gen(t, i, off);
      if (L.k < QK[t] || L.top > QTOP[t] || (t > 0 && L.hz.length < t + 1)) continue;
      if (solvable(L, 'F') && solvable(L, 'W')) found = off;
    }
    console.error('zorluk', t, 'bölüm', i + 1, found < 0 ? 'BULUNAMADI' : 'tamam (' + found + ')');
    out[t].push(found);
  }
}
console.log('const SEEDS = ' + JSON.stringify(out).replace(/,/g, ', ') + ';');
