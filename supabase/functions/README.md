# Edge Functions - Phase 2 guide password reset (DRAFT-FOR-TCC)

**Status: NOT DEPLOYED.** These are reviewable scaffolds from the 2026-08-23
5-agent guide-account review. They must not ship until the owed-list clears.
Full design: `../../docs/phase2-guide-password-reset-spec.md`.

## What's here

| Function | Component | Who calls it | What it does |
|----------|-----------|--------------|--------------|
| `reset-account-password/` | 1 | a guide (roster) / owner (any) | Resets a roster **learner's** password. Constant-work roster-scoped auth (v0.32 pattern), TOTP-gated, rate-limited, writes a fatal `password_resets` audit row recording the path (roster vs owner). Replaces `scripts/bulk-import.mjs --reset` (moves the service_role key off the shell). **Parents: owner-only** (F6 - guides reset learners only; the roster relation has no parent edge). |
| `set-my-password/` | 2 | any signed-in user | Reauth (verify current password) then sets the caller's **own** password, revokes other sessions, clears `must_change_password` server-side, writes a fatal audit row. Lets migration v0.40 lock the flag against client writes. |
| `_shared/reset-common.ts` | - | - | Service client, caller resolution (id+email+jwt), reauth, other-session revocation, fatal audit, rate limit, CSPRNG temp password, fail-closed TOTP gate, uniform-denial helpers. |

Paired migrations: `../migrations/2026-08-24-v0.39-password-resets-audit.sql`
(audit table + `via` path column, additive, safe now) and
`.../v0.40-lock-must-change-password.sql` (the trigger lock - apply LAST, see ordering).
Config: `../config.toml` pins `verify_jwt = true` for both functions (F2).

## TCC review status (Tutela, 2026-08-26): CLEARED-WITH-CONDITIONS

Applied in this branch: **F1** (reauth + other-session revocation on self-change),
**F2** (explicit `verify_jwt` config), **F3** (constant-work authorization ordering -
no timing/enumeration oracle), **F4** (fatal audit - a skippable audit is not an audit),
**F5** (per-actor rate limit, backed by the `password_resets` actor index),
**F7** (audit records roster vs owner path).

## Owed before the deploy gate clears (do not skip)

1. **TOTP wiring (spec O3).** `verifyTotpOrThrow` is **fail-closed** - it throws until a
   real factor is wired, so `reset-account-password` cannot run today. Choose the
   mechanism (Supabase MFA factors, or the fleet TOTP posture), wire it, and decide
   where guides enrol (ties to the guide-onboarding item, Cura #1). Test fail-closed in practice.
2. **F1 residual (spec O1):** a stolen *temp* password still passes reauth - that is the
   temp-password-delivery exposure. Reform delivery (deliver to the account holder, not
   shown to every staff member) or shorten the temp-password window. v0.40 must not ship
   until the reauth in `set-my-password` is confirmed live.
3. **F2 residual:** document the JWT lifetime and confirm de-provisioning a guide (role
   flip) revokes reset power promptly.
4. **O2 (F7 follow-on):** decide whether owner cross-roster reset needs a second factor
   beyond the shared TOTP. The audit now records the path; the factor decision is open.
5. **Salus + Jake** sign that the child-facing effects are safe and honestly framed.
6. **Captain go.**
7. **Deploy hygiene (F8):** retire `scripts/bulk-import.mjs --reset` the moment these
   ship (the master key must not live in two places); no temp password or key in logs.

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
