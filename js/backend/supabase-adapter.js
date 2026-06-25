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
  const { data, error } = await getClient().from('learners').select('id, studio, profiles!learners_id_fkey(name, email)');
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
    .select('id, studio, profiles!learners_id_fkey(name, email)')
    .eq('id', id)
    .single();
  if (error) return null;
  return { id: data.id, name: data.profiles?.name, email: data.profiles?.email, studio: data.studio };
}

// ============================================================================
// Year-level anchor: quote, vision, values, character strengths
//
// Per the 2026-06-17 v0.2 Phase 1 migration, the anchor lives on the profiles
// row (one place for guides, parents, and learners). Function names are kept
// to match existing callers (year-view.js, north.js, app.js) so the migration
// is transparent. Phase 2 will retire the legacy year_quotes and year_traits
// tables once all writes are confirmed routed through these functions.
//
// The `traits` field is intentionally not exposed by the new functions - the
// v0.2 flow replaces free-text traits with VIA character strengths (selection
// from controlled vocabulary). getYearTraits is preserved as a legacy reader
// (year-view.js reads it for now) and reads via_strengths_top_3 from profiles.
// ============================================================================

export async function getYearQuote(profileId) {
  const { data } = await getClient().from('profiles').select('quote_text').eq('id', profileId).single();
  return data?.quote_text || '';
}

export async function setYearQuote(profileId, text, cycle) {
  const patch = { quote_text: text };
  // Stamp the cycle only when the caller provides one (onboarding quote step +
  // the annual re-prompt). Mid-cycle edits from the Year view omit it, so editing
  // never silently re-dates the quote to a new cycle.
  if (cycle !== undefined) patch.quote_cycle = cycle;
  await getClient().from('profiles').update(patch).eq('id', profileId);
}

// Read the full quote anchor (quote + who said it + the note + the cycle it
// belongs to) in one round-trip. Used on sign-in to decide whether the quote is
// fresh for the current cycle, and to prefill the quote flow.
export async function getQuoteState(profileId) {
  const { data } = await getClient()
    .from('profiles')
    .select('quote_text, quote_author, quote_note, quote_cycle')
    .eq('id', profileId)
    .single();
  return {
    text: data?.quote_text || '',
    author: data?.quote_author || '',
    note: data?.quote_note || '',
    cycle: data?.quote_cycle || '',
  };
}

// Save the whole quote anchor at once (quote flow). Stamps the cycle so the
// person isn't re-prompted again until the calendar rolls.
export async function setQuoteAnchor(profileId, { text = '', author = '', note = '', cycle } = {}) {
  const patch = { quote_text: text, quote_author: author, quote_note: note };
  if (cycle !== undefined) patch.quote_cycle = cycle;
  await getClient().from('profiles').update(patch).eq('id', profileId);
}

export async function getYearVision(profileId) {
  const { data } = await getClient().from('profiles').select('quote_vision').eq('id', profileId).single();
  return data?.quote_vision || '';
}

export async function setYearVision(profileId, text) {
  await getClient().from('profiles').update({ quote_vision: text }).eq('id', profileId);
}

// Legacy alias: reads VIA character strength ids out of via_strengths_top_3.
// Existing callers (year-view.js display, app.js needsOnboarding) get the
// strength ids back; downstream display code can resolve ids -> labels via
// the via_character_strengths reference table.
export async function getYearTraits(profileId) {
  const { data } = await getClient().from('profiles').select('via_strengths_top_3').eq('id', profileId).single();
  return data?.via_strengths_top_3 || [];
}

export async function setYearTraits(profileId, strengthIds) {
  await getClient().from('profiles').update({ via_strengths_top_3: strengthIds }).eq('id', profileId);
}

// ============================================================================
// v0.2 anchor: values + VIA character strengths
//
// Selection from controlled vocabularies (values_lexicon, via_character_strengths).
// Each profile picks top 3 from each. Per Decisions 1 + 2 of the 2026-06-16
// fleet meeting.
// ============================================================================

export async function getProfileValues(profileId) {
  const { data } = await getClient().from('profiles').select('values_top_3').eq('id', profileId).single();
  return data?.values_top_3 || [];
}

export async function setProfileValues(profileId, valueIds) {
  await getClient().from('profiles').update({ values_top_3: valueIds }).eq('id', profileId);
}

export async function getProfileStrengths(profileId) {
  const { data } = await getClient().from('profiles').select('via_strengths_top_3').eq('id', profileId).single();
  return data?.via_strengths_top_3 || [];
}

export async function setProfileStrengths(profileId, strengthIds) {
  await getClient().from('profiles').update({ via_strengths_top_3: strengthIds }).eq('id', profileId);
}

// Reference vocabularies. Read-only, world-readable to authenticated users.
// Cached per-session in module memory so we hit Supabase once per app load.
let _valuesLexiconCache = null;
let _viaStrengthsCache = null;

export async function getValuesLexicon() {
  if (_valuesLexiconCache) return _valuesLexiconCache;
  const { data } = await getClient()
    .from('values_lexicon')
    .select('id, display_label_adult, sort_order')
    .order('sort_order', { ascending: true });
  _valuesLexiconCache = data || [];
  return _valuesLexiconCache;
}

export async function getViaCharacterStrengths() {
  if (_viaStrengthsCache) return _viaStrengthsCache;
  const { data } = await getClient()
    .from('via_character_strengths')
    .select('id, virtue_category, display_label_adult, sort_order')
    .order('sort_order', { ascending: true });
  _viaStrengthsCache = data || [];
  return _viaStrengthsCache;
}

// Guide insights: aggregated value/strength counts via the anchor_aggregates()
// RPC. Counts only (no individual selections), guide-only + small-group
// suppressed in the function itself. Returns [] on error so the panel degrades
// gracefully and can never break the view.
export async function getAnchorAggregates() {
  const { data, error } = await getClient().rpc('anchor_aggregates');
  if (error) { console.warn('getAnchorAggregates:', error.message); return []; }
  return data || [];
}

// Strength ranking (top 8 / bottom 8) from the VIA import. Keeps via_strengths_top_3
// in sync (first 3 of top_8) so North + the cascade keep working unchanged.
export async function setStrengthRanking(profileId, { top8 = [], bottom8 = [] } = {}) {
  await getClient().from('profiles').update({
    via_strengths_top_8: top8,
    via_strengths_bottom_8: bottom8,
    via_strengths_top_3: top8.slice(0, 3),
  }).eq('id', profileId);
}

export async function getStrengthRanking(profileId) {
  const { data } = await getClient()
    .from('profiles')
    .select('via_strengths_top_8, via_strengths_bottom_8, via_strengths_top_3')
    .eq('id', profileId)
    .single();
  return {
    top8: data?.via_strengths_top_8 || [],
    bottom8: data?.via_strengths_bottom_8 || [],
    top3: data?.via_strengths_top_3 || [],
  };
}

// Has this profile completed the v0.2 anchor capture? Used by the Welcome
// gating check and by app.js to decide whether to open the onboarding modal.
// Per Decision 3 of the 2026-06-16 meeting: gating reads from Supabase, not
// localStorage. Completion = both values_top_3 AND via_strengths_top_3 have
// 3 entries each AND a quote_text exists.
export async function hasCompletedAnchor(profileId) {
  const { data } = await getClient()
    .from('profiles')
    .select('quote_text, values_top_3, via_strengths_top_3')
    .eq('id', profileId)
    .single();
  if (!data) return false;
  const hasQuote = (data.quote_text || '').trim().length > 0;
  const hasValues = Array.isArray(data.values_top_3) && data.values_top_3.length === 3;
  const hasStrengths = Array.isArray(data.via_strengths_top_3) && data.via_strengths_top_3.length === 3;
  return hasQuote && hasValues && hasStrengths;
}

// ============================================================================
// v0.3 horizon cascade + onboarding resume pointer
//
// The telescoping life-vision steps and the durable record of where a person is
// in the first-run cascade. Per the 2026-06-22 fleet meeting. All on profiles,
// so all self-only via the profiles_self RLS policy (private by construction).
// ============================================================================

// Maps a cascade step key to its profiles column. The five horizon steps each
// write one free-text column; 'breath' has no field, and strengths/values are
// the existing anchor columns handled by setProfileStrengths/setProfileValues.
const HORIZON_COLUMNS = {
  beyond_5yr: 'vision_beyond_5yr',
  within_5yr: 'vision_within_5yr',
  within_1yr: 'vision_within_1yr',
  current_state: 'current_state',
  halfway: 'halfway_state',
};

// Read all five horizon fields back in one round-trip.
export async function getProfileHorizons(profileId) {
  const { data } = await getClient()
    .from('profiles')
    .select('vision_beyond_5yr, vision_within_5yr, vision_within_1yr, current_state, halfway_state')
    .eq('id', profileId)
    .single();
  return {
    beyond_5yr: data?.vision_beyond_5yr || '',
    within_5yr: data?.vision_within_5yr || '',
    within_1yr: data?.vision_within_1yr || '',
    current_state: data?.current_state || '',
    halfway: data?.halfway_state || '',
  };
}

// Atomic per-step save (Decision 3): write one horizon field and bump the
// resume freshness stamp in the same update. `stepKey` is one of HORIZON_COLUMNS.
export async function setProfileHorizon(profileId, stepKey, text) {
  const column = HORIZON_COLUMNS[stepKey];
  if (!column) throw new Error(`setProfileHorizon: unknown step "${stepKey}"`);
  await getClient()
    .from('profiles')
    .update({ [column]: text, onboarding_updated_at: new Date().toISOString() })
    .eq('id', profileId);
}

// Read the whole resume pointer at once - used on sign-in to land the person on
// their exact step.
export async function getOnboardingState(profileId) {
  const { data } = await getClient()
    .from('profiles')
    .select('onboarding_step, onboarding_skipped, onboarding_completed_at, onboarding_updated_at')
    .eq('id', profileId)
    .single();
  return {
    step: data?.onboarding_step || 'breath',
    skipped: Array.isArray(data?.onboarding_skipped) ? data.onboarding_skipped : [],
    completedAt: data?.onboarding_completed_at || null,
    updatedAt: data?.onboarding_updated_at || null,
  };
}

// Advance (or set) the resume pointer. Written on every step transition so a
// pause never loses the person's place.
export async function setOnboardingStep(profileId, step) {
  await getClient()
    .from('profiles')
    .update({ onboarding_step: step, onboarding_updated_at: new Date().toISOString() })
    .eq('id', profileId);
}

// Record a "not now" skip (Decision 2). Idempotent: a step is only added once.
// Skipping is honored, never a failure and never a blocker. Returns the updated
// skipped list.
export async function markOnboardingStepSkipped(profileId, step) {
  const { data } = await getClient()
    .from('profiles')
    .select('onboarding_skipped')
    .eq('id', profileId)
    .single();
  const current = Array.isArray(data?.onboarding_skipped) ? data.onboarding_skipped : [];
  if (current.includes(step)) return current;
  const next = [...current, step];
  await getClient()
    .from('profiles')
    .update({ onboarding_skipped: next, onboarding_updated_at: new Date().toISOString() })
    .eq('id', profileId);
  return next;
}

// The gate recedes (Decision 1). Called when the person reaches the end of the
// cascade - even if some steps were skipped (Decision 2: walk-the-pages-once,
// not answer-every-field). Sets step to 'complete' and stamps completion.
export async function completeOnboarding(profileId) {
  const now = new Date().toISOString();
  await getClient()
    .from('profiles')
    .update({ onboarding_step: 'complete', onboarding_completed_at: now, onboarding_updated_at: now })
    .eq('id', profileId);
}

// Has this person walked the cascade once? This is the v0.3 gate signal - it
// supersedes hasCompletedAnchor as the "show the first-run flow?" check once the
// cascade UI is wired. Completion = onboarding_completed_at is set, regardless
// of which individual steps were answered vs skipped.
export async function hasCompletedOnboarding(profileId) {
  const { data } = await getClient()
    .from('profiles')
    .select('onboarding_completed_at')
    .eq('id', profileId)
    .single();
  return Boolean(data?.onboarding_completed_at);
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
  // Unread incoming partner check-ins.
  const { count: unreadCheckins } = await getClient()
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', learnerId)
    .eq('type', 'partner-checkin')
    .is('read_at', null);
  // Year-goal pending approvals omitted in v1 (feature not yet wired through supabase).
  return pendingProposals.length + pendingPlans.length + (unreadCheckins || 0);
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
