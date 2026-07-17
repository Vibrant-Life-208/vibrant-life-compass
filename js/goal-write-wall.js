// La'an's runtime write-wall — the binding half of C1 #2 (read-only-to-system).
// Build plan "Two architectural rules"; Stage V flip-checklist §2.
//
// The static test (scripts/c1-read-only-to-system.mjs) proves by construction that no dark
// code PATH persists a threshold id as a goal row. This module makes it a wall you cannot
// cross at RUNTIME: every goal-row write passes through here on its way to either adapter,
// and a threshold id can never be persisted as a goal row, nor can a carried/locked
// projection be saved. "A wall you cannot enforce at runtime is not a wall."
//
// A carried threshold is a render-time PROJECTION (Geordi's projection rule); a learner's
// additions are child records keyed to the threshold id, never rows. Persisted slice goals
// are slice_* and thresholds are adv_* — namespace-disjoint (the static test proves it), so
// the runtime check is a cheap set/prefix assertion plus a carried/locked flag check.
//
// LIVE-SURFACE GUARD: ships in 'report' mode (log-and-report, the write still proceeds). A
// buggy throwing assertion on the live write edge would break goal saves for all 44 learners.
// Promote to 'throw' only at Stage V, after verifying zero violations over a full live
// session (flip-checklist §2). The mode is captain-gated; setWriteWallMode() is the promotion.

import { THRESHOLDS } from './thresholds.js';

// Every threshold id across every studio (skills[] + character[]). This authoritative set —
// not merely the adv_* prefix — is the wall; the prefix is the cheap defense-in-depth check.
const THRESHOLD_IDS = new Set(
  Object.values(THRESHOLDS).flatMap((t) =>
    [...(t.skills || []), ...(t.character || [])].map((it) => it.id)),
);

// A threshold id is any id in THRESHOLDS.*.skills[].id / .character[].id (all adv_*).
export function isThresholdId(id) {
  return typeof id === 'string' && (THRESHOLD_IDS.has(id) || /^adv_/.test(id));
}

// Returns a human-readable violation reason, or null when the row is a legal goal write.
export function goalWriteViolation(goal) {
  if (!goal || typeof goal !== 'object') return null;
  if (isThresholdId(goal.categoryId)) {
    return `goal row categoryId "${goal.categoryId}" is a threshold id — a carried threshold is a render-time projection, never a persisted goal row`;
  }
  if (isThresholdId(goal.id)) {
    return `goal row id "${goal.id}" is a threshold id — thresholds are never goal rows`;
  }
  // A carried / locked projection must never be handed to a save.
  if (goal.carried === true || goal.isProjection === true || goal.prefill === true) {
    return 'goal row is flagged as a carried/locked projection (carried|isProjection|prefill) — projections are render-only';
  }
  return null;
}

// 'report' = log-and-report, the write proceeds (live-surface guard, the shipped default).
// 'throw'  = enforce; the write is refused. Mutable so Stage V can promote through the same
// edge without a code change, and so C1's runtime test can exercise enforcement at the edge.
let mode = 'report';

export function getWriteWallMode() {
  return mode;
}

// Captain-gated promotion (Stage V) / test hook. Only 'report' or 'throw' are valid.
export function setWriteWallMode(next) {
  if (next !== 'report' && next !== 'throw') throw new Error(`invalid write-wall mode: ${next}`);
  mode = next;
}

// The assertion at the write edge. Throws in 'throw' mode; logs loudly and returns in
// 'report' mode (so the live write proceeds while we watch for violations).
export function assertGoalWritable(goal, overrideMode) {
  const violation = goalWriteViolation(goal);
  if (!violation) return;
  const msg = `[goal-write-wall] REFUSED goal-row write: ${violation}`;
  if ((overrideMode || mode) === 'throw') throw new Error(msg);
  if (typeof console !== 'undefined' && console.warn) console.warn(msg);
}
