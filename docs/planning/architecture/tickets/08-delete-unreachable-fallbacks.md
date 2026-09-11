# 08: Delete unreachable fallbacks after coverage checks

Type: task
Status: resolved
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

## Decisions (grilled 2026-09-11)

- Mapping generator: one pass pairs each matching listing with its vendor info, so `candidates` is `{ listing, vendor }[]` and the second lookup goes. The ambiguity check stays org-slug based (unchanged behaviour); `datedSiblings` is untouched.
- Snapshot builder: no throwing getter. The coverage check becomes the resolution: one pass over the mapping builds `{ entry, slug: string | null }[]` and collects missing vendors, throwing with the full list (same message) before the unauthenticated check. The main loop's only slug branch is `slug === null`.
- Snapshot tests: keep the existing missing-vendor and null-slug tests; add a case where the missing vendor appears only on an entry with a null OpenRouter id, proving coverage is checked over the whole mapping.
- Leaderboard: `assertFamilyVendors` becomes `familyVendors(mapping)` returning `Record<"claude" | "chatgpt", string>`, iterating a fixed picker-family list exported from `schema.ts` beside the family enum (the `tiers` argument drops; messages and the two schema tests keep their wording). `sources.ts` exports the result, `LeaderboardSources` gains `familyVendors`, `createLeaderboard` reads it, and `familyVendor` plus its empty-string fallback are deleted.
- Leaderboard fixtures: the shared test `sources` object spreads the live `familyVendors` export, so the three fixtures that hit the fallback inherit real vendors explicitly through the spread.
- Glossary: the Subscription family entry gains the one-vendor-per-family rule. No new term; no ADR (reversible, unsurprising).
- Delivery: one PR, three commits ordered generator, snapshot builder, leaderboard, each green on its own.

## Answer

Each of the three lookups now resolves once. The mapping generator pairs every candidate listing with its vendor info in the filter pass. The throughput builder resolves each mapping entry to its vendor's consumer provider slug in the coverage check itself, so a missing vendor throws before any per-model work and the main loop's only slug branch is the explicit null. The leaderboard takes `familyVendors` as a source: the load-time invariant returns the record it proves, `sources.ts` exports it, and the empty-vendor fallback is gone. The picker-family list lives in `schema.ts` beside the family enum.

Validation: `vp check` passes; `vp test` passes all 168 tests across 11 files; `mise run e2e` passes all 11 browser tests. Each of the three site commits is green on its own. A review pass renamed the resolver to `resolveConsumerSlugs`, named its pair type, corrected two leaderboard comments, and moved `AccessTag.family` to the shared `PickerFamilyId`. Left for ticket 10: the five-field `createLeaderboard` call is still spelled out at four call sites.

