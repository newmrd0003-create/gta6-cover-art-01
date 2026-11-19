// Vice City Sunset — cover renderer.
// Draws the multi-panel GTA-style poster onto a canvas at any export size.
// Pure drawing code: no DOM reads, no network, no fonts beyond the system stack.

export const EXPORT_SIZES = [
  { label: 'Square', w: 1080, h: 1080 },
  { label: 'Portrait', w: 1080, h: 1350 },
  { label: 'Landscape', w: 1920, h: 1080 },
];

// Canvas filter applied while a photo is painted, per colour grade.
export const GRADE_FILTERS = {
  sunset: 'saturate(1.35) contrast(1.1) sepia(0.18)',
  neon: 'saturate(1.6) contrast(1.12) hue-rotate(-12deg)',
  golden: 'sepia(0.4) saturate(1.5) contrast(1.06)',
  noir: 'grayscale(1) contrast(1.3) brightness(1.05)',
  none: 'none',
};

// A cover state: three panel photos, caption text, grade and export size.
export function blankState() {
  return {
    size: { w: 1080, h: 1080 },
    title: 'SUNSET HEIST',
    subtitle: 'VICE CITY · 2026',
    titleSize: 1,
    titleColor: '#ffffff',
    grade: 'sunset',
    panels: [
      { img: null, panX: 0.5, panY: 0.5, zoom: 1 },
      { img: null, panX: 0.5, panY: 0.5, zoom: 1 },
      { img: null, panX: 0.5, panY: 0.5, zoom: 1 },
    ],
  };
}

// Poster geometry: one big hero panel left, two stacked panels right,
// a caption band along the bottom. Returns { panels: [rect, rect, rect], band }.
export function posterLayout(w, h) {
  const bandH = Math.round(h * 0.16);
  const panelsH = h - bandH;
  const g = Math.max(4, Math.round(w * 0.005));
  const heroW = Math.round(w * 0.62);
  const rightX = heroW + g;
  const rightW = w - rightX;
  const smallH = Math.floor((panelsH - g) / 2);
  return {
    band: { x: 0, y: panelsH, w, h: bandH },
    panels: [
      { x: 0, y: 0, w: heroW, h: panelsH },
      { x: rightX, y: 0, w: rightW, h: smallH },
      { x: rightX, y: smallH + g, w: rightW, h: panelsH - smallH - g },
    ],
  };
}

// Paint one photo into a rect, cover-fit, with pan (0..1) and zoom (>=1).
// The paint is clipped to the rect: a zoomed photo must never bleed
// into the neighbouring panel.
function paintPhoto(ctx, img, rect, panX, panY, zoom) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (!img || !img.naturalWidth) {
    const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    grad.addColorStop(0, '#3a2358');
    grad.addColorStop(1, '#12081f');
    ctx.fillStyle = grad;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `700 ${Math.max(14, rect.w * 0.045)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.restore();
    return;
  }
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = rect.x + (rect.w - dw) * panX;
  const dy = rect.y + (rect.h - dh) * panY;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

// Warm / neon wash over the photo area, per grade, plus a vignette.
function paintGradeWash(ctx, w, panelsH, grade) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, panelsH);
  ctx.clip();
  let top;
  let bottom;
  if (grade === 'sunset') {
    top = 'rgba(255,170,60,0.10)';
    bottom = 'rgba(255,60,120,0.24)';
  } else if (grade === 'neon') {
    top = 'rgba(94,230,255,0.16)';
    bottom = 'rgba(255,94,168,0.22)';
  } else if (grade === 'golden') {
    top = 'rgba(255,200,90,0.18)';
    bottom = 'rgba(255,140,40,0.14)';
  } else if (grade === 'noir') {
    top = 'rgba(0,0,0,0.05)';
    bottom = 'rgba(0,0,0,0.18)';
  } else {
    top = 'rgba(0,0,0,0)';
    bottom = 'rgba(0,0,0,0.06)';
  }
  const wash = ctx.createLinearGradient(0, 0, 0, panelsH);
  wash.addColorStop(0, top);
  wash.addColorStop(1, bottom);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, panelsH);
  const vig = ctx.createRadialGradient(
    w / 2, panelsH / 2, Math.min(w, panelsH) * 0.35,
    w / 2, panelsH / 2, Math.max(w, panelsH) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, panelsH);
  ctx.restore();
}

// Small pill badge in the hero corner.
function paintBadge(ctx, hero, text) {
  const pad = Math.max(10, hero.w * 0.02);
  const fontPx = Math.max(13, Math.round(hero.w * 0.032));
  ctx.font = `900 italic ${fontPx}px "Arial Black", Arial, sans-serif`;
  const tw = ctx.measureText(text).width;
  const bw = tw + pad * 2;
  const bh = fontPx * 1.9;
  const bx = hero.x + pad;
  const by = hero.y + pad;
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, bh / 2);
  ctx.fill();
  ctx.fillStyle = '#14060f';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + pad, by + bh / 2 + 1);
}

// Bold italic title with a heavy black outline, fitted to the band width.
function paintCaption(ctx, band, state) {
  const bandGrad = ctx.createLinearGradient(0, band.y, 0, band.y + band.h);
  bandGrad.addColorStop(0, '#22103d');
  bandGrad.addColorStop(1, '#0d0a14');
  ctx.fillStyle = bandGrad;
  ctx.fillRect(band.x, band.y, band.w, band.h);
  ctx.fillStyle = '#ff5ea8';
  ctx.fillRect(band.x, band.y, band.w, Math.max(3, band.h * 0.03));

  const title = (state.title || 'UNTITLED').toUpperCase();
  const maxW = band.w * 0.92;
  let px = band.h * 0.5 * state.titleSize;
  const setTitleFont = (size) => {
    ctx.font = `900 italic ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  };
  setTitleFont(px);
  while (px > 12 && ctx.measureText(title).width > maxW) {
    px *= 0.92;
    setTitleFont(px);
  }
  const cx = band.x + band.w * 0.04;
  const cy = band.y + band.h * 0.46;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.transform(1, 0, -0.07, 1, 0, 0);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = Math.max(3, px * 0.13);
  ctx.strokeText(title, 0, 0);
  ctx.fillStyle = state.titleColor || '#ffffff';
  ctx.fillText(title, 0, 0);
  ctx.restore();

  const sub = state.subtitle || '';
  if (sub) {
    const subPx = Math.max(11, band.h * 0.17);
    ctx.font = `700 ${subPx}px "Helvetica Neue", Arial, sans-serif`;
    try { ctx.letterSpacing = `${Math.max(2, subPx * 0.22)}px`; } catch { /* older canvas */ }
    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(sub.toUpperCase(), band.x + band.w * 0.04, band.y + band.h * 0.84);
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }
}

// Draw the whole cover onto a fresh canvas at the state's export size.
export function renderCover(state) {
  const { w, h } = state.size;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0d0a14';
  ctx.fillRect(0, 0, w, h);

  const layout = posterLayout(w, h);
  const panelsH = h - layout.band.h;
  ctx.filter = GRADE_FILTERS[state.grade] || 'none';
  state.panels.forEach((panel, i) => {
    paintPhoto(ctx, panel.img, layout.panels[i], panel.panX, panel.panY, panel.zoom);
  });
  ctx.filter = 'none';

  paintGradeWash(ctx, w, panelsH, state.grade);

  const frameW = Math.max(2, Math.round(w * 0.0025));
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = frameW;
  layout.panels.forEach((rect) => ctx.strokeRect(rect.x, rect.y, rect.w, rect.h));

  paintBadge(ctx, layout.panels[0], 'VICE CITY');
  paintCaption(ctx, layout.band, state);
  return canvas;
}

// The PNG the app exports, at the state's export size.
export function coverToBlob(state) {
  return new Promise((resolve, reject) => {
    renderCover(state).toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('PNG export failed'));
    }, 'image/png');
  });
}
