// observatory-stack.js — the Observatory composition: the five Pillars stacked as one structure.
// This is §1 of COMPASS-VISUAL-SYSTEM-SPEC-v0.1 — the container that <pillar-disc> (§2) is a part of.
// It is NOT a separate asset; the Observatory is simply what the five discs ARE when stacked (§1.1).
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
// NO completeness signal (§0 rule 5 / §1.2): five raised Pillars is the built STRUCTURE, never "5/5."
// The stack is stood, never scored.
//
// State source: this first mount renders all five Pillars DRESSED — a learner "enters Adventure with
// all Pillars dressed" (§4.2), so all-dressed is the honest default, not a fabricated completeness read.
// TODO before learner rollout (ROLLOUT_PCT stays 0): derive per-Pillar Frame (pre-threshold) from
// store.js goals, and Energy only from a real Launch-Pad-goal-reached signal (never a % proxy); and the
// SSC motion gate (§11, @kehleyr + @jake-sisko) attaches before any of this motion ships. Convention: ./README.md.

import { LitElement, html } from '../vendor/lit-core.min.js';
import './pillar-disc.js'; // registers <pillar-disc>

// top (narrow) → base (wide): the parent-pyramid order (§0). width = §2.2; z = §2.2 (Academics front, Purpose back).
const STACK = [
  { key: 'academics',  w: 47,  z: 5 },
  { key: 'lifeskills',  w: 59,  z: 4 },
  { key: 'creator',     w: 71,  z: 3 },
  { key: 'connection',  w: 85,  z: 2 },
  { key: 'purpose',     w: 100, z: 1 },
];

const STYLE_ID = 'observatory-stack-styles';
const CSS = `
observatory-stack{display:block}
observatory-stack .sky{position:relative;display:flex;justify-content:center;
  border-radius:16px;padding:34px 10px 44px;
  background:linear-gradient(to bottom,#2b2f45 0%,#3d3f56 46%,#4a4a5e 100%)}   /* calm, static sky field (§1.1) */
observatory-stack .mountain{display:flex;flex-direction:column;align-items:center;width:100%;max-width:400px}
observatory-stack .mountain pillar-disc{display:block;margin-top:-13px}        /* uniform overlap → peek-behind (§2.2) */
observatory-stack .mountain pillar-disc:first-child{margin-top:0}
`;
function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID; s.textContent = CSS;
  document.head.appendChild(s);
}

class ObservatoryStack extends LitElement {
  static properties = {
    pillars: { attribute: false },   // [{ key, state }] — defaults to all five DRESSED
    _focusKey: { state: true },
  };
  createRenderRoot() { return this; } // light DOM

  constructor() {
    super();
    this.pillars = STACK.map((p) => ({ key: p.key, state: 'dressed' }));
    this._focusKey = '';
    ensureStyles();
  }

  _stateOf(key) {
    return (this.pillars.find((p) => p.key === key) || {}).state || 'dressed';
  }

  _onPillarClick(e) {
    const k = e.detail?.pillar;
    if (!k) return;
    this._focusKey = (this._focusKey === k) ? '' : k; // tap focuses; tap again releases (§4.4)
  }

  render() {
    ensureStyles();
    const f = this._focusKey;
    return html`
      <div class="sky">
        <div class="mountain" role="group" aria-label="Your Observatory — five Pillars"
             @pillar-click=${(e) => this._onPillarClick(e)}>
          ${STACK.map((p) => html`
            <pillar-disc
              style="width:${p.w}%;z-index:${p.z}"
              .pillar=${p.key}
              .state=${this._stateOf(p.key)}
              .focused=${f === p.key}
              .rest=${!!f && f !== p.key}></pillar-disc>`)}
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
  // First mount: all Pillars dressed (§4.2). Real Frame/Energy derivation is the TODO above.
  el.pillars = STACK.map((p) => ({ key: p.key, state: 'dressed' }));
}

export { ObservatoryStack };
