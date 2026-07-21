// The Growth Record - SCAFFOLD (captain 2026-07-21).
//
// The learner-owned portable record from the design mockup ("The Growth Compass - how it
// works"). This first pass renders the parts we can build straight from existing Compass
// data - the compass itself and a per-direction "ribbon" of movement (Started -> Now ->
// Growing) drawn from the learner's goals + reached milestones. The human-authored parts
// (the seasonal "who you're becoming" story, and "the proof" - the learner's own work) are
// scaffolded as clearly-marked placeholders; they need their own authoring + upload +
// consent surfaces, and the portability/legal pass (TCC + counsel) before they ship.
//
// Principle from the mockup, kept literally: growth is shown as movement compared ONLY to
// the learner's own earlier self - never a grade, score, or comparison to other children.
// Owned by the learner; held by a guardian at first; it goes with them when they leave.

import { getGoals, getTasks, getLearner } from './store.js';
import { COMPASS_REGIONS, REGION_COLORS, regionForLabel, lifeWheelSvgFor } from './wheel.js';
import { lifeAreaForCategory } from './studios.js';

function goalRegion(g) {
  if (g.lifeArea) { const r = regionForLabel(g.lifeArea); if (REGION_COLORS[r]) return r; }
  if (typeof g.categoryId === 'string' && g.categoryId.startsWith('slice_')) {
    const r = regionForLabel(g.categoryId.slice(6)); if (REGION_COLORS[r]) return r;
  }
  const r = regionForLabel(lifeAreaForCategory(g.categoryId)); if (REGION_COLORS[r]) return r;
  return null;
}

export async function renderGrowthRecord(learnerId) {
  const host = document.getElementById('record-view');
  if (!host) return;
  if (!learnerId) { host.innerHTML = '<p class="learners-empty">No learner selected.</p>'; return; }

  const [goals, tasks, learner] = await Promise.all([getGoals(learnerId), getTasks(learnerId), getLearner(learnerId)]);
  const yearGoals = goals.filter((g) => g.scope === 'year' && g.text && g.text.trim());

  // Milestones reached (done milestone tasks), bucketed by region, for the "Now" of each ribbon.
  const reachedByRegion = {};
  const nextByRegion = {};
  for (const g of yearGoals) {
    const region = goalRegion(g);
    if (!region) continue;
    const gt = tasks.filter((t) => t.goalId === g.id && (t.band === 'milestone'));
    const reached = gt.filter((t) => t.status === 'done').length;
    const next = gt.filter((t) => t.status !== 'done').sort((a, b) => (a.plannedFor || '9999').localeCompare(b.plannedFor || '9999'))[0];
    reachedByRegion[region] = (reachedByRegion[region] || 0) + reached;
    if (next && !nextByRegion[region]) nextByRegion[region] = next.text;
  }

  const who = learner?.name || 'This learner';

  host.innerHTML = `
    <div class="record-page">
      <div class="record-scaffold-note">Preview - the Growth Record is being built. The compass and ribbons below are real; the story and proof are placeholders.</div>

      <header class="record-head">
        <h2 class="record-title">The Growth Compass</h2>
        <p class="record-sub">${escapeHtml(who)}'s record - movement over time, compared only to their own earlier self. Never a grade, never a comparison to other children.</p>
      </header>

      <section class="record-compass">
        <div class="record-wheel">${lifeWheelSvgFor(learner?.studio)}</div>
        <p class="record-compass-note">Four directions of a whole life, with Voice at the center. No direction ranks above another.</p>
      </section>

      <section class="record-becoming record-placeholder">
        <h3 class="record-block-title">Who you're becoming</h3>
        <p class="record-placeholder-body">A short story written directly to the learner each season - naming their strengths and their growth, in warm words a child recognizes. <em>Authoring surface: to build (guide-written, three terms a year).</em></p>
      </section>

      <section class="record-ribbons">
        <h3 class="record-block-title">The ribbon - growth in each direction</h3>
        ${COMPASS_REGIONS.map((region) => ribbonHtml(region, reachedByRegion[region] || 0, nextByRegion[region])).join('')}
      </section>

      <section class="record-proof record-placeholder">
        <h3 class="record-block-title">The proof - in their own words</h3>
        <p class="record-placeholder-body">The learner's own work - a photo, a drawing, a project, a journal - each with a line in their own words. The learner chooses what appears and what stays private. <em>Upload + consent surface: to build.</em></p>
      </section>

      <footer class="record-foot">
        <strong>Whose it is:</strong> owned by the learner - held by a guardian at first, taken over as they grow. The guide is a witness, not the owner. When the learner leaves, the record goes with them. <em>We evoke, we never extract.</em>
      </footer>
    </div>`;
}

// A single direction's ribbon: Started -> Now -> Growing (an open circle = a next step, a
// hope, not a target they failed to reach).
function ribbonHtml(region, reached, nextText) {
  const color = REGION_COLORS[region] || 'var(--earth-light)';
  return `
    <div class="record-ribbon" style="--dir:${color}">
      <div class="record-ribbon-head"><span class="record-ribbon-dot"></span>${escapeHtml(region.toUpperCase())}</div>
      <div class="record-ribbon-line">
        <span class="record-node is-started"><span class="record-node-label">STARTED</span></span>
        <span class="record-node is-now"><span class="record-node-label">NOW</span><span class="record-node-detail">${reached} milestone${reached === 1 ? '' : 's'} reached</span></span>
        <span class="record-node is-growing"><span class="record-node-label">GROWING</span><span class="record-node-detail">${nextText ? escapeHtml(nextText) : 'a next step'}</span></span>
      </div>
    </div>`;
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
