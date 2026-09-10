#!/usr/bin/env python3
"""Render a Launch Pad lesson plan book (markdown) into an enticing, flip-through PDF.

Pipeline: strip the md front matter -> pandoc (md -> html5) -> post-process
(session badges, note cards) -> wrap in a designed HTML template with print CSS
-> weasyprint -> PDF.

Usage: python3 build_pdf.py origin   (or forge / helm / all)
"""
import re, subprocess, sys, pathlib, html

HERE = pathlib.Path(__file__).resolve().parent
BOOKS_DIR = HERE.parent

# Per-book config. Each year gets its own warm accent so the set reads as a family.
BOOKS = {
    "origin": {
        "md": BOOKS_DIR / "origin-lesson-plan-book.md",
        "out": HERE / "The-Origin-Year-Lesson-Plan-Book.pdf",
        "title": "The Origin Year",
        "kicker": "LAUNCH PAD  ·  A GUIDE'S LESSON PLAN BOOK",
        "question": "Who am I?",
        "accent": "#B0743A",       # brass / amber
        "accent_dark": "#7C4F26",
        "tint": "#FBF6EE",         # warm cream
    },
    "forge": {
        "md": BOOKS_DIR / "forge-lesson-plan-book.md",
        "out": HERE / "The-Forge-Year-Lesson-Plan-Book.pdf",
        "title": "The Forge Year",
        "kicker": "LAUNCH PAD  ·  A GUIDE'S LESSON PLAN BOOK",
        "question": "What is worth solving?",
        "accent": "#9E5231",       # deep rust / iron
        "accent_dark": "#6E3720",
        "tint": "#FBF3EE",
    },
    "helm": {
        "md": BOOKS_DIR / "helm-lesson-plan-book.md",
        "out": HERE / "The-Helm-Year-Lesson-Plan-Book.pdf",
        "title": "The Helm Year",
        "kicker": "LAUNCH PAD  ·  A GUIDE'S LESSON PLAN BOOK",
        "question": "What do I do when there is no easy answer?",
        "accent": "#2F6E6A",       # deep teal / sea
        "accent_dark": "#1E4B48",
        "tint": "#EEF5F4",
    },
}

CSS = """
@page {{
  size: Letter;
  margin: 22mm 21mm 18mm 21mm;
  @top-center {{ content: "{title}   ·   Launch Pad"; font-family: {sans}; font-size: 8pt;
                 letter-spacing: .14em; color: #C3B8A8; text-transform: uppercase; }}
  @bottom-center {{ content: counter(page); font-family: {sans}; font-size: 9pt; color: #B9AE9E; }}
}}
@page cover  {{ margin: 0; @top-center {{ content: none; }} @bottom-center {{ content: none; }} }}
@page glance {{ @top-center {{ content: none; }} }}

html {{ font-family: {serif}; color: #2A2622; font-size: 11.5pt; line-height: 1.62; }}
body {{ margin: 0; }}
p {{ margin: 0 0 .7em 0; }}
strong {{ color: {accent_dark}; }}
em {{ color: #4a423a; }}
a {{ color: {accent_dark}; text-decoration: none; }}

/* ---------- cover ---------- */
.cover {{ page: cover; height: 100vh; box-sizing: border-box; background: {tint};
          border-top: 10mm solid {accent}; display: flex; flex-direction: column;
          justify-content: center; padding: 0 26mm; }}
.cover .kicker {{ font-family: {sans}; font-size: 10pt; letter-spacing: .28em; color: {accent_dark};
                  text-transform: uppercase; margin-bottom: 10mm; }}
.cover h1.ttl {{ font-family: {serif}; font-weight: 700; font-size: 46pt; line-height: 1.02;
                 margin: 0 0 8mm 0; color: #241f1b; letter-spacing: -.01em;
                 border: none; break-before: avoid; }}
.cover h1.ttl::before {{ content: none; }}
.cover .rule {{ width: 44mm; height: 3px; background: {accent}; margin: 0 0 12mm 0; }}
.cover .question {{ font-family: {serif}; font-style: italic; font-size: 25pt; line-height: 1.2;
                    color: {accent_dark}; margin: 0 0 12mm 0; }}
.cover .sub {{ font-family: {sans}; font-size: 11pt; line-height: 1.5; color: #6b6156; max-width: 118mm; }}
.cover .foot {{ margin-top: 22mm; font-family: {sans}; font-size: 9.5pt; letter-spacing: .1em;
                color: #9a8f80; text-transform: uppercase; }}

/* ---------- at-a-glance contents ---------- */
.glance {{ page: glance; break-before: page; break-after: page; padding-top: 6mm; }}
.glance h2.gtitle {{ font-family: {sans}; font-size: 13pt; letter-spacing: .18em; text-transform: uppercase;
                     color: {accent_dark}; border: none; padding: 0; margin: 0 0 8mm 0; }}
.glance .part {{ font-family: {serif}; font-size: 16pt; color: #241f1b; margin: 7mm 0 2mm 0; }}
.glance .part .q {{ font-style: italic; color: {accent_dark}; font-size: 13pt; }}
.glance ol {{ list-style: none; margin: 1mm 0 0 0; padding: 0; }}
.glance ol li {{ font-family: {serif}; font-size: 11pt; color: #4a423a; padding: 1.6mm 0;
                 border-bottom: 1px solid #EDE4D6; display: flex; }}
.glance ol li .n {{ font-family: {sans}; font-weight: 700; color: {accent}; width: 9mm; }}

/* ---------- part divider (h1) ---------- */
h1 {{ break-before: page; string-set: part content();
      font-family: {sans}; font-weight: 700; font-size: 26pt; line-height: 1.1;
      color: #241f1b; margin: 30mm 0 2mm 0; padding-bottom: 5mm;
      border-bottom: 3px solid {accent}; }}
h1::before {{ content: "";  display: block; width: 18mm; height: 4px; background: {accent}; margin-bottom: 7mm; }}

/* ---------- section headers (h2) ---------- */
h2 {{ font-family: {sans}; font-weight: 700; font-size: 15pt; color: {accent_dark};
      margin: 9mm 0 2.5mm 0; line-height: 1.25; break-after: avoid; }}

/* session cards: h2 whose text began with "Session N" (tagged in post-process) */
h2.session {{ break-before: page; background: {tint}; border-left: 5px solid {accent};
              padding: 6mm 7mm; margin: 0 0 5mm 0; display: flex; align-items: baseline;
              font-size: 17pt; color: #241f1b; }}
h2.session .snum {{ font-family: {serif}; font-weight: 700; font-size: 30pt; color: {accent};
                    margin-right: 6mm; line-height: 1; }}
h2.session .sdur {{ display: block; font-family: {sans}; font-weight: 400; font-size: 9.5pt;
                    letter-spacing: .06em; text-transform: uppercase; color: #9a8f80; margin-top: 2mm; }}
h3 {{ font-family: {sans}; font-weight: 700; font-size: 12pt; color: #3a332c; margin: 6mm 0 2mm 0; }}

/* ---------- spoken-line cards (blockquotes) ---------- */
blockquote {{ margin: 3.5mm 0; padding: 4mm 6mm 4mm 6mm; background: #fff;
              border: 1px solid #EBE1D2; border-left: 4px solid {accent};
              border-radius: 2px; color: #3a332c; break-inside: avoid; }}
blockquote::before {{ content: "SAY"; display: block; font-family: {sans}; font-size: 7.5pt;
                      letter-spacing: .18em; color: {accent}; margin-bottom: 1.5mm; }}
blockquote p {{ margin: 0; font-size: 11pt; line-height: 1.5; }}
blockquote p + p {{ margin-top: 2mm; }}

/* ---------- note / seam cards (standalone italic paragraphs) ---------- */
p.note {{ background: {tint}; border-radius: 3px; padding: 4mm 6mm; margin: 4mm 0;
          font-size: 10.5pt; color: #5a5148; break-inside: avoid; }}
p.note em {{ color: #5a5148; }}

/* lists */
ul, ol {{ margin: 0 0 .7em 0; padding-left: 6mm; }}
li {{ margin: 0 0 1.5mm 0; }}

hr {{ border: none; border-top: 1px solid #EDE4D6; margin: 7mm 0; }}
"""

SANS = "'Avenir Next', 'Helvetica Neue', Helvetica, Arial, sans-serif"
SERIF = "'Palatino Linotype', Palatino, 'Iowan Old Style', Georgia, 'Times New Roman', serif"


def parse_front_and_body(md_text):
    """Return (subtitle, body_md) with the title line, subtitle, and leading rule stripped."""
    lines = md_text.splitlines()
    subtitle = ""
    out = []
    i = 0
    # drop leading blank lines
    while i < len(lines) and not lines[i].strip():
        i += 1
    # title line (# ...)
    if i < len(lines) and lines[i].startswith("# "):
        i += 1
    # blanks
    while i < len(lines) and not lines[i].strip():
        i += 1
    # subtitle: an italic *...* line
    if i < len(lines) and lines[i].strip().startswith("*") and lines[i].strip().endswith("*"):
        subtitle = lines[i].strip().strip("*").strip()
        i += 1
    # blanks + a single leading --- rule
    while i < len(lines) and not lines[i].strip():
        i += 1
    if i < len(lines) and lines[i].strip() == "---":
        i += 1
    body = "\n".join(lines[i:])
    return subtitle, body


def build_glance(md_text):
    """Build the 'year at a glance' contents from # Part and ## Session headings."""
    parts = []
    cur = None
    for ln in md_text.splitlines():
        m1 = re.match(r"^# (Part .+)$", ln)
        m2 = re.match(r"^## Session (\d+) - (.+)$", ln)
        if m1:
            cur = {"title": m1.group(1), "sessions": []}
            parts.append(cur)
        elif m2 and cur is not None:
            title = m2.group(2)
            cur["sessions"].append((m2.group(1), title))
    frag = ['<section class="glance"><h2 class="gtitle">The year at a glance</h2>']
    for p in parts:
        frag.append(f'<div class="part">{html.escape(p["title"])}</div>')
        if p["sessions"]:
            frag.append("<ol>")
            for n, t in p["sessions"]:
                frag.append(f'<li><span class="n">{n}</span><span>{html.escape(t)}</span></li>')
            frag.append("</ol>")
    frag.append("</section>")
    return "\n".join(frag)


def pandoc(body_md):
    r = subprocess.run(
        ["pandoc", "-f", "markdown+smart", "-t", "html5"],
        input=body_md, capture_output=True, text=True, check=True,
    )
    return r.stdout


def post_process(body_html):
    # session h2 -> badge (Session N - Title (duration))
    def sess(m):
        num, title = m.group(1), m.group(2)
        dur = ""
        dm = re.search(r"\s*\(([^)]+)\)\s*$", title)
        if dm:
            dur = dm.group(1)
            title = title[: dm.start()].strip()
        badge = f'<span class="snum">{num}</span><span>{title}'
        if dur:
            badge += f'<span class="sdur">{html.escape(dur)}</span>'
        badge += "</span>"
        return f'<h2 class="session">{badge}</h2>'
    body_html = re.sub(r"<h2[^>]*>Session (\d+) - (.*?)</h2>", sess, body_html, flags=re.S)
    # standalone italic paragraphs -> note cards (the seam rule, author notes)
    body_html = re.sub(r"<p><em>(.*?)</em></p>", r'<p class="note"><em>\1</em></p>', body_html, flags=re.S)
    return body_html


def render(key):
    cfg = BOOKS[key]
    md_text = pathlib.Path(cfg["md"]).read_text()
    subtitle, body_md = parse_front_and_body(md_text)
    glance = build_glance(md_text)
    body_html = post_process(pandoc(body_md))

    css = CSS.format(accent=cfg["accent"], accent_dark=cfg["accent_dark"], tint=cfg["tint"],
                     title=cfg["title"], sans=SANS, serif=SERIF)
    doc = f"""<!doctype html><html><head><meta charset="utf-8"><style>{css}</style></head><body>
<section class="cover">
  <div class="kicker">{html.escape(cfg["kicker"])}</div>
  <h1 class="ttl">{html.escape(cfg["title"])}</h1>
  <div class="rule"></div>
  <div class="question">{html.escape(cfg["question"])}</div>
  <div class="sub">{html.escape(subtitle)}</div>
  <div class="foot">Vibrant Life</div>
</section>
{glance}
{body_html}
</body></html>"""

    # sanity: no em/en dashes should survive into the render
    bad = doc.count("—") + doc.count("–")
    html_out = pathlib.Path(cfg["out"]).with_suffix(".html")
    html_out.write_text(doc)

    from weasyprint import HTML
    HTML(string=doc, base_url=str(HERE)).write_pdf(str(cfg["out"]))
    print(f"{key}: wrote {cfg['out'].name}  (em/en dashes in render: {bad})")


if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "origin"
    keys = list(BOOKS) if which == "all" else [which]
    for k in keys:
        render(k)
