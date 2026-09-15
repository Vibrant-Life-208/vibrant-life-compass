-- v0.42: a learner may DELETE their own community post (Gate H sovereignty, Quark - fresh-eyes review
-- 2026-09-15). "Ownership without deletion is tenancy": a child wrote the words, so a child may withdraw
-- them at any stage. This is the right-to-be-forgotten for a child's own board content.
--
-- Scope is strictly own-rows: `learner_id = auth.uid()`. Guides/owners still moderate via the 'removed'
-- status (v0.40, soft take-down); this is a distinct, self-initiated HARD delete of one's own row.
-- community_post_reports.post_id references community_posts ON DELETE CASCADE, so a deleted post takes
-- its reports with it - no orphans.
--
-- NOTE (Tutela wall-walk): new RLS - re-run the Gate B probes (a learner can delete OWN, cannot delete
-- ANOTHER's) before the board lifts.

grant delete on community_posts to authenticated;

drop policy if exists "cp_delete_own" on community_posts;
create policy "cp_delete_own" on community_posts for delete
  using (learner_id = auth.uid());
