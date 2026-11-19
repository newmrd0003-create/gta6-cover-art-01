// ?shot= support: renders the app hands-free for screenshots.
//   ?shot=cover&photo=pier&caption=Sunset%20Heist&size=1920x1080
//     shows the PNG the app itself exported, fullscreen.
//   ?shot=editor&photo=boulevard&caption=Boulevard%20Queen
//     shows the editor with that photo loaded in the panels.
// The cover shot displays the exported PNG blob as an image, so the
// screenshot shows exactly what the app writes, scaled to the window.

import { coverToBlob } from './cover.js';

export function shotParams() {
  return new URLSearchParams(window.location.search);
}

export function isShotMode() {
  return shotParams().has('shot');
}

function parseSize(raw) {
  const match = /^(\d{3,4})x(\d{3,4})$/.exec(raw || '');
  if (!match) return null;
  const w = Number(match[1]);
  const h = Number(match[2]);
  if (w < 100 || h < 100 || w > 4000 || h > 4000) return null;
  return { w, h };
}

// Loads a named sample photo into every panel with a different crop,
// so one photo still fills the multi-panel poster.
export function sampleIntoAllPanels(state, img) {
  const crops = [
    { panX: 0.5, panY: 0.35, zoom: 1 },
    { panX: 0.5, panY: 0, zoom: 1.35 },
    { panX: 0.5, panY: 0.62, zoom: 1.35 },
  ];
  state.panels.forEach((panel, i) => {
    panel.img = img;
    panel.panX = crops[i].panX;
    panel.panY = crops[i].panY;
    panel.zoom = crops[i].zoom;
  });
}

function loadSampleImage(name) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`sample photo not found: ${name}`));
    img.src = `samples/${name}.jpg`;
  });
}

// Applies the ?shot= query to the editor state. Returns true when a shot
// mode was entered. `redraw` repaints the editor preview afterwards.
export async function runShotMode(state, redraw) {
  const params = shotParams();
  const shot = params.get('shot');
  if (!shot) return false;

  const photo = params.get('photo');
  const caption = params.get('caption');
  if (caption) state.title = caption;
  const size = parseSize(params.get('size'));
  if (size) state.size = size;
  if (photo) {
    try {
      const img = await loadSampleImage(photo);
      sampleIntoAllPanels(state, img);
    } catch (err) {
      console.warn(err.message);
    }
  }

  if (shot === 'cover') {
    document.querySelector('.topbar').hidden = true;
    document.getElementById('editor').hidden = true;
    const stage = document.getElementById('shotStage');
    const img = document.getElementById('shotImg');
    const blob = await coverToBlob(state);
    img.src = URL.createObjectURL(blob);
    await new Promise((resolve) => { img.onload = resolve; });
    stage.hidden = false;
    document.title = 'shot-ready';
    return true;
  }

  if (shot === 'editor') {
    redraw();
    document.title = 'shot-ready';
    return true;
  }

  return false;
}
