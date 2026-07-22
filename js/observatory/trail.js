// trail.js — "The Trail": a learner's movement, start · now · goal.
// Honest by design: it compares to the learner's OWN start (never a peer, never a percentage).
// The traveled path (start→now) is a SOLID line; the road ahead (now→goal) is faint/dashed — so it
// reads as "how far you've come," not "how far remains." No numeric percentage is ever shown.
// Static (reduced-motion safe), ARIA-labelled, shapes-not-color-alone. Convention: ./README.md.
//
// Properties:
//   start-label / now-label / goal-label : text at the three anchors
//   steps  : Array<{ at: 0..1 }> recorded positions over time (each a dot); last = now
//   now    : 0..1 fallback if `steps` not provided (single current dot)
//   color  : subject/pillar color (always paired with shape + labels, never color alone)

import { LitElement, html, svg } from '../vendor/lit-core.min.js';

const clamp = (n) => Math.max(0, Math.min(1, Number(n) || 0));

class VlcTrail extends LitElement {
  static properties = {
    startLabel: { attribute: 'start-label' },
    nowLabel: { attribute: 'now-label' },
    goalLabel: { attribute: 'goal-label' },
    steps: { attribute: false },
    now: { type: Number },
    color: {},
  };
  createRenderRoot() { return this; } // light DOM: inherit the app's global styles

  constructor() {
    super();
    this.startLabel = 'Started';
    this.nowLabel = 'You are here';
    this.goalLabel = 'Goal';
    this.steps = null;
    this.now = 0;
    this.color = 'var(--ink, #2c2a28)';
  }

  get _dots() {
    if (Array.isArray(this.steps) && this.steps.length) return this.steps.map((s) => clamp(s.at));
    return [clamp(this.now)];
  }

  render() {
    const W = 320, H = 60, padX = 16, y = 30;
    const x = (t) => padX + t * (W - 2 * padX);
    const dots = this._dots;
    const nowT = dots[dots.length - 1];
    const aria = `Your trail: started at ${this.startLabel}; you have moved to ${this.nowLabel}; heading toward ${this.goalLabel}.`;
    return html`
      <div class="vlc-trail" role="img" aria-label=${aria} style="--trail:${this.color};max-width:${W}px;margin:0 auto">
        <svg viewBox="0 0 ${W} ${H}" width="100%">
          <line x1=${x(0)} y1=${y} x2=${x(nowT)} y2=${y} stroke="var(--trail)" stroke-width="3" stroke-linecap="round"></line>
          <line x1=${x(nowT)} y1=${y} x2=${x(1)} y2=${y} stroke="var(--trail)" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 5" opacity="0.5"></line>
          <circle cx=${x(0)} cy=${y} r="4" fill="var(--trail)"></circle>
          ${dots.slice(0, -1).map((t) => svg`<circle cx=${x(t)} cy=${y} r="3" fill="var(--trail)" opacity="0.85"></circle>`)}
          <circle cx=${x(nowT)} cy=${y} r="6.5" fill="#fff" stroke="var(--trail)" stroke-width="3"></circle>
          <text x=${x(1)} y=${y + 4.5} text-anchor="middle" font-size="13" fill="var(--trail)">✦</text>
        </svg>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted,#6e655c);padding:0 6px">
          <span>${this.startLabel}</span><span>${this.nowLabel}</span><span>${this.goalLabel}</span>
        </div>
      </div>`;
  }
}
if (!customElements.get('vlc-trail')) customElements.define('vlc-trail', VlcTrail);
export { VlcTrail };
