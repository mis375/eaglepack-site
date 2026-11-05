/* Diwali celebration: greeting bar, string lights, diyas, soft lights and fireworks.
   Turns itself off after END. Add ?festive=on to the address to preview outside the dates. */
(function () {
  var END = Date.parse('2026-11-16T00:00:00+05:30');          // theme ends
  var NOTICE_END = Date.parse('2026-11-12T00:00:00+05:30');   // holiday notice ends
  var force = /[?&]festive=on/.test(location.search);
  var now = Date.now();
  if (!force && now >= END) return;
  try { if (!force && sessionStorage.getItem('festOff') === '1') return; } catch (e) {}
  var showNotice = force || now < NOTICE_END;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var diya = '<svg class="fest-diya" viewBox="0 0 40 32" aria-hidden="true"><path class="fl" d="M20 1C23.5 7 25.5 10.5 23.5 14C22.4 16 17.6 16 16.5 14C14.5 10.5 16.5 7 20 1Z"/><path class="bowl" d="M2 17H38C38 25.5 30.5 30 20 30C9.5 30 2 25.5 2 17Z"/><rect class="base" x="13" y="29" width="14" height="2.4" rx="1.2"/></svg>';

  function bar() {
    document.body.classList.add('fest');
    var b = document.createElement('div');
    b.className = 'fest-bar' + (showNotice ? '' : ' nohol');
    b.setAttribute('role', 'region'); b.setAttribute('aria-label', 'Diwali greeting');
    b.innerHTML = diya + '<div class="msg"><span class="greet"><span class="g-long">Wishing you a bright and joyful Diwali. Team Eagle Pack</span><span class="g-short">Happy Diwali</span></span>' +
      (showNotice ? '<span class="sep"></span><span class="hol">Offices closed 8 to 11 November</span>' : '') + '</div>' +
      '<span class="d2">' + diya + '</span><button class="x" type="button" aria-label="Close greeting">&times;</button><div class="fest-lights"></div>';
    document.body.insertBefore(b, document.body.firstChild);
    b.querySelector('.x').addEventListener('click', function () {
      b.remove(); document.body.classList.remove('fest');
      document.querySelectorAll('.fest-cv,.fest-diyas').forEach(function (n) { n.remove(); });
      try { sessionStorage.setItem('festOff', '1'); } catch (e) {}
    });
    var lights = b.querySelector('.fest-lights'), cols = ['#e9c46a', '#fff4d6', '#8ec5ec', '#f2a65a'];
    function build() {
      lights.innerHTML = '';
      var n = Math.ceil(innerWidth / 54);
      for (var i = 0; i < n; i++) {
        var l = document.createElement('i');
        l.style.left = (i * 54 + 20) + 'px';
        l.style.setProperty('--c', cols[i % cols.length]);
        l.style.animationDelay = (-(i % 7) * 0.45) + 's';
        lights.appendChild(l);
      }
    }
    build();
    var t; addEventListener('resize', function () { clearTimeout(t); t = setTimeout(build, 200); });
  }

  function notes() {
    if (!showNotice) return;
    document.querySelectorAll('form[data-form="quote"]').forEach(function (f) {
      var p = document.createElement('p');
      p.className = 'fest-note';
      p.innerHTML = '<span><b>Diwali holidays:</b> our offices are closed from 8 to 11 November. You can still send your enquiry and our team will see it after the holidays.</span>';
      f.insertBefore(p, f.firstChild);
    });
  }

  function sprite() {
    var s = document.createElement('canvas'); s.width = s.height = 64;
    var c = s.getContext('2d'), g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,226,150,.95)'); g.addColorStop(.35, 'rgba(240,190,90,.45)'); g.addColorStop(1, 'rgba(240,190,90,0)');
    c.fillStyle = g; c.fillRect(0, 0, 64, 64); return s;
  }

  function scene(sec, fireworks) {
    var cv = document.createElement('canvas');
    cv.className = 'fest-cv'; cv.setAttribute('aria-hidden', 'true');
    sec.appendChild(cv);
    var ctx = cv.getContext('2d'), spr = sprite(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, bokeh = [], parts = [], rockets = [], next = 1500, raf = 0, last = 0, on = false;
    var small = innerWidth < 760, PAL = [['#f2c14e', '#ffe9a8', '#ffffff'], ['#ffe9a8', '#ffffff', '#8ec5ec'], ['#f2a65a', '#f2c14e', '#fff4d6']];

    function size() {
      var r = sec.getBoundingClientRect(); W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!bokeh.length) {
        var n = small ? 9 : 16;
        for (var i = 0; i < n; i++) bokeh.push({ x: Math.random() * W, y: Math.random() * H, r: 5 + Math.random() * 15, vy: -(5 + Math.random() * 9), ph: Math.random() * 6.28, sp: .5 + Math.random() * .8, a: .12 + Math.random() * .2 });
      }
    }
    function launch() {
      var x = W * (small ? .15 + Math.random() * .7 : .5 + Math.random() * .42);
      rockets.push({ x: x, y: H * .85, tx: x + (Math.random() - .5) * 40, ty: H * (.14 + Math.random() * .26), t: 0, d: .85 + Math.random() * .3 });
    }
    function burst(x, y) {
      var pal = PAL[(Math.random() * PAL.length) | 0], n = small ? 26 : 42;
      for (var i = 0; i < n; i++) {
        var a = i / n * 6.283 + Math.random() * .2, v = (small ? 80 : 120) + Math.random() * (small ? 90 : 130);
        parts.push({ x: x, y: y, px: x, py: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 1.2 + Math.random() * .9, c: pal[(Math.random() * pal.length) | 0] });
      }
    }
    function drawBokeh(t, dt) {
      for (var i = 0; i < bokeh.length; i++) {
        var b = bokeh[i]; b.y += b.vy * dt; if (b.y < -30) { b.y = H + 30; b.x = Math.random() * W; }
        var tw = .55 + .45 * Math.sin(t * b.sp + b.ph);
        ctx.globalAlpha = b.a * tw; ctx.drawImage(spr, b.x - b.r * 2, b.y - b.r * 2, b.r * 4, b.r * 4);
      }
      ctx.globalAlpha = 1;
    }
    function frame(ts) {
      if (!on) return;
      var dt = Math.min((ts - last) / 1000 || .016, .05); last = ts;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      drawBokeh(ts / 1000, dt);
      if (fireworks) {
        next -= dt * 1000; if (next <= 0) { launch(); next = 3200 + Math.random() * 2600; }
        for (var i = rockets.length - 1; i >= 0; i--) {
          var r = rockets[i]; r.t += dt / r.d; var e = 1 - Math.pow(1 - Math.min(r.t, 1), 2);
          var x = r.x + (r.tx - r.x) * e, y = r.y + (r.ty - r.y) * e;
          ctx.strokeStyle = 'rgba(255,226,150,.7)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 14); ctx.stroke();
          if (r.t >= 1) { burst(x, y); rockets.splice(i, 1); }
        }
        for (var j = parts.length - 1; j >= 0; j--) {
          var p = parts[j]; p.life += dt;
          if (p.life > p.max) { parts.splice(j, 1); continue; }
          p.px = p.x; p.py = p.y;
          var drag = Math.pow(.18, dt); p.vx *= drag; p.vy = p.vy * drag + 55 * dt;
          p.x += p.vx * dt; p.y += p.vy * dt;
          var k = 1 - p.life / p.max;
          ctx.strokeStyle = p.c; ctx.globalAlpha = Math.max(k, 0); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(frame);
    }
    function go() { if (on || reduce) return; on = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    function stop() { on = false; cancelAnimationFrame(raf); }
    size();
    if (reduce) { ctx.globalCompositeOperation = 'lighter'; drawBokeh(0, 0); return; }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { en[0].isIntersecting && !document.hidden ? go() : stop(); }, { threshold: 0 }).observe(sec);
    } else go();
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : go(); });
    var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(size, 200); });
  }

  function init() {
    bar(); notes();
    var home = document.querySelector('.hero-video-sec');
    if (home) {
      scene(home, true);
      var d = document.createElement('div'); d.className = 'fest-diyas'; d.setAttribute('aria-hidden', 'true');
      d.innerHTML = diya + diya + diya; home.appendChild(d);
    } else {
      var ph = document.querySelector('.page-hero');
      if (ph) scene(ph, false);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
