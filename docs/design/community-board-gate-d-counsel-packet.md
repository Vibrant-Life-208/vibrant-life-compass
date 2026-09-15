# Community Board - Brief for Qualified Counsel (Gate D)

**Date:** 2026-09-15. **Prepared by:** Evoked (Vibrant Life Compass). **This is a research + governance
packaging for counsel; it is NOT legal advice.** Counsel should apply CURRENT law - any dated
regulatory references below are our lay understanding, offered for counsel to confirm, correct, or
update against present authority.

**This is a narrow ADDENDUM to the existing Vibrant Life child-data engagement** (see the Growth
Record brief, `agents/projects/vibrant-life-growth-record/COUNSEL-BRIEF.md`, and the teen-sandbox
age-verification thread). Same posture: COPPA verified-parental-consent for under-13, both directions;
"control + portability," not "ownership." One new question class: **publication/disclosure of
child-authored content to other families.**

**Ask:** confirm or correct the determinations in Section 3 so the community board can proceed toward
go-live. The board is BUILT but held **dark** pending this answer (and the rest of a go-live
checklist).

---

## 1. What the feature is (the facts that drive the analysis)

A **community board** inside the Vibrant Life Compass app, used by a **real, small school (~15
families)**. A learner submits an idea for the community ("start a chess club", "volunteer at the
shelter") - a title + description, optional category / when-where / who-to-contact, and an **optional
poster image**. What makes this different from the (private, encrypted) Growth Record: **board content
is PUBLISHED - visible to every enrolled family and staff** once approved. Key facts:

- **Audience includes under-13 children.** The Discovery studio is roughly **ages 8-11**. Both authors
  and viewers of the board include under-13 minors. (COPPA territory.)
- **Two-adult moderation gate before anything is public.** A learner's submission is reviewed by their
  **guide**, then by the **school owner**; only then does it appear on the board. A guide may decline;
  the owner may take a posted note down.
- **Poster images are processed on-device and de-identified.** An uploaded PDF/photo is rendered to a
  downscaled JPEG in the browser and **re-encoded through a canvas, which strips EXIF/GPS metadata**
  (verified). The original file is never uploaded or retained; only the rendered image is stored.
- **Contact info is steered away from PII.** The "who can people talk to?" field **defaults to "Ask my
  guide."** A learner may choose to name a specific person/place, but the field discourages raw PII (a
  phone/email/address triggers a nudge) and the reviewing adult is prompted to strip any phone number,
  home address, or another child's full name before posting.
- **Report + take-down + non-shaming path-back.** Any learner can flag a posted note for staff; the
  owner can take it down; the author is told, warmly, that a take-down "is not a mark against you" and
  can revise and resubmit.
- **Access is row-level-scoped (RLS, walked in the running system).** A learner sees only their own
  submissions + the posted board; pending/removed items are visible only to the author, their guide,
  and the owner.
- **School / educational context.** This is a school using the tool for its community; not a public
  consumer social network, and not (as designed) directed at commercial use of children's data.
- **First jurisdiction: Idaho, USA.** Built to California-grade as the high-water mark; EU deferred.

## 2. The questions

**Q1 - Consent lane for child PUBLICATION (pivotal).** When an **under-13 learner publishes**
self-authored content (text + an image) to a board visible to **all enrolled families**, does this
require **verifiable parental consent (VPC)** under COPPA, or is it covered by the **school-consent
lane** (school-directed, educational context, no commercial use, adult-moderated)? Publication to
other families is a **disclosure**, not merely internal collection - does that change the lane versus
the Growth Record analysis? *Sub-question:* does a **photo/media release signed at enrollment** (if
the school uses one) suffice, or is a **feature-specific** consent needed for board publication?

**Q2 - Is the two-adult moderation gate legally load-bearing, or supplementary?** Does the
**guide -> owner** approval gate + the enrollment media release satisfy the consent requirement, or is
**per-post or per-child** consent still required regardless of moderation?

**Q3 - Image likeness / third-party children.** If a poster contains a **photo of the authoring child**
(likeness published to all families) or **another identifiable child**, what consent is required - for
the author's guardian, and for any other identifiable minor in the image? What must the moderating
adult be instructed to check?

**Q4 - FERPA applicability.** Is child-authored **community-board content** a "student education
record" maintained by or on behalf of the school (implicating FERPA if the school is FERPA-covered),
or is it community content outside the education-record definition? (Our lay read: it is not an
education record - it is a child's community idea, not maintained as part of their academic file - but
confirm, and note any contract terms needed, especially if the school is FERPA-covered.)

**Q5 - The contact field.** Even defaulted to "Ask my guide," a learner CAN type a first name or place
that then appears to all families. Does surfacing any **child-provided free text** to other families
need consent handling **beyond** the adult-strip-before-post safeguard? Is the current design (safe
default + PII-discouragement + guide review) sufficient, or must the field be removed for the under-13
register?

**Q6 - Age-verification posture.** Does the current U.S. **FTC age-verification** direction bear on a
**moderated, school-context** board (as opposed to a public consumer app)? (This is the same
age-verification thread already open in the teen-sandbox engagement; we flag it here only for its
board-specific bearing.)

**Q7 - Is our proposed consent instrument the right lane, and sufficient?** We have drafted an
at-enrollment, guardian-initialed, **granular** consent (Appendix A: separate permissions for text
posts, image/poster uploads, and a photo showing the child). Please evaluate it directly: (a) does an
**at-enrollment paper/e-sign form** satisfy the applicable lane for under-13, or is **per-feature /
per-post verifiable parental consent (VPC)** required? (b) does item 3 (a photo of the child) need a
distinct standard? (c) does the **age-13 boundary** change the instrument (e.g., school-consent below,
something else above)? (d) finalize binding language + **how long we retain the signed form**.

## 3. Determinations we need confirmed or corrected

1. **The consent lane** for under-13 publication to the all-families board (school-consent vs. direct
   VPC), and the exact **contract / consent-form language** that makes it sound.
2. Whether the **enrollment media release** (if present) covers board publication, or a
   **feature-specific consent** is required - and whether **moderation** changes that.
3. What the **moderating adult must verify** re: images of the author and of any third-party child.
4. **FERPA out (or in)**, with any required terms.
5. Whether the **contact field** as designed is acceptable for the under-13 register or must be cut.
6. Whether the **proposed consent instrument (Appendix A)** is the right lane and sufficient, or must
   become per-feature/per-post VPC - and the final binding language + retention.

## 4. Safeguards already built (so counsel assesses the real system, not a plan)

Two-adult moderation before public; on-device EXIF/GPS-stripped images (originals never uploaded);
contact field defaults to "Ask my guide" with PII-discouragement + adult strip; report + take-down +
non-shaming path-back; RLS walked in the running system (a learner cannot read another's pending
content or the reports); no counts/metrics/streaks; the young (Discovery) register already omits the
contact and when-where fields.

## 5. Standing conditions (our governance stance, for your awareness)

1. **The board stays dark** (feature-flagged off) until this answer and the rest of the go-live
   checklist clear. No under-13 child publishes until the consent lane is confirmed.
2. **Verified consent, both directions** where required - a method that cannot verify does not ship.
3. The safeguards in Section 4 are how the system is built, not positions to defend - tell us where the
   law agrees, disagrees, or requires specific terms.

## 6. Priorities

- **Immediate / gating:** Q1 (consent lane) and Q3 (image likeness) - these gate go-live.
- **Before lift:** Q2, Q4, Q5.
- **Cross-reference:** Q6 rides the existing age-verification thread.

---

*Packaged 2026-09-15 for outside counsel as an addendum to the Vibrant Life child-data engagement. Route
to the same counsel handling the teen-sandbox age-verification / Growth Record questions. Raised by
Tutela (TCC) as the child-publication-consent crux that RLS correctness does not answer: the wall being
sound says who CAN see the board; it does not say whether a minor may PUBLISH to it.*

---

## Appendix A - Proposed Family Consent (DRAFT FOR COUNSEL - NOT IN FORCE)

> **This is a plain-language starting draft for counsel to confirm, correct, and make binding. It is NOT
> legal advice, is NOT yet in force, and does NOT itself establish that any consent standard is met.
> Nothing goes to families until counsel and the school approve it. We drafted it granular and
> revocable on purpose; counsel decides whether an at-enrollment form suffices for under-13 or whether
> it must be verifiable parental consent (VPC), and whether item 3 needs a stronger standard.**

### Vibrant Life - Community Board: family permission

Your child uses the Vibrant Life Compass app. It has a **community board** where a learner can share an
idea with the whole Vibrant Life community - other enrolled families and staff - like a club to start,
an event, or a way to help. A learner may also add a poster or a drawing.

How it works: **every post is reviewed by your child's guide and then the school before it appears.**
Uploaded photos are processed on the device to **remove location data**. A post can be **taken down at
any time**, and posting is always **optional** - your child is never required to.

We ask your permission before your child publishes to the board. **You can allow some parts and not
others, and you can change your mind at any time** by telling [school contact]; we will remove any
affected posts.

Please initial each you allow:

- `____` **1. Written ideas.** My child may post their own written ideas (text) to the community board,
  visible to enrolled families and staff.
- `____` **2. Images / posters.** My child may add an image (a poster, or a photo of a drawing) to a
  post.
- `____` **3. A photo of my child.** A post may include a photo that shows my child.
  *(If a post would show another child, we ask that family separately.)*

Parent/guardian name: `___________________`  Child's name: `___________________`  Child's age: `____`

Signature: `___________________`  Date: `__________`

**For families, plainly:** You can withdraw any of these at any time and we remove the affected posts.
We never sell your child's posts or use them for advertising. There are no scores, streaks, or counts
on the board.

**[COUNSEL to resolve, per Q7]:** the applicable lane for under-13 (school-consent vs VPC); whether an
at-enrollment form suffices or per-feature/per-post consent is required; whether item 3 (a photo of the
child) needs a distinct standard; the age-13 boundary; the binding language; and how long the signed
form is retained.

### Product implication (build item, if this instrument is adopted)

A declined permission must be **technically honored**: the board checks a **per-learner consent flag**
before allowing a post - no consent -> no publish; text-only consent -> the image/poster field is
withheld for that learner. This is a small build (a consent flag on the learner + a gate in the board),
noted so it is not discovered after the fact.
