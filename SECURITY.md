# Security Posture - Hero's Compass for Vibrant Life

*Last updated: 2026-05-12. Maintained alongside the codebase. Pre-deployment checklist for Vibrant Life staff, privacy counsel, and security reviewers.*

---

## Threat model

Hero's Compass is a closed-system goal-tracking PWA for one Acton-shaped school (Vibrant Life, ~300 users over a multi-year lifespan including ~80 learners + parents + guides). The threats we design against:

| Threat | Source | Mitigation |
|---|---|---|
| Casual data leak between learners on a shared studio iPad | A learner who forgot to sign out | Per-reveal confirmation on passwords + auto-hide; per-learner data scoping; session timeout (TBD) |
| Credential theft | Plaintext at rest | AES-GCM 256 encryption with non-extractable IndexedDB key |
| Peer surveillance | Learner-to-learner visibility | No broadcast surface; 1:1 partnership only; goals/journals never visible to peers |
| Parent over-reach | Parent reading day-by-day journals | Parent view restricted to session-level goals + end-of-session recap only |
| Vendor data extraction | Third-party services consuming child data | No third-party scripts. No analytics. No fonts from CDNs. No tracking |
| Account takeover | Stolen Google identity | Local auth (username + password) - no Google OAuth, no email exposure |
| Network sniffing | Wifi attacker | TLS for all traffic when Supabase backend is active; local-VPN deployment for in-school traffic |
| Insider abuse | Disgruntled staff with backend access | Supabase Row Level Security policies enforce per-user access even at the DB layer |

## Identity model (local auth only)

Hero's Compass does not use Google OAuth, social login, or any external identity provider. Captain decision 2026-05-12: protect child identity by keeping authentication entirely inside Vibrant Life's control.

- **Username = Hero name** chosen by the learner (e.g. `liam-discovery`). Lowercase. Hyphens. Not an email. Not their full real name unless they want.
- **Password** is learner-chosen, 8+ characters, hashed server-side with bcrypt (via Supabase Auth). Plaintext never reaches the database or our codebase.
- **Synthetic email** is generated internally (`<heroname>@vibrantlife.local`) only as a unique identifier for Supabase Auth's email-password mechanism. It is never displayed, never tied to a real inbox, never deliverable.
- **Account creation** is guide-led. A guide opens an admin tool, enters a hero name, the system creates the account with a temporary password handed to the learner on paper.
- **Password recovery** is guide-led. No "email me a reset link" flow exists - there is no email to send to. If a learner forgets, their guide resets via the admin tool.

## What is encrypted, and how

| Data | At rest | In transit | Plaintext lifetime |
|---|---|---|---|
| Hero name / role / studio | Not encrypted (not secret; visible by design to learner + parents + guides) | TLS | N/A |
| Year goals + session goals + tasks | Not encrypted (visible to learner + parents + guides) | TLS | N/A |
| Motivational quote, character traits | Not encrypted (visible to learner + parents + guides) | TLS | N/A |
| External-service passwords (Khan, Lexia, etc.) | AES-GCM 256 envelope `{ ct, iv }` per password | TLS | Visible for 10 seconds when learner taps Reveal, then auto-hidden |
| Hero's Compass password itself | bcrypt hash via Supabase Auth | TLS | Plaintext only during login submission |

### External-service password encryption details

- Algorithm: AES-GCM 256
- Key: per-learner symmetric key, generated on first password save
- Key storage: IndexedDB as a non-extractable `CryptoKey` object - the raw bytes of the key are never accessible to JavaScript
- IV: 12 random bytes per encryption, stored alongside the ciphertext
- Test: `JSON.stringify(localStorage)` searched for known plaintext returns false (verified during Decision 4 ship)

## Data scope per role

| Role | Year goals | Session goals | Daily tasks | Partner | Patterns | Passwords | Quote/Traits |
|---|---|---|---|---|---|---|---|
| Learner (self) | r/w | r/w | r/w | r/w (1:1 only) | r | r/w | r/w |
| Parent (linked) | none | read-only, plus end-of-session recap | none | none | none | none | none |
| Guide (assigned) | read | read | read | read | read | read | read |
| Peer learners | none | none | none | none | none | none | none |
| Unauthenticated | none | none | none | none | none | none | none |

Enforced at:
- **App layer:** view configurations restrict tabs per role (see `js/app.js` `TABS_BY_ROLE`)
- **Backend layer:** Supabase Row Level Security policies (see `supabase/schema.sql`) — each user's `auth.uid()` is checked against the `my_visible_learners` view before any read or write

## What is **not** collected

- No email addresses (real or otherwise)
- No phone numbers
- No physical addresses
- No payment info
- No analytics events
- No third-party script execution
- No fonts loaded from CDNs (we use system serif/sans only)
- No cookies beyond Supabase Auth's session cookie

## Pre-deployment technical checklist

Things we have shipped:

- [x] Password encryption at rest (Decision 4)
- [x] Per-learner data scoping in app layer
- [x] Per-learner RLS policies in Supabase schema
- [x] No external scripts, CDNs, or trackers
- [x] HTML escaping on all user-authored content rendered to DOM
- [x] No `eval()` or dynamic-`Function()` use anywhere
- [x] Service Worker network-first for code (so emergency fixes deploy fast)
- [x] No learner-to-learner broadcast surface (Everyone Page removed)

Things owed before learners use the system:

- [ ] **TLS / HTTPS certificate** — Cloudflare proxy or Let's Encrypt cert if internet-facing; self-signed if local-VPN only
- [ ] **Content Security Policy** header in index.html restricting script sources
- [ ] **Subresource Integrity** on any future third-party scripts (none currently)
- [ ] **Session timeout** for shared-device safety (e.g. auto-logout after 30 minutes idle on studio iPads)
- [ ] **Penetration test** — one-day review covering OWASP Top 10
- [ ] **Backup strategy** — nightly Supabase exports stored encrypted on Vibrant Life's network. Quarterly restore drill.
- [ ] **Incident response plan** — who at Vibrant Life is notified within 24h of a breach? What gets disclosed to families and when?
- [ ] **Account lifecycle policy** — what happens to a learner's data when they leave Vibrant Life or graduate? Archive? Auto-delete after N years? Hand to family?
- [ ] **Vulnerability disclosure** — `SECURITY.txt` at the root of the deployed site with a contact for responsible disclosure (could be `security@vibrantlife.org`)

## Pre-deployment legal / contractual checklist

These items need real privacy counsel, not just code. A one-hour consult with a privacy-tech lawyer before launch is the highest-leverage protection Vibrant Life can buy.

- [ ] **Privacy policy** — written for families. What data we collect, how long we keep it, who sees it, how to request deletion or export.
- [ ] **Terms of service** — what parents agree to when their child uses the app.
- [ ] **COPPA compliance documentation** — even without external auth, COPPA applies because we collect data from learners under 13. The parental-consent paragraph in Vibrant Life's existing enrollment paperwork is the structural answer; the privacy policy makes it complete.
- [ ] **Data Processing Agreement (DPA) with Supabase** — Supabase offers one. Vibrant Life signs it.
- [ ] **Domain registration** if internet-accessible — register `vibrantlife.org` (or similar) with a privacy-respecting registrar (Hover, Porkbun, Namecheap; not GoDaddy). WHOIS privacy enabled.
- [ ] **Hosting provider terms** — read them. Supabase covers most needs.
- [ ] **Open-source license** — does Vibrant Life want this codebase to be shareable with other Acton schools? MIT or Apache 2.0 if yes; keep the repo private if no.
- [ ] **Cyber liability insurance** — if Vibrant Life carries one, their policy may name specific security requirements that need to be satisfied before learners use the app.

## Reporting a vulnerability

If you find a security issue in Hero's Compass, please contact Vibrant Life's designated security email (to be assigned) before public disclosure. A 90-day responsible-disclosure window is requested. Fixes will be deployed to the running instance and noted in the changelog.

## Code review for this checklist

Reviewers requested:

- **Tutela** (Evoke, Privacy Guardian) — boundary architecture and encryption review
- **Worf** (Enterprise, Privacy Architecture Steward) — threat model and cryptographic implementation
- **La'an Noonien-Singh** (Enterprise, Zero-Trust Systems Engineer) — RLS and auth flow review
- **Sarek of Vulcan** (Enterprise, Policy Transparency Keeper) — legal / contractual checklist review
- **Privacy-tech counsel** — final human-lawyer review before learners use the system

## Version

This document tracks the security posture at commit `HEAD`. When changes are made to the app's data handling, encryption, auth, or data flow, update this document in the same PR.

*Maintained for Vibrant Life. Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>*
