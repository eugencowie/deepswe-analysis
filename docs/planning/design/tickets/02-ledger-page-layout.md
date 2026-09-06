# 02: Ledger page layout

Type: prototype
Status: resolved

## Question

What should the page look like so a first-time visitor sees the ranking,
the cost story, and the subscription angle without opening a dropdown?

## Prototype

Three full-page variants on the existing route, switched by `?variant=`
in dev builds only. Branch `prototype/page-design-options`, commit
`c171682`; the design plan and the review against generic defaults are in
`src/prototype/README.md` on that branch.

- A, Ledger. Single column. A masthead with a one-sentence description
  and the source links folded into it. A rank column. Pass@1 drawn as a
  purple bar behind the figure.
- B, Sidebar. The filter form always visible on the left with tier
  discounts beside each radio; Pass@1 and cost per solved task in a
  heavier weight in the table.
- C, Chart-led. A scatter of cost per solved task against Pass@1 with the
  Pareto front in purple, above a compact table.

## Answer

A, Ledger. Chosen by the user on 2026-09-06 after flipping through all
three in light and dark mode.

## What changed in main

- The header is a masthead: 28px title with a 40px mark, a sentence
  saying what the page compares, and the three source links as a
  provenance line beneath it. The footer is gone.
- The toolbar sits on a rule directly above the table.
- Pass@1 draws a bar behind the figure on a fixed 0 to 100% scale. Purple
  in the prototype, neutral grey after the follow-up below.
  It is the only column with a bar; every other column is an open scale.
- Effort levels lose their square brackets: "Claude Fable 5 xhigh" in a
  small muted weight. A real space precedes the word so copied text and
  the accessible name stay readable.
- Column headers shorten to Cost, Tokens, Cost/perf, Time, Tok/s. Time
  and Tok/s carry a small muted "est" after the name instead of the old
  "(est)". The derived columns keep their tooltips and the separating
  rule. The prototype's "$/solved" was tried and reverted to "Cost/perf",
  which reads as benchmark vocabulary to this audience; the tooltip
  carries the definition.
- Unsorted column headers are muted; the sorted one is in the foreground.

## Acceptance criteria

- [x] Masthead, provenance line and rule above the toolbar
- [x] Pass@1 bar in both themes
- [x] Effort level without brackets, accessible name keeps its space
- [x] `vp run ready` and the e2e task pass

## Comments

**2026-09-06**. Prototyped and folded in. The prototype's own code was not
promoted; the table component gained an optional `bar` on its column spec
and App.tsx gained the masthead. The e2e filter tests
were updated for the new cell names and the "Cost" header. Verified light
and dark with Playwright screenshots.

**2026-09-06**. Rank column removed at the user's request after seeing it
in the real page. The prototype branch still has it.

**2026-09-06**. Follow-ups in the same session: the Subscriptions trigger
and the three derived columns carry a faint brand tint, marking what the
site adds over DeepSWE. The Pass@1 bar became neutral grey so purple means
"enhanced" and nothing else.

**2026-09-06**. Code review follow-up, decided with the user: headers are
Cost, Tokens, Cost/perf, Time est, Tok/s est. The provenance line drops
the benchmark version (the v1.1 chip has it). The Pass@1 figure stays
medium weight over the bar. The effort word keeps both a real space and a
margin. "est" stays muted on a sorted column. The derived-column tint is
fainter than the trigger's on purpose. The glossary gained "Enhancement"
for what purple marks. The column spec's `qualifier` string became an
`estimate` flag and `bar` a flag that reuses the column's value.
