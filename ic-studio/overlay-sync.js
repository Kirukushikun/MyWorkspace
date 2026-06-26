/**
 * overlay-sync.js
 * Reads localStorage keys written by control.html and updates index.html DOM.
 * Polls every 500ms so the overlay stays live without a page reload.
 *
 * Keys consumed:
 *   overlay_event      → top-bar event info
 *   overlay_countdown  → sidebar countdown timer
 *   overlay_matches    → sidebar match cards (grouped by date)
 *   overlay_ticker     → bottom ticker strip
 */

(function () {
  'use strict';

  // ── helpers ──────────────────────────────────────────────────────────────

  function retrieve(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  }

  /** Convert *text* markers to <em>text</em> for gold highlights */
  function parseMd(str) {
    return (str || '').replace(/\*([^*]+)\*/g, '<em>$1</em>');
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el && el.textContent !== value) el.textContent = value;
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  // ── timestamps so we only re-render on actual changes ────────────────────
  let lastEventTs   = 0;
  let lastTickerTs  = 0;
  let lastMatchesTs = 0;
  let countdownTarget = null; // ms epoch

  // ────────────────────────────────────────────────────────────────────────
  // 1. EVENT INFO
  // ────────────────────────────────────────────────────────────────────────
  function syncEvent() {
    const data = retrieve('overlay_event');
    if (!data || data.updatedAt === lastEventTs) return;
    lastEventTs = data.updatedAt;

    setText('event-label',   data.label  || '');
    setText('event-name',    data.name   || '');
    setText('event-date',    data.date   || '');
    setText('event-day-sub', data.daySub || '');
  }

  // ────────────────────────────────────────────────────────────────────────
  // 2. COUNTDOWN
  // ────────────────────────────────────────────────────────────────────────
  function syncCountdown() {
    const data = retrieve('overlay_countdown');
    if (!data) return;
    if (data.targetTime !== countdownTarget) {
      countdownTarget = data.targetTime;
    }
  }

  function tickCountdown() {
    const minsEl = document.getElementById('minutes');
    const secsEl = document.getElementById('seconds');
    if (!minsEl || !secsEl) return;

    if (!countdownTarget) {
      minsEl.textContent = '00';
      secsEl.textContent = '00';
      return;
    }

    const diff = Math.max(0, countdownTarget - Date.now());
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    minsEl.textContent = pad(m);
    secsEl.textContent = pad(s);
  }

  // ────────────────────────────────────────────────────────────────────────
  // 3. MATCHES — grouped by date
  // ────────────────────────────────────────────────────────────────────────
  function buildMatchCard(m) {
    const isActive = m.status === 'live';
    const isDone   = m.status === 'done';

    // Status badge
    let statusHtml;
    if (m.status === 'live') {
      statusHtml = `<span class="card-status live">LIVE</span>`;
    } else if (m.status === 'done') {
      statusHtml = `<span class="card-status done">DONE</span>`;
    } else {
      statusHtml = `<span class="card-status upcoming">${m.date || 'TBD'}</span>`;
    }

    // Center score or status
    let centerHtml;
    if (isDone && (m.scoreA || m.scoreB)) {
      centerHtml = `<div class="vs-text">VS</div><div class="vs-score">${m.scoreA} – ${m.scoreB}</div>`;
    } else if (m.status === 'live') {
      centerHtml = `<div class="vs-text">VS</div><div class="vs-time">LIVE</div>`;
    } else {
      centerHtml = `<div class="vs-text">VS</div><div class="vs-time">Upcoming</div>`;
    }

    // Winner highlight
    const avatarA = `team-avatar${m.winner === 'A' ? ' winner' : ''}`;
    const avatarB = `team-avatar${m.winner === 'B' ? ' winner' : ''}`;

    return `
      <div class="matchup-card${isActive ? ' active' : ''}">
        <div class="card-meta">
          <span class="card-game-num">Game ${m.num}</span>
          <span class="card-sport">${m.stage || ''}</span>
          ${statusHtml}
        </div>
        <div class="teams-row">
          <div class="team-block">
            <div class="${avatarA}">🔴</div>
            <div class="team-tag">${m.teamA || ''}</div>
            <div class="team-dept">${m.teamAFull || ''}</div>
          </div>
          <div class="vs-block">${centerHtml}</div>
          <div class="team-block right">
            <div class="${avatarB}">🔵</div>
            <div class="team-tag">${m.teamB || ''}</div>
            <div class="team-dept">${m.teamBFull || ''}</div>
          </div>
        </div>
      </div>`;
  }

  function buildScheduleSection(badgeLabel, cards, isFirst) {
    const topMargin = isFirst ? '' : 'style="margin-top: 20px;"';
    return `
      <div class="sidebar-heading" ${topMargin}>
        <div class="sidebar-heading-line"></div>
        <div class="sidebar-heading-text">Schedule</div>
        <div class="sidebar-heading-badge">${badgeLabel}</div>
      </div>
      ${cards.map(buildMatchCard).join('')}
    `;
  }

  function syncMatches() {
    const data = retrieve('overlay_matches');
    if (!data || data.updatedAt === lastMatchesTs) return;
    lastMatchesTs = data.updatedAt;

    const container = document.getElementById('match-cards-container');
    if (!container) return;

    const matches = data.matches || [];

    // Time value = today (e.g. "3:00", "3:00 PM", "TBD", "LIVE", "Upcoming")
    // Date value = future group (e.g. "Feb 17", "Mar 2")
    function isTimeValue(str) {
      if (!str) return true;
      return /:|AM|PM|TBD|upcoming|live/i.test(str);
    }

    const todayMatches  = matches.filter(m => isTimeValue(m.date));
    const futureMatches = matches.filter(m => !isTimeValue(m.date));

    // Group future matches by their date string
    const futureGroups = {};
    futureMatches.forEach(m => {
      if (!futureGroups[m.date]) futureGroups[m.date] = [];
      futureGroups[m.date].push(m);
    });

    let html = '';

    // Always render Today section
    html += buildScheduleSection('Today', todayMatches, true);

    // Render each future date group only if they exist
    Object.entries(futureGroups).forEach(([date, cards]) => {
      html += buildScheduleSection(date, cards, false);
    });

    container.innerHTML = html;
  }

  // ────────────────────────────────────────────────────────────────────────
  // 4. TICKER
  // ────────────────────────────────────────────────────────────────────────
  function buildTickerInner(items) {
    // Double items so the CSS scroll animation loops seamlessly
    const doubled = [...items, ...items];
    return doubled.map((item, i) => {
      const dot = i > 0 ? `<span class="ticker-dot"></span>` : '';
      return `${dot}<span class="ticker-item">${parseMd(item)}</span>`;
    }).join('');
  }

  function syncTicker() {
    const data = retrieve('overlay_ticker');
    if (!data || data.updatedAt === lastTickerTs) return;
    lastTickerTs = data.updatedAt;

    const inner = document.getElementById('ticker-inner');
    if (!inner) return;

    const items = data.items || [];
    if (items.length === 0) return;

    inner.innerHTML = buildTickerInner(items);

    // Reset scroll animation cleanly
    inner.style.animation = 'none';
    void inner.offsetWidth; // force reflow
    inner.style.animation = '';
  }

  // ────────────────────────────────────────────────────────────────────────
  // POLL LOOP
  // ────────────────────────────────────────────────────────────────────────
  function poll() {
    syncEvent();
    syncCountdown();
    syncMatches();
    syncTicker();
  }

  setInterval(tickCountdown, 1000);
  setInterval(poll, 500);

  poll();
  tickCountdown();

})();