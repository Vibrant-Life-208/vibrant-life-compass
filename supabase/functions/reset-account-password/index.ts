// Edge Function: reset-account-password  (Phase 2, Component 1)
// STATUS: DRAFT-FOR-TCC. Not deployed. See ../README.md.
//
// A guide (or owner) resets the password of a learner ON THEIR ROSTER (owner: any).
// Replaces scripts/bulk-import.mjs --reset: the service_role key lives here as a
// secret instead of in a shell, the reset is roster-scoped + TOTP-gated + rate-limited,
// and every reset writes a password_resets audit row (fatal if it cannot be written).
//
// Spec: docs/phase2-guide-password-reset-spec.md (Component 1)
// TCC 2026-08-26 (Tutela): applies F3 (constant-work auth), F4 (fatal audit),
// F5 (rate limit), F7 (record roster vs owner path). Owed before deploy: TOTP (O3),
// parent-reset scope decision (F6, currently owner-only), Salus+Jake walk, captain go.

import {
  assertUnderRateLimit,
  callerFromRequest,
  genericDenied,
  insertAuditOrThrow,
  json,
  serviceClient,
  tempPassword,
  verifyTotpOrThrow,
} from "../_shared/reset-common.ts";

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return json({ ok: false, error: "method" }, 405);

  try {
    const caller = await callerFromRequest(req);
    if (!caller) return genericDenied();

    const { subjectId, totp } = await req.json().catch(() => ({}));
    if (!subjectId || typeof subjectId !== "string" || !totp) return genericDenied();

    // Second factor FIRST (fail-closed until O3). Blocks before any account state is touched.
    await verifyTotpOrThrow(caller.id, String(totp));

    const svc = serviceClient();

    // Rate limit before doing work (F5): a compromised session cannot mass-reset a roster.
    await assertUnderRateLimit(svc, caller.id);

    // CONSTANT-WORK AUTHORIZATION (F3): resolve caller role, roster membership, and subject
    // existence with the SAME queries regardless of outcome, then decide on a single boolean
    // at the end. This closes the timing/enumeration oracle (a caller must not be able to tell
    // "off my roster" from "does not exist" by latency). Mirrors the v0.32 roster relation.
    const [callerRes, assignRes, subjectRes] = await Promise.all([
      svc.from("profiles").select("role, is_owner").eq("id", caller.id).maybeSingle(),
      svc.from("guide_learner_assignment").select("learner_id").eq("guide_id", caller.id).eq("learner_id", subjectId).maybeSingle(),
      svc.from("profiles").select("id").eq("id", subjectId).maybeSingle(),
    ]);

    const isGuide = callerRes.data?.role === "guide";
    const isOwner = Boolean(callerRes.data?.is_owner);
    const onRoster = Boolean(assignRes.data);
    const subjectExists = Boolean(subjectRes.data);
    // Record which path authorized this, for oversight (F7). Owner cross-roster is a
    // whole-school capability and should be distinguishable in the audit from a roster reset.
    const via = isGuide && isOwner ? "owner" : "roster";
    const authorized = isGuide && subjectExists && (isOwner || onRoster);
    if (!authorized) return genericDenied();

    // Perform the reset via the Auth admin API, flag the forced change, audit it (fatal).
    const temp = tempPassword();
    const { error: pwErr } = await svc.auth.admin.updateUserById(subjectId, { password: temp });
    if (pwErr) throw pwErr;

    const { error: flagErr } = await svc
      .from("profiles")
      .update({ must_change_password: true })
      .eq("id", subjectId);
    if (flagErr) throw flagErr;

    // Audit is fatal (F4): if it cannot be written, the operation fails loudly.
    await insertAuditOrThrow(svc, {
      actor_id: caller.id,
      subject_id: subjectId,
      action: "reset",
      via,
    });

    // Shown once to the resetting guide (parity with today's model). Never persisted.
    return json({ ok: true, tempPassword: temp });
  } catch (_e) {
    // Uniform failure - do not leak which stage failed.
    return json({ ok: false, error: "reset_failed" }, 400);
  }
});
