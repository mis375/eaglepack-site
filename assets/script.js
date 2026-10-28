(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CFG = window.EAGLE_CONFIG || {};

  /* Header: same fixed bar always, only the colours change on scroll, so the page never jumps */
  const header = $('#header');
  let tick = false;
  const setHeader = () => { header.classList.toggle('stuck', scrollY > 40); tick = false; };
  setHeader();
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(setHeader); } }, { passive: true });

  /* Dropdowns: hover and focus work in CSS; click toggles for touch screens */
  $$('.has-sub').forEach(li => {
    const btn = $('.sub-toggle', li);
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const open = !li.classList.contains('open');
      $$('.has-sub.open').forEach(x => { x.classList.remove('open'); $('.sub-toggle', x).setAttribute('aria-expanded', 'false'); });
      li.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open);
    });
  });
  document.addEventListener('click', () => $$('.has-sub.open').forEach(x => { x.classList.remove('open'); $('.sub-toggle', x).setAttribute('aria-expanded', 'false'); }));

  /* Mobile drawer */
  const mb = $('#menuBtn'), drawer = $('#drawer');
  const setMenu = open => {
    mb.setAttribute('aria-expanded', open);
    mb.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    drawer.classList.toggle('open', open);
    drawer.setAttribute('aria-hidden', !open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  mb.addEventListener('click', () => setMenu(mb.getAttribute('aria-expanded') !== 'true'));
  $$('a', drawer).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') { setMenu(false); $$('.has-sub.open').forEach(x => x.classList.remove('open')); } });
  matchMedia('(min-width:1101px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

  /* Reveal on scroll */
  const rv = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    rv.forEach(el => io.observe(el));
  } else rv.forEach(el => el.classList.add('in'));

  /* Count-up */
  const run = el => {
    const end = +el.dataset.count; if (reduce) return;
    const t0 = performance.now(), dur = 1300;
    const step = t => { const p = Math.min((t - t0) / dur, 1); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
    el.textContent = '0'; requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { run(e.target); cio.unobserve(e.target); } }), { threshold: .6 });
    $$('[data-count]').forEach(c => cio.observe(c));
  }

  /* Product filter */
  const fb = $$('.filters button');
  if (fb.length) fb.forEach(b => b.addEventListener('click', () => {
    fb.forEach(x => x.setAttribute('aria-pressed', x === b));
    const f = b.dataset.filter;
    $$('[data-div]').forEach(c => { c.hidden = !(f === 'all' || c.dataset.div === f); });
  }));

  /* Forms. Nothing is sent until a web-app URL is set in assets/config.js */
  const toB64 = f => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = no; r.readAsDataURL(f); });
  $$('form[data-form]').forEach(form => {
    const kind = form.dataset.form;
    const note = $('.form-note', form);
    const say = (t, err) => { note.textContent = t; note.classList.toggle('err', !!err); };
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if ($('.hp input', form) && $('.hp input', form).value) return;
      if (!form.checkValidity()) { form.reportValidity(); say('Please fill the required fields.', true); return; }
      const url = kind === 'careers' ? CFG.CAREERS_URL : CFG.QUOTE_URL;
      if (!url) { say('This form is not connected yet, so nothing was submitted. Please call or email us in the meantime.', true); return; }
      const d = Object.fromEntries(new FormData(form).entries());
      delete d.cv;
      d.form = kind; d.page = location.pathname; d.time = new Date().toISOString();
      const file = form.elements.cv && form.elements.cv.files[0];
      try {
        say('Sending…');
        if (file) {
          if (file.size > 5 * 1024 * 1024) { say('Please attach a CV under 5 MB.', true); return; }
          d.cv_name = file.name; d.cv_type = file.type; d.cv_data = await toB64(file);
        }
        await fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(d).toString() });
        form.reset();
        say(kind === 'careers' ? 'Thank you. Your application has been received.' : 'Thank you. Our team will contact you shortly.');
      } catch (err) { say('Something went wrong. Please try again or contact us directly.', true); }
    });
  });
})();

(() => {
  const t = document.getElementById('reviewTrack'); if (!t) return;
  let i = 0; const n = t.children.length;
  const per = () => innerWidth > 760 ? 2 : 1;
  const show = () => { if (innerWidth > 760) t.style.transform = `translateX(-${i * (100 / per())}%)`; };
  const step = d => { const m = n - per() + 1; i = (i + d + m) % m; if (innerWidth > 760) show(); else t.scrollBy({ left: d * t.clientWidth, behavior: 'smooth' }); };
  document.getElementById('reviewNext').addEventListener('click', () => step(1));
  document.getElementById('reviewPrev').addEventListener('click', () => step(-1));
})();

/* quote form: preselect the division from ?d=etp|binwin|es */
(() => {
  const sel = document.getElementById('qd'); if (!sel) return;
  try { const d = new URLSearchParams(location.search).get('d'); if (d && [...sel.options].some(o => o.value === d)) sel.value = d; } catch (e) {}
})();

/* contact numbers: baked into the page, refreshed from the Google Sheet (Contacts tab) when reachable */
(() => {
  const base = window.EAGLE_CONFIG && window.EAGLE_CONFIG.QUOTE_URL; if (!base) return;
  if (!document.querySelector('.js-phone')) return;
  const fmt = n => { n = String(n).replace(/\D/g, '').slice(-10); return n.length === 10 ? '+91 ' + n.slice(0, 5) + ' ' + n.slice(5) : ''; };
  fetch(base + '?action=contacts').then(r => r.json()).then(j => {
    if (!j || !j.ok) return;
    j.contacts.forEach(c => {
      const key = String(c.Key); const f = fmt(c.Phone);
      document.querySelectorAll('.js-phone[data-key="' + key + '"]').forEach(a => { if (f) { a.textContent = f; a.href = 'tel:+91' + f.replace(/\D/g, '').slice(2); } });
      const card = document.querySelector('.contact-card[data-key="' + key + '"]'); if (!card) return;
      const nm = card.querySelector('.c-name'), rl = card.querySelector('.c-role'), ml = card.querySelector('.c-mail a');
      if (nm && c['Display Name']) nm.textContent = c['Display Name'];
      if (rl && c.Role) rl.textContent = String(c.Role).charAt(0).toLowerCase() + String(c.Role).slice(1);
      if (ml && c.Email) { ml.textContent = c.Email; ml.href = 'mailto:' + c.Email; }
    });
  }).catch(() => {});
})();
