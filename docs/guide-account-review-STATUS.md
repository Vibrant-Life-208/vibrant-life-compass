# Guide Account Review - Implementation Status & Handoff

**Last updated:** 2026-08-28
**Origin:** the 2026-08-23 five-agent guide-account review (Cura, Lux, Accord, Salus, Pervius) of Compass guide accounts. Five findings; each is now built, in a reviewable draft, or decided.

This is the single pickup point. Every fleet decision below is in `evoke-agents-backup/agents/decision-logs/2026/08/` (dated entries 08-24 through 08-28).

---

## PR status at a glance

| PR | Feature | Branch | State | Gate |
|----|---------|--------|-------|------|
| **#11** | a11y tab-strip fixes | `fix/guide-surface-a11y` | **MERGED + deployed** (sw v163) | done |
| #12 | Guide becoming/finish toggle | `feat/guide-becoming-toggle` | draft, dark `?becoming=on` | Accord walk |
| #13 | Phase 2 password reset (2 tracks) | `feat/guide-password-reset-phase2` | draft-for-TCC | see below |
| #14 | Guide onboarding + MFA enrollment | `feat/guide-onboarding` | draft, dark `?guideonb=on` | copy + Tutela + walk |

Nothing except #11 is deployed. All draft PRs carry their owed-lists in the PR body.

---

## #11 - a11y tab-strip  (DONE)

Merged to main, deployed. Tablist/tab ARIA semantics, roving keyboard nav, inactive-tab contrast (`--tab-inactive` 5.1:1), focus-visible ring. Applies to every role's tab strip. From Pervius. **Recommended follow-up:** a real screen-reader walk (was not done before merge).

---

## #12 - Guide becoming/finish toggle  (dark)

A guide authoring their own `guide-summer` goal chooses its shape (finish vs becoming) instead of inheriting it from the slice label. Defaulted from slice (zero regression); never touches `BECOMING_SLICES` (learner behavior + the open school-ratification question stay untouched).

- Decision: Accord, 2026-08-24. Copy: Comes + Accord, signed 2026-08-26 (Partner gets its own presence body; relational bodies point the guide at "how you show up," never the other person's progress).
- **Owed before the flag lifts:** Accord's logged-in `guide-summer` walk (correct body per lifeArea, default-from-slice no regression, empty renders identically); confirm `BECOMING_SLICES` untouched.

---

## #13 - Phase 2 password reset  (draft-for-TCC)

Moves password reset off the shell script (which holds the `service_role` master key in a terminal against minors' accounts) into server-side Edge Functions, and closes a verified client-side bypass of the forced-change gate. **Split into two independent tracks** (Impetus + Lux, 2026-08-28):

### Track 1 - guide/owner reset (the live-fire fix)
Replaces the shell path. No NEW child-facing surface (child hits the existing forced-change screen). Structurally complete:
- `reset-account-password` Edge Function: constant-work roster-scoped auth (v0.32 pattern), rate-limited, fatal audit row (records roster vs owner path).
- **O3 = native MFA** (council 2026-08-28). Function asserts **AAL2** off the caller JWT (`assertAAL2OrThrow`); the client elevates its own session first. The MFA *enrollment* that produces AAL2 is **PR #14**.
- Gated on: Tutela's remaining conditions, guide MFA enrollment (#14), captain go. NOT on the child walk.

### Track 2 - forced-change bypass close (child-facing)
- `set-my-password` Edge Function: reauth (verify current password) + revoke other sessions + server-side flag-clear + fatal audit.
- v0.39 audit table (+ `via` column); v0.40 locks `must_change_password` against client writes.
- Client re-wire built: `updatePassword(newPassword, currentPassword)` invokes `set-my-password`; local-store keeps its own path; `cp-current` field added.
- Gated on: the Salus+Jake consented walk, child-facing copy (honest "a guide reset this" line, age-tiering), verify, and deploy order.

### Reviews (logged)
- Tutela / TCC (08-26, applied 08-27): CLEARED-WITH-CONDITIONS. Fixes F1-F7 applied in code.
- Salus (child-safety) + Jake (developmental), 08-27: SAFE / APPROPRIATE-WITH-CONDITIONS, **not cleared for a real child**.

### Deploy order (LOAD-BEARING)
`v0.39 (safe anytime)` -> deploy Edge Functions (with MFA enrollment live) -> switch client -> **verify** -> **then** v0.40. Reverse it and first-time users lock out. Retire the shell reset path once the function path is verified live. sw cache bump at deploy.

---

## #14 - Guide onboarding + MFA enrollment  (dark)

A guide meets two things once before the dashboard (dark `?guideonb=on`, guide-role only):
- **Orientation:** names the staff-power boundary (tools touch real children's records; help-on-request, never silent entry) + the mentor/mentee dual identity. One screen, not a gauntlet (Accord). Copy PROVISIONAL.
- **MFA enrollment:** native Supabase MFA (`auth.mfa.enroll` -> QR -> `challengeAndVerify`), which produces the AAL2 that Track 1 asserts. Supabase-only; skipped on local + when already enrolled. Recovery = owner-mediated re-enrol, no self-service (Tutela).

**This is what unblocks Track 1.** Owed before the flag lifts: Accord + Hoshi orientation copy; Tutela review of the live MFA wiring; a logged-in guide walk (MFA untestable on local); sw bump at deploy.

---

## Open items that need a human (not more autonomous build)

1. **The honest-line seam** (Salus + Europa): must the child-facing "a guide reset this" line ship *with* Track 1 (in-app child resets begin there), or may it wait for Track 2? Only unresolved point from the five-agent decision.
2. **Copy:** Accord + Hoshi - guide-onboarding orientation; Phase 2 child-facing lines + age-tiering.
3. **Reviews:** Tutela on live MFA wiring; the seam above.
4. **Walks:** Accord (becoming toggle); the binding Salus + Jake consented 8-11 real-learner walk (needs a guardian-consented child).
5. **Calls:** captain go; deploy sequence; retire the shell reset path.
6. **Not code:** `studios.js` guide-category `PLACEHOLDER` needs a real Vibrant Life guide conversation.

---

## Decision-log trail (evoke-agents-backup)

| Date | Entry |
|------|-------|
| 2026-08-24 | Lux - forced-change bypass verified, fold fix into Phase 2 |
| 2026-08-24 | Accord - becoming carve-out design decision |
| 2026-08-26 | Accord - becoming toggle copy signed (with Comes) |
| 2026-08-27 | Tutela - Phase 2 TCC review (CLEARED-WITH-CONDITIONS) |
| 2026-08-27 | Salus + Jake - child-safety / developmental gate |
| 2026-08-28 | Cura (+ Impetus, Tutela, Salus, Lux) - O0/O1/O3 five-agent decision |
