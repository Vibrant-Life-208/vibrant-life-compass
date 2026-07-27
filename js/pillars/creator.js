// js/pillars/creator.js — the yellow pillar.
// The Curiosity vision (10/5/1 horizons) and the year goals it feeds - each goal
// with its halfway point. Academic (core) goals live on the Academics pillar, so
// Creator shows the NON-core year goals (the maker/mindset goals). Responsibilities
// is a self-owned list (foundations.climb.responsibilities). Emotional Regulation
// tools are still Phase 2.

import { shell, section, emptyNote, goalCard, escapeHtml, escapeAttr } from './_scaffold.js';
import { getLearner, getGoals, getProfileHorizons, getProfileFoundations, setProfileFoundations } from '../store.js';
import { getCategoriesForStudio } from '../studios.js';

const HORIZONS = [
  { key: 'beyond_5yr', label: '10 years from now' },
  { key: 'within_5yr', label: '5 years from now' },
  { key: 'within_1yr', label: '1 year from now' },
];

// Emotional Regulation tools. Grounded in the research (breathing / grounding /
// movement / cold-water are well-supported for calming the nervous system;
// tapping has RCTs but is still debated, so it is framed honestly, never
// overclaimed - the same intellectual honesty as the growth-mindset copy).
// Trauma-informed: invitations, never commands; a safety net at the foot.
// Refs: positivepsychology.com/emotion-regulation, Children's Hospital Colorado
// breathing guide, Sanford fit grounding, Frontiers 2025 EFT review.
const REG_TOOLS = [
  { name: 'Box breathing', tag: 'Breathe in a square',
    steps: ['Breathe in for 4.', 'Hold for 4.', 'Breathe out for 4.', 'Hold for 4.', 'Do it four times.'],
    note: 'Slow breathing tells your body it is safe to settle.' },
  { name: 'Bee breath', tag: 'Hum it out',
    steps: ['Breathe in through your nose.', 'Breathe out with a long, low hum - like a bee.', 'Feel the buzz in your chest and face.', 'A few rounds is plenty.'],
    note: 'The hum makes a gentle vibration that can help you calm.' },
  { name: '5-4-3-2-1', tag: 'Come back to right now',
    steps: ['Name 5 things you can see.', '4 things you can hear.', '3 things you can touch.', '2 things you can smell.', '1 slow breath.'],
    note: 'Naming what is around you pulls you out of the spin and into now.' },
  { name: 'Move it out', tag: 'Let your body shift it',
    steps: ['Stand up.', 'Shake out your hands and arms.', 'Roll your shoulders a few times.', 'Reach up tall, then fold down slow.'],
    note: 'A minute of moving can change a mood on its own.' },
  { name: 'Cool water', tag: 'Cool down, literally',
    steps: ['Splash cool water on your face,', 'or hold something cold for a minute.'],
    note: 'A cool splash can slow a racing heart - good for when a feeling hits hard and fast.' },
  { name: 'Tapping', tag: 'Tap while you name it',
    steps: ['With two fingers, tap gently on each spot a few times:', 'side of your hand, eyebrow, side of eye, under eye,', 'under nose, chin, collarbone, top of head.', 'As you tap, say out loud what you feel.'],
    note: 'Some people find tapping really helps. The research is promising but still debated - try it and see if it works for you.' },
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

  const toolsSection = section('Emotional Regulation', regToolsHtml());

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

function regToolsHtml() {
  const intro = `<p class="pillar-prompt">Big feelings are normal - these are ways to steady yourself when one hits. None of them fixes everything, and it is fine if one does not work for you - try another.</p>`;
  const cards = REG_TOOLS.map((t) => `
    <details class="pillar-tool">
      <summary class="pillar-tool-summary"><strong>${escapeHtml(t.name)}</strong> - ${escapeHtml(t.tag)}</summary>
      <ol class="pillar-tool-steps">${t.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol>
      ${t.note ? `<p class="pillar-tool-note">${escapeHtml(t.note)}</p>` : ''}
    </details>`).join('');
  const safety = `<p class="pillar-tool-safety">If a big feeling will not ease, or you ever feel unsafe, tell a guide or a grown-up you trust. You do not have to handle it alone.</p>`;
  return intro + `<div class="pillar-tools">${cards}</div>` + safety;
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
