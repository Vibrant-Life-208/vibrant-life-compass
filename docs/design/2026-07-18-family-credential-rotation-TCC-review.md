# Family Credential Rotation - TCC Review Brief + Drafted Fix

**Status:** DRAFT - pending TCC review (Riker + Worf + La'an). **DO NOT SHIP** the migration or
the auth-flow change until the review signs off. This surface writes minors' data.
**Date:** 2026-07-18
**Raised by:** Europa (noticed her test-family login did not prompt a password reset)
**Assessed by:** Riker (Identity & Access), Worf (Privacy Architecture)

---

## The finding

The forced-password-change control is **structurally absent for family logins.**

- `must_change_password` is a column on **`profiles`** (migration v0.9, 2026-06-25): bulk-imported or
  guide-reset accounts get a random temp password and `must_change_password = true`, and the app stops
  them at a "set your own password" screen on first sign-in.
- A **family login has NO `profiles` row** - "its row is in `families`" (`supabase-adapter.js:37`). It
  has an auth user only.
- Therefore the flag **cannot be set on a family**, and the family branch in `auth.js:49-53` returns to
  the member picker before any such check. Individual accounts get forced rotation; family credentials
  cannot.

**Why it matters (Riker):** *access never exceeds consent.* A temp credential that is never forced to
rotate means the issuer (school/admin) holds a working key to that family's data indefinitely, without
the family's ongoing consent.

**Why it matters (Worf):** it is a broken key lifecycle - a temp key never rotated was never truly
handed over. And this credential can **write minors' data**: the v0.11 families migration's own header
says *"the new write policies let a family login write minors' data... Recommend a TCC review."* That
review was never done. This brief is that review coming due.

**Is it biting today?** No auto-temp-password provisioning path for families was found in the code
(unlike profiles), so families may be admin-set. But either way there is **no forced-rotation path** for
a family credential, and the initial password's issuer is never invalidated.

---

## Drafted fix (held behind the review)

### 1. Migration (proposed - do not apply until approved)

```sql
-- DRAFT - pending TCC review (Riker + Worf + La'an). DO NOT APPLY until approved.
-- Forced rotation for family logins. Families have no profiles row, so
-- profiles.must_change_password cannot cover them; add the flag to families so a
-- temp-provisioned family credential can be forced to rotate on first login.
alter table families
  add column if not exists must_change_password boolean not null default false;
```

### 2. Auth-flow change (proposed - described, not yet wired into auth.js)

In the family branch of the sign-in handler (`auth.js:49-53`), before showing the member picker:

```
if (account.role === 'family') {
  const family = await getFamily(account.familyId);
  if (!family) { /* existing error */ }
  if (family.must_change_password) {
    // Adult-held rotation, BEFORE the picker, so no learner path reaches it.
    // Screen copy addresses the parent/guardian: "Set your family's password."
    // On submit: auth.updateUser(new password) -> clear families.must_change_password
    //            -> the temp password no longer works. THEN show the picker.
    showFamilyChangePassword(family, () => showFamilyPicker(family, onSignedIn));
    return;
  }
  showFamilyPicker(family, onSignedIn);
  return;
}
```

- **Adult-gated by construction:** rotation happens at the family-credential layer, before the picker,
  so a learner entering as a member never reaches it. The screen must be framed as the parent's action.
- **Revocation:** setting the new password invalidates the temp (mirrors the profile flow).

---

## Open questions the review must resolve (do NOT ship without answers)

1. **Crypto re-wrap (Worf's domain).** The family password feeds E2E crypto (`verifyPassword`,
   per-member keys). If any key material is derived from or wrapped by the family password, **rotating
   it must re-wrap those keys** or the family loses access to their own encrypted data. This is the
   load-bearing question and the reason this cannot be a quick ship.
2. **Provisioning reality.** How are families actually created today - admin-set password, or a temp?
   Determines whether `must_change_password` should default `true` for provisioned families.
3. **Who holds the credential.** Confirm the family login is owner/parent-operated at setup and design
   the UX so a learner can never complete the rotation screen.
4. **Audit + revocation.** Log the rotation event; confirm the issuer's temp is dead the instant a real
   password is set (zero-trust: the issuer must not retain access).

---

*Route to TCC: Riker + Worf + La'an. This brief and the drafted fix are inert until they sign off.*
*"We evoke - we never extract."*
