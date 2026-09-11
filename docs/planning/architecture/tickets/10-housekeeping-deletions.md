# 10: Housekeeping deletions

Type: task
Status: ready-for-agent
Blocked by: 04 (shares the sources module)

## What to build

Small removals found in the code-quality audit, none of which changes behaviour:

- Delete the placeholder unit test that asserts true.
- Drop the unused `clsx` and `tailwind-merge` dependencies; move `zod` to runtime dependencies since the app bundle imports it.
- Export one sources object for the leaderboard constructor so the app, the leaderboard tests and the e2e filter tests stop spelling out the same four-field call.
- Make the theme context nullable with a real missing-provider guard, replacing the default state whose setter is a silent no-op.
- Compute the table's per-column classes (alignment, derived tint, first-derived rule) once per column rather than per cell per row.
- Use one import path for the class-name helper across app components and vendored UI components.

## Acceptance criteria

- [ ] `vp install` reports no unused or misplaced dependency after the change; the production build still includes `zod`.
- [ ] The placeholder test file is gone and the test count drops by one.
- [ ] Exactly one call site constructs the leaderboard from live sources.
- [ ] The theme hook throws when used outside its provider.
- [ ] Rendered table markup is unchanged; `vp check`, `vp test` and the e2e suite are green.
