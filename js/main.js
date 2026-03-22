/* ============================================================
   FUTBOLBOTONS.CAT — Main JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initScrollAnimations();
  initCarousel();
  initSocialCarousel();
  initCompPhotos();
  initMap();
  initSearch();
});

/* --- Header ------------------------------------------------ */
function initHeader() {
  const header = document.getElementById('site-header');
  const toggle = document.getElementById('nav-toggle');
  const nav    = document.getElementById('site-nav');

  // Scrolled class
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
    updateActiveNav();
  }, { passive: true });

  // Mobile toggle
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open);
  });

  // Close nav on link click
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', false);
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!header.contains(e.target)) {
      nav.classList.remove('is-open');
      toggle.classList.remove('is-open');
    }
  });
}

function updateActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.site-nav a');
  const offset = 120;
  let current = '';

  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - offset) {
      current = sec.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === '#' + current);
  });
}

/* --- Scroll animations ------------------------------------- */
function initScrollAnimations() {
  const els = document.querySelectorAll('[data-animate]');
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  els.forEach(el => observer.observe(el));

  // Also animate timeline progress on scroll
  const timelineEls = document.querySelectorAll('.timeline-progress');
  const timelineObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.width = '100%';
        timelineObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.4 });
  timelineEls.forEach(el => timelineObs.observe(el));
}

/* --- Generic Carousel Factory ------------------------------ */
function makeCarousel(opts) {
  const { data, wrapperEl: wrapper, trackEl: track, buildCardContent, onActiveChange } = opts;
  if (!data || !data.length || !wrapper || !track) return;

  const N = data.length;
  let rafId      = null;
  let abortCtrl  = null;

  // Llindar responsiu: desktop ≥769px → 6, mobile → 3
  function staticThreshold() { return window.innerWidth >= 769 ? 6 : 3; }

  function buildItems(copies) {
    track.innerHTML = '';
    for (let copy = 0; copy < copies; copy++) {
      data.forEach((item, i) => {
        const el = document.createElement('div');
        el.className = 'carousel-item';
        el.dataset.index = i;
        const card = document.createElement('div');
        card.className = 'carousel-card';
        card.innerHTML = buildCardContent(item);
        el.appendChild(card);
        track.appendChild(el);
      });
    }
  }

  function init() {
    if (abortCtrl) abortCtrl.abort();
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    abortCtrl = new AbortController();
    const signal = abortCtrl.signal;
    wrapper.classList.remove('carousel-static');

    // ── STATIC MODE ──────────────────────────────────────────
    if (N < staticThreshold()) {
      buildItems(1);
      wrapper.classList.add('carousel-static');
      let activeIdx = 0;

      function setStatic(idx) {
        activeIdx = idx;
        track.querySelectorAll('.carousel-item').forEach(el => {
          el.classList.toggle('is-active', parseInt(el.dataset.index) === idx);
        });
        onActiveChange(data[idx]);
      }

      wrapper.addEventListener('click', (e) => {
        const item = e.target.closest('.carousel-item');
        if (!item) return;
        setStatic(parseInt(item.dataset.index));
      }, { signal });

      // Auto-avanç de focus
      const timer = setInterval(() => setStatic((activeIdx + 1) % N), 3000);
      signal.addEventListener('abort', () => clearInterval(timer));

      setStatic(0);
      return;
    }

    // ── INFINITE SCROLL MODE ──────────────────────────────────
    buildItems(3);

    let ITEM_W    = 160;
    let CARD_HALF = 70;
    let SET_W     = N * ITEM_W;

    function updateDimensions() {
      const item = track.querySelector('.carousel-item');
      if (!item) return;
      const mr = parseFloat(window.getComputedStyle(item).marginRight) || 0;
      ITEM_W    = item.offsetWidth + mr;
      CARD_HALF = item.offsetWidth / 2;
      SET_W     = N * ITEM_W;
    }

    updateDimensions();

    let pos           = 0;
    let dragging      = false;
    let hasDragged    = false;
    let dragStartX    = 0;
    let dragStartPos  = 0;
    let lastActiveIdx = -1;
    let pauseUntil    = 0;
    let targetPos     = null;
    const AUTO_SPEED       = 0.55;
    const PAUSE_AFTER_DRAG = 3000;
    const DRAG_THRESHOLD   = 5;
    const LERP_SPEED       = 0.10;

    function initPos() {
      pos = SET_W + ITEM_W / 2 - wrapper.offsetWidth / 2;
      track.style.transform = `translateX(${-pos}px)`;
    }

    function applyTransform() {
      track.style.transform = `translateX(${-pos}px)`;
    }

    function normalizePos() {
      if (pos >= 2 * SET_W) { pos -= SET_W; if (targetPos !== null) targetPos -= SET_W; }
      if (pos <      SET_W) { pos += SET_W; if (targetPos !== null) targetPos += SET_W; }
    }

    function getActiveIdx() {
      const rawIdx = Math.round((pos + wrapper.offsetWidth / 2 - CARD_HALF) / ITEM_W);
      return ((rawIdx % N) + N) % N;
    }

    function updateDetail(idx) {
      if (idx === lastActiveIdx) return;
      lastActiveIdx = idx;
      onActiveChange(data[idx]);
      track.querySelectorAll('.carousel-item').forEach(el => {
        el.classList.toggle('is-active', parseInt(el.dataset.index) === idx);
      });
    }

    function loop() {
      if (targetPos !== null) {
        pos += (targetPos - pos) * LERP_SPEED;
        if (Math.abs(targetPos - pos) < 0.5) { pos = targetPos; targetPos = null; }
        normalizePos(); applyTransform(); updateDetail(getActiveIdx());
      } else if (!dragging && Date.now() >= pauseUntil) {
        pos += AUTO_SPEED;
        normalizePos(); applyTransform(); updateDetail(getActiveIdx());
      }
      rafId = requestAnimationFrame(loop);
    }

    function getX(e) { return e.touches ? e.touches[0].clientX : e.clientX; }

    function onDragStart(e) {
      dragging = true; hasDragged = false; targetPos = null;
      dragStartX = getX(e); dragStartPos = pos;
      wrapper.style.cursor = 'grabbing';
    }
    function onDragMove(e) {
      if (!dragging) return;
      const dx = getX(e) - dragStartX;
      if (Math.abs(dx) > DRAG_THRESHOLD) hasDragged = true;
      pos = dragStartPos - dx;
      normalizePos(); applyTransform(); updateDetail(getActiveIdx());
    }
    function onDragEnd() {
      if (!dragging) return;
      dragging = false;
      pauseUntil = Date.now() + PAUSE_AFTER_DRAG;
      wrapper.style.cursor = '';
    }

    wrapper.addEventListener('click', (e) => {
      if (hasDragged) return;
      const item = e.target.closest('.carousel-item');
      if (!item) return;
      const wrapperRect      = wrapper.getBoundingClientRect();
      const itemScreenCenter = item.getBoundingClientRect().left + item.getBoundingClientRect().width / 2;
      const cardCenter       = pos + (itemScreenCenter - wrapperRect.left);
      let t = cardCenter - wrapperRect.width / 2;
      const candidates = [t - SET_W, t, t + SET_W];
      t = candidates.reduce((best, v) => Math.abs(v - pos) < Math.abs(best - pos) ? v : best, t);
      targetPos = t;
      pauseUntil = Date.now() + PAUSE_AFTER_DRAG;
    }, { signal });

    wrapper.addEventListener('mousedown',  onDragStart, { signal });
    window.addEventListener('mousemove',   onDragMove,  { signal });
    window.addEventListener('mouseup',     onDragEnd,   { signal });
    wrapper.addEventListener('touchstart', onDragStart, { passive: true, signal });
    window.addEventListener('touchmove',   onDragMove,  { passive: true, signal });
    window.addEventListener('touchend',    onDragEnd,   { signal });
    wrapper.addEventListener('dragstart',  e => e.preventDefault(), { signal });
    window.addEventListener('resize', () => { updateDimensions(); initPos(); }, { passive: true, signal });

    initPos();
    rafId = requestAnimationFrame(loop);
  } // fi init()

  // Reinicialitza si el breakpoint canvia (mobile ↔ desktop)
  let lastThreshold = staticThreshold();
  window.addEventListener('resize', () => {
    const t = staticThreshold();
    if (t !== lastThreshold) { lastThreshold = t; init(); }
  }, { passive: true });

  init();
}

/* --- Clubs Carousel ---------------------------------------- */
function initCarousel() {
  if (typeof clubsData === 'undefined' || !clubsData.length) return;

  const wrapper     = document.querySelector('#clubs .carousel-wrapper');
  const track       = document.querySelector('#clubs .carousel-track');
  const detailPanel = document.getElementById('club-detail');
  const detailLogo  = document.getElementById('detail-logo');
  const detailName  = document.getElementById('detail-name');
  const detailLoc   = document.getElementById('detail-location');
  const detailIG    = document.getElementById('detail-instagram');
  const detailIGHandle = document.getElementById('detail-instagram-handle');
  if (!wrapper || !track) return;

  makeCarousel({
    data: clubsData,
    wrapperEl: wrapper,
    trackEl: track,
    buildCardContent: (club) => `
      <img src="${club.logo}" alt="${club.abbr}"
        onerror="this.src='https://placehold.co/60x60/0d2240/c8952a?text=${encodeURIComponent(club.abbr)}'" />
      <span class="carousel-abbr">${club.abbr}</span>
    `,
    onActiveChange: (club) => {
      detailLogo.style.opacity = '0';
      detailName.style.opacity = '0';
      if (detailLoc) detailLoc.style.opacity = '0';
      setTimeout(() => {
        detailLogo.src = club.logo;
        detailLogo.alt = club.name;
        detailLogo.onerror = () => {
          detailLogo.src = `https://placehold.co/80x80/0d2240/c8952a?text=${encodeURIComponent(club.abbr)}`;
        };
        detailName.textContent = club.name;
        if (detailLoc) detailLoc.textContent = club.location;
        detailLogo.style.opacity = '1';
        detailName.style.opacity = '1';
        if (detailLoc) detailLoc.style.opacity = '1';
        if (detailIG) {
          if (club.instagram) {
            detailIGHandle.textContent = '@' + club.instagram.replace(/\/$/, '').split('/').pop();
            detailIG.href = club.instagram;
            detailIG.style.display = '';
          } else {
            detailIG.style.display = 'none';
          }
        }
        if (detailPanel) {
          if (club.website) {
            detailPanel.classList.add('is-linked');
            detailPanel.onclick = () => window.open(club.website, '_blank', 'noopener');
          } else {
            detailPanel.classList.remove('is-linked');
            detailPanel.onclick = null;
          }
        }
      }, 200);
    }
  });
}

/* --- Social Carousel --------------------------------------- */
function initSocialCarousel() {
  const wrapper     = document.querySelector('#xarxes .carousel-wrapper');
  const track       = document.querySelector('#xarxes .carousel-track');
  const detailPanel = document.getElementById('social-detail');
  const detailIcon  = document.getElementById('social-detail-icon');
  const detailName  = document.getElementById('social-detail-name');
  const detailHandle = document.getElementById('social-detail-handle');
  if (!wrapper || !track) return;

  // Combina socialData + Instagrams dels clubs (font única: clubs-data.js)
  const combined = [...(typeof socialData !== 'undefined' ? socialData : [])];
  if (typeof clubsData !== 'undefined') {
    clubsData.forEach(club => {
      if (club.instagram) {
        const handle = '@' + club.instagram.replace(/\/$/, '').split('/').pop();
        combined.push({
          id:        `ig-${club.id}`,
          name:      club.name,
          abbr:      club.abbr,
          handle,
          platform:  'Instagram',
          icon:      'fa-brands fa-instagram',
          color:     '#E1306C',
          thumbnail: club.logo,
          url:       club.instagram
        });
      }
    });
  }
  if (!combined.length) return;

  makeCarousel({
    data: combined,
    wrapperEl: wrapper,
    trackEl: track,
    buildCardContent: (item) => item.thumbnail
      ? `<div class="social-card-media">
           <img src="${item.thumbnail}" alt="${item.abbr}" class="social-card-thumb" />
           <i class="${item.icon} social-card-platform-badge" style="color:${item.color}"></i>
         </div>
         <span class="carousel-abbr">${item.abbr}</span>`
      : `<i class="${item.icon} social-card-icon" style="color:${item.color}"></i>
         <span class="carousel-abbr">${item.abbr}</span>`,
    onActiveChange: (item) => {
      if (detailIcon)   detailIcon.style.opacity   = '0';
      if (detailName)   detailName.style.opacity   = '0';
      if (detailHandle) detailHandle.style.opacity = '0';
      setTimeout(() => {
        if (detailIcon) {
          detailIcon.className = `${item.icon} social-detail-icon-el`;
          detailIcon.style.color = item.color;
          detailIcon.style.opacity = '1';
        }
        if (detailName)   { detailName.textContent   = item.name;   detailName.style.opacity   = '1'; }
        if (detailHandle) { detailHandle.textContent = item.handle; detailHandle.style.opacity = '1'; }
        if (detailPanel) {
          detailPanel.classList.add('is-linked');
          detailPanel.onclick = () => window.open(item.url, '_blank', 'noopener');
        }
      }, 200);
    }
  });
}

/* --- Leaflet Map ------------------------------------------- */
let clubMarkers = [];

function initMap() {
  if (typeof L === 'undefined' || typeof clubsData === 'undefined') return;
  const mapEl = document.getElementById('clubs-map');
  if (!mapEl) return;

  const map = L.map('clubs-map', {
    center: [41.65, 1.62],
    zoom: 8,
    scrollWheelZoom: false,
    zoomControl: true,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 18,
  }).addTo(map);

  // Enable scroll wheel zoom on focus
  mapEl.addEventListener('click', () => map.scrollWheelZoom.enable());
  mapEl.addEventListener('mouseleave', () => map.scrollWheelZoom.disable());

  const customIcon = L.divIcon({
    className: '',
    html: '<div class="club-marker-dot"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -12],
  });

  clubsData.forEach(club => {
    const addressLine  = club.address ? `<div class="popup-address">${club.address}</div>` : '';
    const phoneLine    = club.phone   ? `<div class="popup-phone">${club.phone}</div>` : '';
    const hoursLine    = club.hours   ? `<div class="popup-hours">${club.hours}</div>` : '';
    const emailLine    = club.email   ? `<div class="popup-email"><a href="mailto:${club.email}">${club.email}</a></div>` : '';
    const websiteLine  = club.website   ? `<div class="popup-website"><a href="${club.website}" target="_blank" rel="noopener">Web</a></div>` : '';
    const instagramLine = club.instagram ? `<div class="popup-instagram"><a href="${club.instagram}" target="_blank" rel="noopener"><i class="fa-brands fa-instagram"></i> Instagram</a></div>` : '';

    const marker = L.marker([club.lat, club.lng], { icon: customIcon })
      .addTo(map)
      .bindPopup(`
        <div class="popup-name">${club.name}</div>
        <div class="popup-location">${club.location}</div>
        ${addressLine}${phoneLine}${hoursLine}${emailLine}${websiteLine}${instagramLine}
      `);
    clubMarkers.push({ marker, club });
  });

  // Store reference for search
  window._clubMap = map;
}

/* --- Competition photos crossfade -------------------------- */
function initCompPhotos() {
  document.querySelectorAll('.comp-photos').forEach(container => {
    const photos = container.querySelectorAll('.comp-photo');
    if (!photos.length) return;
    let current = 0;
    photos[current].classList.add('is-active');
    setInterval(() => {
      photos[current].classList.remove('is-active');
      current = (current + 1) % photos.length;
      photos[current].classList.add('is-active');
    }, 4000);
  });
}

/* --- Search ------------------------------------------------ */
function initSearch() {
  const input  = document.getElementById('search-input');
  const button = document.getElementById('search-btn');
  if (!input) return;

  function doSearch() {
    const query = input.value.trim().toLowerCase();
    if (!query) {
      clubMarkers.forEach(({ marker }) => marker.setOpacity(1));
      if (window._clubMap) window._clubMap.setView([41.65, 1.62], 8);
      return;
    }

    const matches = clubMarkers.filter(({ club }) =>
      club.name.toLowerCase().includes(query) ||
      club.location.toLowerCase().includes(query) ||
      club.abbr.toLowerCase().includes(query)
    );

    clubMarkers.forEach(({ marker }) => marker.setOpacity(0.2));
    matches.forEach(({ marker }) => marker.setOpacity(1));

    if (matches.length === 1 && window._clubMap) {
      window._clubMap.flyTo([matches[0].club.lat, matches[0].club.lng], 12, { duration: 1.2 });
      matches[0].marker.openPopup();
    } else if (matches.length > 1 && window._clubMap) {
      const group = L.featureGroup(matches.map(m => m.marker));
      window._clubMap.flyToBounds(group.getBounds().pad(0.3), { duration: 1.2 });
    }
  }

  input.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
  if (button) button.addEventListener('click', doSearch);
}
