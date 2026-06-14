# Quest-Cycle Onboarding Spec v0.1

## In-App First-Run Flow for Adventure and Launch Pad Learners

**Date:** 2026-06-14
**Status:** Design proposition - not yet specification
**Companion:** [2026-06-14 Quest-Cycle Architecture Research Brief](../research/2026-06-14-quest-cycle-architecture-research-brief.md)
**Authorship:** Vibrant Life Compass design team

---

## Purpose

This document proposes adding a quest-cycle onboarding flow to Hero's Compass as the first-run experience for new Adventure and Launch Pad learners. The flow embeds the quest-cycle proposition from the companion research brief directly into the app's new-user onboarding rather than testing it in a parallel paper-based experiment.

This is a design proposition open to revision. It is not yet a specification. It is intended for review by Vibrant Life guides, Compass design collaborators, and ideally one or more Adventure or Launch Pad learners themselves before implementation.

---

## Scope

**In scope:**
- New-user onboarding for **Adventure-tier** learners (typically ages 10-13)
- New-user onboarding for **Launch Pad-tier** learners (typically ages 13+)

**Explicitly out of scope:**
- Sparks-tier learners (developmental readiness; see research brief)
- Discovery-tier learners (developmental readiness uncertain at 8-10 boundary; requires additional research before inclusion)
- Returning users (this is first-run experience only; the quest-cycle layer does not appear in existing user flows in this spec; that is a separate design question)

**Studio gate:** The flow appears conditional on the learner's studio assignment (set during account creation or admin import). If studio is Sparks or Discovery, the flow is skipped entirely; the learner sees the existing Year-Vision-first onboarding.

---

## Design principles

The following principles are binding on every screen, copy decision, and interaction in this flow. They derive from the research brief and the convening that produced it.

### Principle 1: Invitation, not assignment

The first impression must be unmistakably invitational. The opening question is *"Would you like to try this?"* - not *"Set your quest."* Refusing is honored as a legitimate first choice, not as a deferred decision.

### Principle 2: Right to refuse is first-class

A learner who declines the quest-cycle path lands cleanly in an alternative flow with equal dignity. No nudges. No "are you sure?" No different downstream experience that punishes the refusal. The refusal pathway is as well-designed as the acceptance pathway.

### Principle 3: Body-first

Before any quest framing appears, a body-first regulation surface is offered. The somatic gate already present in Compass's architecture (per existing somatic-safety design) is the first screen of the flow.

### Principle 4: Six refusals at the implementation layer

The following forms named by critical scholarship must be absent from the UI:

- No grading, completion percentages, or quantified metrics visible to anyone other than the learner themselves
- No ranking, comparison, or peer-visible progress
- No banking-model knowledge deposit (the guide does not author the quest meaning; the learner does)
- No external deadline imposition (the learner sets the pace; "I didn't get to it" is a legitimate outcome)
- No productivity-as-worth framing (mastery-oriented language throughout)
- No audit-culture metrics intended for institutional reporting

### Principle 5: Mastery-oriented framing

All quest-cycle language uses mastery-orientation, not performance-orientation. *"What did you grow into?"* not *"What did you complete?"* This is a vocabulary-level commitment binding on every copy decision.

### Principle 6: Real-audience close

The quest-cycle ends with a real-audience moment - the learner shares what they made, learned, or built with at least one other person. The architecture does not specify who the audience is; the learner chooses (parent, partner-learner, guide, a video to their future self).

---

## The user journey

### Screen 0: Body-first welcome

The very first screen after sign-in invites the learner into nervous-system regulation before any orientation content appears.

**Visual:** Soft, slow, breath-paced animation already present in Compass.

**Copy:** *"Welcome. Before we look at anything together - one breath. In through your nose. Out through your mouth. There's no hurry."*

**Interaction:** No button required. The screen sits until the learner taps to continue. There is no timer, no skip-counter, no measurement of how long they stayed.

**Salus's gate:** This screen is non-negotiable. It is the first surface the learner meets, before identity, before content, before invitation.

### Screen 1: Studio orientation (existing)

The existing Compass first-run identity surface continues here. Learner confirms their hero name, the studio they're in, who their guide is.

This screen is unchanged by this spec.

### Screen 2: The invitation

The first quest-cycle-specific screen. Pure invitation; nothing required yet.

**Copy draft:**

> *Hero's Compass is built to help you find your way.*
>
> *Some learners like to set a big map for the year and then walk it one day at a time. That works.*
>
> *Some learners like to also set smaller adventures - things they want to grow into over the next few weeks. Quests, you could call them.*
>
> *Would you like to try a quest?*

**Buttons (equal visual weight, equal placement):**
- *"Yes, I'd like to try one"*
- *"Not today - I want to look around first"*

**Notes for designer:**
- The buttons must be visually equivalent. Neither is "primary" with a colored background while the other is gray.
- The phrasing *"Not today"* is intentional - it leaves the door open without making refusal feel terminal.
- The phrasing *"I want to look around first"* communicates that the learner is in charge of pace.

### Screen 3a: The refusal pathway (if learner picked "Not today")

**Copy:**

> *That's okay. You can always start a quest later - tap the compass icon when you're ready, or never. Year-Vision is here for you whenever you want it.*

The learner lands on the existing Year-Vision flow as if this spec did not exist. Their refusal is recorded only as "did not start a quest in onboarding." No follow-up surfaces. No reminders. No different downstream experience.

**Salus's gate:** the refusal pathway must be the cleanest path through the app. If it ever becomes harder than the acceptance path, the design has failed.

### Screen 3b: The quest-setting conversation (if learner picked "Yes")

This is the load-bearing surface. It's a three-question prompt cycle that helps the learner shape a quest that is theirs.

**Copy and interaction:**

**Question 1 of 3:**

> *If you could grow into one thing over the next four weeks - something you choose, that would feel like real growth - what would it be?*
>
> *Take your time. There's no wrong answer.*

Input: a text box with no character limit, no formatting toolbar, no spell-check pressure. Just a quiet space.

**Question 2 of 3:**

> *What would showing it look like, four weeks from now?*
>
> *This is the real-world finish: maybe you'd write something and share it. Maybe you'd make something and show your parent. Maybe you'd film a video for your future self. Maybe you'd do something only you would know about. What feels honest to you?*

Input: same quiet text box.

**Question 3 of 3:**

> *What would make this quest feel like it served you - even if you didn't finish it the way you imagined?*

This question is critical. It surfaces the mastery-orientation framing before the quest even starts. It names that the quest's purpose is the learning, not the completion.

Input: same quiet text box.

### Screen 4: Confirmation

The learner sees their three answers reflected back, with a small adjustment opportunity.

**Copy:**

> *Here's what you said. Read it back. Change anything that doesn't feel right.*

Each answer is editable in place. The screen is calm. No "you're committing to this" framing.

**Final button:**

> *"This is my quest"*

### Screen 5: The quest is set

A simple confirmation. Calm. Brief.

**Copy:**

> *Your quest is set. We won't ask you to track anything. We won't measure you. We won't compare you. We won't message you about it.*
>
> *Once a week, we'll ask you one question: how are you learning?*
>
> *In four weeks, we'll come back and ask: what did you grow into?*

The learner lands on the existing Today/Year-Vision dashboard. The quest is visible as one small element. Nothing else changes.

---

## During the quest (weeks 1-3)

### Minimal touch

The app does not surface the quest constantly. The learner sees it on the dashboard as a small named element. They can tap it to see their three answers.

### Weekly check-in

Once per week (Sunday evening, or whatever the learner's natural rhythm is), the app surfaces a single question:

> *How are you learning?*

The learner can answer or skip. No streak. No badge. No score. The question disappears whether answered or not. The answers are stored privately, visible only to the learner (and optionally surfaced in the Week-4 retrospective).

**Salus's gate:** the weekly check-in must not become a chore or a guilt source. If a learner skips three weekly check-ins in a row, no escalation, no message, no notification.

---

## The quest close (week 4)

### The retrospective surface

This is the second load-bearing surface in the flow.

**Copy and interaction:**

**Question 1 of 4:**

> *Four weeks ago, you set this quest:*
>
> *[learner's quest, reflected back]*
>
> *Reading that now - what's true?*

Input: text box. The phrasing *"what's true"* invites honesty in any direction: I did it, I didn't, I changed it, it changed me.

**Question 2 of 4:**

> *What did you grow into?*

This is the mastery-orientation question. It is asked regardless of whether the quest was "completed."

**Question 3 of 4:**

> *What surprised you?*

This question surfaces the learning that wasn't predicted at quest-start.

**Question 4 of 4:**

> *If you ran a similar quest again - what would you do differently?*

This question is the seed of the next quest, even if no next quest is started.

### The real-audience moment

After the retrospective is complete, one final screen:

**Copy:**

> *You said you'd show this to someone at the end. Did you?*

**Buttons:**

- *"Yes - and here's how it went"* (opens a text box; private to learner)
- *"Not yet - I'll do it this week"* (closes; no follow-up)
- *"I changed my mind about showing it - here's why"* (opens a text box; private to learner)

All three are honored equally. The third option is critical: it names that *changing your mind about the audience is also legitimate*.

### Quest completion screen

**Copy:**

> *Your quest is closed.*
>
> *What you wrote is yours. We don't share it. We don't measure it. We don't compare it to anyone else's.*
>
> *When you're ready, you can start another quest - or not. Both are okay.*

The learner returns to the dashboard. A small archive of past quests is accessible from their profile, visible only to them.

---

## Edge cases and refusal pathways

### A learner who starts a quest and stops engaging

If a learner sets a quest but does not return to the app for two weeks, no escalation. No message. The quest sits where it is. When the learner returns, the dashboard shows the quest with a calm option: *"This quest is still here if you want it - or you can close it gently"*.

### A learner who closes a quest early

The quest-close flow above is available from the dashboard at any point. Closing early is honored equally with closing at week 4. The retrospective questions surface the same way.

### A learner who refuses the audience moment entirely

The third button on the audience screen ("I changed my mind about showing it") honors this completely. No follow-up.

### A learner whose quest reveals difficulty (grief, anxiety, family situation)

If the retrospective answers contain language that suggests the learner is processing something hard, the existing care-on-demand surface in Compass is present at the bottom of every screen. The architecture does not surveille for keywords; it does ensure care is always one tap away.

---

## What this spec does not specify

**Implementation language and components:** This is a design proposition, not a build specification. The actual UI components, animations, copy refinements, and accessibility specifics are downstream work.

**Backend data model:** The quest-cycle data model needs separate design work. Considerations include: is a quest a row in its own table, or an attribute on the learner's year? How does it interact with the existing year_quotes / year_traits / year_plans schema? What's the privacy posture (presumably: learner-only by RLS policy, similar to year_quotes)?

**Guide-side surfaces:** Whether and how the guide sees quest activity is a separate question requiring its own gate review. The spec defaults to "the guide does not see quest content unless the learner explicitly shares it."

**Parent-side surfaces:** Same as guide-side. Default to learner-only visibility unless the learner shares.

**Quest discovery and modification mid-quest:** Whether a learner can modify their quest mid-cycle, and how that interacts with the retrospective. The spec leans toward "yes, freely, no penalty" but this needs design work.

**Multiple simultaneous quests:** The spec assumes one quest at a time per learner. Multi-quest support is a future question.

---

## Open questions

1. **Studio assignment timing.** This spec assumes studio is known at sign-in. For learners imported via bulk roster, this is true. For self-service signup paths, not yet wired. Consider whether the flow should be guide-gated rather than studio-gated for initial pilot.

2. **The first weekly check-in timing.** "Sunday evening" is a placeholder. Real timing should be co-designed with learners.

3. **Language register for younger Adventure-tier learners.** 10-year-olds vs 13-year-olds have different language registers. The spec uses calm adult-adjacent language throughout. Should it adapt by age? The voice work would be substantial.

4. **What happens when the school year ends mid-quest.** Quest cycles in fall and spring may cross summer break. Need a graceful pause/resume design.

5. **Co-design with learners.** This spec is theory-derived. It should be tested with at least 3-5 Adventure-tier and Launch Pad-tier learners before implementation. The learners' actual responses to draft screens will surface things this document cannot.

6. **The "what we won't do" copy in Screen 5.** ("We won't ask you to track anything. We won't measure you. We won't compare you.") This language is unusual for a school product. It is also load-bearing per the research brief. The decision to keep, modify, or remove it should be deliberate.

---

## Implementation gates

Before this flow ships to production, the following should land:

1. **Co-design conversation with at least one Adventure or Launch Pad learner** - their response shapes the final copy and flow
2. **Review by Jenna or another Vibrant Life guide** - the spec must land honestly within the studios' actual culture and language
3. **Backend data model design** - schema work for quests must happen first
4. **Accessibility review** - per existing Compass accessibility standards
5. **Voice-tone audit** - all copy reviewed for invitational-vs-required register
6. **Refusal pathway end-to-end test** - a learner who refuses the quest at Screen 2 must walk a path that is equal-in-dignity to a learner who accepts
7. **Salus's four gates verified at each screen** - autonomy preserved, no visible metrics, "I didn't get to it" honored, body-first door active
8. **Audit cadence defined** - the quarterly review of actual implementation against the six refusals must be calendared before ship

---

## Companion document

This spec is a direct extension of the research brief: [2026-06-14 Quest-Cycle Architecture Research Brief](../research/2026-06-14-quest-cycle-architecture-research-brief.md).

Read the research brief first if you have not. The design decisions here are grounded in findings from three research arcs documented there. Any modification to this spec that contradicts the brief's binding conditions should be flagged and routed through a research-aware review.

---

## Document status

This is **v0.1** - a first design proposition open to substantive revision. It documents a synthesis from a single working session and explicitly does not represent a final design. It is intended as input to design conversations with Vibrant Life Studios, with learners themselves, and with anyone who will eventually implement this surface.

Subsequent versions should incorporate:

- Co-design responses from real Adventure and Launch Pad learners
- Guide review feedback
- Backend data model design
- Accessibility review
- Voice-tone refinement
- Refusal-pathway testing
- Implementation engineering review

The audit-cadence proposed in the research brief applies to this spec as it evolves. Every revision should be tested against the six critical refusals and the four safety conditions.

This document, like the architecture it proposes, is best held lightly. It is not the design. It is one honest attempt to begin the design.
