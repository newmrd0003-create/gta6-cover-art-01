// shots.js — deterministic screenshot scenes for Vice Cover Studio.
// Reads the page URL (?shot=cover | ?shot=editor, plus layout, size, grade,
// title, subtitle, badge, stars and photo) and configures the editor state
// so a headless browser can capture the exact scenes the entry hands in:
// the exported cover full-frame, and the editor with a photo loaded.
// No network: photos are the app's own local samples.

import { LAYOUTS, GRADES, SIZES, SAMPLE_PHOTOS } from './cover.js';

function param(name, fallback) {
  const v = new URLSearchParams(window.location.search).get(name);
  return v === null || v === '' ? fallback : v;
}

function pickPhotoIds(photo, count, layout) {
  const ids = SAMPLE_PHOTOS.map((p) => p.id);
  if (photo === 'mix') {
    // Tall hero panel crops a landscape photo hard: give it the pier scene,
    // whose subject sits dead centre and survives a vertical crop.
    const order = layout === 'hero' ? ['pier', 'neon', 'boulevard', 'rooftop'] : ids;
    return Array.from({ length: count }, (_, i) => order[i % order.length]);
  }
  const one = ids.includes(photo) ? photo : 'boulevard';
  return Array.from({ length: count }, () => one);
}

// Configure `state` from the URL and load its photos. Returns true when a
// shot scene was requested (the caller then skips its default demo state).
// `hooks` are the editor's actions: assignPhoto(index, sampleId),
// fillAll(sampleId), redraw() and refreshPickers().
export function applyShotParams(state, hooks) {
  const shot = param('shot', '');
  if (shot !== 'cover' && shot !== 'editor') return false;

  state.layout = LAYOUTS[param('layout', state.layout)] ? param('layout', state.layout) : state.layout;
  state.size = SIZES[param('size', state.size)] ? param('size', state.size) : state.size;
  state.grade = GRADES[param('grade', state.grade)] ? param('grade', state.grade) : state.grade;
  state.title = param('title', state.title);
  state.subtitle = param('subtitle', state.subtitle);
  state.badge = param('badge', state.badge);
  const stars = Number(param('stars', String(state.stars)));
  state.stars = Number.isFinite(stars) ? Math.max(0, Math.min(5, stars)) : state.stars;

  const count = LAYOUTS[state.layout].panels;
  const photoIds = pickPhotoIds(param('photo', 'mix'), count, state.layout);

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    document.title = `Vice Cover Studio — ${state.title}`;
  }

  // Load the scene photos, then draw once and flag readiness for the
  // headless screenshot runner.
  (async () => {
    for (let i = 0; i < count; i++) {
      await hooks.assignPhoto(i, photoIds[i]);
    }
    hooks.refreshPickers();
    hooks.redraw();
    try {
      await document.fonts.ready;
    } catch (err) {
      // already handled by the editor boot; a missing font never blocks
      // the shot.
    }
    hooks.redraw();
    window.__shotReady = true;
  })();
  return true;
}
