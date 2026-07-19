-- v0.25: Values lexicon overhaul (captain 2026-07-19).
-- Replaces the 36-value subset with the "Virtues: The Gifts of Character" card
-- values MINUS the ~11 that overlap the VIA character strengths (kept distinct
-- from strengths), PLUS Creation and Truth = 44 values. Each carries an "Evoked
-- definition" - one line touching the truest essence of the word - shown under
-- the value on the pick-from-list screen (Discovery/Adventure learners).
-- Guinan reviewed the definitions; Detachment/Honor/Purposefulness/Truth polished.
--
-- Safe on prod: values_top_3 stores value ids in a text[] (no FK to this table),
-- so clearing and re-inserting the full set does not break any learner's picks -
-- every previously-valid id is present again after the re-insert. Clear-and-insert
-- (not upsert) sidesteps any secondary unique index the re-sort would collide with.

begin;

alter table values_lexicon add column if not exists definition text not null default '';

delete from values_lexicon;

insert into values_lexicon (id, display_label_adult, definition, sort_order) values
  ('assertiveness',   'Assertiveness',   'Speaking your truth and asking for what you need, without stepping on anyone else to do it.', 1),
  ('caring',          'Caring',          'Letting how someone else is doing matter to you, enough to do something about it.', 2),
  ('cleanliness',     'Cleanliness',     'Tending your space and your body with care, so what surrounds you feels clear.', 3),
  ('commitment',      'Commitment',      'Staying with a promise after the excitement fades, because you said you would.', 4),
  ('compassion',      'Compassion',      'Feeling another''s hurt as if it were your own, and letting it soften how you treat them.', 5),
  ('confidence',      'Confidence',      'Trusting that you can meet what comes, even before you know exactly how.', 6),
  ('connection',      'Connection',      'The bond that forms when you truly meet another person, and neither of you is alone in it.', 7),
  ('consideration',   'Consideration',   'Thinking of how your choices land on others before you make them.', 8),
  ('cooperation',     'Cooperation',     'Joining your effort with others, so together you reach what none could alone.', 9),
  ('courtesy',        'Courtesy',        'Small acts of respect that tell another person they are seen.', 10),
  ('creation',        'Creation',        'Making something that was not here before, and trusting that what you bring into the world matters.', 11),
  ('detachment',      'Detachment',      'Loving what you have without clutching it, so an open hand leaves you free.', 12),
  ('determination',   'Determination',   'Choosing to keep going toward what matters, long after the first burst of wanting fades.', 13),
  ('diligence',       'Diligence',       'Giving your steady, careful best to the work in front of you, again and again.', 14),
  ('enthusiasm',      'Enthusiasm',      'Meeting what you do with your whole spark, so the doing comes alive.', 15),
  ('excellence',      'Excellence',      'Caring enough to do a thing as well as it can be done, for its own sake.', 16),
  ('flexibility',     'Flexibility',     'Bending with what changes instead of breaking against it, and finding the new way through.', 17),
  ('friendliness',    'Friendliness',    'Meeting others with an open, warm face, so they feel welcome near you.', 18),
  ('generosity',      'Generosity',      'Giving freely of what you have - time, help, or heart - without keeping score.', 19),
  ('gentleness',      'Gentleness',      'Handling people and moments softly, knowing soft is not the same as weak.', 20),
  ('helpfulness',     'Helpfulness',     'Noticing where a hand is needed, and offering yours before you are asked.', 21),
  ('honor',           'Honor',           'Keeping faith with your word and your name, even when no one is watching.', 22),
  ('idealism',        'Idealism',        'Holding on to how good things could be, and letting that pull you toward making it real.', 23),
  ('integrity',       'Integrity',       'Being whole - the same person on the inside and the outside, your actions matching what you believe.', 24),
  ('joyfulness',      'Joyfulness',      'Letting delight rise in you and spill over, so others catch it too.', 25),
  ('loyalty',         'Loyalty',         'Standing with the people you love, especially when it costs you something.', 26),
  ('moderation',      'Moderation',      'Knowing how much is enough, so nothing good turns into too much.', 27),
  ('modesty',         'Modesty',         'Letting your work speak, and taking up only the room you truly need.', 28),
  ('orderliness',     'Orderliness',     'Bringing calm and clarity to what is scattered, so you can find your way through it.', 29),
  ('patience',        'Patience',        'Staying steady through the waiting, trusting that some things need time to become.', 30),
  ('peacefulness',    'Peacefulness',    'Carrying a quiet inside you that does not depend on everything around you being calm.', 31),
  ('purposefulness',  'Purposefulness',  'Carrying a reason through your days, so what you do adds up to something.', 32),
  ('reliability',     'Reliability',     'Being someone others can count on, whose word and presence hold.', 33),
  ('respect',         'Respect',         'Treating every person as someone who matters, simply because they do.', 34),
  ('responsibility',  'Responsibility',  'Owning what is yours to carry - your choices, your part, and your repair.', 35),
  ('service',         'Service',         'Using what you have to lift others, and finding meaning in the lifting.', 36),
  ('tact',            'Tact',            'Telling the truth in a way it can be heard, with care for the person hearing it.', 37),
  ('tolerance',       'Tolerance',       'Making room for people who differ from you, without needing them to be the same.', 38),
  ('trust',           'Trust',           'Letting yourself lean on another, believing they will hold what you give them.', 39),
  ('trustworthiness', 'Trustworthiness', 'Being worthy of what others place in you, and guarding it well.', 40),
  ('truth',           'Truth',           'Loving what is real more than what is comfortable, and staying with it.', 41),
  ('truthfulness',    'Truthfulness',    'Letting your words match what is real, so people can trust what you say.', 42),
  ('understanding',   'Understanding',   'Working to see through another''s eyes until their world makes sense to you.', 43),
  ('unity',           'Unity',           'Feeling the thread that ties you to others, so no one stands entirely apart.', 44);

commit;
