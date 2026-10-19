// Yerleşim hesapları (saf işlevler): ekran ölçüsünden yörünge, logo, etiket ve uydu konumları.
window.Rep = window.Rep || {};
(function (R) {
  function rect(x, y, w, h) { return { x: x, y: y, w: w, h: h }; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function overlap(a, b) {
    var ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    var oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    return ox > 0 && oy > 0 ? ox * oy : 0;
  }
  function overflow(r, b) {
    return Math.max(0, b.x - r.x) + Math.max(0, r.x + r.w - b.x - b.w) +
           Math.max(0, b.y - r.y) + Math.max(0, r.y + r.h - b.y - b.h);
  }
  function clampInto(r, b) {
    return rect(clamp(r.x, b.x, b.x + b.w - r.w), clamp(r.y, b.y, b.y + b.h - r.h), r.w, r.h);
  }
  function inflate(r, p) { return rect(r.x - p, r.y - p, r.w + 2 * p, r.h + 2 * p); }
  function circleRect(p, r) { return rect(p.x - r, p.y - r, 2 * r, 2 * r); }
  // a→b doğru parçası r kutusundan geçiyor mu (örnekleyerek)
  function segHits(a, b, r) {
    for (var t = 0; t <= 1; t += 0.04) {
      var x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
      if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) return true;
    }
    return false;
  }

  // Sahne ölçüleri. view: {W,H,top}; m: {labelW,labelH} (en geniş etiket, ölçülmüş)
  function compute(view, m) {
    var W = view.W, H = view.H;
    var narrow = W < 640;
    var margin = narrow ? 10 : clamp(W * 0.022, 18, 36);
    var bounds = rect(margin, view.top + 6, W - 2 * margin, H - view.top - 6 - margin);
    var cx = W / 2, cy = bounds.y + bounds.h / 2;
    var iconR = narrow ? 19 : clamp(Math.min(W, H) * 0.026, 21, 28);
    var logoW = narrow ? clamp(W * 0.4, 124, 170) : clamp(Math.min(W * 0.19, H * 0.3), 170, 280);
    var gap = 16;

    function logoH(w) { return w * 49 / 181 + w * (10 / 159) * 1.2 + w * 0.02; }

    var reserveX = narrow ? m.labelW / 2 + 2 : m.labelW + 10;
    var reserveY = m.labelH + 10;
    var rx, ry, lh, guard = 0;
    for (;;) {
      lh = logoH(logoW);
      rx = bounds.w / 2 - iconR - reserveX;
      ry = bounds.h / 2 - iconR - reserveY;
      var minRx = logoW / 2 + iconR + gap, minRy = lh / 2 + iconR + gap;
      rx = Math.max(rx, minRx);
      ry = Math.max(ry, minRy);
      rx = Math.min(rx, ry * 2.3);
      ry = Math.min(ry, rx * 2.2);
      // Logonun köşeleri (gezegen yarıçapı + boşlukla) elipsin içinde kalmalı
      var k = Math.pow((logoW / 2 + iconR + gap) / rx, 2) + Math.pow((lh / 2 + iconR + gap) / ry, 2);
      if (k <= 1 || logoW <= 100 || ++guard > 40) break;
      logoW *= 0.96;
    }
    return {
      W: W, H: H, narrow: narrow, bounds: bounds, cx: cx, cy: cy, rx: rx, ry: ry,
      iconR: iconR, logoW: logoW, logoRect: rect(cx - logoW / 2, cy - lh / 2, logoW, lh),
      rowH: narrow ? 38 : 30
    };
  }

  // i. gezegenin konumu ve elipsin dışa bakan normali
  function planetAt(L, angle, i, n) {
    var t = angle + i * 2 * Math.PI / n - Math.PI / 2;
    var c = Math.cos(t), s = Math.sin(t);
    var nx = c / L.rx, ny = s / L.ry, nl = Math.hypot(nx, ny);
    return { x: L.cx + L.rx * c, y: L.cy + L.ry * s, nx: nx / nl, ny: ny / nl, depth: (s + 1) / 2 };
  }

  // Normalden sapma adayları, 5° adımla (ince adım + süreklilik puanı = etiket akar, sıçramaz)
  var LABEL_OFFS = [0];
  for (var so = 5; so <= 85; so += 5) LABEL_OFFS.push(so, -so);

  // Etiket: yörüngenin dışına doğru; ekrana sığan, hiçbir şeyi örtmeyen, normale en yakın aday.
  // Dönüş: { dx, dy, o, align } — gezegen merkezine göre kutu sol-üst ofseti.
  function placeLabel(L, p, size, obstacles, prevO) {
    var base = Math.atan2(p.ny, p.nx), best = null, prev = null;
    var own = inflate(circleRect(p, L.iconR), 3);
    for (var k = 0; k < LABEL_OFFS.length; k++) {
      var o = LABEL_OFFS[k], a = base + o * Math.PI / 180;
      var dx = Math.cos(a), dy = Math.sin(a), g = L.iconR + 8;
      // Sürekli yerleşim (zıplamasın): kutunun merkezi d yönünde t kadar uzakta; t, kutunun gezegenin g yarıçaplı karesine
      // değmediği en küçük uzaklık. Açıyla sürekli değişir (eşik yok) ve hiçbir açıda kendi gezegenine girmez.
      var t = Math.min(Math.abs(dx) > 1e-6 ? (size.w / 2 + g) / Math.abs(dx) : Infinity, Math.abs(dy) > 1e-6 ? (size.h / 2 + g) / Math.abs(dy) : Infinity);
      var x = p.x + dx * t - size.w / 2, y = p.y + dy * t - size.h / 2;
      var r0 = rect(x, y, size.w, size.h);
      var r = clampInto(r0, L.bounds);
      var lx = r.x + r.w / 2 - p.x, ly = r.y + r.h / 2 - p.y;
      var dot = (lx * p.nx + ly * p.ny) / (Math.hypot(lx, ly) || 1);
      var s = Math.abs(o) * 0.4 + overflow(r0, L.bounds) * 0.6 + overlap(r, own) * 60;
      if (prevO != null) s += Math.abs(o - prevO) * 0.5;   // süreklilik: öncekine yakın aday tercih edilir
      if (dot < -0.05) s += 5000;            // merkeze bakan tarafa asla
      for (var j = 0; j < obstacles.length; j++) s += overlap(r, obstacles[j]) * 30;
      var c = { dx: r.x - p.x, dy: r.y - p.y, o: o, s: s, rect: r };
      if (!best || s < best.s) best = c;
      if (o === prevO) prev = c;
    }
    return prev && prev.s <= best.s + 2 ? prev : best;   // titremesin diye küçük eşik
  }

  // Uydu sütunu: gezegenin yanında/üstünde/altında; ekran dışına taşmaz.
  // hard: asla örtülmeyecekler (logo, kendi etiketi); soft: diğer gezegen ve etiketler.
  function placeSatellites(L, p, size, hard, soft) {
    var pad = L.iconR + 30, out = [], cands = [];
    var sides = [['R', 1], ['L', -1]];
    sides.forEach(function (sd) {
      [0.5, 0.2, 0.8, 0, 1].forEach(function (f) {
        var x = sd[1] > 0 ? p.x + pad : p.x - pad - size.w;
        cands.push({ side: sd[0], r: rect(x, p.y - size.h * f, size.w, size.h), pref: sd[1] * p.nx > 0 ? 0 : 25 });
      });
    });
    [['U', -1], ['D', 1]].forEach(function (sd) {
      [0.5, 0.15, 0.85].forEach(function (f) {
        var y = sd[1] > 0 ? p.y + pad : p.y - pad - size.h;
        cands.push({ side: sd[0], r: rect(p.x - size.w * f, y, size.w, size.h), pref: sd[1] * p.ny > 0 ? 10 : 35 });
      });
    });
    var ownC = inflate(circleRect(p, L.iconR), 10);
    cands.forEach(function (c) {
      var r = clampInto(c.r, L.bounds);
      var s = c.pref + overflow(c.r, L.bounds) * 0.3 + overlap(r, ownC) * 1000, so = 0;
      hard.forEach(function (h) { s += overlap(r, h) * 1000; });
      soft.forEach(function (h) { so += overlap(r, h); });
      out.push({ side: c.side, rect: r, s: s + so * 40, hardS: s, soft: so });
    });
    out.sort(function (a, b) { return a.s - b.s; });
    if (out[0].hardS >= 1000) {
      // Yanında yer yok (dar ekran): sahnede gezegene en yakın boş yeri ara
      var b = L.bounds, step = 8;
      for (var y = b.y; y + size.h <= b.y + b.h; y += step) {
        for (var x = b.x; x + size.w <= b.x + b.w; x += step) {
          var r = rect(x, y, size.w, size.h), s = overlap(r, ownC) * 1000;
          hard.forEach(function (h) { s += overlap(r, h) * 1000; });
          var cxr = x + size.w / 2 - p.x, cyr = y + size.h / 2 - p.y;
          s += Math.hypot(cxr, cyr) * 0.05;
          hard.forEach(function (h) { if (segHits(p, { x: x + size.w / 2, y: y + size.h / 2 }, h)) s += 400; });
          if (s < out[0].hardS) out.unshift({ side: x + size.w / 2 < p.x ? 'L' : 'R', rect: r, s: s + 1e6, hardS: s, soft: 1 });
        }
      }
    }
    var best = out[0];
    if (best.soft > 0) {
      // Çakışmasız yer yoksa odak düzeni: diğer gezegenler soluklaşır, yalnız sert engeller sayılır
      out.sort(function (a, b) { return a.hardS - b.hardS; });
      best = out[0];
      best.focus = true;
    }
    return best;
  }

  R.layout = { rect: rect, overlap: overlap, overflow: overflow, inflate: inflate, circleRect: circleRect,
               compute: compute, planetAt: planetAt, placeLabel: placeLabel, placeSatellites: placeSatellites };
})(window.Rep);
