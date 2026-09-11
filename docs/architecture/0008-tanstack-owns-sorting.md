# TanStack Table owns sorting and the column list

ADR 0007 kept the sort rule in-house because "TanStack's sorted row model reverses comparator results for descending order, which would put blank cells first". That is true of the default only. The column option `sortUndefined: "last"` is applied before the direction is negated and places blanks last both ways; the catch is that it tests for `undefined`, and rows carried `null`. So the table ran TanStack with no features, sorted outside it, and zipped its headers and cells back to an in-house `Column` list by index: two column abstractions where ADR 0001 asked for one. We decided to commit to TanStack instead. Absent facts on `LeaderboardRow` are `undefined`, one convention per type, with the snapshot's nulls stopping at `deriveRows`. `src/components/leaderboard-columns.tsx` exports one `tableOptions` value, `leaderboardTableOptions`: the column definitions built with `createColumnHelper`, presentation flags as typed meta (`tooltip`, `estimate`, `derived`, `align`, `bar`), and the sort rule as options: Pass@1 descending initially, `enableSortingRemoval: false` for the two-state toggle, `sortDescFirst: false` at table level with Pass@1 and Tok/s overriding to descending, `sortUndefined: "last"` on every figure column, and `getRowId` from model, effort and route. The table spreads those options over its rows and reads `getIsSorted` and `getToggleSortingHandler`.

Two earlier decisions fall with it. The Model comparator's access-route tiebreak (ADR 0005) can never fire on visible rows, which hold exactly one route per family, and TanStack's index fallback reproduces derivation order if it ever could; so `compareModel` is a module-level function of display name and effort rank, and no factory binds it to a Leaderboard instance. And the first sort direction is now best-first per column rather than descending for every figure: lower-is-better columns (Cost, Tokens, Steps, Cost/perf, Time) start ascending.

## Considered options

- **Drop TanStack and render the in-house column list directly**: also coherent, and the smaller diff, but keeps fifteen lines of sort machinery and its five tests that the library already covers with one option.
- **Keep `null` on rows and adapt in each accessor**: leaves two conventions on one type and a `?? undefined` on every nullable accessor.
- **Rely on TanStack's auto first direction**: it samples the first ten filtered rows and returns descending for an empty table, so Model would start descending after clearing every model. Two explicit options state the rule instead.
- **`invertSorting` on lower-is-better columns**: makes "descending" mean best-first, so the arrow would point down while values increase.

## Consequences

- `compareBlankLast`, `firstDirection`, `defaultSort`, `toggleSort`, `sortRows`, the `Column`, `ColumnSpec`, `ColumnId`, `Sort`, `SortDirection`, `LeaderboardColumns` and `CompareModel` types, `createColumns`, `routeOrder` and `Leaderboard.compareModel` are deleted. The table has no state of its own.
- Library behaviour is not tested. Asserted on the definitions: every figure column sets `sortUndefined: "last"` and accesses its own row value, and the first-direction and toggle options. The Model column's delegation to `compareModel` is asserted through the instance's row order, since a `sortFn` takes TanStack rows.
- Cells are tested through `useTable` and `FlexRender` rendered with `react-dom/server`, so a cell sees the context the table gives it, not a hand-built one.
- The e2e "sort survives a filter change" test now guards `autoResetSorting` staying at its default of false, and asserts Cost ascending.
- Supersedes the sort half of ADR 0007 and the route tiebreak of ADR 0005. ADR 0007's "Column" glossary term still holds: a column is one definition with its header, cell and sort facts.
