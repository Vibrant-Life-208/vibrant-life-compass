# The Launch Pad - Status & Handoff

> The single place to understand where the **Launch Pad** (the three-year in-person studio formation for 16-18-year-olds) design stands, what is merged, what is owed, and what the next real step is.

**As of 2026-09-01.** The complete design body is **merged to `main`** after a full six-circle fleet review and two leadership decisions. Nothing here is shipped to a live software surface - the Launch Pad is (by design) mostly pen, paper, and a room; the companion Compass app is deliberately "a lens, not a vault." The next real step is not more review - it is one real Origin morning.

---

## 1. What is merged to `main` (the design body)

All four Launch Pad PRs merged 2026-08-31 / 09-01, all branches deleted:

| PR | Content | Merge commit |
|----|---------|--------------|
| **#7** | Origin (Year 1) complete studio-year design + the three-year spec (Ring-1 **and** Ring-2 revisions) + the Closing Practice + the new somatic-floor grammar | `bd1909b` |
| **#17** | The Forge (Year 2) studio-year design (superseded #8, which auto-closed when its base branch was deleted on the #7 merge; rebased onto main) | `5e60d13` |
| **#9** | The Helm (Year 3) studio-year design | `9d30040` |
| **#10** | The Life Admin strand (do-it-for-real, just-in-time) | `ede085d` |

The stacked-spec drift that existed during review (Forge/Helm carried an older spec) is **resolved**: there is now one canonical spec on `main` with Ring-1 + Ring-2 applied, and Origin/Forge/Helm are consistent with it.

### Canonical docs on `main` (`docs/design/`)
- `2026-06-24-launch-pad-three-year-story-cycle-v0.1.md` - **the spine.** Locked structure + the appended **"Ring-1 revisions" (2026-08-28)** and **"Ring-2 revisions" (2026-08-31)** doctrine sections. Start here.
- `launch-pad-closing-practice-v0.1.md` - the learner-held re-crossing (the one addition Ring 1 asked for); three fixed spoken prompts, no artifact ever.
- `launch-pad-somatic-floor-grammar-v0.1.md` - **new (Ring-2):** the one-page choreography of the settle / way-down / exit-ramp + the "marked quiet."
- `launch-pad-life-admin-strand-v0.1.md` - the practical adulting layer (taxes, officialdom, currency-as-skill), do-it-for-real just-in-time.
- Year plans: `2027-2028-...studio-year-plan-v0.3.md` (Origin), `2028-2029-...studio-year-plan-forge-v0.1.md` (Forge), `2029-2030-...studio-year-plan-helm-v0.1.md` (Helm).
- Session day-by-days: Origin `2027-2028-launch-pad-session-{1-7}-day-by-day-v0.1.md`; Forge `2028-2029-launch-pad-forge-session-{1-7}-...`; Helm `2029-2030-launch-pad-helm-session-{1-7}-...`.
- Supporting: the referral pathway (`2027-2028-...coach-not-therapist-referral-pathway-v0.1.md`), the closing feast, the dream map / 100-dreams card.

---

## 2. The review arc (complete - do not reopen)

Six circles + two leadership decisions. **Standing policy (Picard, 2026-08-28, reaffirmed 08-31): no further whole-body review before a real Origin session runs.** The next request to reconvene the whole body gets the trailhead answer.

- **Ring 1** - PDC, SSC, COC (26 agents) + leadership decision v1. Sheets: `evoke-agents-backup/agents/meetings/2026/08/2026-08-28-{pdc,ssc,coc}-launch-pad-*.md` + `-leadership-launch-pad-decision-and-priorities.md`.
- **Ring 2** - OIG (infrastructure), TCC (security, 9/9), MAC (mythic arts, 8/8) + leadership decision v2 (the Ring-2 close). Sheets: `2026-08-29-{oig,tcc}-launch-pad-*.md`, `2026-08-31-mac-launch-pad-mythic-arts-review.md`, `2026-08-31-leadership-launch-pad-ring2-close-decision.md`.

**The unanimous call:** the skeleton is sound; the medicine is subtraction + the one addition (the closing practice); the pen-and-paper pilot has zero attack surface. The applied buildable subset (fixed closing prompts, Vineyard-in-Origin, season-scale re-crossing, "The Curious No," the two-worlds hinge, the daily-ritual through-line, crew-not-watch, and the "deliberately NOT built" refusal architecture) is in the merged docs.

**The one strategic thing (all six circles converged):** the guide's nervous system. Every gate assumes a functioning guide; protect her first.

---

## 3. The two clocks (they never touch)

### Clock A - the pilot morning (upstream of all software; nothing blocks it)
One real Origin Session 1 - "The Map of Me," the 100 Dreams - 2-4 real teenagers, one morning, **Salus + Jake in the room as the safety pair** (this *is* the binding real-learner walk, run as the pilot). Gated only on:
1. Referral pathway live (named clinician, same-week warm handoff).
2. Consent for this session's content.
3. A crisis-concurrency answer for that morning (one named reachable adult on paper).
4. A runnable somatic settle/way-down/exit-ramp (the one-page grammar, or a draft).
5. The closing-practice draft in hand (prompts already fixed in the merged doc).
6. "The Curious No" in the guide's hand (the decline primitive - the thing the pilot exists to test).

### Clock B - real software touching a real minor's record (2027+; fleet-built, off the guide)
The TCC gate list (G1-G8), tracked in the leadership v2 decision - **not** on the pilot's clock and **not** the operator's. Queue-jumper: the live `notifications_insert_any` / `from_id`-spoof HIGH is a defect in the **current Compass** real Vibrant Life children use today; route it to the Compass security queue now, not parked behind 2027.

---

## 4. What is owed (not blocking the pilot; on their own clocks)

**Europa's founder decisions (not auto-executed):**
- [ ] Author + sign the **pre-dated honorable-defer blessing**, this season, while rested (P0-2, now the *first* Tier-0 item; co-signed by Cura + Picard).
- [ ] Decide the **second-adult question** honestly - commit to the pair, or design the graceful degradation of solo.
- [ ] Give the go to recruit the 2-4-teenager pilot cohort and **book the morning** (a date within ~3 weeks; three calls: clinician, Salus+Jake, the families).
- [ ] Engage the **Idaho attorney** (G1 - the long pole; the one gate the fleet cannot self-certify).

**Fleet cold-build (off the guide, before software touches a minor):**
- [ ] TCC gates G1-G8 (access model `ended_at`/`active`; the `from_id`-stamped SECURITY DEFINER notification insert; encrypt-at-rest + fail-soft decrypt; delete `migrate.js` exportToSQL; session-timeout + login recovery; CSP; mentor-safeguarding ledger; counsel). See the leadership v2 decision.
- [ ] Stacked-branch note: N/A now (all merged); the Tue/Thu weekly-rhythm reconciliation propagated with the merge.

**Design build-forward (light, seeds into the Origin build; not blocking):**
- [ ] Per-season day-level wording for the season-scale closing re-crossing (named at plan level; day-level is a further pass).
- [ ] The chosen/forward-lineage door copy (Stirps read) + the between-season integration fallow day-level wording.
- [ ] The Salus + Jake consented real-learner walk verifies the felt experience (only knowable in a real room) - run it *as* the pilot.

---

## 5. The next step

**Book one real Origin Session 1** - pen, paper, 100 Dreams, 2-4 real teenagers, one morning, Salus + Jake as the safety pair. Route what it shows to a short honest spoken debrief **in the room, same day** (three questions: did the settle land in a real body; did the closing prompts sound like an inner voice or a worksheet; when the first kid said no, did the guide *meet* it or *manage* it) - **not to a file, not to a new circle.** Then present the improved design to Jenna and Jaxton (15).

*Anti-review invariant: a review requires new-class risk, not new detail. The summit is mapped. Walk the trailhead.*

---

*"We evoke - we never extract."*
