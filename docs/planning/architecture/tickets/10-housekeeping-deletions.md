# 10: Housekeeping deletions

Type: task
Status: resolved
Blocked by: 04 (shares the sources module), resolved

## What to build

Small removals found in the code-quality audit, none of which changes behaviour:

- Delete the placeholder unit test that asserts true.
- Drop the unused `clsx` and `tailwind-merge` dependencies; move `zod` to runtime dependencies since the app bundle imports it.
- Export one sources object for the leaderboard constructor so the app, the leaderboard tests and both e2e files stop spelling out the same five-field call.
- Make the theme context nullable so the existing missing-provider guard can fire, replacing the default state whose setter is a silent no-op.
- Compute the table's per-column classes (alignment, derived tint, first-derived rule) once per column rather than per cell per row.
- Use one import path for the class-name helper across app components and vendored UI components: the `cn` package, which the shadcn generator emits.

## Acceptance criteria

- [x] A one-off `vp dlx knip --dependencies` reports no unused or unlisted dependency; the production bundle contains `ZodError`.
- [x] The placeholder test file is gone and no test asserts a literal true.
- [x] Exactly one place spells out the leaderboard's five sources; tests spread that object to override one.
- [x] The theme hook throws when used outside its provider, covered by a unit test.
- [x] Rendered table markup is unchanged; `vp check`, `vp test` and the e2e suite are green.
