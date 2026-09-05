# Spec: Subscription filter

Picks one access route per subscription family — API or a tier — for the rows [subscription data](../subscription-data/spec.md) adds to the [leaderboard table](../leaderboard-table/spec.md). Vocabulary: Subscriptions picker, access route, subscription family, tier discount in [docs/context.md](../../context.md).

- **Subscriptions picker** in the toolbar: one dropdown, two labelled radio sections — Claude (API / Pro / Max 5x / Max 20x) and ChatGPT (API / Plus / Pro 5x / Pro 20x), labels from `tier.shortLabel`. Exactly one access route per family, API by default, so every entry appears on exactly one row: the picker changes pricing, never row count (Best is always 25 rows, All always 62). The trigger shows only non-API picks — plain "Subscriptions" by default, "Subscriptions: Max 5x" with a tier picked; no count. Tier items carry neutral outline badges (not the family colours): the tier discount ((1 − subsidisation factor) × 100 at usage multiplier 1.0, one decimal where needed) plus a per-model badge for family models with a non-standard multiplier, labelled by the mapping's short name ("Fable: −90%"). A muted disclaimer sits below the sections: "Subscription costs are estimates: the struck-out API cost scaled by the tier's discount." Models with family `none` always show regardless of this picker. (Revised in ticket 12's grilling from ticket 09's min-one checkbox sections, whose strikeout keeps the API baseline visible on tier rows.)
- Default view: **API only**; tiers are opt-in via the toolbar.
- The model mapping's `shortName` is an optional UI short label falling back to `displayName`; only claude-fable-5 sets it ("Fable", matching the Claude usage screen — added in ticket 12).
- Semantics: one pick per family in Subscriptions, intersection across controls; filters compose with sorting and never reset it. Filter state is in-memory only — URL persistence, a reset button, and a row counter were considered and deliberately left out of ticket 09.

## Acceptance criteria

- The picker changes pricing, never row count: Best shows 25 rows and All 62 in every picker state.

## Tickets

Not yet assigned. The tickets that built this feature are in [`subsidised-leaderboard/tickets/`](../subsidised-leaderboard/tickets/) until the ticket split; ticket numbers in this spec refer to that folder.
