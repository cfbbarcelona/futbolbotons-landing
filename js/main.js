/* ============================================================
   FUTBOLBOTONS.CAT — Main JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initScrollAnimations();
  initCarousel();
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

/* --- Clubs Carousel ---------------------------------------- */
function initCarousel() {
  if (typeof clubsData === 'undefined' || !clubsData.length) return;

  const wrapper     = document.querySelector('.carousel-wrapper');
  const track       = document.querySelector('.carousel-track');
  const detailPanel = document.getElementById('club-detail');
  const detailLogo  = document.getElementById('detail-logo');
  const detailName  = document.getElementById('detail-name');
  const detailLoc   = document.getElementById('detail-location');

  if (!wrapper || !track) return;

  const N = clubsData.length;
  let ITEM_W = 160;
  let CARD_HALF = 70;
  let SET_W  = N * ITEM_W;

  function updateDimensions() {
    const item = track.querySelector('.carousel-item');
    if (!item) return;
    const mr = parseFloat(window.getComputedStyle(item).marginRight) || 0;
    ITEM_W    = item.offsetWidth + mr;
    CARD_HALF = item.offsetWidth / 2;
    SET_W     = N * ITEM_W;
  }

  // Build 3 copies
  function buildTrack() {
    track.innerHTML = '';
    for (let copy = 0; copy < 3; copy++) {
      clubsData.forEach((club, i) => {
        const item = document.createElement('div');
        item.className = 'carousel-item';
        item.dataset.index = i;

        const card = document.createElement('div');
        card.className = 'carousel-card';
        card.innerHTML = `
          <img
            src="${club.logo}"
            alt="${club.abbr}"
            onerror="this.src='https://placehold.co/60x60/0d2240/c8952a?text=${encodeURIComponent(club.abbr)}'"
          />
          <span class="carousel-abbr">${club.abbr}</span>
        `;

        item.appendChild(card);
        track.appendChild(item);
      });
    }
  }

  buildTrack();
  updateDimensions();

  // State
  let pos = 0;
  let dragging     = false;
  let hasDragged   = false;
  let dragStartX   = 0;
  let dragStartPos = 0;
  let lastActiveIdx = -1;
  let pauseUntil   = 0;
  let targetPos    = null; // non-null → smooth scroll to card
  const AUTO_SPEED       = 0.55; // px per frame
  const PAUSE_AFTER_DRAG = 3000; // ms
  const DRAG_THRESHOLD   = 5;   // px — below this = click, not drag
  const LERP_SPEED       = 0.10; // easing factor per frame

  // Center on club 0 of middle set
  function initPos() {
    const containerW = wrapper.offsetWidth;
    pos = SET_W + ITEM_W / 2 - containerW / 2;
    applyTransform();
  }

  function applyTransform() {
    track.style.transform = `translateX(${-pos}px)`;
  }

  function normalizePos() {
    if (pos >= 2 * SET_W) {
      pos -= SET_W;
      if (targetPos !== null) targetPos -= SET_W;
    }
    if (pos < SET_W) {
      pos += SET_W;
      if (targetPos !== null) targetPos += SET_W;
    }
  }

  function getActiveIdx() {
    const containerW = wrapper.offsetWidth;
    const trackCenter = pos + containerW / 2;
    const rawIdx = Math.round((trackCenter - CARD_HALF) / ITEM_W);
    return ((rawIdx % N) + N) % N;
  }

  function updateDetail(idx) {
    if (idx === lastActiveIdx) return;
    lastActiveIdx = idx;
    const club = clubsData[idx];

    // Fade
    detailLogo.style.opacity = '0';
    detailName.style.opacity = '0';
    if (detailLoc) detailLoc.style.opacity = '0';

    setTimeout(() => {
      detailLogo.src = club.logo;
      detailLogo.alt = club.name;
      detailName.textContent = club.name;
      if (detailLoc) detailLoc.textContent = club.location;

      detailLogo.onerror = () => {
        detailLogo.src = `https://placehold.co/80x80/0d2240/c8952a?text=${encodeURIComponent(club.abbr)}`;
      };

      detailLogo.style.opacity = '1';
      detailName.style.opacity = '1';
      if (detailLoc) detailLoc.style.opacity = '1';

      // Link to club website if available
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

    // Update active class
    track.querySelectorAll('.carousel-item').forEach(item => {
      item.classList.toggle('is-active', parseInt(item.dataset.index) === idx);
    });
  }

  // Animation loop
  let rafId = null;
  function loop() {
    if (targetPos !== null) {
      // Smooth scroll to clicked card
      pos += (targetPos - pos) * LERP_SPEED;
      if (Math.abs(targetPos - pos) < 0.5) {
        pos = targetPos;
        targetPos = null;
      }
      normalizePos();
      applyTransform();
      updateDetail(getActiveIdx());
    } else if (!dragging && Date.now() >= pauseUntil) {
      pos += AUTO_SPEED;
      normalizePos();
      applyTransform();
      updateDetail(getActiveIdx());
    }
    rafId = requestAnimationFrame(loop);
  }

  // Drag support
  function getX(e) {
    return e.touches ? e.touches[0].clientX : e.clientX;
  }

  function onDragStart(e) {
    dragging   = true;
    hasDragged = false;
    targetPos  = null;
    dragStartX   = getX(e);
    dragStartPos = pos;
    wrapper.style.cursor = 'grabbing';
  }

  function onDragMove(e) {
    if (!dragging) return;
    const dx = getX(e) - dragStartX;
    if (Math.abs(dx) > DRAG_THRESHOLD) hasDragged = true;
    pos = dragStartPos - dx;
    normalizePos();
    applyTransform();
    updateDetail(getActiveIdx());
  }

  function onDragEnd() {
    if (!dragging) return;
    dragging = false;
    pauseUntil = Date.now() + PAUSE_AFTER_DRAG;
    wrapper.style.cursor = '';
  }

  // Click on a card → smooth scroll to center it
  wrapper.addEventListener('click', (e) => {
    if (hasDragged) return;
    const item = e.target.closest('.carousel-item');
    if (!item) return;

    // getBoundingClientRect gives screen-space position accounting for the
    // CSS transform on the track. Convert to track-space coords via current pos.
    const wrapperRect  = wrapper.getBoundingClientRect();
    const itemRect     = item.getBoundingClientRect();
    const itemScreenCenter = itemRect.left + itemRect.width / 2;
    const containerW   = wrapperRect.width;

    // track-space center of the clicked card
    const cardCenter = pos + (itemScreenCenter - wrapperRect.left);
    let t = cardCenter - containerW / 2;

    // Pick the closest equivalent copy to avoid long wraparound
    const candidates = [t - SET_W, t, t + SET_W];
    t = candidates.reduce((best, v) =>
      Math.abs(v - pos) < Math.abs(best - pos) ? v : best
    , t);

    targetPos  = t;
    pauseUntil = Date.now() + PAUSE_AFTER_DRAG;
  });

  wrapper.addEventListener('mousedown',  onDragStart);
  window.addEventListener('mousemove',   onDragMove);
  window.addEventListener('mouseup',     onDragEnd);

  wrapper.addEventListener('touchstart', onDragStart, { passive: true });
  window.addEventListener('touchmove',   onDragMove,  { passive: true });
  window.addEventListener('touchend',    onDragEnd);

  // Prevent link drag
  wrapper.addEventListener('dragstart', e => e.preventDefault());

  // Recalculate on resize (e.g. mobile → desktop breakpoint)
  window.addEventListener('resize', () => {
    updateDimensions();
    initPos();
  }, { passive: true });

  initPos();
  loop();
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
    const websiteLine  = club.website ? `<div class="popup-website"><a href="${club.website}" target="_blank" rel="noopener">Web</a></div>` : '';

    const marker = L.marker([club.lat, club.lng], { icon: customIcon })
      .addTo(map)
      .bindPopup(`
        <div class="popup-name">${club.name}</div>
        <div class="popup-location">${club.location}</div>
        ${addressLine}${phoneLine}${hoursLine}${emailLine}${websiteLine}
      `);
    clubMarkers.push({ marker, club });
  });

  // Store reference for search
  window._clubMap = map;
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
