// Vice Cover Studio — editor wiring.
// Owns the state, the controls, photo loading, drag-to-pan per panel,
// and the PNG export. Rendering itself lives in cover.js.

import { SIZES, LAYOUTS, THEMES, defaultState, drawCover, ensureCoverFonts, blankPhoto } from './cover.js';

const $ = (id) => document.getElementById(id);
const state = defaultState();
let activePanel = 0;
let fontsReady = false;

const canvas = $('cover');
const statusEl = $('status');

function note(msg) {
  statusEl.textContent = msg;
}

function render() {
  drawCover(canvas, state);
  document.querySelectorAll('.panel-card').forEach((card, i) => {
    card.classList.toggle('active', i === activePanel);
    card.querySelector('.panel-state').textContent = state.photos[i].img ? 'photo loaded' : 'empty';
  });
  $('zoom').value = String(state.photos[activePanel].zoom);
  $('zoomVal').textContent = `${Math.round(state.photos[activePanel].zoom * 100)}%`;
  $('grade').value = String(state.grade);
  $('gradeVal').textContent = `${Math.round(state.grade * 100)}%`;
}

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('could not read that image')); };
    img.src = url;
  });
}

async function loadSample(name) {
  const img = new Image();
  img.src = `./samples/${name}.jpg`;
  await img.decode();
  return img;
}

async function setPhoto(i, img) {
  state.photos[i] = { img, zoom: 1, ox: 0, oy: 0 };
  activePanel = i;
  render();
  note(`Panel ${i + 1}: photo loaded. Drag it on the preview to position it.`);
}

function buildPanelCards() {
  const wrap = $('panels');
  wrap.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const card = document.createElement('div');
    card.className = 'panel-card';
    card.innerHTML = `
      <button type="button" class="panel-pick">Panel ${i + 1} <span class="panel-state">empty</span></button>
      <label class="file-btn">Choose photo
        <input type="file" accept="image/*" hidden>
      </label>
      <button type="button" class="sample-btn" data-sample="boulevard">Sample: Boulevard</button>
      <button type="button" class="sample-btn" data-sample="pier">Sample: Pier</button>
      <button type="button" class="clear-btn">Clear</button>`;
    card.querySelector('.panel-pick').addEventListener('click', () => { activePanel = i; render(); });
    card.querySelector('input[type=file]').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try { await setPhoto(i, await loadImageFile(file)); }
      catch { note('That file could not be read as an image.'); }
      e.target.value = '';
    });
    card.querySelectorAll('.sample-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try { await setPhoto(i, await loadSample(btn.dataset.sample)); }
        catch { note('Sample photo failed to load.'); }
      });
    });
    card.querySelector('.clear-btn').addEventListener('click', () => {
      state.photos[i] = blankPhoto();
      render();
      note(`Panel ${i + 1} cleared.`);
    });
    wrap.appendChild(card);
  }
}

function buildOptionButtons(groupId, entries, current, onPick) {
  const wrap = $(groupId);
  wrap.innerHTML = '';
  Object.entries(entries).forEach(([key, def]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = def.label;
    btn.className = key === current ? 'opt on' : 'opt';
    btn.addEventListener('click', () => {
      onPick(key);
      wrap.querySelectorAll('.opt').forEach((b) => b.classList.remove('on'));
      btn.classList.add('on');
      render();
    });
    wrap.appendChild(btn);
  });
}

function bindControls() {
  $('title').addEventListener('input', (e) => { state.title = e.target.value; render(); });
  $('tagline').addEventListener('input', (e) => { state.tagline = e.target.value; render(); });
  $('zoom').addEventListener('input', (e) => {
    state.photos[activePanel].zoom = Number(e.target.value);
    render();
  });
  $('grade').addEventListener('input', (e) => { state.grade = Number(e.target.value); render(); });
  $('grain').addEventListener('change', (e) => { state.grain = e.target.checked; render(); });
  $('fillAll').addEventListener('click', () => {
    const src = state.photos[activePanel];
    if (!src.img) { note('Load a photo into the active panel first.'); return; }
    state.photos = state.photos.map(() => ({ img: src.img, zoom: 1, ox: 0, oy: 0 }));
    render();
    note('Same photo filled all three panels.');
  });
  $('resetPos').addEventListener('click', () => {
    const p = state.photos[activePanel];
    p.zoom = 1; p.ox = 0; p.oy = 0;
    render();
  });
  $('exportBtn').addEventListener('click', () => {
    const size = SIZES[state.size];
    canvas.toBlob((blob) => {
      if (!blob) { note('Export failed — try again.'); return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-cover-${size.w}x${size.h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      note(`Exported PNG ${size.w} x ${size.h}. Share it anywhere.`);
    }, 'image/png');
  });

  // Drag to pan the active panel's photo on the preview.
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const p = state.photos[activePanel];
    p.ox += (e.clientX - lastX) / rect.width;
    p.oy += (e.clientY - lastY) / rect.height;
    lastX = e.clientX;
    lastY = e.clientY;
    render();
  });
  const stopDrag = () => { dragging = false; };
  canvas.addEventListener('pointerup', stopDrag);
  canvas.addEventListener('pointercancel', stopDrag);
}

export async function boot() {
  buildPanelCards();
  buildOptionButtons('layoutOpts', LAYOUTS, state.layout, (k) => { state.layout = k; });
  buildOptionButtons('sizeOpts', SIZES, state.size, (k) => { state.size = k; });
  buildOptionButtons('themeOpts', THEMES, state.theme, (k) => { state.theme = k; });
  bindControls();
  render();
  await ensureCoverFonts();
  fontsReady = true;
  render();
  note('Ready. Load a photo into a panel, write a caption, export a PNG.');
}

export function getState() { return state; }
export function getCanvas() { return canvas; }
export { fontsReady };

export function refresh() { render(); }
