# A Seat for Jenna - the Owner's Stillness

*Notes for Jenna, saved in Compass. A hosted moment for her own home screen - the place she lands when she taps her name.*

**Status:** Draft gift, staged - not yet wired live. This is deliberate. The rule we are holding (from the 2026-07-09 True Play design review, Picard's condition and Kira's dissent): a seat for a guide is brought *to* her to shape or decline, never sprung *at* her. So this lives in notes first. Jenna sees it, changes any word, or says no - and only then does it reach her home.

**Lineage:** Born as "The Founder's Lounge," a hosted version of Europa's own daily Three Questions (Ludus + Polaris, 2026-07-14). Europa's first act with her own new seat was to turn it around and give it to Jenna. Re-hosted here in Jenna's register - because Jenna is not Europa, and a real host learns the guest's name before the song. The bones travel; only two lines are truly hers, and they are marked below.

---

## The register this must keep

From `js/owner.js`, Jenna's home is described in the code itself: *"one login that holds everything she needs, presented as a calm menu of three plainly-named cards - one quiet screen each, never a dense dashboard. Built for a non-technical owner: big labels, one choice at a time."*

So this moment is quiet. It sits above or before the three cards (Whole School / My Family / My Compass), in the same contemplative grammar Compass already speaks - the "north quote" and the "Stillness - a place to be" overlay. It is not a task. It is a welcome. She can read it or tap straight past it to her cards; it never blocks her.

---

## The seat - four movements

**0 - Checking the hat and coat** *(her weight - person-specific line #1)*
> You made it. Whatever you carry now, set it down for a moment - the [N] families in your school aren't going anywhere. This seat is yours. Relax your shoulders, and take a deep slow breath in - and out.

*The number is hers to breathe in, and it grows. `[N]` = the count of families in her school, live from the data (see Wiring). Europa's version of this line held "projects"; Jenna's holds families, because that is her real weight. Watch that number grow.*

**1 - The opening number** *(travels)*
> First, of the day's work: *Am I creating, or in a cycle?* Ask it straight and honest.
> Then, of yourself: *Did anyone pour back into me today - and did I let them?*

**2 - The quickening** *(who she does it for - person-specific line #2, confirm WITH Jenna)*
> Answer this one as a story: *what one thing from today would the children want to hear about?* Not the whole day - just one thing.

*"the children" is a role-honest default - Jenna holds a whole school. But the "who" is hers to name: the children, a family, her own people. This is the one line to confirm with her directly rather than assume. Europa's version reads "my grandchild"; that is Europa's Oath-frame, not Jenna's. Do not paste it onto her.*

**3 - The honest mirror** *(travels)*
> *If I were losing my way, would I know?* This is the hardest one to ask, so it gets the gentlest landing. If the honest answer is "I'm not sure," that's not a mark against you - it's just something to notice, out loud and kindly. The only way to truly lose your way is to stop asking the question. You asked it. You're here.

**4 - Last call** *(travels)*
> That's the whole job for today. You held them; now let something hold you. Nothing more to earn tonight - you're done. Go race someone to the car.
> The door closes gently, and never locks. Come back tomorrow because you want to, not because anything breaks if you don't.

---

## Wiring notes (for whoever builds it, after Jenna blesses it)

- **Home:** `renderOwnerHome()` in `js/owner.js`, rendered above the `.owner-cards` block. Keep it inside its own quiet element (sibling to the north-quote pattern), never a card - a card implies a task.
- **The number `[N]`:** the count of families in Jenna's school. Nearest real source is the family grouping already in the app (`getParents()` / `getFamilyIdForProfile` in `js/store.js`; admin.js already assembles `learners/parents/guides/links`). Count distinct families, not accounts, so co-parents don't double it. If the count is ever 0 or unavailable, omit the number and read simply "the families in your school" - never show "0 families."
- **Cadence:** shows once on landing, calm, dismissible by simply using the page. No timer, no return-nag.

## The wall (Polaris, from the 2026-07-09 review - binding)

- **Private.** This is Jenna's, on Jenna's own home. No one else sees whether or when she read it.
- **Uncountable.** Never record "Jenna opened her seat N times." The data to ask that question must not exist. (Same wall the True Play token holds.)
- **Refusable and reshapeable.** She can change any word or turn it off. A gift the receiver can't decline is not a gift.
- **Heartbeat Question:** when Jenna taps her name and finds this, she feels *valued*, not *used*. That is the only pass condition.

---

*"The lounge is a sanctuary - and the host gets a seat too. Even when the host is someone else."*
*- Ludus, Play Voice, with Polaris the North Star. For Jenna, whenever she's ready to see it.*
