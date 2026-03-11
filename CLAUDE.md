# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Landing page for [futbolbotons.cat](https://futbolbotons.cat) — a single-page scroll-snapping website acting as a directory and presentation hub for the futbol botons sport in Catalunya. Deployed to GitHub Pages.

## Tech stack

- Plain HTML + CSS + JS — no framework, no build step, no npm
- Leaflet.js (CDN) for the clubs map
- Google Fonts (CDN) for typography
- Font Awesome Free 6 (CDN) for icons
- Must work as static files on GitHub Pages

## File structure

```
index.html
css/
  styles.css
js/
  main.js
  clubs-data.js      ← club data array (name, logo, coords, contact)
images/
  logos/             ← club logos
  (section images)
MISSING_IMAGES.md    ← generated at end of build: all placeholders + descriptions
```

## Design system

### Color palette
| Role | Hex |
|------|-----|
| Dark background (hero, header, alternating sections) | `#0d2240` |
| Accent / CTAs / highlights | `#c8952a` |
| Light background (content sections) | `#f7f6f1` |
| Body text | `#1c1c2e` |
| Borders / dividers | `#e0dbd0` |

Do NOT use greens or the CFBB palette (`#11d462`, `#0a1610`).

### Typography (Google Fonts)
- **Headings:** Playfair Display (600, 700) — elegant serif, full latin-extended (ç, ·, à, è, í, ï, ó, ú, ü, l·l)
- **Body:** Source Sans 3 (400, 600) — clean sans-serif, full latin-extended

## Sections (in scroll order)

1. **Hero** — full-viewport, dark bg, image overlay, main tagline + CTA
2. **Què és** — light bg, minimalist explainer, didactic image
3. **Com es juga** — dark bg, tactical feel, top-down game image
4. **Història** — light bg, editorial collage, past + present
5. **Clubs** — dark bg, custom infinite carousel + club detail panel
6. **Competicions** — light bg, epic/niche prestige feel
7. **Troba el teu club** — dark bg, Leaflet.js map centered on Catalunya

## Header / Navigation

Fixed header with anchor links to each section. Hamburger on mobile. Smooth scroll.

## Clubs section — carousel component

- Infinite auto-scroll loop (JS, duplicated list technique)
- Draggable with mouse (mousedown/mousemove/mouseup) and touch (touchstart/touchmove/touchend)
- Center-detection: the item closest to viewport center is "active"
- Active item drives a detail panel: club logo (large) + club name
- Club data lives in `js/clubs-data.js` as a JS array

## Map (section 7)

- Library: Leaflet.js via CDN
- Tiles: CartoDB Positron (free, no API key, clean/graphic style)
- Default view: centered on Catalunya
- Markers have popups: club name, approximate location, email
- Clubs outside Catalunya: map allows zoom-out to show them
- Coordinates are approximate (city/comarca level, not street)

## Language

All user-facing content is in **Catalan**. Code, comments, and this file are in English or Spanish.

## Images

During development, use `https://placehold.co/WIDTHxHEIGHT/0d2240/f7f6f1?text=Label` as placeholders.
When build is complete, generate `MISSING_IMAGES.md` with every placeholder: slot name, dimensions, and ideal image description (sourced from the image briefs per section).

### Image briefs per section
1. **Hero** — Premium photo, semi-zenith or short lateral. Real game in progress, well-lit table, buttons + ball visible, subtle hand gesture. Feels precise and competitive, not childlike. No vintage or cheap-toy look.
2. **Què és** — Clean composition: pitch + buttons + ball + goal. Minimalist, didactic, clean background, clear colors. Almost infographic.
3. **Com es juga** — Top-down or near-top-down view of a play. Button positions visible, sense of tactics. Can include subtle motion lines or graphic elements.
4. **Història** — Editorial collage connecting past and present: old evocative image (neighborhood/school/classic table) + modern competition/club image. Elegant, not museum-dusty.
5. **Clubs** — Logos are the protagonists (carousel cards). Optional background: mosaic of kits/teams or club gathering, very secondary.
6. **Competicions** — Trophy / medals / game tables / players competing / event-style poster. Suggests "competitive circuit." Epic but niche-prestige, not mass football.
7. **Troba el teu club** — This section uses the Leaflet.js map; no hero image needed.
