// js/pillars/index.js — the single source of truth for the five Pillar tabs.
// Both the learner nav (js/app.js buildTabs) and the tab dispatch (js/app.js
// showTab) read from PILLARS, so adding, reordering, or recoloring a Pillar is a
// one-line change here - not edits scattered across the app.
//
// Each entry: { id (tab-content element id), label (nav text), color (css
// --pillar-* token + pillar-<color> class), render (async fn(learnerId)) }.
// Order here is the order the Pillars appear in the nav.

import { renderPurpose } from './purpose.js';
import { renderConnection } from './connection.js';
import { renderCreatorMindset } from './creator.js';
import { renderLifeSkills } from './life-skills.js';
import { renderAcademicsPillar } from './academics.js';

export const PILLARS = [
  { id: 'purpose-view', label: 'Purpose', color: 'purpose', render: renderPurpose },
  { id: 'connection-view', label: 'Connection', color: 'connection', render: renderConnection },
  { id: 'creator-view', label: 'Creator Mindset', color: 'creator', render: renderCreatorMindset },
  { id: 'lifeskills-view', label: 'Life Skills', color: 'lifeskills', render: renderLifeSkills },
  { id: 'academics-view', label: 'Academics', color: 'academics', render: renderAcademicsPillar },
];

export const PILLAR_IDS = new Set(PILLARS.map((p) => p.id));

// Dispatch helper for showTab(): returns true if this tab is a Pillar and was rendered.
export async function renderPillar(tabId, learnerId) {
  const p = PILLARS.find((x) => x.id === tabId);
  if (!p) return false;
  try { await p.render(learnerId); } catch (e) { console.warn(`pillar ${tabId} render:`, e); }
  return true;
}
