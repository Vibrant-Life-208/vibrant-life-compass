// Accountability partner UI: proposal + pending banner + active partnership.
// Per captain decisions 2026-05-11:
//   - Self-chosen with partner approval (mutual opt-in)
//   - 1:1 only; dissolve before switching
//   - Partner approves year-goal check-offs

import {
  getLearners, getLearner,
  getActivePartnerOf, getPendingProposalsFor,
  proposePartner, respondToPartnerProposal, dissolvePartnership,
  getYearGoalPendingApprovals, approveYearGoal, rejectYearGoal,
} from './store.js';
import { openConfirmModal } from './modals.js';

export function renderPartnerSection(learnerId) {
  const container = document.getElementById('north-partner');
  if (!container) return;
  if (!learnerId) {
    container.innerHTML = '<p class="learners-empty">Sign in to set up your partner.</p>';
    return;
  }

  const active = getActivePartnerOf(learnerId);
  const pending = getPendingProposalsFor(learnerId);

  let html = '';

  // Pending proposals (someone proposed YOU)
  pending.forEach((link) => {
    const proposer = getLearner(link.proposerId);
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
  });

  if (active) {
    const partner = getLearner(active.partnerId);
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
    // Show proposal UI: list of other learners in the same studio
    const self = getLearner(learnerId);
    const candidates = getLearners().filter(
      (l) => l.id !== learnerId
        && l.studio === self?.studio
        && !getActivePartnerOf(l.id)
    );
    if (candidates.length === 0) {
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
      candidates.forEach((c) => {
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

  // Wire actions
  container.querySelectorAll('[data-action="accept"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      respondToPartnerProposal(btn.dataset.link, true);
      renderPartnerSection(learnerId);
    });
  });
  container.querySelectorAll('[data-action="decline"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      respondToPartnerProposal(btn.dataset.link, false);
      renderPartnerSection(learnerId);
    });
  });
  container.querySelectorAll('.partner-dissolve-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      openConfirmModal({
        title: 'Dissolve this partnership?',
        body: 'You\'ll both lose the partner link. You can propose a new partner anytime after.',
        confirmLabel: 'Dissolve',
        cancelLabel: 'Cancel',
        onConfirm: () => {
          dissolvePartnership(btn.dataset.link);
          renderPartnerSection(learnerId);
        },
      });
    });
  });
  container.querySelectorAll('.partner-candidate').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.id;
      const target = getLearner(targetId);
      openConfirmModal({
        title: `Propose ${target?.name || 'them'} as your partner?`,
        body: `They'll get a request to accept. Until they accept, you don't have an accountability partner yet.`,
        confirmLabel: 'Send proposal',
        cancelLabel: 'Not yet',
        onConfirm: () => {
          proposePartner(learnerId, targetId);
          renderPartnerSection(learnerId);
        },
      });
    });
  });
}

// Approvals dashboard - shows year-goals from THIS learner's partners
// (i.e. they nominated me as partner and have sent goals for check-off).
export function renderPartnerApprovals(learnerId) {
  const container = document.getElementById('north-approvals');
  if (!container) return;
  const pending = getYearGoalPendingApprovals(learnerId);

  if (pending.length === 0) {
    container.innerHTML = '<p class="learners-empty">No goals waiting on your approval right now.</p>';
    return;
  }

  container.innerHTML = '';
  pending.forEach((goal) => {
    const learner = getLearner(goal.learnerId);
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

    card.querySelector('[data-action="approve"]').addEventListener('click', () => {
      approveYearGoal(goal.id, learnerId, '');
      renderPartnerApprovals(learnerId);
    });
    card.querySelector('[data-action="reject"]').addEventListener('click', () => {
      const note = prompt('Brief note for your partner (optional):') || '';
      rejectYearGoal(goal.id, learnerId, note);
      renderPartnerApprovals(learnerId);
    });

    container.appendChild(card);
  });
}

// Full Partner page (dedicated tab). Replaces the Everyone Page entirely.
// Per captain decision 2026-05-12: no broadcast surface between learners;
// accountability is 1:1 only. The Partner page is the social surface.
export function renderPartnerPage(learnerId) {
  const container = document.getElementById('partner-view-content');
  if (!container) return;
  if (!learnerId) {
    container.innerHTML = '<p class="learners-empty">Sign in to see your partner page.</p>';
    return;
  }

  const active = getActivePartnerOf(learnerId);
  const pending = getPendingProposalsFor(learnerId);

  // Header
  let html = `<div class="partner-page-header">
    <h2 class="partner-page-title">Accountability partner</h2>
    <p class="partner-page-sub">One Hero Genius. One commitment to walking alongside.</p>
  </div>`;

  // Pending proposals received
  pending.forEach((link) => {
    const proposer = getLearner(link.proposerId);
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
  });

  if (active) {
    const partner = getLearner(active.partnerId);
    html += renderActivePartnership(learnerId, partner, active.linkId);
  } else {
    html += renderProposalUI(learnerId);
  }

  container.innerHTML = html;
  wirePageActions(container, learnerId);
}

function renderActivePartnership(learnerId, partner, linkId) {
  // Gather: their wins (their approved year goals where I'm the approver),
  // my wins (my approved year goals where they're the approver),
  // pending from each side
  const allGoalsRaw = JSON.parse(localStorage.getItem('hc_goals') || '[]');
  const theirYearGoals = allGoalsRaw.filter(g => g.learnerId === partner?.id && g.scope === 'year');
  const myYearGoals = allGoalsRaw.filter(g => g.learnerId === learnerId && g.scope === 'year');

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

function renderProposalUI(learnerId) {
  const self = getLearner(learnerId);
  const candidates = getLearners().filter(
    (l) => l.id !== learnerId
      && l.studio === self?.studio
      && !getActivePartnerOf(l.id)
  );

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
    btn.addEventListener('click', () => {
      respondToPartnerProposal(btn.dataset.link, true);
      renderPartnerPage(learnerId);
    });
  });
  container.querySelectorAll('[data-action="decline"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      respondToPartnerProposal(btn.dataset.link, false);
      renderPartnerPage(learnerId);
    });
  });
  container.querySelectorAll('.partner-dissolve-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      import('./modals.js').then(({ openConfirmModal }) => {
        openConfirmModal({
          title: 'Dissolve this partnership?',
          body: 'You\'ll both lose the partner link. You can propose a new partner anytime after.',
          confirmLabel: 'Dissolve',
          cancelLabel: 'Cancel',
          onConfirm: () => {
            dissolvePartnership(btn.dataset.link);
            renderPartnerPage(learnerId);
          },
        });
      });
    });
  });
  container.querySelectorAll('[data-action="approve-page"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      approveYearGoal(btn.dataset.goal, learnerId, '');
      renderPartnerPage(learnerId);
    });
  });
  container.querySelectorAll('[data-action="reject-page"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const note = prompt('Brief note for your partner (optional):') || '';
      rejectYearGoal(btn.dataset.goal, learnerId, note);
      renderPartnerPage(learnerId);
    });
  });
  container.querySelectorAll('.partner-candidate').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.id;
      const target = getLearner(targetId);
      import('./modals.js').then(({ openConfirmModal }) => {
        openConfirmModal({
          title: `Propose ${target?.name || 'them'} as your partner?`,
          body: `They'll get a request to accept. Until they accept, you don't have an accountability partner yet.`,
          confirmLabel: 'Send proposal',
          cancelLabel: 'Not yet',
          onConfirm: () => {
            proposePartner(learnerId, targetId);
            renderPartnerPage(learnerId);
          },
        });
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
