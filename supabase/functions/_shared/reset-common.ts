// Shared helpers for the Phase 2 password-reset Edge Functions.
// STATUS: DRAFT-FOR-TCC. Not deployed. See ../README.md.
//
// Spec: docs/phase2-guide-password-reset-spec.md
// TCC review 2026-08-26 (Tutela): CLEARED-WITH-CONDITIONS. This revision applies
// findings F1 (reauth), F2 (verify_jwt config), F3 (constant-work auth ordering),
// F4 (fatal audit), F5 (rate limit), F7 (record reset path).
// Review owed before deploy: TOTP wiring (O3), Salus+Jake walk, captain go.

import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

// Service-role client: bypasses RLS. Its key lives ONLY in the function environment
// as a Supabase secret - never in a browser, never in a terminal. This is the whole
// point of Phase 2: the master key moves off the shell and behind this wall.
export function serviceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY secret");
  return createClient(url, key, { auth: { persistSession: false } });
}

function anonClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) throw new Error("missing SUPABASE_URL / SUPABASE_ANON_KEY secret");
  return createClient(url, anon, { auth: { persistSession: false } });
}

export type Caller = { id: string; email: string | null; jwt: string };

// Resolve the calling user from their bearer JWT. Returns id + email + the raw jwt
// (email/jwt are needed for reauth and other-session revocation, F1). Null on any
// invalid/expired token. NOTE (F2): this is APP-LAYER verification; platform-edge
// verify_jwt must ALSO be on (see ../config.toml) - belt and suspenders.
export async function callerFromRequest(req: Request): Promise<Caller | null> {
  const authz = req.headers.get("Authorization") || "";
  const jwt = authz.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return null;
  const { data, error } = await anonClient().auth.getUser(jwt);
  if (error || !data?.user) return null;
  return { id: data.user.id, email: data.user.email ?? null, jwt };
}

// Reauth (F1): confirm the caller actually knows the CURRENT password before we let
// them set a new one. Closes the session-hijack -> permanent-takeover path (a stolen
// session with no password can no longer change the password). Throws on mismatch.
// Residual (root exposure, spec O1): a stolen TEMP password still authenticates here -
// that is the temp-password-delivery problem, not this function's to close.
export async function verifyPasswordOrThrow(email: string | null, password: string): Promise<void> {
  if (!email) throw new Error("no email to reauth against");
  const { error } = await anonClient().auth.signInWithPassword({ email, password });
  if (error) throw new Error("reauth_failed");
}

// Revoke the caller's OTHER sessions after a password change (F1) so a lurking
// attacker session dies. Best-effort: never let a revocation hiccup fail the change.
export async function revokeOtherSessions(svc: SupabaseClient, jwt: string): Promise<void> {
  try { await svc.auth.admin.signOut(jwt, "others"); } catch (_e) { /* best-effort */ }
}

// Fatal audit (F4): an audit you can silently skip is not an audit. The insert error
// is checked and THROWN, so a reset that cannot be recorded fails loudly instead of
// leaving a changed credential with no trace (the exact gap v0.39 exists to close).
export async function insertAuditOrThrow(
  svc: SupabaseClient,
  row: { actor_id: string; subject_id: string; action: "reset" | "self-change"; via?: string | null },
): Promise<void> {
  const { error } = await svc.from("password_resets").insert(row);
  if (error) throw new Error("audit_write_failed");
}

// Rate limit (F5): cap resets per actor over a window, backed by the existing
// password_resets(actor_id, created_at desc) index. Blunts a compromised/malicious
// guide session mass-resetting a roster of minors. Throws when the cap is exceeded.
export async function assertUnderRateLimit(
  svc: SupabaseClient,
  actorId: string,
  max = 10,
  windowMin = 10,
): Promise<void> {
  const since = new Date(Date.now() - windowMin * 60_000).toISOString();
  const { count, error } = await svc
    .from("password_resets")
    .select("id", { count: "exact", head: true })
    .eq("actor_id", actorId)
    .gte("created_at", since);
  if (error) throw new Error("rate_check_failed");
  if ((count ?? 0) >= max) throw new Error("rate_limited");
}

// Readable-but-random 12-char temp password. Mirrors scripts/bulk-import.mjs
// tempPassword() exactly, for parity with the path this replaces (CSPRNG-backed).
export function tempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let s = "";
  for (let i = 0; i < 12; i += 1) s += chars[bytes[i] % chars.length];
  return s;
}

// TOTP second factor. FAIL-CLOSED: throws until the TOTP enrollment/verification
// mechanism is chosen (spec O3) and wired here. The reset surface is only safe to
// expose in-app BECAUSE it is 2FA-gated, so an un-wired factor must block, never wave through.
// TODO(O3): integrate the chosen guide TOTP verification; verify `code` against the
// caller's enrolled factor; return only on a valid, unused code.
export async function verifyTotpOrThrow(_callerId: string, _code: string): Promise<void> {
  throw new Error("TOTP verification not wired (spec O3) - reset blocked fail-closed");
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Uniform, non-committal failure - same shape for every auth/lookup failure so the
// surface does not reveal whether a given account exists (F3, non-enumerating).
export function genericDenied(): Response {
  return json({ ok: false, error: "not_authorized" }, 403);
}
