-- v0.27: guide-marked tribe leaders + guide-assigned accountability partners.
--
-- Two capabilities land together (captain 2026-07-21):
--
-- 1. Leaders. A guide marks certain learners as tribe "leaders" from the new Tribe
--    tab. The flag drives a roster indicator and the group-randomizer's leader options
--    (exclude leaders / one leader per group / leader-anchored draws). Add the column
--    and let a guide update it for learners on THEIR roster.
--
-- 2. Guide-assigned partners. The learner self-pick for accountability partners is
--    retired; guides now pair learners (by randomizer or by hand). A guide writes an
--    'accepted' partner_links row directly. Add read/insert/update policies scoped to
--    the guide's own roster, and a provenance column so a guide-made pairing is
--    distinguishable from a learner-proposed one.
--
-- NB (side benefit): the guide-update policy on learners also unblocks the in-progress
-- newToTribe flag, which writes to learners via the same saveLearner path and was
-- previously blocked by the self-only write policy.

-- ── 1. Leaders ───────────────────────────────────────────────────────────────

-- 1a. Leader flag. Not-null default false so existing rows are non-leaders.
alter table learners add column if not exists is_leader boolean not null default false;

-- 1b. Let a guide update learners on their OWN roster. Writes were previously self-only
--     (learners_write_self), so guide-set flags could never persist. Scoped to
--     guide_learner_assignment - a parent's read-visibility does NOT grant write.
drop policy if exists "learners_update_by_guide" on learners;
create policy "learners_update_by_guide" on learners
  for update
  using (id in (select learner_id from guide_learner_assignment where guide_id = auth.uid()))
  with check (id in (select learner_id from guide_learner_assignment where guide_id = auth.uid()));

-- ── 2. Guide-assigned partners ───────────────────────────────────────────────

-- 2a. Provenance flag: true when a guide made the pairing (vs a learner proposal).
alter table partner_links add column if not exists assigned_by_guide boolean not null default false;

-- 2b. Let a guide READ partner links involving their roster, so getActivePartnerOf and
--     the Tribe-tab assignment view work (the base read policy only covers the two
--     parties, and the guide is neither).
drop policy if exists "partner_links_read_by_guide" on partner_links;
create policy "partner_links_read_by_guide" on partner_links
  for select using (
    proposer_id in (select learner_id from guide_learner_assignment where guide_id = auth.uid())
    or partner_id in (select learner_id from guide_learner_assignment where guide_id = auth.uid())
  );

-- 2c. Let a guide INSERT a partnership for two learners who are BOTH on their roster.
--     The existing partner_links_insert policy (proposer_id = auth.uid()) is left in
--     place; this adds the guide path, since the guide is neither party.
drop policy if exists "partner_links_insert_by_guide" on partner_links;
create policy "partner_links_insert_by_guide" on partner_links
  for insert
  with check (
    proposer_id in (select learner_id from guide_learner_assignment where guide_id = auth.uid())
    and partner_id in (select learner_id from guide_learner_assignment where guide_id = auth.uid())
  );

-- 2d. Let a guide UPDATE (dissolve / reassign) links between two of their learners, so
--     re-pairing from the Tribe tab works.
drop policy if exists "partner_links_update_by_guide" on partner_links;
create policy "partner_links_update_by_guide" on partner_links
  for update
  using (
    proposer_id in (select learner_id from guide_learner_assignment where guide_id = auth.uid())
    and partner_id in (select learner_id from guide_learner_assignment where guide_id = auth.uid())
  )
  with check (
    proposer_id in (select learner_id from guide_learner_assignment where guide_id = auth.uid())
    and partner_id in (select learner_id from guide_learner_assignment where guide_id = auth.uid())
  );
