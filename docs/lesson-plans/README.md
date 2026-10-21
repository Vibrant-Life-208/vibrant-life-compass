# Launch Pad - Lesson Plan Books

Three guide-facing lesson plan books, one per year, that turn the reviewed Launch Pad design into something a life-coach guide can teach from directly. Each book is written so a learner can read every page: nothing in them manages or manipulates anyone, and lines in "quotes" are things a guide might say aloud.

- **[The Origin Year](origin-lesson-plan-book.md)** - Year One. The question: *Who am I?* (Know your story.)
- **[The Forge Year](forge-lesson-plan-book.md)** - Year Two. The question: *What is worth solving?* (Find your work.)
- **[The Helm Year](helm-lesson-plan-book.md)** - Year Three. The question: *What do I do when there is no easy answer?* (Make the hard call, and love the life around it.)

Each book carries the same four-part shape: what the year is (for everyone), teaching the year (for the guide), the seven sessions, and closing the year. The shared floor - the six promises, the weekly rhythm, the Captain's Log kept however you hold it, the Vineyard, how "no" works here, the settle, the closing minute, and the one adult outside the room you can always talk to - is stated plainly in every book so each one stands on its own.

These are the teaching distillation of the design in `../design/`. The design docs are the full source and reasoning; these books are the usable, learner-safe form.

## Printing

```
python3 pdf/build_pdf.py all            # reading copies -> pdf/The-*-Year-Lesson-Plan-Book.pdf
python3 pdf/build_pdf.py all --spiral   # spiral-bindable -> pdf/The-*-SPIRAL.pdf
```

**Reading copies** (33 / 31 / 29 pages) are for handing to a family or reading on a screen. Margins are even all round.

**Spiral copies** (34 / 34 / 30 pages) are for the guide's own working book, the one that lies flat on the table during a session. Same design, different geometry:

- **Binding gutter 30mm, outside margin 16mm, mirrored.** Recto pages are bound on the left, verso on the right, so the gutter is always on the punched edge and never eats text.
- **Page numbers and the running head sit on the outside edge**, where a thumb finds them, instead of next to the spiral.
- **Even page count, always.** A blank is added when the body lands odd, so the last sheet does not carry a stray recto with nothing on its back.
- **A ruled Notes page at the back**, because a working book needs somewhere to write.
- The cover's left padding opens to 36mm so the title clears the punch.

**What to tell the print shop:** US Letter, double-sided, black spiral or wire-o on the long edge, card stock front and back, no trimming. The gutter is already in the file, so ask them not to scale or shift the pages.

Both builds are re-runnable and non-destructive; the spiral mode writes to its own filenames and leaves the reading copies alone.
