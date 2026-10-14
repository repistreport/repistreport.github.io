// rep-app.com kabuğu: cam kokpit (kullanıcı kararı 13.10.2026). Hedef adresi olmayan yol (Ticari2) bu kabukla açılır.
// Solda ağaç menü (köprüden, Rep_Menu), üstte arama ve süzgeç pilleri, ortada modül sahnesi (çerçeve), altta durum çubuğu.
// Açılışta hiçbir basamak seçili değil, hiçbir dal açık değil. kapi.js çağırır: kabukAc({ yol, iste, cikis, ilk }).

// Renkler: yapan = yazılımı yapan (Abrama: mor, lila) · kullanan = yazılımı kullanan sistem (Rep: turuncu, fosforlu turuncu).
// Kaynak köprü (14.10.2026; Rep_Sistem, yoksa köprünün varsayılanı): menü cevabındaki renk uygulanır. Buradaki değerler yalnız menü gelene kadarki ilk boyama.
const TEMA = { yapan: '#7c3aed', yapan2: '#c4b5fd', kullanan: '#ff8a3d', kullanan2: '#ff5f00' };

// Rep_Menu.IDU_Ikon bu adlardan biriyse çizim, başka bir şeyse (emoji) olduğu gibi gösterilir; boşsa dal / yaprak çizimi
const IKON = {
  indir: 'M12 4v11M7 11l5 5 5-5M5 20h14', sablon: 'M4 5h16v5H4zM4 14h7v6H4zM15 14h5v6h-5z', uyari: 'M12 4l9 16H3zM12 10v5M12 17.5v.5',
  kutu: 'M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8', katman: 'M12 4l9 5-9 5-9-5zM3 14l9 5 9-5', grafik: 'M4 20V6M4 20h16M8 16l4-5 3 3 5-7',
  belge: 'M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5', defter: 'M5 4h13v16H5zM9 4v16M12 9h3', kisi: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c1-4 4-6 8-6s7 2 8 6',
  ayar: 'M12 9a3 3 0 100 6 3 3 0 000-6zM12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1',
  arti: 'M12 5v14M5 12h14', deney: 'M9 3h6M10 3v6l-5 10h14l-5-10V3', dal: 'M4 7h6l2 2h8v10H4z', yaprak: 'M5 5h14v14H5zM9 10h6M9 14h4',
  ok: 'M9 6l6 6-6 6', ray: 'M4 5h16v14H4zM9.5 5v14', cikis: 'M14 4h5v16h-5M10 8l-4 4 4 4M6 12h9', ara: 'M11 4.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM16 16l4.5 4.5',
  yenile: 'M19 12a7 7 0 11-2.1-5M19 4v4h-4', tam: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  gunduz: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4', gece: 'M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z'
};
const svg = (ad, sinif) => '<svg' + (sinif ? ' class="' + sinif + '"' : '') + ' viewBox="0 0 24 24" aria-hidden="true"><path d="' + IKON[ad] + '"/></svg>';
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const tr = (s) => String(s).toLocaleLowerCase('tr');
const bekle = (ms) => new Promise(r => setTimeout(r, ms));

function stil() {
  return new Promise((bitti) => {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = new URL('kabuk.css?s=6', import.meta.url).href;
    l.onload = l.onerror = bitti; document.head.append(l);
  });
}

// yol = { id, ad } · iste(govde) = köprü isteği (kimlik ve yol kapi.js'te eklenir) · cikis() · ilk = açılışta açılacak basamak (?menu=…; boşsa hiçbiri)
export async function kabukAc({ yol, iste, cikis, ilk }) {
  await stil();
  const k = document.createElement('div'); k.id = 'kabuk';
  Object.entries(TEMA).forEach(([ad, v]) => k.style.setProperty('--' + ad, v));
  k.innerHTML =
    '<div id="kb-isik"></div>' +
    '<aside id="kb-ray" class="cam">' +
      '<div class="kb-marka"><b>rep<i>.</i></b><small id="kb-yol"></small><button type="button" class="dugme" id="kb-daralt" title="Menüyü daralt / genişlet">' + svg('ray') + '</button></div>' +
      '<nav id="kb-agac" aria-label="Menü" role="tree"></nav>' +
      '<div class="kb-alt"><em id="kb-kisa"></em><div><span id="kb-kisi"></span><span class="imza" title="Yazılım: Abrama"><i>A</i>Abrama</span></div>' +
        '<button type="button" class="dugme" id="kb-cikis" title="Çıkış">' + svg('cikis') + '</button></div>' +
    '</aside>' +
    '<main id="kb-govde">' +
      '<header id="kb-ust" class="cam"><label id="kb-ara" title="Basamak ara">' + svg('ara') + '<input id="kb-sorgu" placeholder="Ara" autocomplete="off" spellcheck="false"><kbd>Ctrl K</kbd></label><div id="kb-piller"></div><button type="button" class="dugme" id="kb-tema"></button></header>' +
      '<section id="kb-sahne" class="cam">' +
        '<div id="kb-bos"><b>rep<i>.</i></b></div>' +
        '<div id="kb-bas" hidden><div><div id="kb-iz"></div><h1 id="kb-baslik"></h1></div><span class="etiket" id="kb-hal" role="status" aria-live="polite"></span><span class="etiket" id="kb-kod" title="Modül"></span><span id="kb-belgeler"></span>' +
          '<button type="button" class="dugme" id="kb-yenile" title="Yenile">' + svg('yenile') + '</button><button type="button" class="dugme" id="kb-tam" title="Tam ekran">' + svg('tam') + '</button><i id="kb-akis"></i></div>' +
        '<div id="kb-alan"><div id="kb-taslak"><div><i class="isk"></i><i class="isk"></i><i class="isk"></i><i class="isk"></i></div><ul>' +
          [34, 48, 28, 42, 36, 52, 30, 44].map(g => '<li><i class="isk"></i><i class="isk" style="width:' + g + '%"></i><i class="isk"></i></li>').join('') + '</ul></div>' +
          '<iframe id="kb-cerceve" credentialless allow="clipboard-read; clipboard-write; fullscreen"></iframe><div id="kb-hata" role="alert"></div></div>' +
      '</section>' +
      '<footer id="kb-cubuk"><span id="kb-bag" title="Köprü bağlantısı"><i></i><span>Bağlanıyor</span></span><span id="kb-sure" title="Son açılış süresi"></span><span id="kb-saat"></span></footer>' +
    '</main>';
  const $ = (id) => k.querySelector('#kb-' + id);
  $('yol').textContent = yol.ad;
  document.body.append(k); document.title = 'REP İstanbul · ' + yol.ad;
  if (matchMedia('(max-width:860px)').matches) k.classList.add('dar');

  // Gece / gündüz (kullanıcı isteği 13.10.2026): seçim bu tarayıcıda hatırlanır; ilk açılış gece.
  // Modül de uyar: ilk ton adresle gider (&tema=…), sonraki değişiklik açık modüle haberle ({ rep: 'tema' }; modül tarafı F020.tema)
  let modulPencere = null;
  const TEMA_ANAHTAR = 'repkabuk.tema';
  const temaYaz = (gunduz) => {
    k.classList.toggle('gunduz', gunduz);
    $('tema').innerHTML = svg(gunduz ? 'gece' : 'gunduz'); $('tema').title = gunduz ? 'Geceye geç' : 'Gündüze geç'; $('tema').setAttribute('aria-pressed', gunduz);
    if (modulPencere) try { modulPencere.postMessage({ rep: 'tema', tema: gunduz ? 'gunduz' : 'gece' }, '*'); } catch (e) {}
  };
  let gunduz = false; try { gunduz = localStorage.getItem(TEMA_ANAHTAR) === 'gunduz'; } catch (e) {}
  temaYaz(gunduz);
  $('tema').addEventListener('click', () => { gunduz = !gunduz; temaYaz(gunduz); try { localStorage.setItem(TEMA_ANAHTAR, gunduz ? 'gunduz' : 'gece'); } catch (e) {} });

  // Süzgeç pilleri: hepsi seçili gelir, eşit pil
  const d = { hazir: false, menu: [], belgeler: [], belge: '', secili: '', yuk: '', acik: new Set(), sorgu: '', pil: new Set(['canli', 'bekleyen']), no: 0, t0: 0, sure: 0 };
  const cocuklar = (ust) => d.menu.filter(m => m.ust === ust);
  const yaprak = (m) => !cocuklar(m.id).length;
  const yapraklar = (m) => yaprak(m) ? [m] : cocuklar(m.id).flatMap(yapraklar);
  // Modül rozeti (kullanıcı isteği 14.10.2026): altındaki bütün basamaklar tek modülse rozet yalnız en üstteki o dalda görünür, altlarda tekrar etmez
  const tekModul = (m) => { const s = new Set(yapraklar(m).map(x => x.modul || '')); return s.size === 1 ? [...s][0] : ''; };
  const rozet = (m) => { const t = tekModul(m), u = t && d.menu.find(x => x.id === m.ust); return t && !(u && tekModul(u) === t) ? t : ''; };
  const ustler = (m) => { const y = []; for (let u = d.menu.find(x => x.id === m.ust), n = 0; u && n < 8; u = d.menu.find(x => x.id === u.ust), n++) y.unshift(u); return y; };
  const hal = (m) => m.acik ? 'canli' : 'bekleyen';
  const ikon = (m, y) => IKON[m.ikon] ? svg(m.ikon) : m.ikon ? '<span class="im">' + esc(m.ikon) + '</span>' : svg(y ? 'yaprak' : 'dal');

  function gorunur() {
    // Yaprak süzgeçten geçerse kendisi ve üstleri görünür
    const g = new Set();
    d.menu.filter(yaprak).forEach(m => {
      if (!d.pil.has(hal(m))) return;
      if (d.sorgu && !tr([...ustler(m), m].map(x => x.ad).join(' ')).includes(d.sorgu)) return;
      g.add(m.id); ustler(m).forEach(u => g.add(u.id));
    });
    return g;
  }
  function ciz() {
    if (!d.hazir) { // menü okunurken: iskelet
      $('agac').innerHTML = [62, 78, 54, 70, 46, 66, 58].map(g => '<div class="isk-satir"><i class="isk"></i><i class="isk" style="width:' + g + '%"></i></div>').join('');
      $('piller').innerHTML = '<i class="isk"></i><i class="isk"></i>'; return;
    }
    const odak = k.contains(document.activeElement) && document.activeElement.closest('#kb-agac') ? document.activeElement.dataset.id : '';
    const g = gorunur(), suzgec = d.sorgu || d.pil.size < 2;
    const sec = d.menu.find(m => m.id === d.secili), yol2 = new Set(sec ? ustler(sec).map(u => u.id) : []);
    const vurgu = (ad) => { const i = d.sorgu ? tr(ad).indexOf(d.sorgu) : -1; return i < 0 ? esc(ad) : esc(ad.slice(0, i)) + '<mark>' + esc(ad.slice(i, i + d.sorgu.length)) + '</mark>' + esc(ad.slice(i + d.sorgu.length)); };
    const dal = (ust) => cocuklar(ust).filter(m => g.has(m.id)).map(m => {
      const y = yaprak(m), acik = !y && (suzgec || d.acik.has(m.id)), alt = y ? [] : yapraklar(m), canli = alt.filter(x => x.acik).length;
      const ipucu = m.ad + (y ? (m.acik ? (m.modul ? ' · ' + m.modul : '') : ' · henüz bir modüle bağlı değil') : ' · ' + canli + ' / ' + alt.length + ' canlı');
      return '<div class="dugum' + (y ? ' yaprak' : '') + (acik ? ' acik' : '') + (yol2.has(m.id) ? ' yol' : '') + '" role="treeitem"' + (y ? '' : ' aria-expanded="' + acik + '"') + '>' +
        '<button type="button" class="satir' + (y ? (m.acik ? ' canli' : ' kapali') : '') + (m.id === d.secili ? ' secili' : '') + (m.id === d.yuk ? ' yuk' : '') + '" data-id="' + esc(m.id) + '" title="' + esc(ipucu) + '">' +
        ikon(m, y) + '<span class="ad">' + vurgu(m.ad) + '</span>' +
        (rozet(m) ? '<span class="kod">' + esc(rozet(m)) + '</span>' : '') + (y ? '<i class="isik"></i>' : '<span class="sayi">' + canli + '</span>' + svg('ok', 'ok')) + '</button>' +
        (y ? '' : '<div class="cocuk"><div>' + dal(m.id) + '</div></div>') + '</div>';
    }).join('');
    $('agac').innerHTML = dal('') || '<div class="kb-yok">' + (d.menu.length ? 'Sonuç yok' : 'Menüde basamak yok') + '</div>';
    const say = { canli: 0, bekleyen: 0 }; d.menu.filter(yaprak).forEach(m => say[hal(m)]++);
    $('piller').innerHTML = [['canli', 'Canlı'], ['bekleyen', 'Hazırlanıyor']].map(([p, ad]) =>
      '<button type="button" class="pil' + (d.pil.has(p) ? ' secili' : '') + '" data-d="' + p + '" title="' + ad + ' basamakları göster / gizle"><i class="isik"></i><span>' + ad + '</span><b>' + say[p] + '</b></button>').join('');
    if (odak) { const b = [...$('agac').querySelectorAll('.satir')].find(x => x.dataset.id === odak); if (b) b.focus({ focusVisible: false }); }
  }

  async function menuOku(tazele) {
    try {
      const r = await iste({ islem: 'menu', tazele: tazele === true });
      const kimlik = new Set(r.menu.map(m => m.id));
      d.menu = r.menu.map(m => ({ ...m, ust: kimlik.has(m.ust) && m.ust !== m.id ? m.ust : '' })); // üstü görünmeyen basamak köke düşer
      d.belgeler = r.belgeler || [];
      Object.entries(r.renk || {}).forEach(([ad, v]) => { if (/^#[0-9a-f]{6}$/i.test(v)) k.style.setProperty('--' + ad, v); });
      const ad = r.ad || ''; $('kisi').textContent = ad; $('kisa').textContent = ad.split(/\s+/).map(s => s[0] || '').slice(0, 2).join('').toLocaleUpperCase('tr');
      d.hazir = true; ciz();
      $('bag').className = 'var'; $('bag').lastElementChild.textContent = 'Köprü bağlı';
    } catch (e) {
      $('bag').className = 'hata'; $('bag').lastElementChild.textContent = 'Köprü yok';
      if (d.hazir) return; // elde menü varsa o kalır
      $('piller').innerHTML = '';
      $('agac').innerHTML = '<div class="kb-yok hata"><span>' + esc(e.message) + '</span><button type="button" id="kb-tekrar">Yeniden dene</button></div>';
      $('tekrar').addEventListener('click', () => { ciz(); menuOku(true); });
    }
  }

  // Açılış iki adımdır: köprü tek kullanımlık bilet verir, sonra modül çerçevede açılır ve "hazır" der.
  // Her adım etikette, ilerleme çizgisinde, sahne iskeletinde ve ağaçtaki satırda görünür.
  function halYaz(yazi, tur) {
    const h = $('hal'); h.className = 'etiket ' + (tur || (yazi ? 'yuk' : 'canli'));
    h.innerHTML = tur === 'hata' ? esc(yazi) : yazi ? '<i class="halka"></i>' + esc(yazi) : '<i></i>Canlı'; h.title = yazi ? '' : 'Modül yayında';
  }
  async function bitir(no) {
    if (no !== d.no || !d.yuk) return;
    clearTimeout(d.sure); const a = $('akis'); a.style.width = '100%';
    await bekle(260); if (no !== d.no) return;
    a.style.opacity = '0'; $('sahne').classList.remove('yuk'); $('cerceve').classList.add('var'); halYaz('');
    $('sure').textContent = ((performance.now() - d.t0) / 1000).toFixed(1).replace('.', ',') + ' sn';
    d.yuk = ''; ciz();
  }
  // Belge düğmeleri (kullanıcı isteği 14.10.2026): açık modülün Kullanım Kılavuzu, Açıklama …; liste köprüden, metin modülde. Seçili belge vurgulu; yeniden tıklayınca modüle döner.
  function belgeCiz(m) {
    $('belgeler').innerHTML = m.modul ? d.belgeler.map(b => '<button type="button" class="etiket belge' + (d.belge === b.kod ? ' secili' : '') + '" data-belge="' + esc(b.kod) + '" title="' + esc(m.modul + ' · ' + b.ad) + '">' + esc(b.ad) + '</button>').join('') : '';
  }
  async function yukle(m, belge) {
    const no = ++d.no, a = $('akis');
    d.secili = d.yuk = m.id; d.belge = belge || ''; d.t0 = performance.now(); ustler(m).forEach(u => d.acik.add(u.id)); ciz();
    $('bos').hidden = true; $('bas').hidden = false; $('hata').textContent = '';
    $('iz').innerHTML = [yol.ad, ...ustler(m).map(x => x.ad)].map(x => '<span>' + esc(x) + '</span>').join(svg('ok'));
    $('baslik').textContent = m.ad + (belge ? ' · ' + (d.belgeler.find(b => b.kod === belge) || {}).ad : ''); $('kod').textContent = m.modul || ''; belgeCiz(m);
    $('sahne').classList.add('yuk'); $('cerceve').classList.remove('var');
    a.style.transition = 'none'; a.style.width = '0'; a.style.opacity = '1'; void a.offsetWidth; a.style.transition = '';
    halYaz('Bilet alınıyor'); a.style.width = '38%';
    try {
      const r = await iste({ islem: 'menuAc', menu: m.id });
      if (no !== d.no) return; // bu arada başka basamak seçildi
      const c = $('cerceve'); c.title = r.ad; modulPencere = null;
      c.src = r.adres + (r.adres.includes('?') ? '&' : '?') + 'tema=' + (k.classList.contains('gunduz') ? 'gunduz' : 'gece') + (belge ? '&belge=' + encodeURIComponent(belge) : '');
      document.title = 'REP İstanbul · ' + r.ad;
      halYaz('Modül açılıyor'); a.style.width = '86%';
      // Modül "hazır" deyince biter ({ rep: 'hazir' }); demezse 90 sn sonra
      clearTimeout(d.sure); d.sure = setTimeout(() => bitir(no), 90000);
    } catch (e) {
      if (no !== d.no) return;
      a.style.opacity = '0'; $('sahne').classList.remove('yuk'); halYaz('Açılamadı', 'hata'); $('hata').textContent = e.message;
      d.yuk = ''; ciz();
    }
  }
  function ac(id) {
    const m = d.menu.find(x => x.id === id); if (!m) return;
    if (!yaprak(m)) { d.acik.has(id) ? d.acik.delete(id) : d.acik.add(id); ciz(); }
    if (m.acik) yukle(m);
  }

  $('agac').addEventListener('click', (e) => { const b = e.target.closest('.satir'); if (b) ac(b.dataset.id); });
  $('agac').addEventListener('keydown', (e) => {
    const s = [...$('agac').querySelectorAll('.satir')].filter(b => b.offsetParent), i = s.indexOf(document.activeElement); if (i < 0) return;
    const n = document.activeElement.closest('.dugum'), git = (b) => { if (b) { e.preventDefault(); b.focus(); } };
    if (e.key === 'ArrowDown') git(s[i + 1]); else if (e.key === 'ArrowUp') git(s[i - 1]);
    else if (e.key === 'ArrowRight' && n.hasAttribute('aria-expanded') && !n.classList.contains('acik')) s[i].click();
    else if (e.key === 'ArrowLeft') { if (n.classList.contains('acik')) s[i].click(); else { const u = n.parentElement.closest('.dugum'); git(u && u.querySelector('.satir')); } }
  });
  $('piller').addEventListener('click', (e) => { const b = e.target.closest('.pil'); if (!b) return; const p = b.dataset.d; d.pil.has(p) ? d.pil.delete(p) : d.pil.add(p); ciz(); });
  $('sorgu').addEventListener('input', (e) => { d.sorgu = tr(e.target.value.trim()); ciz(); });
  $('sorgu').addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.target.value = ''; d.sorgu = ''; ciz(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); const b = $('agac').querySelector('.satir'); if (b) b.focus(); }
    if (e.key === 'Enter') { const b = $('agac').querySelector('.satir.canli'); if (b && d.sorgu) ac(b.dataset.id); }
  });
  addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('sorgu').focus(); $('sorgu').select(); } });
  $('daralt').addEventListener('click', () => k.classList.toggle('dar'));
  $('cikis').addEventListener('click', cikis);
  $('yenile').addEventListener('click', () => { const m = d.menu.find(x => x.id === d.secili); if (m) yukle(m, d.belge); });
  $('belgeler').addEventListener('click', (e) => { const b = e.target.closest('[data-belge]'), m = d.menu.find(x => x.id === d.secili); if (b && m) yukle(m, d.belge === b.dataset.belge ? '' : b.dataset.belge); });
  $('tam').addEventListener('click', () => document.fullscreenElement ? document.exitFullscreen() : $('sahne').requestFullscreen());
  // Modülden gelen haber: yalnız Google'ın uygulama çerçevesinden
  addEventListener('message', (e) => {
    let alan = ''; try { alan = new URL(e.origin).hostname; } catch (x) {}
    if (!/(^|\.)googleusercontent\.com$/.test(alan) || !e.data) return;
    if (e.data.rep === 'menuYenile') menuOku(true);
    if (e.data.rep === 'hazir') { modulPencere = e.source; temaYaz(k.classList.contains('gunduz')); bitir(d.no); }
  });
  const saat = () => { $('saat').textContent = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); }; saat(); setInterval(saat, 15000);

  ciz();
  menuOku().then(() => { if (ilk && d.menu.some(m => m.id === ilk)) ac(ilk); });
}
