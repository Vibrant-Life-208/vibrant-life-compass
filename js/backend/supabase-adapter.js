// Supabase adapter - mirrors the store.js API in async form.
// Activated by switching BACKEND_TYPE in config.js to 'supabase'.
// The schema this adapter expects is in /supabase/schema.sql.
//
// This module reads the Supabase JS client off window.__supabaseCreateClient,
// which index.html sets from the vendored, self-hosted UMD build
// (js/vendor/supabase.umd.js) - NOT a runtime CDN import. A CDN import in the
// boot path could fail to load and blank the app after Begin (fleet meeting
// 2026-07-09). The skeleton stays on local; this file becomes live only when
// BACKEND_TYPE === 'supabase'.

import { SUPABASE_CONFIG } from './config.js';
import { encryptField, decryptField } from '../crypto.js';

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

// Write hardening (captain 2026-07-21): retry a write on a TRANSIENT failure (network
// blip, 5xx, 429 rate-limit) so a lost write during a simultaneous-onboarding burst (~55
// learners finishing Setup at once) self-heals instead of silently dropping. Supabase
// returns { error } rather than throwing, so we inspect both. Permanent errors (4xx other
// than 429) return immediately - no hammering. Reads are NOT retried (a stale read is
// harmless; a lost write is not). fn must return the Supabase result ({ data, error }).
function isTransientErr(err) {
  if (!err) return false;
  const status = err.status ?? err.code;
  if (status === 429) return true;
  if (typeof status === 'number' && status >= 500) return true;
  const m = String(err.message || '').toLowerCase();
  return m.includes('network') || m.includes('fetch') || m.includes('timeout') || m.includes('failed to');
}
async function withWriteRetry(fn, attempts = 3) {
  let last = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fn();
      if (!res || !res.error) return res;      // success
      if (!isTransientErr(res.error)) return res; // permanent - return as-is
      last = res.error;
    } catch (e) {
      if (!isTransientErr(e)) throw e;
      last = e;
    }
    await new Promise((r) => setTimeout(r, 150 * (i + 1) * (i + 1))); // 150ms, 600ms
  }
  return { data: null, error: last };
}

// ============================================================================
// Session / auth
// ============================================================================
// A family login has an auth user but NO profile row (its row is in `families`).
// Supabase Auth persists only the auth token, so which family MEMBER is active is
// kept here, client-side, and restored on reload.
const ACTIVE_MEMBER_KEY = 'hc_active_member';
function readActiveMember() {
  try { return JSON.parse(localStorage.getItem(ACTIVE_MEMBER_KEY) || 'null'); } catch { return null; }
}

export async function getSession() {
  const c = getClient();
  const { data } = await c.auth.getSession();
  if (!data?.session) {
    try { localStorage.removeItem(ACTIVE_MEMBER_KEY); } catch { /* ignore */ }
    return null;
  }
  const userId = data.session.user.id;
  // maybeSingle (not single): a family login has an auth user but NO profiles
  // row, so 0 rows is EXPECTED here and is how we detect a family. .single()
  // turns 0 rows into an HTTP 406 (logged red in the console though harmless);
  // .maybeSingle() returns null cleanly. Same branch logic, no false alarm.
  const { data: profile } = await c.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (profile) {
    try { localStorage.removeItem(ACTIVE_MEMBER_KEY); } catch { /* ignore */ }
    return { ...profile, learnerId: profile.role === 'learner' ? userId : null };
  }
  // No profile -> a family login. Restore the active member if one was picked,
  // else hand back a family marker so the app re-shows the "Who's exploring?" picker.
  const active = readActiveMember();
  if (active && active.familyId === userId) return active;
  const fam = await getFamily(userId);
  if (fam) return { role: 'family', familyId: userId, familyName: fam.name, username: fam.username, name: fam.name, needsPicker: true };
  // Authenticated but NO profile row AND no family: an orphaned auth token (e.g.
  // the account's data row was removed in an account cleanup). Left in place it
  // re-fails on every load and can wedge the app before sign-in. Purge it so the
  // session self-heals to a clean sign-in instead of looping.
  // scope:'local' clears ONLY the stored token with NO network call - a global
  // signOut hits the logout endpoint, which for an invalid token can stall and
  // wedge the boot path (it awaits here). Local is instant and can't hang.
  // (2026-07-09.)
  try { await c.auth.signOut({ scope: 'local' }); } catch { /* ignore */ }
  try { localStorage.removeItem(ACTIVE_MEMBER_KEY); } catch { /* ignore */ }
  return null;
}

export async function signOut() {
  await getClient().auth.signOut();
}

// ============================================================================
// Learners
// ============================================================================
export async function getLearners() {
  const c = getClient();
  // Deploy-before-migration safety (v0.27 is_leader): try with the leader flag, fall
  // back to base columns if the column isn't present yet, so the guide dashboard never
  // breaks on a deploy that lands ahead of the migration.
  let { data, error } = await c.from('learners').select('id, studio, is_leader, scheduling_mode, new_to_tribe, profiles!learners_id_fkey(name, email)');
  if (error) {
    ({ data, error } = await c.from('learners').select('id, studio, profiles!learners_id_fkey(name, email)'));
  }
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    name: row.profiles?.name,
    email: row.profiles?.email,
    studio: row.studio,
    isLeader: Boolean(row.is_leader),
    schedulingMode: row.scheduling_mode ?? null,
    newToTribe: Boolean(row.new_to_tribe),
  }));
}

export async function getLearner(id) {
  const c = getClient();
  let { data, error } = await c
    .from('learners')
    .select('id, studio, setup_completed_at, open_by_choice, current_wheel_test, pitch_target_studio, pitch_intent_at, pitch_age_self_report, pitch_age_status, pitch_age_reviewed_by, pitch_age_reviewed_at, scheduling_mode, dismissed_plan_keys, books, new_to_tribe, first_task_demo_seen, profiles!learners_id_fkey(name, email)')
    .eq('id', id)
    .single();
  if (error) {
    // Deploy-before-migration safety: the v0.17 pitch / v0.19 setup columns may not
    // exist yet. Re-read the base columns so learner loading never breaks (the
    // setupCompletedAt fallback is then null, which just re-gates Setup - safe).
    ({ data, error } = await c
      .from('learners')
      .select('id, studio, profiles!learners_id_fkey(name, email)')
      .eq('id', id)
      .single());
    if (error) return null;
  }
  return {
    id: data.id,
    name: data.profiles?.name,
    email: data.profiles?.email,
    studio: data.studio,
    setupCompletedAt: data.setup_completed_at ?? null,
    // Stage P3: slices the learner chose to leave open (invitation, not missing-data).
    // Dormant until Stage O writes it; [] when the column/value is absent.
    openByChoice: Array.isArray(data.open_by_choice) ? data.open_by_choice : [],
    // v0.23 cohort gate: read by isCurrentWheelBuild(learner). Snake_case key on purpose -
    // the resolver reads learner.current_wheel_test verbatim. Default false when the column
    // is absent (deploy-before-migration) or null, so prod stays on the legacy flow.
    current_wheel_test: Boolean(data.current_wheel_test),
    pitchTargetStudio: data.pitch_target_studio ?? null,
    pitchIntentAt: data.pitch_intent_at ?? null,
    pitchAgeSelfReport: data.pitch_age_self_report ?? null,
    pitchAgeStatus: data.pitch_age_status ?? null,
    pitchAgeReviewedBy: data.pitch_age_reviewed_by ?? null,
    pitchAgeReviewedAt: data.pitch_age_reviewed_at ?? null,
    // v0.29 auto-scheduler placement override; null = use the studio-tier default.
    schedulingMode: data.scheduling_mode ?? null,
    // v0.30 book tracker + new-to-tribe + first-task-demo.
    books: Array.isArray(data.books) ? data.books : [],
    newToTribe: Boolean(data.new_to_tribe),
    firstTaskDemoSeen: Boolean(data.first_task_demo_seen),
    // v0.31 auto-scheduler tombstones: planKeys the learner deleted, never re-planted.
    dismissedPlanKeys: Array.isArray(data.dismissed_plan_keys) ? data.dismissed_plan_keys : [],
  };
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

// Typed values + archetype (older learners + adults). Separate from values_top_3
// (the lexicon-id picks) so the aggregate stays clean.
export async function setValuesFreetext(profileId, { values = [], archetype = '' } = {}) {
  await getClient().from('profiles')
    .update({ values_freetext: values, values_archetype: archetype })
    .eq('id', profileId);
}

export async function getValuesFreetext(profileId) {
  const { data } = await getClient()
    .from('profiles')
    .select('values_freetext, values_archetype')
    .eq('id', profileId)
    .single();
  return { values: data?.values_freetext || [], archetype: data?.values_archetype || '' };
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
    .select('id, display_label_adult, definition, sort_order')
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

// v0.26 Session-1 foundational inventory (the Ground / Posture / Self answers beyond
// strengths/values/vision). One jsonb blob on profiles, self-only via the profiles_self RLS
// (never surveilled - spec invariant #7). The cascade accumulates the whole object in state
// and persists it on each step advance (per-step atomicity like horizons, without a
// read-modify-write race). Read-safe before the migration is applied (returns {} on error),
// so this code ships ahead of the column. DORMANT until the Session-1 movement screens exist.
// Spec: docs/design/2026-07-20-session1-plan-foundational-inventory-spec.md.
export async function getProfileFoundations(profileId) {
  try {
    const { data } = await getClient()
      .from('profiles')
      .select('foundations')
      .eq('id', profileId)
      .single();
    const f = data?.foundations;
    return (f && typeof f === 'object' && !Array.isArray(f)) ? f : {};
  } catch (e) {
    return {}; // column may not exist yet (deploy-before-migration safety)
  }
}

export async function setProfileFoundations(profileId, foundations) {
  const obj = (foundations && typeof foundations === 'object' && !Array.isArray(foundations)) ? foundations : {};
  try {
    await getClient()
      .from('profiles')
      .update({ foundations: obj, onboarding_updated_at: new Date().toISOString() })
      .eq('id', profileId);
  } catch (e) { /* column may not exist yet; non-fatal (deploy-before-migration safety) */ }
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
    await withWriteRetry(() => getClient().from('goals').update(row).eq('id', goal.id));
  } else {
    const { data } = await withWriteRetry(() => getClient().from('goals').insert(row).select().single());
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
    lifeArea: row.life_area || null,  // wheel slice; NULL = not placed (v0.18)
    isBecoming: row.is_becoming ?? null,  // frozen cadence disposition; NULL = fall back to slice test (v0.35)
    status: row.status,
    createdAt: row.created_at,
    ...(row.decomposition || {}),  // v0.22 extended fields back to top level (baseline, halfwayPoint, weeklySteps, ...)
  };
}

// The extended decomposition fields the year-goal modal writes. Packed into the v0.22
// `decomposition` jsonb column so they survive on the synced backend (goalToRow used to drop
// them), matching what local-store already keeps by spread.
// setup/challenges/threshold: the 3-phase goal cadence arrays (up to 3 each) written by
// openGoalSetupModal (captain 2026-07-18). Stored as arrays in the same jsonb; rowToGoal
// spreads them back to the top level on read.
const DECOMPOSITION_FIELDS = ['baseline', 'halfwayPoint', 'quarterPoint', 'eos1Point', 'weeklySteps', 'targetSession', 'setup', 'challenges', 'threshold', 'presence', 'detail'];

function goalToRow(goal) {
  const row = {
    learner_id: goal.learnerId,
    category_id: goal.categoryId,
    scope: goal.scope,
    session_index: goal.sessionIndex || null,
    text: goal.text,
    life_area: goal.lifeArea || null,  // wheel slice; NULL = not placed (v0.18)
    status: goal.status || 'active',
  };
  // Only defined keys are packed, and the column is OMITTED entirely when nothing is present,
  // so a partial update (a caller that doesn't carry the decomposition) never clobbers a goal's
  // stored decomposition. A threshold id is never a goal row (La'an's write-wall guards the
  // edge); this column only carries the learner's own decomposition of their own goal.
  const decomposition = {};
  for (const k of DECOMPOSITION_FIELDS) if (goal[k] !== undefined) decomposition[k] = goal[k];
  if (Object.keys(decomposition).length) row.decomposition = decomposition;
  // is_becoming (v0.35) is packed ONLY when the caller carries it, so a partial update that
  // omits it never clobbers the flag the migration backfilled. rowToGoal always reads it back,
  // so a full round-trip preserves it.
  if (goal.isBecoming !== undefined) row.is_becoming = goal.isBecoming;
  return row;
}

// ============================================================================
// Weekly answers (Stage M2 progressing answer; synced storage — build plan Stage V /
// flip-checklist §3). Targets the weekly_answers table (migration v0.21).
//
// DORMANT until v0.21 is applied AND CURRENT_WHEEL_BUILD flips: the goal arc that calls this
// is behind the flag, so this never runs in production while dark. §5: get-one + save-one
// ONLY — no list / count / streak reader, and the table stores NO timestamp (nothing to
// aggregate over time). A weekly answer is a presence, not a metric.
// ============================================================================
export async function getWeeklyAnswer(learnerId, goalId, session, week) {
  if (!learnerId || !goalId) return null;
  const { data } = await getClient().from('weekly_answers')
    .select('text, kind, session, week')  // deliberately no timestamp column exists to select
    .eq('learner_id', learnerId).eq('goal_id', goalId).eq('session', session).eq('week', week)
    .maybeSingle();
  return data || null;
}

export async function saveWeeklyAnswer(learnerId, { goalId, session, week, kind = 'finish', text = '' }) {
  if (!learnerId || !goalId) return;
  const trimmed = (text || '').trim();
  if (!trimmed) {
    // blank clears — an answer withdrawn, not a zero
    await getClient().from('weekly_answers').delete()
      .eq('learner_id', learnerId).eq('goal_id', goalId).eq('session', session).eq('week', week);
    return;
  }
  // save-one = upsert on the (learner, goal, session, week) unique key. No timestamp written.
  await getClient().from('weekly_answers')
    .upsert({ learner_id: learnerId, goal_id: goalId, session, week, kind, text: trimmed },
      { onConflict: 'learner_id,goal_id,session,week' });
}

// ============================================================================
// Threshold additions (Stage O goals-as-cards; behind CURRENT_WHEEL_BUILD).
//
// Child records keyed to a threshold id (the learner's now/halfway for a carried threshold) -
// NEVER a goal row, so read-only-to-system holds. DORMANT: a synced table + migration is a
// follow-up; the current-wheel build is dark, so this never runs in production yet. Local-store
// holds it for the built-surface walk. (When the synced table lands, mirror local-store here.)
// ============================================================================
export async function getThresholdAdditions(learnerId) {
  return {};
}

export async function saveThresholdAdditions(learnerId, additions) {
  /* TODO: synced threshold_additions table (follow-up); dormant while dark. */
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

// Extended task fields packed into the v0.28 meta jsonb (mirrors goals.decomposition).
const TASK_META_FIELDS = ['band', 'region', 'shape', 'timerMinutes', 'weekOf', 'source', 'planKey', 'bookId'];

export async function saveTask(learnerId, task) {
  const row = {
    learner_id: learnerId,
    text: task.text,
    // v0.28: planned_for is nullable - a "pool" task belongs to a week (weekOf) but
    // no day yet. An empty string coerces to null.
    planned_for: task.plannedFor || null,
    goal_id: task.goalId || null,
    category_id: task.categoryId || null,
    life_area: task.lifeArea || null,  // wheel slice; NULL = not placed (v0.18)
    status: task.status || 'open',
  };
  const meta = {};
  for (const k of TASK_META_FIELDS) if (task[k] !== undefined) meta[k] = task[k];
  if (Object.keys(meta).length) row.meta = meta;
  if (task.id && !task.id.startsWith('hc_')) {
    await withWriteRetry(() => getClient().from('tasks').update(row).eq('id', task.id));
  } else {
    await withWriteRetry(() => getClient().from('tasks').insert(row));
  }
}

// Bulk-create tasks in ONE request (captain 2026-07-21 hardening). Used by the Session-1
// auto-scheduler to plant a learner's whole milestone skeleton in a single insert instead
// of one request per task - so a simultaneous-onboarding burst (~55 learners) sends far
// fewer writes. New rows only. Retried on transient failure.
export async function saveTasks(learnerId, tasks) {
  if (!Array.isArray(tasks) || !tasks.length) return [];
  const rows = tasks.map((task) => {
    const row = {
      learner_id: learnerId,
      text: task.text,
      planned_for: task.plannedFor || null,
      goal_id: task.goalId || null,
      category_id: task.categoryId || null,
      life_area: task.lifeArea || null,
      status: task.status || 'open',
    };
    const meta = {};
    for (const k of TASK_META_FIELDS) if (task[k] !== undefined) meta[k] = task[k];
    if (Object.keys(meta).length) row.meta = meta;
    return row;
  });
  await withWriteRetry(() => getClient().from('tasks').insert(rows));
  return rows;
}

export async function moveTask(learnerId, id, newPlannedFor) {
  await withWriteRetry(() => getClient().from('tasks').update({ planned_for: newPlannedFor }).eq('id', id));
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
    plannedFor: row.planned_for || '',  // v0.28: null (pool task) -> '' for the app
    goalId: row.goal_id,
    categoryId: row.category_id,
    lifeArea: row.life_area || null,  // wheel slice; NULL = not placed (v0.18)
    status: row.status,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    ...(row.meta || {}),  // v0.28 extended fields back to top level (band, region, shape, weekOf, timerMinutes)
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
export async function setSession(session) {
  // Supabase Auth manages the auth token after signInWithPassword. We persist
  // ONLY the active-family-member choice (a family login's uid can't say which
  // member is exploring); person logins reconstruct from auth + profile.
  try {
    if (session && session.familyId) localStorage.setItem(ACTIVE_MEMBER_KEY, JSON.stringify(session));
    else localStorage.removeItem(ACTIVE_MEMBER_KEY);
  } catch { /* ignore */ }
}

export async function clearSession() {
  try { localStorage.removeItem(ACTIVE_MEMBER_KEY); } catch { /* ignore */ }
  await getClient().auth.signOut();
}

// Set the signed-in user's own password (first-run forced change / self-service)
// and clear their must_change_password flag.
export async function updatePassword(newPassword) {
  const { error } = await getClient().auth.updateUser({ password: newPassword });
  if (error) throw error;
  const { data } = await getClient().auth.getUser();
  const id = data?.user?.id;
  if (id) await getClient().from('profiles').update({ must_change_password: false }).eq('id', id);
}

// Guide/owner-run reset. NOT available on Supabase yet: the password lives in
// Supabase Auth (not a PBKDF2 field this adapter can write), so a real reset
// needs the server-side, 2FA-gated flow (Phase 2). Fail loudly rather than hand
// out a dead temp password like the removed in-app reset once did.
export async function resetPassword(_role, _accountId) {
  throw new Error('In-app password reset is not available on Supabase yet (Phase 2, 2FA-gated). Use the admin reset tool.');
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
  // Authenticate FIRST, then decide person vs family. A family's `families` row is
  // only readable once authenticated (RLS: id = auth.uid()), so we can't look it
  // up before sign-in - doing so made every family login fail. Same shape as
  // getSession: profile -> person; no profile but a families row -> family login.
  const email = heroEmail(heroName);
  const { data, error } = await getClient().auth.signInWithPassword({ email, password });
  if (error || !data?.session) return null;
  const userId = data.session.user.id;
  const { data: profile } = await getClient().from('profiles').select('*').eq('id', userId).single();
  if (profile) return { ...profile, id: userId };
  const fam = await getFamily(userId); // RLS (id = auth.uid()) passes now that we're signed in
  if (fam) return { role: 'family', familyId: userId, name: fam.name, username: fam.username };
  return null;
}

// ============================================================================
// Families (one shared login per family; members are existing profiles).
// Defensive: every read fails safe to null/[] so a deploy before the family
// migration cannot break sign-in.
// ============================================================================
export async function getFamily(familyId) {
  try {
    const c = getClient();
    const { data: fam } = await c.from('families').select('id, name, username').eq('id', familyId).single();
    if (!fam) return null;
    const { data: members } = await c.from('family_members')
      .select('profile_id, kind, display_name, sort, profiles!family_members_profile_id_fkey(name, email, role, is_owner)')
      .eq('family_id', familyId).order('sort');
    const list = (members || []).map((m) => ({
      profileId: m.profile_id,
      kind: m.kind,
      displayName: m.display_name,
      name: m.profiles?.name,
      email: m.profiles?.email,
      role: m.profiles?.role || m.kind,
      is_owner: !!m.profiles?.is_owner,
      studio: null,
    }));
    // Attach studio for learner members; Tots have no learners row, so studio
    // stays null (they show in the family but aren't pickable as explorers).
    const learnerIds = list.filter((m) => m.kind === 'learner').map((m) => m.profileId);
    if (learnerIds.length) {
      const { data: lrs } = await c.from('learners').select('id, studio').in('id', learnerIds);
      const byId = Object.fromEntries((lrs || []).map((l) => [l.id, l.studio]));
      list.forEach((m) => { if (m.profileId in byId) m.studio = byId[m.profileId]; });
    }
    fam.members = list;
    return fam;
  } catch { return null; }
}

export async function getFamilyByUsername(username) {
  try {
    const c = getClient();
    const { data: fam, error } = await c.from('families')
      .select('id').eq('username', String(username || '').trim().toLowerCase()).single();
    if (error || !fam) return null;
    return await getFamily(fam.id);
  } catch { return null; }
}

// Which family is this profile a member of? (owner's "My Family"; a learner
// resolving their family to share with.)
export async function getFamilyIdForProfile(profileId) {
  try {
    const { data } = await getClient().from('family_members')
      .select('family_id').eq('profile_id', profileId).limit(1).single();
    return data?.family_id || null;
  } catch { return null; }
}

// Family updates: learner-shared, receive-only feed (v0.12).
export async function addFamilyUpdate(familyId, learnerId, kind, body) {
  const { error } = await getClient().from('family_updates')
    .insert({ family_id: familyId, learner_id: learnerId, kind, body: String(body).slice(0, 500) });
  if (error) throw error;
}

export async function getFamilyUpdates(familyId) {
  try {
    const { data } = await getClient().from('family_updates')
      .select('id, learner_id, kind, body, created_at, profiles!family_updates_learner_id_fkey(name)')
      .eq('family_id', familyId).order('created_at', { ascending: false }).limit(50);
    return (data || []).map((u) => ({
      id: u.id, learnerId: u.learner_id, learnerName: u.profiles?.name,
      kind: u.kind, body: u.body, createdAt: u.created_at,
    }));
  } catch { return []; }
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
  if (data.setupCompletedAt !== undefined) learnerRow.setup_completed_at = data.setupCompletedAt;
  if (data.openByChoice !== undefined) learnerRow.open_by_choice = data.openByChoice;
  // v0.23 cohort gate. Setting it true is a supervised, SSC-cleared action (normally done via
  // SQL, not the app), but carry it here for parity so a write path never silently drops it.
  if (data.current_wheel_test !== undefined) learnerRow.current_wheel_test = data.current_wheel_test;
  if (data.pitchTargetStudio !== undefined) learnerRow.pitch_target_studio = data.pitchTargetStudio;
  if (data.pitchIntentAt !== undefined) learnerRow.pitch_intent_at = data.pitchIntentAt;
  if (data.pitchAgeSelfReport !== undefined) learnerRow.pitch_age_self_report = data.pitchAgeSelfReport;
  if (data.pitchAgeStatus !== undefined) learnerRow.pitch_age_status = data.pitchAgeStatus;
  if (data.pitchAgeReviewedBy !== undefined) learnerRow.pitch_age_reviewed_by = data.pitchAgeReviewedBy;
  if (data.pitchAgeReviewedAt !== undefined) learnerRow.pitch_age_reviewed_at = data.pitchAgeReviewedAt;
  // Guide-set leader flag (v0.27): marks a learner as a tribe leader for the roster
  // indicator + the randomizer's leader options.
  if (data.isLeader !== undefined) learnerRow.is_leader = data.isLeader;
  // Guide-set auto-scheduler placement override (v0.29); null clears back to the tier default.
  if (data.schedulingMode !== undefined) learnerRow.scheduling_mode = data.schedulingMode;
  // v0.31 auto-scheduler tombstones (planKeys the learner deleted).
  if (data.dismissedPlanKeys !== undefined) learnerRow.dismissed_plan_keys = data.dismissedPlanKeys;
  // v0.30 book tracker shelf + new-to-tribe (guide-set) + first-task-demo-seen.
  if (data.books !== undefined) learnerRow.books = data.books;
  if (data.newToTribe !== undefined) learnerRow.new_to_tribe = data.newToTribe;
  if (data.firstTaskDemoSeen !== undefined) learnerRow.first_task_demo_seen = data.firstTaskDemoSeen;
  if (Object.keys(learnerRow).length > 0) {
    await withWriteRetry(() => getClient().from('learners').update(learnerRow).eq('id', data.id));
  }
  const profileRow = {};
  if (data.name !== undefined) profileRow.name = data.name;
  if (Object.keys(profileRow).length > 0) {
    await withWriteRetry(() => getClient().from('profiles').update(profileRow).eq('id', data.id));
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

// Guide-assigned partnership (captain 2026-07-21): a guide pairs two learners
// directly, status 'accepted', no handshake. Any existing active partner for
// either learner is dissolved first. RLS: the guide-insert policy on partner_links
// (migration v0.27) permits a guide to write an accepted link for two learners on
// their roster. Returns the new link.
export async function assignPartner(aId, bId) {
  if (!aId || !bId || aId === bId) return null;
  for (const id of [aId, bId]) {
    const active = await getActivePartnerOf(id);
    if (active) await dissolvePartnership(active.linkId);
  }
  // Guard: a guide can only dissolve links where BOTH parties are on their roster
  // (v0.27 RLS). If a learner's existing partner is off-roster, the dissolve UPDATE
  // matches zero rows and silently no-ops - inserting here would create a SECOND
  // 'accepted' link and getActivePartnerOf would return a nondeterministic partner.
  // Re-check and bail rather than double-pair.
  for (const id of [aId, bId]) {
    if (await getActivePartnerOf(id)) return null;
  }
  const { data } = await getClient().from('partner_links').insert({
    proposer_id: aId, partner_id: bId, status: 'accepted',
    assigned_by_guide: true, responded_at: new Date().toISOString(),
  }).select().single();
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

export async function getPendingYearPlansForGuide(guideId) {
  // The guide signs off their roster's plans (captain 2026-07-21). year_plans RLS makes a
  // learner's guide a reader, so a plain pending query returns exactly the guide's roster's
  // pending plans (the guide only sees their own learners' rows).
  const { data } = await getClient().from('year_plans').select('*').eq('status', 'pending');
  return (data || []).map(rowToPlan);
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

// ============================================================================
// Guide practice — "Your Practice" (migration v0.24).
//
// story + moment are ENCRYPTED AT REST here (encryptField / decryptField) — the
// crypto is enforced at the store boundary so a UI can never forget it (TCC
// ratification 2026-07-18: moment can hold a child's name). Reflections are
// guide-private by RLS (guide_crossings_self: guide_id = auth.uid()) — no owner
// or peer path exists. The bloom (studio_practice_pulse) reads only
// characteristic + created_at, so encryption costs it nothing.
// ============================================================================

export async function addCrossing({ characteristic, story, moment }) {
  const uid = await currentUserId();
  if (!uid) return null;
  const row = {
    guide_id: uid,
    characteristic,
    story: await encryptField(uid, story || ''),
    moment: await encryptField(uid, moment || ''),
  };
  const { data, error } = await getClient()
    .from('guide_crossings').insert(row).select().single();
  if (error) { console.warn('addCrossing:', error.message); return null; }
  // Hand back the plaintext the caller just gave us (never re-read ciphertext).
  return { ...data, story: story || '', moment: moment || '' };
}

export async function getCrossings(characteristic = null) {
  const uid = await currentUserId();
  if (!uid) return [];
  let q = getClient()
    .from('guide_crossings').select('*')
    .eq('guide_id', uid)                         // explicit + belt-and-suspenders to RLS
    .order('created_at', { ascending: false });
  if (characteristic) q = q.eq('characteristic', characteristic);
  const { data, error } = await q;
  if (error) { console.warn('getCrossings:', error.message); return []; }
  return Promise.all((data || []).map(async (r) => ({
    ...r,
    story: await decryptField(uid, r.story),
    moment: await decryptField(uid, r.moment),
  })));
}

export async function deleteCrossing(id) {
  const { error } = await getClient().from('guide_crossings').delete().eq('id', id);
  if (error) console.warn('deleteCrossing:', error.message);
}

export async function getSharePracticePulse() {
  const uid = await currentUserId();
  if (!uid) return false;
  const { data } = await getClient()
    .from('profiles').select('share_practice_pulse').eq('id', uid).maybeSingle();
  return Boolean(data?.share_practice_pulse);
}

export async function setSharePracticePulse(on) {
  const uid = await currentUserId();
  if (!uid) return;
  await getClient().from('profiles').update({ share_practice_pulse: !!on }).eq('id', uid);
}

// The owner/guide culture bloom — a suppressed, anonymized aggregate. Counts only.
export async function getStudioPracticePulse(tribe) {
  const { data, error } = await getClient().rpc('studio_practice_pulse', { p_tribe: tribe });
  if (error) { console.warn('getStudioPracticePulse:', error.message); return []; }
  return data || [];
}
