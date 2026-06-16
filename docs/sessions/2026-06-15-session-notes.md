# Session Notes - 2026-06-15

A re-anchor document for picking up where this session left off. Substantial day across operational deployment, security, architectural changes, visual landscape redesigns, and welcome-page design.

---

## Shipped to production

### Operational deployment (Hero's Compass live)

- **GitHub org**: `Vibrant-Life-208` created (admin owner: `vibrantlife208guides-ship-it` personal account)
- **Repo**: `vibrant-life-compass` public at https://github.com/Vibrant-Life-208/vibrant-life-compass
- **Vercel deploy**: Live at https://vibrant-life-compass.vercel.app/ with auto-deploy on push to main
- **Supabase backend**: Schema applied (14 tables, RLS armed)
  - Project URL: `https://obnivpzwunxiyupnarca.supabase.co`
  - Publishable key: `sb_publishable_djOkZhISeai_ZPAjrMTiHQ_I7I1_Wir`
- **Founding guide account**: Jenna Jones (`jenna@vibrantlife.local`)
- **Captain's guide account**: Erin S. Guide (`erin-s-guide@vibrantlife.local`)

### Security - TCC pre-launch scan, all MUST-FIX closed

1. HTTP security headers via `vercel.json`: X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy (camera/mic/geo/payment all denied), full CSP
2. Supabase JS pinned to specific version `2.108.1` (was `@2` tag - supply-chain hardened)
3. `everyone_posts` policies tightened with author_id enforcement + new guide moderation policy

### Architectural changes

- **8 sessions** per cycle, unified calendar for all roles (was 7 sessions + separate `guide-summer` calendar for guides only)
- **Session 8 = Summer cycle** (June 1 - mid-Aug, ~11 weeks)
- Dynamic calendar via `getYearCalendar(today)` - auto-rolls each Aug 17 without manual updates
- Anchor copy updated to "Your anchor for the cycle" (was "until Session 7")

### Documentation in repo

- `docs/research/2026-06-14-quest-cycle-architecture-research-brief.md` (326 lines, 3 research arcs covering developmental psychology, vulnerability research, and critical scholarship on business frameworks in K-12)
- `docs/design/2026-06-14-quest-cycle-onboarding-spec-v0.1.md` (360 lines, first-run flow proposal for Adventure + Launch Pad)

### Visual landscape redesigns (all 6 unique scenes refined)

| Scene | Key elements added/refined |
|---|---|
| **Desert** | Camel silhouette on left dune peak (facing right, smaller, hump overlap, proportional neck), darker sand foreground raised to road horizon |
| **Forest** | Ground band (y=500-600), 14 background trees + 6 mid trees + 4 foreground trees pushed back, 10 fern-shaped grass clusters along road, 26 meadow wildflowers (white/yellow/purple/pink) |
| **Arctic** | Snow ground band raised from y=555 to y=510 to meet road tip |
| **City** | Three-layer dense building walls (back/mid/front, atmospheric perspective from lighter haze to dark towers), thin curb lines at road edges, ground floor band, tiered window lights |
| **Ocean** | 2 swaying seagulls in M-shape wings (bodies at V valley, orange beaks), fish in CSS-animated diving arc loop, perspective dock + waves |
| **Mountain** | Brown ground band, cave tunnel opening at trail vanishing point (dark arched silhouette with inner shadow), snow caps on both front and back range peaks |

### Welcome page design (drafted, captain approved content)

Captain decisions logged in this session:

- **Title**: "Welcome, Guide." (role-frame, short)
- **Intro**: 8-session structure (7 school year + 1 summer) named explicitly
- **Late-start context**: works for any role at any session/week, shows session name with parenthetical for Session 8 ("Session 8 (Summer)"), no apology framing
- **Role taglines**:
  - Guide: "As a guide, you walk this path alongside your learners. Your own anchor matters too." (removed "first" - only captain is walking first)
  - Learner: "This is your year. Set your course. Walk it your way."
  - Parent: "Walk alongside your learner - Compass gives you a place to support them, and a place to walk your own path." (distinguished from guide and learner)
- **What's next preview**: "In a moment, you'll set your anchor for this cycle: a quote that carries you, your natural values, and the character strengths you want to lean into."

### Onboarding upgrade decisions (designed, not yet built)

Replacing the current 5-character-traits text input with:

- **Character Strengths**: Link out to VIA Survey (age-appropriate version per studio), user enters top 3 strengths
- **Values**: Link out to Values Institute (15-min assessment, action plan output)

VIA has three age-tier surveys covering the full Compass range:
- VIA Adult Survey (guides + parents)
- VIA Youth Survey ages 10-17 (Discovery / Adventure / Launch Pad)
- Character Strengths Inventory for Children CSI-C ages 7-12 / CSI-EC ages 3-6 (Sparks)

### Other polish shipped

- Modal backdrop: 70% black overlay + 8px backdrop-filter blur (was 40% no blur)
- Modal-content: sage-pale tinted sheer back with frosted-glass effect (was solid warm-white)
- Modal primary button: warm light-brown text instead of warm-white (better contrast against sage)
- Sign-out button: fixed (was broken when user had persisted Supabase session)
- Bearing-screen Begin button: solid sage with cream text and light-beige border (was transparent outline that faded into landscape behind)
- Welcome Begin button: warm-beige text with higher specificity selector
- Compass codebase first deployment + ongoing iteration

---

## Open / Pending - tomorrow's queue

### Top priority

1. **Welcome page still not displaying** - diagnostics shipped in v65 (console.log instrumentation + position-fixed overlay + show-first-in-onSignedIn flow). Tomorrow open browser DevTools Console on sign-in and capture the `[welcome]` log output to identify the silent failure. Likely culprit candidates: a JS error before reaching the welcome check, or a CSS specificity issue we haven't seen.
2. **Values + Character Strengths onboarding build** - design decided (link out to VIA + Values Institute, capture results in Compass), implementation pending. Replaces the 5-traits text input. Needs: new modal layout with three sections (quote / values / strengths), database columns for storing each, links to external assessments, copy-paste-in-UI for top results.
3. **Bulk import of 70 learners** - gated on captain's onboarding completing (sign in, walk through welcome + values + strengths, then access Guide dashboard's bulk-import section).

### Secondary / when capacity allows

4. **Per-studio scenes** - currently all studios see the same scene mapped to session number. Could be enhanced with studio-specific palette variations.
5. **Instructions page** - currently a "coming soon" alert placeholder linked from the welcome page.
6. **Production restore of cycle-based welcome trigger** - currently set to always-show (line `return true;` in `js/welcome.js` `shouldShowWelcome` function) to support captain iteration. Restore the localStorage check when welcome flow is finalized.

---

## Where things stand at close

| Surface | State |
|---|---|
| Compass production deploy | Live and verified |
| Security pre-launch | TCC sign-off complete |
| Captain's guide account | Created and confirmed |
| Welcome page (display) | Code shipped, not displaying - tomorrow's first diagnostic |
| Welcome page (content) | Drafted, captain reviewed and approved |
| Values + Strengths integration | Design decided, not built |
| 70-account bulk import | Queued behind welcome + onboarding completion |

---

## Quick re-anchor for tomorrow

1. **Pick up at**: welcome page display debug (the console-log output from `[welcome]` instrumentation should immediately reveal what's failing)
2. **Then**: build values + character strengths onboarding flow
3. **Then**: run the bulk import of 70 learners
4. **Captain's working URL**: https://vibrant-life-compass.vercel.app/
5. **Captain's hero name**: `erin-s-guide` (password written down on paper)

---

*Session notes captured by Claude on captain authorization. Service worker cache version at close: v65.*
