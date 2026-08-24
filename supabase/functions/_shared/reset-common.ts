// Shared helpers for the Phase 2 password-reset Edge Functions.
// STATUS: DRAFT-FOR-TCC. Not deployed. See ../README.md.
//
// Spec: docs/phase2-guide-password-reset-spec.md
// Review owed before deploy: Tutela/TCC, Salus+Jake walk, TOTP decision (O3), captain go.

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

// Resolve the calling user from their bearer JWT. Returns the auth user id, or null.
export async function callerIdFromRequest(req: Request): Promise<string | null> {
  const authz = req.headers.get("Authorization") || "";
  const jwt = authz.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return null;
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) throw new Error("missing SUPABASE_URL / SUPABASE_ANON_KEY secret");
  const client = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await client.auth.getUser(jwt);
  if (error || !data?.user) return null;
  return data.user.id;
}

// Readable-but-random 12-char temp password. Mirrors scripts/bulk-import.mjs
// tempPassword() exactly, for parity with the path this replaces.
export function tempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes); // CSPRNG - stronger than the script's Math.random()
  let s = "";
  for (let i = 0; i < 12; i += 1) s += chars[bytes[i] % chars.length];
  return s;
}

// TOTP second factor. FAIL-CLOSED: throws until the TOTP enrollment/verification
// mechanism is chosen (spec open question O3) and wired here. This is deliberate -
// the reset surface is only safe to expose in-app BECAUSE it is 2FA-gated, so an
// un-wired factor must block the reset, never wave it through.
//
// TODO(O3): integrate the chosen guide TOTP verification (Supabase MFA factors, or
// the fleet TOTP posture referenced in js/crypto.js). Verify `code` against the
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

// Uniform, non-committal failure. Used for every auth/lookup failure so the surface
// does not reveal whether a given account exists (spec: non-enumerating). Callers
// should also avoid early-returning on "not found" before doing the same work an
// authorized path does, so timing does not leak existence either.
export function genericDenied(): Response {
  return json({ ok: false, error: "not_authorized" }, 403);
}
