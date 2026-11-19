// Neon Coast Cover Studio — the editor: photos, layouts, grades, captions, export.
// Wires the page: pick photos, drag to crop, type a caption, export PNGs in three post sizes.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, exportCover, panelAt, LAYOUTS, GRADES, SIZES, defaultState, blankPhoto } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const state = defaultState();
let activeSlot = 0;
let undoStack = [];
let redoStack = [];

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** A snapshot of everything except the image objects (re-attached by slot on restore). */
function snapshot() {
  return JSON.stringify({
    layout: state.layout, grade: state.grade, title: state.title,
    subtitle: state.subtitle, badge: state.badge, heat: state.heat,
    grain: state.grain, vignette: state.vignette, frame: state.frame,
    photos: state.photos.map((p) => ({ name: p.name, zoom: p.zoom, dx: p.dx, dy: p.dy })),
  });
}

function pushHistory() {
  undoStack.push(snapshot());
  if (undoStack.length > 60) undoStack.shift();
  redoStack = [];
  updateUndoButtons();
}

function restore(serialized) {
  const data = JSON.parse(serialized);
  const imgs = state.photos.map((p) => p.img);
  Object.assign(state, data);
  state.photos = data.photos.map((p, i) => ({ ...blankPhoto(), ...p, img: imgs[i] || null }));
  syncControls();
  redraw();
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
  updateUndoButtons();
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
  updateUndoButtons();
}

function updateUndoButtons() {
  document.getElementById('undo').disabled = !undoStack.length;
  document.getElementById('redo').disabled = !redoStack.length;
}

function redraw() {
  drawCover(canvas, state);
  renderSlots();
}

function renderSlots() {
  const strip = document.getElementById('slots');
  strip.querySelectorAll('.slot').forEach((el, i) => {
    el.classList.toggle('active', i === activeSlot);
    el.querySelector('.slot-name').textContent = state.photos[i].name || `Photo ${i + 1}`;
    el.querySelector('.slot-thumb').textContent = state.photos[i].img ? '✓' : '+';
  });
}

function syncControls() {
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('badge').value = state.badge;
  document.getElementById('heat').value = state.heat;
  document.getElementById('heatVal').textContent = `${state.heat} / 5`;
  document.getElementById('grain').checked = state.grain;
  document.getElementById('vignette').checked = state.vignette;
  document.getElementById('frame').value = state.frame;
  document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('on', b.dataset.layout === state.layout));
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('on', b.dataset.grade === state.grade));
  document.getElementById('zoom').value = state.photos[activeSlot].zoom;
  document.getElementById('zoomVal').textContent = `${Math.round(state.photos[activeSlot].zoom * 100)}%`;
}

function setStatus(text) {
  status.textContent = text;
}

async function addPhoto(slot, file) {
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  pushHistory();
  state.photos[slot] = { img, name: file.name.replace(/\.[^.]+$/, ''), zoom: 1, dx: 0, dy: 0 };
  activeSlot = slot;
  syncControls();
  redraw();
  setStatus(`Photo ${slot + 1} loaded — drag it on the cover to crop, scroll to zoom.`);
}

function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

async function exportOne(size) {
  const blob = await exportCover(state, size);
  downloadBlob(blob, `vice-city-cover-${size.w}x${size.h}.png`);
  setStatus(`Saved vice-city-cover-${size.w}x${size.h}.png`);
}

async function exportAll() {
  for (const size of SIZES) {
    const blob = await exportCover(state, size);
    downloadBlob(blob, `vice-city-cover-${size.w}x${size.h}.png`);
    await new Promise((r) => setTimeout(r, 350));
  }
  setStatus('Saved all three sizes: 1080x1080, 1080x1350, 1920x1080.');
}

function buildPickers() {
  const layoutBox = document.getElementById('layouts');
  for (const [id, def] of Object.entries(LAYOUTS)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = def.label;
    b.dataset.layout = id;
    b.className = 'pick';
    b.addEventListener('click', () => {
      if (state.layout === id) return;
      pushHistory();
      state.layout = id;
      syncControls();
      redraw();
    });
    layoutBox.appendChild(b);
  }
  const gradeBox = document.getElementById('grades');
  for (const [id, def] of Object.entries(GRADES)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.grade = id;
    b.className = 'pick grade';
    b.style.background = `linear-gradient(135deg, ${def.top}, ${def.mid} 55%, ${def.bottom})`;
    b.innerHTML = `<span>${def.label}</span>`;
    b.addEventListener('click', () => {
      if (state.grade === id) return;
      pushHistory();
      state.grade = id;
      syncControls();
      redraw();
    });
    gradeBox.appendChild(b);
  }
  const slotsBox = document.getElementById('slots');
  for (let i = 0; i < 4; i++) {
    const el = document.createElement('div');
    el.className = 'slot';
    el.innerHTML = `<span class="slot-thumb">+</span><span class="slot-name">Photo ${i + 1}</span><input type="file" accept="image/*" hidden>`;
    el.addEventListener('click', (e) => {
      if (e.target.tagName === 'INPUT') return;
      activeSlot = i;
      syncControls();
      redraw();
    });
    el.addEventListener('dblclick', () => el.querySelector('input').click());
    el.querySelector('input').addEventListener('change', (e) => {
      if (e.target.files[0]) addPhoto(i, e.target.files[0]);
    });
    slotsBox.appendChild(el);
  }
  const sizeBox = document.getElementById('sizes');
  for (const size of SIZES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick';
    b.textContent = size.label;
    b.addEventListener('click', () => exportOne(size));
    sizeBox.appendChild(b);
  }
}

function bindControls() {
  document.getElementById('photo').addEventListener('change', (e) => {
    if (e.target.files[0]) addPhoto(activeSlot, e.target.files[0]);
  });
  document.getElementById('sample').addEventListener('click', async () => {
    pushHistory();
    const picks = ['boulevard', 'pier', 'boulevard', 'pier'];
    for (let i = 0; i < 4; i++) {
      state.photos[i] = { img: await loadImage(`samples/${picks[i]}.jpg`), name: picks[i], zoom: 1, dx: 0, dy: 0 };
    }
    redraw();
    setStatus('Sample photos loaded — try the layouts and grades.');
  });
  const title = document.getElementById('title');
  title.addEventListener('input', () => { state.title = title.value; redraw(); });
  title.addEventListener('change', pushHistory);
  const subtitle = document.getElementById('subtitle');
  subtitle.addEventListener('input', () => { state.subtitle = subtitle.value; redraw(); });
  subtitle.addEventListener('change', pushHistory);
  const badge = document.getElementById('badge');
  badge.addEventListener('input', () => { state.badge = badge.value; redraw(); });
  badge.addEventListener('change', pushHistory);
  document.getElementById('heat').addEventListener('input', (e) => {
    state.heat = Number(e.target.value);
    document.getElementById('heatVal').textContent = `${state.heat} / 5`;
    redraw();
  });
  document.getElementById('heat').addEventListener('change', pushHistory);
  document.getElementById('grain').addEventListener('change', (e) => { pushHistory(); state.grain = e.target.checked; redraw(); });
  document.getElementById('vignette').addEventListener('change', (e) => { pushHistory(); state.vignette = e.target.checked; redraw(); });
  document.getElementById('frame').addEventListener('change', (e) => { pushHistory(); state.frame = e.target.value; redraw(); });
  document.getElementById('zoom').addEventListener('input', (e) => {
    const slot = state.photos[activeSlot];
    slot.zoom = Number(e.target.value);
    document.getElementById('zoomVal').textContent = `${Math.round(slot.zoom * 100)}%`;
    redraw();
  });
  document.getElementById('zoom').addEventListener('change', pushHistory);
  document.getElementById('resetCrop').addEventListener('click', () => {
    pushHistory();
    const slot = state.photos[activeSlot];
    slot.zoom = 1; slot.dx = 0; slot.dy = 0;
    syncControls();
    redraw();
  });
  document.getElementById('exportAll').addEventListener('click', exportAll);
  document.getElementById('undo').addEventListener('click', undo);
  document.getElementById('redo').addEventListener('click', redo);
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
  });

  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (canvas.width / rect.width);
    const py = (e.clientY - rect.top) * (canvas.height / rect.height);
    const hit = panelAt(state, px, py, canvas.width, canvas.height);
    if (hit) {
      activeSlot = hit.photo;
      syncControls();
      renderSlots();
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const slot = state.photos[activeSlot];
    slot.dx += (e.clientX - lastX) / rect.width;
    slot.dy += (e.clientY - lastY) / rect.height;
    lastX = e.clientX;
    lastY = e.clientY;
    redraw();
  });
  canvas.addEventListener('pointerup', () => {
    if (dragging) { dragging = false; pushHistory(); }
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const slot = state.photos[activeSlot];
    slot.zoom = Math.min(3, Math.max(1, slot.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
    syncControls();
    redraw();
  }, { passive: false });
}

buildPickers();
bindControls();
syncControls();
updateUndoButtons();

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, {
    loadImage,
    applyScene(scene) {
      if (shot === 'cover') {
        const size = SIZES.find((s) => s.id === scene.size) || SIZES[0];
        canvas.width = size.w;
        canvas.height = size.h;
      }
      state.photos.forEach((p, i) => {
        p.img = scene.photos[i];
        p.name = i % 2 === 0 ? 'boulevard' : 'pier';
        p.zoom = 1; p.dx = 0; p.dy = 0;
      });
      state.title = scene.title;
      state.subtitle = scene.subtitle;
      state.layout = scene.layout;
      state.grade = scene.grade;
      syncControls();
      redraw();
    },
  });
} else {
  redraw();
}
