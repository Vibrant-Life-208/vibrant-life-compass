# Compass Four-Walkthrough Review: Leadership Synthesis

*8-circle independent review of the four Compass walkthroughs (Discovery, Adventure, Launchpad, Parent-Spark). Prepared for Picard / Sisko / Cura ahead of the 12:00 Jenna meeting.*

## Executive Read

All eight circles reviewed independently and converged hard. The learner-facing current-wheel flow is genuinely careful, but every circle found the same thing: the un-sorting was built where the reviews looked (the learner's solo screen) and survives at the edges nobody scoped - the parent surface still scores, the pitch-gate still fires for held learners, and Adventure's becoming-slices still render a finish line. Three walkthroughs are live-and-flawed (Discovery, Adventure); one is a labeled void (Launchpad crossing); one is effectively unbuilt (Parent-Spark). Before 12:00, three things matter most: (1) the parent view ships a literal percentage score on a child today and is outside every guard - fix or gate it now; (2) `isBecomingSlice` hardcoded to 'heart' means every Adventure Spirit/Emotions goal gets a finish line - the single highest-leverage code fix, but it needs Jenna's which-areas-are-becomings call; (3) the Launchpad pitch fires an age-gate and empty ceremony at Jaxton and dangles the ladder at Andie, and the school-model question (gate vs first-year-priority) must be settled before any Launchpad content is authored.

## Cross-Circle Patterns (convergence = confidence)

**1. The parent surface scores a child - ALL 8 CIRCLES.**
Every circle independently flagged `parent-view.js` renderRecap computing `pct = Math.round((approved/total)*100)` and "X of Y session goals reached." It is live (not behind CURRENT_WHEEL_BUILD), outside the c1-no-sorting guard's scope, and is exactly the report-card/second-scorecard the watch card names as failure. PDC, COC, SSC, OIG, TCC, MAC, CGC, IW all named it. SSC and CGC rated it a blocker. This is the single most-converged finding in the entire review.

**2. `isBecomingSlice` hardcoded to 'heart' breaks Adventure - PDC, COC, SSC, OIG, MAC, IW (6 circles).**
`goal-arc.js:54` returns true only for 'heart'. Adventure has no Heart slice; its becomings are Spirit and Emotions. So every Adventure goal, including the two becomings, gets the finish-line spine "Set up -> The challenge -> Cross the finish line." OIG verified at runtime that `weeklyKindFor('Spirit')` returns 'finish'. This is structural behavior below the copy layer, so the copy-grep guard passes green on a real violation.

**3. The Launchpad crossing is a labeled void AND a mis-modeled gate - PDC, COC, SSC, OIG, TCC, MAC, CGC, IW (all 8 touched it).**
Two distinct problems converged: (a) `nextStudio('adventure')='launchpad'` fires the age-gate pitch ("15 by December 2026, will you have?") when the tracker says Launchpad requirements are first-year priorities, not entry gates; (b) `getThresholds('launchpad')` is null so Jaxton opts into a confirmed-but-empty ceremony - a banner promising carried work over blank slices. Multiple circles independently warned: do NOT clone THRESHOLDS.adventure to fill the gap, because the code path is primed to re-import the exact pre-entry sorting the model forbids.

**4. The age-gate/pitch is dangled at held learners - PDC, COC, SSC, CGC, IW (5 circles).**
The pitch step fires for any learner with a non-null `nextStudio`, with no concept of "held by age gap" or "returning stayer." Andie (and Mason in Discovery) get "Launchpad/Adventure will be there when it's your time" - the watch card's "sharpest edge of the day." The app cannot tell a mover-up from a held stayer because that distinction is not in the data.

**5. The guards protect the unbuilt future and leave the live present open - PDC, COC, SSC, OIG, TCC, MAC, CGC (7 circles).**
c1-no-sorting.mjs is Discovery-only and explicitly scopes out legacy surfaces. So it passes green on: the Adventure becoming-spine bug, the parent percentage, the year-view "Approved" badge. TCC and OIG both noted "green does not mean covered." The wall guards the room being built and leaves the room people actually stand in today.

**6. Studio-specific values were authored Discovery-first and never generalized - COC, OIG, SSC, MAC (4 circles).**
The engine is genuinely wheel-agnostic, but every studio-specific DATA point is a hardcoded Discovery chokepoint: 'heart' in goal-arc, `sliceInvitationCopy` covering only Movement/Family/Fun (with a dead 'Fun' key Adventure does not even have), `getThresholds` having only 'adventure', the `/^adv_/` write-wall regex. The code degrades to a colder generic fallback rather than failing loud, so non-Discovery learners get a thinner flow with no guard tripping.

**7. No authorship dimension on goals ("whose goal, in whose words") - PDC, COC, SSC, OIG, TCC, MAC, CGC, IW (all 8).**
The Parent-Spark design question has no schema representation. There is no `entered_by` / `authored_by` field, so a parent-entered goal and a child-authored goal are the same row. Driver-mode (parent authors + scores) is not "hard or impossible" as the watch card requires - it is the only representable mode, because authorship is unmodeled. TCC adds the security layer: family RLS grants blanket write with no per-write attribution.

## Blockers and High-Severity Findings

| Finding | Walkthrough | Where | Circles |
|---|---|---|---|
| Parent view renders a percentage + "X of Y reached" score on a child; live, ungated, unguarded | Parent-Spark | `js/parent-view.js:126-137` | ALL 8 (SSC, CGC = blocker) |
| `isBecomingSlice` hardcoded to 'heart'; every Adventure Spirit/Emotions goal gets finish-line spine | Adventure | `js/goal-arc.js:53-55` | PDC, COC, SSC, OIG, MAC, IW |
| Launchpad crossing = confirmed-but-empty ceremony (banner over blank slices, no THRESHOLDS.launchpad) | Launchpad | `js/thresholds.js:20-74`; `js/modals.js:2072-2073` | PDC, COC, SSC, OIG, MAC, CGC, IW |
| Launchpad pitch reuses Adventure entry-gate semantics; contradicts first-year-priority model | Launchpad | `js/modals.js:1642-1652`; `js/studios.js:427` | PDC, COC, SSC, OIG, CGC, IW |
| Age-gate/pitch dangled at held stayers (Andie, Mason); no held-by-gap state | Adventure/Discovery | `js/modals.js:1293-1303`; `js/north.js:50-52` | PDC, COC, SSC, CGC, IW |
| Parent goal badge "In review" / approval-as-weapon un-converted | Parent-Spark | `js/parent-view.js:161-165` | SSC, COC, CGC |
| No Spark-parent scaffold/co-pilot surface; only built parent surface is the scorekeeper | Parent-Spark | `js/parent-view.js`; `js/modals.js:1223` | PDC, SSC, OIG, MAC, CGC, IW |
| c1-no-sorting guard is Discovery-only; false-green on Adventure/Launchpad/parent | All | `scripts/c1-no-sorting.mjs:111,120,129` | OIG, TCC, CGC, SSC, PDC |
| Write-wall ships in REPORT mode (logs but proceeds), not THROW | All | `js/goal-write-wall.js:53` | COC |
| Crypto key persists on shared iPad through sign-out (password-decryption key residency) | Parent-Spark | `js/crypto.js:47-58`; `js/auth.js:79-88` | TCC |

## DECIDE NOW (before/at 12 - cheap, safe, unblocks today)

These do not need Jenna or the school. They are one-to-two-file changes that close live exposures before the watch.

1. **Neutralize the parent score.** Drop the `${pct}%` span and the "X of Y session goals reached" line in `parent-view.js:126-137`; replace with a non-counting witness line ("What they're growing this session:"). Remove the "In review" approval badge (161-165). This is the most-converged finding and a one-file fix.
2. **Suppress the Launchpad pitch step for Jaxton.** Short-circuit `renderPitch` (or gate the pitch-step insertion at `modals.js:1299-1303`) when `getThresholds(pitchTarget)` is null, so no age-gate and no empty "Working toward your pitch" banner renders. Do not let a confirmed-but-empty ceremony fire.
3. **Fail `isBecomingSlice` toward presence, not finish-line.** Even before the which-areas decision lands, make Adventure's ambiguous slices render the presence note rather than the finish spine (fail-safe direction). Full generalization to a per-studio data map is a Later item, but the harmful default must not survive an Adventure watch.
4. **Verify pitchCutoff live value in-session.** It currently yields "December 2026" and matches the school's "15 by December" - confirm against the committee's exact cutoff and record it verified so it is not re-litigated in the room. Note OIG's Aug-17 cycle-boundary drift caveat: this is a per-session check, not a one-time one.
5. **Extend c1-no-sorting to cover parent-view.js** (or add a sibling guard) that hard-fails on a percentage/"N of M"/approval-verdict shape on any parent surface. Closes the false-green gap for the one live surface that scores.
6. **Purge the crypto IndexedDB store in clearSession() / idle-logout** so a shared studio iPad does not retain a signed-out learner's password-decryption key (TCC). Confined to `auth.js` + `crypto.js`; safe.
7. **Record the standing decision** that today's Parent-Spark session is a design conversation, not a walk of a built flow - do NOT improvise a goal-entry field for a real 5-year-old's parent, because there is no author/mode guardrail behind it.

## PROPOSE TO JENNA (needs the guide's judgment or the school)

1. **The which-Adventure-slices-are-becomings decision.** Spirit + Emotions at minimum; Joy / Home / Family are the open call. This is a values judgment that must live as data, not a code default, and it gates `isBecomingSlice` being correct for Kyra and Andie. It blocks the full code fix.
2. **The Spark parent role model.** Decide whether "child supplies content, parent supplies capability" is a system property (an `entered_by` / whose-words field the app enforces) or an adult-discipline stance the app trusts. Recommendation from multiple circles: make driver-mode structurally impossible by never giving a parent a goal-TEXT field for a Spark - parent gets capability actions (read-aloud, remind, celebrate), the content box is the child's dictation, verbatim and attributed.
3. **Confirm the Launchpad model with the school.** Are Launchpad requirements first-year priorities (carried after entry as goals) or entry gates? If post-entry, delete the pitch-gate path entirely rather than fill it in. This decision must precede any THRESHOLDS.launchpad content, because the code is primed to clone the Adventure gate by default.
4. **The held-learner question.** Should the app raise the Launchpad/Adventure ladder to Andie/Mason at all? The most no-sorting move is a branch that skips the pitch entirely for a learner the guide marks as deepening/held. This needs the first-year/held-status schema decision (currently blocked) and a school-owned policy on whether the app should ever offer the pitch on studio-position alone.
5. **The approval -> witness conversion.** Still marked "needs a captain call" in the tracker, but the approval VERB ("send for approval," "Approved ✓") is live across setup, year-view, and partner.js today. CGC asks the hard question directly: can the watch honestly proceed while live copy contradicts the "app never scores" principle? Decide whether the legacy surfaces get converted before or after the current-wheel flip - an explicit dated decision, not a scoping accident.
6. **The home-academics boundary + the family-view wall.** A home-academic goal a parent reflects in is guide-visible by default (no learner-private scope exists). And the four learners are siblings sharing a family view; IW asks that "family view is values + strengths only, reflection-only, forever" be written as an enforced wall (like the parent-badges category wall), not a code comment, before any progress field can turn four siblings into a within-family ladder.
7. **Consent posture for the live test.** CGC's unique flag: today's supervised test enters and stores real children's mirror answers and goals with no recorded parental consent or learner assent artifact. Decide the posture before the first real-child data is typed.

## LATER (real, but post-watch / pre-flip)

1. **Add an explicit first-year / studio-tenure column** to the learners table rather than deriving from `created_at` (COC: derivation is an ontology category error - `created_at` answers "when did this row appear," never "is this learner new to this studio," and would misclassify exactly the cohort it exists to protect: Kyra's tribe-transition-within-studio is invisible to created_at).
2. **Generalize the Discovery-first data** into per-studio maps: `isBecomingSlice`, `sliceInvitationCopy` (author the six unauthored Adventure slices, remove the dead 'Fun' key), the write-wall regex. Sibling-shape to THRESHOLD_LIFE_AREA (as-data discipline).
3. **Reconcile the goals.status enum.** Schema allows ('active','done','archived') but the app renders 'approved'/'pending-approval'. One source of truth for what states a goal can hold; 'approved' should not be one if the app never scores (COC).
4. **Decide the write-wall THROW promotion criterion.** Document the exact Stage-V condition that flips `goal-write-wall.js` from report to throw, and confirm nothing in the current-wheel dark write path emits a report-mode warning during the supervised walk (COC).
5. **Build the three rites (Root/Tend/Deepen, Arrive, Mirror).** MAC's unique finding: the restraint half of every principle is built; the consecration half is unbuilt or provisional. The Mirror rite (year's return of the learner's own prior words) has zero surface. This is the MAC session's actual deliverable and needs the Bareil+Vic+Accord+Comes design session before first-year/stayer walkthroughs can meet a distinct myth.
6. **Motion language for the rites** (Chapel): belonging and achievement currently move identically (innerHTML swaps). The two-way voice rule is copy-only today.
7. **Carry the ruler-removal swaps into the surfaces the first pass missed:** `renderSliceReflectPage` "Halfway there" and the "you are here" chip in `goal-arc.js:113` (MAC).
8. **Reconsider the 5-goal section-gate for first-years** once first-year detection exists (SSC/PDC): a locked priorities section behind 5 filled goals reads as fell-short-until for Kyra.
9. **Notifications impersonation vector** (TCC): `notifications_insert_any` lets any authenticated user forge a guide/committee-sourced pitch notification. Scope inserts or document as known.
10. **Ratify or refuse the guide-facing bottom-ranked cohort-strengths view** (TCC `insights.js` lowValues) for the learner tiers with an explicit sign-off - a ranked "lowest strengths in this tribe" is a group-level sort even at counts-only.

## Honest Disagreement / Tensions

- **Path-blindness is a virtue and a hazard, named by the same circles.** PDC, COC, and CGC all flagged that the flow cannot tell the four paths apart. PDC and COC frame this as protective (the growth-mirror stays path-blind, so it cannot sort). CGC sharpens the tension: path-blindness is a virtue AT THE MIRROR and a hazard AT THE GATE - the same mechanism that protects Kyra from being sorted in the mirror dangles the ladder at Andie at the entry point. This is not a contradiction to average away; it means the fix must be surgical (suppress the pitch for held learners) without adding path-awareness to the mirror.
- **Fix-the-empty-Launchpad-crossing is itself a trap.** Multiple circles want Jaxton's void closed, but every one of them also warns that the obvious fix (author THRESHOLDS.launchpad) is the wrong one if it clones the Adventure gate. The safe move today is suppression, not filling. The tension is real: the bug is visible, and the intuitive fix is worse than the bug.
- **Should the legacy approval surfaces be converted now or at the flip?** CGC pushes for now (the live copy contradicts the principle during a real watch). Others (PDC) frame it as a dated scoping decision that can follow the current-wheel flip. Leadership needs to make this call explicitly rather than letting it stay a scoping accident.
- **TCC stands somewhat alone on where the real risk lives.** Seven circles aimed at the learner's solo screen. TCC's distinct read: all four walkthroughs are adult-supervised, so the actual risk surface in each is the ADULT (parent scoring, family blanket-write, shared iPad key residency, notification forgery) - and the built guardrails all assume the learner is alone. This is not disagreement so much as a lens the others did not carry; it is worth weighting because it reframes what the watch should actually test.

## Per-Circle Sharpest Unique Finding

- **PDC:** The gating asymmetry is the through-line - Discovery is gated by `CURRENT_WHEEL_BUILD` (true), everything else by `MAPPING_RATIFIED` (false). The whole un-sorting redesign is REAL only for a Discovery learner; Adventure pitchers and Launchpad crossers silently fall back to blank/legacy behavior. "Wheel-agnostic in structure but discovery-only in what renders warm."
- **COC:** The four paths are honored by ABSENCE, not design - the mirror is path-blind because paths are unmodeled; the fresh-start is preserved because first-year is undetectable. The safety is currently a property of the schema's emptiness, and it stops being free the moment the first path-distinguishing field is added.
- **SSC:** Vulnerability gets LESS protection exactly where it should get more - the tenderest blank slices (Emotions, Spirit) get generic fallback copy, the tensest self-report (per-goal "starting from" mirror) has no grounding beat, and the youngest (Spark) and newest (first-year) hit the same 5-goal gate and same parent scorecard as everyone else.
- **OIG:** "Ratified/pitching = true" is being forced by `CURRENT_WHEEL_BUILD` regardless of whether the target studio has content - `buildSlicePlan` returns ratified:true and pitching:true for Jaxton's Launchpad crossing even though zero Launchpad thresholds exist. The truthiness of a flag stands in for the existence of data.
- **TCC:** The read-boundary is genuinely strong (my_visible_learners, MIN=5 k-anon floor, per-learner E2E crypto); every gap is one layer up - WRITE attribution, scoring in rendered copy, notification impersonation, shared-device key residency. The wound moved from the child's screen to the parent's/guide's screen.
- **MAC:** The build honored the RESTRAINT half of every principle and skipped the CONSECRATION half. No-sorting guards, write-walls, becoming-refusals all pass; but every place a principle asks to CONSECRATE a belonging (name Root/Tend/Deepen, welcome the Arrive, hold the Return) is unbuilt or provisional. "We removed the ladder but did not furnish the room."
- **CGC:** Build maturity is inversely correlated with governance sensitivity - the flow is most finished where a returning Discovery learner deepens (low stakes) and most absent where a real 5-year-old's parent or a lone mover-up needs the most careful consent design. Plus the sole consent-artifact flag: no recorded parental consent or learner assent for the live test.
- **IW:** The four learners are SIBLINGS across studios sharing a family view. Within one family, four kids of different ages become a ladder the instant any progress field lands - and the no-comparison rule is a code comment (`family.js:157`), not an enforced wall. The family context makes the absence of an "Arrive" myth for Kyra sharper than for an only child.

We evoke - we never extract.
