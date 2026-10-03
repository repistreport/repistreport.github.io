// rep-app.com giriş kapısı (kullanıcı kararı 03.10.2026): Firebase Auth ile giriş, yetki köprüden (RepApp_Kopru doPost).
// Akış: giriş (Google / e-posta + şifre) -> idToken köprüye -> yetkili uygulamalar -> seçilen uygulama tam ekran çerçevede.
// Sayfa yolu window.REP_YOL ile gelir (ör. ticari1); boşsa uygulama seçimi gösterilir.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendEmailVerification, sendPasswordResetEmail, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

const FIREBASE_AYAR = {
  apiKey: 'AIzaSyAQF8vo8vgUnQbLr-fagghLnn41efADKi8',
  authDomain: 'rep-app-3ca0e.firebaseapp.com',
  projectId: 'rep-app-3ca0e',
  appId: '1:1023250694349:web:592816f179f4778eaca984'
};
const KOPRU_EXEC = 'https://script.google.com/macros/s/AKfycbz-HUdmwpaE2gnwK9pX28lNFIvAz9hB2rpcc3AsVTwvItUr9STu5k6kfFWY-Ivr9RACPA/exec';
const YOL = String(window.REP_YOL || '');
const MENU = new URLSearchParams(location.search).get('menu') || '';
const HATIRLA = 'repkapi.eposta';

const auth = getAuth(initializeApp(FIREBASE_AYAR));
auth.languageCode = 'tr';
const $ = id => document.getElementById(id);
const durum = (m, hata) => { $('durum').textContent = m || ''; $('durum').classList.toggle('hata', !!hata); };
const mesgul = (e) => document.querySelectorAll('#kart button').forEach(b => { b.disabled = e; });
const goster = (bolum) => ['giris', 'onay', 'secim'].forEach(b => { $(b).hidden = b !== bolum; });
const basliklar = (ust, baslik, aciklama) => { $('ust-baslik').textContent = ust; $('baslik').textContent = baslik; $('aciklama').textContent = aciklama; };

// Firebase hata kodlarının Türkçesi
const HATA = {
  'auth/invalid-credential': 'E-posta ya da şifre hatalı.', 'auth/wrong-password': 'Şifre hatalı.', 'auth/user-not-found': 'Bu e-postayla hesap yok. "Hesap oluştur" ile açabilirsiniz.',
  'auth/email-already-in-use': 'Bu e-postayla zaten bir hesap var. Giriş yapın ya da şifrenizi sıfırlayın.', 'auth/weak-password': 'Şifre en az 6 karakter olmalı.',
  'auth/invalid-email': 'E-posta adresi geçersiz.', 'auth/popup-closed-by-user': 'Google penceresi kapatıldı.', 'auth/popup-blocked': 'Tarayıcı Google penceresini engelledi; açılır pencerelere izin verin.',
  'auth/too-many-requests': 'Çok fazla deneme yapıldı. Biraz sonra tekrar deneyin.', 'auth/network-request-failed': 'Bağlantı kurulamadı.'
};
const hataMetni = (e) => HATA[e && e.code] || (e && e.message) || 'Bir hata oluştu.';

async function kopru(istek) {
  const r = await fetch(KOPRU_EXEC, { method: 'POST', body: JSON.stringify(istek) }); // düz metin gövde: basit istek, CORS ön kontrolü yok
  const v = await r.json();
  if (v.hata) throw new Error(v.hata);
  return v;
}

async function devam(user) {
  goster('');
  basliklar('HOŞ GELDİNİZ', 'Yetkiler kontrol ediliyor…', user.email);
  durum('Uygulamalarınız okunuyor…');
  try {
    const token = await user.getIdToken();
    const r = await kopru({ islem: 'yollar', idToken: token });
    if (YOL) {
      const y = r.yollar.find(x => x.urlYol.toLowerCase() === YOL.toLowerCase());
      if (!y) throw new Error('Bu adres (rep-app.com/' + YOL + ') için yetkiniz yok.');
      return ac(user, y);
    }
    basliklar('MERHABA, ' + (r.ad || '').toLocaleUpperCase('tr-TR'), 'Uygulamanızı seçin.', 'Yetkili olduğunuz uygulamalar');
    $('uygulamalar').replaceChildren(...r.yollar.map(y => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'uygulama'; const acilir = y.acik || y.kabuk; b.disabled = !acilir;
      const k = document.createElement('span'); k.className = 'kod'; k.textContent = y.urlYol;
      const m = document.createElement('span'); const t = document.createElement('b'); t.textContent = y.ad; const s = document.createElement('small'); s.textContent = (y.aciklama ? y.aciklama + ' · ' : '') + 'rep-app.com/' + y.urlYol.toLowerCase();
      m.append(t, s);
      const o = document.createElement('span'); o.className = acilir ? 'ok' : 'yakinda'; o.textContent = acilir ? '↗' : 'YAKINDA';
      b.append(k, m, o); if (acilir) b.addEventListener('click', () => ac(user, y)); return b;
    }));
    goster('secim');
    durum(r.yollar.length ? '' : 'Yetkili olduğunuz bir uygulama yok.', !r.yollar.length);
  } catch (e) {
    goster('secim'); $('uygulamalar').replaceChildren();
    basliklar('GİRİŞ YAPILDI', 'Devam edilemedi.', user.email);
    durum(e.message, true);
  }
}

// Adres ilk cevapta gelir (tek istek, 03.10.2026); köprüye ikinci kez gidilmez. Menü (?menu=…) burada eklenir.
function ac(user, y) {
  if (y.kabuk) return kabukAc(user, y);
  if (!y.adres) { durum(y.ad + ' henüz açık değil.', true); return; }
  durum(y.ad + ' açılıyor…');
  const m = MENU.replace(/[^A-Za-z0-9_-]/g, '');
  const c = document.createElement('iframe');
  c.id = 'uygulama-cercevesi'; c.title = y.ad; c.setAttribute('credentialless', ''); c.allow = 'clipboard-read; clipboard-write; fullscreen';
  c.src = y.adres + (m ? '&menu=' + encodeURIComponent(m) : '');
  document.body.append(c); $('kapi').hidden = true;
  document.title = 'REP İstanbul · ' + y.ad;
}

// --- Kabuk (kullanıcı kararı 03.10.2026): hedef adresi olmayan yol menüyle açılır. Menü köprüden (Rep_Menu), her basamak kendi başına çalışan
// bir modülü çerçevede açar; köprü açılışta tek kullanımlık bilet verir. Modül menüyü değiştirince ({ rep: 'menuYenile' }) menü yeniden okunur.
let kabuk = null;
async function kabukMenu(tazele) {
  const r = await kopru({ islem: 'menu', idToken: await kabuk.user.getIdToken(), yol: kabuk.yol.id, tazele: tazele === true });
  kabuk.menu = r.menu;
  $('kb-kisi').textContent = r.ad || kabuk.user.email;
  const derinlik = (m, n = 0) => { const u = r.menu.find(x => x.id === m.ust); return u && n < 6 ? derinlik(u, n + 1) : n; };
  // Alt basamak üstünün hemen altında dursun: köprünün sırası korunur, çocuklar ebeveynin ardına dizilir
  const sirali = [], ekle = (ust) => r.menu.filter(m => (m.ust || '') === ust).forEach(m => { sirali.push(m); ekle(m.id); });
  ekle(''); r.menu.forEach(m => { if (!sirali.includes(m)) sirali.push(m); });
  $('kb-liste').replaceChildren(...sirali.map(m => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'kb-basamak'; b.dataset.id = m.id; b.disabled = !m.acik;
    b.style.paddingLeft = (16 + derinlik(m) * 16) + 'px'; b.textContent = m.ad; b.title = m.acik ? m.ad : m.ad + ' (henüz bir modüle bağlı değil)';
    if (m.id === kabuk.secili) b.classList.add('secili');
    if (m.acik) b.addEventListener('click', () => kabukBasamak(m.id));
    return b;
  }));
  $('kb-bos').textContent = r.menu.length ? 'Menüden bir basamak seçin.' : 'Bu uygulamanın menüsünde henüz basamak yok.';
}
async function kabukBasamak(id) {
  const m = (kabuk.menu || []).find(x => x.id === id);
  if (!m || !m.acik) return;
  kabuk.secili = id;
  document.querySelectorAll('.kb-basamak').forEach(b => b.classList.toggle('secili', b.dataset.id === id));
  $('kb-durum').textContent = m.ad + ' açılıyor…'; $('kb-durum').classList.remove('hata');
  try {
    const r = await kopru({ islem: 'menuAc', idToken: await kabuk.user.getIdToken(), yol: kabuk.yol.id, menu: id });
    if (kabuk.secili !== id) return; // bu arada başka basamak seçildi
    const c = $('kb-cerceve'); c.title = r.ad; c.src = r.adres; c.hidden = false; $('kb-bos').hidden = true;
    $('kb-durum').textContent = ''; document.title = 'REP İstanbul · ' + r.ad;
  } catch (e) { $('kb-durum').textContent = e.message; $('kb-durum').classList.add('hata'); }
}
async function kabukAc(user, y) {
  kabuk = { user, yol: y, menu: [], secili: '' };
  const k = document.createElement('div'); k.id = 'kabuk';
  k.innerHTML = '<aside class="kb-menu"><div class="kb-marka">rep<i>.</i><small></small></div><nav id="kb-liste" aria-label="Menü"></nav>' +
    '<div class="kb-alt"><span id="kb-kisi"></span><button type="button" class="metin-dugme" id="kb-cikis">Çıkış</button></div></aside>' +
    '<main class="kb-govde"><div id="kb-durum" role="status" aria-live="polite"></div><div id="kb-bos">Menü okunuyor…</div>' +
    '<iframe id="kb-cerceve" hidden credentialless allow="clipboard-read; clipboard-write; fullscreen"></iframe></main>';
  k.querySelector('.kb-marka small').textContent = y.ad;
  document.body.append(k); $('kapi').hidden = true; document.title = 'REP İstanbul · ' + y.ad;
  $('kb-cikis').addEventListener('click', () => { signOut(auth); location.reload(); });
  // Modülden gelen haber: yalnız Google'ın uygulama çerçevesinden ve yalnız "menüyü yenile"
  window.addEventListener('message', (e) => {
    let alan = ''; try { alan = new URL(e.origin).hostname; } catch (x) {}
    if (/(^|\.)googleusercontent\.com$/.test(alan) && e.data && e.data.rep === 'menuYenile') kabukMenu(true).catch(() => {});
  });
  try { await kabukMenu(); const m = MENU.replace(/[^A-Za-z0-9_æ-]/g, ''); if (m) kabukBasamak(m); }
  catch (e) { $('kb-bos').textContent = ''; $('kb-durum').textContent = e.message; $('kb-durum').classList.add('hata'); }
}

// Oturum değişince: onaylanmamış e-posta hesabı içeri alınmaz
onAuthStateChanged(auth, (user) => {
  mesgul(false);
  if (!user) { goster('giris'); basliklar('REP’E HOŞ GELDİNİZ', 'İşinize odaklanın.', 'Hesabınızla giriş yapın.'); durum(''); return; }
  const sifreli = user.providerData.some(p => p.providerId === 'password');
  if (sifreli && !user.emailVerified) {
    goster('onay'); basliklar('E-POSTA ONAYI', 'Gelen kutunuza bakın.', user.email);
    durum('Hesabınızı kullanmak için e-postanıza gönderilen onay bağlantısına tıklayın, sonra "Onayladım" deyin.');
    return;
  }
  devam(user);
});

$('google').addEventListener('click', async () => {
  mesgul(true); durum('Google penceresi açılıyor…');
  try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (e) { durum(hataMetni(e), true); mesgul(false); }
});
$('giris').addEventListener('submit', async (ev) => {
  ev.preventDefault(); mesgul(true); durum('Giriş yapılıyor…');
  try { localStorage.setItem(HATIRLA, $('eposta').value.trim()); } catch (e) {}
  try { await signInWithEmailAndPassword(auth, $('eposta').value.trim(), $('sifre').value); $('sifre').value = ''; } catch (e) { durum(hataMetni(e), true); mesgul(false); }
});
$('hesap-ac').addEventListener('click', async () => {
  const eposta = $('eposta').value.trim(), sifre = $('sifre').value;
  if (!eposta || !sifre) { durum('Hesap açmak için e-posta ve şifre yazın, sonra "Hesap oluştur" deyin.', true); return; }
  mesgul(true); durum('Hesap açılıyor…');
  try { const c = await createUserWithEmailAndPassword(auth, eposta, sifre); await sendEmailVerification(c.user); $('sifre').value = ''; }
  catch (e) { durum(hataMetni(e), true); mesgul(false); }
});
$('sifre-unuttum').addEventListener('click', async () => {
  const eposta = $('eposta').value.trim();
  if (!eposta) { durum('Önce e-posta adresinizi yazın.', true); return; }
  try { await sendPasswordResetEmail(auth, eposta); durum('Şifre sıfırlama bağlantısı ' + eposta + ' adresine gönderildi.'); } catch (e) { durum(hataMetni(e), true); }
});
$('onayladim').addEventListener('click', async () => {
  mesgul(true);
  try { await auth.currentUser.reload(); if (auth.currentUser.emailVerified) { await auth.currentUser.getIdToken(true); devam(auth.currentUser); } else { durum('Henüz onaylanmamış görünüyor. Bağlantıya tıkladıktan sonra tekrar deneyin.', true); mesgul(false); } }
  catch (e) { durum(hataMetni(e), true); mesgul(false); }
});
$('tekrar-gonder').addEventListener('click', async () => {
  try { await sendEmailVerification(auth.currentUser); durum('Onay e-postası yeniden gönderildi.'); } catch (e) { durum(hataMetni(e), true); }
});
document.querySelectorAll('.cikis').forEach(b => b.addEventListener('click', () => signOut(auth)));
try { $('eposta').value = localStorage.getItem(HATIRLA) || ''; } catch (e) {}
