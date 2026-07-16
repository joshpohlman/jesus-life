import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PHASES, phaseColor, phaseGlow } from '../data/phases.js';
import { EVENTS } from '../data/events.js';
import { mediaFor, thumb } from '../data/media.js';
import { HolyLandMap } from './map.js';

gsap.registerPlugin(ScrollTrigger);

const total = EVENTS.length;
let active = 0;
let locked = false;

const $ = (id) => document.getElementById(id);
const story = $('story-column');
const map = new HolyLandMap('map', EVENTS);

/** Prefix local asset paths with the Vite base so they work on GitHub Pages */
const asset = (p) => import.meta.env.BASE_URL + String(p).replace(/^\//, '');

const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

function bibleUrl(ref) {
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref.split('|')[0].trim())}&version=NIV`;
}

function setTheme(phase) {
  document.documentElement.style.setProperty('--phase-color', phaseColor(phase));
  document.documentElement.style.setProperty('--phase-glow', phaseGlow(phase));
}

function setupImageFallback() {
  document.addEventListener('error', (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement)) return;
    if (img.dataset.fallbackTried === '1') {
      img.closest('.visual-frame, .visual-thumb')?.classList.add('image-missing');
      img.removeAttribute('src');
      return;
    }
    img.dataset.fallbackTried = '1';
    const fallback = img.dataset.fallback;
    if (fallback && fallback !== img.src) img.src = fallback;
    else {
      img.closest('.visual-frame, .visual-thumb')?.classList.add('image-missing');
      img.removeAttribute('src');
    }
  }, true);
}

function buildStory() {
  let phase = '';
  EVENTS.forEach((ev, i) => {
    if (ev.phase !== phase) {
      phase = ev.phase;
      const ph = PHASES.find(p => p.label === ev.phase);
      const s = document.createElement('section');
      s.className = 'chapter-hero';
      s.id = `chapter-${ph.id}`;
      s.style.setProperty('--phase-color', ph.color);
      s.innerHTML = `
        <div class="chapter-hero-media">
          <img src="${asset(ph.hero)}" alt="${ph.heroAlt}" loading="${ph.id === 1 ? 'eager' : 'lazy'}" />
        </div>
        <div class="chapter-hero-shade"></div>
        <div class="chapter-hero-inner">
          <p class="chapter-kicker"><span class="chapter-roman">${romans[ph.id - 1]}</span> Chapter ${ph.id} of ${PHASES.length}</p>
          <h2 class="chapter-title">${ph.label}</h2>
          <p class="chapter-desc">${ph.description}</p>
          <div class="chapter-land">
            <h4>The land</h4>
            <p>${ph.land}</p>
          </div>
        </div>`;
      story.appendChild(s);

      if (ph.route) {
        const r = document.createElement('section');
        r.className = 'route-strip';
        r.style.setProperty('--phase-color', ph.color);
        r.innerHTML = `
          <figure class="route-photo">
            <img src="${thumb(ph.route.photo, 1280)}" alt="${ph.route.caption}" loading="lazy" data-full="${ph.route.photo}" data-label="${ph.route.caption}" />
            <figcaption>${ph.route.caption}</figcaption>
          </figure>
          <div class="route-body">
            <p class="route-kicker">The road · ${ph.route.label}</p>
            <p class="route-guide">${ph.route.guide}</p>
            <div class="route-facts">
              ${ph.route.facts.map(f => `<div class="route-fact"><span>${f.k}</span><strong>${f.v}</strong></div>`).join('')}
            </div>
          </div>`;
        story.appendChild(r);
      }
    }

    const m = mediaFor(ev);
    const s = document.createElement('section');
    s.className = 'moment';
    s.id = `moment-${i}`;
    s.dataset.index = i;
    s.style.setProperty('--phase-color', phaseColor(ev.phase));
    s.style.setProperty('--phase-glow', phaseGlow(ev.phase));

    const reconThumb = ev.recon ? `
      <button class="visual-thumb" type="button" data-full="${asset(ev.recon)}" data-label="Historical reconstruction — ${ev.place}">
        <img src="${asset(ev.recon)}" alt="Reconstruction of ${ev.place}" loading="lazy" />
        <span>Reconstruction</span>
      </button>` : '';

    s.innerHTML = `
      <div class="moment-inner">
        <div class="moment-copy">
          <p class="moment-kicker">
            <span class="moment-num">${String(i + 1).padStart(2, '0')}</span>
            <span>${ev.place}</span>
            <span class="kicker-dot">·</span>
            <span>${ev.date}</span>
            <span class="kicker-dot">·</span>
            <a href="${bibleUrl(ev.scripture)}" target="_blank" rel="noopener">${ev.scripture.split('|')[0].trim()}</a>
          </p>
          <h2 class="moment-title">${ev.title}</h2>
          <p class="moment-sub">${ev.subtitle}</p>
          <blockquote class="verse-block">
            <p class="verse-text">${ev.verse}</p>
          </blockquote>
          <p class="moment-narrative">${ev.narrative}</p>
          <div class="fact-rows">
            <div class="fact-row history">
              <h4><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20h20M4 20V9l8-6 8 6v11M9 20v-6h6v6"/></svg> Historical context</h4>
              <p>${ev.history}</p>
            </div>
            <div class="fact-row discovery">
              <h4><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a4 4 0 014 4c0 5-4 5-4 9m0-9c0 5 4 5 4 9M8 6a4 4 0 014-4M6 22h12M12 15v7"/></svg> Archaeology</h4>
              <p>${ev.discovery}</p>
            </div>
          </div>
        </div>
        <div class="moment-visuals">
          <figure class="visual-frame primary">
            <img src="${thumb(m.photo)}" alt="${m.photoLabel}" loading="lazy" data-full="${m.photo}" data-label="${m.photoLabel}" data-fallback="${thumb(m.detail)}" />
            <figcaption>${m.photoLabel}</figcaption>
          </figure>
          <div class="visual-thumbs">
            <button class="visual-thumb" type="button" data-full="${m.detail}" data-label="${m.detailLabel}">
              <img src="${thumb(m.detail, 500)}" alt="${m.detailLabel}" loading="lazy" />
              <span>Archaeology</span>
            </button>
            ${reconThumb}
          </div>
        </div>
      </div>`;
    story.appendChild(s);
  });
}

function buildScrubber() {
  const track = $('scrubber-track');
  PHASES.forEach((ph) => {
    const count = EVENTS.filter(e => e.phase === ph.label).length;
    const start = EVENTS.findIndex(e => e.phase === ph.label);
    const seg = document.createElement('button');
    seg.type = 'button';
    seg.className = 'scrubber-seg';
    seg.style.flexGrow = count;
    seg.style.setProperty('--seg-color', ph.color);
    seg.dataset.start = start;
    seg.dataset.count = count;
    seg.setAttribute('aria-label', `Chapter ${ph.id}: ${ph.label}`);
    seg.innerHTML = `
      <span class="scrubber-seg-fill"></span>
      <span class="scrubber-preview">
        <img src="${asset(ph.hero)}" alt="" loading="lazy" />
        <strong>${ph.label}</strong>
        <em>Chapter ${ph.id} · ${count} moments</em>
      </span>`;
    seg.addEventListener('click', () => goTo(start));
    track.appendChild(seg);
  });
}

function updateScrubber(i) {
  document.querySelectorAll('.scrubber-seg').forEach(seg => {
    const start = Number(seg.dataset.start);
    const count = Number(seg.dataset.count);
    const done = Math.min(Math.max(i - start + 1, 0), count);
    seg.querySelector('.scrubber-seg-fill').style.width = `${(done / count) * 100}%`;
    seg.classList.toggle('active', i >= start && i < start + count);
  });
}

function updateUI(i) {
  const ev = EVENTS[i];
  const c = phaseColor(ev.phase);
  const ph = PHASES.find(p => p.label === ev.phase);
  const pct = Math.round(((i + 1) / total) * 100);

  setTheme(ev.phase);

  $('map-phase').textContent = ev.phase;
  $('map-phase').style.color = c;
  $('map-title').textContent = ev.title;
  $('map-place').textContent = ev.place;
  $('map-progress-fill').style.width = `${pct}%`;
  $('map-progress-fill').style.background = c;
  $('map-counter').textContent = `${String(i + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
  $('progress-bar').style.width = `${pct}%`;
  $('btn-prev').disabled = i === 0;
  $('btn-next').disabled = i === total - 1;

  $('nav-chapter').textContent = `Chapter ${ph?.id ?? 1}`;
  $('nav-moment').textContent = ev.title;
  $('nav-pct').textContent = `${pct}%`;

  document.querySelectorAll('.moment').forEach((el, j) => el.classList.toggle('is-active', j === i));
  updateScrubber(i);

  $('mobile-counter') && ($('mobile-counter').textContent = `${String(i + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`);
  $('mobile-title') && ($('mobile-title').textContent = ev.title);
  const mobileProg = $('mobile-progress');
  if (mobileProg) {
    mobileProg.style.width = `${pct}%`;
    mobileProg.style.background = c;
  }
  $('mobile-btn-prev') && ($('mobile-btn-prev').disabled = i === 0);
  $('mobile-btn-next') && ($('mobile-btn-next').disabled = i === total - 1);

  map.goTo(i);
  updateSpine(i);
}

let spineRaf = 0;
function updateSpine(i) {
  if (spineRaf) return;
  spineRaf = requestAnimationFrame(() => {
    spineRaf = 0;
    const moment = document.getElementById(`moment-${i ?? active}`);
    const spine = $('story-spine');
    if (!moment || !spine) return;
    const momentMid = moment.offsetTop + moment.offsetHeight * 0.4;
    spine.style.height = `${momentMid}px`;
  });
}

let unlockTimer = 0;
function releaseLockSoon() {
  clearTimeout(unlockTimer);
  unlockTimer = setTimeout(() => { locked = false; }, 1500);
}
if ('onscrollend' in window) {
  window.addEventListener('scrollend', () => { locked = false; clearTimeout(unlockTimer); });
}

function goTo(i) {
  if (i < 0 || i > total - 1) return;
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
  releaseLockSoon();
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
  }, { threshold: 0, rootMargin: '-45% 0px -45% 0px' });
  document.querySelectorAll('.moment').forEach(m => obs.observe(m));
}

function setupLightbox() {
  const lb = $('lightbox');
  const lbImg = $('lightbox-img');
  const lbCap = $('lightbox-caption');
  let items = [];
  let lbIndex = 0;

  document.querySelectorAll('.visual-frame.primary img, .visual-thumb, .route-photo img').forEach(el => {
    const src = el.dataset.full;
    const label = el.dataset.label || '';
    if (!src) return;
    items.push({ src, label });
    const idx = items.length - 1;
    el.addEventListener('click', () => open(idx));
    if (el.tagName === 'IMG') el.style.cursor = 'zoom-in';
  });

  function show() {
    lbImg.src = items[lbIndex].src;
    lbCap.textContent = items[lbIndex].label;
  }
  function open(idx) {
    lbIndex = idx;
    show();
    lb.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    gsap.fromTo(lb.querySelector('.lightbox-panel'), { scale: 0.94, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'power3.out' });
  }
  function close() {
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
  }
  function step(dir) {
    lbIndex = (lbIndex + dir + items.length) % items.length;
    gsap.to(lbImg, {
      opacity: 0, duration: 0.12, onComplete: () => {
        show();
        gsap.to(lbImg, { opacity: 1, duration: 0.2 });
      },
    });
  }

  lb?.querySelector('.lightbox-close')?.addEventListener('click', close);
  lb?.querySelector('.lightbox-prev')?.addEventListener('click', () => step(-1));
  lb?.querySelector('.lightbox-next')?.addEventListener('click', () => step(1));
  lb?.addEventListener('click', e => { if (e.target === lb) close(); });

  window.addEventListener('keydown', e => {
    if (!lb?.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
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

function setupHeroAnim() {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('.hero-eyebrow', { y: 20, opacity: 0, duration: 0.8 }, 0.3)
    .from('.hero-line', { y: '110%', duration: 1.1, stagger: 0.12 }, 0.45)
    .from('.hero-lead', { y: 24, opacity: 0, duration: 0.9 }, 0.85)
    .from('.hero-stat', { y: 20, opacity: 0, duration: 0.7, stagger: 0.1 }, 1)
    .from('.hero-cta', { y: 16, opacity: 0, duration: 0.8 }, 1.25)
    .from('.scroll-hint', { opacity: 0, duration: 0.8 }, 1.5);

  gsap.to('.hero-backdrop img', {
    scale: 1.12,
    ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1.5 },
  });

  const hero = $('hero');
  const innerX = gsap.quickTo('.hero-inner', 'x', { duration: 0.6, ease: 'power2.out' });
  const innerY = gsap.quickTo('.hero-inner', 'y', { duration: 0.6, ease: 'power2.out' });
  const bgX = gsap.quickTo('.hero-backdrop img', 'x', { duration: 0.8, ease: 'power2.out' });
  const bgY = gsap.quickTo('.hero-backdrop img', 'y', { duration: 0.8, ease: 'power2.out' });
  hero?.addEventListener('mousemove', e => {
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    innerX(x * 14); innerY(y * 8);
    bgX(x * -24); bgY(y * -16);
  });
  hero?.addEventListener('mouseleave', () => {
    innerX(0); innerY(0); bgX(0); bgY(0);
  });
}

function setupAnimations() {
  const enter = { ease: 'power3.out', duration: 0.7 };

  gsap.utils.toArray('.chapter-hero').forEach(ch => {
    const img = ch.querySelector('.chapter-hero-media img');
    // The "archaeological develop": sepia past resolves into full color as you arrive
    gsap.fromTo(img,
      { filter: 'sepia(0.85) brightness(0.82) contrast(0.94)', scale: 1.08 },
      {
        filter: 'sepia(0) brightness(1) contrast(1)',
        scale: 1,
        ease: 'none',
        scrollTrigger: { trigger: ch, start: 'top 85%', end: 'top 5%', scrub: 1 },
      }
    );
    gsap.from(ch.querySelectorAll('.chapter-kicker, .chapter-title, .chapter-desc, .chapter-land'), {
      y: 32,
      opacity: 0,
      stagger: 0.09,
      ...enter,
      scrollTrigger: { trigger: ch, start: 'top 55%', toggleActions: 'play none none none' },
    });
  });

  gsap.utils.toArray('.route-strip').forEach(strip => {
    gsap.from(strip.querySelectorAll('.route-kicker, .route-guide, .route-facts'), {
      y: 28,
      opacity: 0,
      stagger: 0.09,
      ...enter,
      scrollTrigger: { trigger: strip, start: 'top 62%', toggleActions: 'play none none none' },
    });
    const img = strip.querySelector('.route-photo img');
    if (img) {
      gsap.fromTo(img, { y: '-1%' }, {
        y: '-9%',
        ease: 'none',
        scrollTrigger: { trigger: strip, start: 'top bottom', end: 'bottom top', scrub: 1 },
      });
    }
  });

  document.querySelectorAll('.moment').forEach(moment => {
    gsap.from(moment.querySelectorAll('.moment-kicker, .moment-title, .moment-sub'), {
      y: 28,
      opacity: 0,
      stagger: 0.07,
      ...enter,
      scrollTrigger: { trigger: moment, start: 'top 68%', toggleActions: 'play none none none' },
    });
    gsap.from(moment.querySelectorAll('.verse-block, .moment-narrative, .fact-row'), {
      y: 24,
      opacity: 0,
      stagger: 0.07,
      ...enter,
      scrollTrigger: { trigger: moment, start: 'top 62%', toggleActions: 'play none none none' },
    });
    gsap.from(moment.querySelectorAll('.moment-visuals > *'), {
      y: 32,
      opacity: 0,
      stagger: 0.09,
      ...enter,
      scrollTrigger: { trigger: moment, start: 'top 65%', toggleActions: 'play none none none' },
    });

    const photo = moment.querySelector('.visual-frame.primary img');
    if (photo) {
      gsap.fromTo(photo, { y: '-1%' }, {
        y: '-9%',
        ease: 'none',
        scrollTrigger: { trigger: moment, start: 'top bottom', end: 'bottom top', scrub: 1 },
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
    y: 32,
    opacity: 0,
    duration: 0.8,
    stagger: 0.1,
    ease: 'power2.out',
    scrollTrigger: { trigger: '#epilogue', start: 'top 80%' },
  });
}

setupImageFallback();
buildStory();
buildScrubber();
map.init();
map.onMarkerClick = goTo;
updateUI(0);
setupObserver();
setupLightbox();
setupMobileDock();
setupMobileMapToggle();

const mm = gsap.matchMedia();
mm.add('(prefers-reduced-motion: no-preference)', () => {
  setupHeroAnim();
  setupAnimations();
});
mm.add('(prefers-reduced-motion: reduce)', () => {
  $('site-nav')?.classList.add('is-visible');
});

$('btn-prev').addEventListener('click', () => goTo(active - 1));
$('btn-next').addEventListener('click', () => goTo(active + 1));
window.addEventListener('keydown', e => {
  if ($('lightbox')?.classList.contains('is-open')) return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); goTo(active + 1); }
  if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); goTo(active - 1); }
});
window.addEventListener('scroll', () => updateSpine(), { passive: true });
window.addEventListener('resize', () => updateSpine());
