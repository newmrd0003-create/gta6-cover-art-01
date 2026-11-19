// Shot scenes for screenshots: fixed editor/cover setups built from the
// kit's sample photos, so every screenshot is the app's own drawing.
//   ?shot=cover&photo=pier&caption=Sunset%20Heist   full-frame exported cover
//   ?shot=editor&photo=boulevard&caption=...        editor with a photo loaded
// Optional extras: &layout=grid&grade=neon&size=1920x1080

const SCENES = {
  cover: {
    layout: 'hero',
    grade: 'sunset',
    size: '1080x1080',
    title: 'Sunset Heist',
    subtitle: 'neon nights & palm trees',
    kicker: 'EST. 2026 · PALM BOULEVARD',
    photos: ['pier.jpg', 'boulevard.jpg'],
    panelPhotos: [0, 1, 0, 1],
  },
  editor: {
    layout: 'grid',
    grade: 'neon',
    size: '1080x1350',
    title: 'Boulevard Queen',
    subtitle: 'crown the night in neon',
    kicker: 'EST. 2026 · PALM BOULEVARD',
    photos: ['boulevard.jpg', 'pier.jpg'],
    panelPhotos: [0, 1, 1, 0],
  },
};

const PHOTOS = ['boulevard.jpg', 'pier.jpg'];

export function sceneForQuery(params) {
  const mode = params.get('shot');
  if (mode !== 'cover' && mode !== 'editor') return null;
  const base = SCENES[mode];
  const scene = { ...base, mode, photos: [...base.photos], panelPhotos: [...base.panelPhotos] };
  const layout = params.get('layout');
  if (layout && ['hero', 'grid', 'bleed', 'tilt'].includes(layout)) scene.layout = layout;
  const grade = params.get('grade');
  if (grade && ['sunset', 'neon', 'gold', 'noir'].includes(grade)) scene.grade = grade;
  const size = params.get('size');
  if (size && ['1080x1080', '1080x1350', '1920x1080'].includes(size)) scene.size = size;
  const caption = params.get('caption');
  if (caption) scene.title = caption;
  const photo = params.get('photo');
  if (photo && PHOTOS.includes(`${photo}.jpg`)) {
    scene.photos = [`${photo}.jpg`, ...PHOTOS.filter((p) => p !== `${photo}.jpg`)];
    scene.panelPhotos = [0, 1, 0, 1];
  }
  return scene;
}
