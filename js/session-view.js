// Session view. 1 of 7 sessions, navigable.

import { getLearner, getGoals, saveGoal, getParentLearnerLinks, addNotification } from './store.js';
import { getCategoriesForStudio, getStudioName, SESSIONS_PER_YEAR, WEEKS_PER_SESSION_DEFAULT, getYearCalendar } from './studios.js';
import { openGoalModal, openConfirmModal } from './modals.js';

let currentSession = 1;

export function setCurrentSession(n) {
  if (n >= 1 && n <= 7) currentSession = n;
}

export function getCurrentSession() {
  return currentSession;
}

export async function renderSessionView(learnerId) {
  const learner = await getLearner(learnerId);
  const title = document.getElementById('session-title');
  const meta = document.getElementById('session-meta');
  const list = document.getElementById('session-goals');

  if (!learner) {
    list.innerHTML = '<p class="learners-empty">No learner profile yet.</p>';
    return;
  }

  title.textContent = `Session ${currentSession} of ${SESSIONS_PER_YEAR}`;
  // Actual weeks for THIS session from the calendar, not a generic default -
  // the old "~5 weeks" was wrong for most sessions (S1=4, S3/S4=3, S5/S6=6, S7=7).
  const sessionWeeks = getYearCalendar().sessionWeeks[currentSession - 1] || WEEKS_PER_SESSION_DEFAULT;
  meta.textContent = `${getStudioName(learner.studio)} studio · ${sessionWeeks} weeks · ${learner.name}`;

  document.getElementById('session-prev').disabled = currentSession <= 1;
  document.getElementById('session-next').disabled = currentSession >= SESSIONS_PER_YEAR;

  const categories = getCategoriesForStudio(learner.studio);
  const allGoals = await getGoals(learnerId);
  const yearGoals = allGoals.filter((g) => g.scope === 'year');
  const sessionGoals = allGoals.filter(
    (g) => g.scope === 'session' && g.sessionIndex === currentSession
  );

  // D4 — coming-from anchor at the top of each session's view.
  // Pull from the prior session's last weekly task across all of this
  // learner's year goals. Skip on Session 1 (no prior session exists).
  const existingBanner = document.getElementById('session-continuity-banner');
  if (existingBanner) existingBanner.remove();
  if (currentSession > 1) {
    const priorSession = currentSession - 1;
    // weeklySteps shape: { 1: [w1,w2,w3,w4], 2: [..5..], 3: [..3..] }
    const priorLastWeekTexts = yearGoals
      .map((g) => {
        const weeks = g.weeklySteps?.[priorSession];
        if (!Array.isArray(weeks)) return null;
        const lastIdx = weeks.length - 1;
        const text = weeks[lastIdx];
        if (!text) return null;
        const cat = categories.find((c) => c.id === g.categoryId);
        return { cat: cat?.name || g.categoryId, text };
      })
      .filter(Boolean);
    if (priorLastWeekTexts.length > 0) {
      const banner = document.createElement('div');
      banner.id = 'session-continuity-banner';
      banner.className = 'session-continuity-banner';
      banner.innerHTML = `
        <span class="continuity-label">Picking up from end of Session ${priorSession}</span>
        <ul class="session-continuity-list">
          ${priorLastWeekTexts.map((p) => `
            <li><strong>${escapeHtml(p.cat)}:</strong> ${escapeHtml(p.text)}</li>
          `).join('')}
        </ul>
      `;
      meta.parentNode.insertBefore(banner, meta.nextSibling);
    }
  }

  list.innerHTML = '';

  // Hide blanks (Captain 2026-07-13): only categories with a session goal show,
  // each surfaced through its weekly steps for this session. Planning happens in
  // Setup's guided walkthrough (year goals auto-seed Sessions 1-3); this page
  // shows and completes what's planned, not a wall of empty category shells.
  const planned = categories.filter((cat) => sessionGoals.some((g) => g.categoryId === cat.id));

  if (planned.length === 0) {
    list.innerHTML = '<p class="north-vision-empty">No goals for this session yet. Set your year goals in <strong>Setup</strong> - Sessions 1-3 fill in from there automatically.</p>';
    return;
  }

  planned.forEach((cat) => {
    const goal = sessionGoals.find((g) => g.categoryId === cat.id);
    // This category's weekly steps for the current session, from the year goal.
    const yearGoal = yearGoals.find((g) => g.categoryId === cat.id);
    const weeks = yearGoal?.weeklySteps?.[currentSession];
    const steps = (Array.isArray(weeks) ? weeks : []).map((s) => (s || '').trim()).filter(Boolean);
    const stepsHtml = steps.length
      ? `<ul class="category-tasks">${steps.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>`
      : '';
    const card = document.createElement('div');
    card.className = 'category-card';
    const placeholder = `Example: ${cat.example}`;
    const isDone = goal?.status === 'done';
    const statusBadge = isDone
      ? '<span class="goal-status goal-status-done">Complete ✓</span>'
      : '';
    const markCompleteButton = (goal && !isDone)
      ? `<button type="button" class="btn btn-text session-goal-complete" data-id="${goal.id}">Mark complete</button>`
      : '';
    const shareButton = (goal && isDone)
      ? `<button type="button" class="btn btn-text session-goal-share" data-id="${goal.id}">Share this win with my parents</button>`
      : '';
    card.innerHTML = `
      <div class="category-header">
        <span class="category-name">${cat.name}${statusBadge}</span>
        <span class="category-kind">${cat.kind}</span>
      </div>
      <p class="category-goal ${goal ? '' : 'empty'} ${isDone ? 'goal-done' : ''}">${goal ? escapeHtml(goal.text) : escapeHtml(placeholder)}</p>
      ${stepsHtml}
      ${markCompleteButton}
      ${shareButton}
    `;
    // Card-tap opens the edit modal, but only if a button inside wasn't tapped.
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('session-goal-complete')) return;
      if (e.target.classList.contains('session-goal-share')) return;
      openGoalModal({
        title: `${cat.name} - Session ${currentSession} goal`,
        existing: goal,
        example: cat.example,
        onSave: async (text) => {
          await saveGoal({
            id: goal?.id,
            learnerId,
            categoryId: cat.id,
            scope: 'session',
            sessionIndex: currentSession,
            text,
            status: goal?.status || 'active',
          });
          await renderSessionView(learnerId);
        },
      });
    });

    // Mark-complete button: toggle status to 'done' + prompt to share.
    const completeBtn = card.querySelector('.session-goal-complete');
    if (completeBtn) {
      completeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await saveGoal({ ...goal, status: 'done' });
        await renderSessionView(learnerId);
        // Celebrate + offer to ping parents. Three choices, including
        // a no-position skip (SSC-D1 2026-05-13: consent includes abstention).
        openConfirmModal({
          title: 'Nicely done',
          body: `You marked "${goal.text}" complete. Share this win with your parents?`,
          confirmLabel: 'Share with parents',
          cancelLabel: 'Just for me',
          dismissLabel: 'Skip',
          onConfirm: async () => {
            await pingParentsAboutWin(learner, learnerId, goal);
          },
        });
      });
    }

    // Share button (for already-complete goals where the learner skipped the share prompt earlier)
    const shareBtn = card.querySelector('.session-goal-share');
    if (shareBtn) {
      shareBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await pingParentsAboutWin(learner, learnerId, goal);
      });
    }

    list.appendChild(card);
  });
}

async function pingParentsAboutWin(learner, learnerId, goal) {
  const links = await getParentLearnerLinks();
  const parentIds = links.filter((l) => l.learnerId === learnerId).map((l) => l.parentId);
  if (parentIds.length === 0) {
    openConfirmModal({
      title: 'No parent linked yet',
      body: 'A guide can link a parent to your account so you can share wins with them.',
      confirmLabel: 'OK',
      cancelLabel: 'Cancel',
      onConfirm: () => {},
    });
    return;
  }
  for (const pid of parentIds) {
    await addNotification({
      recipientId: pid,
      type: 'milestone-shared',
      title: 'A session win to celebrate',
      body: `${learner.name || learner.heroName} marked complete: ${goal.text}`,
      fromId: learnerId,
    });
  }
  openConfirmModal({
    title: 'Yes!',
    body: `${parentIds.length === 1 ? 'Your parent just heard' : 'Your parents just heard'}. Big moment - sit with it for a second.`,
    confirmLabel: 'OK',
    cancelLabel: 'Cancel',
    onConfirm: () => {},
  });
}

export function initSessionNav(learnerId) {
  document.getElementById('session-prev').addEventListener('click', async () => {
    if (currentSession > 1) {
      currentSession--;
      await renderSessionView(learnerId);
      import('./app.js').then(m => m.applyLandscape?.(currentSession));
    }
  });
  document.getElementById('session-next').addEventListener('click', async () => {
    if (currentSession < SESSIONS_PER_YEAR) {
      currentSession++;
      await renderSessionView(learnerId);
      import('./app.js').then(m => m.applyLandscape?.(currentSession));
    }
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
