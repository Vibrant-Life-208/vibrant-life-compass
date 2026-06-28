// Wheel of Life - reflection-only visual of the 12 areas of life (the captain's
// Founder Sustainability Architecture). Shown above the goal page so the person
// holds their whole life in view while setting goals. No ratings or scores.

const LIFE_AREAS = [
  'Body', 'Mind', 'Spirit', 'Time',
  'Joy', 'Emotions', 'Family', 'Friends',
  'Partner', 'Home', 'Finances', 'Career',
];

function polar(cx, cy, r, angleDeg) {
  const a = (angleDeg - 90) * Math.PI / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function lifeWheelSvg() {
  const cx = 170, cy = 170, R = 132, hub = 30;
  const n = LIFE_AREAS.length, step = 360 / n;
  const tints = ['#e7ece0', '#dfe7ea', '#efe7dd', '#e7e0ea', '#dfeae2', '#ece0e1'];
  let segs = '', labels = '';
  LIFE_AREAS.forEach((label, i) => {
    const a0 = i * step, a1 = (i + 1) * step;
    const [x0, y0] = polar(cx, cy, R, a0);
    const [x1, y1] = polar(cx, cy, R, a1);
    const [hx0, hy0] = polar(cx, cy, hub, a0);
    const [hx1, hy1] = polar(cx, cy, hub, a1);
    segs += `<path d="M ${hx0.toFixed(1)} ${hy0.toFixed(1)} L ${x0.toFixed(1)} ${y0.toFixed(1)} A ${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} L ${hx1.toFixed(1)} ${hy1.toFixed(1)} A ${hub} ${hub} 0 0 0 ${hx0.toFixed(1)} ${hy0.toFixed(1)} Z" fill="${tints[i % tints.length]}" stroke="#fff" stroke-width="1.5"/>`;
    const [lx, ly] = polar(cx, cy, R * 0.7, a0 + step / 2);
    labels += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="11" fill="#5a5a52">${label}</text>`;
  });
  return `<svg viewBox="0 0 340 340" class="life-wheel-svg" role="img" aria-label="Wheel of the twelve areas of life">
    ${segs}
    ${labels}
    <circle cx="${cx}" cy="${cy}" r="${hub}" fill="#fff" stroke="#cdbfa6" stroke-width="1.5"/>
    <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-size="10" fill="#8a8a80">your life</text>
  </svg>`;
}

// show=false hides the wheel (e.g. for young learners, whose goals aren't life areas).
export function renderLifeWheel(show) {
  const el = document.getElementById('life-wheel');
  if (!el) return;
  if (!show) { el.innerHTML = ''; el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = `
    <p class="life-wheel-prompt">Hold your whole life in view. These twelve areas all matter - as you set your goals, tend them together.</p>
    ${lifeWheelSvg()}
  `;
}
