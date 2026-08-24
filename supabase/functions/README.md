# Edge Functions - Phase 2 guide password reset (DRAFT-FOR-TCC)

**Status: NOT DEPLOYED.** These are reviewable scaffolds from the 2026-08-23
5-agent guide-account review. They must not ship until the owed-list clears.
Full design: `../../docs/phase2-guide-password-reset-spec.md`.

## What's here

| Function | Component | Who calls it | What it does |
|----------|-----------|--------------|--------------|
| `reset-account-password/` | 1 | a guide/owner | Resets a **roster** learner/parent's password. Roster-scoped auth (v0.32 pattern), TOTP-gated, writes a `password_resets` audit row. Replaces `scripts/bulk-import.mjs --reset` (moves the service_role key off the shell). |
| `set-my-password/` | 2 | any signed-in user | Sets the caller's **own** password and clears `must_change_password` server-side, so migration v0.40 can lock the flag against client writes. |
| `_shared/reset-common.ts` | - | - | Service client, caller-JWT resolution, CSPRNG temp password, TOTP gate, uniform-denial helpers. |

Paired migrations: `../migrations/2026-08-24-v0.39-password-resets-audit.sql`
(audit table, additive, safe now) and `.../v0.40-lock-must-change-password.sql`
(the trigger lock - apply LAST, see ordering below).

## Owed before deploy (do not skip)

1. **Tutela / TCC security review** of both functions + both migrations.
2. **TOTP decision (spec O3).** `verifyTotpOrThrow` is **fail-closed** - it throws
   until a real factor is wired, so `reset-account-password` cannot run today. Choose
   the mechanism (Supabase MFA factors, or the fleet TOTP posture), wire it, and
   decide where guides enrol (ties to the guide-onboarding item, Cura #1).
3. **Salus + Jake** sign that the child-facing effects (a guide resetting a child's
   credential) are safe and honestly framed.
4. **Captain go.**
5. Open questions O1 (show-once vs deliver-otherwise), O2 (second factor for
   cross-roster owner resets), O4 (rate-limit) - resolve or consciously defer.

## Deploy ordering (LOAD-BEARING - reversing it locks users out)

```
1. Apply v0.39 (audit table)              # additive, safe any time
2. Deploy set-my-password + reset-account-password   # with secrets set (below)
3. Switch the client:
     - forced-change flow -> call set-my-password (replaces the direct
       profiles PATCH at js/backend/supabase-adapter.js:832)
     - admin reset button -> call reset-account-password (replaces the dead
       Supabase stub at js/admin.js)
4. Apply v0.40 (lock must_change_password)   # ONLY after step 3 is live
```

If v0.40 is applied before step 3, first-time users cannot clear the flag and are
stuck on the change-password screen.

## Secrets (function environment only - never in the client)

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`  (the master key; lives here, not in a shell)
- `SUPABASE_ANON_KEY`  (used only to verify the caller's JWT)

## Local check

```
deno check supabase/functions/**/*.ts
```

Type-checks only; a real run needs a Supabase project, the secrets above, and the
TOTP factor wired (step 2). Do not deploy from a local run.
