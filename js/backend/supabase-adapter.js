// Supabase adapter - mirrors the store.js API in async form.
// Activated by switching BACKEND_TYPE in config.js to 'supabase'.
// The schema this adapter expects is in /supabase/schema.sql.
//
// This module imports the Supabase JS client at runtime to avoid a hard
// dependency at skeleton time. When activated, add to index.html:
//   <script type="module">
//     import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
//     window.__supabaseCreateClient = createClient;
//   </script>
//
// Or use a bundler. The skeleton stays on local; this file becomes live
// only when BACKEND_TYPE === 'supabase'.

import { SUPABASE_CONFIG } from './config.js';

let client = null;

function getClient() {
  if (client) return client;
  if (typeof window === 'undefined' || !window.__supabaseCreateClient) {
    throw new Error('Supabase client not loaded. See supabase-adapter.js header.');
  }
  if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
    throw new Error('Supabase URL and anonKey must be set in config.js.');
  }
  client = window.__supabaseCreateClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  return client;
}

// Helper: get the current authenticated learner's UUID.
async function currentUserId() {
  const { data } = await getClient().auth.getUser();
  return data?.user?.id || null;
}

// ============================================================================
// Session / auth
// ============================================================================
export async function getSession() {
  const c = getClient();
  const { data } = await c.auth.getSession();
  if (!data?.session) return null;
  const userId = data.session.user.id;
  const { data: profile } = await c.from('profiles').select('*').eq('id', userId).single();
  return profile ? { ...profile, learnerId: profile.role === 'learner' ? userId : null } : null;
}

export async function signOut() {
  await getClient().auth.signOut();
}

// ============================================================================
// Learners
// ============================================================================
export async function getLearners() {
  const { data, error } = await getClient().from('learners').select('id, studio, profiles(name, email)');
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    name: row.profiles?.name,
    email: row.profiles?.email,
    studio: row.studio,
  }));
}

export async function getLearner(id) {
  const { data, error } = await getClient()
    .from('learners')
    .select('id, studio, profiles(name, email)')
    .eq('id', id)
    .single();
  if (error) return null;
  return { id: data.id, name: data.profiles?.name, email: data.profiles?.email, studio: data.studio };
}

// ============================================================================
// Year quote / traits
// ============================================================================
export async function getYearQuote(learnerId) {
  const { data } = await getClient().from('year_quotes').select('text').eq('learner_id', learnerId).single();
  return data?.text || '';
}

export async function setYearQuote(learnerId, text) {
  await getClient().from('year_quotes').upsert({ learner_id: learnerId, text });
}

export async function getYearTraits(learnerId) {
  const { data } = await getClient().from('year_traits').select('traits').eq('learner_id', learnerId).single();
  return data?.traits || [];
}

export async function setYearTraits(learnerId, traits) {
  await getClient().from('year_traits').upsert({ learner_id: learnerId, traits });
}

// ============================================================================
// Goals
// ============================================================================
export async function getGoals(learnerId) {
  const { data } = await getClient().from('goals').select('*').eq('learner_id', learnerId);
  return (data || []).map(rowToGoal);
}

export async function saveGoal(goal) {
  const row = goalToRow(goal);
  if (goal.id) {
    await getClient().from('goals').update(row).eq('id', goal.id);
  } else {
    const { data } = await getClient().from('goals').insert(row).select().single();
    return data ? rowToGoal(data) : null;
  }
}

function rowToGoal(row) {
  return {
    id: row.id,
    learnerId: row.learner_id,
    categoryId: row.category_id,
    scope: row.scope,
    sessionIndex: row.session_index,
    text: row.text,
    status: row.status,
    createdAt: row.created_at,
  };
}

function goalToRow(goal) {
  return {
    learner_id: goal.learnerId,
    category_id: goal.categoryId,
    scope: goal.scope,
    session_index: goal.sessionIndex || null,
    text: goal.text,
    status: goal.status || 'active',
  };
}

// ============================================================================
// Tasks
// ============================================================================
export async function getTasks(learnerId) {
  const { data } = await getClient().from('tasks').select('*').eq('learner_id', learnerId);
  return (data || []).map(rowToTask);
}

export async function getTasksForDate(learnerId, isoDate) {
  const { data } = await getClient().from('tasks').select('*')
    .eq('learner_id', learnerId).eq('planned_for', isoDate);
  return (data || []).map(rowToTask);
}

export async function getTasksForRange(learnerId, startISO, endISO) {
  const { data } = await getClient().from('tasks').select('*')
    .eq('learner_id', learnerId).gte('planned_for', startISO).lte('planned_for', endISO);
  return (data || []).map(rowToTask);
}

export async function saveTask(learnerId, task) {
  const row = {
    learner_id: learnerId,
    text: task.text,
    planned_for: task.plannedFor,
    goal_id: task.goalId || null,
    category_id: task.categoryId || null,
    status: task.status || 'open',
  };
  if (task.id && !task.id.startsWith('hc_')) {
    await getClient().from('tasks').update(row).eq('id', task.id);
  } else {
    await getClient().from('tasks').insert(row);
  }
}

export async function moveTask(learnerId, id, newPlannedFor) {
  await getClient().from('tasks').update({ planned_for: newPlannedFor }).eq('id', id);
}

export async function toggleTaskDone(learnerId, id) {
  // Read current state, flip it
  const { data: task } = await getClient().from('tasks').select('status').eq('id', id).single();
  const newStatus = task?.status === 'done' ? 'open' : 'done';
  await getClient().from('tasks').update({
    status: newStatus,
    completed_at: newStatus === 'done' ? new Date().toISOString() : null,
  }).eq('id', id);
}

export async function deleteTask(learnerId, id) {
  await getClient().from('tasks').delete().eq('id', id);
}

function rowToTask(row) {
  return {
    id: row.id,
    learnerId: row.learner_id,
    text: row.text,
    plannedFor: row.planned_for,
    goalId: row.goal_id,
    categoryId: row.category_id,
    status: row.status,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}

// ============================================================================
// Logins (passwords - ciphertext only crosses the wire)
// ============================================================================
export async function getLogins(learnerId) {
  const { data } = await getClient().from('logins').select('*').eq('learner_id', learnerId);
  return (data || []).map(rowToLogin);
}

export async function saveLogin(learnerId, login) {
  // Encryption must happen client-side BEFORE this call.
  // The adapter expects login.password as { ct, iv } already.
  const row = {
    learner_id: learnerId,
    kind: login.kind || 'core',
    service: login.service,
    username: login.username || '',
    password_ct: login.password?.ct || '',
    password_iv: login.password?.iv || '',
    url: login.url || '',
    note: login.note || '',
  };
  if (login.id) {
    await getClient().from('logins').update(row).eq('id', login.id);
  } else {
    await getClient().from('logins').insert(row);
  }
}

export async function deleteLogin(learnerId, id) {
  await getClient().from('logins').delete().eq('id', id);
}

function rowToLogin(row) {
  return {
    id: row.id,
    learnerId: row.learner_id,
    kind: row.kind,
    service: row.service,
    username: row.username,
    password: { ct: row.password_ct, iv: row.password_iv },
    url: row.url,
    note: row.note,
    createdAt: row.created_at,
  };
}

// ============================================================================
// Everyone posts
// ============================================================================
export async function getPosts() {
  const { data } = await getClient().from('everyone_posts')
    .select('*').eq('status', 'published').order('created_at', { ascending: false });
  return data || [];
}

export async function addPost(post) {
  const row = {
    author_role: post.authorRole,
    author_name: post.authorName,
    body: post.body,
    status: post.authorRole === 'guide' ? 'published' : 'pending',
  };
  await getClient().from('everyone_posts').insert(row);
}

// ============================================================================
// Session (Supabase Auth handles tokens via cookies; we keep API parity).
// ============================================================================
export async function setSession(_session) {
  // Supabase Auth manages the session itself after signInWithPassword.
  // This is a no-op kept for API parity with localStorage.
}

export async function clearSession() {
  await getClient().auth.signOut();
}

// ============================================================================
// Authentication: hero-name + temp password -> Supabase Auth signIn.
// Synthetic email pattern: `${heroName}@vibrantlife.local` (never sent,
// never visible to the user).
// ============================================================================
const SYNTH_EMAIL_DOMAIN = 'vibrantlife.local';

function heroEmail(heroName) {
  return `${String(heroName).trim().toLowerCase()}@${SYNTH_EMAIL_DOMAIN}`;
}

export async function signInWithHeroName(heroName, password) {
  const email = heroEmail(heroName);
  const { data, error } = await getClient().auth.signInWithPassword({ email, password });
  if (error || !data?.session) return null;
  const userId = data.session.user.id;
  const { data: profile } = await getClient().from('profiles').select('*').eq('id', userId).single();
  return profile ? { ...profile, id: userId } : null;
}

// ============================================================================
// Account lookup (read-only). Used by guide-side admin tools.
// Auth-bypass path: a guide signed in has read access via RLS.
// ============================================================================
export async function findAccountByHeroName(heroName) {
  const email = heroEmail(heroName);
  const { data } = await getClient().from('profiles').select('*').eq('email', email).single();
  return data || null;
}

// ============================================================================
// Account creation (admin tool). Bulk-import flow:
//   For each row: signUp -> creates auth.users + auto-signs-in -> insert
//   profile + learner/parent/guide rows -> signOut -> next row. At the end,
//   the captain signs back in as guide.
//
// Supabase Auth must have email confirmation DISABLED in project settings
// (Authentication -> Providers -> Email -> Confirm email = off).
// ============================================================================
async function adminCreateAccount({ heroName, password, role, name, studio }) {
  const c = getClient();
  const email = heroEmail(heroName);
  const { data, error } = await c.auth.signUp({ email, password });
  if (error || !data?.user) throw error || new Error('signUp failed');
  const userId = data.user.id;
  // After signUp the new user is auto-signed-in. Insert their profile row
  // (RLS profiles_self: id = auth.uid() permits this).
  await c.from('profiles').insert({
    id: userId, role, name: name || heroName, email,
  });
  if (role === 'learner') {
    await c.from('learners').insert({ id: userId, studio: studio || 'adventure' });
  }
  return userId;
}

// ============================================================================
// Learners (update path; create goes through adminCreateAccount above)
// ============================================================================
export async function saveLearner(data) {
  if (!data.id) {
    // Not used in normal flows - new learners come via adminCreateAccount.
    throw new Error('saveLearner without id is not supported in supabase backend');
  }
  const learnerRow = {};
  if (data.studio !== undefined) learnerRow.studio = data.studio;
  if (Object.keys(learnerRow).length > 0) {
    await getClient().from('learners').update(learnerRow).eq('id', data.id);
  }
  const profileRow = {};
  if (data.name !== undefined) profileRow.name = data.name;
  if (Object.keys(profileRow).length > 0) {
    await getClient().from('profiles').update(profileRow).eq('id', data.id);
  }
}

// ============================================================================
// Parents
// ============================================================================
export async function getParents() {
  const { data } = await getClient().from('profiles').select('*').eq('role', 'parent');
  return (data || []).map((p) => ({ id: p.id, name: p.name, email: p.email, heroName: p.email?.split('@')[0] }));
}

export async function saveParent(data) {
  if (!data.id) throw new Error('saveParent without id is not supported in supabase backend');
  const profileRow = {};
  if (data.name !== undefined) profileRow.name = data.name;
  if (Object.keys(profileRow).length > 0) {
    await getClient().from('profiles').update(profileRow).eq('id', data.id);
  }
}

export async function getParentLearnerLinks() {
  const { data } = await getClient().from('parent_learner_link').select('*');
  return (data || []).map((l) => ({ parentId: l.parent_id, learnerId: l.learner_id, createdAt: l.created_at }));
}

export async function linkParentToLearner(parentId, learnerId) {
  await getClient().from('parent_learner_link').upsert({ parent_id: parentId, learner_id: learnerId });
}

// ============================================================================
// Guides
// ============================================================================
export async function getGuides() {
  const { data } = await getClient().from('profiles').select('*').eq('role', 'guide');
  return (data || []).map((g) => ({ id: g.id, name: g.name, email: g.email, heroName: g.email?.split('@')[0] }));
}

export async function getGuide(id) {
  const { data } = await getClient().from('profiles').select('*').eq('id', id).eq('role', 'guide').single();
  return data ? { id: data.id, name: data.name, email: data.email, heroName: data.email?.split('@')[0] } : null;
}

export async function saveGuide(data) {
  if (!data.id) throw new Error('saveGuide without id is not supported in supabase backend');
  const profileRow = {};
  if (data.name !== undefined) profileRow.name = data.name;
  if (Object.keys(profileRow).length > 0) {
    await getClient().from('profiles').update(profileRow).eq('id', data.id);
  }
}

// ============================================================================
// Check-ins
// ============================================================================
export async function getCheckIns(learnerId) {
  const { data } = await getClient().from('check_ins').select('*').eq('learner_id', learnerId);
  return (data || []).map((c) => ({
    id: c.id, learnerId: c.learner_id, goalId: c.goal_id,
    sessionIndex: c.session_index, mark: c.mark, note: c.note, createdAt: c.created_at,
  }));
}

export async function addCheckIn(checkIn) {
  const row = {
    learner_id: checkIn.learnerId,
    goal_id: checkIn.goalId || null,
    session_index: checkIn.sessionIndex || null,
    mark: checkIn.mark || null,
    note: checkIn.note || null,
  };
  const { data } = await getClient().from('check_ins').insert(row).select().single();
  return data;
}

// ============================================================================
// Logins (reveal)
// ============================================================================
export async function revealLoginPassword(learnerId, id) {
  const { data: row } = await getClient().from('logins').select('*').eq('id', id).single();
  if (!row) return null;
  const envelope = { ct: row.password_ct, iv: row.password_iv };
  // Decrypt happens in the caller using the learner's local key (per Decision 4).
  return envelope;
}

// ============================================================================
// Partner links (T6 accountability partnerships)
// ============================================================================
function rowToLink(row) {
  return {
    id: row.id,
    proposerId: row.proposer_id,
    partnerId: row.partner_id,
    status: row.status,
    proposedAt: row.proposed_at,
    respondedAt: row.responded_at,
    dissolvedAt: row.dissolved_at,
  };
}

export async function getPartnerLinks() {
  const { data } = await getClient().from('partner_links').select('*');
  return (data || []).map(rowToLink);
}

export async function getActivePartnerOf(learnerId) {
  const { data } = await getClient().from('partner_links').select('*')
    .eq('status', 'accepted')
    .or(`proposer_id.eq.${learnerId},partner_id.eq.${learnerId}`);
  if (!data || data.length === 0) return null;
  const link = data[0];
  const partnerId = link.proposer_id === learnerId ? link.partner_id : link.proposer_id;
  return { linkId: link.id, partnerId };
}

export async function getPendingProposalsFor(learnerId) {
  const { data } = await getClient().from('partner_links').select('*')
    .eq('partner_id', learnerId).eq('status', 'proposed');
  return (data || []).map(rowToLink);
}

export async function proposePartner(proposerId, partnerId) {
  if (proposerId === partnerId) return null;
  // Reject if either party already has an active partner.
  if (await getActivePartnerOf(proposerId)) return null;
  if (await getActivePartnerOf(partnerId)) return null;
  // Reject duplicate pending proposals in either direction.
  const { data: existing } = await getClient().from('partner_links').select('*')
    .eq('status', 'proposed')
    .or(`and(proposer_id.eq.${proposerId},partner_id.eq.${partnerId}),and(proposer_id.eq.${partnerId},partner_id.eq.${proposerId})`);
  if (existing && existing.length > 0) return rowToLink(existing[0]);
  const { data } = await getClient().from('partner_links').insert({
    proposer_id: proposerId, partner_id: partnerId, status: 'proposed',
  }).select().single();
  return data ? rowToLink(data) : null;
}

export async function respondToPartnerProposal(linkId, accepted) {
  const status = accepted ? 'accepted' : 'declined';
  const { data } = await getClient().from('partner_links').update({
    status, responded_at: new Date().toISOString(),
  }).eq('id', linkId).eq('status', 'proposed').select().single();
  return data ? rowToLink(data) : null;
}

export async function dissolvePartnership(linkId) {
  const { data } = await getClient().from('partner_links').update({
    status: 'dissolved', dissolved_at: new Date().toISOString(),
  }).eq('id', linkId).select().single();
  return data ? rowToLink(data) : null;
}

export async function getPartnerNotificationCount(learnerId) {
  const [pendingProposals, pendingPlans] = await Promise.all([
    getPendingProposalsFor(learnerId),
    getPendingYearPlanFor(learnerId),
  ]);
  // Year-goal pending approvals omitted in v1 (feature not yet wired through supabase).
  return pendingProposals.length + pendingPlans.length;
}

// ============================================================================
// Year-goal approvals (v1 stub - returns empty; T8 share-this-win path
// doesn't depend on this; full approval flow can land in v1.1)
// ============================================================================
export async function getYearGoalPendingApprovals(_partnerId) {
  return [];
}

export async function markYearGoalPendingApproval(_goalId, _partnerId) {
  // No-op in v1.
}

export async function approveYearGoal(_goalId, _approverId) {
  // No-op in v1.
}

export async function rejectYearGoal(_goalId, _approverId, _note) {
  // No-op in v1.
}

// ============================================================================
// Year plans
// ============================================================================
function rowToPlan(row) {
  return {
    id: row.id,
    learnerId: row.learner_id,
    status: row.status,
    submittedAt: row.submitted_at,
    approverId: row.approver_id,
    approvedAt: row.approved_at,
    note: row.note || '',
  };
}

export async function getYearPlans() {
  const { data } = await getClient().from('year_plans').select('*');
  return (data || []).map(rowToPlan);
}

export async function submitYearPlan(learnerId) {
  const c = getClient();
  // Supersede any prior pending plan for this learner.
  await c.from('year_plans').update({ status: 'superseded' })
    .eq('learner_id', learnerId).eq('status', 'pending');
  const { data } = await c.from('year_plans').insert({
    learner_id: learnerId, status: 'pending',
  }).select().single();
  return data ? rowToPlan(data) : null;
}

export async function getPendingYearPlanFor(partnerId) {
  // Returns pending plans whose learner is partnered with partnerId.
  const c = getClient();
  const { data: pending } = await c.from('year_plans').select('*').eq('status', 'pending');
  if (!pending || pending.length === 0) return [];
  const result = [];
  for (const plan of pending) {
    const partner = await getActivePartnerOf(plan.learner_id);
    if (partner?.partnerId === partnerId) result.push(rowToPlan(plan));
  }
  return result;
}

export async function approveYearPlan(planId, approverId, note = '') {
  const { data } = await getClient().from('year_plans').update({
    status: 'approved', approver_id: approverId, approved_at: new Date().toISOString(), note,
  }).eq('id', planId).select().single();
  // Fire-and-forget the parent + guide notifications (mirrors local-store).
  if (data) await dispatchYearPlanApprovedNotifications(data.learner_id);
  return data ? rowToPlan(data) : null;
}

export async function returnYearPlan(planId, approverId, note = '') {
  const { data } = await getClient().from('year_plans').update({
    status: 'returned', approver_id: approverId, approved_at: new Date().toISOString(), note,
  }).eq('id', planId).select().single();
  return data ? rowToPlan(data) : null;
}

async function dispatchYearPlanApprovedNotifications(learnerId) {
  const c = getClient();
  const { data: learner } = await c.from('profiles').select('name').eq('id', learnerId).single();
  const learnerName = learner?.name || 'A learner';
  // Find parents linked to this learner
  const { data: parentLinks } = await c.from('parent_learner_link').select('parent_id').eq('learner_id', learnerId);
  // Find guides assigned to this learner
  const { data: guideLinks } = await c.from('guide_learner_assignment').select('guide_id').eq('learner_id', learnerId);
  const recipients = [
    ...(parentLinks || []).map((p) => p.parent_id),
    ...(guideLinks || []).map((g) => g.guide_id),
  ];
  for (const rid of recipients) {
    await c.from('notifications').insert({
      recipient_id: rid,
      type: 'year-plan-approved',
      title: 'Year plan approved',
      body: `${learnerName}'s year plan has been signed off by their accountability partner.`,
    });
  }
}

// ============================================================================
// Notifications
// ============================================================================
function rowToNotif(row) {
  return {
    id: row.id,
    recipientId: row.recipient_id,
    type: row.type,
    title: row.title,
    body: row.body,
    fromId: row.from_id,
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}

export async function getNotifications(recipientId) {
  const { data } = await getClient().from('notifications').select('*')
    .eq('recipient_id', recipientId).order('created_at', { ascending: false });
  return (data || []).map(rowToNotif);
}

export async function addNotification(notif) {
  const row = {
    recipient_id: notif.recipientId,
    type: notif.type,
    title: notif.title,
    body: notif.body,
    from_id: notif.fromId || null,
  };
  const { data } = await getClient().from('notifications').insert(row).select().single();
  return data ? rowToNotif(data) : null;
}

export async function markNotificationRead(id) {
  await getClient().from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
}

export async function getUnreadCount(recipientId) {
  const { count } = await getClient().from('notifications').select('id', { count: 'exact', head: true })
    .eq('recipient_id', recipientId).is('read_at', null);
  return count || 0;
}

// ============================================================================
// Admin helper exported for the bulk-import flow.
// ============================================================================
export { adminCreateAccount };
