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

const impl = BACKEND_TYPE === 'supabase' ? supabaseImpl : localImpl;

export const {
  getSession,
  setSession,
  clearSession,
  getLearners,
  getLearner,
  saveLearner,
  getParents,
  saveParent,
  getParentLearnerLinks,
  linkParentToLearner,
  findAccountByHeroName,
  getGuides,
  getGuide,
  saveGuide,
  getGoals,
  saveGoal,
  getCheckIns,
  addCheckIn,
  getPosts,
  addPost,
  getYearQuote,
  setYearQuote,
  getYearTraits,
  setYearTraits,
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
} = impl;
