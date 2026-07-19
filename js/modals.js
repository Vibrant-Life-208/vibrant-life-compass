// Shared modal logic. Goal authoring, quote setting, traits, logins, first-run onboarding.

import {
  getValuesLexicon, getViaCharacterStrengths,
  getProfileValues, setProfileValues, getProfileStrengths, setProfileStrengths,
  getProfileHorizons, setProfileHorizon,
  getOnboardingState, setOnboardingStep, markOnboardingStepSkipped, completeOnboarding,
  setQuoteAnchor, setStrengthRanking, setValuesFreetext, getValuesFreetext,
  saveLearner, saveGoal, getGoals, getLearner, getTasksForDate, saveTask, toggleTaskDone,
  getThresholdAdditions, saveThresholdAdditions,
} from './store.js';
import { parseViaPdf } from './via-import.js';
import { nextStudio, pitchCutoff, getStudioName, getYearCalendar } from './studios.js';
import { lifeWheelSvgFor } from './wheel.js';
import { renderThresholdsHtml, buildSlicePlan, isCurrentWheelBuild, getThresholds } from './thresholds.js';
import { renderGoalArcHtml, currentArcPosition, weeklyKindFor } from './goal-arc.js';
import { getWeeklyAnswer, saveWeeklyAnswer } from './weekly-answers.js';

let activeSubmit = null;
let activeOnClose = null;
// First-run gate (captain 2026-07-15): while true, the modal ignores the X button
// and backdrop click, so the onboarding cascade + quote anchor must be walked, not
// escaped to a blank main face. Programmatic closeModal() on real completion still
// closes. setModalGated() also hides/restores the X so there is no dead control.
let modalGated = false;
function setModalGated(on) {
  modalGated = on;
  const x = document.getElementById('modal-close');
  if (x) x.style.display = on ? 'none' : '';
}

export function initModal() {
  document.getElementById('modal-close')?.addEventListener('click', () => { if (!modalGated) closeModal(); });
  document.getElementById('modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal' && !modalGated) closeModal();
  });
  document.getElementById('goal-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (activeSubmit) activeSubmit();
  });
}

export function openGoalModal({ title, existing, example, onSave }) {
  setModalTitle(title);
  const fields = document.getElementById('form-fields');
  fields.innerHTML = `
    <div class="form-field">
      <label for="goal-text">Make it specific. Make it real.</label>
      <textarea id="goal-text" rows="4" placeholder="What does success look like?">${existing?.text ? escapeAttr(existing.text) : ''}</textarea>
    </div>
    ${example ? `<div class="form-example"><span class="form-example-label">Example</span><p>${escapeHtml(example)}</p></div>` : ''}
  `;
  activeSubmit = () => {
    const text = document.getElementById('goal-text').value.trim();
    if (!text) return;
    onSave(text);
    closeModal();
  };
  openModal();
  setTimeout(() => document.getElementById('goal-text')?.focus(), 50);
}

// Helper - format the date range for a given session-week.
// Used in the weekly-breakdown stages (6-8) and the review (9).
// studio param honors the guide-summer calendar (May 18 → Aug 17, 13-day
// sections) vs the school-year calendar (Aug 17 → May 27).
async function weekDateLabel(sessionIndex, weekIndex, studioId) {
  const { getCalendarForStudio } = await import('./studios.js');
  const calendar = getCalendarForStudio(studioId);
  const sessionStart = calendar.sessionStarts[sessionIndex - 1];
  if (!sessionStart) return `Week ${weekIndex}`;
  const start = new Date(sessionStart + 'T00:00:00');
  start.setDate(start.getDate() + (weekIndex - 1) * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 4);
  const opts = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString(undefined, opts)} - ${end.toLocaleDateString(undefined, opts)}`;
}

// 9-stage year-goal modal: 5 milestones + 3 weekly breakdowns + review.
// Per captain decisions 2026-05-11 and 2026-05-12:
//   Stage 1: End of Session 6 - end goal (where you want to be by end of Session 6)
//   Stage 2: Baseline - where you are now
//   Stage 3: End of Session 3 - midpoint (locked after save; the accountability anchor)
//   Stage 4: End of Session 2 - milestone between baseline and End of Session 3
//   Stage 5: End of Session 1 - setting up + quick wins (foundation by end of Session 1)
//
// The endpoint card at the top of each stage "promotes" to show the
// most recent committed milestone as the working destination:
//   Stages 1-3: endpoint = End of Session 6 (year goal)
//   Stage 4:    endpoint = End of Session 3 (Session 3 midpoint)
//   Stage 5:    endpoint = End of Session 2 (Session 2 milestone)
//
// On save, seeds Session 1, 2, 3 goals automatically with End of Session 1, 2, 3
// respectively. Each tagged autoPopulated=true so learner-edited
// session goals are preserved on re-save.
export async function openYearGoalModal({ category, existing, onSave, isFirstTime, studio }) {
  setModalTitle(`${category.name} - year goal`);
  // Pre-compute date labels for the weekly inputs (studio-aware calendar)
  // Weeks per session come from the calendar (js/studios.js sessionWeeks) so the
  // setter follows the calendar rather than hardcoding 4/5/3. Setup plans the first
  // three sessions (the recursive-halving phase); w1/w2/w3 drive the rows + labels.
  const sw = getYearCalendar().sessionWeeks;
  const [w1, w2, w3] = [sw[0], sw[1], sw[2]];
  const mkDates = (session, count) => Promise.all(
    Array.from({ length: count }, (_, i) => weekDateLabel(session, i + 1, studio))
  );
  const s1Dates = await mkDates(1, w1);
  const s2Dates = await mkDates(2, w2);
  const s3Dates = await mkDates(3, w3);
  const existingS1 = existing?.weeklySteps?.[1] || [];
  const existingS2 = existing?.weeklySteps?.[2] || [];
  const existingS3 = existing?.weeklySteps?.[3] || [];
  const fields = document.getElementById('form-fields');
  const weeklyRow = (sessionIndex, week, dateLabel, value, max) =>
    `<div class="week-row">
       <span class="week-row-label">S${sessionIndex} W${week} <span class="week-row-date">${escapeHtml(dateLabel)}</span></span>
       <input type="text" class="week-row-input" data-session="${sessionIndex}" data-week="${week}" placeholder="On [when], I'll [what]" value="${value ? escapeAttr(value) : ''}">
     </div>`;

  fields.innerHTML = `
    <div class="onb-stages onb-stages-compact">
      <span class="stage-dot is-active" data-stage="1">1</span>
      <span class="stage-dot" data-stage="2">2</span>
      <span class="stage-dot" data-stage="3">3</span>
      <span class="stage-dot" data-stage="4">4</span>
      <span class="stage-dot" data-stage="5">5</span>
      <span class="stage-dot" data-stage="6">6</span>
      <span class="stage-dot" data-stage="7">7</span>
      <span class="stage-dot" data-stage="8">8</span>
      <span class="stage-dot stage-dot-review" data-stage="9">✓</span>
    </div>

    <div class="stage-panel" data-stage="1">
      ${isFirstTime ? `
        <div class="first-time-invitation">
          <p>This is a big planning tool. It's normal to do this with a guide or parent sitting next to you the first time.</p>
        </div>
      ` : ''}
      <div class="endpoint-card">
        <span class="endpoint-label">Year goal · End of Session 6</span>
        <span class="endpoint-placeholder">…</span>
      </div>
      <div class="form-field">
        <label for="yg-text">Stage 1 · End of Session 6 — Your year goal</label>
        <p class="form-hint">A year from now, what's different about you? How will you know you've gotten there - what would your partner or guide have to see?</p>
        <p class="form-hint-secondary">Think about: what "finished" looks like in plain words. Something specific you could point to. Why it matters to you right now. This builds on the bigger vision you wrote on the Compass page, focused on this category.</p>
        <textarea id="yg-text" rows="5" data-autogrow placeholder="Write your year-end vision here…">${existing?.text ? escapeAttr(existing.text) : ''}</textarea>
      </div>
      ${category.example ? `<div class="form-example"><span class="form-example-label">Example</span><p>${escapeHtml(category.example)}</p></div>` : ''}
      <div class="stage-actions">
        <button type="button" class="btn btn-primary" data-action="next">Next</button>
      </div>
    </div>

    <div class="stage-panel" data-stage="2" hidden>
      <div class="endpoint-card">
        <span class="endpoint-label">End of Session 6 — Year goal</span>
        <span class="endpoint-value" id="endpoint-1"></span>
      </div>
      <div class="form-field">
        <label for="yg-baseline">Stage 2 · Baseline — Where you are now</label>
        <p class="form-hint">Where are you starting from today? What's hard about this for you right now? What have you already tried?</p>
        <p class="form-hint-secondary">Your partner will see this for context. The honest version helps more than the impressive one.</p>
        <textarea id="yg-baseline" rows="5" data-autogrow placeholder="Write the honest truth about where you're starting…">${existing?.baseline ? escapeAttr(existing.baseline) : ''}</textarea>
      </div>
      <div class="stage-actions">
        <button type="button" class="btn btn-text" data-action="back">Back</button>
        <button type="button" class="btn btn-primary" data-action="next">Next</button>
      </div>
    </div>

    <div class="stage-panel" data-stage="3" hidden>
      <div class="endpoint-card">
        <span class="endpoint-label">End of Session 6 — Year goal</span>
        <span class="endpoint-value" id="endpoint-2"></span>
      </div>
      <div class="form-field">
        <label for="yg-halfway">Stage 3 · End of Session 3 — The commitment you'll make with your partner</label>
        <p class="form-hint">By the end of Session 3 - halfway through the year - what will you have done? Something specific your partner could check. Something you could show or demonstrate.</p>
        <p class="form-hint-secondary">This is the commitment you and your partner make together. Specific enough to point at. Measurable enough to check. Real enough to commit to. Once your partner signs off, you both hold it.</p>
        <textarea id="yg-halfway" rows="5" data-autogrow placeholder="Write the midpoint commitment you're willing to make…">${existing?.halfwayPoint ? escapeAttr(existing.halfwayPoint) : ''}</textarea>
      </div>
      <div class="stage-actions">
        <button type="button" class="btn btn-text" data-action="back">Back</button>
        <button type="button" class="btn btn-primary" data-action="next">Next</button>
      </div>
    </div>

    <div class="stage-panel" data-stage="4" hidden>
      <div class="endpoint-card endpoint-card-promoted">
        <span class="endpoint-label">End of Session 3 — Now your destination</span>
        <span class="endpoint-value" id="endpoint-3"></span>
      </div>
      <div class="form-field">
        <label for="yg-quarter">Stage 4 · End of Session 2 — Halfway to your Session 3 goal</label>
        <p class="form-hint">By the end of Session 2, what will be different? A smaller step toward your End of Session 3 commitment. What can you check on your own?</p>
        <p class="form-hint-secondary">Achievable in five weeks. Specific enough to verify by yourself. An honest read on the pace - if End of Session 2 feels too tight, End of Session 3 will feel impossible. Better to adjust now than later if the pace feels off.</p>
        <textarea id="yg-quarter" rows="5" data-autogrow placeholder="Write the Session 2 checkpoint…">${existing?.quarterPoint ? escapeAttr(existing.quarterPoint) : ''}</textarea>
      </div>
      <div class="stage-actions">
        <button type="button" class="btn btn-text" data-action="back">Back</button>
        <button type="button" class="btn btn-primary" data-action="next">Next</button>
      </div>
    </div>

    <div class="stage-panel" data-stage="5" hidden>
      <div class="endpoint-card endpoint-card-promoted">
        <span class="endpoint-label">End of Session 2 — Now your foundation builds toward</span>
        <span class="endpoint-value" id="endpoint-4"></span>
      </div>
      <div class="form-field">
        <label for="yg-eos1">Stage 5 · End of Session 1 — Setting up + quick wins</label>
        <p class="form-hint">By the end of Session 1, how will you know you've <strong>started</strong>? Not "finished" - "started." What rhythm could you have in place? What small first win could you point to?</p>
        <p class="form-hint-secondary">Foundation, not finish line. Four weeks is short - what's achievable that builds the habit and proves the path?</p>
        <textarea id="yg-eos1" rows="5" data-autogrow placeholder="Write the Session 1 foundation marker…">${existing?.eos1Point ? escapeAttr(existing.eos1Point) : ''}</textarea>
      </div>
      <div class="stage-actions">
        <button type="button" class="btn btn-text" data-action="back">Back</button>
        <button type="button" class="btn btn-primary" data-action="next">Next — break it down</button>
      </div>
    </div>

    <div class="stage-panel" data-stage="6" hidden>
      <p class="stage-bridge">You've set the destinations. Now plan the path, week by week.</p>
      <div class="continuity-cards">
        <div class="continuity-card continuity-from">
          <span class="continuity-label">Starting from</span>
          <span class="continuity-value" id="starting-from-s1"></span>
        </div>
        <div class="endpoint-card endpoint-card-promoted">
          <span class="endpoint-label">Session 1 leads to End of Session 1</span>
          <span class="endpoint-value" id="endpoint-5"></span>
        </div>
      </div>
      <div class="form-field">
        <label>Stage 6 · Session 1 — ${w1} weeks, one small step per week</label>
        <p class="form-hint">Session 1 has ${w1} weeks. Break it into one <strong>small</strong> step per week toward End of Session 1 - start small in Week 1 and build from there. Phrase each as a when-then: <em>"On Tuesday after breakfast, I'll do 10 minutes."</em> Every week is optional; a missed one is information, not failure.</p>
        <div class="week-rows">
          ${s1Dates.map((d, i) => weeklyRow(1, i + 1, d, existingS1[i])).join('')}
        </div>
      </div>
      <div class="stage-actions">
        <button type="button" class="btn btn-text" data-action="back">Back</button>
        <button type="button" class="btn btn-primary" data-action="next">Next — Session 2</button>
      </div>
    </div>

    <div class="stage-panel" data-stage="7" hidden>
      <div class="continuity-cards">
        <div class="continuity-card continuity-from">
          <span class="continuity-label">Starting from (end of Session 1)</span>
          <span class="continuity-value" id="starting-from-s2"></span>
        </div>
        <div class="endpoint-card endpoint-card-promoted">
          <span class="endpoint-label">Session 2 leads to End of Session 2</span>
          <span class="endpoint-value" id="endpoint-6"></span>
        </div>
      </div>
      <div class="form-field">
        <label>Stage 7 · Session 2 — ${w2} weeks</label>
        <p class="form-hint">Picking up from end of Session 1, how do you get to End of Session 2 in ${w2} weekly steps?</p>
        <div class="week-rows">
          ${s2Dates.map((d, i) => weeklyRow(2, i + 1, d, existingS2[i])).join('')}
        </div>
      </div>
      <div class="stage-actions">
        <button type="button" class="btn btn-text" data-action="back">Back</button>
        <button type="button" class="btn btn-primary" data-action="next">Next — Session 3</button>
      </div>
    </div>

    <div class="stage-panel" data-stage="8" hidden>
      <div class="continuity-cards">
        <div class="continuity-card continuity-from">
          <span class="continuity-label">Starting from (end of Session 2)</span>
          <span class="continuity-value" id="starting-from-s3"></span>
        </div>
        <div class="endpoint-card endpoint-card-promoted">
          <span class="endpoint-label">Session 3 leads to End of Session 3 (locked)</span>
          <span class="endpoint-value" id="endpoint-7"></span>
        </div>
      </div>
      <div class="form-field">
        <label>Stage 8 · Session 3 — only ${w3} weeks</label>
        <p class="form-hint">The final stretch to your locked End of Session 3. Only ${w3} weeks. If this feels tight, the next screen lets you rebalance back into Sessions 1 or 2.</p>
        <div class="week-rows">
          ${s3Dates.map((d, i) => weeklyRow(3, i + 1, d, existingS3[i])).join('')}
        </div>
      </div>
      <div class="stage-actions">
        <button type="button" class="btn btn-text" data-action="back">Back</button>
        <button type="button" class="btn btn-primary" data-action="next">Next — review & rebalance</button>
      </div>
    </div>

    <div class="stage-panel" data-stage="9" hidden>
      <div class="form-field">
        <label>Stage 9 · Review &amp; rebalance</label>
        <p class="form-hint">Your full plan to End of Session 3 is below. Everything is editable <strong>except End of Session 3</strong> (your commitment anchor). If Session 3 feels heavy, move work into Sessions 1 or 2. Save when it feels honest.</p>
      </div>
      <div id="review-surface" class="review-surface"></div>
      <fieldset class="review-tonorth">
        <legend>Add these weekly steps to my North?</legend>
        <label><input type="radio" name="yg-north-when" value="none" checked> Not now</label>
        <label><input type="radio" name="yg-north-when" value="now"> Start now - one step a week from this week</label>
        <label><input type="radio" name="yg-north-when" value="session1"> Prep for Session 1 - on the school-year weeks</label>
      </fieldset>
      <div class="stage-actions">
        <button type="button" class="btn btn-text" data-action="back">Back</button>
        <button type="button" class="btn btn-primary" data-action="save">Save full plan</button>
      </div>
    </div>
  `;

  const collectWeeklySteps = () => ({
    1: Array.from({ length: w1 }, (_, i) => fields.querySelector(`input[data-session="1"][data-week="${i + 1}"]`)?.value.trim() || ''),
    2: Array.from({ length: w2 }, (_, i) => fields.querySelector(`input[data-session="2"][data-week="${i + 1}"]`)?.value.trim() || ''),
    3: Array.from({ length: w3 }, (_, i) => fields.querySelector(`input[data-session="3"][data-week="${i + 1}"]`)?.value.trim() || ''),
  });

  const currentValues = () => ({
    text: document.getElementById('yg-text')?.value.trim() || '',
    baseline: document.getElementById('yg-baseline')?.value.trim() || '',
    halfwayPoint: document.getElementById('yg-halfway')?.value.trim() || '',
    quarterPoint: document.getElementById('yg-quarter')?.value.trim() || '',
    eos1Point: document.getElementById('yg-eos1')?.value.trim() || '',
    weeklySteps: collectWeeklySteps(),
  });

  const updateEndpoints = () => {
    const v = currentValues();
    const eos6 = v.text || existing?.text || '';
    const eos3 = v.halfwayPoint || existing?.halfwayPoint || '';
    const eos2 = v.quarterPoint || existing?.quarterPoint || '';
    const eos1 = v.eos1Point || existing?.eos1Point || '';
    const baseline = v.baseline || existing?.baseline || '';
    const setText = (id, val, placeholder) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val || placeholder;
    };
    setText('endpoint-1', eos6, '(set your year goal)');
    setText('endpoint-2', eos6, '(set your year goal)');
    setText('endpoint-3', eos3, '(set your End of Session 3 midpoint)');
    setText('endpoint-4', eos2, '(set your End of Session 2 milestone)');
    setText('endpoint-5', eos1, '(set End of Session 1 first)');
    setText('endpoint-6', eos2, '(set End of Session 2 first)');
    setText('endpoint-7', eos3, '(set End of Session 3 first)');

    // D3 — coming-from anchors on stages 6/7/8.
    // Stage 6 starts from the baseline (year-level starting line).
    // Stages 7 and 8 start from the prior session's last weekly task.
    const s1LastWeek = v.weeklySteps?.[1]?.[w1 - 1] || '';
    const s2LastWeek = v.weeklySteps?.[2]?.[w2 - 1] || '';
    setText('starting-from-s1', baseline, '(set your baseline in Stage 2)');
    setText('starting-from-s2', s1LastWeek, "(fill Session 1's last week first)");
    setText('starting-from-s3', s2LastWeek, "(fill Session 2's last week first)");
  };

  const renderReview = () => {
    const v = currentValues();
    const review = document.getElementById('review-surface');
    if (!review) return;
    const rowHtml = (sessionIndex, week, dateLabel, value) =>
      `<div class="review-week-row">
         <span class="review-week-label">S${sessionIndex} W${week} · ${escapeHtml(dateLabel)}</span>
         <input type="text" class="review-week-input" data-review-session="${sessionIndex}" data-review-week="${week}" value="${value ? escapeAttr(value) : ''}">
       </div>`;
    review.innerHTML = `
      <div class="review-section">
        <span class="review-section-label">End of Session 6 — Year goal</span>
        <input type="text" id="review-text" class="review-milestone-input" value="${escapeAttr(v.text)}">
      </div>
      <div class="review-section">
        <span class="review-section-label">Baseline</span>
        <input type="text" id="review-baseline" class="review-milestone-input" value="${escapeAttr(v.baseline)}">
      </div>
      <div class="review-section review-locked">
        <span class="review-section-label">End of Session 3 — Midpoint · LOCKED</span>
        <input type="text" class="review-milestone-input" value="${escapeAttr(v.halfwayPoint)}" disabled>
        <p class="review-locked-note">This is the commitment your partner approves. Edit only at end of Session 3.</p>
      </div>
      <div class="review-section">
        <span class="review-section-label">End of Session 2 — Session 2 milestone</span>
        <input type="text" id="review-quarter" class="review-milestone-input" value="${escapeAttr(v.quarterPoint)}">
      </div>
      <div class="review-section">
        <span class="review-section-label">End of Session 1 — Quick wins (end of Session 1)</span>
        <input type="text" id="review-eos1" class="review-milestone-input" value="${escapeAttr(v.eos1Point)}">
      </div>
      <div class="review-section">
        <span class="review-section-label">Session 1 — ${w1} weeks</span>
        ${s1Dates.map((d, i) => rowHtml(1, i + 1, d, v.weeklySteps[1][i])).join('')}
      </div>
      <div class="review-section">
        <span class="review-section-label">Session 2 — ${w2} weeks</span>
        ${s2Dates.map((d, i) => rowHtml(2, i + 1, d, v.weeklySteps[2][i])).join('')}
      </div>
      <div class="review-section review-section-tight">
        <span class="review-section-label">Session 3 — ${w3} weeks (tight)</span>
        ${s3Dates.map((d, i) => rowHtml(3, i + 1, d, v.weeklySteps[3][i])).join('')}
      </div>
    `;
  };

  const showStage = (n) => {
    fields.querySelectorAll('.stage-dot').forEach((d) => {
      d.classList.toggle('is-active', Number(d.dataset.stage) <= n);
    });
    fields.querySelectorAll('.stage-panel').forEach((p) => {
      p.hidden = Number(p.dataset.stage) !== n;
    });
    updateEndpoints();
    if (n === 9) renderReview();
    const focusEl = fields.querySelector(`.stage-panel[data-stage="${n}"] textarea, .stage-panel[data-stage="${n}"] input.week-row-input`);
    focusEl?.focus();
  };

  fields.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const stage = Number(btn.closest('.stage-panel').dataset.stage);
      if (action === 'next') {
        // For milestone stages (1-5), require the textarea to be filled
        const ta = fields.querySelector(`.stage-panel[data-stage="${stage}"] textarea`);
        if (ta && !ta.value.trim()) { ta.focus(); return; }
        showStage(stage + 1);
      } else if (action === 'back') {
        showStage(stage - 1);
      } else if (action === 'save') {
        // Final save - collect from the review surface (which holds the
        // edit-after-rebalance values), falling back to staged values.
        const reviewText = document.getElementById('review-text')?.value.trim();
        const reviewBaseline = document.getElementById('review-baseline')?.value.trim();
        const reviewQuarter = document.getElementById('review-quarter')?.value.trim();
        const reviewEos1 = document.getElementById('review-eos1')?.value.trim();
        const v = currentValues();
        // Pull weekly steps from the review inputs if present (they may have
        // been edited during rebalance), else fall back to stage 6/7/8.
        const reviewWeekly = { 1: [], 2: [], 3: [] };
        fields.querySelectorAll('[data-review-session]').forEach((inp) => {
          const s = Number(inp.dataset.reviewSession);
          const w = Number(inp.dataset.reviewWeek);
          if (!reviewWeekly[s]) reviewWeekly[s] = [];
          reviewWeekly[s][w - 1] = inp.value.trim();
        });
        const weeklySteps = (reviewWeekly[1].length || reviewWeekly[2].length || reviewWeekly[3].length)
          ? reviewWeekly
          : v.weeklySteps;
        const text = reviewText || v.text;
        const baseline = reviewBaseline || v.baseline;
        const halfwayPoint = v.halfwayPoint; // End of Session 3 is locked - never read from review surface
        const quarterPoint = reviewQuarter || v.quarterPoint;
        const eos1Point = reviewEos1 || v.eos1Point;
        if (!text || !halfwayPoint) return;
        const northWhen = document.querySelector('input[name="yg-north-when"]:checked')?.value || 'none';
        const addToNorth = northWhen === 'none' ? null : northWhen; // null | 'now' | 'session1'
        onSave({ text, baseline, halfwayPoint, quarterPoint, eos1Point, weeklySteps, addToNorth });
        closeModal();
      }
    });
  });

  activeSubmit = null;
  // Hide the default form's Save button - we use stage-specific Next/Save buttons
  const defaultActions = document.querySelector('#goal-form .modal-actions');
  if (defaultActions) defaultActions.style.display = 'none';
  openModal();
  setTimeout(() => document.getElementById('yg-text')?.focus(), 50);
}

export function openQuoteModal(existing, onSave) {
  setModalTitle('Your motivational quote');
  document.getElementById('form-fields').innerHTML = `
    <div class="form-field">
      <label for="quote-input">A line that carries you this year.</label>
      <textarea id="quote-input" rows="3">${existing ? escapeAttr(existing) : ''}</textarea>
    </div>
  `;
  activeSubmit = () => {
    onSave(document.getElementById('quote-input').value.trim());
    closeModal();
  };
  openModal();
  setTimeout(() => document.getElementById('quote-input')?.focus(), 50);
}

// 1-year vision prompt (pedagogy addition 2026-05-13). The protagonist
// statement above the per-category goals. Acton-aligned vision-first move:
// who you're becoming, not what you're doing.
export function openVisionModal({ existing, currentStudio, onSave }) {
  setModalTitle('Where you see yourself a year from now');
  const studioOrder = ['sparks', 'discovery', 'adventure', 'launchpad'];
  const nextIdx = studioOrder.indexOf(currentStudio) + 1;
  const nextStudio = nextIdx > 0 && nextIdx < studioOrder.length ? studioOrder[nextIdx] : null;
  const nextStudioHint = nextStudio
    ? `Are you in <strong>${nextStudio.charAt(0).toUpperCase() + nextStudio.slice(1)}</strong> studio? What did you have to grow through to get there?`
    : `What does it look like to be the version of yourself you're moving toward?`;
  document.getElementById('form-fields').innerHTML = `
    <div class="form-field">
      <p class="form-hint">A year from today - who do you see? Not what you did. Who you became.</p>
      <p class="form-hint-secondary">${nextStudioHint} What do your guide and your parents see? What does your partner notice about you? What's different about how you show up? You'll set per-category goals next - this is the bigger picture they live inside.</p>
      <label for="vision-input">Your one-year vision</label>
      <textarea id="vision-input" rows="6" data-autogrow placeholder="A year from now…">${existing ? escapeAttr(existing) : ''}</textarea>
    </div>
  `;
  activeSubmit = () => {
    onSave(document.getElementById('vision-input').value.trim());
    closeModal();
  };
  openModal();
  setTimeout(() => document.getElementById('vision-input')?.focus(), 50);
}

// Generic horizon editor - the telescoping life-vision steps (10yr / 5yr / 1yr).
// Onboarding writes these once through the cascade; this is the door back in, so
// the vision is a living thing revisitable from the Compass, never a one-shot
// form the learner can never return to. (Captain 2026-07-15.)
export function openHorizonModal({ label, prompt, existing, onSave }) {
  setModalTitle(label);
  document.getElementById('form-fields').innerHTML = `
    <div class="form-field">
      <p class="form-hint">${escapeHtml(prompt)}</p>
      <label for="horizon-input">Your ${escapeHtml(label.toLowerCase())} vision</label>
      <textarea id="horizon-input" rows="6" data-autogrow placeholder="${escapeAttr(prompt)}">${existing ? escapeAttr(existing) : ''}</textarea>
    </div>
  `;
  activeSubmit = () => {
    onSave(document.getElementById('horizon-input').value.trim());
    closeModal();
  };
  openModal();
  setTimeout(() => document.getElementById('horizon-input')?.focus(), 50);
}

export function openTraitsModal(existing, onSave) {
  setModalTitle('Character traits');
  document.getElementById('form-fields').innerHTML = `
    <div class="form-field">
      <label for="traits-input">Three to five traits you're anchoring on this year. Separate with commas.</label>
      <input type="text" id="traits-input" placeholder="courage, kindness, persistence" value="${existing && existing.length ? escapeAttr(existing.join(', ')) : ''}">
    </div>
  `;
  activeSubmit = () => {
    const raw = document.getElementById('traits-input').value;
    const traits = raw.split(',').map((t) => t.trim()).filter(Boolean);
    onSave(traits);
    closeModal();
  };
  openModal();
  setTimeout(() => document.getElementById('traits-input')?.focus(), 50);
}

export function openLoginModal({ existing, onSave }) {
  setModalTitle(existing ? 'Edit password' : 'Add a password');
  const kind = existing?.kind || 'core';
  document.getElementById('form-fields').innerHTML = `
    <div class="form-field">
      <label for="login-kind">What's it for?</label>
      <select id="login-kind">
        <option value="core" ${kind === 'core' ? 'selected' : ''}>Core work (Khan, Lexia, Civ, etc.)</option>
        <option value="passion" ${kind === 'passion' ? 'selected' : ''}>Passion project</option>
        <option value="other" ${kind === 'other' ? 'selected' : ''}>Other</option>
      </select>
    </div>
    <div class="form-field">
      <label for="login-service">Service</label>
      <input type="text" id="login-service" placeholder="Khan Academy" value="${existing ? escapeAttr(existing.service || '') : ''}" required>
    </div>
    <div class="form-field">
      <label for="login-username">Username or email</label>
      <input type="text" id="login-username" value="${existing ? escapeAttr(existing.username || '') : ''}">
    </div>
    <div class="form-field">
      <label for="login-password">Password</label>
      <input type="text" id="login-password" value="${existing ? escapeAttr(existing.password || '') : ''}">
    </div>
    <div class="form-field">
      <label for="login-url">URL (optional)</label>
      <input type="url" id="login-url" placeholder="https://khanacademy.org" value="${existing ? escapeAttr(existing.url || '') : ''}">
    </div>
    <div class="form-field">
      <label for="login-note">Note (optional)</label>
      <input type="text" id="login-note" value="${existing ? escapeAttr(existing.note || '') : ''}">
    </div>
  `;
  activeSubmit = () => {
    const service = document.getElementById('login-service').value.trim();
    if (!service) return;
    onSave({
      kind: document.getElementById('login-kind').value,
      service,
      username: document.getElementById('login-username').value.trim(),
      password: document.getElementById('login-password').value,
      url: document.getElementById('login-url').value.trim(),
      note: document.getElementById('login-note').value.trim(),
    });
    closeModal();
  };
  openModal();
  setTimeout(() => document.getElementById('login-service')?.focus(), 50);
}

export function openTaskModal({ existing, defaultDate, onSave }) {
  setModalTitle(existing ? 'Edit task' : 'Add a task');
  document.getElementById('form-fields').innerHTML = `
    <div class="form-field">
      <label for="task-text">What needs doing?</label>
      <input type="text" id="task-text" placeholder="A small, specific thing" value="${existing ? escapeAttr(existing.text || '') : ''}" required>
    </div>
    <div class="form-field">
      <label for="task-date">When?</label>
      <input type="date" id="task-date" value="${existing?.plannedFor || defaultDate || ''}">
    </div>
  `;
  activeSubmit = () => {
    const text = document.getElementById('task-text').value.trim();
    if (!text) return;
    const plannedFor = document.getElementById('task-date').value;
    onSave({
      id: existing?.id,
      text,
      plannedFor: plannedFor || defaultDate || new Date().toISOString().slice(0, 10),
    });
    closeModal();
  };
  openModal();
  setTimeout(() => document.getElementById('task-text')?.focus(), 50);
}

export function openMoveTaskModal(task, onMove) {
  setModalTitle('Move this task');
  const current = task.plannedFor;
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); })();
  const nextWeek = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10); })();
  document.getElementById('form-fields').innerHTML = `
    <p style="color: var(--text-soft); margin: 0 0 1rem;">Move <em>"${escapeHtml(task.text)}"</em> to:</p>
    <div class="move-options">
      <button type="button" class="btn btn-text move-option" data-date="${today}">Today</button>
      <button type="button" class="btn btn-text move-option" data-date="${tomorrow}">Tomorrow</button>
      <button type="button" class="btn btn-text move-option" data-date="${nextWeek}">Next week</button>
    </div>
    <div class="form-field" style="margin-top: 1rem;">
      <label for="move-custom">Or pick a date</label>
      <input type="date" id="move-custom" value="${current}">
    </div>
  `;
  // Quick-pick options
  document.querySelectorAll('.move-option').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const date = e.currentTarget.dataset.date;
      onMove(date);
      closeModal();
    });
  });
  // Custom date submits via form
  activeSubmit = () => {
    const newDate = document.getElementById('move-custom').value;
    if (newDate) {
      onMove(newDate);
      closeModal();
    }
  };
  openModal();
}

export async function openCreateAccountModal({ studios, onCreate }) {
  const { getLearners } = await import('./store.js');
  const learners = await getLearners();
  setModalTitle('Create an account');
  const studioOptions = Object.entries(studios)
    .map(([id, s]) => `<option value="${id}">${escapeHtml(s.name)} (${escapeHtml(s.ageRange || '')})</option>`)
    .join('');
  const learnerOptions = learners
    .map((l) => `<option value="${l.id}">${escapeHtml(l.heroName || l.name)}</option>`)
    .join('');

  document.getElementById('form-fields').innerHTML = `
    <p style="color: var(--text-soft); line-height: 1.5; margin: 0 0 1rem; font-size: 0.9rem;">
      Creates an account inside Vibrant Life only. No email is collected. Hand the temporary password to the user on paper.
    </p>
    <div class="form-field">
      <label for="account-type">Account type</label>
      <select id="account-type">
        <option value="learner">Hero genius (learner)</option>
        <option value="parent">Parent</option>
        <option value="guide">Guide</option>
      </select>
    </div>
    <div class="form-field">
      <label for="account-hero-name">Hero name</label>
      <input type="text" id="account-hero-name" placeholder="e.g. liam-discovery" required pattern="[a-z0-9-_]+" title="lowercase letters, numbers, hyphens, underscores">
      <p class="form-hint">Lowercase. No spaces. Hyphens and underscores OK. This is how they'll sign in.</p>
    </div>
    <div class="form-field" id="account-studio-field">
      <label for="account-studio">Studio (learners only)</label>
      <select id="account-studio">${studioOptions}</select>
    </div>
    <div class="form-field" id="account-link-field" style="display:none">
      <label for="account-link-learner">Link to learner (parents only)</label>
      <select id="account-link-learner">
        <option value="">(none yet)</option>
        ${learnerOptions}
      </select>
    </div>
  `;

  // Show/hide conditional fields based on type
  const typeEl = document.getElementById('account-type');
  const studioField = document.getElementById('account-studio-field');
  const linkField = document.getElementById('account-link-field');
  const updateConditional = () => {
    const t = typeEl.value;
    studioField.style.display = t === 'learner' ? 'block' : 'none';
    linkField.style.display = t === 'parent' ? 'block' : 'none';
  };
  typeEl.addEventListener('change', updateConditional);
  updateConditional();

  activeSubmit = () => {
    const heroName = document.getElementById('account-hero-name').value.trim().toLowerCase();
    if (!heroName) return;
    onCreate({
      type: typeEl.value,
      heroName,
      studio: document.getElementById('account-studio')?.value,
      linkedLearnerId: document.getElementById('account-link-learner')?.value || null,
    });
    closeModal();
  };
  openModal();
  setTimeout(() => document.getElementById('account-hero-name')?.focus(), 50);
}

// Bulk-import accounts from a CSV paste.
// CSV columns: type,heroName,studio,linkedLearnerHeroName
// type = learner | parent | guide
export async function openBulkImportModal({ studios, onImport }) {
  const { getLearners } = await import('./store.js');
  const allLearners = await getLearners();
  setModalTitle('Bulk import accounts');
  const sampleRows = [
    'type,heroName,studio,linkedLearnerHeroName,fullName',
    'learner,liam-d,discovery,,Liam Davis',
    'learner,mira-a,adventure,,Mira Anderson',
    'parent,sam-parent,,liam-d|mira-a,Sam Davis-Anderson',
    'guide,coach-alex,,,Coach Alex Morrison',
  ].join('\n');

  document.getElementById('form-fields').innerHTML = `
    <p style="color: var(--text-soft); line-height: 1.5; margin: 0 0 0.75rem; font-size: 0.9rem;">
      Paste CSV rows below. One account per row. First row is the header.
      Each account gets a generated temporary password shown at the end.
    </p>
    <div class="form-field">
      <label for="bulk-csv">CSV</label>
      <textarea id="bulk-csv" rows="10" placeholder="${escapeAttr(sampleRows)}" style="font-family: ui-monospace, Menlo, monospace; font-size: 0.85rem;"></textarea>
    </div>
    <div class="form-field">
      <p class="form-hint">
        <strong>Columns:</strong> type, heroName, studio, linkedLearnerHeroName, fullName<br>
        <strong>type:</strong> learner / parent / guide<br>
        <strong>studio:</strong> sparks / discovery / adventure / launchpad (learners only)<br>
        <strong>linkedLearnerHeroName:</strong> for parents only — hero name(s) of their kids. Use <code>|</code> to link siblings: <code>liam-d|mira-a</code><br>
        <strong>fullName:</strong> optional — the real name to show in the app ("Kyra Jones"). If blank, generated from hero name.
      </p>
    </div>
    <p id="bulk-csv-error" class="signin-error" style="display:none"></p>
  `;

  activeSubmit = async () => {
    const raw = document.getElementById('bulk-csv').value.trim();
    const errorEl = document.getElementById('bulk-csv-error');
    if (!raw) return;
    const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      errorEl.textContent = 'Need at least a header row + one data row.';
      errorEl.style.display = 'block';
      return;
    }
    const header = lines[0].split(',').map((s) => s.trim().toLowerCase());
    const typeIdx = header.indexOf('type');
    const heroIdx = header.indexOf('heroname');
    const studioIdx = header.indexOf('studio');
    const linkedIdx = header.indexOf('linkedlearnerheroname');
    const fullNameIdx = header.indexOf('fullname');
    if (typeIdx < 0 || heroIdx < 0) {
      errorEl.textContent = 'Header must include "type" and "heroName".';
      errorEl.style.display = 'block';
      return;
    }
    const rows = [];
    const errors = [];
    // Hero names that will exist after this batch runs: existing learners + new learner rows
    const existingLearnerNames = new Set(allLearners.map((l) => (l.heroName || '').toLowerCase()).filter(Boolean));
    const batchLearnerNames = new Set();
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(',').map((s) => s.trim());
      const type = cells[typeIdx]?.toLowerCase();
      const heroName = cells[heroIdx]?.toLowerCase();
      if (!['learner', 'parent', 'guide'].includes(type)) {
        errors.push(`Row ${i + 1}: invalid type "${type}"`); continue;
      }
      if (!heroName || !/^[a-z0-9_-]+$/.test(heroName)) {
        errors.push(`Row ${i + 1}: invalid hero name "${heroName}"`); continue;
      }
      const row = { type, heroName };
      // Optional fullName column — preserves real names ("Kyra Jones") for
      // display, while heroName stays the login slug ("kyra-j").
      if (fullNameIdx >= 0 && cells[fullNameIdx]) {
        row.fullName = cells[fullNameIdx].trim();
      }
      if (type === 'learner') {
        const studio = (cells[studioIdx] || '').toLowerCase();
        if (studio && !studios[studio]) {
          errors.push(`Row ${i + 1}: unknown studio "${studio}"`); continue;
        }
        row.studio = studio || 'adventure';
        batchLearnerNames.add(heroName);
      }
      if (type === 'parent') {
        // Multi-link: pipe-separated list of learner hero-names ("liam-d|mira-a")
        // lets one parent account see all their kids.
        const linkedRaw = (cells[linkedIdx] || '').toLowerCase();
        if (linkedRaw) {
          const names = linkedRaw.split('|').map((s) => s.trim()).filter(Boolean);
          const missing = names.filter((n) => !existingLearnerNames.has(n) && !batchLearnerNames.has(n));
          if (missing.length > 0) {
            errors.push(`Row ${i + 1}: linked learner${missing.length > 1 ? 's' : ''} ${missing.map((m) => `"${m}"`).join(', ')} not found. Add the learner row(s) first.`);
            continue;
          }
          row.linkedLearnerHeroNames = names;
        }
      }
      rows.push(row);
    }
    if (errors.length > 0) {
      errorEl.innerHTML = errors.slice(0, 5).map(escapeHtml).join('<br>') + (errors.length > 5 ? `<br>...and ${errors.length - 5} more` : '');
      errorEl.style.display = 'block';
      return;
    }
    if (rows.length === 0) {
      errorEl.textContent = 'No valid rows to import.';
      errorEl.style.display = 'block';
      return;
    }
    onImport(rows);
    closeModal();
  };
  openModal();
}

// Show generated temporary password(s) once. Guide writes them down.
export function openTempPasswordModal({ heroName, tempPassword, isReset, multiple, onClose }) {
  setModalTitle(multiple ? `${multiple.length} accounts created` : (isReset ? 'Password reset' : 'Account created'));
  let body;
  if (multiple) {
    body = `
      <p style="color: var(--text); line-height: 1.5; margin: 0 0 1rem;">
        <strong>Write these down before closing.</strong> They will not be shown again.
      </p>
      <div class="temp-password-list">
        ${multiple.map(m => `
          <div class="temp-password-row">
            <span class="temp-password-name">${escapeHtml(m.heroName)}</span>
            <code class="temp-password-code">${escapeHtml(m.tempPassword)}</code>
          </div>
        `).join('')}
      </div>
    `;
  } else {
    body = `
      <p style="color: var(--text); line-height: 1.5; margin: 0 0 1rem;">
        <strong>${escapeHtml(heroName)}</strong>'s temporary password:
      </p>
      <code class="temp-password-code temp-password-single">${escapeHtml(tempPassword)}</code>
      <p style="color: var(--text-muted); font-size: 0.85rem; margin: 1rem 0 0;">
        Hand this to the ${isReset ? 'user' : 'user'} on paper. They can sign in with their hero name and this password; encourage them to change it at first sign-in.
      </p>
    `;
  }
  document.getElementById('form-fields').innerHTML = `
    ${body}
    <div class="confirm-actions">
      <button type="button" class="btn btn-primary" id="temp-pwd-ok">I've written it down</button>
    </div>
  `;
  document.getElementById('temp-pwd-ok').addEventListener('click', () => {
    closeModal();
  });
  activeSubmit = null;
  activeOnClose = onClose || null;
  const defaultActions = document.querySelector('#goal-form .modal-actions');
  if (defaultActions) defaultActions.style.display = 'none';
  openModal();
}

// SSC-D1 (2026-05-13): an optional third `dismissLabel` enables a
// no-position exit on celebration prompts. Bashir's principle: consent
// includes abstention. When dismissLabel is set, the modal shows three
// buttons (dismiss / cancel / confirm); clicking dismiss closes without
// firing onConfirm or onCancel.
export function openConfirmModal({ title, body, confirmLabel = 'Yes', cancelLabel = 'Cancel', dismissLabel, onConfirm, onCancel }) {
  setModalTitle(title);
  const dismissButton = dismissLabel
    ? `<button type="button" class="btn btn-text confirm-dismiss" id="confirm-dismiss">${escapeHtml(dismissLabel)}</button>`
    : '';
  document.getElementById('form-fields').innerHTML = `
    <p style="color: var(--text); line-height: 1.6; margin: 0 0 1rem;">${escapeHtml(body)}</p>
    <div class="confirm-actions">
      ${dismissButton}
      <button type="button" class="btn btn-text" id="confirm-cancel">${escapeHtml(cancelLabel)}</button>
      <button type="button" class="btn btn-primary" id="confirm-yes">${escapeHtml(confirmLabel)}</button>
    </div>
  `;
  // Hide the default form .modal-actions (Save button) - confirm has its own buttons.
  const defaultActions = document.querySelector('#goal-form .modal-actions');
  if (defaultActions) defaultActions.style.display = 'none';
  document.getElementById('confirm-yes').addEventListener('click', () => {
    if (onConfirm) onConfirm();
    closeModal();
  });
  document.getElementById('confirm-cancel').addEventListener('click', () => {
    if (onCancel) onCancel();
    closeModal();
  });
  if (dismissLabel) {
    document.getElementById('confirm-dismiss').addEventListener('click', () => {
      // No callback fires - intentional. Skip-the-question == no-position.
      closeModal();
    });
  }
  // Confirm has no form-submit path; null out activeSubmit so Enter doesn't fire.
  activeSubmit = null;
  openModal();
}

// Stage M (behind CURRENT_WHEEL_BUILD): open the per-goal working arc. "Clicking into a
// goal starts at the halfway" - this opens on the halfway (Session-3) goal and shows the
// forward 3-phase spine + the this-week/today zoom (see js/goal-arc.js). M1 is read-only
// structure; M2/M3 add the answerable weekly question + daily tasks. Dark: only reached
// when the flag is on. Nothing ships before Stage V's watch.
export async function openGoalArcModal({ goal, learnerId = null, lifeArea = null }) {
  const calendar = getYearCalendar();
  const position = currentArcPosition(calendar);
  const kind = weeklyKindFor(lifeArea);
  const d = new Date();
  const todayISO = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const canPersist = Boolean(learnerId && goal?.id);

  async function fetchTodayTasks() {
    if (!canPersist) return [];
    try {
      const tasks = await getTasksForDate(learnerId, todayISO);
      return (tasks || []).filter((t) => t.goalId === goal.id);
    } catch (e) { return []; }
  }

  // Render + wire the whole arc. `prefillWeekly` carries an unsaved weekly answer across a
  // today-task re-render so nothing the learner typed is lost.
  async function renderAndWire(prefillWeekly) {
    const todayTasks = await fetchTodayTasks();
    const weeklyAnswer = prefillWeekly !== undefined ? prefillWeekly
      : (canPersist ? await getWeeklyAnswer(learnerId, goal.id, position.session, position.week) : '');
    document.getElementById('form-fields').innerHTML = `
      ${renderGoalArcHtml(goal, { lifeArea, position, todayTasks, weeklyAnswer })}
      <div class="confirm-actions">
        <button type="button" class="btn btn-primary" id="arc-close">Close</button>
      </div>`;
    const defaultActions = document.querySelector('#goal-form .modal-actions');
    if (defaultActions) defaultActions.style.display = 'none';
    document.getElementById('arc-close')?.addEventListener('click', () => closeModal());

    // M2: save this week's answer (blank withdraws it). This-week-only key -> no streak (§5).
    const saveBtn = document.getElementById('arc-week-save');
    if (saveBtn && canPersist) {
      saveBtn.addEventListener('click', async () => {
        const ta = document.getElementById('arc-week-answer');
        await saveWeeklyAnswer(learnerId, { goalId: goal.id, session: position.session, week: position.week, kind, text: ta?.value || '' });
        const saved = document.getElementById('arc-week-saved');
        if (saved) saved.hidden = false;
      });
    }

    // M3: daily tasks under the week's answer - the two doors (one small step / rest today).
    const curWeekly = () => document.getElementById('arc-week-answer')?.value;
    if (canPersist) {
      document.getElementById('arc-today-add')?.addEventListener('click', async () => {
        const input = document.getElementById('arc-today-input');
        const text = (input?.value || '').trim();
        if (!text) return;
        const carry = curWeekly();
        try { await saveTask(learnerId, { text, plannedFor: todayISO, goalId: goal.id, categoryId: goal.categoryId || null, lifeArea, status: 'open' }); }
        catch (e) { /* non-fatal */ }
        await renderAndWire(carry);
      });
      document.querySelectorAll('.arc-today-toggle').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.taskId;
          if (!id) return;
          const carry = curWeekly();
          try { await toggleTaskDone(learnerId, id); } catch (e) { /* non-fatal */ }
          await renderAndWire(carry);
        });
      });
    }
    // Rest today: a first-class choice, never a miss. No storage, no streak to break.
    document.getElementById('arc-today-rest')?.addEventListener('click', () => {
      const note = document.getElementById('arc-today-rest-note');
      if (note) note.hidden = false;
    });
  }

  setModalTitle('Your goal');
  await renderAndWire();
  activeSubmit = null;
  openModal();
}

// Stage M setup flow (behind CURRENT_WHEEL_BUILD): the per-goal decomposition on the MAIN
// Compass page, ratified by the 8-agent review 2026-07-17. Replaces the 9-stage
// openYearGoalModal for setting a goal's milestone. The learner sees the year goal, names
// where they are NOW, sets a halfway MILESTONE (saved as the Session-3 goal), and names a FEW
// near-steps (stored as tasks). BINDING (Decision 2): no full multi-week ladder authored up
// front - a few near-steps only; Sessions 4 & 7 refocus re-open the rest. Sessions are never
// named to the learner. Store the structure; surface this week; never a scoreboard.
// Spec: docs/design/2026-07-17-main-page-goal-decomposition-build-spec.md.
export async function openGoalSetupModal({ goal = null, category = null, learnerId = null, onDone = null }) {
  const catId = category?.id || goal?.categoryId;
  const catName = category?.name || goal?.lifeArea || 'this goal';
  const dnow = new Date();
  const todayISO = `${dnow.getFullYear()}-${String(dnow.getMonth() + 1).padStart(2, '0')}-${String(dnow.getDate()).padStart(2, '0')}`;
  const MAX_ITEMS = 3; // up to three per phase; a FEW, never the full ladder (Decision 2 + captain 2026-07-18)
  const threeUp = (arr, fallback) => {
    const a = (Array.isArray(arr) ? arr : (fallback ? [fallback] : []))
      .map((x) => (x || '').trim()).filter(Boolean).slice(0, MAX_ITEMS);
    return a.length ? a : [''];
  };

  const s = {
    // 'yeargoal' shows only when the year goal has no text yet; then now -> the three phases.
    // The three phases hold up to three items each (captain 2026-07-18). Order is backward-
    // planning from the goal: halfway markers -> challenges -> set-up-first actions, ending on
    // set-up so the learner flows straight into the North page to break those into daily tasks.
    // Weekly / daily breakdown is a LATER step (North page, after the accountability partner) -
    // it is NOT captured here. Phase->session storage: setup=S1, challenges=S2, threshold=S3.
    steps: (goal?.text ? [] : ['yeargoal']).concat(['now', 'threshold', 'challenges', 'setup']),
    idx: 0,
    yeargoal: goal?.text || '',
    now: goal?.baseline || '',
    threshold: threeUp(goal?.threshold, goal?.halfwayPoint), // S3 halfway markers
    challenges: threeUp(goal?.challenges),                   // S2 biggest challenges
    setup: threeUp(goal?.setup),                             // S1 set-up-first actions
  };
  const step = () => s.steps[s.idx];

  function capture() {
    const st = step();
    if (st === 'yeargoal') s.yeargoal = document.getElementById('gs-yeargoal')?.value ?? s.yeargoal;
    else if (st === 'now') s.now = document.getElementById('gs-now')?.value ?? s.now;
    else if (st === 'threshold' || st === 'challenges' || st === 'setup') {
      const vals = [];
      document.querySelectorAll(`.gs-item[data-phase="${st}"]`).forEach((inp) => vals.push(inp.value));
      s[st] = vals.length ? vals : [''];
    }
  }

  const contextCard = (label, text) => (text
    ? `<div class="gs-context-card"><span class="gs-context-label">${escapeHtml(label)}</span><p class="gs-context-text">${escapeHtml(text)}</p></div>`
    : '');

  function renderStep() {
    const st = step();
    let body = '';
    if (st === 'yeargoal') {
      body = `
        <h3 class="onb-horizon-heading">${escapeHtml(catName)} - your year goal</h3>
        <p class="onb-horizon-body">A year from now, what's different about you in ${escapeHtml(catName)}? How would your guide know you got there?</p>
        <textarea id="gs-yeargoal" class="slice-box" rows="3" placeholder="By next year, in ${escapeAttr(catName)}, I want to…">${escapeHtml(s.yeargoal)}</textarea>`;
    } else if (st === 'now') {
      body = `
        <h3 class="onb-horizon-heading">Where are you starting from?</h3>
        ${contextCard('Your year goal', s.yeargoal)}
        <p class="onb-horizon-body">Honestly - where are you starting from in ${escapeHtml(catName)}? This is the mirror, not the dream.</p>
        <textarea id="gs-now" class="slice-box" rows="3" placeholder="Starting out, in ${escapeAttr(catName)}, I am…">${escapeHtml(s.now)}</textarea>`;
    } else {
      // The three phases, each up to three items. st is 'threshold' | 'challenges' | 'setup'.
      // Halfway language is retained on 'threshold' (captain 2026-07-18). The daily/weekly
      // breakdown of these items is deferred to the North page (not captured here).
      const phase = {
        threshold: {
          heading: 'A marker along the way',
          body: 'About halfway there - what would you have reached? Name up to three markers you would love to hit between where you are starting and your year goal.',
          placeholder: 'A halfway marker - be specific',
          cards: contextCard('Your year goal', s.yeargoal) + contextCard('Where you are starting from', s.now),
        },
        challenges: {
          heading: 'The biggest challenges',
          body: 'What are the biggest challenges between you and this goal? Name up to three - naming them is how you plan for them.',
          placeholder: 'A challenge - be specific',
          cards: contextCard('Your year goal', s.yeargoal),
        },
        setup: {
          heading: 'Setting yourself up',
          body: 'What do you need to set up to give yourself the best start? Up to three things that clear the runway. You will break these into day-to-day steps on your North page.',
          placeholder: 'One thing to set up - be specific',
          cards: contextCard('Your year goal', s.yeargoal),
        },
      }[st];
      const items = s[st].length ? s[st] : [''];
      const inputs = items.map((v, i) => `<input type="text" class="gs-item slice-box" data-phase="${st}" data-idx="${i}" value="${escapeAttr(v)}" placeholder="${escapeAttr(phase.placeholder)}">`).join('');
      body = `
        <h3 class="onb-horizon-heading">${escapeHtml(phase.heading)}</h3>
        ${phase.cards}
        <p class="onb-horizon-body">${escapeHtml(phase.body)}</p>
        <div class="gs-item-list">${inputs}</div>
        ${items.length < MAX_ITEMS ? `<button type="button" class="btn btn-text" id="gs-item-add" data-phase="${st}">+ add another</button>` : ''}`;
    }
    const isFirst = s.idx === 0;
    const isLast = s.idx === s.steps.length - 1;
    document.getElementById('form-fields').innerHTML = `
      <div class="goal-setup">${body}</div>
      <div class="onb-step-actions">
        <button type="button" class="btn btn-text" id="gs-back">${isFirst ? 'Cancel' : 'Back'}</button>
        <div class="onb-step-actions-right">
          <button type="button" class="btn btn-primary" id="gs-next">${isLast ? 'Save this goal' : 'Next'}</button>
        </div>
      </div>`;
    const defaultActions = document.querySelector('#goal-form .modal-actions');
    if (defaultActions) defaultActions.style.display = 'none';

    document.getElementById('gs-item-add')?.addEventListener('click', (e) => {
      capture();
      const ph = e.currentTarget.dataset.phase;
      if (s[ph] && s[ph].length < MAX_ITEMS) s[ph].push('');
      renderStep();
    });
    document.getElementById('gs-back')?.addEventListener('click', () => {
      if (isFirst) { closeModal(); return; }
      capture(); s.idx -= 1; renderStep();
    });
    document.getElementById('gs-next')?.addEventListener('click', async () => {
      capture();
      if (!isLast) { s.idx += 1; renderStep(); return; }
      await persist();
      closeModal();
      if (onDone) await onDone();
    });
  }

  async function persist() {
    if (!learnerId) return;
    let existingGoals = [];
    try { existingGoals = await getGoals(learnerId); } catch (e) { /* non-fatal */ }
    const clean = (arr) => (arr || []).map((x) => (x || '').trim()).filter(Boolean).slice(0, MAX_ITEMS);
    const threshold = clean(s.threshold); // S3 halfway markers
    const challenges = clean(s.challenges); // S2 biggest challenges
    const setup = clean(s.setup);           // S1 set-up-first actions
    // 1. The year goal row. baseline = now; halfwayPoint = the primary (first) halfway marker,
    //    so the arc/timeline surface keeps working. The three phase arrays ride along as named
    //    fields so rowToGoal spreads them back to the top level on read.
    //    PERSISTENCE PENDING (2026-07-18): goalToRow only packs DECOMPOSITION_FIELDS. To store
    //    setup/challenges/threshold on the synced backend, add those three names to
    //    DECOMPOSITION_FIELDS in js/backend/supabase-adapter.js (and local-store.js). Until that
    //    one-line add lands, these three are silently DROPPED on save (no corruption) - which is
    //    why this modal is HELD from push until the adapter commit clears. See the design doc:
    //    docs/design/2026-07-18-north-daily-tasks-reflection-roadmap.md.
    const prior = goal?.id ? { id: goal.id, status: goal.status } : existingGoals.find((g) => g.scope === 'year' && g.categoryId === catId);
    try {
      await saveGoal({
        id: prior?.id,
        learnerId,
        categoryId: catId,
        scope: 'year',
        text: (s.yeargoal || '').trim(),
        baseline: (s.now || '').trim() || undefined,
        halfwayPoint: threshold[0] || undefined,
        targetSession: 6,
        status: prior?.status || 'active',
        setup: setup.length ? setup : undefined,
        challenges: challenges.length ? challenges : undefined,
        threshold: threshold.length ? threshold : undefined,
      });
    } catch (e) { /* non-fatal */ }
    // 2. The primary halfway marker seeds the Session-3 goal (reuse the seed pattern; Decision 4).
    //    Sessions are never named to the learner - this is backend goal storage for the arc.
    const marker = threshold[0] || '';
    if (marker) {
      const existingS3 = existingGoals.find((g) => g.scope === 'session' && g.sessionIndex === 3 && g.categoryId === catId);
      try {
        if (!existingS3) await saveGoal({ learnerId, categoryId: catId, scope: 'session', sessionIndex: 3, text: marker, autoPopulated: true, status: 'active' });
        else if (existingS3.autoPopulated) await saveGoal({ ...existingS3, text: marker, autoPopulated: true });
      } catch (e) { /* non-fatal */ }
    }
    // 3. NO tasks are created here. Breaking the phase items into day-to-day steps is deferred to
    //    the North page, after the learner has an accountability partner (captain 2026-07-18).
  }

  setModalTitle(catName);
  renderStep();
  activeSubmit = null;
  openModal();
}

// v0.3 first-run cascade - resumable, gating onboarding. Per the 2026-06-22
// fleet meeting. Replaces the v0.2 3-step anchor modal with the telescoping
// cascade: body-first breath -> VIA strengths (link-out) -> Values (link-out) ->
// beyond-5yr -> within-5yr -> within-1yr -> where-you-are-now -> halfway.
//
// Resumability (Decision 3): every step writes to Supabase immediately (the
// field + the onboarding_step pointer), so closing the tab mid-cascade -
// including during the external VIA/Values round-trip - loses nothing. On
// re-open we read getOnboardingState and land on the saved step.
//
// Gate semantics (Decisions 1+2): "walk the pages once," not "answer every
// field." Every step has a "Not now" skip that records the step as honored, not
// failed (markOnboardingStepSkipped), and advances. Reaching the end calls
// completeOnboarding so the gate recedes. No "Step X of N" counter - the room
// (Fabula) flagged form-feel as a ship failure; the resume must never shame.
//
// Developmental gating (captain 2026-07-14, superseding Decision 5): the long-
// horizon steps are dropped ONLY for Sparks (screen-free). Discovery and up walk
// the full telescope. NOTE: age-tier VIA/Values labels for the youth register are
// still landing (reference tables hold display_label_adult, with youth labels
// preferred when present - see renderStrengthsUpload).
//
// onComplete is called once the cascade is walked; per-step saving already
// happened, so it only routes the user into the app.

// External assessment links (Decision 8: measured link-out). Both confirmed
// against live sources 2026-06-22. The VIA site routes to the age-appropriate
// survey after registration (Adult; Youth ages 8-17), so one entry URL covers
// all tiers. An empty URL would render the entry grid without a link-out (graceful
// fallback), but both are populated.
const VIA_SURVEY_URL = 'https://www.viacharacter.org/survey/account/register';
// Child tier (Discovery + Adventure): VIA Youth Survey, ages 8-17 (captain
// 2026-07-13). VIA routes to the youth survey by the age given at registration,
// so this shares the registration entry today; swap to a youth deep-link here if
// one becomes available. Copy is youth-labeled so families pick the right one.
const VIA_YOUTH_SURVEY_URL = 'https://www.viacharacter.org/survey/account/register';
// values.institute - Brad Hook's "Start With Values": ~15 min, returns top-3
// values + a personalized action plan. Matches the captain's 6-15 spec.
const VALUES_ASSESSMENT_URL = 'https://values.institute/values-app/';

// The ordered cascade. The ids match the onboarding_step enum in the schema.
// The quote is handled separately by openQuoteFlow (its own front-of-line flow),
// not as a cascade step - so it can never be resumed-past.
const CASCADE_FULL = ['breath', 'strengths', 'values', 'beyond_5yr', 'within_5yr', 'within_1yr', 'current_state', 'halfway'];
// Full telescope for ALL learners including Discovery (captain 2026-07-14):
// this overrides the earlier Decision 5 "no five-year telescope for young
// learners." Discovery now walks the full 10yr -> 5yr -> 1yr horizon like the
// older tiers; only Sparks stays screen-free. (The old CASCADE_NEAR near-horizon
// set was retired here.)
// Sparks (tots) are screen-free (captain 2026-07-13): NO strengths, NO values.
// Just the breath and a single near horizon.
const CASCADE_SPARKS = ['breath', 'within_1yr'];

// Steps whose progress is NOT tracked by the onboarding_step resume enum. Their
// state lives elsewhere (pitch -> learner row; slice_plan -> year goals), so they
// are safe to re-show on resume and must never be written as the resume pointer.
const NON_RESUME_STEPS = new Set(['pitch', 'slice_plan', 'strengths_why']);

// Telescoping prompts for the horizon steps (adult register).
const HORIZON_PROMPTS = {
  beyond_5yr: {
    heading: 'See your life in 10 years.',
    body: "Ten years from now - picture it, really picture it. Where do you live, and who's with you? What's your home like, and what have you filled it with? What do your days look like - the work you do, the things you make, the people around you? Where do you go? What do you do just for the joy of it? And underneath all of it: what do you really want out of your life? Let yourself imagine. There's no wrong answer.",
    placeholder: 'In ten years, I...',
  },
  within_5yr: {
    heading: 'See yourself in 5 years.',
    body: 'Now bring it closer. Five years from now - what do you want to be true?',
    placeholder: 'In five years...',
  },
  within_1yr: {
    heading: 'See yourself in 1 year.',
    body: 'Twelve months from now - what do you want to have grown into?',
    placeholder: 'By this time next year...',
  },
  current_state: {
    heading: 'Where are you now?',
    body: 'Honestly - where are you today? This is the mirror, not the dream. Take your time; there are no wrong answers here.',
    placeholder: 'Where I am right now...',
  },
  halfway: {
    heading: 'Halfway from now to one year.',
    body: 'Look at the two above - where you want to be in a year, and where you are now. Halfway between them, what does it look like? How will you know you are on your way?',
    placeholder: 'Halfway, I will...',
  },
};

// Telescope order for the stacked "what you've said so far" context. Each
// horizon step shows the prior answers as compact full-text cards above its box,
// so the thread stays in view as the person narrows from 10 years down to now.
// At the halfway step the far horizons drop away, leaving only the near frame
// (1 year + now) - the two the midpoint sits between. Young tiers never answer
// the far horizons, so those cards are simply absent (empty values filtered).
// (Captain design 2026-07-09.)
const HORIZON_ORDER = ['beyond_5yr', 'within_5yr', 'within_1yr', 'current_state'];
const HORIZON_STACK_LABEL = {
  beyond_5yr: '10 years',
  within_5yr: '5 years',
  within_1yr: '1 year',
  current_state: 'Right now',
};

// Tier-aware "sparks" for the 10-year step (Option 2, captain-approved 2026-07-18). Gentle
// example prompts shown below the body - never required fields. Keyed off a distinct
// mature-vs-young signal (studio + role), NOT isCurrentWheelBuild (which also fires for a
// cohort-flagged young learner). Mature = launchpad+ learners + guides / parents / owners;
// young = sparks / discovery / adventure learners. Money is framed as freedom ("how much you
// work - or how little"), never a figure - the "we evoke, we never extract" grain.
const TENYR_SPARKS_MATURE_STUDIOS = new Set(['launchpad', 'guide-summer']);
const TENYR_SPARKS = {
  mature: "Let these spark you: What kind of home, and where - a place in the city, by the water? A car, a boat, a garden? How do you earn, and how much do you work - or how little? Where do you travel? Pets? What excites you, and how often do you make room for it?",
  young: "Let these spark you: Who's with you? What are you really good at? Where would you go? What pets, what adventures? What do you do that makes you lose track of time?",
};

export async function openOnboardingModal({ profileId = null, role = 'learner', studio = null, learnerId = null, onComplete }) {
  // Per-learner current-wheel gate (v0.23). Resolved once from the learner in scope and used
  // for every gate below (which pages the cascade shows, the slice walk vs the legacy grid).
  // Local dev: always true. Prod: this learner's current_wheel_test flag; null/absent learner
  // (e.g. an adult onboarding with no learnerId) resolves false = the legacy flow, unchanged.
  const onbLearner = learnerId ? await getLearner(learnerId) : null;
  const currentWheel = isCurrentWheelBuild(onbLearner);
  const steps = [...(studio === 'sparks' ? CASCADE_SPARKS : CASCADE_FULL)];
  // After the VIA strengths import, a short "why your strengths matter" page with
  // the person's top strengths pinned on top (captain 2026-07-19). Shown to
  // EVERYONE who does the strengths import (learners + guides; anyone whose
  // cascade includes 'strengths'), once - it rides the one-time onboarding
  // cascade, so it is never re-prompted after onboarding completes. Sparks has no
  // strengths step, so it is naturally excluded. Not in the onboarding_step resume
  // enum (see NON_RESUME_STEPS), so it needs no schema change and is safe on resume.
  {
    const atStrengths = steps.indexOf('strengths');
    if (atStrengths >= 0) steps.splice(atStrengths + 1, 0, 'strengths_why');
  }
  // 1-year plan, organized by wheel slice (captain 2026-07-14): the last step of the
  // cascade for learners. A learner who opted into the pitch plans by the wheel of the
  // studio they're growing INTO, thresholds pre-placed into their slice; everyone else
  // plans by their own current wheel, blank. Sparks stays screen-free (no slice step).
  // Not in the resume enum - its data lives as year goals, so re-showing is idempotent.
  const hasSlicePlan = role === 'learner' && studio && studio !== 'sparks';
  // Current-wheel redesign (captain 2026-07-17, walk-as-user): when the per-slice walk
  // runs, it asks year / now / halfway PER SLICE, so the generic whole-life 1-year / now
  // / halfway single-text horizon pages are redundant. Drop them and go straight from the
  // 5-year vision + pitch into the slices. The 10yr + 5yr vision pages stay. Scoped to
  // `currentWheel`, so today's flag-off onboarding is unchanged (no live regression).
  if (currentWheel && hasSlicePlan) {
    for (const s of ['within_1yr', 'current_state', 'halfway']) {
      const at = steps.indexOf(s);
      if (at >= 0) steps.splice(at, 1);
    }
  }
  // Pitch-readiness step (learners with a studio above them): a yes/no age self-report +
  // opt-in. Legacy path inserts it right before the 1-year horizon; the trimmed
  // current-wheel path has no 1-year step, so it lands last - directly before the slices,
  // so a "not yet" answer also flows straight into them. NOT in the onboarding_step resume
  // enum, so advance()/back() never persist it as the resume pointer - its data lives on
  // the learner row. (Captain design 2026-07-10.)
  const pitchTarget = role === 'learner' ? nextStudio(studio) : null;
  // Only insert the pitch step when the target studio has authored thresholds. For
  // Adventure -> Launch Pad, getThresholds('launchpad') is null: showing the pitch there
  // fires an age-gate self-report ("15 by December, will you have?") AND opts the learner
  // into a confirmed-but-empty ceremony (a "working toward your pitch" banner over blank
  // slices). Launch Pad requirements are first-year priorities, not pre-entry gates, so no
  // pitch belongs here yet. Suppressing the step also keeps pitchOptedIn false, so no
  // pitchTargetStudio and no empty banner render downstream. Fix 2026-07-18.
  if (pitchTarget && getThresholds(pitchTarget)) {
    const at = steps.indexOf('within_1yr');
    if (at >= 0) steps.splice(at, 0, 'pitch');
    else steps.push('pitch');
  }
  if (hasSlicePlan) steps.push('slice_plan');
  // Values (captain 2026-07-13): Launch Pad learners + all adults (guides,
  // parents, owners) TYPE their values via the quiz (free text + archetype);
  // Discovery + Adventure learners PICK from the curated list. (Sparks does no
  // values step at all - see CASCADE_SPARKS.)
  const typeValues = role !== 'learner' || studio === 'launchpad';
  // Character strengths (captain 2026-07-13): Discovery + Adventure learners take
  // the VIA YOUTH survey; Launch Pad learners and all adults take the adult VIA
  // survey. Same on-device PDF upload for both.
  const childStrengths = role === 'learner' && (studio === 'discovery' || studio === 'adventure');

  const state = {
    idx: 0,
    values: [],
    valuesTyped: { values: [], archetype: '' }, // typed values + archetype (adults / older)
    strengths: [],
    strengthResult: null, // parsed VIA PDF {top8, bottom8, top3}
    strengthError: '',
    valuesLexicon: [],
    viaStrengths: [],
    horizons: { beyond_5yr: '', within_5yr: '', within_1yr: '', current_state: '', halfway: '' },
    pitchStage: 'ask-age', // ask-age -> ask-optin | age-no -> confirmed
    pitchOptedIn: false, // set when the learner opts into the pitch; drives the slice wheel
    sliceText: {},   // sliceId -> the learner's 1-year goal text for that wheel slice
    sliceLabels: {}, // sliceId -> slice display label (for the goal's lifeArea tag)
    // Stage O (behind CURRENT_WHEEL_BUILD): the per-slice onboarding walk cursor +
    // stored open-by-choice. Entirely dormant while the flag is off - the legacy
    // lumped slice grid renders and none of this is read. See docs/design/2026-07-17-build-plan.md.
    sliceWalk: { pass: 'year', idx: 0 }, // which pass (intro|year) + which slice
    openByChoice: [], // sliceIds the learner chose to leave open (§4; loaded + persisted)
    sliceNow: {},      // sliceId -> "where I am now" text (legacy reflect pass; unused flag-on)
    sliceHalfway: {},  // sliceId -> halfway-goal text (legacy reflect pass; unused flag-on)
    // Goals-as-cards redesign (captain 2026-07-17, walk-as-user): each slice holds up to 3
    // goals. Carried thresholds are always kept (Learning 6 / Heart 4 / Friends 2, required
    // for the pitch); the learner adds PERSONAL goals up to (3 - carriedCount) - so empty
    // slices +3, Friends +1, Heart/Learning +0. Every goal (carried or personal) carries a
    // per-goal "where you are now" + "halfway point".
    //   sliceItems[sliceId]      -> [{ text, now, halfway }]  the learner's personal goal rows
    //   thresholdDetail[threshId] -> { now, halfway }          child records keyed to the
    //     threshold id (Geordi's projection rule) - NEVER a goal row, so La'an's write-wall
    //     and the read-only-to-system invariant hold: a carried threshold is editable-with-
    //     detail to the learner while the system keeps it read-only underneath.
    sliceItems: {},
    thresholdDetail: {},
  };

  setModalTitle(role === 'guide' ? 'Welcome, guide' : 'Welcome to your compass');

  // Hide the default form's modal-actions; each step renders its own buttons.
  const defaultActions = document.querySelector('#goal-form .modal-actions');
  if (defaultActions) defaultActions.style.display = 'none';
  activeSubmit = null;

  // Reference tables (cached at the adapter level).
  state.valuesLexicon = await getValuesLexicon();
  state.viaStrengths = await getViaCharacterStrengths();

  // Load any saved progress and resume on the saved step (Decision 3).
  if (profileId) {
    const [savedValues, savedTyped, savedStrengths, savedHorizons, onb] = await Promise.all([
      getProfileValues(profileId),
      typeValues ? getValuesFreetext(profileId) : Promise.resolve(null),
      getProfileStrengths(profileId),
      getProfileHorizons(profileId),
      getOnboardingState(profileId),
    ]);
    if (savedTyped) state.valuesTyped = { values: savedTyped.values || [], archetype: savedTyped.archetype || '' };
    state.values = Array.isArray(savedValues) ? savedValues.slice(0, 3) : [];
    state.strengths = Array.isArray(savedStrengths) ? savedStrengths.slice(0, 3) : [];
    if (savedHorizons) state.horizons = { ...state.horizons, ...savedHorizons };
    const resumeIdx = steps.indexOf(onb.step);
    state.idx = resumeIdx >= 0 ? resumeIdx : 0;
  }

  // Preload any year goals already set against wheel slices, so the slice-plan
  // step shows prior input on resume (and Continue upserts rather than duplicates).
  if (hasSlicePlan && learnerId) {
    try {
      const existingGoals = await getGoals(learnerId);
      for (const g of existingGoals) {
        if (g.scope === 'year' && typeof g.categoryId === 'string'
            && g.categoryId.startsWith('slice_') && g.text) {
          (state.sliceItems[g.categoryId] ||= []).push({ text: g.text, now: g.baseline || '', halfway: g.halfwayPoint || '' });
          if (g.lifeArea) state.sliceLabels[g.categoryId] = g.lifeArea;
        }
      }
      state.thresholdDetail = await getThresholdAdditions(learnerId) || {};
    } catch (e) { /* non-fatal: the slice cards just start blank */ }
  }

  // Stage O (behind the flag): preload the learner's stored open-by-choice slices and
  // any prior per-slice halfway goals (Session-3 goals keyed by slice) so the walk
  // shows prior choices/answers. Dormant otherwise. "Now" is not persisted (it is the
  // in-walk anchor for the one backward-decompose), so nothing to preload for it.
  if (currentWheel && hasSlicePlan && learnerId) {
    try {
      const lr = await getLearner(learnerId);
      state.openByChoice = Array.isArray(lr?.openByChoice) ? [...lr.openByChoice] : [];
    } catch (e) { /* non-fatal: starts empty */ }
    try {
      const existingGoals = await getGoals(learnerId);
      for (const g of existingGoals) {
        if (g.scope === 'session' && g.sessionIndex === 3 && typeof g.categoryId === 'string'
            && g.categoryId.startsWith('slice_') && g.text) {
          state.sliceHalfway[g.categoryId] = g.text;
        }
      }
    } catch (e) { /* non-fatal: halfway boxes just start blank */ }
  }

  function curStep() { return steps[state.idx]; }
  function isLast() { return state.idx === steps.length - 1; }

  function finish() {
    restoreDefaultActions();
    closeModal();
    if (onComplete) onComplete();
  }

  // Capture an in-progress textarea into state so Back/forward never loses it.
  function captureHorizon() {
    const step = curStep();
    if (HORIZON_PROMPTS[step]) {
      const ta = document.getElementById('onb-horizon');
      if (ta) state.horizons[step] = ta.value;
    }
  }

  // Advance one step: persist the pointer, complete the cascade if we ran off
  // the end. saveFn (optional) writes the current step's field first.
  async function advance(saveFn) {
    if (saveFn) await saveFn();
    state.idx += 1;
    if (state.idx >= steps.length) {
      if (profileId) await completeOnboarding(profileId);
      finish();
      return;
    }
    // 'pitch' and 'slice_plan' are not in the onboarding_step resume enum - don't
    // persist them as the pointer (their data lives on the learner row / as year
    // goals, so re-showing on resume is idempotent).
    if (steps[state.idx] === 'pitch') state.pitchStage = 'ask-age';
    // Stage O: entering the slice-plan step fresh - start the per-slice walk at its
    // intro page (orients before the year pass; behind the flag; legacy grid ignores this).
    if (currentWheel && steps[state.idx] === 'slice_plan') state.sliceWalk = { pass: 'intro', idx: 0 };
    if (profileId && !NON_RESUME_STEPS.has(steps[state.idx])) await setOnboardingStep(profileId, steps[state.idx]);
    render();
  }

  // "Not now" (Decision 2): record the skip as honored, then advance.
  async function skipStep() {
    const step = curStep();
    captureHorizon();
    captureValuesTyped();
    captureSlice();
    // Non-resume steps (pitch, slice_plan) aren't in the onboarding_step enum, so
    // never record a skip against them.
    if (profileId && step !== 'breath' && !NON_RESUME_STEPS.has(step)) await markOnboardingStepSkipped(profileId, step);
    await advance(null);
  }

  function back() {
    if (state.idx === 0) return;
    captureHorizon();
    captureValuesTyped();
    captureSlice();
    state.idx -= 1;
    if (steps[state.idx] === 'pitch') state.pitchStage = 'ask-age';
    if (profileId && !NON_RESUME_STEPS.has(steps[state.idx])) setOnboardingStep(profileId, steps[state.idx]);
    render();
  }

  function navButtons({ skippable = true, continueLabel = 'Continue', continueDisabled = false } = {}) {
    const backBtn = state.idx > 0 ? `<button type="button" id="onb-back" class="btn btn-text">Back</button>` : '<span></span>';
    const skipBtn = skippable ? `<button type="button" id="onb-skip" class="btn btn-text">Not now</button>` : '';
    return `
      <div class="onb-step-actions">
        ${backBtn}
        <div class="onb-step-actions-right">
          ${skipBtn}
          <button type="button" id="onb-continue" class="btn btn-primary"${continueDisabled ? ' disabled' : ''}>${escapeHtml(continueLabel)}</button>
        </div>
      </div>
    `;
  }

  function renderBreath() {
    return `
      <div class="onb-breath">
        <p class="onb-breath-copy">Welcome. Before we look at anything together - one breath.</p>
        <p class="onb-breath-copy">In through your nose. Out through your mouth. There is no hurry.</p>
      </div>
      <div class="onb-step-actions">
        <span></span>
        <div class="onb-step-actions-right">
          <button type="button" id="onb-continue" class="btn btn-primary">I’m ready</button>
        </div>
      </div>
    `;
  }

  // Strengths step: VIA survey link-out + on-device PDF upload (no hand-picking).
  function renderStrengthsUpload() {
    const labels = {};
    // Prefer child-friendly labels for the youth tier when the reference table
    // carries them; fall back to the adult label until display_label_child lands.
    state.viaStrengths.forEach((s) => {
      labels[s.id] = (childStrengths && s.display_label_child) ? s.display_label_child : s.display_label_adult;
    });
    const surveyUrl = childStrengths ? VIA_YOUTH_SURVEY_URL : VIA_SURVEY_URL;
    const surveyName = childStrengths ? 'VIA Youth Survey (ages 8-17)' : 'VIA Survey';
    const r = state.strengthResult;
    const preview = r
      ? `<div class="onb-via-found"><p class="onb-step-instruction">Got it - your top strengths:</p><ol class="via-preview-list">${r.top8.slice(0, 5).map((id) => `<li>${escapeHtml(labels[id] || id)}</li>`).join('')}</ol></div>`
      : '';
    const errored = state.strengthError ? `<p class="via-import-error">${escapeHtml(state.strengthError)}</p>` : '';
    return `
      <p class="onb-step-instruction">Your character strengths come from the free ${surveyName}. Take it, download your results PDF, and drop it below - it's read on your device and never uploaded.</p>
      <p class="onb-linkout"><a href="${escapeAttr(surveyUrl)}" target="_blank" rel="noopener noreferrer">Take the free ${surveyName} ↗</a><span class="onb-linkout-note">Opens in a new tab. Come back with your PDF.</span></p>
      <label class="via-drop" id="onb-via-drop">
        <input type="file" id="onb-via-file" accept="application/pdf" hidden>
        <span>Drop your VIA PDF here, or <strong>choose a file</strong></span>
      </label>
      ${preview}
      ${errored}
      ${navButtons({ skippable: true, continueLabel: isLast() ? 'Enter your Compass' : 'Continue', continueDisabled: !r })}
    `;
  }

  // After the strengths import: a short "why your strengths matter" page for
  // learners, their top strengths pinned on top. Read-only, no data entered.
  // (Captain 2026-07-19.) Copy is written for an 8-year-old and stays generic so
  // it fits any learner's strengths.
  function renderStrengthsWhy() {
    const labels = {};
    state.viaStrengths.forEach((s) => {
      labels[s.id] = (childStrengths && s.display_label_child) ? s.display_label_child : s.display_label_adult;
    });
    // strengthResult holds the full top8 when they just uploaded; on a rare
    // resume-then-back it may be absent, so fall back to the saved top strengths.
    const ids = (state.strengthResult ? state.strengthResult.top8 : state.strengths).slice(0, 5);
    const chips = ids.map((id) => `<li>${escapeHtml(labels[id] || id)}</li>`).join('');
    return `
      <div class="onb-strengths-why">
        <ol class="via-preview-list onb-why-strengths">${chips}</ol>
        <h3 class="onb-why-heading">Tools you already have</h3>
        <p class="onb-why-body">Meet your strengths. These are some of the best parts of who you are. You use them every day, in your own way - maybe you help a friend, ask a great question, make someone laugh, or keep going when something gets tricky.</p>
        <p class="onb-why-body">Your strengths are like tools you carry with you everywhere. When you want to learn something new or change something, you don't have to start from nothing. You get to use what you are already good at.</p>
        <p class="onb-why-body">These make you, you. And when something feels hard, you can stop and ask: which of my strengths can help me right now?</p>
        <p class="onb-why-body">The more you use them, the stronger they grow - and that is how they help you grow, a little more every day.</p>
      </div>
      ${navButtons({ skippable: false, continueLabel: isLast() ? 'Enter your Compass' : 'Continue' })}
    `;
  }

  // Values step for adults + older learners: type top 3 + optional archetype
  // (their values.institute results, which don't map to our curated list).
  function renderValuesType() {
    const v = state.valuesTyped;
    return `
      <p class="onb-step-instruction">Your top five values (your value pyramid). If you took the Values assessment, type your results in - the archetype is optional.</p>
      <p class="onb-linkout"><a href="${escapeAttr(VALUES_ASSESSMENT_URL)}" target="_blank" rel="noopener noreferrer">Take the Values assessment ↗</a><span class="onb-linkout-note">Opens in a new tab. Come back and type your top five.</span></p>
      <div class="form-field"><label for="val-1">Value 1</label><input type="text" id="val-1" value="${escapeAttr(v.values[0] || '')}" placeholder="e.g. Peace"></div>
      <div class="form-field"><label for="val-2">Value 2</label><input type="text" id="val-2" value="${escapeAttr(v.values[1] || '')}" placeholder="e.g. Intimacy"></div>
      <div class="form-field"><label for="val-3">Value 3</label><input type="text" id="val-3" value="${escapeAttr(v.values[2] || '')}" placeholder="e.g. Wealth"></div>
      <div class="form-field"><label for="val-4">Value 4</label><input type="text" id="val-4" value="${escapeAttr(v.values[3] || '')}" placeholder="e.g. Awe"></div>
      <div class="form-field"><label for="val-5">Value 5</label><input type="text" id="val-5" value="${escapeAttr(v.values[4] || '')}" placeholder="e.g. Vitality"></div>
      <div class="form-field"><label for="val-arch">Archetype <span class="onb-optional">(optional)</span></label><input type="text" id="val-arch" value="${escapeAttr(v.archetype || '')}" placeholder="e.g. The Seeker"></div>
      ${navButtons({ skippable: true, continueLabel: isLast() ? 'Enter your Compass' : 'Continue' })}
    `;
  }

  function captureValuesTyped() {
    if (!typeValues || curStep() !== 'values') return;
    const g = (id) => (document.getElementById(id)?.value || '').trim();
    state.valuesTyped = {
      values: [g('val-1'), g('val-2'), g('val-3'), g('val-4'), g('val-5')].filter(Boolean),
      archetype: g('val-arch'),
    };
  }

  function renderSelectStep({ kind, label }) {
    const list = kind === 'value' ? state.values : state.strengths;
    // Discovery learners skip the external Values assessment link (values.institute
    // is adult-oriented) - they pick from the curated list. (Captain 2026-07-14.)
    const suppressValuesLink = kind === 'value' && studio === 'discovery';
    const linkUrl = kind === 'value' ? VALUES_ASSESSMENT_URL : VIA_SURVEY_URL;
    const linkText = kind === 'value'
      ? 'Take the Values assessment'
      : 'Take the free VIA Survey';
    const linkBlock = suppressValuesLink
      ? ''
      : linkUrl
        ? `<p class="onb-linkout"><a href="${escapeAttr(linkUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(linkText)} ↗</a><span class="onb-linkout-note">Opens in a new tab. We’ll keep your place here - come back when you have your results.</span></p>`
        : `<p class="onb-linkout-note">Assessment link coming soon - for now, choose what fits you best below.</p>`;
    let grid;
    if (kind === 'value') {
      grid = `<div class="onb-select-grid">${state.valuesLexicon.map((v) => {
        const selected = state.values.includes(v.id);
        return `<button type="button" class="onb-select-card${selected ? ' selected' : ''}" data-id="${escapeAttr(v.id)}" data-kind="value">${escapeHtml(v.display_label_adult)}</button>`;
      }).join('')}</div>`;
    } else {
      const byCategory = new Map();
      state.viaStrengths.forEach((s) => {
        if (!byCategory.has(s.virtue_category)) byCategory.set(s.virtue_category, []);
        byCategory.get(s.virtue_category).push(s);
      });
      grid = `<div class="onb-virtue-groups">${Array.from(byCategory.entries()).map(([category, items]) => {
        const cards = items.map((s) => {
          const selected = state.strengths.includes(s.id);
          return `<button type="button" class="onb-select-card${selected ? ' selected' : ''}" data-id="${escapeAttr(s.id)}" data-kind="strength">${escapeHtml(s.display_label_adult)}</button>`;
        }).join('');
        return `<div class="onb-virtue-group"><h3 class="onb-virtue-heading">${escapeHtml(category)}</h3><div class="onb-select-grid">${cards}</div></div>`;
      }).join('')}</div>`;
    }
    return `
      <p class="onb-step-instruction">Choose your top five ${escapeHtml(label)}. <span class="onb-count">(${list.length} of 5 selected)</span></p>
      ${linkBlock}
      ${grid}
      ${navButtons({ skippable: true, continueLabel: isLast() ? 'Enter your Compass' : 'Continue', continueDisabled: list.length !== 5 })}
    `;
  }

  // Pitch-readiness step: a yes/no age self-report (no birthdate collected), then
  // an opt-in. On opt-in the pitch page turns on immediately and the guide is
  // asked to confirm the age status. Sub-stages live in state.pitchStage.
  function renderPitch() {
    const targetName = getStudioName(pitchTarget);
    const cut = pitchCutoff(pitchTarget) || { entryAge: '', cutoffLabel: 'next year' };
    const stage = state.pitchStage;

    if (stage === 'ask-optin') {
      return `
        <div class="onb-horizon-prompt">
          <h3 class="onb-horizon-heading">Want to start getting ready?</h3>
          <p class="onb-horizon-body">You could spend this year working toward your pitch to <strong>${escapeHtml(targetName)}</strong>. Your guide will help you get there.</p>
        </div>
        <div class="onb-pitch-choices">
          <button type="button" class="btn btn-primary" data-pitch="optin-yes">Yes, let's go</button>
          <button type="button" class="btn btn-text" data-pitch="optin-no">Maybe later</button>
        </div>
        <div class="onb-step-actions"><button type="button" id="onb-back" class="btn btn-text">Back</button><span></span></div>
      `;
    }
    if (stage === 'age-no') {
      return `
        <div class="onb-horizon-prompt">
          <h3 class="onb-horizon-heading">That's okay - you'll get there.</h3>
          <p class="onb-horizon-body"><strong>${escapeHtml(targetName)}</strong> will be there when it's your time. For now, let's keep building this year.</p>
        </div>
        ${navButtons({ skippable: false, continueLabel: 'Continue' })}
      `;
    }
    if (stage === 'confirmed') {
      return `
        <div class="onb-horizon-prompt">
          <h3 class="onb-horizon-heading">You're on your way.</h3>
          <p class="onb-horizon-body">Your <strong>${escapeHtml(targetName)}</strong> pitch is open, and your guide has been asked to confirm. Let's set your year.</p>
        </div>
        ${navButtons({ skippable: false, continueLabel: 'Continue' })}
      `;
    }
    // ask-age (default)
    return `
      <div class="onb-horizon-prompt">
        <h3 class="onb-horizon-heading">Thinking about ${escapeHtml(targetName)}?</h3>
        <p class="onb-horizon-body">To pitch up to <strong>${escapeHtml(targetName)}</strong> next year, you'll need to have turned <strong>${escapeHtml(String(cut.entryAge))}</strong> by <strong>${escapeHtml(cut.cutoffLabel)}</strong>. Will you have?</p>
      </div>
      <div class="onb-pitch-choices">
        <button type="button" class="btn btn-primary" data-pitch="age-yes">Yes, I will</button>
        <button type="button" class="btn btn-text" data-pitch="age-no">Not yet</button>
      </div>
      <div class="onb-step-actions"><button type="button" id="onb-back" class="btn btn-text">Back</button><span></span></div>
    `;
  }

  function renderHorizon(step) {
    const p = HORIZON_PROMPTS[step];
    // Progressive context stack: prior horizon answers shown as compact
    // full-text cards above the box, so the thread the person has been building
    // stays in view as they narrow in. The halfway step prunes the far horizons
    // and keeps only the near frame (1 year + now) - the two the midpoint sits
    // between. Empty answers (e.g. horizons a young tier never saw) are dropped.
    const priors = step === 'halfway'
      ? ['within_1yr', 'current_state']
      : HORIZON_ORDER.slice(0, HORIZON_ORDER.indexOf(step));
    const stackCards = priors
      .map((h) => {
        const val = (state.horizons[h] || '').trim();
        if (!val) return '';
        return `<div class="onb-stack-card">
             <span class="onb-stack-label">${escapeHtml(HORIZON_STACK_LABEL[h])}</span>
             <p class="onb-stack-text">${escapeHtml(val)}</p>
           </div>`;
      })
      .filter(Boolean)
      .join('');
    const stack = stackCards ? `<div class="onb-horizon-stack">${stackCards}</div>` : '';
    // Wheel pinned atop the telescope (captain 2026-07-09; MAC review 2026-07-10):
    // "hold your whole life in view" as you narrow from 10 years to now. It drops
    // away at the halfway step, with the far horizons.
    const wheel = step !== 'halfway' ? `<div class="onb-wheel-pin">${lifeWheelSvgFor(studio)}</div>` : '';
    // Mandatory vision flow for learners (captain 2026-07-15): the telescope steps
    // (10yr/5yr/1yr/mirror/halfway) must be answered - no "Not now," Continue is
    // disabled until the box has text. Narrows the 2026-06-22 walk-once decision
    // for learners on the vision steps only; the slice-plan step stays invitational
    // (Accord + TCC coverage-frame sign-off, 2026-07-15). Guides/parents keep skip.
    const required = role === 'learner' || role === 'guide'; // guides + owners get the full learner path (captain 2026-07-16); parents stay light
    return `
      ${wheel}
      ${stack}
      <div class="onb-horizon-prompt">
        <h3 class="onb-horizon-heading">${escapeHtml(p.heading)}</h3>
        <p class="onb-horizon-body">${escapeHtml(p.body)}</p>
        ${step === 'beyond_5yr' ? `<p class="onb-horizon-sparks">${escapeHtml((role !== 'learner' || TENYR_SPARKS_MATURE_STUDIOS.has(studio)) ? TENYR_SPARKS.mature : TENYR_SPARKS.young)}</p>` : ''}
      </div>
      <div class="form-field">
        <textarea id="onb-horizon" rows="4" placeholder="${escapeAttr(p.placeholder)}">${escapeHtml(state.horizons[step] || '')}</textarea>
      </div>
      ${navButtons({ skippable: !required, continueLabel: isLast() ? 'Enter your Compass' : 'Continue', continueDisabled: required && !(state.horizons[step] || '').trim() })}
    `;
  }

  // Capture the slice-plan textareas into state, so Back / Not now / re-render
  // never lose typing.
  function captureSlice() {
    document.querySelectorAll('.slice-box').forEach((ta) => {
      const id = ta.dataset.sliceId;
      if (!id) return;
      state.sliceText[id] = ta.value;
      state.sliceLabels[id] = ta.dataset.sliceLabel || null;
    });
  }

  // Upsert each non-empty slice box as a year goal tagged with its wheel slice.
  // Empty boxes are left untouched - never wipe a goal the learner may have set on a
  // prior pass (coverage frame: an empty slice is fine). Shared by the legacy grid
  // and the Stage O walk; the operations are the pre-Stage-O behavior, unchanged.
  async function upsertYearGoals() {
    if (!learnerId) return;
    let existing = [];
    try { existing = await getGoals(learnerId); } catch (e) { existing = []; }
    const byCat = new Map(
      existing.filter((g) => g.scope === 'year').map((g) => [g.categoryId, g])
    );
    for (const [sliceId, raw] of Object.entries(state.sliceText)) {
      const text = (raw || '').trim();
      if (!text) continue;
      const prior = byCat.get(sliceId);
      await saveGoal({
        id: prior?.id,
        learnerId,
        categoryId: sliceId,
        scope: 'year',
        text,
        lifeArea: state.sliceLabels[sliceId] || null,
        targetSession: 6,
        status: prior?.status || 'active',
      });
    }
  }

  // Stage O: persist the learner's stored open-by-choice slices (§4 - a chosen-open
  // slice is distinguishable from missing-data). Behind the flag; the open_by_choice
  // column stays dormant (Stage P3) until this walk writes it.
  async function persistOpenByChoice() {
    if (!learnerId) return;
    try { await saveLearner({ id: learnerId, openByChoice: state.openByChoice }); }
    catch (e) { /* non-fatal: the walk still completes */ }
  }

  // Stage O2: persist each halfway goal as the learner's Session-3 goal for that slice
  // ("the halfway goal IS the Session 3 goal"). scope:'session' sessionIndex:3, keyed by
  // slice, upserted so a re-walk edits rather than duplicates. Empty boxes untouched
  // (invitational). Stage M reads these as the working start of each goal. Behind the flag.
  async function persistHalfwayGoals() {
    if (!learnerId) return;
    let existing = [];
    try { existing = await getGoals(learnerId); } catch (e) { existing = []; }
    const byCat = new Map(
      existing.filter((g) => g.scope === 'session' && g.sessionIndex === 3).map((g) => [g.categoryId, g])
    );
    for (const [sliceId, raw] of Object.entries(state.sliceHalfway)) {
      const text = (raw || '').trim();
      if (!text) continue;
      const prior = byCat.get(sliceId);
      await saveGoal({
        id: prior?.id,
        learnerId,
        categoryId: sliceId,
        scope: 'session',
        sessionIndex: 3,
        text,
        lifeArea: state.sliceLabels[sliceId] || null,
        status: prior?.status || 'active',
      });
    }
  }

  // Persist the goals-as-cards year pass (captain 2026-07-17 walk-as-user). Two write paths,
  // and the split is the whole point of the read-only-to-system wall:
  //   * PERSONAL goals  -> real slice_* year goal ROWS (baseline = "where you are now",
  //     halfwayPoint = the halfway). categoryId is the slice id, so La'an's write-wall passes.
  //   * CARRIED-THRESHOLD details -> child records keyed to the threshold id, via
  //     saveThresholdAdditions. NEVER saveGoal, so a threshold id is never a goal row.
  async function persistSliceGoals() {
    if (!learnerId) return;
    let existing = [];
    try { existing = await getGoals(learnerId); } catch (e) { existing = []; }
    for (const [sliceId, items] of Object.entries(state.sliceItems)) {
      for (const it of (items || [])) {
        const text = (it.text || '').trim();
        if (!text) continue;
        const prior = existing.find((g) => g.scope === 'year' && g.categoryId === sliceId && g.text === text);
        await saveGoal({
          id: prior?.id,
          learnerId,
          categoryId: sliceId,
          scope: 'year',
          text,
          lifeArea: state.sliceLabels[sliceId] || null,
          baseline: (it.now || '').trim() || undefined,
          halfwayPoint: (it.halfway || '').trim() || undefined,
          targetSession: 6,
          status: prior?.status || 'active',
        });
      }
    }
    const additions = {};
    for (const [tid, d] of Object.entries(state.thresholdDetail)) {
      const now = (d.now || '').trim();
      const halfway = (d.halfway || '').trim();
      if (now || halfway) additions[tid] = { now, halfway };
    }
    if (Object.keys(additions).length) {
      try { await saveThresholdAdditions(learnerId, additions); } catch (e) { /* non-fatal (dark) */ }
    }
  }

  // Stage O walk wiring (flag-on slice_plan only). Owns Back / Continue / leave-open / add
  // for the intro + year passes; the generic step handlers are skipped.
  function wireSliceWalk() {
    const plan = buildSlicePlan({
      currentStudio: studio,
      pitchTargetStudio: state.pitchOptedIn ? pitchTarget : null,
      currentWheel,
    });
    const pass = state.sliceWalk.pass;
    // Intro page: only Back / Start, no slice boxes to capture.
    if (pass === 'intro') {
      document.getElementById('onb-continue')?.addEventListener('click', () => advanceWalk());
      document.getElementById('onb-back')?.addEventListener('click', () => retreatWalk());
      return;
    }
    const slices = walkSliceList(plan);
    const i = Math.min(state.sliceWalk.idx, Math.max(0, slices.length - 1));
    const slice = slices[i];

    // Capture the current page's box(es) for this pass. Year page has one box
    // (onb-slice-box); the reflect page has two (now + halfway). On the year pass,
    // typing un-marks any prior "left open" - a written slice is not open-by-choice (§4).
    // Capture the current slice's goal cards: personal one-liners (+ their now/halfway) into
    // state.sliceItems; carried-threshold now/halfway into state.thresholdDetail (child
    // records keyed to the threshold id - never a goal row, so the write-wall holds).
    const captureCurrent = () => {
      if (!slice) return;
      const items = [];
      document.querySelectorAll('.slice-goal-text').forEach((inp) => {
        const idx = Number(inp.dataset.idx);
        if (!Number.isNaN(idx)) items[idx] = { text: inp.value };
      });
      state.sliceItems[slice.sliceId] = items.filter(Boolean);
      state.sliceLabels[slice.sliceId] = slice.label;
      if (items.some((it) => (it?.text || '').trim()) && state.openByChoice.includes(slice.sliceId)) {
        state.openByChoice = state.openByChoice.filter((s) => s !== slice.sliceId);
      }
    };

    // "+ add another goal": capture, append an empty personal card (up to the cap), re-render.
    document.getElementById('onb-slice-add')?.addEventListener('click', () => {
      captureCurrent();
      const items = state.sliceItems[slice.sliceId] || [];
      if (items.length < sliceMaxAdd(slice)) items.push({ text: '' });
      state.sliceItems[slice.sliceId] = items;
      render();
    });

    // "Leave this open" records a stored open-by-choice and advances (empty slices only).
    document.getElementById('onb-slice-open')?.addEventListener('click', () => {
      captureCurrent();
      state.openByChoice = [...new Set([...state.openByChoice, slice.sliceId])];
      state.sliceItems[slice.sliceId] = [];
      advanceWalk();
    });

    document.getElementById('onb-continue')?.addEventListener('click', () => {
      captureCurrent();
      advanceWalk();
    });

    document.getElementById('onb-back')?.addEventListener('click', () => {
      captureCurrent();
      retreatWalk();
    });
  }

  // Advance the walk. Within a pass, step to the next slice. At a pass boundary,
  // persist that pass and start the next (year -> now -> halfway), skipping a pass with
  // no active slices. When the halfway pass ends, persist halfway goals and finish.
  async function advanceWalk() {
    const plan = buildSlicePlan({
      currentStudio: studio,
      pitchTargetStudio: state.pitchOptedIn ? pitchTarget : null,
      currentWheel,
    });
    const pass = state.sliceWalk.pass;
    if (pass === 'intro') { state.sliceWalk = { pass: 'year', idx: 0 }; render(); return; }
    const list = walkSliceList(plan);
    if (state.sliceWalk.idx < list.length - 1) {
      state.sliceWalk.idx += 1;
      render();
      return;
    }
    if (pass === 'year') {
      await persistOpenByChoice();
      // Year pass is the last pass now (now/halfway folded into the goal cards); persist and
      // leave slice_plan. The reflect pass is retired for the current-wheel build.
      await advance(async () => { await persistSliceGoals(); });
      return;
    }
    await advance(async () => { await persistSliceGoals(); });
  }

  // Enter a pass at its first slice. If the reflect pass has nothing to narrow (every
  // slice left open or empty), skip it and finish onboarding.
  async function startPass(plan, pass) {
    state.sliceWalk = { pass, idx: 0 };
    if (walkSliceListFor(plan, pass).length) { render(); return; }
    await advance(async () => { await persistHalfwayGoals(); });
  }

  // Step the walk backwards: within a pass to the prior slice; at the reflect pass's
  // first slice, back into the year pass's last slice; at the first year slice, leave
  // slice_plan for the prior onboarding step.
  function retreatWalk() {
    const plan = buildSlicePlan({
      currentStudio: studio,
      pitchTargetStudio: state.pitchOptedIn ? pitchTarget : null,
      currentWheel,
    });
    if (state.sliceWalk.pass === 'intro') { back(); return; } // intro -> leave slice_plan for the prior onboarding step
    if (state.sliceWalk.idx > 0) { state.sliceWalk.idx -= 1; render(); return; }
    if (state.sliceWalk.pass === 'reflect') { state.sliceWalk = { pass: 'year', idx: plan.areas.length - 1 }; render(); return; }
    state.sliceWalk = { pass: 'intro', idx: 0 }; render(); // year pass, first slice -> back to the intro page
  }

  // A threshold "carried from the pitch" into its slice: the name plus the same
  // break-into-weekly-steps -> North decompose the thresholds page offers, so the
  // pitch pipeline (pitch -> thresholds -> weekly tasks in North) is reachable
  // right here in the year plan. (Only rendered when the mapping is ratified.)
  function sliceCarriedItem(t) {
    return `
      <li class="threshold-item slice-carried-item">
        <div class="threshold-head"><span class="threshold-name">${escapeHtml(t.name)}</span></div>
        <details class="threshold-plan">
          <summary>Break into weekly steps</summary>
          <div class="threshold-steps">
            <input type="text" class="threshold-step-input" placeholder="On [when], I'll [what]">
            <input type="text" class="threshold-step-input" placeholder="On [when], I'll [what]">
            <input type="text" class="threshold-step-input" placeholder="On [when], I'll [what]">
          </div>
          <div class="threshold-when">
            <label><input type="radio" name="sstep-when-${escapeAttr(t.id)}" value="now" checked> Start now</label>
            <label><input type="radio" name="sstep-when-${escapeAttr(t.id)}" value="session1"> Prep for Session 1</label>
          </div>
          <button type="button" class="btn btn-primary threshold-plan-add" data-slice-threshold-plan="${escapeAttr(t.id)}">Add to my North</button>
        </details>
      </li>`;
  }

  // Slice-plan step dispatcher. Flag OFF -> the legacy lumped grid, byte-identical to
  // pre-Stage-O. Flag ON -> the Stage O per-slice walk. Nothing on the flag-on path
  // reaches a learner before Stage V's watch-with-a-real-learner gate.
  function renderSlicePlan() {
    return currentWheel ? renderSliceWalk() : renderSlicePlanLegacy();
  }

  // The 1-year plan, organized by wheel slice. A pitching learner plans by the
  // wheel of the studio they're growing INTO, thresholds pre-placed (when the
  // mapping is ratified); everyone else plans by their own current wheel, blank.
  function renderSlicePlanLegacy() {
    const plan = buildSlicePlan({
      currentStudio: studio,
      pitchTargetStudio: state.pitchOptedIn ? pitchTarget : null,
      currentWheel,
    });
    const wheel = `<div class="onb-wheel-pin">${lifeWheelSvgFor(plan.wheelStudio)}</div>`;
    const placedLine = plan.pitching && plan.ratified
      ? ' Some of your thresholds are already placed where they belong - refine them, or leave them as they are.'
      : '';
    const lead = plan.pitching
      ? `You said yes to your pitch to <strong>${escapeHtml(getStudioName(plan.wheelStudio))}</strong>. Here is your year, held across the parts of your life.${placedLine}`
      : `Here is your year, held across the parts of your life.`;
    const intro = `
      <div class="onb-horizon-prompt">
        <h3 class="onb-horizon-heading">Your year, slice by slice.</h3>
        <p class="onb-horizon-body">${lead} Fill the ones that are calling you. An empty slice is fine - it is an invitation, not a gap.</p>
      </div>`;
    const cards = plan.areas.map((slice) => {
      const val = state.sliceText[slice.sliceId] || '';
      const carried = slice.prefill.length
        ? `<div class="slice-carried">
             <span class="slice-carried-label">Carried from your pitch</span>
             <ul class="slice-carried-list">${slice.prefill.map(sliceCarriedItem).join('')}</ul>
           </div>`
        : '';
      return `
        <div class="slice-card" data-slice="${escapeAttr(slice.sliceId)}">
          <div class="slice-card-head"><span class="slice-card-name">${escapeHtml(slice.label)}</span></div>
          <textarea class="slice-box" data-slice-id="${escapeAttr(slice.sliceId)}" data-slice-label="${escapeAttr(slice.label)}" rows="2" placeholder="By next year, in ${escapeAttr(slice.label)}, I want to…">${escapeHtml(val)}</textarea>
          ${carried}
        </div>`;
    }).join('');
    return `
      ${wheel}
      ${intro}
      <div class="slice-grid">${cards}</div>
      ${navButtons({ skippable: true, continueLabel: 'Enter your Compass' })}
    `;
  }

  // ── Stage O: the per-slice walk (behind CURRENT_WHEEL_BUILD) ─────────────────
  // Retires the lumped grid ("a wall" - captain 2026-07-16) for a focused page per
  // Discovery slice, walked one at a time: Movement -> Learning -> Heart -> Family
  // -> Friends -> Fun. Chunking, not depth - direction only, NO full decomposition
  // here (the Compass cultivates; onboarding only plants). Two passes (captain
  // 2026-07-17, "now and halfway for each slice one at a time after the year run"):
  //   year    - a 1-year aim per slice, all six (O1)
  //   reflect  - per ACTIVE slice, one at a time: where you are NOW + the HALFWAY goal,
  //             framed by Now -> Year, on ONE focused page. The halfway is persisted as
  //             the Session-3 goal ("the halfway goal IS the Session 3 goal") (O2)
  // Finishing a slice's now+halfway before the next keeps the frame narrow (captain:
  // "more focused, less overwhelming"). Backward-decompose happens ONCE, at halfway;
  // execution stays forward. Honors the consolidated conditions: carried thresholds
  // render broken out, read-only, AS A FIELD (§2/§3); empty slices carry an authored
  // invitation + a stored "leave open" (§4); no denominator/meter anywhere (§1). The
  // reflect pass skips open/empty slices - nothing to narrow, so no pressure. Nothing
  // ships before Stage V's watch-with-a-real-learner gate.
  function renderSliceWalk() {
    const plan = buildSlicePlan({
      currentStudio: studio,
      pitchTargetStudio: state.pitchOptedIn ? pitchTarget : null,
      currentWheel,
    });
    if (state.sliceWalk.pass === 'intro') return renderSliceIntroPage(plan);
    return state.sliceWalk.pass === 'reflect' ? renderSliceReflectPage(plan) : renderSliceYearPage(plan);
  }

  // Intro page (captain 2026-07-17, walk-as-user): the first page of the slice walk,
  // orienting the learner before the year pass. Three "set up for success" jobs: show the
  // whole map at once (no surprise), front-load the leave-open permission (coverage frame),
  // and name the two-pass shape so the reflect lap is not a surprise (Comes' "we're not
  // going to rush you"). PROVISIONAL COPY - Accord/Comes author the final learner wording.
  function renderSliceIntroPage(plan) {
    const { wheel, banner } = sliceWalkChrome(plan);
    return `
      ${wheel}
      ${banner}
      <div class="onb-horizon-prompt onb-slice-intro">
        <h3 class="onb-horizon-heading">Setting your year</h3>
        <p class="onb-horizon-body">This is your compass - the parts of your life this year.</p>
        <p class="onb-horizon-body">You'll go through them one at a time. For each one, picture yourself next year - what do you want to be true? Fill the ones that are calling you. Leaving one open is a real choice, not a gap.</p>
        <p class="onb-horizon-body">Then we'll come back to the ones you filled and look closer - where you are now, and a halfway point on the way there.</p>
        <p class="onb-horizon-body">Nothing to finish today. There are no wrong answers. Take your time.</p>
      </div>
      <div class="onb-step-actions">
        <button type="button" id="onb-back" class="btn btn-text">Back</button>
        <div class="onb-step-actions-right">
          <button type="button" id="onb-continue" class="btn btn-primary">Start</button>
        </div>
      </div>
    `;
  }

  // The slices a pass walks. YEAR visits all six; REFLECT visits only slices with
  // something to progress toward (a written year aim or carried thresholds), so a slice
  // left open (§4) or empty is never pressed for a "now" or a halfway goal.
  function walkSliceListFor(plan, pass) {
    if (pass === 'year') return plan.areas;
    return plan.areas.filter((s) => (state.sliceText[s.sliceId] || '').trim() || s.prefill.length > 0);
  }
  function walkSliceList(plan) { return walkSliceListFor(plan, state.sliceWalk.pass); }

  // Shared page chrome: the pinned CURRENT wheel + the lead-copy seam banner. The
  // banner names the pitch target (e.g. Adventure) SEPARATELY from the current wheel
  // (Discovery) being planned, since with the flag on they are no longer the same.
  function sliceWalkChrome(plan) {
    const wheelName = getStudioName(plan.wheelStudio);
    const targetName = plan.pitchTargetStudio ? getStudioName(plan.pitchTargetStudio) : null;
    const banner = plan.pitching && targetName
      ? `<p class="onb-slice-context">Working toward your pitch to <strong>${escapeHtml(targetName)}</strong>, planned across your <strong>${escapeHtml(wheelName)}</strong> year.</p>`
      : '';
    return { wheelName, targetName, banner, wheel: `<div class="onb-wheel-pin">${lifeWheelSvgFor(plan.wheelStudio)}</div>` };
  }

  // A slice's carried thresholds, broken out read-only AS A FIELD (§2 field-not-sequence;
  // §3 read-only to the system, "a lock is a permission, not a pixel"). Shared across the
  // three passes so the carried work stays visible as context. No rank/number, no
  // completion/decompose affordance; render-time projection, never a goal row.
  function sliceCarriedField(slice, targetName) {
    if (!slice.prefill.length) return '';
    return `<div class="slice-carried slice-carried-field">
           <span class="slice-carried-label">Already yours, carried from your pitch${targetName ? ` to ${escapeHtml(targetName)}` : ''}</span>
           <ul class="slice-carried-list slice-carried-readonly">
             ${slice.prefill.map((t) => `<li class="slice-carried-name">${escapeHtml(t.name)}</li>`).join('')}
           </ul>
           <p class="slice-carried-note">These are yours to keep. You'll grow them in your Compass - nothing to do here.</p>
         </div>`;
  }

  // How many PERSONAL goals a slice may add: up to 3 total, carried thresholds count toward
  // it and are always kept (Learning 6 / Heart 4 -> 0 adds; Friends 2 -> 1; empty -> 3). The
  // "3" is a ceiling-as-relief, never a target - and never rendered as a denominator (§1).
  function sliceMaxAdd(slice) { return Math.max(0, 3 - slice.prefill.length); }

  // A carried threshold as a goal card: the real name (never disguised; captain 2026-07-17)
  // and a subject tag for the academics (Lexia = Reading, Khan = Math, spelling / handwriting
  // = Writing). Display only on the slice page - the "where you are / halfway" walkthrough
  // happens per goal on the main Compass page (captain 2026-07-17: "too much stuff on the
  // slice pages"). The threshold is never a goal row (read-only-to-system holds).
  function carriedGoalCard(t) {
    const SUBJECT = { adv_lexia: 'Reading', adv_khan: 'Math', adv_spelling: 'Writing', adv_handwriting: 'Writing', adv_typing: 'Typing' };
    const subject = SUBJECT[t.id];
    return `<div class="slice-goal-card slice-goal-carried">
        <div class="slice-goal-head">
          <span class="slice-goal-name">${escapeHtml(t.name)}</span>
          ${subject ? `<span class="slice-goal-tag">${escapeHtml(subject)}</span>` : ''}
        </div>
      </div>`;
  }

  // A learner's personal goal card: one editable SMART one-liner in a roomy box. Persisted
  // as a real slice_* goal row (passes the write-wall). now/halfway is set later on the main
  // page, not here.
  function personalGoalCard(sliceId, idx, item) {
    return `<div class="slice-goal-card slice-goal-personal">
        <textarea class="slice-goal-text slice-box" data-slice-id="${escapeAttr(sliceId)}" data-idx="${idx}" rows="3" placeholder="One goal - be specific (e.g. run a mile without stopping)">${escapeHtml(item.text || '')}</textarea>
      </div>`;
  }

  // YEAR pass: each slice's goals as individual cards (captain 2026-07-17 walk-as-user).
  // Carried thresholds render as goal cards (real names, required for the pitch); the learner
  // adds personal goals up to sliceMaxAdd. Just the year goals here - "where you are now" and
  // the halfway point are walked per goal on the main page. Empty slices keep the authored
  // invitation + a stored "leave open."
  function renderSliceYearPage(plan) {
    const slices = plan.areas;
    const i = Math.min(state.sliceWalk.idx, slices.length - 1);
    const slice = slices[i];
    const isLastSlice = i === slices.length - 1;
    const { wheel, banner, targetName } = sliceWalkChrome(plan);
    const hasCarried = slice.prefill.length > 0;
    const maxAdd = sliceMaxAdd(slice);
    const items = (state.sliceItems || {})[slice.sliceId] || [];
    const isOpen = state.openByChoice.includes(slice.sliceId);
    const hasPersonal = items.some((it) => (it.text || '').trim());
    const isEmpty = !hasCarried && !hasPersonal;

    const carriedBlock = hasCarried
      ? `<p class="slice-carried-label">Already yours, carried from your pitch${targetName ? ` to ${escapeHtml(targetName)}` : ''} - the goals you'll reach to move up.</p>
         ${slice.prefill.map(carriedGoalCard).join('')}`
      : '';

    // Personal goals: existing ones, plus one empty card if there is room and none pending.
    // The + button shows only while under the cap; AT the cap it simply disappears - never a
    // "3 of 3" counter (ceiling-as-relief).
    const shown = items.length ? items : (maxAdd > 0 ? [{ text: '' }] : []);
    const personalCards = shown.map((it, idx) => personalGoalCard(slice.sliceId, idx, it)).join('');
    const addBtn = shown.length < maxAdd
      ? `<button type="button" id="onb-slice-add" class="btn btn-text slice-goal-add">+ add another goal</button>`
      : '';
    const addHeading = hasCarried && maxAdd > 0 ? `<p class="slice-add-heading">Add one of your own, if you like.</p>` : '';

    const invitation = isEmpty ? sliceInvitationCopy(slice.label) : '';
    const leaveOpen = isEmpty
      ? `<button type="button" id="onb-slice-open" class="btn btn-text slice-open-btn${isOpen ? ' is-open' : ''}">${isOpen ? 'Left open for now ✓ (tap to add a goal instead)' : 'Leave this open for now'}</button>`
      : '';
    const continueLabel = isLastSlice ? 'Enter your Compass' : 'Next part of life';
    return `
      ${wheel}
      ${banner}
      <div class="onb-horizon-prompt">
        <h3 class="onb-horizon-heading">${escapeHtml(slice.label)}</h3>
        <p class="onb-horizon-body">Your year, one part of life at a time. Fill what is calling you - an open part of life is an invitation, never a gap.</p>
      </div>
      ${carriedBlock}
      ${addHeading}
      ${invitation}
      <div class="slice-goal-list">${personalCards}</div>
      ${addBtn}
      <div class="onb-step-actions">
        <button type="button" id="onb-back" class="btn btn-text">Back</button>
        <div class="onb-step-actions-right">
          ${leaveOpen}
          <button type="button" id="onb-continue" class="btn btn-primary">${escapeHtml(continueLabel)}</button>
        </div>
      </div>
    `;
  }

  // REFLECT pass (O2): one focused page per ACTIVE slice, walked one slice at a time
  // after the year run - captain's "now and halfway for each slice one at a time." Each
  // page holds BOTH the mirror (where you are now) and the halfway goal, framed by
  // Now -> Year (the two the midpoint sits between). The halfway becomes the Session-3
  // goal. Both boxes are invitational (may be left blank). "Now" is held for the frame
  // only; it is not persisted (the step restarts fresh on resume). No denominator, no
  // deadline-as-pressure (§1, §9 - the "one step more" gift stays in the Compass, not here).
  function renderSliceReflectPage(plan) {
    const slices = walkSliceList(plan);
    const i = Math.min(state.sliceWalk.idx, Math.max(0, slices.length - 1));
    const slice = slices[i];
    const isLastSlice = i === slices.length - 1;
    const { wheel, banner, targetName } = sliceWalkChrome(plan);
    const carried = sliceCarriedField(slice, targetName);
    const yearText = (state.sliceText[slice.sliceId] || '').trim();
    const yearContext = yearText
      ? `<div class="slice-frame-card slice-year-context"><span class="slice-context-label">By next year</span><p class="slice-context-text">${escapeHtml(yearText)}</p></div>`
      : '';
    const nowVal = state.sliceNow[slice.sliceId] || '';
    const hwVal = state.sliceHalfway[slice.sliceId] || '';
    const nowBox = `
      <div class="slice-now-box">
        <label class="slice-box-label" for="onb-slice-now">Where are you right now in ${escapeHtml(slice.label)}?</label>
        <textarea id="onb-slice-now" class="slice-box" data-slice-id="${escapeAttr(slice.sliceId)}" data-slice-label="${escapeAttr(slice.label)}" rows="2" placeholder="Right now, in ${escapeAttr(slice.label)}, I am…">${escapeHtml(nowVal)}</textarea>
      </div>`;
    const halfwayBox = `
      <div class="slice-halfway-box">
        <label class="slice-box-label" for="onb-slice-halfway">Halfway there in ${escapeHtml(slice.label)} - what does it look like?</label>
        <textarea id="onb-slice-halfway" class="slice-box" data-slice-id="${escapeAttr(slice.sliceId)}" data-slice-label="${escapeAttr(slice.label)}" rows="2" placeholder="Halfway, in ${escapeAttr(slice.label)}, I will…">${escapeHtml(hwVal)}</textarea>
      </div>`;
    const continueLabel = isLastSlice ? 'Enter your Compass' : 'Next part of life';
    return `
      ${wheel}
      ${banner}
      <div class="onb-horizon-prompt">
        <h3 class="onb-horizon-heading">${escapeHtml(slice.label)} - now and halfway</h3>
        <p class="onb-horizon-body">Two small steps for this part of your life: where you are today, and the halfway point on the way to your year. Look at both and set your middle-of-the-year goal - you do not have to hold the whole year at once.</p>
      </div>
      ${carried}
      ${yearContext}
      ${nowBox}
      ${halfwayBox}
      <div class="onb-step-actions">
        <button type="button" id="onb-back" class="btn btn-text">Back</button>
        <div class="onb-step-actions-right">
          <button type="button" id="onb-continue" class="btn btn-primary">${escapeHtml(continueLabel)}</button>
        </div>
      </div>
    `;
  }

  // Authored "yours-to-fill" invitation copy for the empty Discovery slices. Warm,
  // never deficit-framed; Family is handled most carefully - no assumption about what
  // a family is or who is in it, every kind belongs. House style is " - ", not em
  // dashes. FLAGGED for the built-surface re-walk before any learner sees it.
  function sliceInvitationCopy(label) {
    const COPY = {
      Movement: 'How do you want to move, play, and feel strong this year? If something is calling you here, write it. If not, that is okay - you can leave it open.',
      Family: 'Family looks different for everyone, and every kind of family belongs here. If there is something you hope for with the people you call family, you can write it. If not, you can leave this open - that is completely okay.',
      Fun: 'What do you want more of this year, just because it brings you joy? There is no wrong answer here - write one, or leave it open.',
    };
    const body = COPY[label] || 'This part of your life is yours to fill. Write what is calling you, or leave it open and come back whenever you like.';
    return `<p class="onb-slice-invitation">${escapeHtml(body)}</p>`;
  }

  function render() {
    const formFields = document.getElementById('form-fields');
    const step = curStep();
    if (step === 'breath') formFields.innerHTML = renderBreath();
    else if (step === 'strengths') formFields.innerHTML = renderStrengthsUpload();
    else if (step === 'strengths_why') formFields.innerHTML = renderStrengthsWhy();
    else if (step === 'values') formFields.innerHTML = typeValues ? renderValuesType() : renderSelectStep({ kind: 'value', label: 'values' });
    else if (step === 'pitch') formFields.innerHTML = renderPitch();
    else if (step === 'slice_plan') formFields.innerHTML = renderSlicePlan();
    else formFields.innerHTML = renderHorizon(step);
    wireStep();
    if (HORIZON_PROMPTS[step]) setTimeout(() => document.getElementById('onb-horizon')?.focus(), 50);
  }

  function wireStep() {
    const step = curStep();

    // Stage O (behind the flag): the per-slice walk owns its own Back / Continue /
    // leave-open wiring, so skip the generic step handlers below. Flag off falls
    // through to the legacy grid wiring unchanged.
    if (currentWheel && step === 'slice_plan') { wireSliceWalk(); return; }

    document.getElementById('onb-back')?.addEventListener('click', back);
    document.getElementById('onb-skip')?.addEventListener('click', skipStep);

    // Mandatory vision steps for learners (captain 2026-07-15): enable Continue
    // live as they type, since there is no "Not now" to fall back on.
    if (HORIZON_PROMPTS[step] && (role === 'learner' || role === 'guide')) {
      const ta = document.getElementById('onb-horizon');
      const cont = document.getElementById('onb-continue');
      ta?.addEventListener('input', () => { if (cont) cont.disabled = !ta.value.trim(); });
    }

    // Strengths step: VIA PDF upload (on-device parse, then advance).
    if (step === 'strengths') {
      const input = document.getElementById('onb-via-file');
      const drop = document.getElementById('onb-via-drop');
      const handle = async (file) => {
        state.strengthError = '';
        if (drop) drop.querySelector('span').textContent = 'Reading your PDF on your device…';
        let result;
        try { result = await parseViaPdf(file); }
        catch (e) { state.strengthError = 'Could not read that PDF. Make sure it is your VIA Character Strengths Profile.'; render(); return; }
        if (!result.ok) { state.strengthResult = null; state.strengthError = result.reason || 'That is not a VIA Character Strengths PDF.'; render(); return; }
        state.strengthResult = result;
        state.strengths = result.top8.slice(0, 3); // keep legacy field in sync
        render();
      };
      input?.addEventListener('change', () => { if (input.files[0]) handle(input.files[0]); });
      ['dragover', 'dragenter'].forEach((ev) => drop?.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
      drop?.addEventListener('dragleave', () => drop.classList.remove('over'));
      drop?.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) handle(f); });
    }

    // Pitch step: yes/no choices drive the sub-stages; opt-in saves the intent
    // (page turns on) and flags the guide (pitch_age_status = 'pending').
    if (step === 'pitch') {
      document.querySelectorAll('[data-pitch]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const action = btn.dataset.pitch;
          if (action === 'age-yes') { state.pitchStage = 'ask-optin'; render(); }
          else if (action === 'age-no') { state.pitchStage = 'age-no'; render(); }
          else if (action === 'optin-no') { await advance(null); }
          else if (action === 'optin-yes') {
            if (profileId) {
              try {
                await saveLearner({
                  id: profileId,
                  pitchTargetStudio: pitchTarget,
                  pitchIntentAt: new Date().toISOString(),
                  pitchAgeSelfReport: true,
                  pitchAgeStatus: 'pending',
                });
              } catch (e) { /* non-blocking: the confirmation still shows */ }
            }
            state.pitchOptedIn = true; // the slice-plan step plans by the target wheel
            state.pitchStage = 'confirmed';
            render();
          }
        });
      });
    }

    // Slice-plan step: a carried threshold's "Add to my North" decomposes its
    // weekly steps into dated North tasks - the same start-now / prep-Session-1
    // path the thresholds page uses.
    if (step === 'slice_plan') {
      document.querySelectorAll('[data-slice-threshold-plan]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (!learnerId || !pitchTarget) return;
          const item = btn.closest('.threshold-item');
          const stepsToAdd = [...item.querySelectorAll('.threshold-step-input')]
            .map((i) => i.value.trim()).filter(Boolean);
          if (!stepsToAdd.length) return;
          const mode = item.querySelector('input[type="radio"]:checked')?.value || 'now';
          btn.disabled = true;
          try {
            await addThresholdStepsToNorth({ id: learnerId, studio }, pitchTarget, stepsToAdd, mode);
            btn.textContent = 'Added to your North ✓';
          } catch (e) { btn.disabled = false; }
        });
      });
    }

    document.getElementById('onb-continue')?.addEventListener('click', async () => {
      if (step === 'breath') {
        await advance(null);
      } else if (step === 'strengths') {
        const r = state.strengthResult;
        if (!r) return; // need an uploaded VIA PDF first
        await advance(() => profileId ? setStrengthRanking(profileId, { top8: r.top8, bottom8: r.bottom8 }) : Promise.resolve());
      } else if (step === 'strengths_why') {
        await advance(null); // read-only page; nothing to persist
      } else if (step === 'values') {
        if (typeValues) {
          captureValuesTyped();
          await advance(() => profileId ? setValuesFreetext(profileId, state.valuesTyped) : Promise.resolve());
        } else {
          if (state.values.length !== 5) return;
          await advance(() => profileId ? setProfileValues(profileId, state.values) : Promise.resolve());
        }
      } else if (step === 'pitch') {
        await advance(null);
      } else if (step === 'slice_plan') {
        // Flag-on drives the slice_plan step through the walk (wireSliceWalk), so this
        // generic Continue only runs for the legacy lumped grid. Behavior is identical
        // to before Stage O: capture the boxes, then upsert non-empty slices as year goals.
        captureSlice();
        await advance(() => upsertYearGoals());
      } else {
        captureHorizon();
        const text = state.horizons[step] || '';
        if ((role === 'learner' || role === 'guide') && !text.trim()) return; // mandatory vision step
        await advance(() => profileId ? setProfileHorizon(profileId, step, text) : Promise.resolve());
      }
    });

    // Selection-card toggling for the strengths/values steps.
    document.querySelectorAll('.onb-select-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        const list = card.dataset.kind === 'value' ? state.values : state.strengths;
        const at = list.indexOf(id);
        if (at >= 0) {
          list.splice(at, 1);
        } else {
          if (list.length >= 5) return; // soft cap - can't pick a 6th
          list.push(id);
        }
        render();
      });
    });
  }

  function restoreDefaultActions() {
    const da = document.querySelector('#goal-form .modal-actions');
    if (da) da.style.display = '';
  }

  render();
  openModal();
  setModalGated(true); // first-run gate: no X / backdrop escape to the main face
}

// Quote flow (2026-06-24): the quote anchors the top of the page for the cycle.
// One teaching screen (why a quote + who inspires you, combined) then one form
// (the quote, who said it, what it means to you). Its OWN front-of-line flow so it always runs
// from Begin when the quote is missing/stale - never resumed-past like a cascade
// step. Saves all three fields + stamps the cycle. If the person closes the modal
// without saving, it simply re-prompts next sign-in.
export function openQuoteFlow({ profileId = null, currentCycle = '', existing = {}, onComplete, gated = true } = {}) {
  const SCREENS = ['intro', 'form'];
  const state = {
    idx: 0,
    text: existing.text || '',
    author: existing.author || '',
    note: existing.note || '',
  };

  setModalTitle('Your quote');
  const defaultActions = document.querySelector('#goal-form .modal-actions');
  if (defaultActions) defaultActions.style.display = 'none';
  activeSubmit = null;

  function finish() {
    closeModal(); // closeModal restores the default modal actions for the next modal
    if (onComplete) onComplete();
  }

  function captureForm() {
    const t = document.getElementById('qf-text');
    const a = document.getElementById('qf-author');
    const n = document.getElementById('qf-note');
    if (t) state.text = t.value.trim();
    if (a) state.author = a.value.trim();
    if (n) state.note = n.value.trim();
  }

  function renderIntro() {
    return `
      <div class="onb-horizon-prompt">
        <h3 class="onb-horizon-heading">Why a quote?</h3>
        <p class="onb-horizon-body">A single line, chosen on purpose, can carry you through a whole year - a north star in words when the days get hard, kept at the top of your page. Think of words that inspire you, or someone you admire - a teacher, a writer, someone you love, a person whose life fills you with awe or wonder. On the next screen, you’ll write down the line you carry.</p>
      </div>
      <div class="onb-step-actions">
        <span></span>
        <div class="onb-step-actions-right">
          <button type="button" id="qf-next" class="btn btn-primary">Continue</button>
        </div>
      </div>
    `;
  }

  function renderForm() {
    return `
      <div class="onb-horizon-prompt">
        <h3 class="onb-horizon-heading">Your quote.</h3>
        <p class="onb-horizon-body">Write the line that carries you, who said it, and what it means to you.</p>
      </div>
      <div class="form-field">
        <label for="qf-text">The quote</label>
        <textarea id="qf-text" rows="3" placeholder="A line that carries you...">${escapeHtml(state.text)}</textarea>
      </div>
      <div class="form-field">
        <label for="qf-author">Who said it</label>
        <input type="text" id="qf-author" placeholder="Who said it (or “unknown”)" value="${escapeAttr(state.author)}">
      </div>
      <div class="form-field">
        <label for="qf-note">What it means to you</label>
        <textarea id="qf-note" rows="3" placeholder="Why this line, for you...">${escapeHtml(state.note)}</textarea>
      </div>
      <p class="form-hint">The quote is the one line we need - who said it and what it means are yours to add or leave.</p>
      <div class="onb-step-actions">
        <button type="button" id="qf-back" class="btn btn-text">Back</button>
        <div class="onb-step-actions-right">
          <button type="button" id="qf-save" class="btn btn-primary"${state.text.trim() ? '' : ' disabled'}>Save my quote</button>
        </div>
      </div>
    `;
  }

  function render() {
    const formFields = document.getElementById('form-fields');
    const screen = SCREENS[state.idx];
    if (screen === 'intro') formFields.innerHTML = renderIntro();
    else formFields.innerHTML = renderForm();
    wire();
    if (screen === 'form') setTimeout(() => document.getElementById('qf-text')?.focus(), 50);
  }

  function wire() {
    const screen = SCREENS[state.idx];
    document.getElementById('qf-next')?.addEventListener('click', () => { state.idx += 1; render(); });
    document.getElementById('qf-back')?.addEventListener('click', () => {
      if (screen === 'form') captureForm();
      state.idx -= 1;
      render();
    });
    if (screen === 'form') {
      const textEl = document.getElementById('qf-text');
      const saveBtn = document.getElementById('qf-save');
      // Live-enable Save once a quote is written - the button shows what it waits for.
      const sync = () => { if (saveBtn) saveBtn.disabled = !textEl.value.trim(); };
      textEl?.addEventListener('input', sync);
      saveBtn?.addEventListener('click', async () => {
        captureForm();
        if (!state.text) return;
        if (profileId) await setQuoteAnchor(profileId, { text: state.text, author: state.author, note: state.note, cycle: currentCycle });
        finish();
      });
    }
  }

  render();
  openModal();
  // Learners/guides: first-run gate - the quote anchor must be set, not escaped.
  // Parents (gated:false): the quote is an offered personal anchor, skippable via
  // the X/backdrop, re-offered next cycle. (Captain 2026-07-19.)
  setModalGated(gated);
}

// Standalone pitch opt-in: the same age self-report + opt-in as the onboarding
// step, reachable any time from the North invitation - so it reaches EVERY
// eligible learner, not just those in first-run onboarding. (Captain 2026-07-13.)
export function openPitchOptInModal(learner, onDone) {
  const target = learner && nextStudio(learner.studio);
  if (!target) return;
  const targetName = getStudioName(target);
  const cut = pitchCutoff(target) || { entryAge: '', cutoffLabel: 'next year' };
  setModalTitle('Pitch readiness');
  const fields = document.getElementById('form-fields');
  if (!fields) return;
  let stage = 'ask-age';
  const render = () => {
    if (stage === 'ask-optin') {
      fields.innerHTML = `
        <div class="onb-horizon-prompt">
          <h3 class="onb-horizon-heading">Want to start getting ready?</h3>
          <p class="onb-horizon-body">You could spend this year working toward your pitch to <strong>${escapeHtml(targetName)}</strong>. Your guide will help you get there.</p>
        </div>
        <div class="onb-pitch-choices">
          <button type="button" class="btn btn-primary" data-pitch="optin-yes">Yes, let's go</button>
          <button type="button" class="btn btn-text" data-pitch="optin-no">Maybe later</button>
        </div>`;
    } else if (stage === 'age-no') {
      fields.innerHTML = `
        <div class="onb-horizon-prompt">
          <h3 class="onb-horizon-heading">That's okay - you'll get there.</h3>
          <p class="onb-horizon-body"><strong>${escapeHtml(targetName)}</strong> will be there when it's your time.</p>
        </div>
        <div class="onb-pitch-choices"><button type="button" class="btn btn-primary" data-pitch="close">Close</button></div>`;
    } else {
      fields.innerHTML = `
        <div class="onb-horizon-prompt">
          <h3 class="onb-horizon-heading">Thinking about ${escapeHtml(targetName)}?</h3>
          <p class="onb-horizon-body">To pitch up to <strong>${escapeHtml(targetName)}</strong> next year, you'll need to have turned <strong>${escapeHtml(String(cut.entryAge))}</strong> by <strong>${escapeHtml(cut.cutoffLabel)}</strong>. Will you have?</p>
        </div>
        <div class="onb-pitch-choices">
          <button type="button" class="btn btn-primary" data-pitch="age-yes">Yes, I will</button>
          <button type="button" class="btn btn-text" data-pitch="age-no">Not yet</button>
        </div>`;
    }
    fields.querySelectorAll('[data-pitch]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const a = btn.dataset.pitch;
        if (a === 'age-yes') { stage = 'ask-optin'; render(); }
        else if (a === 'age-no') { stage = 'age-no'; render(); }
        else if (a === 'optin-no' || a === 'close') { closeModal(); }
        else if (a === 'optin-yes') {
          try {
            await saveLearner({ id: learner.id, pitchTargetStudio: target, pitchIntentAt: new Date().toISOString(), pitchAgeSelfReport: true, pitchAgeStatus: 'pending' });
          } catch (e) { /* non-blocking */ }
          closeModal();
          if (onDone) onDone();
        }
      });
    });
  };
  const da = document.querySelector('#goal-form .modal-actions');
  if (da) da.style.display = 'none';
  render();
  openModal();
}

// Thresholds-to-thrive page: shows the next studio's readiness criteria as items
// the learner can plan and self-track. Guide/committee/signatures happen in
// person - this page never adjudicates. (Captain 2026-07-11.)
export function openThresholdsModal(targetStudio, learner) {
  setModalTitle('Pitch readiness');
  const fields = document.getElementById('form-fields');
  if (!fields) return;
  fields.innerHTML = renderThresholdsHtml(targetStudio, {});
  // Status pills cycle Not started -> Working on it -> Done (local for now;
  // durable per-threshold tracking is the next phase).
  const LABELS = { not_started: 'Not started', working: 'Working on it', done: 'Done' };
  const NEXT = { not_started: 'working', working: 'done', done: 'not_started' };
  fields.querySelectorAll('[data-threshold]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cur = ['not_started', 'working', 'done'].find((s) => btn.classList.contains('status-' + s)) || 'not_started';
      const next = NEXT[cur];
      btn.classList.remove('status-not_started', 'status-working', 'status-done');
      btn.classList.add('status-' + next);
      btn.textContent = LABELS[next];
    });
  });
  // Break a threshold into weekly steps -> tasks in North (learner-initiated, same
  // start-now / prep-for-Session-1 timing as goals). Closes the pitch pipeline:
  // pitch -> thresholds -> decompose -> weekly tasks in North. (Captain 2026-07-11.)
  fields.querySelectorAll('[data-threshold-plan]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!learner) return;
      const item = btn.closest('.threshold-item');
      const steps = [...item.querySelectorAll('.threshold-step-input')].map((i) => i.value.trim()).filter(Boolean);
      if (!steps.length) return;
      const mode = item.querySelector('input[type="radio"]:checked')?.value || 'now';
      btn.disabled = true;
      try {
        await addThresholdStepsToNorth(learner, targetStudio, steps, mode);
        btn.textContent = 'Added to your North ✓';
      } catch (e) { btn.disabled = false; }
    });
  });
  // Reuse the goal-modal shell; hide its default Save action.
  const da = document.querySelector('#goal-form .modal-actions');
  if (da) da.style.display = 'none';
  openModal();
}

// Schedule threshold baby-steps as dated tasks in North. 'now' = consecutive
// weeks from this week; 'session1' = consecutive weeks from the school year start.
async function addThresholdStepsToNorth(learner, targetStudio, steps, mode) {
  const { saveTask } = await import('./store.js');
  const { getCalendarForStudio } = await import('./studios.js');
  const cal = getCalendarForStudio(learner.studio);
  const toISO = (d) => d.toISOString().slice(0, 10);
  let base;
  if (mode === 'session1' && cal.sessionStarts?.[0]) {
    base = new Date(cal.sessionStarts[0] + 'T00:00:00');
  } else {
    const t = new Date();
    const day = t.getDay();
    base = new Date(t);
    base.setDate(t.getDate() + (day === 0 ? -6 : 1 - day));
  }
  for (let i = 0; i < steps.length; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i * 7);
    await saveTask(learner.id, { text: steps[i], plannedFor: toISO(d), categoryId: 'pitch_' + targetStudio });
  }
}

function setModalTitle(text) {
  document.getElementById('modal-title').textContent = text;
}

function openModal() {
  document.getElementById('modal')?.classList.add('active');
}

function closeModal() {
  setModalGated(false);
  document.getElementById('modal')?.classList.remove('active');
  activeSubmit = null;
  // Fire onClose hook (e.g. admin re-render after temp-pwd modal) regardless of
  // whether the user clicked the OK button or the X. Snapshot + clear first so
  // a re-entrant openModal call in the callback can set a new onClose.
  const cb = activeOnClose;
  activeOnClose = null;
  if (cb) {
    try { cb(); } catch (e) { console.error('modal onClose failed', e); }
  }
  // Restore default form actions for the next modal that needs them.
  const defaultActions = document.querySelector('#goal-form .modal-actions');
  if (defaultActions) defaultActions.style.display = '';
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
