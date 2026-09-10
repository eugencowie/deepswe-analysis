# 02: Deepen the column module

Type: task
Status: resolved

## What to build

One module, `src/components/leaderboard-columns.tsx`, that owns every leaderboard column: header, tooltip, estimate marker, alignment, derived tint, bar, cell, sort value, blank policy and first sort direction. It also owns the sort rule: the default sort, the two-state toggle, and blanks last in both directions. The table renders whatever the list contains and keeps only sort state.

Closes the debt ADR 0005 recorded as pending ("a column module that owns cells, formatting and comparators together") and the `compareModel` thread ticket 01 deferred.

Recommendation strength at review: Strong. Dependency category: in-process.

## Decisions (grilled 2026-09-10)

- Seam: one `.tsx` module beside the table. Cells are JSX; splitting text from decoration would put the seam through the thing being deepened.
- Construction: `createColumns({ compareModel })` in App, mirroring `createLeaderboard`. The Model-column order is bound at construction, not threaded as a fourth comparator argument and not carried on rows (ADR 0005). The table's interface becomes `rows`, `columns`, `empty`.
- Sort transitions are pure and bound to the instance, like the Leaderboard's `visibleRows`: `defaultSort()`, `toggleSort(sort, columnId)`, `sortRows(rows, sort)`. The table keeps `useState`. `firstDirection`, `value` and `compare` are not visible outside the module.
- The table reads render flags (`header`, `tooltip`, `estimate`, `align`, `derived`, `bar`, `cell`) and maps them to classes itself, including the left rule on the first derived column.
- `format.ts` keeps only `formatTierDiscount` and `formatUsdPerMonth` (route-card callers) and their tests, pending the Subscriptions picker deepening. The column formatters become private to the column module.
- TanStack Table stays as the table's render wiring (ADR 0001); out of scope here.
- Tests replace, not layer: `leaderboard-sort.test.ts` deleted; column formatter cases in `format.test.ts` replaced by cell-text tests at the column interface, using hand-written `LeaderboardRow` fixtures and `renderToStaticMarkup` with tags stripped. The e2e sort test stays: its remaining value is the `useState` wiring.
- Glossary gains "Column" and "Sort"; recorded as [ADR 0007](../../../architecture/0007-column-module-owns-cells-and-sort.md).

## Answer

Built in commit `4a0f3e0`. `createColumns({ compareModel })` returns `columns`, `defaultSort`, `toggleSort`, `sortRows`; the table takes `rows`, `columns`, `empty`. `leaderboard-sort.ts` deleted, `format.ts` trimmed to the route-card pair. 148 tests pass, e2e 11 pass.
