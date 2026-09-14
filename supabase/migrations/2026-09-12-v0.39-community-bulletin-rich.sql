-- v0.39: richer community bulletin (cork-board form + poster).
--
-- Extends v0.37's community_posts with the fields the extended submission form collects,
-- plus a rendered poster image. Poster handling is client-side: the learner uploads a PDF,
-- the app renders its first page to a downscaled JPEG on-device and stores that image as a
-- data URL here (no Supabase Storage bucket, no original PDF retained - see connection.js /
-- community-board.js). This keeps the file off any server and the board self-contained.
--
-- All new columns are NULLABLE so existing rows and the legacy (flag-off) single-field
-- insert path stay valid. The app enforces which fields are required on the rich form.
-- RLS is unchanged: v0.37's row-level policies already govern who may see/insert/update a
-- row, and they cover these columns without change.

alter table community_posts add column if not exists title text
  check (title is null or char_length(title) between 1 and 120);
alter table community_posts add column if not exists category text
  check (category is null or category in ('club', 'volunteer', 'event', 'other'));
alter table community_posts add column if not exists when_where text
  check (when_where is null or char_length(when_where) <= 200);
alter table community_posts add column if not exists contact text
  check (contact is null or char_length(contact) <= 120);
-- Rendered poster: a downscaled JPEG data URL (data:image/jpeg;base64,...). Capped well
-- above a ~700px-wide q0.7 first-page render (~40-150KB) but bounded so a row can't grow
-- without limit; the app also caps the source PDF and the output dimensions before store.
alter table community_posts add column if not exists poster_image text
  check (poster_image is null or char_length(poster_image) <= 600000);
