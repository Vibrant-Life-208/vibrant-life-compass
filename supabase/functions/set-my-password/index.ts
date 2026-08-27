// Edge Function: set-my-password  (Phase 2, Component 2)
// STATUS: DRAFT-FOR-TCC. Not deployed. See ../README.md.
//
// A user sets THEIR OWN password (the forced-change screen on first sign-in, and any
// voluntary change). This moves the flag-clear server-side so we can LOCK
// must_change_password against client writes (migration v0.40) - closing the bypass
// where a user PATCHes the flag off without changing anything.
//
// Spec: docs/phase2-guide-password-reset-spec.md (Component 2)
// TCC 2026-08-26 (Tutela): applies F1 (reauth with current password + revoke other
// sessions - closes session-hijack -> permanent-takeover) and F4 (fatal audit).
// Residual (spec O1): a stolen TEMP password still authenticates reauth here - that is
// the temp-password-delivery exposure, not this function's to close.
// Deploy ordering: v0.40 must not ship until this function (with reauth) is live.

import {
  callerFromRequest,
  insertAuditOrThrow,
  json,
  revokeOtherSessions,
  serviceClient,
  verifyPasswordOrThrow,
} from "../_shared/reset-common.ts";

const MIN_LEN = 8; // minimum only; the app's own policy copy governs real strength guidance.

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return json({ ok: false, error: "method" }, 405);

  try {
    const caller = await callerFromRequest(req);
    if (!caller) return json({ ok: false, error: "not_authorized" }, 403);

    const { currentPassword, newPassword } = await req.json().catch(() => ({}));
    if (!currentPassword || typeof currentPassword !== "string") {
      return json({ ok: false, error: "reauth_required" }, 400);
    }
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < MIN_LEN) {
      return json({ ok: false, error: "weak_password" }, 400);
    }

    // Reauth (F1): the caller must prove they know the CURRENT password. A hijacked
    // session with no password can no longer seize the account by changing it.
    await verifyPasswordOrThrow(caller.email, currentPassword);

    const svc = serviceClient();

    // Set the caller's OWN password, then clear the flag: both run server-side under
    // service_role, so the clear still works after v0.40 locks the column to clients.
    const { error: pwErr } = await svc.auth.admin.updateUserById(caller.id, { password: newPassword });
    if (pwErr) throw pwErr;

    const { error: flagErr } = await svc
      .from("profiles")
      .update({ must_change_password: false })
      .eq("id", caller.id);
    if (flagErr) throw flagErr;

    // Kill any other live sessions so a lurking attacker session dies (F1).
    await revokeOtherSessions(svc, caller.jwt);

    // Audit is fatal (F4).
    await insertAuditOrThrow(svc, {
      actor_id: caller.id,
      subject_id: caller.id,
      action: "self-change",
      via: "self",
    });

    return json({ ok: true });
  } catch (_e) {
    return json({ ok: false, error: "change_failed" }, 400);
  }
});
