// "Make your first task" demo (captain 2026-07-21) - the hand-holding path for a learner new to
// their tribe (isNewToTribe, gated by the caller). It teaches the task-creation mechanic by making
// a REAL, kept task - a reading rhythm - not a throwaway. Scaffold-and-fade: shows the skill once,
// then disappears (firstTaskDemoSeen). Skippable at every step. No tutorial badge, no reward, no
// streak - it ends with the learner's own task and the knowledge that they can make one for anything.

import { saveTask, saveLearner } from './store.js';
import { addBook, getBooks } from './books.js';

export function openFirstTaskDemo(learner, learnerId, onDone) {
  if (document.querySelector('.first-task-demo-overlay')) return; // never stack two demos
  const existingBooks = getBooks(learner);
  const state = { bookId: existingBooks[0]?.id || '', title: '', minutes: '' };

  const overlay = document.createElement('div');
  overlay.className = 'first-task-demo-overlay';
  document.body.appendChild(overlay);

  async function finish() {
    // Mark seen whether they completed or opted out - the offer never nags twice.
    try { learner.firstTaskDemoSeen = true; await saveLearner({ id: learner.id, firstTaskDemoSeen: true }); } catch (e) { /* non-fatal */ }
    overlay.remove();
    if (onDone) await onDone();
  }

  function renderOffer() {
    overlay.innerHTML = panel(`
      <h3 class="ftd-title">Let's make your first task together</h3>
      <p class="ftd-body">A task is just a small thing you want to do. We'll make one for reading - it takes a moment, and it's yours to keep.</p>
      <div class="ftd-actions">
        <button type="button" class="btn btn-primary" id="ftd-go">Let's make one</button>
        <button type="button" class="btn btn-text" id="ftd-skip">I'll do it myself</button>
      </div>
    `);
    overlay.querySelector('#ftd-go').addEventListener('click', renderBook);
    overlay.querySelector('#ftd-skip').addEventListener('click', finish);
  }

  function renderBook() {
    const body = existingBooks.length
      ? `<p class="ftd-body">Pick a book from your shelf, or add a new one.</p>
         <select id="ftd-pick" class="slice-box">
           ${existingBooks.map((b) => `<option value="${escapeAttr(b.id)}">${escapeHtml(b.title)}</option>`).join('')}
           <option value="__new">+ a different book</option>
         </select>
         <input type="text" id="ftd-new" class="slice-box" placeholder="A book you're reading" style="display:none">`
      : `<p class="ftd-body">What are you reading right now?</p>
         <input type="text" id="ftd-new" class="slice-box" placeholder="A book you're reading">`;
    overlay.innerHTML = panel(`
      <h3 class="ftd-title">Step 1 - what's it about?</h3>
      ${body}
      <div class="ftd-actions">
        <button type="button" class="btn btn-primary" id="ftd-next">Next</button>
        <button type="button" class="btn btn-text" id="ftd-skip">Skip</button>
      </div>
    `);
    const pick = overlay.querySelector('#ftd-pick');
    const newInput = overlay.querySelector('#ftd-new');
    if (pick) pick.addEventListener('change', () => { newInput.style.display = pick.value === '__new' ? '' : 'none'; });
    overlay.querySelector('#ftd-next').addEventListener('click', () => {
      if (pick && pick.value !== '__new') { state.bookId = pick.value; state.title = ''; }
      else { state.title = (newInput?.value || '').trim(); state.bookId = ''; }
      if (!state.bookId && !state.title) return; // need a book to point at
      renderTimer();
    });
    overlay.querySelector('#ftd-skip').addEventListener('click', finish);
  }

  function renderTimer() {
    overlay.innerHTML = panel(`
      <h3 class="ftd-title">Step 2 - a rhythm you come back to</h3>
      <p class="ftd-body">Reading is something you return to, not something you finish once - so there's no checkbox and no streak. Want a gentle timer for when you read? You can skip it.</p>
      <input type="number" id="ftd-min" class="slice-box" min="1" max="120" placeholder="minutes, e.g. 20">
      <div class="ftd-actions">
        <button type="button" class="btn btn-primary" id="ftd-next">Next</button>
        <button type="button" class="btn btn-text" id="ftd-skip">Skip the timer</button>
      </div>
    `);
    overlay.querySelector('#ftd-next').addEventListener('click', () => { state.minutes = overlay.querySelector('#ftd-min')?.value || ''; renderCreate(); });
    overlay.querySelector('#ftd-skip').addEventListener('click', () => { state.minutes = ''; renderCreate(); });
  }

  async function renderCreate() {
    let bookId = state.bookId;
    if (!bookId && state.title) {
      try {
        learner.books = await addBook(learner, state.title);
        bookId = (learner.books.find((b) => b.title === state.title) || {}).id || '';
      } catch (e) { /* non-fatal - the task still lands */ }
    }
    const title = state.title || (existingBooks.find((b) => b.id === bookId) || {}).title || 'my book';
    const mins = parseInt(state.minutes, 10);
    try {
      await saveTask(learnerId, {
        text: `Read - ${title}`,
        plannedFor: new Date().toISOString().slice(0, 10),
        band: 'recurring', shape: 'rhythm',
        timerMinutes: mins > 0 ? mins : undefined,
        bookId: bookId || undefined,
      });
    } catch (e) { /* non-fatal */ }
    overlay.innerHTML = panel(`
      <h3 class="ftd-title">You made a task</h3>
      <p class="ftd-body">It's on your Today now, with a rhythm mark - come back to it whenever, and resting is always fine. You can make a task for anything now, the same way.</p>
      <div class="ftd-actions">
        <button type="button" class="btn btn-primary" id="ftd-done">Done</button>
      </div>
    `);
    overlay.querySelector('#ftd-done').addEventListener('click', finish);
  }

  renderOffer();
}

function panel(inner) {
  return `<div class="first-task-demo-panel">${inner}</div>`;
}
function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, '&#39;');
}
