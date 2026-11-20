// main.js — Vice Cover Studio editor (Round 6).
// Wires the controls to the cover renderer: layout / size / grade pickers,
// caption editing, per-panel photo assignment with zoom + pan, and PNG export.
// Photos stay on the user's machine: uploads are read with FileReader into
// data URLs and never leave the browser.

import { SIZES, LAYOUTS, GRADES, SAMPLE_PHOTOS, panelRects, drawCover, renderCoverCanvas } from './cover.js';
import { applyShotParams } from './shots.js';

const DEFAULT_STATE = {
  layout: 'hero',
  size: 'square',
  grade: 'sunset',
  title: 'Sunset Heist',
  subtitle: 'vice city nights',
  badge: 'Vice City',
  stars: 4,
  panels: [],
};

function blankPanel() {
  return { img: null, src: '', zoom: 1, ox: 0, oy: 0 };
}

export function freshState() {
  const s = { ...DEFAULT_STATE, panels: [] };
  const count = LAYOUTS[s.layout].panels;
  for (let i = 0; i < count; i++) s.panels.push(blankPanel());
  return s;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load ' + src));
    img.src = src;
  });
}

async function loadSample(id) {
  const sample = SAMPLE_PHOTOS.find((p) => p.id === id) || SAMPLE_PHOTOS[0];
  const img = await loadImage(sample.src);
  return { img, src: sample.src };
}

function el(id) {
  return document.getElementById(id);
}

function buildPicker(container, items, current, onPick) {
  container.innerHTML = '';
  for (const [key, item] of Object.entries(items)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick' + (key === current ? ' active' : '');
    b.textContent = item.label;
    b.dataset.key = key;
    b.addEventListener('click', () => onPick(key));
    container.appendChild(b);
  }
}

function buildSampleStrip(container, onPick) {
  container.innerHTML = '';
  for (const photo of SAMPLE_PHOTOS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sample';
    const img = document.createElement('img');
    img.src = photo.src;
    img.alt = photo.label;
    const span = document.createElement('span');
    span.textContent = photo.label;
    b.append(img, span);
    b.addEventListener('click', () => onPick(photo.id));
    container.appendChild(b);
  }
}

export function createEditor() {
  const canvas = el('preview');
  const ctx = canvas.getContext('2d');
  const state = freshState();
  let selected = 0;
  let lastRects = [];

  function ensurePanels() {
    const count = LAYOUTS[state.layout].panels;
    while (state.panels.length < count) state.panels.push(blankPanel());
    state.panels.length = count;
    if (selected >= count) selected = 0;
  }

  function redraw() {
    ensurePanels();
    const size = SIZES[state.size];
    canvas.width = size.w;
    canvas.height = size.h;
    drawCover(ctx, state, size.w, size.h);
    lastRects = panelRects(state.layout, size.w, size.h);
    updatePanelLabel();
  }

  function updatePanelLabel() {
    const p = state.panels[selected];
    el('panelLabel').textContent = `Panel ${selected + 1} of ${state.panels.length}` +
      (p && p.src ? ` — ${p.src.split('/').pop()}` : ' — empty');
    el('zoom').value = p ? p.zoom : 1;
    el('panX').value = p ? p.ox : 0;
    el('panY').value = p ? p.oy : 0;
    el('zoomVal').textContent = `${Math.round((p ? p.zoom : 1) * 100)}%`;
  }

  function refreshPickers() {
    buildPicker(el('layoutPicker'), LAYOUTS, state.layout, (k) => {
      state.layout = k;
      refreshPickers();
      redraw();
    });
    buildPicker(el('sizePicker'), SIZES, state.size, (k) => {
      state.size = k;
      refreshPickers();
      redraw();
    });
    buildPicker(el('gradePicker'), GRADES, state.grade, (k) => {
      state.grade = k;
      refreshPickers();
      redraw();
    });
    buildSampleStrip(el('sampleStrip'), async (id) => {
      await assignPhoto(selected, id);
    });
    el('titleInput').value = state.title;
    el('subtitleInput').value = state.subtitle;
    el('badgeInput').value = state.badge;
    el('starsInput').value = state.stars;
  }

  async function assignPhoto(index, sampleId) {
    const { img, src } = await loadSample(sampleId);
    state.panels[index] = { img, src, zoom: 1, ox: 0, oy: 0 };
    selected = index;
    redraw();
  }

  async function assignUpload(index, file) {
    const dataUrl = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(new Error('read failed'));
      r.readAsDataURL(file);
    });
    const img = await loadImage(dataUrl);
    state.panels[index] = { img, src: file.name, zoom: 1, ox: 0, oy: 0 };
    selected = index;
    redraw();
  }

  function fillAll(sampleId) {
    return (async () => {
      const { img, src } = await loadSample(sampleId);
      state.panels.forEach((p, i) => {
        state.panels[i] = { img, src, zoom: 1, ox: 0, oy: 0 };
      });
      redraw();
    })();
  }

  function exportPNG() {
    const out = renderCoverCanvas(state);
    out.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-cover-${state.size}-${state.layout}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }, 'image/png');
  }

  // --- events -------------------------------------------------------
  el('titleInput').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
  el('subtitleInput').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
  el('badgeInput').addEventListener('input', (e) => { state.badge = e.target.value; redraw(); });
  el('starsInput').addEventListener('input', (e) => {
    state.stars = Math.max(0, Math.min(5, Number(e.target.value) || 0));
    redraw();
  });
  el('zoom').addEventListener('input', (e) => {
    state.panels[selected].zoom = Number(e.target.value);
    el('zoomVal').textContent = `${Math.round(Number(e.target.value) * 100)}%`;
    redraw();
  });
  el('panX').addEventListener('input', (e) => {
    state.panels[selected].ox = Number(e.target.value);
    redraw();
  });
  el('panY').addEventListener('input', (e) => {
    state.panels[selected].oy = Number(e.target.value);
    redraw();
  });
  el('uploadInput').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) assignUpload(selected, file);
    e.target.value = '';
  });
  el('fillAllBtn').addEventListener('click', () => fillAll('boulevard'));
  el('shuffleBtn').addEventListener('click', async () => {
    const ids = SAMPLE_PHOTOS.map((p) => p.id);
    for (let i = 0; i < state.panels.length; i++) {
      const { img, src } = await loadSample(ids[i % ids.length]);
      state.panels[i] = { img, src, zoom: 1 + (i % 3) * 0.12, ox: 0, oy: 0 };
    }
    redraw();
  });
  el('exportBtn').addEventListener('click', exportPNG);
  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * canvas.width;
    const y = ((e.clientY - r.top) / r.height) * canvas.height;
    for (let i = lastRects.length - 1; i >= 0; i--) {
      const pr = lastRects[i];
      if (x >= pr.x && x <= pr.x + pr.w && y >= pr.y && y <= pr.y + pr.h) {
        selected = i;
        updatePanelLabel();
        break;
      }
    }
  });

  // --- boot ---------------------------------------------------------
  refreshPickers();
  const shot = applyShotParams(state, { assignPhoto, fillAll, redraw, refreshPickers });
  if (!shot) {
    // default demo: one photo across the hero, rest sampled
    fillAll('pier').then(() => {
      state.panels[1] = state.panels[0];
      redraw();
    });
  }
  return { state, redraw, exportPNG, assignPhoto, fillAll };
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await document.fonts.load('80px Anton');
    await document.fonts.load('40px Pacifico');
  } catch (err) {
    // fonts fall back to system sans if the local files fail; the cover
    // still draws, just without the poster lettering.
    console.warn('poster fonts did not load', err);
  }
  createEditor();
});
