// First-run setup view.
// Per captain decision 2026-05-12, revised 2026-07-21: the full set is 5 year goals
// (one per region) + top-3 priorities, but the gates are staged so a learner isn't
// blocked from starting: they can move into North once 2 goals are filled, and the
// top-priorities prompt unlocks at 3. Then partner approval (Phase 5) ships it off.

import {
  getLearner, saveLearner, getGoals, submitYearPlan,
  getActivePartnerOf, getPendingProposalsFor, getLearners, getPartnerLinks,
  proposePartner, respondToPartnerProposal, saveTask,
} from './store.js';
import { STUDIOS, getCategoriesForStudio, getCalendarForStudio, getStudioName } from './studios.js';
import { openYearGoalModal, openConfirmModal, openGoalSetupModal, openThresholdsModal } from './modals.js';
import { isCurrentWheelBuild } from './thresholds.js';
import { autoScheduleYearPlan } from './auto-schedule.js';

const MIN_GOALS = 5;          // the full set - one goal per compass region (the target)
const NORTH_MIN = 2;          // can move into North once this many goals are filled (captain 2026-07-21)
const PRIORITY_MIN = 3;       // the top-priorities prompt unlocks at this many goals (captain 2026-07-21)
const TOP_PRIORITIES = 3;

// Turn a goal's weekly steps into dated tasks in North (learner-initiated via the
// review-stage choice). Each non-empty step becomes a task tagged with the goal's
// category. Two timings (captain 2026-07-11):
//   mode 'now'      - start this week: steps land on consecutive weeks from now.
//   mode 'session1' - prep for the school year: steps land on their own
//                     session/week calendar dates.
// Never automatic - the learner opts in per goal.
async function sendWeeklyStepsToNorth(learner, categoryId, weeklySteps, mode) {
  const cal = getCalendarForStudio(learner.studio);
  const toISO = (d) => d.toISOString().slice(0, 10);
  // Flatten non-empty steps in session/week order.
  const ordered = [];
  for (const [sessionIndex, steps] of Object.entries(weeklySteps || {})) {
    (Array.isArray(steps) ? steps : []).forEach((step, i) => {
      const text = (step || '').trim();
      if (text) ordered.push({ sessionIndex: Number(sessionIndex), weekIdx: i + 1, text });
    });
  }
  let mondayNow = null;
  if (mode === 'now') {
    const t = new Date();
    const day = t.getDay(); // 0 = Sunday
    mondayNow = new Date(t);
    mondayNow.setDate(t.getDate() + (day === 0 ? -6 : 1 - day));
  }
  for (let idx = 0; idx < ordered.length; idx++) {
    const { sessionIndex, weekIdx, text } = ordered[idx];
    let plannedFor;
    if (mode === 'now') {
      const d = new Date(mondayNow);
      d.setDate(mondayNow.getDate() + idx * 7);
      plannedFor = toISO(d);
    } else {
      const start = cal.sessionStarts[sessionIndex - 1];
      if (!start) continue;
      const d = new Date(start + 'T00:00:00');
      d.setDate(d.getDate() + (weekIdx - 1) * 7);
      plannedFor = toISO(d);
    }
    // Steps from the plan are weekly milestones -> the base region colour (region
    // resolves from categoryId when it is a slice_ life-area). (Captain 2026-07-21.)
    await saveTask(learner.id, { text, plannedFor, categoryId, band: 'weekly' });
  }
}

export async function renderSetupView(learnerId) {
  const container = document.getElementById('setup-view-content');
  if (!container) return;
  if (!learnerId) {
    container.innerHTML = '<p class="learners-empty">Sign in to begin setup.</p>';
    return;
  }

  const learner = await getLearner(learnerId);
  if (!learner) {
    container.innerHTML = '<p class="learners-empty">No learner record.</p>';
    return;
  }
  // Per-learner current-wheel gate (v0.23). Flag off => the legacy setup copy + flow.
  const currentWheel = isCurrentWheelBuild(learner);

  const allGoals = await getGoals(learnerId);
  const yearGoals = allGoals.filter((g) => g.scope === 'year');
  const filledGoals = yearGoals.filter((g) => g.text && g.text.trim().length > 0);
  const priorityIds = Array.isArray(learner.priorityGoalIds) ? learner.priorityGoalIds : [];

  // Day-1 partner gate: pre-setup learners can also receive + accept proposals
  // and propose to others, so partnerships can form before anyone has finished
  // setup. Otherwise on opening day nobody can pair up.
  const pendingProposals = await getPendingProposalsFor(learner.id);
  const myActivePartnerLink = await getActivePartnerOf(learner.id);
  const allLinks = await getPartnerLinks();
  const outboundProposed = allLinks.find(
    (l) => l.status === 'proposed' && l.proposerId === learner.id
  );

  let inboundProposerName = '';
  let inboundLinkId = '';
  if (pendingProposals.length > 0) {
    const inboundLink = pendingProposals[0];
    inboundLinkId = inboundLink.id;
    const proposer = await getLearner(inboundLink.proposerId);
    inboundProposerName = proposer?.name || proposer?.heroName || 'Someone';
  }
  let myActivePartnerName = '';
  if (myActivePartnerLink) {
    const partner = await getLearner(myActivePartnerLink.partnerId);
    myActivePartnerName = partner?.name || partner?.heroName || 'your partner';
  }
  let outboundPartnerName = '';
  if (outboundProposed) {
    const target = await getLearner(outboundProposed.partnerId);
    outboundPartnerName = target?.name || target?.heroName || 'them';
  }

  // Gate the rest of setup until About You (age + studio) is saved. Goal
  // categories and accountability-partner candidates are studio-specific;
  // showing them before studio is committed leads to stale lists when the
  // dropdown changes without a save.
  // Age is no longer asked here (captain 2026-07-14): studio is roster-known, and
  // the only age moment is the pitch gate. About You is complete once studio is set.
  const aboutComplete = Boolean(learner.studio);

  // Entry fork (captain 2026-07-21): leveling-up = age-eligible AND self-declared. The pitch
  // system already encodes both - pitchTargetStudio is set when the learner opts in (self-
  // declared), and pitchAgeStatus is the guide's yes/no on the age self-report (not a birthday).
  // A denied pitch means "returning," not leveling-up. Leveling-up learners lead their year with
  // the crossing (threshold goals); everyone else leads with their own goals. The crossing says
  // nothing about readiness - the learner's story speaks; a guide names the crossing (gate dissolved).
  const levelingUp = Boolean(learner.pitchTargetStudio) && learner.pitchAgeStatus !== 'denied';
  const crossingTargetName = levelingUp ? getStudioName(learner.pitchTargetStudio) : '';

  container.innerHTML = `
    ${inboundProposerName ? `
      <div class="setup-partner-banner">
        <p class="setup-partner-banner-text">
          <strong>${escapeHtml(inboundProposerName)}</strong> wants you as their accountability partner. You can answer now, before finishing the rest of setup.
        </p>
        <div class="setup-partner-banner-actions">
          <button type="button" class="btn btn-text" data-partner-action="decline" data-link-id="${escapeAttr(inboundLinkId)}">Decline</button>
          <button type="button" class="btn btn-primary" data-partner-action="accept" data-link-id="${escapeAttr(inboundLinkId)}">Accept</button>
        </div>
      </div>
    ` : ''}

    <div class="setup-header">
      <h2 class="setup-title">Welcome, ${escapeHtml(learner.name || learner.heroName || 'Hero')}.</h2>
      <p class="setup-sub">${aboutComplete
        ? `A few things to set before you sit down at the Compass. Your year plan is yours to shape.`
        : `Start by telling us a couple things about you. Once you save, the rest of setup opens up.`}</p>
    </div>

    <section class="setup-section">
      <h3 class="setup-section-title">1. Your studio</h3>
      <div class="setup-form">
        <div class="form-field">
          ${learner.studio
            ? `<p class="setup-studio-readonly"><strong>${escapeHtml(STUDIOS[learner.studio]?.name || learner.studio)}</strong>${STUDIOS[learner.studio]?.ageRange ? ` (${escapeHtml(STUDIOS[learner.studio].ageRange)})` : ''}</p>
               <p class="setup-hint">Your studio is set by your guide. If it looks wrong, ask them to change it — you can't change it here.</p>`
            : `<p class="setup-hint">No studio assigned yet. Ask your guide to set your studio before you start.</p>`}
        </div>
      </div>
    </section>

    ${aboutComplete ? `
    ${levelingUp ? `
    <section class="setup-section setup-crossing-lead">
      <h3 class="setup-section-title">This year: moving up to ${escapeHtml(crossingTargetName)}</h3>
      <p class="setup-hint">A crossing - a new studio, new guides, a new chapter. You start by breaking down what it takes to get ready, across your whole compass. Your other goals still matter; this one leads.</p>
      <button type="button" class="btn btn-primary" id="setup-crossing-open">Break down your move-up goal</button>
    </section>
    ` : ''}
    <section class="setup-section">
      <div class="setup-progress">
        <h3 class="setup-section-title">2. Your year goals</h3>
        <span class="setup-count ${filledGoals.length >= MIN_GOALS ? 'is-met' : ''}">${currentWheel
          ? (filledGoals.length >= NORTH_MIN ? 'Ready when you are' : '')
          : `${filledGoals.length} of ${MIN_GOALS}`}</span>
      </div>
      <p class="setup-hint">${currentWheel
        ? `Tap a goal to plan it - where you are now, your halfway milestone, and a few first steps.`
        : `Set up to ${MIN_GOALS} year goals - one per region. You can move into your Compass once you have ${NORTH_MIN}, and star your priorities at ${PRIORITY_MIN}. Tap a category to walk through the 9-stage plan (End of Session 6 → baseline → End of Session 3 → End of Session 2 → End of Session 1 → weekly steps for Sessions 1, 2, 3).`}</p>
      <div id="setup-goals-grid" class="setup-goals-grid"></div>
    </section>

    <section class="setup-section ${filledGoals.length >= PRIORITY_MIN ? '' : 'is-disabled'}">
      <div class="setup-progress">
        <h3 class="setup-section-title">3. Your top ${TOP_PRIORITIES} priorities</h3>
        <span class="setup-count ${priorityIds.length === TOP_PRIORITIES ? 'is-met' : ''}">${currentWheel
          ? (priorityIds.length === TOP_PRIORITIES ? 'Ready when you are' : '')
          : `${priorityIds.length} of ${TOP_PRIORITIES} starred`}</span>
      </div>
      <p class="setup-hint">${filledGoals.length >= PRIORITY_MIN
        ? (currentWheel ? 'Which few matter most right now? Tap to star.' : `Of your ${filledGoals.length} goals, which ${TOP_PRIORITIES} matter most? Tap to star.`)
        : (currentWheel ? 'Available once you have set a few goals.' : `Available once you've set ${PRIORITY_MIN} goals.`)}</p>
      <div id="setup-priority-list" class="setup-priority-list"></div>
    </section>

    <section class="setup-section">
      <h3 class="setup-section-title">4. Your accountability partner</h3>
      <p class="setup-hint">Optional now — you can pick one any time from the Partner tab. But picking now means your year plan gets signed off as soon as setup is done.</p>
      <div id="setup-partner-zone" class="setup-partner-zone"></div>
    </section>
    ` : ''}

    ${aboutComplete ? `
    <div class="setup-footer">
      <button type="button" id="setup-continue" class="btn btn-primary setup-continue-btn"
        ${filledGoals.length >= NORTH_MIN ? '' : 'disabled'}>
        Continue — send to my partner for approval
      </button>
      <p class="setup-footer-hint">${
        filledGoals.length < NORTH_MIN
          ? (currentWheel ? 'Set a couple of goals to continue.' : `Fill at least ${NORTH_MIN - filledGoals.length} more goal${NORTH_MIN - filledGoals.length === 1 ? '' : 's'} to continue.`)
          : filledGoals.length < MIN_GOALS
          ? `You can move into your Compass now - or set the rest of your ${MIN_GOALS} and star your top ${TOP_PRIORITIES} first. Your plan goes to your partner for sign-off.`
          : priorityIds.length === 0
          ? `Top ${TOP_PRIORITIES} priorities are optional — you can star them any time. Ready to send your plan to your partner for sign-off.`
          : 'Ready to send to your partner for sign-off.'
      }</p>
    </div>
    ` : ''}
  `;

  // Sections 2-4 only render after About You is saved; skip the section
  // populators when the gate is closed.
  if (aboutComplete) {
    renderGoalsGrid(learner, filledGoals);
    renderPriorityList(learner, filledGoals, priorityIds);
    await renderPartnerZoneInSetup(learner, {
      myActivePartnerLink,
      myActivePartnerName,
      outboundProposed,
      outboundPartnerName,
    });
  }

  // Wire the inbound-proposal banner buttons (top of view)
  container.querySelectorAll('[data-partner-action]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const linkId = btn.dataset.linkId;
      const accepted = btn.dataset.partnerAction === 'accept';
      await respondToPartnerProposal(linkId, accepted);
      document.dispatchEvent(new CustomEvent('hc:partner-changed'));
      await renderSetupView(learnerId);
    });
  });

  // Crossing lead (leveling-up learners only): the move-up goal leads their year. Opens the
  // thresholds breakdown - the crossing's task-list, region-grouped. No readiness meter.
  document.getElementById('setup-crossing-open')?.addEventListener('click', () => {
    openThresholdsModal(learner.pitchTargetStudio, learner);
  });

  // Studio is now read-only in Setup (assigned by the guide at account
  // creation). The old reactive dirty-check + about-you save handler were
  // removed with the studio dropdown so a learner can't reassign their studio.

  // Wire the continue button - submit year plan to partner for approval
  document.getElementById('setup-continue')?.addEventListener('click', async () => {
    const partner = await getActivePartnerOf(learner.id);
    if (!partner) {
      openConfirmModal({
        title: 'You need a partner first',
        body: 'Year plans get signed off by your accountability partner. Set one up before submitting your plan. (Look for the Partner tab once you finish setup.)',
        confirmLabel: 'Continue anyway',
        cancelLabel: 'Set up partner first',
        onConfirm: async () => {
          // Session-1 flow: spread the year plan across the calendar as dated, coloured
          // tasks the learner can then rearrange. Guarded so a hiccup never blocks entry.
          try { await autoScheduleYearPlan(learner.id); } catch (e) { console.warn('auto-schedule:', e); }
          await saveLearner({ id: learner.id, setupCompletedAt: new Date().toISOString() });
          location.reload();
        },
      });
      return;
    }
    // Submit the plan to the partner; learner moves into the main app
    // while waiting for approval.
    await submitYearPlan(learner.id);
    // Session-1 flow: auto-schedule the year plan onto the weeks (see auto-schedule.js).
    try { await autoScheduleYearPlan(learner.id); } catch (e) { console.warn('auto-schedule:', e); }
    await saveLearner({ id: learner.id, setupCompletedAt: new Date().toISOString() });
    document.dispatchEvent(new CustomEvent('hc:partner-changed'));
    location.reload();
  });
}

function renderGoalsGrid(learner, filledGoals) {
  const grid = document.getElementById('setup-goals-grid');
  if (!grid) return;
  // Per-learner current-wheel gate (v0.23). Flag off => the legacy card copy + edit path.
  const currentWheel = isCurrentWheelBuild(learner);
  const cats = getCategoriesForStudio(learner.studio);

  grid.innerHTML = '';
  const renderCard = (cat) => {
    const filled = filledGoals.find((g) => g.categoryId === cat.id);
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'setup-goal-card' + (filled ? ' is-filled' : '');
    card.innerHTML = `
      <span class="setup-goal-cat">${escapeHtml(cat.name)}</span>
      <span class="setup-goal-kind">${escapeHtml(cat.kind)}</span>
      <p class="setup-goal-text">${filled ? escapeHtml(filled.text) : 'Tap to plan this goal'}</p>
      ${filled?.halfwayPoint ? `<span class="setup-goal-eos3"><strong>${currentWheel ? 'Your milestone:' : 'End of Session 3:'}</strong> ${escapeHtml(filled.halfwayPoint)}</span>` : ''}
    `;
    card.addEventListener('click', () => {
      // Stage M (behind the flag): a goal with no milestone yet opens the ratified per-goal
      // setup flow (now -> milestone -> a few near-steps; 8-agent review 2026-07-17) instead of
      // the 9-stage modal. Milestone-already-set stays on the 9-stage edit path for now. Flag
      // off: byte-identical to before.
      if (currentWheel && !(filled && filled.halfwayPoint)) {
        openGoalSetupModal({ goal: filled || null, category: cat, learnerId: learner.id, onDone: () => renderSetupView(learner.id) });
        return;
      }
      openYearGoalModal({
        category: cat,
        existing: filled,
        isFirstTime: filledGoals.length === 0,
        studio: learner.studio,
        onSave: async (data) => {
          const { saveGoal } = await import('./store.js');
          await saveGoal({
            id: filled?.id,
            learnerId: learner.id,
            categoryId: cat.id,
            scope: 'year',
            text: data.text,
            baseline: data.baseline,
            halfwayPoint: data.halfwayPoint,
            quarterPoint: data.quarterPoint,
            eos1Point: data.eos1Point,
            weeklySteps: data.weeklySteps || {},
            targetSession: 6,
            status: filled?.status || 'active',
          });
          // Auto-populate Session 1/2/3 goals
          const allGoals = await getGoals(learner.id);
          const seedSession = async (sessionIndex, seedText) => {
            if (!seedText) return;
            const existingS = allGoals.find(
              (g) => g.scope === 'session' && g.sessionIndex === sessionIndex && g.categoryId === cat.id
            );
            if (!existingS) {
              await saveGoal({
                learnerId: learner.id,
                categoryId: cat.id,
                scope: 'session',
                sessionIndex,
                text: seedText,
                autoPopulated: true,
                status: 'active',
              });
            } else if (existingS.autoPopulated) {
              await saveGoal({ ...existingS, text: seedText, autoPopulated: true });
            }
          };
          await seedSession(3, data.halfwayPoint);
          await seedSession(2, data.quarterPoint);
          await seedSession(1, data.eos1Point);
          if (data.addToNorth) await sendWeeklyStepsToNorth(learner, cat.id, data.weeklySteps, data.addToNorth);
          await renderSetupView(learner.id);
        },
      });
    });
    grid.appendChild(card);
  };

  // Group goals into families so they read "categorized as such" (Captain
  // 2026-07-10): Core (school work) vs Slices of Life (whole-life) vs Pathway /
  // Practice. A learner might fill several Core goals or lean into their Slices
  // of Life - each family gets its own header. Empty families are skipped.
  const KIND_SECTIONS = [
    ['core', 'Core'],
    ['personal', 'Slices of Life'],
    ['pathway', 'Pathway'],
    ['practice', 'Practice'],
    ['conditional', 'When assigned'],
  ];
  const seen = new Set();
  KIND_SECTIONS.forEach(([kind, label]) => {
    const inKind = cats.filter((c) => c.kind === kind);
    if (!inKind.length) return;
    const h = document.createElement('h3');
    h.className = 'setup-goals-section';
    h.textContent = label;
    grid.appendChild(h);
    inKind.forEach((c) => { renderCard(c); seen.add(c.id); });
  });
  // Any category with an unmapped kind still shows, ungrouped, at the end.
  cats.filter((c) => !seen.has(c.id)).forEach(renderCard);
}

function renderPriorityList(learner, filledGoals, priorityIds) {
  const list = document.getElementById('setup-priority-list');
  if (!list) return;

  if (filledGoals.length === 0) {
    list.innerHTML = '<p class="setup-empty">No goals filled yet.</p>';
    return;
  }

  const cats = getCategoriesForStudio(learner.studio);
  list.innerHTML = '';
  filledGoals.forEach((goal) => {
    const cat = cats.find((c) => c.id === goal.categoryId);
    const starred = priorityIds.includes(goal.id);
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'setup-priority-item' + (starred ? ' is-starred' : '');
    item.disabled = filledGoals.length < PRIORITY_MIN;
    item.innerHTML = `
      <span class="setup-priority-star">${starred ? '★' : '☆'}</span>
      <span class="setup-priority-cat">${escapeHtml(cat?.name || goal.categoryId)}</span>
      <span class="setup-priority-text">${escapeHtml(goal.text)}</span>
    `;
    item.addEventListener('click', async () => {
      let newPriorities = [...priorityIds];
      if (starred) {
        newPriorities = newPriorities.filter((id) => id !== goal.id);
      } else if (newPriorities.length < TOP_PRIORITIES) {
        newPriorities.push(goal.id);
      } else {
        // At max - replace the first one (or could prompt). Simplest: refuse, force unstar first.
        return;
      }
      await saveLearner({ id: learner.id, priorityGoalIds: newPriorities });
      await renderSetupView(learner.id);
    });
    list.appendChild(item);
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s) {
  return escapeHtml(s);
}

// Renders the "4. Your accountability partner" zone inside the setup view.
// Three states:
//   - Active partnership: shows "Walking with X" (purely informational)
//   - Outbound proposal pending: shows "Waiting for X to accept"
//   - Otherwise: shows candidate list with propose buttons
// The "inbound proposal" case is handled by a top-of-view banner, not here.
async function renderPartnerZoneInSetup(learner, ctx) {
  const zone = document.getElementById('setup-partner-zone');
  if (!zone) return;

  if (ctx.myActivePartnerLink) {
    zone.innerHTML = `
      <div class="setup-partner-state">
        <span class="setup-partner-state-label">Walking with</span>
        <strong>${escapeHtml(ctx.myActivePartnerName)}</strong>
        <p class="setup-partner-state-note">They'll sign off on your year plan after setup. You can manage this from the Partner tab anytime.</p>
      </div>
    `;
    return;
  }

  if (ctx.outboundProposed) {
    zone.innerHTML = `
      <div class="setup-partner-state">
        <span class="setup-partner-state-label">Waiting for</span>
        <strong>${escapeHtml(ctx.outboundPartnerName)}</strong>
        <p class="setup-partner-state-note">They'll see your request when they sign in. You can keep working on the rest of setup while they decide.</p>
      </div>
    `;
    return;
  }

  // Pick a partner. Same filter as the main partner page: same studio, no active partner.
  const allLearners = await getLearners();
  const candidates = [];
  for (const l of allLearners) {
    if (l.id === learner.id) continue;
    if (l.studio !== learner.studio) continue;
    const theirPartner = await getActivePartnerOf(l.id);
    if (theirPartner) continue;
    candidates.push(l);
  }

  if (candidates.length === 0) {
    zone.innerHTML = `
      <p class="learners-empty">Nobody in your studio is available to pair with yet. You can come back to this anytime from the Partner tab.</p>
    `;
    return;
  }

  zone.innerHTML = `
    <div class="setup-partner-candidates">
      ${candidates.map((c) => `
        <button type="button" class="setup-partner-candidate" data-candidate-id="${escapeAttr(c.id)}">
          <span class="setup-partner-candidate-name">${escapeHtml(c.name || c.heroName)}</span>
          <span class="setup-partner-candidate-studio">${escapeHtml(c.studio)}</span>
        </button>
      `).join('')}
    </div>
  `;

  zone.querySelectorAll('[data-candidate-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const targetId = btn.dataset.candidateId;
      const target = candidates.find((c) => c.id === targetId);
      openConfirmModal({
        title: `Propose ${target?.name || target?.heroName || 'them'} as your partner?`,
        body: `They'll get a request to accept. Until they accept, you don't have an accountability partner yet.`,
        confirmLabel: 'Send proposal',
        cancelLabel: 'Not yet',
        onConfirm: async () => {
          await proposePartner(learner.id, targetId);
          document.dispatchEvent(new CustomEvent('hc:partner-changed'));
          await renderSetupView(learner.id);
        },
      });
    });
  });
}
