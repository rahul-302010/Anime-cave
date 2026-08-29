# GENERAL_DESIGN

> High-level design principles for Anime Cave. Local-first, UI-first — the philosophy that guides every design and engineering choice.

## Purpose
Establish durable principles so future contributors make consistent decisions without revisiting fundamentals.

## Core Principles
1. **Local-first** — Your library, your machine. No cloud account, no telemetry by default. Data lives in `anime_cave.db` + filesystem cache. Offline search of cached results works.
2. **UI-first** — Every CLI capability has a visible UI equivalent. Search, filter, resolve, queue, play — all discoverable without docs. Power users can still script via `/api/*` on 127.0.0.1.
3. **Respect the source** — Adapters are thin; they normalize but never re-host. Attribute source, link back where possible.
4. **English + Tamil parity** — Neither language is a fallback. Filters and cards surface `lang` equally; Tamil titles render with proper line-height (1.6) and no truncation.
5. **Progressive disclosure** — Simple by default (search ? play), powerful when needed (version panel, queue, concurrency knobs in settings).

## Experience Pillars
- **Instant feel:** Search debounce 250ms, optimistic queue updates, skeletons not spinners.
- **Calm dark:** Deep base + neon breath; no harsh white, no pure black (#0A0A12 not #000).
- **Trustworthy transfers:** Queue shows progress, speed, ETA; retries are transparent, not silent.

## Architecture Principles
- Thin adapters, thick contracts — enforce `search/resolve/download` shape.
- Backend is a local daemon, not a SaaS — bind 127.0.0.1, no auth in v1, CORS locked.
- Frontend owns no business logic for sources; all source knowledge behind API.

## What We Dont Do (v1)
- No user accounts, no cloud sync, no recommendations engine.
- No light theme — dark only keeps scope tight.
- No auto-play next by default — user initiates.

## Checklist
- [ ] Every feature has visible UI path
- [ ] Tamil and English have equal affordance
- [ ] Local-only defaults respected
- [ ] Principles referenced in PR descriptions
