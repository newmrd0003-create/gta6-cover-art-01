// Vice Cover Studio — cover renderer.
// Draws the multi-panel GTA-style poster onto any canvas: photo panels with
// crop + position, a sunset/neon colour grade, and bold caption lettering.
// Pure drawing code: no network, no DOM reads except the canvas it is given.

export const EXPORT_SIZES = {
  square: { label: 'Square 1080 × 1080', width: 1080, height: 1080 },
  portrait: { label: 'Portrait 1080 × 1350', width: 1080, height: 1350 },
  wide: { label: 'Wide 1920 × 1080', width: 1920, height: 1080 },
};

export const LAYOUTS = {
  hero: { label: 'Hero — one big photo' },
  duo: { label: 'Duo — two side by side' },
  trio: { label: 'Trio — hero + two below' },
  quad: { label: 'Quad — four panels' },
};

export const GRADES = {
  sunset: {
    label: 'Sunset',
    sky: ['#ff9a3c', '#ff5e7a', '#7b2ff7'],
    wash: 'rgba(255, 94, 122, 0.20)',
    accent: '#ffd166',
  },
  neon: {
    label: 'Neon Nights',
    sky: ['#00e5ff', '#ff2fb3', '#7b2ff7'],
    wash: 'rgba(255, 47, 179, 0.22)',
    accent: '#00e5ff',
  },
  dusk: {
    label: 'Dusk',
    sky: ['#2b1055', '#7597de', '#ff7e5f'],
    wash: 'rgba(43, 16, 85, 0.25)',
    accent: '#ff9a3c',
  },
  noir: {
    label: 'Noir',
    sky: ['#e8e8e8', '#8a8a8a', '#111111'],
    wash: 'rgba(0, 0, 0, 0.28)',
    accent: '#ffffff',
  },
};

// Panel rectangles for a layout, as fractions of the cover (x, y, w, h).
// The gutter is drawn between panels; the lettering band sits at the bottom.
export function panelRects(layout, width, height) {
  const band = Math.round(height * 0.30);
  const top = height - band;
  const g = Math.max(4, Math.round(width * 0.006));
  if (layout === 'hero') {
    return [{ x: 0, y: 0, width, height: top }];
  }
  if (layout === 'duo') {
    const half = Math.floor((width - g) / 2);
    return [
      { x: 0, y: 0, width: half, height: top },
      { x: half + g, y: 0, width: width - half - g, height: top },
    ];
  }
  if (layout === 'trio') {
    const halfH = Math.floor(top / 2);
    const halfW = Math.floor((width - g) / 2);
    return [
      { x: 0, y: 0, width, height: halfH },
      { x: 0, y: halfH + g, width: halfW, height: top - halfH - g },
      { x: halfW + g, y: halfH + g, width: width - halfW - g, height: top - halfH - g },
    ];
  }
  // quad: 2 x 2 grid above the lettering band.
  const halfW = Math.floor((width - g) / 2);
  const halfH = Math.floor((top - g) / 2);
  return [
    { x: 0, y: 0, width: halfW, height: halfH },
    { x: halfW + g, y: 0, width: width - halfW - g, height: halfH },
    { x: 0, y: halfH + g, width: halfW, height: top - halfH - g },
    { x: halfW + g, y: halfH + g, width: width - halfW - g, height: top - halfH - g },
  ];
}

// Draw one photo into a panel rect, cover-fit, with a zoom factor and a
// pan offset (both -1..1) so the user can crop and position each photo.
export function drawPhotoPanel(ctx, image, rect, zoom, panX, panY) {
  if (!image || !image.naturalWidth) return;
  const scale = Math.max(rect.width / image.naturalWidth, rect.height / image.naturalHeight) * zoom;
  const dw = image.naturalWidth * scale;
  const dh = image.naturalHeight * scale;
  const dx = rect.x + (rect.width - dw) / 2 + panX * rect.width * 0.25;
  const dy = rect.y + (rect.height - dh) / 2 + panY * rect.height * 0.25;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.width, rect.height);
  ctx.clip();
  ctx.drawImage(image, dx, dy, dw, dh);
  // Gentle bottom shade inside each panel so the grade reads as one poster.
  const shade = ctx.createLinearGradient(0, rect.y + rect.height * 0.55, 0, rect.y + rect.height);
  shade.addColorStop(0, 'rgba(10, 6, 24, 0)');
  shade.addColorStop(1, 'rgba(10, 6, 24, 0.42)');
  ctx.fillStyle = shade;
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  ctx.restore();
}

function drawLettering(ctx, state, width, height, grade) {
  const band = Math.round(height * 0.30);
  const top = height - band;
  const pad = Math.round(width * 0.045);
  // Sky band: the poster's sunset strip behind the lettering.
  const sky = ctx.createLinearGradient(0, top, width, height);
  grade.sky.forEach((color, i) => sky.addColorStop(i / (grade.sky.length - 1), color));
  ctx.fillStyle = sky;
  ctx.fillRect(0, top, width, band);
  ctx.fillStyle = grade.wash;
  ctx.fillRect(0, top, width, band);
  // Thin light rule above the sky band.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillRect(0, top, width, Math.max(3, Math.round(height * 0.004)));

  const title = (state.title || 'VICE CITY').toUpperCase();
  const sub = state.subtitle || '';
  const tag = state.tagline || '';

  ctx.textBaseline = 'alphabetic';
  // Subtitle in script, tucked above the title.
  if (sub) {
    const subSize = Math.round(band * 0.22);
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.fillStyle = grade.accent;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = Math.round(subSize * 0.12);
    ctx.shadowOffsetY = Math.round(subSize * 0.06);
    ctx.fillText(sub, pad, top + band * 0.30);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
  // Title: heavy block letters, white with a dark outline and drop shadow.
  const titleSize = Math.round(band * 0.46);
  ctx.font = `${titleSize}px Anton, "Arial Black", sans-serif`;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#14081f';
  ctx.lineWidth = Math.max(4, Math.round(titleSize * 0.10));
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = Math.round(titleSize * 0.10);
  ctx.shadowOffsetY = Math.round(titleSize * 0.07);
  const titleY = top + band * (sub ? 0.74 : 0.62);
  ctx.strokeText(title, pad, titleY);
  ctx.fillText(title, pad, titleY);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  // Tagline in small tracked capitals.
  if (tag) {
    const tagSize = Math.round(band * 0.13);
    ctx.font = `700 ${tagSize}px Anton, "Arial Black", sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.fillText(tag.toUpperCase(), pad, top + band * 0.93);
  }
}

// Render the whole cover. state: { photos, layout, title, subtitle, tagline,
// grade, assignments } where photos are { image, zoom, panX, panY } and
// assignments maps panel index -> photo index.
export function drawCover(ctx, state, width, height) {
  const grade = GRADES[state.grade] || GRADES.sunset;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#0b0618';
  ctx.fillRect(0, 0, width, height);
  const rects = panelRects(state.layout || 'trio', width, height);
  rects.forEach((rect, i) => {
    const photoIndex = (state.assignments && state.assignments[i] != null
      ? state.assignments[i]
      : i % Math.max(1, state.photos.length)) ?? 0;
    const photo = state.photos[photoIndex];
    if (photo) drawPhotoPanel(ctx, photo.image, rect, photo.zoom, photo.panX, photo.panY);
  });
  // Grade wash over the photo area ties the panels into one poster.
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = grade.wash;
  ctx.fillRect(0, 0, width, height - Math.round(height * 0.30));
  ctx.restore();
  drawLettering(ctx, state, width, height, grade);
  // Vignette: darkened corners for the poster look.
  const vig = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.42,
    width / 2, height / 2, Math.max(width, height) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, width, height);
}
