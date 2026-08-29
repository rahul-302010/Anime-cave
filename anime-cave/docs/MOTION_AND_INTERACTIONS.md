# MOTION_AND_INTERACTIONS

> Splash animation sequence, micro-interactions, and reduced-motion handling for Anime Cave.

## Purpose
Motion should feel like breathing — present, never distracting. Every animation has a reason.

## Splash Sequence (first load, ~1.8s total)
1. **Void (0–400ms):** bg `#0A0A12` ? Three.js points fade in at 30% opacity, slow drift.
2. **Glyph (400–900ms):** cave glyph scales 0.92?1.0, opacity 0?1, ease-out-expo; subtitle "ANIME CAVE" tracks in 0.08em?0.12em.
3. **Search reveal (900–1400ms):** search bar rises 8px + fades in, stagger 60ms for filter chips.
4. **Content (1400–1800ms):** skeleton cards fade in, 40ms stagger per card.
- Skip if cached load <800ms or `prefers-reduced-motion` ? instant.

## Micro-Interactions
| Trigger | Motion | Duration/Ease |
|---------|--------|---------------|
| Card hover | border glow + `translateY(-2px)` shadow | 180ms expo |
| Play button hover | bg `#7C3AED`?`#6D28D9`, scale 1.02 | 150ms |
| Filter chip toggle | fill + checkmark scale 0?1 | 160ms |
| Queue progress | width tween, not jump | 300ms linear |
| Toast enter/exit | slide 12px + fade | 220ms / 180ms |
| Drawer expand | height 80?420px, content fade  | 280ms expo |
| Search clear | icon rotate 90° + fade | 140ms |

## Three.js Hero
- Slow parallax on mouse (max 6px, lerp 0.06). Caps 60fps, pauses when tab hidden or off-screen via IntersectionObserver.
- No auto-spin faster than 0.2 rad/s.

## Reduced Motion
- Respect `prefers-reduced-motion: reduce` — disable splash, parallax, hover lift. Keep opacity fades (<=120ms) only.
- Provide `Settings ? Reduce motion` toggle that persists to localStorage and adds `data-reduced-motion` attr.

## Rules
- Never block input; all motion is interruptible. Duration cap 300ms for UI, 1800ms only for splash. Use `transform`/`opacity` only (no layout thrash).

## Checklist
- [ ] Splash skippable and respects reduced-motion
- [ ] All durations use 150/180/220/280 scale
- [ ] Three.js pauses off-screen/hidden
- [ ] No motion blocks interaction
