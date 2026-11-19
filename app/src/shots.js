// Vice Cover Studio — screenshot mode.
// Driven by the URL query only, so the dossier screenshots are reproducible:
//   ?shot=cover&photo=pier&layout=grid&size=square&theme=sunset
//     &title=VICE%20CITY%20NIGHTS&tagline=one%20last%20sunset%20heist
//   ?shot=editor&photo=boulevard&layout=poster&size=portrait
// cover: hides the editor chrome, the canvas fills the window.
// editor: the normal editor, with sample photos already loaded.

import { drawCover, ensureCoverFonts } from './cover.js';
import { boot, getState, getCanvas, refresh } from './main.js';

const params = new URLSearchParams(location.search);

function sampleImage(name) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`sample ${name} failed to load`));
    img.src = `./samples/${name}.jpg`;
  });
}

export async function runShot() {
  const mode = params.get('shot') || 'cover';
  const state = getState();
  if (params.get('layout')) state.layout = params.get('layout');
  if (params.get('size')) state.size = params.get('size');
  if (params.get('theme')) state.theme = params.get('theme');
  if (params.get('title')) state.title = params.get('title');
  if (params.get('tagline') !== null) state.tagline = params.get('tagline');
  if (params.get('grade')) state.grade = Number(params.get('grade'));

  await boot();

  const photo = params.get('photo');
  if (photo) {
    const img = await sampleImage(photo);
    state.photos[0] = { img, zoom: 1.05, ox: 0, oy: -0.03 };
    const second = params.get('photo2') || photo;
    const img2 = second === photo ? img : await sampleImage(second);
    state.photos[1] = { img: img2, zoom: 1.1, ox: 0, oy: 0 };
    state.photos[2] = { img, zoom: 1.15, ox: 0.05, oy: 0 };
  }

  await ensureCoverFonts();
  document.getElementById('title').value = state.title;
  document.getElementById('tagline').value = state.tagline;
  refresh();
  drawCover(getCanvas(), state);

  if (mode === 'cover') {
    document.body.classList.add('shot-cover');
    document.getElementById('status').textContent = 'Exported cover — Vice Cover Studio';
  } else {
    document.getElementById('status').textContent = 'Photo loaded — drag it to position, then export.';
  }
  window.__shotReady = true;
  return state;
}
