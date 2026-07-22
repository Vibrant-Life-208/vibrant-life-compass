// record-spike.js — PHASE-0 THROWAWAY. Proves the Lit approach works in this app: a Lit
// web component that coexists with the vanilla code, renders in LIGHT DOM (so the app's
// global stylesheet cascades in), reads store.js, and ships offline via the vendored Lit.
// Reachable ONLY via ?ui=observatory on the staff-only Record tab. Delete + replace with the
// real environment shell in Phase 1.

import { LitElement, html } from '../vendor/lit-core.min.js';
import { getSession } from '../store.js';

class RecordSpike extends LitElement {
  static properties = { who: { state: true } };
  createRenderRoot() { return this; } // light DOM: inherit the app's global stylesheet
  constructor() { super(); this.who = '…'; }
  async load() {
    try {
      const s = await getSession();
      this.who = (s && (s.name || s.role || s.id)) || '(no session)';
    } catch (e) { this.who = '(store.js read failed)'; }
  }
  render() {
    return html`
      <div style="padding:1.5rem;max-width:32rem;margin:1rem auto;border:2px dashed var(--ink,#333);border-radius:12px">
        <p><strong>✦ Lit spike</strong> — this panel is rendered by a Lit web component, in light DOM.</p>
        <p>Read from <code>store.js</code>: <strong>${this.who}</strong></p>
        <p><small>PHASE-0 throwaway. Reachable only via <code>?ui=observatory</code>. The real environment shell replaces this in Phase 1.</small></p>
      </div>`;
  }
}
if (!customElements.get('record-spike')) customElements.define('record-spike', RecordSpike);

// Seam entry point: observatoryViews['record-view'](learnerId, session)
export async function renderRecordSpike(/* learnerId, session */) {
  const host = document.getElementById('record-view');
  if (!host) return;
  let el = host.querySelector('record-spike');
  if (!el) { host.innerHTML = ''; el = document.createElement('record-spike'); host.appendChild(el); }
  await el.load();
}
