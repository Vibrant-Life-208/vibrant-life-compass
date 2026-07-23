// asterisms.js — the five per-Pillar constellations for the Compass → Star Chart (Phase 2 / C6b).
//
// STANDALONE + FRAMEWORK-FREE. This module is pure shape data + inline-SVG string builders.
// It is NOT wired into the app (no Lit, no store, no app.js/index.html/sw.js). A standalone
// preview (asterisms-preview.html) renders all five. Final art refinement is Ishka's (spec §6 [OPEN]);
// these are the working shapes.
//
// Source of truth: COMPASS-VISUAL-SYSTEM-SPEC-v0.1.md
//   §0  render contract — inline SVG only, NO <canvas>; any motion is opacity/transform ONLY;
//       prefers-reduced-motion renders the settled end-frame; not-color-alone (label + icon + shape).
//   §6  Compass → Star Chart — the distinct, on-theme per-Pillar asterisms:
//       Purpose = 4-point compass star (✦) · Connection = heart · Creator Mindset = spark burst
//       Life Skills = sprout (stem + two leaves) · Academics = the W / Cassiopeia (doubles as open book).
//
// Each asterism is drawn as STARS (points) + EDGES (explicit pairs of star indices — NOT connect-in-order),
// so a shape can branch, close a loop, or radiate from a hub. Coordinates live in a local 0..100 box.

// Canonical Pillar colors (spec §2.3, LOCKED in the page-spec §0).
//   `color`     = the disc --base (the Pillar's identity color).
//   `starColor` = the --lt (light-cap) variant; brighter on a dark sky, so stars read against dusk.
// The spec says "in each Pillar's color" — both are that Pillar's color; starColor is the legible one
// on the Star-Chart's dark sky, `color` is the flat identity swatch (used on light backgrounds / labels).

// White line-glyph icons (stroke = currentColor) so every constellation carries its icon label,
// not hue alone (§0 rule 4). Same glyph family as the disc faces.
export const ICONS = {
  // compass-star ✦ — Purpose
  star:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 7.1L21.5 12l-7.1 2.4L12 22l-2.4-7.6L2.5 12l7.1-2.9z"/></svg>',
  heart:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 7a3.5 3.5 0 0 1 7 3.5C19 15.5 12 20 12 20z"/></svg>',
  // spark burst — Creator Mindset
  spark:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v5M12 17v5M2 12h5M17 12h5M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3"/></svg>',
  sprout:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20v-7"/><path d="M12 13c0-3-2-5-6-5 0 3 2 5 6 5z"/><path d="M12 11c0-2.5 2-4.5 6-4.5 0 2.7-2 4.5-6 4.5z"/></svg>',
  // open book (also the W / Cassiopeia read) — Academics
  book:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v16h5.5A2.5 2.5 0 0 1 20 21.5z"/></svg>',
};

// The five asterisms. `stars` = [x,y] points in a 0..100 local box. `edges` = explicit [i,j] index
// pairs into `stars`. `lead` = the index of the anchor/brightest star (rendered a touch larger).
// top-of-pyramid (Academics) → base (Purpose) is the pillar order; here they are keyed, order-independent.
export const ASTERISMS = [
  {
    key: 'purpose',
    name: 'PURPOSE',
    pillar: 'Purpose',
    color: '#E01230',
    starColor: '#F13B52',
    icon: 'star',
    // 4-point compass star (✦): 4 outer tips (N/E/S/W) + 4 inner notches → a pinched 4-pointed star.
    // Center star is the hub the tips echo North from. Edges trace the star silhouette (closed).
    stars: [
      [50, 50], // 0 center (hub / North)
      [50, 6],  // 1 N tip
      [64, 36], // 2 NE notch
      [94, 50], // 3 E tip
      [64, 64], // 4 SE notch
      [50, 94], // 5 S tip
      [36, 64], // 6 SW notch
      [6, 50],  // 7 W tip
      [36, 36], // 8 NW notch
    ],
    edges: [
      [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 1], // star outline
      [0, 1], [0, 3], [0, 5], [0, 7], // cardinal rays to hub (the compass rose)
    ],
    lead: 0,
  },
  {
    key: 'connection',
    name: 'CONNECTION',
    pillar: 'Connection',
    color: '#7A3E9D',
    starColor: '#B078D0',
    icon: 'heart',
    // Heart — a CLOSED loop (this is why connect-in-order is not enough; the last star closes to the first).
    // Two top lobes meeting at a cleft, tapering to a bottom point.
    stars: [
      [50, 24], // 0 cleft (between the two lobes)
      [34, 12], // 1 left lobe crown
      [16, 28], // 2 left shoulder
      [26, 52], // 3 left lower curve
      [50, 82], // 4 bottom point
      [74, 52], // 5 right lower curve
      [84, 28], // 6 right shoulder
      [66, 12], // 7 right lobe crown
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0], // closed heart outline
    ],
    lead: 4,
  },
  {
    key: 'creator',
    name: 'CREATOR MINDSET',
    pillar: 'Creator Mindset',
    color: '#F5A623',
    starColor: '#FBC259',
    icon: 'spark',
    // Spark burst — rays radiating from a central star (a HUB, not a chain: every edge is center→tip).
    // Alternating long (cardinal) / short (diagonal) tips give the twinkle-burst read.
    stars: [
      [50, 50], // 0 center hub
      [50, 6],  // 1 N  (long)
      [72, 28], // 2 NE (short)
      [94, 50], // 3 E  (long)
      [72, 72], // 4 SE (short)
      [50, 94], // 5 S  (long)
      [28, 72], // 6 SW (short)
      [6, 50],  // 7 W  (long)
      [28, 28], // 8 NW (short)
    ],
    edges: [
      [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8], // rays from the hub
    ],
    lead: 0,
  },
  {
    key: 'lifeskills',
    name: 'LIFE SKILLS',
    pillar: 'Life Skills',
    color: '#1CA08D',
    starColor: '#3FC0AD',
    icon: 'sprout',
    // Sprout — a vertical stem with two leaves branching from the mid-node (a BRANCH, not a line:
    // three edges leave the mid-star). On-theme: growth/practice.
    stars: [
      [50, 92], // 0 stem base (root)
      [50, 52], // 1 mid-node (where leaves branch)
      [50, 16], // 2 stem tip (crown)
      [20, 38], // 3 left leaf tip
      [80, 34], // 4 right leaf tip
    ],
    edges: [
      [0, 1], [1, 2], // the stem
      [1, 3], [1, 4], // the two leaves
    ],
    lead: 2,
  },
  {
    key: 'academics',
    name: 'ACADEMICS',
    pillar: 'Academics',
    color: '#EE6C2B',
    starColor: '#F79457',
    icon: 'book',
    // The W — Cassiopeia, a real night-sky constellation, drawn open so it doubles as an open book
    // (two pages meeting at the raised center spine). Explicit chain 0-1-2-3-4 (given as edges, not order).
    stars: [
      [8, 24],  // 0 far-left top
      [30, 66], // 1 left valley
      [50, 30], // 2 center spine (raised — the book's fold)
      [70, 66], // 3 right valley
      [92, 24], // 4 far-right top
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 4], // the W / open-book outline
    ],
    lead: 2,
  },
];

// Look an asterism up by key.
export function getAsterism(key) {
  return ASTERISMS.find((a) => a.key === key) || null;
}

// Build ONE asterism as an inline-SVG STRING (stars = dots, edges = lines). Static art — any motion
// (twinkle, fade-in) is applied by the host via CSS on opacity/transform only, and must fall back to a
// static end-frame under prefers-reduced-motion (§0 rules 2 & 3). This function never animates anything.
//
// opts: { size=110, stroke=1, dot=1.9, leadDot=2.7, edgeOpacity=0.6, onDark=true, viewBox='0 0 100 100' }
//   onDark=true uses starColor (bright, for the dark Star-Chart sky); false uses color (flat identity).
export function asterismSVG(key, opts = {}) {
  const a = getAsterism(key);
  if (!a) return '';
  const {
    size = 110,
    stroke = 1,
    dot = 1.9,
    leadDot = 2.7,
    edgeOpacity = 0.6,
    onDark = true,
    viewBox = '0 0 100 100',
  } = opts;
  const col = onDark ? a.starColor : a.color;

  const lines = a.edges
    .map(([i, j]) => {
      const [x1, y1] = a.stars[i];
      const [x2, y2] = a.stars[j];
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${stroke}" stroke-linecap="round" opacity="${edgeOpacity}"/>`;
    })
    .join('');

  const dots = a.stars
    .map((p, idx) => {
      const r = idx === a.lead ? leadDot : dot;
      return `<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="${col}"/>`;
    })
    .join('');

  return `<svg class="asterism" data-pillar="${a.key}" width="${size}" height="${size}" viewBox="${viewBox}" role="img" aria-label="${a.pillar} constellation">${lines}${dots}</svg>`;
}

// Build ALL five as an array of { asterism, svg } — convenience for a Star-Chart layer or the preview.
export function allAsterismSVG(opts = {}) {
  return ASTERISMS.map((a) => ({ asterism: a, svg: asterismSVG(a.key, opts) }));
}
