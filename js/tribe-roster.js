// New-to-tribe roster.
//
// STOPGAP (captain 2026-07-21): hard-coded for the current beta cohort until a proper mechanism
// exists (a per-learner `newToTribe` field a guide can toggle, or derivation from roster history).
// These learners are NEW to their tribe this year and get the hand-holding path on entry -
// the "make your first task" demo + heavier scaffolding that fades as they find their feet
// (scaffold-and-fade, research cycle 2). "Returning" learners get the lighter flow.
//
// Keyed by learner id -> the studio they are NEW in. Local only; not for push. Move to a
// guide-set field before this ships (see design note; flagged to captain).
export const NEW_TO_TRIBE = {
  VAnXWm7hgBtk: 'discovery', // lyla-a
  rAbDKWuWm7zG: 'discovery', // rylee-m
  z9NmKZXGD5aR: 'adventure', // carter-k
  UktQrwkjbYPm: 'adventure', // carson-b
  Wfq33mXAyNVN: 'adventure', // hudson-m
  QuNL7KbBgcZp: 'adventure', // elijah-l
  KfEGMfwMBLrs: 'adventure', // kyra-j
  wzgigPQgFjYn: 'adventure', // nina-s
};

// True when a learner is new to their tribe (gets the hand-holding path). A guide-set field
// will replace this lookup; keep callers going through this helper so the swap is one file.
export function isNewToTribe(learner) {
  if (!learner || !learner.id) return false;
  // Guide-set field wins once set (true OR false); the hard-coded roster is only the seed
  // default until a guide has toggled this learner. This is how the stopgap retires itself.
  if (typeof learner.newToTribe === 'boolean') return learner.newToTribe;
  return Boolean(NEW_TO_TRIBE[learner.id]);
}
