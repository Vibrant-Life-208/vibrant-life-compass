// Thresholds to Thrive - the Acton readiness criteria a learner meets, then
// pitches, before moving up a studio. Content is per-transition. The app DISPLAYS
// and lets the learner self-track; it never adjudicates (guide/committee/
// signatures happen in person). See the pitch spec.
// Discovery -> Adventure content from the captain's threshold doc (2026-07-11).
// Adventure -> Launch Pad is owed (a Launch Pad candidate need not have finished
// high-school work - it continues into their first Launch Pad year).
//
// NAMED TOOLS ARE INTENTIONAL HERE (captain 2026-07-15). Unlike the subject
// categories in studios.js - which are program-agnostic (Math, Reading, Writing)
// because a learner works the subject through whatever tool they use - a
// threshold is a concrete test-out: the specific assessment that PROVES
// readiness (Khan Course Challenges, Lexia Core5, TypingClub placement, etc.).
// Do NOT genericize these tool names to match the subject rename; the specificity
// is the point of a proof-of-mastery gate.

import { getStudioName, sliceIdForLabel } from './studios.js';
import { getWheelAreas } from './wheel.js';
import { BACKEND_TYPE } from './backend/config.js';

export const THRESHOLDS = {
  adventure: {
    intro: 'In Acton schools, when a learner is ready to level up, they reach certain thresholds before being accepted into the next studio - not by a birthday, but by real accomplishment. The middle-school studio brings greater responsibility and greater freedom. These thresholds make sure you are truly ready to thrive there.',
    deadline: 'April 30',
    signer: 'Ms Rose',
    skills: [
      { id: 'adv_lead_launches', name: 'Lead 2 morning Launches',
        explain: 'Pick, practice, and then lead two morning Launches.',
        struggling: 'Set up a time with Ms Rose during Guide Support, or buddy up with a studio mate to help you pick and practice.' },
      { id: 'adv_lexia', name: 'Finish Lexia Core5',
        explain: 'Graduate Core5.',
        struggling: 'Make a plan with your parents - a set time and an accountability system. This is a place to practice grit.' },
      { id: 'adv_khan', name: 'Master Khan grade levels 2-5',
        explain: 'Show mastery: 90% or higher on the Course Challenges for grade levels 2-5 on Khan Academy.',
        struggling: 'Make a plan with your parents - a set time and an accountability system. Perseverance is the trait here.' },
      { id: 'adv_spelling', name: 'Proficient spelling',
        explain: 'The Adventure Readiness Committee will evaluate and scale 1-5, and share feedback.',
        struggling: 'Spelling City has a free version that can help you practice.' },
      { id: 'adv_handwriting', name: 'Proficient handwriting',
        explain: 'The Adventure Readiness Committee will evaluate and scale 1-5, and share feedback.',
        struggling: 'Handwriting Without Tears is an excellent practice booklet to work on alongside.' },
      { id: 'adv_jt', name: 'Journey Tracker proficiency (JT)',
        explain: 'Attend all 3 JT seminars in March (Wednesdays 1:15-2:00), led by 2 Adventure learners, to become proficient at JT.',
        struggling: 'Talk with Ms Rose about catching up if you miss a seminar.' },
      { id: 'adv_typing', name: 'Typing skills',
        explain: 'On TypingClub.com, make a free account and take the Placement Test. If you place past the Home Row section (lessons 1-26), you are good to go; if not, complete all of the exercises in that section.',
        struggling: 'Practice a few minutes a day in TypingClub - it adds up fast.' },
    ],
    character: [
      { id: 'adv_mindset', name: 'Heroic mindset: growth + creator',
        explain: 'Practice a growth mindset and being a Creator (not a victim). You will self-scale 1-5, then 5 random tribemates scale you, then make SMART goals for the lowest traits and note your progress in your Pitch.',
        struggling: 'SMART goals are a great tool to level up any trait. Studying the trait more deeply helps too.' },
      { id: 'adv_effort', name: 'Excellent effort, focus & intentionality',
        explain: 'Self-scale 1-5 plus tribemate feedback; SMART goals for growth.',
        struggling: 'Pick one small, specific SMART goal and check it weekly.' },
      { id: 'adv_leadership', name: 'Leadership & culture building',
        explain: 'Self-scale 1-5 plus tribemate feedback; SMART goals for growth.',
        struggling: 'Look for one small way to build the studio culture each day.' },
      { id: 'adv_soaring', name: 'Soaring freedom for 2 consecutive weeks',
        explain: 'Each week, if you follow your contract (lose fewer than 2 V-bucks) and hit 3/4 of your Core goals, you are at Soaring freedom. Hold it two weeks in a row - it shows you are ready for more responsibility.',
        struggling: 'Find which one is the challenge - contract or Core goals - and make a joint plan with Ms Rose.' },
      { id: 'adv_courage_book', name: 'Read "Courage to Grow"',
        explain: 'Read Courage to Grow.',
        struggling: 'Read a chapter a few nights a week; talk about it with a parent or guide.' },
    ],
    opportunities: [
      { name: 'Curiosity Quest', when: 'Session 7 (May)',
        detail: 'Lead ~2 days of hands-on challenges on a topic you love, growing the curiosity of others.' },
      { name: 'Discovery Reflection & Adventure Pitch', when: 'Spring',
        detail: 'Share what you are grateful for from Discovery, the traits you leveled up, and how you will contribute to Adventure.' },
      { name: 'Sign your Commitment Statement', when: 'Before the new year',
        detail: 'Sign the Adventure studio commitment statement you agree to hold to.' },
    ],
  },
};

export function getThresholds(targetStudio) {
  return THRESHOLDS[targetStudio] || null;
}

// ── Threshold -> wheel slice (life area) map ─────────────────────────────────
// The 1-year plan is organized by wheel slice. When a learner opts into a pitch,
// their thresholds are PRE-INSERTED into the slice they belong to, so the year
// reads as a life to grow, not a checklist to clear. Which slice each threshold
// belongs to is a PEDAGOGY judgment - authored here as DATA, never inferred in
// code, so the placement is visible and reviewable. (Captain 2026-07-14; sibling
// to CATEGORY_LIFE_AREA's gated learner-tier block in studios.js.)
//
// Keyed by TARGET studio (the studio being pitched INTO) because a pitching
// learner plans by the wheel of the studio they are growing into (captain call
// 2026-07-14), and the slice labels below are that target wheel's labels
// (getWheelAreas(targetStudio)). Adventure is the only threshold set that exists
// today, so it is the only target mapped.
//
// COVERAGE FRAME, NOT COMPLETENESS: a slice with no threshold (Movement, Family,
// Home, Joy below) is an invitation the learner fills themselves, never a
// deficit. Do not "balance" the map by inventing placements to fill every slice.
//
// *** RATIFIED 2026-07-15 (Accord + TCC coverage-frame sign-off). *** This is a
// values judgment about where a learner's readiness work lives across their life.
// It passed the coverage-frame review the v0.18 note references - captain sign-off
// on placements, Accord (trauma-informed) + TCC (data-sovereignty) on the frame.
// Jake's separate pedagogy read and the watch-with-a-real-learner gate remain open;
// this flag is a code-enable, not learner exposure. While it is false the slice
// step renders BLANK boxes for everyone (no unratified placement reaches a
// learner). See docs/design/2026-07-14-threshold-to-wheel-slice-mapping-v0.1.md.
//
// *** HELD 2026-07-16 (tripwire fired — captain). *** The 2026-07-16 re-ratification
// moved the direction to the CURRENT (Discovery) wheel and left this target-wheel
// flag live under a tripwire: hold before any real-learner watch/onboarding that
// predates the current-wheel ship. Guides log in Aug 2, Session 1 Aug 17 (first
// real-learner exposure) and the current-wheel direction is not shipping by then,
// so the tripwire fires. Held = false: pitchers get blank invitational slice boxes
// (coverage frame intact); the interim year-view visibility fix still surfaces
// whatever they write. DO NOT re-enable by flipping back to true — the next
// activation is the current-wheel Discovery mapping (THRESHOLD_LIFE_AREA below maps
// to ADVENTURE), which needs its own Accord + TCC/Satis coverage-frame review first.
// Refs: agents/meetings/2026/07/2026-07-16-compass-threshold-wheel-slice-reratification.md;
// docs/design/2026-07-16-current-wheel-build-scope.md.
export const MAPPING_RATIFIED = false;

// Current-wheel build gate (Stage P2, 2026-07-17; per-learner as of v0.23, 2026-07-18).
// Separate from MAPPING_RATIFIED by design: the 2026-07-16 re-ratification moved the
// direction to the learner's CURRENT wheel and ruled the legacy target-wheel flag must
// NOT be flipped back to true - the current-wheel activation needs its own gate. When the
// resolver returns false, buildSlicePlan and thresholdLifeArea behave exactly as the legacy
// target-wheel path did (pitchers see the target wheel, blank boxes).
//
// Replaces the old uncommitted global boolean. Local dev sees the full build for everyone
// (no real learners exist locally). Production gates PER-LEARNER via the current_wheel_test
// allow-list column (v0.23) - default false = today's behavior for everyone. Enabling a real
// learner is Salus + PDC's ruling, not an infra flip. Committable and safe: prod default is
// false = today. Ref: docs/design/2026-07-18-cohort-gated-wheel-flag-spec.md.
//
// Mature-tier auto-on (2026-07-18): the SSC safety lock protects ONLY the vulnerable young
// tiers - Sparks / Discovery / Adventure. Everyone outside that lock - Launch Pad learners and
// the guide/adult protagonist - gets the current-wheel cadence automatically, no per-learner
// flag needed. 'launchpad' is the Launch Pad learner studio; 'guide-summer' is the synthetic
// studio getLearner attaches to a guide test-driving as protagonist (see local-store getLearner
// fallback + wheel.js ADULT_AREAS). The three young tiers stay gated per-learner on
// current_wheel_test, byte-identical to the prior resolver: a young learner is NEVER auto-enabled
// here - only Salus + PDC may flip their flag. Non-learner adults (parents/owners) on production
// have no `learners` row, so getLearner returns null and every call site short-circuits before
// this resolver; they are current-wheel via the BACKEND_TYPE gate in local dev and simply have no
// learner-shaped cadence surface to gate in production.
const MATURE_STUDIOS = new Set(['launchpad', 'guide-summer']);
export function isCurrentWheelBuild(learner) {
  if (BACKEND_TYPE === 'local') return true;
  if (!learner) return false;
  if (MATURE_STUDIOS.has(learner.studio)) return true;
  return Boolean(learner.current_wheel_test);
}

export const THRESHOLD_LIFE_AREA = {
  // Discovery -> Adventure. Target wheel: Movement, Mind, Spirit, Emotions, Family,
  // Friends, Home, Joy (getWheelAreas('adventure')).
  adventure: {
    // Skills - the academic + tool readiness work.
    adv_khan: 'Mind',
    adv_lexia: 'Mind',
    adv_spelling: 'Mind',
    adv_handwriting: 'Mind',
    adv_jt: 'Mind',
    adv_typing: 'Mind',
    adv_lead_launches: 'Friends',   // leading morning Launches = studio culture / peers
    // Character - the heroic-mindset + freedom readiness work.
    adv_mindset: 'Emotions',        // growth mindset + Creator (not victim) = inner life
    adv_effort: 'Emotions',         // effort, focus, intentionality = self-regulation
    adv_soaring: 'Emotions',        // holding the contract + Core goals = self-governance
    adv_leadership: 'Friends',      // leadership & culture building = community
    adv_courage_book: 'Spirit',     // reading Courage to Grow = meaning / who I'm becoming
  },

  // Discovery (current-wheel direction). Build-plan Stage P1 (2026-07-17): the SIGNED
  // Discovery placement of the pitch thresholds. A Discovery learner pitching to Adventure
  // plans on their OWN (Discovery) wheel: Movement, Learning, Heart, Family, Friends, Fun.
  // Emotions and Spirit have no Discovery home, so the becoming cluster collapses into Heart.
  // DORMANT: thresholdLifeArea() still returns null (MAPPING_RATIFIED=false), and nothing
  // passes targetStudio:'discovery' until Stage P2 inverts buildSlicePlan. Activation is
  // Stage V only, under the watch. Load: Learning 6, Heart 4, Friends 2; Movement/Family/Fun
  // are invitations (no threshold). Signed 2026-07-17 (Jake+Accord+TCC, 5/5, no dissent).
  // Ref: docs/design/2026-07-17-discovery-wheel-threshold-mapping-v0.1.md.
  discovery: {
    // Academics + tools -> Learning (Discovery's education slice; the mind at work).
    adv_khan: 'Learning',
    adv_lexia: 'Learning',
    adv_spelling: 'Learning',
    adv_handwriting: 'Learning',    // skill, not fine-motor (captain 7/15) -> Learning, not Movement
    adv_jt: 'Learning',
    adv_typing: 'Learning',
    // Leading peers / studio culture -> Friends.
    adv_lead_launches: 'Friends',
    adv_leadership: 'Friends',
    // Becoming cluster -> Heart (no Emotions/Spirit slice on Discovery; Heart is the
    // becoming-slice, NOT a regulation/inventory slice - render as portrait).
    adv_mindset: 'Heart',
    adv_effort: 'Heart',            // RESOLVED to Heart 2026-07-17 (Learning would read effort as measured achievement)
    adv_soaring: 'Heart',
    adv_courage_book: 'Heart',
  },
};

// The wheel slice a threshold belongs to for a given placement studio, or null if
// unplaced ("not placed yet" -> the render treats it as invitation, never deficit).
// Gated per mapping: the `discovery` (current-wheel) placement is gated by
// `currentWheel` (resolved per-learner via isCurrentWheelBuild by the caller); the legacy
// target-wheel placement by MAPPING_RATIFIED (held false). Either way, null until its gate
// opens, so nothing unratified steers a year. `currentWheel` defaults to false so a caller
// that omits it gets the legacy (flag-off) placement path.
export function thresholdLifeArea(placementStudio, thresholdId, currentWheel = false) {
  const gate = placementStudio === 'discovery' ? currentWheel : MAPPING_RATIFIED;
  if (!gate) return null;
  return THRESHOLD_LIFE_AREA[placementStudio]?.[thresholdId] ?? null;
}

// Every threshold (skills + character) for a threshold studio as a flat list, in
// display order, each tagged with its mapped slice (null until the relevant gate opens).
// `thresholdStudio` is the studio whose thresholds to list (the pitch target); `placementStudio`
// is the wheel that places them (defaults to the same studio; the current-wheel path passes the
// learner's current studio so the target's thresholds are placed on the current wheel).
function thresholdsWithSlice(thresholdStudio, placementStudio = thresholdStudio, currentWheel = false) {
  const t = getThresholds(thresholdStudio);
  if (!t) return [];
  return [...(t.skills || []), ...(t.character || [])].map((it) => ({
    id: it.id,
    name: it.name,
    explain: it.explain,
    struggling: it.struggling,
    slice: thresholdLifeArea(placementStudio, it.id, currentWheel),
  }));
}

// Build the model for the 1-year slice-plan surface. A pitching learner plans by
// the wheel of the studio they are growing INTO; everyone else plans by their own
// current wheel, blank. `prefill` maps a slice LABEL to the thresholds placed
// there - empty (all boxes blank) unless the mapping is ratified AND the learner
// opted into a pitch.
//
//   buildSlicePlan({ currentStudio: 'discovery', pitchTargetStudio: 'adventure' })
//
// pitchTargetStudio is the value stored on learner.pitchTargetStudio at opt-in;
// pass null/undefined for a learner who is not pitching.
//
// `currentWheel` is the per-learner gate the caller resolves via isCurrentWheelBuild(learner)
// - it replaces the old module-level CURRENT_WHEEL_BUILD constant. It defaults to false so an
// omitting caller gets the legacy (flag-off) target-wheel path, byte-identical to before.
export function buildSlicePlan({ currentStudio, pitchTargetStudio, currentWheel = false }) {
  const pitching = Boolean(pitchTargetStudio);
  // Current-wheel direction (Stage P2, gated by `currentWheel`): EVERYONE plans on their
  // own current wheel, including pitchers. A pitcher's threshold SET still comes from the
  // target studio; its slice PLACEMENT moves to the current wheel. While `currentWheel`
  // is false this is byte-identical to the legacy target-wheel path (pitcher -> target wheel,
  // blank boxes). NOTE for Stage O: when the flag is on, wheelStudio (current) no longer
  // equals the pitch target, so the onboarding lead copy ("your pitch to <wheelStudio>") must
  // be rewritten to name the target separately from the wheel being planned on.
  const wheelStudio = currentWheel
    ? currentStudio
    : (pitching ? pitchTargetStudio : currentStudio);
  const placementStudio = currentWheel ? currentStudio : pitchTargetStudio;
  const areas = getWheelAreas(wheelStudio);
  const prefill = {};
  if (pitching && (currentWheel || MAPPING_RATIFIED)) {
    for (const item of thresholdsWithSlice(pitchTargetStudio, placementStudio, currentWheel)) {
      if (!item.slice) continue;
      (prefill[item.slice] ||= []).push(item);
    }
  }
  return {
    wheelStudio,
    pitching,
    pitchTargetStudio: pitchTargetStudio || null,
    ratified: currentWheel || MAPPING_RATIFIED,
    areas: areas.map((label) => ({
      label,
      sliceId: sliceIdForLabel(label),
      prefill: prefill[label] || [],
    })),
  };
}

// Build the thresholds page HTML for a target studio. status is a map of
// { threshold_key: 'not_started'|'working'|'done' } (learner-owned, optional).
export function renderThresholdsHtml(targetStudio, status = {}) {
  const t = getThresholds(targetStudio);
  const name = getStudioName(targetStudio);
  if (!t) {
    return `<p class="thresholds-empty">Thresholds for ${escapeHtml(name)} are coming soon. Ask your guide about getting ready.</p>`;
  }
  const pill = (key) => {
    const s = status[key] || 'not_started';
    const label = s === 'done' ? 'Done' : s === 'working' ? 'Working on it' : 'Not started';
    return `<button type="button" class="threshold-status status-${s}" data-threshold="${escapeHtml(key)}">${label}</button>`;
  };
  const item = (it) => `
    <li class="threshold-item">
      <div class="threshold-head">
        <span class="threshold-name">${escapeHtml(it.name)}</span>
        ${pill(it.id)}
      </div>
      <p class="threshold-explain">${escapeHtml(it.explain)}</p>
      <details class="threshold-help"><summary>If I'm struggling</summary><p>${escapeHtml(it.struggling)}</p></details>
      <details class="threshold-plan">
        <summary>Break into weekly steps</summary>
        <p class="threshold-plan-hint">What are the small weekly moves toward this? Start small, build from there.</p>
        <div class="threshold-steps">
          <input type="text" class="threshold-step-input" placeholder="On [when], I'll [what]">
          <input type="text" class="threshold-step-input" placeholder="On [when], I'll [what]">
          <input type="text" class="threshold-step-input" placeholder="On [when], I'll [what]">
        </div>
        <div class="threshold-when">
          <label><input type="radio" name="tstep-when-${escapeHtml(it.id)}" value="now" checked> Start now</label>
          <label><input type="radio" name="tstep-when-${escapeHtml(it.id)}" value="session1"> Prep for Session 1</label>
        </div>
        <button type="button" class="btn btn-primary threshold-plan-add" data-threshold-plan="${escapeHtml(it.id)}">Add to my North</button>
      </details>
    </li>`;
  const opp = (o) => `<li class="threshold-opp"><span class="opp-name">${escapeHtml(o.name)}</span> <span class="opp-when">${escapeHtml(o.when)}</span><p>${escapeHtml(o.detail)}</p></li>`;
  return `
    <div class="thresholds-page">
      <h2 class="thresholds-title">Your pitch to ${escapeHtml(name)}</h2>
      <p class="thresholds-intro">${escapeHtml(t.intro)}</p>
      <p class="thresholds-deadline">Turned in to ${escapeHtml(t.signer)} by <strong>${escapeHtml(t.deadline)}</strong>. The committee, signatures, and tribemate scaling happen with your guide - this page is yours to plan and track.</p>

      <h3 class="thresholds-group">Skills</h3>
      <ul class="thresholds-list">${t.skills.map(item).join('')}</ul>

      <h3 class="thresholds-group">Character</h3>
      <ul class="thresholds-list">${t.character.map(item).join('')}</ul>

      <h3 class="thresholds-group">When you have met your thresholds</h3>
      <ul class="thresholds-opps">${t.opportunities.map(opp).join('')}</ul>
    </div>`;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
