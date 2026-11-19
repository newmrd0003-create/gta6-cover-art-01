// Vice City Sunset — editor wiring.
// Owns the cover state, the live preview, drag-to-pan cropping, caption
// and grade controls, and the PNG export. Rendering lives in cover.js,
// ?shot= handling in shots.js.

import { blankState, renderCover, coverToBlob, posterLayout, EXPORT_SIZES } from './cover.js';
import { isShotMode, runShotMode } from './shots.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const state = blankState();
let selectedPanel = 0;

const preview = $('#preview');
const previewCtx = preview.getContext('2d');

// Repaint the live preview from the current state.
function redraw() {
  preview.width = state.size.w;
  preview.height = state.size.h;
  previewCtx.drawImage(renderCover(state), 0, 0);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

async function loadSample(name) {
  return loadImage(`samples/${name}.jpg`);
}

// Panel selection: tabs and clicking the preview both select a panel.
function selectPanel(index) {
  selectedPanel = index;
  $$('.panel-tab').forEach((tab, i) => tab.classList.toggle('active', i === index));
  const panel = state.panels[index];
  $('#zoomInput').value = Math.round(panel.zoom * 100);
  $('#zoomOut').textContent = `${Math.round(panel.zoom * 100)}%`;
}

$$('.panel-tab').forEach((tab) => {
  tab.addEventListener('click', () => selectPanel(Number(tab.dataset.panel)));
});

// Drag on the preview pans the photo inside the panel under the pointer.
let drag = null;

function pointToCover(event) {
  const rect = preview.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (state.size.w / rect.width),
    y: (event.clientY - rect.top) * (state.size.h / rect.height),
    rect,
  };
}

function panelAt(x, y) {
  const layout = posterLayout(state.size.w, state.size.h);
  const hit = layout.panels.findIndex((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
  return hit === -1 ? 0 : hit;
}

preview.addEventListener('pointerdown', (event) => {
  const { x, y } = pointToCover(event);
  selectPanel(panelAt(x, y));
  drag = { x, y, panX: state.panels[selectedPanel].panX, panY: state.panels[selectedPanel].panY };
  preview.classList.add('dragging');
  preview.setPointerCapture(event.pointerId);
});

preview.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const { x, y, rect } = pointToCover(event);
  const panel = state.panels[selectedPanel];
  const layout = posterLayout(state.size.w, state.size.h);
  const area = layout.panels[selectedPanel];
  const scaleX = state.size.w / rect.width;
  const scaleY = state.size.h / rect.height;
  const dx = (x - drag.x) / scaleX / rect.width;
  const dy = (y - drag.y) / scaleY / rect.height;
  // Panning moves the photo opposite to the drag, like grabbing the print.
  panel.panX = clamp(drag.panX - (dx * state.size.w) / area.w, 0, 1);
  panel.panY = clamp(drag.panY - (dy * state.size.h) / area.h, 0, 1);
  redraw();
});

function endDrag() {
  drag = null;
  preview.classList.remove('dragging');
}
preview.addEventListener('pointerup', endDrag);
preview.addEventListener('pointercancel', endDrag);

preview.addEventListener('wheel', (event) => {
  event.preventDefault();
  const panel = state.panels[selectedPanel];
  panel.zoom = clamp(panel.zoom - Math.sign(event.deltaY) * 0.08, 1, 2.6);
  $('#zoomInput').value = Math.round(panel.zoom * 100);
  $('#zoomOut').textContent = `${Math.round(panel.zoom * 100)}%`;
  redraw();
}, { passive: false });

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// Photo loading: upload a file, or pick a bundled sample.
$('#uploadBtn').addEventListener('click', () => $('#fileInput').click());

$('#fileInput').addEventListener('change', async (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const img = await loadImage(String(reader.result));
      const panel = state.panels[selectedPanel];
      panel.img = img;
      panel.panX = 0.5;
      panel.panY = 0.5;
      panel.zoom = 1;
      selectPanel(selectedPanel);
      redraw();
    } catch (err) {
      console.warn(err.message);
    }
  };
  reader.readAsDataURL(file);
  event.target.value = '';
});

$('#useAllBtn').addEventListener('click', () => {
  const source = state.panels[selectedPanel];
  if (!source.img) return;
  state.panels.forEach((panel) => { panel.img = source.img; });
  redraw();
});

$$('.sample-btn').forEach((btn) => {
  btn.addEventListener('click', async () => {
    try {
      const img = await loadSample(btn.dataset.sample);
      const panel = state.panels[selectedPanel];
      panel.img = img;
      panel.panX = 0.5;
      panel.panY = 0.5;
      panel.zoom = 1;
      selectPanel(selectedPanel);
      redraw();
    } catch (err) {
      console.warn(err.message);
    }
  });
});

// Caption controls.
$('#titleInput').addEventListener('input', (event) => {
  state.title = event.target.value;
  redraw();
});

$('#subtitleInput').addEventListener('input', (event) => {
  state.subtitle = event.target.value;
  redraw();
});

$('#titleSizeInput').addEventListener('input', (event) => {
  state.titleSize = Number(event.target.value) / 100;
  $('#titleSizeOut').textContent = `${event.target.value}%`;
  redraw();
});

$$('#titleSwatches .swatch').forEach((btn) => {
  btn.addEventListener('click', () => {
    $$('#titleSwatches .swatch').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.titleColor = btn.dataset.color;
    redraw();
  });
});

// Zoom slider for the selected panel.
$('#zoomInput').addEventListener('input', (event) => {
  const panel = state.panels[selectedPanel];
  panel.zoom = Number(event.target.value) / 100;
  $('#zoomOut').textContent = `${event.target.value}%`;
  redraw();
});

// Colour grade presets.
$$('#gradeBtns .grade-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    $$('#gradeBtns .grade-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.grade = btn.dataset.grade;
    redraw();
  });
});

// Export size picker.
$$('#sizeBtns .size-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    $$('#sizeBtns .size-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const [w, h] = btn.dataset.size.split('x').map(Number);
    const found = EXPORT_SIZES.find((s) => s.w === w && s.h === h);
    state.size = found ? { w: found.w, h: found.h } : { w, h };
    redraw();
  });
});

// Export: the app writes a PNG at the chosen size and downloads it.
async function exportPng() {
  const blob = await coverToBlob(state);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `vice-city-sunset-${state.size.w}x${state.size.h}.png`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

$('#exportBtn').addEventListener('click', exportPng);
$('#exportBtn2').addEventListener('click', exportPng);

// Start: hero gets the pier sample, the two small panels the boulevard,
// then hand over to ?shot= mode when the URL asks for it.
async function start() {
  try {
    const [pier, boulevard] = await Promise.all([loadSample('pier'), loadSample('boulevard')]);
    state.panels[0].img = pier;
    state.panels[1].img = boulevard;
    state.panels[2].img = pier;
    state.panels[2].panX = 0.2;
    state.panels[2].panY = 0.2;
    state.panels[2].zoom = 1.4;
  } catch (err) {
    console.warn(err.message);
  }
  selectPanel(0);
  redraw();
  if (isShotMode()) {
    await runShotMode(state, redraw);
    // Keep the controls in sync with what the shot query set.
    $('#titleInput').value = state.title;
    $$('#sizeBtns .size-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.size === `${state.size.w}x${state.size.h}`);
    });
    redraw();
  }
}

start();
