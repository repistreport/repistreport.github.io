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
      const b = document.createElement('button'); b.type = 'button'; b.className = 'uygulama'; b.disabled = !y.acik;
      const k = document.createElement('span'); k.className = 'kod'; k.textContent = y.urlYol;
      const m = document.createElement('span'); const t = document.createElement('b'); t.textContent = y.ad; const s = document.createElement('small'); s.textContent = (y.aciklama ? y.aciklama + ' · ' : '') + 'rep-app.com/' + y.urlYol.toLowerCase();
      m.append(t, s);
      const o = document.createElement('span'); o.className = y.acik ? 'ok' : 'yakinda'; o.textContent = y.acik ? '↗' : 'YAKINDA';
      b.append(k, m, o); if (y.acik) b.addEventListener('click', () => ac(user, y)); return b;
    }));
    goster('secim');
    durum(r.yollar.length ? '' : 'Yetkili olduğunuz bir uygulama yok.', !r.yollar.length);
  } catch (e) {
    goster('secim'); $('uygulamalar').replaceChildren();
    basliklar('GİRİŞ YAPILDI', 'Devam edilemedi.', user.email);
    durum(e.message, true);
  }
}

async function ac(user, y) {
  durum(y.ad + ' açılıyor…'); mesgul(true);
  try {
    const r = await kopru({ islem: 'sec', idToken: await user.getIdToken(), yol: y.id, menu: MENU });
    const c = document.createElement('iframe');
    c.id = 'uygulama-cercevesi'; c.title = r.ad; c.setAttribute('credentialless', ''); c.allow = 'clipboard-read; clipboard-write; fullscreen'; c.src = r.url;
    document.body.append(c); $('kapi').hidden = true;
    document.title = 'REP İstanbul · ' + r.ad;
  } catch (e) { durum(e.message, true); mesgul(false); }
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
