// Vice Cover Studio — cover renderer.
// Draws the multi-panel Vice City poster: photo panels, a colour grade, a
// vignette, grain, and the bold display title + script subtitle. One function,
// renderCover, paints any export size; the editor preview and the PNG export
// call the same code, so what you see is what you share.

export const LAYOUTS = {
  strip: 'Sunset Strip',
  grid: 'Four Corners',
  hero: 'Hero Banner',
};

export const GRADES = {
  sunset: 'Sunset',
  neon: 'Neon',
  noir: 'Noir',
  palm: 'Palm',
};

/** How many photo panels each layout holds. */
export function panelCount(layout) {
  return layout === 'grid' ? 4 : 3;
}

const GAP = 0.018;

/** Panel rectangles as fractions of the photo area (x, y, w, h). */
function panelRects(layout) {
  if (layout === 'grid') {
    const g = GAP;
    const half = (1 - g) / 2;
    return [
      [0, 0, half, half],
      [half + g, 0, half, half],
      [0, half + g, half, half],
      [half + g, half + g, half, half],
    ];
  }
  if (layout === 'hero') {
    const g = GAP;
    const half = (1 - g) / 2;
    return [
      [0, 0, 1, 0.6],
      [0, 0.6 + g, half, 1 - 0.6 - g],
      [half + g, 0.6 + g, half, 1 - 0.6 - g],
    ];
  }
  // strip: one tall hero panel left, two stacked panels right.
  const g = GAP;
  const heroW = 0.58;
  const halfH = (1 - g) / 2;
  return [
    [0, 0, heroW, 1],
    [heroW + g, 0, 1 - heroW - g, halfH],
    [heroW + g, halfH + g, 1 - heroW - g, halfH],
  ];
}

/** Paint one photo into a rectangle, cover-fit, with zoom and pan offsets. */
function drawPhoto(ctx, img, x, y, w, h, zoom, ox, oy) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(w / iw, h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = x + (w - dw) / 2 + ox * w * 0.4;
  const dy = y + (h - dh) / 2 + oy * h * 0.4;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

/** The grade wash: a tinted gradient blended over the whole cover. */
function gradeWash(ctx, grade, w, h) {
  const sky = ctx.createLinearGradient(0, 0, w * 0.4, h);
  if (grade === 'neon') {
    sky.addColorStop(0, 'rgba(46, 230, 214, 0.30)');
    sky.addColorStop(0.55, 'rgba(255, 46, 136, 0.28)');
    sky.addColorStop(1, 'rgba(90, 20, 160, 0.34)');
  } else if (grade === 'noir') {
    sky.addColorStop(0, 'rgba(10, 10, 18, 0.42)');
    sky.addColorStop(1, 'rgba(60, 60, 80, 0.22)');
  } else if (grade === 'palm') {
    sky.addColorStop(0, 'rgba(46, 160, 90, 0.26)');
    sky.addColorStop(0.6, 'rgba(255, 190, 60, 0.24)');
    sky.addColorStop(1, 'rgba(20, 90, 70, 0.30)');
  } else {
    // sunset
    sky.addColorStop(0, 'rgba(255, 122, 24, 0.30)');
    sky.addColorStop(0.55, 'rgba(255, 46, 136, 0.22)');
    sky.addColorStop(1, 'rgba(40, 10, 80, 0.30)');
  }
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** Darkened corners, strength 0..1. */
function vignette(ctx, strength, w, h) {
  if (strength <= 0) return;
  const r = Math.hypot(w, h) / 2;
  const g = ctx.createRadialGradient(w / 2, h / 2, r * 0.35, w / 2, h / 2, r);
  g.addColorStop(0, 'rgba(0, 0, 0, 0)');
  g.addColorStop(1, `rgba(0, 0, 0, ${0.55 * strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** Deterministic film grain: a seeded scatter of faint light/dark specks. */
function grain(ctx, amount, w, h) {
  if (amount <= 0) return;
  const n = Math.floor(w * h * 0.00012 * amount);
  let seed = 20261120;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  ctx.save();
  for (let i = 0; i < n; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const light = rnd() > 0.5;
    ctx.fillStyle = light ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.12)';
    ctx.fillRect(x, y, 1.6, 1.6);
  }
  ctx.restore();
}

/** The caption band: sunset ribbon, display title, script subtitle. */
function caption(ctx, state, w, h, photoTop, photoH) {
  const bandY = photoTop + photoH;
  const bandH = h - bandY;
  const cx = w / 2;
  const titleSize = Math.min(bandH * 0.52, w * 0.085);
  const subSize = Math.min(bandH * 0.26, w * 0.032);

  if (state.ribbon) {
    ctx.save();
    ctx.translate(cx, bandY + bandH * 0.52);
    ctx.rotate(-0.03);
    const rb = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    rb.addColorStop(0, '#ff2e88');
    rb.addColorStop(0.5, '#ff7a18');
    rb.addColorStop(1, '#ffd23f');
    ctx.fillStyle = rb;
    ctx.fillRect(-w * 0.48, -titleSize * 0.62, w * 0.96, titleSize * 1.24);
    ctx.restore();
  }

  const title = (state.title || 'VICE CITY').toUpperCase();
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${titleSize}px "Bebas Neue", sans-serif`;
  try { ctx.letterSpacing = `${titleSize * 0.06}px`; } catch { /* older canvas */ }
  const ty = bandY + bandH * 0.5;
  if (state.outline) {
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#160a24';
    ctx.lineWidth = Math.max(2, titleSize * 0.09);
    ctx.strokeText(title, cx, ty);
  }
  ctx.fillStyle = state.titleColor || '#ffd23f';
  ctx.fillText(title, cx, ty);
  ctx.restore();

  const sub = (state.subtitle || '').trim();
  if (sub) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${subSize}px "Lobster", cursive`;
    ctx.shadowColor = 'rgba(0,0,0,0.65)';
    ctx.shadowBlur = subSize * 0.35;
    ctx.shadowOffsetY = subSize * 0.08;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(sub, cx, bandY + bandH * 0.86);
    ctx.restore();
  }
}

/**
 * Paint the whole cover onto `canvas` at its own pixel size.
 * `state`: { layout, grade, vignette, grain, title, subtitle, titleColor,
 *   outline, ribbon, photos: HTMLImageElement[], panels: [{photo, zoom, ox, oy}] }
 * Photos are drawn only where the state has one; empty panels get a gradient.
 */
export function renderCover(canvas, state, width, height) {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const w = width;
  const h = height;

  ctx.fillStyle = '#12081f';
  ctx.fillRect(0, 0, w, h);

  const photoH = Math.floor(h * 0.8);
  const rects = panelRects(state.layout);
  const n = panelCount(state.layout);
  for (let i = 0; i < n; i++) {
    const [fx, fy, fw, fh] = rects[i];
    const x = fx * w;
    const y = fy * photoH;
    const pw = fw * w;
    const ph = fh * photoH;
    const panel = state.panels[i] || { photo: 0, zoom: 1.2, ox: 0, oy: 0 };
    const img = state.photos[panel.photo];
    if (img && img.complete && (img.naturalWidth || img.width)) {
      drawPhoto(ctx, img, x, y, pw, ph, panel.zoom, panel.ox, panel.oy);
    } else {
      const g = ctx.createLinearGradient(x, y, x + pw, y + ph);
      g.addColorStop(0, '#3d1a5e');
      g.addColorStop(1, '#12081f');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, pw, ph);
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = Math.max(2, w * 0.002);
    ctx.strokeRect(x, y, pw, ph);
  }

  gradeWash(ctx, state.grade, w, photoH);
  vignette(ctx, state.vignette, w, h);
  grain(ctx, state.grain, w, h);
  caption(ctx, state, w, h, 0, photoH);
  return canvas;
}

/** Render to a fresh canvas and return a PNG blob for download. */
export function exportPng(state, width, height) {
  const canvas = document.createElement('canvas');
  renderCover(canvas, state, width, height);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
