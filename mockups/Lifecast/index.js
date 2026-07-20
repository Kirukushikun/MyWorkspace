// Sort folders and root items alphabetically within each list
document.querySelectorAll('.library-list').forEach(list => {
const header  = list.querySelector('.library-list-header');
const folders = Array.from(list.querySelectorAll(':scope > .library-folder'));
const items   = Array.from(list.querySelectorAll(':scope > .library-item'));

// Sort folder contents first
folders.forEach(folder => {
    const contents = folder.querySelector('.folder-contents');
    Array.from(contents.querySelectorAll('.library-item'))
    .sort((a, b) => a.querySelector('.title').textContent.trim()
                        .localeCompare(b.querySelector('.title').textContent.trim()))
    .forEach(i => contents.appendChild(i));
});

// Sort folders alphabetically then root items alphabetically, folders first
folders.sort((a, b) => a.dataset.folderName.localeCompare(b.dataset.folderName))
        .forEach(f => list.appendChild(f));
items.sort((a, b) => a.querySelector('.title').textContent.trim()
                        .localeCompare(b.querySelector('.title').textContent.trim()))
        .forEach(i => list.appendChild(i));

if (header) list.prepend(header);
});

// Folder collapse / expand toggle
document.querySelectorAll('.folder-row').forEach(row => {
row.addEventListener('click', () => {
    row.closest('.library-folder').classList.toggle('collapsed');
});
});

// New Folder button
document.querySelectorAll('[data-new-folder]').forEach(btn => {
btn.addEventListener('click', e => {
    e.stopPropagation();
    const tab  = btn.dataset.newFolder;
    const name = prompt('Folder name:');
    if (!name || !name.trim()) return;
    const list = document.querySelector(`.library-list[data-list="${tab}"]`);
    const folder = document.createElement('div');
    folder.className = 'library-folder';
    folder.dataset.folderName = name.trim();
    folder.innerHTML = `
    <div class="folder-row">
        <span class="folder-chevron">▼</span>
        <span class="folder-icon">📁</span>
        <span class="folder-name">${name.trim()}</span>
        <span class="folder-count">0</span>
    </div>
    <div class="folder-contents"></div>
    `;
    folder.querySelector('.folder-row').addEventListener('click', () => {
    folder.classList.toggle('collapsed');
    });
    // Insert alphabetically among folders
    const siblings = Array.from(list.querySelectorAll(':scope > .library-folder'));
    const after = siblings.find(f => f.dataset.folderName.localeCompare(name.trim()) > 0);
    after ? list.insertBefore(folder, after) : list.insertBefore(folder, list.querySelector(':scope > .library-item'));
});
});

// Tab switching — shows the matching list, hides others, updates placeholder
const searchPlaceholders = {
songs:  'Search songs…',
bible:  'Search scripture… (e.g. John 3:16)',
media:  'Search media files…',
slides: 'Search presentations…',
};
document.querySelectorAll('.sidebar-tabs button').forEach(btn => {
btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.sidebar-tabs button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.library-list').forEach(list => {
    list.style.display = list.dataset.list === tab ? 'block' : 'none';
    });
    document.getElementById('library-search').placeholder = searchPlaceholders[tab] ?? 'Search…';
});
});

// Library item selection — only clears active within the same list
document.querySelectorAll('.library-item').forEach(item => {
item.addEventListener('click', () => {
    const parentList = item.closest('.library-list');
    parentList.querySelectorAll('.library-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
});
});

// Slide data
const slides = Array.from(document.querySelectorAll('.slide-thumb'));
let currentSlideIndex = 0;

function loadSlideIntoPreview(index) {
slides.forEach(t => t.classList.remove('active'));
slides[index].classList.add('active');
currentSlideIndex = index;
const html = slides[index].querySelector('span').innerHTML;
document.getElementById('preview-text').innerHTML = html;
// Sync verse label
const labels = document.querySelectorAll('.slide-label');
document.querySelector('#screen-preview .verse-label').textContent = labels[index]?.textContent ?? '';
// Clear blank state on preview when a new slide is loaded
document.getElementById('screen-preview').classList.remove('is-blank');
}

// Live Click toggle
const dualScreens = document.querySelector('.dual-screens');
let liveClickOn = false;

document.getElementById('live-click-toggle').addEventListener('click', () => {
liveClickOn = !liveClickOn;
document.getElementById('live-click-toggle').classList.toggle('active', liveClickOn);
dualScreens.classList.toggle('live-click-mode', liveClickOn);
document.getElementById('btn-send-live').style.opacity = liveClickOn ? '.4' : '1';
document.getElementById('btn-send-live').style.pointerEvents = liveClickOn ? 'none' : '';
});

// Slide thumb selection
slides.forEach((thumb, i) => {
thumb.addEventListener('click', () => {
    loadSlideIntoPreview(i);
    if (liveClickOn) sendToLive();
});
});

// Prev / Next navigate through slides
document.getElementById('btn-prev').addEventListener('click', () => {
if (currentSlideIndex > 0) loadSlideIntoPreview(currentSlideIndex - 1);
});
document.getElementById('btn-next').addEventListener('click', () => {
if (currentSlideIndex < slides.length - 1) loadSlideIntoPreview(currentSlideIndex + 1);
});

const liveCol = document.querySelector('.screen-col.is-live');

function sendToLive() {
document.getElementById('live-text').innerHTML = document.getElementById('preview-text').innerHTML;
document.querySelector('#screen-live .verse-label').textContent = document.querySelector('#screen-preview .verse-label').textContent;
document.getElementById('screen-live').classList.remove('is-blank');
liveCol.classList.add('on-air');
}

document.getElementById('btn-send-live').addEventListener('click', () => {
sendToLive();
if (currentSlideIndex < slides.length - 1) loadSlideIntoPreview(currentSlideIndex + 1);
});

// Blank Live — hides content and drops to idle state
let isBlank = false;
document.getElementById('btn-blank').addEventListener('click', () => {
isBlank = !isBlank;
document.getElementById('screen-live').classList.toggle('is-blank', isBlank);
liveCol.classList.toggle('on-air', !isBlank);
document.getElementById('btn-blank').textContent = isBlank ? '<i class="fa-solid fa-stop"></i> Unblank Live' : '<i class="fa-solid fa-stop"></i> Blank Live';
});

// ── SCHEDULE ──

const defaultSchedule = [
{ icon: '🎵', name: 'Amazing Grace' },
{ icon: '📖', name: 'John 3:16' },
{ icon: '🎵', name: 'How Great Is Our God' },
{ icon: '📊', name: 'Sermon Notes – June' },
{ icon: '🎵', name: 'Blessed Assurance' },
];

const presets = [
{
    name: 'First Service',
    items: [
    { icon: '🎬', name: 'Welcome Video' },
    { icon: '🎵', name: 'How Great Is Our God' },
    { icon: '🎵', name: 'Amazing Grace' },
    { icon: '📖', name: 'Psalm 23' },
    { icon: '📊', name: 'Sermon Notes – June' },
    { icon: '🎬', name: 'Offering Background' },
    { icon: '🎵', name: 'Goodness of God' },
    ]
},
{
    name: 'Second Service',
    items: [
    { icon: '🎬', name: 'Welcome Video' },
    { icon: '🎵', name: 'Oceans (Where Feet May Fail)' },
    { icon: '🎵', name: 'Blessed Assurance' },
    { icon: '📖', name: 'John 3:16' },
    { icon: '📊', name: 'Sunday Announcements' },
    { icon: '🎵', name: 'What A Beautiful Name' },
    ]
},
{
    name: 'Youth Service',
    items: [
    { icon: '🎵', name: '10,000 Reasons' },
    { icon: '🎵', name: 'What A Beautiful Name' },
    { icon: '📖', name: 'Jeremiah 29:11' },
    { icon: '📊', name: 'Church Vision 2026' },
    { icon: '🎵', name: 'Goodness of God' },
    ]
},
];

function makeChip(item, isActive) {
const chip = document.createElement('div');
chip.className = 'schedule-chip' + (isActive ? ' active' : '');
chip.innerHTML = `
    <div class="chip-body">
    <span class="chip-icon">${item.icon}</span>
    <span class="chip-name">${item.name}</span>
    </div>
    <div class="chip-actions">
    <button class="chip-btn chip-replace" title="Replace item">⇄</button>
    <button class="chip-btn chip-remove" title="Remove from schedule">✕</button>
    </div>
`;
chip.querySelector('.chip-body').addEventListener('click', () => {
    document.querySelectorAll('.schedule-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
});
chip.querySelector('.chip-remove').addEventListener('click', e => {
    e.stopPropagation();
    chip.remove();
});
chip.querySelector('.chip-replace').addEventListener('click', e => {
    e.stopPropagation();
    // placeholder — opens library picker in future
});
return chip;
}

function renderSchedule(items) {
const container = document.getElementById('schedule-items');
container.innerHTML = '';
items.forEach((item, i) => container.appendChild(makeChip(item, i === 0)));
}

renderSchedule(defaultSchedule);

// Build preset items in the panel
const presetPanel  = document.getElementById('preset-panel');
const presetFooter = presetPanel.querySelector('.preset-panel-footer');

function buildPresetItems() {
presetPanel.querySelectorAll('.preset-item').forEach(el => el.remove());
presets.forEach((preset, index) => {
    const el = document.createElement('div');
    el.className = 'preset-item';
    el.innerHTML = `
    <div class="preset-info">
        <div class="preset-name">${preset.name}</div>
        <div class="preset-count">${preset.items.length} items</div>
    </div>
    <div class="preset-item-actions">
        <button class="preset-load-btn">Load</button>
        <button class="preset-delete-btn" title="Delete preset">✕</button>
    </div>
    `;
    el.querySelector('.preset-load-btn').addEventListener('click', e => {
    e.stopPropagation();
    renderSchedule(preset.items);
    closePresetPanel();
    });
    el.querySelector('.preset-delete-btn').addEventListener('click', e => {
    e.stopPropagation();
    presets.splice(index, 1);
    buildPresetItems();
    });
    presetPanel.insertBefore(el, presetFooter);
});
}

buildPresetItems();

// Save current schedule as new preset
document.getElementById('preset-save-btn').addEventListener('click', e => {
e.stopPropagation();
const chips = document.querySelectorAll('#schedule-items .schedule-chip');
if (!chips.length) return;
const name = prompt('Preset name:');
if (!name || !name.trim()) return;
const items = Array.from(chips).map(chip => ({
    icon: chip.querySelector('.chip-icon').textContent,
    name: chip.querySelector('.chip-name').textContent,
}));
presets.push({ name: name.trim(), items });
buildPresetItems();
});

// Start empty schedule
document.getElementById('preset-empty-btn').addEventListener('click', e => {
e.stopPropagation();
document.getElementById('schedule-items').innerHTML = '';
closePresetPanel();
});

// Preset panel open / close
const presetTrigger = document.getElementById('preset-trigger');

function closePresetPanel() {
presetPanel.classList.remove('open');
presetTrigger.classList.remove('open');
}

presetTrigger.addEventListener('click', e => {
e.stopPropagation();
const isOpen = presetPanel.classList.toggle('open');
presetTrigger.classList.toggle('open', isOpen);
});

document.addEventListener('click', closePresetPanel);

// Color swatch selection — applies to both screens
document.querySelectorAll('.swatch').forEach(swatch => {
swatch.addEventListener('click', () => {
    document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
    swatch.classList.add('active');
    document.querySelectorAll('.lyric-text').forEach(el => {
    el.style.color = swatch.style.background;
    });
});
});

// ── THEME SYSTEM ──
const themePresets = [
{ id: 'dark-green',  name: 'Dark Green',  bg: 'linear-gradient(135deg,#0d2200,#1e4700)', text: '#ffffff', preset: true },
{ id: 'light',       name: 'Light',        bg: 'linear-gradient(135deg,#f0ffe0,#c8f07a)', text: '#222222', preset: true },
{ id: 'night-blue',  name: 'Night Blue',   bg: 'linear-gradient(135deg,#00214a,#003d8f)', text: '#ffffff', preset: true },
{ id: 'plain-black', name: 'Plain Black',  bg: '#111111',                                  text: '#ffffff', preset: true },
];
let themes       = [...themePresets];
let activeThemeId = 'dark-green';

function renderThemes() {
const grid = document.getElementById('theme-grid');
grid.innerHTML = '';
themes.forEach(t => {
    const card = document.createElement('div');
    card.className = 'theme-card' + (t.id === activeThemeId ? ' active' : '');
    card.innerHTML = `
    <div style="width:100%;height:100%;background:${t.bg}"></div>
    <div class="tc-label">${t.name}</div>
    ${!t.preset ? `<button class="tc-delete" title="Delete theme">✕</button>` : ''}
    `;
    card.addEventListener('click', e => {
    if (e.target.closest('.tc-delete')) return;
    activeThemeId = t.id;
    renderThemes();
    });
    const del = card.querySelector('.tc-delete');
    if (del) del.addEventListener('click', e => {
    e.stopPropagation();
    themes = themes.filter(th => th.id !== t.id);
    if (activeThemeId === t.id) activeThemeId = themes[0].id;
    renderThemes();
    });
    grid.appendChild(card);
});

// "+ new theme" card
const addCard = document.createElement('div');
addCard.className = 'theme-card-add';
addCard.title = 'Create new theme';
addCard.textContent = '+';
addCard.addEventListener('click', () => {
    document.getElementById('theme-composer').classList.toggle('open');
});
grid.appendChild(addCard);
}

// Composer — sync color pickers ↔ hex inputs and update preview
function syncPreview() {
const bg   = document.getElementById('tc-bg-color').value;
const text = document.getElementById('tc-text-color').value;
const swatch = document.getElementById('tc-preview-swatch');
swatch.style.background = bg;
swatch.style.color      = text;
}
document.getElementById('tc-bg-color').addEventListener('input', e => {
document.getElementById('tc-bg-hex').value = e.target.value; syncPreview();
});
document.getElementById('tc-bg-hex').addEventListener('input', e => {
if (/^#[0-9a-f]{6}$/i.test(e.target.value)) { document.getElementById('tc-bg-color').value = e.target.value; syncPreview(); }
});
document.getElementById('tc-text-color').addEventListener('input', e => {
document.getElementById('tc-text-hex').value = e.target.value; syncPreview();
});
document.getElementById('tc-text-hex').addEventListener('input', e => {
if (/^#[0-9a-f]{6}$/i.test(e.target.value)) { document.getElementById('tc-text-color').value = e.target.value; syncPreview(); }
});
document.getElementById('tc-save-btn').addEventListener('click', () => {
const name = document.getElementById('tc-name-input').value.trim() || 'Custom Theme';
const bg   = document.getElementById('tc-bg-color').value;
const text = document.getElementById('tc-text-color').value;
themes.push({ id: 'custom-' + Date.now(), name, bg, text, preset: false });
activeThemeId = themes[themes.length - 1].id;
document.getElementById('tc-name-input').value = '';
document.getElementById('theme-composer').classList.remove('open');
renderThemes();
});

renderThemes();

// Dark mode toggle — swaps icon inside thumb
const toggleThumb = document.getElementById('toggle-thumb');
document.getElementById('dark-toggle').addEventListener('click', () => {
const isDark = document.body.classList.toggle('dark');
toggleThumb.textContent = isDark ? '🌙' : '☀️';
});

// Open Live Window placeholder
document.getElementById('btn-open-live').addEventListener('click', () => {
const live = window.open('', 'LiveWindow', 'width=1280,height=720');
live.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
    <title>Live Output</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap" rel="stylesheet">
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body {
        background: #0d1a00;
        display: flex; align-items: center; justify-content: center;
        height: 100vh; overflow: hidden;
        font-family: 'Poppins', sans-serif;
        }
        .msg {
        text-align: center;
        color: rgba(255,255,255,.25);
        }
        .msg .icon { font-size: 3rem; margin-bottom: 12px; }
        .msg p { font-size: .9rem; font-weight: 300; letter-spacing: 1px; }
        .msg strong { color: rgba(140,195,65,.6); font-weight: 600; }
    </style>
    </head>
    <body>
    <div class="msg">
        <div class="icon">📺</div>
        <p>Live window ready</p>
        <p><strong>Drag me to the projector screen then press F11</strong></p>
    </div>
    </body>
    </html>
`);
live.document.close();
});

// ── CONTEXT MENU ──
const ctxMenu    = document.getElementById('ctx-menu');
const ctxSubmenu = document.getElementById('ctx-submenu');
let ctxTarget    = null;

function closeCtx() {
ctxMenu.classList.remove('visible');
ctxSubmenu.classList.remove('visible');
ctxTarget = null;
}

function openCtx(e, item) {
e.preventDefault();
ctxTarget = item;
const list = item.closest('.library-list');

// Build Move submenu — show folders in this tab only
ctxSubmenu.innerHTML = '';
const folders = list.querySelectorAll(':scope > .library-folder');
if (!folders.length) {
    const none = document.createElement('div');
    none.className = 'ctx-sub-item';
    none.style.color = 'var(--text-muted)';
    none.textContent = 'No folders yet';
    ctxSubmenu.appendChild(none);
} else {
    folders.forEach(folder => {
    const opt = document.createElement('div');
    opt.className = 'ctx-sub-item';
    opt.innerHTML = `📁 ${folder.dataset.folderName}`;
    opt.addEventListener('click', () => {
        const contents = folder.querySelector('.folder-contents');
        contents.appendChild(ctxTarget);
        // Update count
        folder.querySelector('.folder-count').textContent =
        contents.querySelectorAll('.library-item').length;
        closeCtx();
    });
    ctxSubmenu.appendChild(opt);
    });
}

// Position menu
ctxMenu.style.left = e.clientX + 'px';
ctxMenu.style.top  = e.clientY + 'px';
ctxMenu.classList.add('visible');
ctxSubmenu.classList.remove('visible');
}

// Right-click on library items
document.addEventListener('contextmenu', e => {
const item = e.target.closest('.library-item');
if (item) { openCtx(e, item); return; }
closeCtx();
});

// Move to hover
document.getElementById('ctx-move').addEventListener('mouseenter', e => {
const rect = document.getElementById('ctx-move').getBoundingClientRect();
ctxSubmenu.style.left = rect.right + 4 + 'px';
ctxSubmenu.style.top  = rect.top + 'px';
ctxSubmenu.classList.add('visible');
});
document.getElementById('ctx-move').addEventListener('mouseleave', e => {
if (!e.relatedTarget?.closest('#ctx-submenu')) {
    ctxSubmenu.classList.remove('visible');
}
});
document.getElementById('ctx-submenu').addEventListener('mouseleave', e => {
if (!e.relatedTarget?.closest('#ctx-move')) {
    ctxSubmenu.classList.remove('visible');
}
});

// Edit (rename)
document.getElementById('ctx-edit').addEventListener('click', () => {
if (!ctxTarget) return;
const titleEl = ctxTarget.querySelector('.title');
const newName = prompt('Rename:', titleEl.textContent);
if (newName && newName.trim()) titleEl.textContent = newName.trim();
closeCtx();
});

// Delete
document.getElementById('ctx-delete').addEventListener('click', () => {
if (!ctxTarget) return;
const folder = ctxTarget.closest('.library-folder');
ctxTarget.remove();
if (folder) {
    folder.querySelector('.folder-count').textContent =
    folder.querySelector('.folder-contents').querySelectorAll('.library-item').length;
}
closeCtx();
});

// Close on outside click or Escape
document.addEventListener('click', e => {
if (!e.target.closest('#ctx-menu')) closeCtx();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCtx(); });

// ── SIDEBAR MEDIA PLAYER ──

const mediaItems = {
video: [
    { title: 'Welcome Video',          type: 'MP4',  duration: 102, isVideo: true  },
    { title: 'Worship Background Loop',type: 'MP4',  duration: 300, isVideo: true  },
    { title: 'Offering Background',    type: 'MP4',  duration: 200, isVideo: true  },
],
audio: [
    { title: 'Prelude Music',          type: 'MP3',  duration: 240, isVideo: false },
],
image: [
    { title: 'Church Logo',            type: 'PNG',  duration: 0,   isVideo: false },
    { title: 'Announcement Slide',     type: 'JPG',  duration: 0,   isVideo: false },
    { title: 'Easter Background',      type: 'JPG',  duration: 0,   isVideo: false },
],
};

let smpState = {
loaded:   false,
playing:  false,
live:     false,
isVideo:  true,
current:  0,
duration: 0,
timer:    null,
};

function formatTime(s) {
const m = Math.floor(s / 60);
return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

function smpRender() {
const screen   = document.getElementById('smp-screen');
const overlay  = document.getElementById('smp-overlay');
const playBtn  = document.getElementById('smp-play');
const playIcon = document.getElementById('smp-playpause-icon');
const liveBar  = document.getElementById('smp-live-bar');
const sendBtn  = document.getElementById('smp-send');
const track    = document.getElementById('smp-track');

track.value = smpState.duration ? (smpState.current / smpState.duration) * 100 : 0;
document.getElementById('smp-current').textContent  = formatTime(smpState.current);
document.getElementById('smp-duration').textContent = formatTime(smpState.duration);

const icon = smpState.playing ? '⏸' : '<i class="fa-solid fa-caret-right"></i>';
playBtn.textContent  = icon;
playIcon.textContent = icon;

liveBar.classList.toggle('active', smpState.live);
sendBtn.classList.toggle('is-live', smpState.live);
sendBtn.textContent = smpState.live ? '● Live' : (smpState.isVideo ? 'Send Live' : 'Set as BG');

document.getElementById('volume-control').classList.toggle('visible', smpState.live);
document.getElementById('smp-live-pip').classList.toggle('active', smpState.live);
}

// Collapse / expand toggle
document.getElementById('smp-handle').addEventListener('click', () => {
document.getElementById('sidebar-media-player').classList.toggle('collapsed');
});

function smpLoad(item) {
clearInterval(smpState.timer);
const screen  = document.getElementById('smp-screen');
const overlay = document.getElementById('smp-overlay');

smpState = { loaded: true, playing: false, live: false,
                isVideo: item.isVideo, current: 0,
                duration: item.duration, timer: null };

document.getElementById('smp-title').textContent = item.title;
document.getElementById('smp-type').textContent  = item.type;

// Screen appearance
screen.className = 'smp-screen' + (item.isVideo ? '' : ' is-audio');
screen.querySelector('.smp-placeholder').style.display = 'none';
overlay.style.display = 'flex';

// Swap art for audio/image
let art = screen.querySelector('.smp-art');
if (art) art.remove();
if (!item.isVideo) {
    const artEl = document.createElement('div');
    artEl.className = 'smp-art';
    artEl.innerHTML = `<div class="art-icon">${item.type === 'MP3' ? '🎵' : '🖼️'}</div>`;
    screen.insertBefore(artEl, overlay);
}

smpRender();
}

function smpTogglePlay() {
if (!smpState.loaded) return;
smpState.playing = !smpState.playing;
if (smpState.playing) {
    smpState.timer = setInterval(() => {
    if (smpState.current < smpState.duration) {
        smpState.current++;
        smpRender();
    } else {
        smpState.playing = false;
        clearInterval(smpState.timer);
        smpRender();
    }
    }, 1000);
} else {
    clearInterval(smpState.timer);
}
smpRender();
}

function smpToggleLive() {
if (!smpState.loaded) return;
smpState.live = !smpState.live;
if (smpState.live && !smpState.playing) smpTogglePlay();
smpRender();
}

document.getElementById('smp-play').addEventListener('click', smpTogglePlay);
document.getElementById('smp-playpause-icon').addEventListener('click', smpTogglePlay);
document.getElementById('smp-send').addEventListener('click', smpToggleLive);

document.getElementById('smp-track').addEventListener('input', e => {
smpState.current = (e.target.value / 100) * smpState.duration;
smpRender();
});

// ── ADD SONG MODAL ──
(function() {
const overlay     = document.getElementById('modal-add-song');
const editor      = document.getElementById('lyrics-editor');
const summaryWrap = document.getElementById('sections-summary-wrap');
const summaryEl   = document.getElementById('sections-summary');
const tagBtns     = document.querySelectorAll('.tag-btn');

const typeMeta = {
    verse:  { label: 'V',  ib: 'ib-verse',  bg: 'tagged-verse',  name: 'Verse',      color: '#6ea030' },
    chorus: { label: 'C',  ib: 'ib-chorus', bg: 'tagged-chorus', name: 'Chorus',     color: '#e53935' },
    pre:    { label: 'PC', ib: 'ib-pre',    bg: 'tagged-pre',    name: 'Pre-Chorus', color: '#1565c0' },
    bridge: { label: 'B',  ib: 'ib-bridge', bg: 'tagged-bridge', name: 'Bridge',     color: '#7b1fa2' },
    tag:    { label: 'T',  ib: 'ib-tag',    bg: 'tagged-tag',    name: 'Tag',        color: '#e65100' },
    outro:  { label: 'O',  ib: 'ib-outro',  bg: 'tagged-outro',  name: 'Outro',      color: '#546e7a' },
};

// Recount verse numbers across all tagged spans and relabel badges
function renumberVerses() {
    let vc = 0;
    editor.querySelectorAll('.tagged-section').forEach(span => {
    if (span.dataset.type !== 'verse') return;
    const badge = span.querySelector('.inline-badge');
    if (badge) badge.textContent = 'V' + (++vc);
    });
}

function updateSummary() {
    const tagged = editor.querySelectorAll('.tagged-section');
    summaryWrap.style.display = tagged.length ? '' : 'none';
    summaryEl.innerHTML = '';
    tagged.forEach(span => {
    const type  = span.dataset.type;
    const meta  = typeMeta[type];
    const badge = span.querySelector('.inline-badge');
    const label = badge ? badge.textContent : meta.label;
    const chip  = document.createElement('div');
    chip.className = 'ss-chip';
    chip.innerHTML = `<span class="ss-badge ${meta.ib}">${label}</span>${meta.name}`;
    summaryEl.appendChild(chip);
    });
}

function checkHasSelection() {
    const sel = window.getSelection();
    const active = !!(sel && !sel.isCollapsed && editor.contains(sel.anchorNode));
    tagBtns.forEach(b => b.classList.toggle('ready', active));
}

function tagSelection(type) {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !editor.contains(sel.anchorNode)) return;

    const range = sel.getRangeAt(0).cloneRange();
    const meta  = typeMeta[type];

    const verseCount = editor.querySelectorAll('.tagged-section[data-type="verse"]').length;
    const label = type === 'verse' ? 'V' + (verseCount + 1) : meta.label;

    const badge = document.createElement('span');
    badge.className       = `inline-badge ${meta.ib}`;
    badge.textContent     = label;
    badge.contentEditable = 'false';

    const wrap = document.createElement('span');
    wrap.className    = `tagged-section ${meta.bg}`;
    wrap.dataset.type = type;

    // extractContents + insertNode works across block element boundaries
    // (surroundContents throws on multi-line selections in contenteditable)
    wrap.appendChild(badge);
    wrap.appendChild(range.extractContents());
    range.insertNode(wrap);

    sel.removeAllRanges();
    tagBtns.forEach(b => b.classList.remove('ready'));
    updateSummary();
}

// Click a tagged span to untag it (unwrap back to plain text)
editor.addEventListener('click', e => {
    const span = e.target.closest('.tagged-section');
    if (!span) return;
    const badge = span.querySelector('.inline-badge');
    if (badge) badge.remove();
    const parent = span.parentNode;
    while (span.firstChild) parent.insertBefore(span.firstChild, span);
    span.remove();
    renumberVerses();
    updateSummary();
});

// Strip all HTML/styles on paste — keeps only plain text
editor.addEventListener('paste', e => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
});

document.addEventListener('selectionchange', checkHasSelection);

tagBtns.forEach(btn => {
    btn.addEventListener('mousedown', e => {
    // Prevent losing selection when clicking tag button
    e.preventDefault();
    tagSelection(btn.dataset.type);
    });
});

function openModal() {
    editor.innerHTML = '';
    document.getElementById('song-title-input').value  = '';
    document.getElementById('song-author-input').value = '';
    summaryWrap.style.display = 'none';
    tagBtns.forEach(b => b.classList.remove('ready'));

    // Populate folder dropdown from Songs library
    const folderSelect = document.getElementById('song-folder-select');
    folderSelect.innerHTML = '<option value="">No folder (root)</option>';
    document.querySelectorAll('.library-list[data-list="songs"] .library-folder').forEach(folder => {
    const name = folder.dataset.folderName || folder.querySelector('.folder-name')?.textContent.trim();
    if (!name) return;
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    folderSelect.appendChild(opt);
    });

    overlay.classList.add('open');
    setTimeout(() => document.getElementById('song-title-input').focus(), 80);
}

function closeModal() { overlay.classList.remove('open'); }

function saveModal() {
    const titleInput = document.getElementById('song-title-input');
    const title  = titleInput.value.trim();
    const author = document.getElementById('song-author-input').value.trim();
    if (!title) {
    titleInput.style.borderColor = '#e53935';
    titleInput.focus();
    setTimeout(() => titleInput.style.borderColor = '', 1500);
    return;
    }
    const songsList = document.querySelector('.library-list[data-list="songs"]');
    const item = document.createElement('div');
    item.className = 'library-item';
    item.innerHTML = `
    <div class="item-icon icon-song">🎵</div>
    <div class="item-info">
        <div class="title">${title}</div>
        <div class="meta">${author || 'Unknown'}</div>
    </div>
    `;
    const firstFolder = songsList.querySelector('.library-folder');
    firstFolder ? songsList.insertBefore(item, firstFolder) : songsList.appendChild(item);
    closeModal();
}

document.querySelector('.library-list[data-list="songs"] .list-action-btn:last-child')
    .addEventListener('click', openModal);
document.getElementById('modal-close-song').addEventListener('click',  closeModal);
document.getElementById('modal-cancel-song').addEventListener('click', closeModal);
document.getElementById('modal-save-song').addEventListener('click',   saveModal);
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
});
})();

// ── ADD BIBLE VERSE MODAL ──
(function() {
const overlay    = document.getElementById('modal-add-verse');
const refInput   = document.getElementById('bible-ref-input');
const searchBtn  = document.getElementById('bible-search-btn');
const preview    = document.getElementById('bible-preview');
const saveBtn    = document.getElementById('modal-save-verse');

let fetchedVerse = null; // { reference, text, translation_name }

function setPreview(html, hasResult = false) {
    preview.innerHTML = html;
    preview.classList.toggle('has-result', hasResult);
}

async function searchVerse() {
    const ref   = refInput.value.trim();
    const trans = document.getElementById('bible-translation').value;
    if (!ref) return;

    saveBtn.disabled  = true;
    fetchedVerse      = null;
    searchBtn.disabled = true;
    setPreview('<span class="bible-preview-loading">Searching…</span>');

    try {
    const encoded = encodeURIComponent(ref);
    const res  = await fetch(`https://bible-api.com/${encoded}?translation=${trans}`);
    const data = await res.json();

    if (data.error) throw new Error(data.error);

    fetchedVerse = {
        reference:        data.reference,
        text:             data.text.trim(),
        translation_name: data.translation_name,
        translation_id:   trans,
    };

    setPreview(`
        <div class="bible-result">
        <div class="bible-result-ref">${data.reference}</div>
        <div class="bible-result-text">"${data.text.trim()}"</div>
        <div class="bible-result-translation">${data.translation_name}</div>
        </div>
    `, true);

    saveBtn.disabled = false;
    } catch (err) {
    setPreview(`<div class="bible-preview-error">Verse not found — check the reference and try again.<br><small>${err.message}</small></div>`);
    } finally {
    searchBtn.disabled = false;
    }
}

function resetModal() {
    refInput.value   = '';
    fetchedVerse     = null;
    saveBtn.disabled = true;
    setPreview(`
    <div class="bible-preview-empty" id="bible-preview-empty">
        <span class="bp-icon">📖</span>
        <p>Enter a verse reference above to preview it here</p>
    </div>
    `);

    // Populate folder dropdown from Bible library
    const folderSel = document.getElementById('verse-folder-select');
    folderSel.innerHTML = '<option value="">No folder (root)</option>';
    document.querySelectorAll('.library-list[data-list="bible"] .library-folder').forEach(f => {
    const name = f.dataset.folderName || f.querySelector('.folder-name')?.textContent.trim();
    if (!name) return;
    const opt = document.createElement('option');
    opt.value = name; opt.textContent = name;
    folderSel.appendChild(opt);
    });
}

function saveVerse() {
    if (!fetchedVerse) return;
    const bibleList = document.querySelector('.library-list[data-list="bible"]');
    const item = document.createElement('div');
    item.className = 'library-item';
    item.innerHTML = `
    <div class="item-icon" style="background:#e8f5e9;color:#2e7d32;font-size:.75rem;font-weight:700;width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">📖</div>
    <div class="item-info">
        <div class="title">${fetchedVerse.reference}</div>
        <div class="meta">${fetchedVerse.translation_id.toUpperCase()}</div>
    </div>
    `;

    const selectedFolder = document.getElementById('verse-folder-select').value;
    if (selectedFolder) {
    const folder = Array.from(bibleList.querySelectorAll('.library-folder'))
        .find(f => (f.dataset.folderName || f.querySelector('.folder-name')?.textContent.trim()) === selectedFolder);
    if (folder) {
        folder.querySelector('.folder-contents').appendChild(item);
        const count = folder.querySelector('.folder-count');
        if (count) count.textContent = folder.querySelector('.folder-contents').querySelectorAll('.library-item').length;
    } else {
        bibleList.appendChild(item);
    }
    } else {
    const firstFolder = bibleList.querySelector('.library-folder');
    firstFolder ? bibleList.insertBefore(item, firstFolder) : bibleList.appendChild(item);
    }

    overlay.classList.remove('open');
}

searchBtn.addEventListener('click', searchVerse);
refInput.addEventListener('keydown', e => { if (e.key === 'Enter') searchVerse(); });

document.querySelector('.library-list[data-list="bible"] .list-action-btn:last-child')
    .addEventListener('click', () => { resetModal(); overlay.classList.add('open'); setTimeout(() => refInput.focus(), 80); });

document.getElementById('modal-close-verse').addEventListener('click',  () => overlay.classList.remove('open'));
document.getElementById('modal-cancel-verse').addEventListener('click', () => overlay.classList.remove('open'));
saveBtn.addEventListener('click', saveVerse);
overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) overlay.classList.remove('open');
});
})();

// ── BLANK SCREEN CONTROLS ──
(function() {
const btns      = document.querySelectorAll('.blank-style-btn');
const extraColor = document.getElementById('blank-extra-color');
const extraLogo  = document.getElementById('blank-extra-logo');
const colorPick  = document.getElementById('blank-color-pick');
const colorHex   = document.getElementById('blank-color-hex');

btns.forEach(btn => {
    btn.addEventListener('click', () => {
    btns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const mode = btn.dataset.blank;
    extraColor.style.display = mode === 'color' ? '' : 'none';
    extraLogo.style.display  = mode === 'logo'  ? '' : 'none';
    });
});

colorPick.addEventListener('input', () => { colorHex.value = colorPick.value; });
colorHex.addEventListener('input', () => {
    if (/^#[0-9a-f]{6}$/i.test(colorHex.value)) colorPick.value = colorHex.value;
});
})();

// Load media when clicking items in the Media tab library
document.querySelectorAll('[data-list="media"] .library-item').forEach((item, i) => {
item.addEventListener('click', () => {
    const title = item.querySelector('.title').textContent;
    const meta  = item.querySelector('.meta').textContent;
    const isVideo = meta.includes('MP4');
    const isAudio = meta.includes('MP3');
    const type  = isVideo ? 'MP4' : isAudio ? 'MP3' : meta.split('·')[0].trim();
    smpLoad({ title, type, isVideo: isVideo || isAudio ? isVideo : false,
            duration: isVideo ? [102, 300, 200][i] || 120 : 0 });
    document.getElementById('sidebar-media-player').classList.remove('collapsed');
});
});