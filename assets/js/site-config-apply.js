/*
  Applies assets/data/site-config.js toggles to <html> as classes. Loaded as
  a normal blocking <script> in <head>, right after site-config.js and
  before anything renders, so there is no flash of the portrait/backdrop
  before it gets hidden. Kept as its own file (not inline) because the
  site's Content-Security-Policy (see vercel.json) locks script-src to
  'self' with no 'unsafe-inline' exception.
*/
(function () {
  if (typeof SITE_CONFIG === "undefined") return;
  var html = document.documentElement;
  if (SITE_CONFIG.showPortrait === false) html.classList.add("no-portrait");
  if (SITE_CONFIG.showReligiousBackdrop === false) html.classList.add("no-religious-backdrop");
})();
