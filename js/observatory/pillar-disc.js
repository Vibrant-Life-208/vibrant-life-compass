// pillar-disc.js — ONE 3D Pillar disc for the Observatory, in light-DOM Lit.
// Renders the base coin form (cap · side · face + glow) from COMPASS-MAP-PAGE-SPEC §0 /
// COMPASS-VISUAL-SYSTEM-SPEC §2, and the Frame→Dressed→Energy state machine (+ Focus, + At-rest)
// from §3–§4. This component draws exactly one disc; the Observatory *stack* (pyramid widths,
// z-ladder, spotlight coordination) is a separate container's job — a lone disc fills its host,
// so any placement MUST supply a definite-width ancestor (§2.2 IMPORTANT).
//
// RENDER CONTRACT (§0, non-negotiable):
//   • HTML/CSS + inline SVG only — no <canvas>.
//   • Animate `opacity`/`transform` ONLY — never box-shadow/filter-blur/background/size.
//     (Static drop-shadow/inset-shadow build the coin form; the rule forbids *animating* them.)
//   • prefers-reduced-motion = static END-FRAME (glow holds steady, fill/step snap), never blank.
//   • Not color-alone — every Pillar carries icon + label; every state carries a form difference.
//   • No completeness signal — no %/N-of-5/meter. A Frame reads "under construction," never "behind."
//
// §4.6 ANTI-CONFLATION INVARIANT (the reason this component keeps the signals as independent inputs):
//   Frame(outline) · Dressed(solid) · Energy(glow-breath halo) are the base `state`.
//   (The large-disc floating gold-ring affix was removed per Europa 2026-07-22; the glow-halo is a
//   luminance/form change visible in grayscale and the aria-label carries "a goal reached," so
//   not-color-alone still holds. The §7 tab-scale gold ring stays the small-size marker.)
//   Focus(step-up) and At-rest(dulled) are ORTHOGONAL booleans laid over it. Focus never promotes a
//   Frame to Dressed and never lends the glow (the demo's "highlight → light up a tier" exploration
//   was SENT BACK by SSC 2026-07-22; legibility of a resting Frame is solved AT the frame — heavier
//   outline + a faint ghost-fill — not by borrowing another state's signal). Glow == a Launch-Pad
//   goal reached, whether or not the disc is in focus.
//
// Properties (all reflected as attributes for easy composition):
//   pillar   : 'purpose'|'connection'|'creator'|'lifeskills'|'academics'  (colors + icon + label)
//   state    : 'frame'|'dressed'|'energy'                                  (base construction arc)
//   focused  : boolean — this is the Pillar being worked in now (step-up, §4.4)
//   rest     : boolean — dulled because another Pillar holds focus (spotlight, §4.5)
// Emits `pillar-click` (bubbles, composed) on tap — the disc is itself the click target (§4.4);
// the owning container decides what focus does. Convention: ./README.md.

import { LitElement, html, svg } from '../vendor/lit-core.min.js';

// Colors LOCKED in page-spec §0 / visual-spec §2.3. `lbl` = per-coin WCAG label color (§9.2):
// dark labels on the bright Pillars, white on the dark ones — contrast from the text itself, no band.
const PILLARS = {
  academics:  { name: 'ACADEMICS',       base: '#EE6C2B', lt: '#F79457', dk: '#B84F16', icon: 'book',   bright: true,  lbl: '#2E1200' },
  lifeskills: { name: 'LIFE SKILLS',     base: '#1CA08D', lt: '#3FC0AD', dk: '#127265', icon: 'sprout', bright: true,  lbl: '#022019' },
  creator:    { name: 'CREATOR MINDSET', base: '#F5A623', lt: '#FBC259', dk: '#CE8109', icon: 'bulb',   bright: true,  lbl: '#2E1D00' },
  connection: { name: 'CONNECTION',      base: '#7A3E9D', lt: '#9C5FBE', dk: '#5B2A78', icon: 'heart',  bright: false, lbl: '#FFFFFF' },
  purpose:    { name: 'PURPOSE',         base: '#E01230', lt: '#F13B52', dk: '#AC0A22', icon: 'star',   bright: false, lbl: '#FFFFFF' },
};

// The five white line-icons (§2.3). One stroke family (1.7px, round caps), `currentColor` so an
// icon inherits the face's per-coin label color when dressed, and `--base` when it rides the outline.
const ICONS = {
  book:   svg`<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v16h5.5A2.5 2.5 0 0 1 20 21.5z"/>`,
  sprout: svg`<path d="M12 20v-7"/><path d="M12 13c0-3-2-5-6-5 0 3 2 5 6 5z"/><path d="M12 11c0-2.5 2-4.5 6-4.5 0 2.7-2 4.5-6 4.5z"/>`,
  bulb:   svg`<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.3 1 2.5h6c0-1.2.3-1.8 1-2.5A6 6 0 0 0 12 3z"/>`,
  heart:  svg`<path d="M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 7a3.5 3.5 0 0 1 7 3.5C19 15.5 12 20 12 20z"/>`,
  star:   svg`<path d="M12 3v18M3 12h18M6 6l12 12M18 6L6 18"/>`,
};
const icon = (name) => svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;

// Scoped, injected once. Light DOM has no shadow-style boundary, so every selector is namespaced
// under the `pillar-disc` tag and every @keyframes is `pd-` prefixed — no global collision.
const STYLE_ID = 'pillar-disc-styles';
const CSS = `
pillar-disc{display:block}
pillar-disc .disc{position:relative;height:60px;width:100%;
  transition:transform .18s ease;transform:translateY(var(--sink,0px));cursor:pointer}
/* static form shadow — NOT animated (§0 rule 2) */
pillar-disc .disc .shadowform{position:absolute;inset:0;filter:drop-shadow(0 13px 9px rgba(0,0,0,.22))}
/* resting-frame legibility: a faint ghost-fill so a Frame reads as a coin under construction, not "gone" (§4.6) */
pillar-disc .disc .ghost{position:absolute;inset:0;border-radius:0 0 50% 50% / 0 0 26px 26px;background:var(--base);opacity:0;transition:opacity .4s ease}
pillar-disc .disc.frame .ghost{opacity:.2}
/* fill ritual: colored body rises inside a FIXED coin-silhouette clip via translateY only — clean water line, undistorted coin (§4.2) */
pillar-disc .disc .sideclip{position:absolute;inset:0;overflow:hidden;border-radius:0 0 50% 50% / 0 0 26px 26px}
pillar-disc .disc .fillgroup{position:absolute;inset:0;transition:transform .85s cubic-bezier(.32,.66,.3,1)}
pillar-disc .disc.frame .fillgroup{transform:translateY(101%)}
pillar-disc .disc .side{position:absolute;inset:0;border-radius:0 0 50% 50% / 0 0 26px 26px;
  background:linear-gradient(to bottom,var(--base) 0%,var(--base) 42%,var(--dk) 100%)}
/* elliptical top cap: radial highlight lighter at top-left (§2.1) */
pillar-disc .disc .cap{position:absolute;left:0;right:0;top:-16px;height:32px;border-radius:50%;
  background:radial-gradient(130% 150% at 50% 22%,var(--lt) 0%,var(--base) 72%);
  box-shadow:inset 0 2px 4px rgba(255,255,255,.35)}
/* face rides the SIDE band (top:15px, below the cap) — this is the WCAG surface, not the bright cap (§2.1/§9.2) */
pillar-disc .disc .face{position:absolute;left:0;right:0;top:15px;bottom:0;display:flex;align-items:center;justify-content:center;gap:6px;
  text-align:center;line-height:1.12;color:var(--lbl,#fff);font-weight:800;letter-spacing:.04em;font-size:13px;z-index:2}
/* shrink the label to its longest word so a two-word label (Creator Mindset / Life Skills) wraps
   tight and the icon hugs it, instead of the wrapped text filling the width and stranding the icon */
pillar-disc .disc .face span,pillar-disc .disc .outline .olabel span{max-width:min-content}
pillar-disc .disc.lbl-light .face{text-shadow:0 1px 3px rgba(0,0,0,.45)}   /* soft shadow helps white labels only */
pillar-disc .disc .face svg{width:17px;height:17px;flex:none}
/* cap + face fade in (opacity) as the water reaches the brim */
pillar-disc .disc .cap,pillar-disc .disc .face{transition:opacity .4s ease .5s}
pillar-disc .disc.frame .cap,pillar-disc .disc.frame .face{opacity:0}
/* SOLID coin (always present, its fill rises) + OUTLINE frame that fades as it fills */
pillar-disc .disc .solid{position:absolute;inset:0;opacity:1}
pillar-disc .disc .outline{position:absolute;inset:0;opacity:0;transition:opacity .4s ease .5s}
pillar-disc .disc .outline svg.frameline{position:absolute;left:0;top:-16px;width:100%;height:76px;overflow:visible}
pillar-disc .disc .outline .olabel{position:absolute;left:0;right:0;top:20px;display:flex;align-items:center;justify-content:center;gap:6px;
  font-size:12px;font-weight:800;letter-spacing:.04em;color:var(--lt)}
pillar-disc .disc .outline .olabel svg{width:14px;height:14px;flex:none}
pillar-disc .disc.frame .outline{opacity:1}
/* ENERGY glow — a static gold-white radial gradient BLASTING from below (§4.3); only opacity+transform animate */
pillar-disc .disc .glow{position:absolute;left:-22%;right:-22%;top:-6px;bottom:-46px;
  background:radial-gradient(78% 96% at 50% 100%,rgba(255,247,220,.96) 0%,rgba(245,179,1,.68) 30%,rgba(245,179,1,0) 72%);
  opacity:0;pointer-events:none;z-index:0}
pillar-disc .disc.energy .glow{animation:pd-glowIn .7s ease-out both, pd-breatheGlow 10s ease-in-out infinite .6s}
pillar-disc .disc.energy .discbody{animation:pd-breatheScale 10s ease-in-out infinite}
@keyframes pd-glowIn{from{opacity:0}to{opacity:.55}}
@keyframes pd-breatheGlow{0%,100%{opacity:.40}50%{opacity:.70}}   /* breathe the halo via OPACITY, never blur */
@keyframes pd-breatheScale{0%,100%{transform:scale(1.00)}50%{transform:scale(1.02)}}
/* rocket ignition — one-shot plume rising from the base on Energy onset (§4.3, SSC-gated) */
pillar-disc .disc .plume{position:absolute;left:-8%;right:-8%;bottom:-28px;height:135%;pointer-events:none;z-index:0;
  background:radial-gradient(60% 80% at 50% 100%,rgba(255,247,220,.95) 0%,rgba(245,179,1,.72) 34%,rgba(245,179,1,0) 72%);
  opacity:0;transform:translateY(42px);transform-origin:bottom center}
pillar-disc .disc.energy .plume{animation:pd-rocket 1.15s cubic-bezier(.2,.75,.3,1) both}
@keyframes pd-rocket{
  0%{opacity:0;transform:translateY(46px)}
  18%{opacity:.34;transform:translateY(40px)}   /* ~200ms approach: a low glow gathers (arrival, not ambush — K'Ehleyr) */
  34%{opacity:.92;transform:translateY(28px)}    /* ignition */
  100%{opacity:0;transform:translateY(-34px)}}   /* launch up + fade */
pillar-disc .disc .discbody{position:absolute;inset:0;transition:opacity .35s ease}
/* FOCUS = step-up (transform only) + a static deeper lift shadow (§4.4) */
pillar-disc .disc.focus{transform:translateY(calc(var(--sink,0px) - 18px));z-index:20}
pillar-disc .disc.focus .shadowform{filter:drop-shadow(0 22px 14px rgba(0,0,0,.28))}
/* AT-REST spotlight dulling — warm, never grey (§4.5). SSC-ruled 2026-07-22: filled ~0.6, frame ~0.72, energy keeps a dimmed goal-glow ~0.3 */
pillar-disc .disc.rest .discbody{opacity:.6}
pillar-disc .disc.rest.frame .discbody{opacity:.72}
pillar-disc .disc.rest.energy .glow{animation:none;opacity:.3}
@media (prefers-reduced-motion: reduce){
  pillar-disc .disc.energy .glow{animation:none;opacity:.55}    /* steady lit glow, no breath */
  pillar-disc .disc.energy .plume{animation:none;opacity:0}
  pillar-disc .disc.energy .discbody{animation:none;transform:none}
  pillar-disc .disc .solid,pillar-disc .disc .outline,pillar-disc .disc,
  pillar-disc .disc .fillgroup,pillar-disc .disc .cap,pillar-disc .disc .face,
  pillar-disc .disc .ghost,pillar-disc .disc .discbody{transition:none}   /* fill/step become instant end-frames */
}`;
function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = CSS;
  document.head.appendChild(s);
}

const STATES = new Set(['frame', 'dressed', 'energy']);

class PillarDisc extends LitElement {
  static properties = {
    pillar: { reflect: true },
    state: { reflect: true },
    focused: { type: Boolean, reflect: true },
    rest: { type: Boolean, reflect: true },
  };
  createRenderRoot() { return this; } // light DOM: inherit the app's global styles + the scoped block above

  constructor() {
    super();
    this.pillar = 'purpose';
    this.state = 'dressed';
    this.focused = false;
    this.rest = false;
    ensureStyles();
  }

  connectedCallback() {
    super.connectedCallback();
    ensureStyles();
    this.addEventListener('click', this._onClick);
  }
  disconnectedCallback() {
    this.removeEventListener('click', this._onClick);
    super.disconnectedCallback();
  }

  _onClick = () => {
    // The disc is itself the click target (§4.4). We only announce it; the container owns focus.
    this.dispatchEvent(new CustomEvent('pillar-click', {
      detail: { pillar: this.pillar }, bubbles: true, composed: true,
    }));
  };

  _label(p, s) {
    const stateWord = s === 'frame' ? 'under construction'
      : s === 'energy' ? 'energized — a goal reached'
      : 'built';
    const focus = this.focused ? ', in focus' : '';
    return `${p.name} pillar — ${stateWord}${focus}`;
  }

  render() {
    const p = PILLARS[this.pillar] || PILLARS.purpose;
    const s = STATES.has(this.state) ? this.state : 'dressed';
    const cls = ['disc', s];
    if (this.focused) cls.push('focus');
    if (this.rest) cls.push('rest');
    if (!p.bright) cls.push('lbl-light'); // white-label Pillars get the soft text-shadow

    // The disc carries its own colors as custom props so the CSS above stays pillar-agnostic.
    const style = `--base:${p.base};--lt:${p.lt};--dk:${p.dk};--lbl:${p.lbl};--sink:0px`;

    return html`
      <div class=${cls.join(' ')} style=${style}
           role="img" aria-label=${this._label(p, s)}>
        <div class="glow"></div>
        <div class="plume"></div>
        <div class="discbody">
          <div class="shadowform"></div>
          <div class="ghost"></div>
          <div class="solid">
            <div class="sideclip"><div class="fillgroup"><div class="side"></div></div></div>
            <div class="cap"></div>
            <div class="face">${icon(p.icon)}<span>${p.name}</span></div>
          </div>
          <div class="outline">
            <svg class="frameline" viewBox="0 0 100 76" preserveAspectRatio="none">
              <ellipse cx="50" cy="14" rx="49" ry="12" fill="none" stroke=${p.base} stroke-width="3" vector-effect="non-scaling-stroke"></ellipse>
              <line x1="1" y1="14" x2="1" y2="58" stroke=${p.base} stroke-width="3" vector-effect="non-scaling-stroke"></line>
              <line x1="99" y1="14" x2="99" y2="58" stroke=${p.base} stroke-width="3" vector-effect="non-scaling-stroke"></line>
              <path d="M1,58 A49,12 0 0 0 99,58" fill="none" stroke=${p.base} stroke-width="3" vector-effect="non-scaling-stroke"></path>
            </svg>
            <div class="olabel" style="color:${p.base}">${icon(p.icon)}<span>${p.name}</span></div>
          </div>
        </div>
      </div>`;
  }
}
if (!customElements.get('pillar-disc')) customElements.define('pillar-disc', PillarDisc);

export { PillarDisc, PILLARS };
