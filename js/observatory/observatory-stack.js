// observatory-stack.js — the Observatory composition: the five Pillars stacked as one structure,
// plus the two ceremonies the standing structure earns — the Dome opening (§5) and the
// Compass → Star Chart transform (§6). This is §1/§5/§6 of COMPASS-VISUAL-SYSTEM-SPEC-v0.1.
// It is NOT a separate asset; the Observatory is simply what the five discs ARE when stacked (§1.1),
// and the Dome/Star Chart are the same five entities re-expressed (§6), never different data.
//
// Composition (§1.1 / §2.2): a centered vertical stack, narrowest at top (Academics) to widest at
// base (Purpose) — the parent-pyramid order. Widths 47/59/71/85/100%; a uniform -13px overlap so each
// lower disc's back rim peeks behind the one above; a z-ladder (Academics z5 … Purpose z1) so the wider
// discs sit behind; a calm static sky field behind the stack. The `.mountain` carries a DEFINITE width
// (max-width:400px) — required, or the percentage-width coins collapse to slivers (§2.2 IMPORTANT).
//
// Focus + spotlight (§4.4/§4.5): tapping a Pillar focuses it (step-up) and dulls the rest to at-rest
// (warm, never grey). Tapping the focused Pillar releases. One disc holds focus at a time. Focus stays
// orthogonal to Energy — it never lends the glow (§4.6).
//
// STATE (C6c — real derivation, no longer the all-Dressed placeholder): per-Pillar state is DERIVED
// from the learner's store.js goals (read-only; no store.js functions added):
//   • FRAME   — no pre-threshold work in that Pillar (no goal) → "under construction", never "behind" (§4.1).
//   • DRESSED — the Pillar has a goal (threshold met / work begun) (§4.2).
//   • ENERGY  — ONLY from a real Launch-Pad-goal-reached signal, NEVER a %/tier/count proxy (§4.3).
// The reached signal does not exist in the data model yet (confirmed), so Energy never fires today; the
// hook is reserved so the day the backend adds `goal.reached`, Energy lights without a change here.
// Four of the five environments (Life Skills / Creator / Connection / Purpose) are not wired in-app yet,
// so they have no goal source and honestly read FRAME (genuinely under construction), not a fabricated
// Dressed. Academics is the one wired environment (categories per academics.js).
//
// NO completeness signal (§0 rule 5 / §1.2 / §10): five raised Pillars is the built STRUCTURE, never
// "5/5"; the all-Energy → Dome cue is STRUCTURAL (all five carry Energy), surfaced as a state, never as
// a meter or count en route. The stack is stood, never scored; the Star Chart is a vantage, not a score.
//
// MOTION GATE: every motion here (Dome parting, disc→star dissolve, glow) stays behind the 0% flag and
// does NOT ship to a learner until @kehleyr + @jake-sisko sign off (§11). Render contract (§0): HTML/CSS
// + inline SVG only (no <canvas>); animate opacity/transform ONLY; reduced-motion = static end-frames;
// not-color-alone. Convention: ./README.md.

import { LitElement, html, svg, nothing } from '../vendor/lit-core.min.js';
import './pillar-disc.js';          // registers <pillar-disc>
import { ASTERISMS } from './asterisms.js'; // the five per-Pillar constellations (§6) — shape data reused here

// top (narrow) → base (wide): the parent-pyramid order (§0). width = §2.2; z = §2.2 (Academics front, Purpose back).
const STACK = [
  { key: 'academics',  w: 47,  z: 5 },
  { key: 'lifeskills',  w: 59,  z: 4 },
  { key: 'creator',     w: 71,  z: 3 },
  { key: 'connection',  w: 85,  z: 2 },
  { key: 'purpose',     w: 100, z: 1 },
];

// C6c crosswalk — Pillar key → the store.js category ids whose goals count as that Pillar's work.
// Only Academics is wired in-app today (mirrors academics.js:18 ['khan','reading','noRedInk','civ'] plus
// the legacy Reading ids that still resolve a label). The other four environments are not built yet, so
// they have no goal source: an empty set → the Pillar reads FRAME (under construction), which is the
// honest state, not a fabricated Dressed. Populate a set here when its environment is wired.
const PILLAR_CATEGORIES = {
  academics: ['khan', 'reading', 'noRedInk', 'civ', 'lexia', 'deepBook'],
  lifeskills: [],
  creator: [],
  connection: [],
  purpose: [],
};

// The real "a Launch-Pad goal was reached" signal. It does NOT exist in the data model yet (confirmed:
// goals carry no reached/achieved/completedAt field). This predicate is the single reserved hook — the
// day the backend writes a real marker, Energy lights here with no other change. Energy is NEVER inferred
// from a percentage, a tier (studio==='launchpad' is not "reached"), or a count. Absent today → always false.
function isLaunchPadReached(goal) {
  return goal?.reached === true || goal?.launchpadReached === true;
}

// Derive [{ key, state }] for the five Pillars from a learner's goals (read-only). Pure; testable.
export function derivePillarStates(goals) {
  const years = (goals || []).filter((g) => g && g.scope === 'year');
  return STACK.map((p) => {
    const cats = PILLAR_CATEGORIES[p.key] || [];
    const mine = cats.length ? years.filter((g) => cats.includes(g.categoryId)) : [];
    let state;
    if (mine.some(isLaunchPadReached)) state = 'energy';   // real reached signal only (none today)
    else if (mine.length > 0) state = 'dressed';           // has pre-threshold work → dressed
    else state = 'frame';                                  // no work → under construction, never "behind"
    return { key: p.key, state };
  });
}

// Small line-icon per constellation (§6 not-color-alone: label + icon + shape). Lit `svg` (lit-core has
// no unsafeHTML), one stroke family, matching the disc/asterism glyphs. currentColor inherits the label.
const CHART_ICONS = {
  star:   svg`<path d="M12 2l2.4 7.1L21.5 12l-7.1 2.4L12 22l-2.4-7.6L2.5 12l7.1-2.9z"/>`,
  heart:  svg`<path d="M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 7a3.5 3.5 0 0 1 7 3.5C19 15.5 12 20 12 20z"/>`,
  spark:  svg`<path d="M12 2v5M12 17v5M2 12h5M17 12h5M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3"/>`,
  sprout: svg`<path d="M12 20v-7"/><path d="M12 13c0-3-2-5-6-5 0 3 2 5 6 5z"/><path d="M12 11c0-2.5 2-4.5 6-4.5 0 2.7-2 4.5-6 4.5z"/>`,
  book:   svg`<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v16h5.5A2.5 2.5 0 0 1 20 21.5z"/>`,
};
const chartIcon = (name) => svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${CHART_ICONS[name]}</svg>`;

// Where each constellation settles on the sky — a balanced ring AROUND Polaris (the fixed centre, §6).
// Percent of the chart box; Polaris is the still point at 50/50 and never travels. Order echoes the
// stack (Academics up top, Purpose low) so the sky reads as the same five entities re-expressed.
const CHART_POS = {
  academics:  { x: 50, y: 13 },
  creator:    { x: 84, y: 38 },
  purpose:    { x: 70, y: 82 },
  connection: { x: 30, y: 82 },
  lifeskills: { x: 16, y: 38 },
};

const STYLE_ID = 'observatory-stack-styles';
const CSS = `
observatory-stack{display:block}
observatory-stack .sky{position:relative;display:flex;justify-content:center;overflow:hidden;
  border-radius:16px;padding:34px 10px 44px;min-height:360px;
  background:linear-gradient(to bottom,#2b2f45 0%,#3d3f56 46%,#4a4a5e 100%)}   /* calm, static sky field (§1.1) */
observatory-stack .mountain{display:flex;flex-direction:column;align-items:center;width:100%;max-width:400px;
  transition:opacity .8s ease}                                                 /* discs fade out into the Star Chart (§6) */
observatory-stack .mountain pillar-disc{display:block;margin-top:-13px}        /* uniform overlap → peek-behind (§2.2) */
observatory-stack .mountain pillar-disc:first-child{margin-top:0}
observatory-stack.phase-chart .mountain{opacity:0;pointer-events:none}

/* controls — the guide-walked rite trigger + exit ramp (§5). Plain, no completeness language. */
observatory-stack .rite{position:absolute;left:0;right:0;bottom:10px;display:flex;justify-content:center;gap:10px;z-index:6}
observatory-stack .rite button{font:inherit;font-size:12px;border:1px solid #f5e6b8;color:#2b2f45;background:#f5e6b8;
  border-radius:999px;padding:7px 16px;cursor:pointer}
observatory-stack .rite button.ghost{background:transparent;color:#e9ecf5;border-color:#6b6f88}

/* ── Dome (§5): two half-shells parting to reveal the star field. transform/opacity ONLY. ── */
observatory-stack .dome{position:absolute;inset:0;z-index:4;pointer-events:none}
observatory-stack .dome .starfield{position:absolute;inset:0;opacity:0;transition:opacity 1.6s ease}
observatory-stack .dome .shell{position:absolute;left:50%;top:26px;width:230px;height:120px;
  transition:transform 1.7s cubic-bezier(.4,0,.2,1);transform-origin:bottom center;will-change:transform}
observatory-stack .dome .shell.left{transform:translateX(-100%)}
observatory-stack .dome .shell.right{transform:translateX(0)}
/* opened: the shells part outward (translate + slight rotate), the sky behind fades in */
observatory-stack.dome-open .dome .starfield{opacity:1}
observatory-stack.dome-open .dome .shell.left{transform:translateX(-168%) rotate(-9deg)}
observatory-stack.dome-open .dome .shell.right{transform:translateX(68%) rotate(9deg)}

/* ── Star Chart (§6): constellations fade+scale in around a fixed steady Polaris. ── */
observatory-stack .chart{position:absolute;inset:0;z-index:5;opacity:0;pointer-events:none;transition:opacity .9s ease}
observatory-stack.phase-chart .chart{opacity:1;pointer-events:auto}
observatory-stack .chart .constellation{position:absolute;transform:translate(-50%,-50%) scale(.72);opacity:0;
  transition:opacity .9s ease,transform .9s cubic-bezier(.2,.7,.3,1);text-align:center;color:#e9ecf5}
observatory-stack.phase-chart .chart .constellation{opacity:1;transform:translate(-50%,-50%) scale(1)}
observatory-stack .chart .constellation .clabel{display:flex;align-items:center;justify-content:center;gap:5px;
  font-size:11px;font-weight:700;letter-spacing:.03em;margin-top:2px}
observatory-stack .chart .constellation .clabel svg{width:13px;height:13px;flex:none}
observatory-stack .chart .polaris{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  text-align:center;color:#fff;z-index:2}
/* Polaris holds a STEADY glow — the still point does NOT breathe (§6 locked). Static radial, opacity fixed. */
observatory-stack .chart .polaris .halo{position:absolute;left:50%;top:8px;width:96px;height:96px;
  transform:translateX(-50%);border-radius:50%;pointer-events:none;
  background:radial-gradient(circle at 50% 50%,rgba(255,247,220,.9) 0%,rgba(255,247,220,.28) 42%,rgba(255,247,220,0) 70%)}
observatory-stack .chart .polaris .mark{position:relative;font-size:26px;line-height:1;color:#FFF6D8}
observatory-stack .chart .polaris .plabel{position:relative;font-size:11px;font-weight:700;margin-top:3px;color:#f2eecf}
/* a slow opacity-only twinkle on the stars (§6); OFF under reduced-motion */
observatory-stack .chart .constellation .twinkle{animation:obs-twinkle 4.2s ease-in-out infinite}
observatory-stack .chart .constellation .twinkle:nth-child(2n){animation-delay:1.4s}
observatory-stack .chart .constellation .twinkle:nth-child(3n){animation-delay:2.6s}
@keyframes obs-twinkle{0%,100%{opacity:.7}50%{opacity:1}}
/* per-Pillar stagger — calm, one register, not a simultaneous pop (§6) */
observatory-stack.phase-chart .chart .constellation:nth-child(1){transition-delay:.05s}
observatory-stack.phase-chart .chart .constellation:nth-child(2){transition-delay:.20s}
observatory-stack.phase-chart .chart .constellation:nth-child(3){transition-delay:.35s}
observatory-stack.phase-chart .chart .constellation:nth-child(4){transition-delay:.50s}
observatory-stack.phase-chart .chart .constellation:nth-child(5){transition-delay:.65s}

@media (prefers-reduced-motion: reduce){
  observatory-stack .mountain,
  observatory-stack .dome .starfield,observatory-stack .dome .shell,
  observatory-stack .chart,observatory-stack .chart .constellation{transition:none}
  observatory-stack .chart .constellation{transform:translate(-50%,-50%) scale(1)}   /* placed end-frame */
  observatory-stack .chart .constellation .twinkle{animation:none;opacity:.9}         /* steady stars */
  /* Dome renders already-open (end-frame): shells parted, star field visible, no parting motion */
  observatory-stack.dome-open .dome .shell.left{transform:translateX(-168%) rotate(-9deg)}
  observatory-stack.dome-open .dome .shell.right{transform:translateX(68%) rotate(9deg)}
}
`;
function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID; s.textContent = CSS;
  document.head.appendChild(s);
}

const prefersReducedMotion = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};

class ObservatoryStack extends LitElement {
  static properties = {
    pillars: { attribute: false },   // [{ key, state }] — derived from store.js goals (C6c)
    _focusKey: { state: true },
    _phase: { state: true },         // 'observatory' | 'dome' | 'chart'
    _domeOpen: { state: true },      // drives the shells-parting class once mounted
  };
  createRenderRoot() { return this; } // light DOM

  constructor() {
    super();
    this.pillars = STACK.map((p) => ({ key: p.key, state: 'frame' }));
    this._focusKey = '';
    this._phase = 'observatory';
    this._domeOpen = false;
    ensureStyles();
  }

  _stateOf(key) {
    return (this.pillars.find((p) => p.key === key) || {}).state || 'frame';
  }

  get _allEnergy() {
    // STRUCTURAL cue (§1.2): the Observatory stands whole when all five carry Energy. This is a state,
    // never a "5/5" meter — nothing counts up to it; it is simply true or not.
    return this.pillars.length === STACK.length && this.pillars.every((p) => p.state === 'energy');
  }

  _onPillarClick(e) {
    if (this._phase !== 'observatory') return;
    const k = e.detail?.pillar;
    if (!k) return;
    this._focusKey = (this._focusKey === k) ? '' : k; // tap focuses; tap again releases (§4.4)
  }

  // The Dome rite (§5): a threshold-hold (~0.55s the body registers the crossing — K'Ehleyr, SSC-applied),
  // then the shells part; when the parting settles, the discs give way to the Star Chart (§6). Reduced
  // motion skips straight to the open Dome + placed Star Chart (end-frames), no timed sequence.
  _openDome() {
    if (!this._allEnergy) return;   // the rite is only reachable when the structure truly stands
    this._focusKey = '';
    this._phase = 'dome';
    if (prefersReducedMotion()) { this._domeOpen = true; this._phase = 'chart'; return; }
    // let the closed Dome paint one frame, hold the threshold, then part the shells
    this._t1 = setTimeout(() => { this._domeOpen = true; }, 550);
    // after the parting (~1.7s) + a beat, cross-dissolve discs → constellations
    this._t2 = setTimeout(() => { this._phase = 'chart'; }, 550 + 1700 + 250);
  }

  _backToObservatory() {
    clearTimeout(this._t1); clearTimeout(this._t2);
    this._phase = 'observatory';
    this._domeOpen = false;
  }

  disconnectedCallback() {
    clearTimeout(this._t1); clearTimeout(this._t2);
    super.disconnectedCallback();
  }

  // A small static star field behind the parting shells (§5): low-opacity points, inline SVG.
  _starfield() {
    const pts = [
      [12, 20], [24, 46], [38, 14], [52, 34], [66, 18], [78, 42], [88, 24],
      [18, 68], [34, 80], [50, 62], [64, 78], [80, 66], [92, 74], [46, 90], [72, 92],
    ];
    return svg`<svg class="sf" viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">
      ${pts.map(([x, y], i) => svg`<circle cx=${x} cy=${y} r=${i % 3 === 0 ? 0.9 : 0.6} fill="#f5e6b8" opacity=${0.5 + (i % 3) * 0.15}></circle>`)}
    </svg>`;
  }

  _dome() {
    // Two half-shells meeting at a seam above the stack, soft static gradient echoing the sky (§5).
    // No flash: the reveal is an opacity crossfade of the star field, never a filter/exposure animation.
    return html`
      <div class="dome" aria-hidden=${this._phase === 'chart' ? 'true' : 'false'}>
        <div class="starfield">${this._starfield()}</div>
        <svg class="shell left" viewBox="0 0 230 120" aria-hidden="true">
          <defs><linearGradient id="obs-shell-l" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#3d4363"/><stop offset="1" stop-color="#242840"/>
          </linearGradient></defs>
          <path d="M230,120 A115,112 0 0 0 0,120 Z" fill="url(#obs-shell-l)"/>
        </svg>
        <svg class="shell right" viewBox="0 0 230 120" aria-hidden="true">
          <defs><linearGradient id="obs-shell-r" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#454b6b"/><stop offset="1" stop-color="#2a2f4a"/>
          </linearGradient></defs>
          <path d="M0,120 A115,112 0 0 1 230,120 Z" fill="url(#obs-shell-r)"/>
        </svg>
      </div>`;
  }

  // ONE constellation as inline SVG built from the asterism's stars/edges (§6). Reuses the asterisms.js
  // shape data (C6e). Carries label + icon + the shape itself → three non-color channels (§0 rule 4).
  _constellation(a) {
    const pos = CHART_POS[a.key] || { x: 50, y: 50 };
    const col = a.starColor;
    return html`
      <div class="constellation" style="left:${pos.x}%;top:${pos.y}%">
        <svg width="78" height="78" viewBox="0 0 100 100" role="img" aria-label="${a.pillar} constellation">
          ${a.edges.map(([i, j]) => svg`<line
            x1=${a.stars[i][0]} y1=${a.stars[i][1]} x2=${a.stars[j][0]} y2=${a.stars[j][1]}
            stroke=${col} stroke-width="1" stroke-linecap="round" opacity="0.55"></line>`)}
          ${a.stars.map((p, idx) => svg`<circle class="twinkle"
            cx=${p[0]} cy=${p[1]} r=${idx === a.lead ? 2.7 : 1.9} fill=${col}></circle>`)}
        </svg>
        <div class="clabel" style="color:${col}">${chartIcon(a.icon)}<span>${a.name}</span></div>
      </div>`;
  }

  _chart() {
    // Polaris = the still point at centre (§6): quote + values + Voice, the brightest fixed ✦ with a
    // STEADY (non-breathing) glow. It does not travel; the constellations settle around it.
    return html`
      <div class="chart" role="group" aria-label="Your Star Chart — five constellations around Polaris, your North">
        ${ASTERISMS.map((a) => this._constellation(a))}
        <div class="polaris">
          <div class="halo"></div>
          <div class="mark" aria-hidden="true">✦</div>
          <div class="plabel">Polaris · Your North</div>
        </div>
      </div>`;
  }

  render() {
    ensureStyles();
    const f = this._focusKey;
    // host-level classes drive the Dome + phase CSS; toggle on the custom element itself
    this.classList.toggle('dome-open', this._domeOpen);
    this.classList.toggle('phase-chart', this._phase === 'chart');

    const showDome = this._phase === 'dome' || this._phase === 'chart';
    return html`
      <div class="sky">
        <div class="mountain" role="group" aria-label="Your Observatory — five Pillars"
             @pillar-click=${(e) => this._onPillarClick(e)}>
          ${STACK.map((p) => html`
            <pillar-disc
              style="width:${p.w}%;z-index:${f === p.key ? 40 : p.z}"
              .pillar=${p.key}
              .state=${this._stateOf(p.key)}
              .focused=${f === p.key}
              .rest=${!!f && f !== p.key}></pillar-disc>`)}
        </div>

        ${showDome ? this._dome() : nothing}
        ${this._phase === 'chart' ? this._chart() : nothing}

        <div class="rite">
          ${this._phase === 'observatory' && this._allEnergy ? html`
            <button @click=${() => this._openDome()}>The Observatory stands — open the Dome</button>` : nothing}
          ${this._phase !== 'observatory' ? html`
            <button class="ghost" @click=${() => this._backToObservatory()}>Back to the Observatory</button>` : nothing}
        </div>
      </div>`;
  }
}
if (!customElements.get('observatory-stack')) customElements.define('observatory-stack', ObservatoryStack);

// Mount into the Compass (year-view) via the strangler-fig seam (js/app.js). Non-destructive: the
// legacy year-view fills its own child sections by id, so we mount the Observatory in a dedicated slot
// and hide the legacy siblings while it owns the tab — reversible, no innerHTML clobber of legacy nodes.
export async function renderObservatory(learnerId /*, session */) {
  const host = document.getElementById('year-view');
  if (!host) return;
  let slot = host.querySelector('#observatory-stack-slot');
  if (!slot) {
    slot = document.createElement('div');
    slot.id = 'observatory-stack-slot';
    host.prepend(slot);
  }
  for (const child of host.children) {
    if (child !== slot) child.style.display = 'none'; // legacy sections yield the tab to the Observatory
  }
  slot.style.display = '';
  let el = slot.querySelector('observatory-stack');
  if (!el) { slot.innerHTML = ''; el = document.createElement('observatory-stack'); slot.appendChild(el); }

  // C6c — real per-Pillar state from the learner's goals (read-only). Lazy-import store.js so this module
  // has no hard store dependency for its preview harness; if the read fails, fall back to all-FRAME
  // (honest "under construction"), never a fabricated Dressed/Energy.
  try {
    const { getGoals } = await import('../store.js');
    const goals = await getGoals(learnerId);
    el.pillars = derivePillarStates(goals);
  } catch {
    el.pillars = STACK.map((p) => ({ key: p.key, state: 'frame' }));
  }
}

export { ObservatoryStack, STACK, PILLAR_CATEGORIES, isLaunchPadReached };
