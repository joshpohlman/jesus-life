import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PHASES, phaseColor, phaseGlow } from '../data/phases.js';
import { EVENTS } from '../data/events.js';
import { mediaFor } from '../data/media.js';
import { HolyLandMap } from './map.js';

gsap.registerPlugin(ScrollTrigger);

const total = EVENTS.length;
let active = 0;
let locked = false;
let lastPhase = EVENTS[0].phase;

const $ = (id) => document.getElementById(id);
const story = $('story-column');
const map = new HolyLandMap('map', EVENTS);

const icons = {
  time: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  place: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  book: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>',
  expand: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  zoom: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M11 8v6M8 11h6"/></svg>',
};

function bibleUrl(ref) {
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref.split('|')[0].trim())}&version=NIV`;
}

function verseWords(html) {
  return html.replace(/(<[^>]+>)|(\S+)/g, (m, tag, word) => {
    if (tag) return tag;
    return `<span class="verse-word">${word}</span> `;
  });
}

function setTheme(phase) {
  const c = phaseColor(phase);
  const g = phaseGlow(phase);
  document.documentElement.style.setProperty('--phase-color', c);
  document.documentElement.style.setProperty('--phase-glow', g);
  $('map-rail-glow').style.background =
    `radial-gradient(ellipse 80% 50% at 50% 30%, ${g}, transparent 65%)`;
}

function setupHolyImageFallback() {
  document.addEventListener('error', (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement)) return;
    if (!img.classList.contains('holy-image') && img.dataset.role !== 'backdrop') return;

    const hide = () => {
      const frame = img.closest('.visual-frame');
      if (frame) frame.classList.add('image-missing');
      const backdrop = img.closest('.moment-backdrop');
      if (backdrop) backdrop.classList.add('image-missing');
      img.removeAttribute('src');
    };

    if (img.dataset.fallbackTried === '1') {
      hide();
      return;
    }

    const fallback = img.dataset.fallback;
    if (fallback && fallback !== img.src) {
      img.dataset.fallbackTried = '1';
      img.src = fallback;
    } else {
      img.dataset.fallbackTried = '1';
      hide();
    }
  }, true);
}

function buildStory() {
  let phase = '';
  EVENTS.forEach((ev, i) => {
    if (ev.phase !== phase) {
      phase = ev.phase;
      const ph = PHASES.find(p => p.label === ev.phase);
      const b = document.createElement('section');
      b.className = 'phase-banner';
      b.dataset.chapter = String(ph?.id).padStart(2, '0');
      b.style.setProperty('--phase-color', ph?.color);
      b.style.setProperty('--phase-glow', ph?.glow);
      b.innerHTML = `
        <div class="phase-banner-glow"></div>
        <p class="phase-label" style="color:${ph?.color}">Chapter ${ph?.id}</p>
        <h2 class="phase-title">${ev.phase}</h2>
        <p class="phase-desc">${ph?.description ?? ''}</p>
        <div class="phase-rule" style="background:${ph?.color};box-shadow:0 0 12px ${ph?.glow}"></div>
        <button class="phase-enter-btn" type="button" data-phase-start="${i}">Enter chapter →</button>`;
      story.appendChild(b);
    }

    const m = mediaFor(ev);
    const color = phaseColor(ev.phase);
    const glow = phaseGlow(ev.phase);
    const s = document.createElement('section');
    s.className = 'moment';
    s.id = `moment-${i}`;
    s.dataset.index = i;
    s.style.setProperty('--phase-color', color);
    s.style.setProperty('--phase-glow', glow);

    const recon = ev.recon ? `
      <div class="visual-frame tertiary reveal-visual" data-gallery="recon">
        <span class="recon-tag">Historical reconstruction</span>
        <button class="visual-zoom" type="button" aria-label="Expand image">${icons.zoom}</button>
        <img src="${ev.recon}" alt="Reconstruction" loading="lazy" class="holy-image" />
        <div class="visual-shine"></div>
        <span class="visual-caption">Artist reconstruction</span>
      </div>` : '';

    s.innerHTML = `
      <div class="moment-backdrop">
        <img src="${m.backdrop}" alt="" loading="${i < 3 ? 'eager' : 'lazy'}" data-role="backdrop" data-fallback="${m.photo}" class="holy-image" />
        <div class="moment-backdrop-shade"></div>
      </div>
      <div class="moment-glow"></div>
      <div class="moment-inner">
        <header class="moment-header">
          <p class="moment-index">
            <span class="moment-index-num">${String(i + 1).padStart(2, '0')}</span>
            Moment ${i + 1} of ${total}
          </p>
          <h2 class="moment-title">${ev.title}</h2>
          <p class="moment-sub">${ev.subtitle}</p>
          <div class="moment-meta">
            <span class="meta-pill">${icons.time} ${ev.date}</span>
            <span class="meta-pill">${icons.place} ${ev.place}</span>
            <span class="meta-pill">${icons.book} <a href="${bibleUrl(ev.scripture)}" target="_blank" rel="noopener">${ev.scripture}</a></span>
          </div>
        </header>
        <div class="moment-copy">
          <blockquote class="verse-block">
            <p class="verse-text">${verseWords(ev.verse)}</p>
            <cite>${ev.scripture}</cite>
          </blockquote>
          <p class="moment-narrative">${ev.narrative}</p>
          <div class="info-cards">
            <button class="info-card history" type="button" aria-expanded="false">
              <h4>◆ Historical context</h4>
              <p>${ev.history}</p>
              <span class="info-card-hint">Tap to expand</span>
            </button>
            <button class="info-card discovery" type="button" aria-expanded="false">
              <h4>◆ Archaeology</h4>
              <p>${ev.discovery}</p>
              <span class="info-card-hint">Tap to expand</span>
            </button>
          </div>
        </div>
        <div class="moment-visuals">
          <div class="gallery-tabs" role="tablist">
            <button class="gallery-tab active" type="button" role="tab" data-tab="site" aria-selected="true">Sacred site</button>
            <button class="gallery-tab" type="button" role="tab" data-tab="detail" aria-selected="false">Archaeology</button>
          </div>
          <div class="visual-frame primary reveal-visual is-gallery-active" data-gallery="site">
            <button class="visual-zoom" type="button" aria-label="Expand image" data-lightbox-src="${m.photo}" data-lightbox-label="${m.photoLabel}">${icons.zoom}</button>
            <img src="${m.photo}" alt="${m.photoLabel}" loading="lazy" data-fallback="${m.detail}" class="holy-image gallery-photo" data-label="${m.photoLabel}" />
            <div class="visual-shine"></div>
            <span class="visual-caption">${m.photoLabel}</span>
          </div>
          <div class="visual-frame secondary reveal-visual" data-gallery="detail">
            <button class="visual-zoom" type="button" aria-label="Expand image" data-lightbox-src="${m.detail}" data-lightbox-label="${m.detailLabel}">${icons.zoom}</button>
            <img src="${m.detail}" alt="${m.detailLabel}" loading="lazy" data-fallback="${m.photo}" class="holy-image gallery-detail" data-label="${m.detailLabel}" />
            <div class="visual-shine"></div>
            <span class="visual-caption">${m.detailLabel}</span>
          </div>
          ${recon}
        </div>
      </div>`;
    story.appendChild(s);
  });
}

function buildScrubber() {
  const track = $('scrubber-track');
  EVENTS.forEach((ev, i) => {
    const m = mediaFor(ev);
    const b = document.createElement('button');
    b.className = 'scrubber-tick';
    b.title = ev.title;
    b.style.setProperty('--tick-color', phaseColor(ev.phase));
    b.innerHTML = `<span class="scrubber-preview"><img src="${m.photo}" alt="" loading="lazy" /><strong>${ev.title}</strong><em>${ev.place}</em></span>`;
    b.addEventListener('click', () => goTo(i));
    track.appendChild(b);
  });
}

function flashChapter(phase) {
  const ph = PHASES.find(p => p.label === phase);
  const el = document.createElement('div');
  el.className = 'chapter-flash';
  el.style.setProperty('--flash-color', ph?.color ?? '#d4af37');
  el.innerHTML = `<span>Chapter ${ph?.id}</span><strong>${phase}</strong>`;
  document.body.appendChild(el);
  gsap.timeline()
    .fromTo(el, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'power2.out' })
    .to(el, { opacity: 0, y: -30, duration: 0.6, delay: 0.5, ease: 'power2.in', onComplete: () => el.remove() });
}

function animateVerse(momentEl) {
  const words = momentEl.querySelectorAll('.verse-word');
  gsap.fromTo(words,
    { opacity: 0.15, y: 6 },
    { opacity: 1, y: 0, duration: 0.5, stagger: 0.025, ease: 'power2.out' }
  );
}

function animateActiveMoment(i) {
  const moment = document.getElementById(`moment-${i}`);
  if (!moment) return;

  document.querySelectorAll('.moment .visual-frame.primary img').forEach(img => {
    img.style.animation = 'none';
  });

  const primaryImg = moment.querySelector('.visual-frame.primary img');
  if (primaryImg) {
    primaryImg.style.animation = 'kenBurns 18s ease-in-out infinite alternate';
  }

  const backdrop = moment.querySelector('.moment-backdrop img');
  if (backdrop) {
    gsap.fromTo(backdrop, { scale: 1.12, opacity: 0.5 }, { scale: 1.05, opacity: 1, duration: 1.2, ease: 'power2.out' });
  }

  animateVerse(moment);
}

function updateUI(i) {
  const ev = EVENTS[i];
  const c = phaseColor(ev.phase);
  const ph = PHASES.find(p => p.label === ev.phase);
  const pct = Math.round(((i + 1) / total) * 100);

  if (ev.phase !== lastPhase) {
    flashChapter(ev.phase);
    lastPhase = ev.phase;
  }

  setTheme(ev.phase);

  $('map-phase').textContent = ev.phase;
  $('map-phase').style.color = c;
  $('map-title').textContent = ev.title;
  $('map-place').textContent = ev.place;
  $('map-progress-fill').style.width = `${pct}%`;
  $('map-progress-fill').style.background = `linear-gradient(90deg, ${c}, ${c}cc)`;
  $('map-counter').textContent = `${String(i + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
  $('progress-bar').style.width = `${pct}%`;
  $('progress-glow').style.width = `${pct}%`;
  $('btn-prev').disabled = i === 0;
  $('btn-next').disabled = i === total - 1;

  $('nav-chapter').textContent = `Chapter ${ph?.id ?? 1}`;
  $('nav-moment').textContent = ev.title;
  $('nav-pct').textContent = `${pct}%`;

  document.querySelectorAll('.moment').forEach((el, j) => el.classList.toggle('is-active', j === i));
  document.querySelectorAll('.scrubber-tick').forEach((el, j) => {
    el.classList.toggle('active', j === i);
    el.classList.toggle('done', j < i);
  });

  $('mobile-counter') && ($('mobile-counter').textContent = `${String(i + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`);
  $('mobile-title') && ($('mobile-title').textContent = ev.title);
  const mobileProg = $('mobile-progress');
  if (mobileProg) {
    mobileProg.style.width = `${pct}%`;
    mobileProg.style.background = `linear-gradient(90deg, ${c}, ${c}cc)`;
  }
  $('mobile-btn-prev') && ($('mobile-btn-prev').disabled = i === 0);
  $('mobile-btn-next') && ($('mobile-btn-next').disabled = i === total - 1);

  document.querySelectorAll('.mobile-moment-chip').forEach((el, j) => {
    el.classList.toggle('active', j === i);
    if (j === i) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  });

  map.goTo(i);
  updateSpine(i);
  animateActiveMoment(i);
}

function updateSpine(i) {
  const moment = document.getElementById(`moment-${i}`);
  const spine = $('story-spine');
  if (!moment || !spine) return;
  const colTop = story.getBoundingClientRect().top + window.scrollY;
  const momentTop = moment.offsetTop;
  const momentMid = momentTop + moment.offsetHeight * 0.4;
  spine.style.height = `${momentMid - colTop}px`;
}

function goTo(i) {
  locked = true;
  active = i;
  updateUI(i);
  const el = document.getElementById(`moment-${i}`);
  if (el) {
    if (document.body.classList.contains('is-mobile')) {
      const mapH = document.getElementById('map-rail')?.offsetHeight ?? 0;
      const top = el.getBoundingClientRect().top + window.scrollY - mapH - 8;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  setTimeout(() => { locked = false; }, 900);
}

function setupObserver() {
  const obs = new IntersectionObserver((entries) => {
    if (locked) return;
    entries.forEach(e => {
      if (e.isIntersecting) {
        const i = Number(e.target.dataset.index);
        if (i !== active) { active = i; updateUI(i); }
      }
    });
  }, { threshold: 0.42, rootMargin: '-6% 0px -6% 0px' });
  document.querySelectorAll('.moment').forEach(m => obs.observe(m));
}

function setupGalleryTabs() {
  document.querySelectorAll('.moment').forEach(moment => {
    const tabs = moment.querySelectorAll('.gallery-tab');
    const siteFrame = moment.querySelector('[data-gallery="site"]');
    const detailFrame = moment.querySelector('[data-gallery="detail"]');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const isSite = tab.dataset.tab === 'site';
        tabs.forEach(t => {
          t.classList.toggle('active', t === tab);
          t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
        });
        siteFrame?.classList.toggle('is-gallery-active', isSite);
        detailFrame?.classList.toggle('is-gallery-active', !isSite);
        gsap.fromTo(isSite ? siteFrame : detailFrame,
          { opacity: 0, scale: 0.94, x: isSite ? -20 : 20 },
          { opacity: 1, scale: 1, x: 0, duration: 0.55, ease: 'power3.out' }
        );
      });
    });
  });
}

function setupInfoCards() {
  document.querySelectorAll('.info-card').forEach(card => {
    card.addEventListener('click', () => {
      const open = card.classList.toggle('is-open');
      card.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        gsap.fromTo(card, { scale: 0.98 }, { scale: 1, duration: 0.35, ease: 'back.out(1.4)' });
      }
    });
  });
}

function setupLightbox() {
  const lb = $('lightbox');
  const lbImg = $('lightbox-img');
  const lbCap = $('lightbox-caption');
  let lbIndex = 0;
  const images = [];

  EVENTS.forEach((ev, i) => {
    const m = mediaFor(ev);
    images.push({ src: m.photo, label: m.photoLabel, moment: i });
    images.push({ src: m.detail, label: m.detailLabel, moment: i });
  });

  function openLightbox(src, label, momentIdx) {
    lbIndex = images.findIndex(im => im.src === src && im.moment === momentIdx);
    if (lbIndex < 0) lbIndex = 0;
    lbImg.src = images[lbIndex].src;
    lbCap.textContent = images[lbIndex].label;
    lb.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    gsap.fromTo(lb.querySelector('.lightbox-panel'), { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'power3.out' });
  }

  function closeLightbox() {
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function stepLightbox(dir) {
    lbIndex = (lbIndex + dir + images.length) % images.length;
    const im = images[lbIndex];
    gsap.to(lbImg, {
      opacity: 0, duration: 0.15, onComplete: () => {
        lbImg.src = im.src;
        lbCap.textContent = im.label;
        gsap.to(lbImg, { opacity: 1, duration: 0.25 });
        goTo(im.moment);
      },
    });
  }

  document.querySelectorAll('.visual-zoom').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const moment = btn.closest('.moment');
      const idx = Number(moment?.dataset.index ?? 0);
      const src = btn.dataset.lightboxSrc || btn.parentElement.querySelector('img')?.src;
      const label = btn.dataset.lightboxLabel || btn.parentElement.querySelector('img')?.dataset.label || '';
      if (src) openLightbox(src, label, idx);
    });
  });

  document.querySelectorAll('.visual-frame img.holy-image').forEach(img => {
    img.addEventListener('click', () => {
      const moment = img.closest('.moment');
      const idx = Number(moment?.dataset.index ?? 0);
      openLightbox(img.src, img.dataset.label || '', idx);
    });
  });

  lb?.querySelector('.lightbox-close')?.addEventListener('click', closeLightbox);
  lb?.querySelector('.lightbox-prev')?.addEventListener('click', () => stepLightbox(-1));
  lb?.querySelector('.lightbox-next')?.addEventListener('click', () => stepLightbox(1));
  lb?.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });

  window.addEventListener('keydown', e => {
    if (!lb?.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') stepLightbox(-1);
    if (e.key === 'ArrowRight') stepLightbox(1);
  });
}

function setupPhaseButtons() {
  document.querySelectorAll('.phase-enter-btn').forEach(btn => {
    btn.addEventListener('click', () => goTo(Number(btn.dataset.phaseStart)));
  });
}

function buildMobileMomentStrip() {
  const scroll = $('mobile-moment-scroll');
  if (!scroll) return;
  EVENTS.forEach((ev, i) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'mobile-moment-chip';
    chip.dataset.index = i;
    chip.style.setProperty('--chip-color', phaseColor(ev.phase));
    chip.innerHTML = `<span class="chip-num">${String(i + 1).padStart(2, '0')}</span><span class="chip-title">${ev.title}</span>`;
    chip.addEventListener('click', () => goTo(i));
    scroll.appendChild(chip);
  });
}

function setupMobileDock() {
  $('mobile-btn-prev')?.addEventListener('click', () => goTo(active - 1));
  $('mobile-btn-next')?.addEventListener('click', () => goTo(active + 1));

  const mq = window.matchMedia('(max-width: 768px)');
  const apply = () => document.body.classList.toggle('is-mobile', mq.matches);
  apply();
  mq.addEventListener('change', apply);

  ScrollTrigger.create({
    trigger: '#journey',
    start: 'top 85%',
    onEnter: () => document.body.classList.add('journey-active'),
    onLeaveBack: () => document.body.classList.remove('journey-active'),
  });
}

function setupMobileMapToggle() {
  const rail = $('map-rail');
  const btn = $('mobile-map-toggle');
  if (!rail || !btn) return;

  const states = ['map-rail--compact', 'map-rail--collapsed', 'map-rail--open'];
  let mode = 0;
  const mq = window.matchMedia('(max-width: 768px)');

  const sync = () => {
    states.forEach(s => rail.classList.remove(s));
    if (mq.matches) {
      rail.classList.add(states[mode]);
      btn.setAttribute('aria-expanded', mode !== 1 ? 'true' : 'false');
    } else {
      mode = 0;
      btn.setAttribute('aria-expanded', 'false');
    }
    setTimeout(() => map.map?.invalidateSize(), 320);
  };

  btn.addEventListener('click', () => {
    if (!mq.matches) return;
    mode = (mode + 1) % 3;
    sync();
  });

  mq.addEventListener('change', () => { mode = 0; sync(); });
  sync();
}

function setupSwipeNavigation() {
  let startX = 0;
  let startY = 0;
  let tracking = false;

  const canSwipe = (target) => {
    if ($('lightbox')?.classList.contains('is-open')) return false;
    if (target.closest('.mobile-moment-scroll, .leaflet-container, .lightbox, .gallery-tabs, .info-card')) return false;
    return document.body.classList.contains('is-mobile');
  };

  document.querySelectorAll('.moment').forEach(moment => {
    moment.addEventListener('touchstart', (e) => {
      if (!canSwipe(e.target) || e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = true;
    }, { passive: true });

    moment.addEventListener('touchmove', (e) => {
      if (!tracking) return;
      const dx = Math.abs(e.touches[0].clientX - startX);
      const dy = Math.abs(e.touches[0].clientY - startY);
      if (dx > dy && dx > 12) e.preventDefault();
    }, { passive: false });

    moment.addEventListener('touchend', (e) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) < 56 || Math.abs(dy) > Math.abs(dx)) return;
      moment.classList.add(dx < 0 ? 'swipe-left' : 'swipe-right');
      setTimeout(() => moment.classList.remove('swipe-left', 'swipe-right'), 400);
      if (dx < 0 && active < total - 1) goTo(active + 1);
      else if (dx > 0 && active > 0) goTo(active - 1);
    }, { passive: true });
  });

  const hint = $('swipe-hint');
  if (hint && !localStorage.getItem('jl-swipe-hint')) {
    ScrollTrigger.create({
      trigger: '#moment-0',
      start: 'top 70%',
      once: true,
      onEnter: () => {
        hint.hidden = false;
        gsap.fromTo(hint, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 });
        setTimeout(() => {
          gsap.to(hint, { opacity: 0, duration: 0.5, onComplete: () => { hint.hidden = true; } });
          localStorage.setItem('jl-swipe-hint', '1');
        }, 3200);
      },
    });
  }
}

function initStarfield() {
  const canvas = $('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];
  let w, h;
  let mx = 0.5;
  let my = 0.5;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    stars = Array.from({ length: Math.floor(w * h / 7000) }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.4 + 0.2,
      a: Math.random(),
      sp: Math.random() * 0.004 + 0.001,
      ox: Math.random() * w,
      oy: Math.random() * h,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    stars.forEach(s => {
      s.a += s.sp;
      const flicker = 0.25 + Math.abs(Math.sin(s.a)) * 0.75;
      const px = s.ox + (mx - 0.5) * 30;
      const py = s.oy + (my - 0.5) * 20;
      ctx.beginPath();
      ctx.arc(px, py, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(244,240,232,${flicker * 0.55})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  resize();
  draw();
  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', e => {
    mx = e.clientX / window.innerWidth;
    my = e.clientY / window.innerHeight;
  }, { passive: true });
}

function setupHeroAnim() {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('.hero-eyebrow', { y: 20, opacity: 0, duration: 0.8 }, 0.3)
    .from('.hero-line', { y: '110%', duration: 1.1, stagger: 0.12 }, 0.45)
    .from('.hero-lead', { y: 24, opacity: 0, duration: 0.9 }, 0.85)
    .from('.hero-stat', { y: 20, opacity: 0, duration: 0.7, stagger: 0.1 }, 1)
    .from('.hero-cta', { y: 16, opacity: 0, duration: 0.8 }, 1.25)
    .from('.scroll-hint', { opacity: 0, duration: 0.8 }, 1.5);

  gsap.to('.hero-backdrop img', {
    scale: 1.18,
    ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1.5 },
  });

  const hero = $('hero');
  hero?.addEventListener('mousemove', e => {
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to('.hero-inner', { x: x * 18, y: y * 10, duration: 0.6, ease: 'power2.out' });
    gsap.to('.hero-backdrop img', { x: x * -30, y: y * -20, duration: 0.8, ease: 'power2.out' });
  });
  hero?.addEventListener('mouseleave', () => {
    gsap.to('.hero-inner', { x: 0, y: 0, duration: 0.8, ease: 'power2.out' });
    gsap.to('.hero-backdrop img', { x: 0, y: 0, duration: 1, ease: 'power2.out' });
  });
}

function setupAnimations() {
  gsap.utils.toArray('.phase-banner').forEach(banner => {
    const els = banner.querySelectorAll('.phase-label, .phase-title, .phase-desc, .phase-rule, .phase-enter-btn');
    gsap.from(els, {
      y: 50,
      opacity: 0,
      duration: 1,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: banner, start: 'top 72%', toggleActions: 'play none none reverse' },
    });
  });

  document.querySelectorAll('.moment').forEach(moment => {
    const title = moment.querySelector('.moment-title');
    const header = moment.querySelectorAll('.moment-index, .moment-sub, .meta-pill');
    const copy = moment.querySelectorAll('.verse-block, .moment-narrative, .info-card');
    const visuals = moment.querySelectorAll('.reveal-visual, .gallery-tabs');

    gsap.from(title, {
      y: 60,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: moment, start: 'top 70%', toggleActions: 'play none none reverse' },
    });
    gsap.from(header, {
      y: 30,
      opacity: 0,
      duration: 0.8,
      stagger: 0.08,
      ease: 'power2.out',
      scrollTrigger: { trigger: moment, start: 'top 68%', toggleActions: 'play none none reverse' },
    });
    gsap.from(copy, {
      x: -40,
      opacity: 0,
      duration: 0.9,
      stagger: 0.1,
      ease: 'power2.out',
      scrollTrigger: { trigger: moment, start: 'top 62%', toggleActions: 'play none none reverse' },
    });
    gsap.from(visuals, {
      x: 50,
      opacity: 0,
      scale: 0.94,
      duration: 1,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: moment, start: 'top 65%', toggleActions: 'play none none reverse' },
    });

    const bg = moment.querySelector('.moment-backdrop img');
    if (bg) {
      gsap.to(bg, {
        y: '-10%',
        ease: 'none',
        scrollTrigger: { trigger: moment, start: 'top bottom', end: 'bottom top', scrub: 1.4 },
      });
    }
  });

  ScrollTrigger.create({
    trigger: '#journey',
    start: 'top 60px',
    onEnter: () => $('site-nav')?.classList.add('is-visible'),
    onLeaveBack: () => $('site-nav')?.classList.remove('is-visible'),
  });

  gsap.from('#epilogue > *', {
    y: 40,
    opacity: 0,
    duration: 0.9,
    stagger: 0.12,
    ease: 'power2.out',
    scrollTrigger: { trigger: '#epilogue', start: 'top 80%' },
  });
}

setupHolyImageFallback();
buildStory();
buildScrubber();
buildMobileMomentStrip();
map.init();
map.onMarkerClick = goTo;
initStarfield();
updateUI(0);
setupObserver();
setupHeroAnim();
setupAnimations();
setupGalleryTabs();
setupInfoCards();
setupLightbox();
setupPhaseButtons();
setupMobileDock();
setupMobileMapToggle();
setupSwipeNavigation();

$('btn-prev').addEventListener('click', () => goTo(active - 1));
$('btn-next').addEventListener('click', () => goTo(active + 1));
window.addEventListener('keydown', e => {
  if ($('lightbox')?.classList.contains('is-open')) return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); if (active < total - 1) goTo(active + 1); }
  if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); if (active > 0) goTo(active - 1); }
});
window.addEventListener('scroll', () => updateSpine(active), { passive: true });
window.addEventListener('resize', () => updateSpine(active));