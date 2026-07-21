# The Four-Region Compass - taxonomy mapping (v1, ratified)

**Date:** 2026-07-20. **Status:** ratified by fleet working session (Accord, Jake Sisko, Tutela/TCC; facilitated). **Supersedes:** the per-studio tiered Wheel of Life (`WHEEL_TIERS` in `js/wheel.js`) AND the in-flight "current-wheel" generalization (`CURRENT_WHEEL_GLOBAL_FLIP`). Captain decision 2026-07-20: the fixed compass **supersedes** the tiered model.

## The decision

Replace the 4-to-12 per-studio life-areas with **one fixed compass for everyone**: four regions - **SELF, OTHERS, MAKING, WORLD** - around a sovereign center, **VOICE / SOVEREIGNTY.** Same map for every learner, guide, parent, and owner; only the framing copy differs per surface (see `COMPASS-DOORWAY-FRAMINGS.md` in the growth-record project).

## The two frames that keep it safe

1. **Becoming attaches to the *Grows* side, not to a region** (Jake). Every region has two tracks: the **Life** side (the *doing* - get fit, save money, learn to read) runs Plan / Do / Close; the **Grows** side (the *becoming* - reflection, empathy, courage, spirit) is **witnessed, never finished** (presence cadence). This dissolves the old `BECOMING_SLICES = {heart, spirit, emotions}` coupling: no single region is "the emotional one." **VOICE is entirely becoming.**
2. **Four fixed directions = your whole life always in view; the needle is the learner's** (Accord). An empty region is **not a deficit** - it is a direction you are not facing this season. **No completeness signal** may exist (no "3 of 4 active," no coverage meter). Unconditional positive regard lives in the architecture, not the copy.

## The regions (synthesizing what-we-had + Jenna + the BLOB)

### SELF - *Life: Health · Grows: Mindset*
- **Life (doing):** body & movement (Movement, Physical, Sports) · rest & energy (Time) · mood & feelings (Heart, Emotions) · joy & play (Joy, Play, Fun)
- **Grows (becoming):** reflection · grit · self-knowledge · desire to grow
- Constraint (Accord): the mood/feelings thread is **presence only, never a wellness score.**

### OTHERS - *Life: Relationships · Grows: Empathy*
- **Life:** family · friends · home · intimate/partner · community & belonging
- **Grows:** empathy · collaboration · communication · altruism

### MAKING - *Life: Provision · Grows: Creativity + Craft*
- **Life:** work & career · money & provision · ventures & entrepreneurship · craft · passions put to use
- **Grows:** creativity · ideation · iteration · risk-taking · ownership · value made for others · give back
- Calling lives here as *vocation*; its *purpose* aspect is expressed through Voice.

### WORLD - *Life: Learning · Grows: Knowledge*
- **Life:** study & academics · reading & literacy · the wider world · **growing & moving forward (tribe transitions)**
- **Grows:** inquiry · curiosity · literacy · understanding · critical thinking · research
- **Tribe movement (Europa):** moving into the next tribe lives in World. The compass helps a learner discover the next tribe's **threshold markers** and set **core goals to match.** Constraint (Jake): allow **exploration before commitment** - a learner tries on the next tribe before core goals lock, or we foreclose them.
- Constraint: **Mind + Learning stay together here** (same education cluster at different ages - never split).

### VOICE / SOVEREIGNTY (center) - *"How do I author my own life, out loud?"*
- The sovereign self that authors the other four - not a fifth area to fill.
- Gathers: agency · purpose · spirit · values · self-authorship · voice (Jenna's Self + Spirit + purpose; the BLOB's Voice; old Spirit + Calling-as-purpose).
- **Entirely becoming** - all presence, never finish. Where "the needle is yours" lives most literally.

## Old area -> new region (migration + shim)

For the data migration (44 live learners) and the `sliceForCategory` compatibility shim - every legacy `slice_<oldarea>` resolves to a new region so **no goal orphans**:

| Legacy area / id | New region |
|---|---|
| Movement, Emotions, Heart, Joy, Play, Fun, Time | **SELF** (`slice_self`) |
| Family, Friends, Home, Partner | **OTHERS** (`slice_others`) |
| Money, Finances, Career, Calling | **MAKING** (`slice_making`) |
| Mind, Learning | **WORLD** (`slice_world`) |
| Spirit | **VOICE** (`slice_voice`) |

`life_area` label strings backfill to the region name; NULL stays NULL (never a deficit).

## Binding conditions (from the session)

1. **Accord:** the coverage frame must hold in **code**, not just copy - no completeness signal; empty region never reads as deficit. If it does, support withdrawn.
2. **Jake:** the tribe-crossing in World must allow **exploration before commitment** or it forecloses the learner.
3. **Tutela (TCC):** **no learner goal orphaned** in migration; the schema **cannot express "behind."** A compatibility shim resolves every legacy id; an empty region and a full one are regarded identically.

## Change surface (from the migration map, smallest-first)

1. `js/wheel.js` - replace `WHEEL_TIERS`/`ADULT_AREAS` with the fixed 4 (+ Voice center); `getWheelAreas()` returns the 4 for all; rewrite draw for 90-degree slices + real center; delete leader-line machinery.
2. `js/studios.js` - `CATEGORY_LIFE_AREA` (:319), `sliceCategoriesForStudio` (:388) remap to 4 regions + Voice.
3. `js/thresholds.js` - `THRESHOLD_LIFE_AREA` (:166); retire `CURRENT_WHEEL_GLOBAL_FLIP`/tiered flags; `js/goal-arc.js` `BECOMING_SLICES` (:63) -> becoming = the Grows/disposition side, not a region set.
4. `js/year-view.js` (:359-429) - slice grouping follows `getWheelAreas`; verify `orphanSliceGoals` shim (:342) resolves legacy ids.
5. `js/modals.js`, `js/setup.js`, `js/north.js`, `js/session-view.js`, `js/parent-view.js` - copy ("Slices of Life" -> "Compass") + verify category-id matching.
6. **Data migration (v0.27+, do last, TCC-gated):** remap `goals.category_id` / `tasks.category_id` legacy `slice_*` per the table above + `life_area` backfill; ship the `sliceForCategory` shim first so old goals never orphan.

---

*Ratified 2026-07-20. Frames: becoming-on-the-Grows-side (Jake), needle-is-the-learner's / no-completeness-signal (Accord), no-orphaned-goals / schema-cannot-express-behind (Tutela). Build in stages behind a flag on `feat/compass-4slice-migration`; data migration is the long pole.*
