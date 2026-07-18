# Discovery Circle Reviews — Consolidated Action Tracker

**Date opened:** 2026-07-17 · **Last merge:** 2026-07-18 (eight-circle walkthrough review folded in)
**Purpose:** single ledger for all action items from the circle reviews — the three founding reviews
(PDC · SSC · MAC, 2026-07-17) and the **2026-07-18 eight-circle walkthrough review** (all circles,
four flows: Discovery / Adventure / Launchpad / Parent-Spark). Source records live in
evoke-agents-backup `agents/meetings/2026/07/` + `agents/decision-logs/2026/07/`; the walkthrough
findings-of-record are `2026-07-18-circle-reviews-walkthrough-findings.md`.
**Principles they serve:** `2026-07-17-discovery-flow-design-principles.md`.
**Standing constraint (CORRECTED 2026-07-18):** MOST of the redesign is dark behind
`CURRENT_WHEEL_BUILD` and does not ship to learners. But the 2026-07-18 review found sorting
surfaces that are **LIVE and outside the flag** — see "Live / un-gated surfaces" below. "All dark;
nothing ships" is no longer true; treat the live surfaces as shipping today. The flag does not flip
until the standing gates hold (bottom of this doc).

Status key: ✅ done · 🔨 scoped-engineering · 🎨 design-session · 🧑‍⚖️ needs-captain-call · 🔒 gated · 🔴 live-un-gated (ships today)

---

## ⚠️ Open leadership decisions + tensions (from the 2026-07-18 walkthrough review)

**Three decisions only leadership can make (needed before/around today's walk):**
1. The live parent score (`parent-view.js:126-137`): fix now, or gate behind the flag, before any
   parent-account walk today?
2. The approval verb (live across setup / year-view / partner.js): convert to witness now, or at the
   current-wheel flip? *(CGC pushes now; PDC frames it as a dated post-flip scope. Do not leave it a
   scoping accident.)*
3. Consent posture for today's live test: real children's answers stored with no recorded parental
   consent / learner assent artifact. Decide before the first real-child answer is typed.

**Two design tensions to discuss (not sortable into a task):**
- **Path-blindness is a virtue at the mirror and a hazard at the gate.** The same mechanism that
  protects Kyra from being sorted in the mirror dangles the ladder at Andie at the entry point. The
  fix must be surgical — suppress the pitch for held learners *without* adding path-awareness to the
  mirror.
- **Fixing the empty Launchpad crossing is itself a trap.** Authoring `THRESHOLDS.launchpad` is the
  wrong fix if it clones the Adventure gate. Suppress today; do not fill.

---

## 🔴 Live / un-gated surfaces (outside `CURRENT_WHEEL_BUILD` — ship to learners today) — NEW 2026-07-18

The category the tracker's "all dark" framing assumed away. All flagged by the eight-circle
walkthrough review; file:line verified.

- [ ] 🔴 **Parent view scores a child.** `parent-view.js:126-137` renders
      `pct = Math.round((approved/total)*100)` + "X of Y session goals reached." Live, ungated,
      outside the c1 guard. The report-card the watch card names as failure. **ALL 8 circles; SSC+CGC
      = blocker.** → decide-now: drop the %/count, replace with a non-counting witness line; remove
      "In review" badge (161-165).
- [ ] 🔴 **Approval verb is live** ("send for approval," "Approved ✓") across setup, year-view,
      partner.js. Contradicts "the app never scores" during a real watch. Ties to T-CC1. **SSC, COC, CGC.**
- [ ] 🔴 **c1-no-sorting guard is Discovery-only → false-green.** `scripts/c1-no-sorting.mjs:111,120,129`
      scopes out legacy + non-Discovery surfaces, so it passes green on the parent score, the Adventure
      becoming-spine bug, and the year-view badge. "Green does not mean covered." **OIG, TCC, CGC, SSC,
      PDC.** → decide-now: extend the guard (or add a sibling) to hard-fail a %/"N of M"/approval-verdict
      shape on any parent surface.
- [ ] 🔴 **Crypto key residency on shared iPad.** `crypto.js:47-58` + `auth.js:79-88` — a signed-out
      learner's password-decryption key persists on a shared studio device. **TCC.** → decide-now:
      purge the crypto IndexedDB store in clearSession() / idle-logout.
- [ ] 🔴🔒 **Notifications impersonation.** `notifications_insert_any` lets any authenticated user forge
      a guide/committee-sourced pitch notification. **TCC.** → scope inserts or document as known.
- [ ] 🔴 **Guide-facing bottom-ranked cohort strengths.** `insights.js` lowValues — a ranked "lowest
      strengths in this tribe" is a group-level sort even at counts-only. **TCC.** → ratify or refuse
      with explicit sign-off.

---

## ✅ Done (2026-07-17)

| Item | Source | Commit |
|---|---|---|
| Foundational principles written where they govern the build | all 3 | `c1374ce` (`…design-principles.md`) |
| Ruler-removal copy pass (partial): "where are you now"→"starting from"; "halfway milestone"→"a marker along the way" | MAC (Hoshi) | `c1374ce` (modals.js) |
| Standing-gate note: watch must include staying + first-year learner; SSC flag-flip safety lock | PDC + SSC | `c1374ce` (build spec) |
| Checkable **no-sorting** rule — C1 #5, sort in neither direction | PDC+SSC+MAC | `4d29b71` (c1-no-sorting.mjs) |

---

## 🔨 Scoped engineering (buildable behind the flag; no design session needed)

- [ ] **First-year detection** — added-this-cycle OR tribe-transitioned (cohort: Rylee, Lyla).
      BLOCKER: no `added-this-cycle`/tribe field on the `learners` table today; needs a column or a
      derivation decision first. *(PDC)*
      — *[sharpened 07-18, COC]* derivation from `created_at` is an ontology category error:
      `created_at` answers "when did this row appear," never "new to this studio," and misclassifies
      tribe-transition-within-studio — exactly Kyra. **Recommend an explicit first-year / studio-tenure
      COLUMN, not derivation.** See T-CC3.
- [ ] **One-spine build** — carried thresholds render as **roots, not rungs**; the pitch/climb is
      never staged inside the app. Partly enforced by C1 #5; the render work remains. *(MAC)*
      — *[sharpened 07-18]* the Launchpad crossing shows this failing live (see Live section +
      Launchpad below). And the write-wall currently ships in **REPORT mode, not THROW**
      (`goal-write-wall.js:53`) — *[NEW 07-18, COC]* decide the Stage-V THROW-promotion criterion and
      confirm nothing in the dark write path emits a report-mode warning during the supervised walk.
- [ ] **Codify the fresh-start principle** as a checkable rule (C1-style) — beyond no-sorting: assert
      first-year surfaces defer the pitch apparatus. *(PDC)* — could extend c1-no-sorting or add #6.
- [ ] **Full string-by-string voice pass + AI-tells audit** (two-way voice rule across EVERY string
      in the flow). The ruler-removal swaps were a partial down-payment; this is the complete pass.
      *(MAC — Hoshi; still owed. Copy is "diagnosed, not treated" until this ships.)*
      — *[sharpened 07-18, MAC]* specific missed surfaces: `renderSliceReflectPage` "Halfway there";
      the "you are here" chip at `goal-arc.js:113`.
- [ ] 🔨 **[NEW 07-18] Generalize the Discovery-first data layer.** Every studio-specific DATA point is
      a hardcoded Discovery chokepoint: `isBecomingSlice`='heart' (goal-arc.js:54), `sliceInvitationCopy`
      (only Movement/Family/Fun, plus a dead 'Fun' key Adventure lacks), `getThresholds` (only
      'adventure'), the `/^adv_/` write-wall regex. Code degrades to a colder generic fallback rather
      than failing loud, so non-Discovery learners get a thinner flow with no guard tripping.
      *(COC, OIG, SSC, MAC.)* Sibling-shape to THRESHOLD_LIFE_AREA (as-data discipline).
- [ ] 🔨 **[NEW 07-18] Reconcile `goals.status` enum.** Schema allows ('active','done','archived'); the
      app renders 'approved'/'pending-approval'. One source of truth; 'approved' should not be a state
      if the app never scores. *(COC.)*

## 🎨 Design sessions (need Accord / Comes / Bareil; gated by the safety lock)

- [ ] **The three honest rites** — Welcome/Arrive · Set-the-Year · the Mirror (four bones:
      entry/consecrate/witness/exit); app sets the table, never blesses the meal; holds a place for a
      human witness, never impersonates one. *(MAC — Bareil + Vic + Accord + Comes)*
      — *[sharpened 07-18, MAC]* the restraint half of every principle is built; the **consecration**
      half is unbuilt or provisional. The Mirror rite (year's return of the learner's own prior words)
      has **zero surface** today.
- [ ] **The path-blind / outcome-blind growth-mirror** — learner's own prior words unannotated;
      grounding beat first; entered not pushed; un-anticipated; = the year's Return/ending.
      *(SSC + MAC — Arcana + Fabula + Bashir/Salus)*
- [ ] **The stayer's narrative spine** — Root → Tend → Deepen; naming-rite; own opening threshold;
      never re-offer the pitch. Two path-myths: returning-stayer = Deepen, first-year = Arrive. *(PDC+MAC)*
- [ ] **Newcomer floor + ceiling** — app-safe-alone + guide/parent-supported mode. *(SSC — Salus+Jake+Comes)*
- [ ] **Somatic anchors + exit ramps** at the four tense points (age gate, blank slice, "where are
      you starting from" self-assessment, fell-short); grounding BEFORE the mirror. *(SSC — Praesens)*
- [ ] **Rest door = true peer** — visual + motion peer; nothing rewards "step" over "rest". *(MAC — Vic + Chapel/motion)*
      — *[sharpened 07-18, MAC/Chapel]* belonging and achievement currently move identically (innerHTML
      swaps). The two-way voice rule is copy-only today; it needs motion language.
- [ ] **Vocabulary-teaching (first-year welcome)** — example-first, ORDINARY examples, marked as a
      named beginning. *(PDC — Troi/Janeway)*
- [ ] 🎨 **[NEW 07-18] Spark-parent scaffold / co-pilot surface.** The only built parent surface is the
      scorekeeper. Needs the capability-not-content model: parent gets capability actions (read-aloud,
      remind, celebrate); the content box is the child's dictation, verbatim and attributed. Depends on
      the authorship field (below). *(PDC, SSC, OIG, MAC, CGC, IW.)*
- [ ] 🎨/🔨 **[NEW 07-18] Add an authorship dimension to goals** (`entered_by` / `authored_by`). Today a
      parent-entered and a child-authored goal are the same row, so driver-mode (parent authors + scores)
      is the ONLY representable mode. Whose-goal / whose-words must be schema, not stance, to make
      driver-mode structurally impossible. TCC: also add per-write attribution to the family RLS blanket
      write. *(ALL 8.)*

## 🧑‍⚖️ Needs a captain call

- [ ] **Parent approval → witness** for Discovery (reconsider rejection entirely); examine
      parent-as-possible-pressure. May warrant its own focused review. *(SSC — Tasha)*
      — *[sharpened 07-18]* the approval VERB is live now (see Live section) — the call has a
      shipping-today dimension, not only a design one.
- [ ] **Reconsider the 5-goal gate for first-years.** *(SSC — Phlox)* — depends on first-year detection.
      *[sharpened 07-18, SSC]* a priorities section locked behind 5 filled goals reads as
      fell-short-until for Kyra.
- [ ] **First-year detection: schema-vs-derivation** — add a column, or derive from existing data?
      *(unblocks the two above)* — *[07-18 recommendation, COC]* add the column; do not derive.
- [ ] 🧑‍⚖️ **[NEW 07-18] Held-learner pitch policy.** The pitch fires for any learner with a non-null
      `nextStudio` (`modals.js:1293-1303`; `north.js:50-52`) — no "held by age gap" / "returning stayer"
      state, so Andie/Mason get the ladder dangled. Should the app ever offer the pitch on studio-position
      alone? Depends on the first-year/held-status schema. *(PDC, COC, SSC, CGC, IW.)*
- [ ] 🧑‍⚖️ **[NEW 07-18] Consent artifact for live tests** *(CGC)* — see leadership decisions.
- [ ] 🧑‍⚖️ **[NEW 07-18] Home-academics boundary + family-view wall** *(IW)*. Home-academic goals a
      parent reflects in are guide-visible by default (no learner-private scope). The four learners are
      siblings sharing a family view; "family view is values + strengths only, reflection-only, forever"
      must be an ENFORCED wall, not a code comment (`family.js:157`), before any progress field turns
      four siblings into a within-family ladder.
- [ ] 🧑‍⚖️🔨 **[NEW 07-18, TCC] Family credential has no forced rotation.** `must_change_password`
      is a `profiles` column; a family login has NO profile row (its row is in `families`), so a
      temp/issuer-set family credential can never be forced to rotate — the issuer's password stays
      valid indefinitely over a login that can **write minors' data**. `auth.js:49-53` returns to the
      picker before any such check. The v0.11 families migration already asked for this review
      ("Recommend a TCC review"); this is it coming due. Riker + Worf assessment + drafted fix
      (add `families.must_change_password`; adult-gated rotation before the picker; revoke the temp;
      **open: crypto re-wrap on rotation**) held behind the review:
      `2026-07-18-family-credential-rotation-TCC-review.md`. Route to TCC (Riker + Worf + La'an).
      Surfaced by Europa (test-family login showed no reset prompt).

## 🔒 Standing gates (do not flip the flag until ALL hold)

- [ ] Built-surface re-walk (Jake + Accord + Comes) — done once (2026-07-17); re-walk after each new surface.
- [ ] Flag-on browser walk of the built surfaces.
- [ ] **Watch-with-a-real-learner — must include a *staying* learner AND a *first-year* learner** *(PDC)*.
- [ ] **SSC safety lock:** no flip for a cohort that could contain a pitch-and-fall or first-year
      learner until the third-learner soft landing + newcomer floor exist and are walked.

## Owed housekeeping (fleet repo)

- [ ] **18 agent self-record appends** (6 PDC + 6 SSC + 6 MAC) — staged in the three decision logs;
      route through the Fleet MCP channel (`mcp__fleet__update_memory`) from an evoke-agents-backup
      session. Deferred because MCP is not connected from `/Users/europa`.
- [ ] **8-circle walkthrough self-record appends (2026-07-18)** — route the same way once the day closes.

---

## Adventure parity (2026-07-17 — the flow is ALREADY one flow, not two)

**Finding:** there is **zero per-studio branching** in the onboarding / setup / arc code. The whole
flow is parameterized by `studio` through three data sources: `getWheelAreas(studio)` (the slices),
per-studio example goals in `studios.js` (already written for adventure), and
`THRESHOLD_LIFE_AREA[studio]` (the threshold→slice placement). Studio ladder:
**sparks → discovery → adventure → launchpad**, each pitching to the next. So an Adventure learner
IS the same flow. **Everything built for Discovery is wheel-agnostic and covers Adventure.** The
wheels differ (discovery = 6 slices: Movement/Learning/Heart/Family/Friends/Fun;
adventure = 8: Movement/**Mind/Spirit/Emotions**/Family/Friends/**Home/Joy**).

Three real deltas remain — **behavior/data, not copy**:

- [ ] 🧑‍⚖️🔨 **Extend the becoming-vs-skill classification.** `isBecomingSlice` (`goal-arc.js:54`) is
      hardcoded to `'heart'`. Adventure has NO Heart — its becomings are **Spirit + Emotions**
      (Joy? Home? Family? = the design call). Without this, every Adventure area wrongly gets the
      finish-line spine instead of the presence-note. **Needs a which-areas-are-becomings decision.**
      — *[sharpened 07-18, verified at runtime]* `weeklyKindFor('Spirit')` returns 'finish'; the
      copy-grep guard passes GREEN on this real violation. **decide-now fail-safe:** make ambiguous
      Adventure slices render the presence note, not the finish spine, even before the which-areas call.
- [ ] 🎨 **Ratify the Adventure threshold→slice mapping.** It exists in `THRESHOLD_LIFE_AREA.adventure`
      but is gated behind `MAPPING_RATIFIED` (held false). Needs the same Accord + Jake + TCC review
      Discovery's placements got (2026-07-16).
- [ ] 🧑‍⚖️ **Decide the flag gating.** `thresholdLifeArea` gates `discovery` behind
      `CURRENT_WHEEL_BUILD` and everything else behind `MAPPING_RATIFIED`. Lighting up Adventure =
      widen the flag OR ratify the mapping. Deliberate choice, not automatic.

Smaller: the 5-goal minimum + star-top-3 will *feel* different across 8 slices vs 6 (review); add an
Adventure plan snapshot to the C1 guards; the watch-with-a-real-learner set should include an
Adventure learner too.

---

## Launchpad (Adventure → Launchpad) — requirements are FIRST-YEAR PRIORITIES, not entry gates

**Finding (2026-07-18):** only `THRESHOLDS.adventure` is authored today (thresholds.js:21) — the
Discovery→Adventure entry gates. There is **no `THRESHOLDS.launchpad`**. What exists for Launchpad
is per-category *example goals* in studios.js and `STUDIO_ENTRY_AGE.launchpad = 15`.

**Captain's key distinction (CONFIRM WITH THE SCHOOL):** the Launchpad requirements do **NOT** have
to be met to *enter*. Entry happens (~age 15 + general readiness); the requirements are a **first-year
priority** — worked on once you're in. Adventure thresholds = pre-entry gates; Launchpad requirements
= first-year goals/roots carried onto the Launchpad wheel AFTER entry.

- [ ] 🧑‍⚖️ **Confirm with the school:** are Launchpad requirements truly first-year priorities, not
      entry gates? Is the Adventure→Launchpad rite named ("the Threshold" / "Next Great Adventure")?
      What are the real requirements (skills / character / opportunities / signer)?
- [ ] 🎨 **Model Launchpad requirements as carried first-year GOALS** (roots on the Launchpad wheel),
      NOT pre-entry thresholds — once confirmed. If post-entry, **delete the pitch-gate path** rather
      than fill it in.
- [ ] ⚠️ **Terminology collision:** "Threshold" means two things — the generic pitch-readiness gates
      AND the specific Acton "Threshold" portfolio projects. Keep them distinct in Launchpad copy.

**— [sharpened 07-18, walkthrough of Jaxton's crossing]:** the crossing is a **confirmed-but-empty
ceremony** — `getThresholds('launchpad')` is null, so Jaxton opts into a banner promising carried work
over blank slices (`thresholds.js:20-74`; `modals.js:2072-2073`) — AND it fires the **age-gate pitch**
reusing Adventure entry-gate semantics ("15 by December 2026, will you have?"; `modals.js:1642-1652`;
`studios.js:427`). OIG: `buildSlicePlan` returns ratified:true / pitching:true forced by
`CURRENT_WHEEL_BUILD` even though zero Launchpad thresholds exist — flag-truthiness stands in for data.
**decide-now:** suppress the pitch step when `getThresholds(target)` is null. **Do NOT clone
`THRESHOLDS.adventure`** (the trap named in leadership tensions).

---

## 2026-07-18 eight-circle walkthrough review — provenance

All eight circles (PDC / COC / SSC / OIG / TCC / MAC / CGC / IW) independently reviewed the four flows
(Discovery, Adventure, Launchpad, Parent-Spark) and converged. Full findings, blocker table, decide-now
/ for-Jenna / later split, honest-disagreement section, and each circle's sharpest unique catch:
`2026-07-18-circle-reviews-walkthrough-findings.md`. This walkthrough pass is distinct from the formal
per-circle series below (which reviews the flow through each circle's governance lens, sequentially).

## Remaining circles in the series

PDC ✅ · SSC ✅ · MAC ✅ · **COC** (does the data model narrate one story? roots-not-rungs, path-blind
mirror, witness≠narrate as ontology constraints) · OIG · TCC · CGC · IW.
*(Note: all eight contributed the 2026-07-18 walkthrough pass; the formal single-lens series entries
above remain outstanding.)*

---

*"We evoke — we never extract."*
