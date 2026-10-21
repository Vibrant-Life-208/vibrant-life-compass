# The Launch Pad posters - investigation, re-evaluation, and the v2 rebuild

**Date:** 2026-10-21
**Ask:** "Investigate great poster work and re-evaluate ours, the poster and the info poster for parents. Make it Mad Men eye-catching."
**Governs:** `launch-pad-promotion-and-the-not-shown-wall-v0.1.md` (the wall, §1; the sentences, §4). Nothing below overrides it.
**Produced:** `launch-pad-poster-v2.html` / `The-Launch-Pad-Poster-v2.pdf` and `launch-pad-poster-parents-v2.html` / `The-Launch-Pad-Parent-Information-Poster-v2.pdf`. Both letter, both single-page, both pass the build's wall and fleet-name checks (whitespace-stripped, whole-word).

---

## 1. What "Mad Men" work actually was

The work from that era that is still taught is not the loud kind. It is Doyle Dane Bernbach, 1959 to 1963, and it won by doing the opposite of what the room expected.

- **Volkswagen, "Think Small" (1959).** A small photo of the car in a field of white, a two-word headline, three short columns of copy that told the truth about a small, ugly, cheap car. Voted the best campaign of the century by Advertising Age. The white space was the message: nothing to hide, so nothing to shout. ([Wikipedia](https://en.wikipedia.org/wiki/Think_Small), [Ad Ranking](https://adranking.co.uk/campaigns/volkswagen-think-small/))
- **Volkswagen, "Lemon" (1960).** One word under a photo of a car that failed inspection. Helmut Krone's layout: two-thirds picture, headline, three columns, logo set where you did not expect it. Set in Futura when everyone else set serif. Krone cut widows into the copy with a razor on purpose, for a halting, human rhythm. ([Fonts In Use](https://fontsinuse.com/uses/1976/volkswagen-of-america-ads-1960-68), [Helmut Krone](https://en.wikipedia.org/wiki/Helmut_Krone))
- **Avis, "We're only No. 2. We try harder." (1962, Paula Green).** The pitch was the admission. "It went against the notion that you had to brag." Avis went from a loss to a profit inside a year by saying the limit out loud. ([Slate](https://slate.com/business/2013/08/hertz-vs-avis-advertising-wars-how-an-ad-firm-made-a-virtue-out-of-second-place.html), [Paula Green](https://en.wikipedia.org/wiki/Paula_Green))
- **Ogilvy's reading order.** Picture first, headline under it, copy under that, signature last; set the headline in sentence case because capitals are read letter by letter; a headline with a real promise outsells a clever one; the brand name in the headline or 80% of readers never learn who is talking. ([Ogilvy rules](https://karolakarlson.com/advertising-rules/), [Conversion Studio](https://conversion.studio/blog/ogilvy-on-advertising))
- **The Swiss poster** (Müller-Brockmann): a grid, one image, one line, subjectivity removed so the message reads. Still the most assigned grid text in design schools. ([Swiss Grid](https://swissgrid.posterhouse.org/), [Eye](https://www.eyemagazine.com/feature/article/reputations-josef-muller-brockmann))
- **The distance rule.** One inch of capital height per ten feet of viewing distance. Three levels of hierarchy, not five. Two typefaces at most. ([4over4](https://www.4over4.com/guide/poster-typography-design-tips-for-eye-catching-prints), [Design Shack](https://designshack.net/articles/typography/typography-for-posters/))

The finding that matters for us: **the Mad Men idiom is the wall's native idiom.** "Invitation, not persuasion. State the limit as a limit, never as a lure. Promise the conditions, never the outcome" (wall §0) is Avis and Lemon word for word. The restraint is not a constraint on the craft; it is the craft. What the wall forbids (urgency, outcome promises, transformation imagery) is the part of the era that is not remembered.

---

## 2. Re-evaluation of what we had

Scored two ways: against the craft above, and against the wall.

### The Story Poster (`launch-pad-poster.html`, rocket on a gradient)

- **Craft.** The headline is the program's name in 44px capitals, so it is read letter by letter and says nothing. Five levels of type. The one sentence that carries the idea ("Know yourself. Do work that matters...") sits at the bottom in dark brown on the lightest band, the weakest contrast on the page. The picture is a rocket and a flame: generic, and it is the same visual the entire enrollment-template market uses.
- **Wall.** Wall item 9 says the poster is a star map and a cycle and stays that. A rocket lifting off a pad under "YOUR NEXT GREAT ADVENTURE" is journey-to-triumph imagery, the thing item 9 names. Ages and the word "studio" were corrected on 20 October; the imagery was not read. **Verdict: retire the rocket.** Keep the file for the record.

### The Star Map (`launch-pad-poster-startrek.html`)

- **Craft.** Stronger: one picture, a course line, the three questions in reading order. But it closes on "SET YOUR COURSE." in capitals and a bracketed placeholder for contact, and the frame is a borrowed television interface that reads as fandom to a parent who does not share it.
- **Wall.** Clean on items 1 to 8. The frame is borrowed visual language (item 9's logic, if not its letter). **Verdict: keep as the second poster if the frame goes; not touched in this pass.**

### The Parents poster (`launch-pad-poster-outcomes.html`, pulled 20 October)

- **Craft.** It is a sales sheet: "What they walk away with", two cards of outcomes, "Every Launch Pad hands your child a resume. Ours hands them back to themselves." A comparison claim about other programs we cannot back.
- **Wall.** Breaks item 4 flat out (portfolio, resume, referrals, hundreds of hours, "super power"), item 2 in spirit ("Three years to become who you're meant to be"), the §4 never-list ("exceptional learners"), and the age. **Verdict: rewritten from blank, below.** The Families twin has no source file and the same text; it is not rebuilt.

### The overview one-pager (`2026-06-25-launch-pad-overview-one-pager.html`)

- **Craft.** It is a reading document, not a poster, and a good one. Printed at 64% zoom, so body type lands around 8.5pt.
- **Wall.** Three "Ends with" lines were soft outcome promises ("the confidence of knowing...", "a public talk that makes a room care", "the capacity to make a hard call from principle"). Dated "Draft for discussion, June 2026". **Verdict: corrected the same day.** The three lines now name what the learner does rather than who they become, and the date reads October 2026. Rebuilt with headless Chrome, the renderer the original used.

### The Star Map, second look (21 October)

A line-by-line read of the live file found something the 20 October age pass missed: the footer still printed `[ LEARN MORE: CONTACT / QR ]`, a bracketed placeholder, on a family-facing poster sitting in Jenna's folder. It now reads "VIBRANT LIFE LAUNCH PAD · AGES 16 TO 18 · OPENS AUGUST 2027". **This is the second time a defect survived a sweep that was looking for something else.** The 20 October pass was looking for ages and the word "formation"; it found both and stopped. A placeholder is not a wall item, so nothing was watching for it.

---

## 3. What v2 does

Both pages follow the 1960 page: picture, headline, three columns, signature. Futura, like the originals, available on this machine and embedded in the PDF. Black on white, so it photocopies, reads in large print, and costs nothing to print.

### The poster: "Not a high school."

The Lemon move. Lead with the sentence that sounds like a flaw and is the whole point. It is the first sentence on the wall's "use freely" list. The picture is the turning cycle from the one-pager, small, in white, with the send-off star just off the wheel. The five paragraphs are the §4 sentences in order: what it is and the three refusals; the week with Friday empty; the three questions and the Log; the honest limits (one guide, no aide, a baby on guide mornings, "a handful"); the books and the evening in the room, ending "nothing changes between us."

The headline's capital height is about 0.6 inches, so it reads from roughly six feet at letter size. Printed at tabloid ("fit to page" at the print shop) it reads from ten.

### The parent information poster: "We promise the conditions. Never the outcome."

Wall §0 as the headline. The Ogilvy long-copy page: everything a parent asks first, answered in print, in seven short blocks: what it is, the week as a five-row table, what we refuse to do (six refusals, each starting with the word No), what gets written down (the Growth Record, the credit exception, the dual-enrollment bridge stated as unfinished), what one guide can hold (the Origin-year shape: the baby, no aide, a coach not a therapist, the one adult outside the room, 988, unreachable over breaks), how you leave, what to do next. Price and exit are named as living on the family note, not the page, per §5 of the wall.

Every claim was checked against the Origin book's Part 1 before it went on the page (the 9:00 to 1:00 morning, Tuesday and Thursday guide mornings, Monday and Wednesday own mornings with the guide at Tots until noon, the Log never read, the Growth Record and the credit exception, the referral posture).

---

## 4. What is open, and who reads next

**Captain's calls**
1. The contact line. Both pages end "Ask at Vibrant Life, or ask Erin." No number, no QR, by design, until a number is decided. The old pages carried bracketed placeholders; a family-facing page cannot.
2. "A handful of learners." The wall says the seven chairs are said when asked, never as the opener. "Handful" is the honest shape without the number. If you want the number on the parent page, it belongs under "What one guide can hold," and Naomi's drift watch should say yes first.
3. The parent page describes the **Origin year's** guide shape (baby in the room, guide at Tots on own mornings). It is true for the 2027 door. It needs one line changed before it is handed to a 2028 joiner.
4. Whether the rocket Story Poster and the Star Map come out of the family folder, and whether the Star Map loses its frame.

**Owed reads before either page goes out** (wall §7, unchanged)
- Naomi: the wall, item by item, on both pages.
- Chekov: large print (the pages are black on white and scale cleanly to tabloid; a 14pt large-print edition is a CSS change), and plain language. Body copy is 12px Futura Medium at letter size; it is a handbill at arm's length, not a wall read.
- Kira: eighth-grade register; no borrowed visual language. The wheel and the white page are the vocabulary the wall names.
- Accord: the Exhale Test on both pages.

**Jenna's card.** The replacement card text already tells her the two June posters "are being rewritten rather than quietly corrected." These are the rewrite. They are not in Drive and the card does not link them; that waits on the reads above and on the Google Docs connector for the card itself.

---

*Show the room. Print the books. Say the limits. Then let the family decide.*
