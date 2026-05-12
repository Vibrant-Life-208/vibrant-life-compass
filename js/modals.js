// Shared modal logic. Goal authoring, quote setting, traits, logins, first-run onboarding.

let activeSubmit = null;

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

// 4-stage year-goal modal with recursive halving.
// Per captain refinement 2026-05-11:
//   Stage 1: year goal (target = end of Session 6)
//   Stage 2: baseline - where you are now
//   Stage 3: halfway of year goal -> auto-populates Session 3 goal
//   Stage 4: halfway of THAT halfway -> auto-populates Session 2 goal
// At stage 4, the Session 3 goal moves into the "endpoint" position
// visually so the halving is clear.
export function openYearGoalModal({ category, existing, onSave }) {
  setModalTitle(`${category.name} - year goal`);
  const fields = document.getElementById('form-fields');
  fields.innerHTML = `
    <div class="onb-stages">
      <span class="stage-dot is-active" data-stage="1">1</span>
      <span class="stage-dot" data-stage="2">2</span>
      <span class="stage-dot" data-stage="3">3</span>
      <span class="stage-dot" data-stage="4">4</span>
    </div>

    <div class="stage-panel" data-stage="1">
      <div class="endpoint-card">
        <span class="endpoint-label">Year goal · end of Session 6</span>
        <span class="endpoint-placeholder">…</span>
      </div>
      <div class="form-field">
        <label for="yg-text">Stage 1 - Your year goal</label>
        <p class="form-hint">What does success look like by Session 6? Make it specific. Make it real.</p>
        <textarea id="yg-text" rows="3" placeholder="What does success look like?">${existing?.text ? escapeAttr(existing.text) : ''}</textarea>
      </div>
      ${category.example ? `<div class="form-example"><span class="form-example-label">Example</span><p>${escapeHtml(category.example)}</p></div>` : ''}
      <div class="stage-actions">
        <button type="button" class="btn btn-primary" data-action="next">Next</button>
      </div>
    </div>

    <div class="stage-panel" data-stage="2" hidden>
      <div class="endpoint-card">
        <span class="endpoint-label">Year goal · end of Session 6</span>
        <span class="endpoint-value" id="endpoint-1"></span>
      </div>
      <div class="form-field">
        <label for="yg-baseline">Stage 2 - Where you are now</label>
        <p class="form-hint">The honest starting line. Your partner will see this for context.</p>
        <textarea id="yg-baseline" rows="3" placeholder="What's true today about this goal?">${existing?.baseline ? escapeAttr(existing.baseline) : ''}</textarea>
      </div>
      <div class="stage-actions">
        <button type="button" class="btn btn-text" data-action="back">Back</button>
        <button type="button" class="btn btn-primary" data-action="next">Next</button>
      </div>
    </div>

    <div class="stage-panel" data-stage="3" hidden>
      <div class="endpoint-card">
        <span class="endpoint-label">Year goal · end of Session 6</span>
        <span class="endpoint-value" id="endpoint-2"></span>
      </div>
      <div class="form-field">
        <label for="yg-halfway">Stage 3 - The halfway point</label>
        <p class="form-hint">What will be true by the end of Session 3? This becomes your Session 3 goal automatically.</p>
        <textarea id="yg-halfway" rows="3" placeholder="What does the midpoint look like?">${existing?.halfwayPoint ? escapeAttr(existing.halfwayPoint) : ''}</textarea>
      </div>
      <div class="stage-actions">
        <button type="button" class="btn btn-text" data-action="back">Back</button>
        <button type="button" class="btn btn-primary" data-action="next">Next</button>
      </div>
    </div>

    <div class="stage-panel" data-stage="4" hidden>
      <div class="endpoint-card endpoint-card-promoted">
        <span class="endpoint-label">Now your destination · end of Session 3</span>
        <span class="endpoint-value" id="endpoint-3"></span>
      </div>
      <div class="form-field">
        <label for="yg-quarter">Stage 4 - The halfway to your Session 3 goal</label>
        <p class="form-hint">What will be true by the end of Session 2? This becomes your Session 2 goal automatically.</p>
        <textarea id="yg-quarter" rows="3" placeholder="What does the early checkpoint look like?">${existing?.quarterPoint ? escapeAttr(existing.quarterPoint) : ''}</textarea>
      </div>
      <div class="stage-actions">
        <button type="button" class="btn btn-text" data-action="back">Back</button>
        <button type="button" class="btn btn-primary" data-action="save">Save year goal</button>
      </div>
    </div>
  `;

  const updateEndpoints = () => {
    const yearGoal = document.getElementById('yg-text')?.value.trim() || existing?.text || '';
    const halfway = document.getElementById('yg-halfway')?.value.trim() || existing?.halfwayPoint || '';
    const e1 = document.getElementById('endpoint-1');
    const e2 = document.getElementById('endpoint-2');
    const e3 = document.getElementById('endpoint-3');
    if (e1) e1.textContent = yearGoal || '(set your year goal)';
    if (e2) e2.textContent = yearGoal || '(set your year goal)';
    if (e3) e3.textContent = halfway || '(set your halfway point)';
  };

  const showStage = (n) => {
    fields.querySelectorAll('.stage-dot').forEach((d) => {
      d.classList.toggle('is-active', Number(d.dataset.stage) <= n);
    });
    fields.querySelectorAll('.stage-panel').forEach((p) => {
      p.hidden = Number(p.dataset.stage) !== n;
    });
    updateEndpoints();
    const focusEl = fields.querySelector(`.stage-panel[data-stage="${n}"] textarea`);
    focusEl?.focus();
  };

  fields.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const stage = Number(btn.closest('.stage-panel').dataset.stage);
      if (action === 'next') {
        const ta = fields.querySelector(`.stage-panel[data-stage="${stage}"] textarea`);
        if (!ta.value.trim()) { ta.focus(); return; }
        showStage(stage + 1);
      } else if (action === 'back') {
        showStage(stage - 1);
      } else if (action === 'save') {
        const text = document.getElementById('yg-text').value.trim();
        const baseline = document.getElementById('yg-baseline').value.trim();
        const halfwayPoint = document.getElementById('yg-halfway').value.trim();
        const quarterPoint = document.getElementById('yg-quarter').value.trim();
        if (!text || !halfwayPoint) return;
        onSave({ text, baseline, halfwayPoint, quarterPoint });
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
