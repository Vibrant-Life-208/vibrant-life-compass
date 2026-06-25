// Anchor insights (guide-only). Shows the most- and least-chosen values and
// character strengths, school-wide and by studio ("tribe"). Counts only - no
// individual's selections are ever shown; the data comes from the privacy-
// preserving anchor_aggregates() aggregate (guide-only, small-group suppressed).

import { getAnchorAggregates } from './store.js';

const STUDIO_LABELS = { sparks: 'Sparks', discovery: 'Discovery', adventure: 'Adventure', launchpad: 'Launch Pad' };
const STUDIO_ORDER = ['sparks', 'discovery', 'adventure', 'launchpad'];

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const scopeLabel = (k) => (k === 'school' ? 'School-wide' : (STUDIO_LABELS[k] || k));

export async function renderAnchorInsights() {
  const section = document.getElementById('anchor-insights-section');
  if (!section) return;
  const body = document.getElementById('anchor-insights-body');
  if (!body) return;

  let rows;
  try { rows = await getAnchorAggregates(); } catch (e) { rows = []; }

  if (!rows || !rows.length) {
    body.innerHTML = `<p class="insights-empty">Not enough anchors yet. Once at least 5 people have set their values and character strengths, what the community is choosing will appear here - as counts only, never any one person's picks.</p>`;
    return;
  }

  // Group rows: scope key ('school' | studio) -> { group_size, value:[], strength:[] }
  const scopes = new Map();
  for (const r of rows) {
    const key = r.scope === 'school' ? 'school' : r.scope_key;
    if (!scopes.has(key)) scopes.set(key, { group_size: r.group_size, value: [], strength_top: [], strength_bottom: [] });
    if (scopes.get(key)[r.kind]) scopes.get(key)[r.kind].push(r);
  }

  const available = ['school', ...STUDIO_ORDER.filter((s) => scopes.has(s))];
  const missingStudios = STUDIO_ORDER.filter((s) => !scopes.has(s));

  // Selected scope persists on the section element across re-renders.
  if (!section.dataset.scope || !scopes.has(section.dataset.scope)) section.dataset.scope = 'school';
  const selected = section.dataset.scope;
  const data = scopes.get(selected);

  const selector = `<div class="insights-scopes">${available.map((k) =>
    `<button type="button" class="insights-scope-btn${k === selected ? ' active' : ''}" data-scope="${k}">${escapeHtml(scopeLabel(k))}</button>`
  ).join('')}</div>`;

  const li = (i) => `<li><span class="insights-item-label">${escapeHtml(i.label)}</span><span class="insights-item-count">${i.cnt}</span></li>`;
  const topList = (items) => items.filter((i) => i.cnt > 0).sort((a, b) => b.cnt - a.cnt || a.label.localeCompare(b.label)).slice(0, 5);
  // Values: "least chosen" = the low end of the selection counts (includes 0s).
  // Strengths: "least developed" = most often in people's bottom 8 (high bottom count).
  const lowValues = (items) => items.slice().sort((a, b) => a.cnt - b.cnt || a.label.localeCompare(b.label)).slice(0, 5);

  const col = ({ title, mostLabel, mostItems, leastLabel, leastItems }) => `
      <div class="insights-col">
        <h4 class="insights-col-title">${escapeHtml(title)}</h4>
        <p class="insights-sub">${escapeHtml(mostLabel)}</p>
        <ol class="insights-list">${mostItems.length ? mostItems.map(li).join('') : '<li class="insights-none">None yet</li>'}</ol>
        <p class="insights-sub">${escapeHtml(leastLabel)}</p>
        <ol class="insights-list insights-list-least">${leastItems.length ? leastItems.map(li).join('') : '<li class="insights-none">None yet</li>'}</ol>
      </div>`;

  const valuesCol = col({
    title: 'Values',
    mostLabel: 'Most chosen', mostItems: topList(data.value || []),
    leastLabel: 'Least chosen', leastItems: lowValues(data.value || []),
  });
  const strengthsCol = col({
    title: 'Character strengths',
    mostLabel: 'Most developed (signature)', mostItems: topList(data.strength_top || []),
    leastLabel: 'Least developed', leastItems: topList(data.strength_bottom || []),
  });

  const contextWho = selected === 'school' ? 'learners, guides, and parents' : 'learners in this studio';
  const suppressionNote = missingStudios.length
    ? `<p class="insights-note">A studio appears here once 5+ of its learners have set an anchor - until then it stays hidden so no individual can be identified.</p>`
    : '';

  body.innerHTML = `
    ${selector}
    <p class="insights-context">${escapeHtml(scopeLabel(selected))} · ${data.group_size} ${data.group_size === 1 ? 'person' : 'people'} with an anchor (${contextWho})</p>
    <div class="insights-cols">
      ${valuesCol}
      ${strengthsCol}
    </div>
    <p class="insights-privacy">Counts only - no individual's choices are ever shown. "Least developed" reflects how often a strength sits in people's lower range.</p>
    ${suppressionNote}`;

  body.querySelectorAll('.insights-scope-btn').forEach((btn) => {
    btn.addEventListener('click', () => { section.dataset.scope = btn.dataset.scope; renderAnchorInsights(); });
  });
}
