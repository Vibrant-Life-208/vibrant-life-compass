#!/usr/bin/env python3
"""Generate the art-directed Launch Pad posters.

Two directions, both built from the vocabulary the promotion wall names in
item 9 and item 10: a star map, a cycle, and the brass-line design. Nothing
here shows a learner, promises an outcome, or borrows journey-to-triumph
imagery; the restraint is in the words, and the page is allowed to be
beautiful.

    python3 docs/design/poster-build.py          # writes both HTML files

Render with headless Chrome, which handles the gradients and filters that
weasyprint drops:

    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless \
        --no-pdf-header-footer --print-to-pdf=out.pdf file:///abs/path.html
"""

import math
import random
from pathlib import Path

HERE = Path(__file__).resolve().parent
W, H = 816, 1056  # letter at 96dpi

# Vibrant Life palette, deepened for a dark ground.
ORIGIN, FORGE, HELM = "#E09B3D", "#2FA396", "#6E6EAE"
GOLD = "#E8C06A"
CREAM = "#F4EFE4"


def starfield(n, seed, w=W, h=H, maxr=1.9, exclude=None):
    """Scattered stars. `exclude` is a (cx, cy, r) kept clear for the chart."""
    rnd = random.Random(seed)
    out = []
    while len(out) < n:
        x, y = rnd.uniform(0, w), rnd.uniform(0, h)
        if exclude:
            cx, cy, cr = exclude
            if math.hypot(x - cx, y - cy) < cr:
                continue
        r = rnd.choice([0.7, 0.9, 1.1, 1.3, 1.6, maxr])
        o = rnd.uniform(0.25, 0.95) * (0.6 if r < 1.1 else 1.0)
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" opacity="{o:.2f}"/>')
    return "\n      ".join(out)


def ticks(cx, cy, r_out, r_in, count, color, width=1.0, every=1, longer=5):
    """Engraved tick marks around a ring, every `longer`th one extended."""
    out = []
    for i in range(count):
        if i % every:
            continue
        a = math.radians(i * 360 / count - 90)
        ro = r_out + (3 if i % longer == 0 else 0)
        x1, y1 = cx + r_in * math.cos(a), cy + r_in * math.sin(a)
        x2, y2 = cx + ro * math.cos(a), cy + ro * math.sin(a)
        op = 0.85 if i % longer == 0 else 0.4
        out.append(
            f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" '
            f'stroke="{color}" stroke-width="{width}" opacity="{op}"/>'
        )
    return "\n      ".join(out)


def arc(cx, cy, r, a0, a1, sweep=1):
    """SVG arc from a0 to a1 degrees (0 = 12 o'clock, clockwise).

    sweep=1 runs clockwise, sweep=0 counter-clockwise. A label along the
    bottom of a circle only reads right side up on a counter-clockwise path,
    which is why THE FORGE was upside down in the first cut.
    """
    def pt(a):
        t = math.radians(a - 90)
        return cx + r * math.cos(t), cy + r * math.sin(t)
    x0, y0 = pt(a0)
    x1, y1 = pt(a1)
    span = (a1 - a0) % 360 if sweep else (a0 - a1) % 360
    large = 1 if span > 180 else 0
    return f"M {x0:.2f},{y0:.2f} A {r} {r} 0 {large} {sweep} {x1:.2f},{y1:.2f}"


# --------------------------------------------------------------- shared copy
QUESTIONS = [
    (ORIGIN, "ORIGIN", "Who am I?"),
    (FORGE, "THE FORGE", "What is worth solving?"),
    (HELM, "THE HELM", "What do I do when there is no easy answer?"),
]
REFUSE = "NO GRADES &nbsp;&middot;&nbsp; NO RANKING &nbsp;&middot;&nbsp; NO DEADLINE THEY DID NOT SET"
BODY = ("Two mornings a week with a guide, two the learners run themselves, and a Friday "
        "that is never filled. One guide, no aide, and the whole three years printed so a "
        "sixteen-year-old can read every page.")


def qlist(colour_dot, name_col, q_col, size=15.5):
    """The three questions as a centred stack. Replaces the radial labels,
    which pushed the Helm's long question off the page in the first cut."""
    rows = []
    for col, name, q in QUESTIONS:
        rows.append(
            f'<div class="qrow"><span class="dot" style="background:{col}"></span>'
            f'<span class="qn">{name}</span>'
            f'<span class="qq">{q}</span></div>'
        )
    return "\n    ".join(rows)


def curved_names(cx, cy, r, col, size=14, space=4.2):
    """Year names set along their own arc. The bottom one runs counter-clockwise
    so it reads right side up."""
    out = []
    spans = [("cnO", "ORIGIN", 24, 96, 1), ("cnF", "THE FORGE", 216, 144, 0),
             ("cnH", "THE HELM", 264, 336, 1)]
    for tid, text, a0, a1, sweep in spans:
        out.append(
            f'<path id="{tid}" d="{arc(cx, cy, r, a0, a1, sweep)}" fill="none"/>'
            f'<text font-family="Copperplate, Big Caslon, serif" font-size="{size}" '
            f'letter-spacing="{space}" fill="{col}">'
            f'<textPath href="#{tid}" startOffset="50%" text-anchor="middle">{text}</textPath></text>'
        )
    return "\n      ".join(out)


# --------------------------------------------------------------- direction A
def direction_a() -> str:
    cx, cy, R = 408, 330, 150
    stars = starfield(165, seed=7, exclude=(cx, cy, R + 42))
    ring_ticks = ticks(cx, cy, R + 15, R + 9, 72, GOLD, 1.0, every=1, longer=6)
    seg = f"""
      <path d="{arc(cx, cy, R, 2, 118)}" stroke="{ORIGIN}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="{arc(cx, cy, R, 122, 238)}" stroke="{FORGE}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="{arc(cx, cy, R, 242, 358)}" stroke="{HELM}" stroke-width="8" fill="none" stroke-linecap="round"/>"""
    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<title>The Launch Pad - Poster, celestial chart</title>
<style>
  @page {{ size: 8.5in 11in; margin: 0; }}
  html,body {{ margin:0; padding:0; background:#070a16; }}
  .poster {{ position:relative; width:{W}px; height:{H}px; overflow:hidden;
    background:
      radial-gradient(120% 78% at 50% 28%, #1e2a55 0%, #131c3c 42%, #0a1024 72%, #060810 100%),
      #060810;
    font-family:"Avenir Next","Futura",Helvetica,sans-serif; color:{CREAM}; }}
  .glow {{ position:absolute; left:50%; top:540px; width:1150px; height:520px;
    transform:translateX(-50%); pointer-events:none;
    background:radial-gradient(50% 50% at 50% 50%, rgba(232,192,106,.17), rgba(232,192,106,0) 70%); }}
  .vign {{ position:absolute; inset:0; pointer-events:none;
    background:radial-gradient(78% 62% at 50% 34%, rgba(0,0,0,0) 52%, rgba(0,0,0,.6) 100%); }}
  svg.chart {{ position:absolute; inset:0; }}
  .eyebrow {{ position:absolute; top:54px; left:0; right:0; text-align:center;
    font-family:Copperplate,"Big Caslon",serif; font-size:11px; letter-spacing:5px;
    color:{GOLD}; opacity:.92; }}
  .rule {{ position:absolute; left:50%; transform:translateX(-50%); width:120px; height:1px;
    background:linear-gradient(90deg,rgba(232,192,106,0),{GOLD},rgba(232,192,106,0)); }}
  h1 {{ position:absolute; left:0; right:0; top:556px; margin:0; text-align:center;
    font-family:Didot,"Bodoni 72",serif; font-weight:400; font-size:74px; line-height:1;
    letter-spacing:-.5px; color:{CREAM}; }}
  .qs {{ position:absolute; left:120px; right:120px; top:664px; }}
  .qrow {{ display:flex; align-items:baseline; gap:12px; padding:7px 0;
    border-bottom:1px solid rgba(232,192,106,.16); }}
  .qrow:last-child {{ border-bottom:0; }}
  .dot {{ width:7px; height:7px; border-radius:50%; flex:0 0 auto; }}
  .qn {{ flex:0 0 112px; font-family:Copperplate,serif; font-size:10.5px; letter-spacing:2.4px; color:#A9B7D2; }}
  .qq {{ font-family:Cochin,Didot,serif; font-style:italic; font-size:17.5px; color:{CREAM}; }}
  .refuse {{ position:absolute; left:0; right:0; top:800px; text-align:center;
    font-family:Copperplate,"Big Caslon",serif; font-size:11.5px; letter-spacing:3px; color:{GOLD}; opacity:.95; }}
  .body {{ position:absolute; left:150px; right:150px; top:838px; text-align:center;
    font-size:13.2px; line-height:1.7; color:#AFBBD4; font-weight:500; }}
  .sig {{ position:absolute; left:84px; right:84px; bottom:54px; display:flex;
    justify-content:space-between; align-items:flex-end;
    font-family:Copperplate,"Big Caslon",serif; font-size:10px; letter-spacing:2.2px; color:#8293B2; }}
  .sig b {{ color:{CREAM}; font-weight:400; letter-spacing:2.6px; }}
  @media print {{ *{{ -webkit-print-color-adjust:exact; print-color-adjust:exact; }} }}
</style></head><body>
<div class="poster">
  <div class="glow"></div>
  <svg class="chart" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg">
    <g fill="#ffffff">
      {stars}
    </g>
    <circle cx="{cx}" cy="{cy}" r="{R + 9}" fill="none" stroke="{GOLD}" stroke-width=".8" opacity=".5"/>
    <circle cx="{cx}" cy="{cy}" r="{R + 15}" fill="none" stroke="{GOLD}" stroke-width=".8" opacity=".3"/>
    {ring_ticks}
    {seg}
      {curved_names(cx, cy, R + 34, CREAM)}
    <circle cx="{cx}" cy="{cy}" r="56" fill="none" stroke="{GOLD}" stroke-width=".8" opacity=".45"/>
    <text x="{cx}" y="{cy - 6}" text-anchor="middle" fill="#8293B2"
      font-family="Copperplate, serif" font-size="9.5" letter-spacing="3.2">YOUR</text>
    <text x="{cx}" y="{cy + 21}" text-anchor="middle" fill="{CREAM}"
      font-family="Didot, serif" font-size="26">Log</text>
    <g opacity=".95">
      <circle cx="{cx + 205}" cy="{cy - 168}" r="24" fill="{GOLD}" opacity=".10"/>
      <circle cx="{cx + 205}" cy="{cy - 168}" r="13" fill="{GOLD}" opacity=".17"/>
      <path d="M{cx + 205} {cy - 183} l4.9 10.6 11.6 1.1 -8.6 7.8 2.3 11.5 -10.2 -5.9 -10.2 5.9 2.3 -11.5 -8.6 -7.8 11.6 -1.1z" fill="{GOLD}"/>
    </g>
    <path d="M {cx + 132} {cy - 104} Q {cx + 176} {cy - 134} {cx + 192} {cy - 152}"
      fill="none" stroke="{GOLD}" stroke-width="1" stroke-dasharray="1.5 6" opacity=".55"/>
  </svg>
  <div class="vign"></div>

  <div class="eyebrow">VIBRANT LIFE &nbsp;&middot;&nbsp; BOISE &nbsp;&middot;&nbsp; AGES 16 TO 18 &nbsp;&middot;&nbsp; OPENS AUGUST 2027</div>
  <div class="rule" style="top:82px;"></div>

  <h1>Not a high school.</h1>
  <div class="qs">
    {qlist(None, None, None)}
  </div>
  <div class="refuse">{REFUSE}</div>
  <div class="body">{BODY} Ask for a copy, then come and sit in the room one evening and decide for yourselves.</div>

  <div class="sig">
    <div><b>VIBRANT LIFE &middot; THE LAUNCH PAD</b></div>
    <div style="text-align:right">ERIN STANLEY, GUIDE<br>ASK AT VIBRANT LIFE</div>
  </div>
</div>
</body></html>"""


# --------------------------------------------------------------- direction B
def direction_b() -> str:
    cx, cy, R = 408, 548, 172
    inner_ticks = ticks(cx, cy, R - 46, R - 53, 120, "#9A6B2F", 0.7, every=1, longer=10)
    outer_ticks = ticks(cx, cy, R + 20, R + 13, 48, "#9A6B2F", 0.9, every=1, longer=4)
    seg = f"""
      <path d="{arc(cx, cy, R, 3, 117)}" stroke="{ORIGIN}" stroke-width="13" fill="none"/>
      <path d="{arc(cx, cy, R, 123, 237)}" stroke="{FORGE}" stroke-width="13" fill="none"/>
      <path d="{arc(cx, cy, R, 243, 357)}" stroke="{HELM}" stroke-width="13" fill="none"/>"""
    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<title>The Launch Pad - Poster, brass plate</title>
<style>
  @page {{ size: 8.5in 11in; margin: 0; }}
  html,body {{ margin:0; padding:0; background:#F3EADA; }}
  .poster {{ position:relative; width:{W}px; height:{H}px; overflow:hidden;
    background:radial-gradient(92% 72% at 50% 36%, #FCF7EC 0%, #F4EAD8 55%, #E9DBC0 100%);
    font-family:"Avenir Next",Helvetica,sans-serif; color:#3A2E1C; }}
  .frame {{ position:absolute; inset:30px; border:1.2px solid #B99A63; }}
  .frame2 {{ position:absolute; inset:38px; border:.6px solid #CDB383; }}
  svg.plate {{ position:absolute; inset:0; }}
  .eyebrow {{ position:absolute; top:72px; left:0; right:0; text-align:center;
    font-family:Copperplate,serif; font-size:10.5px; letter-spacing:5px; color:#9A6B2F; }}
  h1 {{ position:absolute; left:0; right:0; top:100px; margin:0; text-align:center;
    font-family:"Big Caslon",Didot,serif; font-weight:400; font-size:64px; line-height:1.02;
    color:#2C2314; }}
  .qs {{ position:absolute; left:148px; right:148px; top:198px; }}
  .qrow {{ display:flex; align-items:baseline; gap:11px; padding:6px 0;
    border-bottom:1px solid rgba(154,107,47,.22); }}
  .qrow:last-child {{ border-bottom:0; }}
  .dot {{ width:7px; height:7px; border-radius:50%; flex:0 0 auto; }}
  .qn {{ flex:0 0 106px; font-family:Copperplate,serif; font-size:10px; letter-spacing:2.2px; color:#9A6B2F; }}
  .qq {{ font-family:Cochin,serif; font-style:italic; font-size:17px; color:#2C2314; }}
  .refuse {{ position:absolute; left:0; right:0; top:790px; text-align:center;
    font-family:Copperplate,serif; font-size:11px; letter-spacing:3.2px; color:#9A6B2F; }}
  .body {{ position:absolute; left:160px; right:160px; top:826px; text-align:center;
    font-size:13.2px; line-height:1.72; color:#4A3B22; font-weight:500; }}
  .sig {{ position:absolute; left:92px; right:92px; bottom:60px; text-align:center; }}
  .sig .hr {{ width:150px; height:1px; margin:0 auto 13px;
    background:linear-gradient(90deg,rgba(154,107,47,0),#9A6B2F,rgba(154,107,47,0)); }}
  .sig b {{ display:block; font-family:Copperplate,serif; font-size:11px; letter-spacing:3px; color:#2C2314; font-weight:400; }}
  .sig span {{ display:block; margin-top:6px; font-family:Cochin,serif; font-size:12.5px; color:#6B5A3C; }}
  @media print {{ *{{ -webkit-print-color-adjust:exact; print-color-adjust:exact; }} }}
</style></head><body>
<div class="poster">
  <div class="frame"></div><div class="frame2"></div>

  <svg class="plate" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="{cx}" cy="{cy}" r="{R + 13}" fill="none" stroke="#B99A63" stroke-width=".9"/>
    <circle cx="{cx}" cy="{cy}" r="{R + 20}" fill="none" stroke="#B99A63" stroke-width=".6" opacity=".7"/>
    {outer_ticks}
    {seg}
    {inner_ticks}
    <circle cx="{cx}" cy="{cy}" r="{R - 53}" fill="none" stroke="#B99A63" stroke-width=".8"/>
    <circle cx="{cx}" cy="{cy}" r="{R - 86}" fill="none" stroke="#CDB383" stroke-width=".6"/>
      {curved_names(cx, cy, R - 30, "#4A3B22", 13.5, 3.8)}
    <text x="{cx}" y="{cy - 8}" text-anchor="middle" fill="#9A6B2F"
      font-family="Copperplate, serif" font-size="9.5" letter-spacing="3.2">YOUR</text>
    <text x="{cx}" y="{cy + 21}" text-anchor="middle" fill="#2C2314"
      font-family="Big Caslon, serif" font-size="29">Log</text>
    <text x="{cx}" y="{cy + 44}" text-anchor="middle" fill="#6B5A3C"
      font-family="Cochin, serif" font-size="12" font-style="italic">carried all three years</text>
    <g>
      <path d="M{cx + 178} {cy - 178} l5.2 11.2 12.3 1.2 -9.1 8.2 2.4 12.2 -10.8 -6.3 -10.8 6.3 2.4 -12.2 -9.1 -8.2 12.3 -1.2z"
        fill="none" stroke="#9A6B2F" stroke-width="1.1"/>
      <path d="M {cx + 142} {cy - 128} Q {cx + 166} {cy - 150} {cx + 172} {cy - 160}"
        fill="none" stroke="#9A6B2F" stroke-width=".9" stroke-dasharray="1.5 5" opacity=".75"/>
    </g>
  </svg>

  <div class="eyebrow">VIBRANT LIFE &nbsp;&middot;&nbsp; BOISE &nbsp;&middot;&nbsp; AGES 16 TO 18 &nbsp;&middot;&nbsp; OPENS AUGUST 2027</div>
  <h1>Not a high school.</h1>
  <div class="qs">
    {qlist(None, None, None)}
  </div>
  <div class="refuse">{REFUSE}</div>
  <div class="body">{BODY} Ask for a copy, then come and sit in the room one evening and decide for yourselves.</div>

  <div class="sig">
    <div class="hr"></div>
    <b>VIBRANT LIFE &middot; THE LAUNCH PAD</b>
    <span>Erin Stanley, guide &middot; ask at Vibrant Life</span>
  </div>
</div>
</body></html>"""



# ------------------------------------------------------- parent sheet content
WEEK = [
    ("Mon", "The learner's own morning. Reading, claimed credit work, their project. "
            "The guide is in the building, in another room, and comes to them around noon."),
    ("Tue", "Guide morning, 9:00 to 1:00. Walk-in, settle, the work of the day, lunch at "
            "the Table, hands-on work, a short close."),
    ("Wed", "The learner's own morning, as Monday."),
    ("Thu", "Guide morning, the same shape as Tuesday, every time."),
    ("Fri", "Empty. Not earned, not filled, not on call."),
]

REFUSALS = [
    "grades, and no ranking of one learner against another.",
    "deadlines the learner didn't set themselves.",
    "reading the learner's Log. It is theirs, it leaves with them, and no copy is kept.",
    "showing a learner's work, face, or story in anything we publish.",
    "promising you who your child will be in three years. We can tell you what the mornings "
    "are. We cannot tell you what they will make of them, and we will not pretend to.",
    "filling Friday.",
]

PARENT_PROSE = {
    "what": [
        "A three-year studio at Vibrant Life, Boise, for learners who are 16 by the August "
        "they start. Not a high school. One cohort, one guide, one room, and a plan for all "
        "three years that is printed and readable by the learner.",
        "Year one asks <i>Who am I?</i> Year two asks <i>What is worth solving?</i> Year "
        "three asks <i>What do I do when there is no easy answer?</i> A learner may join at "
        "any year. The story is in progress, never behind.",
    ],
    "written": [
        "A Growth Record the learner owns: what they did, in their words and the guide's, "
        "with nothing graded. Claimed high-school credit is tracked so it can be shown. No "
        "college yet recognizes the record on its own; the dual-enrollment bridge is "
        "something we will work on with you and tell you honestly where it stands."
    ],
    "hold": [
        "It is one guide, Erin Stanley, and no aide. On guide mornings her baby is in the "
        "room, usually in a carrier. Some mornings she will be holding a child while you "
        "talk. The room holds a handful of learners, and when it is full it is full; we "
        "will say so plainly rather than keep a list warm.",
        "The guide is a coach, not a therapist. Every learner is given, in print, the name "
        "of one adult outside the room they can go to, and 988, which is free, all hours, "
        "call or text. Over a break the guide is not reachable. That is her rest too, and "
        "the plan says so.",
    ],
    "leave": [
        "Any time. The way out is written down before anyone starts, and leaving costs "
        "nothing between us. A learner who says no, or not yet, is never told they are behind."
    ],
    "next": [
        "Ask for the printed books; there are three, one per year, and the learner should "
        "read them too. Come sit in the room one evening, do the thirty-second settle "
        "yourselves, eat something at the Table, and hear the refusals read aloud. Then "
        "decide at home."
    ],
}


def _ps(key):
    return "".join(f"<p>{t}</p>" for t in PARENT_PROSE[key])


def parent_columns():
    week = "".join(
        f'<tr><td class="d">{d}</td><td>{t}</td></tr>' for d, t in WEEK
    )
    refuse = "".join(f"<li>{r}</li>" for r in REFUSALS)
    return f"""
    <div class="col">
      <section><h2>What it is</h2>{_ps("what")}</section>
      <section><h2>The week</h2>
        <table class="week">{week}</table>
        <p>Seven sessions a year with short breaks between, two weeks at winter, and three
        loose weeks in May. Dates are projected from this year's Vibrant Life calendar;
        the school sets the real ones.</p>
      </section>
    </div>
    <div class="col">
      <section><h2>What we refuse to do</h2>
        <ul class="refuse">{refuse}</ul>
        <p>These are not the small print. They are the design. A teenager can read every
        page of the plan and find nothing we hid from them.</p>
      </section>
      <section><h2>What gets written down</h2>{_ps("written")}</section>
    </div>
    <div class="col">
      <section><h2>What one guide can hold</h2>{_ps("hold")}</section>
      <section><h2>How you leave</h2>{_ps("leave")}</section>
      <section><h2>What to do next</h2>{_ps("next")}</section>
    </div>"""


PARENT_H1 = "We promise the conditions.<br>Never the outcome."
PARENT_DECK = ("What a parent asks first about the Launch Pad, answered in print: what the "
               "week is, what we refuse to do, what one guide can and cannot hold, and how "
               "you leave.")
PARENT_FOOT = ("Opens Monday 16 August 2027. Price and the written exit come with the family "
               "note. Ask at Vibrant Life, or ask Erin.")


def mini_ring(cx, cy, r, w=9, gold=GOLD):
    return f"""
      <circle cx="{cx}" cy="{cy}" r="{r + 7}" fill="none" stroke="{gold}" stroke-width=".7" opacity=".5"/>
      <path d="{arc(cx, cy, r, 3, 117)}" stroke="{ORIGIN}" stroke-width="{w}" fill="none" stroke-linecap="round"/>
      <path d="{arc(cx, cy, r, 123, 237)}" stroke="{FORGE}" stroke-width="{w}" fill="none" stroke-linecap="round"/>
      <path d="{arc(cx, cy, r, 243, 357)}" stroke="{HELM}" stroke-width="{w}" fill="none" stroke-linecap="round"/>"""


def parent_a() -> str:
    """Celestial: a night masthead over a cream reading panel. Seven blocks of
    text do not belong on a dark ground, so the drama stops where the
    information starts."""
    stars = starfield(78, seed=21, h=264, exclude=(134, 132, 104))
    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<title>The Launch Pad - Parent information sheet, celestial</title>
<style>
  @page {{ size: 8.5in 11in; margin: 0; }}
  html,body {{ margin:0; padding:0; background:#fff; }}
  .sheet {{ position:relative; width:{W}px; height:{H}px; overflow:hidden; background:#FBF8F1;
    font-family:"Avenir Next",Helvetica,sans-serif; color:#2A2B33; }}
  .mast {{ position:relative; height:264px; overflow:hidden; color:{CREAM};
    background:radial-gradient(120% 120% at 22% 40%, #1e2a55 0%, #131c3c 46%, #0a1024 78%, #070a16 100%); }}
  .mast svg {{ position:absolute; inset:0; }}
  .mast .inner {{ position:absolute; inset:0; padding:44px 50px 0 248px; box-sizing:border-box; }}
  .eyebrow {{ font-family:Copperplate,serif; font-size:10px; letter-spacing:4.6px; color:{GOLD}; }}
  h1 {{ margin:12px 0 0; font-family:Didot,"Bodoni 72",serif; font-weight:400;
    font-size:38px; line-height:1.1; color:{CREAM}; }}
  .deck {{ margin:12px 0 0; font-family:Cochin,Didot,serif; font-style:italic;
    font-size:14.5px; line-height:1.46; color:#C3CFE6; max-width:508px; }}
  .cols {{ display:grid; grid-template-columns:repeat(3,1fr); gap:0 26px; padding:22px 56px 0; }}
  section {{ margin-bottom:15px; }}
  h2 {{ margin:0 0 7px; font-family:Copperplate,serif; font-size:10.5px; letter-spacing:2.4px;
    color:#1D2750; padding-bottom:5px; border-bottom:1px solid #D8CDB6; }}
  p {{ margin:0 0 7px; font-size:11.3px; line-height:1.52; }}
  .week {{ width:100%; border-collapse:collapse; margin:0 0 7px; }}
  .week td {{ font-size:10.9px; line-height:1.4; padding:3px 0; border-bottom:1px solid #E7DECB; vertical-align:top; }}
  .week td.d {{ width:42px; font-family:Copperplate,serif; font-size:9.5px; letter-spacing:1.6px; color:#1D2750; }}
  ul.refuse {{ list-style:none; margin:0 0 8px; padding:0; }}
  ul.refuse li {{ font-size:11.3px; line-height:1.52; margin:0 0 4px; padding-left:25px; position:relative; }}
  ul.refuse li::before {{ content:"No"; position:absolute; left:0;
    font-family:Copperplate,serif; font-size:9px; letter-spacing:1.4px; color:{ORIGIN}; top:1px; }}
  .foot {{ position:absolute; left:56px; right:56px; bottom:30px; padding-top:10px;
    border-top:1px solid #D8CDB6; display:flex; justify-content:space-between; align-items:flex-end; }}
  .foot b {{ font-family:Copperplate,serif; font-size:10px; letter-spacing:2.6px; color:#1D2750; font-weight:400; }}
  .foot span {{ font-family:Cochin,serif; font-size:11.5px; color:#6B6550; text-align:right; max-width:420px; }}
  @media print {{ *{{ -webkit-print-color-adjust:exact; print-color-adjust:exact; }} }}
</style></head><body>
<div class="sheet">
  <div class="mast">
    <svg viewBox="0 0 {W} 264" xmlns="http://www.w3.org/2000/svg">
      <g fill="#ffffff">{stars}</g>
      {mini_ring(134, 132, 72, 8)}
      <circle cx="134" cy="132" r="29" fill="none" stroke="{GOLD}" stroke-width=".7" opacity=".45"/>
      <text x="134" y="128" text-anchor="middle" fill="#8293B2" font-family="Copperplate, serif"
        font-size="8" letter-spacing="2.6">YOUR</text>
      <text x="134" y="149" text-anchor="middle" fill="{CREAM}" font-family="Didot, serif" font-size="18">Log</text>
    </svg>
    <div class="inner">
      <div class="eyebrow">VIBRANT LIFE &nbsp;&middot;&nbsp; BOISE &nbsp;&middot;&nbsp; AGES 16 TO 18</div>
      <h1>{PARENT_H1}</h1>
      <div class="deck">{PARENT_DECK}</div>
    </div>
  </div>
  <div class="cols">{parent_columns()}</div>
  <div class="foot"><b>VIBRANT LIFE &middot; THE LAUNCH PAD</b><span>{PARENT_FOOT}</span></div>
</div>
</body></html>"""


def parent_b() -> str:
    """Brass plate: all parchment, engraved rules, the ring as a small plate
    beside the masthead."""
    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<title>The Launch Pad - Parent information sheet, brass plate</title>
<style>
  @page {{ size: 8.5in 11in; margin: 0; }}
  html,body {{ margin:0; padding:0; background:#F3EADA; }}
  .sheet {{ position:relative; width:{W}px; height:{H}px; overflow:hidden; box-sizing:border-box;
    background:radial-gradient(95% 70% at 50% 18%, #FCF7EC 0%, #F5EBDA 58%, #EADCC2 100%);
    font-family:"Avenir Next",Helvetica,sans-serif; color:#3A2E1C; }}
  .frame {{ position:absolute; inset:26px; border:1.2px solid #B99A63; pointer-events:none; }}
  .frame2 {{ position:absolute; inset:33px; border:.6px solid #CDB383; pointer-events:none; }}
  .mast {{ position:relative; padding:58px 60px 0 230px; }}
  .mast svg {{ position:absolute; left:52px; top:44px; }}
  .eyebrow {{ font-family:Copperplate,serif; font-size:10px; letter-spacing:4.6px; color:#9A6B2F; }}
  h1 {{ margin:13px 0 0; font-family:"Big Caslon",Didot,serif; font-weight:400;
    font-size:44px; line-height:1.08; color:#2C2314; }}
  .deck {{ margin:14px 0 0; font-family:Cochin,serif; font-style:italic; font-size:15.5px;
    line-height:1.5; color:#6B5A3C; max-width:470px; }}
  .hr {{ margin:26px 60px 0; height:1px; background:#B99A63; opacity:.75; }}
  .cols {{ display:grid; grid-template-columns:repeat(3,1fr); gap:0 26px; padding:22px 60px 0; }}
  section {{ margin-bottom:18px; }}
  h2 {{ margin:0 0 7px; font-family:Copperplate,serif; font-size:10.5px; letter-spacing:2.4px;
    color:#9A6B2F; padding-bottom:5px; border-bottom:1px solid #D9C49A; }}
  p {{ margin:0 0 8px; font-size:11.8px; line-height:1.58; color:#45382270; color:#453822; }}
  .week {{ width:100%; border-collapse:collapse; margin:0 0 8px; }}
  .week td {{ font-size:11.4px; line-height:1.45; padding:4px 0; border-bottom:1px solid #E2D3B4; vertical-align:top; color:#453822; }}
  .week td.d {{ width:42px; font-family:Copperplate,serif; font-size:9.5px; letter-spacing:1.6px; color:#9A6B2F; }}
  ul.refuse {{ list-style:none; margin:0 0 8px; padding:0; }}
  ul.refuse li {{ font-size:11.8px; line-height:1.58; margin:0 0 5px; padding-left:26px; position:relative; color:#453822; }}
  ul.refuse li::before {{ content:"No"; position:absolute; left:0;
    font-family:Copperplate,serif; font-size:9.5px; letter-spacing:1.4px; color:#9A6B2F; top:1px; }}
  .foot {{ position:absolute; left:60px; right:60px; bottom:46px; padding-top:12px;
    border-top:1px solid #B99A63; display:flex; justify-content:space-between; align-items:flex-end; }}
  .foot b {{ font-family:Copperplate,serif; font-size:10px; letter-spacing:2.6px; color:#2C2314; font-weight:400; }}
  .foot span {{ font-family:Cochin,serif; font-size:11.5px; color:#6B5A3C; text-align:right; max-width:420px; }}
  @media print {{ *{{ -webkit-print-color-adjust:exact; print-color-adjust:exact; }} }}
</style></head><body>
<div class="sheet">
  <div class="frame"></div><div class="frame2"></div>
  <div class="mast">
    <svg width="150" height="150" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
      {mini_ring(75, 75, 58, 8, "#B99A63")}
      <circle cx="75" cy="75" r="24" fill="none" stroke="#B99A63" stroke-width=".7"/>
      <text x="75" y="72" text-anchor="middle" fill="#9A6B2F" font-family="Copperplate, serif"
        font-size="7.5" letter-spacing="2.4">YOUR</text>
      <text x="75" y="90" text-anchor="middle" fill="#2C2314" font-family="Big Caslon, serif" font-size="18">Log</text>
    </svg>
    <div class="eyebrow">VIBRANT LIFE &nbsp;&middot;&nbsp; BOISE &nbsp;&middot;&nbsp; AGES 16 TO 18</div>
    <h1>{PARENT_H1}</h1>
    <div class="deck">{PARENT_DECK}</div>
  </div>
  <div class="hr"></div>
  <div class="cols">{parent_columns()}</div>
  <div class="foot"><b>VIBRANT LIFE &middot; THE LAUNCH PAD</b><span>{PARENT_FOOT}</span></div>
</div>
</body></html>"""


if __name__ == "__main__":
    out = {
        "poster-A-celestial.html": direction_a(),
        "poster-B-orrery.html": direction_b(),
        "parent-A-celestial.html": parent_a(),
        "parent-B-orrery.html": parent_b(),
    }
    for name, html in out.items():
        (HERE / name).write_text(html)
    print("wrote " + ", ".join(out))
