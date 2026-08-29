# PALETTE_AND_TOKENS

> Color palette with token values and type scale for Anime Cave. Single source of truth — matches DESIGN.md.

## Purpose
Provide copy-pasteable tokens so design and code never diverge.

## Colors
| Token | Value | Usage |
|-------|-------|-------|
| `bg` | `#0A0A12` | Page background (not pure black) |
| `surface` | `#12121F` | Header, cards |
| `surface-raised` | `#1E1E32` | Drawer, dropdowns, toasts |
| `surface-hover` | `#252542` | Hover state |
| `border` | `rgba(237,233,254,0.08)` | Card/input border |
| `border-strong` | `rgba(124,58,237,0.3)` | Hover/focus border |
| `text-primary` | `#EDE9FE` | Headings, titles |
| `text-muted` | `#A1A1B5` | Meta, secondary |
| `text-dim` | `#6B7280` | Placeholders, disabled |
| `accent-violet` | `#7C3AED` | Primary CTA, active chip |
| `accent-violet-hover` | `#6D28D9` | CTA hover |
| `accent-cyan` | `#00E5CC` | Focus ring, Tamil pill, secondary |
| `accent-magenta` | `#FF3B82` | Play emphasis, errors |
| `success` | `#10B981` | Done |
| `warning` | `#F59E0B` | Retry |

## Typography
| Token | Font | Size/Line | Weight |
|-------|------|-----------|--------|
| `display` | Space Grotesk | 36/44 | 600 |
| `h1` | Space Grotesk | 24/32 | 600 |
| `h2` | Space Grotesk | 18/24 | 600 |
| `body` | Inter | 14/20 | 400 |
| `body-lg` | Inter | 16/24 | 400 |
| `caption` | Inter | 12/16 | 400/500 |
| `mono` | JetBrains Mono | 12/16 | 400 |

Tamil titles: `body-lg` with `line-height 1.6` to respect script.

## Spacing & Radius
- Spacing: `xs 4`, `sm 8`, `md 12`, `lg 16`, `xl 24`, `2xl 32` (px)
- Radius: `sm 8`, `md 12`, `lg 16`, `pill 999`
- Shadow: `card 0 8px 32px rgba(0,0,0,0.5)`, `glow 0 0 24px rgba(124,58,237,0.15)`

## CSS Variables (copy)
```css
:root {
  --bg: #0A0A12; --surface: #12121F; --surface-raised: #1E1E32;
  --text-primary: #EDE9FE; --text-muted: #A1A1B5;
  --accent-violet: #7C3AED; --accent-cyan: #00E5CC; --accent-magenta: #FF3B82;
  --radius-md: 12px; --border: rgba(237,233,254,0.08);
}
```

## Checklist
- [ ] Tokens referenced by name in code, not hex literals
- [ ] Contrast >=4.5:1 verified for text on bg
- [ ] Tamil line-height applied
