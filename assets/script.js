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
      document.querySelectorAll('.js-mail[data-key="' + key + '"]').forEach(a => { if (c.Email) { a.textContent = c.Email; a.href = 'mailto:' + c.Email; } });
      const card = document.querySelector('.contact-card[data-key="' + key + '"]'); if (!card) return;
      const nm = card.querySelector('.c-name'), rl = card.querySelector('.c-role'), ml = card.querySelector('.c-mail a');
      if (nm && c['Display Name']) nm.textContent = c['Display Name'];
      if (rl && c.Role) rl.textContent = String(c.Role).charAt(0).toLowerCase() + String(c.Role).slice(1);
      if (ml && c.Email) { ml.textContent = c.Email; ml.href = 'mailto:' + c.Email; }
    });
  }).catch(() => {});
})();

/* blog: lists Published posts from the Google Sheet (Blog tab); a post opens at blog/?p=slug */
(() => {
  const root = document.getElementById('blogRoot'); if (!root) return;
  const base = window.EAGLE_CONFIG && window.EAGLE_CONFIG.QUOTE_URL;
  const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };
  const msg = t => { root.replaceChildren(el('p', 'blog-msg', t)); };
  const slugify = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const keyOf = p => String(p.Slug || '').trim() || slugify(p.Title);
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const fmtDate = d => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d || '')); return m ? (+m[3]) + ' ' + MON[+m[2] - 1] + ' ' + m[1] : String(d || ''); };
  const safeUrl = u => { u = String(u || '').trim(); return /^https:\/\//i.test(u) ? u : ''; };
  const meta = p => [p.Category, fmtDate(p.Date)].filter(Boolean).join('  /  ');
  const driveFix = u => { const m = /drive\.google\.com\/file\/d\/([^/]+)/.exec(u) || /drive\.google\.com\/open\?id=([^&]+)/.exec(u); return m ? 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w1400' : u; };

  function inline(text, parent) {            // [label](https://...) links only
    const re = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g; let last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) parent.appendChild(document.createTextNode(text.slice(last, m.index)));
      const a = el('a', '', m[1]); a.href = m[2]; a.target = '_blank'; a.rel = 'noopener'; parent.appendChild(a);
      last = re.lastIndex;
    }
    if (last < text.length) parent.appendChild(document.createTextNode(text.slice(last)));
  }
  function renderBody(content) {
    const box = el('div', 'post-body'); let ul = null, para = [];
    const flush = () => { if (para.length) { const p = el('p'); inline(para.join(' '), p); box.appendChild(p); para = []; } };
    String(content || '').split(/\r?\n/).forEach(raw => {
      const line = raw.trim();
      if (!line) { flush(); ul = null; return; }
      if (/^#{1,3}\s+/.test(line)) { flush(); ul = null; box.appendChild(el('h3', '', line.replace(/^#{1,3}\s+/, ''))); return; }
      if (/^[-*]\s+/.test(line)) { flush(); if (!ul) { ul = el('ul'); box.appendChild(ul); } const li = el('li'); inline(line.replace(/^[-*]\s+/, ''), li); ul.appendChild(li); return; }
      ul = null; para.push(line);
    });
    flush(); return box;
  }
  function setMeta(title, desc) {
    document.title = title;
    const m = document.querySelector('meta[name="description"]'); if (m && desc) m.setAttribute('content', desc);
  }
  function list(posts) {
    if (!posts.length) { msg('New articles are coming soon.'); return; }
    const grid = el('div', 'blog-grid');
    posts.forEach(p => {
      const a = el('a', 'blog-card'); a.href = '?p=' + encodeURIComponent(keyOf(p));
      const img = safeUrl(driveFix(safeUrl(p['Cover Image URL'])));
      if (img) { const w = el('div', 'bc-img'), i = document.createElement('img'); i.src = img; i.alt = ''; i.loading = 'lazy'; w.appendChild(i); a.appendChild(w); }
      const b = el('div', 'bc-body'); b.appendChild(el('span', 'bc-meta', meta(p))); b.appendChild(el('h3', '', p.Title));
      if (p.Summary) b.appendChild(el('p', '', p.Summary));
      a.appendChild(b); grid.appendChild(a);
    });
    root.replaceChildren(grid);
  }
  function post(p) {
    const art = el('article', 'post'); const back = el('a', 'back', 'All articles'); back.href = './'; art.appendChild(back);
    art.appendChild(el('span', 'bc-meta', [p.Category, fmtDate(p.Date), p.Author].filter(Boolean).join('  /  ')));
    art.appendChild(el('h2', '', p.Title));
    const img = safeUrl(driveFix(safeUrl(p['Cover Image URL'])));
    if (img) { const i = document.createElement('img'); i.className = 'cover'; i.src = img; i.alt = ''; art.appendChild(i); }
    art.appendChild(renderBody(p.Content));
    root.replaceChildren(art);
    setMeta(p.Title + ' | Eagle Pack', p['Meta Description'] || p.Summary);
    window.scrollTo(0, 0);
  }
  if (!base) { msg('Articles are not connected yet.'); return; }
  fetch(base + '?action=blog').then(r => r.json()).then(j => {
    const posts = (j && j.ok && j.posts) || [];
    let want = ''; try { want = new URLSearchParams(location.search).get('p') || ''; } catch (e) {}
    if (want) {
      const p = posts.find(x => keyOf(x) === want);
      if (p) { post(p); return; }
      msg('We could not find that article.'); const a = el('a', 'back', 'All articles'); a.href = './'; root.appendChild(a); return;
    }
    list(posts);
  }).catch(() => msg('Articles could not be loaded right now. Please try again shortly.'));
})();
