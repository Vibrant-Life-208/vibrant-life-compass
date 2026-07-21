// Accountability partner UI: proposal + pending banner + active partnership.

import {
  getLearners, getLearner, getGoals,
  getActivePartnerOf, getPendingProposalsFor,
  proposePartner, respondToPartnerProposal, dissolvePartnership,
  getYearGoalPendingApprovals, approveYearGoal, rejectYearGoal,
  getPendingYearPlanFor, approveYearPlan, returnYearPlan,
  addNotification, getNotifications, markNotificationRead,
  getGuides, getParents, getParentLearnerLinks,
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
    // Guide-assigned partners (captain 2026-07-21): learners no longer pick their own
    // accountability partner. A guide pairs them - by randomizer or by hand - from the
    // Tribe tab. This is the read-only "waiting" state; the approval + check-in machinery
    // above stays intact once a guide assigns the pair.
    html += `
      <div class="partner-empty-card">
        <p class="partner-label">No accountability partner yet</p>
        <p class="partner-empty-text">Your guide will pair you with an accountability partner. Once you're paired, you'll approve each other's year-goal check-offs here.</p>
      </div>
    `;
  }

  container.innerHTML = html;
  wireSectionActions(container, learnerId);
}

export async function renderPartnerApprovals(learnerId) {
  // (Kept for backward compat - no longer rendered on North per Phase 1
  // dashboard restructure; the rich version lives on the Partner page.)
  const container = document.getElementById('north-approvals');
  if (!container) return;
  container.innerHTML = '';
}

// Notify all parents + guides that a learner has had their year plan
// approved. Called from the partner-approval flow.
async function notifyParentsAndGuide(learnerId, message) {
  const links = await getParentLearnerLinks();
  const parentIds = links.filter((l) => l.learnerId === learnerId).map((l) => l.parentId);
  const guides = await getGuides();
  for (const pid of parentIds) {
    await addNotification({
      recipientId: pid,
      type: 'year-plan-approved',
      title: 'Year plan approved',
      body: message,
      fromId: learnerId,
    });
  }
  for (const g of guides) {
    await addNotification({
      recipientId: g.id,
      type: 'year-plan-approved',
      title: 'Year plan approved',
      body: message,
      fromId: learnerId,
    });
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
  const [theirGoals, myGoals, pendingYearPlans, myNotifs] = await Promise.all([
    getGoals(partner?.id),
    getGoals(learnerId),
    getPendingYearPlanFor(learnerId),
    getNotifications(learnerId),
  ]);

  // Unread incoming partner check-ins (from this learner's partner).
  const incomingCheckins = (myNotifs || []).filter(
    (n) => n.type === 'partner-checkin' && !n.readAt
  );
  const theirYearGoals = theirGoals.filter(g => g.scope === 'year');
  const myYearGoals = myGoals.filter(g => g.scope === 'year');

  const theirWins = theirYearGoals.filter(g => g.status === 'approved' && g.approval?.partnerId === learnerId);
  const myWins = myYearGoals.filter(g => g.status === 'approved' && g.approval?.partnerId === partner?.id);
  const theirPending = theirYearGoals.filter(g => g.status === 'pending-approval');
  const myPending = myYearGoals.filter(g => g.status === 'pending-approval');

  // Render the pending year-plan card if there is one
  let yearPlanSection = '';
  if (pendingYearPlans.length > 0) {
    const plan = pendingYearPlans[0]; // one at a time per partner
    yearPlanSection = await renderYearPlanCard(plan, partner);
  }

  // Inline banner showing recent unread check-ins from this learner's partner.
  const checkinBanner = incomingCheckins.length > 0 ? `
    <div class="partner-checkin-banner">
      <p class="partner-checkin-banner-label">From ${escapeHtml(partner?.name?.split(' ')[0] || 'your partner')}</p>
      ${incomingCheckins.slice(0, 3).map((n) => `
        <div class="partner-checkin-item" data-notif-id="${escapeHtml(n.id)}">
          <p class="partner-checkin-body">${escapeHtml(n.body)}</p>
          <span class="partner-checkin-date">${formatDate(n.createdAt)}</span>
        </div>
      `).join('')}
      <p class="partner-checkin-hint">Tap a check-in to mark it read.</p>
    </div>
  ` : '';

  return `
    ${checkinBanner}
    <div class="partner-active-page-card">
      <div class="partner-active-header">
        <span class="partner-label">Walking with</span>
        <button type="button" class="btn btn-text partner-dissolve-btn" data-link="${linkId}">Dissolve</button>
      </div>
      <p class="partner-active-name">${escapeHtml(partner?.name || 'Unknown')}</p>
      <p class="partner-active-note">You approve each other's year plan and year-goal check-offs. The work is structured; the encouragement is real.</p>
      <button type="button" class="btn btn-primary partner-checkin-btn" style="margin-top:0.75rem;" data-partner-id="${escapeHtml(partner?.id || '')}" data-partner-name="${escapeHtml(partner?.name || '')}">Tell ${escapeHtml(partner?.name?.split(' ')[0] || 'them')} I finished my work today</button>
    </div>

    ${yearPlanSection}

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
  // Guide-assigned partners (captain 2026-07-21): the learner self-pick is retired.
  // A guide pairs learners from the Tribe tab, by randomizer or by hand. This page
  // shows the calm "waiting to be paired" state until a guide assigns a partner.
  return `
    <div class="partner-empty-card">
      <p class="partner-label">Waiting to be paired</p>
      <p class="partner-empty-text">Your guide will pair you with an accountability partner - someone to walk alongside this year. Once you're paired, you'll approve each other's year plan and year-goal check-offs right here.</p>
    </div>
  `;
}

function wirePageActions(container, learnerId) {
  // Incoming partner check-in: tap to mark read.
  container.querySelectorAll('.partner-checkin-item').forEach((el) => {
    el.addEventListener('click', async () => {
      const notifId = el.dataset.notifId;
      if (notifId) {
        await markNotificationRead(notifId);
        await renderPartnerPage(learnerId);
        document.dispatchEvent(new CustomEvent('hc:partner-changed'));
      }
    });
  });

  // Partner check-in: learner pings their partner that they finished today's work.
  container.querySelectorAll('.partner-checkin-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const partnerId = btn.dataset.partnerId;
      const partnerName = btn.dataset.partnerName;
      if (!partnerId) return;
      const me = await getLearner(learnerId);
      await addNotification({
        recipientId: partnerId,
        type: 'partner-checkin',
        title: 'Partner check-in',
        body: `${me?.name || me?.heroName || 'Your partner'} finished their work today.`,
        fromId: learnerId,
      });
      openConfirmModal({
        title: 'Sent',
        body: `${partnerName?.split(' ')[0] || 'Your partner'} will see your check-in next time they sign in. Nice work today.`,
        confirmLabel: 'OK',
        cancelLabel: 'Cancel',
        onConfirm: () => {},
      });
    });
  });
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
  container.querySelectorAll('[data-action="approve-yearplan"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const planId = btn.dataset.plan;
      const planLearnerId = btn.dataset.learner;
      await approveYearPlan(planId, learnerId, '');
      // Notify parents + guide that the plan was approved
      const planLearner = await getLearner(planLearnerId);
      await notifyParentsAndGuide(
        planLearnerId,
        `${planLearner?.name || 'Your hero'}'s year plan has been signed off by their accountability partner.`
      );
      await renderPartnerPage(learnerId);
      document.dispatchEvent(new CustomEvent('hc:partner-changed'));
    });
  });
  container.querySelectorAll('[data-action="return-yearplan"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const note = prompt('What would you like your partner to reconsider? (optional)') || '';
      await returnYearPlan(btn.dataset.plan, learnerId, note);
      await renderPartnerPage(learnerId);
      document.dispatchEvent(new CustomEvent('hc:partner-changed'));
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

async function renderYearPlanCard(plan, partner) {
  const yearGoals = (await getGoals(partner.id)).filter((g) => g.scope === 'year' && g.text);
  const goalCount = yearGoals.length;
  const partnerLearner = await getLearner(plan.learnerId);
  const priorityIds = Array.isArray(partnerLearner?.priorityGoalIds) ? partnerLearner.priorityGoalIds : [];

  const goalSummaries = yearGoals.map((g) => {
    const isPriority = priorityIds.includes(g.id);
    return `
      <div class="year-plan-goal ${isPriority ? 'is-priority' : ''}">
        <div class="year-plan-goal-header">
          ${isPriority ? '<span class="year-plan-star">★</span>' : ''}
          <span class="year-plan-goal-cat">${escapeHtml(g.categoryId)}</span>
        </div>
        <p class="year-plan-goal-text">${escapeHtml(g.text)}</p>
        ${g.halfwayPoint ? `<p class="year-plan-goal-eos3"><strong>EOS 3:</strong> ${escapeHtml(g.halfwayPoint)}</p>` : ''}
      </div>
    `;
  }).join('');

  return `
    <section class="partner-page-section partner-yearplan-section">
      <h3 class="partner-section-title">Year plan waiting for your approval</h3>
      <div class="year-plan-card">
        <p class="year-plan-intro">${escapeHtml(partner.name || 'Your partner')} has set ${goalCount} year goal${goalCount === 1 ? '' : 's'}. Review the plan below; approve it as a whole, or send it back with a note for revision.</p>
        <div class="year-plan-goals">${goalSummaries}</div>
        <div class="approval-actions">
          <button type="button" class="btn btn-text" data-action="return-yearplan" data-plan="${plan.id}">Send back with notes</button>
          <button type="button" class="btn btn-primary" data-action="approve-yearplan" data-plan="${plan.id}" data-learner="${plan.learnerId}">Approve year plan ✓</button>
        </div>
      </div>
    </section>
  `;
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
