/* ══════════════════════════════════════════════════════════════
   FRANCO AIRE ACONDICIONADO · Interacciones de la landing
   JavaScript puro, sin dependencias.

   MÓDULOS
   01 Utilidades            08 Hero: flujo de aire (canvas) + datos vivos
   02 Textos por palabra    09 Marquee reactivo al scroll
   03 Preloader             10 Proyectos y visor de fotos
   04 Navegación y menú     11 Preguntas frecuentes
   05 Revelados y contadores 12 Formulario → WhatsApp
   06 Motor de scroll       13 Cursor, botones magnéticos, extras
   07 Efectos ligados al scroll (obra, servicios, proceso…)
   ══════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  /* ───────── 01 · UTILIDADES ───────── */
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const pad = (n, l = 2) => String(n).padStart(l, '0');

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const mqWide = matchMedia('(min-width: 900px)');
  const mqStack = matchMedia('(min-width: 900px) and (min-height: 700px)');

  if (reduce) root.classList.add('reduce');
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  /* ───────── 02 · TEXTOS POR PALABRA ───────── */
  // Recorre los nodos de texto de un elemento y envuelve cada palabra,
  // respetando <em>, <b> y <br> internos.
  function splitWords(el, wrap) {
    let n = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((ch) => {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(' '));
            else frag.appendChild(wrap(part, n++));
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1 && ch.tagName !== 'BR') walk(ch);
      });
    };
    walk(el);
    return n;
  }
  const maskWord = (word, i) => {
    const w = document.createElement('span');
    const inner = document.createElement('span');
    w.className = 'w';
    inner.className = 'w__i';
    inner.style.setProperty('--i', i);
    inner.textContent = word;
    w.appendChild(inner);
    return w;
  };
  const scrubWord = (word) => {
    const s = document.createElement('span');
    s.className = 'sw';
    s.textContent = word;
    return s;
  };

  function initWords() {
    $$('[data-words]').forEach((el) => splitWords(el, maskWord));
    const man = $('[data-scrub]');
    if (man) {
      splitWords(man, scrubWord);
      $$('.hl .sw', man).forEach((s) => s.classList.add('sw--hl'));
    }
  }

  /* ───────── 03 · PRELOADER ───────── */
  function initPreloader(onDone) {
    const pl = $('#preloader');
    if (!pl) { root.classList.remove('is-loading'); root.classList.add('is-ready'); return onDone(); }

    window.scrollTo(0, 0);
    const bar = $('.pl__bar i', pl);
    const num = $('.pl__num', pl);
    const status = $('.pl__status', pl);
    const msgs = [[0, 'Calibrando flujo de aire'], [28, 'Midiendo presiones'], [58, 'Ajustando temperatura'], [88, 'Sistema listo']];
    const MIN = reduce ? 500 : 2600;   // duración mínima del momento de marca
    const MAX = 8000;                  // tope de seguridad: nunca atrapa al usuario
    const t0 = performance.now();
    let loaded = document.readyState === 'complete';
    let finished = false;
    let last = -1;
    if (!loaded) addEventListener('load', () => { loaded = true; }, { once: true });

    const finish = () => {
      if (finished) return;
      finished = true;
      num.textContent = '100';
      bar.style.transform = 'scaleX(1)';
      pl.classList.add('is-done');
      root.classList.remove('is-loading');
      setTimeout(() => root.classList.add('is-ready'), reduce ? 0 : 750);
      setTimeout(() => pl.remove(), reduce ? 50 : 2100);
      onDone();
    };

    const tick = (now) => {
      if (finished) return;
      const el = now - t0;
      const base = easeOut(clamp(el / MIN));
      const p = loaded ? base : Math.min(base, 0.9);
      const pct = Math.round(p * 100);
      if (pct !== last) {
        last = pct;
        num.textContent = pad(pct, 3);
        bar.style.transform = `scaleX(${p})`;
        const m = msgs.slice().reverse().find((x) => pct >= x[0]);
        if (m && status.textContent !== m[1]) status.textContent = m[1];
      }
      if ((loaded && p >= 1) || el > MAX) return finish();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ───────── 04 · NAVEGACIÓN Y MENÚ ───────── */
  function initNav() {
    const nav = $('#nav');
    const burger = $('#burger');
    const menu = $('#menu');
    let open = false;

    const setOpen = (v) => {
      open = v;
      burger.setAttribute('aria-expanded', String(v));
      burger.setAttribute('aria-label', v ? 'Cerrar menú' : 'Abrir menú');
      menu.classList.toggle('is-open', v);
      menu.setAttribute('aria-hidden', String(!v));
      if (v) menu.removeAttribute('inert'); else menu.setAttribute('inert', '');
      root.style.overflow = v ? 'hidden' : '';
      if (v) nav.classList.remove('is-hidden');
    };
    burger.addEventListener('click', () => setOpen(!open));
    $$('a', menu).forEach((a) => a.addEventListener('click', () => setOpen(false)));
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) { setOpen(false); burger.focus(); } });
    matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches && open) setOpen(false); });

    return {
      update(y, dy) {
        nav.classList.toggle('is-solid', y > 24);
        if (open) return;
        if (y > 260 && dy > 4) nav.classList.add('is-hidden');
        else if (dy < -4 || y < 260) nav.classList.remove('is-hidden');
      },
    };
  }

  /* ───────── 05 · REVELADOS Y CONTADORES ───────── */
  function initReveal() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -7% 0px' });
    $$('[data-reveal], [data-words]:not([data-intro-words]), .svc, .map, .proc__panel').forEach((el) => io.observe(el));

    // Contadores: parten de 0 solo si hay JS y movimiento permitido
    const counters = $$('[data-count]');
    if (reduce) return;
    counters.forEach((c) => { c.textContent = '0'; });
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        const to = Number(e.target.dataset.count);
        const t0 = performance.now();
        const step = (now) => {
          const p = clamp((now - t0) / 1900);
          e.target.textContent = Math.round(to * easeOut(p));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => cio.observe(c));
  }

  /* ───────── 06 · MOTOR DE SCROLL ─────────
     Un solo requestAnimationFrame. Se suaviza el scroll (S.y persigue a
     scrollY) para que todo se sienta "slow motion" sin secuestrar el
     scroll nativo: el sticky sigue siendo nativo, solo los efectos se
     suavizan. */
  const S = { y: 0, ty: 0, vy: 0, vw: innerWidth, vh: innerHeight, max: 1 };
  const absTop = (el) => el.getBoundingClientRect().top + window.scrollY;

  /* ───────── 07 · EFECTOS LIGADOS AL SCROLL ───────── */

  // Barra de progreso + "termómetro" lateral que enfría al bajar
  function fxProgress() {
    const bar = $('.progress i');
    const degEl = $('.hud__deg');
    const hudBar = $('.hud__bar i');
    const secEl = $('.hud__sec');
    const secs = $$('main > section[data-label]');
    let tops = [];
    let lastIdx = -1;
    let lastDeg = '';
    return {
      measure() { tops = secs.map(absTop); },
      update() {
        const p = clamp(S.y / S.max);
        bar.style.transform = `scaleX(${p})`;
        hudBar.style.transform = `scaleY(${p})`;
        const deg = (24 - 8 * p).toFixed(1) + '°C';
        if (deg !== lastDeg) { lastDeg = deg; degEl.textContent = deg; }
        const mid = S.y + S.vh * 0.5;
        let idx = 0;
        for (let i = 0; i < tops.length; i++) if (tops[i] <= mid) idx = i;
        if (idx !== lastIdx) {
          lastIdx = idx;
          secEl.textContent = `${pad(idx + 1)} / ${pad(secs.length)} · ${secs[idx].dataset.label}`;
        }
      },
    };
  }

  // Hero: el contenido se aleja y el medidor reacciona al puntero
  function fxHero() {
    const hero = $('.hero');
    const copy = $('.hero__copy');
    const gauge = $('.gauge');
    const crystals = $('.hero__crystals');
    const facts = $('.hero__facts');
    const m = { x: 0, y: 0, tx: 0, ty: 0 };
    if (fine && !reduce) {
      hero.addEventListener('pointermove', (e) => {
        m.tx = (e.clientX / innerWidth - 0.5) * 2;
        m.ty = (e.clientY / innerHeight - 0.5) * 2;
      }, { passive: true });
      hero.addEventListener('pointerleave', () => { m.tx = 0; m.ty = 0; });
    }
    return {
      update() {
        if (S.y > S.vh * 1.3) return;
        m.x = lerp(m.x, m.tx, 0.06);
        m.y = lerp(m.y, m.ty, 0.06);
        const p = clamp(S.y / (S.vh * 0.9));
        copy.style.transform = `translate3d(0,${(S.y * 0.16).toFixed(1)}px,0)`;
        copy.style.opacity = (1 - p * 0.9).toFixed(3);
        if (facts) facts.style.opacity = (1 - p * 1.4).toFixed(3);
        if (gauge) gauge.style.transform = `translate3d(${(m.x * -16).toFixed(1)}px,${(m.y * -12 + S.y * 0.1).toFixed(1)}px,0)`;
        if (crystals) crystals.style.transform = `translate3d(${(m.x * 12).toFixed(1)}px,${(m.y * 8).toFixed(1)}px,0)`;
      },
    };
  }

  // Obra real: la ventana de la foto se abre hasta ocupar toda la pantalla
  function fxExpand() {
    const ex = $('.expand');
    if (!ex) return null;
    const frame = $('.expand__frame', ex);
    const img = $('.expand__img', ex);
    const wA = $('.expand__w--a', ex);
    const wB = $('.expand__w--b', ex);
    const pct = $('.expand__pct', ex);
    let top = 0, h = 0, lastPct = -1;
    return {
      measure() { top = absTop(ex); h = ex.offsetHeight; },
      update() {
        if (reduce) return;
        if (S.y < top - S.vh || S.y > top + h) return;
        const p = clamp((S.y - top) / Math.max(1, h - S.vh));
        const e = easeIO(clamp(p / 0.78));
        const wide = mqWide.matches;
        const sx = lerp(wide ? 0.34 : 0.74, 1, e);
        const sy = lerp(wide ? 0.46 : 0.4, 1, e);
        const z = lerp(1.38, 1, e);
        frame.style.transform = `scale(${sx.toFixed(4)},${sy.toFixed(4)})`;
        img.style.transform = `scale(${(z / sx).toFixed(4)},${(z / sy).toFixed(4)})`;
        const out = clamp((e - 0.1) / 0.5);
        const d = e * (wide ? S.vw * 0.62 : S.vh * 0.3);
        if (wide) {
          wA.style.transform = `translate3d(${-d.toFixed(1)}px,0,0)`;
          wB.style.transform = `translate3d(${d.toFixed(1)}px,0,0)`;
        } else {
          wA.style.transform = `translate3d(0,${-d.toFixed(1)}px,0)`;
          wB.style.transform = `translate3d(0,${d.toFixed(1)}px,0)`;
        }
        wA.style.opacity = wB.style.opacity = (1 - out).toFixed(3);
        ex.style.setProperty('--hint', (1 - clamp(p / 0.12)).toFixed(3));
        ex.style.setProperty('--cap', clamp((p - 0.8) / 0.16).toFixed(3));
        const v = Math.round(e * 100);
        if (v !== lastPct) { lastPct = v; pct.textContent = pad(v, 3); }
      },
    };
  }

  // Servicios: cada tarjeta se oscurece y encoge al cubrirla la siguiente
  function fxStack() {
    const cards = $$('.svc');
    if (cards.length < 2) return null;
    let stuck = [];
    let active = false;
    const reset = () => cards.forEach((c) => { c.style.transform = ''; c.style.removeProperty('--dim'); });
    return {
      measure() { stuck = cards.map((c) => parseFloat(getComputedStyle(c).top) || 0); },
      update() {
        const on = mqStack.matches && !reduce;
        if (!on) { if (active) { reset(); active = false; } return; }
        active = true;
        for (let i = 0; i < cards.length - 1; i++) {
          const nextTop = cards[i + 1].getBoundingClientRect().top;
          const p = clamp(1 - (nextTop - stuck[i]) / cards[i].offsetHeight);
          cards[i].style.transform = `scale(${(1 - p * 0.05).toFixed(4)})`;
          cards[i].style.setProperty('--dim', (p * 0.7).toFixed(3));
        }
      },
    };
  }

  // Proceso: riel que se llena y paso activo
  function fxProcess() {
    const steps = $('.steps');
    if (!steps) return null;
    const items = $$('.step', steps);
    const digit = $('[data-digit]');
    const now = $('[data-now]');
    let top = 0, h = 1, cur = -1, swapTimer = 0;
    const setStep = (i) => {
      cur = i;
      items.forEach((s, k) => s.classList.toggle('is-active', k === i));
      if (!digit) return;
      digit.classList.add('is-swap');
      clearTimeout(swapTimer);
      swapTimer = setTimeout(() => {
        digit.textContent = pad(i + 1);
        if (now) now.textContent = $('h3', items[i]).textContent;
        digit.classList.remove('is-swap');
      }, 260);
    };
    return {
      measure() { top = absTop(steps); h = steps.offsetHeight; },
      update() {
        if (S.y < top - S.vh * 1.2 || S.y > top + h + S.vh * 0.5) return;
        const p = clamp((S.y + S.vh * 0.62 - top) / h);
        steps.style.setProperty('--rail', p.toFixed(4));
        const mid = S.vh * 0.55;
        let best = 0, bestD = Infinity;
        items.forEach((s, i) => {
          const r = s.getBoundingClientRect();
          const d = Math.abs(r.top + r.height * 0.4 - mid);
          if (d < bestD) { bestD = d; best = i; }
        });
        if (best !== cur) setStep(best);
      },
    };
  }

  // Manifiesto: las palabras se encienden al leer
  function fxScrub() {
    const el = $('[data-scrub]');
    if (!el) return null;
    const words = $$('.sw', el);
    let on = -1;
    return {
      update() {
        if (reduce) return;
        const r = el.getBoundingClientRect();
        if (r.top > S.vh || r.bottom < 0) return;
        const p = clamp((S.vh * 0.88 - r.top) / (r.height + S.vh * 0.36));
        const n = Math.round(p * words.length);
        if (n === on) return;
        on = n;
        words.forEach((w, i) => w.classList.toggle('is-on', i < n));
      },
    };
  }

  // Footer: la palabra FRANCO se llena de cian
  function fxFooter() {
    const foot = $('.foot');
    const word = $('.foot__word');
    if (!foot || !word) return null;
    let top = 0;
    return {
      measure() { top = absTop(word); },
      update() {
        if (S.y + S.vh < top) return;
        word.style.setProperty('--p', clamp((S.y + S.vh - top) / (S.vh * 0.85)).toFixed(3));
      },
    };
  }

  /* ───────── 09 · MARQUEE REACTIVO ───────── */
  function fxMarquee() {
    const rows = $$('.mq__row');
    if (!rows.length) return null;
    let data = [];
    const build = () => {
      data = rows.map((row) => {
        $$('.mq__set', row).slice(1).forEach((c) => c.remove());
        const set = $('.mq__set', row);
        const w = set.getBoundingClientRect().width || 1;
        const copies = Math.ceil((S.vw * 2) / w) + 1;
        for (let i = 0; i < copies; i++) row.appendChild(set.cloneNode(true));
        const dir = Number(row.dataset.dir) || -1;
        return { row, w, dir, speed: Number(row.dataset.speed) || 0.8, x: dir > 0 ? -w : 0 };
      });
    };
    return {
      measure() { build(); },
      update(dt) {
        if (reduce) return;
        const f = dt / 16.667;
        data.forEach((d) => {
          d.x += d.dir * (d.speed + Math.abs(S.vy) * 0.28) * f;
          if (d.dir < 0 && d.x <= -d.w) d.x += d.w;
          if (d.dir > 0 && d.x >= 0) d.x -= d.w;
          d.row.style.transform = `translate3d(${d.x.toFixed(2)}px,0,0)`;
        });
      },
    };
  }

  /* ───────── 08 · HERO: FLUJO DE AIRE (CANVAS) ───────── */
  const hash2 = (x, y) => {
    let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  function vnoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return lerp(lerp(hash2(xi, yi), hash2(xi + 1, yi), u), lerp(hash2(xi, yi + 1), hash2(xi + 1, yi + 1), u), v);
  }

  function initFlow() {
    const cv = $('#flow');
    const hero = $('.hero');
    if (!cv || !cv.getContext) return;
    const ctx = cv.getContext('2d');
    let w = 0, h = 0, parts = [], raf = 0, visible = true, t = 0;
    const mouse = { x: -9999, y: -9999 };

    const spawn = () => ({ x: Math.random() * w, y: Math.random() * h, age: 0, life: 70 + Math.random() * 190, sp: 0.7 + Math.random() * 1.15, c: Math.random() < 0.3 });
    const resize = () => {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, r.width < 700 ? 1.5 : 1.75);
      w = r.width; h = r.height;
      cv.width = Math.max(1, Math.round(w * dpr));
      cv.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      parts = Array.from({ length: clamp(Math.round((w * h) / 8800), 50, 190) }, spawn);
    };

    const step = (fade) => {
      t += 0.016;
      if (fade) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0,0,0,0.085)';
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.lineWidth = 1.1;
      [false, true].forEach((white) => {
        ctx.strokeStyle = white ? 'rgba(220,243,255,.5)' : 'rgba(44,196,255,.55)';
        ctx.beginPath();
        parts.forEach((p) => {
          if (p.c !== white) return;
          const a = (vnoise(p.x * 0.0021 + t * 0.06, p.y * 0.0021 - t * 0.03) * 2 - 1) * Math.PI * 1.15
                  + (vnoise(p.x * 0.0058 - t * 0.1, p.y * 0.0058 + 4.7) - 0.5) * 1.2;
          let vx = (1.15 + Math.cos(a) * 0.9) * p.sp;
          let vy = (-0.08 + Math.sin(a) * 0.9) * p.sp;
          const dx = p.x - mouse.x, dy = p.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 24000) {
            const d = Math.sqrt(d2) || 1;
            const f = (1 - d / 155) * 2.6;
            vx += (dx / d) * f - (dy / d) * f * 0.7;
            vy += (dy / d) * f + (dx / d) * f * 0.7;
          }
          const nx = p.x + vx, ny = p.y + vy;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(nx, ny);
          p.x = nx; p.y = ny; p.age++;
          if (p.age > p.life || nx < -20 || nx > w + 20 || ny < -20 || ny > h + 20) Object.assign(p, spawn(), { x: Math.random() < 0.65 ? -10 : Math.random() * w, y: Math.random() * h });
        });
        ctx.stroke();
      });
    };

    const loop = () => { raf = 0; if (!visible || document.hidden) return; step(true); raf = requestAnimationFrame(loop); };
    const start = () => { if (!raf && !reduce) raf = requestAnimationFrame(loop); };

    resize();
    if (reduce) { for (let i = 0; i < 150; i++) step(false); return; }
    start();
    addEventListener('resize', () => { resize(); }, { passive: true });
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible) start(); }, { threshold: 0 }).observe(hero);
    document.addEventListener('visibilitychange', start);
    hero.addEventListener('pointermove', (e) => {
      const r = cv.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
  }

  // Rotador de especialidades + lecturas del medidor
  function initHeroLive() {
    const items = $$('.rot > span');
    if (items.length > 1 && !reduce) {
      let i = 0;
      setInterval(() => {
        const cur = items[i];
        i = (i + 1) % items.length;
        const nxt = items[i];
        cur.classList.remove('is-on'); cur.classList.add('is-out');
        nxt.classList.remove('is-out'); nxt.classList.add('is-on');
        setTimeout(() => cur.classList.remove('is-out'), 850);
      }, 2800);
    }
    if (reduce) return;
    const live = [
      { el: $('[data-live="supply"]'), v: 14.2, min: 13.4, max: 15.6, s: 0.5, f: (v) => v.toFixed(1) },
      { el: $('[data-live="return"]'), v: 24.0, min: 23.2, max: 24.9, s: 0.4, f: (v) => v.toFixed(1) },
      { el: $('[data-live="flow"]'), v: 1240, min: 1170, max: 1310, s: 36, f: (v) => Math.round(v).toLocaleString('es-MX') },
    ].filter((x) => x.el);
    setInterval(() => {
      if (document.hidden) return;
      live.forEach((l) => { l.v = clamp(l.v + (Math.random() - 0.5) * l.s, l.min, l.max); l.el.textContent = l.f(l.v); });
    }, 1300);
  }

  /* ───────── 10 · PROYECTOS Y VISOR DE FOTOS ───────── */
  // Pestañas por categoría: solo se muestra una sección a la vez
  function initProjects() {
    const tabs = $$('.pj__tab');
    const panels = $$('.pj__panel');
    if (!tabs.length || tabs.length !== panels.length) return;
    const select = (i, focus) => {
      tabs.forEach((t, k) => {
        t.setAttribute('aria-selected', String(k === i));
        t.tabIndex = k === i ? 0 : -1;
        panels[k].hidden = k !== i;
      });
      if (focus) tabs[i].focus();
      // La altura de la página cambia: el motor de scroll tiene que volver a medir
      document.dispatchEvent(new CustomEvent('pj:change'));
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', (e) => {
        const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (to === undefined) return;
        e.preventDefault();
        select((to + tabs.length) % tabs.length, true);
      });
    });
    select(0);
  }

  // Visor: navega solo entre las fotos de la categoría que se abrió
  function initLightbox() {
    const dlg = $('#lightbox');
    if (!dlg || typeof dlg.showModal !== 'function' || !$('.pj__card[data-full]')) return;
    const img = $('.lb__img', dlg);
    const title = $('.lb__title', dlg);
    const idx = $('.lb__idx', dlg);
    let cards = [], cur = 0, lastFocus = null, closing = false, startX = 0;

    const show = (i) => {
      cur = (i + cards.length) % cards.length;
      const c = cards[cur];
      const thumb = $('img', c);
      img.classList.add('is-loading');
      img.onload = img.onerror = () => img.classList.remove('is-loading');
      img.src = c.dataset.full;
      img.alt = thumb ? thumb.alt : '';
      title.textContent = c.dataset.title || '';
      idx.textContent = `${pad(cur + 1)} / ${pad(cards.length)}`;
    };
    const open = (list, i) => {
      cards = list;
      lastFocus = document.activeElement;
      show(i);
      dlg.showModal();
      root.style.overflow = 'hidden';
      document.dispatchEvent(new CustomEvent('lb:open'));
      requestAnimationFrame(() => dlg.classList.add('is-open'));
    };
    const close = () => {
      if (closing) return;
      closing = true;
      dlg.classList.remove('is-open');
      setTimeout(() => {
        dlg.close();
        closing = false;
        root.style.overflow = '';
        document.dispatchEvent(new CustomEvent('lb:close'));
        if (lastFocus) lastFocus.focus({ preventScroll: true });
      }, reduce ? 0 : 380);
    };

    $$('.pj__card[data-full]').forEach((c) => c.addEventListener('click', () => {
      const list = $$('.pj__card[data-full]', c.closest('.pj__panel'));
      open(list, list.indexOf(c));
    }));
    $('.lb__close', dlg).addEventListener('click', close);
    $('.lb__nav--prev', dlg).addEventListener('click', () => show(cur - 1));
    $('.lb__nav--next', dlg).addEventListener('click', () => show(cur + 1));
    dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
    dlg.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') show(cur + 1);
      if (e.key === 'ArrowLeft') show(cur - 1);
    });
    dlg.addEventListener('touchstart', (e) => { startX = e.changedTouches[0].clientX; }, { passive: true });
    dlg.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 55) show(cur + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  /* ───────── 11 · PREGUNTAS FRECUENTES ───────── */
  function initFaq() {
    const qas = $$('.qa');
    const toggle = (qa, open) => {
      qa.classList.toggle('is-open', open);
      $('.qa__q', qa).setAttribute('aria-expanded', String(open));
    };
    qas.forEach((qa) => {
      $('.qa__q', qa).addEventListener('click', () => {
        const open = !qa.classList.contains('is-open');
        qas.forEach((o) => { if (o !== qa) toggle(o, false); });
        toggle(qa, open);
      });
    });
    if (qas[0]) toggle(qas[0], true);
  }

  /* ───────── 12 · FORMULARIO → WHATSAPP ───────── */
  function initForm() {
    const form = $('#quote-form');
    if (!form) return;
    const PHONE = '525511546544';
    const f = {
      name: $('#f-name'), phone: $('#f-phone'), service: $('#f-service'),
      city: $('#f-city'), msg: $('#f-msg'),
    };
    const ok = $('#form-ok');
    const fallback = $('#form-fallback');

    const digits = (v) => {
      let d = v.replace(/\D/g, '');
      if (d.length === 13 && d.startsWith('521')) d = d.slice(3);
      else if (d.length === 12 && d.startsWith('52')) d = d.slice(2);
      return d;
    };
    const fmtPhone = (d) => [d.slice(0, 2), d.slice(2, 6), d.slice(6, 10)].filter(Boolean).join(' ');
    const rules = {
      name: (v) => (v.trim().length >= 2 ? '' : 'Escribe tu nombre para saber a quién responderle.'),
      phone: (v) => (digits(v).length === 10 ? '' : 'Escribe un teléfono de 10 dígitos para poder contactarte.'),
      service: (v) => (v ? '' : 'Elige qué necesitas para cotizarte mejor.'),
    };
    const setErr = (key, msg) => {
      const field = f[key].closest('.field');
      const err = $('.field__err', field);
      field.classList.toggle('is-err', !!msg);
      f[key].setAttribute('aria-invalid', msg ? 'true' : 'false');
      err.textContent = msg;
    };

    Object.keys(rules).forEach((k) => f[k].addEventListener('input', () => setErr(k, '')));
    f.service.addEventListener('change', () => setErr('service', ''));
    f.phone.addEventListener('input', () => {
      const d = digits(f.phone.value).slice(0, 10);
      f.phone.value = fmtPhone(d);
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let first = null;
      Object.keys(rules).forEach((k) => {
        const msg = rules[k](f[k].value);
        setErr(k, msg);
        if (msg && !first) first = f[k];
      });
      if (first) { first.focus(); return; }

      const lines = [
        `Hola Leonardo, soy ${f.name.value.trim()}.`,
        `Quiero cotizar: ${f.service.value}.`,
      ];
      if (f.city.value.trim()) lines.push(`Mi obra está en: ${f.city.value.trim()}.`);
      if (f.msg.value.trim()) lines.push(`Detalles: ${f.msg.value.trim()}`);
      lines.push(`Mi teléfono: ${fmtPhone(digits(f.phone.value))}.`);
      lines.push('Te escribo desde tu página web.');
      const url = `https://wa.me/${PHONE}?text=${encodeURIComponent(lines.join('\n'))}`;

      fallback.href = url;
      ok.hidden = false;
      const win = window.open(url, '_blank');
      if (win) win.opener = null; else window.location.href = url;
    });
  }

  /* ───────── 13 · CURSOR, MAGNÉTICOS Y EXTRAS ───────── */
  function initCursor() {
    if (!fine || reduce) return;
    const cur = document.createElement('div');
    cur.className = 'cur';
    cur.setAttribute('aria-hidden', 'true');
    cur.innerHTML = '<span class="cur__ring"></span><span class="cur__dot"></span>';
    document.body.appendChild(cur);
    const ring = $('.cur__ring', cur);
    const dot = $('.cur__dot', cur);
    let x = -100, y = -100, rx = -100, ry = -100, shown = false, paused = false;

    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX; y = e.clientY;
      if (!shown) { shown = true; rx = x; ry = y; if (!paused) root.classList.add('has-cursor'); }
    }, { passive: true });
    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest('a, button, [data-cursor], input, select, textarea, label');
      const view = !!(t && t.dataset && t.dataset.cursor);
      cur.classList.toggle('is-view', view);
      cur.classList.toggle('is-link', !!t && !view);
    });
    addEventListener('pointerdown', () => cur.classList.add('is-down'));
    addEventListener('pointerup', () => cur.classList.remove('is-down'));
    document.addEventListener('mouseleave', () => root.classList.remove('has-cursor'));
    document.addEventListener('mouseenter', () => { if (shown && !paused) root.classList.add('has-cursor'); });
    // El visor usa la capa superior del navegador: devolvemos el cursor nativo
    document.addEventListener('lb:open', () => { paused = true; root.classList.remove('has-cursor'); });
    document.addEventListener('lb:close', () => { paused = false; if (shown) root.classList.add('has-cursor'); });

    (function loop() {
      rx = lerp(rx, x, 0.17); ry = lerp(ry, y, 0.17);
      dot.style.translate = `${x}px ${y}px`;
      ring.style.translate = `${rx}px ${ry}px`;
      requestAnimationFrame(loop);
    })();
  }

  function initMagnetic() {
    if (!fine || reduce) return;
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate3d(${(dx * 0.22).toFixed(1)}px,${(dy * 0.3).toFixed(1)}px,0)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  function initCells() {
    $$('.cell').forEach((c) => c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', `${e.clientX - r.left}px`);
      c.style.setProperty('--my', `${e.clientY - r.top}px`);
    }));
  }

  // Lista de espacios: la foto sigue al puntero (solo escritorio con mouse)
  function initSpaces() {
    if (!fine) return;
    $$('.spl__row').forEach((row) => {
      const peek = $('.spl__peek', row);
      if (!peek) return;
      let tx = 0, ty = 0, cx = 0, cy = 0, cs = 0.86, ts = 0.86, raf = 0, active = false;
      const run = () => {
        cx = lerp(cx, tx, 0.14); cy = lerp(cy, ty, 0.14); cs = lerp(cs, ts, 0.12);
        peek.style.setProperty('--px', `${cx.toFixed(1)}px`);
        peek.style.setProperty('--py', `${cy.toFixed(1)}px`);
        peek.style.setProperty('--sc', cs.toFixed(3));
        raf = (active || Math.abs(cs - ts) > 0.002 || Math.abs(cx - tx) > 0.4) ? requestAnimationFrame(run) : 0;
      };
      row.addEventListener('pointerenter', () => { active = true; ts = 1; row.classList.add('is-hover'); if (!raf) raf = requestAnimationFrame(run); });
      row.addEventListener('pointermove', (e) => {
        const r = row.getBoundingClientRect();
        const restX = r.left + r.width * 0.86 - peek.offsetWidth / 2;
        tx = (e.clientX - restX) * 0.5;
        ty = (e.clientY - (r.top + r.height / 2)) * 0.55;
      });
      row.addEventListener('pointerleave', () => { active = false; ts = 0.86; row.classList.remove('is-hover'); if (!raf) raf = requestAnimationFrame(run); });
    });
  }

  // Botón de WhatsApp: recordatorio amable una sola vez
  function initWaHint() {
    const wa = $('.wa');
    if (!wa || reduce) return;
    setTimeout(() => {
      wa.classList.add('is-hint');
      setTimeout(() => wa.classList.remove('is-hint'), 5200);
    }, 9000);
  }

  /* ───────── ARRANQUE ───────── */
  function boot() {
    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();

    initWords();
    initFlow();
    initHeroLive();
    initReveal();
    initFaq();
    initForm();
    initProjects();
    initLightbox();
    initCursor();
    initMagnetic();
    initCells();
    initSpaces();
    initWaHint();
    const nav = initNav();

    const fx = [fxMarquee(), fxExpand(), fxStack(), fxProcess(), fxFooter(), fxProgress(), fxHero(), fxScrub()].filter(Boolean);

    const measure = () => {
      S.vw = innerWidth; S.vh = innerHeight;
      S.max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      fx.forEach((f) => f.measure && f.measure());
      S.max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    };
    let measureTimer = 0;
    const remeasure = () => { clearTimeout(measureTimer); measureTimer = setTimeout(measure, 120); };
    document.addEventListener('pj:change', remeasure);

    let lastW = innerWidth, lastH = innerHeight;
    addEventListener('resize', () => {
      // En móviles la barra del navegador cambia la altura: ignoramos saltos pequeños
      if (innerWidth === lastW && Math.abs(innerHeight - lastH) < 140) return;
      lastW = innerWidth; lastH = innerHeight;
      remeasure();
    }, { passive: true });
    addEventListener('load', remeasure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
    mqWide.addEventListener('change', remeasure);
    mqStack.addEventListener('change', remeasure);

    measure();
    S.y = S.ty = window.scrollY;

    let prev = performance.now();
    let lastRaw = window.scrollY;
    const frame = (now) => {
      const dt = Math.min(50, now - prev);
      prev = now;
      S.ty = window.scrollY;
      const k = reduce ? 1 : 1 - Math.pow(1 - 0.13, dt / 16.667);
      const before = S.y;
      S.y += (S.ty - S.y) * k;
      if (Math.abs(S.ty - S.y) < 0.08) S.y = S.ty;
      S.vy = S.y - before;
      nav.update(S.ty, S.ty - lastRaw);
      lastRaw = S.ty;
      for (let i = 0; i < fx.length; i++) fx[i].update(dt);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);

    initPreloader(() => {
      remeasure();
      // Si llegaron con #ancla, los efectos fijos ya están medidos: saltamos a ella
      if (location.hash.length > 1) {
        const t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (t) setTimeout(() => t.scrollIntoView({ block: 'start' }), 900);
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
