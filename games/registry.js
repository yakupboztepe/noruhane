// Yeni oyun eklemek: games/<oyun>/ klasörü aç, buraya bir satır ekle.
window.NoruHane = { games: {}, registry: [
  {
    id: 'atesvesu', title: 'Ateş ve Su', color: '#f04545',
    desc: 'Kırmızı ve Mavi birlikte kapılarına ulaşsın. 15 bölüm, 3 zorluk. Aynı ekranda ya da online oyna.',
    meta: '2 kişi · online veya aynı ekran', scripts: ['games/atesvesu/atesvesu.js'],
    art: '<svg viewBox="0 0 120 70"><rect x="28" y="16" width="26" height="44" rx="13" fill="#f04545"/><path d="M33 22q0-12 8-16 1 8 8 16z" fill="#f04545"/><circle cx="36" cy="36" r="4" fill="#fff"/><circle cx="46" cy="36" r="4" fill="#fff"/><rect x="66" y="16" width="26" height="44" rx="13" fill="#3b82f6"/><path d="M79 4q10 12 10 18H69q0-6 10-18z" fill="#3b82f6"/><circle cx="74" cy="36" r="4" fill="#fff"/><circle cx="84" cy="36" r="4" fill="#fff"/></svg>'
  },
  {
    id: 'yilan', title: 'Klasik Yılan', color: '#34d399',
    desc: 'Kenarlardan geçerek devam eder, sadece kendine çarpınca biter. Altın elma bonus verir.',
    meta: 'Tek kişi · telefon ve bilgisayar', scripts: ['games/yilan/yilan.js'],
    art: '<svg viewBox="0 0 120 70"><path d="M12 52h34q12 0 12-12t12-12h28" fill="none" stroke="#34d399" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/><circle cx="96" cy="26" r="3" fill="#0e1424"/><circle cx="104" cy="54" r="8" fill="#f04545"/></svg>'
  },
  {
    id: 'codenames', title: 'Codenames', color: '#a78bfa', soon: true,
    desc: 'Kelime ve strateji oyunu. Diğer iki oyun test edilince eklenecek.',
    meta: 'Yakında', scripts: [],
    art: '<svg viewBox="0 0 120 70"><g fill="#a78bfa" opacity=".7"><rect x="14" y="12" width="28" height="20" rx="4"/><rect x="46" y="12" width="28" height="20" rx="4"/><rect x="78" y="12" width="28" height="20" rx="4"/><rect x="14" y="38" width="28" height="20" rx="4"/><rect x="46" y="38" width="28" height="20" rx="4"/><rect x="78" y="38" width="28" height="20" rx="4"/></g></svg>'
  }
]};
