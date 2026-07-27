// js/pillars/academics.js — the orange apex.
// Core academic subjects (Math, LA, Reading, Civ) + their year goals, then Deep
// Reading (the challenging book + a journal to think on paper about it + a
// want-to-read wishlist) and a private Creative-writing journal. The book itself
// reuses the shared books.js model (learner.books, also shown on North); the two
// journals + the wishlist are self-only reflective narrative in foundations.climb.

import { shell, section, emptyNote, goalCard, escapeHtml, escapeAttr } from './_scaffold.js';
import { getLearner, getGoals, getProfileFoundations, setProfileFoundations } from '../store.js';
import { getCategoriesForStudio } from '../studios.js';
import { getBooks, addBook, setBookmark } from '../books.js';

export async function renderAcademicsPillar(learnerId) {
  const el = document.getElementById('academics-view');
  if (!el) return;
  const [learner, goals, foundations] = await Promise.all([
    getLearner(learnerId),
    getGoals(learnerId),
    getProfileFoundations(learnerId),
  ]);
  const cats = getCategoriesForStudio(learner?.studio) || [];
  const coreCats = cats.filter((c) => c.kind === 'core');
  const yearGoals = (goals || []).filter((g) => g.scope === 'year');
  const goalFor = (catId) => yearGoals.find((g) => g.categoryId === catId);

  const subjectSections = coreCats.map((c) => {
    const g = goalFor(c.id);
    return section(c.name, g ? goalCard(g) : emptyNote('No goal set yet.'));
  });
  const subjectsBlock = subjectSections.length
    ? subjectSections
    : [section('Core subjects', emptyNote('Your academic subjects appear here.'))];

  const climb = (foundations && foundations.climb && typeof foundations.climb === 'object' && !Array.isArray(foundations.climb))
    ? foundations.climb : {};

  const readingSection = section('Deep reading', `
    <p class="pillar-prompt">A book that challenges you - and a place to think on paper about it. Choose one at a time; a book can change you, so the choice matters.</p>
    <div id="acad-book"></div>
    <h4 class="pillar-subhead">Your reading journal</h4>
    <div id="acad-bookjournal"></div>
    <h4 class="pillar-subhead">Want to read</h4>
    <div id="acad-wishlist"></div>`);

  const writingSection = section('Creative writing', `
    <p class="pillar-prompt">Your own writing - stories, ideas, whatever you want. Private, just for you.</p>
    <div id="acad-writing"></div>`);

  el.innerHTML = shell(
    { color: 'academics', title: 'Academics', subtitle: 'The tools you build for understanding the world - built, not given.' },
    [...subjectsBlock, readingSection, writingSection],
  );

  wireDeepBook(learner);
  wireWishlist(learnerId, foundations || {}, climb);
  wireJournal('acad-bookjournal', 'bookJournal', 'What did this book make you think?', learnerId, foundations || {}, climb);
  wireJournal('acad-writing', 'writingJournal', 'Start writing...', learnerId, foundations || {}, climb);
}

// ── Deep book: the current challenging read (reuses books.js / learner.books) ──
function wireDeepBook(learner) {
  const host = document.getElementById('acad-book');
  if (!host) return;
  const render = () => {
    const books = getBooks(learner);
    const book = books[0] || null; // deep reading = one at a time; the first is "now"
    if (!book) {
      host.innerHTML = `
        <div class="acad-book-add">
          <input type="text" id="acad-book-input" placeholder="The book you're reading now...">
          <button type="button" class="btn btn-text" id="acad-book-add-btn">Add</button>
        </div>`;
      document.getElementById('acad-book-add-btn')?.addEventListener('click', add);
      document.getElementById('acad-book-input')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
      return;
    }
    host.innerHTML = `
      <div class="acad-book">
        <p class="acad-book-title">${escapeHtml(book.title)}</p>
        <label class="acad-book-mark-label">Where you are now</label>
        <input type="text" id="acad-book-mark" class="acad-book-mark" value="${escapeAttr(book.bookmark || '')}" placeholder="e.g. chapter 4, the part where...">
        <span class="pillar-box-saved" id="acad-book-saved" hidden>Saved</span>
      </div>`;
    const mark = document.getElementById('acad-book-mark');
    let t = null;
    mark?.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(async () => {
        await setBookmark(learner, book.id, mark.value);
        book.bookmark = mark.value.trim();
        const s = document.getElementById('acad-book-saved'); if (s) { s.hidden = false; setTimeout(() => { s.hidden = true; }, 1500); }
      }, 600);
    });
  };
  const add = async () => {
    const input = document.getElementById('acad-book-input');
    const t = (input?.value || '').trim();
    if (!t) return;
    await addBook(learner, t);
    render();
  };
  render();
}

// ── Wishlist: books the learner wants to read (foundations.climb.wishlist: string[]) ──
function wireWishlist(learnerId, foundations, climb) {
  const host = document.getElementById('acad-wishlist');
  if (!host) return;
  let items = Array.isArray(climb.wishlist) ? climb.wishlist.filter((x) => typeof x === 'string') : [];
  const save = async () => {
    const next = { ...foundations, climb: { ...climb, wishlist: items } };
    try { await setProfileFoundations(learnerId, next); climb.wishlist = [...items]; foundations.climb = { ...climb }; }
    catch (e) { console.warn('wishlist save:', e); }
  };
  const render = () => {
    const list = items.length
      ? `<ul class="pillar-resp-list">${items.map((t, i) => `<li class="pillar-resp-item"><span>${escapeHtml(t)}</span><button type="button" class="pillar-resp-remove" data-wish-remove="${i}" aria-label="Remove">×</button></li>`).join('')}</ul>`
      : '<p class="pillar-empty">Books you want to read can live here.</p>';
    host.innerHTML = `${list}<div class="pillar-resp-add"><input type="text" class="pillar-resp-input" id="acad-wish-input" placeholder="A book you want to read..."><button type="button" class="btn btn-text" id="acad-wish-add">Add</button></div>`;
    const add = async () => {
      const input = document.getElementById('acad-wish-input');
      const v = (input?.value || '').trim(); if (!v) return;
      items = [...items, v]; render(); await save();
    };
    document.getElementById('acad-wish-add')?.addEventListener('click', add);
    document.getElementById('acad-wish-input')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
    host.querySelectorAll('[data-wish-remove]').forEach((b) => b.addEventListener('click', async () => {
      items = items.filter((_, i) => i !== Number(b.dataset.wishRemove)); render(); await save();
    }));
  };
  render();
}

// ── Journal: append-only entries (foundations.climb[key]: {text, at}[]) ──
function wireJournal(mountId, key, placeholder, learnerId, foundations, climb) {
  const host = document.getElementById(mountId);
  if (!host) return;
  let entries = Array.isArray(climb[key]) ? climb[key].filter((e) => e && typeof e.text === 'string') : [];
  const save = async () => {
    const next = { ...foundations, climb: { ...climb, [key]: entries } };
    try { await setProfileFoundations(learnerId, next); climb[key] = [...entries]; foundations.climb = { ...climb }; }
    catch (e) { console.warn('journal save:', e); }
  };
  const render = () => {
    const list = entries.length
      ? `<ul class="acad-journal-list">${[...entries].reverse().map((e) => `<li class="acad-journal-entry"><span class="acad-journal-date">${escapeHtml(fmtDate(e.at))}</span><p>${escapeHtml(e.text)}</p></li>`).join('')}</ul>`
      : '';
    host.innerHTML = `
      <div class="acad-journal-add">
        <textarea class="pillar-box" id="${mountId}-ta" rows="3" placeholder="${escapeAttr(placeholder)}"></textarea>
        <button type="button" class="btn btn-text" id="${mountId}-add">Add entry</button>
      </div>${list}`;
    const ta = document.getElementById(`${mountId}-ta`);
    document.getElementById(`${mountId}-add`)?.addEventListener('click', async () => {
      const v = (ta?.value || '').trim(); if (!v) return;
      entries = [...entries, { text: v, at: new Date().toISOString() }];
      render(); await save();
    });
  };
  render();
}

function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
  catch (e) { return ''; }
}
