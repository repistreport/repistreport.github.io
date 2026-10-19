// Tek yapılandırma: gezegen ve uydu adları, ikon anahtarları, hareket ayarı.
// Yeni gezegen / uydu eklemek için yalnız bu dosya değişir.
// content: null → içerik sağlanmadı; panel "İçerik eklenecek" der (uydurma yok).
window.Rep = window.Rep || {};
Rep.config = {
  brand: { name: 'Representer', accent: '#ff5e00' },
  motion: { degPerSec: 3.2, closeDelayMs: 420 },
  worksPlanetId: 'islerimiz',
  topLinks: [{ name: 'Giriş', href: '/giris' }],
  planets: [
    { id: 'fotograf', name: 'Fotoğraf', icon: 'camera',
      satellites: ['Reklam', 'Ürün', 'Moda', 'Yemek', 'Mimari'] },
    { id: 'film', name: 'Film', icon: 'clapper',
      satellites: ['Reklam filmi', 'Marka filmi', 'Moda filmi', 'Ürün filmi'] },
    { id: 'produksiyon', name: 'Prodüksiyon', icon: 'light',
      satellites: ['Bütçeleme', 'Mekân', 'Casting', 'Ekip & ekipman', 'Çekim organizasyonu'] },
    { id: 'yaratici', name: 'Yaratıcı Geliştirme', icon: 'bulb',
      satellites: ['Fikir', 'Sanat yönetimi', 'Senaryo', 'Storyboard'] },
    { id: 'post', name: 'Post Prodüksiyon', icon: 'sliders',
      satellites: ['Retouch', 'Kurgu', 'Renk', 'VFX & CGI', 'Ses'] },
    { id: 'dijital', name: 'Dijital İçerik', icon: 'phone',
      satellites: ['Sosyal medya', 'Reels', 'E-ticaret', 'Kampanya uyarlamaları'] },
    { id: 'islerimiz', name: 'İşlerimiz', icon: 'frames',
      satellites: ['Seçili projeler', 'Fotoğraf arşivi', 'Film arşivi', 'Kamera arkası'] }
  ]
};

// Uydu kısa yazımını nesneye çevir: 'Ad' → { id, name, content: null }
Rep.config.planets.forEach(function (p) {
  p.satellites = p.satellites.map(function (s, i) {
    return typeof s === 'string' ? { id: p.id + '-' + i, name: s, content: null } : s;
  });
});
