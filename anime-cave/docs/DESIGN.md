# DESIGN

> Consolidated design for Anime Cave — dark, neon-accented, UI-first anime aggregator. Three.js hero, glass cards, local-first warmth.

## Purpose
Unify visual direction, tokens, and component principles so every screen feels like the same cave — dark, deep, softly glowing. English + Tamil content deserves equal hierarchy; no language visually secondary.

## Principles
1. **Local-first, UI-first** — CLI replaced by obvious controls; no hidden commands.
2. **Dark with neon breath** — deep navy-black base, violet/cyan accents, never flat white.
3. **Depth over flatness** — subtle glass, blur, and parallax via Three.js header.
4. **Content is hero** — covers and art lead; chrome recedes.

## Visual System
- **Base:** `bg #0A0A12`, `surface #12121F`, `surface-raised #1E1E32`
- **Accents:** violet `#7C3AED` (primary), cyan `#00E5CC` (secondary), magenta `#FF3B82` (alert/play)
- **Text:** `primary #EDE9FE` (90%), `muted #A1A1B5`, `dim #6B7280`
- **Radius:** 12px cards, 8px controls, 999px pills
- **Shadow:** `0 8px 32px rgba(0,0,0,0.5)` + `0 0 24px rgba(124,58,237,0.15)` glow on hover
- **Border:** `1px solid rgba(237,233,254,0.08)` + glass `backdrop-blur(12px)`

## Typography
- Display: Space Grotesk / General Sans, 600, 36/44
- Heading: Space Grotesk, 600, 24/32
- Body: Inter, 400, 14/20; 16/24 for detail views
- Mono: JetBrains Mono for IDs/queue status

## Layout
Header (64px) ? Search + Filters ? Card grid (4 cols desktop, 2 tablet, 1 mobile, 16px gap) ? Player drawer (bottom sheet). Three.js canvas behind header only, 280px tall, fades to surface.

## Accessibility
- Contrast >= 4.5:1 (violet on dark passes at 600 weight + 16px)
- Focus ring: `2px solid #00E5CC` offset 2px; keyboard nav for all cards
- Reduced motion: disable Three.js auto-rotate + parallax if `prefers-reduced-motion`
- Hit targets >= 44px; Tamil text not truncated; lang tag visible

## Checklist
- [ ] Tokens match PALETTE_AND_TOKENS.md
- [ ] Three.js header is decorative, not blocking
- [ ] Dark theme only (no light toggle in v1)
- [ ] Contrast and focus states verified
