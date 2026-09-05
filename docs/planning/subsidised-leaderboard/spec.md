# Spec: Subsidised leaderboard

A static web app extending the DeepSWE v1.1 leaderboard with average time (via OpenRouter throughput), subscription-subsidised effective costs (via SemiAnalysis tier figures), and cost per solved task, as separate sortable/filterable rows per access route. Vocabulary: [docs/context.md](../../context.md). Decisions: [charting grilling](tickets/01-charting-grilling.md). Source facts: [DeepSWE research](research/deepswe-leaderboard-data.md), [OpenRouter research](research/openrouter-throughput.md).

The tool is a deliberately rough comparison. Every derived number follows one stated convention; none is presented as a measurement.

This spec was split into one spec per feature on 2026-09-05. Ticket references in those specs still point at [tickets/](tickets/) here.

- [Leaderboard table](../leaderboard-table/spec.md): shows the DeepSWE v1.1 benchmark results in a table.
- [Model data](../model-data/spec.md): display names and vendor marks, and the model mapping file.
- [Column sorting](../column-sorting/spec.md): sorting by any column.
- [Effort filter](../effort-filter/spec.md): all effort levels or each model's best.
- [Model filter](../model-filter/spec.md): which models to include.
- [Subscription filter](../subscription-filter/spec.md): one access route per subscription family.
- [Subscription data](../subscription-data/spec.md): subscription-subsidised effective costs.
- [Average time data](../avg-time-data/spec.md): throughput-derived average time.
- [Cost per task data](../cost-per-task-data/spec.md): cost per solved task.
- [Automated refresh](../automated-refresh/spec.md): keeps the snapshots and mapping up to date.
- [Project structure](../project-structure/spec.md): toolchain, repo layout, app stack.
- [Continuous integration](../continuous-integration/spec.md): the `vp run ready` gate and the e2e smoke.
- [Continuous deployment](../continuous-deployment/spec.md): GitHub Pages deploy.

[Dark mode](../dark-mode/spec.md) and [architecture](../architecture/) were separate efforts already.
