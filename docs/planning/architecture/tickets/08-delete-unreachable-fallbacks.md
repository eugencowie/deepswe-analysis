# 08: Delete unreachable fallbacks after coverage checks

Type: task
Status: ready-for-agent
Blocked by: none (can start immediately)

## What to build

Three places prove coverage and then re-check it because a map lookup still types as possibly undefined:

- The mapping generator filters candidate listings to known vendors, then skips a candidate whose vendor lookup fails.
- The throughput snapshot builder throws on any vendor missing from the vendor mapping, then treats a missing slug the same as an explicit null, blurring the distinction the vendor mapping exists to record.
- The family-vendor lookup for the Subscriptions picker falls back to an empty vendor that only synthetic test fixtures ever hit, after load-time invariants guarantee one vendor per family.

Resolve each lookup once into a typed structure (candidates paired with their vendor info; a slug map holding only mapped vendors read through a throwing getter; a family vendor supplied by the fixture) so the fallback branches go away and the boundary is stated once.

## Acceptance criteria

- [ ] None of the three modules contains a branch that only handles a state an earlier check already excluded.
- [ ] Missing-vendor and null-slug remain distinguishable outcomes in the throughput builder, and its tests assert both.
- [ ] Leaderboard fixtures that relied on the empty-vendor fallback set a vendor explicitly.
- [ ] Mapping-generation, OpenRouter snapshot and leaderboard tests pass; `vp check` and `vp test` are green.
