# Discovery Enrollment - Status & Handoff

**Last updated:** 2026-09-14  ·  **Status: ENROLLMENT COMPLETE (22/22 in Discovery)**
**Origin:** Discovery-launch enrollment check-in against a 22-learner roster.
**Canonical roster:** `scripts/families.roster.csv` (gitignored - holds real names).

---

## The key finding: the school runs on the family-login model

A read-only backend audit (`node scripts/bulk-import.mjs --whois vibrantlife`) showed the
school is **already provisioned as family logins** - one shared login per family, with
**both parents AND the kids as members**. It is NOT individual per-person logins.

This overtook an earlier (blind) plan to enroll "learners-only, defer parents, individual
logins." That plan was discarded: deferring parents for a handful of new families would
make them inconsistent with the ~20 families already deployed with both parents. **We match
the deployed model.**

The stale individual-login file (`scripts/accounts.csv`) and its old decision doc were
removed so nobody runs the wrong path by mistake.

---

## Roster reconciliation (22 Discovery learners) - DONE

- **14 already enrolled** as family members - studio confirmed `discovery` for all 14 via
  `scripts/studio-check.sh` (2026-09-14). No fixes needed.
- **8 created** on 2026-09-14 from `scripts/families.roster.csv`: 6 new family logins +
  members (`--families`), then short learner logins via `--relink-learners --execute`. All 8
  landed in `studio=discovery` with their own login + family membership. 0 unexpected deletes.
- **Credentials** (6 family logins + 8 learner logins) were printed once at run time and are
  held by the captain - NOT stored here.

---

## The path used to enroll the 8 (matches how existing kids exist) - EXECUTED 2026-09-14

Run on-machine, with the `service_role` key (the DB is not reachable from the agent sandbox):

```
cd ~/Code/vibrant-life-compass
node scripts/bulk-import.mjs --families scripts/families.roster.csv            # 6 family logins + members
node scripts/bulk-import.mjs --relink-learners scripts/families.roster.csv --execute   # give the 8 kids short logins, keep family membership
```

- Step 1 printed **6 family logins** to hand out (one per family).
- Step 2 gave each of the 8 kids their own short login (`indy-w`, etc.) while staying a
  family member - the exact end-state the 14 existing kids are already in.

To re-run or add more families later, edit `scripts/families.roster.csv` and repeat.

---

## Open items

1. **Abram Arnott (`abram-a`) reconciliation.** The studio-check turned up a real Discovery
   learner NOT on the pasted 22-roster - Abram, a sibling of Lainy Arnott (both in Discovery;
   third sibling Archie in Adventure). Captain to confirm whether the cohort is actually 23,
   or Abram is intentionally excluded. He already exists and is correctly in Discovery, so
   enrollment was unaffected either way. (Studio check on the 14: DONE - all in Discovery.)
2. **Split households.** A shared family login means both parents see the same thing. The
   whole school already runs this way; flag any of the 6 new families that are split-custody
   if a shared login is friction for them specifically.
3. **Parent-visibility default (school-wide, separate from enrollment).** In the whole-family
   view, `js/family.js` -> `memberSummary()` shows each child's values + character strengths
   to a parent **by default, no share-gate** (only the child's *goals* are gated). For minors
   this is a default, not a consent. It is the standing school-wide model - not something
   these 6 families newly introduce. If the captain ever wants values/strengths to be
   child-shared like goals are, it is one change to `memberSummary()` applying to all families.

---

## Data safety / backups (set up 2026-09-16)

"Will learner info save?" - resolved:

- **Persistence:** prod runs `BACKEND_TYPE=supabase` (verified on the live `config.runtime.js`).
  All learner data writes to the Supabase Postgres DB, not the browser.
- **Writes:** RLS allows `learner_id = auth.uid()` - so a learner saves their own work **when
  signed in with their own individual login**. The family login's uid is the family, not the
  child, so work done via the family picker is view-only (writes blocked). **Families must be
  told: kids use their own username for their work; the family login is the parent/reflection
  door.** Confirm with a real save-test during the pre-launch walk.
- **Backups:** the free Supabase tier has NO automated backups / PITR. `scripts/backup.sh`
  (local `pg_dump` -> gitignored `./backups`) is the only safety net.
  - First real backup taken 2026-09-16 (88K). Requires `pg_dump` >= server major (server is
    **17.6**; use libpq 18 at `/opt/homebrew/opt/libpq/bin`, keg-only so it needs PATH).
  - **Bug fixed:** the script used to pipe `pg_dump | gzip`, so a failed dump (auth error)
    produced an empty 20-byte file and still printed "complete." It now dumps to a temp file,
    checks pg_dump's exit code, and refuses anything under ~1KB.
  - Credentials live in `~/.vlc-backup.env` (chmod 600), NOT in the crontab or this doc.
  - Weekly cron: `0 20 * * 0 ... . ~/.vlc-backup.env && sh scripts/backup.sh`. Caveats: runs
    only when the Mac is awake; backs up locally. **Run by hand before any migration.**

## Standing gate (unchanged)

The binding **Salus + Jake consented real-learner walk** remains owed before new child-facing
changes harden. Enrollment does not trip it; noted so it stays visible as Discovery opens.
