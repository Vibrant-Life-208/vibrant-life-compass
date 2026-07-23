-- v0.34 — RETIRE the `logins` table (Compass rebuild, Phase 0 Task A).
-- TCC ruling 2026-07-22 (Worf / Riker / Tutela, ratified by Europa; decision logged 2026-07-22):
-- Compass stores NO third-party credentials. The device/browser password manager is the
-- sovereign home for a credential. The `logins` table holds no usable data — in the Supabase
-- path the client wrote plaintext into a { ct, iv } shape it never populated, so `password_ct`
-- is empty; nothing decryptable was ever stored. This safe-deletes the table and, with it,
-- the parent/guide read grant (`logins_read` used `my_visible_learners`) — Task A3.
--
-- SAFE-DELETE — run in two steps so you SEE the data before it goes.

-- ── Step 1 (verify emptiness FIRST — run this alone, read the result) ───────────
-- Expect: 0 rows, or rows whose password_ct is empty/blank (no usable secret).
--   select count(*)                                             as total_rows,
--          count(*) filter (where coalesce(password_ct,'') <> '') as rows_with_ciphertext
--   from logins;
--
-- Only proceed to Step 2 if rows_with_ciphertext = 0. If it is NOT zero, STOP and
-- bring it back to TCC — a real secret would need learner-consented export first.

-- ── Step 2 (drop — cascades the index, RLS policies, and touch trigger) ─────────
begin;

drop table if exists logins cascade;

commit;

-- VERIFY (expect zero rows — the table is gone):
--   select tablename from pg_tables where schemaname = 'public' and tablename = 'logins';
--
-- ROLLBACK: there is no in-place rollback — the table is dropped. To restore the
-- (empty) structure, re-run the pre-2026-07-22 `logins` DDL from schema.sql history.
-- Per the TCC ruling the correct posture is: do not restore; do not store credentials.
