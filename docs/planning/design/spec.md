# Spec: Design

Sets the overall visual direction for DeepSWE enhanced. The site is a compact
tool for comparing benchmark results, with the leaderboard as its main
content. Feature specs own individual controls and behaviour; design tickets
record specific visual changes.

## Visual direction

- Keep the interface quiet and data-focused. Use neutral backgrounds, clear
  text and subtle separators so model names and results are easy to scan.
- Use purple as the site's brand accent, shared by the logo and "enhanced"
  in the title. Keep other colour purposeful, such as vendor marks and
  labels that distinguish access routes.
- Take inspiration from DeepSWE while giving the site its own identity. The
  logo pairs a neutral fan with a prominent purple rising curve; its detailed
  geometry belongs in [ticket 01](tickets/01-logo.md).
- Use consistent sans-serif typography, spacing and control shapes. Establish
  hierarchy through size, weight and contrast, keeping secondary details
  readable without competing with the results.

## Layout and themes

- Keep a single-page layout: site identity and theme control, filter toolbar,
  leaderboard, then source dates and explanatory notes.
- Keep related controls together and the table dense enough for comparison.
  On narrow screens, let controls wrap and the table scroll horizontally.
- Support light and dark appearances throughout. Neutral colours and the
  purple accent adapt to the theme while preserving the same hierarchy.
  Theme behaviour is covered by the [dark-mode spec](../dark-mode/spec.md).
- Preserve readable contrast, visible keyboard focus and accessible control
  names. Colour supports meaning alongside text, icons or control state.

## Acceptance criteria

- The leaderboard remains the main visual focus at desktop and mobile sizes.
- Branding, typography and controls are consistent across the page.
- Both themes keep content and interactive states legible.
- Narrow layouts keep controls usable and table content accessible.

## Tickets

- [01: Site logo and favicon](tickets/01-logo.md)
