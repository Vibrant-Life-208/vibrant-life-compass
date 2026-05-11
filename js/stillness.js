// Stillness - the regulation floor.
// Per Decision 3 of the 2026-05-11 fleet meeting (Praesens + Polaris):
// A persistent tap-target accessible from every tab. Tap, and the current view
// fades to a slowed bearing screen. No timer. No celebration. No record.
// Just the ground.
//
// Studio-aware: Discovery may surface this more visibly; Launchpad keeps it
// quieter. The button never speaks louder than it needs to.

let opened = false;

export function initStillness() {
  // Wire the trigger button in the header (added in index.html).
  const trigger = document.getElementById('stillness-trigger');
  if (trigger && !trigger.dataset.wired) {
    trigger.dataset.wired = '1';
    trigger.addEventListener('click', open);
  }

  // Wire the overlay (dismiss on any tap anywhere on it).
  const overlay = document.getElementById('stillness-overlay');
  if (overlay && !overlay.dataset.wired) {
    overlay.dataset.wired = '1';
    overlay.addEventListener('click', close);
    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }
}

export function open() {
  if (opened) return;
  opened = true;
  const overlay = document.getElementById('stillness-overlay');
  if (!overlay) return;
  overlay.classList.add('active');
  // Take focus so Escape works for keyboard learners.
  overlay.setAttribute('tabindex', '-1');
  overlay.focus();
}

export function close() {
  opened = false;
  document.getElementById('stillness-overlay')?.classList.remove('active');
}
