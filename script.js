/* ============================================================
   FAVOR & MIRACLE WEDDING - script.js
   Handles: preloader, media loading, galleries, lightbox,
            video players, countdown, RSVP, reveal animations
   ============================================================ */

'use strict';

/* ──────────────────────────────────────────────────────────
   CONFIGURATION - folder paths & supported extensions
────────────────────────────────────────────────────────── */
const CONFIG = {
  maxImages: 15,

  // Image folders → map to grid IDs and lightbox label
  imageGroups: [
    {
      folder:  'proposal',
      gridId:  'proposalGrid',
      label:   'Proposal',
      layout:  'grid',      // .gallery-grid → .g-item
    },
    {
      folder:  'pre-wedding',
      gridId:  'preweddingTrack',
      label:   'Pre-Wedding',
      layout:  'horizontal', // .gallery-horizontal-scroll → .gh-item
    },
    {
      folder:  'journey',
      gridId:  'journeyGrid',
      label:   'Journey',
      layout:  'bento',      // .gallery-bento → .gb-item
    },
    {
      folder:  'introduction',
      gridId:  'introGrid',
      label:   'Introduction',
      layout:  'mosaic',     // .gallery-mosaic → .gm-item
    },
  ],

  // Video folders → wrap element IDs
  videoGroups: [
    { folder: 'proposal-video',  wrapId: 'proposalVideoWrap',  label: 'Proposal Film' },
    { folder: 'journey-video',   wrapId: 'journeyVideoWrap',   label: 'Journey Film'  },
  ],

  // Common image & video extensions to probe
  imageExts: ['jpg','jpeg','png','webp','JPG','JPEG','PNG','WEBP'],
  videoExts: ['mp4','webm','mov','MP4','WEBM','MOV'],

  // How many filenames to probe per folder (images named 1.jpg, 2.jpg … OR arbitrary)
  probeCount: 30,
};

/* ──────────────────────────────────────────────────────────
   UTILITY HELPERS
────────────────────────────────────────────────────────── */

/** Shuffle array using Fisher-Yates */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Load images from manifest JSON */
async function loadImagesFromManifest() {
  try {
    const response = await fetch('images.json');
    const data = await response.json();
    return data;
  } catch (err) {
    console.warn('Failed to load images.json:', err);
    return { proposal: [], 'pre-wedding': [], journey: [], introduction: [] };
  }
}

/** Get max N random images from folder */
function getRandomImages(folderImages, maxCount = 15) {
  const shuffled = shuffleArray(folderImages || []);
  return shuffled.slice(0, Math.min(maxCount, shuffled.length));
}

/* ──────────────────────────────────────────────────────────
   PRELOADER
────────────────────────────────────────────────────────── */
const preloader   = document.getElementById('preloader');
const preBarFill  = document.getElementById('preBarFill');
const prePercent  = document.getElementById('prePercent');

let loadProgress = 0;

function setProgress(pct) {
  loadProgress = Math.min(100, Math.max(loadProgress, pct));
  preBarFill.style.width = loadProgress + '%';
  prePercent.textContent = Math.round(loadProgress) + '%';
}

function finishPreloader() {
  setProgress(100);
  setTimeout(() => {
    preloader.classList.add('gone');
    document.body.style.overflow = '';
    initRevealObserver();
    triggerHeroReveal();
  }, 600);
}

document.body.style.overflow = 'hidden';

/* Fake ticking progress so user sees movement */
let fakeTick = 0;
const fakeTimer = setInterval(() => {
  fakeTick += Math.random() * 4;
  if (fakeTick < 80) setProgress(fakeTick);
  else clearInterval(fakeTimer);
}, 80);

/* ──────────────────────────────────────────────────────────
   HERO PHOTO - composite grid from all categories
────────────────────────────────────────────────────────── */
async function loadHeroPhoto(imagesData) {
  const wrap = document.getElementById('heroPhotoInner');
  if (!wrap) return;
  
  // Get one random image from each category
  const proposal = getRandomImages(imagesData['proposal'] || [], 1);
  const preWedding = getRandomImages(imagesData['pre-wedding'] || [], 1);
  const journey = getRandomImages(imagesData['journey'] || [], 1);
  const introduction = getRandomImages(imagesData['introduction'] || [], 1);
  
  wrap.innerHTML = `
    <div class="hero-photo-grid">
      ${proposal[0] ? `<div class="hpg-item"><img src="proposal/${proposal[0]}" alt="Proposal" loading="lazy"/></div>` : ''}
      ${preWedding[0] ? `<div class="hpg-item"><img src="pre-wedding/${preWedding[0]}" alt="Pre-Wedding" loading="lazy"/></div>` : ''}
      ${journey[0] ? `<div class="hpg-item"><img src="journey/${journey[0]}" alt="Journey" loading="lazy"/></div>` : ''}
      ${introduction[0] ? `<div class="hpg-item"><img src="introduction/${introduction[0]}" alt="Introduction" loading="lazy"/></div>` : ''}
    </div>
  `;
}

/* ──────────────────────────────────────────────────────────
   GALLERY BUILDERS
────────────────────────────────────────────────────────── */

// Global image registry for lightbox
const lightboxRegistry = {}; // groupId → [urls]

/**
 * Calculate a random rotation between -3 and 3 degrees for polaroid effect
 */
function getRandomRotation() {
  return (Math.random() * 6 - 3);
}

/**
 * Create grid layout for proposal with mixed sizes (2x2 grids, singles, etc)
 */
function buildGridGallery(container, urls, groupId) {
  lightboxRegistry[groupId] = urls;
  container.innerHTML = '';
  
  urls.forEach((url, idx) => {
    const item = document.createElement('div');
    
    // Create polaroid-effect items with varied sizes
    const sizeClass = idx % 8 === 0 || idx % 8 === 7 ? 'g-item--large' : 'g-item--normal';
    item.className = `g-item ${sizeClass} reveal-scale`;
    item.style.setProperty('--rotation', getRandomRotation() + 'deg');
    item.dataset.group = groupId;
    item.dataset.index = idx;
    
    item.innerHTML = `
      <div class="g-polaroid">
        <img src="${url}" alt="Photo ${idx+1}" loading="lazy"/>
        <div class="g-overlay"><span>✦</span></div>
      </div>
    `;
    item.addEventListener('click', () => openLightbox(groupId, idx));
    container.appendChild(item);
  });
  
  // Re-observe new elements
  container.querySelectorAll('.reveal-scale').forEach(el => revealObserver && revealObserver.observe(el));
}

/**
 * Create horizontal scroll gallery for pre-wedding (card style)
 */
function buildHorizontalGallery(container, urls, groupId) {
  lightboxRegistry[groupId] = urls;
  container.innerHTML = '';
  
  urls.forEach((url, idx) => {
    const item = document.createElement('div');
    item.className = 'gh-item reveal-scale';
    item.style.setProperty('--rotation', getRandomRotation() + 'deg');
    item.dataset.group = groupId;
    item.dataset.index = idx;
    
    item.innerHTML = `
      <div class="gh-polaroid">
        <img src="${url}" alt="Pre-Wedding ${idx+1}" loading="lazy"/>
        <div class="gh-overlay"><span>✦</span></div>
      </div>
    `;
    item.addEventListener('click', () => openLightbox(groupId, idx));
    container.appendChild(item);
  });
}

/**
 * Create bento layout for journey (mixed sizes, more artistic)
 */
function buildBentoGallery(container, urls, groupId) {
  lightboxRegistry[groupId] = urls;
  container.innerHTML = '';
  
  urls.forEach((url, idx) => {
    const item = document.createElement('div');
    
    // Bento layout with varied sizes
    const bentoSizes = ['gb-item--small', 'gb-item--medium', 'gb-item--large', 'gb-item--small'];
    const sizeClass = bentoSizes[idx % bentoSizes.length];
    
    item.className = `gb-item ${sizeClass} reveal-scale`;
    item.style.setProperty('--rotation', getRandomRotation() + 'deg');
    item.dataset.group = groupId;
    item.dataset.index = idx;
    
    item.innerHTML = `
      <div class="gb-polaroid">
        <img src="${url}" alt="Journey ${idx+1}" loading="lazy"/>
        <div class="gb-overlay"><span>✦</span></div>
      </div>
    `;
    item.addEventListener('click', () => openLightbox(groupId, idx));
    container.appendChild(item);
  });
}

/**
 * Create mosaic layout for introduction (masonry-like)
 */
function buildMosaicGallery(container, urls, groupId) {
  lightboxRegistry[groupId] = urls;
  container.innerHTML = '';
  
  urls.forEach((url, idx) => {
    const item = document.createElement('div');
    
    // Mosaic with varied heights
    const mosaicSizes = ['gm-item--tall', 'gm-item--normal', 'gm-item--normal', 'gm-item--tall'];
    const sizeClass = mosaicSizes[idx % mosaicSizes.length];
    
    item.className = `gm-item ${sizeClass} reveal-scale`;
    item.style.setProperty('--rotation', getRandomRotation() + 'deg');
    item.dataset.group = groupId;
    item.dataset.index = idx;
    
    item.innerHTML = `
      <div class="gm-polaroid">
        <img src="${url}" alt="Introduction ${idx+1}" loading="lazy"/>
        <div class="gm-overlay"><span>✦</span></div>
      </div>
    `;
    item.addEventListener('click', () => openLightbox(groupId, idx));
    container.appendChild(item);
  });
}

/* ──────────────────────────────────────────────────────────
   VIDEO BUILDER
────────────────────────────────────────────────────────── */
function buildVideoPlayer(wrapEl, videoUrl, label) {
  wrapEl.innerHTML = `
    <video id="vid-${wrapEl.id}" preload="metadata" playsinline>
      <source src="${videoUrl}" type="video/mp4"/>
    </video>
    <div class="video-overlay" id="vov-${wrapEl.id}">
      <div class="video-play-ring">
        <svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
      </div>
    </div>
  `;
  const video   = wrapEl.querySelector('video');
  const overlay = wrapEl.querySelector('.video-overlay');

  function togglePlay() {
    if (video.paused) {
      // Pause all other videos
      document.querySelectorAll('video').forEach(v => { if (v !== video) v.pause(); });
      video.play();
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
    } else {
      video.pause();
      overlay.style.opacity = '1';
      overlay.style.pointerEvents = '';
    }
  }

  wrapEl.addEventListener('click', togglePlay);
  video.addEventListener('ended', () => {
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = '';
  });
  video.addEventListener('pause', () => {
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = '';
  });
}

/* ──────────────────────────────────────────────────────────
   LIGHTBOX
────────────────────────────────────────────────────────── */
const lightbox  = document.getElementById('lightbox');
const lbImg     = document.getElementById('lbImg');
const lbClose   = document.getElementById('lbClose');
const lbPrev    = document.getElementById('lbPrev');
const lbNext    = document.getElementById('lbNext');
const lbCounter = document.getElementById('lbCounter');
const lbCaption = document.getElementById('lbCaption');

let lbCurrentGroup = null;
let lbCurrentIndex = 0;

function openLightbox(groupId, index) {
  lbCurrentGroup = groupId;
  lbCurrentIndex = index;
  updateLightboxImage();
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}

function updateLightboxImage() {
  const urls = lightboxRegistry[lbCurrentGroup] || [];
  lbImg.style.opacity = '0';
  lbImg.style.transform = 'scale(0.96)';
  setTimeout(() => {
    lbImg.src = urls[lbCurrentIndex] || '';
    lbCounter.textContent = `${lbCurrentIndex + 1} / ${urls.length}`;
    lbCaption.textContent = lbCurrentGroup.charAt(0).toUpperCase() + lbCurrentGroup.slice(1);
    lbImg.style.opacity = '1';
    lbImg.style.transform = 'scale(1)';
  }, 200);
}

lbImg.style.transition = 'opacity 0.25s, transform 0.25s';

function lbNavigate(dir) {
  const urls = lightboxRegistry[lbCurrentGroup] || [];
  lbCurrentIndex = (lbCurrentIndex + dir + urls.length) % urls.length;
  updateLightboxImage();
}

lbClose.addEventListener('click', closeLightbox);
lbPrev.addEventListener('click',  () => lbNavigate(-1));
lbNext.addEventListener('click',  () => lbNavigate(1));
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape')      closeLightbox();
  if (e.key === 'ArrowLeft')   lbNavigate(-1);
  if (e.key === 'ArrowRight')  lbNavigate(1);
});

// Touch swipe
let lbTouchX = 0;
lightbox.addEventListener('touchstart', e => { lbTouchX = e.touches[0].clientX; }, { passive: true });
lightbox.addEventListener('touchend',   e => {
  const dx = e.changedTouches[0].clientX - lbTouchX;
  if (Math.abs(dx) > 50) lbNavigate(dx < 0 ? 1 : -1);
});

/* ──────────────────────────────────────────────────────────
   NAVBAR
────────────────────────────────────────────────────────── */
const navbar    = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navMenu   = document.getElementById('navMenu');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('open');
  navMenu.classList.toggle('open');
});
navMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navToggle.classList.remove('open');
    navMenu.classList.remove('open');
  });
});

/* ──────────────────────────────────────────────────────────
   CUSTOM CURSOR
────────────────────────────────────────────────────────── */
const cursor         = document.getElementById('cursor');
const cursorFollower = document.getElementById('cursorFollower');

let mx = 0, my = 0, fx = 0, fy = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top  = my + 'px';
});

function followCursor() {
  fx += (mx - fx) * 0.1;
  fy += (my - fy) * 0.1;
  cursorFollower.style.left = fx + 'px';
  cursorFollower.style.top  = fy + 'px';
  requestAnimationFrame(followCursor);
}
followCursor();

/* ──────────────────────────────────────────────────────────
   COUNTDOWN
────────────────────────────────────────────────────────── */
const weddingDate = new Date('2026-04-25T12:00:00');

function updateCountdown() {
  const now  = new Date();
  const diff = weddingDate - now;

  if (diff <= 0) {
    ['cdD','cdH','cdM','cdS'].forEach(id => document.getElementById(id).textContent = '00');
    return;
  }
  const pad = n => String(n).padStart(2,'0');
  document.getElementById('cdD').textContent = pad(Math.floor(diff / 86400000));
  document.getElementById('cdH').textContent = pad(Math.floor((diff % 86400000) / 3600000));
  document.getElementById('cdM').textContent = pad(Math.floor((diff % 3600000)  / 60000));
  document.getElementById('cdS').textContent = pad(Math.floor((diff % 60000)    / 1000));
}
updateCountdown();
setInterval(updateCountdown, 1000);

/* ──────────────────────────────────────────────────────────
   REVEAL ON SCROLL
────────────────────────────────────────────────────────── */
let revealObserver = null;

function initRevealObserver() {
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const delay = parseInt(entry.target.dataset.delay) || 0;
      setTimeout(() => entry.target.classList.add('in'), delay);
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(
    '.reveal-fade:not(#hero .reveal-fade),' +
    '.reveal-up:not(#hero .reveal-up),' +
    '.reveal-left,' +
    '.reveal-right,' +
    '.reveal-scale:not(#hero .reveal-scale)'
  ).forEach(el => revealObserver.observe(el));
}

function triggerHeroReveal() {
  const heroEls = document.querySelectorAll(
    '#hero .reveal-fade, #hero .reveal-up, #hero .reveal-scale, .ht-line, .ht-amp'
  );
  heroEls.forEach((el, i) => {
    const baseDelay = parseInt(el.style.getPropertyValue('--d')) || i * 150;
    setTimeout(() => el.classList.add('in'), baseDelay);
  });
}

/* ──────────────────────────────────────────────────────────
   ACTIVE NAV HIGHLIGHT
────────────────────────────────────────────────────────── */
const sections = document.querySelectorAll('section[id]');
const navAs    = document.querySelectorAll('.nav-menu a');

new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navAs.forEach(a => {
      const isActive = a.getAttribute('href') === '#' + entry.target.id;
      a.style.color = isActive ? 'var(--gold-light)' : '';
    });
  });
}, { threshold: 0.45 }).observe;

sections.forEach(sec => {
  new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navAs.forEach(a => {
        a.style.color = a.getAttribute('href') === '#' + entry.target.id
          ? 'var(--gold-light)' : '';
      });
    });
  }, { threshold: 0.4 }).observe(sec);
});

/* ──────────────────────────────────────────────────────────
   RSVP FORM
────────────────────────────────────────────────────────── */
const rsvpBtn     = document.getElementById('rsvpBtn');
const rsvpBtnText = document.getElementById('rsvpBtnText');
const rsvpFormEl  = document.getElementById('rsvpForm');
const rsvpSuccess = document.getElementById('rsvpSuccess');

rsvpBtn.addEventListener('click', () => {
  const name   = document.getElementById('rfName').value.trim();
  const phone  = document.getElementById('rfPhone').value.trim();
  const email  = document.getElementById('rfEmail').value.trim();
  const attend = document.getElementById('rfAttend').value;

  const shakeEl = el => {
    el.style.borderColor = 'rgba(139,34,53,0.8)';
    el.animate([
      {transform:'translateX(0)'},{transform:'translateX(-8px)'},
      {transform:'translateX(8px)'},{transform:'translateX(-4px)'},
      {transform:'translateX(0)'}
    ], { duration: 400, easing: 'ease' });
    el.addEventListener('focus', () => el.style.borderColor = '', { once: true });
  };

  if (!name)   { shakeEl(document.getElementById('rfName'));   return; }
  if (!phone)  { shakeEl(document.getElementById('rfPhone'));  return; }
  if (!attend) { shakeEl(document.getElementById('rfAttend')); return; }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    shakeEl(document.getElementById('rfEmail')); return;
  }

  rsvpBtnText.textContent = 'Sending…';
  rsvpBtn.disabled = true;

  setTimeout(() => {
    rsvpFormEl.classList.add('hidden');
    rsvpSuccess.classList.remove('hidden');
  }, 1400);
});

/* ──────────────────────────────────────────────────────────
   MAIN INIT - load from manifest and render all media
────────────────────────────────────────────────────────── */
async function init() {
  // Load images manifest
  const imagesData = await loadImagesFromManifest();
  
  // Hero photo composite
  loadHeroPhoto(imagesData);
  setProgress(5);

  let progress = 5;
  const totalTasks = CONFIG.imageGroups.length + CONFIG.videoGroups.length;
  const stepSize = 18 / totalTasks;

  // Load image galleries (with shuffling and max 15)
  for (const group of CONFIG.imageGroups) {
    const container = document.getElementById(group.gridId);
    if (!container) { progress += stepSize; setProgress(progress + 20); continue; }

    const allImages = imagesData[group.folder] || [];
    const urls = getRandomImages(allImages, 15).map(img => `${group.folder}/${img}`);
    progress += stepSize;
    setProgress(progress + 20);

    if (urls.length === 0) {
      container.innerHTML = `<p style="color:var(--latte);text-align:center;grid-column:1/-1;padding:2rem;font-style:italic;opacity:0.6">No images found in /${group.folder}</p>`;
      continue;
    }

    switch (group.layout) {
      case 'grid':       buildGridGallery(container, urls, group.folder);       break;
      case 'horizontal': buildHorizontalGallery(container, urls, group.folder); break;
      case 'bento':      buildBentoGallery(container, urls, group.folder);      break;
      case 'mosaic':     buildMosaicGallery(container, urls, group.folder);     break;
    }
  }

  // Load videos
  for (const vg of CONFIG.videoGroups) {
    const wrapEl = document.getElementById(vg.wrapId);
    if (!wrapEl) { progress += stepSize; setProgress(progress + 20); continue; }

    // Try to find video file
    const videoUrl = await discoverVideo(vg.folder);
    progress += stepSize;
    setProgress(progress + 20);

    if (videoUrl) {
      buildVideoPlayer(wrapEl, videoUrl, vg.label);
    } else {
      wrapEl.innerHTML = `<p style="color:var(--latte);text-align:center;padding:2rem;font-style:italic;opacity:0.6">No video found in /${vg.folder}</p>`;
    }
  }

  finishPreloader();
}

/**
 * Discover a video file in a folder.
 * Returns the first found URL or null.
 */
async function discoverVideo(folder) {
  const stems = ['video1','video','1','film','intro','proposal','journey','clip'];
  for (let i = 1; i <= 5; i++) stems.push(String(i));

  const videoExts = ['mp4','webm','mov','MP4','WEBM','MOV'];
  
  for (const stem of stems) {
    for (const ext of videoExts) {
      const url = `${folder}/${stem}.${ext}`;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        const r = await fetch(url, { method: 'HEAD', signal: controller.signal });
        clearTimeout(timeout);
        if (r.ok) return url;
      } catch { }
    }
  }
  return null;
}

// Kick off
window.addEventListener('DOMContentLoaded', () => {
  init().catch(err => {
    console.warn('Media discovery error:', err);
    finishPreloader();
  });
});