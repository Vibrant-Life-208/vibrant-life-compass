# Launch Pad entry thresholds (v1) — ready-to-apply spec

**Date:** 2026-07-20. **Status:** ratified by Europa. **For the wheel session to land** (`studios.js`, `thresholds.js` are its change surface).
**Origin:** Adventure Thresholds PDF pattern + Launch Pad three-year-story-cycle plan + the Growth Record. **Keystone:** Launch Pad entry (16) **is** the record's "take the wheel" (16 = learner-held custody) — one crossing.

---

## 1. Entry gate → 16

- `studios.js`: `STUDIO_ENTRY_AGE.launchpad: 15 → 16`.
- Age-gate copy (existing pitch `ask-age` stage, `pitchCutoff`): *"will you have turned 16 by [cutoff]?"* (auto from `entryAge`).
- **Note (Europa aware):** the Launch Pad plan says "ages 15-18"; a 16 entry gate makes the studio start at 16. Intended.

## 2. The design shift (why Launch Pad inverts Adventure's weight)

Adventure entry (~11) was **WORLD-heavy** — *academically ready + heroic mindset?* Launch Pad entry (16) is **MAKING + VOICE-heavy** — *can you self-direct, make real things, mentor, and author your own story and record?* Academics are assumed; the question is **agency and output.** VOICE (the center) goes from one Adventure item to the heart of the crossing.

## 3. The thresholds (region order: World → Making → Others → Self → Voice)

Ids use the `lp_` prefix (mirrors `adv_`). Region is the four-region home; each is a goal a learner works toward and marks with a guide, never a graded score.

### WORLD — self-directed learning
- `lp_self_paced` — **Self-paced mastery, teach-it-back.** Set your own pace on core academics; prove it by teaching it back.
- `lp_socratic` — **Lead a Socratic discussion** on a Deep Book (not just attend) — think out loud, in public.
- `lp_synthesis` — **One research synthesis** — an essay/presentation that compares and argues. The "think for yourself" muscle.

### MAKING — real output + portfolio (the Launch Pad differentiator)
- `lp_portfolio` — **A portfolio piece worth showing** — one advanced output *you'd show a future employer or program.* Seeds the record's **Portrait view** directly.
- `lp_real_project` — **A real project, delivered** — take one thing idea→finished and shown (or commit to the apprenticeship path).

### OTHERS — leadership matures to mentorship
- `lp_mentor` — **Mentor a younger learner** (a Discovery learner) — weekly, bring something useful.
- `lp_lead_quest` — **Design + lead a Quest** — recruit a team, hold the question, run the exhibition.

### SELF — self-governance + tending the life
- `lp_own_day` — **Run your own day** — sustained self-direction / contract mastery (the 9-1:30 self-directed rhythm; Adventure's "Soaring," elevated).
- `lp_tend_life` — **Tend the life around the work** — honor rest/hearth as practice (never earned), and name how you care for yourself. *"Love the life around it."*

### VOICE (center) — author your own story
- `lp_know_story` — **Know your story** (the Origin expedition) — a reflection/pitch: who am I, what's worth solving *to me,* what I'd offer the world.
- `lp_take_wheel` — **Take the wheel of your record** — own and author your Captain's Log / Growth Record. **This IS the 16 = product-control handoff.** The keystone threshold where the two projects meet.

## 4. Ready-to-apply data shape

Model on `THRESHOLDS.adventure`. Under the four-region model, attach each to its region (World/Making/Others/Self/Voice) rather than the legacy skills/character split — but if the current structure still needs it, WORLD+MAKING ≈ `skills`, OTHERS+SELF+VOICE ≈ `character`.

```
THRESHOLDS.launchpad = {
  entryAge: 16,
  skills:    [ lp_self_paced, lp_socratic, lp_synthesis, lp_portfolio, lp_real_project ],
  character: [ lp_mentor, lp_lead_quest, lp_own_day, lp_tend_life, lp_know_story, lp_take_wheel ],
}
THRESHOLD_LIFE_AREA.launchpad (→ region under COMPASS_V2):
  lp_self_paced, lp_socratic, lp_synthesis   -> World
  lp_portfolio, lp_real_project              -> Making
  lp_mentor, lp_lead_quest                    -> Others
  lp_own_day, lp_tend_life                     -> Self
  lp_know_story, lp_take_wheel                 -> Voice
```

## 5. Flow (already correct)

The pitch/age-gate step is inserted before `within_1yr` in the onboarding cascade (`steps.splice(indexOf('within_1yr'), 0, 'pitch')`), so it is offered at the age gate before the one-year reflection. Once `getThresholds('launchpad')` is non-null, the Adventure→Launch Pad pitch turns on (today it is suppressed because launchpad thresholds are null). The thresholds pre-place into the region slices in the World→Making→Others→Self→Voice order.

## 6. Coordination

`studios.js` + `thresholds.js` are the wheel session's change surface. Land this there (additive: a new `launchpad` key). No conflict with the region re-map — this is new-studio content, not a remap of existing ids. Composes with the `regionIdForCategory` shim.

---

*v1, ratified 2026-07-20. Adventure asks "are you ready?" of an 11-year-old; Launch Pad asks "will you take the wheel?" of a 16-year-old — and the wheel is their own record.*
