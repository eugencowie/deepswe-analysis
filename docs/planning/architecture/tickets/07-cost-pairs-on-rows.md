# 07: Cost and cost per solved task become api/effective pairs

Type: task
Status: ready-for-agent
Blocked by: none (touches the same row type as 06; land in either order and rebase the second)

## What to build

A leaderboard row carries four cost fields: effective cost, API cost, cost per solved task and API cost per solved task. The last two are blank together (Pass@1 is 0) but the type cannot say so, which forces the struck-out cost helper to accept an optional API figure and render a blank that can never occur, and leaves the Cost and Cost/perf columns repeating the same API-row-or-struck-out branch.

Model cost on the row as a pair of API and effective figures, and cost per solved task as a single optional pair. One cost cell renders both columns from a pair; the struck-out helper takes two plain numbers. Column accessors read the effective half so sorting and blank-last placement are unchanged. Rendered cell text and markup stay the same.

## Acceptance criteria

- [ ] The row type expresses cost per solved task as one optional pair; no field pair can be half-blank.
- [ ] Cost and Cost/perf share one cell renderer; the struck-out helper has no optional parameter.
- [ ] Column tests asserting the struck-out markup, the blank on Pass@1 = 0, and sort order pass, updated only for the new field names.
- [ ] The e2e struck-out-cost test passes unchanged; `vp check` and `vp test` are green.
