// Bearing screen - the calm-first compass orientation before the work.
// File still named arrive.js to keep service-worker cache stable; the surface
// is now "Find your bearing" rather than "Arrive."
//
// Per captain 2026-05-11: the bearing screen stays visible until the user
// taps Begin. No auto-advance - the learner chooses when to enter.

export function initBearing(onComplete) {
  const skip = document.getElementById('skip-bearing');
  if (skip) skip.addEventListener('click', () => finish(onComplete));
}

function finish(onComplete) {
  const screen = document.getElementById('bearing-screen');
  if (screen) screen.classList.remove('active');
  if (onComplete) onComplete();
}

export function showBearing() {
  const screen = document.getElementById('bearing-screen');
  const app = document.getElementById('app-screen');
  if (screen) screen.classList.add('active');
  if (app) app.classList.remove('active');
}
