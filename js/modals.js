// Shared modal logic. Goal authoring, quote setting, traits, logins, first-run onboarding.

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

// Helper - format the date range for a given session-week (Mon-Fri).
// Used in the weekly-breakdown stages (6-8) and the review (9).
async function weekDateLabel(sessionIndex, weekIndex) {
  const { YEAR_CALENDAR } = await import('./studios.js');
  const sessionStart = YEAR_CALENDAR.sessionStarts[sessionIndex - 1];
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
//   Stage 1: EOS 6 - end goal (where you want to be by end of Session 6)
//   Stage 2: Baseline - where you are now
//   Stage 3: EOS 3 - midpoint (locked after save; the accountability anchor)
//   Stage 4: EOS 2 - milestone between baseline and EOS 3
//   Stage 5: EOS 1 - setting up + quick wins (foundation by end of Session 1)
//
// The endpoint card at the top of each stage "promotes" to show the
// most recent committed milestone as the working destination:
//   Stages 1-3: endpoint = EOS 6 (year goal)
//   Stage 4:    endpoint = EOS 3 (Session 3 midpoint)
//   Stage 5:    endpoint = EOS 2 (Session 2 milestone)
//
// On save, seeds Session 1, 2, 3 goals automatically with EOS 1, 2, 3
// respectively. Each tagged autoPopulated=true so learner-edited
// session goals are preserved on re-save.
export async function openYearGoalModal({ category, existing, onSave, isFirstTime }) {
  setModalTitle(`${category.name} - year goal`);
  // Pre-compute date labels for the weekly inputs
  const s1Dates = await Promise.all([1,2,3,4].map(w => weekDateLabel(1, w)));
  const s2Dates = await Promise.all([1,2,3,4,5].map(w => weekDateLabel(2, w)));
  const s3Dates = await Promise.all([1,2,3].map(w => weekDateLabel(3, w)));
  const existingS1 = existing?.weeklySteps?.[1] || [];
  const existingS2 = existing?.weeklySteps?.[2] || [];
  const existingS3 = existing?.weeklySteps?.[3] || [];
  const fields = document.getElementById('form-fields');
  const weeklyRow = (sessionIndex, week, dateLabel, value, max) =>
    `<div class="week-row">
       <span class="week-row-label">S${sessionIndex} W${week} <span class="week-row-date">${escapeHtml(dateLabel)}</span></span>
       <input type="text" class="week-row-input" data-session="${sessionIndex}" data-week="${week}" placeholder="One step for this week" value="${value ? escapeAttr(value) : ''}">
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
        <span class="endpoint-label">Year goal · end of Session 6 (EOS 6)</span>
        <span class="endpoint-placeholder">…</span>
      </div>
      <div class="form-field">
        <label for="yg-text">Stage 1 · EOS 6 — Your year goal</label>
        <p class="form-hint">What does success look like by the end of Session 6? Make it specific. Make it real.</p>
        <p class="form-hint-secondary">A complete answer might include: what "finished" looks like, a number or threshold you can point to, and why it matters to you.</p>
        <textarea id="yg-text" rows="5" data-autogrow placeholder="Write your year-end vision here…">${existing?.text ? escapeAttr(existing.text) : ''}</textarea>
      </div>
      ${category.example ? `<div class="form-example"><span class="form-example-label">Example</span><p>${escapeHtml(category.example)}</p></div>` : ''}
      <div class="stage-actions">
        <button type="button" class="btn btn-primary" data-action="next">Next</button>
      </div>
    </div>

    <div class="stage-panel" data-stage="2" hidden>
      <div class="endpoint-card">
        <span class="endpoint-label">EOS 6 — Year goal</span>
        <span class="endpoint-value" id="endpoint-1"></span>
      </div>
      <div class="form-field">
        <label for="yg-baseline">Stage 2 · Baseline — Where you are now</label>
        <p class="form-hint">The honest starting line. Your partner will see this for context.</p>
        <p class="form-hint-secondary">A complete answer might include: what you can already do today, what's hard, and what you've tried before.</p>
        <textarea id="yg-baseline" rows="5" data-autogrow placeholder="Write the honest truth about where you're starting…">${existing?.baseline ? escapeAttr(existing.baseline) : ''}</textarea>
      </div>
      <div class="stage-actions">
        <button type="button" class="btn btn-text" data-action="back">Back</button>
        <button type="button" class="btn btn-primary" data-action="next">Next</button>
      </div>
    </div>

    <div class="stage-panel" data-stage="3" hidden>
      <div class="endpoint-card">
        <span class="endpoint-label">EOS 6 — Year goal</span>
        <span class="endpoint-value" id="endpoint-2"></span>
      </div>
      <div class="form-field">
        <label for="yg-halfway">Stage 3 · EOS 3 — The midpoint (this becomes locked)</label>
        <p class="form-hint">What will be true by the end of Session 3? This is the commitment anchor — once saved, your partner approves it and it cannot be edited until you replan in the second half. It becomes your Session 3 goal automatically.</p>
        <p class="form-hint-secondary">A complete answer might include: the visible halfway marker, what your partner would see is true, and something you could demonstrate or show.</p>
        <textarea id="yg-halfway" rows="5" data-autogrow placeholder="Write the midpoint commitment you're willing to lock in…">${existing?.halfwayPoint ? escapeAttr(existing.halfwayPoint) : ''}</textarea>
      </div>
      <div class="stage-actions">
        <button type="button" class="btn btn-text" data-action="back">Back</button>
        <button type="button" class="btn btn-primary" data-action="next">Next</button>
      </div>
    </div>

    <div class="stage-panel" data-stage="4" hidden>
      <div class="endpoint-card endpoint-card-promoted">
        <span class="endpoint-label">EOS 3 — Now your destination</span>
        <span class="endpoint-value" id="endpoint-3"></span>
      </div>
      <div class="form-field">
        <label for="yg-quarter">Stage 4 · EOS 2 — Halfway to your Session 3 goal</label>
        <p class="form-hint">What will be true by the end of Session 2? This becomes your Session 2 goal automatically.</p>
        <p class="form-hint-secondary">A complete answer might include: a smaller milestone between today and Session 3, something you can verify by yourself, and an honest read on the pace.</p>
        <textarea id="yg-quarter" rows="5" data-autogrow placeholder="Write the Session 2 checkpoint…">${existing?.quarterPoint ? escapeAttr(existing.quarterPoint) : ''}</textarea>
      </div>
      <div class="stage-actions">
        <button type="button" class="btn btn-text" data-action="back">Back</button>
        <button type="button" class="btn btn-primary" data-action="next">Next</button>
      </div>
    </div>

    <div class="stage-panel" data-stage="5" hidden>
      <div class="endpoint-card endpoint-card-promoted">
        <span class="endpoint-label">EOS 2 — Now your foundation builds toward</span>
        <span class="endpoint-value" id="endpoint-4"></span>
      </div>
      <div class="form-field">
        <label for="yg-eos1">Stage 5 · EOS 1 — Setting up + quick wins</label>
        <p class="form-hint">What's the marker that proves you've <strong>started</strong>? Achievable in Session 1's four weeks. Foundation, not finish line.</p>
        <p class="form-hint-secondary">A complete answer might include: the rhythm you've established, the foundation that proves you're on the path, and one small win you can point to.</p>
        <textarea id="yg-eos1" rows="5" data-autogrow placeholder="Write the Session 1 foundation marker…">${existing?.eos1Point ? escapeAttr(existing.eos1Point) : ''}</textarea>
      </div>
      <div class="stage-actions">
        <button type="button" class="btn btn-text" data-action="back">Back</button>
        <button type="button" class="btn btn-primary" data-action="next">Next — break it down</button>
      </div>
    </div>

    <div class="stage-panel" data-stage="6" hidden>
      <div class="continuity-cards">
        <div class="continuity-card continuity-from">
          <span class="continuity-label">Starting from</span>
          <span class="continuity-value" id="starting-from-s1"></span>
        </div>
        <div class="endpoint-card endpoint-card-promoted">
          <span class="endpoint-label">Session 1 leads to EOS 1</span>
          <span class="endpoint-value" id="endpoint-5"></span>
        </div>
      </div>
      <div class="form-field">
        <label>Stage 6 · Session 1 — 4 weeks, one step per week</label>
        <p class="form-hint">Session 1 has four weeks (Aug 17 - Sept 11). How do you break your work into one step per week, building toward EOS 1?</p>
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
          <span class="endpoint-label">Session 2 leads to EOS 2</span>
          <span class="endpoint-value" id="endpoint-6"></span>
        </div>
      </div>
      <div class="form-field">
        <label>Stage 7 · Session 2 — 5 weeks</label>
        <p class="form-hint">Picking up from end of Session 1, how do you get to EOS 2 in 5 weekly steps?</p>
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
          <span class="endpoint-label">Session 3 leads to EOS 3 (locked)</span>
          <span class="endpoint-value" id="endpoint-7"></span>
        </div>
      </div>
      <div class="form-field">
        <label>Stage 8 · Session 3 — only 3 weeks</label>
        <p class="form-hint">The final stretch to your locked EOS 3. Only 3 weeks. If this feels tight, the next screen lets you rebalance back into Sessions 1 or 2.</p>
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
        <p class="form-hint">Your full plan to EOS 3 is below. Everything is editable <strong>except EOS 3</strong> (your commitment anchor). If Session 3 feels heavy, move work into Sessions 1 or 2. Save when it feels honest.</p>
      </div>
      <div id="review-surface" class="review-surface"></div>
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
    setText('endpoint-3', eos3, '(set your EOS 3 midpoint)');
    setText('endpoint-4', eos2, '(set your EOS 2 milestone)');
    setText('endpoint-5', eos1, '(set EOS 1 first)');
    setText('endpoint-6', eos2, '(set EOS 2 first)');
    setText('endpoint-7', eos3, '(set EOS 3 first)');

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
        <span class="review-section-label">EOS 6 — Year goal</span>
        <input type="text" id="review-text" class="review-milestone-input" value="${escapeAttr(v.text)}">
      </div>
      <div class="review-section">
        <span class="review-section-label">Baseline</span>
        <input type="text" id="review-baseline" class="review-milestone-input" value="${escapeAttr(v.baseline)}">
      </div>
      <div class="review-section review-locked">
        <span class="review-section-label">EOS 3 — Midpoint · LOCKED</span>
        <input type="text" class="review-milestone-input" value="${escapeAttr(v.halfwayPoint)}" disabled>
        <p class="review-locked-note">This is the commitment your partner approves. Edit only at end of Session 3.</p>
      </div>
      <div class="review-section">
        <span class="review-section-label">EOS 2 — Session 2 milestone</span>
        <input type="text" id="review-quarter" class="review-milestone-input" value="${escapeAttr(v.quarterPoint)}">
      </div>
      <div class="review-section">
        <span class="review-section-label">EOS 1 — Quick wins (end of Session 1)</span>
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
        const halfwayPoint = v.halfwayPoint; // EOS 3 is locked - never read from review surface
        const quarterPoint = reviewQuarter || v.quarterPoint;
        const eos1Point = reviewEos1 || v.eos1Point;
        if (!text || !halfwayPoint) return;
        onSave({ text, baseline, halfwayPoint, quarterPoint, eos1Point, weeklySteps });
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

export function openConfirmModal({ title, body, confirmLabel = 'Yes', cancelLabel = 'Cancel', onConfirm, onCancel }) {
  setModalTitle(title);
  document.getElementById('form-fields').innerHTML = `
    <p style="color: var(--text); line-height: 1.6; margin: 0 0 1rem;">${escapeHtml(body)}</p>
    <div class="confirm-actions">
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
  // Confirm has no form-submit path; null out activeSubmit so Enter doesn't fire.
  activeSubmit = null;
  openModal();
}

export function openOnboardingModal({ role = 'learner', onComplete }) {
  setModalTitle(role === 'guide' ? 'Welcome, guide' : 'Welcome to your compass');
  const opener = role === 'guide'
    ? `Before you walk alongside learners this year, a moment for yourself. Your own anchor matters too.`
    : `This is the start of your year. Two small things to set first - a quote you can carry, and the traits you're growing into.`;
  document.getElementById('form-fields').innerHTML = `
    <p style="color: var(--text); line-height: 1.6; margin: 0 0 1.25rem;">
      ${escapeHtml(opener)}
    </p>
    <p style="color: var(--text-muted); line-height: 1.5; margin: 0 0 1.25rem; font-size: 0.9rem;">
      You can change either anytime, but most ${role === 'guide' ? 'guides' : 'learners'} keep theirs until the year is done.
    </p>
    <div class="form-field">
      <label for="onb-quote">Your motivational quote for the year</label>
      <textarea id="onb-quote" rows="3" placeholder="A line that carries you when things get hard."></textarea>
    </div>
    <div class="form-field">
      <label for="onb-traits">Character traits you're anchoring on (3-5, separated by commas)</label>
      <input type="text" id="onb-traits" placeholder="courage, kindness, persistence">
    </div>
  `;
  activeSubmit = () => {
    const quote = document.getElementById('onb-quote').value.trim();
    const traitsRaw = document.getElementById('onb-traits').value;
    const traits = traitsRaw.split(',').map((t) => t.trim()).filter(Boolean);
    onComplete({ quote, traits });
    closeModal();
  };
  openModal();
  setTimeout(() => document.getElementById('onb-quote')?.focus(), 50);
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
