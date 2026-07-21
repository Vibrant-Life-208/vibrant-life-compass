// North view - the dashboard.

import { getLearner, getGoals, getQuoteState } from './store.js';
import { openViaImportModal } from './via-import.js';
import { getCategoriesForStudio } from './studios.js';
import { renderToday, initTodayFab } from './tasks.js';
import { renderGamePlan } from './game-plan.js';
import { getBooks, addBook, setBookmark, removeBook, MAX_BOOKS } from './books.js';
import { openPracticeTimer } from './practice-timer.js';
import { isNewToTribe } from './tribe-roster.js';
import { openFirstTaskDemo } from './first-task-demo.js';

// Year-map click handler is still needed (Compass page sets it).
let yearMapClickHandler = null;
export function setYearMapClickHandler(fn) { yearMapClickHandler = fn; }
export function getYearMapClickHandler() { return yearMapClickHandler; }

export async function renderNorth(learnerId) {
  const learner = await getLearner(learnerId);
  const greeting = document.getElementById('north-greeting-text');
  const dateLabel = document.getElementById('north-date');

  if (greeting) greeting.textContent = learner ? `North · ${learner.name}` : 'North';
  if (dateLabel) dateLabel.textContent = formatToday();

  // Pitch card. Two states, shown to EVERY eligible learner (not just onboarding):
  //   - opted in  -> a card to their thresholds page.
  //   - not yet   -> an invitation to explore pitching up (opens the opt-in).
  // Only learners with a studio above them (Discovery, Adventure) are eligible.
  const pitchSection = document.getElementById('north-pitch');
  const pitchBtn = document.getElementById('north-pitch-open');
  if (pitchSection && pitchBtn && learner) {
    const { getStudioName, nextStudio } = await import('./studios.js');
    const up = nextStudio(learner.studio);
    if (learner.pitchTargetStudio) {
      const targetName = getStudioName(learner.pitchTargetStudio);
      const status = learner.pitchAgeStatus;
      pitchSection.hidden = false;
      if (status === 'denied') {
        // The guide felt this isn't the year to pitch. Gently point the learner back
        // at this year's goals rather than the thresholds.
        pitchBtn.textContent = `Not this year - and that's okay. Let's make this year count where you are.`;
        pitchBtn.onclick = () => document.querySelector('[data-tab="year-view"]')?.click();
      } else {
        // Pending (guide not yet confirmed) still works the thresholds; approved is the
        // confirmed state. Only the label changes.
        const suffix = status === 'pending' ? ' - waiting for your guide to confirm' : ' - see your thresholds';
        pitchBtn.textContent = `Your pitch to ${targetName}${suffix}`;
        pitchBtn.onclick = async () => {
          const { openThresholdsModal } = await import('./modals.js');
          openThresholdsModal(learner.pitchTargetStudio, learner);
        };
      }
    } else if (up) {
      pitchBtn.textContent = `Thinking about ${getStudioName(up)}? Explore pitching up`;
      pitchSection.hidden = false;
      pitchBtn.onclick = async () => {
        const { openPitchOptInModal } = await import('./modals.js');
        openPitchOptInModal(learner, () => renderNorth(learnerId));
      };
    } else {
      pitchSection.hidden = true;
    }
  } else if (pitchSection) {
    pitchSection.hidden = true;
  }

  await Promise.all([
    renderQuoteSection(learnerId),
    renderToday(learnerId),
    renderGamePlan(learnerId),
    renderVision(learnerId, learner),
    renderReading(learnerId, learner),
  ]);

  initTodayFab(learnerId);

  // Hand-holding path: offer the make-a-task demo once to a learner new to their tribe. It makes a
  // real, kept reading task and then fades (firstTaskDemoSeen). Returning learners never see it.
  if (learner && isNewToTribe(learner) && !learner.firstTaskDemoSeen) {
    openFirstTaskDemo(learner, learnerId, () => renderNorth(learnerId));
  }

  const importBtn = document.getElementById('north-import-strengths');
  if (importBtn && !importBtn._wired) {
    importBtn._wired = true;
    importBtn.addEventListener('click', () => {
      openViaImportModal({ profileId: learnerId, onSaved: () => renderNorth(learnerId) });
    });
  }

  if (!document._hcTasksListener) {
    document._hcTasksListener = true;
    document.addEventListener('hc:tasks-changed', async () => {
      await renderToday(learnerId);
      await renderGamePlan(learnerId);
    });
  }
}

async function renderQuoteSection(learnerId) {
  const section = document.getElementById('north-quote-section');
  const text = document.getElementById('north-quote-text');
  const footer = document.getElementById('north-quote-footer');
  const noteEl = document.getElementById('north-quote-note');
  if (!section || !text) return;
  if (!learnerId) {
    section.style.display = 'none';
    return;
  }
  const { text: quote, author, note } = await getQuoteState(learnerId);
  if (!quote) {
    section.style.display = 'none';
    return;
  }
  section.style.display = 'block';
  text.textContent = `“${quote}”`;
  // Footer shows the attribution when present, falling back to the anchor label.
  if (footer) footer.textContent = author ? `— ${author}` : 'Your anchor for the cycle';
  // The note (what it means to you) shows beneath the quote when present.
  if (noteEl) {
    if (note) {
      noteEl.textContent = note;
      noteEl.hidden = false;
    } else {
      noteEl.textContent = '';
      noteEl.hidden = true;
    }
  }
}

// "Currently reading" shelf (captain 2026-07-21). Up to 3 books, free-text bookmark.
// No streak, no pace, no count - just the evolving "where are you now?". Always visible so
// it invites the first book even on an empty shelf.
async function renderReading(learnerId, learner) {
  const section = document.getElementById('north-reading');
  const list = document.getElementById('north-reading-list');
  if (!section || !list) return;
  if (!learner) { section.hidden = true; return; }
  section.hidden = false;
  const books = getBooks(learner);
  const cards = books.map((b) => `
    <div class="reading-book" data-book="${escapeHtml(b.id)}">
      <div class="reading-book-head">
        <span class="reading-book-title">${escapeHtml(b.title)}</span>
        <span class="reading-book-head-actions">
          <button type="button" class="btn btn-text reading-book-timer" data-book-timer="${escapeHtml(b.id)}">Read</button>
          <button type="button" class="btn btn-text reading-book-remove" data-book-remove="${escapeHtml(b.id)}">Remove</button>
        </span>
      </div>
      <label class="reading-book-mark-label">Where are you now?</label>
      <input type="text" class="reading-book-mark slice-box" data-book-mark="${escapeHtml(b.id)}" value="${escapeHtml(b.bookmark || '')}" placeholder="A page, a chapter, a moment - wherever you are">
    </div>
  `).join('');
  const adder = books.length < MAX_BOOKS
    ? `<div class="reading-add">
         <input type="text" id="reading-add-title" class="slice-box" placeholder="Add a book you're reading">
         <button type="button" id="reading-add-btn" class="btn btn-text">Add to my shelf</button>
       </div>`
    : `<p class="reading-full-hint">Your shelf is full at three. Finish or remove one to add another.</p>`;
  list.innerHTML = cards + adder;

  list.querySelectorAll('[data-book-remove]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      learner.books = await removeBook(learner, btn.dataset.bookRemove);
      await renderReading(learnerId, learner);
    });
  });
  list.querySelectorAll('[data-book-mark]').forEach((inp) => {
    inp.addEventListener('change', async () => {
      learner.books = await setBookmark(learner, inp.dataset.bookMark, inp.value);
    });
  });
  list.querySelectorAll('[data-book-timer]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const book = getBooks(learner).find((x) => x.id === btn.dataset.bookTimer);
      if (!book) return;
      // Learner-started timer -> soft/optional end -> skippable "where are you now?" -> bookmark.
      openPracticeTimer(book, async (mark) => {
        learner.books = await setBookmark(learner, book.id, mark);
        await renderReading(learnerId, learner);
      });
    });
  });
  const addBtn = document.getElementById('reading-add-btn');
  if (addBtn) {
    addBtn.addEventListener('click', async () => {
      const title = document.getElementById('reading-add-title')?.value || '';
      if (!title.trim()) return;
      learner.books = await addBook(learner, title);
      await renderReading(learnerId, learner);
    });
  }
}

function formatToday() {
  const d = new Date();
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

async function renderVision(learnerId, learner) {
  const el = document.getElementById('north-vision');
  if (!el) return;

  if (!learner) {
    el.innerHTML = '<p class="learners-empty">No learner profile yet.</p>';
    return;
  }

  const categories = getCategoriesForStudio(learner.studio);
  const allGoals = await getGoals(learnerId);
  const yearGoals = allGoals.filter((g) => g.scope === 'year');
  const priorityIds = Array.isArray(learner.priorityGoalIds) ? learner.priorityGoalIds : [];

  // Tasks-grouped-by-category, not a wall of blank category shells.
  // (Captain 2026-07-13.) The old grid listed every category with "Not yet set,"
  // which felt overwhelming during setup and offered no path to plan. Now only
  // categories that HAVE a goal show, each surfaced through its concrete steps -
  // the plan itself. Planning still happens in Setup's guided 9-stage walkthrough
  // (js/setup.js); this view shows its output. Nothing is set from here.
  const planned = categories
    .map((cat) => ({ cat, goal: yearGoals.find((g) => g.categoryId === cat.id) }))
    .filter((x) => x.goal);

  el.innerHTML = '';

  // Empty state points at the walkthrough, not a blank grid. (Fixes "no walk
  // through on how to plan" - the guidance is in Setup, so send them there.)
  if (planned.length === 0) {
    el.innerHTML = '<p class="north-vision-empty">Your map is empty for now. Head to <strong>Setup</strong> to walk through your goals one at a time - it builds this map for you, one area at a time.</p>';
    return;
  }

  planned.forEach(({ cat, goal }) => {
    const isPriority = priorityIds.includes(goal.id);
    const steps = stepsForGoal(goal);
    const group = document.createElement('div');
    group.className = 'vision-cat' + (isPriority ? ' is-priority' : '');
    const body = steps.length
      ? `<ul class="vision-cat-tasks">${steps.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>`
      : `<p class="vision-cat-aim">${escapeHtml(goal.text || 'Goal set - add weekly steps in Setup.')}</p>`;
    group.innerHTML = `
      <div class="vision-cat-header">
        <span class="vision-cat-name">${isPriority ? '★ ' : ''}${escapeHtml(cat.name)}</span>
        <span class="vision-cat-kind">${escapeHtml(cat.kind)}</span>
      </div>
      ${body}
    `;
    el.appendChild(group);
  });
}

// Flatten a year goal's weeklySteps { 1:[w1..], 2:[..], 3:[..] } into ordered
// step texts (session then week). These are the "goal tasks" of the category -
// the concrete plan the learner walked through in Setup.
function stepsForGoal(goal) {
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
