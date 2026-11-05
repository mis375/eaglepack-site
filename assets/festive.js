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
  // Today's date in India (IST), so the day changes at midnight IST for every visitor.
  var dm = location.search.match(/[?&]date=(\d{4}-\d{2}-\d{2})/);
  var today = dm && force ? dm[1] : new Date(now + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
  if (dm && force) showNotice = Date.parse(today + 'T00:00:00+05:30') < NOTICE_END;
  // Festival of the day: [long greeting, short greeting for phones]. Other days use the default Diwali greeting.
  var DAYS = {
    '2026-11-06': ['Happy Dhanteras from Team Eagle Pack. Wishing you prosperity and good health', 'Happy Dhanteras'],
    '2026-11-07': ['Happy Choti Diwali (Naraka Chaturdashi) from Team Eagle Pack', 'Happy Choti Diwali'],
    '2026-11-08': ['Happy Diwali from Team Eagle Pack. Wishing you light, joy and prosperity', 'Happy Diwali'],
    '2026-11-10': ['Happy Govardhan Puja from Team Eagle Pack', 'Happy Govardhan Puja'],
    '2026-11-11': ['Happy Bhai Dooj from Team Eagle Pack', 'Happy Bhai Dooj']
  };
  var day = DAYS[today] || ['Wishing you a bright and joyful Diwali. Team Eagle Pack', 'Happy Diwali'];
  var boost = today === '2026-11-08';   // main Diwali day: more fireworks
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var diya = '<svg class="fest-diya" viewBox="0 0 40 32" aria-hidden="true"><path class="fl" d="M20 1C23.5 7 25.5 10.5 23.5 14C22.4 16 17.6 16 16.5 14C14.5 10.5 16.5 7 20 1Z"/><path class="bowl" d="M2 17H38C38 25.5 30.5 30 20 30C9.5 30 2 25.5 2 17Z"/><rect class="base" x="13" y="29" width="14" height="2.4" rx="1.2"/></svg>';

  function bar() {
    document.body.classList.add('fest');
    var b = document.createElement('div');
    b.className = 'fest-bar' + (showNotice ? '' : ' nohol');
    b.setAttribute('role', 'region'); b.setAttribute('aria-label', 'Diwali greeting');
    b.innerHTML = diya + '<div class="msg"><span class="greet"><span class="g-long">' + day[0] + '</span><span class="g-short">' + day[1] + '</span></span>' +
      (showNotice ? '<span class="sep"></span><span class="hol">Offices closed 8 to 11 November</span>' : '') + '</div>' +
      '<span class="d2">' + diya + '</span><button class="x" type="button" aria-label="Close greeting">&times;</button><div class="fest-lights"></div>';
    document.body.insertBefore(b, document.body.firstChild);
    b.querySelector('.x').addEventListener('click', function () {
      b.remove(); document.body.classList.remove('fest');
      document.querySelectorAll('.fest-cv,.fest-diyas,.fest-lanterns').forEach(function (n) { n.remove(); });
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
    var pending = [], stars = [];
    function launch(x, delay) {
      rockets.push({ x: x, y: H * (.82 + Math.random() * .08), tx: x + (Math.random() - .5) * 50, ty: H * (.12 + Math.random() * .3), t: -(delay || 0), d: .8 + Math.random() * .35 });
    }
    function volley() {
      var n = 1 + ((Math.random() * 4) | 0), lo = small ? .12 : .46, hi = small ? .88 : .94, seg = (hi - lo) / n, order = [];
      for (var i = 0; i < n; i++) order.push(i);
      order.sort(function () { return Math.random() - .5; });
      for (var k = 0; k < n; k++) launch(W * (lo + seg * (order[k] + .15 + Math.random() * .7)), k === 0 ? 0 : Math.random() * .9);
    }
    function burst(x, y) {
      var pal = PAL[(Math.random() * PAL.length) | 0], type = (Math.random() * 4) | 0, sz = (small ? .65 : 1) * (.8 + Math.random() * .5);
      var n = small ? 24 : 40, i, a, v, life = 1.2 + Math.random() * .9, g = 55;
      if (type === 3) { life = 2.2 + Math.random() * .8; g = 95; pal = ['#f2c14e', '#ffe9a8']; }   // willow: slow golden droop
      for (i = 0; i < n; i++) {
        a = i / n * 6.283 + Math.random() * .15;
        v = type === 1 ? 150 * sz : (type === 3 ? 90 : 120 + Math.random() * 130) * sz;           // 1 = clean ring
        parts.push({ x: x, y: y, px: x, py: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: life, g: g, c: pal[(Math.random() * pal.length) | 0] });
      }
      if (type === 2) for (i = 0; i < n / 2; i++) {                                                  // double: small inner ring
        a = i / (n / 2) * 6.283; v = 62 * sz;
        parts.push({ x: x, y: y, px: x, py: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: life * .8, g: g, c: '#ffffff' });
      }
    }
    function drawStars(t) {
      for (var i = 0; i < stars.length; i++) {
        var q = stars[i], tw = Math.max(0, Math.sin(t * q.sp + q.ph)); if (tw < .15) continue;
        var L = q.r * (.5 + tw); ctx.globalAlpha = .75 * tw; ctx.strokeStyle = '#fff1c8'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(q.x - L, q.y); ctx.lineTo(q.x + L, q.y); ctx.moveTo(q.x, q.y - L); ctx.lineTo(q.x, q.y + L); ctx.stroke();
      }
      ctx.globalAlpha = 1;
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
      drawBokeh(ts / 1000, dt); if (fireworks) drawStars(ts / 1000);
      if (fireworks) {
        next -= dt * 1000; if (next <= 0) { volley(); next = boost ? 2200 + Math.random() * 1800 : 3600 + Math.random() * 2800; }
        for (var i = rockets.length - 1; i >= 0; i--) {
          var r = rockets[i]; r.t += r.t < 0 ? dt : dt / r.d; if (r.t < 0) continue; var e = 1 - Math.pow(1 - Math.min(r.t, 1), 2);
          var x = r.x + (r.tx - r.x) * e, y = r.y + (r.ty - r.y) * e;
          ctx.strokeStyle = 'rgba(255,226,150,.7)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 14); ctx.stroke();
          if (r.t >= 1) { burst(x, y); rockets.splice(i, 1); }
        }
        for (var j = parts.length - 1; j >= 0; j--) {
          var p = parts[j]; p.life += dt;
          if (p.life > p.max) { parts.splice(j, 1); continue; }
          p.px = p.x; p.py = p.y;
          var drag = Math.pow(.18, dt); p.vx *= drag; p.vy = p.vy * drag + p.g * dt;
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
    if (fireworks) for (var si = 0; si < (small ? 6 : 12); si++) stars.push({ x: Math.random() * W, y: H * (.08 + Math.random() * .6), r: 3 + Math.random() * 4, sp: .8 + Math.random() * 1.4, ph: Math.random() * 6.28 });
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
      var lan = document.createElement('div'); lan.className = 'fest-lanterns'; lan.setAttribute('aria-hidden', 'true');
      var lt = '<svg viewBox="0 0 60 130" class="fest-lantern"><defs><linearGradient id="flg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffd978"/><stop offset="1" stop-color="#d9962f"/></linearGradient></defs><line x1="30" y1="0" x2="30" y2="34" stroke="#c9a24a" stroke-width="1.2"/><rect x="21" y="32" width="18" height="6" rx="2" fill="#b8893a"/><path class="lb" d="M30 38C47 40 54 58 54 76C54 94 44 104 30 106C16 104 6 94 6 76C6 58 13 40 30 38Z" fill="url(#flg)" fill-opacity=".92"/><path d="M30 38C22 52 20 66 20 78C20 92 24 100 30 106M30 38C38 52 40 66 40 78C40 92 36 100 30 106" fill="none" stroke="#9b6b1f" stroke-opacity=".55" stroke-width="1"/><rect x="22" y="104" width="16" height="5" rx="2" fill="#b8893a"/><path d="M30 109V120M26 120L30 126L34 120Z" fill="#e9c46a" stroke="#e9c46a" stroke-width="1.4"/></svg>';
      lan.innerHTML = '<span class="l1">' + lt.replace('flg', 'flg1') .replace('#flg', '#flg1') + '</span><span class="l2">' + lt.replace(/flg/g, 'flg2') + '</span>';
      home.appendChild(lan);
    } else {
      var ph = document.querySelector('.page-hero');
      if (ph) scene(ph, false);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
