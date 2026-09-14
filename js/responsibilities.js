// js/responsibilities.js — the shared model for Creator-Mindset responsibilities (Europa 2026-09-14).
//
// A responsibility is "what is yours to carry" (the Creator Mindset Responsibility disc). It lives
// in foundations.climb.responsibilities. v1 (dark behind ?resp=on) gives each one an optional
// cadence so it can show as a SOFT PRESENCE on the calendar - a rhythm, not a deadline - plus a
// private, UNCOUNTED "tended" record. No streak, no score, a missed day is a non-event: notice,
// never score (Kohn / Salus / Jake). Only creator.js and calendar-view.js read this; both go
// through normalizeResponsibilities so a legacy plain-string list keeps working.

export const CADENCES = [
  { id: 'off', label: 'Off' },        // carried, but not on the calendar
  { id: 'daily', label: 'Daily' },
  { id: 'weekdays', label: 'Weekdays' },
  { id: 'weekly', label: 'Weekly' },
];
const DOW_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Normalize the stored list (legacy strings OR objects) to a consistent object shape.
export function normalizeResponsibilities(climb) {
  const raw = (climb && Array.isArray(climb.responsibilities)) ? climb.responsibilities : [];
  return raw.map((r) => {
    if (typeof r === 'string') return { text: r, cadence: 'off', weekday: null, tended: [] };
    if (r && typeof r === 'object') {
      return {
        text: typeof r.text === 'string' ? r.text : '',
        cadence: CADENCES.some((c) => c.id === r.cadence) ? r.cadence : 'off',
        weekday: (typeof r.weekday === 'number' && r.weekday >= 0 && r.weekday <= 6) ? r.weekday : null,
        tended: Array.isArray(r.tended) ? r.tended.filter((x) => typeof x === 'string') : [],
      };
    }
    return null;
  }).filter((r) => r && r.text);
}

// Is this responsibility active on a given weekday (0=Sun..6=Sat)?
export function respActiveOn(r, dow) {
  switch (r.cadence) {
    case 'daily': return true;
    case 'weekdays': return dow >= 1 && dow <= 5;
    case 'weekly': return r.weekday != null && dow === r.weekday;
    default: return false; // 'off'
  }
}

// A short human label for the cadence (e.g. "Every Monday").
export function cadenceLabel(r) {
  if (r.cadence === 'weekly') return r.weekday != null ? `Every ${DOW_NAMES[r.weekday]}` : 'Weekly';
  if (r.cadence === 'daily') return 'Daily';
  if (r.cadence === 'weekdays') return 'Weekdays';
  return '';
}
