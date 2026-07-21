# Coordination note — wheel session #4: strip the readiness pills when you build the crossing render

**Date:** 2026-07-21. **For:** the wheel session (owns `thresholds.js` step 3 + the four-region conversion).
**Refs:** SSC research brief `agents/governance/research-briefs/2026-07-21-ssc-research-brief.md`; the 2026-07-21 goal-breakdown meeting (gate dissolved); the entry fork (`setup.js` crossing lead card → `openThresholdsModal`).

---

## The ask

When you build **#4** (region-group the crossing/thresholds render), **also remove the status pills.** They are the readiness meter the meeting dissolved, and an SSC research cycle (2026-07-21) now confirms the design cost with T1/T2 evidence. #4 is where this lands cleanly - it's one change to the same surface, not a separate patch.

## Why (evidence, not instinct)

- A **"Done" verdict is a performance-orientation frame** → surface strategies + giving up; **mastery** ("what am I learning / how am I growing") predicts engagement + wellbeing, and fits *both* doing and becoming goals. `[VERIFIED, T1]`
- Progress **charts cause anxiety/shame/loss of intrinsic motivation** when comparative or all-or-nothing. `[T3]`
- Accountability should be **relational** (a mentor *holding space* + narrative check-ins), **never a gauge**; surveillance produces disengagement. `[VERIFIED, T1]`
- The crossing is marked by a **rite** (the remembrance speech + human naming), **not a score**. `[VERIFIED, T1]`

## The exact spots

1. **`js/thresholds.js:302-304`** (`renderThresholdsHtml`) - the per-threshold status button:
   `<button ... class="threshold-status status-${s}" data-threshold=...>${label}</button>`. **Remove it.** (The comment at :294 calls it "learner-owned, optional" - the intent was benign self-monitoring, but the 3-state Not-started/Working/Done is the Done-verdict the evidence flags.)
2. **`js/modals.js:3005-3015`** (`openThresholdsModal`) - the pill-cycling handler (`LABELS`, `NEXT`, the `[data-threshold]` click that cycles not_started→working→done). **Remove it.**

## What replaces it

- **The thresholds render as the region-grouped breakdown** (the four clusters - World/Others/Making/Self + Voice - via `THRESHOLD_LIFE_AREA` remapped to the four regions, incl. the captain's Q1 `adv_lead_launches`→Making and Q2 `adv_courage_book`→Voice). Each threshold is a thing you **plan into tasks** - the existing **"Add to my North"** flow (`thresholds.js:326`, `data-threshold-plan`) **stays**: that is the right progress model (tasks worked + witnessed), and it replaces the pill.
- **Progress = the work + the story**, not a widget. If a learner-owned "where I am" note is ever wanted, it must be **mastery/process-framed, private, no count** (bookmark-style, like the book tracker) - never a 3-state verdict or aggregate.
- **Becoming thresholds** (Courage to Grow → Voice) get **no completion apparatus at all** - no pill, no task-finish; they're received/witnessed.
- **Accountability** is the **cross-work mentor** (higher-tribe pairing) + the **remembrance speech** - both **Session-4 features** (separate build; queued for Jake/Bareil), not part of #4. #4 just needs the pills gone.

## Net for #4
Region-group the thresholds + **delete the two pill blocks above** + keep "Add to my North" (threshold→tasks). Title already done (`openThresholdsModal` → "Moving up to [Studio]"). Schema stays **incapable of a readiness count/aggregate** (OIG/Lux build requirement).

*"We evoke — we never extract."*
