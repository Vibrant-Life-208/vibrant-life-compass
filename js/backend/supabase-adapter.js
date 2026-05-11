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
