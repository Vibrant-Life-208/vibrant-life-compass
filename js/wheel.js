// Wheel of Life - reflection-only whole-life frame shown above the goal boxes.
// It GROWS WITH THE CHILD: the youngest see a few concrete areas; the ring fills
// and the words mature toward the full adult 12 as they age. Same wheel, gaining
// dimensions year over year. No ratings or scores - reflection only.
// (Captain design 2026-07-09; evolved from the guide-only 12-area wheel.)

// Per-studio area sets. Each developmental stage adds areas and matures wording
// (Play->Fun->Joy, Heart->Emotions, Learning->Mind, Calling->Career). Abstract
// areas appear only when a person can hold them (Spirit/Mind mid-childhood;
// Time/Money/Calling adolescence; Partner/Finances/Career adulthood).
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

// The wheel SVG for a studio as a string, for inlining elsewhere (e.g. pinned
// atop the onboarding telescope). Same age-appropriate ring as renderLifeWheel.
export function lifeWheelSvgFor(studio) {
  return lifeWheelSvg(getWheelAreas(studio));
}

// Render the wheel for the given studio into #life-wheel. Every tier gets its own
// age-appropriate ring. Pass studio (string); unknown studios get the adult ring.
export function renderLifeWheel(studio) {
  const el = document.getElementById('life-wheel');
  if (!el) return;
  const areas = getWheelAreas(studio);
  el.hidden = false;
  el.innerHTML = `
    <p class="life-wheel-prompt">Hold your whole life in view. All of these matter - as you set your goals, tend them together.</p>
    ${lifeWheelSvg(areas)}
  `;
}
