// Giriş kapısı: data-rep-logo taşıyan yerlere Representer logosu (kullanıcı isteği 20.10.2026). Tek kaynak ana/logo.js; ondan sonra, defer ile yüklenir.
document.querySelectorAll('[data-rep-logo]').forEach(function (el) { el.insertAdjacentHTML('afterbegin', Rep.logo.svg); });
