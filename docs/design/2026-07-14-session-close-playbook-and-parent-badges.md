# Session Close-Out - Playbook, Parent Badges, Videos

**Span:** 2026-06-30 → 2026-07-14 · **Captain:** Europa / Ms. Erin · Recorded by Claude Code

---

## What we accomplished

**The Playbook**
- Reviewed the earlier "PREVIEW" playbook with the MAC; applied color-honesty (studio colors made sacred), reduced emphasis inflation, fixed the wordmark, added a closing hills motif, and made the Creator (hero) mindset the main box.
- Built a **new condensed playbook re-skinned to Jenna's real Vibrant Life brand** (green torn bands, gradient wordmark, Poppins), with four in-flow video "Watch" bands and reflection questions woven in.
- Added a **5-part back index**: embedded academic calendar, Details & Staff, This Year & The Tools (quests + whole-child tools), Words We Love (quotes + reading), and a Watch video hub. Nothing is cut now - reference just lives in the back.
- MAC spacing/type pass (grounded in design research): wordmark now fits and is smoothly tracked; body 11pt; one consistent 0.7in margin; calendar caption no longer orphaned.
- **Swapped in the original cover graphics** (spliced Jenna's actual page 1) for pixel-perfect brand.
- Current file: `docs/design/Vibrant-Life-Family-Playbook-VLbrand.pdf` (16 pages). Also on the Desktop.

**Parent Badges**
- Fixed the Big Bathroom badge wording (flushable toilet, not studio-specific).
- Created **print-ready parent recognition cards** (`vibrant-life-tots/Parent-Badge-Cards.pdf`), unified to the VL brand.
- Built **Compass step 1** (`js/parent-badges.js` + `parent-view.js`): self-disclosed local opt-in, no tracking. Owner-reviewed (Lux/Accord/Comes/Salus/Polaris); convergent-signal conditions applied (Path deferred to step 2, hard-day line surfaced, device-only disclosed). Merged to `main`.
- Guinan reviewed the Jenna walkthrough language.
- Later refinements (captain/linter): **offered-not-pressed**, **no calendar/Session-N on cards**, **listening-first**.

**Videos**
- Locked cartoon/animated direction (Level-6 gate); drafted **Canva AI video prompts** (`docs/design/2026-07-13-canva-ai-video-prompts.md`) for all four videos.

**Git / saving**
- Committed + pushed all work. `vibrant-life-tots` was unversioned → **git-init + new private GitHub repo** (`Vibrant-Life-208/vibrant-life-tots`).
- Merged the playbook + parent-badges branch into `vibrant-life-compass` `main` (one conflict, `js/north.js`, resolved in favor of main's newer automation code).

---

## OPEN THREADS - start here next session

1. **LISTEN FIRST (parent badges).** The 2026-07-09 True Play badge review returned an **unresolved dissent** (Kira, Spock, Picard): no real parent has been asked, and "no badge at all" was never offered as the most respectful option. **Design does not advance until we listen.** Live step: `vibrant-life-tots/PARENT_LISTENING_FIRST.md`. This is the single most important open thread.
2. **Show Jenna.** The standing gate for everything - playbook, cards, badges, videos. Nothing reaches a family until Jenna sees it.
3. **Videos.** Test Canva AI generation with the prompts; record Jenna's real voice; swap the **placeholder "WATCH →" links** for real YouTube URLs (four in-flow bands + four in the hub).
4. **Compass build.** Step 2 (the moving, session-synced Path) + step 3 (persist opt-in as a parent-private RLS boolean) - both **gated on the listening-first finding**, not to be built ahead of it.
5. **Cover "2025".** The original cover art carries a small "2025" copyright bottom-right while the book is 2026-2027 - decide whether to update.
6. **Calendar is an embedded image** from the Google Sheets export - re-export and re-embed if the sheet changes.

---

## Drift signals (named, for honesty)

- **The badge design got ahead of parent contact** - extensively designed before any real family was asked. The True Play review caught it; listening-first is the correction.
- **The "simplify" playbook pass quietly cut soul-content** (reflection questions, quotes) that the fleet had deliberately restored. Caught in the "what was taken out" conversation; restored + moved reference to the back index.
- **Shared-repo friction:** the compass app automation churns `main` constantly, which made every git step delicate.

## Evoke or extract?

**Strongly evoke.** The through-line was choosing the harder honest version every time: recognition not reward, no tracking, honoring unresolved dissent instead of shipping, listening to a real parent before more design, and showing Jenna before any family. The badge thread self-corrected toward "ask first."

---

*Next session opens on the listening-first parent conversation and the Jenna review. Everything else waits on those two.*
