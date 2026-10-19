// Sahne: config'ten DOM üretir, her karede konumları layout'tan alıp çizer.
// Hareket motion.js'te, olaylar interaction.js'te. Burada gezegen adı / sayısı geçmez.
window.Rep = window.Rep || {};
(function (R) {
  var cfg = R.config, L = R.layout;
  var NS = 'http://www.w3.org/2000/svg';
  var root = document.documentElement;
  var stage = document.getElementById('stage');
  var orbitSvg = document.getElementById('orbits');
  var linkSvg = document.getElementById('links');
  var logoEl = document.getElementById('logo');
  var topEl = document.getElementById('top');
  var motion = new R.Motion(cfg.motion.degPerSec);

  var LO = null, dirty = true, planets = [];

  R.logo.mount(logoEl);

  // ---- DOM üretimi (config'ten) ----
  cfg.planets.forEach(function (pc, i) {
    var g = document.createElement('div');
    g.className = 'pg';
    g.dataset.id = pc.id;
    var satId = 'sat-' + pc.id;
    g.innerHTML =
      '<button class="planet" type="button" aria-expanded="false" aria-controls="' + satId + '" aria-label="' + pc.name + '">' +
        R.iconSvg(pc.icon) + '</button>' +
      '<span class="plabel" aria-hidden="true">' + pc.name + '</span>' +
      '<ul class="sats" id="' + satId + '" aria-label="' + pc.name + '">' +
        pc.satellites.map(function (s) {
          return '<li><button class="sat" type="button" data-sid="' + s.id + '"><i class="dot" aria-hidden="true"></i><span>' + s.name + '</span></button></li>';
        }).join('') +
      '</ul>';
    stage.appendChild(g);
    planets.push({
      i: i, cfg: pc, group: g,
      btn: g.querySelector('.planet'), label: g.querySelector('.plabel'),
      sats: g.querySelector('.sats'), satBtns: [].slice.call(g.querySelectorAll('.sat')),
      pos: null, lab: { o: null, cdx: null, cdy: null }, labSize: null, satSize: null, place: null
    });
  });

  // ---- Ölçüm ve yerleşim ----
  function measure() {
    var mw = 0, mh = 0;
    planets.forEach(function (pl) {
      pl.labSize = { w: pl.label.offsetWidth, h: pl.label.offsetHeight };
      mw = Math.max(mw, pl.labSize.w); mh = Math.max(mh, pl.labSize.h);
      pl.satSize = { w: pl.sats.offsetWidth, h: pl.sats.offsetHeight };
    });
    return { labelW: mw, labelH: mh };
  }

  function relayout() {
    var W = root.clientWidth, H = window.innerHeight;
    root.classList.toggle('narrow', W < 640);
    var m = measure();
    LO = L.compute({ W: W, H: H, top: topEl.offsetHeight }, m);
    stage.style.setProperty('--r', LO.iconR + 'px');
    stage.style.setProperty('--row', LO.rowH + 'px');
    R.logo.size(logoEl, LO.logoW);
    var lr = logoEl.getBoundingClientRect();
    logoEl.style.transform = 'translate3d(' + (LO.cx - lr.width / 2) + 'px,' + (LO.cy - lr.height / 2) + 'px,0)';
    LO.logoRect = L.rect(LO.cx - lr.width / 2, LO.cy - lr.height / 2, lr.width, lr.height);
    // satır yüksekliği değişmiş olabilir
    planets.forEach(function (pl) { pl.satSize = { w: pl.sats.offsetWidth, h: pl.sats.offsetHeight }; pl.lab.cdx = null; });
    drawOrbits();
    dirty = true;
    positionAll(1);
    if (api.active) showSats(api.active);
  }

  function drawOrbits() {
    orbitSvg.setAttribute('viewBox', '0 0 ' + LO.W + ' ' + LO.H);
    var inner = 0.58;
    var lw = LO.logoRect.w / 2 + 14, lh = LO.logoRect.h / 2 + 14;
    var showInner = Math.pow(lw / (LO.rx * inner), 2) + Math.pow(lh / (LO.ry * inner), 2) < 1;
    orbitSvg.innerHTML =
      '<ellipse class="orbit" cx="' + LO.cx + '" cy="' + LO.cy + '" rx="' + LO.rx + '" ry="' + LO.ry + '"/>' +
      (showInner ? '<ellipse class="orbit faint" cx="' + LO.cx + '" cy="' + LO.cy + '" rx="' + LO.rx * inner + '" ry="' + LO.ry * inner + '"/>' : '');
  }

  // Bütün gezegen + etiket konumları. k: etiket geçiş yumuşatma katsayısı (1 = anında)
  function positionAll(k) {
    var n = planets.length, obstacles = [L.inflate(LO.logoRect, 6)];
    planets.forEach(function (pl) {
      pl.pos = L.planetAt(LO, motion.angle, pl.i, n);
      obstacles.push(L.inflate(L.circleRect(pl.pos, LO.iconR), 4));
    });
    var settling = false;
    planets.forEach(function (pl) {
      var p = pl.pos;
      var c = L.placeLabel(LO, p, pl.labSize, obstacles, pl.lab.o);
      obstacles.push(L.inflate(c.rect, 3));
      var lab = pl.lab;
      lab.o = c.o; lab.dx = c.dx; lab.dy = c.dy; lab.rect = c.rect;
      if (lab.cdx === null || k >= 1) { lab.cdx = c.dx; lab.cdy = c.dy; }
      else { lab.cdx += (c.dx - lab.cdx) * k; lab.cdy += (c.dy - lab.cdy) * k; }
      if (Math.abs(lab.cdx - c.dx) + Math.abs(lab.cdy - c.dy) > 0.4) settling = true;
      if (pl.label.dataset.align !== c.align) pl.label.dataset.align = c.align;
      pl.btn.style.transform = 'translate3d(' + (p.x - LO.iconR) + 'px,' + (p.y - LO.iconR) + 'px,0)';
      pl.btn.style.opacity = (0.72 + 0.28 * p.depth).toFixed(3);
      pl.label.style.transform = 'translate3d(' + (p.x + lab.cdx) + 'px,' + (p.y + lab.cdy) + 'px,0)';
    });
    return settling;
  }

  // ---- Uydular ----
  function showSats(pl) {
    var others = [];
    planets.forEach(function (q) {
      if (q === pl) return;
      others.push(L.inflate(L.circleRect(q.pos, LO.iconR), 6));
      others.push(L.inflate(q.lab.rect, 4));
    });
    var hard = [L.inflate(LO.logoRect, 8), L.inflate(pl.lab.rect, 4)];
    var pl8 = L.placeSatellites(LO, pl.pos, pl.satSize, hard, others);
    pl.place = pl8;
    var r = pl8.rect;
    pl.sats.dataset.side = pl8.side;
    pl.sats.style.transform = 'translate3d(' + r.x + 'px,' + r.y + 'px,0)';
    stage.classList.toggle('focus', !!pl8.focus);
    pl.group.classList.add('open');
    pl.btn.setAttribute('aria-expanded', 'true');
    drawLinks(pl);
  }
  function hideSats(pl) {
    pl.group.classList.remove('open');
    pl.btn.setAttribute('aria-expanded', 'false');
    stage.classList.remove('focus');
    linkSvg.innerHTML = '';
  }
  function drawLinks(pl) {
    var p = pl.pos, r = pl.place.rect, side = pl.place.side, h = LO.rowH;
    linkSvg.setAttribute('viewBox', '0 0 ' + LO.W + ' ' + LO.H);
    var d = pl.satBtns.map(function (b, i) {
      var dx = side === 'L' ? r.x + r.w - 9 : r.x + 9;
      var dy = r.y + i * h + h / 2;
      var ang = Math.atan2(dy - p.y, dx - p.x);
      var sx = p.x + Math.cos(ang) * (LO.iconR + 3), sy = p.y + Math.sin(ang) * (LO.iconR + 3);
      var path;
      if (side === 'L' || side === 'R') { var mx = (sx + dx) / 2; path = 'M' + sx + ' ' + sy + 'C' + mx + ' ' + sy + ' ' + mx + ' ' + dy + ' ' + (dx + (side === 'L' ? 5 : -5)) + ' ' + dy; }
      else { var my = (sy + dy) / 2; path = 'M' + sx + ' ' + sy + 'C' + sx + ' ' + my + ' ' + (dx - 5) + ' ' + my + ' ' + (dx - 5) + ' ' + dy; }
      return '<path class="link" style="--i:' + i + '" pathLength="1" d="' + path + '"/>';
    }).join('');
    linkSvg.innerHTML = d;
  }

  // ---- Döngü ----
  var last = 0;
  function frame(t) {
    var dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t;
    var moved = motion.tick(dt);
    if (moved || dirty) dirty = positionAll(Math.min(1, dt * 7));
    requestAnimationFrame(frame);
  }

  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(relayout, 60); });

  var api = R.app = {
    planets: planets, motion: motion, active: null,
    showSats: showSats, hideSats: hideSats, relayout: relayout,
    layout: function () { return LO; },
    // Denetim için: açıyı ver, konumları anında oturt
    setAngle: function (a) { motion.angle = a; positionAll(1); }
  };

  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () {
    relayout();
    root.classList.add('ready');
    requestAnimationFrame(frame);
  });
})(window.Rep);
