# P&T "Safe Base" Badge - Compass Integration Spec

> **DRAFT v0.2.** Ties the Tots parent-badge work into Compass as the Parents & Tots badge. Fills the "tots-parent affordances" gap named in the Compass v0.3 parent specs (Gap Category 1). Design proposal - needs the Compass owners (Lux build, Accord, Comes, Polaris) before any migration ships.
>
> **v0.2 changelog:** generalized to the full four-badge arc; added Section 6 (surfacing the sources, layered disclosure) and Section 7 (the parent idea-note / open discussion in Compass); extended the never-store list; folded the nine pressure-test fixes into the architecture.
>
> Sources meeting: `evoke-agents-backup/agents/meetings/2026/06/2026-06-27-tots-parent-session-play-safe-base-badge.md`. Pressure-test: `.../2026/06/2026-06-28-parent-badges-sources-participation-pressure-test.md`. Parent-facing sources doc: `vibrant-life-tots/PARENT_BADGES_SOURCES_AND_DISCUSSION.md` (v0.2). Guide: `vibrant-life-tots/SESSION_ONE_GUIDE.md`.

---

## 1. What this ties together

The fleet meeting produced **"The Safe Base"** - the parent recognition artifact for the Tots first session. This spec places it in Compass as the **Parents & Tots badge**, so a P&T parent has a home for it in the same app the older studios use.

The badge holds two things from the meeting:
- **The take-home practice:** five minutes of daily child-led play (sit near, hands still, follow don't lead).
- **The 7 daily settling goals:** Be the safe base → Follow don't lead → You always come back → The first short goodbye → Venture out → Trust the base → Ready for Session Two.

**Since drafted, the set grew to four.** The badge is now the parent's whole-year arc - **The Safe Base** (Session One), **The Steady Hand** (Two), **The Witness** (Three), **Held, Then Let Go** (Four) - each a recognition badge on the same pattern. This spec's architecture holds all four; the Safe Base is the worked example.

---

## 2. The category decision (read this first)

Compass badges, per the family playbook, are **"mastery credentials backed by real, publishable work, not prizes for finishing"** - earned by a *learner*.

**The Safe Base is not that kind of badge, and must not be modeled as one.** It recognizes the *parent*, not the child; it is recognition of a posture already practiced, not a credential earned by completing work. Modeling it as a learner mastery badge would re-import the exact "earn it by finishing tasks" frame the meeting rejected (reward → recognition).

So the Safe Base is modeled on the **Guide's Journey pattern** (Vibrant Life Hero's-Journey-education meeting, 2026-03-24, Decision 9): **self-authored, self-paced, self-disclosed, never an evaluation, no admin or guide dashboard tracking.** A parent marks their own, the way a Guide marks their own journey.

| | Learner mastery badge | Safe Base (parent recognition badge) |
|---|---|---|
| Whose | Learner | Parent |
| Earned by | Real, publishable work | Nothing - it recognizes a posture already practiced |
| Tracked by | Guide, in the Journey Tracker | No one. Parent-held, self-disclosed |
| Scored / compared | Against thresholds | Never. No metric, no leaderboard |

---

## 3. Where it lives in the current code

- **Holder = the parent profile, not a learner record.** `profiles.role = 'parent'` already exists. A P&T tot may have no learner record yet (P&T is the pre-enrollment "first taste"), and the `learners.studio` enum is only `sparks/discovery/adventure/launchpad`. Attaching the badge to the **parent profile** sidesteps both - no studio-enum migration is required just to ship the badge, and it matches the badge's nature (it recognizes the parent).
- **Surface = `js/parent-view.js`.** It is already "scoped to session-level visibility only" and shows per-parent notifications and goals - which already honors the Decision 5 red line (arcs not minutes, no surveillance). The Safe Base recognition card slots in here.
- **Content = extend `PARENT_SUPPORT_HINTS` in `js/studios.js`.** The 7 daily goals are delivered as parent-support hints scoped to P&T, reusing the existing hint construct rather than inventing a surface.

**Compass surfacing (captain decision 2026-06-28).** The badges also appear in Compass proper, in the parent's own space - not only as a parent-view card. They sit *distinct from* the learner mastery badges in the Journey Tracker: those are earned by real work; these are parent recognition. The two are visually separated so they are never confused. The same red lines apply wherever they render.

**Tots Tribe (captain decision 2026-06-28).** P&T stays parent-profile-only for now (no studio-enum change; tots get no logins). But the cohort is given an identity - the **Tots Tribe** - a lightweight grouping that associates the P&T families and their tots so the tribe has a name and a belonging, with no learner account or auth. The tribe tag lives on the parent link / a simple roster, never a learner profile.

---

## 4. Data model - what is stored, and what must never be

**Stored (minimal, parent-private):**
- A single self-disclosed marker on the parent profile: "I am holding The Safe Base this cycle" (a boolean the *parent* sets, like opting into the practice).
- Optionally, the parent's own private note per day (free text, parent-private), if they want one. Same privacy posture as the Compass journal.

**Must NEVER be stored or computed (Polaris standing condition; Decision 5 red line):**
- Completion rate, streak, "days done," or any count of the 5-minute practice.
- Any guide- or admin-visible view of which parents hold or "completed" the badge.
- Any aggregate across parents, even anonymized.
- Any score, ranking, or parent-to-parent comparison.
- Any engagement or "involvement" profile derived from the badge opt-in, the daily prompts, or the idea-note (Section 7). Parent-meeting attendance is noted separately for belonging and must never be fused with badge/idea data into an engagement score.
- Any long-term behavioral record built from the idea-note. It is held lightly and low-retention by design.

*If any of the above appears in implementation, it has drifted, and per Polaris's standing condition it triggers a formal Prime Directive dissent at that point.*

---

## 5. The badge content

**Front (the recognition card):**

> **THE SAFE BASE**
> *"I can walk away because I trust you'll be here when I come back."*
> Your 5 minutes today: sit near, hands still, follow - don't lead.
> Your calm is their first permission. You don't have to do more. You have to be there.

**Inside (the 7 daily goals, surfaced one per session day, never as a checklist):**

| Day | Goal | One-line "why" (observation, not interpretation) |
|---|---|---|
| 1 | Be the safe base | Your calm is their first permission |
| 2 | Follow, don't lead | Describe what they do; skip commands and questions |
| 3 | You always come back | Predictable routines help a child settle |
| 4 | The first short goodbye | A spoken, visible goodbye - never a sneak-away |
| 5 | Venture out | A child who trusts the base can explore |
| 6 | Trust the base | Settling is an arc, not an event |
| 7 | Ready for Session Two | The goodbye becomes familiar |

The goals appear as gentle daily prompts in the parent view. They are **invitations, not tasks**: no checkbox that scores, no "you missed day 3."

---

## 6. Surfacing the sources (layered disclosure)

The parent-facing sources live in `vibrant-life-tots/PARENT_BADGES_SOURCES_AND_DISCUSSION.md` (v0.2). In Compass they are the *look-it-up* layer, never the front door (pressure-test fix 4).

- The badge card (warmth + plain practice) is what a parent meets. A small, quiet **"Where this comes from"** affordance opens the graded sources for that badge.
- The sources view renders the doc's per-badge citations, the grade legend, and the "who graded / last verified" note. It includes the *Withdrawn* entry on purpose - the public correction is part of the trust, not something to hide.
- **No tracking of who opens it.** Reading the sources is not a measured behavior.
- **Single source of truth:** Compass renders the markdown doc; it does not fork the citations. Codex + Nyota Uhura keep the rendered list in sync each session (the recurring source review).

---

## 7. The parent idea-note (open discussion in Compass)

Compass is an *extra* channel for parent ideas, **never the primary one.** The spine of participation is the guide's in-person ask-first conversation (pressure-test fix 5; convergent finding from Kira + Leeta + Polaris). Compass must not become the main way we hear from families, or it re-introduces the equity problem - a note surface favors the already-confident parent.

**The ask-first conversation has a home (captain decision 2026-06-28): the pre-school parent meeting.** It happens there, in person and off-app, which keeps it relational and preserves the equity and no-surveillance properties.

**What it is:** a simple, always-available "share an idea" affordance in the parent view. A sentence is plenty. Parent-initiated only; never prompted as a task to complete.

**What it stores (parent-private, held lightly):** the note text, parent-only RLS. Guide-readable only as a *contribution to act on*, never as a record of how involved a parent is. Low-retention by design.

**What it must never do:** see the extended never-store list in Section 4 - no engagement profile, no participation score, no fusion with meeting-attendance, no long-term behavioral record.

**Close-the-loop (fix 6):** Leeta owns reading what families share each session. The parent view surfaces a **"What changed because families spoke"** note each session - the visible loop. Compass *renders* that note; it does not compute it from tracked participation.

**Calibrate vs floor (fix 9):** the idea-note and the family-values intake make explicit what a family *calibrates* for their own child versus the few *safety floors* held for every child (e.g., never sneaking away). The floors are not a voting surface.

---

## 8. The four honesty conditions (carried from the Level 6 review)

These ship *with* the badge, as parent-facing copy or guide coaching, not as fine print:
1. **Evidence-informed, not evidence-based.** The practice is drawn from the Berlin settling model and child-led play skills (by analogy from PCIT); it is a studied path, not a proven formula.
2. **Invitation, not prescription.** The parent view asks the family how *they* do closeness and goodbye before offering the Safe Base path.
3. **The hard day is allowed.** Copy tells parents plainly: sometimes you must leave before your child is ready; a clean short goodbye is how, and you have not failed a test.
4. **Whose ease is named.** The badge never frames smooth drop-off as the goal; the child's readiness is the only thing that moves the goodbye.

---

## 9. Build steps (proposed, smallest first)

1. **Content only, no schema change:** add the Safe Base card + 7 daily goals to `PARENT_SUPPORT_HINTS` (P&T scope) and render in `parent-view.js`. Self-disclosed opt-in held in memory/local first. **[BUILT 2026-07-08, owner-reviewed]** — implemented in a dedicated `js/parent-badges.js` module (not folded into `PARENT_SUPPORT_HINTS`) so the recognition surface stays code-level distinct from learner mastery; rendered by `renderParentsAndTots()` in `parent-view.js` behind a self-disclosed "I'm a Parents & Tots family" flag (localStorage, per-parent, fail-safe). A content-only **guide-view reference** (`renderParentBadgesReference`, `app.js`) was also added — the arc as a reference for spoken recognition, gated to owners + Tots-tribe guides, touching **no per-parent state** (Polaris ruling, guardrail printed on screen).
2. **Sources link:** render `PARENT_BADGES_SOURCES_AND_DISCUSSION.md` per badge behind a quiet "Where this comes from" affordance on the card. No open-tracking. Markdown is the single source of truth.
3. **Persist the opt-in:** one parent-private boolean (+ optional private note) on the parent profile. RLS: parent-only read/write; no guide read.
4. **Idea-note + close-the-loop:** a parent-private "share an idea" affordance (parent-only RLS, low-retention); plus a per-session "What changed because families spoke" note (Leeta-authored content, rendered, never computed from participation).
5. **Generalize to four badges:** extend the card + goals + sources pattern to The Steady Hand, The Witness, and Held, Then Let Go, one per session.
6. **(Later, separate decision) P&T as a real studio:** add `pt` to the studio enum + Next Great Adventure, if/when P&T tots get learner records. Not required for the badge.

---

## 10. Owners and open questions

**Proposed owners:** **Lux** (build coordination), **Accord** (parent-tier surface / recognition-not-ladder discipline), **Comes** (parent threshold / body-first door sibling), **Salus** (recognition-surface spec author), **Polaris** (red-line review; holds the no-metric condition + the Section 7 idea-channel guardrail), **Codex + Nyota Uhura** (sources rendering kept in sync; recurring per-session source review), **Leeta** (idea-note close-the-loop ritual; "What changed because families spoke"), **Neelix** (warmth-first; sources never the front door), **Kira / Stirps** (ask-first conversation as the participation spine; family sovereignty).

**Captain decisions (2026-06-28):**
1. **Badges appear in Compass**, in the parent's own space, visually distinct from learner mastery badges (not parent-view-only).
2. **Parent-profile-only** for now (no studio enum, no learner logins), **plus a Tots Tribe** identity grouping for the cohort.
4. **The ask-first conversation lives at the pre-school parent meeting** (in person, off-app).

**Look decided (2026-06-28):** a zoom from a big-picture year view to a small-detail today view. The big picture is **The Path** - four steps echoing the grove's infinity path, "you are here," no progress bar (a bar would be a score). Tapping the current step opens today's goal + the 5-minute practice + the "where this comes from" sources link.

**Owner review — build step 1 (2026-07-08):** Lux, Accord, Comes, Salus, Polaris. **Core approved** (data module, self-disclosed local opt-in, Safe Base card, "I'm holding this" toggle, honesty conditions, gated content-only guide-view). Polaris confirmed the category wall holds in code — no counts/streaks/completion/guide-visibility. **Convergent signal (4 agents / 2 circles):** "The Path" with a fixed "you are here = 1 of 4" read as a developmental ladder / loading bar. **Conditions applied same day:** (1) The Path removed from step 1 — returns in step 2 as a session-synced loop, never a fixed rung, never a percentage; (2) the "hard day is allowed" line surfaced beside the toggle, not in the fold-out; (3) "saved on this device only" disclosed in the UI; (4) guide-view stays content-only permanently — any per-parent wire triggers a formal Polaris dissent. Re-verified: syntax clean, module loads without JS errors, local helpers fail safe.

**Still open:**
3. Confirm the Mon/Wed calendar mapping of the 7 settling days (leaning yes).
5. Physical cards vs. spoken-only recognition in year one - **resolved 2026-07-01: both** (spoken in the circle + print-ready cards in `vibrant-life-tots/PARENT_BADGE_CARDS.md` / `.pdf`; Compass the quiet echo).
6. **Before any family sees this:** show Jenna (program-state drift watch — the badge work has not met her or a real family yet).

---

*Drafted by Claude Code on behalf of Europa, 2026-06-27; extended to v0.2 on 2026-06-28 after the parent-badges sources & participation pressure-test. Conforms to Compass Decision 5 (arcs not minutes, no surveillance) and Decision 9 (self-disclosed, never evaluated).*
