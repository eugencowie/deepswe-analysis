# Spec: Model filter

Picks which models the [leaderboard table](../leaderboard-table/spec.md) includes.

- **Models picker** in the toolbar: per-model include/exclude multi-select keyed on the leaderboard model id, labelled with `displayName` (alphabetical), all ticked by default, with a "(25/25)" count and Select all / Clear. Unticking a model removes all its rows. Empty selection shows DeepSWE's copy: "No models selected. Use the Models menu to pick one or more."
- Semantics: union within the Models picker, intersection across controls; filters compose with sorting and never reset it. Filter state is in-memory only — URL persistence, a reset button, and a row counter were considered and deliberately left out of ticket 09.

## Acceptance criteria

- Unticking a model removes all its rows (all efforts, all access routes).

## Tickets

Not yet assigned. The tickets that built this feature are in [`subsidised-leaderboard/tickets/`](../subsidised-leaderboard/tickets/) until the ticket split; ticket numbers in this spec refer to that folder.
