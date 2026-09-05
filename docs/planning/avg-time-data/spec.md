# Spec: Average time data

Adds throughput-derived average time to the [leaderboard table](../leaderboard-table/spec.md): the OpenRouter throughput snapshot, the model mapping's OpenRouter id, the derivation, and the Tok/s and Avg time columns. Vocabulary: throughput, consumer endpoint, average time in [docs/context.md](../../context.md). Source facts: [OpenRouter research](../subsidised-leaderboard/research/openrouter-throughput.md).

## Data file: `data/openrouter-throughput.json`

One snapshot object; all models fetched in one run, one `capturedAt`:

```ts
type ThroughputSnapshot = {
  capturedAt: string;
  models: Record<string, {          // key: OpenRouter model id (revision-pinned, ADR 0002)
    consumerP50: number;            // tokens/sec, p50 of the vendor's consumer endpoint
  }>;
};
```

Semantics revised 2026-08-25 ([ADR 0002](../../architecture/0002-throughput-consumer-endpoint.md)): the original seed stored `medianP50`, the median across all default-tier endpoints; the field is now the vendor's consumer-endpoint p50, and models whose vendor runs no consumer endpoint are omitted (blank in the UI). Revised again in ticket 11's grilling (2026-08-27): the once-planned per-model endpoint detail (`endpoints: { tag, provider, p50 }[]`) is dropped — selection is a guarded slug match against `data/vendor-mapping.json`, so the refresh run's warnings and errors carry the audit trail and the checked-in file keeps only what the app reads.

## Model mapping field

`openrouterId` in the [model mapping](../model-data/spec.md) links a leaderboard model to its revision-pinned OpenRouter listing. `openrouterId: null` is allowed and yields blank throughput/time.

## Derivation rules

- `throughput` = the mapping's OpenRouter model's `consumerP50` (ADR 0002), shared across effort levels; blank if unmapped or absent from the snapshot.
- `averageTimeSeconds` = `output_tokens / throughput`; blank when throughput is blank. Display as `Xm Ys`.

**Token-semantics convention** (settling the fog item): DeepSWE output tokens include provider-reported reasoning tokens; OpenRouter throughput counts output tokens per generation second and reasoning tokens are output tokens in its accounting (documented inference, not a guarantee). Convention: treat both sides as reasoning-inclusive and divide directly. The Avg time column is labelled as an estimate in the UI (tooltip: excludes tool execution and gaps between the agent's calls).

## App

- Columns: Avg time (est), Tok/s (est), after the table's source columns. "(est)" marks them estimates, each with a tooltip (Avg time tooltip: "Output tokens ÷ vendor API throughput; excludes tool execution and gaps between the agent's calls"; Tok/s tooltip: "p50 throughput of the vendor's own consumer API (via OpenRouter stats). Not the speed measured in the benchmark run" — the key message is that the figure describes the vendor's consumer API measured by OpenRouter, not the benchmark run's own speed; ADR 0002).
- Number formatting: throughput always one decimal (40.0, not 40); avg time as `Xm Ys` with seconds rounded to nearest, minutes riding past 60 ("64m 10s", no hours unit), and a zero minute below sixty seconds ("0m 45s").
- Footer: OpenRouter capture date (ticket 07).

## Acceptance criteria

- Unit tests cover blank propagation: a model with no OpenRouter id or no snapshot entry gets blank throughput and time.

## Tickets

Not yet assigned. The tickets that built this feature are in [`subsidised-leaderboard/tickets/`](../subsidised-leaderboard/tickets/) until the ticket split; ticket numbers in this spec refer to that folder.
