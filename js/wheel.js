// Wheel of Life - reflection-only whole-life frame shown above the goal boxes.
// It GROWS WITH THE CHILD: the youngest see a few concrete areas; the ring fills
// and the words mature toward the full adult 12 as they age. Same wheel, gaining
// dimensions year over year. No ratings or scores - reflection only.
// (Captain design 2026-07-09; evolved from the guide-only 12-area wheel.)

// Per-studio area sets. Each developmental stage adds areas and matures wording
// (Play->Joy, Heart->Emotions, Learning->Mind, Calling->Career). Abstract
// areas appear only when a person can hold them (Spirit/Mind mid-childhood;
// Time/Money/Calling adolescence; Partner/Finances/Career adulthood).
const WHEEL_TIERS = {
  sparks:         ['Body', 'Heart', 'Family', 'Play'],
  discovery:      ['Body', 'Learning', 'Heart', 'Family', 'Friends', 'Joy'],
  adventure:      ['Body', 'Mind', 'Spirit', 'Emotions', 'Family', 'Friends', 'Home', 'Joy'],
  launchpad:      ['Body', 'Mind', 'Spirit', 'Time', 'Emotions', 'Joy', 'Family', 'Friends', 'Home', 'Money', 'Calling'],
  'guide-summer': ['Body', 'Mind', 'Spirit', 'Time', 'Joy', 'Emotions', 'Family', 'Friends', 'Partner', 'Home', 'Finances', 'Career'],
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

function lifeWheelSvg(areas) {
  const cx = 170, cy = 170, R = 132, hub = 30;
  const n = areas.length, step = 360 / n;
  // Brighter, more saturated tints so the wheel reads clearly (captain 2026-07-14
  // - the near-white pastels were hard to see).
  const tints = ['#bcd49a', '#a2c5d6', '#e6c986', '#c6a8db', '#9fd4ba', '#dcabb0'];
  // Per-label horizontal nudge (px in the 340 viewBox) for labels that read
  // better shifted off dead-center. (Captain 2026-07-14.)
  const LABEL_NUDGE_X = { Heart: 8, Family: -8, Joy: -8 };
  let segs = '', labels = '';
  areas.forEach((label, i) => {
    const a0 = i * step, a1 = (i + 1) * step;
    const [x0, y0] = polar(cx, cy, R, a0);
    const [x1, y1] = polar(cx, cy, R, a1);
    const [hx0, hy0] = polar(cx, cy, hub, a0);
    const [hx1, hy1] = polar(cx, cy, hub, a1);
    segs += `<path d="M ${hx0.toFixed(1)} ${hy0.toFixed(1)} L ${x0.toFixed(1)} ${y0.toFixed(1)} A ${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} L ${hx1.toFixed(1)} ${hy1.toFixed(1)} A ${hub} ${hub} 0 0 0 ${hx0.toFixed(1)} ${hy0.toFixed(1)} Z" fill="${tints[i % tints.length]}" stroke="#fff" stroke-width="1.5"/>`;
    // Labels pulled inward (0.63 of R, was 0.7) so they sit better within each
    // slice - moves the side labels toward center and the top/bottom ones up.
    // Bold (700). (Captain 2026-07-14.)
    const [lx, ly] = polar(cx, cy, R * 0.63, a0 + step / 2);
    const nx = lx + (LABEL_NUDGE_X[label] || 0);
    labels += `<text x="${nx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="18" font-weight="700" fill="#2f3a24">${label}</text>`;
  });
  return `<svg viewBox="0 0 340 340" class="life-wheel-svg" role="img" aria-label="Wheel of your life areas">
    ${segs}
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
