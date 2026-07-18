# Discovery Circle Reviews — Consolidated Action Tracker

**Date opened:** 2026-07-17
**Purpose:** single ledger for all action items from the three circle reviews (PDC · SSC · MAC),
which otherwise live scattered across six fleet records (3 minutes + 3 decision logs in
evoke-agents-backup `agents/meetings/2026/07/` + `agents/decision-logs/2026/07/`).
**Principles they serve:** `2026-07-17-discovery-flow-design-principles.md`.
**Standing constraint:** all dark behind `CURRENT_WHEEL_BUILD`; nothing ships to learners; the flag
does not flip until the standing gates hold (bottom of this doc).

Status key: ✅ done · 🔨 scoped-engineering · 🎨 design-session · 🧑‍⚖️ needs-captain-call · 🔒 gated

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
- [ ] **One-spine build** — carried thresholds render as **roots, not rungs**; the pitch/climb is
      never staged inside the app. Partly enforced by C1 #5; the render work remains. *(MAC)*
- [ ] **Codify the fresh-start principle** as a checkable rule (C1-style) — beyond no-sorting: assert
      first-year surfaces defer the pitch apparatus. *(PDC)* — could extend c1-no-sorting or add #6.
- [ ] **Full string-by-string voice pass + AI-tells audit** (two-way voice rule across EVERY string
      in the flow). The ruler-removal swaps were a partial down-payment; this is the complete pass.
      *(MAC — Hoshi; still owed. Copy is "diagnosed, not treated" until this ships.)*

## 🎨 Design sessions (need Accord / Comes / Bareil; gated by the safety lock)

- [ ] **The three honest rites** — Welcome/Arrive · Set-the-Year · the Mirror (four bones:
      entry/consecrate/witness/exit); app sets the table, never blesses the meal; holds a place for a
      human witness, never impersonates one. *(MAC — Bareil + Vic + Accord + Comes)*
- [ ] **The path-blind / outcome-blind growth-mirror** — learner's own prior words unannotated;
      grounding beat first; entered not pushed; un-anticipated; = the year's Return/ending.
      *(SSC + MAC — Arcana + Fabula + Bashir/Salus)*
- [ ] **The stayer's narrative spine** — Root → Tend → Deepen; naming-rite; own opening threshold;
      never re-offer the pitch. Two path-myths: returning-stayer = Deepen, first-year = Arrive. *(PDC+MAC)*
- [ ] **Newcomer floor + ceiling** — app-safe-alone + guide/parent-supported mode. *(SSC — Salus+Jake+Comes)*
- [ ] **Somatic anchors + exit ramps** at the four tense points (age gate, blank slice, "where are
      you starting from" self-assessment, fell-short); grounding BEFORE the mirror. *(SSC — Praesens)*
- [ ] **Rest door = true peer** — visual + motion peer; nothing rewards "step" over "rest". *(MAC — Vic + Chapel/motion)*
- [ ] **Vocabulary-teaching (first-year welcome)** — example-first, ORDINARY examples, marked as a
      named beginning. *(PDC — Troi/Janeway)*

## 🧑‍⚖️ Needs a captain call

- [ ] **Parent approval → witness** for Discovery (reconsider rejection entirely); examine
      parent-as-possible-pressure. May warrant its own focused review. *(SSC — Tasha)*
- [ ] **Reconsider the 5-goal gate for first-years.** *(SSC — Phlox)* — depends on first-year detection.
- [ ] **First-year detection: schema-vs-derivation** — add a column, or derive from existing data? *(unblocks the two above)*

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

---

## Remaining circles in the series

PDC ✅ · SSC ✅ · MAC ✅ · **COC** (does the data model narrate one story? roots-not-rungs, path-blind
mirror, witness≠narrate as ontology constraints) · OIG · TCC · CGC · IW.

---

*"We evoke — we never extract."*
