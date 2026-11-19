// Vice City Sunset — editor. Wires the controls to the cover renderer,
// loads the user's photos (or the kit samples), lets each panel be cropped
// and positioned, and exports the finished cover as a PNG.

import { defaultState, renderCover, exportCoverPng, SIZES, LAYOUTS } from './cover.js';
import { sceneForQuery } from './shots.js';

const $ = (id) => document.getElementById(id);
const preview = $('preview');
const state = defaultState();

let drag = null;

function photoAt(i) {
  return state.photos[i] ?? null;
}

function render() {
  renderCover(preview, state);
  const hint = $('preview-hint');
  if (hint) hint.style.display = state.photos.length ? 'none' : '';
  syncChips();
  syncStrip();
  const panel = state.panels[state.selected];
  if (panel) {
    $('zoom').value = String(Math.round(panel.zoom * 100));
    $('zoom-val').textContent = `${Math.round(panel.zoom * 100)}%`;
  }
}

function syncChips() {
  for (const el of document.querySelectorAll('.layout-chip')) el.classList.toggle('active', el.dataset.layout === state.layout);
  for (const el of document.querySelectorAll('.grade-chip')) el.classList.toggle('active', el.dataset.grade === state.grade);
  for (const el of document.querySelectorAll('.size-chip')) el.classList.toggle('active', el.dataset.size === state.size);
}

function syncStrip() {
  const strip = $('photo-strip');
  strip.innerHTML = '';
  state.photos.forEach((img, i) => {
    const thumb = document.createElement('img');
    thumb.src = img.src;
    thumb.alt = `Loaded photo ${i + 1}`;
    thumb.classList.toggle('active', state.panels[state.selected]?.photo === i);
    thumb.addEventListener('click', () => {
      state.panels[state.selected].photo = i;
      render();
    });
    strip.appendChild(thumb);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

async function addPhotoFile(file) {
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  state.photos.push(img);
  if (state.photos.length === 1) {
    state.panels.forEach((p) => { p.photo = 0; });
  }
  render();
  return img;
}

async function addSample(name) {
  const res = await fetch(`samples/${name}`);
  if (!res.ok) throw new Error(`Sample ${name} did not load`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const img = await loadImage(url);
  state.photos.push(img);
  if (state.photos.length === 1) {
    state.panels.forEach((p) => { p.photo = 0; });
  }
  render();
  return img;
}

function panelRects() {
  const layout = LAYOUTS[state.layout];
  return layout.panels.map((s) => ({
    x: s.x * preview.width,
    y: s.y * preview.height,
    w: s.w * preview.width,
    h: s.h * preview.height,
  }));
}

function pickPanel(clientX, clientY) {
  const box = preview.getBoundingClientRect();
  const px = ((clientX - box.left) / box.width) * preview.width;
  const py = ((clientY - box.top) / box.height) * preview.height;
  const rects = panelRects();
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
  }
  return -1;
}

function bindPreview() {
  preview.addEventListener('pointerdown', (e) => {
    const idx = pickPanel(e.clientX, e.clientY);
    if (idx < 0) return;
    state.selected = idx;
    const rect = panelRects()[idx];
    drag = { x: e.clientX, y: e.clientY, moved: false, rect };
    preview.setPointerCapture(e.pointerId);
    render();
  });
  preview.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const box = preview.getBoundingClientRect();
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
    if (!drag.moved) return;
    const panel = state.panels[state.selected];
    panel.ox += dx / box.width / (drag.rect.w / preview.width);
    panel.oy += dy / box.height / (drag.rect.h / preview.height);
    panel.ox = Math.max(-0.6, Math.min(0.6, panel.ox));
    panel.oy = Math.max(-0.6, Math.min(0.6, panel.oy));
    drag.x = e.clientX;
    drag.y = e.clientY;
    render();
  });
  preview.addEventListener('pointerup', () => { drag = null; });
  preview.addEventListener('wheel', (e) => {
    e.preventDefault();
    const panel = state.panels[state.selected];
    panel.zoom = Math.max(1, Math.min(2.6, panel.zoom * (e.deltaY < 0 ? 1.08 : 0.92)));
    render();
  }, { passive: false });
}

function bindControls() {
  $('file-input').addEventListener('change', async (e) => {
    for (const file of e.target.files) {
      try { await addPhotoFile(file); } catch (err) { console.warn(err); }
    }
    e.target.value = '';
  });
  for (const btn of document.querySelectorAll('[data-sample]')) {
    btn.addEventListener('click', async () => {
      try { await addSample(btn.dataset.sample); } catch (err) { console.warn(err); }
    });
  }
  for (const chip of document.querySelectorAll('.layout-chip')) {
    chip.addEventListener('click', () => { state.layout = chip.dataset.layout; state.selected = 0; render(); });
  }
  for (const chip of document.querySelectorAll('.grade-chip')) {
    chip.addEventListener('click', () => { state.grade = chip.dataset.grade; render(); });
  }
  for (const chip of document.querySelectorAll('.size-chip')) {
    chip.addEventListener('click', () => { state.size = chip.dataset.size; render(); });
  }
  $('zoom').addEventListener('input', (e) => {
    const panel = state.panels[state.selected];
    panel.zoom = Number(e.target.value) / 100;
    $('zoom-val').textContent = `${e.target.value}%`;
    render();
  });
  $('btn-fill-all').addEventListener('click', () => {
    const photo = state.panels[state.selected].photo;
    state.panels.forEach((p) => { p.photo = photo; });
    render();
  });
  $('btn-next-photo').addEventListener('click', () => {
    if (!state.photos.length) return;
    const panel = state.panels[state.selected];
    panel.photo = (panel.photo + 1) % state.photos.length;
    render();
  });
  $('in-title').addEventListener('input', (e) => { state.title = e.target.value || 'Sunset Heist'; render(); });
  $('in-subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; render(); });
  $('in-kicker').addEventListener('input', (e) => { state.kicker = e.target.value; render(); });
  $('opt-grain').addEventListener('change', (e) => { state.grain = e.target.checked; render(); });
  $('opt-halftone').addEventListener('change', (e) => { state.halftone = e.target.checked; render(); });
  $('btn-random').addEventListener('click', () => {
    const layouts = Object.keys(LAYOUTS);
    const grades = ['sunset', 'neon', 'gold', 'noir'];
    state.layout = layouts[Math.floor(Math.random() * layouts.length)];
    state.grade = grades[Math.floor(Math.random() * grades.length)];
    if (state.photos.length > 1) {
      state.panels.forEach((p) => { p.photo = Math.floor(Math.random() * state.photos.length); });
    }
    state.selected = 0;
    render();
  });
}

async function exportPng() {
  const blob = await exportCoverPng(state);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vice-city-sunset-${state.size}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function bindExport() {
  $('btn-export').addEventListener('click', () => { exportPng().catch((e) => console.warn(e)); });
  $('btn-export-2').addEventListener('click', () => { exportPng().catch((e) => console.warn(e)); });
}

// Shot scenes (?shot=cover / ?shot=editor) render a fixed scene from the
// kit samples so screenshots show the app and its exported covers.
async function applyShotScene() {
  const scene = sceneForQuery(new URLSearchParams(location.search));
  if (!scene) return false;
  if (scene.mode === 'cover') document.body.classList.add('shot-cover');
  state.layout = scene.layout;
  state.grade = scene.grade;
  state.size = scene.size;
  state.title = scene.title;
  state.subtitle = scene.subtitle;
  state.kicker = scene.kicker;
  $('in-title').value = scene.title;
  $('in-subtitle').value = scene.subtitle;
  $('in-kicker').value = scene.kicker;
  for (const name of scene.photos) {
    try { await addSample(name); } catch (err) { console.warn(err); }
  }
  state.panels.forEach((p, i) => { p.photo = scene.panelPhotos[i % scene.panelPhotos.length]; });
  state.selected = 0;
  render();
  return true;
}

// Self-test (?selftest=1): renders every export size and reports the PNG
// byte sizes into #selftest so a headless run can verify the export path.
async function runSelfTest() {
  const out = { sizes: {}, ok: true };
  for (const size of Object.keys(SIZES)) {
    try {
      const keep = state.size;
      state.size = size;
      const blob = await exportCoverPng(state);
      out.sizes[size] = { bytes: blob.size, type: blob.type };
      state.size = keep;
    } catch (err) {
      out.sizes[size] = { error: String(err) };
      out.ok = false;
    }
  }
  const node = $('selftest');
  node.hidden = false;
  node.textContent = JSON.stringify(out);
  return out;
}

bindPreview();
bindControls();
bindExport();
render();

const params = new URLSearchParams(location.search);
if (params.has('shot')) {
  applyShotScene().catch((e) => console.warn(e));
} else if (params.get('selftest') === '1') {
  addSample('boulevard.jpg')
    .then(() => addSample('pier.jpg'))
    .then(() => { render(); return runSelfTest(); })
    .catch((e) => console.warn(e));
}
