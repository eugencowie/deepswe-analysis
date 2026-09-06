# Spec: Column sorting

Sorts the [leaderboard table](../leaderboard-table/spec.md) by any column.

- Sorting: every column sorts both ways via a two-state toggle (ascending ↔ descending, no unsorted state). Default sort: Pass@1 descending.
- Model sorts by display name with effort as tiebreaker, so a model's effort variants stay adjacent.
- Blank cells ("–") always sort last regardless of direction (custom TanStack comparator).
- Filters compose with sorting and never reset it.

## Acceptance criteria

- Sorting any column places "–" cells last in both directions.

## Tickets

None yet. Built in [leaderboard-table ticket 01](../leaderboard-table/tickets/01-base-api-rows-table.md).
