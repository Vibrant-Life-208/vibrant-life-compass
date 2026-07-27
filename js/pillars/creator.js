// js/pillars/creator.js — the yellow pillar.
// The Curiosity vision (10/5/1 horizons) and the year goals it feeds - each goal
// with its halfway point. Academic (core) goals live on the Academics pillar, so
// Creator shows the NON-core year goals (the maker/mindset goals). Responsibilities
// is a self-owned list (foundations.climb.responsibilities). Emotional Regulation
// tools are still Phase 2.

import { shell, section, emptyNote, comingNote, goalCard, escapeHtml, escapeAttr } from './_scaffold.js';
import { getLearner, getGoals, getProfileHorizons, getProfileFoundations, setProfileFoundations } from '../store.js';
import { getCategoriesForStudio } from '../studios.js';

const HORIZONS = [
  { key: 'beyond_5yr', label: '10 years from now' },
  { key: 'within_5yr', label: '5 years from now' },
  { key: 'within_1yr', label: '1 year from now' },
];

export async function renderCreatorMindset(learnerId) {
  const el = document.getElementById('creator-view');
  if (!el) return;
  const [learner, goals, horizons, foundations] = await Promise.all([
    getLearner(learnerId),
    getGoals(learnerId),
    getProfileHorizons(learnerId),
    getProfileFoundations(learnerId),
  ]);
  const cats = getCategoriesForStudio(learner?.studio) || [];
  const coreIds = new Set(cats.filter((c) => c.kind === 'core').map((c) => c.id));
  const yearGoals = (goals || []).filter((g) => g.scope === 'year');
  const makerGoals = yearGoals.filter((g) => !coreIds.has(g.categoryId));

  const h = horizons || {};
  const horizonRows = HORIZONS.map((row) => {
    const val = h[row.key];
    return val
      ? `<div class="pillar-horizon"><p class="pillar-horizon-label">${escapeHtml(row.label)}</p><p class="pillar-horizon-text">${escapeHtml(val)}</p></div>`
      : '';
  }).filter(Boolean).join('');
  const horizonSection = horizonRows
    ? section('Your vision', horizonRows)
    : section('Your vision', emptyNote('Your 10 / 5 / 1 year vision appears here once you set it.'));

  const goalsSection = makerGoals.length
    ? section('Your goals', makerGoals.map(goalCard).join(''))
    : section('Your goals', emptyNote('The goals you set from your vision will land here.'));

  const toolsSection = section('Emotional Regulation', comingNote('Tools for steadying big feelings - breathing, tapping, sound - are on the way.'));

  const climb = (foundations && foundations.climb && typeof foundations.climb === 'object' && !Array.isArray(foundations.climb))
    ? foundations.climb : {};
  const respSection = section('Responsibilities', `
    <p class="pillar-prompt">What's yours to look after? Feed the dog, tidy your room - the things you carry.</p>
    <div id="creator-resp"></div>
    <div class="pillar-resp-add">
      <input type="text" class="pillar-resp-input" id="creator-resp-input" placeholder="Add something you look after...">
      <button type="button" class="btn btn-text pillar-resp-add-btn" id="creator-resp-add">Add</button>
    </div>`);

  el.innerHTML = shell(
    { color: 'creator', title: 'Creator Mindset', subtitle: 'Where you find out you can build.' },
    [horizonSection, goalsSection, toolsSection, respSection],
  );

  wireResponsibilities(learnerId, foundations || {}, climb);
}

function readResp(climb) {
  return Array.isArray(climb.responsibilities) ? climb.responsibilities.filter((x) => typeof x === 'string') : [];
}

function renderRespList(items) {
  const host = document.getElementById('creator-resp');
  if (!host) return;
  if (!items.length) {
    host.innerHTML = '<p class="pillar-empty">Nothing here yet - add what you look after.</p>';
    return;
  }
  host.innerHTML = `<ul class="pillar-resp-list">${items.map((t, i) => `
    <li class="pillar-resp-item">
      <span>${escapeHtml(t)}</span>
      <button type="button" class="pillar-resp-remove" data-resp-remove="${i}" aria-label="Remove">×</button>
    </li>`).join('')}</ul>`;
}

function wireResponsibilities(learnerId, foundations, climb) {
  let items = readResp(climb);
  renderRespList(items);

  const save = async () => {
    const next = { ...foundations, climb: { ...climb, responsibilities: items } };
    try {
      await setProfileFoundations(learnerId, next);
      climb.responsibilities = [...items];
      foundations.climb = { ...climb };
    } catch (e) { console.warn('responsibilities save failed:', e); }
  };

  const input = document.getElementById('creator-resp-input');
  const addBtn = document.getElementById('creator-resp-add');
  const add = async () => {
    const v = (input?.value || '').trim();
    if (!v) return;
    items = [...items, v];
    if (input) input.value = '';
    renderRespList(items);
    await save();
  };
  addBtn?.addEventListener('click', add);
  input?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } });

  document.getElementById('creator-resp')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-resp-remove]');
    if (!btn) return;
    const idx = Number(btn.dataset.respRemove);
    items = items.filter((_, i) => i !== idx);
    renderRespList(items);
    await save();
  });
}
