// Accountability partner UI: proposal + pending banner + active partnership.

import {
  getLearners, getLearner, getGoals,
  getActivePartnerOf, getPendingProposalsFor,
  proposePartner, respondToPartnerProposal, dissolvePartnership,
  getYearGoalPendingApprovals, approveYearGoal, rejectYearGoal,
} from './store.js';
import { openConfirmModal } from './modals.js';

export async function renderPartnerSection(learnerId) {
  const container = document.getElementById('north-partner');
  if (!container) return;
  if (!learnerId) {
    container.innerHTML = '<p class="learners-empty">Sign in to set up your partner.</p>';
    return;
  }

  const [active, pending] = await Promise.all([
    getActivePartnerOf(learnerId),
    getPendingProposalsFor(learnerId),
  ]);

  let html = '';

  for (const link of pending) {
    const proposer = await getLearner(link.proposerId);
    html += `
      <div class="partner-proposal-card">
        <p class="partner-proposal-text">
          <strong>${escapeHtml(proposer?.name || 'Someone')}</strong> wants you as their accountability partner.
        </p>
        <div class="partner-proposal-actions">
          <button type="button" class="btn btn-text" data-action="decline" data-link="${link.id}">Decline</button>
          <button type="button" class="btn btn-primary" data-action="accept" data-link="${link.id}">Accept</button>
        </div>
      </div>
    `;
  }

  if (active) {
    const partner = await getLearner(active.partnerId);
    html += `
      <div class="partner-active-card">
        <div class="partner-active-header">
          <span class="partner-label">Your accountability partner</span>
          <button type="button" class="btn btn-text partner-dissolve-btn" data-link="${active.linkId}">Dissolve</button>
        </div>
        <p class="partner-active-name">${escapeHtml(partner?.name || 'Unknown')}</p>
        <p class="partner-active-note">They approve your year-goal check-offs. You approve theirs.</p>
      </div>
    `;
  } else {
    const self = await getLearner(learnerId);
    const allLearners = await getLearners();
    const filtered = [];
    for (const l of allLearners) {
      if (l.id === learnerId) continue;
      if (l.studio !== self?.studio) continue;
      const theirPartner = await getActivePartnerOf(l.id);
      if (theirPartner) continue;
      filtered.push(l);
    }
    if (filtered.length === 0) {
      html += `
        <div class="partner-empty-card">
          <p class="partner-label">No accountability partner yet</p>
          <p class="partner-empty-text">Nobody in your studio is available right now. Ask a guide if you'd like to be paired across studios.</p>
        </div>
      `;
    } else {
      html += `
        <div class="partner-empty-card">
          <p class="partner-label">Choose an accountability partner</p>
          <p class="partner-empty-text">They'll approve your year-goal check-offs. You'll approve theirs.</p>
          <div class="partner-candidate-list">
      `;
      filtered.forEach((c) => {
        html += `
          <button type="button" class="partner-candidate" data-id="${c.id}">
            <span class="partner-candidate-name">${escapeHtml(c.name)}</span>
            <span class="partner-candidate-studio">${escapeHtml(c.studio)}</span>
          </button>
        `;
      });
      html += `</div></div>`;
    }
  }

  container.innerHTML = html;
  wireSectionActions(container, learnerId);
}

export async function renderPartnerApprovals(learnerId) {
  const container = document.getElementById('north-approvals');
  if (!container) return;
  const pending = await getYearGoalPendingApprovals(learnerId);

  if (pending.length === 0) {
    container.innerHTML = '<p class="learners-empty">No goals waiting on your approval right now.</p>';
    return;
  }

  container.innerHTML = '';
  for (const goal of pending) {
    const learner = await getLearner(goal.learnerId);
    const card = document.createElement('div');
    card.className = 'approval-card';
    card.innerHTML = `
      <div class="approval-header">
        <span class="approval-name"><strong>${escapeHtml(learner?.name || 'Your partner')}</strong> is ready to check off:</span>
      </div>
      <p class="approval-goal-text">${escapeHtml(goal.text)}</p>
      ${goal.baseline ? `<p class="approval-meta"><span class="approval-meta-label">Started from:</span> ${escapeHtml(goal.baseline)}</p>` : ''}
      <div class="approval-actions">
        <button type="button" class="btn btn-text" data-action="reject" data-goal="${goal.id}">Send back</button>
        <button type="button" class="btn btn-primary" data-action="approve" data-goal="${goal.id}">Approve ✓</button>
      </div>
    `;

    card.querySelector('[data-action="approve"]').addEventListener('click', async () => {
      await approveYearGoal(goal.id, learnerId, '');
      await renderPartnerApprovals(learnerId);
    document.dispatchEvent(new CustomEvent('hc:partner-changed'));
    });
    card.querySelector('[data-action="reject"]').addEventListener('click', async () => {
      const note = prompt('Brief note for your partner (optional):') || '';
      await rejectYearGoal(goal.id, learnerId, note);
      await renderPartnerApprovals(learnerId);
    document.dispatchEvent(new CustomEvent('hc:partner-changed'));
    });

    container.appendChild(card);
  }
}

function wireSectionActions(container, learnerId) {
  container.querySelectorAll('[data-action="accept"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await respondToPartnerProposal(btn.dataset.link, true);
      await renderPartnerSection(learnerId);
    document.dispatchEvent(new CustomEvent('hc:partner-changed'));
    });
  });
  container.querySelectorAll('[data-action="decline"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await respondToPartnerProposal(btn.dataset.link, false);
      await renderPartnerSection(learnerId);
    document.dispatchEvent(new CustomEvent('hc:partner-changed'));
    });
  });
  container.querySelectorAll('.partner-dissolve-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      openConfirmModal({
        title: 'Dissolve this partnership?',
        body: 'You\'ll both lose the partner link. You can propose a new partner anytime after.',
        confirmLabel: 'Dissolve',
        cancelLabel: 'Cancel',
        onConfirm: async () => {
          await dissolvePartnership(btn.dataset.link);
          await renderPartnerSection(learnerId);
    document.dispatchEvent(new CustomEvent('hc:partner-changed'));
        },
      });
    });
  });
  container.querySelectorAll('.partner-candidate').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const targetId = btn.dataset.id;
      const target = await getLearner(targetId);
      openConfirmModal({
        title: `Propose ${target?.name || 'them'} as your partner?`,
        body: `They'll get a request to accept. Until they accept, you don't have an accountability partner yet.`,
        confirmLabel: 'Send proposal',
        cancelLabel: 'Not yet',
        onConfirm: async () => {
          await proposePartner(learnerId, targetId);
          await renderPartnerSection(learnerId);
    document.dispatchEvent(new CustomEvent('hc:partner-changed'));
        },
      });
    });
  });
}

// =========================================================================
// Full Partner page (dedicated tab).
// =========================================================================
export async function renderPartnerPage(learnerId) {
  const container = document.getElementById('partner-view-content');
  if (!container) return;
  if (!learnerId) {
    container.innerHTML = '<p class="learners-empty">Sign in to see your partner page.</p>';
    return;
  }

  const [active, pending] = await Promise.all([
    getActivePartnerOf(learnerId),
    getPendingProposalsFor(learnerId),
  ]);

  let html = `<div class="partner-page-header">
    <h2 class="partner-page-title">Accountability partner</h2>
    <p class="partner-page-sub">One Hero Genius. One commitment to walking alongside.</p>
  </div>`;

  for (const link of pending) {
    const proposer = await getLearner(link.proposerId);
    html += `
      <div class="partner-proposal-card">
        <p class="partner-proposal-text">
          <strong>${escapeHtml(proposer?.name || 'Someone')}</strong> wants you as their accountability partner.
        </p>
        <div class="partner-proposal-actions">
          <button type="button" class="btn btn-text" data-action="decline" data-link="${link.id}">Decline</button>
          <button type="button" class="btn btn-primary" data-action="accept" data-link="${link.id}">Accept</button>
        </div>
      </div>
    `;
  }

  if (active) {
    const partner = await getLearner(active.partnerId);
    html += await renderActivePartnership(learnerId, partner, active.linkId);
  } else {
    html += await renderProposalUI(learnerId);
  }

  container.innerHTML = html;
  wirePageActions(container, learnerId);
}

async function renderActivePartnership(learnerId, partner, linkId) {
  const [theirGoals, myGoals] = await Promise.all([
    getGoals(partner?.id),
    getGoals(learnerId),
  ]);
  const theirYearGoals = theirGoals.filter(g => g.scope === 'year');
  const myYearGoals = myGoals.filter(g => g.scope === 'year');

  const theirWins = theirYearGoals.filter(g => g.status === 'approved' && g.approval?.partnerId === learnerId);
  const myWins = myYearGoals.filter(g => g.status === 'approved' && g.approval?.partnerId === partner?.id);
  const theirPending = theirYearGoals.filter(g => g.status === 'pending-approval');
  const myPending = myYearGoals.filter(g => g.status === 'pending-approval');

  return `
    <div class="partner-active-page-card">
      <div class="partner-active-header">
        <span class="partner-label">Walking with</span>
        <button type="button" class="btn btn-text partner-dissolve-btn" data-link="${linkId}">Dissolve</button>
      </div>
      <p class="partner-active-name">${escapeHtml(partner?.name || 'Unknown')}</p>
      <p class="partner-active-note">You approve each other's year-goal check-offs. The work is structured; the encouragement is real.</p>
    </div>

    <section class="partner-page-section">
      <h3 class="partner-section-title">Waiting on your approval</h3>
      ${theirPending.length === 0
        ? '<p class="learners-empty">Nothing waiting right now.</p>'
        : theirPending.map(g => `
            <div class="approval-card">
              <p class="approval-goal-text">${escapeHtml(g.text)}</p>
              ${g.baseline ? `<p class="approval-meta"><span class="approval-meta-label">Started from:</span> ${escapeHtml(g.baseline)}</p>` : ''}
              <div class="approval-actions">
                <button type="button" class="btn btn-text" data-action="reject-page" data-goal="${g.id}">Send back</button>
                <button type="button" class="btn btn-primary" data-action="approve-page" data-goal="${g.id}">Approve ✓</button>
              </div>
            </div>
          `).join('')
      }
    </section>

    <section class="partner-page-section">
      <h3 class="partner-section-title">Waiting on ${escapeHtml(partner?.name || 'your partner')}</h3>
      ${myPending.length === 0
        ? '<p class="learners-empty">Nothing of yours is in review right now.</p>'
        : myPending.map(g => `
            <div class="my-pending-card">
              <p class="my-pending-text">${escapeHtml(g.text)}</p>
              <span class="my-pending-meta">Sent for review</span>
            </div>
          `).join('')
      }
    </section>

    <section class="partner-page-section">
      <h3 class="partner-section-title">Their wins this year</h3>
      ${theirWins.length === 0
        ? '<p class="learners-empty">No approved year goals yet. The first one is coming.</p>'
        : '<ul class="partner-wins-list">' + theirWins.map(g => `
            <li class="partner-win-item">
              <span class="partner-win-text">${escapeHtml(g.text)}</span>
              ${g.approval?.approvedAt ? `<span class="partner-win-date">${formatDate(g.approval.approvedAt)}</span>` : ''}
            </li>
          `).join('') + '</ul>'
      }
    </section>

    <section class="partner-page-section">
      <h3 class="partner-section-title">Your wins this year</h3>
      ${myWins.length === 0
        ? '<p class="learners-empty">No approved year goals yet. Yours are coming too.</p>'
        : '<ul class="partner-wins-list">' + myWins.map(g => `
            <li class="partner-win-item">
              <span class="partner-win-text">${escapeHtml(g.text)}</span>
              ${g.approval?.approvedAt ? `<span class="partner-win-date">${formatDate(g.approval.approvedAt)}</span>` : ''}
            </li>
          `).join('') + '</ul>'
      }
    </section>
  `;
}

async function renderProposalUI(learnerId) {
  const self = await getLearner(learnerId);
  const allLearners = await getLearners();
  const candidates = [];
  for (const l of allLearners) {
    if (l.id === learnerId) continue;
    if (l.studio !== self?.studio) continue;
    const theirPartner = await getActivePartnerOf(l.id);
    if (theirPartner) continue;
    candidates.push(l);
  }

  if (candidates.length === 0) {
    return `
      <div class="partner-empty-card">
        <p class="partner-label">No partner yet</p>
        <p class="partner-empty-text">Nobody in your studio is available right now. Ask a guide if you'd like to be paired across studios.</p>
      </div>
    `;
  }

  let html = `
    <div class="partner-empty-card">
      <p class="partner-label">Choose your accountability partner</p>
      <p class="partner-empty-text">They'll approve your year-goal check-offs. You'll approve theirs. It's a quiet commitment.</p>
      <div class="partner-candidate-list">
  `;
  candidates.forEach((c) => {
    html += `
      <button type="button" class="partner-candidate" data-id="${c.id}">
        <span class="partner-candidate-name">${escapeHtml(c.name)}</span>
        <span class="partner-candidate-studio">${escapeHtml(c.studio)}</span>
      </button>
    `;
  });
  html += `</div></div>`;
  return html;
}

function wirePageActions(container, learnerId) {
  container.querySelectorAll('[data-action="accept"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await respondToPartnerProposal(btn.dataset.link, true);
      await renderPartnerPage(learnerId);
    });
  });
  container.querySelectorAll('[data-action="decline"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await respondToPartnerProposal(btn.dataset.link, false);
      await renderPartnerPage(learnerId);
    });
  });
  container.querySelectorAll('.partner-dissolve-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      openConfirmModal({
        title: 'Dissolve this partnership?',
        body: 'You\'ll both lose the partner link. You can propose a new partner anytime after.',
        confirmLabel: 'Dissolve',
        cancelLabel: 'Cancel',
        onConfirm: async () => {
          await dissolvePartnership(btn.dataset.link);
          await renderPartnerPage(learnerId);
        },
      });
    });
  });
  container.querySelectorAll('[data-action="approve-page"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await approveYearGoal(btn.dataset.goal, learnerId, '');
      await renderPartnerPage(learnerId);
    });
  });
  container.querySelectorAll('[data-action="reject-page"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const note = prompt('Brief note for your partner (optional):') || '';
      await rejectYearGoal(btn.dataset.goal, learnerId, note);
      await renderPartnerPage(learnerId);
    });
  });
  container.querySelectorAll('.partner-candidate').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const targetId = btn.dataset.id;
      const target = await getLearner(targetId);
      openConfirmModal({
        title: `Propose ${target?.name || 'them'} as your partner?`,
        body: `They'll get a request to accept. Until they accept, you don't have an accountability partner yet.`,
        confirmLabel: 'Send proposal',
        cancelLabel: 'Not yet',
        onConfirm: async () => {
          await proposePartner(learnerId, targetId);
          await renderPartnerPage(learnerId);
        },
      });
    });
  });
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
