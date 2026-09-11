# 06: Rows carry their Best-entry status

Type: task
Status: ready-for-agent
Blocked by: none (can start immediately)

## What to build

The Best entry (docs/context.md) is chosen per model and is independent of access route, yet the visible-rows filter recomputes a best-per-model map on every call and then needs a guarded closure to avoid matching a missing model's default-effort rows. Decide bestness once, at row derivation, and store it on the row as a boolean. The visible-rows filter becomes a single predicate over model selection, family route and effort view, and the per-call map, the guarded closure and its comment disappear.

Best-view behaviour is unchanged: highest Pass@1 on the raw fraction, higher effort level wins an exact tie, the same entry is best on every access route.

## Acceptance criteria

- [ ] Each leaderboard row states whether it is its model's best entry; the value is identical across the model's access routes.
- [ ] The visible-rows filter is one predicate with no per-call intermediate state.
- [ ] Existing visible-rows tests (tie-break, same entry per route, single default-effort entry) pass without weakening.
- [ ] The e2e effort-toggle test passes unchanged; `vp check` and `vp test` are green.
