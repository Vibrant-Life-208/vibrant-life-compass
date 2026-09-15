# Gate E - Accessibility Audit (Community Board, for Pervius)

**Owner:** Pervius. **Standard:** WCAG 2.2 AA (Pervius holds AAA where reachable). **Surfaces:** the
learner submission form, the posted cork board, "Your ideas", and the owner review UI.

Pervius's discipline: *compliance is the floor, adoption is whether anyone walks on it - and the
guardian is included in the circle of care.* This audit has three parts: **(1)** mechanical WCAG
failures already fixed (so Pervius reviews a clean surface), **(2)** rendered-surface checks only a
real render/screen-reader can settle - Pervius's to run, **(3)** two judgment calls that need a design
decision, not just a fix.

---

## Part 1 - Mechanical fixes already applied (sw v204, dark)

- [x] **`#cork-contact` (the "specific person/place" input) was unlabeled.** Added
      `aria-label="A specific person or place to contact"` + `aria-describedby="cork-contact-hint"`.
- [x] **`#cork-poster` (the file input) was unlabeled** (a sibling `<span>`, not associated). Added
      `id` to the label span + `aria-labelledby="cork-poster-label"` + `aria-describedby` to the hint.
- [x] **Async poster status wasn't announced.** `#cork-poster-status` now has `aria-live="polite"`, so
      a screen-reader user hears "Reading your file..." / "Poster ready." / the error.
- [x] **File `accept` offered SVG.** Changed `image/*` to an explicit raster allowlist
      (`png,jpeg,webp,gif,heic,heif`) matching the pipeline, so the picker never offers a type the
      code will reject.

Already-good (verified in code, no change needed): title / description / category / when-where are
each an `<input>`/`<textarea>`/`<select>` nested inside its `<label>` (implicit association); the
report form's input uses `<label for=...>`; the dynamic report form + the "specific" contact reveal
both move focus correctly; `prefers-reduced-motion` already disables the `.cork-note` hover transition.

---

## Part 2 - Rendered-surface checks (Pervius runs these)

Open the board with `?commboard=on` and a screen reader (VoiceOver/NVDA), plus a contrast tool and a
touch-target ruler:

- [ ] **Contrast (WCAG 1.4.3 AA, 4.5:1 normal text).** Measure the muted small text against the cork
      background: `.cork-hint` (0.78rem, `--text-muted` italic), `.cork-opt` (0.8rem, `--text-muted`),
      and `.cork-report` (0.76rem, `--text-muted` underline). Small muted text on a warm background is
      the likely AA failure. Bump the colour token(s) if they miss.
- [ ] **Touch targets (WCAG 2.5.8 AA, 24x24 min; 44x44 best-practice).** Measure `.cork-report`
      (currently `padding: 0`, ~12px tall - **almost certainly under 24px**), the `.cork-radio` inputs,
      and the file input. See Part 3 for the report-link tension.
- [ ] **Screen-reader read-through of the form:** every field announces a name + its hint (the
      `aria-describedby`s should read); the contact fieldset announces as a group (legend); the poster
      status announces on change (aria-live).
- [ ] **Screen-reader read-through of the board:** each posted note reads title -> category -> body ->
      meta; a poster `<img>` reads its `alt` (currently derived: "<title> poster" - see Part 3);
      decorative thumbs are `alt=""` (correct).
- [ ] **Focus visible + order** through submit, and after the report "Thank you" replaces the button
      (focus is currently dropped when the button is removed - decide if that needs managing).
- [ ] **Owner review UI** (`owner.js`): review cards, the guidance note, the "someone flagged this"
      flag, and the Take-down button all read and are reachable.
- [ ] **Cognitive / young register:** confirm the Discovery form (title + description only, no
      contact/when-where) is a manageable floor; the full form's field count for older tiers.

---

## Part 3 - Judgment calls (design decision, not a mechanical fix)

- [ ] **Report-link touch target vs. the discreet-report intent.** `.cork-report` ("Something wrong?
      Tell a guide") is deliberately a small, quiet underline link - Salus + Neelix wanted reporting
      present but NOT prominent (not a big red button inviting misuse). WCAG 2.5.8 wants >=24x24.
      These pull against each other. Pervius's call: give it enough padding/min-height to clear 24px
      **without** making it loud (e.g. a larger tap area with the visual weight unchanged), or accept
      the 2.5.8 "inline exception" if it qualifies. Name the resolution.
- [ ] **Caption-as-alt-text (currently NOT built).** A posted poster's `alt` is derived from the title
      (`"<title> poster"`), not a learner-authored caption. Pervius's standing want: *if a poster is
      attached, the learner's caption doubles as required alt text* - so a blind child on the board
      knows what is pinned, in the poster-maker's own words. This is a BUILD (add an optional caption
      input shown when a poster is attached; use it as the poster's `alt`; require it if a poster is
      present). Decide: build it before lift, or accept title-derived alt as the v1 floor and build
      caption-alt as a fast-follow. If build: it is a small, contained change - flag it and it gets
      done.

---

## Pervius's review - 2026-09-15

I measured, I did not guess. Two Part-2 items were real failures, and I have fixed them; the two Part-3
judgment calls are resolved.

**Contrast (WCAG 1.4.3 AA) - was FAIL, now fixed.** `--text-muted` (#8a8a8a) on the cork note (#fffdf6)
and the cream surface (#f5f0e8) measures **3.39:1 and 3.04:1** - below the 4.5:1 floor for normal-size
text. These are not incidental strings: `.cork-hint` carries the "don't put a phone number" safety
instruction, and `.cork-report` is an actionable control. Fixed: functional board text (`.cork-hint`,
`.cork-opt`, `.cork-report`) now uses `--text-soft` (#5a5a5a) = **6.1-6.8:1**. Passes AA with room.

**Touch target (WCAG 2.5.8 AA) - was FAIL, now fixed.** `.cork-report` was `padding: 0` at 0.76rem -
~12px tall, under the 24px minimum. **Resolved the tension with Salus/Neelix's discreet-report intent
by separating tap-area from visual weight:** added `padding: 0.4rem 0.2rem` + `min-height: 24px` so the
reachable target clears 24px, while the text stays the same small underlined link. The bigger target is
invisible; only the reach grew. Reporting is still present-not-prominent.

**Caption-as-alt-text (Part 3b) - deferred, consciously, NOT a lift-blocker.** Every posted poster
already has a non-empty, meaningful `alt` ("<title> poster"), so the **AA floor is met** - a
screen-reader user is not met with an unlabeled image. My standing want (the learner's own caption as
the alt) is a **dignity upgrade above the floor**, not a compliance gap: it lets a blind child know what
is pinned in the pinner's words, not a system-derived phrase. I name it as a **fast-follow build**
(a small optional caption input, used as the poster's alt, required when a poster is attached), and I do
not block lift on it. Compliance is the floor; this is the ceiling, and the ceiling can come after.

**Adoption note (my discipline: did the board USE the accessibility infra, or just have it?):** yes -
the labels/`aria-describedby`/`aria-live`/allowlist-`accept` are wired into the real rendered markup,
not sitting unused. The Discovery register genuinely omits the contact + when-where fields (lower
cognitive floor for 8-11), which is adoption of the age-tiering, not just its architecture.

## Sign-off

- [x] Part 2 code-level failures fixed: contrast (-> --text-soft, measured 6.1-6.8:1) and the
      `.cork-report` touch target (>=24px tap area, visual weight unchanged). sw v205.
- [x] Part 3 resolved: report-target tension resolved (tap-area != prominence); caption-as-alt is a
      named fast-follow, not a lift-blocker (title-derived alt meets the AA floor).
- [ ] **CONDITION OF SIGN-OFF (fold into the Gate F real-child walk):** a live **screen-reader
      read-through** with an actual AT user - form fields + hints announce, the poster status announces
      on change (aria-live), each board note reads title -> body -> meta, focus is visible and ordered,
      and focus is not lost when the report "Thank you" replaces the button. I signed the measurable,
      code-level compliance; the lived screen-reader experience is signed when it is walked. The
      guardian is included in the care - this is noted, not carried to exhaustion.

*44 by 44 is dignity - and I gave the report link its reach without giving it a shout. The blind child
gets a meaningful alt today; the pinner's own words are the fast-follow. - Pervius*
