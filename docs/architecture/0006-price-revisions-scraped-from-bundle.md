# Price revisions are scraped from the DeepSWE bundle and applied per entry

The DeepSWE site retroactively reprices some models' costs, but publishes the rule only inside its deployed JavaScript bundle: per model, old and new list prices per million input, cached-input, and output tokens, with the factor derived per row from that row's mean token counts. We had reduced this to a hand-typed scalar per model, which was missing four of seven models by 2026-09-06 and cannot express a non-uniform revision at all (gpt-5-6-sol's factor differs at each effort level). We decided to store the price revisions themselves in `data/price-revisions.json`, compute each entry's cost adjustment factor in the refresh from its token means, and have every refresh extract the table from the bundle, committing any change through the Refresh PR and hard-erroring when extraction fails (ticket 10).

## Considered options

- **Per-model scalar, hand-maintained** (the old rule): simple, but wrong in shape for non-uniform revisions and goes stale silently, since nothing in the artifact signals a repricing.
- **Per-entry scalars, hand-computed**: matches today's numbers but decays whenever the live artifact's token means move.
- **Rates in the file, hand-maintained, no scrape**: right shape, but the same silence that let the old table go stale.
- **Scrape and warn on mismatch**: keeps the run green, which is exactly how the drift stayed unnoticed; failing loudly is the point.

## Consequences

- The refresh depends on a minified third-party bundle keeping a recognisable price-table shape. The extractor keys on that shape, not on minified names, and a redeploy that breaks it turns the weekly run red until a human fixes the extractor or confirms the site dropped the table.
- The snapshot carries each entry's token means and factor, so any adjusted cost in a Refresh PR diff can be recomputed by hand from the same PR.
- The version-bump workflow no longer includes a hand re-check of the bundle.
