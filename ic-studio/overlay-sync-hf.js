/**
 * overlay-sync.js  —  header.html + footer.html edition
 * Reads localStorage keys written by control.html.
 * Polls every 500ms for live updates.
 *
 * Keys consumed:
 *   overlay_hf           → team names, tags, logos, scores, round, tournament, footerExtra
 *   overlay_timer_reset  → resets the in-game timer to a given second value
 */

(function () {
  'use strict';

  function retrieve(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el && el.textContent !== value) el.textContent = value;
  }

  function setHtml(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value;
  }

  // ── timestamps to avoid unnecessary re-renders ───────────────
  let lastHfTs    = 0;
  let lastResetTs = 0;

  // ── in-game timer state ──────────────────────────────────────
  let totalSeconds = 616; // default 10:16
  let timerInterval = null;

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      totalSeconds++;
      const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
      const s = String(totalSeconds % 60).padStart(2, '0');
      const el = document.getElementById('timer');
      if (el) el.textContent = `${m}:${s}`;
    }, 1000);
  }

  // ── HEADER / FOOTER DATA ─────────────────────────────────────
  function syncHf() {
    const data = retrieve('overlay_hf');
    if (!data || data.updatedAt === lastHfTs) return;
    lastHfTs = data.updatedAt;

    // Team Left
    setText('team-left-logo',  data.teamLeft?.logo || '');
    setText('team-left-name',  data.teamLeft?.name || '');
    setText('team-left-tag',   data.teamLeft?.tag  ? `(${data.teamLeft.tag})` : '');

    // Team Right
    setText('team-right-logo', data.teamRight?.logo || '');
    setText('team-right-name', data.teamRight?.name || '');
    setText('team-right-tag',  data.teamRight?.tag  ? `(${data.teamRight.tag})` : '');

    // Scores
    setText('score-left',  String(data.scoreLeft  ?? 0));
    setText('score-right', String(data.scoreRight ?? 0));

    // Round & tournament
    setText('round-label',    data.round      || '');
    setText('tournament-name', data.tournament || '');

    // Footer extra (timer bar right side / footer ticker)
    setText('timer-extra',   data.footerExtra || '');
    setText('footer-extra',  data.footerExtra || '');

    // Footer ticker tournament line
    setText('footer-tournament', data.tournament || '');
  }

  // ── TIMER RESET ──────────────────────────────────────────────
  function syncTimerReset() {
    const data = retrieve('overlay_timer_reset');
    if (!data || data.resetAt === lastResetTs) return;
    lastResetTs = data.resetAt;

    totalSeconds = data.seconds ?? 0;

    // Immediately show the new time
    const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    const el = document.getElementById('timer');
    if (el) el.textContent = `${m}:${s}`;
  }

  // ── POLL ─────────────────────────────────────────────────────
  function poll() {
    syncHf();
    syncTimerReset();
  }

  setInterval(poll, 500);
  poll();

  // Start the timer running on load
  startTimer();

})();
