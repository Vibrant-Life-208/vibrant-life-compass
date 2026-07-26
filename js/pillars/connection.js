// js/pillars/connection.js — the purple pillar.
// Character strengths (read from via_strengths_top_3) at the top, then Conscious
// Living (self-authored, foundations.climb.consciousLiving), then the climbing
// partner (the existing Partner page, re-homed here - it renders into
// #partner-view-content). Compassion walkthrough + community bulletin are Phase 2.

import { shell, section, chips, emptyNote, comingNote, escapeHtml, escapeAttr } from './_scaffold.js';
import { getProfileStrengths, getViaCharacterStrengths, getProfileFoundations, setProfileFoundations } from '../store.js';
import { renderPartnerPage } from '../partner.js';

export async function renderConnection(learnerId) {
  const el = document.getElementById('connection-view');
  if (!el) return;
  const [strengthIds, lexicon, foundations] = await Promise.all([
    getProfileStrengths(learnerId),
    getViaCharacterStrengths(),
    getProfileFoundations(learnerId),
  ]);
  const climb = (foundations && foundations.climb && typeof foundations.climb === 'object' && !Array.isArray(foundations.climb))
    ? foundations.climb : {};
  const labelOf = (id) => {
    const s = (lexicon || []).find((x) => x.id === id);
    const label = s && (s.display_label_child || s.display_label_adult);
    return label || String(id).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };
  const strengthLabels = (strengthIds || []).map(labelOf).filter(Boolean);
  const strengthsSection = strengthLabels.length
    ? section('Your strengths', chips(strengthLabels))
    : section('Your strengths', emptyNote('Import your VIA strengths and they will live here.'));

  const consciousSection = section('Conscious Living', `
    <p class="pillar-prompt">How do your strengths show up in how you treat the people around you?</p>
    <textarea class="pillar-box" data-box="consciousLiving" rows="5" placeholder="With the people I care about, I...">${escapeHtml(climb.consciousLiving || '')}</textarea>
    <div class="pillar-box-actions">
      <button type="button" class="btn btn-text pillar-box-save" data-save="consciousLiving" hidden>Save</button>
      <span class="pillar-box-saved" data-saved="consciousLiving" hidden>Saved</span>
    </div>`);

  const partnerSection = section('Your climbing partner', '<div id="partner-view-content"></div>');
  const communitySection = section('Community', comingNote('Compassion walkthroughs and the community bulletin are on the way.'));

  el.innerHTML = shell(
    { color: 'connection', title: 'Connection', subtitle: 'Who you matter with - and how you move alongside them.' },
    [strengthsSection, consciousSection, partnerSection, communitySection],
  );

  wireConscious(el, learnerId, foundations || {}, climb);
  try { await renderPartnerPage(learnerId); } catch (e) { console.warn('connection: partner render:', e); }
}

function wireConscious(el, learnerId, foundations, climb) {
  const ta = el.querySelector('[data-box="consciousLiving"]');
  if (!ta) return;
  const saveBtn = el.querySelector('[data-save="consciousLiving"]');
  const savedTag = el.querySelector('[data-saved="consciousLiving"]');
  ta.addEventListener('input', () => { if (saveBtn) saveBtn.hidden = false; if (savedTag) savedTag.hidden = true; });
  if (saveBtn) saveBtn.addEventListener('click', async () => {
    const value = ta.value.trim();
    const next = { ...foundations, climb: { ...climb, consciousLiving: value } };
    try {
      await setProfileFoundations(learnerId, next);
      climb.consciousLiving = value;
      foundations.climb = { ...climb };
      saveBtn.hidden = true; if (savedTag) savedTag.hidden = false;
    } catch (e) { console.warn('conscious living save failed:', e); }
  });
}
