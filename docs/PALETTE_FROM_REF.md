# PALETTE_FROM_REF.md

Extracted palette and CSS tokens from the provided reference image for Anime Cave UI.

## CSS Variables (tokens)

```css
:root {
  --background: #070910; /* deep app shell */
  --surface: #1e1756;    /* cards, panels */
  --primary: #070910;    /* primary accent / base */
  --accent: #5c585a;     /* secondary accent (purple/teal) */
  --muted: #d3ae9a;      /* muted metadata */
  --text: #ffffff;       /* primary text on dark */
  --subtext: #bfc4c8;    /* secondary text */
}
```

### Usage notes
- `--background` for the main shell and deepest surfaces. Combine with a subtle gradient or noise layer for texture.
- `--surface` for card backgrounds; apply glass blur and subtle borders.
- `--primary` is a base; combine with neon overlay (pink/purple) for CTAs.
- `--accent` use for badges, highlights, and subtle Three.js accent lighting.
- `--muted` for timestamps, small meta, and borders.
- `--text` and `--subtext` for readable text on dark surfaces.

### Top swatches
- #070910
- #1e1756
- #5c585a
- #562426
- #9d9798
- #2d1898
- #96685d
- #5a2cdf

---

Generated automatically from the reference image provided by the user.