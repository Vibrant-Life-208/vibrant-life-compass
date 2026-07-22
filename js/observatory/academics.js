// academics.js — the Academics environment (Observatory). Phase 1 MVP.
// Reads the real per-subject YEAR goals (store.js, camelCase) and renders them in light-DOM Lit
// with the Trail (dots = check-ins over time, latest = now). Goal authoring REUSES the existing
// openYearGoalModal (recursive-halving + baseline + halfway); onSave persists via saveGoal.
// Subjects = CATEGORIES where kind:'core' (Math / Reading / Writing / Civ). No passwords (TCC ruling).
// MVP mount: reuses the record-view container behind ?ui=observatory (its own tab is Group E).
// Convention: ./README.md.

import { LitElement, html } from '../vendor/lit-core.min.js';
import './trail.js'; // registers <vlc-trail>
import { getGoals, getCheckIns, saveGoal, getLearners } from '../store.js';
import { CATEGORIES } from '../studios.js';
import { openYearGoalModal } from '../modals.js';

const ACC = '#EE6C2B'; // Academics pillar = oranges
const ACADEMIC = Object.entries(CATEGORIES)
  .filter(([, c]) => c.kind === 'core')
  .map(([id, c]) => ({ id, name: c.name }));

class AcademicsEnv extends LitElement {
  static properties = { _goals: { state: true }, _checks: { state: true }, _loading: { state: true } };
  createRenderRoot() { return this; } // light DOM

  constructor() {
    super();
    this.learnerId = null; this._studio = undefined;
    this._goals = {}; this._checks = {}; this._loading = true;
  }

  async load(learnerId) {
    this.learnerId = learnerId;
    this._loading = true;
    try {
      const [goals, checks, learners] = await Promise.all([
        getGoals(learnerId), getCheckIns(learnerId), getLearners().catch(() => []),
      ]);
      const byCat = {}, byGoal = {};
      for (const g of goals || []) if (g.scope === 'year') byCat[g.categoryId] = g;
      for (const c of checks || []) { const k = c.goalId; if (k) (byGoal[k] ||= []).push(c); }
      this._studio = (learners || []).find((l) => l.id === learnerId)?.studio;
      this._goals = byCat; this._checks = byGoal;
    } finally { this._loading = false; }
  }

  // dots = check-ins over time (accretive), latest = now; goal is the horizon ahead.
  _trail(goal) {
    const cks = (this._checks[goal?.id] || []).slice()
      .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    const n = cks.length;
    if (!n) return [{ at: 0.04 }];
    return cks.map((_, i) => ({ at: 0.06 + ((i + 1) / (n + 1)) * 0.82 }));
  }

  _edit(cat) {
    const goal = this._goals[cat.id] || null;
    openYearGoalModal({
      category: { id: cat.id, ...CATEGORIES[cat.id] },
      existing: goal,
      isFirstTime: !goal,
      studio: this._studio,
      onSave: async (fields) => {
        await saveGoal({ id: goal?.id, learnerId: this.learnerId, categoryId: cat.id, scope: 'year', ...fields });
        await this.load(this.learnerId);
      },
    });
  }

  render() {
    if (this._loading) return html`<p style="padding:1rem;color:var(--muted,#6e655c)">Loading Academics…</p>`;
    return html`
      <section style="--acc:${ACC};max-width:640px;margin:0 auto;padding:1rem">
        <h2 style="color:var(--acc);margin:0">📖 Academics</h2>
        <p style="color:var(--muted,#6e655c);font-size:13px;margin:.25rem 0 1rem">Your one-year goal per subject. A plan, not a verdict — revise anytime.</p>
        ${ACADEMIC.map((cat) => {
          const g = this._goals[cat.id];
          return html`
            <div style="border:2px solid var(--acc);border-radius:12px;padding:14px 16px;margin:12px 0">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
                <strong>${cat.name}</strong>
                <button @click=${() => this._edit(cat)} style="font:inherit;font-size:12px;border:1px solid var(--acc);color:var(--acc);background:#fff;border-radius:8px;padding:5px 10px;cursor:pointer;white-space:nowrap">
                  ${g ? 'Edit goal' : 'Set your one-year goal'}
                </button>
              </div>
              ${g ? html`
                <p style="margin:8px 0;font-size:13px">${g.text || ''}</p>
                ${g.baseline ? html`<p style="font-size:12px;color:var(--muted,#6e655c);margin:0 0 6px">Where you started: ${g.baseline}</p>` : ''}
                <vlc-trail .steps=${this._trail(g)} color="var(--acc)"></vlc-trail>
              ` : html`<p style="font-size:12px;color:var(--muted,#6e655c);margin:8px 0 0">No goal yet — set your one-year vision for ${cat.name}.</p>`}
            </div>`;
        })}
        <p style="font-size:11px;color:var(--muted,#6e655c);margin-top:1rem">PHASE-1 MVP · reachable via ?ui=observatory · reuses the existing goal modal + store.js.</p>
      </section>`;
  }
}
if (!customElements.get('academics-env')) customElements.define('academics-env', AcademicsEnv);

export async function renderAcademics(learnerId /*, session */) {
  const host = document.getElementById('record-view'); // MVP mount; Group E gives Academics its own tab
  if (!host) return;
  let el = host.querySelector('academics-env');
  if (!el) { host.innerHTML = ''; el = document.createElement('academics-env'); host.appendChild(el); }
  await el.load(learnerId);
}
