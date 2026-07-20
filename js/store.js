// Storage facade. Routes every call to the active backend implementation,
// either localStorage (default, skeleton + dev) or Supabase (production).
//
// The choice is controlled by BACKEND_TYPE in `./backend/config.js`. Both
// implementations expose the same 55-function API; callers don't change.
//
// When BACKEND_TYPE === 'supabase' the supabase-adapter must be complete
// for every function used by the app, otherwise calls will return undefined.

import { BACKEND_TYPE } from './backend/config.js';
import * as localImpl from './backend/local-store.js';
import * as supabaseImpl from './backend/supabase-adapter.js';
import { assertGoalWritable } from './goal-write-wall.js';

const impl = BACKEND_TYPE === 'supabase' ? supabaseImpl : localImpl;

export const {
  getSession,
  setSession,
  clearSession,
  updatePassword,
  resetPassword,
  getLearners,
  getLearner,
  saveLearner,
  getParents,
  saveParent,
  getParentLearnerLinks,
  linkParentToLearner,
  findAccountByHeroName,
  signInWithHeroName,
  getFamily,
  getFamilyByUsername,
  getFamilyIdForProfile,
  addFamilyUpdate,
  getFamilyUpdates,
  getGuides,
  getGuide,
  saveGuide,
  getGoals,
  getCheckIns,
  addCheckIn,
  getPosts,
  addPost,
  getYearQuote,
  setYearQuote,
  getQuoteState,
  setQuoteAnchor,
  getYearVision,
  setYearVision,
  getYearTraits,
  setYearTraits,
  // v0.2 anchor (per 2026-06-16 fleet meeting, Phase 1)
  getProfileValues,
  setProfileValues,
  setValuesFreetext,
  getValuesFreetext,
  getProfileStrengths,
  setProfileStrengths,
  getValuesLexicon,
  getViaCharacterStrengths,
  getAnchorAggregates,
  setStrengthRanking,
  getStrengthRanking,
  hasCompletedAnchor,
  // v0.3 horizon cascade + onboarding resume pointer (2026-06-22 fleet meeting)
  getProfileHorizons,
  setProfileHorizon,
  // v0.26 Session-1 foundational inventory (dormant until the movement screens are built)
  getProfileFoundations,
  setProfileFoundations,
  getOnboardingState,
  setOnboardingStep,
  markOnboardingStepSkipped,
  completeOnboarding,
  hasCompletedOnboarding,
  getLogins,
  saveLogin,
  revealLoginPassword,
  deleteLogin,
  getPartnerLinks,
  getActivePartnerOf,
  getPendingProposalsFor,
  proposePartner,
  respondToPartnerProposal,
  dissolvePartnership,
  getPartnerNotificationCount,
  getYearGoalPendingApprovals,
  markYearGoalPendingApproval,
  approveYearGoal,
  rejectYearGoal,
  getYearPlans,
  submitYearPlan,
  getPendingYearPlanFor,
  approveYearPlan,
  returnYearPlan,
  getNotifications,
  addNotification,
  markNotificationRead,
  getUnreadCount,
  getTasks,
  getTasksForDate,
  getTasksForRange,
  saveTask,
  moveTask,
  toggleTaskDone,
  deleteTask,
  // Weekly answers (Stage M2; synced storage — get-one/save-one only, no aggregation, §5).
  getWeeklyAnswer,
  saveWeeklyAnswer,
  // Threshold additions (Stage O goals-as-cards) — child records keyed to a threshold id,
  // never a goal row (read-only-to-system / write-wall).
  getThresholdAdditions,
  saveThresholdAdditions,
  // Guide "Your Practice" + owner culture bloom (v0.24). story/moment encrypted
  // at rest in the adapter; crossings are guide-private (RLS self-only); the
  // bloom is a suppressed, anonymized aggregate (counts only).
  addCrossing,
  getCrossings,
  deleteCrossing,
  getSharePracticePulse,
  setSharePracticePulse,
  getStudioPracticePulse,
} = impl;

// La'an's runtime write-wall — the single store write edge for goal rows. saveGoal dispatches
// to both adapters (local + supabase), so this one assertion covers every persisted goal
// write. A threshold id can never be persisted as a goal row (read-only-to-system, C1 #2
// runtime half). Ships log-and-report to guard the live surface; promotion to throw is
// captain-gated at Stage V. See js/goal-write-wall.js.
export async function saveGoal(goal) {
  assertGoalWritable(goal);
  return impl.saveGoal(goal);
}
