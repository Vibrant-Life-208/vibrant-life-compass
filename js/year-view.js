// Compass (year view).

import { getLearner, getGoals, saveGoal, getYearQuote, setYearQuote, getProfileHorizons, setProfileHorizon, getYearTraits, setYearTraits, getActivePartnerOf, markYearGoalPendingApproval, addNotification, getParentLearnerLinks } from './store.js';
import { getCategoriesForStudio, getStudioName, lifeAreaForCategory } from './studios.js';
import { openGoalModal, openQuoteModal, openHorizonModal, openTraitsModal, openConfirmModal, openYearGoalModal, openGoalArcModal, openGoalSetupModal } from './modals.js';
import { isCurrentWheelBuild } from './thresholds.js';
import { renderYearMap } from './year-map.js';
import { getYearMapClickHandler } from './north.js';
import { renderLifeWheel, getWheelAreas } from './wheel.js';

let wired = false;

// The telescope, made revisitable. The onboarding cascade walks 10yr -> 5yr ->
// 1yr once; this surfaces the same three horizons on the Compass so the vision
// stays a living thing the learner returns to. Same profileHorizons store the
// cascade writes (js/backend supabase columns vision_beyond_5yr / _within_5yr /
// _within_1yr), so it shows exactly what they wrote. (Captain 2026-07-15.)
const HORIZON_VIEW = [
  { key: 'beyond_5yr', label: '10 years from now', prompt: 'Ten years from now - who have you become? What does your life look like? Let yourself imagine. There is no wrong answer.' },
  { key: 'within_5yr', label: '5 years from now', prompt: 'Now bring it closer. Five years from now - what do you want to be true?' },
  { key: 'within_1yr', label: '1 year from now', prompt: 'Twelve months from now - what do you want to have grown into?' },
];

function renderHorizons(learnerId, horizons) {
  const el = document.getElementById('year-horizons');
  if (!el) return;
  el.innerHTML = '';
  HORIZON_VIEW.forEach((h) => {
    const val = (horizons[h.key] || '').trim();
    const row = document.createElement('div');
    row.className = 'horizon-row';
    row.innerHTML = `
      <p class="horizon-label">${h.label}</p>
      <p class="horizon-text ${val ? '' : 'empty'}">${val ? escapeHtml(val) : 'Tap to write'}</p>
    `;
    row.addEventListener('click', () => {
      openHorizonModal({
        label: h.label,
        prompt: h.prompt,
        existing: horizons[h.key] || '',
        onSave: async (next) => {
          await setProfileHorizon(learnerId, h.key, next);
          await renderYearView(learnerId);
        },
      });
    });
    el.appendChild(row);
  });
}

export async function renderYearView(learnerId) {
  const learner = await getLearner(learnerId);
  const list = document.getElementById('year-categories');
  if (!learner) {
    list.innerHTML = '<p class="learners-empty">No learner profile yet.</p>';
    return;
  }
  // Per-learner current-wheel gate (v0.23). Local dev: always true; prod: this learner's
  // current_wheel_test flag. Flag off => byte-identical to the legacy year view.
  const currentWheel = isCurrentWheelBuild(learner);
  // Wheel of Life: reflection-only whole-life frame above the goals. Grows with
  // the child - each studio gets its own age-appropriate ring (Sparks 4 areas ->
  // adult 12). See wheel.js. (Captain design 2026-07-09.)
  renderLifeWheel(learner.studio);

  // Year Map at top of Compass page (moved from North per captain 2026-05-12).
  const yearMapEl = document.getElementById('compass-year-map');
  if (yearMapEl) {
    renderYearMap(yearMapEl, learner, {
      onSessionClick: (sessionNumber) => {
        const h = getYearMapClickHandler();
        if (h) h(sessionNumber);
      },
    });
  }

  const categories = getCategoriesForStudio(learner.studio);
  const [allGoals, quoteText, horizons, traits, partner] = await Promise.all([
    getGoals(learnerId),
    getYearQuote(learnerId),
    getProfileHorizons(learnerId),
    getYearTraits(learnerId),
    getActivePartnerOf(learnerId),
  ]);
  const goals = allGoals.filter((g) => g.scope === 'year');

  // My Horizons: the telescope (10yr / 5yr / 1yr), revisitable after onboarding.
  renderHorizons(learnerId, horizons);

  // Quote
  const quoteEl = document.getElementById('year-quote-text');
  quoteEl.textContent = quoteText || 'Tap to set';
  quoteEl.classList.toggle('empty', !quoteText);

  // Traits
  const traitsEl = document.getElementById('year-traits-text');
  traitsEl.textContent = traits.length ? traits.join(' · ') : 'Tap to set';
  traitsEl.classList.toggle('empty', !traits.length);

  if (!wired) {
    document.querySelector('.year-quote')?.addEventListener('click', async () => {
      const existing = await getYearQuote(learnerId);
      const editFlow = async () => openQuoteModal(existing, async (next) => {
        await setYearQuote(learnerId, next);
        await renderYearView(learnerId);
      });
      if (existing) {
        openConfirmModal({
          title: 'Change your motivational quote?',
          body: 'Your quote is your anchor for the year. Most learners keep theirs until Session 7. Are you sure you want to change it?',
          confirmLabel: 'Change anyway',
          cancelLabel: 'Keep my quote',
          onConfirm: editFlow,
        });
      } else {
        editFlow();
      }
    });
    document.querySelector('.year-traits')?.addEventListener('click', async () => {
      const existing = await getYearTraits(learnerId);
      openTraitsModal(existing, async (next) => {
        await setYearTraits(learnerId, next);
        await renderYearView(learnerId);
      });
    });
    wired = true;
  }

  // Categories
  list.innerHTML = '';

  const studioHeader = document.createElement('p');
  studioHeader.className = 'session-meta';
  studioHeader.textContent = `${getStudioName(learner.studio)} studio · ${learner.name}`;
  list.appendChild(studioHeader);

  // SSC-D2 (2026-05-13): low-shame reset copy for stuck learners. Accord's
  // observation - the recursive-halving structure is emotionally demanding
  // for anxious-perfectionist kids; locking End of Session 3 can become dread. A quiet
  // text presence makes "this is hard right now" a known state, not a
  // private shame loop.
  const resetCue = document.createElement('p');
  resetCue.className = 'compass-reset-cue';
  resetCue.textContent = 'Sometimes a goal looks impossible. That is information, not failure. Bring it to your partner or your guide.';
  list.appendChild(resetCue);

  // Glossary line retired 2026-05-13 — captain spelled out "End of Session"
  // everywhere it appears, so the abbreviation no longer needs explanation.

  // Has the learner started any year goal yet? Used to gate the
  // first-time invitation in the year-goal modal (PDC D1 2026-05-13).
  const noFilledGoalsYet = !goals.some((g) => g.scope === 'year' && g.text && g.text.trim().length > 0);

  // Build one year-goal card for a category. Extracted so both the flat list
  // (learner studios) and the wheel-slice grouping (guide-summer) can reuse it
  // without duplicating the handlers. (Fleet meeting 2026-07-12, Decision 3.)
  function buildCategoryCard(cat, goal) {
    const card = document.createElement('div');
    const status = goal?.status || (goal ? 'active' : null);
    card.className = 'category-card' + (status ? ` goal-${status}` : '');

    let statusBadge = '';
    if (status === 'pending-approval') {
      statusBadge = '<span class="goal-status goal-status-pending">Awaiting partner</span>';
    } else if (status === 'approved') {
      statusBadge = '<span class="goal-status goal-status-approved">Approved ✓</span>';
    }

    const checkOffButton = (goal && status === 'active')
      ? `<button type="button" class="btn btn-text goal-checkoff" data-id="${goal.id}">Ready for check-off</button>`
      : '';

    const shareWinButton = (goal && status === 'approved')
      ? `<button type="button" class="btn btn-text goal-share-win" data-id="${goal.id}">Share this win with my parents</button>`
      : '';

    // The category's goal tasks - the weekly steps the learner planned in Setup.
    // Shown beneath the goal so the card leads with the concrete plan, not just
    // milestones. (Captain 2026-07-13.)
    const steps = flattenSteps(goal);
    const stepsHtml = steps.length
      ? `<ul class="category-tasks">${steps.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>`
      : '';

    const placeholder = `Example: ${cat.example}`;
    card.innerHTML = `
      <div class="category-header">
        <span class="category-name">${cat.name}${statusBadge}</span>
        <span class="category-kind">${cat.kind}</span>
      </div>
      <p class="category-goal ${goal ? '' : 'empty'}">${goal ? escapeHtml(goal.text) : escapeHtml(placeholder)}</p>
      ${goal?.baseline ? `<p class="goal-meta"><span class="goal-meta-label">Starting line:</span> ${escapeHtml(goal.baseline)}</p>` : ''}
      ${goal?.eos1Point ? `<p class="goal-meta"><span class="goal-meta-label">End of Session 1:</span> ${escapeHtml(goal.eos1Point)}</p>` : ''}
      ${goal?.quarterPoint ? `<p class="goal-meta"><span class="goal-meta-label">End of Session 2:</span> ${escapeHtml(goal.quarterPoint)}</p>` : ''}
      ${goal?.halfwayPoint ? `<p class="goal-meta" title="This one stays. It is your commitment anchor."><span class="goal-meta-label">End of Session 3 · locked:</span> ${escapeHtml(goal.halfwayPoint)}</p>` : ''}
      ${stepsHtml}
      ${checkOffButton}
      ${shareWinButton}
    `;

    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('goal-checkoff')) return;
      // Stage M (current-wheel build): EVERY goal opens the ratified per-goal setup flow
      // (year goal -> now -> milestone -> a few near-steps; 8-agent review 2026-07-17). It
      // pre-fills from an existing goal, so a decomposed goal no longer drops into the legacy
      // 9-stage modal (captain 2026-07-18 - that legacy fallback was the confusing surface).
      // Flag off: byte-identical to before (legacy modal).
      if (currentWheel) {
        openGoalSetupModal({ goal: goal || null, category: cat, learnerId, onDone: () => renderYearView(learnerId) });
        return;
      }
      openYearGoalModal({
        category: cat,
        existing: goal,
        isFirstTime: noFilledGoalsYet,
        studio: learner.studio,
        onSave: async ({ text, baseline, halfwayPoint, quarterPoint, eos1Point, weeklySteps }) => {
          await saveGoal({
            id: goal?.id,
            learnerId,
            categoryId: cat.id,
            scope: 'year',
            text,
            baseline,
            halfwayPoint,
            quarterPoint,
            eos1Point,
            weeklySteps: weeklySteps || goal?.weeklySteps || {},
            targetSession: 6,
            status: goal?.status || 'active',
          });
          // Auto-populate Session 1, 2, 3 goals (recursive halving + foundation).
          // End of Session 3 -> Session 3, End of Session 2 -> Session 2, End of Session 1 -> Session 1.
          const seedSession = async (sessionIndex, seedText) => {
            if (!seedText) return;
            const existingS = allGoals.find(
              (g) => g.scope === 'session' && g.sessionIndex === sessionIndex && g.categoryId === cat.id
            );
            if (!existingS) {
              await saveGoal({
                learnerId,
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
          await seedSession(3, halfwayPoint);
          await seedSession(2, quarterPoint);
          await seedSession(1, eos1Point);
          await renderYearView(learnerId);
        },
      });
    });

    const checkoffBtn = card.querySelector('.goal-checkoff');
    if (checkoffBtn) {
      checkoffBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!partner) {
          openConfirmModal({
            title: 'No partner yet',
            body: 'You need an accountability partner to check off year goals. Set one up on North first.',
            confirmLabel: 'OK',
            cancelLabel: 'Cancel',
            onConfirm: () => {},
          });
          return;
        }
        openConfirmModal({
          title: 'Ready for check-off?',
          body: 'Your partner will see this goal and confirm it. Are you ready to send it for approval?',
          confirmLabel: 'Send for approval',
          cancelLabel: 'Not yet',
          onConfirm: async () => {
            await markYearGoalPendingApproval(goal.id);
            await renderYearView(learnerId);
            document.dispatchEvent(new CustomEvent('hc:partner-changed'));
          },
        });
      });
    }

    // Share-this-win button: sends a notification to all linked parents
    const shareBtn = card.querySelector('.goal-share-win');
    if (shareBtn) {
      shareBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const links = await getParentLearnerLinks();
        const parentIds = links.filter((l) => l.learnerId === learnerId).map((l) => l.parentId);
        if (parentIds.length === 0) {
          openConfirmModal({
            title: 'No parent linked',
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
            title: 'A win to celebrate',
            body: `${learner.name || learner.heroName} reached: ${goal.text}`,
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
      });
    }

    return card;
  }

  // Hide blanks (Captain 2026-07-13): a category shows only if it has a goal with
  // real text. No more wall of empty category shells - planning happens in Setup's
  // guided walkthrough (js/setup.js); this page shows what's been planned. A goal
  // for a not-yet-started area is added in Setup, not here.
  const goalFor = (cat) => goals.find((g) => g.categoryId === cat.id && g.text && g.text.trim().length > 0);
  const plannedCategories = categories.filter((cat) => goalFor(cat));

  // A pitcher plans on the studio they're growing INTO, so their year goals land on
  // slice categories (slice_mind, etc.) that aren't in THIS learner's own category
  // set - so they'd save but never render. Surface them so nothing they wrote is lost.
  // Wheel-agnostic: renders whatever slice_* goals exist, labeled by their lifeArea.
  // (Interim visibility fix; the full wheel-grouped learner view awaits the wheel
  // direction re-ratification + the gated academic->slice mapping.)
  const knownCatIds = new Set(categories.map((c) => c.id));
  const orphanSliceGoals = goals.filter((g) =>
    g.text && g.text.trim().length > 0 &&
    typeof g.categoryId === 'string' && g.categoryId.startsWith('slice_') &&
    !knownCatIds.has(g.categoryId)
  );

  // Nothing planned yet -> point at the walkthrough, not a blank grid.
  if (plannedCategories.length === 0 && orphanSliceGoals.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'north-vision-empty';
    empty.innerHTML = 'No goals set yet. Head to <strong>Setup</strong> to walk through your goals one area at a time - it builds this page for you.';
    list.appendChild(empty);
    return;
  }

  // Which wheel slice does this category live in? A goal's own lifeArea wins
  // over the category's declared home, so a placement can be overridden per goal.
  const sliceForCategory = (cat, goal) => (goal?.lifeArea || lifeAreaForCategory(cat.id)) || null;

  // Guide-summer (adult proving ground, Decision 3) gets the 1-year-by-wheel-
  // slice view. Learner studios keep the flat list until the learner mapping is
  // authored and reviewed (Decision 4, GATED). This branch IS the scope wall.
  const useSlices = learner.studio === 'guide-summer';

  if (!useSlices) {
    plannedCategories.forEach((cat) => {
      list.appendChild(buildCategoryCard(cat, goalFor(cat)));
    });
    renderPitchSliceGoals(list, orphanSliceGoals, learner, learnerId, allGoals);
    return;
  }

  // ── Wheel-slice grouping (guide-summer) ────────────────────────────────────
  // COVERAGE FRAME, NOT COMPLETENESS FRAME (meeting guardrail, 4 agents / 3
  // circles). A slice with no goal is an open field - "quiet right now, and
  // that's allowed" - never a count, never a fill-meter, never a red 0. The
  // shape must not teach "behind." (Accord + Jake's frame; Wesley's render line.)
  const wheelAreas = getWheelAreas(learner.studio); // ordered life-area slices
  const bySlice = new Map(wheelAreas.map((area) => [area, []]));
  const offWheel = []; // categories with no life-area (e.g. Acton practice)

  plannedCategories.forEach((cat) => {
    const goal = goalFor(cat);
    const slice = sliceForCategory(cat, goal);
    const entry = { cat, card: buildCategoryCard(cat, goal) };
    if (slice && bySlice.has(slice)) bySlice.get(slice).push(entry);
    else offWheel.push(entry);
  });

  wheelAreas.forEach((area) => {
    const section = document.createElement('section');
    section.className = 'wheel-slice';

    const header = document.createElement('h3');
    header.className = 'wheel-slice-name';
    header.textContent = area;
    section.appendChild(header);

    const entries = bySlice.get(area);
    if (entries.length) {
      entries.forEach(({ card }) => section.appendChild(card));
    } else {
      // Empty slice = invitation, never deficit. No count, no meter.
      const quiet = document.createElement('p');
      quiet.className = 'wheel-slice-quiet';
      quiet.textContent = 'Quiet right now - and that is allowed. Room to grow here when you are ready.';
      section.appendChild(quiet);
    }
    list.appendChild(section);
  });

  // Off-wheel categories (guide practice: pedagogy, studio, learners, socratic).
  // Rendered plainly, clearly outside the wheel - the wheel is life; this is
  // professional prep for the year. Not a slice, so no coverage-frame line.
  if (offWheel.length) {
    const section = document.createElement('section');
    section.className = 'wheel-slice wheel-slice-offwheel';
    const header = document.createElement('h3');
    header.className = 'wheel-slice-name';
    header.textContent = 'Guide Practice';
    section.appendChild(header);
    const note = document.createElement('p');
    note.className = 'wheel-slice-note';
    note.textContent = 'Professional prep for the year - alongside your life, not inside the wheel.';
    section.appendChild(note);
    offWheel.forEach(({ card }) => section.appendChild(card));
    list.appendChild(section);
  }
}

// A pitcher's slice goals live on the studio they're growing INTO, so their
// categoryIds (slice_mind, etc.) aren't in this learner's own category set and would
// otherwise never render. Surface them read-only under a "From your pitch" section,
// labeled by each goal's stored lifeArea, so nothing they wrote is lost. (Captain
// 2026-07-16 - interim; the full editable wheel-grouped learner view awaits the wheel
// re-ratification + the gated academic->slice mapping.)
function renderPitchSliceGoals(list, orphanGoals, learner, learnerId = null, allGoals = []) {
  if (!orphanGoals || !orphanGoals.length) return;
  // Per-learner current-wheel gate (v0.23). isCurrentWheelBuild handles a null learner safely.
  const currentWheel = isCurrentWheelBuild(learner);
  const section = document.createElement('section');
  section.className = 'wheel-slice wheel-slice-offwheel';

  const header = document.createElement('h3');
  header.className = 'wheel-slice-name';
  const targetName = learner?.pitchTargetStudio ? getStudioName(learner.pitchTargetStudio) : null;
  header.textContent = targetName ? `From your pitch to ${targetName}` : 'From your pitch';
  section.appendChild(header);

  const note = document.createElement('p');
  note.className = 'wheel-slice-note';
  note.textContent = 'The year you set on the wheel you are growing into - held here for now.';
  section.appendChild(note);

  orphanGoals
    .slice()
    .sort((a, b) => (a.lifeArea || '').localeCompare(b.lifeArea || ''))
    .forEach((g) => {
      const card = document.createElement('div');
      card.className = 'category-card';
      card.innerHTML = `
        <div class="category-header">
          <span class="category-name">${escapeHtml(g.lifeArea || 'Life area')}</span>
          <span class="category-kind">carried</span>
        </div>
        <p class="category-goal">${escapeHtml(g.text)}</p>
      `;
      // Stage M (behind the flag): the slice card opens the per-goal working arc, which
      // starts at the HALFWAY (Session-3) goal for this slice - the year text is context,
      // not the working view. Flag off, the card stays read-only (byte-identical).
      if (currentWheel) {
        card.classList.add('category-card-clickable');
        card.addEventListener('click', () => {
          const halfway = allGoals.find((x) => x.scope === 'session' && x.sessionIndex === 3 && x.categoryId === g.categoryId);
          openGoalArcModal({ goal: halfway || g, learnerId, lifeArea: g.lifeArea });
        });
      }
      section.appendChild(card);
    });

  list.appendChild(section);
}

// Flatten a year goal's weeklySteps { 1:[w1..], 2:[..], 3:[..] } into ordered
// step texts (session then week) - the category's concrete "goal tasks."
function flattenSteps(goal) {
  const out = [];
  const ws = goal?.weeklySteps || {};
  Object.keys(ws)
    .map(Number)
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b)
    .forEach((s) => {
      (Array.isArray(ws[s]) ? ws[s] : []).forEach((t) => {
        const text = (t || '').trim();
        if (text) out.push(text);
      });
    });
  return out;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
