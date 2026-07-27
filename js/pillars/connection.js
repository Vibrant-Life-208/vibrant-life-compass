// js/pillars/connection.js — the purple pillar.
// Character strengths (via_strengths_top_3), Conscious Living (self-authored),
// the climbing partner (the Partner page re-homed here), a Compassion walkthrough
// (a short guided empathy + self-compassion sequence), and the community bulletin
// (Phase 2, pending its migration - still a coming-note here).

import { shell, section, chips, emptyNote, escapeHtml, escapeAttr } from './_scaffold.js';
import { getProfileStrengths, getViaCharacterStrengths, getProfileFoundations, setProfileFoundations,
  submitCommunityPost, getMyCommunityPosts, getPostedBoard } from '../store.js';
import { renderPartnerPage } from '../partner.js';

// Community-post status, learner-facing.
const POST_STATUS = {
  pending_guide: 'Waiting for your guide',
  pending_owner: 'Your guide said yes - waiting for the school',
  posted: 'Posted to the board',
  denied: 'Not this time',
};

// A gentle, trauma-informed empathy walkthrough. Perspective-taking + common
// ground + bringing your own strengths + one small act, closing on vulnerability
// and self-compassion (turn the same kindness inward). Invitations, not commands.
// SEL-grounded (perspective-taking, active listening, self-compassion). Worth an
// SSC/Salus read before it anchors the guide demo.
const COMPASSION_STEPS = [
  'Bring someone to mind - maybe someone you are finding hard right now.',
  'Picture their day from the inside. What might they be carrying that you cannot see?',
  'Underneath, you probably both want the same things - to be seen, to belong, to not mess up. Where do you overlap?',
  'Which of your strengths could you bring them - patience, humor, really listening?',
  'What is one small, real thing you could do or say?',
];

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

  const consciousSection = section('Conscious Living', boxHtml(
    'consciousLiving',
    'How do your strengths show up in how you treat the people around you?',
    'With the people I care about, I...',
    climb.consciousLiving || '',
  ));

  const partnerSection = section('Your climbing partner', '<div id="partner-view-content"></div>');

  const compassionSection = section('Compassion', `
    <p class="pillar-prompt">A short walk through caring for someone - and for yourself. Take it slow; there are no wrong answers.</p>
    <ol class="pillar-tool-steps compassion-steps">${COMPASSION_STEPS.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol>
    <p class="pillar-tool-note">Letting people matter to you takes courage - it is okay for it to feel risky. And turn that same kindness on yourself: talk to you like you would talk to someone you are helping.</p>
    ${boxHtml('compassionNote', 'Anything you want to hold onto from that?', 'Who came to mind, and what will you try...', climb.compassionNote || '')}`);

  const communitySection = section('Community', '<div id="conn-community"></div>');

  el.innerHTML = shell(
    { color: 'connection', title: 'Connection', subtitle: 'Who you matter with - and how you move alongside them.' },
    [strengthsSection, consciousSection, partnerSection, compassionSection, communitySection],
  );

  wireBoxes(el, learnerId, foundations || {}, climb);
  wireCommunity(learnerId);
  try { await renderPartnerPage(learnerId); } catch (e) { console.warn('connection: partner render:', e); }
}

// Community bulletin (learner side): submit an idea, watch its status through the
// guide -> owner gates, and read the posted board (everyone's approved ideas).
async function wireCommunity(learnerId) {
  const host = document.getElementById('conn-community');
  if (!host) return;
  const render = async () => {
    const [mine, board] = await Promise.all([
      getMyCommunityPosts(learnerId).catch(() => []),
      getPostedBoard().catch(() => []),
    ]);
    const mineCard = (p) => `<div class="conn-mine">
      <p class="conn-mine-body">${escapeHtml(p.body)}</p>
      <p class="conn-mine-status conn-status-${escapeAttr(p.status)}">${escapeHtml(POST_STATUS[p.status] || p.status)}${p.status === 'denied' && p.guideNote ? ` - ${escapeHtml(p.guideNote)}` : ''}</p>
    </div>`;
    host.innerHTML = `
      <p class="pillar-prompt">An idea for the community - a club to start, a way to give back? Send it to your guide.</p>
      <div class="pillar-resp-add">
        <input type="text" class="pillar-resp-input" id="conn-comm-input" placeholder="Your idea...">
        <button type="button" class="btn btn-text" id="conn-comm-send">Send</button>
      </div>
      ${mine.length ? `<h4 class="pillar-subhead">Your ideas</h4>${mine.map(mineCard).join('')}` : ''}
      <h4 class="pillar-subhead">What's happening around school</h4>
      ${board.length ? `<ul class="conn-board">${board.map((b) => `<li>${escapeHtml(b.body)}</li>`).join('')}</ul>` : '<p class="pillar-empty">Nothing posted yet - yours could be the first.</p>'}`;
    const input = document.getElementById('conn-comm-input');
    const send = async () => {
      const v = (input?.value || '').trim();
      if (!v) return;
      await submitCommunityPost(learnerId, v);
      await render();
    };
    document.getElementById('conn-comm-send')?.addEventListener('click', send);
    input?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } });
  };
  await render();
}

// A labeled, self-saving reflection textarea (foundations.climb[key]).
function boxHtml(key, prompt, placeholder, value) {
  return `
    <p class="pillar-prompt">${escapeHtml(prompt)}</p>
    <textarea class="pillar-box" data-box="${escapeAttr(key)}" rows="4" placeholder="${escapeAttr(placeholder)}">${escapeHtml(value)}</textarea>
    <div class="pillar-box-actions">
      <button type="button" class="btn btn-text pillar-box-save" data-save="${escapeAttr(key)}" hidden>Save</button>
      <span class="pillar-box-saved" data-saved="${escapeAttr(key)}" hidden>Saved</span>
    </div>`;
}

// Wire every self-saving box in the pillar (consciousLiving, compassionNote, ...).
function wireBoxes(el, learnerId, foundations, climb) {
  el.querySelectorAll('.pillar-box[data-box]').forEach((ta) => {
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
      } catch (e) { console.warn(`${key} save failed:`, e); }
    });
  });
}
