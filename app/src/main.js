// Vice Cover Studio — editor wiring.
// Owns the page state (photos, layout, grade, captions, per-panel assignment),
// the live preview, and the PNG export. Photos stay on the user's machine:
// FileReader data URLs and bundled samples only, nothing is uploaded.

import { EXPORT_SIZES, LAYOUTS, GRADES, drawCover, panelRects } from './cover.js';
import { loadEditorShotState, SHOT_PRESETS } from './shots.js';

const $ = (id) => document.getElementById(id);

const state = {
  photos: [],
  layout: 'trio',
  grade: 'sunset',
  size: 'wide',
  title: 'VICE CITY',
  subtitle: 'Welcome back to',
  tagline: 'Sunset over the boulevard • 2026',
  assignments: {},
  selectedPanel: 0,
};

let preview = null;
let shotCanvas = null;

function photoForPanel(panelIndex) {
  const count = state.photos.length;
  if (!count) return null;
  const assigned = state.assignments[panelIndex];
  return state.photos[(assigned ?? panelIndex) % count];
}

function renderPreview() {
  if (!preview) return;
  const size = EXPORT_SIZES[state.size];
  preview.width = size.width;
  preview.height = size.height;
  drawCover(preview.getContext('2d'), state, size.width, size.height);
  updatePanelList();
  updateSliders();
}

function updatePanelList() {
  const list = $('panelList');
  if (!list) return;
  const rects = panelRects(state.layout, EXPORT_SIZES[state.size].width, EXPORT_SIZES[state.size].height);
  list.innerHTML = '';
  rects.forEach((rect, i) => {
    const row = document.createElement('div');
    row.className = 'panel-row' + (state.selectedPanel === i ? ' selected' : '');
    const label = document.createElement('button');
    label.type = 'button';
    label.textContent = `Panel ${i + 1}`;
    label.addEventListener('click', () => { state.selectedPanel = i; renderPreview(); });
    const select = document.createElement('select');
    select.setAttribute('aria-label', `Photo for panel ${i + 1}`);
    state.photos.forEach((photo, p) => {
      const option = document.createElement('option');
      option.value = String(p);
      option.textContent = photo.name || `Photo ${p + 1}`;
      const assigned = state.assignments[i];
      if ((assigned ?? i % state.photos.length) === p) option.selected = true;
      select.appendChild(option);
    });
    select.addEventListener('change', () => {
      state.assignments[i] = Number(select.value);
      renderPreview();
    });
    row.appendChild(label);
    row.appendChild(select);
    list.appendChild(row);
  });
}

function updateSliders() {
  const photo = photoForPanel(state.selectedPanel);
  const zoom = $('zoom');
  const panX = $('panX');
  const panY = $('panY');
  if (!photo || !zoom) return;
  zoom.value = String(photo.zoom);
  panX.value = String(photo.panX);
  panY.value = String(photo.panY);
  $('zoomValue').textContent = `${Math.round(photo.zoom * 100)}%`;
}

function addPhotos(files) {
  const readers = [...files].filter((f) => f.type.startsWith('image/')).map((file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve({ image, zoom: 1, panX: 0, panY: 0, name: file.name });
      image.onerror = () => resolve(null);
      image.src = String(reader.result);
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  }));
  Promise.all(readers).then((loaded) => {
    loaded.filter(Boolean).forEach((photo) => state.photos.push(photo));
    if (state.photos.length) renderPreview();
  });
}

async function loadSamples() {
  const editorState = await loadEditorShotState();
  state.photos = editorState.photos;
  Object.assign(state, {
    layout: editorState.layout,
    grade: editorState.grade,
    title: editorState.title,
    subtitle: editorState.subtitle,
    tagline: editorState.tagline,
    assignments: editorState.assignments,
  });
  syncInputs();
  renderPreview();
}

function syncInputs() {
  $('titleInput').value = state.title;
  $('subtitleInput').value = state.subtitle;
  $('taglineInput').value = state.tagline;
  document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
  document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b.dataset.size === state.size));
}

function bindControls() {
  $('fileInput').addEventListener('change', (e) => addPhotos(e.target.files));
  $('sampleButton').addEventListener('click', loadSamples);
  const drop = $('dropZone');
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('over');
    addPhotos(e.dataTransfer.files);
  });
  $('titleInput').addEventListener('input', (e) => { state.title = e.target.value; renderPreview(); });
  $('subtitleInput').addEventListener('input', (e) => { state.subtitle = e.target.value; renderPreview(); });
  $('taglineInput').addEventListener('input', (e) => { state.tagline = e.target.value; renderPreview(); });
  document.querySelectorAll('[data-layout]').forEach((b) => b.addEventListener('click', () => {
    state.layout = b.dataset.layout;
    state.selectedPanel = 0;
    syncInputs();
    renderPreview();
  }));
  document.querySelectorAll('[data-grade]').forEach((b) => b.addEventListener('click', () => {
    state.grade = b.dataset.grade;
    syncInputs();
    renderPreview();
  }));
  document.querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => {
    state.size = b.dataset.size;
    syncInputs();
    renderPreview();
  }));
  $('zoom').addEventListener('input', (e) => {
    const photo = photoForPanel(state.selectedPanel);
    if (photo) { photo.zoom = Number(e.target.value); renderPreview(); }
  });
  $('panX').addEventListener('input', (e) => {
    const photo = photoForPanel(state.selectedPanel);
    if (photo) { photo.panX = Number(e.target.value); renderPreview(); }
  });
  $('panY').addEventListener('input', (e) => {
    const photo = photoForPanel(state.selectedPanel);
    if (photo) { photo.panY = Number(e.target.value); renderPreview(); }
  });
  preview.addEventListener('click', (e) => {
    const rect = preview.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (preview.width / rect.width);
    const y = (e.clientY - rect.top) * (preview.height / rect.height);
    const rects = panelRects(state.layout, preview.width, preview.height);
    const hit = rects.findIndex((r) => x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height);
    if (hit >= 0) { state.selectedPanel = hit; renderPreview(); }
  });
  $('exportButton').addEventListener('click', exportCover);
}

function exportCover() {
  const size = EXPORT_SIZES[state.size];
  const offscreen = document.createElement('canvas');
  offscreen.width = size.width;
  offscreen.height = size.height;
  drawCover(offscreen.getContext('2d'), state, size.width, size.height);
  offscreen.toBlob((blob) => {
    if (!blob) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `vice-cover-${state.size}-${size.width}x${size.height}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 5000);
  }, 'image/png');
}

function buildOptionButtons() {
  const layoutBox = $('layoutButtons');
  Object.entries(LAYOUTS).forEach(([key, layout]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.layout = key;
    button.textContent = layout.label;
    layoutBox.appendChild(button);
  });
  const gradeBox = $('gradeButtons');
  Object.entries(GRADES).forEach(([key, grade]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.grade = key;
    button.textContent = grade.label;
    gradeBox.appendChild(button);
  });
  const sizeBox = $('sizeButtons');
  Object.entries(EXPORT_SIZES).forEach(([key, size]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.size = key;
    button.textContent = size.label;
    sizeBox.appendChild(button);
  });
}

async function start() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  preview = $('preview');
  shotCanvas = $('shotCanvas');
  if (shot && shot.startsWith('cover')) {
    // Draw the preset cover into the same live preview the editor uses, then
    // CSS hides the controls and stretches the preview full-window.
    document.body.classList.add('shot-mode');
    const preset = SHOT_PRESETS[shot] || SHOT_PRESETS.coverWide;
    const editorState = await loadEditorShotState();
    state.photos = editorState.photos;
    state.layout = preset.layout;
    state.grade = preset.grade;
    state.size = preset.size;
    state.title = preset.title;
    state.subtitle = preset.subtitle;
    state.tagline = preset.tagline;
    state.assignments = {};
    renderPreview();
    document.title = 'Vice Cover Studio — exported cover';
    return;
  }
  buildOptionButtons();
  bindControls();
  syncInputs();
  await document.fonts.load('64px Anton');
  await document.fonts.load('32px Pacifico');
  if (shot === 'editor') {
    await loadSamples();
  } else {
    renderPreview();
  }
  document.fonts.ready.then(renderPreview);
}

start();
