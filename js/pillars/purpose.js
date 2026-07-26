// js/pillars/purpose.js — the red base.
// Values (read from the dedicated values_top_3 column) + three fill-anytime boxes
// (Passion / Contribution / Hero's Journey) stored as self-authored reflective
// narrative in profiles.foundations.climb. Values are NOT stored here (canon:
// foundations.climb is never the source of record for values/strengths/quote).

import { shell, section, chips, emptyNote, goalCard, escapeHtml, escapeAttr } from './_scaffold.js';
import { getProfileValues, getValuesLexicon, getProfileFoundations, setProfileFoundations } from '../store.js';

const BOXES = [
  { key: 'passion', label: 'Passion', prompt: 'What pulls you in?' },
  { key: 'contribution', label: 'Contribution', prompt: 'The mark you want to leave for others?' },
  { key: 'hero', label: "Hero's Journey", prompt: 'The long story you are the hero of - your Self, your North.' },
];

export async function renderPurpose(learnerId) {
  const el = document.getElementById('purpose-view');
  if (!el) return;
  const [valueIds, lexicon, foundations] = await Promise.all([
    getProfileValues(learnerId),
    getValuesLexicon(),
    getProfileFoundations(learnerId),
  ]);
  const climb = (foundations && foundations.climb && typeof foundations.climb === 'object' && !Array.isArray(foundations.climb))
    ? foundations.climb : {};
  const labelOf = (id) => {
    const v = (lexicon || []).find((x) => x.id === id);
    return v ? (v.display_label_adult || v.display_label_child || v.id) : String(id).replace(/_/g, ' ');
  };
  const valueLabels = (valueIds || []).map(labelOf).filter(Boolean);
  const valuesSection = valueLabels.length
    ? section('Your values', chips(valueLabels))
    : section('Your values', emptyNote('You will name your values as you walk your climb.'));

  const boxSections = BOXES.map((b) => section(b.label, `
    <p class="pillar-prompt">${escapeHtml(b.prompt)}</p>
    <textarea class="pillar-box" data-box="${escapeAttr(b.key)}" rows="3" placeholder="${escapeAttr(b.prompt)}">${escapeHtml(climb[b.key] || '')}</textarea>
    <div class="pillar-box-actions">
      <button type="button" class="btn btn-text pillar-box-save" data-save="${escapeAttr(b.key)}" hidden>Save</button>
      <span class="pillar-box-saved" data-saved="${escapeAttr(b.key)}" hidden>Saved</span>
    </div>`)).join('');

  el.innerHTML = shell(
    { color: 'purpose', title: 'Purpose', subtitle: 'The base you stand on. Fill these anytime - there is no need to fill them to move on.' },
    [valuesSection, boxSections],
  );
  wireBoxes(el, learnerId, foundations || {}, climb);
}

function wireBoxes(el, learnerId, foundations, climb) {
  el.querySelectorAll('.pillar-box').forEach((ta) => {
    const key = ta.dataset.box;
    const saveBtn = el.querySelector(`[data-save="${key}"]`);
    const savedTag = el.querySelector(`[data-saved="${key}"]`);
    ta.addEventListener('input', () => { if (saveBtn) saveBtn.hidden = false; if (savedTag) savedTag.hidden = true; });
    if (saveBtn) saveBtn.addEventListener('click', async () => {
      const value = ta.value.trim();
      const next = { ...foundations, climb: { ...climb, [key]: value } };
      try {
        await setProfileFoundations(learnerId, next);
        climb[key] = value;
        foundations.climb = { ...climb };
        saveBtn.hidden = true; if (savedTag) savedTag.hidden = false;
      } catch (e) { console.warn('purpose save failed:', e); }
    });
  });
}
