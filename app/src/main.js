// Vice Cover Studio — editor wiring.
// Loads photos (from the machine or the built-in samples), lets the maker pick
// a layout and a grade, drag each panel's photo into place, edit the caption,
// and export the cover as a PNG. The preview and the export both paint through
// renderCover in cover.js, so the preview never lies about the export.

import { renderCover, exportPng, panelCount } from './cover.js';

const SAMPLES = [
  { file: 'samples/boulevard.jpg', name: 'Boulevard' },
  { file: 'samples/neon.jpg', name: 'Neon Street' },
  { file: 'samples/pier.jpg', name: 'Pier' },
  { file: 'samples/rooftop.jpg', name: 'Rooftop' },
];

const state = {
  layout: 'strip',
  grade: 'sunset',
  vignette: 0.55,
  grain: 0.35,
  title: 'VICE CITY',
  subtitle: 'welcome back',
  titleColor: '#ffd23f',
  outline: true,
  ribbon: true,
  photos: [],
  panels: [
    { photo: 0, zoom: 1.15, ox: 0, oy: 0 },
    { photo: 1, zoom: 1.25, ox: 0, oy: 0 },
    { photo: 2, zoom: 1.25, ox: 0, oy: 0 },
    { photo: 3, zoom: 1.2, ox: 0, oy: 0 },
  ],
};

let selectedPanel = 0;
let ready = false;

const $ = (id) => document.getElementById(id);
const preview = $('preview');
const statusEl = $('status');
const params = new URLSearchParams(location.search);

/** Load an image from a URL and resolve when it decodes. */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

async function loadSamples() {
  const loaded = [];
  for (const s of SAMPLES) {
    try {
      const img = await loadImage(s.file);
      img.dataset.label = s.name;
      loaded.push(img);
    } catch {
      // A missing sample just leaves that slot empty; the app still works.
    }
  }
  return loaded;
}

/** Repaint the preview at the selected export size's aspect ratio. */
function paint() {
  if (!ready) return;
  const [w, h] = $('size').value.split('x').map(Number);
  const scale = Math.min(1, 960 / w);
  renderCover(preview, state, Math.round(w * scale), Math.round(h * scale));
}

/** Rebuild the panel-photo dropdown from the loaded photos. */
function refreshPanelPhoto() {
  const sel = $('panelPhoto');
  sel.innerHTML = '';
  state.photos.forEach((img, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = img.dataset.label || `Photo ${i + 1}`;
    sel.appendChild(opt);
  });
  sel.value = String(state.panels[selectedPanel].photo);
  $('zoom').value = String(state.panels[selectedPanel].zoom);
}

/** Which panel (if any) sits under a point on the preview canvas. */
function panelAt(clientX, clientY) {
  const r = preview.getBoundingClientRect();
  const x = (clientX - r.left) / r.width;
  const y = (clientY - r.top) / r.height;
  if (y > 0.8) return -1;
  const py = y / 0.8;
  const n = panelCount(state.layout);
  const g = 0.018;
  if (state.layout === 'grid') {
    const half = (1 - g) / 2;
    const col = x > half + g ? 1 : 0;
    const row = py > half + g ? 1 : 0;
    return row * 2 + col < n ? row * 2 + col : -1;
  }
  if (state.layout === 'hero') {
    if (py < 0.6) return 0;
    const half = (1 - g) / 2;
    return x > half + g ? 2 : 1;
  }
  const heroW = 0.58;
  if (x < heroW) return 0;
  const halfH = (1 - g) / 2;
  return py > halfH + g ? 2 : 1;
}

function bindControls() {
  document.querySelectorAll('#layoutSeg button').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#layoutSeg button').forEach((b) => b.classList.remove('on'));
      btn.classList.add('on');
      state.layout = btn.dataset.layout;
      selectedPanel = 0;
      refreshPanelPhoto();
      paint();
    });
  });
  document.querySelectorAll('#gradeSeg button').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#gradeSeg button').forEach((b) => b.classList.remove('on'));
      btn.classList.add('on');
      state.grade = btn.dataset.grade;
      paint();
    });
  });

  $('photoInput').addEventListener('change', async (ev) => {
    const files = [...ev.target.files];
    for (const file of files) {
      const url = URL.createObjectURL(file);
      try {
        const img = await loadImage(url);
        img.dataset.label = file.name;
        state.photos.push(img);
        state.panels[selectedPanel].photo = state.photos.length - 1;
      } catch {
        URL.revokeObjectURL(url);
      }
    }
    refreshPanelPhoto();
    paint();
    statusEl.textContent = `${state.photos.length} photo(s) loaded — drag a panel to reposition it.`;
  });

  $('panelPhoto').addEventListener('change', (ev) => {
    state.panels[selectedPanel].photo = Number(ev.target.value);
    paint();
  });
  $('zoom').addEventListener('input', (ev) => {
    state.panels[selectedPanel].zoom = Number(ev.target.value);
    paint();
  });
  $('vignette').addEventListener('input', (ev) => {
    state.vignette = Number(ev.target.value);
    paint();
  });
  $('grain').addEventListener('input', (ev) => {
    state.grain = Number(ev.target.value);
    paint();
  });
  $('titleText').addEventListener('input', (ev) => {
    state.title = ev.target.value;
    paint();
  });
  $('subtitleText').addEventListener('input', (ev) => {
    state.subtitle = ev.target.value;
    paint();
  });
  $('titleColor').addEventListener('input', (ev) => {
    state.titleColor = ev.target.value;
    paint();
  });
  $('outline').addEventListener('change', (ev) => {
    state.outline = ev.target.checked;
    paint();
  });
  $('ribbon').addEventListener('change', (ev) => {
    state.ribbon = ev.target.checked;
    paint();
  });
  $('size').addEventListener('change', paint);

  $('exportBtn').addEventListener('click', async () => {
    const [w, h] = $('size').value.split('x').map(Number);
    statusEl.textContent = 'Exporting…';
    const blob = await exportPng(state, w, h);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    statusEl.textContent = `Exported ${w}×${h} PNG — check your downloads.`;
  });

  // Drag a panel to pan its photo; a plain click selects the panel.
  let drag = null;
  preview.addEventListener('pointerdown', (ev) => {
    const idx = panelAt(ev.clientX, ev.clientY);
    if (idx < 0) return;
    selectedPanel = idx;
    refreshPanelPhoto();
    drag = { x: ev.clientX, y: ev.clientY, ox: state.panels[idx].ox, oy: state.panels[idx].oy, moved: false };
    preview.setPointerCapture(ev.pointerId);
  });
  preview.addEventListener('pointermove', (ev) => {
    if (!drag) return;
    const r = preview.getBoundingClientRect();
    const dx = (ev.clientX - drag.x) / r.width;
    const dy = (ev.clientY - drag.y) / r.height;
    if (Math.abs(dx) + Math.abs(dy) > 0.004) drag.moved = true;
    const p = state.panels[selectedPanel];
    p.ox = Math.max(-1, Math.min(1, drag.ox + dx * 2.5));
    p.oy = Math.max(-1, Math.min(1, drag.oy + dy * 2.5));
    paint();
  });
  preview.addEventListener('pointerup', () => {
    if (drag && drag.moved) statusEl.textContent = `Panel ${selectedPanel + 1} repositioned.`;
    drag = null;
  });
}

/** Sample thumbnails under the photo picker. */
function buildSampleRow() {
  const row = $('sampleRow');
  SAMPLES.forEach((s, i) => {
    const img = document.createElement('img');
    img.src = s.file;
    img.alt = s.name;
    img.title = s.name;
    if (i === 0) img.classList.add('picked');
    img.addEventListener('click', () => {
      row.querySelectorAll('img').forEach((t) => t.classList.remove('picked'));
      img.classList.add('picked');
      state.panels[selectedPanel].photo = i;
      refreshPanelPhoto();
      paint();
    });
    row.appendChild(img);
  });
}

/**
 * Screenshot mode (?shot=cover): the page becomes the exported cover itself,
 * painted by the same renderCover the export uses, at the window's size —
 * so a headless screenshot captures exactly what the app draws.
 */
async function shotMode() {
  document.body.classList.add('shot');
  const sample = params.get('sample') || 'neon';
  const size = params.get('size') || '1920x1080';
  const [w, h] = size.split('x').map(Number);
  state.layout = params.get('layout') || 'strip';
  state.grade = params.get('grade') || 'sunset';
  state.title = params.get('title') || 'VICE CITY';
  state.subtitle = params.get('subtitle') || 'welcome back';
  state.photos = await loadSamples();
  const pick = SAMPLES.findIndex((s) => s.file.includes(sample));
  const base = pick >= 0 ? pick : 1;
  state.panels = [0, 1, 2, 3].map((k) => ({
    photo: (base + k) % state.photos.length,
    zoom: 1.2,
    ox: 0,
    oy: 0,
  }));
  await document.fonts.load('80px "Bebas Neue"');
  await document.fonts.load('40px "Lobster"');
  await document.fonts.ready;
  renderCover($('shotCanvas'), state, w, h);
  document.title = 'shot-ready';
}

async function init() {
  buildSampleRow();
  bindControls();
  state.photos = await loadSamples();
  if (params.get('shot') === 'cover') {
    await shotMode();
    return;
  }
  const sample = params.get('sample');
  if (sample) {
    const idx = SAMPLES.findIndex((s) => s.file.includes(sample));
    if (idx >= 0) {
      state.panels.forEach((p, i) => { p.photo = (idx + i) % state.photos.length; });
      refreshPanelPhoto();
    }
  }
  try {
    await document.fonts.load('80px "Bebas Neue"');
    await document.fonts.load('40px "Lobster"');
    await document.fonts.ready;
  } catch {
    // Fonts fall back to system sans; the cover still renders.
  }
  ready = true;
  refreshPanelPhoto();
  paint();
  statusEl.textContent = 'Sample photos loaded — click a panel, drag to reposition, then export.';
  document.title = 'editor-ready';
}

init();
