-- Hero's Compass - Migration: v0.13 learner-authored updates
-- Date: 2026-06-29
--
-- Model correction (captain 2026-06-29): learners have their OWN logins; only
-- parents share the family login. That makes "receive-only for parents" a real
-- auth boundary instead of a UI promise: a learner posts an update while signed
-- in AS THEMSELVES (auth.uid() = the learner), and the parents' family login can
-- only READ the feed. So v0.12's family-login insert/delete policies (which let
-- the shared family login write) are replaced with learner-scoped ones.
--
-- The family READ policy is unchanged - parents still read their family's feed.

-- Out: the family login could insert/delete (v0.12). Receive-only for parents is
-- now structural, so these go.
drop policy if exists "family_updates_insert" on family_updates;
drop policy if exists "family_updates_delete" on family_updates;

-- In: a learner, signed in as themselves, posts an update into their own family's
-- feed and may retract their own. Bounded to families they are a learner member of.
create policy "family_updates_insert_learner" on family_updates for insert
  with check (learner_id = auth.uid()
    and family_id in (select family_id from family_members
                      where profile_id = auth.uid() and kind = 'learner'));

create policy "family_updates_delete_learner" on family_updates for delete
  using (learner_id = auth.uid()
    and family_id in (select family_id from family_members
                      where profile_id = auth.uid() and kind = 'learner'));

-- family_updates_read (family_id = auth.uid()) stays from v0.12: parents read.
