// Storage facade. Async by design so the runtime is Supabase-ready.
// All exported functions return Promises; renderers must await them.
// When BACKEND_TYPE flips to 'supabase' in config.js, this file's internals
// swap to call the Supabase adapter without changing any caller.
//
// For now, the underlying storage is browser localStorage (synchronous).
// We wrap it in async wrappers so the async contract is real even when the
// data lives locally.

const KEYS = {
  session: 'hc_session',
  learners: 'hc_learners',
  guides: 'hc_guides',
  goals: 'hc_goals',
  checkIns: 'hc_check_ins',
  posts: 'hc_everyone_posts',
  yearQuotes: 'hc_year_quotes',  // keyed by learner.id OR guide.id (both UUIDs)
  yearTraits: 'hc_year_traits',  // same
  logins: 'hc_logins',
  tasks: 'hc_tasks',
  partnerLinks: 'hc_partner_links',
  parents: 'hc_parents',
  parentLearnerLinks: 'hc_parent_learner_links',
  yearPlans: 'hc_year_plans',
  notifications: 'hc_notifications',
};

function read(key) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ============================================================================
// Session
// ============================================================================
export async function getSession() {
  return read(KEYS.session);
}

export async function setSession(session) {
  write(KEYS.session, session);
}

export async function clearSession() {
  localStorage.removeItem(KEYS.session);
}

// ============================================================================
// Learners
// ============================================================================
export async function getLearners() {
  return read(KEYS.learners) || [];
}

export async function getLearner(id) {
  const learners = await getLearners();
  return learners.find((l) => l.id === id) || null;
}

export async function saveLearner(data) {
  // Destructure id out so `id: undefined` from callers cannot wipe the
  // freshly generated id via spread. Same fix shape as saveGoal/saveTask.
  const { id, ...rest } = data;
  const learners = await getLearners();
  if (id) {
    const idx = learners.findIndex((l) => l.id === id);
    if (idx >= 0) learners[idx] = { ...learners[idx], ...rest, id, updatedAt: new Date().toISOString() };
  } else {
    learners.push({ id: generateId(), createdAt: new Date().toISOString(), ...rest });
  }
  write(KEYS.learners, learners);
  return learners;
}

// ============================================================================
// Parents (separate from learners + guides; tracked for admin tool)
// ============================================================================
export async function getParents() {
  return read(KEYS.parents) || [];
}

export async function saveParent(data) {
  const { id, ...rest } = data;
  const parents = await getParents();
  if (id) {
    const idx = parents.findIndex((p) => p.id === id);
    if (idx >= 0) parents[idx] = { ...parents[idx], ...rest, id, updatedAt: new Date().toISOString() };
  } else {
    parents.push({ id: generateId(), createdAt: new Date().toISOString(), ...rest });
  }
  write(KEYS.parents, parents);
  return parents;
}

export async function getParentLearnerLinks() {
  return read(KEYS.parentLearnerLinks) || [];
}

export async function linkParentToLearner(parentId, learnerId) {
  const links = await getParentLearnerLinks();
  const exists = links.find((l) => l.parentId === parentId && l.learnerId === learnerId);
  if (exists) return links;
  links.push({ parentId, learnerId, createdAt: new Date().toISOString() });
  write(KEYS.parentLearnerLinks, links);
  return links;
}

// ============================================================================
// Account lookup by hero name (the username in the local-auth model).
// Searches learners, parents, and guides. Returns the matched account
// with its role, or null.
// ============================================================================
export async function findAccountByHeroName(heroName) {
  const name = String(heroName).trim().toLowerCase();
  if (!name) return null;
  const [learners, parents, guides] = await Promise.all([
    getLearners(), getParents(), getGuides(),
  ]);
  const l = learners.find((x) => (x.heroName || x.name)?.toLowerCase() === name);
  if (l) return { ...l, role: 'learner' };
  const p = parents.find((x) => (x.heroName || x.name)?.toLowerCase() === name);
  if (p) return { ...p, role: 'parent' };
  const g = guides.find((x) => (x.heroName || x.name)?.toLowerCase() === name);
  if (g) return { ...g, role: 'guide' };
  return null;
}

// Hero-name + password sign-in. Returns the verified account (with role)
// on success, null on failure. Backend-aware so auth.js can call one
// function regardless of localStorage vs Supabase Auth.
import { verifyPassword as _verifyPasswordLocal } from '../crypto.js';
export async function signInWithHeroName(heroName, password) {
  const account = await findAccountByHeroName(heroName);
  if (!account) return null;
  if (!account.passwordHash || !account.passwordSalt) return null;
  const ok = await _verifyPasswordLocal(password, {
    hash: account.passwordHash, salt: account.passwordSalt,
  });
  return ok ? account : null;
}

// ============================================================================
// Guides
// ============================================================================
export async function getGuides() {
  return read(KEYS.guides) || [];
}

export async function getGuide(id) {
  const guides = await getGuides();
  return guides.find((g) => g.id === id) || null;
}

export async function saveGuide(data) {
  const { id, ...rest } = data;
  const guides = await getGuides();
  if (id) {
    const idx = guides.findIndex((g) => g.id === id);
    if (idx >= 0) guides[idx] = { ...guides[idx], ...rest, id, updatedAt: new Date().toISOString() };
  } else {
    guides.push({ id: generateId(), createdAt: new Date().toISOString(), ...rest });
  }
  write(KEYS.guides, guides);
  return guides;
}

// ============================================================================
// Goals (year + per-session)
// Shape: { id, learnerId, categoryId, scope: 'year'|'session', sessionIndex?,
//          text, baseline?, halfwayPoint?, quarterPoint?, targetSession?,
//          status, autoPopulated?, approval? }
// ============================================================================
export async function getGoals(learnerId) {
  const all = read(KEYS.goals) || [];
  return all.filter((g) => g.learnerId === learnerId);
}

export async function saveGoal(goal) {
  // Destructure id out so an explicit `id: undefined` from callers (e.g. the
  // year-goal modal calling saveGoal({ id: filled?.id, ... }) on a new goal)
  // can't overwrite a freshly generated id via spread.
  const { id, ...rest } = goal;
  const all = read(KEYS.goals) || [];
  if (id) {
    const idx = all.findIndex((g) => g.id === id);
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...rest, id, updatedAt: new Date().toISOString() };
    }
    write(KEYS.goals, all);
    return all.find((g) => g.id === id);
  }
  const created = { id: generateId(), createdAt: new Date().toISOString(), ...rest };
  all.push(created);
  write(KEYS.goals, all);
  return created;
}

// ============================================================================
// Check-ins
// ============================================================================
export async function getCheckIns(learnerId) {
  const all = read(KEYS.checkIns) || [];
  return all.filter((c) => c.learnerId === learnerId);
}

export async function addCheckIn(checkIn) {
  const all = read(KEYS.checkIns) || [];
  const { id: _ignored, ...rest } = checkIn;
  const record = { id: generateId(), createdAt: new Date().toISOString(), ...rest };
  all.push(record);
  write(KEYS.checkIns, all);
  return record;
}

// ============================================================================
// Everyone Page posts (deprecated 2026-05-12; kept for migration only)
// ============================================================================
export async function getPosts() {
  return read(KEYS.posts) || [];
}

export async function addPost(post) {
  const all = await getPosts();
  const { id: _ignored, ...rest } = post;
  const record = { id: generateId(), createdAt: new Date().toISOString(), ...rest };
  all.unshift(record);
  write(KEYS.posts, all);
  return record;
}

// ============================================================================
// Year quote per identity (learner.id or guide.id)
// ============================================================================
export async function getYearQuote(identityId) {
  const all = read(KEYS.yearQuotes) || {};
  return all[identityId] || '';
}

export async function setYearQuote(identityId, text) {
  const all = read(KEYS.yearQuotes) || {};
  all[identityId] = text;
  write(KEYS.yearQuotes, all);
}

// ============================================================================
// Year traits per identity
// ============================================================================
export async function getYearTraits(identityId) {
  const all = read(KEYS.yearTraits) || {};
  return all[identityId] || [];
}

export async function setYearTraits(identityId, traits) {
  const all = read(KEYS.yearTraits) || {};
  all[identityId] = traits;
  write(KEYS.yearTraits, all);
}

// ============================================================================
// External-service logins (passwords for Khan, Lexia, etc.)
// Password is encrypted at rest via crypto.js (AES-GCM 256).
// ============================================================================
import { getOrCreateLearnerKey, encryptString, decryptString, isEnvelope } from '../crypto.js';

export async function getLogins(learnerId) {
  const all = read(KEYS.logins) || {};
  return all[learnerId] || [];
}

export async function saveLogin(learnerId, login) {
  const all = read(KEYS.logins) || {};
  const list = all[learnerId] || [];

  let passwordField = login.password;
  if (typeof passwordField === 'string' && passwordField.length > 0) {
    const key = await getOrCreateLearnerKey(learnerId);
    passwordField = await encryptString(passwordField, key);
  } else if (typeof passwordField === 'string' && passwordField.length === 0) {
    passwordField = { ct: '', iv: '' };
  }

  const { id, ...loginRest } = login;
  const sanitized = { ...loginRest, password: passwordField };

  if (id) {
    const idx = list.findIndex((l) => l.id === id);
    if (idx >= 0) list[idx] = { ...list[idx], ...sanitized, id, updatedAt: new Date().toISOString() };
  } else {
    list.push({ id: generateId(), createdAt: new Date().toISOString(), ...sanitized });
  }
  all[learnerId] = list;
  write(KEYS.logins, all);
  return list;
}

export async function revealLoginPassword(learnerId, id) {
  const list = await getLogins(learnerId);
  const login = list.find((l) => l.id === id);
  if (!login) return '';
  if (!isEnvelope(login.password)) {
    return typeof login.password === 'string' ? login.password : '';
  }
  const key = await getOrCreateLearnerKey(learnerId);
  return decryptString(login.password, key);
}

export async function deleteLogin(learnerId, id) {
  const all = read(KEYS.logins) || {};
  const list = (all[learnerId] || []).filter((l) => l.id !== id);
  all[learnerId] = list;
  write(KEYS.logins, all);
  return list;
}

// ============================================================================
// Accountability partners
// ============================================================================
export async function getPartnerLinks() {
  return read(KEYS.partnerLinks) || [];
}

export async function getActivePartnerOf(learnerId) {
  const all = (await getPartnerLinks()).filter((l) => l.status === 'accepted');
  const mine = all.find((l) => l.proposerId === learnerId || l.partnerId === learnerId);
  if (!mine) return null;
  const partnerId = mine.proposerId === learnerId ? mine.partnerId : mine.proposerId;
  return { partnerId, linkId: mine.id };
}

export async function getPendingProposalsFor(learnerId) {
  const all = await getPartnerLinks();
  return all.filter((l) => l.partnerId === learnerId && l.status === 'proposed');
}

export async function proposePartner(proposerId, partnerId) {
  if (proposerId === partnerId) return null;
  if (await getActivePartnerOf(proposerId)) return null;
  if (await getActivePartnerOf(partnerId)) return null;
  const links = await getPartnerLinks();
  const existing = links.find(
    (l) => l.status === 'proposed'
      && ((l.proposerId === proposerId && l.partnerId === partnerId)
        || (l.proposerId === partnerId && l.partnerId === proposerId))
  );
  if (existing) return existing;
  const link = {
    id: generateId(),
    proposerId,
    partnerId,
    status: 'proposed',
    proposedAt: new Date().toISOString(),
  };
  links.push(link);
  write(KEYS.partnerLinks, links);
  return link;
}

export async function respondToPartnerProposal(linkId, accepted) {
  const links = await getPartnerLinks();
  const link = links.find((l) => l.id === linkId);
  if (!link || link.status !== 'proposed') return null;
  link.status = accepted ? 'accepted' : 'declined';
  link.respondedAt = new Date().toISOString();
  write(KEYS.partnerLinks, links);
  return link;
}

export async function dissolvePartnership(linkId) {
  const links = await getPartnerLinks();
  const link = links.find((l) => l.id === linkId);
  if (!link) return null;
  link.status = 'dissolved';
  link.dissolvedAt = new Date().toISOString();
  write(KEYS.partnerLinks, links);
  return link;
}

// Count items that need a learner's attention on the Partner page.
// Returns total of: pending proposals for them + year goals waiting for
// their approval. Used to drive the Partner tab's notification bell.
export async function getPartnerNotificationCount(learnerId) {
  const [pendingProposals, pendingApprovals, pendingPlans] = await Promise.all([
    getPendingProposalsFor(learnerId),
    getYearGoalPendingApprovals(learnerId),
    getPendingYearPlanFor(learnerId),
  ]);
  return pendingProposals.length + pendingApprovals.length + pendingPlans.length;
}

// ============================================================================
// Year-goal check-off flow
// ============================================================================
export async function getYearGoalPendingApprovals(partnerId) {
  const goals = read(KEYS.goals) || [];
  const result = [];
  for (const g of goals) {
    if (g.scope !== 'year' || g.status !== 'pending-approval') continue;
    const learnerPartner = await getActivePartnerOf(g.learnerId);
    if (learnerPartner?.partnerId === partnerId) result.push(g);
  }
  return result;
}

export async function markYearGoalPendingApproval(goalId) {
  const all = read(KEYS.goals) || [];
  const idx = all.findIndex((g) => g.id === goalId);
  if (idx < 0) return null;
  all[idx].status = 'pending-approval';
  all[idx].pendingApprovalAt = new Date().toISOString();
  write(KEYS.goals, all);
  return all[idx];
}

export async function approveYearGoal(goalId, approverId, note = '') {
  const all = read(KEYS.goals) || [];
  const idx = all.findIndex((g) => g.id === goalId);
  if (idx < 0) return null;
  all[idx].status = 'approved';
  all[idx].approval = {
    partnerId: approverId,
    approvedAt: new Date().toISOString(),
    note,
  };
  write(KEYS.goals, all);
  return all[idx];
}

export async function rejectYearGoal(goalId, approverId, note = '') {
  const all = read(KEYS.goals) || [];
  const idx = all.findIndex((g) => g.id === goalId);
  if (idx < 0) return null;
  all[idx].status = 'active';
  all[idx].lastRejection = {
    partnerId: approverId,
    rejectedAt: new Date().toISOString(),
    note,
  };
  write(KEYS.goals, all);
  return all[idx];
}

// ============================================================================
// Year plan submission - the full year plan goes to the partner for sign-off.
// Captain decision 2026-05-12.
//
// Shape: { id, learnerId, submittedAt, status: 'pending'|'approved'|'returned',
//          approverId, approvedAt, returnedAt, note }
// ============================================================================
export async function getYearPlans() {
  return read(KEYS.yearPlans) || [];
}

export async function submitYearPlan(learnerId) {
  const plans = await getYearPlans();
  // Cancel any prior pending plan for this learner
  plans.forEach((p) => {
    if (p.learnerId === learnerId && p.status === 'pending') {
      p.status = 'superseded';
    }
  });
  const plan = {
    id: generateId(),
    learnerId,
    submittedAt: new Date().toISOString(),
    status: 'pending',
  };
  plans.push(plan);
  write(KEYS.yearPlans, plans);
  return plan;
}

export async function getPendingYearPlanFor(partnerId) {
  // Returns any pending year plan whose learner's active partner is partnerId
  const plans = (await getYearPlans()).filter((p) => p.status === 'pending');
  const result = [];
  for (const p of plans) {
    const link = await getActivePartnerOf(p.learnerId);
    if (link?.partnerId === partnerId) result.push(p);
  }
  return result;
}

export async function approveYearPlan(planId, approverId, note = '') {
  const plans = await getYearPlans();
  const plan = plans.find((p) => p.id === planId);
  if (!plan || plan.status !== 'pending') return null;
  plan.status = 'approved';
  plan.approverId = approverId;
  plan.approvedAt = new Date().toISOString();
  plan.note = note;
  write(KEYS.yearPlans, plans);
  return plan;
}

export async function returnYearPlan(planId, approverId, note = '') {
  const plans = await getYearPlans();
  const plan = plans.find((p) => p.id === planId);
  if (!plan || plan.status !== 'pending') return null;
  plan.status = 'returned';
  plan.approverId = approverId;
  plan.returnedAt = new Date().toISOString();
  plan.note = note;
  write(KEYS.yearPlans, plans);
  return plan;
}

// ============================================================================
// Notifications - simple in-app dispatch.
// Shape: { id, recipientId, type, title, body, createdAt, readAt, fromId? }
// type: 'year-plan-approved' | 'milestone-shared' | 'goal-approved' |
//       'partner-proposal' | 'plan-returned' | etc.
// ============================================================================
export async function getNotifications(recipientId) {
  const all = read(KEYS.notifications) || [];
  return all.filter((n) => n.recipientId === recipientId);
}

export async function addNotification(notif) {
  const all = read(KEYS.notifications) || [];
  const { id: _ignored, ...rest } = notif;
  const record = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    readAt: null,
    ...rest,
  };
  all.push(record);
  write(KEYS.notifications, all);
  return record;
}

export async function markNotificationRead(id) {
  const all = read(KEYS.notifications) || [];
  const idx = all.findIndex((n) => n.id === id);
  if (idx >= 0) {
    all[idx].readAt = new Date().toISOString();
    write(KEYS.notifications, all);
  }
}

export async function getUnreadCount(recipientId) {
  const list = await getNotifications(recipientId);
  return list.filter((n) => !n.readAt).length;
}

// ============================================================================
// Tasks - per-learner, per-day
// ============================================================================
export async function getTasks(learnerId) {
  const all = read(KEYS.tasks) || {};
  return all[learnerId] || [];
}

export async function getTasksForDate(learnerId, isoDate) {
  const list = await getTasks(learnerId);
  return list.filter((t) => t.plannedFor === isoDate);
}

export async function getTasksForRange(learnerId, startISO, endISO) {
  const list = await getTasks(learnerId);
  return list.filter((t) => t.plannedFor >= startISO && t.plannedFor <= endISO);
}

export async function saveTask(learnerId, task) {
  // Destructure id out so an explicit `id: undefined` from openTaskModal
  // (when creating a new task) cannot wipe a freshly generated id via spread.
  // Same fix shape as saveGoal.
  const { id, ...rest } = task;
  const all = read(KEYS.tasks) || {};
  const list = all[learnerId] || [];
  if (id) {
    const idx = list.findIndex((t) => t.id === id);
    if (idx >= 0) list[idx] = { ...list[idx], ...rest, id, updatedAt: new Date().toISOString() };
    else list.push({ id, status: 'open', createdAt: new Date().toISOString(), ...rest });
  } else {
    list.push({
      id: generateId(),
      status: 'open',
      createdAt: new Date().toISOString(),
      ...rest,
    });
  }
  all[learnerId] = list;
  write(KEYS.tasks, all);
  return list;
}

export async function moveTask(learnerId, id, newPlannedFor) {
  const all = read(KEYS.tasks) || {};
  const list = all[learnerId] || [];
  const idx = list.findIndex((t) => t.id === id);
  if (idx >= 0) {
    list[idx].plannedFor = newPlannedFor;
    list[idx].updatedAt = new Date().toISOString();
  }
  all[learnerId] = list;
  write(KEYS.tasks, all);
  return list;
}

export async function toggleTaskDone(learnerId, id) {
  const all = read(KEYS.tasks) || {};
  const list = all[learnerId] || [];
  const idx = list.findIndex((t) => t.id === id);
  if (idx >= 0) {
    const isDone = list[idx].status === 'done';
    list[idx].status = isDone ? 'open' : 'done';
    list[idx].completedAt = isDone ? null : new Date().toISOString();
  }
  all[learnerId] = list;
  write(KEYS.tasks, all);
  return list;
}

export async function deleteTask(learnerId, id) {
  const all = read(KEYS.tasks) || {};
  const list = (all[learnerId] || []).filter((t) => t.id !== id);
  all[learnerId] = list;
  write(KEYS.tasks, all);
  return list;
}
