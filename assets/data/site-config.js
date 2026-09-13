/*
  Site-wide toggles, same hand-editable pattern as verses.js and the CSV
  files: no build step, edit this file and refresh. Applied by
  assets/js/site-config-apply.js before the page paints, so flipping a value
  here never needs a code change anywhere else.
*/

const SITE_CONFIG = {
  // The father's portrait photo in the home page hero. Set to false any
  // time the family hasn't supplied a photo yet (or asks for it to come
  // down) -- the hero re-centers itself automatically, no layout is left
  // broken either way.
  showPortrait: true,

  // The illustrated mosque/minaret backdrop (assets/img/religious-silhouette.svg)
  // used behind the home hero, the pray page intro, and the donate page
  // intro. Purely decorative vector art, not a real place or a photo.
  // Layers together with the photo backdrop below (both can be on at once).
  showReligiousBackdrop: true,

  // The site-wide photo backdrop (a fixed, very faint architectural photo
  // behind every page -- see .page-backdrop in assets/css/main.css). Turn
  // off for a plain flat background instead.
  showPhotoBackdrop: true,

  // The soft diagonal light-streak "waves" that drift across the hero,
  // page headers, and tinted sections. Color/strength/blur are controlled
  // separately in assets/css/main.css (search "FLOWING WAVES" -- three
  // CSS variables: --wave-opacity-1, --wave-opacity-2, --wave-blur).
  showWaves: true,
};
