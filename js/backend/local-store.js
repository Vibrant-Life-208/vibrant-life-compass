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
  yearVisions: 'hc_year_visions',  // 1-year vision prompt (Captain pedagogy add 2026-05-13)
  yearTraits: 'hc_year_traits',  // same
  logins: 'hc_logins',
  tasks: 'hc_tasks',
  partnerLinks: 'hc_partner_links',
  parents: 'hc_parents',
  parentLearnerLinks: 'hc_parent_learner_links',
  families: 'hc_families',                 // [{id, name, username, passwordHash?, passwordSalt?, members:[...]}]
  familyUpdates: 'hc_family_updates',      // [{id, familyId, learnerId, kind, body, createdAt}] (v0.12)
  yearPlans: 'hc_year_plans',
  notifications: 'hc_notifications',
  profileAnchor: 'hc_profile_anchor',     // {id: {values:[], strengths:[]}} (v0.2 anchor)
  profileHorizons: 'hc_profile_horizons', // {id: {beyond_5yr,...}} (v0.3 cascade)
  onboarding: 'hc_onboarding',            // {id: {step, skipped, completedAt, updatedAt}}
  weeklyAnswers: 'hc_weekly_answers_v0',  // {learnerId|goalId|s{n}|w{n}: {text, kind, session, week}} — no timestamp (§5)
  thresholdAdditions: 'hc_threshold_additions_v0', // {learnerId: {thresholdId: {now, halfway}}} — child records, NEVER goal rows
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
  const learner = learners.find((l) => l.id === id);
  // Parity with the supabase adapter: openByChoice defaults to [] (Stage P3, dormant),
  // current_wheel_test defaults to false (v0.23). NB: local dev is always current-wheel via
  // the BACKEND_TYPE gate in isCurrentWheelBuild, so this value is not consulted locally - it
  // is carried only for adapter parity.
  if (learner) return {
    ...learner,
    openByChoice: Array.isArray(learner.openByChoice) ? learner.openByChoice : [],
    current_wheel_test: Boolean(learner.current_wheel_test),
  };
  // Guide-as-protagonist fallback (Captain 2026-05-15): when a guide is
  // signed in and their own id is being used as the protagonist id,
  // return the guide record with a synthetic studio so all the learner-
  // shaped rendering code (year-view, session-view, north, modals) works.
  const guides = read(KEYS.guides) || [];
  const guide = guides.find((g) => g.id === id);
  if (guide) {
    return {
      ...guide,
      studio: 'guide-summer',
      // Guides skip the first-run setup gate by being implicitly setup-complete
      setupCompletedAt: guide.setupCompletedAt || guide.createdAt || new Date().toISOString(),
      priorityGoalIds: guide.priorityGoalIds || [],
    };
  }
  return null;
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
// Families (one shared login per family; members are existing profiles)
// ============================================================================
export async function getFamily(familyId) {
  const families = read(KEYS.families) || [];
  return families.find((f) => f.id === familyId) || null;
}

export async function getFamilyByUsername(username) {
  const name = String(username || '').trim().toLowerCase();
  const families = read(KEYS.families) || [];
  return families.find((f) => (f.username || '').toLowerCase() === name) || null;
}

// Which family is this profile a member of? (for the owner's "My Family" + a
// learner resolving their family to share with.)
export async function getFamilyIdForProfile(profileId) {
  const families = read(KEYS.families) || [];
  const fam = families.find((f) => (f.members || []).some((m) => m.profileId === profileId));
  return fam ? fam.id : null;
}

// Family updates: learner-shared, receive-only feed (v0.12 local mirror).
export async function addFamilyUpdate(familyId, learnerId, kind, body) {
  const all = read(KEYS.familyUpdates) || [];
  all.push({ id: generateId(), familyId, learnerId, kind, body: String(body).slice(0, 500), createdAt: new Date().toISOString() });
  write(KEYS.familyUpdates, all);
}

export async function getFamilyUpdates(familyId) {
  const all = read(KEYS.familyUpdates) || [];
  const families = read(KEYS.families) || [];
  const fam = families.find((f) => f.id === familyId);
  const nameOf = (pid) => {
    const m = (fam?.members || []).find((x) => x.profileId === pid);
    return m ? (m.displayName || m.name) : 'A learner';
  };
  return all.filter((u) => u.familyId === familyId)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .map((u) => ({ ...u, learnerName: nameOf(u.learnerId) }));
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
import { verifyPassword as _verifyPasswordLocal, hashPassword as _hashPasswordLocal, generateTempPassword as _genTempLocal } from '../crypto.js';
export async function signInWithHeroName(heroName, password) {
  // Family logins first: a family username returns a family account whose
  // role drives auth.js into the member picker instead of a person session.
  const family = await getFamilyByUsername(heroName);
  if (family) {
    // Skeleton convenience: a seeded family without a hash accepts any password
    // (mirrors this file's "skeleton accepts any password" stance). When a hash
    // is present we verify it. Production auth runs server-side in Supabase.
    if (family.passwordHash && family.passwordSalt) {
      const ok = await _verifyPasswordLocal(password, {
        hash: family.passwordHash, salt: family.passwordSalt,
      });
      if (!ok) return null;
    }
    return { role: 'family', familyId: family.id, name: family.name, username: family.username };
  }
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
// Weekly answers (Stage M2 progressing answer; synced-storage parity with the
// supabase adapter — build plan Stage V / flip-checklist §3).
//
// One discrete record per (learner, goal, session, week). §5: get-one + save-one ONLY —
// there is deliberately no list / count / streak / trend reader, and NO timestamp is stored,
// so nothing can be aggregated over time. A weekly answer is a presence, not a metric.
// ============================================================================
function weeklyAnswerKey(learnerId, goalId, session, week) {
  return `${learnerId}|${goalId}|s${session}|w${week}`;
}

export async function getWeeklyAnswer(learnerId, goalId, session, week) {
  if (!learnerId || !goalId) return null;
  const map = read(KEYS.weeklyAnswers) || {};
  return map[weeklyAnswerKey(learnerId, goalId, session, week)] || null;
}

export async function saveWeeklyAnswer(learnerId, { goalId, session, week, kind = 'finish', text = '' }) {
  if (!learnerId || !goalId) return;
  const map = read(KEYS.weeklyAnswers) || {};
  const k = weeklyAnswerKey(learnerId, goalId, session, week);
  const trimmed = (text || '').trim();
  if (!trimmed) { delete map[k]; }                            // blank clears — an answer withdrawn, not a zero
  else { map[k] = { text: trimmed, kind, session, week }; }   // no timestamp — §5
  write(KEYS.weeklyAnswers, map);
}

// ============================================================================
// Threshold additions (Stage O goals-as-cards; behind CURRENT_WHEEL_BUILD).
//
// A learner's "where you are now" / "halfway point" for a CARRIED THRESHOLD, stored as a
// child record keyed to the threshold id (Geordi's projection rule). This is NEVER a goal
// row: a carried threshold stays read-only to the system (La'an's write-wall) while the
// learner can attach their own detail to it. Keyed learnerId -> { thresholdId: {now, halfway} }.
// ============================================================================
export async function getThresholdAdditions(learnerId) {
  const all = read(KEYS.thresholdAdditions) || {};
  return all[learnerId] || {};
}

export async function saveThresholdAdditions(learnerId, additions) {
  if (!learnerId || !additions) return;
  const all = read(KEYS.thresholdAdditions) || {};
  all[learnerId] = { ...(all[learnerId] || {}), ...additions };
  write(KEYS.thresholdAdditions, all);
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
  const v = all[identityId];
  // Back-compat: legacy entries are plain strings; v0.4 entries are {text, cycle}.
  return typeof v === 'string' ? v : (v?.text || '');
}

export async function setYearQuote(identityId, text, cycle) {
  const all = read(KEYS.yearQuotes) || {};
  const prev = all[identityId];
  const prevCycle = typeof prev === 'string' ? '' : (prev?.cycle || '');
  all[identityId] = { text, cycle: cycle !== undefined ? cycle : prevCycle };
  write(KEYS.yearQuotes, all);
}

export async function getQuoteState(identityId) {
  const all = read(KEYS.yearQuotes) || {};
  const v = all[identityId];
  if (typeof v === 'string') return { text: v, author: '', note: '', cycle: '' };
  return { text: v?.text || '', author: v?.author || '', note: v?.note || '', cycle: v?.cycle || '' };
}

export async function setQuoteAnchor(identityId, { text = '', author = '', note = '', cycle } = {}) {
  const all = read(KEYS.yearQuotes) || {};
  const prev = all[identityId];
  const prevCycle = typeof prev === 'string' ? '' : (prev?.cycle || '');
  all[identityId] = { text, author, note, cycle: cycle !== undefined ? cycle : prevCycle };
  write(KEYS.yearQuotes, all);
}

// ============================================================================
// Year vision per learner — "a year from now, who do you see?"
// Pedagogy addition 2026-05-13: anchor for the protagonist statement above
// the per-category goals. Visible to learner + their parents + their partner.
// ============================================================================
export async function getYearVision(identityId) {
  const all = read(KEYS.yearVisions) || {};
  return all[identityId] || '';
}

export async function setYearVision(identityId, text) {
  const all = read(KEYS.yearVisions) || {};
  all[identityId] = text;
  write(KEYS.yearVisions, all);
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
  // Also count unread incoming partner check-ins.
  const allNotifs = read(KEYS.notifications) || [];
  const unreadCheckins = allNotifs.filter(
    (n) => n.recipientId === learnerId && n.type === 'partner-checkin' && !n.readAt
  ).length;
  return pendingProposals.length + pendingApprovals.length + pendingPlans.length + unreadCheckins;
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

// ============================================================================
// v0.2 anchor + v0.3 onboarding (local mirror of the supabase-adapter API, so
// the barrel's destructured exports are all defined in local/skeleton mode).
// ============================================================================

export async function getProfileValues(id) {
  const all = read(KEYS.profileAnchor) || {};
  return all[id]?.values || [];
}
export async function setProfileValues(id, valueIds) {
  const all = read(KEYS.profileAnchor) || {};
  all[id] = { ...(all[id] || {}), values: valueIds };
  write(KEYS.profileAnchor, all);
}
export async function getProfileStrengths(id) {
  const all = read(KEYS.profileAnchor) || {};
  return all[id]?.strengths || [];
}
export async function setProfileStrengths(id, strengthIds) {
  const all = read(KEYS.profileAnchor) || {};
  all[id] = { ...(all[id] || {}), strengths: strengthIds };
  write(KEYS.profileAnchor, all);
}

// Minimal reference vocabularies for skeleton review (production reads Supabase).
export async function getValuesLexicon() {
  return [
    { id: 'truth', display_label_adult: 'Truth', sort_order: 1 },
    { id: 'love', display_label_adult: 'Love', sort_order: 2 },
    { id: 'courage', display_label_adult: 'Courage', sort_order: 3 },
    { id: 'kindness', display_label_adult: 'Kindness', sort_order: 4 },
    { id: 'unity', display_label_adult: 'Unity', sort_order: 5 },
  ];
}
export async function getViaCharacterStrengths() {
  // Full VIA 24 (mirrors the production seed) so skeleton/dev resolves all labels.
  return [
    { id: 'creativity', virtue_category: 'Wisdom & Knowledge', display_label_adult: 'Creativity', sort_order: 1 },
    { id: 'curiosity', virtue_category: 'Wisdom & Knowledge', display_label_adult: 'Curiosity', sort_order: 2 },
    { id: 'judgment', virtue_category: 'Wisdom & Knowledge', display_label_adult: 'Judgment', sort_order: 3 },
    { id: 'love_of_learning', virtue_category: 'Wisdom & Knowledge', display_label_adult: 'Love of Learning', sort_order: 4 },
    { id: 'perspective', virtue_category: 'Wisdom & Knowledge', display_label_adult: 'Perspective', sort_order: 5 },
    { id: 'bravery', virtue_category: 'Courage', display_label_adult: 'Bravery', sort_order: 6 },
    { id: 'perseverance', virtue_category: 'Courage', display_label_adult: 'Perseverance', sort_order: 7 },
    { id: 'honesty', virtue_category: 'Courage', display_label_adult: 'Honesty', sort_order: 8 },
    { id: 'zest', virtue_category: 'Courage', display_label_adult: 'Zest', sort_order: 9 },
    { id: 'love', virtue_category: 'Humanity', display_label_adult: 'Love', sort_order: 10 },
    { id: 'kindness', virtue_category: 'Humanity', display_label_adult: 'Kindness', sort_order: 11 },
    { id: 'social_intelligence', virtue_category: 'Humanity', display_label_adult: 'Social Intelligence', sort_order: 12 },
    { id: 'teamwork', virtue_category: 'Justice', display_label_adult: 'Teamwork', sort_order: 13 },
    { id: 'fairness', virtue_category: 'Justice', display_label_adult: 'Fairness', sort_order: 14 },
    { id: 'leadership', virtue_category: 'Justice', display_label_adult: 'Leadership', sort_order: 15 },
    { id: 'forgiveness', virtue_category: 'Temperance', display_label_adult: 'Forgiveness', sort_order: 16 },
    { id: 'humility', virtue_category: 'Temperance', display_label_adult: 'Humility', sort_order: 17 },
    { id: 'prudence', virtue_category: 'Temperance', display_label_adult: 'Prudence', sort_order: 18 },
    { id: 'self_regulation', virtue_category: 'Temperance', display_label_adult: 'Self-Regulation', sort_order: 19 },
    { id: 'appreciation_of_beauty', virtue_category: 'Transcendence', display_label_adult: 'Appreciation of Beauty & Excellence', sort_order: 20 },
    { id: 'gratitude', virtue_category: 'Transcendence', display_label_adult: 'Gratitude', sort_order: 21 },
    { id: 'hope', virtue_category: 'Transcendence', display_label_adult: 'Hope', sort_order: 22 },
    { id: 'humor', virtue_category: 'Transcendence', display_label_adult: 'Humor', sort_order: 23 },
    { id: 'spirituality', virtue_category: 'Transcendence', display_label_adult: 'Spirituality', sort_order: 24 },
  ];
}

export async function hasCompletedAnchor(id) {
  const q = await getYearQuote(id);
  const values = await getProfileValues(id);
  const strengths = await getProfileStrengths(id);
  return Boolean(q) && values.length === 3 && strengths.length === 3;
}

export async function getProfileHorizons(id) {
  const all = read(KEYS.profileHorizons) || {};
  const h = all[id] || {};
  return {
    beyond_5yr: h.beyond_5yr || '',
    within_5yr: h.within_5yr || '',
    within_1yr: h.within_1yr || '',
    current_state: h.current_state || '',
    halfway: h.halfway || '',
  };
}
export async function setProfileHorizon(id, stepKey, text) {
  const all = read(KEYS.profileHorizons) || {};
  all[id] = { ...(all[id] || {}), [stepKey]: text };
  write(KEYS.profileHorizons, all);
}

export async function getOnboardingState(id) {
  const all = read(KEYS.onboarding) || {};
  const o = all[id] || {};
  return {
    step: o.step || 'breath',
    skipped: Array.isArray(o.skipped) ? o.skipped : [],
    completedAt: o.completedAt || null,
    updatedAt: o.updatedAt || null,
  };
}
export async function setOnboardingStep(id, step) {
  const all = read(KEYS.onboarding) || {};
  all[id] = { ...(all[id] || {}), step, updatedAt: new Date().toISOString() };
  write(KEYS.onboarding, all);
}
export async function markOnboardingStepSkipped(id, step) {
  const all = read(KEYS.onboarding) || {};
  const o = all[id] || {};
  const skipped = Array.isArray(o.skipped) ? o.skipped : [];
  if (!skipped.includes(step)) skipped.push(step);
  all[id] = { ...o, skipped, updatedAt: new Date().toISOString() };
  write(KEYS.onboarding, all);
  return skipped;
}
export async function completeOnboarding(id) {
  const all = read(KEYS.onboarding) || {};
  const now = new Date().toISOString();
  all[id] = { ...(all[id] || {}), step: 'complete', completedAt: now, updatedAt: now };
  write(KEYS.onboarding, all);
}
export async function hasCompletedOnboarding(id) {
  const all = read(KEYS.onboarding) || {};
  return Boolean(all[id]?.completedAt);
}

// Guide insights: local mirror of the anchor_aggregates() RPC. Same row shape
// {scope, scope_key, kind, item_id, label, cnt, group_size}. Counts only.
export async function getAnchorAggregates() {
  const MIN = 5;
  const anchors = read(KEYS.profileAnchor) || {};
  const learners = read(KEYS.learners) || [];
  const studioOf = {};
  learners.forEach((l) => { studioOf[l.id] = l.studio; });
  const valuesLex = await getValuesLexicon();
  const strengthLex = await getViaCharacterStrengths();
  // kind -> { lexicon, source-array-getter } (mirrors the v0.8 RPC)
  const KINDS = {
    value: { lex: valuesLex, get: (m) => m.values },
    strength_top: { lex: strengthLex, get: (m) => (m.top8.length ? m.top8 : m.values_strengths) },
    strength_bottom: { lex: strengthLex, get: (m) => m.bottom8 },
  };
  const entries = Object.entries(anchors).map(([id, a]) => ({
    id,
    studio: studioOf[id] || null,
    values: Array.isArray(a.values) ? a.values : [],
    values_strengths: Array.isArray(a.strengths) ? a.strengths : [], // manual top-3
    top8: Array.isArray(a.top8) ? a.top8 : [],
    bottom8: Array.isArray(a.bottom8) ? a.bottom8 : [],
  })).filter((e) => e.values.length || e.top8.length || e.values_strengths.length);

  const rows = [];
  const buildScope = (scope, scopeKey, members) => {
    const groupSize = members.length;
    if (groupSize < MIN) return;
    for (const [kind, def] of Object.entries(KINDS)) {
      const counts = {};
      def.lex.forEach((it) => { counts[it.id] = 0; });
      members.forEach((m) => { (def.get(m) || []).forEach((itemId) => { if (itemId in counts) counts[itemId] += 1; }); });
      def.lex.forEach((it) => {
        rows.push({ scope, scope_key: scopeKey, kind, item_id: it.id, label: it.display_label_adult, cnt: counts[it.id], group_size: groupSize });
      });
    }
  };
  buildScope('school', null, entries);
  const studios = [...new Set(entries.map((e) => e.studio).filter(Boolean))];
  studios.forEach((st) => buildScope('studio', st, entries.filter((e) => e.studio === st)));
  return rows;
}

// Strength ranking (top 8 / bottom 8) - local mirror. Keeps strengths (top 3) in sync.
export async function setStrengthRanking(identityId, { top8 = [], bottom8 = [] } = {}) {
  const all = read(KEYS.profileAnchor) || {};
  all[identityId] = { ...(all[identityId] || {}), strengths: top8.slice(0, 3), top8, bottom8 };
  write(KEYS.profileAnchor, all);
}

export async function getStrengthRanking(identityId) {
  const all = read(KEYS.profileAnchor) || {};
  const a = all[identityId] || {};
  return { top8: a.top8 || [], bottom8: a.bottom8 || [], top3: a.strengths || [] };
}

// Set a new password for the signed-in person. In local mode the PBKDF2
// hash IS the credential store (unlike Supabase, where Auth owns it), so this
// writes a real hash to the account record, clears must_change_password there,
// and clears it on the session. Resolves the account BY ROLE - never off
// session.learnerId for a parent, since a parent session also carries the
// linked child's learnerId (that would reset the child's password by mistake).
export async function updatePassword(newPassword) {
  const session = read(KEYS.session);
  if (!session) return;
  const hashed = await _hashPasswordLocal(newPassword);
  const patch = (id) => ({ id, passwordHash: hashed.hash, passwordSalt: hashed.salt, must_change_password: false });
  if (session.role === 'learner' && session.learnerId) await saveLearner(patch(session.learnerId));
  else if (session.role === 'parent' && session.parentId) await saveParent(patch(session.parentId));
  else if (session.role === 'guide' && session.guideId) await saveGuide(patch(session.guideId));
  session.must_change_password = false;
  write(KEYS.session, session);
}

// Guide/owner-run password reset (local mode). Generates a fresh temp password,
// writes its hash to the account, and flags must_change_password so the person
// is forced to set their own on next sign-in. Returns the plaintext temp once,
// for the guide to hand over. Resolves the collection by role.
export async function resetPassword(role, accountId) {
  if (!accountId) return null;
  const tempPassword = _genTempLocal();
  const hashed = await _hashPasswordLocal(tempPassword);
  const patch = { id: accountId, passwordHash: hashed.hash, passwordSalt: hashed.salt, must_change_password: true };
  if (role === 'learner') await saveLearner(patch);
  else if (role === 'parent') await saveParent(patch);
  else if (role === 'guide') await saveGuide(patch);
  else return null;
  return { tempPassword };
}

// Typed values + archetype (older learners + adults) - local mirror.
export async function setValuesFreetext(identityId, { values = [], archetype = '' } = {}) {
  const all = read(KEYS.profileAnchor) || {};
  all[identityId] = { ...(all[identityId] || {}), valuesFreetext: values, valuesArchetype: archetype };
  write(KEYS.profileAnchor, all);
}
export async function getValuesFreetext(identityId) {
  const all = read(KEYS.profileAnchor) || {};
  const a = all[identityId] || {};
  return { values: a.valuesFreetext || [], archetype: a.valuesArchetype || '' };
}
