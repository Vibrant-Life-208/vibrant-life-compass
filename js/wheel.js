// Wheel of Life - reflection-only whole-life frame shown above the goal boxes.
// It GROWS WITH THE CHILD: the youngest see a few concrete areas; the ring fills
// and the words mature toward the full adult 12 as they age. Same wheel, gaining
// dimensions year over year. No ratings or scores - reflection only.
// (Captain design 2026-07-09; evolved from the guide-only 12-area wheel.)

// Per-studio area sets. Each developmental stage adds areas and matures wording
// (Play->Fun->Joy, Heart->Emotions, Learning->Mind, Calling->Career). Abstract
// areas appear only when a person can hold them (Spirit/Mind mid-childhood;
// Time/Money/Calling adolescence; Partner/Finances/Career adulthood).
// FLAG (2026-07-20): the fixed four-region compass. Set false to restore the
// tiered Wheel of Life below. Step 1 = the draw; step 2 = the taxonomy (goal
// categories become the regions, with a legacy-id shim so no existing goal
// orphans; the DB rewrite is deferred to the last step).
// Ref: docs/design/2026-07-20-four-region-compass-mapping-v1.md
export const COMPASS_V2 = true;

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
  if (band === 'recurring') return { bg: mix(base, '#ffffff', 0.78), border: base, fg: mix(base, '#000000', 0.25) };
  if (band === 'milestone') { const dark = mix(base, '#000000', 0.34); return { bg: dark, border: dark, fg: '#ffffff' }; }
  // weekly (or plain-with-region) = the region colour itself.
  return { bg: base, border: base, fg: '#ffffff' };
}

const WHEEL_TIERS = {
  sparks:         ['Movement', 'Heart', 'Family', 'Play'],
  discovery:      ['Movement', 'Learning', 'Heart', 'Family', 'Friends', 'Fun'],
  adventure:      ['Movement', 'Mind', 'Spirit', 'Emotions', 'Family', 'Friends', 'Home', 'Joy'],
  launchpad:      ['Movement', 'Mind', 'Spirit', 'Time', 'Emotions', 'Joy', 'Family', 'Friends', 'Home', 'Money', 'Calling'],
  'guide-summer': ['Movement', 'Mind', 'Spirit', 'Time', 'Joy', 'Emotions', 'Family', 'Friends', 'Partner', 'Home', 'Finances', 'Career'],
};
// Adults/guides (and any non-learner-tier profile) hold the full 12.
const ADULT_AREAS = WHEEL_TIERS['guide-summer'];

// Which areas belong to this studio's wheel. Unknown/null studios default to the
// full adult ring - "hold your whole life in view" is never wrong for an adult.
export function getWheelAreas(studio) {
  if (COMPASS_V2) return COMPASS_REGIONS;
  return WHEEL_TIERS[studio] || ADULT_AREAS;
}

function polar(cx, cy, r, angleDeg) {
  const a = (angleDeg - 90) * Math.PI / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

// Adult wheel (12 areas) leader callouts. Its 30-degree slices are too narrow for
// the long words, so those move outside the ring on a leader line while the short
// words stay inside. Coordinates authored in the 340-space (cx=cy=170, R=132) and
// approved by captain via the 2026-07-18 prototype: Finances/Friends run straight
// horizontal (meeting mid-color); Movement is an up-corner to the right, Career an
// up-corner to the left; Emotions a down-corner to the right, Family a down-corner
// to the left. Adult and Launchpad are authored; the child wheels (<=8 areas) fit
// inside and use no callouts.
const ADULT_LEADER_COLOR = '#3a3524';
const ADULT_LEADERS = {
  Movement: { pts: [[195, 72], [224, 44], [242, 30]],    label: [245, 29],  anchor: 'start' },
  Career:   { pts: [[145, 78], [118, 50], [100, 40]],    label: [97, 39],   anchor: 'end'   },
  Emotions: { pts: [[195, 262], [222, 290], [240, 300]], label: [243, 301], anchor: 'start' },
  Family:   { pts: [[145, 268], [118, 296], [100, 308]], label: [97, 309],  anchor: 'end'   },
  Finances: { pts: [[104, 100], [40, 100]],              label: [36, 100],  anchor: 'end'   },
  Friends:  { pts: [[104, 240], [40, 240]],              label: [36, 240],  anchor: 'end'   },
};
// Launchpad (11 areas). Lined: Movement (up-right), Calling (up-left), Money
// (horizontal left, upper), Emotions (down-right), Family (down-left), Friends
// (horizontal left, lower). Mind/Time/Joy/Home/Spirit stay inside. (Captain
// 2026-07-18 prototype.)
const LAUNCHPAD_LEADERS = {
  Movement: { pts: [[197, 74], [226, 46], [244, 32]],    label: [247, 31],  anchor: 'start' },
  Calling:  { pts: [[143, 74], [114, 46], [96, 32]],     label: [93, 31],   anchor: 'end'   },
  Money:    { pts: [[104, 104], [36, 104]],              label: [32, 104],  anchor: 'end'   },
  Emotions: { pts: [[219, 246], [238, 286], [248, 300]], label: [251, 301], anchor: 'start' },
  Family:   { pts: [[121, 246], [102, 286], [92, 300]],  label: [89, 301],  anchor: 'end'   },
  Friends:  { pts: [[96, 204], [34, 204]],               label: [30, 204],  anchor: 'end'   },
};
// Which authored leader set (if any) applies to this wheel. Finances marks the
// adult set; Calling marks Launchpad - each appears only in its own tier.
function leaderSetFor(areas) {
  if (areas.length === 12 && areas.includes('Finances')) return ADULT_LEADERS;
  if (areas.length === 11 && areas.includes('Calling')) return LAUNCHPAD_LEADERS;
  return null;
}

function lifeWheelSvg(areas) {
  const cx = 170, cy = 170, R = 132, hub = 30;
  const n = areas.length, step = 360 / n;
  // Brighter, more saturated tints so the wheel reads clearly (captain 2026-07-14
  // - the near-white pastels were hard to see).
  const tints = ['#bcd49a', '#a2c5d6', '#e6c986', '#c6a8db', '#9fd4ba', '#dcabb0'];
  // Per-label horizontal nudge (px in the 340 viewBox) for labels that read
  // better shifted off dead-center. (Captain 2026-07-14.)
  const LABEL_NUDGE_X = { Heart: 8, Family: -8, Joy: -8, Movement: 8, Fun: -8 };
  // The adult and Launchpad wheels use authored leader callouts for their long
  // words; every other wheel keeps all labels inside their (wider) slices.
  const leaderSet = leaderSetFor(areas);
  const useLeaders = !!leaderSet;
  let segs = '', labels = '', leaders = '';
  areas.forEach((label, i) => {
    const a0 = i * step, a1 = (i + 1) * step;
    const [x0, y0] = polar(cx, cy, R, a0);
    const [x1, y1] = polar(cx, cy, R, a1);
    const [hx0, hy0] = polar(cx, cy, hub, a0);
    const [hx1, hy1] = polar(cx, cy, hub, a1);
    segs += `<path d="M ${hx0.toFixed(1)} ${hy0.toFixed(1)} L ${x0.toFixed(1)} ${y0.toFixed(1)} A ${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} L ${hx1.toFixed(1)} ${hy1.toFixed(1)} A ${hub} ${hub} 0 0 0 ${hx0.toFixed(1)} ${hy0.toFixed(1)} Z" fill="${tints[i % tints.length]}" stroke="#fff" stroke-width="1.5"/>`;
    const spec = leaderSet ? leaderSet[label] : null;
    if (spec) {
      // Long word: a darker leader line starts inside the colored slice and runs
      // out to a label outside the ring.
      leaders += `<polyline points="${spec.pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${ADULT_LEADER_COLOR}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>`;
      labels += `<text x="${spec.label[0]}" y="${spec.label[1]}" text-anchor="${spec.anchor}" dominant-baseline="middle" font-size="16" font-weight="700" fill="#2f3a24">${label}</text>`;
    } else {
      // Short word: label sits inside its slice (0.63 R). Child-wheel nudges only.
      const [lx, ly] = polar(cx, cy, R * 0.63, a0 + step / 2);
      const nx = lx + (useLeaders ? 0 : (LABEL_NUDGE_X[label] || 0));
      labels += `<text x="${nx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="18" font-weight="700" fill="#2f3a24">${label}</text>`;
    }
  });
  // The adult wheel needs a wider box for the outside labels; every other wheel
  // stays the square 340 box it has always used.
  const viewBox = useLeaders ? '-60 10 434 322' : '0 0 340 340';
  return `<svg viewBox="${viewBox}" class="life-wheel-svg" role="img" aria-label="Wheel of your life areas">
    ${segs}
    ${leaders}
    ${labels}
    <circle cx="${cx}" cy="${cy}" r="${hub}" fill="#fff" stroke="#cdbfa6" stroke-width="1.5"/>
    <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="#8a8a80">your life</text>
  </svg>`;
}

// The fixed four-region compass (Self / Others / Making / World + Voice). ONE
// shared map for everyone - not per-studio. Cardinal-centered slices (Self=N,
// Making=E, World=S, Others=W) with the sovereign Voice center. Rendered in the
// same 340 box as the old wheel so it drops into the same container.
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

// The wheel SVG for a studio as a string, for inlining elsewhere (e.g. pinned
// atop the onboarding telescope). Under COMPASS_V2 this is the fixed compass.
export function lifeWheelSvgFor(studio) {
  return COMPASS_V2 ? lifeCompassSvg() : lifeWheelSvg(getWheelAreas(studio));
}

// Render the wheel for the given studio into #life-wheel. Every tier gets its own
// age-appropriate ring. Pass studio (string); unknown studios get the adult ring.
export function renderLifeWheel(studio) {
  const el = document.getElementById('life-wheel');
  if (!el) return;
  el.hidden = false;
  if (COMPASS_V2) {
    el.innerHTML = `
    <p class="life-wheel-prompt">Four directions, one voice at the center. Point your needle where you're growing - every direction is yours, none a box to fill.</p>
    ${lifeCompassSvg()}
  `;
    return;
  }
  const areas = getWheelAreas(studio);
  el.innerHTML = `
    <p class="life-wheel-prompt">Hold your whole life in view. All of these matter - as you set your goals, tend them together.</p>
    ${lifeWheelSvg(areas)}
  `;
}
