// Edge Function: set-my-password  (Phase 2, Component 2)
// STATUS: DRAFT-FOR-TCC. Not deployed. See ../README.md.
//
// A user sets THEIR OWN password (the forced-change screen on first sign-in, and any
// voluntary change). This moves the flag-clear server-side so we can LOCK
// must_change_password against client writes (migration v0.40) - closing the bypass
// where a user with a temp password PATCHes the flag off without changing anything.
//
// Spec: docs/phase2-guide-password-reset-spec.md (Component 2)
// Owed before deploy: Tutela/TCC review, then the v0.40 trigger-lock migration
// (apply AFTER this deploys - see README deploy ordering).

import { callerIdFromRequest, json, serviceClient } from "../_shared/reset-common.ts";

// Minimum only; the app's own policy copy governs the real strength guidance.
const MIN_LEN = 8;

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return json({ ok: false, error: "method" }, 405);

  try {
    const callerId = await callerIdFromRequest(req);
    if (!callerId) return json({ ok: false, error: "not_authorized" }, 403);

    const { newPassword } = await req.json().catch(() => ({}));
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < MIN_LEN) {
      return json({ ok: false, error: "weak_password" }, 400);
    }

    const svc = serviceClient();

    // Set the caller's OWN password, then clear the flag ATOMICALLY-in-effect: both
    // run server-side under service_role, so the clear still works after v0.40 locks
    // the column to clients. A client can no longer clear the flag without actually
    // setting a new password here first.
    const { error: pwErr } = await svc.auth.admin.updateUserById(callerId, { password: newPassword });
    if (pwErr) throw pwErr;

    const { error: flagErr } = await svc
      .from("profiles")
      .update({ must_change_password: false })
      .eq("id", callerId);
    if (flagErr) throw flagErr;

    await svc.from("password_resets").insert({
      actor_id: callerId,
      subject_id: callerId,
      action: "self-change",
    });

    return json({ ok: true });
  } catch (_e) {
    return json({ ok: false, error: "change_failed" }, 400);
  }
});
