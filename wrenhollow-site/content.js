/*
 * Wrenhollow — fly-through timing.
 * All page copy (chapters, range, tours, process, visit) lives in index.html, so the page
 * reads fine without JavaScript. The chat assistant reads its facts from index.html too.
 *
 * FLIGHT BEATS
 *   vh       scroll distance for this beat, in viewport heights (desktop)
 *   from/to  clip time in seconds; from === to makes a still-frame hold
 *   chapter  id of the copy chapter this beat carries (null = motion only)
 *   mvh      optional scroll distance override for phones
 *   focus    optional horizontal crop focus for tall screens (0 left … 1 right).
 *            Keep scripts/build-frames.sh PORTRAIT_FOCUS in step: phones use the
 *            pre-cropped portrait sequence with the same focus baked in.
 */
window.WRENHOLLOW = {
  brand: {
    name: "Wrenhollow",
    tagline: "Brewery & Distillery",
    primaryAction: { label: "Book a tasting", href: "#visit" },
  },

  flight: {
    manifest: "frames/manifest.json",
    poster: "assets/poster.webp",
    beats: [
      { id: "hold-door",  vh: 0.8, mvh: 0.5, from: 0,    to: 0,    chapter: "arrive" },
      { id: "door",       vh: 1.0, mvh: 0.9, from: 0,    to: 2,    chapter: "arrive" },
      { id: "bar",        vh: 1.8, mvh: 1.4, from: 2,    to: 7,    chapter: "taproom" },
      { id: "stills",     vh: 1.1, mvh: 0.9, from: 7,    to: 10,   chapter: "stills" },
      { id: "valve",      vh: 0.9, mvh: 0.8, from: 10,   to: 12.5, chapter: "stills", focus: 0.72 },
      { id: "casks",      vh: 1.6, mvh: 1.3, from: 12.5, to: 16.5, chapter: "casks" },
      { id: "bottling",   vh: 1.5, mvh: 1.2, from: 16.5, to: 20.5, chapter: "bottling" },
      { id: "exit-spin",  vh: 1.1, mvh: 0.9, from: 20.5, to: 24.5, chapter: null },
      { id: "reveal",     vh: 1.6, mvh: 1.3, from: 24.5, to: 30,   chapter: "reveal" },
      { id: "hold-aerial",vh: 1.0, mvh: 0.6, from: 30,   to: 30,   chapter: "reveal" },
    ],
  },
};
