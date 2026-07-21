// Life Compass - reflection-only whole-life frame shown above the goal boxes.
// ONE fixed four-region map for every learner: Self / Others / Making / World,
// with Voice (sovereignty) at the center. No ratings or scores - reflection only.
// The tiered per-studio "grows with the child" wheel it replaced was retired
// 2026-07-21; a legacy-label shim (LEGACY_TO_REGION, below) keeps existing goals
// mapped to their region so none orphan.
// Ref: docs/design/2026-07-20-four-region-compass-mapping-v1.md

// The five fixed regions - one shared map for every learner. Voice is the
// sovereign center; it also holds "becoming" goals.
export const COMPASS_REGIONS = ['Self', 'Others', 'Making', 'World', 'Voice'];
const REGION_SET = new Set(COMPASS_REGIONS.map((r) => r.toLowerCase()));
// Old tiered wheel-area label (lowercased) -> new region. The compatibility shim
// so existing goals (keyed by the old area) resolve to their region and never
// orphan. Ratified 2026-07-20 (Accord / Jake / TCC).
const LEGACY_TO_REGION = {
  movement: 'Self', heart: 'Self', emotions: 'Self', joy: 'Self', play: 'Self', fun: 'Self', time: 'Self',
  family: 'Others', friends: 'Others', home: 'Others', partner: 'Others',
  money: 'Making', finances: 'Making', career: 'Making', calling: 'Making',
  mind: 'World', learning: 'World',
  spirit: 'Voice',
};
// A legacy or region area label -> its region label. Unknown labels pass through.
export function regionForLabel(label) {
  if (!label) return null;
  const k = String(label).trim().toLowerCase();
  if (REGION_SET.has(k)) return COMPASS_REGIONS.find((r) => r.toLowerCase() === k);
  return LEGACY_TO_REGION[k] || label;
}
// A legacy or region slice-category id -> its region id. Non-slice ids (academic
// categories) and unknown slice ids pass through unchanged.
export function regionIdForCategory(categoryId) {
  if (typeof categoryId !== 'string' || !categoryId.startsWith('slice_')) return categoryId;
  const key = categoryId.slice(6);
  if (REGION_SET.has(key)) return categoryId;
  const region = LEGACY_TO_REGION[key];
  return region ? 'slice_' + region.toLowerCase() : categoryId;
}

// ── Task colour system (captain 2026-07-21) ──────────────────────────────────
// One hue per compass region; three shades per hue by task "band":
//   recurring  -> a light tint of the region colour
//   weekly     -> the region colour itself (a weekly milestone)
//   milestone  -> a darker shade (a milestone marker)
// Hue = which part of life the task serves; shade = how load-bearing it is. The
// values match the compass SVG (Self/Making/World/Others) + the Voice gold accent.
export const REGION_COLORS = {
  Self:   '#8f5e14',
  Making: '#3f8a5f',
  World:  '#35608f',
  Others: '#c4634a',
  Voice:  '#c99a3b',
};

function hexToRgb(hex) {
  const h = String(hex).replace('#', '');
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}
function rgbToHex(r, g, b) {
  const c = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}
// Mix `hex` toward `target` by amt (0..1).
function mix(hex, target, amt) {
  const a = hexToRgb(hex), b = hexToRgb(target);
  return rgbToHex(a.r + (b.r - a.r) * amt, a.g + (b.g - a.g) * amt, a.b + (b.b - a.b) * amt);
}

export function regionColor(region) {
  return REGION_COLORS[regionForLabel(region)] || null;
}

// The three bands. Order = ascending weight, used for sorting by importance too.
export const TASK_BANDS = ['recurring', 'weekly', 'milestone'];

// Resolve a task's band. Explicit task.band wins; a legacy "rhythm" shape reads as
// recurring; otherwise null (an uncoloured plain task).
export function taskBand(task) {
  if (task && TASK_BANDS.includes(task.band)) return task.band;
  if (task && task.shape === 'rhythm') return 'recurring';
  return null;
}

// Resolve a task's region from (in order) an explicit region, its lifeArea, or a
// slice_ categoryId. Returns a canonical region label or null.
export function taskRegion(task) {
  if (!task) return null;
  if (task.region && REGION_COLORS[regionForLabel(task.region)]) return regionForLabel(task.region);
  if (task.lifeArea) { const r = regionForLabel(task.lifeArea); if (REGION_COLORS[r]) return r; }
  if (typeof task.categoryId === 'string' && task.categoryId.startsWith('slice_')) {
    const r = regionForLabel(task.categoryId.slice(6));
    if (REGION_COLORS[r]) return r;
  }
  return null;
}

// The rendered colours for a task chip: { bg, border, fg } or null when the task
// has no region (rendered neutral by callers). fg is chosen for contrast.
export function taskColorStyle(task) {
  const region = taskRegion(task);
  if (!region) return null;
  const base = REGION_COLORS[region];
  const band = taskBand(task);
  // Voice/Spirit reads WHITE (the sovereign centre is cream, not a solid hue). A white
  // chip can't hue-shade and would clash with Self's gold, so Voice keeps a cream fill and
  // shows the band on a gold-family accent border + text instead. (Captain 2026-07-21.)
  if (region === 'Voice') {
    const accent = band === 'recurring' ? '#d9c48f' : band === 'milestone' ? '#9c7a2e' : '#c99a3b';
    return { bg: '#f6f1e7', border: accent, fg: '#6b5320' };
  }
  if (band === 'recurring') return { bg: mix(base, '#ffffff', 0.78), border: base, fg: mix(base, '#000000', 0.25) };
  if (band === 'milestone') { const dark = mix(base, '#000000', 0.34); return { bg: dark, border: dark, fg: '#ffffff' }; }
  // weekly (or plain-with-region) = the region colour itself.
  return { bg: base, border: base, fg: '#ffffff' };
}

// The life-area slices for goal grouping - the five fixed compass regions, one
// shared map for every learner. (Any `studio` arg passed by callers is legacy
// and ignored: every tier holds the same compass now.)
export function getWheelAreas() {
  return COMPASS_REGIONS;
}

// The fixed four-region compass (Self / Others / Making / World + Voice). ONE
// shared map for everyone - not per-studio. Cardinal-centered slices (Self=N,
// Making=E, World=S, Others=W) with the sovereign Voice center. Rendered in the
// standard 340 box so it drops straight into the #life-wheel container.
function lifeCompassSvg() {
  const cx = 170, cy = 170, R = 132, hub = 44;
  const d = R * 0.7071;
  const NW = [cx - d, cy - d], NE = [cx + d, cy - d], SE = [cx + d, cy + d], SW = [cx - d, cy + d];
  const seg = (a, b, fill) =>
    `<path d="M ${cx} ${cy} L ${a[0].toFixed(1)} ${a[1].toFixed(1)} A ${R} ${R} 0 0 1 ${b[0].toFixed(1)} ${b[1].toFixed(1)} Z" fill="${fill}"/>`;
  const segs =
    seg(NW, NE, '#8f5e14') + // Self  (North)
    seg(NE, SE, '#3f8a5f') + // Making (East)
    seg(SE, SW, '#35608f') + // World (South)
    seg(SW, NW, '#c4634a');  // Others (West)
  const div = (p) => `<line x1="${cx}" y1="${cy}" x2="${p[0].toFixed(1)}" y2="${p[1].toFixed(1)}" stroke="#fbf9f4" stroke-width="2"/>`;
  const dividers = div(NW) + div(NE) + div(SE) + div(SW);
  const name = (x, y, t) => `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="15" font-weight="700" fill="#fff">${t}</text>`;
  const motion = (x, y, t) => `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="6.5" font-weight="700" letter-spacing="1.5" fill="#fff" fill-opacity="0.78">${t}</text>`;
  const labels =
    name(170, 86, 'SELF')    + motion(170, 99, 'INWARD') +
    name(256, 164, 'MAKING') + motion(256, 177, 'ONWARD') +
    name(170, 250, 'WORLD')  + motion(170, 263, 'OUTWARD') +
    name(84, 164, 'OTHERS')  + motion(84, 177, 'TOGETHER');
  return `<svg viewBox="0 0 340 340" class="life-wheel-svg" role="img" aria-label="Your life compass: Self, Others, Making, World, and Voice at the center">
    ${segs}
    ${dividers}
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#fbf9f4" stroke-width="2.5"/>
    ${labels}
    <circle cx="${cx}" cy="${cy}" r="${hub}" fill="#f6f1e7" stroke="#c99a3b" stroke-width="2"/>
    <text x="${cx}" y="${cy - 6}" text-anchor="middle" dominant-baseline="middle" font-size="12" font-weight="700" fill="#3a342a">VOICE</text>
    <text x="${cx}" y="${cy + 8}" text-anchor="middle" dominant-baseline="middle" font-size="6.5" font-weight="700" letter-spacing="1" fill="#8a6d2e">SOVEREIGNTY</text>
  </svg>`;
}

// The compass SVG as a string, for inlining elsewhere (e.g. pinned atop the
// onboarding telescope, or in the Growth Record).
export function lifeWheelSvgFor() {
  return lifeCompassSvg();
}

// Render the compass into #life-wheel. One shared four-region map for every
// learner - Self / Others / Making / World, with Voice at the center.
export function renderLifeWheel() {
  const el = document.getElementById('life-wheel');
  if (!el) return;
  el.hidden = false;
  el.innerHTML = `
    <p class="life-wheel-prompt">Four directions, one voice at the center. Point your needle where you're growing - every direction is yours, none a box to fill.</p>
    ${lifeCompassSvg()}
  `;
}
