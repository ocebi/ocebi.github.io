/* ocebi.github.io home page. No dependencies, deferred. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ───────────── hero: the sign hangs, and swings when you grab it ───────────── */
  (() => {
    const g = document.getElementById('gantry');
    if (reduced) { g.style.cursor = 'auto'; return; }
    let th = -.1, om = 0, held = false, x0 = 0, th0 = 0, raf = 0, last = 0, px = 0, pt = 0;
    const MAX = .17;
    const paint = () => { g.style.transformOrigin = `50% ${-g.offsetTop}px`; g.style.transform = `rotate(${th}rad)`; };
    function frame(t) {
      raf = 0;
      const dt = Math.min(.032, (t - last) / 1000 || .016); last = t;
      if (!held) { om += (-24 * Math.sin(th) - 1.5 * om) * dt; th = clamp(th + om * dt, -MAX, MAX); }
      paint();
      if (held || Math.abs(th) > .0008 || Math.abs(om) > .002) go(); else { th = 0; paint(); }
    }
    function go() { if (!raf) raf = requestAnimationFrame(t => { if (t - last > 200) last = t - 16; frame(t); }); }
    g.addEventListener('pointerdown', e => {
      if (e.target.closest('a')) return;
      held = true; x0 = e.clientX; th0 = th; px = e.clientX; pt = e.timeStamp; om = 0;
      g.classList.add('is-held'); g.setPointerCapture(e.pointerId); go();
    });
    g.addEventListener('pointermove', e => {
      if (!held) return;
      th = clamp(th0 - (e.clientX - x0) / 380, -MAX, MAX);
      const dt = (e.timeStamp - pt) / 1000; if (dt > 0) om = clamp(-(e.clientX - px) / 380 / dt, -3, 3);
      px = e.clientX; pt = e.timeStamp;
    });
    const drop = () => { if (!held) return; held = false; g.classList.remove('is-held'); go(); };
    for (const ev of ['pointerup', 'pointercancel', 'mouseup', 'blur']) addEventListener(ev, drop);
    g.addEventListener('lostpointercapture', drop);
    addEventListener('resize', paint);
    paint(); go();
  })();

  /* ───────────── route line: the car follows the scroll position ───────────── */
  (() => {
    const rail = document.getElementById('rail'), car = rail.querySelector('.rail__car');
    const links = [...rail.querySelectorAll('a')], secs = links.map(a => document.querySelector(a.getAttribute('href')));
    let lastY = scrollY, heading = 180, raf = 0;
    function update() {
      raf = 0;
      if (!rail.offsetWidth) return;   // hidden on narrow screens
      const probe = scrollY + innerHeight * .35, tops = secs.map(s => s.getBoundingClientRect().top + scrollY);
      tops[0] = 0; tops.push(document.documentElement.scrollHeight - innerHeight * .65);
      let i = 0; while (i < secs.length - 1 && probe >= tops[i + 1]) i++;
      const frac = clamp((probe - tops[i]) / Math.max(1, tops[i + 1] - tops[i]), 0, 1);
      const stop = k => { const li = links[k].parentElement; return li.offsetTop + li.offsetHeight / 2; };
      const y = i < secs.length - 1 ? stop(i) + (stop(i + 1) - stop(i)) * frac : stop(i);
      if (scrollY !== lastY) { heading = scrollY > lastY ? 180 : 0; lastY = scrollY; }
      car.style.transform = `translateY(${y.toFixed(1)}px) rotate(${heading}deg)`;
      links.forEach((a, k) => k === i ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'));
    }
    const ask = () => { if (!raf) raf = requestAnimationFrame(update); };
    addEventListener('scroll', ask, { passive: true }); addEventListener('resize', ask);
    new ResizeObserver(ask).observe(document.body);
    update();
  })();

  /* ───────────── route: dirt track, cart road, Roman paving, asphalt ───────────── */
  (() => {
    const ul = document.querySelector('.route');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('preserveAspectRatio', 'none'); ul.append(svg);
    function build() {
      const W = svg.clientWidth || 88, H = ul.clientHeight, cx = W / 2;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      let seed = 11;
      const rnd = () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
      const R = (a, b) => a + rnd() * (b - a), pick = a => a[Math.floor(rnd() * a.length)], f = n => n.toFixed(1);
      const lis = [...ul.querySelectorAll('li')], cuts = [0];
      for (let i = 0; i < lis.length - 1; i++) cuts.push((lis[i].offsetTop + lis[i].offsetHeight + lis[i + 1].offsetTop) / 2);
      cuts.push(H);
      const tuft = (x, y, c) => `<path d="M${f(x)} ${f(y)}l-2-5M${f(x)} ${f(y)}l.3-6.5M${f(x)} ${f(y)}l2.2-4.5" stroke="${c}" stroke-width="1.2" stroke-linecap="round" fill="none"/>`;
      const wobble = (x, y0, y1, amp, step) => { let d = ''; for (let y = y0; y <= y1 + step; y += step) d += `${f(x + R(-amp, amp))},${f(y)} `; return d; };

      const asphalt = (y0, y1) => {
        const w = W * .84, x0 = cx - w / 2; let s = `<rect x="${f(x0 - 3)}" y="${y0}" width="${f(w + 6)}" height="${y1 - y0}" fill="#9aa0a6"/><rect x="${f(x0)}" y="${y0}" width="${f(w)}" height="${y1 - y0}" fill="#2f3237"/>`;
        for (let i = 0, n = w * (y1 - y0) / 30; i < n; i++) s += `<circle cx="${f(R(x0, x0 + w))}" cy="${f(R(y0, y1))}" r="${f(R(.4, .9))}" fill="${rnd() < .5 ? '#fff' : '#000'}" opacity=".16"/>`;
        s += `<rect x="${f(x0 + 5)}" y="${y0}" width="2" height="${y1 - y0}" fill="#fff"/><rect x="${f(x0 + w - 7)}" y="${y0}" width="2" height="${y1 - y0}" fill="#fff"/>`;
        for (let y = y0 + 8; y < y1; y += 28) s += `<rect x="${f(cx - 1.5)}" y="${y}" width="3" height="15" fill="#ffc800"/>`;
        return s;
      };
      const roman = (y0, y1) => {
        const w = W * .8, x0 = cx - w / 2, k = 7, wi = w - 2 * k, cols = 4, cw = wi / cols, ch = cw * .95, rows = Math.ceil((y1 - y0) / ch) + 1;
        let s = `<rect x="${f(x0)}" y="${y0}" width="${f(w)}" height="${y1 - y0}" fill="#3b3936"/>`;
        const P = [];
        for (let r = 0; r <= rows; r++) { P.push([]); for (let c = 0; c <= cols; c++) P[r].push([x0 + k + c * cw + (c === 0 || c === cols ? 0 : R(-cw * .3, cw * .3)), y0 + r * ch + R(-ch * .28, ch * .28)]); }
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const q = [P[r][c], P[r][c + 1], P[r + 1][c + 1], P[r + 1][c]], mx = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, my = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4;
          const col = pick(['#75726d', '#86827c', '#696661', '#918d86', '#7c7872', '#a09b93']);
          s += `<polygon points="${q.map(([x, y]) => f(mx + (x - mx) * .8) + ',' + f(my + (y - my) * .8)).join(' ')}" fill="${col}" stroke="${col}" stroke-width="2.4" stroke-linejoin="round"/>`;
        }
        for (const x of [x0, x0 + w - k]) for (let y = y0; y < y1;) { const h = R(10, 19); s += `<rect x="${f(x + .5)}" y="${f(y)}" width="${k - 1}" height="${f(h - 1.2)}" rx="1.5" fill="${pick(['#b9b3a5', '#a8a295', '#c6c0b3'])}"/>`; y += h; }
        return s;
      };
      const cart = (y0, y1) => {
        const w = W * .66, a = cx - w / 2, b = cx + w / 2;
        let s = `<polygon points="${wobble(a, y0, y1, 1.8, 10)} ${wobble(b, y0, y1, 1.8, 10).trim().split(' ').reverse().join(' ')}" fill="#bfa980" stroke="#bfa980" stroke-width="3" stroke-linejoin="round"/>`;
        for (const x of [cx - w * .24, cx + w * .24]) s += `<polyline points="${wobble(x, y0, y1, 1.6, 14)}" fill="none" stroke="#8a7350" stroke-width="7.5" stroke-linejoin="round" opacity=".55"/>`;
        for (let i = 0, n = w * (y1 - y0) / 9; i < n; i++) s += `<circle cx="${f(R(a + 2, b - 2))}" cy="${f(R(y0, y1))}" r="${f(R(.6, 2.1))}" fill="${pick(['#dccdae', '#8f7d5f', '#a39274', '#cdbd97', '#74675a', '#e6dcc6'])}"/>`;
        for (let y = y0 + 4; y < y1; y += R(7, 15)) { const side = rnd() < .5 ? a - R(1, 5) : b + R(1, 5); s += tuft(side, y, '#6f8d4c'); }
        return s;
      };
      const dirt = (y0, y1) => {
        const w = W * .5, a = cx - w / 2, b = cx + w / 2;
        let s = `<polygon points="${wobble(a, y0, y1, 4.5, 9)} ${wobble(b, y0, y1, 4.5, 9).trim().split(' ').reverse().join(' ')}" fill="#9a734a" stroke="#9a734a" stroke-width="5" stroke-linejoin="round"/>`;
        for (let i = 0, n = (y1 - y0) / 5; i < n; i++) s += `<ellipse cx="${f(R(a + 5, b - 5))}" cy="${f(R(y0, y1))}" rx="${f(R(3, 8))}" ry="${f(R(1.5, 4))}" fill="${pick(['#86613c', '#ab835a', '#8f6941', '#b48c62'])}" opacity=".5"/>`;
        for (const x of [cx - w * .25, cx + w * .25]) s += `<polyline points="${wobble(x, y0, y1, 2.2, 11)}" fill="none" stroke="#7a5735" stroke-width="4" stroke-linejoin="round" opacity=".6"/>`;
        for (let y = y0 + 5; y < y1; y += R(9, 17)) s += tuft(cx + R(-3, 3), y, '#7c9a55');
        for (let y = y0 + 3; y < y1; y += R(4, 9)) s += tuft(rnd() < .5 ? a - R(-3, 4) : b + R(-3, 4), y, '#64843f');
        for (let i = 0, n = (y1 - y0) / 22; i < n; i++) s += `<ellipse cx="${f(R(a + 4, b - 4))}" cy="${f(R(y0, y1))}" rx="${f(R(1.5, 3))}" ry="${f(R(1.2, 2.2))}" fill="#b9b3a6"/>`;
        return s;
      };

      let out = `<rect width="${W}" height="${H}" fill="#2f3a28"/>`;
      for (let i = 0, n = H / 2.5; i < n; i++) out += tuft(R(1, W - 1), R(4, H), pick(['#47583a', '#506340', '#3e4e33']));
      const eras = [asphalt, roman, cart, dirt];
      let defs = '';
      for (let k = eras.length - 1; k >= 0; k--) {
        const y0 = Math.max(0, Math.round(cuts[k] - 14)), y1 = Math.round(cuts[k + 1] + 10);
        let edge = ''; if (k === eras.length - 1) edge = `${W + 2},${H} -2,${H}`; else for (let x = W + 2; x >= -2; x -= 4) edge += `${x},${f(cuts[k + 1] + R(-7, 7))} `;
        defs += `<clipPath id="era${k}"><polygon points="-2,${y0} ${W + 2},${y0} ${edge}"/></clipPath>`;
        out += `<g clip-path="url(#era${k})">${eras[k](y0, y1)}</g>`;
      }
      svg.innerHTML = `<defs>${defs}</defs>` + out;
    }
    let lastH = 0;
    new ResizeObserver(() => { if (ul.clientHeight !== lastH) { lastH = ul.clientHeight; build(); } }).observe(ul);
  })();

  /* ───────────── Tileworlds: load the build into the frame on request ───────────── */
  (() => {
    const box = document.getElementById('tw-player'), btn = document.getElementById('tw-start');
    // Phones and data-saver visitors keep the button and get the full page: a 30 MB Unity build
    // inside a scrolling page is a poor fit for touch, and nobody on a metered link asked for it.
    const manual = matchMedia('(pointer: coarse)').matches || (navigator.connection && navigator.connection.saveData);
    if (manual) { btn.addEventListener('click', () => { location.href = 'tileworlds/'; }); return; }
    btn.remove();
    new IntersectionObserver(([e], io) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const f = document.createElement('iframe');
      f.src = 'tileworlds/?muted'; f.title = 'Tileworlds, playable'; f.allow = 'fullscreen; gamepad';
      f.addEventListener('load', () => box.querySelector('img')?.remove());
      box.append(f);
    }, { rootMargin: '300px 0px' }).observe(box);
  })();

  /* ───────────── click-to-load third-party video ───────────── */
  document.querySelectorAll('[data-embed]').forEach(box => {
    box.addEventListener('click', e => {
      if (!e.target.closest('[data-embed-play]')) return;
      const f = document.createElement('iframe');
      f.src = box.dataset.embed; f.allow = 'autoplay; fullscreen'; f.title = box.dataset.embedTitle || 'Embedded video';
      box.replaceChildren(f);
    });
  });

  /* ───────────── odometer ───────────── */
  (() => {
    const row = document.querySelector('.odo__row'), value = row.dataset.value, reels = [];
    for (const ch of value) {
      if (ch === ',') { const s = document.createElement('span'); s.className = 'odo__sep'; row.append(s); continue; }
      const d = document.createElement('span'); d.className = 'odo__d';
      const reel = document.createElement('span'); reel.className = 'odo__reel';
      for (let i = 0; i < 20; i++) { const n = document.createElement('span'); n.textContent = i % 10; reel.append(n); }
      d.append(reel); row.append(d); reels.push([reel, +ch]);
    }
    const roll = () => reels.forEach(([reel, n], i) => {
      reel.style.transitionDelay = (reels.length - 1 - i) * 90 + 'ms';
      reel.style.transform = `translateY(-${(n + 10) * 1.25}em)`;
    });
    if (reduced) roll();
    else new IntersectionObserver(([e], io) => { if (e.isIntersecting) { roll(); io.disconnect(); } }, { threshold: .6 }).observe(row);
  })();

  /* ───────────── hyper-casual pile ───────────── */
  (() => {
    const TITLES = [['balloon-fever.png', 'Balloon Fever'], ['oh-my-muscles.jpg', 'Oh My Muscles!'], ['boss-to-raise.jpg', 'Boss To Raise'], ['merge-defenser.jpg', 'Merge Defenser'], ['idle-warrior.webp', 'Idle Warrior'], ['monster-car-arena.jpg', 'Monster Car Arena'], ['last-man-standing.jpg', 'Last Man Standing'], ['office-flirt.jpg', 'Office Flirt'], ['count-and-build.jpg', 'Count And Build'], ['jewelry-merge.jpg', 'Jewelry Merge'], ['minion-or-giant.jpg', 'Minion or Giant'], ['archer-run-3d.jpg', 'Archer Run 3D'], ['dino-escape-run.webp', 'Dino Escape Run'], ['draw-shapes-3d.webp', 'Draw Shapes 3D'], ['basket-life.webp', 'Basket Life'], ['date-time.webp', 'Date Time!'], ['influencer-agency.webp', 'Influencer Agency'], ['shoe-run.webp', 'Shoe Run'], ['drift-pursuit.webp', 'Drift Pursuit'], ['lovers-match.webp', 'Lovers Match'], ['hair-punch.webp', 'Hair Punch'], ['fix-her-hair.webp', 'Fix Her Hair'], ['color-merge-runner.webp', 'Color Merge Runner'], ['sword-forger.webp', 'Sword Forger'], ['tactical-police-escape.webp', 'Tactical Police Escape'], ['shop-lift-escape.webp', 'Shop Lift Escape'], ['comment-master.png', 'Comment Master']];
    const box = document.getElementById('pile'), label = document.getElementById('pile-name');
    const bodies = [];
    let W = box.clientWidth, H = box.clientHeight;
    const R = W < 520 ? 26 : 36;
    box.style.setProperty('--d', R * 2 + 'px');
    const show = name => { label.textContent = name; };
    TITLES.forEach(([file, name], i) => {
      const el = document.createElement('img');
      el.src = 'images/games/icons/' + file; el.alt = name; el.tabIndex = 0; el.draggable = false;
      el.addEventListener('pointerenter', () => show(name));
      el.addEventListener('focus', () => show(name));
      box.append(el);
      bodies.push({ el, name, r: R, x: R + Math.random() * (W - 2 * R), y: -R - i * 34 - Math.random() * 60, vx: (Math.random() - .5) * 120, vy: 0, a: (Math.random() - .5) * .6, va: 0 });
    });
    if (reduced) { box.classList.add('is-static'); return; }

    let held = null, hx = 0, hy = 0, raf = 0, last = 0, calm = 0, started = false;
    const paint = () => { for (const b of bodies) b.el.style.transform = `translate(${b.x - b.r}px,${b.y - b.r}px) rotate(${b.a}rad)`; };
    function sim(dt) {
      for (const b of bodies) {
        if (b === held) { b.vx = clamp((hx - b.x) * 22, -2600, 2600); b.vy = clamp((hy - b.y) * 22, -2600, 2600); }
        else b.vy += 2200 * dt;
        b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.va * dt; b.va *= .985;
      }
      for (let k = 0; k < 4; k++) {
        for (let i = 0; i < bodies.length; i++) {
          const a = bodies[i];
          for (let j = i + 1; j < bodies.length; j++) {
            const b = bodies[j], dx = b.x - a.x, dy = b.y - a.y, min = a.r + b.r, d2 = dx * dx + dy * dy;
            if (d2 >= min * min || d2 === 0) continue;
            const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, pen = (min - d) / 2;
            const wa = a === held ? 0 : 1, wb = b === held ? 0 : 1, ws = wa + wb || 1;
            a.x -= nx * pen * 2 * wa / ws; a.y -= ny * pen * 2 * wa / ws; b.x += nx * pen * 2 * wb / ws; b.y += ny * pen * 2 * wb / ws;
            const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
            if (rv < 0) { const imp = -(1.2) * rv / ws; a.vx -= imp * nx * wa; a.vy -= imp * ny * wa; b.vx += imp * nx * wb; b.vy += imp * ny * wb; }
          }
        }
        for (const b of bodies) {
          if (b.x < b.r) { b.x = b.r; if (b.vx < 0) b.vx *= -.35; }
          if (b.x > W - b.r) { b.x = W - b.r; if (b.vx > 0) b.vx *= -.35; }
          if (b.y > H - b.r) { b.y = H - b.r; if (b.vy > 0) b.vy *= -.25; b.vx *= .96; b.va = b.vx / b.r; }
          if (b.y < -1400) { b.y = -1400; b.vy = 0; }
        }
      }
    }
    function frame(t) {
      raf = 0;
      const dt = Math.min(.032, (t - last) / 1000 || .016); last = t;
      sim(dt / 2); sim(dt / 2); paint();
      let e = 0; for (const b of bodies) e += b.vx * b.vx + b.vy * b.vy;
      calm = (e / bodies.length < 900 && !held) ? calm + dt : 0;
      if (calm < 1.2) go();
    }
    function go() { if (!raf) raf = requestAnimationFrame(t => { if (t - last > 200) last = t - 16; frame(t); }); }
    const local = e => { const r = box.getBoundingClientRect(); hx = e.clientX - r.left; hy = e.clientY - r.top; };
    box.addEventListener('pointerdown', e => {
      const b = bodies.find(o => o.el === e.target); if (!b) return;
      e.preventDefault(); held = b; local(e); show(b.name); box.append(b.el); b.el.setPointerCapture(e.pointerId); calm = 0; go();
    });
    box.addEventListener('pointermove', e => { if (held) local(e); });
    const drop = () => { held = null; };
    box.addEventListener('pointerup', drop); box.addEventListener('pointercancel', drop);
    new ResizeObserver(() => { W = box.clientWidth; H = box.clientHeight; calm = 0; if (started) go(); }).observe(box);
    new IntersectionObserver(([e], io) => { if (e.isIntersecting) { started = true; go(); io.disconnect(); } }, { threshold: .25 }).observe(box);
    paint();
  })();
})();
