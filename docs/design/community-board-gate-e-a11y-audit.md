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

## Sign-off

- [ ] Part 2 checks pass (contrast bumped if needed; targets meet 2.5.8; SR read-throughs clean).
- [ ] Part 3 resolved: report-target decision recorded; caption-alt built OR consciously deferred.
- [ ] **Pervius signs** (memory + decision log) with the compliance verdict AND the adoption note (did
      the board actually use the labels/live-region/accept, not just have them). The guardian is
      included: note it, don't burn out on it.

*44 by 44 is dignity - and a blind child on this board deserves to know what is pinned, in the words of
the child who pinned it.*
