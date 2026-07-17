# Current-wheel direction — build scope (Session 1, Aug 17)

Date: 2026-07-16
Status: **SCOPING — not a build authorization.** Produced by the fleet build-scoping
meeting (Lux, Wesley, Accord, Satis; Claude facilitating). Decides *what the build is and
whether Aug 17 is real*, not *build it now*. The 7/16 "prototype-first, main untouched"
posture still stands until the captain deliberately reverses it.

> **CAPTAIN DECISION 2026-07-16: HOLD-THE-FLAG BRANCH CHOSEN (the room's lean).**
> `MAPPING_RATIFIED` set to `false` in `js/thresholds.js` (tripwire fired). Session 1
> (Aug 17) ships on the interim year-view visibility fix already on `main`; pitchers get
> blank invitational slice boxes (verified against running code). The current-wheel plant
> build is deferred to when pitching actually begins and can precede the
> watch-with-a-real-learner gate. No build authorized; prototype-first posture preserved
> (holding a flag is the opposite of shipping the new direction into `main`).

Refs: re-ratification minutes
`agents/meetings/2026/07/2026-07-16-compass-threshold-wheel-slice-reratification.md`;
design doc `docs/design/2026-07-16-goal-decomposition-progression-architecture.md`.

## The dates

- **Aug 2** — Guides log in (adults; not the population this build serves).
- **Aug 17** — Session 1 (first real-learner exposure).

## The load-bearing fact the scope pivots on (CAPTAIN INPUT NEEDED)

**The current-wheel build serves exactly one population: *pitching* learners.** Non-pitchers
are already coherent end-to-end on their own Discovery wheel. So the whole Aug-17 question is:
**does Session-1 onboarding include learners who pitch to the next studio, and do you want the
plant surface *live* for Aug 17 — or is "hold the target-wheel flag + the interim visibility
fix already on `main`" acceptable for Session 1, with the full build following?**

## Ground truth on `main` (read 2026-07-16, tip `45e5444`)

- **Display wound already sutured (interim):** `year-view.js:325-333` renders a pitcher's
  orphan `slice_*` goals labeled by `lifeArea` — nothing a pitcher writes is lost today.
- **The scope wall is explicit:** `year-view.js:349` — `useSlices = learner.studio ===
  'guide-summer'`; learner studios keep the flat list "until the learner mapping is authored
  and reviewed (Decision 4, GATED)."
- **Not built:** `buildSlicePlan` (`thresholds.js:162`) still plans pitchers by the **target**
  wheel (`wheelStudio = pitching ? pitchTargetStudio : currentStudio`); `THRESHOLD_LIFE_AREA`
  (`thresholds.js:108`) maps thresholds onto **Adventure** slices, not Discovery.
- **Gate is wheel-agnostic and holds:** `thresholdLifeArea` returns null until ratified;
  prefill only when pitching AND `MAPPING_RATIFIED`; empty boxes never wiped.
- A **parallel session commits to this same `main`** — verify tip before any push.

## Scope table

| # | Item | State | Owner | Aug-17-critical? |
|---|---|---|---|---|
| A | Threshold→**Discovery**-slice mapping (reviewed *data*, not invented logic) | Not built (maps to Adventure) | Europa/Compass authors → **Accord + Satis review** (7/15-shape) | Only if Session 1 has pitchers |
| B | `buildSlicePlan` plans by **current** wheel | Not built | Lux | Only if pitchers |
| C | `year-view` `useSlices` wall flipped for learners | Not built (interim orphan-render live) | Lux + Wesley | Only if pitchers |
| Cond-1 | **Open-by-choice STORED, not inferred** | Not built (new state) | Lux (schema/persist) + Wesley (render) | With any plant build |
| Cond-2 | Read-only green **read-only to the system too** (save-path guard + render) | Not built | Wesley + Lux | With any plant build |
| Cond-3 | Count stays a **denominator-free ceiling** | N/A at plant layer | Wesley | With the *cultivate* layer (post-Aug-17) |
| E | Cultivate layer — deep per-goal breakdown, Zooms 2–4 | Prototype only | all four | **No** — "lives in the Compass over sessions" |

## Plant vs cultivate (the Aug-17 boundary)

- **Plant (onboarding, light):** rows A + B + C + Cond-1 + Cond-2. This is the *only* thing
  that could be Aug-17-relevant, and only for pitchers.
- **Cultivate (the Compass, over sessions):** row E + Cond-3. **Not** a Session-1 artifact;
  not Aug-17-feasible and not needed. Refused into the Aug-17 window by Lux + Wesley.

## Acceptance criteria (the three binding conditions from re-ratification)

1. Open-by-choice is a first-class **stored** state — record distinguishes "chose to leave open"
   from "data missing." (Where it gets *built*, not just promised.)
2. Read-only green carried thresholds are read-only to the **system** too — no silent re-map,
   rewrite, or auto-complete after declaration.
3. The "N things — that's it" count stays a ceiling-as-relief, **never a denominator** —
   cultivate-layer, honored whenever the day/Compass view ships.

## Honest feasibility read vs Aug 17

The build order has real gates on every arrow: **author mapping → Accord + Satis review →
Lux + Wesley build plant → Accord re-walks built surface + Satis verifies against code →
watch with a real learner → Session 1.** The **watch-with-a-real-learner gate is the long
pole and cannot be compressed by building faster.** The plant layer is ~2–3 focused build
sessions *once A exists*, but A is a review cycle (calendar, not keystrokes), and the 32-day
window already contains Aug-2 Guides login.

**Convergent finding (all four speakers, two circles):** the build's Aug-17 relevance depends
entirely on whether Session-1 onboarding includes pitchers; and rushing to hit Aug 17 by
skipping the watch moves the frightened body (a first learner on an unwatched surface) into
the blast radius.

## Recommendation (to the captain)

- **If Session 1 has few/no pitchers, or you don't need it live:** hold the target-wheel flag
  per the tripwire, ship on the interim visibility fix already on `main`, and build the
  current-wheel plant properly for when pitching begins. Aug 17 ships coherent; zero rushed
  surfaces. *(Room's lean.)*
- **If Session 1 has pitchers AND you want it live:** this commits to **build-into-`main`,
  reversing the 7/16 "prototype-first" posture** (a deliberate captain call, not scoping
  momentum) and racing the watch gate. Feasible for the **plant layer only**, tight, and the
  watch cannot be cut. Cultivate (E) waits regardless.

## Gates that remain regardless of branch

- **Watch-with-a-real-learner** — governs learner exposure; unchanged by any build.
- **The 7/16 "prototype-first, main untouched" posture** — only the captain reverses it.
