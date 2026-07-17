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
// STORAGE SEAM (build plan Stage V / flip-checklist §3): now backed by SYNCED storage via the
// store facade - getWeeklyAnswer / saveWeeklyAnswer route through the active backend adapter
// (local-store's 'hc_weekly_answers_v0' key for parity, or the supabase weekly_answers table,
// migration v0.21). A real learner's answer survives across devices. The §5 guarantee is
// preserved at every layer: the adapters expose only get-one/save-one, and neither the local
// key nor the weekly_answers table stores a timestamp. Still gated dark behind
// CURRENT_WHEEL_BUILD until Stage V.

import { getWeeklyAnswer as storeGetWeeklyAnswer, saveWeeklyAnswer as storeSaveWeeklyAnswer } from './store.js';

// The learner's answer for THIS week's question on this goal, or '' if unanswered.
// Single-record read only - there is deliberately no "all answers for this goal" reader.
export async function getWeeklyAnswer(learnerId, goalId, session, week) {
  if (!learnerId || !goalId) return '';
  const rec = await storeGetWeeklyAnswer(learnerId, goalId, session, week);
  return rec && typeof rec.text === 'string' ? rec.text : '';
}

// Save (or clear, if blank) this week's answer. `kind` is 'finish' | 'presence' - the
// cadence-split shape, stored for record only, never summed. No timestamp is written.
// A blank text clears the record (an answer withdrawn, not a zero); the adapter handles it.
export async function saveWeeklyAnswer(learnerId, { goalId, session, week, kind = 'finish', text = '' }) {
  if (!learnerId || !goalId) return;
  await storeSaveWeeklyAnswer(learnerId, { goalId, session, week, kind, text });
}
