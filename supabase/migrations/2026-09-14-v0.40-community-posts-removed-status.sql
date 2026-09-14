-- v0.40: add a 'removed' status so a posted note can be taken down (Salus condition).
--
-- The v0.37 status check allowed pending_guide / pending_owner / posted / denied. A take-down
-- needs a distinct terminal state so a note leaves the public board (getPostedBoard filters
-- status = 'posted') without reading to the learner as "denied / not this time". The owner review
-- surface (owner.js) sets 'removed'; RLS is unchanged (the owner update policy already permits it).

alter table community_posts drop constraint if exists community_posts_status_check;
alter table community_posts add constraint community_posts_status_check
  check (status in ('pending_guide', 'pending_owner', 'posted', 'denied', 'removed'));
