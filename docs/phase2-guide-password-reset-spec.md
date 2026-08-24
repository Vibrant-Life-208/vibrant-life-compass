# Phase 2: Server-side Guide Password Reset + Forced-Change Hardening

**Status:** SPEC (not built) - Date: 2026-08-23
**Author:** Lux (Evoke child of Geordi), from the 2026-08-23 5-agent guide-account review
**Reviewers owed before build:** Tutela / TCC (security), Salus + Jake (child-safety walk), captain go
**Supersedes the placeholder note in:** `ARCHITECTURE.md` (Phase 2 auth) and `js/admin.js:26-32`

---

## Why this exists (the two wounds it closes)

Password-reset logic currently lives in the wrong places, and it produces two defects that are actually one root cause:

1. **Admin reset runs through a master key in a shell.** On the Supabase backend the only working reset is `scripts/bulk-import.mjs --reset <hero>`, which prompts for and holds the **service_role key** (bypasses all RLS) in a terminal for a routine helpdesk task. It has no app-layer audit, no roster scoping, and no availability for a guide mid-session. The in-app reset button is a dead stub on Supabase (`js/admin.js:26-32`).

2. **The forced-change gate is client-side-only and bypassable.** `profiles.must_change_password` is deliberately *not* in the identity-protection trigger's locked set (`2026-06-29-v0.14...sql:22-38`; rationale `2026-06-28-v0.11...sql:130`). The legit clear path is two uncoupled client ops under the user's own session (`js/backend/supabase-adapter.js:828-832`): `auth.updateUser({password})` then a separate `profiles` PATCH of `must_change_password=false`, allowed by `profiles_self` RLS. A user holding an admin-issued temp password can issue the second PATCH alone (devtools/curl) to clear the gate while the temp password keeps working. The "set your own password" screen (`js/app.js:188`) is the only thing enforcing rotation.

**Root cause (both):** reset and self-change live client-side / in a terminal instead of behind a server function. Fixing them separately is impossible - locking `must_change_password` in the trigger would break the legitimate client clear path unless the self-change *also* moves server-side. So this spec covers **both halves**.

**Severity framing.** The bypass (defect 2) is LOW in isolation - `profiles_self` RLS is self-only, so a user can only clear their *own* flag; no escalation, and it needs REST/devtools knowledge. It matters because it compounds with the child-safety finding (Salus): guides have flat admin and can view plaintext temp passwords, so a temp password every staff member has seen is not *guaranteed* to rotate. In a school of minors, forced rotation must be enforced, not advised.

---

## Architecture: why an Edge Function, not a Postgres definer function

The three existing privileged operations (`anchor_aggregates`, `studio_practice_pulse`, `guide_name_for_studio`) are Postgres `SECURITY DEFINER` functions because they only ever **read** and aggregate. A password reset must **set another user's auth credential**, which lives in `auth.users.encrypted_password` and is owned by Supabase Auth (with its own hooks). A Postgres function cannot call the Supabase Auth admin API, and poking `auth.users` directly bypasses Auth's own logic. Therefore:

- **The admin reset (guide -> learner) is a Supabase Edge Function** (Deno) holding `service_role` as a platform **secret** (never in a browser, never in a terminal). It calls `supabase.auth.admin.updateUserById()`.
- **The authorization check** inside that function reuses the existing roster model - `guide_learner_assignment` (the v0.32 pattern) plus the owner exception - so a guide can reset only a learner/parent on their roster.
- **The self-service change (user -> own password)** is a second, simpler Edge Function so the flag-clear becomes atomic and server-controlled, letting us lock the column.

---

## Component 1 - `reset-account-password` Edge Function (guide -> learner/parent)

**Trigger:** a guide taps "Reset password" on a roster account in the admin panel.

**Inputs:** target account id (or hero name), the caller's JWT (guide session), a TOTP code from the caller.

**Steps (all server-side):**

1. **Authenticate the caller.** Verify the JWT; extract `auth.uid()` as `caller_id`. Reject anon.
2. **Verify the caller's TOTP factor.** The reset is only exposed in-app *because* it is second-factor gated. Reject if the factor is missing or the code is invalid. (TOTP infra is a fleet posture already; enroll guides at onboarding - see open question O3.)
3. **Authorize by roster scope.** The caller must be a guide who tends the target:
   ```
   caller is role='guide' AND (
     is_owner = true
     OR target_learner_id IN (select learner_id from guide_learner_assignment where guide_id = caller_id)
   )
   ```
   Mirror the v0.32 `year_plans_update_by_guide` policy exactly. A guide must not reset an account outside their roster; an owner may reset any (flat-staff decision 2026-06-30, but now *scoped and logged*, per Salus).
4. **Constant-time / non-enumerating.** Same response shape and timing whether or not the hero name exists, so the surface can't be used to probe which accounts exist.
5. **Generate a temp password** (same generator the bulk import uses, for parity).
6. **Set it via the Auth admin API:** `admin.updateUserById(target_auth_id, { password: temp })`.
7. **Flag the target:** `update profiles set must_change_password = true where id = target`.
8. **Write an audit row** (Component 3) - `{actor: caller_id, subject: target, action:'reset', at: now()}`, no secret stored.
9. **Return the temp password ONCE** to the caller UI (matches today's "shown once" model). Do not persist it plaintext anywhere.

**What this closes:** the service_role key never leaves the server; resets are roster-scoped, second-factor gated, auditable, and available to any authorized guide in-app (no terminal, no bus-factor on the key-holder).

---

## Component 2 - `set-my-password` Edge Function (user -> own) + trigger lock

**Trigger:** the forced-change screen on first sign-in (`js/app.js:188`), and any voluntary self-change.

**Steps (server-side):**

1. Authenticate the caller's JWT (`caller_id = auth.uid()`).
2. Set the new password on the caller's own auth user (`admin.updateUserById(caller_id, {password})`, or `auth.updateUser` if run in the caller's context - either works since it is self).
3. **Atomically clear the flag** in the same function: `update profiles set must_change_password = false where id = caller_id`. Because this runs server-side (service_role or definer), it succeeds even after the column is locked to clients (step 4).
4. **Lock the column.** Add `must_change_password` to the identity-protection trigger's guarded set so a **non-service** write that changes it raises:
   ```sql
   -- extend protect_profile_identity_columns() (currently v0.14)
   or new.must_change_password is distinct from old.must_change_password
   ```
   After this, the client can no longer PATCH the flag directly; the only way to clear it is through `set-my-password`, which requires actually setting a new password first. The bypass is closed.

**Migration note:** this is a new migration (call it v0.39+) that (a) re-defines the trigger function to include `must_change_password`, and (b) is applied only *after* both Edge Functions are deployed - otherwise the current client clear path (`supabase-adapter.js:832`) breaks and first-time users get stuck on the change screen. **Ordering is load-bearing: deploy functions -> switch client to call them -> then apply the trigger-lock migration.**

---

## Component 3 - `password_resets` audit table

```sql
create table password_resets (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid not null references profiles(id),   -- who performed it
  subject_id  uuid not null references profiles(id),   -- whose password
  action      text not null check (action in ('reset','self-change')),
  created_at  timestamptz not null default now()
  -- NO secret, NO temp password stored, ever
);
alter table password_resets enable row level security;
-- readable by owners (audit oversight) and by the subject (their own history);
-- writable ONLY by the Edge Functions (service_role). No client insert path.
create policy "password_resets_read" on password_resets for select
  using (
    subject_id = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role='guide' and is_owner = true)
  );
```

Closes Salus's "no trace" finding: every credential change on a minor's account is answerable in-app - who, whom, when.

---

## Verification checklist (run against a live project, paste output into a verification log)

- [ ] As guide A's JWT, call `reset-account-password` for a learner NOT on A's roster -> rejected.
- [ ] As guide A with a wrong/missing TOTP code -> rejected.
- [ ] As guide A for a roster learner with valid TOTP -> temp issued, `must_change_password=true` set, audit row written.
- [ ] Probe a non-existent hero name -> same response shape and timing as a real one (non-enumerating).
- [ ] After the v0.39 trigger-lock migration: as any user JWT, `update profiles set must_change_password=false where id=auth.uid()` -> **raises** (the bypass is closed).
- [ ] First-time user runs `set-my-password` -> new password works, temp password no longer works, flag cleared, audit row `self-change`.
- [ ] `password_resets` insert attempted from a client JWT -> rejected (functions-only write).
- [ ] Owner can read `password_resets`; a non-owner guide cannot read another subject's rows.

---

## Open questions for the build session

- **O1.** Should the temp password still be *shown once* to the resetting guide, or delivered to the account holder another way? Showing-once keeps parity but re-introduces a plaintext-on-screen moment (Salus's temp-password finding). Consider mask/reveal-on-hold.
- **O2.** Owner-resets-anyone: keep the flat-staff exception, but do we want a *second* owner factor for cross-roster resets, given owners can reach every child?
- **O3.** TOTP enrollment: guides must enroll a factor before the reset surface is usable. Where in guide onboarding does that land? (Ties to the guide-onboarding item from the same review - Cura #1.)
- **O4.** Rate-limit `reset-account-password` per caller to blunt abuse of legitimate access (a guide mass-resetting a roster). Threshold + alert to owner.

---

*Cross-refs: the 2026-08-23 guide-account review (Cura/Lux/Accord/Salus/Pervius); the decision log entry of the same date (Lux); `SECURITY.md` Phase 2 section; Naomi's standing condition that any migration touching guide surfaces returns to the privacy panel.*
