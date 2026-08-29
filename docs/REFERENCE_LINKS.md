# REFERENCE_LINKS

> Which DESIGN.md files from getdesign/awesome repo to favor for Anime Cave, and why.

## Purpose
Narrow the inspiration set — not every design.md is relevant. Favor those that match Anime Cave is dark, dense, local-first product.

## Top 3 to Favor
### 1. Linear — Favor Most
- **Why:** Density, keyboard-first, crisp borders and subtle glows. Best model for Anime Cave search, filters, and queue density.
- **Steal:** Chip/filter styling, command palette feel (cmd+K), issue-card-like anime cards, muted palette with single accent.
- **Source:** `https://getdesign.md/` ? Linear entry; also `awesome-design-md` Linear section.

### 2. Vercel — Favor for Minimalism
- **Why:** Restrained typography, quiet surfaces, glow only on interaction. Keeps dark UI from feeling heavy.
- **Steal:** Type scale discipline, generous whitespace, hover glow rather than heavy shadows.
- **Source:** `https://getdesign.md/` ? Vercel entry.

### 3. Claude — Favor for Warmth
- **Why:** Human, warm copy in a technical product. Anime Cave needs approachable empty states and Tamil/English parity without corporate coldness.
- **Steal:** Tone for microcopy, empty states, and preset naming; slightly softer radius.
- **Source:** `https://getdesign.md/` ? Claude entry.

## Deprioritize
- Marketing-heavy design.md (e.g., pure landing-page showcases) — Anime Cave is an app, not a brochure.
- Light-theme-only systems — adaptation cost is high for dark neon cave.

## How to Use
1. Skim Linear for component density, Vercel for surface, Claude for voice.
2. Map their tokens to Anime Cave tokens in `PALETTE_AND_TOKENS.md` (violet/cyan, not their brand colors).
3. Keep motion restrained — Linear/Vercel use 150–280ms; match `MOTION_AND_INTERACTIONS.md`.

## Checklist
- [ ] Linear/Vercel/Claude entries reviewed
- [ ] Token mapping noted
- [ ] Anti-patterns (marketing fluff, light-only) avoided
