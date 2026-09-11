# 07: Cost and cost per solved task become api/effective pairs

Type: task
Status: resolved
Blocked by: none (06 is already resolved)

## What to build

A leaderboard row carries four cost fields: effective cost, API cost, cost per solved task and API cost per solved task. The last two are blank together (Pass@1 is 0) but the type cannot say so, which forces the struck-out cost helper to accept an optional API figure and render a blank that can never occur, and leaves the Cost and Cost/perf columns repeating the same API-row-or-struck-out branch.

Model cost on the row as a pair of API and effective figures, and cost per solved task as a single optional pair. One cost cell renders both columns from a pair; the struck-out helper takes two plain numbers. Column accessors read the effective half so sorting and blank-last placement are unchanged. Rendered cell text and markup stay the same.

## Acceptance criteria

- [x] The row type expresses cost per solved task as one optional pair; no field pair can be half-blank.
- [x] Cost and Cost/perf share one cell renderer; the struck-out helper has no optional parameter.
- [x] Column tests preserve struck-out markup and Pass@1 = 0 blank assertions. Cost accessor tests assert effective values and `undefined` for absent cost per solved task instead of accessor-key strings; column IDs and blank-last settings remain unchanged.
- [x] The e2e struck-out-cost test passes unchanged; `vp check` and `vp test` are green.

## Decisions (grilled 2026-09-11)

- Row fields: `cost: CostPair` and `costPerSolvedTask: CostPair | undefined`, with `CostPair` containing required `api: number` and `effective: number` fields. Absence applies to the whole cost-per-solved-task pair, following ADR 0008's `undefined` convention.
- The glossary's Cost per solved task remains the effective measure. API cost per solved task names its API counterpart; both are undefined when Pass@1 is zero, including when cost is zero. Cost pair remains a code term, not a glossary entry.
- Cost columns use function accessors returning `cost.effective` and `costPerSolvedTask?.effective`, with existing column IDs preserved. Tests assert returned values and blank-last settings, following ADR 0008's choice to test column definitions rather than retest library sorting. Rendering assertions and the e2e struck-out-cost test stay unchanged.
- One private cost renderer accepts a `CostPair | undefined` and the access route. An absent pair renders `–`; API routes render one figure; tier routes use the struck-out helper, which takes two required numbers. Access route determines presentation even when the API and effective figures are equal.
- No ADR: this is a reversible representation change within the existing Leaderboard and Column module boundaries, with no new architectural trade-off.

## Answer

Rows now carry complete API/effective cost pairs, with one absent cost-per-solved-task pair when Pass@1 is zero. Both cost columns use the same private renderer and access the effective figure for sorting; the struck-out helper requires both numbers. All callers and fixtures use the new fields, and the old scalar cost-per-solved-task helper is deleted.

Validation: `mise run check` passes; `mise run test` passes all 166 tests across 11 files; the unchanged e2e struck-out-cost test passes against a fresh production build. Column tests preserve rendering assertions and verify effective accessor values and blank-last settings.
