// Edge Function: reset-account-password  (Phase 2, Component 1)
// STATUS: DRAFT-FOR-TCC. Not deployed. See ../README.md.
//
// A guide (or owner) resets the password of a learner/parent ON THEIR ROSTER.
// Replaces scripts/bulk-import.mjs --reset: the service_role key lives here as a
// secret instead of in a shell, the reset is roster-scoped + TOTP-gated, and every
// reset writes a password_resets audit row.
//
// Spec: docs/phase2-guide-password-reset-spec.md (Component 1)
// Owed before deploy: Tutela/TCC review, Salus+Jake walk, TOTP wiring (O3), captain go.

import {
  callerIdFromRequest,
  genericDenied,
  json,
  serviceClient,
  tempPassword,
  verifyTotpOrThrow,
} from "../_shared/reset-common.ts";

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return json({ ok: false, error: "method" }, 405);

  try {
    const callerId = await callerIdFromRequest(req);
    if (!callerId) return genericDenied();

    const { subjectId, totp } = await req.json().catch(() => ({}));
    if (!subjectId || typeof subjectId !== "string" || !totp) return genericDenied();

    // Second factor FIRST (fail-closed until O3 is wired). A missing/invalid factor
    // blocks the reset before any account state is touched.
    await verifyTotpOrThrow(callerId, String(totp));

    const svc = serviceClient();

    // Authorize the caller: must be a guide, and either an owner (any account) or a
    // guide whose roster includes the subject. Mirrors the v0.32
    // year_plans_update_by_guide policy (guide_learner_assignment).
    const { data: caller } = await svc
      .from("profiles")
      .select("role, is_owner")
      .eq("id", callerId)
      .maybeSingle();
    if (!caller || caller.role !== "guide") return genericDenied();

    if (!caller.is_owner) {
      const { data: assignment } = await svc
        .from("guide_learner_assignment")
        .select("learner_id")
        .eq("guide_id", callerId)
        .eq("learner_id", subjectId)
        .maybeSingle();
      if (!assignment) return genericDenied();
    }

    // Confirm the subject exists as an auth user. (Kept AFTER auth so an
    // unauthorized caller can never use this to probe existence.)
    const { data: subject } = await svc
      .from("profiles")
      .select("id")
      .eq("id", subjectId)
      .maybeSingle();
    if (!subject) return genericDenied();

    // Perform the reset via the Auth admin API, flag the forced change, audit it.
    const temp = tempPassword();
    const { error: pwErr } = await svc.auth.admin.updateUserById(subjectId, { password: temp });
    if (pwErr) throw pwErr;

    const { error: flagErr } = await svc
      .from("profiles")
      .update({ must_change_password: true })
      .eq("id", subjectId);
    if (flagErr) throw flagErr;

    await svc.from("password_resets").insert({
      actor_id: callerId,
      subject_id: subjectId,
      action: "reset",
    });

    // Shown once to the resetting guide (parity with today's model). Never persisted.
    return json({ ok: true, tempPassword: temp });
  } catch (_e) {
    // Uniform failure - do not leak which stage failed.
    return json({ ok: false, error: "reset_failed" }, 400);
  }
});
