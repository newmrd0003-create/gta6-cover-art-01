// Vice Cover Studio — cover renderer.
// Draws a multi-panel GTA 6-style poster on any canvas: photos per panel,
// a Vice City sunset / neon grade, bold caption lettering, grain + vignette.
// No network, no Rockstar art: every shape here is drawn from scratch.

export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 x 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 x 1350' },
  wide: { w: 1920, h: 1080, label: '1920 x 1080' },
};

export const LAYOUTS = {
  grid: {
    label: 'Sunset Grid',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.6 },
      { x: 0, y: 0.6, w: 0.5, h: 0.4 },
      { x: 0.5, y: 0.6, w: 0.5, h: 0.4 },
    ],
  },
  trio: {
    label: 'Neon Trio',
    panels: [
      { x: 0, y: 0, w: 1 / 3, h: 1 },
      { x: 1 / 3, y: 0, w: 1 / 3, h: 1 },
      { x: 2 / 3, y: 0, w: 1 / 3, h: 1 },
    ],
  },
  poster: {
    label: 'Vice Poster',
    panels: [
      { x: 0, y: 0, w: 0.62, h: 1 },
      { x: 0.62, y: 0, w: 0.38, h: 0.5 },
      { x: 0.62, y: 0.5, w: 0.38, h: 0.5 },
    ],
  },
};

export const THEMES = {
  sunset: {
    label: 'Sunset',
    sky: ['#2b1055', '#7597de'],
    grade: ['#ff6a00', '#ff2e88'],
    sun: '#ffd319',
    title: '#ffffff',
    accent: '#ffd319',
  },
  neon: {
    label: 'Neon Night',
    sky: ['#0f0524', '#3b0f66'],
    grade: ['#00e5ff', '#ff2e88'],
    sun: '#ff71ce',
    title: '#eafcff',
    accent: '#00e5ff',
  },
  vice: {
    label: 'Vice Gold',
    sky: ['#1b0b3b', '#7a1e6e'],
    grade: ['#ffb347', '#b967ff'],
    sun: '#fff3b0',
    title: '#fff7e0',
    accent: '#ffb347',
  },
};

export function blankPhoto() {
  return { img: null, zoom: 1, ox: 0, oy: 0 };
}

export function defaultState() {
  return {
    layout: 'grid',
    size: 'square',
    title: 'VICE CITY NIGHTS',
    tagline: 'one last sunset heist',
    theme: 'sunset',
    grade: 0.55,
    grain: true,
    photos: [blankPhoto(), blankPhoto(), blankPhoto()],
  };
}

function coverFit(img, pw, ph, zoom, ox, oy) {
  const scale = Math.max(pw / img.width, ph / img.height) * zoom;
  const dw = img.width * scale;
  const dh = img.height * scale;
  return { dx: (pw - dw) / 2 + ox * pw, dy: (ph - dh) / 2 + oy * ph, dw, dh };
}

function drawPanelPhoto(ctx, photo, rect, W, H) {
  const px = rect.x * W;
  const py = rect.y * H;
  const pw = rect.w * W;
  const ph = rect.h * H;
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();
  if (photo.img) {
    const f = coverFit(photo.img, pw, ph, photo.zoom, photo.ox, photo.oy);
    ctx.drawImage(photo.img, px + f.dx, py + f.dy, f.dw, f.dh);
  } else {
    const g = ctx.createLinearGradient(px, py, px, py + ph);
    g.addColorStop(0, '#3a1c5e');
    g.addColorStop(1, '#12081f');
    ctx.fillStyle = g;
    ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `700 ${Math.round(ph * 0.09)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD PHOTO', px + pw / 2, py + ph / 2);
  }
  ctx.restore();
  return { px, py, pw, ph };
}

function drawGrade(ctx, rect, theme, strength, W, H) {
  const { px, py, pw, ph } = rect;
  const g = ctx.createLinearGradient(px, py, px + pw * 0.25, py + ph);
  g.addColorStop(0, theme.grade[0]);
  g.addColorStop(1, theme.grade[1]);
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();
  ctx.globalAlpha = strength * 0.45;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = g;
  ctx.fillRect(px, py, pw, ph);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = strength * 0.22;
  ctx.fillStyle = theme.grade[1];
  ctx.fillRect(px, py + ph * 0.55, pw, ph * 0.45);
  ctx.restore();
}

function drawSunAndSkyline(ctx, theme, W, H) {
  const cx = W * 0.78;
  const cy = H * 0.2;
  const r = Math.min(W, H) * 0.11;
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.4);
  glow.addColorStop(0, theme.sun);
  glow.addColorStop(1, 'rgba(255,113,206,0)');
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r * 2.4, cy - r * 2.4, r * 4.8, r * 4.8);
  ctx.restore();
  ctx.fillStyle = theme.sun;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.fillStyle = 'rgba(12,4,24,0.85)';
  const base = H * 0.6;
  const towers = [0.02, 0.1, 0.16, 0.24, 0.33, 0.42, 0.52, 0.6, 0.7, 0.8, 0.9];
  towers.forEach((t, i) => {
    const tw = W * (0.03 + (i % 3) * 0.012);
    const th = H * (0.05 + ((i * 7) % 5) * 0.028);
    ctx.fillRect(W * t, base - th, tw, th);
  });
  ctx.fillRect(0, base, W, H * 0.012);
  ctx.restore();
}

function drawGrain(ctx, W, H, seed) {
  const tile = 140;
  const off = document.createElement('canvas');
  off.width = tile;
  off.height = tile;
  const octx = off.getContext('2d');
  const data = octx.createImageData(tile, tile);
  let s = seed;
  for (let i = 0; i < data.data.length; i += 4) {
    s = (s * 16807) % 2147483647;
    const v = s % 256;
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  octx.putImageData(data, 0, 0);
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(off, 'repeat');
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function drawVignette(ctx, W, H) {
  const g = ctx.createRadialGradient(
    W / 2, H / 2, Math.min(W, H) * 0.42,
    W / 2, H / 2, Math.max(W, H) * 0.75,
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(5,0,15,0.5)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
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

function drawCaption(ctx, state, theme, W, H) {
  const bandH = H * 0.2;
  const bandY = H - bandH;
  const g = ctx.createLinearGradient(0, bandY, 0, H);
  g.addColorStop(0, 'rgba(10,2,22,0)');
  g.addColorStop(0.45, 'rgba(10,2,22,0.78)');
  g.addColorStop(1, 'rgba(10,2,22,0.92)');
  ctx.fillStyle = g;
  ctx.fillRect(0, bandY, W, bandH);
  ctx.fillStyle = theme.accent;
  ctx.fillRect(W * 0.06, bandY + H * 0.015, W * 0.1, Math.max(4, H * 0.006));

  const title = (state.title || 'VICE CITY').toUpperCase();
  const maxW = W * 0.88;
  const size = fitFont(ctx, title, maxW, Math.round(H * 0.105), 'Anton, "Arial Black", sans-serif', 400);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  const ty = H * 0.95;
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3, size * 0.09);
  ctx.strokeStyle = 'rgba(20,2,30,0.9)';
  ctx.strokeText(title, W * 0.06, ty);
  ctx.fillStyle = theme.title;
  ctx.fillText(title, W * 0.06, ty);
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = theme.accent;
  ctx.fillText(title, W * 0.06 + size * 0.03, ty + size * 0.045);
  ctx.restore();

  const tag = state.tagline || '';
  if (tag) {
    const tagPx = fitFont(ctx, tag, maxW, Math.round(H * 0.038), 'Pacifico, cursive', 400);
    ctx.font = `${tagPx}px Pacifico, cursive`;
    ctx.fillStyle = theme.accent;
    ctx.fillText(tag, W * 0.065, bandY + H * 0.055);
  }
}

export async function ensureCoverFonts() {
  try {
    await Promise.all([
      document.fonts.load('400 100px Anton'),
      document.fonts.load('400 40px Pacifico'),
    ]);
    await document.fonts.ready;
  } catch {
    // Fall back to system fonts; the cover still renders.
  }
}

export function drawCover(canvas, state) {
  const size = SIZES[state.size] || SIZES.square;
  const theme = THEMES[state.theme] || THEMES.sunset;
  const layout = LAYOUTS[state.layout] || LAYOUTS.grid;
  const W = size.w;
  const H = size.h;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, theme.sky[0]);
  sky.addColorStop(0.55, theme.sky[1]);
  sky.addColorStop(1, '#12081f');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  drawSunAndSkyline(ctx, theme, W, H);

  const gap = Math.max(4, Math.round(Math.min(W, H) * 0.006));
  layout.panels.forEach((panel, i) => {
    const inset = {
      x: panel.x * W + (panel.x > 0 ? gap / 2 : 0),
      y: panel.y * H + (panel.y > 0 ? gap / 2 : 0),
      w: panel.w * W - (panel.x > 0 ? gap / 2 : 0) - (panel.x + panel.w < 1 ? gap / 2 : 0),
      h: panel.h * H - (panel.y > 0 ? gap / 2 : 0) - (panel.y + panel.h < 1 ? gap / 2 : 0),
    };
    const drawn = drawPanelPhoto(ctx, state.photos[i] || blankPhoto(), {
      x: inset.x / W, y: inset.y / H, w: inset.w / W, h: inset.h / H,
    }, W, H);
    drawGrade(ctx, drawn, theme, state.grade ?? 0.55, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = Math.max(2, gap * 0.5);
    ctx.strokeRect(drawn.px, drawn.py, drawn.pw, drawn.ph);
  });

  drawCaption(ctx, state, theme, W, H);
  if (state.grain) drawGrain(ctx, W, H, 1234567);
  drawVignette(ctx, W, H);
  return { w: W, h: H };
}
