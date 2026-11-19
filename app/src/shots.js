// Fixed scenes for screenshots: ?shot=editor shows the editor with sample photos loaded;
// ?shot=cover shows the exported cover alone, full frame. `photo` picks the first sample,
// `photo2` the second, `caption` the title words, `layout` and `grade` the look.
// window.__shotReady is set once the scene is painted and the fonts are ready.
export async function runShot(shot, query, hooks) {
  const photo = query.get('photo') ?? 'boulevard';
  const photo2 = query.get('photo2') ?? 'pier';
  const caption = query.get('caption') ?? 'Sunset Heist';
  const subtitle = query.get('subtitle') ?? 'vice city nights';
  const layout = query.get('layout') ?? 'hero';
  const grade = query.get('grade') ?? 'sunset';
  const size = query.get('size') ?? 'square';

  const first = await hooks.loadImage(`samples/${photo}.jpg`);
  const second = await hooks.loadImage(`samples/${photo2}.jpg`);
  const photos = [first, second, first, second];

  hooks.applyScene({ photos, title: caption, subtitle, layout, grade, size });

  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (shot === 'editor') document.body.classList.add('shot-editor');
  await document.fonts.ready;
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
