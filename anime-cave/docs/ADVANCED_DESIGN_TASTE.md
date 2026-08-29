# ADVANCED_DESIGN_TASTE

> Visual direction and imagery spec for Anime Cave. Taste level: Awwwards-calm, Linear-precise, Vercel-minimal — with an anime soul.

## Purpose
Define the taste bar so visuals feel curated, not generic. This is the mood board in words.

## Direction
**Cave as sanctuary** — not a dungeon. Think: softly lit archive, neon signs through mist, rows of illuminated covers receding into depth. Three.js header provides a slow, breathing void — floating shards or toroidal mist — never noisy.

**References to steal from (see LINKS.md + REFERENCE_LINKS.md):**
- Linear: density, keyboard polish, crisp borders
- Vercel: restrained type, quiet surfaces, glow on interaction only
- Claude: warm, human copy; no corporate coldness

## Imagery Spec
- **Covers:** 2:3 ratio, `object-cover`, radius 12px, hover lift `translateY(-4px)` + glow. No stretched art.
- **Hero canvas:** Three.js points/planes in violet?cyan gradient, 30% opacity, 60fps capped, pauses when off-screen or `prefers-reduced-motion`.
- **Empty states:** Illustration of empty cave shelf + one-line prompt, not a big icon.
- **Icons:** Lucide, 1.5px stroke, 20px default. No emoji in UI chrome.
- **Photography:** None. Use poster art only; no stock anime.

## Motion Taste
- Ease: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo). Duration 150–280ms.
- Hover: border glow, not scale. Play button alone scales 1.02.
- Page transitions: none in v1; content fades 120ms if needed.

## Copy Taste
- Short, warm, precise. "Queue download" not "Add to download queue manager".
- Tamil titles preserve original script; romanization as secondary line if available.

## Anti-Patterns
- No gradient text on body copy; only display titles optionally.
- No glass overkill — one backdrop-blur layer, not stacked.
- No autoplay video on landing.

## Checklist
- [ ] Three.js is ambient, not dominant
- [ ] Icon stroke/weight consistent
- [ ] Hover states use glow, not jarring scale
- [ ] Tamil typography tested with real titles
