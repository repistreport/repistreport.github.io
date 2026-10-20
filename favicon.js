/* Representer favicon döngüsü — 10 simge, her biri 6 sn: Çizilen halka → Kayıt → Diyafram → Ses dalgası → Işıltı → Oynat → Kıvılcım → Film şeridi → Yörünge → Glitch.
   abrama.app › İç Sistemler › Favicon Evreni. Kaynak: Projects/040_Favicon/motor.js (node favicon.cjs dongu 6 representer).
   Chrome GIF / SVG simge oynatmaz; simge 64×64 tuvale çizilip ~11 kare/sn yenilenir.
   Sekme arka plandayken tarayıcı yenilemeyi saniyede bire düşürür. Hareket azaltma tercihinde simge sabit kalır. */
(function () {
'use strict';
function kutu(c, s, renk) { const r = s * .22; c.beginPath(); c.moveTo(r, 0); c.arcTo(s, 0, s, s, r); c.arcTo(s, s, 0, s, r); c.arcTo(0, s, 0, 0, r); c.arcTo(0, 0, s, 0, r); c.closePath(); c.fillStyle = renk || '#ffffff'; c.fill(); }
function yaprakCiz(c, x, y, boy, en, aci, dolgu, damar) { c.save(); c.translate(x, y); c.rotate(aci); c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(en, -boy * .3, en, -boy * .78, 0, -boy); c.bezierCurveTo(-en, -boy * .78, -en, -boy * .3, 0, 0); c.fillStyle = dolgu; c.fill(); if (damar) { c.beginPath(); c.moveTo(0, -boy * .08); c.lineTo(0, -boy * .86); c.strokeStyle = damar; c.lineWidth = boy * .06; c.lineCap = 'round'; c.stroke(); } c.restore(); }
function kalpCiz(c, x, y, w) { c.beginPath(); c.moveTo(x, y + w * .32); c.bezierCurveTo(x - w * .62, y - w * .12, x - w * .3, y - w * .62, x, y - w * .26); c.bezierCurveTo(x + w * .3, y - w * .62, x + w * .62, y - w * .12, x, y + w * .32); c.fill(); }
function rCiz(c, x, y, boy, renk, kalin) { const k = boy / 18.2, p = new Path2D('M53.6 33.6V15.4h5.5c1.8 0 3.1.4 4 1.2s1.4 1.9 1.4 3.4c0 2.4-1.2 4.2-3.7 5.2l6.1 8.5h-3.2L58.5 26h-2.4v7.7h-2.6Zm2.5-9.6h.8c3.3 0 4.9-1.3 4.9-3.8s-1.4-2.8-4.1-2.8h-1.6v6.7Z'); c.save(); c.translate(x, y); c.scale(k, k); c.translate(-59.6, -24.5); c.fillStyle = renk; c.fill(p); if (kalin) { c.lineJoin = 'round'; c.lineWidth = kalin; c.strokeStyle = renk; c.stroke(p); } c.restore(); }
var SURE = 6, SIMGE = [
  /* Çizilen halka */ function (c, t) {
    const O = '#ff5e00', e = Math.min(1, (t % 3.4) / 1.8), a = -Math.PI / 2; c.lineCap = 'round';
    c.strokeStyle = 'rgba(255,94,0,.22)'; c.lineWidth = 4.5; c.beginPath(); c.arc(32, 32, 24, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = O; c.beginPath(); c.arc(32, 32, 24, a, a + Math.PI * 2 * (1 - (1 - e) ** 3)); c.stroke(); rCiz(c, 32, 32, 29, O, 1.3); },
  /* Kayıt */ function (c, t) {
    const O = '#ff5e00', n = .5 + .5 * Math.sin(t * 4.2); c.strokeStyle = O; c.lineWidth = 4.5; c.beginPath(); c.arc(30, 34, 22, 0, Math.PI * 2); c.stroke(); rCiz(c, 30, 34, 26, O, 1.3);
    c.fillStyle = '#0b0b0b'; c.beginPath(); c.arc(51, 13, 10, 0, Math.PI * 2); c.fill(); c.fillStyle = 'rgba(255,40,30,' + (.25 * n).toFixed(2) + ')'; c.beginPath(); c.arc(51, 13, 9, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,45,30,' + (.35 + .65 * n).toFixed(2) + ')'; c.beginPath(); c.arc(51, 13, 6, 0, Math.PI * 2); c.fill(); },
  /* Diyafram */ function (c, t) {
    const O = '#ff5e00', Z = '#0b0b0b', h = 8 + 7 * (.5 + .5 * Math.sin(t * 1.7)), d = t * .45, v = [];
    for (let i = 0; i < 6; i++) { const a = d + i * Math.PI / 3; v.push([32 + h * Math.cos(a), 32 + h * Math.sin(a)]); }
    c.save(); c.beginPath(); c.arc(32, 32, 26, 0, Math.PI * 2); c.fillStyle = O; c.fill(); c.clip(); c.strokeStyle = Z; c.lineWidth = 2.4;
    for (let i = 0; i < 6; i++) { const [x1, y1] = v[i], [x2, y2] = v[(i + 1) % 6], L = Math.hypot(x2 - x1, y2 - y1); c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 + (x2 - x1) / L * 44, y1 + (y2 - y1) / L * 44); c.stroke(); }
    c.fillStyle = Z; c.beginPath(); v.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill(); c.restore();
    c.fillStyle = O; c.beginPath(); c.arc(32, 32, 2.2, 0, Math.PI * 2); c.fill(); },
  /* Ses dalgası */ function (c, t) {
    c.lineCap = 'round'; c.lineWidth = 7; c.strokeStyle = '#ff5e00';
    for (let i = 0; i < 5; i++) { const x = 12 + i * 10, y = 4 + 15 * (.5 + .5 * Math.sin(t * (4 + i * .9) + i * 1.7)) * (i === 2 ? 1.15 : i % 2 ? .95 : .7) + 2; c.beginPath(); c.moveTo(x, 32 - y); c.lineTo(x, 32 + y); c.stroke(); } },
  /* Işıltı */ function (c, t) {
    const x = ((t * .5) % 1.7 - .35) * 64, g = c.createLinearGradient(x - 14, x - 30, x + 14, x - 2); g.addColorStop(0, '#ff5e00'); g.addColorStop(.5, '#ffe0c8'); g.addColorStop(1, '#ff5e00');
    c.strokeStyle = g; c.lineWidth = 4.5; c.beginPath(); c.arc(32, 32, 24, 0, Math.PI * 2); c.stroke(); rCiz(c, 32, 32, 29, g, 1.3); },
  /* Oynat */ function (c, t) {
    for (let k = 0; k < 2; k++) { const p = (t * .55 + k / 2) % 1; c.strokeStyle = 'rgba(255,94,0,' + ((1 - p) * .85).toFixed(2) + ')'; c.lineWidth = 3; c.beginPath(); c.arc(32, 32, 15 + p * 14, 0, Math.PI * 2); c.stroke(); }
    const s = 1 + .06 * Math.sin(t * 3); c.save(); c.translate(34, 32); c.scale(s, s); c.beginPath(); c.moveTo(-9, -12); c.lineTo(-9, 12); c.lineTo(12, 0); c.closePath(); c.lineJoin = 'round'; c.lineWidth = 5; c.strokeStyle = c.fillStyle = '#ff5e00'; c.stroke(); c.fill(); c.restore(); },
  /* Kıvılcım */ function (c, t) {
    const yildiz = (x, y, r, a, renk) => { c.save(); c.translate(x, y); c.rotate(a); c.beginPath(); c.moveTo(0, -r); for (let i = 1; i <= 4; i++) { const b = i * Math.PI / 2; c.quadraticCurveTo(0, 0, Math.sin(b) * r, -Math.cos(b) * r); } c.fillStyle = renk; c.fill(); c.restore(); };
    yildiz(28, 36, 23 * (.88 + .12 * Math.sin(t * 2.6)), Math.sin(t * .9) * .35, '#ff5e00');
    const p1 = .5 + .5 * Math.sin(t * 3.4), p2 = .5 + .5 * Math.sin(t * 3.4 + 2.2); yildiz(51, 13, 4 + 6 * p1, 0, '#ffb27f'); yildiz(52, 46, 2 + 4 * p2, .4, '#ff5e00'); },
  /* Film şeridi */ function (c, t) {
    const kay = (t * 22) % 18; c.save(); c.beginPath(); c.rect(13, 4, 38, 56); c.clip(); c.fillStyle = '#ff5e00'; c.fillRect(13, 4, 38, 56); c.fillStyle = '#0b0b0b';
    for (let y = -18; y < 70; y += 9) { c.fillRect(16, y + kay % 9, 4, 5); c.fillRect(44, y + kay % 9, 4, 5); }
    for (let y = -18; y < 70; y += 18) c.fillRect(24, y + kay + 2, 16, 13); c.restore(); },
  /* Yörünge */ function (c, t) {
    const a = t * 1.8, ex = Math.cos(a) * 27, ey = Math.sin(a) * 9, q = -.45, x = 32 + ex * Math.cos(q) - ey * Math.sin(q), y = 32 + ex * Math.sin(q) + ey * Math.cos(q), on = Math.sin(a) > 0;
    const uydu = () => { c.fillStyle = '#ffb27f'; c.beginPath(); c.arc(x, y, on ? 5 : 3.4, 0, Math.PI * 2); c.fill(); };
    c.save(); c.translate(32, 32); c.rotate(q); c.strokeStyle = 'rgba(255,94,0,.45)'; c.lineWidth = 1.8; c.beginPath(); c.ellipse(0, 0, 27, 9, 0, 0, Math.PI * 2); c.stroke(); c.restore();
    if (!on) uydu(); rCiz(c, 32, 32, 34, '#ff5e00', 1.4); if (on) uydu(); },
  /* Glitch */ function (c, t) {
    const p = t % 1.9, g = p < .32, ciz1 = (dx, renk) => { c.strokeStyle = renk; c.lineWidth = 4.5; c.beginPath(); c.arc(32 + dx, 32, 24, 0, Math.PI * 2); c.stroke(); rCiz(c, 32 + dx, 32, 29, renk, 1.3); };
    if (!g) { ciz1(0, '#ff5e00'); return; } const j = 1.5 + 2 * Math.abs(Math.sin(t * 61));
    c.globalCompositeOperation = 'lighter'; ciz1(-j, '#00c8ff'); ciz1(j, '#ff1f5a'); c.globalCompositeOperation = 'source-over';
    for (let b = 0; b < 4; b++) { c.save(); c.beginPath(); c.rect(0, b * 16, 64, 16); c.clip(); ciz1(Math.sin(t * 73 + b * 2.1) * 3, '#ff5e00'); c.restore(); } }
];
var tuval = document.createElement('canvas'); tuval.width = tuval.height = 64;
var c = tuval.getContext('2d'), t0 = performance.now(), bag = document.querySelector('link[rel~="icon"]');
if (!bag) { bag = document.createElement('link'); bag.rel = 'icon'; document.head.appendChild(bag); }
bag.type = 'image/png';
function yenile() { var i = Math.floor(Date.now() / 1000 / SURE) % SIMGE.length; c.save(); c.clearRect(0, 0, 64, 64); kutu(c, 64, '#0b0b0b'); SIMGE[i](c, (performance.now() - t0) / 1000); c.restore(); bag.href = tuval.toDataURL('image/png'); }
yenile(); setInterval(yenile, matchMedia('(prefers-reduced-motion: reduce)').matches ? 1000 : 90);
})();
