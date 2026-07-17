# Category -> wheel-slice mapping (v0.1, DRAFT - not ratified)

Date: 2026-07-16
Status: **DRAFT. Gated behind the same coverage-frame review as the threshold mapping.**
The `CATEGORY_LIFE_AREA` learner-tier entries in `js/studios.js` stay **empty** until this
is ratified (captain + Jake + Accord coverage-frame + TCC). Until then, learner year-view
stays the flat category list (no wheel-slice grouping), and the interim
`renderPitchSliceGoals` fix surfaces a pitcher's slice goals so nothing is lost.

## What this is (pedagogy, not plumbing)

The 2026-07-16 current-wheel re-ratification means a learner plans on their **own** wheel.
For the Compass to group a learner's goals **by wheel slice** (the way guide-summer already
does), every academic / pathway category needs a home slice. This doc proposes those homes
as reviewable **data** - which life area (wheel slice) each category belongs to - so the
values judgment is visible and reviewable before any learner sees a sliced year. It is the
sibling of `docs/design/2026-07-14-threshold-to-wheel-slice-mapping-v0.1.md`; the two must
stay in lockstep (a threshold and its category live in the same slice).

## The principle (mirrors the threshold mapping)

The academic categories **cluster in the education slice** - **Learning** on Discovery,
**Mind** on Adventure / Launch Pad. That is **lopsided by design**, not a defect: "this is
the mind at work - it is education" (captain, 2026-07-16). Pitch/school readiness is mostly
academic, so the education slice legitimately carries the load.

**COVERAGE FRAME, NOT COMPLETENESS.** The empty slices (Movement, Family, Home, ...) are the
child's to fill from their own life - an invitation, never a deficit, never a fill-meter.
**Do not** invent placements to cover every slice. This mapping deliberately leaves slices
empty.

## Discovery -> `getWheelAreas('discovery')` = Movement, Learning, Heart, Family, Friends, Fun

| Category | id | -> Slice | Rationale |
|---|---|---|---|
| Math | `khan` | **Learning** | academic |
| Reading | `reading` | **Learning** | academic (also legacy `lexia`, `deepBook`) |
| Writing | `noRedInk` | **Learning** | academic |
| Civ | `civ` | **Learning** | academic (history / civilization) |
| Character | `characterTrait` | **Heart** | virtue / inner life (candidate: Friends - it's often relational) |
| Quest | `quest` | **Friends** | group project + exhibition = community (candidate: Fun) |
| Badges | `pathway` | **Fun** | passion / creative pursuit - "the one that feels most alive" |

Slices with no category (invitations, the child's to fill): **Movement, Family.**

## Adventure -> Movement, Mind, Spirit, Emotions, Family, Friends, Home, Joy

| Category | id | -> Slice | Rationale |
|---|---|---|---|
| Math / Reading / Writing / Civ | `khan`/`reading`/`noRedInk`/`civ` | **Mind** | academic |
| Character | `characterTrait` | **Spirit** | who I'm becoming (candidate: Emotions - regulation) |
| Quest | `quest` | **Friends** | community |
| Badges | `pathway` | **Joy** | passion / delight |
| Apprenticeship | `apprenticeship` | **Home** | real-world / vocational (candidate: unmapped - Adventure has no Calling) |

Empty (invitations): **Movement, Emotions, Family** (and Spirit if Character -> Emotions).

## Launch Pad -> Movement, Mind, Spirit, Time, Emotions, Joy, Family, Friends, Home, Money, Calling

| Category | id | -> Slice | Rationale |
|---|---|---|---|
| Math / Reading / Writing / Civ | (as above) | **Mind** | academic |
| Character | `characterTrait` | **Spirit** | who I'm becoming |
| Quest | `quest` | **Friends** | community |
| Badges | `pathway` | **Joy** | passion / portfolio-quality output |
| Apprenticeship | `apprenticeship` | **Calling** | vocational -> the calling slice |
| Thresholds | `thresholds` | **Calling** | portfolio / pitch-readiness work (candidate: Mind) |

Empty (invitations): **Movement, Time, Emotions, Family, Home, Money.**

## Sparks (ages 4-7) - special case

Sparks is **parent-facing and screen-free** (the parent holds it). Its wheel (Movement,
Heart, Family, Play) has **no academic slice**, and its categories are minimal
(`characterTrait`, `reading`, `quest`). Proposal: **do not force academic homes here** -
Character -> **Heart**, and leave Reading / Quest to the parent (or Reading -> **Play** as
early literacy-as-play). Open question below.

## Open placement questions (for the reviewers)

1. **Character** -> Heart or Friends (Discovery)? Spirit or Emotions (Adventure / Launch Pad)?
2. **Quest** -> Friends or Fun (Discovery)?
3. **Apprenticeship** -> Home (Adventure, which has no Calling) vs Calling (Launch Pad) - confirm.
4. **Thresholds** category -> Calling vs Mind (Launch Pad)?
5. **Sparks**: do the tot categories need slice homes at all, or does the parent hold it un-sliced?
6. Confirm the **academic cluster in Learning / Mind** carries the same coverage-frame
   acceptance the room gave the threshold mapping ("the mind at work").

## Consistency with the threshold mapping (must hold)

The threshold -> slice mapping places a pitcher's **academic thresholds** in the education
slice (Learning, per the current-wheel re-ratification). This category mapping places the
**academic categories** in the same slice. They must not diverge: a threshold and the
category it belongs to should render in the **same** slice, or the learner sees the same
work split across two life areas.

## How this is consumed (the plumbing)

- `js/studios.js`: `CATEGORY_LIFE_AREA` - currently guide-summer only; the learner-tier
  entries are empty and gated. Ratifying this fills them.
- `js/year-view.js`: `useSlices` is currently `learner.studio === 'guide-summer'` (the
  Decision-4 scope wall). Ratifying this mapping lets `useSlices` extend to learner studios
  - the full wheel-grouped Compass - replacing the flat list and the interim
  `renderPitchSliceGoals` orphan fix.
- The three 2026-07-16 re-ratification build conditions still bind at the render layer
  (open-by-choice a stored state; read-only carried thresholds; the count never gets a
  denominator).

## Sign-off checklist (before filling `CATEGORY_LIFE_AREA` for learner tiers)

- [ ] Captain: the placements are right; the Learning/Mind academic cluster is accepted (coverage frame).
- [ ] Jake + Accord: coverage-frame review - empty slices read as invitation; no placement pathologizes a child.
- [ ] TCC: the gated-mapping convention (same as v0.18 / the threshold mapping).
- [ ] Resolve the open placement questions above.
- [ ] Confirm consistency with the threshold mapping (a threshold and its category share a slice).
- [ ] Watch-with-a-real-learner before any child sees a sliced year (standing gate).

## References

- Sibling: `docs/design/2026-07-14-threshold-to-wheel-slice-mapping-v0.1.md`
- Direction: `docs/design/2026-07-16-goal-decomposition-progression-architecture.md`
