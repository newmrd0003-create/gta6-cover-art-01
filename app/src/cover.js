// Neon Coast cover engine: draws a GTA-style multi-panel poster cover onto any 2D canvas.
// Pure rendering — no DOM, no network. The editor (main.js) owns state; this file only paints.
// Fonts are vendored under app/fonts (Anton + Pacifico, SIL OFL); no Rockstar logo, art or font.

export const LAYOUTS = {
  hero: {
    label: 'Hero Grid',
    panels: [
      { x: 0.02, y: 0.02, w: 0.96, h: 0.58, photo: 0 },
      { x: 0.02, y: 0.62, w: 0.3133, h: 0.36, photo: 1 },
      { x: 0.3433, y: 0.62, w: 0.3133, h: 0.36, photo: 2 },
      { x: 0.6667, y: 0.62, w: 0.3133, h: 0.36, photo: 3 },
    ],
    title: { x: 0.05, y: 0.40, w: 0.90, h: 0.18, align: 'left' },
    badge: { x: 0.05, y: 0.055, w: 0.34, h: 0.05 },
  },
  nine: {
    label: 'Nine Panel',
    panels: [
      { x: 0.02, y: 0.02, w: 0.3067, h: 0.28, photo: 0 },
      { x: 0.3467, y: 0.02, w: 0.3067, h: 0.28, photo: 1 },
      { x: 0.6733, y: 0.02, w: 0.3067, h: 0.28, photo: 2 },
      { x: 0.02, y: 0.32, w: 0.3067, h: 0.28, photo: 3 },
      { x: 0.6733, y: 0.32, w: 0.3067, h: 0.28, photo: 0 },
      { x: 0.02, y: 0.62, w: 0.3067, h: 0.28, photo: 1 },
      { x: 0.3467, y: 0.62, w: 0.3067, h: 0.28, photo: 2 },
      { x: 0.6733, y: 0.62, w: 0.3067, h: 0.28, photo: 3 },
    ],
    titleBlock: { x: 0.3467, y: 0.32, w: 0.3067, h: 0.28 },
    title: { x: 0.37, y: 0.36, w: 0.26, h: 0.20, align: 'center' },
    badge: { x: 0.37, y: 0.335, w: 0.26, h: 0.035 },
  },
  bleed: {
    label: 'Full Bleed',
    panels: [{ x: 0, y: 0, w: 1, h: 1, photo: 0 }],
    title: { x: 0.05, y: 0.68, w: 0.90, h: 0.22, align: 'left' },
    badge: { x: 0.05, y: 0.05, w: 0.34, h: 0.05 },
    scrim: true,
  },
  tilt: {
    label: 'Tilted Snaps',
    panels: [
      { x: 0.06, y: 0.20, w: 0.42, h: 0.50, photo: 0, rot: -0.07, frame: true },
      { x: 0.50, y: 0.14, w: 0.42, h: 0.50, photo: 1, rot: 0.05, frame: true },
      { x: 0.28, y: 0.50, w: 0.44, h: 0.38, photo: 2, rot: -0.02, frame: true },
    ],
    title: { x: 0.05, y: 0.015, w: 0.90, h: 0.085, align: 'center' },
    badge: { x: 0.36, y: 0.875, w: 0.28, h: 0.05 },
    backdrop: true,
  },
  duo: {
    label: 'Duo Split',
    panels: [
      { x: 0.02, y: 0.02, w: 0.47, h: 0.96, photo: 0 },
      { x: 0.51, y: 0.02, w: 0.47, h: 0.96, photo: 1 },
    ],
    title: { x: 0.05, y: 0.40, w: 0.90, h: 0.18, align: 'center' },
    badge: { x: 0.36, y: 0.05, w: 0.28, h: 0.05 },
    titleBand: true,
  },
  strip: {
    label: 'Story Strip',
    panels: [
      { x: 0.03, y: 0.03, w: 0.94, h: 0.27, photo: 0 },
      { x: 0.03, y: 0.315, w: 0.94, h: 0.27, photo: 1 },
      { x: 0.03, y: 0.60, w: 0.94, h: 0.20, photo: 2 },
    ],
    title: { x: 0.05, y: 0.815, w: 0.90, h: 0.15, align: 'left' },
    badge: { x: 0.05, y: 0.045, w: 0.30, h: 0.04 },
  },
};

export const GRADES = {
  sunset: {
    label: 'Vice Sunset', top: '#ffb347', mid: '#ff5e62', bottom: '#c81d6e',
    filter: 'saturate(1.32) contrast(1.06) brightness(1.02)', wash: 'rgba(255,94,98,0.10)',
  },
  neon: {
    label: 'Neon Night', top: '#00e5ff', mid: '#7b2fff', bottom: '#ff2fb3',
    filter: 'saturate(1.45) contrast(1.10) brightness(0.98)', wash: 'rgba(123,47,255,0.12)',
  },
  gold: {
    label: 'Palm Gold', top: '#ffe27a', mid: '#ff9a3d', bottom: '#e2600a',
    filter: 'saturate(1.25) contrast(1.05) brightness(1.04)', wash: 'rgba(255,154,61,0.10)',
  },
  pink: {
    label: 'Hot Pink', top: '#ff8ac2', mid: '#ff2d78', bottom: '#5b2ee5',
    filter: 'saturate(1.40) contrast(1.08)', wash: 'rgba(255,45,120,0.12)',
  },
  teal: {
    label: 'Teal Noir', top: '#7df9e2', mid: '#12b5a5', bottom: '#0b2a6b',
    filter: 'saturate(1.30) contrast(1.12) brightness(0.96)', wash: 'rgba(18,181,165,0.10)',
  },
};

export const SIZES = [
  { id: 'square', label: '1080 x 1080', w: 1080, h: 1080 },
  { id: 'portrait', label: '1080 x 1350', w: 1080, h: 1350 },
  { id: 'wide', label: '1920 x 1080', w: 1920, h: 1080 },
];

/** A blank photo slot: cover-fit with pan (dx, dy in panel fractions) and zoom. */
export function blankPhoto() {
  return { img: null, name: '', zoom: 1, dx: 0, dy: 0 };
}

/** The editor's default state: four slots, hero layout, Vice Sunset grade. */
export function defaultState() {
  return {
    layout: 'hero',
    grade: 'sunset',
    title: 'VICE CITY',
    subtitle: 'sunset heist',
    badge: 'VICE CITY • 2026',
    heat: 4,
    grain: true,
    vignette: true,
    frame: 'white',
    photos: [blankPhoto(), blankPhoto(), blankPhoto(), blankPhoto()],
  };
}

let noiseCanvas = null;
/** A small tiled film-grain pattern, built once and reused for every cover. */
function grainPattern(ctx) {
  if (noiseCanvas) return noiseCanvas;
  noiseCanvas = document.createElement('canvas');
  noiseCanvas.width = 256;
  noiseCanvas.height = 256;
  const nctx = noiseCanvas.getContext('2d');
  const data = nctx.createImageData(256, 256);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 110 + Math.floor(Math.random() * 90);
    data.data[i] = v; data.data[i + 1] = v; data.data[i + 2] = v; data.data[i + 3] = 255;
  }
  nctx.putImageData(data, 0, 0);
  return noiseCanvas;
}

/** Draws one photo cover-fit inside rect, with the slot's zoom and pan, then the grade wash. */
function drawPanelPhoto(ctx, rect, slot, grade) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (slot && slot.img) {
    const img = slot.img;
    const base = Math.max(w / img.naturalWidth, h / img.naturalHeight) * (slot.zoom || 1);
    const pw = img.naturalWidth * base;
    const ph = img.naturalHeight * base;
    const px = x + (w - pw) / 2 + (slot.dx || 0) * w;
    const py = y + (h - ph) / 2 + (slot.dy || 0) * h;
    ctx.filter = grade.filter;
    ctx.drawImage(img, px, py, pw, ph);
    ctx.filter = 'none';
  } else {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, '#3a1c5e');
    g.addColorStop(1, '#12081f');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `600 ${Math.max(14, h * 0.07)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+ ADD PHOTO', x + w / 2, y + h / 2);
    ctx.textBaseline = 'alphabetic';
  }
  const wash = ctx.createLinearGradient(x, y, x, y + h);
  wash.addColorStop(0, grade.top + '00');
  wash.addColorStop(0.55, grade.mid + '22');
  wash.addColorStop(1, grade.bottom + '55');
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = grade.wash;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/** Fits the title on one or two lines inside rect, sunset-gradient fill, dark outline, neon glow. */
function drawTitle(ctx, rect, title, subtitle, W) {
  const { x, y, w, h } = rect;
  const words = (title || 'UNTITLED').trim().toUpperCase();
  const lines = fitTitleLines(ctx, words, w, h * 0.62);
  const lineH = h * 0.62 / lines.length;
  ctx.save();
  ctx.textAlign = rect.align === 'center' ? 'center' : 'left';
  ctx.textBaseline = 'middle';
  const tx = rect.align === 'center' ? x + w / 2 : x;
  lines.forEach((line, i) => {
    const cy = y + h * 0.30 + i * lineH;
    const size = line.size;
    ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
    const grad = ctx.createLinearGradient(x, cy - size * 0.5, x + w, cy + size * 0.5);
    grad.addColorStop(0, '#fff7ae');
    grad.addColorStop(0.45, '#ffb347');
    grad.addColorStop(0.75, '#ff5e62');
    grad.addColorStop(1, '#ff2fb3');
    ctx.lineWidth = Math.max(2, size * 0.07);
    ctx.strokeStyle = '#160a2e';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(255,47,179,0.75)';
    ctx.shadowBlur = size * 0.18;
    ctx.strokeText(line.text, tx, cy);
    ctx.fillStyle = grad;
    ctx.fillText(line.text, tx, cy);
    ctx.shadowBlur = 0;
  });
  if (subtitle && subtitle.trim()) {
    const sub = subtitle.trim();
    let size = Math.min(h * 0.26, W * 0.045);
    ctx.font = `${size}px Pacifico, cursive`;
    while (ctx.measureText(sub).width > w * 0.96 && size > 10) {
      size -= 2;
      ctx.font = `${size}px Pacifico, cursive`;
    }
    ctx.fillStyle = '#aef7ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = size * 0.55;
    ctx.fillText(sub, tx, y + h * 0.82);
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

/** Splits the title into 1-2 lines that fit the rect, returning [{text, size}]. */
function fitTitleLines(ctx, words, w, maxH) {
  let size = maxH;
  ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
  const parts = words.split(/\s+/);
  if (ctx.measureText(words).width <= w) return [{ text: words, size }];
  let best = null;
  for (let split = 1; split < parts.length; split++) {
    const a = parts.slice(0, split).join(' ');
    const b = parts.slice(split).join(' ');
    const s = Math.min(maxH / 2, size);
    ctx.font = `${s}px Anton, 'Arial Black', sans-serif`;
    if (ctx.measureText(a).width <= w && ctx.measureText(b).width <= w) {
      best = [{ text: a, size: s }, { text: b, size: s }];
      break;
    }
  }
  if (best) return best;
  while (size > 12) {
    size -= 2;
    ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
    if (ctx.measureText(words).width <= w) return [{ text: words, size }];
  }
  return [{ text: words, size: 12 }];
}

/** A small ribbon badge with the badge text. */
function drawBadge(ctx, rect, text, W) {
  if (!text || !text.trim()) return;
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.fillStyle = '#160a2e';
  roundRect(ctx, x, y, w, h, h * 0.5);
  ctx.fill();
  ctx.strokeStyle = '#ff2fb3';
  ctx.lineWidth = Math.max(1.5, h * 0.08);
  roundRect(ctx, x, y, w, h, h * 0.5);
  ctx.stroke();
  let size = h * 0.52;
  ctx.font = `700 ${size}px system-ui, sans-serif`;
  while (ctx.measureText(text.trim()).width > w * 0.9 && size > 8) {
    size -= 1;
    ctx.font = `700 ${size}px system-ui, sans-serif`;
  }
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.trim().toUpperCase(), x + w / 2, y + h / 2 + size * 0.05);
  ctx.restore();
}

/** Five-star heat meter under the badge. */
function drawHeat(ctx, x, y, size, heat) {
  ctx.save();
  ctx.font = `${size}px system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i < heat ? '#ffd76a' : 'rgba(255,255,255,0.25)';
    ctx.shadowColor = i < heat ? '#ff9a3d' : 'transparent';
    ctx.shadowBlur = i < heat ? size * 0.4 : 0;
    ctx.fillText('★', x + i * size * 1.15, y);
  }
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** The full cover paint: backdrop, panels, title, badge, grain and vignette. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const layout = LAYOUTS[state.layout] || LAYOUTS.hero;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const scale = (fx, fy) => ({ x: fx * W, y: fy * H, w: 0, h: 0 });
  const R = (p) => ({ x: p.x * W, y: p.y * H, w: p.w * W, h: p.h * H });

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = state.frame === 'black' ? '#0d0716' : '#f5efe6';
  ctx.fillRect(0, 0, W, H);

  if (layout.backdrop) {
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, grade.top);
    bg.addColorStop(0.5, grade.mid);
    bg.addColorStop(1, grade.bottom);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(22,10,46,0.18)';
    ctx.fillRect(0, 0, W, H);
  }

  for (const panel of layout.panels) {
    const r = R(panel);
    if (panel.frame) {
      ctx.save();
      ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
      ctx.rotate(panel.rot || 0);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = W * 0.02;
      ctx.shadowOffsetY = W * 0.008;
      const pad = W * 0.012;
      ctx.fillRect(-r.w / 2 - pad, -r.h / 2 - pad, r.w + pad * 2, r.h + pad * 2 + W * 0.035);
      ctx.restore();
      ctx.save();
      ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
      ctx.rotate(panel.rot || 0);
      ctx.translate(-r.w / 2, -r.h / 2);
      drawPanelPhoto(ctx, { x: 0, y: 0, w: r.w, h: r.h }, state.photos[panel.photo], grade);
      ctx.restore();
    } else {
      drawPanelPhoto(ctx, r, state.photos[panel.photo], grade);
    }
  }

  if (layout.scrim) {
    const scrim = ctx.createLinearGradient(0, H * 0.45, 0, H);
    scrim.addColorStop(0, 'rgba(22,10,46,0)');
    scrim.addColorStop(1, 'rgba(22,10,46,0.82)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, 0, W, H);
  }

  if (layout.titleBlock) {
    const tb = R(layout.titleBlock);
    const bg = ctx.createLinearGradient(tb.x, tb.y, tb.x + tb.w, tb.y + tb.h);
    bg.addColorStop(0, grade.mid);
    bg.addColorStop(1, grade.bottom);
    ctx.fillStyle = bg;
    ctx.fillRect(tb.x, tb.y, tb.w, tb.h);
    ctx.fillStyle = 'rgba(22,10,46,0.25)';
    ctx.fillRect(tb.x, tb.y, tb.w, tb.h);
    const tr = R(layout.title);
    drawTitle(ctx, { ...tr, align: 'center' }, state.title, '', W);
    if (state.subtitle && state.subtitle.trim()) {
      ctx.save();
      ctx.font = `${Math.min(tb.h * 0.13, W * 0.03)}px Pacifico, cursive`;
      ctx.fillStyle = '#aef7ff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 8;
      ctx.fillText(state.subtitle.trim(), tb.x + tb.w / 2, tb.y + tb.h * 0.86);
      ctx.restore();
    }
    drawHeat(ctx, tb.x + tb.w * 0.28, tb.y + tb.h * 0.68, Math.min(tb.h * 0.09, W * 0.02), state.heat);
  } else if (layout.title) {
    const tr = R(layout.title);
    if (layout.titleBand) {
      ctx.fillStyle = 'rgba(22,10,46,0.72)';
      ctx.fillRect(0, tr.y - H * 0.02, W, tr.h + H * 0.04);
    }
    drawTitle(ctx, { ...tr, align: layout.title.align }, state.title, state.subtitle, W);
  }

  if (layout.badge) {
    const br = R(layout.badge);
    drawBadge(ctx, br, state.badge, W);
    if (!layout.titleBlock) {
      drawHeat(ctx, br.x, br.y + br.h * 1.6, Math.min(br.h * 0.62, W * 0.02), state.heat);
    }
  }

  if (state.grain) {
    const pattern = ctx.createPattern(grainPattern(ctx), 'repeat');
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (state.vignette) {
    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, 'rgba(10,0,20,0)');
    v.addColorStop(1, 'rgba(10,0,20,0.42)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }
  return canvas;
}

/** Renders the state at a post size and resolves with a PNG blob. */
export function exportCover(state, size) {
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas, state);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

/** Finds which layout panel (if any) holds the point, in canvas pixels. */
export function panelAt(state, px, py, W, H) {
  const layout = LAYOUTS[state.layout] || LAYOUTS.hero;
  for (let i = layout.panels.length - 1; i >= 0; i--) {
    const p = layout.panels[i];
    if (px >= p.x * W && px <= (p.x + p.w) * W && py >= p.y * H && py <= (p.y + p.h) * H) {
      return { panelIndex: i, photo: p.photo };
    }
  }
  return null;
}
