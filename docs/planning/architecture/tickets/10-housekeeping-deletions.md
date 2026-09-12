# 10: Housekeeping deletions

Type: task
Status: resolved
Blocked by: 04 (shares the sources module)

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

## Decisions (grilled 2026-09-11)

- Class-name helper: every file imports `cn` from the package and the ui-folder re-export is deleted. Verified by running the shadcn generator against a throwaway copy of `components.json`: it emits `from "cn"` and never creates the aliased utils file, so the dormant `aliases.utils` entry is left alone.
- Sources: `leaderboardSources` is exported from the sources module; "exactly one" means one place spells out the five fields, and tests spread that object to override a source.
- Dependency check: a one-off `vp dlx knip --dependencies`, not added to the repo. Bundle inclusion of zod is checked by grepping the build output once.
- Theme guard: covered by a unit test that calls the hook outside a provider, so the test count stays flat rather than dropping by one.
- Per-column classes: computed once at module load from the static column definitions, keyed by column id (ADR 0008 removed an index-zipped column list; this keeps header and cell agreeing by identity).

## Answer

`src/main.test.ts` is gone. `clsx` and `tailwind-merge` are removed and `zod` is a runtime dependency; knip reports nothing unused or unlisted and the production bundle contains `ZodError`. `sources.ts` exports `leaderboardSources` and the app, both e2e files and the leaderboard tests consume it. The theme context is created with no default so the existing throw in `useTheme` can fire, covered by `theme-provider.test.tsx`. The table computes its per-column classes once, keyed by column id. All twelve components import `cn` from the package and `ui/utils.ts` is deleted.

Validation: `vp check` passes with no warnings; `vp test` passes all 168 tests across 11 files; rendered table markup for every row at all effort levels is byte-identical before and after the column-classes change; `mise run e2e` passes all 11 browser tests unchanged.
