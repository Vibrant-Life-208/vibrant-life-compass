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

// The four parent postures. The Safe Base is the worked example.
//
// NO CALENDAR FRAMING (Decision 3, 2026-07-09 True Play v0.2): the parent
// recognition must NEVER carry a "Session N of 7" label. A parent must never
// read "you're on Session 2" as "you're behind." Session rhythm belongs to the
// child's learning only; a parent's posture is not a place on a timeline. The
// stage names below are the child's Hero's-Journey arc the parent accompanies,
// not a rank the parent is graded against.
// Decision 4 honored: equal weight, no rank number, no ordered list. The guide
// REFERENCE uses an unordered wrap grid; the parent JOURNEY stacks one card per row
// (captain 2026-07-18) — still equal-weight and unnumbered, so no rank is implied.
// The remaining piece — the door-at-center ring composition — belongs to the True
// Play token's MAC pass, not this arc.
export const PARENT_BADGE_ARC = [
  {
    id: 'safe-base', name: 'The Safe Base', stage: 'The Departure begins',
    quote: "I can stay, so you can go - and I'll be here when you come back.",
    practice: "Five minutes of child-led play - sit near, hands still, follow, don't lead.",
    why: "Your calm is their first permission. You don't have to do more. You have to be there.",
  },
  {
    id: 'steady-hand', name: 'The Steady Hand', stage: 'The Initiation',
    quote: 'I can let it be hard, because the reaching is theirs to do.',
    practice: 'When it\'s hard, stay close and don\'t rescue - "What did you try? What\'s one small next step?"',
    why: "Confidence is born in the moment you don't step in. Same love, different move.",
  },
  {
    id: 'the-witness', name: 'The Witness', stage: 'The Return',
    quote: 'I see who you are becoming - and it is yours to author.',
    practice: "Notice out loud who they are becoming. Describe what you see; don't steer it.",
    why: "Your seeing makes it real. It does not make it yours. Who they're becoming belongs to them.",
  },
  {
    id: 'held-then-let-go', name: 'Held, Then Let Go', stage: 'Freedom to Live',
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
  { goal: 'Ready for next time', why: 'The goodbye becomes familiar.' },
];

// The four honesty conditions, carried as warmth (never fine print).
export const BADGE_HONESTY = [
  'Evidence-informed, not evidence-based - a studied path, not a proven formula.',
  'Invitation, not prescription - we ask how your family does closeness and goodbye first.',
  'The hard day is allowed - sometimes you must leave before your child is ready; a clean short goodbye is how, and you have not failed a test.',
  "Whose ease is named - your child's readiness moves the goodbye, never our convenience.",
];

// The conversation-first gate (2026-07-16 new-parent review, fixes 1/3/4/5/6).
// A parent must not meet a finished arc before the arc has met them. This screen
// comes first: the ask-first question (Kira), the named motive (Odo), the hard
// day held co-equal (Salus), and a first-class "nothing" door (Polaris). The
// cards live behind it and only appear once a parent chooses to see them.
export const PARENT_GATE = {
  // Kira: the card must arrive asking, not certain. The family's way leads.
  askFirst: "Before any cards: have you and a guide talked about how your family does goodbyes and closeness? That conversation comes first - your way leads, ours follows. There is no one right way to say goodbye.",
  // Odo: the institutional motive, said plainly, where a parent can see it.
  motive: "One honest thing: a calm goodbye also makes the grove's morning go easier. We're telling you that so it's never hidden - the recognition is for you, not a way to manage you.",
  // Salus: the hard day held at full weight, not as a footnote beside a toggle.
  hardDay: "And the hard day is allowed. Sometimes you have to leave before your child is ready. A short, honest goodbye is how - and you have not failed anything. This is here for that morning too.",
};

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

// "I've read the conversation-first gate and want to see the recognitions."
// Self-disclosed, local-only, like everything else here. Not a completion, not
// tracked - only which screen this parent has chosen to move to.
export function isGateSeen(parentId) { return lsGet(key(parentId, 'gate')) === '1'; }
export function setGateSeen(parentId, on) { lsSet(key(parentId, 'gate'), on ? '1' : '0'); }

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
  // Decision 4 (2026-07-09): equal and unordered — no rank number, no ordered
  // list. Four postures of equal weight; none is "next." (The door-at-center
  // ring is the True Play token's MAC composition, a separate build — not here.)
  const steps = PARENT_BADGE_ARC.map((b) => `
    <li class="pt-badge">
      <div class="pt-badge-body">
        <p class="pt-badge-name">${esc(b.name)}<span class="pt-badge-when">${esc(b.stage)}</span></p>
        <p class="pt-badge-why">${esc(b.why)}</p>
      </div>
    </li>`).join('');
  el.innerHTML = `
    <div class="admin-header"><h3 class="admin-title">Parents &amp; Tots · the Recognition Arc</h3></div>
    <p class="admin-sub">A reference for the recognition you offer aloud in the parent circle - spoken first, never scored. This shows no family's state, and never will.</p>
    <ul class="pt-badges pt-grid">${steps}</ul>
    <p class="pt-guardrail">These honor the <strong>parent</strong>. They never count - no completion, no streak, no scoreboard, no per-parent view - and they live apart from the children's mastery badges, always.</p>`;
}

// ---------------------------------------------------------------------------
// PARENT-SIDE journey (the parent's OWN private space). This is where a P&T
// parent (self-identified) sees their four postures and, if they wish, quietly
// marks "I'm holding this" — recognition, for themselves, never a score. State
// is self-disclosed + local-only (isPtFamily / isHoldingBadge); it is never sent
// to a server, never aggregated, never visible to a guide. Opt-in, so it appears
// only for a parent who says they're a Parents & Tots family.
// ---------------------------------------------------------------------------
export function renderParentBadgesJourney(host, parentId) {
  if (!host) return;
  if (!parentId) { host.innerHTML = ''; return; }

  // Step 1 - opt-in. Gentle, and "or not" is on the face of it.
  if (!isPtFamily(parentId)) {
    host.innerHTML = `
      <div class="pt-optin">
        <p class="pt-optin-text">Have a little one in <strong>Parents &amp; Tots</strong>? There's a small, private space here for you - or not, entirely as you like.</p>
        <button type="button" class="btn pt-optin-btn" data-pt-optin>Show me</button>
      </div>`;
    host.querySelector('[data-pt-optin]')?.addEventListener('click', () => {
      setPtFamily(parentId, true);
      renderParentBadgesJourney(host, parentId);
    });
    return;
  }

  // Step 2 - the conversation-first gate. A parent meets this BEFORE any arc:
  // the ask-first question (Kira), the named motive (Odo), the hard day at full
  // weight (Salus), and a first-class "nothing" door (Polaris). Cards live behind
  // it and appear only when a parent chooses to see them. (2026-07-16 review.)
  if (!isGateSeen(parentId)) {
    host.innerHTML = `
      <div class="pt-gate">
        <h3 class="pt-gate-title">First, a conversation - not a card</h3>
        <p class="pt-gate-ask">${esc(PARENT_GATE.askFirst)}</p>
        <p class="pt-gate-motive">${esc(PARENT_GATE.motive)}</p>
        <p class="pt-gate-hardday">${esc(PARENT_GATE.hardDay)}</p>
        <div class="pt-gate-choices">
          <button type="button" class="btn pt-gate-go" data-gate-go>We've talked - show the recognitions</button>
          <button type="button" class="pt-gate-none" data-gate-none>Just my kid and me, thanks</button>
        </div>
      </div>`;
    host.querySelector('[data-gate-go]')?.addEventListener('click', () => {
      setGateSeen(parentId, true);
      renderParentBadgesJourney(host, parentId);
    });
    host.querySelector('[data-gate-none]')?.addEventListener('click', () => {
      // First-class "nothing" - honored, not a conversion target, not a dead end.
      setPtFamily(parentId, false);
      setGateSeen(parentId, false);
      host.innerHTML = `
        <div class="pt-declined">
          <p class="pt-declined-text">Good. Just you and your kid - that's the whole of it. Nothing here is counted, and nothing is missed.</p>
          <button type="button" class="pt-declined-reopen" data-pt-reopen>Open it another time</button>
        </div>`;
      host.querySelector('[data-pt-reopen]')?.addEventListener('click', () => {
        setPtFamily(parentId, true);
        renderParentBadgesJourney(host, parentId);
      });
    });
    return;
  }

  // Step 3 - the arc. Practice reads as invitation, not command; the hard day is
  // held co-equal up top; "nothing counted" is stated in the open.
  const steps = PARENT_BADGE_ARC.map((b) => {
    const held = isHoldingBadge(parentId, b.id);
    return `
      <li class="pt-step${held ? ' is-held' : ''}">
        <p class="pt-step-name">${esc(b.name)}<span class="pt-step-when">${esc(b.stage)}</span></p>
        <p class="pt-step-quote">"${esc(b.quote)}"</p>
        <p class="pt-step-why">${esc(b.why)}</p>
        <p class="pt-step-practice"><strong>One way, if it fits:</strong> ${esc(b.practice)}</p>
        <button type="button" class="pt-hold-btn${held ? ' is-held' : ''}" data-hold="${esc(b.id)}">${held ? '✓ I’m holding this' : 'I’m holding this'}</button>
      </li>`;
  }).join('');

  // Stacked one card per row, in arc order (captain 2026-07-18): the wrap grid
  // ragged-aligned cards of unequal length. Decision 4 / Troi's anti-rank condition
  // is preserved in substance - equal weight, NO rank numbers, no "you are here" -
  // so a vertical order does not read as a ladder the parent is graded on. (The
  // guide REFERENCE view keeps the unordered wrap grid.)
  host.innerHTML = `
    <h3 class="pt-journey-title">Your Parents &amp; Tots journey · The Path</h3>
    <p class="pt-journey-sub">Recognition of a posture you're already practicing - private to you, never scored, seen by no one else. Nothing here is counted, and you can close it anytime.</p>
    <p class="pt-journey-hardday">${esc(PARENT_GATE.hardDay)}</p>
    <ul class="pt-path">${steps}</ul>
    <details class="pt-honesty"><summary>What these are, honestly</summary>
      <ul>${BADGE_HONESTY.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>
    </details>`;

  host.querySelectorAll('[data-hold]').forEach((btn) => btn.addEventListener('click', () => {
    const id = btn.dataset.hold;
    setHoldingBadge(parentId, id, !isHoldingBadge(parentId, id));
    renderParentBadgesJourney(host, parentId);
  }));
}
