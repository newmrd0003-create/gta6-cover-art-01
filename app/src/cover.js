// Vice City Sunset — cover renderer. Draws a multi-panel GTA-style poster
// cover on a 2D canvas from photos, a layout, a colour grade and a caption.
// Everything here is drawn with code: the sunset sky, the sun, the skyline
// and the palm silhouettes are original vector art, no game artwork.

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: 'Square' },
  '1080x1350': { w: 1080, h: 1350, label: 'Portrait' },
  '1920x1080': { w: 1920, h: 1080, label: 'Landscape' },
};

export const GRADES = {
  sunset: {
    sky: ['#2b1055', '#7b1e6e', '#c62b6d', '#ff5e3a', '#ffb347'],
    overlay: ['rgba(255, 122, 26, 0.30)', 'rgba(255, 46, 136, 0.28)'],
    filter: 'saturate(1.35) contrast(1.08) brightness(1.02)',
    title: ['#ffe259', '#ffa751'],
    accent: '#ff2e88',
  },
  neon: {
    sky: ['#0d0221', '#3b0a6e', '#a4138e', '#ff2ea6', '#19e3d6'],
    overlay: ['rgba(255, 46, 166, 0.34)', 'rgba(25, 227, 214, 0.22)'],
    filter: 'saturate(1.7) contrast(1.15) hue-rotate(-12deg)',
    title: ['#7df9ff', '#ff2ea6'],
    accent: '#19e3d6',
  },
  gold: {
    sky: ['#1c0f00', '#5c2e00', '#a85b12', '#e8963c', '#ffd97a'],
    overlay: ['rgba(255, 190, 60, 0.30)', 'rgba(180, 90, 10, 0.20)'],
    filter: 'sepia(0.45) saturate(1.5) contrast(1.05)',
    title: ['#fff3b0', '#ffb347'],
    accent: '#ffc857',
  },
  noir: {
    sky: ['#050505', '#1a1a22', '#3a3a48', '#6e6e80', '#b9b9c9'],
    overlay: ['rgba(255, 46, 136, 0.16)', 'rgba(0, 0, 0, 0.22)'],
    filter: 'grayscale(1) contrast(1.25) brightness(1.05)',
    title: ['#ffffff', '#c9c9d6'],
    accent: '#ff2e88',
  },
};

// Panel slots per layout, as fractions of the cover size. rot is degrees.
export const LAYOUTS = {
  hero: {
    panels: [
      { x: 0.035, y: 0.035, w: 0.585, h: 0.66, rot: -1.2 },
      { x: 0.645, y: 0.035, w: 0.32, h: 0.205, rot: 1.4 },
      { x: 0.645, y: 0.26, w: 0.32, h: 0.205, rot: -1.0 },
      { x: 0.645, y: 0.485, w: 0.32, h: 0.21, rot: 1.8 },
    ],
    title: { x: 0.035, y: 0.715, w: 0.93, h: 0.25 },
  },
  grid: {
    panels: [
      { x: 0.035, y: 0.03, w: 0.455, h: 0.315, rot: -0.8 },
      { x: 0.51, y: 0.03, w: 0.455, h: 0.315, rot: 0.9 },
      { x: 0.035, y: 0.365, w: 0.455, h: 0.315, rot: 0.7 },
      { x: 0.51, y: 0.365, w: 0.455, h: 0.315, rot: -1.1 },
    ],
    title: { x: 0.035, y: 0.70, w: 0.93, h: 0.265 },
  },
  bleed: {
    panels: [{ x: 0.0, y: 0.0, w: 1.0, h: 0.78, rot: 0 }],
    title: { x: 0.05, y: 0.72, w: 0.9, h: 0.245 },
  },
  tilt: {
    panels: [
      { x: 0.05, y: 0.06, w: 0.52, h: 0.5, rot: -4 },
      { x: 0.44, y: 0.16, w: 0.5, h: 0.46, rot: 3.5 },
      { x: 0.24, y: 0.42, w: 0.46, h: 0.34, rot: -1.5 },
    ],
    title: { x: 0.05, y: 0.76, w: 0.9, h: 0.205 },
  },
};

export function defaultState() {
  return {
    layout: 'hero',
    grade: 'sunset',
    size: '1080x1080',
    title: 'Sunset Heist',
    subtitle: 'neon nights & palm trees',
    kicker: 'EST. 2026 · PALM BOULEVARD',
    grain: true,
    halftone: true,
    photos: [],
    panels: [
      { photo: 0, zoom: 1.12, ox: 0, oy: 0 },
      { photo: 1, zoom: 1.12, ox: 0, oy: 0 },
      { photo: 0, zoom: 1.12, ox: 0, oy: 0 },
      { photo: 1, zoom: 1.12, ox: 0, oy: 0 },
    ],
    selected: 0,
  };
}

// Deterministic pseudo-random so the grain looks the same every render.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(14, -70, 34, -128);
  ctx.stroke();
  for (let i = 0; i < 7; i++) {
    const a = (-160 + i * 32) * (Math.PI / 180);
    const len = 62 - Math.abs(i - 3) * 7;
    const tx = 34 + Math.cos(a) * len;
    const ty = -128 + Math.sin(a) * len * 0.55;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(34, -128);
    ctx.quadraticCurveTo(34 + Math.cos(a) * len * 0.6, -128 + Math.sin(a) * len * 0.3 - 14, tx, ty);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSkyline(ctx, w, h, horizonY, color) {
  ctx.fillStyle = color;
  const rand = mulberry32(20261119);
  let x = -10;
  while (x < w + 20) {
    const bw = 26 + rand() * 70;
    const bh = 30 + rand() * 110;
    ctx.fillRect(x, horizonY - bh, bw, bh);
    ctx.fillStyle = 'rgba(255, 200, 120, 0.75)';
    for (let wy = horizonY - bh + 8; wy < horizonY - 8; wy += 14) {
      for (let wx = x + 6; wx < x + bw - 6; wx += 12) {
        if (rand() > 0.72) ctx.fillRect(wx, wy, 4, 5);
      }
    }
    ctx.fillStyle = color;
    x += bw + 4 + rand() * 22;
  }
}

function drawSunsetBackdrop(ctx, w, h, grade) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  grade.sky.forEach((c, i) => sky.addColorStop(i / (grade.sky.length - 1), c));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Retro striped sun.
  const sunR = Math.min(w, h) * 0.21;
  const sunX = w * 0.72;
  const sunY = h * 0.42;
  const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.1);
  glow.addColorStop(0, 'rgba(255, 190, 90, 0.55)');
  glow.addColorStop(1, 'rgba(255, 190, 90, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - sunR * 2.1, sunY - sunR * 2.1, sunR * 4.2, sunR * 4.2);
  ctx.save();
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.clip();
  const sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
  sunGrad.addColorStop(0, '#ffe259');
  sunGrad.addColorStop(0.55, '#ff9a3d');
  sunGrad.addColorStop(1, '#ff2e88');
  ctx.fillStyle = sunGrad;
  ctx.fillRect(sunX - sunR, sunY - sunR, sunR * 2, sunR * 2);
  ctx.fillStyle = grade.sky[0];
  for (let i = 0; i < 5; i++) {
    const y = sunY + sunR * 0.08 + i * sunR * 0.17;
    ctx.fillRect(sunX - sunR, y, sunR * 2, 3 + i * 2.4);
  }
  ctx.restore();

  // Skyline + palms along the bottom, behind the panels.
  const horizonY = h * 0.74;
  drawSkyline(ctx, w, h, horizonY, 'rgba(20, 6, 34, 0.92)');
  drawPalm(ctx, w * 0.06, h * 0.78, Math.min(w, h) / 900, 'rgba(16, 4, 28, 0.95)');
  drawPalm(ctx, w * 0.94, h * 0.80, Math.min(w, h) / 1100, 'rgba(16, 4, 28, 0.95)');
}

function drawPhotoInto(ctx, img, rx, ry, rw, rh, panel, grade) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(rw / iw, rh / ih) * panel.zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = rx + (rw - dw) / 2 + panel.ox * rw;
  // When a tall photo is cropped into a wide slot, shift the photo down so
  // the visible window covers the top of the photo, where faces usually are
  // (dy closer to zero shows earlier photo rows).
  let dy = ry + (rh - dh) / 2 + panel.oy * rh;
  if (dh > rh) dy += (dh - rh) * 0.42;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rx, ry, rw, rh);
  ctx.clip();
  ctx.filter = grade.filter;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.filter = 'none';
  const tint = ctx.createLinearGradient(rx, ry, rx + rw, ry + rh);
  tint.addColorStop(0, grade.overlay[0]);
  tint.addColorStop(1, grade.overlay[1]);
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = tint;
  ctx.fillRect(rx, ry, rw, rh);
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

function drawPhotoPanel(ctx, img, slot, panel, grade, frame) {
  const { x, y, w, h, rot } = slot;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.translate(-w / 2, -h / 2);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = w * 0.03;
  ctx.shadowOffsetY = w * 0.012;
  ctx.fillStyle = '#fff8ef';
  ctx.fillRect(-frame, -frame, w + frame * 2, h + frame * 2);
  ctx.shadowColor = 'transparent';
  if (img) {
    drawPhotoInto(ctx, img, 0, 0, w, h, panel, grade);
  } else {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#3a1550');
    g.addColorStop(1, '#ff2e88');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `700 ${Math.round(h * 0.09)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD A PHOTO', w / 2, h / 2);
  }
  // Inner hairline + corner accent.
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = Math.max(1, w * 0.002);
  ctx.strokeRect(0, 0, w, h);
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startPx, family, weight) {
  let px = startPx;
  ctx.font = `${weight} ${px}px ${family}`;
  while (px > 24 && ctx.measureText(text).width > maxWidth) {
    px -= 4;
    ctx.font = `${weight} ${px}px ${family}`;
  }
  return px;
}

function drawTitleBlock(ctx, w, h, band, state, grade) {
  const { x, y, w: bw, h: bh } = band;
  ctx.save();
  // Soft dark scrim so the lettering always reads.
  const scrim = ctx.createLinearGradient(0, y - bh * 0.25, 0, y + bh);
  scrim.addColorStop(0, 'rgba(10, 3, 20, 0)');
  scrim.addColorStop(0.45, 'rgba(10, 3, 20, 0.62)');
  scrim.addColorStop(1, 'rgba(10, 3, 20, 0.82)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, y - bh * 0.25, w, bh * 1.25);

  const cx = x + bw / 2;
  const titleFamily = '"Arial Black", "Archivo Black", "Helvetica Neue", sans-serif';
  const titlePx = fitFont(ctx, state.title.toUpperCase(), bw * 0.98, Math.round(bh * 0.42), titleFamily, 900);
  const titleY = y + bh * 0.52;

  ctx.save();
  ctx.translate(cx, titleY);
  ctx.rotate((-1.6 * Math.PI) / 180);
  ctx.translate(-cx, -titleY);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  const fill = ctx.createLinearGradient(0, titleY - titlePx * 0.6, 0, titleY + titlePx * 0.6);
  fill.addColorStop(0, grade.title[0]);
  fill.addColorStop(1, grade.title[1]);
  ctx.font = `900 ${titlePx}px ${titleFamily}`;
  ctx.strokeStyle = 'rgba(12, 2, 24, 0.95)';
  ctx.lineWidth = Math.max(3, titlePx * 0.09);
  ctx.strokeText(state.title.toUpperCase(), cx, titleY);
  ctx.fillStyle = fill;
  ctx.fillText(state.title.toUpperCase(), cx, titleY);
  ctx.restore();

  // Halftone dots across the title band.
  if (state.halftone) {
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#ffffff';
    const step = Math.max(7, Math.round(w * 0.011));
    for (let dy = y + bh * 0.08; dy < y + bh * 0.95; dy += step) {
      for (let dx = x + ((dy / step) % 2) * step * 0.5; dx < x + bw; dx += step) {
        ctx.beginPath();
        ctx.arc(dx, dy, Math.max(1, step * 0.14), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // Neon script subtitle.
  const subFamily = '"Brush Script MT", "Segoe Script", "Comic Sans MS", cursive';
  const subPx = fitFont(ctx, state.subtitle, bw * 0.9, Math.round(bh * 0.17), subFamily, 400);
  ctx.font = `italic 400 ${subPx}px ${subFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = grade.accent;
  ctx.shadowColor = grade.accent;
  ctx.shadowBlur = Math.round(subPx * 0.55);
  ctx.fillText(state.subtitle, cx, y + bh * 0.78);
  ctx.shadowBlur = 0;

  // Kicker + star meter.
  const kickPx = Math.max(13, Math.round(bh * 0.085));
  ctx.font = `700 ${kickPx}px "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.textAlign = 'left';
  const kick = state.kicker.toUpperCase();
  ctx.fillText(kick, x, y + bh * 0.1);
  ctx.textAlign = 'right';
  ctx.fillStyle = grade.accent;
  ctx.fillText('★ ★ ★ ★ ★', x + bw, y + bh * 0.1);
  ctx.restore();
}

function drawGrain(ctx, w, h, seed) {
  const rand = mulberry32(seed);
  const count = Math.round((w * h) / 900);
  ctx.save();
  ctx.globalAlpha = 0.09;
  for (let i = 0; i < count; i++) {
    const v = rand() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(rand() * w, rand() * h, 1.6, 1.6);
  }
  ctx.restore();
  const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);
}

export function renderCover(canvas, state) {
  const size = SIZES[state.size] ?? SIZES['1080x1080'];
  const { w, h } = size;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const layout = LAYOUTS[state.layout] ?? LAYOUTS.hero;

  drawSunsetBackdrop(ctx, w, h, grade);

  const frame = Math.max(5, Math.round(w * 0.008));
  layout.panels.forEach((slot, i) => {
    const panel = state.panels[i] ?? { photo: 0, zoom: 1.12, ox: 0, oy: 0 };
    const img = state.photos[panel.photo] ?? null;
    const rect = { x: slot.x * w, y: slot.y * h, w: slot.w * w, h: slot.h * h, rot: slot.rot };
    drawPhotoPanel(ctx, img, rect, panel, grade, frame);
  });

  const band = {
    x: layout.title.x * w,
    y: layout.title.y * h,
    w: layout.title.w * w,
    h: layout.title.h * h,
  };
  drawTitleBlock(ctx, w, h, band, state, grade);

  if (state.grain) drawGrain(ctx, w, h, w * 31 + h * 7);
  return canvas;
}

// Renders the cover at full export size and returns a PNG blob.
export async function exportCoverPng(state) {
  const canvas = document.createElement('canvas');
  renderCover(canvas, state);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG export failed'))), 'image/png');
  });
}
