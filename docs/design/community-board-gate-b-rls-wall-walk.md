# Gate B - Tutela's RLS Wall-Walk (Community Board)

**Owner:** Tutela / TCC. **Prereq:** Gate A cleared (migrations v0.39/40/41 applied - done 2026-09-15).
**Principle (Tutela):** *code configured is not code confirmed - walk the wall in the running system.*

This script walks the actual RLS perimeter of `community_posts` and `community_post_reports` as real
authenticated identities. It has two lanes:

- **Lane 1 - SQL impersonation probes** (the rigorous perimeter test): in the Supabase SQL Editor,
  impersonate each user by setting the JWT claim, then run the query. RLS reads `auth.uid()` from the
  claim, so this tests the real policies without the app. Every probe has a PASS condition.
- **Lane 2 - App UI walk**: log into the running app (`?commboard=on`) as each role and confirm the
  app surfaces match the perimeter. Catches app-path mistakes the DB probe can't see.

Each probe is non-mutating: wrapped in `begin; ... rollback;` so nothing persists (insert tests
confirm allow/deny by whether an RLS error is raised, then roll back).

---

## Preconditions - gather these UUIDs (from real accounts)

You need identities spanning the boundaries the policies draw:

- `LEARNER_A` - a learner
- `GUIDE_A` - **LEARNER_A's** guide (there is a row in `guide_learner_assignment` with
  `guide_id = GUIDE_A, learner_id = LEARNER_A`)
- `LEARNER_B` - a learner on a **different** guide than GUIDE_A
- `GUIDE_B` - LEARNER_B's guide (NOT LEARNER_A's guide)
- `OWNER` - a profile with `is_owner = true`

Find them (run as the SQL Editor's default/service role):

```sql
-- Owner(s):
select id, name from profiles where is_owner = true;
-- Guide -> learner assignments (pick two learners on different guides):
select guide_id, learner_id from guide_learner_assignment order by guide_id limit 20;
-- Learner names to confirm you picked the right two:
select id, name from profiles where id in ('<LEARNER_A>','<LEARNER_B>');
```

Fill the UUIDs into the probes below (replace every `<LEARNER_A>` etc.).

### Impersonation template

```sql
begin;
  set local role authenticated;
  set local request.jwt.claims to '{"sub":"<UUID>"}';   -- auth.uid() = this sub
  -- <your query here>
rollback;
```

*(If your project rejects `request.jwt.claims`, the older form is
`set local "request.jwt.claim.sub" to '<UUID>';` - use whichever your instance honors, then re-run
the probes.)*

---

## Step 0 - Seed test posts (as service role, keep for the walk, clean up in Step Z)

```sql
-- Run as the default SQL Editor role (bypasses RLS) to create known rows.
insert into community_posts (id, learner_id, body, status, title) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '<LEARNER_A>', 'A posted idea',  'posted',        'A-POSTED'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '<LEARNER_A>', 'A pending idea', 'pending_owner', 'A-PENDING'),
  ('bbbbbbbb-0000-0000-0000-000000000003', '<LEARNER_B>', 'B pending idea', 'pending_guide', 'B-PENDING'),
  ('bbbbbbbb-0000-0000-0000-000000000004', '<LEARNER_B>', 'B posted idea',  'posted',        'B-POSTED');
```

Post-id shorthand used below: **A-POSTED**, **A-PENDING**, **B-PENDING**, **B-POSTED**.

---

## Lane 1 - RLS probes (community_posts)

**B1. Learner self-read + posted board (PASS: sees own any-status + all posted; NOT others' non-posted).**
```sql
begin; set local role authenticated; set local request.jwt.claims to '{"sub":"<LEARNER_A>"}';
  select title, status from community_posts order by title;
rollback;
```
PASS = rows are exactly {A-POSTED, A-PENDING, B-POSTED}. **B-PENDING must NOT appear.**

**B2. Learner cross-read NEGATIVE (PASS: 0 rows).**
```sql
begin; set local role authenticated; set local request.jwt.claims to '{"sub":"<LEARNER_A>"}';
  select count(*) from community_posts where id = 'bbbbbbbb-0000-0000-0000-000000000003'; -- B-PENDING
rollback;
```
PASS = `count = 0` (a learner cannot read another learner's pending/removed post).

**B3. Interim exposure (PASS: pending post visible to owner-of-post + their guide + OWNER only).**
```sql
-- guide of A sees A-PENDING (roster):
begin; set local role authenticated; set local request.jwt.claims to '{"sub":"<GUIDE_A>"}';
  select count(*) from community_posts where id = 'aaaaaaaa-0000-0000-0000-000000000002'; rollback;   -- expect 1
-- guide of B does NOT see A-PENDING:
begin; set local role authenticated; set local request.jwt.claims to '{"sub":"<GUIDE_B>"}';
  select count(*) from community_posts where id = 'aaaaaaaa-0000-0000-0000-000000000002'; rollback;   -- expect 0
-- owner sees A-PENDING:
begin; set local role authenticated; set local request.jwt.claims to '{"sub":"<OWNER>"}';
  select count(*) from community_posts where id = 'aaaaaaaa-0000-0000-0000-000000000002'; rollback;   -- expect 1
```
PASS = 1 / 0 / 1 respectively.

**B4. Learner insert own only (PASS: own OK, forged learner_id BLOCKED).**
```sql
-- own: should succeed (no RLS error), then roll back:
begin; set local role authenticated; set local request.jwt.claims to '{"sub":"<LEARNER_A>"}';
  insert into community_posts (learner_id, body) values ('<LEARNER_A>', 'probe own'); rollback;
-- forged: should FAIL with "new row violates row-level security policy":
begin; set local role authenticated; set local request.jwt.claims to '{"sub":"<LEARNER_A>"}';
  insert into community_posts (learner_id, body) values ('<LEARNER_B>', 'probe forged'); rollback;
```
PASS = first succeeds, second raises an RLS violation.

**B5. Learner cannot update another's post (PASS: 0 rows updated).**
```sql
begin; set local role authenticated; set local request.jwt.claims to '{"sub":"<LEARNER_A>"}';
  with u as (update community_posts set status='removed' where id='bbbbbbbb-0000-0000-0000-000000000003' returning 1)
  select count(*) from u; rollback;
```
PASS = `count = 0` (no policy lets a learner write another learner's row; RLS filters it to zero).

**B6. Guide update scope (PASS: roster yes, non-roster no).**
```sql
-- GUIDE_A updates A-PENDING (roster) -> 1:
begin; set local role authenticated; set local request.jwt.claims to '{"sub":"<GUIDE_A>"}';
  with u as (update community_posts set guide_note='probe' where id='aaaaaaaa-0000-0000-0000-000000000002' returning 1)
  select count(*) from u; rollback;
-- GUIDE_A updates B-PENDING (not roster) -> 0:
begin; set local role authenticated; set local request.jwt.claims to '{"sub":"<GUIDE_A>"}';
  with u as (update community_posts set guide_note='probe' where id='bbbbbbbb-0000-0000-0000-000000000003' returning 1)
  select count(*) from u; rollback;
```
PASS = 1 then 0.

---

## Lane 1 - RLS probes (community_post_reports)

**B7. Learner reports a POSTED post as self (PASS: succeeds).**
```sql
begin; set local role authenticated; set local request.jwt.claims to '{"sub":"<LEARNER_B>"}';
  insert into community_post_reports (post_id, reason) values ('aaaaaaaa-0000-0000-0000-000000000001','probe'); -- A-POSTED
rollback;
```
PASS = insert succeeds (reporter_id defaults to auth.uid(); target is posted).

**B8. Learner cannot report a NON-posted post (PASS: BLOCKED).**
```sql
begin; set local role authenticated; set local request.jwt.claims to '{"sub":"<LEARNER_B>"}';
  insert into community_post_reports (post_id, reason) values ('aaaaaaaa-0000-0000-0000-000000000002','probe'); -- A-PENDING
rollback;
```
PASS = raises an RLS violation (the `cp.status = 'posted'` check fails).

**B9. Learner cannot forge reporter_id (PASS: BLOCKED).**
```sql
begin; set local role authenticated; set local request.jwt.claims to '{"sub":"<LEARNER_B>"}';
  insert into community_post_reports (post_id, reporter_id, reason)
  values ('aaaaaaaa-0000-0000-0000-000000000001','<LEARNER_A>','forged'); -- claims A reported it
rollback;
```
PASS = raises an RLS violation (`reporter_id = auth.uid()` fails).

**B10. Learner cannot READ reports (PASS: 0 rows).**
First, as service role, ensure at least one real report row exists on A-POSTED:
```sql
insert into community_post_reports (post_id, reporter_id, reason)
  values ('aaaaaaaa-0000-0000-0000-000000000001','<LEARNER_B>','seed-report');
```
Then:
```sql
begin; set local role authenticated; set local request.jwt.claims to '{"sub":"<LEARNER_B>"}';
  select count(*) from community_post_reports; rollback;   -- even the reporter cannot read reports back
begin; set local role authenticated; set local request.jwt.claims to '{"sub":"<LEARNER_A>"}';
  select count(*) from community_post_reports; rollback;
```
PASS = `count = 0` for both learners.

**B11. Guide reads only roster reports (PASS: roster yes, other no).**
```sql
-- GUIDE_A: A-POSTED is on A's roster -> sees the report:
begin; set local role authenticated; set local request.jwt.claims to '{"sub":"<GUIDE_A>"}';
  select count(*) from community_post_reports
  where post_id = 'aaaaaaaa-0000-0000-0000-000000000001'; rollback;   -- expect >= 1
-- GUIDE_B: A-POSTED is NOT on B's roster -> sees nothing:
begin; set local role authenticated; set local request.jwt.claims to '{"sub":"<GUIDE_B>"}';
  select count(*) from community_post_reports
  where post_id = 'aaaaaaaa-0000-0000-0000-000000000001'; rollback;   -- expect 0
```
PASS = >=1 then 0.

**B12. Owner reads all reports (PASS: sees the seeded report).**
```sql
begin; set local role authenticated; set local request.jwt.claims to '{"sub":"<OWNER>"}';
  select count(*) from community_post_reports; rollback;   -- expect >= 1
```

**B13. Only owner may delete (dismiss) a report (PASS: learner 0, owner deletes).**
```sql
-- learner delete -> 0 rows:
begin; set local role authenticated; set local request.jwt.claims to '{"sub":"<LEARNER_B>"}';
  with d as (delete from community_post_reports where post_id='aaaaaaaa-0000-0000-0000-000000000001' returning 1)
  select count(*) from d; rollback;
-- owner delete -> >=1 rows (rolled back):
begin; set local role authenticated; set local request.jwt.claims to '{"sub":"<OWNER>"}';
  with d as (delete from community_post_reports where post_id='aaaaaaaa-0000-0000-0000-000000000001' returning 1)
  select count(*) from d; rollback;
```
PASS = 0 for learner, >=1 for owner.

**B14. Reporting never changes the post (PASS: status still 'posted').**
```sql
select status from community_posts where id='aaaaaaaa-0000-0000-0000-000000000001'; -- expect 'posted'
```

---

## Lane 2 - App UI walk (`?commboard=on`, running app)

Log in as each real role and confirm the app matches the perimeter:

- [ ] **Learner A**: sees the posted board + own ideas (any status) under "Your ideas"; does NOT see
      B's pending idea anywhere; can submit an idea; can tap "Something wrong? Tell a guide" on a
      posted note and gets "Thank you - a guide will take a look"; sees NO one else's reports.
- [ ] **Learner B**: same, from B's side; confirm B cannot see A's pending idea.
- [ ] **Guide A**: review queue shows only A-roster submissions; the guidance note + PII flag appear;
      cannot see B-roster items.
- [ ] **Owner**: "Waiting on you" + "On the board"; a reported posted note floats up with "someone
      flagged this (n)" + reasons; "Take down" removes it from the board; the taken-down learner then
      sees the non-shaming "not a mark against you" + "Revise & share again".
- [ ] Confirm a taken-down note leaves the public board for every other learner.

---

## Step Z - Cleanup (as service role)

```sql
delete from community_post_reports where post_id in
  ('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000002',
   'bbbbbbbb-0000-0000-0000-000000000003','bbbbbbbb-0000-0000-0000-000000000004');
delete from community_posts where id in
  ('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000002',
   'bbbbbbbb-0000-0000-0000-000000000003','bbbbbbbb-0000-0000-0000-000000000004');
```

---

## Results - executed 2026-09-15 (auto-discovery DO-block, JWT impersonation)

The walk was run as a single auto-discovering DO block against the live Supabase. Test DB was sparse:
one guide (Erin S.), one genuine non-owner learner (Test Adventure); the only other "learner" row was
the owner's own profile.

- **PASS (identities present):** B1a, B2, B3a, B3c, B4a, B4b, B5, B6a, B7, B8, B9, B10, B11a, B12, B14.
- **B10 note:** first run showed a false FAIL because the auto-picked "second learner" resolved to the
  owner's profile (owners legitimately read reports); re-verified PASS impersonating Test Adventure, a
  real non-owner learner.
- **SKIP / deferred (needs a second guide):** B3b, B6b, B11b - guide-roster isolation across two
  different guides could not be walked with one guide in the data.
- **Delete perimeter added 2026-09-15 (v0.42, `cp_delete_own`, Gate H learner-delete):** D1 learner
  deletes OWN = PASS, D2 learner cannot delete ANOTHER's = PASS. The self-delete is scoped to own rows.

## Sign-off

- [x] Lane 1 probes PASS for all identities present (see Results).
- [ ] Lane 2 UI checks (do during Jake+Salus walk, Gate F).
- [x] **Tutela SIGNED the perimeter** 2026-09-15 (decision log + memory), **with one condition of
      lift:** two-guide roster isolation (B3b/B6b/B11b) must be walked before lift - seed a second
      guide + assignment and re-run, or walk on the real school roster. Also carry the
      child-publication-consent counsel question (Gate D) - RLS being correct does not answer whether a
      minor may publish at all.

*The perimeter is signed when the wall is walked, not when it is written. Tutela signed where she
walked; the one unwalked segment is a named condition, not hidden.*
