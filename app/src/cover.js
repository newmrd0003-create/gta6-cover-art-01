// cover.js — Vice Cover Studio cover renderer (Round 6).
// Draws a GTA-poster-style multi-panel cover onto any 2D canvas context.
// Pure canvas, no network: photos are Image objects loaded from local files
// or from the user's own uploads. Every panel is drawn cover-fit with its
// own zoom / pan, then graded, banded and lettered.

export const SIZES = {
  square: { label: 'Square 1080 x 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
  wide: { label: 'Wide 1920 x 1080', w: 1920, h: 1080 },
};

export const LAYOUTS = {
  hero: { label: 'Hero Grid', panels: 4 },
  grid9: { label: 'Nine Panel', panels: 8 },
  bleed: { label: 'Full Bleed', panels: 1 },
  tilt: { label: 'Tilted Snaps', panels: 3 },
};

export const GRADES = {
  sunset: { label: 'Vice Sunset', wash: ['#ff9a3d', '#ff2e63'], tint: '#ff7a3d', mode: 'overlay' },
  neon: { label: 'Neon Night', wash: ['#ff2e9a', '#22e6ff'], tint: '#c44dff', mode: 'overlay' },
  vice: { label: 'Vice Pink', wash: ['#ff5fa2', '#7b2ff7'], tint: '#ff5fa2', mode: 'soft-light' },
  gold: { label: 'Golden Hour', wash: ['#ffd76a', '#ff8a3d'], tint: '#ffb347', mode: 'overlay' },
  noir: { label: 'Noir', wash: ['#3a3a55', '#0d0d1a'], tint: '#8888aa', mode: 'soft-light' },
};

// Panel rectangles for a layout, in cover coordinates. Each rect is
// {x, y, w, h, rot} with rot in radians (tilt layout only).
export function panelRects(layout, W, H) {
  const g = Math.round(Math.min(W, H) * 0.014); // gutter
  const pad = Math.round(Math.min(W, H) * 0.022);
  if (layout === 'hero') {
    const heroW = Math.round((W - pad * 2 - g) * 0.62);
    const sideW = W - pad * 2 - g - heroW;
    const sideH = Math.round((H - pad * 2 - g * 2) / 3);
    return [
      { x: pad, y: pad, w: heroW, h: H - pad * 2, rot: 0 },
      { x: pad + heroW + g, y: pad, w: sideW, h: sideH, rot: 0 },
      { x: pad + heroW + g, y: pad + sideH + g, w: sideW, h: sideH, rot: 0 },
      { x: pad + heroW + g, y: pad + (sideH + g) * 2, w: sideW, h: sideH, rot: 0 },
    ];
  }
  if (layout === 'grid9') {
    const cw = Math.round((W - pad * 2 - g * 2) / 3);
    const ch = Math.round((H - pad * 2 - g * 2) / 3);
    const rects = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (r === 1 && c === 1) continue; // centre cell is the title block
        rects.push({ x: pad + c * (cw + g), y: pad + r * (ch + g), w: cw, h: ch, rot: 0 });
      }
    }
    return rects;
  }
  if (layout === 'bleed') {
    return [{ x: 0, y: 0, w: W, h: H, rot: 0 }];
  }
  // tilt: three polaroid-style snapshots, rotated, overlapping the sky.
  const pw = Math.round(W * 0.42);
  const ph = Math.round(H * 0.46);
  return [
    { x: Math.round(W * 0.06), y: Math.round(H * 0.16), w: pw, h: ph, rot: -0.09 },
    { x: Math.round(W * 0.52), y: Math.round(H * 0.10), w: pw, h: ph, rot: 0.07 },
    { x: Math.round(W * 0.28), y: Math.round(H * 0.48), w: pw, h: ph, rot: -0.03 },
  ];
}

// Centre cell of the nine-panel grid, where the title block lives.
export function titleCellRect(W, H) {
  const g = Math.round(Math.min(W, H) * 0.014);
  const pad = Math.round(Math.min(W, H) * 0.022);
  const cw = Math.round((W - pad * 2 - g * 2) / 3);
  const ch = Math.round((H - pad * 2 - g * 2) / 3);
  return { x: pad + cw + g, y: pad + ch + g, w: cw, h: ch };
}

function drawPhotoCover(ctx, img, rect, zoom, ox, oy) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = rect.x + (rect.w - dw) / 2 + ox * rect.w * 0.4;
  const dy = rect.y + (rect.h - dh) / 2 + oy * rect.h * 0.4;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function gradeWash(ctx, rect, grade) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  g.addColorStop(0, grade.wash[0]);
  g.addColorStop(1, grade.wash[1]);
  ctx.save();
  ctx.globalCompositeOperation = grade.mode;
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = grade.tint;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function skyBackdrop(ctx, W, H, grade) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#2b1055');
  g.addColorStop(0.45, grade.wash[0]);
  g.addColorStop(0.8, grade.wash[1]);
  g.addColorStop(1, '#12082e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // low sun disc
  const sunR = Math.min(W, H) * 0.16;
  const sg = ctx.createRadialGradient(W * 0.72, H * 0.3, 0, W * 0.72, H * 0.3, sunR * 2.4);
  sg.addColorStop(0, 'rgba(255, 232, 150, 0.95)');
  sg.addColorStop(0.35, 'rgba(255, 170, 80, 0.55)');
  sg.addColorStop(1, 'rgba(255, 120, 80, 0)');
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.arc(W * 0.72, H * 0.3, sunR * 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe89a';
  ctx.beginPath();
  ctx.arc(W * 0.72, H * 0.3, sunR, 0, Math.PI * 2);
  ctx.fill();
}

function drawPanel(ctx, img, rect, panel, grade, frame) {
  ctx.save();
  if (rect.rot) {
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.rotate(rect.rot);
    ctx.translate(-rect.w / 2, -rect.h / 2);
  } else {
    ctx.translate(rect.x, rect.y);
  }
  const local = { x: 0, y: 0, w: rect.w, h: rect.h };
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = Math.round(rect.w * 0.04);
  ctx.shadowOffsetY = Math.round(rect.w * 0.015);
  roundRectPath(ctx, local.x, local.y, local.w, local.h, Math.round(rect.w * 0.03));
  ctx.fillStyle = '#111';
  ctx.fill();
  ctx.restore();
  roundRectPath(ctx, local.x, local.y, local.w, local.h, Math.round(rect.w * 0.03));
  ctx.clip();
  if (img) {
    drawPhotoCover(ctx, img, local, panel.zoom, panel.ox, panel.oy);
  } else {
    const g = ctx.createLinearGradient(0, 0, local.w, local.h);
    g.addColorStop(0, '#3a2b5c');
    g.addColorStop(1, '#12082e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, local.w, local.h);
  }
  gradeWash(ctx, local, grade);
  ctx.restore();
  // white poster frame around the panel
  ctx.save();
  if (rect.rot) {
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.rotate(rect.rot);
    ctx.translate(-rect.w / 2, -rect.h / 2);
  } else {
    ctx.translate(rect.x, rect.y);
  }
  ctx.lineWidth = Math.max(3, Math.round(rect.w * 0.012));
  ctx.strokeStyle = frame ? '#ffffff' : 'rgba(255,255,255,0.9)';
  roundRectPath(ctx, 0, 0, rect.w, rect.h, Math.round(rect.w * 0.03));
  ctx.stroke();
  ctx.restore();
}

function fitFont(ctx, text, maxW, startPx, family) {
  let px = startPx;
  ctx.font = `${px}px ${family}`;
  while (px > 12 && ctx.measureText(text).width > maxW) {
    px -= 2;
    ctx.font = `${px}px ${family}`;
  }
  return px;
}

function drawTitleBlock(ctx, cx, cy, maxW, state, grade) {
  const title = (state.title || 'VICE CITY').toUpperCase();
  const sub = state.subtitle || '';
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const titlePx = fitFont(ctx, title, maxW, Math.round(maxW * 0.16), 'Anton, sans-serif');
  // skewed poster lettering: gradient fill + heavy outline + drop shadow
  ctx.save();
  ctx.translate(cx, cy);
  ctx.transform(1, 0, -0.06, 1, 0, 0);
  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur = Math.round(titlePx * 0.12);
  ctx.shadowOffsetY = Math.round(titlePx * 0.05);
  const tg = ctx.createLinearGradient(0, -titlePx * 0.6, 0, titlePx * 0.6);
  tg.addColorStop(0, '#fff7d6');
  tg.addColorStop(0.55, grade.wash[0]);
  tg.addColorStop(1, grade.wash[1]);
  ctx.font = `${titlePx}px Anton, sans-serif`;
  ctx.lineWidth = Math.max(4, Math.round(titlePx * 0.09));
  ctx.strokeStyle = '#14061f';
  ctx.lineJoin = 'round';
  ctx.strokeText(title, 0, 0);
  ctx.fillStyle = tg;
  ctx.fillText(title, 0, 0);
  ctx.restore();
  if (sub) {
    const subPx = Math.round(titlePx * 0.42);
    ctx.font = `${subPx}px Pacifico, cursive`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = Math.round(subPx * 0.2);
    ctx.shadowOffsetY = Math.round(subPx * 0.06);
    ctx.fillText(sub, cx, cy + titlePx * 0.78);
  }
  ctx.restore();
}

function drawBadge(ctx, W, H, state) {
  if (!state.badge) return;
  const px = Math.round(Math.min(W, H) * 0.032);
  ctx.save();
  ctx.font = `${px}px Anton, sans-serif`;
  const tw = ctx.measureText(state.badge.toUpperCase()).width;
  const bw = tw + px * 1.6;
  const bh = px * 1.9;
  const x = Math.round(W * 0.03);
  const y = Math.round(H * 0.03);
  ctx.translate(x + bw / 2, y + bh / 2);
  ctx.rotate(-0.04);
  ctx.fillStyle = '#ff2e63';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  ctx.beginPath();
  ctx.moveTo(-bw / 2, -bh / 2);
  ctx.lineTo(bw / 2, -bh / 2);
  ctx.lineTo(bw / 2 + bh * 0.45, 0);
  ctx.lineTo(bw / 2, bh / 2);
  ctx.lineTo(-bw / 2, bh / 2);
  ctx.closePath();
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(state.badge.toUpperCase(), 0, 1);
  ctx.restore();
}

function drawStars(ctx, W, H, state) {
  const n = Math.max(0, Math.min(5, state.stars || 0));
  if (!n) return;
  const r = Math.round(Math.min(W, H) * 0.02);
  const gap = r * 2.6;
  const total = n * gap;
  const x = W - Math.round(W * 0.03) - total;
  const y = Math.round(H * 0.045);
  ctx.save();
  ctx.fillStyle = '#ffd76a';
  ctx.strokeStyle = '#14061f';
  ctx.lineWidth = 2;
  for (let i = 0; i < n; i++) {
    const cx = x + i * gap + r;
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const ang = -Math.PI / 2 + (k * Math.PI) / 5;
      const rad = k % 2 === 0 ? r : r * 0.45;
      const px = cx + Math.cos(ang) * rad;
      const py = y + Math.sin(ang) * rad;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function grainAndVignette(ctx, W, H, seed = 7) {
  // deterministic grain so the same state always exports the same PNG
  let s = seed;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#ffffff';
  const n = Math.round((W * H) / 9000);
  for (let i = 0; i < n; i++) {
    const x = rnd() * W;
    const y = rnd() * H;
    ctx.fillRect(x, y, 1.6, 1.6);
  }
  ctx.restore();
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(10,4,24,0.42)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
}

// Main entry: draw the whole cover. `state.panels` entries are
// { img, zoom, ox, oy } (img may be null for an empty panel).
export function drawCover(ctx, state, W, H) {
  const grade = GRADES[state.grade] || GRADES.sunset;
  const rects = panelRects(state.layout, W, H);
  ctx.clearRect(0, 0, W, H);
  skyBackdrop(ctx, W, H, grade);

  if (state.layout === 'grid9') {
    rects.forEach((r, i) => {
      const p = state.panels[i] || { img: null, zoom: 1, ox: 0, oy: 0 };
      drawPanel(ctx, p.img, r, p, grade, true);
    });
    const cell = titleCellRect(W, H);
    ctx.save();
    roundRectPath(ctx, cell.x, cell.y, cell.w, cell.h, Math.round(cell.w * 0.04));
    ctx.fillStyle = 'rgba(16,6,32,0.92)';
    ctx.fill();
    ctx.lineWidth = Math.max(3, Math.round(cell.w * 0.012));
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.restore();
    drawTitleBlock(ctx, cell.x + cell.w / 2, cell.y + cell.h / 2 - cell.h * 0.06,
      cell.w * 0.92, state, grade);
  } else if (state.layout === 'bleed') {
    const p = state.panels[0] || { img: null, zoom: 1, ox: 0, oy: 0 };
    drawPanel(ctx, p.img, rects[0], p, grade, false);
    // bottom title band
    const bandH = Math.round(H * 0.3);
    const bg = ctx.createLinearGradient(0, H - bandH, 0, H);
    bg.addColorStop(0, 'rgba(16,6,32,0)');
    bg.addColorStop(0.45, 'rgba(16,6,32,0.82)');
    bg.addColorStop(1, 'rgba(16,6,32,0.95)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, H - bandH, W, bandH);
    drawTitleBlock(ctx, W / 2, H - bandH * 0.42, W * 0.86, state, grade);
  } else if (state.layout === 'tilt') {
    rects.forEach((r, i) => {
      const p = state.panels[i] || { img: null, zoom: 1, ox: 0, oy: 0 };
      drawPanel(ctx, p.img, r, p, grade, true);
    });
    drawTitleBlock(ctx, W / 2, Math.round(H * 0.13),
      W * 0.62, state, grade);
  } else {
    // hero
    rects.forEach((r, i) => {
      const p = state.panels[i] || { img: null, zoom: 1, ox: 0, oy: 0 };
      drawPanel(ctx, p.img, r, p, grade, true);
    });
    const hero = rects[0];
    const bandH = Math.round(hero.h * 0.26);
    const bg = ctx.createLinearGradient(0, hero.y + hero.h - bandH, 0, hero.y + hero.h);
    bg.addColorStop(0, 'rgba(16,6,32,0)');
    bg.addColorStop(1, 'rgba(16,6,32,0.9)');
    ctx.save();
    roundRectPath(ctx, hero.x, hero.y, hero.w, hero.h, Math.round(hero.w * 0.03));
    ctx.clip();
    ctx.fillStyle = bg;
    ctx.fillRect(hero.x, hero.y + hero.h - bandH, hero.w, bandH);
    ctx.restore();
    drawTitleBlock(ctx, hero.x + hero.w / 2, hero.y + hero.h - bandH * 0.45,
      hero.w * 0.9, state, grade);
  }

  drawBadge(ctx, W, H, state);
  drawStars(ctx, W, H, state);
  grainAndVignette(ctx, W, H);
}

// The app's own sample photos (original illustrations made for this entry).
export const SAMPLE_PHOTOS = [
  { id: 'boulevard', label: 'Boulevard', src: 'samples/boulevard.jpg' },
  { id: 'neon', label: 'Neon Street', src: 'samples/neon.jpg' },
  { id: 'pier', label: 'Pier Day', src: 'samples/pier.jpg' },
  { id: 'rooftop', label: 'Rooftop Dusk', src: 'samples/rooftop.jpg' },
];

// Render the cover at full export resolution into a fresh canvas.
export function renderCoverCanvas(state) {
  const size = SIZES[state.size] || SIZES.square;
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  drawCover(ctx, state, size.w, size.h);
  return canvas;
}
