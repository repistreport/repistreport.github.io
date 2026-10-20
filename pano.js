// Representer panosu (kullanıcı isteği 20.10.2026): kabuk açılınca, basamak seçilmeden önce sahnede karşılar. kabuk.js çağırır: panoAc(el).
// Piyasa (serbest piyasa kurları, TCMB politika faizi) + iş akışı (teklif → onay → çekim → teslim → vadesi dolan tahsilat) + bu haftanın takvimi.
// ŞİMDİLİK ÖRNEK VERİ: aşağıdaki ORNEK yerine canlıda kur / faiz bir kaynaktan, işler tablodan (köprü) gelecek. Ekranda "örnek veri" etiketi bu yüzden var.

const IK = {
  teklif: 'M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5', onay: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2', kamera: 'M4 7h11v10H4zM15 10l5-3v10l-5-3',
  teslim: 'M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8', uyari: 'M12 4l9 16H3zM12 10v5M12 17.5v.5'
};
const ik = (a) => '<svg class="pn-ik" viewBox="0 0 24 24" aria-hidden="true"><path d="' + IK[a] + '"/></svg>';
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sayi = (n, k) => n.toLocaleString('tr-TR', { minimumFractionDigits: k, maximumFractionDigits: k });
const TL = (n) => sayi(n, 0) + ' ₺';
const kisaTL = (n) => n >= 1e6 ? sayi(n / 1e6, 1) + ' mn ₺' : sayi(n / 1e3, 0) + ' bin ₺';
const tarihYaz = (d) => d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

const ASAMA = [
  { id: 'hazir', ad: 'Teklif hazırlanıyor', ik: 'teklif', tarih: 'Son gün' },
  { id: 'onay', ad: 'Onay bekleyen teklif', ik: 'onay', tarih: 'Gönderildi' },
  { id: 'plan', ad: 'Çekimi planlanan', ik: 'kamera', tarih: 'Çekim' },
  { id: 'cekim', ad: 'Çekimi süren', ik: 'kamera', tarih: 'Çekim' },
  { id: 'teslim', ad: 'Teslim bekleyen', ik: 'teslim', tarih: 'Teslim' },
  { id: 'vade', ad: 'Vadesi dolan tahsilat', ik: 'uyari', tarih: 'Vade', kritik: true }
];

// ---- Kurlar: gerçek veri (kullanıcı kararı 20.10.2026: serbest piyasa) ----
// Anlık (kutucuklar): finans.truncgil.com — serbest piyasa alış / satış / günlük değişim, gram altın dahil; resmi değil. 5 dk'da bir yenilenir.
// Geçmiş (grafik, küçük çizgiler): Frankfurter — Avrupa Merkez Bankası günlük referans kuru (iş günleri), son 1 yıl. İkisi de tarayıcıdan doğrudan (CORS açık), köprü yok.
const KUR_ANLIK = 'https://finans.truncgil.com/today.json';
// api.frankfurter.app → .dev/v1'e yönlendiriyor ve yönlendirmede CORS başlığı yok; doğrudan yeni adres
const KUR_GECMIS = (para, bas, son) => 'https://api.frankfurter.dev/v1/' + bas + '..' + son + '?from=' + para + '&to=TRY';
const PARALAR = ['USD', 'EUR', 'GBP'];
const coz = (s) => parseFloat(String(s).replace('%', '').replace(/\./g, '').replace(',', '.'));
const isoGun = (t) => t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');

async function anlikOku() {
  const j = await (await fetch(KUR_ANLIK, { cache: 'no-store' })).json(), a = {};
  [...PARALAR, 'gram-altin'].forEach(k => { const x = j[k]; if (x) a[k] = { satis: coz(x['Satış']), degisim: coz(x['Değişim']) }; });
  const t = String(j.Update_Date || '').match(/(\d\d:\d\d)/);
  return { kur: a, saat: t ? t[1] : '' };
}
async function gecmisOku(bugun) {
  const bas = new Date(bugun); bas.setFullYear(bas.getFullYear() - 1);
  const g = {};
  await Promise.all(PARALAR.map(async p => {
    const j = await (await fetch(KUR_GECMIS(p, isoGun(bas), isoGun(bugun)))).json();
    g[p] = Object.keys(j.rates || {}).sort().map(k => ({ t: new Date(k + 'T00:00:00'), v: j.rates[k].TRY }));
  }));
  return g;
}

// ---- Örnek veri (bugüne göre kurulur; adlar hayali): faiz, iş akışı, takvim henüz gerçek veriye bağlı değil ----
function ornek(bugun) {
  const g = (n) => { const d = new Date(bugun); d.setDate(d.getDate() + n); return d; };
  return {
    faiz: [['Kas 25', 39.5], ['Ara 25', 38], ['Oca 26', 37], ['Şub 26', 37], ['Mar 26', 35.5], ['Nis 26', 35.5], ['May 26', 34], ['Haz 26', 33], ['Tem 26', 33], ['Ağu 26', 31.5], ['Eyl 26', 30.5], ['Eki 26', 30.5]],
    sonrakiKarar: '19 Kas',
    isler: [
      ['hazir', 'Lumen Kozmetik', 'Kış kampanyası · 3 film', 'Ece Tan', 4, 1450000], ['hazir', 'Kuzey Otomotiv', 'Yeni model lansman fotoğrafı', 'Mert Aydın', 9, 680000],
      ['hazir', 'Defne Tekstil', 'Katalog 2027 İlkbahar', 'Selin Kara', 12, 420000], ['onay', 'Arda Gıda', 'TV reklamı 30 sn', 'Kaan Öz', -6, 2100000],
      ['onay', 'Mavi Liman Otelleri', 'Tanıtım filmi + fotoğraf', 'Ece Tan', -3, 960000], ['onay', 'Kuzey Otomotiv', 'Sosyal medya kurgu paketi', 'Deniz Er', -1, 310000],
      ['onay', 'Nova Telekom', 'Yılbaşı filmi', 'Mert Aydın', -9, 3250000], ['plan', 'Lumen Kozmetik', 'Ürün fotoğrafı · stüdyo', 'Selin Kara', 2, 240000],
      ['plan', 'Peri Ayakkabı', 'Dış çekim · Kapadokya', 'Kaan Öz', 5, 780000], ['plan', 'Arda Gıda', 'Ambalaj çekimi', 'Deniz Er', 6, 190000],
      ['cekim', 'Nova Telekom', 'Ekim kampanyası · 2. gün', 'Ece Tan', 0, 1850000], ['cekim', 'Defne Tekstil', 'Lookbook', 'Selin Kara', 1, 520000],
      ['teslim', 'Mavi Liman Otelleri', 'Yaz filmi · renk düzeltme', 'Mert Aydın', 3, 880000], ['teslim', 'Peri Ayakkabı', 'Fotoğraf seçkisi', 'Kaan Öz', -2, 150000],
      ['teslim', 'Kuzey Otomotiv', 'Bayi filmi · ses', 'Deniz Er', 4, 420000], ['vade', 'Arda Gıda', 'Fatura 2026/412', '', -34, 640000],
      ['vade', 'Lumen Kozmetik', 'Fatura 2026/388', '', -12, 285000], ['vade', 'Nova Telekom', 'Fatura 2026/402', '', -5, 1120000]
    ].map(([asama, mus, is, kisi, gun, tutar]) => ({ asama, mus, is, kisi, tarih: g(gun), tutar }))
  };
}

export function panoAc(el) {
  const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
  const V = ornek(bugun), gunFark = (d) => Math.round((d - bugun) / 864e5);
  const d = { secili: 'onay', aralik: 1, para: 'USD' };
  const P = { anlik: null, gecmis: null, hataAnlik: false, hataGecmis: false }; // kurlar (gerçek)
  const ornekCip = '<span class="pn-ornek" title="Henüz gerçek veriye bağlı değil">örnek</span>';
  el.classList.add('pn');
  el.innerHTML =
    '<div class="pn-ust"><h2>Pano</h2><span class="pn-tarih">' + bugun.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + '</span></div>' +
    // Prototip uyarısı (kullanıcı kararı 20.10.2026): pano canlıda örnek veriyle; bölümler gerçek veriye bağlandıkça kalkar
    '<div class="pn-demo" role="note">' + ik('uyari') + '<b>Prototip</b><span>Kurlar canlı. Faiz, iş akışı ve takvim şimdilik örnektir; gerçek verilere bağlandıkça değişecek.</span></div>' +
    '<div><div class="pn-bas"><h3>Piyasa</h3><small data-pn="saat">yükleniyor…</small></div><div class="pn-piyasa" data-pn="piyasa"></div></div>' +
    '<div class="pn-iki">' +
      '<div class="pn-kart"><div class="pn-bas"><h3 title="Geçmiş: Avrupa Merkez Bankası günlük referans kuru (iş günleri)">Kur geçmişi</h3><div class="pn-pil" data-pn="para"></div><div class="pn-pil pn-sag" data-pn="aralik"></div></div><svg class="pn-g" data-pn="kur"></svg><div class="pn-ipucu" data-pn="kur-ip"></div></div>' +
      '<div class="pn-kart"><div class="pn-bas"><h3>TCMB politika faizi</h3><small>son ' + V.faiz.length + ' karar</small>' + ornekCip + '</div><svg class="pn-g" data-pn="faiz"></svg><div class="pn-ipucu" data-pn="faiz-ip"></div></div>' +
    '</div>' +
    '<div><div class="pn-bas"><h3>İş akışı</h3><small data-pn="ozet"></small>' + ornekCip + '</div><div class="pn-akis" data-pn="akis"></div></div>' +
    '<div class="pn-iki">' +
      '<div class="pn-kart"><div class="pn-bas"><h3 data-pn="liste-ad"></h3><small data-pn="liste-say"></small>' + ornekCip + '</div><div style="overflow:auto"><table data-pn="liste"></table></div></div>' +
      '<div class="pn-kart"><div class="pn-bas"><h3>Bu hafta</h3><small>çekim ve teslim</small>' + ornekCip + '</div><div class="pn-takvim" data-pn="takvim"></div></div>' +
    '</div>';
  const $ = (ad) => el.querySelector('[data-pn="' + ad + '"]');

  // Piyasa şeridi: kur kutucukları (anlık, serbest piyasa; küçük çizgi son 30 iş günü) + faiz (örnek)
  const mini = (s) => {
    if (!s || s.length < 2) return '';
    const p = s.slice(-30).map(x => x.v), n = p.length, mn = Math.min(...p), mx = Math.max(...p);
    return '<svg class="pn-mini" viewBox="0 0 100 26" preserveAspectRatio="none"><path d="' + p.map((v, i) => (i ? 'L' : 'M') + (i / (n - 1) * 100).toFixed(1) + ' ' + (24 - (v - mn) / (mx - mn || 1) * 22).toFixed(1)).join('') + '" style="fill:none;stroke:var(--pn-s1);stroke-width:1.5" vector-effect="non-scaling-stroke"/></svg>';
  };
  const oran = (ad, k, ond) => {
    const a = P.anlik && P.anlik.kur[k];
    if (!a || isNaN(a.satis)) return '<div class="pn-kart pn-oran"><div class="pn-oran-ad">' + ad + '</div><div class="pn-deger">—</div><div class="pn-fark">' + (P.hataAnlik ? 'okunamadı' : 'yükleniyor…') + '</div></div>';
    const f = a.degisim;
    return '<div class="pn-kart pn-oran" title="Serbest piyasa satış"><div class="pn-oran-ad">' + ad + '</div><div class="pn-deger">' + sayi(a.satis, ond) + '</div><div class="pn-fark ' + (f > 0 ? 'pn-yukari' : f < 0 ? 'pn-asagi' : '') + '"><b>' + (f > 0 ? '▲' : f < 0 ? '▼' : '—') + ' %' + sayi(Math.abs(f), 2) + '</b>günlük</div>' + mini(P.gecmis && P.gecmis[k]) + '</div>';
  };
  const fs = V.faiz[V.faiz.length - 1][1], fo = V.faiz[V.faiz.length - 2][1];
  function piyasa() {
    $('piyasa').innerHTML = oran('USD / TRY', 'USD', 4) + oran('EUR / TRY', 'EUR', 4) + oran('GBP / TRY', 'GBP', 4) + oran('Gram altın', 'gram-altin', 2) +
      '<div class="pn-kart pn-oran">' + ornekCip + '<div class="pn-oran-ad">TCMB faizi</div><div class="pn-deger">%' + sayi(fs, 2) + '</div><div class="pn-fark ' + (fs < fo ? 'pn-asagi' : fs > fo ? 'pn-yukari' : '') + '"><b>' + (fs === fo ? '— sabit' : (fs < fo ? '▼ ' : '▲ ') + sayi(Math.abs(fs - fo) * 100, 0) + ' baz puan') + '</b>son karar</div>' +
      '<div class="pn-fark" style="margin-top:14px">Sonraki karar · ' + V.sonrakiKarar + '</div></div>';
    $('saat').textContent = P.anlik ? 'serbest piyasa · ' + P.anlik.saat : P.hataAnlik ? 'kurlar okunamadı' : 'yükleniyor…';
  }
  async function anlikYenile() { try { P.anlik = await anlikOku(); P.hataAnlik = false; } catch (e) { P.hataAnlik = true; } piyasa(); }

  // Kur grafiği: tek para birimi, tek eksen; nişangah + ipucu. Veri: P.gecmis (iş günleri)
  const ARALIK = [['1A', 30], ['3A', 90], ['1Y', 366]];
  const pil = (ad, liste, secili) => { $(ad).innerHTML = liste.map(x => '<button type="button" data-d="' + x + '" class="' + (x === secili ? 'acik' : '') + '">' + x + '</button>').join(''); };
  const piller = () => { pil('para', PARALAR, d.para); pil('aralik', ARALIK.map(a => a[0]), ARALIK[d.aralik][0]); };
  $('para').onclick = (e) => { const b = e.target.closest('button'); if (b) { d.para = b.dataset.d; piller(); kur(); } };
  $('aralik').onclick = (e) => { const b = e.target.closest('button'); if (b) { d.aralik = ARALIK.findIndex(a => a[0] === b.dataset.d); piller(); kur(); } };
  piller();

  function kur() {
    const svg = $('kur'), W = svg.clientWidth, H = 200, sol = 6, sag = 50, ust = 10, alt = 22; if (!W) return;
    const tum = P.gecmis && P.gecmis[d.para];
    if (!tum || tum.length < 2) { svg.innerHTML = '<text x="' + W / 2 + '" y="' + H / 2 + '" text-anchor="middle" style="font:500 12px var(--f);fill:var(--soluk)">' + (P.hataGecmis ? 'Kur geçmişi okunamadı' : 'Yükleniyor…') + '</text>'; svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); return; }
    const sinir = new Date(bugun); sinir.setDate(sinir.getDate() - ARALIK[d.aralik][1]);
    const s = tum.filter(p => p.t >= sinir), n = s.length, u = s.map(p => p.v), gunu = (i) => s[i].t;
    const lo = Math.min(...u), hi = Math.max(...u), pay = (hi - lo) * .12 || .1, mn = lo - pay, mx = hi + pay;
    const x = (i) => sol + i / (n - 1) * (W - sol - sag), y = (v) => ust + (1 - (v - mn) / (mx - mn)) * (H - ust - alt);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    const ham = (mx - mn) / 4, kuv = Math.pow(10, Math.floor(Math.log10(ham))), adim = [1, 2, 2.5, 5, 10].map(m => m * kuv).find(s => s >= ham), ond = adim < 1 ? 2 : 0;
    let h = '<defs><linearGradient id="pn-dolgu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--pn-s1);stop-opacity:.22"/><stop offset="1" style="stop-color:var(--pn-s1);stop-opacity:0"/></linearGradient></defs><g class="pn-eksen">';
    for (let v = Math.ceil(mn / adim) * adim; v <= mx; v += adim) h += '<line x1="' + sol + '" x2="' + (W - sag) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text x="' + (W - sag + 8) + '" y="' + (y(v) + 3) + '">' + sayi(v, ond) + '</text>';
    [0, Math.floor((n - 1) / 2), n - 1].forEach(i => { h += '<text x="' + x(i) + '" y="' + (H - 4) + '" text-anchor="' + (i ? (i === n - 1 ? 'end' : 'middle') : 'start') + '">' + tarihYaz(gunu(i)) + '</text>'; });
    const yol = u.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join('');
    h += '</g><path d="' + yol + 'L' + x(n - 1) + ' ' + (H - alt) + 'L' + x(0) + ' ' + (H - alt) + 'Z" style="fill:url(#pn-dolgu)"/>' +
      '<path d="' + yol + '" style="fill:none;stroke:var(--pn-s1);stroke-width:2;stroke-linejoin:round"/>' +
      '<circle cx="' + x(n - 1) + '" cy="' + y(u[n - 1]) + '" r="4" style="fill:var(--pn-s1);stroke:var(--pn-yuzey);stroke-width:2"/>' +
      '<g data-n style="display:none"><line y1="' + ust + '" y2="' + (H - alt) + '" style="stroke:var(--soluk);stroke-width:1;stroke-dasharray:3 3"/><circle r="4" style="fill:var(--pn-s1);stroke:var(--pn-yuzey);stroke-width:2"/></g>' +
      '<rect x="' + sol + '" y="0" width="' + (W - sol - sag) + '" height="' + H + '" style="fill:transparent"/>';
    svg.innerHTML = h;
    const ip = $('kur-ip'), nis = svg.querySelector('[data-n]'), cz = nis.firstChild, nk = nis.lastChild;
    svg.lastChild.onmousemove = (ev) => {
      const r = svg.getBoundingClientRect(), i = Math.max(0, Math.min(n - 1, Math.round(((ev.clientX - r.left) * W / r.width - sol) / (W - sol - sag) * (n - 1))));
      nis.style.display = ''; cz.setAttribute('x1', x(i)); cz.setAttribute('x2', x(i)); nk.setAttribute('cx', x(i)); nk.setAttribute('cy', y(u[i]));
      ip.innerHTML = '<div class="pn-s">' + gunu(i).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) + '</div><div><i style="background:var(--pn-s1)"></i>' + d.para + ' / TRY <b>' + sayi(u[i], 4) + '</b></div><div class="pn-s">dönem başına göre %' + sayi((u[i] - u[0]) / u[0] * 100, 2) + '</div>';
      const kx = x(i) * r.width / W + 14 + svg.offsetLeft; ip.style.left = (kx + 170 > svg.offsetLeft + r.width ? kx - 190 : kx) + 'px'; ip.style.top = (svg.offsetTop + 10) + 'px'; ip.style.opacity = 1;
    };
    svg.lastChild.onmouseleave = () => { nis.style.display = 'none'; ip.style.opacity = 0; };
  }

  // Faiz grafiği: basamak çizgisi, her karara ipucu
  function faiz() {
    const svg = $('faiz'), W = svg.clientWidth, H = 200, sol = 6, sag = 34, ust = 10, alt = 22, F = V.faiz, n = F.length; if (!W) return;
    const lo = Math.min(...F.map(f => f[1])), hi = Math.max(...F.map(f => f[1])), mn = Math.floor((lo - 2) / 5) * 5, mx = Math.ceil((hi + 2) / 5) * 5;
    const x = (i) => sol + i / (n - 1) * (W - sol - sag), y = (v) => ust + (1 - (v - mn) / (mx - mn)) * (H - ust - alt);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    let h = '<g class="pn-eksen">';
    for (let v = mn + 5; v < mx; v += 5) h += '<line x1="' + sol + '" x2="' + (W - sag) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text x="' + (W - sag + 8) + '" y="' + (y(v) + 3) + '">%' + v + '</text>';
    [0, n - 1].forEach(i => { h += '<text x="' + x(i) + '" y="' + (H - 4) + '" text-anchor="' + (i ? 'end' : 'start') + '">' + F[i][0] + '</text>'; });
    let yol = 'M' + x(0) + ' ' + y(F[0][1]); for (let i = 1; i < n; i++) yol += 'H' + x(i) + 'V' + y(F[i][1]);
    h += '</g><path d="' + yol + '" style="fill:none;stroke:var(--pn-s2);stroke-width:2"/>';
    F.forEach(([, v], i) => { h += '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="' + (i === n - 1 ? 4 : 3) + '" style="fill:var(--pn-s2);stroke:var(--pn-yuzey);stroke-width:2"/><circle data-i="' + i + '" cx="' + x(i) + '" cy="' + y(v) + '" r="12" style="fill:transparent"/>'; });
    svg.innerHTML = h;
    const ip = $('faiz-ip');
    svg.onmousemove = (ev) => {
      const c = ev.target.closest('[data-i]'); if (!c) { ip.style.opacity = 0; return; }
      const i = +c.dataset.i, r = svg.getBoundingClientRect(), f = i ? F[i][1] - F[i - 1][1] : 0;
      ip.innerHTML = '<div class="pn-s">' + F[i][0] + '</div><div><i style="background:var(--pn-s2)"></i>Politika faizi <b>%' + sayi(F[i][1], 2) + '</b></div><div class="pn-s">' + (f ? (f < 0 ? '▼ ' : '▲ ') + sayi(Math.abs(f) * 100, 0) + ' baz puan' : 'değişmedi') + '</div>';
      ip.style.left = Math.min(svg.offsetLeft + x(i) * r.width / W + 12, svg.offsetLeft + r.width - 170) + 'px'; ip.style.top = (svg.offsetTop + y(F[i][1]) * r.height / H + 12) + 'px'; ip.style.opacity = 1;
    };
    svg.onmouseleave = () => { ip.style.opacity = 0; };
  }

  // İş akışı: aşama kutucukları; seçilen aşamanın listesi altta
  function akis() {
    const top = (id) => V.isler.filter(x => x.asama === id).reduce((t, x) => t + x.tutar, 0), enCok = Math.max(...ASAMA.map(a => top(a.id))) || 1;
    $('akis').innerHTML = ASAMA.map(a => {
      const adet = V.isler.filter(x => x.asama === a.id).length, t = top(a.id);
      return '<button type="button" class="pn-asama' + (a.kritik ? ' pn-kritik' : '') + (a.id === d.secili ? ' secili' : '') + '" data-id="' + a.id + '"><div class="pn-asama-ad">' + ik(a.ik) + a.ad + '</div><div class="pn-adet">' + adet + '</div><div class="pn-tutar">' + kisaTL(t) + '</div><div class="pn-cubuk"><i style="width:' + (t / enCok * 100).toFixed(0) + '%"></i></div></button>';
    }).join('');
    $('ozet').textContent = 'açık iş toplamı ' + kisaTL(V.isler.filter(x => x.asama !== 'vade').reduce((s, x) => s + x.tutar, 0));
  }
  $('akis').onclick = (e) => { const b = e.target.closest('.pn-asama'); if (b) { d.secili = b.dataset.id; akis(); liste(); } };

  function liste() {
    const a = ASAMA.find(x => x.id === d.secili), is = V.isler.filter(x => x.asama === d.secili).sort((p, q) => p.tarih - q.tarih), vade = d.secili === 'vade';
    $('liste-ad').textContent = a.ad;
    $('liste-say').textContent = is.length + ' kayıt · ' + TL(is.reduce((s, x) => s + x.tutar, 0));
    const durum = (x) => {
      const f = gunFark(x.tarih);
      if (vade) return '<span class="pn-rozet pn-gec">' + ik('uyari') + -f + ' gün gecikti</span>';
      if (d.secili === 'onay') return '<span class="pn-rozet' + (f <= -7 ? ' pn-gec' : '') + '">' + -f + ' gündür bekliyor</span>';
      if (!f) return '<span class="pn-rozet">bugün</span>';
      return '<span class="pn-rozet' + (f < 0 ? ' pn-gec' : '') + '">' + (f < 0 ? -f + ' gün geçti' : f + ' gün kaldı') + '</span>';
    };
    $('liste').innerHTML = '<thead><tr><th>Müşteri / iş</th><th>' + (vade ? 'Belge' : 'Sorumlu') + '</th><th>' + a.tarih + '</th><th>Durum</th><th class="pn-sayi">Tutar</th></tr></thead><tbody>' +
      is.map(x => '<tr><td>' + esc(x.mus) + '<small>' + esc(x.is) + '</small></td><td>' + esc(vade ? x.is : x.kisi) + '</td><td>' + tarihYaz(x.tarih) + '</td><td>' + durum(x) + '</td><td class="pn-sayi">' + TL(x.tutar) + '</td></tr>').join('') + '</tbody>';
  }

  function takvim() {
    let h = '';
    for (let i = 0; i < 6; i++) {
      const g = new Date(bugun); g.setDate(g.getDate() + i);
      const ol = V.isler.filter(x => ['plan', 'cekim', 'teslim'].includes(x.asama) && gunFark(x.tarih) === i);
      h += '<div class="pn-gun' + (i ? '' : ' pn-bugun') + '"><div class="pn-gun-no"><b>' + g.getDate() + '</b><small>' + g.toLocaleDateString('tr-TR', { weekday: 'short' }).toLocaleUpperCase('tr-TR') + '</small></div><div>' +
        (ol.length ? ol.map(x => '<div class="pn-olay' + (x.asama === 'teslim' ? ' pn-teslim' : '') + '">' + esc(x.mus) + '<small>' + (x.asama === 'teslim' ? 'Teslim · ' : 'Çekim · ') + esc(x.is) + '</small></div>').join('') : '<div class="pn-yok">—</div>') + '</div></div>';
    }
    $('takvim').innerHTML = h;
  }

  piyasa(); akis(); liste(); takvim();
  // Kurlar: anlık hemen ve 5 dk'da bir; geçmiş bir kez (gelince kutucuk çizgileri ve grafik çizilir)
  anlikYenile(); setInterval(() => { if (el.isConnected && !el.hidden) anlikYenile(); }, 5 * 60 * 1000);
  gecmisOku(bugun).then(g => { P.gecmis = g; }).catch(() => { P.hataGecmis = true; }).then(() => { piyasa(); kur(); });
  // Grafikler genişliğe göre çizilir: menü daralınca / pencere değişince yeniden
  new ResizeObserver(() => { kur(); faiz(); }).observe(el);
}
