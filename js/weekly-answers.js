// Weekly progressing answers (Stage M2, behind CURRENT_WHEEL_BUILD).
//
// The learner's answer to the week's progressing question, one discrete record per
// (goal, session, week). This is the "checking and re-looking" cadence the fleet asked
// for - answered live, this week only.
//
// § CONDITION 5 IS ENFORCED STRUCTURALLY HERE, NOT JUST BY UI CHOICE.
// Twelve answers is not a dataset; each week is its own moment. So this module offers
// ONLY get-one and save-one for a specific week. It deliberately exposes NO list, count,
// streak, trend, "last answered N days ago," or "resume where you left off" reader, and
// it stores NO timestamp - there is nothing to aggregate over time even if a later caller
// were tempted. A weekly answer is a presence, not a metric. (Interaction review 2026-07-17.)
//
// STORAGE SEAM (captain 2026-07-17, "decide when I build M2"): backed local-first, in a
// dedicated localStorage key, backend-agnostic - it does NOT touch the goals table or
// either backend adapter. This matches how the other extended goal fields (weeklySteps,
// halfwayPoint) live today (local-only; supabase goalToRow drops them). Stage V owns the
// migration: move weekly answers to synced storage (a weekly_answers table or the goals
// extended-field persistence) at the same time the flag flips and useSlices opens. Until
// then this is device-local and gated dark, so no real learner depends on cross-device sync.

const KEY = 'hc_weekly_answers_v0';

function readAll() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; }
  catch (e) { return {}; }
}
function writeAll(map) {
  try { localStorage.setItem(KEY, JSON.stringify(map)); } catch (e) { /* storage full / disabled: non-fatal */ }
}

// One record per goal+session+week. Kept intentionally coarse (no per-day, no history).
function recordKey(learnerId, goalId, session, week) {
  return `${learnerId}|${goalId}|s${session}|w${week}`;
}

// The learner's answer for THIS week's question on this goal, or '' if unanswered.
// Single-record read only - there is deliberately no "all answers for this goal" reader.
export function getWeeklyAnswer(learnerId, goalId, session, week) {
  if (!learnerId || !goalId) return '';
  const rec = readAll()[recordKey(learnerId, goalId, session, week)];
  return rec && typeof rec.text === 'string' ? rec.text : '';
}

// Save (or clear, if blank) this week's answer. `kind` is 'finish' | 'presence' - the
// cadence-split shape, stored for record only, never summed. No timestamp is written.
export function saveWeeklyAnswer(learnerId, { goalId, session, week, kind = 'finish', text = '' }) {
  if (!learnerId || !goalId) return;
  const map = readAll();
  const k = recordKey(learnerId, goalId, session, week);
  const trimmed = (text || '').trim();
  if (!trimmed) { delete map[k]; }        // blank clears - an answer withdrawn, not a zero
  else { map[k] = { text: trimmed, kind, session, week }; }
  writeAll(map);
}
