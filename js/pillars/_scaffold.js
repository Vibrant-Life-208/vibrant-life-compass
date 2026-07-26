// js/pillars/_scaffold.js
// Shared frame for the five Pillar tabs (Purpose, Connection, Creator Mindset,
// Life Skills, Academics). One header + section shell so every Pillar reads the
// same and a new Pillar is a small file, not a bespoke layout. Colors come from
// the pyramid disc palette (css/style.css --pillar-*), so the tab, the header
// accent, and the onboarding reveal all agree.

export function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
export function escapeAttr(s) { return escapeHtml(s); }

// Full-tab HTML: a colored header + a stack of sections.
//   header: { color, title, subtitle }
//   sections: array of HTML strings (use section() below)
export function shell(header, sections) {
  const sub = header.subtitle ? `<p class="pillar-subtitle">${escapeHtml(header.subtitle)}</p>` : '';
  return `
    <div class="pillar pillar-${escapeAttr(header.color)}">
      <div class="pillar-header">
        <span class="pillar-swatch" aria-hidden="true"></span>
        <h2 class="pillar-title">${escapeHtml(header.title)}</h2>
      </div>
      ${sub}
      <div class="pillar-body">${(sections || []).filter(Boolean).join('')}</div>
    </div>`;
}

// One section block. `body` is raw HTML (already escaped by the caller).
export function section(title, body, opts = {}) {
  const cls = opts.className ? ` ${opts.className}` : '';
  const t = title ? `<h3 class="pillar-section-title">${escapeHtml(title)}</h3>` : '';
  return `<section class="pillar-section${cls}">${t}${body || ''}</section>`;
}

// A row of small labeled chips (values, strengths).
export function chips(labels) {
  const items = (labels || []).filter(Boolean);
  if (!items.length) return '';
  return `<div class="pillar-chips">${items.map((l) => `<span class="pillar-chip">${escapeHtml(l)}</span>`).join('')}</div>`;
}

// A quiet, honest empty state - never a scolding blank.
export function emptyNote(text) {
  return `<p class="pillar-empty">${escapeHtml(text)}</p>`;
}

// A quiet "still being built" note for Phase-2 features, so a tab is never broken,
// just honest about what is not here yet.
export function comingNote(text) {
  return `<p class="pillar-coming">${escapeHtml(text)}</p>`;
}

// A single goal card: text + the decomposition points that exist (starting line, halfway).
export function goalCard(goal) {
  if (!goal) return '';
  const meta = [];
  if (goal.baseline) meta.push(`<span class="pillar-goal-label">Starting line:</span> ${escapeHtml(goal.baseline)}`);
  if (goal.halfwayPoint) meta.push(`<span class="pillar-goal-label">Halfway:</span> ${escapeHtml(goal.halfwayPoint)}`);
  return `<div class="pillar-goal">
    <p class="pillar-goal-text">${escapeHtml(goal.text || '')}</p>
    ${meta.map((m) => `<p class="pillar-goal-meta">${m}</p>`).join('')}
  </div>`;
}

