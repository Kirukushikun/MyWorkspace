# LifeCast — Development Plan

## Project Overview

LifeCast is a church presentation software built for LCMI (Life City Ministry International). It serves as the operator's console for managing and displaying worship content during services — songs, Bible verses, media, and slides. The operator controls what appears on the projector in real time. Think EasyWorship or OpenLP, but as a web application tailored to LCMI's workflow.

The system has two windows: the **operator console** (this app) and the **live output window** (fullscreen on the projector). The operator pushes slides live; the projector window updates instantly via WebSocket broadcast.

---

## Installation Choices

These were selected during `laravel new` and define the project's baseline. A developer replicating this setup should choose the same options.

```
laravel new lifecast
```

| Prompt | Choice | Reason |
|---|---|---|
| Starter kit | **React** | Sets up Inertia.js v2 + React + Vite + Tailwind automatically |
| Authentication | **Laravel** (built-in Breeze) | Self-contained, no external dependency — adequate for an internal church tool |
| Teams support | **No** | Single-church tool, no multi-tenancy needed |
| Testing framework | **Pest** | Default in Laravel 12, cleaner syntax, familiar to JS developers |
| Laravel Boost | **No** | Unnecessary for this project scope |

> Auth registration is disabled post-install — accounts are created by the admin directly. Only the login route is kept.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Backend | Laravel 12 | Routing, auth, Eloquent ORM, jobs, file storage |
| Bridge | Inertia.js v2 | Connects Laravel controllers to React — no REST API |
| Frontend | React 19 + JSX | Component-driven operator UI |
| Styling | Tailwind CSS v4 | Utility-first, replaces custom CSS |
| Real-time | Laravel Reverb + Echo | Live slide push from operator to projector |
| Database | MySQL | Songs, schedules, media metadata, presets |
| File Storage | Laravel Storage (S3-compatible) | Media files, slide images, backgrounds |
| Auth | Laravel Breeze (Inertia preset) | Login, session, password reset |

---

## Architecture Principle

This is a **Laravel + Inertia.js + React** application. The backend is standard Laravel. The frontend replaces Blade views with React components. There is **no separate REST API**, no `routes/api.php`, and no Axios calls inside components.

Data flows one direction:

```
Route → Controller → Inertia::render('PageName', $data)
                              ↓
                   React Page receives $data as props
                              ↓
                   User submits form
                              ↓
                   router.post(route('...'), data)
                              ↓
                   Controller → FormRequest validates → done
```

---

## Folder Structure

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Auth/
│   │   ├── Console/
│   │   │   └── ConsoleController.php       ← main operator UI
│   │   ├── Songs/
│   │   │   └── SongController.php
│   │   ├── Bible/
│   │   │   └── BibleController.php
│   │   ├── Media/
│   │   │   └── MediaController.php
│   │   ├── Schedules/
│   │   │   └── ScheduleController.php
│   │   ├── Presets/
│   │   │   └── PresetController.php
│   │   └── Output/
│   │       └── OutputController.php        ← live window + go-live broadcast
│   ├── Requests/
│   │   ├── StoreSongRequest.php
│   │   ├── StoreMediaRequest.php
│   │   └── StoreScheduleRequest.php
│   └── Middleware/
│       └── HandleInertiaRequests.php       ← auth user, flash shared globally
│
├── Models/
│   ├── Song.php
│   ├── SongSlide.php
│   ├── MediaFile.php
│   ├── Schedule.php
│   ├── ScheduleItem.php                    ← polymorphic: song | bible | media | slide
│   ├── ServicePreset.php
│   └── Folder.php                          ← library folders
│
├── Services/
│   ├── BibleService.php                    ← external Bible API wrapper
│   ├── MediaUploadService.php
│   └── OutputBroadcastService.php          ← pushes active slide to live window
│
├── Events/
│   └── SlideGoLive.php                     ← Reverb broadcast event
│
└── Support/
    ├── Roles.php
    └── Permissions.php

resources/
└── js/
    ├── Pages/
    │   ├── Console/
    │   │   └── Index.jsx                   ← full operator UI (the mockup)
    │   ├── Songs/
    │   │   ├── Index.jsx
    │   │   └── Edit.jsx
    │   ├── Media/
    │   │   └── Index.jsx
    │   ├── Schedules/
    │   │   └── Index.jsx
    │   ├── Output/
    │   │   └── Live.jsx                    ← fullscreen projector window
    │   └── Auth/
    │       └── Login.jsx
    │
    ├── Components/
    │   ├── Console/
    │   │   ├── Library/
    │   │   │   ├── LibraryPanel.jsx
    │   │   │   ├── LibraryItem.jsx
    │   │   │   └── LibraryFolder.jsx
    │   │   ├── Schedule/
    │   │   │   ├── SchedulePanel.jsx
    │   │   │   ├── ScheduleRow.jsx
    │   │   │   └── PresetDropdown.jsx
    │   │   ├── Preview/
    │   │   │   ├── PreviewScreen.jsx
    │   │   │   └── SlideThumbGrid.jsx
    │   │   └── Properties/
    │   │       ├── PropertiesPanel.jsx
    │   │       ├── TextStyleControls.jsx
    │   │       └── ThemeControls.jsx
    │   ├── Modals/
    │   │   ├── AddSongModal.jsx
    │   │   ├── AddBibleModal.jsx
    │   │   └── AddToScheduleModal.jsx
    │   └── UI/
    │       ├── Modal.jsx
    │       ├── Button.jsx
    │       ├── IconBadge.jsx               ← color-coded icon system (song, bible, media, etc.)
    │       └── RangeInput.jsx
    │
    ├── Layouts/
    │   ├── AppLayout.jsx                   ← authenticated shell
    │   └── GuestLayout.jsx
    │
    └── lib/
        ├── utils.js
        └── hooks/
            ├── useLiveOutput.js            ← Echo subscriber for Live.jsx
            └── useScheduleDrag.js          ← drag-to-reorder schedule logic

routes/
└── web.php                                 ← ALL routes here, no api.php
```

---

## Naming Conventions

- Controllers are **singular**: `SongController`, `MediaController`
- Page folders are **plural**: `Songs/`, `Media/`, `Schedules/`
- Page files match the controller method: `index → Index.jsx`, `edit → Edit.jsx`
- Routes follow Laravel convention: `songs.index`, `output.go-live`, `schedules.store`

---

## What Lives Where

| Concern | Location |
|---|---|
| Routing | `routes/web.php` only |
| Validation | `app/Http/Requests/` |
| Business logic | `app/Services/` |
| Auth / permissions | `app/Support/` + Spatie Permission |
| UI rendering | `resources/js/Pages/` |
| Shared UI pieces | `resources/js/Components/` |
| Global shared data (auth user, flash) | `app/Http/Middleware/HandleInertiaRequests.php` |

---

## Real-Time: Go Live Flow

The only truly real-time piece is the **go-live action** — operator pushes a slide, projector updates instantly.

**Backend (no API route needed):**
```php
// OutputController.php
public function goLive(Request $request)
{
    broadcast(new SlideGoLive($request->slide_id));
    return back();
}
```

**Operator console (Inertia router, not Axios):**
```jsx
// PreviewScreen.jsx
import { router } from '@inertiajs/react';

router.post(route('output.go-live'), { slide_id: slide.id });
```

**Projector window (Echo listener):**
```jsx
// Output/Live.jsx
import { useLiveOutput } from '@/lib/hooks/useLiveOutput';

const { currentSlide } = useLiveOutput(); // Echo WebSocket subscriber
```

---

## Key Notes

- `Console/Index.jsx` is one large page — it holds the entire operator UI (library, schedule, preview, properties). This is intentional; the controller loads the initial data as props.
- `Output/Live.jsx` is a separate route opened in a second window on the projector display. It listens for `SlideGoLive` events and renders the active slide fullscreen.
- The Bible tab uses an external API (e.g. scripture.api.bible). The `BibleService` wraps the HTTP call server-side; the result comes back as Inertia props, not a fetch response.
- Media files (backgrounds, videos, images) are stored via Laravel Storage. URLs are served through Laravel, not exposed as direct S3 links.
