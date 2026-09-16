# Community Board - Real-Child Walk Script (Gate F, one sitting)

**Owners:** Jake (developmental) + Salus (safety), with a **consented** real learner, every screen. This
one sitting also closes **Gate C** (upload spot-checks) and **Gate E** (screen-reader read-through), so
they don't need separate sessions. Board is dark; walk it with `?commboard=on`.

**Before you sit down, have ready:**
- A learner account you have consent to walk with (ideally a Discovery ~8-11 child for the young-register
  read, plus/or an older-register learner).
- On the device: a **real phone photo that has GPS/location**, and a **real PDF**, to use as posters.
- A screen reader you can toggle (VoiceOver on iOS/Mac, TalkBack/NVDA otherwise) for Part 3.
- `exiftool` (or any "view EXIF" web tool) to check the saved poster in Part 2.

---

## Part 1 - The experience (Jake developmental + Salus safety)

Log in as the learner, open the community board (`?commboard=on`), and walk the whole loop. Watch, don't
lead.

- [ ] **Intention lands.** The line "A place to offer, not to perform. Every idea is received; none is
      ranked." - does the child read it as invitation, not competition? (Guinan's north star.)
- [ ] **Submit an idea.** Title + description. Does the ask feel doable? For a Discovery child: is the
      6-field older form vs. the simpler young form (no contact/when-where) the right cut?
- [ ] **The assent gate.** "I understand my idea will be shown to all the Vibrant Life families, and I
      want to share it." Does the child actually understand what they're agreeing to - that every family
      sees it? (Spock: the child is a knowing party, not just moderated.) If they don't get it, the copy
      needs work.
- [ ] **Poster upload** (optional). Does "add a drawing / photo of a drawing" read as an invitation, not
      an expectation a child with no PDF can't meet? Any "you're behind" feeling? (Jake's refused
      pattern.)
- [ ] **Report path.** Show them "Something wrong? Tell a guide" on a board note. Does a child understand
      it? Does it feel safe (not tattling, not weaponizable)? (Kira: does it protect a child, or could it
      quiet one?)
- [ ] **Delete their own idea.** The "Delete this idea" -> "Delete for good?" two-tap. Does the child feel
      they own their words - that they can take them back? (Quark.)
- [ ] **Family-objection.** The "This post is about me or my family" checkbox in the report form - does it
      make sense as a door for a family? (Kira.)
- [ ] **Path-back.** If a post were taken down: does "Taken down - that happens sometimes, and it is not a
      mark against you. You can tweak it and share it again" land as care, not punishment? (Winona.)
- [ ] **Salus safety sweep throughout:** any wince, any coercive shape, any count/streak/scoreboard leak
      (there should be none). Does "Off"/"Never mind"/"Delete" each feel like a genuine, unpunished
      choice?

## Part 2 - Upload security spot-checks (Gate C carry-in)

The child is uploading a real drawing/photo anyway - verify the two things the synthetic harness can't:

- [ ] **Real GPS photo -> no surviving location.** Upload the phone photo with GPS as a poster. It should
      render (a fresh downscaled JPEG). Then save the rendered poster and check its metadata is **empty**
      - `exiftool poster.jpg` shows no GPS/EXIF. *If location survives, STOP - hard blocker, not a walk
      note.*
- [ ] **Real PDF -> renders end-to-end.** Upload the PDF as a poster; its first page should render with
      no error (the pdf.js path, live under CSP).

## Part 3 - Screen-reader read-through (Gate E carry-in - Pervius's sign-off condition)

Turn on the screen reader and go through form + board once:

- [ ] Every form field + its hint **announces a name** (title, description, the contact fieldset as a
      group, the file input).
- [ ] The **poster status announces on change** ("Reading your file..." / "Poster ready.") - it's an
      `aria-live` region.
- [ ] Each **board note reads title -> body -> meta**; a poster image reads its alt; decorative thumbs are
      silent.
- [ ] **Focus is visible and ordered** through submit; and **focus is not lost** when the report "Thank
      you" replaces the button.

---

## Sign-off

- [ ] **Jake + Salus sign the walk** (memory + decision log) OR name what to change first - Discovery-fit,
      assent-comprehension, and the safety sweep are theirs to rule.
- [ ] If **Part 2** passes -> **Gate C signs off** here too.
- [ ] If **Part 3** passes -> **Gate E's** screen-reader condition is met, completing Pervius's sign-off.
- [ ] Note who walked it and when.

*Before lift, also re-run the regression suite (`scripts/board-regression.sh`) and, on the real school
roster, the two-guide RLS probes (B3b/B6b/B11b) that the sparse test DB couldn't walk.*

*The story belongs to the person living it. We do not clear a surface for a child until we have watched a
child meet it.*
