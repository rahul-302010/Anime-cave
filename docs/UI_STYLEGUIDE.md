# UI_STYLEGUIDE

> Component rules for Anime Cave — header, search, cards, player area. Consistent with DESIGN.md and PALETTE_AND_TOKENS.md tokens.

## Purpose
Make every component buildable by any contributor without design review drift.

## Global Rules
- Dark only: `bg #0A0A12`. Spacing base 4px (4,8,12,16,24,32).
- Radius: cards 12px, inputs 10px, pills 999px. Border `1px solid rgba(237,233,254,0.08)`.
- Type scale: 12/14/16/24/36. Line-height 1.5 body, 1.1 display.
- All interactive elements have `focus-visible` ring cyan 2px.

## Header (64px, sticky)
- Left: wordmark "ANIME CAVE" Space Grotesk 18/600 tracking 0.12em + small cave glyph.
- Center: search (see below) on desktop; hidden on mobile ? icon button.
- Right: lang toggle (EN/?????), queue icon with badge, settings gear.
- Background: `surface #12121F` with `backdrop-blur(12px)` + bottom border. Three.js canvas sits behind, not inside header.

## Search
- Input: 44px tall, pill-ish (radius 10px), placeholder "Search anime — English or Tamil…"
- Debounce 250ms, clear button, cmd/ctrl+K focus. Results as dropdown + grid sync.
- Filters: chips row below input (Lang, Source, Year, Score). Active chip: violet fill.

## Cards
- 2:3 cover, 12px radius, footer with title (14/600, 2-line clamp), meta (12/400 muted: year · source · lang pill).
- Hover: `box-shadow glow` + border brightens to `rgba(124,58,237,0.3)`. No image zoom.
- Lang pill: `EN` muted, `?????` cyan outline. Score badge top-right if >=7.5.

## Player Area
- Bottom drawer: 80px bar when idle ? 420px when expanded (episode list + version panel).
- Play button: violet 44px, `Play` label + icon, hover `background #6D28D9`. Loading ? spinner, not disabled text.
- Version control panel: table-like rows (Quality | Dub/Sub | Source | Action). Selected row has cyan left border.

## Other
- Queue list: progress bar (violet), speed/ETA in muted 12px, cancel/retry inline.
- Toasts: surface-raised, 12px radius, 4s, top-right, max 3 stacked.

## Checklist
- [ ] Header height and blur consistent
- [ ] Search debounce + focus shortcut
- [ ] Card metadata and lang pill rules followed
- [ ] Player drawer states specced
