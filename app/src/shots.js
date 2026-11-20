// Vice Cover Studio — screenshot presets.
// The app reads ?shot=… from the URL so its maker can take honest screenshots
// of the real app: `cover` draws one exported cover full-window, `editor`
// opens the editor with the bundled sample photos loaded. Nothing here edits
// or composites an image; every shot is the app drawing itself.

import { drawCover } from './cover.js';

export const SHOT_PRESETS = {
  coverWide: {
    title: 'VICE CITY',
    subtitle: 'Welcome back to',
    tagline: 'Sunset over the boulevard • 2026',
    layout: 'duo',
    grade: 'sunset',
    size: 'wide',
  },
  coverPortrait: {
    title: 'NEON HEAT',
    subtitle: 'One night in',
    tagline: 'Vice City • After dark',
    layout: 'duo',
    grade: 'neon',
    size: 'portrait',
  },
  coverSquare: {
    title: 'VICE CITY',
    subtitle: 'Golden hour on the',
    tagline: 'Pier side • 1080 × 1080',
    layout: 'quad',
    grade: 'dusk',
    size: 'square',
  },
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function loadSamplePhotos() {
  const [boulevard, pier] = await Promise.all([
    loadImage('samples/boulevard.jpg'),
    loadImage('samples/pier.jpg'),
  ]);
  return [
    { image: boulevard, zoom: 1.15, panX: 0, panY: 0.9, name: 'boulevard.jpg' },
    { image: pier, zoom: 1.1, panX: 0, panY: 0.6, name: 'pier.jpg' },
  ];
}

// Draw a preset cover onto the given canvas at its own size, then scale that
// drawing to fill the window — the app's own drawing of the exported cover.
export async function renderShotCover(canvas, presetName) {
  const preset = SHOT_PRESETS[presetName] || SHOT_PRESETS.coverWide;
  await document.fonts.load('64px Anton');
  await document.fonts.load('32px Pacifico');
  const photos = await loadSamplePhotos();
  const offscreen = document.createElement('canvas');
  const sizes = { wide: [1920, 1080], portrait: [1080, 1350], square: [1080, 1080] };
  const [w, h] = sizes[preset.size];
  offscreen.width = w;
  offscreen.height = h;
  drawCover(offscreen.getContext('2d'), { ...preset, photos, assignments: {} }, w, h);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0b0618';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const scale = Math.max(canvas.width / w, canvas.height / h);
  const dw = w * scale;
  const dh = h * scale;
  ctx.drawImage(offscreen, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
  return preset;
}

// Build the editor state a screenshot of the editor needs: sample photos in,
// trio layout, sunset grade, captions filled.
export async function loadEditorShotState() {
  await document.fonts.load('64px Anton');
  await document.fonts.load('32px Pacifico');
  const photos = await loadSamplePhotos();
  return {
    photos,
    layout: 'trio',
    grade: 'sunset',
    size: 'wide',
    title: 'VICE CITY',
    subtitle: 'Welcome back to',
    tagline: 'Sunset over the boulevard • 2026',
    assignments: { 0: 0, 1: 1, 2: 0 },
    selectedPanel: 0,
  };
}
