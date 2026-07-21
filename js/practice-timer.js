// Practice timer - a learner-started countdown for a reading session (captain 2026-07-21).
//
// SOFT + optional by design: a gentle VISUAL cue at the end, and an optional quiet chime that is
// OFF by default so a child who startles is never jarred. The LEARNER ends it - the timer never
// forces a stop or nags. On finishing, a skippable "Where are you now?" updates the book's
// bookmark - the one evolving "now". It stores NOTHING else: no session count, no minutes total,
// no streak. A companion that remembers where you were, not a tracker that scores what you did.

const DEFAULT_MINUTES = 20;

// Open the timer for a book. onBookmark(newText) is called only if the learner saves a new spot.
export function openPracticeTimer(book, onBookmark) {
  const startMinutes = Number(book?.timerMinutes) > 0 ? Number(book.timerMinutes) : DEFAULT_MINUTES;
  let remaining = startMinutes * 60; // seconds
  let tickTimer = null;

  const overlay = document.createElement('div');
  overlay.className = 'practice-timer-overlay';
  overlay.innerHTML = `
    <div class="practice-timer-panel">
      <p class="practice-timer-book">${escapeHtml(book?.title || 'Reading')}</p>
      <div class="practice-timer-clock" id="pt-clock">${fmt(remaining)}</div>
      <label class="practice-timer-chime"><input type="checkbox" id="pt-chime"> a soft sound when the time is up</label>
      <div class="practice-timer-actions">
        <button type="button" class="btn btn-primary" id="pt-start">Start</button>
        <button type="button" class="btn btn-text" id="pt-done" style="display:none">I'm done</button>
        <button type="button" class="btn btn-text" id="pt-close">Close</button>
      </div>
      <p class="practice-timer-up" id="pt-up" style="display:none">Time's up - finish whenever you're ready.</p>
      <div class="practice-timer-bookmark" id="pt-bookmark" style="display:none">
        <label for="pt-mark">Where are you now?</label>
        <input type="text" id="pt-mark" value="${escapeAttr(book?.bookmark || '')}" placeholder="A page, a chapter, a moment - wherever you are">
        <div class="practice-timer-actions">
          <button type="button" class="btn btn-primary" id="pt-save">Save my spot</button>
          <button type="button" class="btn btn-text" id="pt-skip">Skip</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const q = (sel) => overlay.querySelector(sel);
  const stopTick = () => { if (tickTimer) { clearInterval(tickTimer); tickTimer = null; } };
  const close = () => { stopTick(); overlay.remove(); };

  function toBookmark() {
    stopTick();
    q('#pt-start').style.display = 'none';
    q('#pt-done').style.display = 'none';
    q('#pt-bookmark').style.display = '';
    setTimeout(() => q('#pt-mark')?.focus(), 50);
  }

  q('#pt-start').addEventListener('click', () => {
    q('#pt-start').style.display = 'none';
    q('#pt-done').style.display = '';
    tickTimer = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        remaining = 0;
        q('#pt-clock').textContent = fmt(0);
        stopTick();
        q('.practice-timer-panel').classList.add('is-up'); // gentle visual cue - no auto-close
        q('#pt-up').style.display = '';
        if (q('#pt-chime')?.checked) softChime();
        // The learner still ends it themselves - the timer never forces a stop.
      } else {
        q('#pt-clock').textContent = fmt(remaining);
      }
    }, 1000);
  });

  q('#pt-done').addEventListener('click', toBookmark);
  q('#pt-close').addEventListener('click', close);
  q('#pt-save').addEventListener('click', () => {
    if (onBookmark) onBookmark(q('#pt-mark')?.value || '');
    close();
  });
  q('#pt-skip').addEventListener('click', close);
}

function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// A single soft, short tone - only if the learner opted in. Guarded; silent if unavailable so a
// missing/blocked AudioContext can never throw a jarring failure at a child.
function softChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 528;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.25);
  } catch (e) { /* silent - never a jarring failure */ }
}

function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, '&#39;');
}
