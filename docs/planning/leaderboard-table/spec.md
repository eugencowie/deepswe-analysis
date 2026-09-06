# Spec: Leaderboard table

Shows the DeepSWE v1.1 benchmark results in a table: the snapshot the app reads, the five source columns, the Model cell, formatting, and the first footer line. Every other feature extends this table and links here. Vocabulary: [docs/context.md](../../context.md). Source facts: [DeepSWE research](../product-spec/research/deepswe-leaderboard-data.md).

## Data file: `data/deepswe-v1.1.json`

Seed by copying [research/deepswe-v1.1-leaderboard.normalized.json](../product-spec/research/deepswe-v1.1-leaderboard.normalized.json) (62 entries, 25 models, captured 2026-08-20). Shape (already what the research capture produces):

```ts
type DeepsweSnapshot = {
  schema_version: 1;
  benchmark_version: "v1.1";
  source_url: string;
  source_generated_at: string;      // ISO timestamp from the artifact
  source_latest_job: { name: string; finished_at: string | null };  // null while the job runs; DeepSWE shows the rows anyway, so we do too
  n_tasks_in_set: number;           // 113
  source_scope: string;
  source_unit: string;
  raw_sha256: string;               // hash of the upstream artifact this was derived from
  cost_adjustments: { model: string; factor: number }[];
  entries: DeepsweEntry[];
};

type DeepsweEntry = {
  model: string;                    // site model id, e.g. "claude-fable-5"
  effort: string | null;            // null = model's default effort
  pass_at_1: number;                // fraction 0..1
  average_cost_usd: number;         // display-adjusted (see cost trap below)
  output_tokens: number;            // per-attempt mean, includes reasoning tokens
  steps: number;                    // agent turns per attempt
  n_scored_attempts: number;
  source_config: string;
  raw_average_cost_usd: number;
  cost_adjustment_factor: number;
};
```

## Rows

Every entry gets an **API row**: 62 rows from the current data. [Subscription data](../subscription-data/spec.md) adds tier rows beside them.

Blank cells render as "–". Rows are never hidden for missing data.

## App

Single page, one table, titled "DeepSWE enhanced" (page title and h1).

- Columns (headers match DeepSWE's style where possible): Model, Pass@1, Avg cost, Out tok, Steps. Effort is **not** a column — it renders inside the Model cell as a DeepSWE-style bracket ("Claude Opus 5 [max]", nothing for default effort). The Model cell shows the leaderboard model id; [model data](../model-data/spec.md) replaces it with the display name and vendor mark.
- Toolbar (mirrors the DeepSWE site's chrome — toggles left, dropdowns right; revised in effort-filter ticket 01's grilling, replacing the earlier vendor and effort-level filters): a static **v1.1** chip styled like an active toggle. The benchmark version is fixed; no disabled v1 control. The filter controls are specified by [effort filter](../effort-filter/spec.md), [model filter](../model-filter/spec.md), and [subscription filter](../subscription-filter/spec.md).
- Number formatting: avg cost as standard two-decimal currency ($4.33, $0.61); sub-cent values collapse to $0.01 or $0.00. Pass@1 as a whole percent (no error margin, diverging from DeepSWE's "74%±4%"); output tokens in thousands with a k suffix (118k); steps as integers. (Revised during ticket 01 from three-significant-figure costs and one-decimal percents, after a side-by-side with the DeepSWE site.)
- Attempt counts (`n_scored_attempts`) are not displayed anywhere, matching the DeepSWE site.
- Footer: DeepSWE v1.1 snapshot date read from `source_generated_at` (ticket 01). Features that ship further data add their own lines.

## Acceptance criteria

- The build succeeds with the seed data and derives one row per entry (62). Spot-checked: Luna's costs are the display-adjusted values, not raw.

## Tickets

- [01: Base leaderboard table of API rows](tickets/01-base-api-rows-table.md)
