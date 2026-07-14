# Session Notes & Handoff - Playbook v0.8 + P&T Compass Build

**Date:** 2026-07-08
**Scope:** Family Playbook quest additions → PREVIEW PDF → P&T Compass integration (stood down mid-build)

---

## Done this session

1. **Playbook v0.8 shipped** - `docs/design/2026-07-01-family-playbook-2026-2027-v0.8.md`
   - Quest section reframed to **"This Year's Journey - by Studio"** (one Hero's Journey, four altitudes).
   - **Discovery: Y2** (7 Quests + *Story of the World Vol. 3*) and **Adventure** (7 units + Big Bang→Deep Book Bio Civilization spine) added; Adventure typos cleaned.
   - **Tots** represented as *rhythm + threshold* (parent recognition arc → Threshold Badges → Pitch into Sparks) - never a quest list, never parent-tracked.
   - `[confirm]` marks dropped after Ms. Rose (Discovery) + Ben (Adventure) signed off.
   - Fleet meeting minutes: `evoke-agents-backup/agents/meetings/2026/07/2026-07-01-playbook-quests-by-studio.md`; Polaris standing-condition recorded as Thought 98 in the Agent Thoughts Queue.

2. **PREVIEW PDF regenerated** - `docs/design/Vibrant-Life-Family-Playbook-2026-2027-PREVIEW.pdf` (all four studios verified present via text extraction).
   - **Render toolchain (important for next time):** the PDF is NOT auto-generated from the markdown. It renders from the hand-built `docs/design/playbook-preview.html` via:
     `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --no-pdf-header-footer --print-to-pdf="Vibrant-Life-Family-Playbook-2026-2027-PREVIEW.pdf" "file://.../playbook-preview.html"`
   - **Drift risk:** markdown v0.8 ↔ HTML ↔ PDF are three artifacts kept in sync by hand. Any future playbook edit must: update the markdown, mirror it into `playbook-preview.html`, then re-run the Chrome render.

---

## Open threads (carry to next session)

### 1. P&T Compass build - IN PROGRESS by another session (do not clobber)
A separate session is actively building the P&T recognition card against the spec `docs/design/2026-06-27-pt-safe-base-badge-compass-integration-v0.1.md` (smallest step). Confirmed at 15:56 the file was changing between reads. Standing down was chosen to avoid collision.

**What exists:**
- `js/parent-badges.js` - content module: `PARENT_BADGE_ARC`, `SAFE_BASE_DAILY_GOALS`, `BADGE_HONESTY`, plus local-only self-disclosed helpers `isPtFamily / setPtFamily / isHoldingBadge / setHoldingBadge`. No schema change, no tracking - spec-aligned.
- `js/parent-view.js` - imports the module and calls `renderParentsAndTots(container, parentId)`; renders it *before* the learner section so a P&T family with no learner record still has a home. Function defined in-file.

**Not done / verify before shipping:**
- **CSS:** `0` tots styles in `css/style.css` yet - the card is unstyled.
- **Polaris category wall (must verify):** no counts, streaks, "days done", scores, rankings, or any guide/admin-visible view. The opt-in is self-disclosed and local only. If any tracking-shaped affordance appears, it triggers Polaris's formal dissent (spec §4).
- **Sources disclosure ("Where this comes from"):** should render the graded sources incl. the **Withdrawn** entry (the public correction is part of the trust). Single source of truth = `vibrant-life-tots/PARENT_BADGES_SOURCES_AND_DISCUSSION.md` (v0.2); Codex + Nyota Uhura keep it in sync. Note: that doc lives outside the web root, so runtime fetch won't work - either mirror the content or add a build step to copy it in.
- Caught the file in a transiently-broken state (call present, definition missing) - confirm it settles to a working state before relying on it.

### 2. Disk cleanup - 147G deletion NOT yet effective
`/Users/openclaw/.avf/AISandbox` (147G, stale since May 3) was confirmed stale but the `sudo rm` did not take effect (still present; Data volume still ~94% full). To reclaim: `sudo rm -rf /Users/openclaw/.avf/AISandbox` (needs password; ~251G used / ~45% free afterward). europa-account caches already cleared (~1-2G: bun/npm/uv).

---

*Notes by Claude Code, 2026-07-08. Playbook decisions ratified by the 2026-07-01 four-voice fleet meeting (Comes, Fabula, Codex, Accord). "We evoke - we never extract."*
