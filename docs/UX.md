# UX

> Search + filters, version control panel, queue interactions, and saved presets for Anime Cave.

## Purpose
Define how users find, choose, and track anime — especially across languages and versions — without confusion.

## Search + Filters
- **Input:** placeholder "Search anime — English or Tamil…", 250ms debounce, clear (×), cmd/ctrl+K focus. Empty state: prompt + popular chips.
- **Filters (chips):** Lang (All/EN/?????), Source, Year, Score. Multi-select except Lang. Active chip violet; count badge shows results.
- **Behavior:** filters apply instantly to grid; search + filters combined via `GET /api/search?q=&lang=&source=&year=`. No apply button. Reset = "Clear all" link.
- **Grid:** 4?2?1 cols, virtualized, skeletons while loading, "No results" with suggestion to try other lang.

## Version Control Panel (inside Player Drawer)
- Triggered by selecting a card ? drawer expands. Shows: cover, title, synopsis, `Episode | Version` tabs.
- **Version rows:** Quality (1080/720/480) | Audio (Sub/Dub, lang) | Source | Action (Play/Download). Selected row gets cyan left border.
- Tamil dub flagged with `?????` pill. Default version: highest quality sub that matches filter lang.
- Play ? `GET /api/player/play`; Download ? `POST /api/download` ? queue.

## Queue Interactions
- Queue icon badge = active+queued count. Drawer tab "Queue" lists jobs: thumb, title, progress bar, speed/ETA, cancel/retry/pause.
- Optimistic add: item appears immediately as `queued`. States: `queued?downloading?done` or `failed`. Failed shows reason + retry.
- Drag to reorder queued items (future); v1 has cancel + retry only.

## Saved Presets
- Save current filter set as preset (e.g., "Tamil Dubs 2024"). Stored in localStorage; name + filter JSON.
- Presets appear as chips above filters; one-click apply. Limit 6; edit/delete via long-press menu.
- Persist queue and presets across reloads.

## Accessibility & Empty States
- All filters keyboard-navigable; card grid has roving tabindex. No results and empty queue have illustration + CTA.

## Checklist
- [ ] Search debounce + keyboard shortcut
- [ ] Version panel surfaces Tamil dub clearly
- [ ] Queue states and retry visible
- [ ] Presets persist locally
