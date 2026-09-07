/* ocebi.github.io — no dependencies, deferred.
   Everything here is progressive enhancement: the page is complete without it. */
(() => {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- sticky header hairline ------------------------------------------- */
  const header = document.querySelector('.site-header');
  if (header) {
    const sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:0;height:24px;width:1px;pointer-events:none';
    document.body.prepend(sentinel);
    new IntersectionObserver(
      ([e]) => header.classList.toggle('is-stuck', !e.isIntersecting)
    ).observe(sentinel);
  }

  /* --- reveal on scroll -------------------------------------------------- */
  /* The hidden state is applied ONLY here, so if this script never runs the
     content stays visible. (The old Stellar template got this backwards.) */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length && !reduced) {
    document.documentElement.classList.add('js-motion');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    reveals.forEach((el) => io.observe(el));
  }

  /* --- collapsible grids ------------------------------------------------- */
  /* Markup ships with every item visible; we collapse it and add the toggle,
     so a no-JS visitor sees the full list rather than a dead button. */
  document.querySelectorAll('[data-collapse-after]').forEach((grid) => {
    const keep = Number(grid.dataset.collapseAfter);
    const items = [...grid.children];
    if (items.length <= keep) return;

    const bar = document.querySelector(`[data-collapse-actions][data-for="${grid.id}"]`);
    if (!bar) return;

    const rest = items.slice(keep);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn--ghost';
    btn.setAttribute('aria-controls', grid.id);

    const apply = (open) => {
      rest.forEach((el) => { el.hidden = !open; });
      grid.classList.toggle('is-collapsed', !open);
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? 'Show fewer' : `Show all ${items.length} titles`;
    };

    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      if (open && btn.getBoundingClientRect().top < 0) btn.scrollIntoView({ block: 'center' });
      apply(!open);
      btn.focus();
    });

    apply(false);
    bar.append(btn);
    bar.hidden = false;
  });

  /* --- click-to-load embeds ---------------------------------------------- */
  /* Keeps third-party iframes off the critical path; falls back to a plain
     link when JS is unavailable. */
  document.querySelectorAll('[data-embed]').forEach((facade) => {
    facade.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-embed-play]');
      if (!trigger) return;
      e.preventDefault();
      const frame = document.createElement('iframe');
      frame.src = facade.dataset.embed;
      frame.loading = 'lazy';
      frame.allow = 'autoplay; fullscreen';
      frame.title = facade.dataset.embedTitle || 'Embedded video';
      frame.style.cssText = 'width:100%;aspect-ratio:16/9;border:0;border-radius:10px';
      facade.replaceWith(frame);
    });
  });

  /* --- slot safety net ---------------------------------------------------- */
  /* If a real image 404s, revert to the placeholder rather than showing a
     broken-image glyph. */
  addEventListener('error', (e) => {
    const img = e.target;
    if (img.tagName !== 'IMG') return;
    const slot = img.closest('.slot--media');
    if (slot) { img.remove(); slot.classList.add('is-empty'); }
  }, true);

  /* --- ?slots audit ------------------------------------------------------- */
  /* Visit any page with ?slots to highlight everything still unfilled. */
  if (location.search.includes('slots')) {
    const open = [...document.querySelectorAll('.slot.is-empty')];
    document.documentElement.classList.add('slot-audit');
    document.title = `(${open.length} empty) ${document.title}`;
    if (open.length) console.table(open.map((s) => ({ slot: s.dataset.slot, type: s.className })));
    else console.info('All slots filled.');
  }
})();
