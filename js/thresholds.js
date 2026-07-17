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
// values judgment about where a child's readiness work lives across their life.
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
};

// The wheel slice a threshold belongs to for a given target studio, or null if
// unplaced ("not placed yet" -> the render treats it as invitation, never
// deficit). Returns null whenever the mapping is unratified, so nothing
// unratified can steer a learner's year.
export function thresholdLifeArea(targetStudio, thresholdId) {
  if (!MAPPING_RATIFIED) return null;
  return THRESHOLD_LIFE_AREA[targetStudio]?.[thresholdId] ?? null;
}

// Every threshold (skills + character) for a target studio as a flat list, in
// display order, each tagged with its mapped slice (null until ratified).
function thresholdsWithSlice(targetStudio) {
  const t = getThresholds(targetStudio);
  if (!t) return [];
  return [...(t.skills || []), ...(t.character || [])].map((it) => ({
    id: it.id,
    name: it.name,
    explain: it.explain,
    struggling: it.struggling,
    slice: thresholdLifeArea(targetStudio, it.id),
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
export function buildSlicePlan({ currentStudio, pitchTargetStudio }) {
  const pitching = Boolean(pitchTargetStudio);
  const wheelStudio = pitching ? pitchTargetStudio : currentStudio;
  const areas = getWheelAreas(wheelStudio);
  const prefill = {};
  if (pitching && MAPPING_RATIFIED) {
    for (const item of thresholdsWithSlice(pitchTargetStudio)) {
      if (!item.slice) continue;
      (prefill[item.slice] ||= []).push(item);
    }
  }
  return {
    wheelStudio,
    pitching,
    ratified: MAPPING_RATIFIED,
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
