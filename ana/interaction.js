// Etkileşim: fare / dokunma / klavye ile uydu açma-kapama, içerik paneli, üst düğmeler.
window.Rep = window.Rep || {};
(function (R) {
  var cfg = R.config, app = R.app, motion = app.motion;
  var timer = null, pinned = false, quietFocus = false;

  function cancel() { clearTimeout(timer); timer = null; }
  function open(pl, how) {
    cancel();
    if (app.active === pl) { if (how === 'pin') pinned = true; return; }
    if (app.active) app.hideSats(app.active);
    app.active = pl;
    pinned = how === 'pin';
    motion.hold('active');
    app.showSats(pl);
  }
  function close() {
    cancel();
    if (!app.active) return;
    app.hideSats(app.active);
    app.active = null;
    pinned = false;
    motion.release('active');
  }
  function later(ms) { cancel(); timer = setTimeout(close, ms); }
  function focusQuiet(el) { quietFocus = true; el.focus(); quietFocus = false; }
  function keyboardFocusInside(g) { try { return !!g.querySelector(':focus-visible'); } catch (e) { return false; } }

  app.planets.forEach(function (pl) {
    var g = pl.group;
    g.addEventListener('pointerenter', function (e) {
      if (e.pointerType === 'touch' || panel.isOpen()) return;
      open(pl, 'hover');
    });
    g.addEventListener('pointerleave', function (e) {
      if (e.pointerType === 'touch') return;
      if (app.active === pl && !pinned && !keyboardFocusInside(g)) later(cfg.motion.closeDelayMs);
    });
    g.addEventListener('focusin', function (e) {
      if (quietFocus) return;
      var kb = false; try { kb = e.target.matches(':focus-visible'); } catch (x) {}
      if (kb) open(pl, 'focus'); else cancel();
    });
    g.addEventListener('focusout', function (e) {
      if (g.contains(e.relatedTarget) || panel.isOpen()) return;
      if (app.active === pl && !pinned && !g.matches(':hover')) later(150);
    });
    // Tıklama / dokunma / Enter: aç ve sabitle; sabitliyse kapat
    pl.btn.addEventListener('click', function () {
      if (app.active === pl && pinned) close(); else open(pl, 'pin');
    });
    pl.satBtns.forEach(function (b, i) {
      b.addEventListener('click', function () {
        pinned = true;
        panel.showSatellite(pl.cfg, pl.cfg.satellites[i], b);
      });
    });
  });

  // Boşluğa dokunma / tıklama kapatır
  document.addEventListener('pointerdown', function (e) {
    if (!app.active || panel.isOpen()) return;
    if (e.target.closest('.pg') || e.target.closest('.top')) return;
    close();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (panel.isOpen()) { panel.close(); return; }
    if (app.active) { var b = app.active.btn; close(); focusQuiet(b); }
  });

  // ---- İçerik paneli ----
  var panel = (function () {
    var el = document.getElementById('panel');
    var crumb = el.querySelector('.panel-crumb'), title = el.querySelector('#panel-title');
    var body = el.querySelector('.panel-body'), nav = el.querySelector('.panel-nav ul');
    var opener = null;

    function render(planet, sat) {
      crumb.textContent = sat ? planet.name : cfg.brand.name;
      title.textContent = sat ? sat.name : planet.name;
      if (sat) {
        body.innerHTML = '';
        if (sat.content) body.innerHTML = sat.content;
        else body.innerHTML = '<p class="empty">İçerik eklenecek.</p>';
      } else body.innerHTML = '';
      nav.innerHTML = planet.satellites.map(function (s) {
        return '<li><button type="button" data-sid="' + s.id + '"' + (sat && s.id === sat.id ? ' aria-current="true"' : '') + '><i class="dot" aria-hidden="true"></i>' + s.name + '</button></li>';
      }).join('');
      [].forEach.call(nav.querySelectorAll('button'), function (b, i) {
        b.addEventListener('click', function () { render(planet, planet.satellites[i]); title.focus(); });
      });
    }
    function show(planet, sat, from) {
      opener = from || document.activeElement;
      render(planet, sat);
      el.hidden = false;
      requestAnimationFrame(function () { el.classList.add('on'); });
      motion.hold('panel');
      document.body.classList.add('panel-open');
      title.focus();
    }
    function close() {
      el.classList.remove('on');
      el.hidden = true;
      motion.release('panel');
      document.body.classList.remove('panel-open');
      if (opener && opener.isConnected && opener.offsetParent !== null) focusQuiet(opener);
      opener = null;
    }
    el.querySelector('.panel-close').addEventListener('click', close);
    el.querySelector('.panel-backdrop').addEventListener('click', close);
    // Odak panelin içinde dolaşsın
    el.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = [].filter.call(el.querySelectorAll('button,[tabindex="-1"]'), function (x) { return x.offsetParent !== null; });
      f = f.filter(function (x) { return x.tagName === 'BUTTON'; });
      if (!f.length) return;
      var first = f[0], lastB = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === title)) { e.preventDefault(); lastB.focus(); }
      else if (!e.shiftKey && document.activeElement === lastB) { e.preventDefault(); first.focus(); }
    });
    return {
      isOpen: function () { return !el.hidden; },
      showSatellite: function (p, s, from) { show(p, s, from); },
      showPlanet: function (p, from) { show(p, null, from); },
      close: close
    };
  })();

  // ---- Üst düğmeler ----
  var works = cfg.planets.filter(function (p) { return p.id === cfg.worksPlanetId; })[0];
  var bw = document.getElementById('btn-works');
  if (works) { bw.textContent = works.name; bw.addEventListener('click', function () { close(); panel.showPlanet(works, bw); }); }
  else bw.hidden = true;

  document.getElementById('top-links').innerHTML = (cfg.topLinks || []).map(function (l) {
    return '<a class="top-btn top-link" href="' + l.href + '">' + l.name + '</a>';
  }).join('');

  var bm = document.getElementById('btn-motion');
  function syncMotion() {
    var on = motion.userRunning;
    bm.setAttribute('aria-pressed', on ? 'false' : 'true');
    bm.querySelector('.txt').textContent = on ? 'Hareketi durdur' : 'Hareketi başlat';
    bm.setAttribute('aria-label', on ? 'Hareketi durdur' : 'Hareketi başlat');
    bm.dataset.state = on ? 'on' : 'off';
  }
  bm.addEventListener('click', function () { motion.setRunning(!motion.userRunning); });
  motion.onChange(syncMotion);
  syncMotion();

  R.interaction = { open: function (id) { var pl = app.planets.filter(function (p) { return p.cfg.id === id; })[0]; if (pl) open(pl, 'pin'); }, close: close, panel: panel };
})(window.Rep);
