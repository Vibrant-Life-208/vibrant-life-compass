// Parents & Tots recognition badges - the parent's own Hero's Journey.
//
// CATEGORY WALL (Polaris standing condition, Compass Decision 5):
// These recognize a PARENT posture already practiced - they are NOT learner
// mastery badges. They are NEVER counted, scored, streaked, completion-tracked,
// aggregated, compared, or made visible to guides/admins. The only thing stored
// is a self-disclosed marker the parent sets for themselves ("I'm holding this"),
// held locally. If any parent-side count/streak/dashboard ever appears here, it
// has drifted and triggers a formal Prime Directive dissent.
//
// Spec: docs/design/2026-06-27-pt-safe-base-badge-compass-integration-v0.1.md
// This is BUILD STEP 1 (smallest): the Safe Base worked example + the arc,
// rendered from local self-disclosure. No schema change. Persistence hardening
// (parent-private RLS boolean) is a later, separate step.

// The four-badge arc (first cycle, Sessions 1-4). Safe Base is the worked example.
export const PARENT_BADGE_ARC = [
  {
    id: 'safe-base', name: 'The Safe Base', session: 1, stage: 'The Departure begins',
    quote: "I can walk away because I trust you'll be here when I come back.",
    practice: "Five minutes of child-led play - sit near, hands still, follow, don't lead.",
    why: "Your calm is their first permission. You don't have to do more. You have to be there.",
  },
  {
    id: 'steady-hand', name: 'The Steady Hand', session: 2, stage: 'The Initiation',
    quote: 'I can let it be hard, because the reaching is theirs to do.',
    practice: 'When it\'s hard, stay close and don\'t rescue - "What did you try? What\'s one small next step?"',
    why: "Confidence is born in the moment you don't step in. Same love, different move.",
  },
  {
    id: 'the-witness', name: 'The Witness', session: 3, stage: 'The Return',
    quote: 'I see who you are becoming - and it is yours to author.',
    practice: "Notice out loud who they are becoming. Describe what you see; don't steer it.",
    why: "Your seeing makes it real. It does not make it yours. Who they're becoming belongs to them.",
  },
  {
    id: 'held-then-let-go', name: 'Held, Then Let Go', session: 4, stage: 'Freedom to Live',
    quote: 'I held on with everything I had, so I could open my hands well.',
    practice: 'The clean goodbye - spoken, visible, unhurried. Held first. Then released.',
    why: "A good ending is a gift. The goodbye moves at your child's readiness, never our convenience.",
  },
];

// The Safe Base daily invitations - one gentle prompt per session day.
// NEVER a checklist: no checkbox, no "you missed day 3", no count.
export const SAFE_BASE_DAILY_GOALS = [
  { goal: 'Be the safe base', why: 'Your calm is their first permission.' },
  { goal: "Follow, don't lead", why: 'Describe what they do; skip commands and questions.' },
  { goal: 'You always come back', why: 'Predictable routines help a child settle.' },
  { goal: 'The first short goodbye', why: 'A spoken, visible goodbye - never a sneak-away.' },
  { goal: 'Venture out', why: 'A child who trusts the base can explore.' },
  { goal: 'Trust the base', why: 'Settling is an arc, not an event.' },
  { goal: 'Ready for Session Two', why: 'The goodbye becomes familiar.' },
];

// The four honesty conditions, carried as warmth (never fine print).
export const BADGE_HONESTY = [
  'Evidence-informed, not evidence-based - a studied path, not a proven formula.',
  'Invitation, not prescription - we ask how your family does closeness and goodbye first.',
  'The hard day is allowed - sometimes you must leave before your child is ready; a clean short goodbye is how, and you have not failed a test.',
  "Whose ease is named - your child's readiness moves the goodbye, never our convenience.",
];

// ---------------------------------------------------------------------------
// Self-disclosed, local-only state. No server. No tracking. Per-parent keys.
// Allowed by the spec's never-store list: a single self-disclosed boolean is
// explicitly permitted; counts/streaks/completion are not (and none live here).
// ---------------------------------------------------------------------------
const key = (parentId, suffix) => `vl.pt.${suffix}.${parentId}`;

function lsGet(k) {
  try { return localStorage.getItem(k); } catch { return null; }
}
function lsSet(k, v) {
  try { localStorage.setItem(k, v); } catch { /* private mode / disabled - non-fatal */ }
}

// "I am a Parents & Tots family" - self-identified, so the arc has a home even
// for a P&T parent with no learner record yet.
export function isPtFamily(parentId) { return lsGet(key(parentId, 'family')) === '1'; }
export function setPtFamily(parentId, on) { lsSet(key(parentId, 'family'), on ? '1' : '0'); }

// "I'm holding this badge this cycle" - recognition of a posture, never a score.
export function isHoldingBadge(parentId, badgeId) {
  return lsGet(key(parentId, `hold.${badgeId}`)) === '1';
}
export function setHoldingBadge(parentId, badgeId, on) {
  lsSet(key(parentId, `hold.${badgeId}`), on ? '1' : '0');
}

// ---------------------------------------------------------------------------
// Guide-view Recognition Arc REFERENCE (Polaris ruling 2026-07-08, 4 conditions).
// CONTENT-ONLY. It reuses PARENT_BADGE_ARC above and deliberately touches NO
// per-parent state (isPtFamily / isHoldingBadge are never called here). There is
// no wire from any parent's record to this view — by architecture, not policy —
// so it cannot drift into tracking. The wall is printed on the screen. Shown only
// to Tots guides + owners. Reference for the recognition the guide gives aloud;
// never a roster of who-holds-what.
// ---------------------------------------------------------------------------
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

export function renderParentBadgesReference(show) {
  const el = document.getElementById('pt-recognition-section');
  if (!el) return;
  if (!show) { el.innerHTML = ''; el.hidden = true; return; }
  el.hidden = false;
  const steps = PARENT_BADGE_ARC.map((b, i) => `
    <li class="pt-badge">
      <span class="pt-badge-num">${i + 1}</span>
      <div class="pt-badge-body">
        <p class="pt-badge-name">${esc(b.name)}<span class="pt-badge-when">Session ${b.session} · ${esc(b.stage)}</span></p>
        <p class="pt-badge-why">${esc(b.why)}</p>
      </div>
    </li>`).join('');
  el.innerHTML = `
    <div class="admin-header"><h3 class="admin-title">Parents &amp; Tots · the Recognition Arc</h3></div>
    <p class="admin-sub">A reference for the recognition you offer aloud in the parent circle - spoken first, never scored. This shows no family's state, and never will.</p>
    <ol class="pt-badges">${steps}</ol>
    <p class="pt-guardrail">These honor the <strong>parent</strong>. They never count - no completion, no streak, no scoreboard, no per-parent view - and they live apart from the children's mastery badges, always.</p>`;
}
