import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vite-plus/test";

import { createColumns, type ColumnId } from "./leaderboard-columns.tsx";
import type { LeaderboardRow } from "@/data/leaderboard";

// A family-"none" API row on a vendor with no mark, at default effort and
// unmapped, so cell text is the figures alone. Tests override what they exercise.
const row = (overrides: Partial<LeaderboardRow> = {}): LeaderboardRow => ({
  model: "test-model",
  displayName: "Test Model",
  vendor: "Test",
  family: "none",
  accessRoute: "api",
  passAt1: 0.7364864,
  effectiveCostUsd: 11.8375,
  costPerSolvedTaskUsd: 11.8375 / 0.7364864,
  apiCostUsd: 11.8375,
  apiCostPerSolvedTaskUsd: 11.8375 / 0.7364864,
  outputTokens: 117565.69,
  steps: 99.04,
  throughputTokPerSec: 58.75,
  averageTimeSeconds: 74,
  ...overrides,
});

// Model-column order for tests: display name only.
const byName = (a: LeaderboardRow, b: LeaderboardRow) =>
  a.displayName.localeCompare(b.displayName, "en");
const columns = createColumns({ compareModel: byName });

const markup = (columnId: ColumnId, r: LeaderboardRow) =>
  renderToStaticMarkup(<>{columns.columns.find((c) => c.id === columnId)!.cell(r)}</>);
const text = (columnId: ColumnId, r: LeaderboardRow) => markup(columnId, r).replace(/<[^>]+>/g, "");

describe("columns", () => {
  test("lists the source columns first, then the derived ones", () => {
    expect(
      columns.columns.map(({ id, header, derived }) => [id, header, derived ?? false]),
    ).toEqual([
      ["model", "Model", false],
      ["passAt1", "Pass@1", false],
      ["avgCost", "Cost", false],
      ["outTok", "Tokens", false],
      ["steps", "Steps", false],
      ["costPerf", "Cost/perf", true],
      ["avgTime", "Time", true],
      ["tokPerSec", "Tok/s", true],
    ]);
  });

  test("only Time is an estimate and only Pass@1 draws a bar", () => {
    expect(columns.columns.filter((c) => c.estimate).map((c) => c.id)).toEqual(["avgTime"]);
    expect(columns.columns.filter((c) => c.bar).map((c) => c.id)).toEqual(["passAt1"]);
    expect(columns.columns[1].bar?.(row({ passAt1: 0.25 }))).toBe(0.25);
  });

  test("right-aligns every column but Model", () => {
    expect(columns.columns.filter((c) => c.align === "left").map((c) => c.id)).toEqual(["model"]);
  });
});

describe("Model cell", () => {
  test("shows the display name, then the effort, then the access tag", () => {
    expect(text("model", row())).toBe("Test Model");
    expect(text("model", row({ effort: "xhigh" }))).toBe("Test Model xhigh");
    expect(
      text("model", row({ effort: "xhigh", accessTag: { label: "Max 20x", family: "claude" } })),
    ).toBe("Test Model xhighMax 20x");
  });

  test("exposes the pinned OpenRouter id in a tooltip only when mapped", () => {
    expect(markup("model", row())).toBe("Test Model");
    expect(markup("model", row({ openrouterId: "test/test-model" }))).toMatch(
      /^<span [^>]*data-slot="tooltip-trigger"[^>]*>Test Model<\/span>$/,
    );
  });
});

describe("figure cells", () => {
  test("Pass@1 is a whole percent", () => {
    expect(text("passAt1", row({ passAt1: 0.7364864 }))).toBe("74%");
    expect(text("passAt1", row({ passAt1: 0.728 }))).toBe("73%");
  });

  test("Cost is two-decimal currency, collapsing sub-cent values", () => {
    expect(text("avgCost", row({ effectiveCostUsd: 11.8375 }))).toBe("$11.84");
    expect(text("avgCost", row({ effectiveCostUsd: 1183.7 }))).toBe("$1,183.70");
    expect(text("avgCost", row({ effectiveCostUsd: 0.0061889 }))).toBe("$0.01");
    expect(text("avgCost", row({ effectiveCostUsd: 0.004 }))).toBe("$0.00");
  });

  test("tier rows strike out the API cost beside the effective cost", () => {
    const tier = row({
      accessRoute: "claude-max-20x",
      accessTag: { label: "Max 20x", family: "claude" },
      apiCostUsd: 11.8375,
      effectiveCostUsd: 0.6064,
      apiCostPerSolvedTaskUsd: 16,
      costPerSolvedTaskUsd: 0.8,
    });
    expect(markup("avgCost", tier)).toMatch(/^<s[^>]*>\$11\.84<\/s> \$0\.61$/);
    expect(markup("costPerf", tier)).toMatch(/^<s[^>]*>\$16\.00<\/s> \$0\.80$/);
    expect(markup("avgCost", row())).not.toContain("<s");
  });

  test("Cost/perf blanks both values when Pass@1 is zero", () => {
    const zero = row({
      accessRoute: "claude-pro",
      accessTag: { label: "Pro", family: "claude" },
      passAt1: 0,
      costPerSolvedTaskUsd: undefined,
      apiCostPerSolvedTaskUsd: undefined,
    });
    expect(markup("costPerf", zero)).toBe("–");
  });

  test("Tokens are thousands and Steps a whole number", () => {
    expect(text("outTok", row({ outputTokens: 117565.69 }))).toBe("118k");
    expect(text("outTok", row({ outputTokens: 3128 }))).toBe("3k");
    expect(text("steps", row({ steps: 99.04 }))).toBe("99");
    expect(text("steps", row({ steps: 123.5 }))).toBe("124");
  });

  test("Time is always minutes and seconds, rounded to the second", () => {
    expect(text("avgTime", row({ averageTimeSeconds: 74 }))).toBe("1m 14s");
    expect(text("avgTime", row({ averageTimeSeconds: 3850 }))).toBe("64m 10s");
    expect(text("avgTime", row({ averageTimeSeconds: 45 }))).toBe("0m 45s");
    expect(text("avgTime", row({ averageTimeSeconds: 74.6 }))).toBe("1m 15s");
    expect(text("avgTime", row({ averageTimeSeconds: 119.7 }))).toBe("2m 0s");
  });

  test("Tok/s always has one decimal", () => {
    expect(text("tokPerSec", row({ throughputTokPerSec: 58.75 }))).toBe("58.8");
    expect(text("tokPerSec", row({ throughputTokPerSec: 40 }))).toBe("40.0");
  });

  test("Time and Tok/s are blank without throughput", () => {
    const blank = row({ throughputTokPerSec: undefined, averageTimeSeconds: undefined });
    expect(text("avgTime", blank)).toBe("–");
    expect(text("tokPerSec", blank)).toBe("–");
  });
});

describe("sort", () => {
  const rows = [
    row({ displayName: "B", throughputTokPerSec: 30, passAt1: 0.5 }),
    row({ displayName: "C", throughputTokPerSec: undefined, passAt1: 0.7 }),
    row({ displayName: "A", throughputTokPerSec: 10, passAt1: 0.6 }),
  ];
  const names = (sorted: LeaderboardRow[]) => sorted.map((r) => r.displayName);

  test("defaults to Pass@1 descending", () => {
    expect(columns.defaultSort()).toEqual({ columnId: "passAt1", direction: "desc" });
    expect(names(columns.sortRows(rows, columns.defaultSort()))).toEqual(["C", "A", "B"]);
  });

  test("puts blanks last in both directions", () => {
    expect(names(columns.sortRows(rows, { columnId: "tokPerSec", direction: "desc" }))).toEqual([
      "B",
      "A",
      "C",
    ]);
    expect(names(columns.sortRows(rows, { columnId: "tokPerSec", direction: "asc" }))).toEqual([
      "A",
      "B",
      "C",
    ]);
  });

  test("orders the Model column by the Leaderboard's comparator both ways", () => {
    expect(names(columns.sortRows(rows, { columnId: "model", direction: "asc" }))).toEqual([
      "A",
      "B",
      "C",
    ]);
    expect(names(columns.sortRows(rows, { columnId: "model", direction: "desc" }))).toEqual([
      "C",
      "B",
      "A",
    ]);
  });

  test("orders each figure column by its own value", () => {
    // Every column sorts the four rows differently, so a column that sorted
    // by another column's value would produce the wrong order.
    const figures = [
      row({
        displayName: "a",
        passAt1: 0.9,
        effectiveCostUsd: 1,
        outputTokens: 2000,
        steps: 30,
        costPerSolvedTaskUsd: 40,
        averageTimeSeconds: 400,
        throughputTokPerSec: 10,
      }),
      row({
        displayName: "b",
        passAt1: 0.7,
        effectiveCostUsd: 3,
        outputTokens: 4000,
        steps: 10,
        costPerSolvedTaskUsd: 20,
        averageTimeSeconds: 200,
        throughputTokPerSec: 30,
      }),
      row({
        displayName: "c",
        passAt1: 0.5,
        effectiveCostUsd: 2,
        outputTokens: 1000,
        steps: 40,
        costPerSolvedTaskUsd: 30,
        averageTimeSeconds: 100,
        throughputTokPerSec: 40,
      }),
      row({
        displayName: "d",
        passAt1: 0.3,
        effectiveCostUsd: 4,
        outputTokens: 3000,
        steps: 20,
        costPerSolvedTaskUsd: 10,
        averageTimeSeconds: 300,
        throughputTokPerSec: 20,
      }),
    ];
    const expected: Record<Exclude<ColumnId, "model">, string[]> = {
      passAt1: ["a", "b", "c", "d"],
      avgCost: ["d", "b", "c", "a"],
      outTok: ["b", "d", "a", "c"],
      steps: ["c", "a", "d", "b"],
      costPerf: ["a", "c", "b", "d"],
      avgTime: ["a", "d", "b", "c"],
      tokPerSec: ["c", "b", "d", "a"],
    };
    for (const [columnId, order] of Object.entries(expected) as [ColumnId, string[]][]) {
      expect(names(columns.sortRows(figures, { columnId, direction: "desc" })), columnId).toEqual(
        order,
      );
    }
  });

  test("does not mutate its input", () => {
    const before = names(rows);
    columns.sortRows(rows, { columnId: "model", direction: "asc" });
    expect(names(rows)).toEqual(before);
  });

  test("toggling a sorted column flips it; a fresh column starts in its natural direction", () => {
    const sort = columns.defaultSort();
    expect(columns.toggleSort(sort, "passAt1")).toEqual({ columnId: "passAt1", direction: "asc" });
    expect(columns.toggleSort(sort, "avgCost")).toEqual({ columnId: "avgCost", direction: "desc" });
    expect(columns.toggleSort(sort, "model")).toEqual({ columnId: "model", direction: "asc" });
    expect(columns.toggleSort({ columnId: "model", direction: "asc" }, "model")).toEqual({
      columnId: "model",
      direction: "desc",
    });
  });
});
