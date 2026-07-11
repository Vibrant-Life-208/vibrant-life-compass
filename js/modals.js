// Shared modal logic. Goal authoring, quote setting, traits, logins, first-run onboarding.

import {
  getValuesLexicon, getViaCharacterStrengths,
  getProfileValues, setProfileValues, getProfileStrengths, setProfileStrengths,
  getProfileHorizons, setProfileHorizon,
  getOnboardingState, setOnboardingStep, markOnboardingStepSkipped, completeOnboarding,
  setQuoteAnchor, setStrengthRanking, setValuesFreetext, getValuesFreetext,
  saveLearner,
} from './store.js';
import { parseViaPdf } from './via-import.js';
import { nextStudio, pitchCutoff, getStudioName } from './studios.js';
import { lifeWheelSvgFor } from './wheel.js';

let activeSubmit = null;
let activeOnClose = null;

export function initModal() {
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal') closeModal();
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
  const s1Dates = await Promise.all([1,2,3,4].map(w => weekDateLabel(1, w, studio)));
  const s2Dates = await Promise.all([1,2,3,4,5].map(w => weekDateLabel(2, w, studio)));
  const s3Dates = await Promise.all([1,2,3].map(w => weekDateLabel(3, w, studio)));
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
        <label>Stage 6 · Session 1 — 4 weeks, one small step per week</label>
        <p class="form-hint">Session 1 has four weeks (Aug 17 - Sept 11). Break it into one <strong>small</strong> step per week toward End of Session 1 - start small in Week 1 and build from there. Phrase each as a when-then: <em>"On Tuesday after breakfast, I'll do 10 minutes."</em> Every week is optional; a missed one is information, not failure.</p>
        <div class="week-rows">
          ${weeklyRow(1, 1, s1Dates[0], existingS1[0])}
          ${weeklyRow(1, 2, s1Dates[1], existingS1[1])}
          ${weeklyRow(1, 3, s1Dates[2], existingS1[2])}
          ${weeklyRow(1, 4, s1Dates[3], existingS1[3])}
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
        <label>Stage 7 · Session 2 — 5 weeks</label>
        <p class="form-hint">Picking up from end of Session 1, how do you get to End of Session 2 in 5 weekly steps?</p>
        <div class="week-rows">
          ${weeklyRow(2, 1, s2Dates[0], existingS2[0])}
          ${weeklyRow(2, 2, s2Dates[1], existingS2[1])}
          ${weeklyRow(2, 3, s2Dates[2], existingS2[2])}
          ${weeklyRow(2, 4, s2Dates[3], existingS2[3])}
          ${weeklyRow(2, 5, s2Dates[4], existingS2[4])}
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
        <label>Stage 8 · Session 3 — only 3 weeks</label>
        <p class="form-hint">The final stretch to your locked End of Session 3. Only 3 weeks. If this feels tight, the next screen lets you rebalance back into Sessions 1 or 2.</p>
        <div class="week-rows">
          ${weeklyRow(3, 1, s3Dates[0], existingS3[0])}
          ${weeklyRow(3, 2, s3Dates[1], existingS3[1])}
          ${weeklyRow(3, 3, s3Dates[2], existingS3[2])}
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
      <label class="review-tonorth">
        <input type="checkbox" id="yg-add-to-north">
        Add my weekly steps to my North, so they show up as tasks on their week.
      </label>
      <div class="stage-actions">
        <button type="button" class="btn btn-text" data-action="back">Back</button>
        <button type="button" class="btn btn-primary" data-action="save">Save full plan</button>
      </div>
    </div>
  `;

  const collectWeeklySteps = () => ({
    1: [1,2,3,4].map(w => fields.querySelector(`input[data-session="1"][data-week="${w}"]`)?.value.trim() || ''),
    2: [1,2,3,4,5].map(w => fields.querySelector(`input[data-session="2"][data-week="${w}"]`)?.value.trim() || ''),
    3: [1,2,3].map(w => fields.querySelector(`input[data-session="3"][data-week="${w}"]`)?.value.trim() || ''),
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
    const s1LastWeek = v.weeklySteps?.[1]?.[3] || '';
    const s2LastWeek = v.weeklySteps?.[2]?.[4] || '';
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
        <span class="review-section-label">Session 1 — 4 weeks</span>
        ${s1Dates.map((d, i) => rowHtml(1, i + 1, d, v.weeklySteps[1][i])).join('')}
      </div>
      <div class="review-section">
        <span class="review-section-label">Session 2 — 5 weeks</span>
        ${s2Dates.map((d, i) => rowHtml(2, i + 1, d, v.weeklySteps[2][i])).join('')}
      </div>
      <div class="review-section review-section-tight">
        <span class="review-section-label">Session 3 — 3 weeks (tight)</span>
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
        const addToNorth = !!document.getElementById('yg-add-to-north')?.checked;
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
// Developmental gating (Decision 5): the long-horizon steps are dropped for the
// youngest studios. NOTE: the young-tier copy + age-tier VIA/Values labels are
// NOT yet built (reference tables hold display_label_adult only). The
// near-horizon set is the mechanism; Sparks/Discovery learners must not be
// onboarded until the age-tier register lands.
//
// onComplete is called once the cascade is walked; per-step saving already
// happened, so it only routes the user into the app.

// External assessment links (Decision 8: measured link-out). Both confirmed
// against live sources 2026-06-22. The VIA site routes to the age-appropriate
// survey after registration (Adult; Youth ages 8-17), so one entry URL covers
// all tiers. An empty URL would render the entry grid without a link-out (graceful
// fallback), but both are populated.
const VIA_SURVEY_URL = 'https://www.viacharacter.org/survey/account/register';
// values.institute - Brad Hook's "Start With Values": ~15 min, returns top-3
// values + a personalized action plan. Matches the captain's 6-15 spec.
const VALUES_ASSESSMENT_URL = 'https://values.institute/values-app/';

// The ordered cascade. The ids match the onboarding_step enum in the schema.
// The quote is handled separately by openQuoteFlow (its own front-of-line flow),
// not as a cascade step - so it can never be resumed-past.
const CASCADE_FULL = ['breath', 'strengths', 'values', 'beyond_5yr', 'within_5yr', 'within_1yr', 'current_state', 'halfway'];
// Youngest tiers (Decision 5): one near horizon only, no five-year telescope.
const CASCADE_NEAR = ['breath', 'strengths', 'values', 'within_1yr'];

// Telescoping prompts for the horizon steps (adult register).
const HORIZON_PROMPTS = {
  beyond_5yr: {
    heading: 'See yourself in 10 years.',
    body: 'Ten years from now - who have you become? What does your life look like? Let yourself imagine. There is no wrong answer.',
    placeholder: 'In ten years...',
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
    body: 'Honestly - where are you today? This is the mirror, not the dream. You can stop here anytime; this step is yours to take at your pace.',
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

export async function openOnboardingModal({ profileId = null, role = 'learner', studio = null, onComplete }) {
  const steps = [...((studio === 'sparks' || studio === 'discovery') ? CASCADE_NEAR : CASCADE_FULL)];
  // Pitch-readiness step (learners with a studio above them): a yes/no age
  // self-report + opt-in, inserted right before the 1-year horizon. It is NOT in
  // the onboarding_step resume enum, so advance()/back() never persist it as the
  // resume pointer - its data lives on the learner row, so re-showing on resume
  // is idempotent. (Captain design 2026-07-10.)
  const pitchTarget = role === 'learner' ? nextStudio(studio) : null;
  if (pitchTarget) {
    const at = steps.indexOf('within_1yr');
    if (at >= 0) steps.splice(at, 0, 'pitch');
  }
  // Adventure + Launch Pad learners, guides, and parents TYPE their values (free
  // text + archetype); Sparks + Discovery pick from the curated list.
  const typeValues = role !== 'learner' || studio === 'adventure' || studio === 'launchpad';

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
    // 'pitch' is not in the resume enum - don't persist it as the pointer.
    if (steps[state.idx] === 'pitch') state.pitchStage = 'ask-age';
    if (profileId && steps[state.idx] !== 'pitch') await setOnboardingStep(profileId, steps[state.idx]);
    render();
  }

  // "Not now" (Decision 2): record the skip as honored, then advance.
  async function skipStep() {
    const step = curStep();
    captureHorizon();
    captureValuesTyped();
    if (profileId && step !== 'breath') await markOnboardingStepSkipped(profileId, step);
    await advance(null);
  }

  function back() {
    if (state.idx === 0) return;
    captureHorizon();
    captureValuesTyped();
    state.idx -= 1;
    if (steps[state.idx] === 'pitch') state.pitchStage = 'ask-age';
    if (profileId && steps[state.idx] !== 'pitch') setOnboardingStep(profileId, steps[state.idx]);
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
    state.viaStrengths.forEach((s) => { labels[s.id] = s.display_label_adult; });
    const r = state.strengthResult;
    const preview = r
      ? `<div class="onb-via-found"><p class="onb-step-instruction">Got it - your top strengths:</p><ol class="via-preview-list">${r.top8.slice(0, 5).map((id) => `<li>${escapeHtml(labels[id] || id)}</li>`).join('')}</ol></div>`
      : '';
    const errored = state.strengthError ? `<p class="via-import-error">${escapeHtml(state.strengthError)}</p>` : '';
    return `
      <p class="onb-step-instruction">Your character strengths come from the free VIA Survey. Take it, download your results PDF, and drop it below - it's read on your device and never uploaded.</p>
      <p class="onb-linkout"><a href="${escapeAttr(VIA_SURVEY_URL)}" target="_blank" rel="noopener noreferrer">Take the free VIA Survey ↗</a><span class="onb-linkout-note">Opens in a new tab. Come back with your PDF.</span></p>
      <label class="via-drop" id="onb-via-drop">
        <input type="file" id="onb-via-file" accept="application/pdf" hidden>
        <span>Drop your VIA PDF here, or <strong>choose a file</strong></span>
      </label>
      ${preview}
      ${errored}
      ${navButtons({ skippable: true, continueLabel: isLast() ? 'Enter your Compass' : 'Continue', continueDisabled: !r })}
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
    const linkUrl = kind === 'value' ? VALUES_ASSESSMENT_URL : VIA_SURVEY_URL;
    const linkText = kind === 'value'
      ? 'Take the Values assessment'
      : 'Take the free VIA Survey';
    const linkBlock = linkUrl
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
    return `
      ${wheel}
      ${stack}
      <div class="onb-horizon-prompt">
        <h3 class="onb-horizon-heading">${escapeHtml(p.heading)}</h3>
        <p class="onb-horizon-body">${escapeHtml(p.body)}</p>
      </div>
      <div class="form-field">
        <textarea id="onb-horizon" rows="4" placeholder="${escapeAttr(p.placeholder)}">${escapeHtml(state.horizons[step] || '')}</textarea>
      </div>
      ${navButtons({ skippable: true, continueLabel: isLast() ? 'Enter your Compass' : 'Continue' })}
    `;
  }

  function render() {
    const formFields = document.getElementById('form-fields');
    const step = curStep();
    if (step === 'breath') formFields.innerHTML = renderBreath();
    else if (step === 'strengths') formFields.innerHTML = renderStrengthsUpload();
    else if (step === 'values') formFields.innerHTML = typeValues ? renderValuesType() : renderSelectStep({ kind: 'value', label: 'values' });
    else if (step === 'pitch') formFields.innerHTML = renderPitch();
    else formFields.innerHTML = renderHorizon(step);
    wireStep();
    if (HORIZON_PROMPTS[step]) setTimeout(() => document.getElementById('onb-horizon')?.focus(), 50);
  }

  function wireStep() {
    const step = curStep();

    document.getElementById('onb-back')?.addEventListener('click', back);
    document.getElementById('onb-skip')?.addEventListener('click', skipStep);

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
            state.pitchStage = 'confirmed';
            render();
          }
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
      } else {
        captureHorizon();
        const text = state.horizons[step] || '';
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
}

// Quote flow (2026-06-24): the quote anchors the top of the page for the cycle.
// Two teaching screens (why a quote, who inspires you) then one form (the quote,
// who said it, what it means to you). Its OWN front-of-line flow so it always runs
// from Begin when the quote is missing/stale - never resumed-past like a cascade
// step. Saves all three fields + stamps the cycle. If the person closes the modal
// without saving, it simply re-prompts next sign-in.
export function openQuoteFlow({ profileId = null, currentCycle = '', existing = {}, onComplete } = {}) {
  const SCREENS = ['why', 'inspires', 'form'];
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

  function renderWhy() {
    return `
      <div class="onb-horizon-prompt">
        <h3 class="onb-horizon-heading">Why a quote?</h3>
        <p class="onb-horizon-body">A single line, chosen on purpose, can carry you through a whole year. When the days get hard, it’s something to come back to - a bearing in words. The one you pick stays at the top of your page all year.</p>
      </div>
      <div class="onb-step-actions">
        <span></span>
        <div class="onb-step-actions-right">
          <button type="button" id="qf-next" class="btn btn-primary">Continue</button>
        </div>
      </div>
    `;
  }

  function renderInspires() {
    return `
      <div class="onb-horizon-prompt">
        <h3 class="onb-horizon-heading">Who inspires you?</h3>
        <p class="onb-horizon-body">Think of someone whose words have stayed with you - a writer, a teacher, someone you love, a voice from your faith or your family. What did they say that you carry? On the next screen, you’ll write it down.</p>
      </div>
      <div class="onb-step-actions">
        <button type="button" id="qf-back" class="btn btn-text">Back</button>
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
    if (screen === 'why') formFields.innerHTML = renderWhy();
    else if (screen === 'inspires') formFields.innerHTML = renderInspires();
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
}

function setModalTitle(text) {
  document.getElementById('modal-title').textContent = text;
}

function openModal() {
  document.getElementById('modal')?.classList.add('active');
}

function closeModal() {
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
