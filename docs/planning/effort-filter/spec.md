# Spec: Effort filter

Picks whether the [leaderboard table](../leaderboard-table/spec.md) shows all effort levels or only each model's best entry. Vocabulary: effort level, best entry in [docs/context.md](../../context.md).

- **Best / All effort levels** toggle in the toolbar, defaulting to Best. Best = each model's best entry: highest Pass@1 on the raw fraction, higher effort level on an exact tie (effort order default → minimal → low → medium → high → xhigh → max; a single-entry model always keeps its entry). Route-independent, since tier rows share their entry's Pass@1. This matches the DeepSWE site's Best view; the earlier "highest effort" rule was corrected in ticket 22.
- Default view: **Best** entries — 25 rows, one per model; other effort levels are opt-in via the toolbar.
- Semantics shared with the other filters: intersection across controls; filters compose with sorting and never reset it. Filter state is in-memory only — URL persistence, a reset button, and a row counter were considered and deliberately left out of ticket 09.

## Acceptance criteria

- The default view shows the 25 best-entry rows, one per model.

## Tickets

Not yet assigned. The tickets that built this feature are in [`subsidised-leaderboard/tickets/`](../subsidised-leaderboard/tickets/) until the ticket split; ticket numbers in this spec refer to that folder.
