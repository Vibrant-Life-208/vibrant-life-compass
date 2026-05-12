// First-run setup view.
// Per captain decision 2026-05-12: gates new learners until they have
// set age + studio, filled at least 5 year goals, and starred top 3
// priorities. Then partner approval (Phase 5) ships everything off.

import { getLearner, saveLearner, getGoals, submitYearPlan, getActivePartnerOf } from './store.js';
import { STUDIOS, getCategoriesForStudio } from './studios.js';
import { openYearGoalModal, openConfirmModal } from './modals.js';

const MIN_GOALS = 5;
const TOP_PRIORITIES = 3;

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

  const allGoals = await getGoals(learnerId);
  const yearGoals = allGoals.filter((g) => g.scope === 'year');
  const filledGoals = yearGoals.filter((g) => g.text && g.text.trim().length > 0);
  const priorityIds = Array.isArray(learner.priorityGoalIds) ? learner.priorityGoalIds : [];

  container.innerHTML = `
    <div class="setup-header">
      <h2 class="setup-title">Welcome, ${escapeHtml(learner.name || learner.heroName || 'Hero')}.</h2>
      <p class="setup-sub">A few things to set before you sit down at the Compass. Your year plan is yours to shape.</p>
    </div>

    <section class="setup-section">
      <h3 class="setup-section-title">1. About you</h3>
      <div class="setup-form">
        <div class="form-field">
          <label for="setup-age">How old are you?</label>
          <input type="number" id="setup-age" min="4" max="19" placeholder="Age in years" value="${learner.age ? Number(learner.age) : ''}">
        </div>
        <div class="form-field">
          <label for="setup-studio">Your studio</label>
          <select id="setup-studio">
            ${Object.entries(STUDIOS).map(([id, s]) =>
              `<option value="${id}" ${id === learner.studio ? 'selected' : ''}>${escapeHtml(s.name)} (${escapeHtml(s.ageRange || '')})</option>`
            ).join('')}
          </select>
        </div>
        <button type="button" id="setup-save-about" class="btn btn-text">Save</button>
      </div>
    </section>

    <section class="setup-section">
      <div class="setup-progress">
        <h3 class="setup-section-title">2. Your year goals</h3>
        <span class="setup-count ${filledGoals.length >= MIN_GOALS ? 'is-met' : ''}">${filledGoals.length} of ${MIN_GOALS} minimum</span>
      </div>
      <p class="setup-hint">Set at least ${MIN_GOALS} year goals. Tap a category to walk through the 9-stage plan (EOS 6 → baseline → EOS 3 → EOS 2 → EOS 1 → weekly steps for Sessions 1, 2, 3).</p>
      <div id="setup-goals-grid" class="setup-goals-grid"></div>
    </section>

    <section class="setup-section ${filledGoals.length >= MIN_GOALS ? '' : 'is-disabled'}">
      <div class="setup-progress">
        <h3 class="setup-section-title">3. Your top ${TOP_PRIORITIES} priorities</h3>
        <span class="setup-count ${priorityIds.length === TOP_PRIORITIES ? 'is-met' : ''}">${priorityIds.length} of ${TOP_PRIORITIES} starred</span>
      </div>
      <p class="setup-hint">${filledGoals.length >= MIN_GOALS
        ? `Of your ${filledGoals.length} goals, which ${TOP_PRIORITIES} matter most? Tap to star.`
        : `Available once you've set ${MIN_GOALS} goals.`}</p>
      <div id="setup-priority-list" class="setup-priority-list"></div>
    </section>

    <div class="setup-footer">
      <button type="button" id="setup-continue" class="btn btn-primary setup-continue-btn"
        ${filledGoals.length >= MIN_GOALS ? '' : 'disabled'}>
        Continue — send to my partner for approval
      </button>
      <p class="setup-footer-hint">${
        filledGoals.length < MIN_GOALS
          ? `Fill at least ${MIN_GOALS - filledGoals.length} more goal${MIN_GOALS - filledGoals.length === 1 ? '' : 's'} to continue.`
          : priorityIds.length === 0
          ? 'Top 3 priorities are optional — you can star them any time. Ready to send your plan to your partner for sign-off.'
          : 'Ready to send to your partner for sign-off.'
      }</p>
    </div>
  `;

  renderGoalsGrid(learner, filledGoals);
  renderPriorityList(learner, filledGoals, priorityIds);

  // Wire the about-you save
  document.getElementById('setup-save-about')?.addEventListener('click', async () => {
    const ageVal = document.getElementById('setup-age').value;
    const studio = document.getElementById('setup-studio').value;
    const updated = {
      id: learner.id,
      age: ageVal ? Number(ageVal) : null,
      studio,
    };
    await saveLearner(updated);
    await renderSetupView(learnerId);
  });

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
          await saveLearner({ id: learner.id, setupCompletedAt: new Date().toISOString() });
          location.reload();
        },
      });
      return;
    }
    // Submit the plan to the partner; learner moves into the main app
    // while waiting for approval.
    await submitYearPlan(learner.id);
    await saveLearner({ id: learner.id, setupCompletedAt: new Date().toISOString() });
    document.dispatchEvent(new CustomEvent('hc:partner-changed'));
    location.reload();
  });
}

function renderGoalsGrid(learner, filledGoals) {
  const grid = document.getElementById('setup-goals-grid');
  if (!grid) return;
  const cats = getCategoriesForStudio(learner.studio);

  grid.innerHTML = '';
  cats.forEach((cat) => {
    const filled = filledGoals.find((g) => g.categoryId === cat.id);
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'setup-goal-card' + (filled ? ' is-filled' : '');
    card.innerHTML = `
      <span class="setup-goal-cat">${escapeHtml(cat.name)}</span>
      <span class="setup-goal-kind">${escapeHtml(cat.kind)}</span>
      <p class="setup-goal-text">${filled ? escapeHtml(filled.text) : 'Tap to plan this goal'}</p>
      ${filled?.halfwayPoint ? `<span class="setup-goal-eos3"><strong>EOS 3:</strong> ${escapeHtml(filled.halfwayPoint)}</span>` : ''}
    `;
    card.addEventListener('click', () => {
      openYearGoalModal({
        category: cat,
        existing: filled,
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
          await renderSetupView(learner.id);
        },
      });
    });
    grid.appendChild(card);
  });
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
    item.disabled = filledGoals.length < MIN_GOALS;
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
