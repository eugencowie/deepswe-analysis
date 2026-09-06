# 01: Site logo and favicon

Type: task
Status: resolved

## What to build

Create a logo for DeepSWE enhanced, using the supplied official DeepSWE mark
as inspiration. Show it beside the site title and use the same asset as the
browser favicon.

### Design

- A dense fan of neutral strokes with rounded ends, crossed by a single
  curve rising from bottom left to top right.
- Only the rising curve is purple. Match the "enhanced" text: `#7e2fff` in
  light mode and `#a98aff` in dark mode.
- Make the purple curve the strongest part of the mark: stroke width `23`
  against `8` for the neutral strokes, within a `160 × 144` viewBox.
- Keep the steeper rising curve developed during iteration, with the fuller
  fan restored at the user's request.
- Use an SVG with a transparent background so the mark scales cleanly for
  the header and browser tab.

### Integration

- Keep the shared asset in `public/favicon.svg`. Its `mark` group supplies
  the header through an SVG `<use>` reference, prefixed with
  `import.meta.env.BASE_URL` for deployment under a subpath.
- Render the header mark at 32px before "DeepSWE enhanced". Mark it
  `aria-hidden` because the adjacent heading provides the site name.
- Header fan strokes inherit `currentColor`; the purple curve uses the
  shared `--brand` colour through `--logo-accent`.
- The standalone favicon follows `prefers-color-scheme`, using dark neutral
  strokes in light mode and light neutral strokes in dark mode.

## Acceptance criteria

- [x] Header and favicon use the same SVG asset
- [x] The dense fan stays neutral; only the rising curve is purple
- [x] The purple curve is visibly heavier than the surrounding strokes
- [x] Header colours follow the selected app theme and match "enhanced"
- [x] Favicon colours follow the browser's colour preference
- [x] The header mark is decorative to assistive technology
- [x] `vp run ready` passes

## Comments

**2026-09-06**. Implemented. The initial all-purple concept was replaced by
an SVG with a purple rising curve and neutral strokes. A sparse version was
tried before the user chose to restore the dense fan. The purple stroke was
then increased to `23`, with neutral strokes at `8`.

Verified the header in light and dark mode with Playwright screenshots.
`vp run ready` passed after the final stroke adjustment, including 141 unit
tests and the production build. The 11 browser tests also passed during the
logo integration.
