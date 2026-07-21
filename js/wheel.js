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

// The Vibrant Life Compass (Self / Others / Making / World around a sovereign
// Voice center). ONE shared map for everyone - not per-studio. Cardinal-centered
// 90-degree slices (Self=N, Making=E, World=S, Others=W), a tick bezel, the
// learner's needle, per-region icon + question + LIFE/GROWS pair, and the
// "author your own life" center. Scalable via viewBox so it drops into the
// #life-wheel container at any size. Matches design v5 (2026-07-21).
function lifeCompassSvg() {
  const cx = 360, cy = 408, R = 272, hub = 92;
  const d = R * 0.7071;
  const NW = [cx - d, cy - d], NE = [cx + d, cy - d], SE = [cx + d, cy + d], SW = [cx - d, cy + d];
  const seg = (a, b, fill) =>
    `<path d="M ${cx} ${cy} L ${a[0].toFixed(1)} ${a[1].toFixed(1)} A ${R} ${R} 0 0 1 ${b[0].toFixed(1)} ${b[1].toFixed(1)} Z" fill="${fill}"/>`;
  const segs =
    seg(NW, NE, '#8f5e14') + // Self   (North)
    seg(NE, SE, '#3f8a5f') + // Making (East)
    seg(SE, SW, '#35608f') + // World  (South)
    seg(SW, NW, '#c4634a');  // Others (West)

  // Tick bezel around the colored circle (major tick at each cardinal).
  let ticks = '';
  for (let i = 0; i < 72; i++) {
    const ang = i * 5 * Math.PI / 180;
    const major = i % 18 === 0;
    const r1 = R + 8, r2 = R + (major ? 26 : 17);
    const sx = Math.sin(ang), cyv = Math.cos(ang);
    ticks += `<line x1="${(cx + r1 * sx).toFixed(1)}" y1="${(cy - r1 * cyv).toFixed(1)}" x2="${(cx + r2 * sx).toFixed(1)}" y2="${(cy - r2 * cyv).toFixed(1)}" stroke="#b8ac93" stroke-width="${major ? 2.4 : 1}"/>`;
  }

  const divLine = (p) => `<line x1="${cx}" y1="${cy}" x2="${p[0].toFixed(1)}" y2="${p[1].toFixed(1)}" stroke="#fbf9f4" stroke-width="3"/>`;
  const dividers = divLine(NW) + divLine(NE) + divLine(SE) + divLine(SW);

  // Text helper.
  const t = (x, y, s, o = {}) => {
    const { size = 15, weight = 400, fill = '#ffffff', ls = 0, italic = false, op = 1 } = o;
    return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="${size}" font-weight="${weight}" fill="${fill}" fill-opacity="${op}" letter-spacing="${ls}"${italic ? ' font-style="italic"' : ''}>${s}</text>`;
  };
  // LIFE·/GROWS· two-tone line (bold key, regular value).
  const lg = (x, y, key, val) =>
    `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="13" fill="#ffffff"><tspan font-weight="700">${key}</tspan> · ${val}</text>`;

  // Simple white region glyphs.
  const personIcon = (x, y) => `<g stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"><circle cx="${x}" cy="${y - 6}" r="6"/><path d="M ${x - 10} ${y + 10} a 10 10 0 0 1 20 0"/></g>`;
  const twoPeopleIcon = (x, y) => `<g stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"><circle cx="${x - 8}" cy="${y - 5}" r="5"/><path d="M ${x - 17} ${y + 9} a 9 9 0 0 1 18 0"/><circle cx="${x + 8}" cy="${y - 5}" r="5"/><path d="M ${x - 1} ${y + 9} a 9 9 0 0 1 18 0"/></g>`;
  const bulbIcon = (x, y) => `<g stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"><circle cx="${x}" cy="${y - 3}" r="7"/><line x1="${x - 4}" y1="${y + 7}" x2="${x + 4}" y2="${y + 7}"/><line x1="${x - 3}" y1="${y + 11}" x2="${x + 3}" y2="${y + 11}"/></g>`;
  const globeIcon = (x, y) => `<g stroke="#fff" stroke-width="2.2" fill="none"><circle cx="${x}" cy="${y}" r="9"/><ellipse cx="${x}" cy="${y}" rx="4" ry="9"/><line x1="${x - 9}" y1="${y}" x2="${x + 9}" y2="${y}"/></g>`;

  // The learner's needle: red toward Self, grey toward World, emerging from the hub.
  const needle =
    `<polygon points="${cx},${cy - 150} ${cx - 5},${cy - hub} ${cx + 5},${cy - hub}" fill="#b0472e"/>` +
    `<polygon points="${cx},${cy + 150} ${cx - 5},${cy + hub} ${cx + 5},${cy + hub}" fill="#b9b2a3"/>`;
  const northArrow = `<polygon points="${cx},${cy - R - 48} ${cx - 9},${cy - R - 24} ${cx + 9},${cy - R - 24}" fill="#2a2a24"/>`;

  const self =
    personIcon(cx, 178) +
    t(cx, 214, 'SELF', { size: 34, weight: 800 }) +
    t(cx, 238, 'INWARD', { size: 13, ls: 3, op: 0.85 }) +
    t(cx, 264, 'How do I know and steady myself?', { size: 15, italic: true }) +
    lg(cx, 290, 'LIFE', 'Health') + lg(cx, 309, 'GROWS', 'Mindset');
  const making =
    bulbIcon(cx + 182, 350) +
    t(cx + 182, 390, 'MAKING', { size: 32, weight: 800 }) +
    t(cx + 182, 414, 'ONWARD', { size: 13, ls: 3, op: 0.85 }) +
    t(cx + 182, 440, 'What do I make and provide?', { size: 12, italic: true }) +
    lg(cx + 182, 466, 'LIFE', 'Provision') + lg(cx + 182, 485, 'GROWS', 'Craft');
  const world =
    lg(cx, 508, 'LIFE', 'Learning') + lg(cx, 527, 'GROWS', 'Knowledge') +
    t(cx, 552, 'How do I understand the world?', { size: 14, italic: true }) +
    t(cx, 578, 'OUTWARD', { size: 13, ls: 3, op: 0.85 }) +
    t(cx, 612, 'WORLD', { size: 34, weight: 800 }) +
    globeIcon(cx, 648);
  const others =
    twoPeopleIcon(cx - 182, 350) +
    t(cx - 182, 390, 'OTHERS', { size: 32, weight: 800 }) +
    t(cx - 182, 414, 'TOGETHER', { size: 13, ls: 3, op: 0.85 }) +
    t(cx - 182, 440, 'How do I love and work with others?', { size: 12, italic: true }) +
    lg(cx - 182, 466, 'LIFE', 'Relationships') + lg(cx - 182, 485, 'GROWS', 'Empathy');

  const center =
    `<circle cx="${cx}" cy="${cy}" r="${hub}" fill="#f6f1e7" stroke="#c99a3b" stroke-width="3"/>` +
    t(cx, cy - 16, 'VOICE', { size: 28, weight: 800, fill: '#3a342a' }) +
    t(cx, cy + 8, 'SOVEREIGNTY', { size: 12, weight: 700, ls: 2, fill: '#b8892f' }) +
    t(cx, cy + 30, 'author your own life', { size: 12, italic: true, fill: '#8a7a5f' });

  return `<svg viewBox="0 0 720 792" class="life-wheel-svg" role="img" aria-label="The Vibrant Life Compass: Self inward, Making onward, World outward, Others together, with Voice and sovereignty at the center">
    <rect x="0" y="0" width="720" height="792" fill="#fbf9f4"/>
    ${t(cx, 42, 'The Vibrant Life Compass', { size: 30, weight: 800, fill: '#2f2a20' })}
    ${t(cx, 70, 'four ways of growing - one sovereign center', { size: 15, italic: true, fill: '#7a7060' })}
    ${northArrow}
    <circle cx="${cx}" cy="${cy}" r="${R + 34}" fill="none" stroke="#ded3bd" stroke-width="1.5"/>
    ${ticks}
    ${segs}
    ${dividers}
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#fbf9f4" stroke-width="3"/>
    ${needle}
    ${self}${making}${world}${others}
    ${center}
    ${t(cx, 776, "Working draft - the needle is the learner's. We evoke, we never extract.", { size: 12, italic: true, fill: '#9a8f7c' })}
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
