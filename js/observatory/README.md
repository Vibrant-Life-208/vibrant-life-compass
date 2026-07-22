# Observatory environments — module convention (Phase 1+)

The rebuilt UI ("Observatory") renders one **environment** per view-module, in **light-DOM Lit**,
on top of the untouched `store.js` backend, behind the strangler-fig seam + flag. Copy this pattern
for every environment.

## The pattern

Each environment lives at `js/observatory/<env>.js` and exports:

```js
export async function render<Env>(learnerId, session) { ... }
```

- Mount a **light-DOM** Lit component (`createRenderRoot() { return this; }`) into the tab
  container: `document.getElementById('<env>-view')`.
- Read/write **only** via `store.js` (never a rival data layer).
- Carry per-item state as an **enum** — `frame | dressed | energy` — **never a number/total/rollup**,
  so a completeness meter is structurally unbuildable (see `COMPASS-REBUILD-BRIEF`).
- Import Lit from the vendored, offline-safe files:
  `import { LitElement, html } from '../vendor/lit-core.min.js';`

## Wiring (in `js/app.js`)

```js
import { render<Env> } from './observatory/<env>.js';
const observatoryViews = { '<env>-view': render<Env>, /* ... */ };
```

The seam in `showTab()` calls the observatory view only if the env is registered **AND** the user is
enrolled (`js/flags.js`); everyone else falls through to the legacy chain. Flip the flag = instant rollback.

## Rules

- Animate **`opacity`/`transform` only** — never `box-shadow`/`filter` blur (low-end jank).
- **Reduced-motion** static end-frame for every state; **never color-alone**; `aria-label` on state.
- **Draft-persistence:** nothing a learner types is ever lost (see the Academics env for the pattern).
- When an env first imports Lit, add the vendored files to `sw.js` CORE and bump the cache.

## Environment types (not every environment is a goal)

Build the right shape per environment:

- **Goal-bearing (use the Trail + goal flow):** **Academics · Life Skills · Creator Mindset** — a goal with baseline · now · goal.
- **Accountability:** **Connection** — partner check-ins + book discussion. No goal, no Trail.
- **Reflective:** **Purpose** — the four boxes (Values · Passion · Contribution · Hero's Journey). No goal.

The `<vlc-trail>` component and the goal flow are shared across the three goal-bearing environments only.

## Status

- **Vendored Lit:** `js/vendor/lit-core.min.js` (3.2.1) + `lit-css-tag.min.js` — pinned, self-contained, offline, no CDN.
- **First environment:** Academics (Mode B) — Phase 1 Group C.
