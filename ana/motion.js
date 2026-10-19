// Animasyon: dönüş açısı, kullanıcı durdur/başlat, geçici tutmalar (hover, panel), azaltılmış hareket.
window.Rep = window.Rep || {};
(function (R) {
  function Motion(degPerSec) {
    var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    this.reduced = !!(mq && mq.matches);
    this.speed = degPerSec * Math.PI / 180;
    this.cur = 0;
    this.angle = 0;
    this.userRunning = !this.reduced;
    this.holds = {};
    this.listeners = [];
    var self = this;
    if (mq && mq.addEventListener) mq.addEventListener('change', function (e) {
      self.reduced = e.matches;
      self.setRunning(!e.matches);
    });
  }
  Motion.prototype.held = function () { for (var k in this.holds) return true; return false; };
  Motion.prototype.hold = function (key) { this.holds[key] = 1; this.cur = 0; };
  Motion.prototype.release = function (key) { delete this.holds[key]; };
  Motion.prototype.setRunning = function (on) {
    this.userRunning = on;
    this.listeners.forEach(function (f) { f(on); });
  };
  Motion.prototype.onChange = function (f) { this.listeners.push(f); };
  // dt saniye; açı değiştiyse true döner
  Motion.prototype.tick = function (dt) {
    var target = this.userRunning && !this.held() ? this.speed : 0;
    if (this.held()) this.cur = 0;                         // üzerine gelince anında dur
    else this.cur += (target - this.cur) * Math.min(1, dt * (this.reduced ? 20 : 1.6)); // yumuşak kalkış
    if (Math.abs(this.cur) < 1e-5) { this.cur = 0; return false; }
    this.angle += this.cur * dt;
    return true;
  };
  R.Motion = Motion;
})(window.Rep);
