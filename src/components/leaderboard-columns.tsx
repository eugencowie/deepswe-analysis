// The leaderboard's columns: every question the table asks about a column
// (header, cell, tint, bar) and the sort rule (default sort, the two-state
// toggle, blanks last in both directions). Built once per Leaderboard so the
// Model column's order is bound in; the table renders whatever the list
// contains and keeps only the sort state.

import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/components/ui/utils";
import { VendorMark } from "@/components/vendor-mark";
import type { LeaderboardRow } from "@/data/leaderboard";

export type ColumnId =
  | "model"
  | "passAt1"
  | "avgCost"
  | "costPerf"
  | "outTok"
  | "steps"
  | "avgTime"
  | "tokPerSec";

export type SortDirection = "asc" | "desc";

// One column and a direction. There is no unsorted state.
export type Sort = { columnId: ColumnId; direction: SortDirection };

// What the table reads to render a column. Sort facts stay behind sortRows
// and toggleSort.
export type Column = {
  id: ColumnId;
  header: string;
  tooltip?: string;
  // Figures are estimates rather than measurements: the header carries a
  // small muted "est" and the tooltip says what is left out.
  estimate?: true;
  align: "left" | "right";
  // Derived columns are computed by this project rather than reported by the
  // DeepSWE leaderboard: an enhancement, so they carry the brand tint and a
  // rule sets them apart from the source columns.
  derived?: boolean;
  // A 0..1 fraction drawn as a bar behind the cell, so the column's order
  // reads at a glance. Pass@1 only: it is the one column on a fixed scale.
  bar?: (row: LeaderboardRow) => number | null;
  cell: (row: LeaderboardRow) => ReactNode;
};

export type LeaderboardColumns = {
  columns: Column[];
  // Pass@1, descending.
  defaultSort: () => Sort;
  // A sorted column flips direction; a fresh column starts in its natural
  // direction.
  toggleSort: (sort: Sort, columnId: ColumnId) => Sort;
  sortRows: (rows: LeaderboardRow[], sort: Sort) => LeaderboardRow[];
};

export type CompareModel = (a: LeaderboardRow, b: LeaderboardRow) => number;

type ColumnSpec = Column & {
  firstDirection: SortDirection;
  // Direction is an input rather than applied by negating the result, so
  // blank cells sort last both ways.
  compare: (a: LeaderboardRow, b: LeaderboardRow, direction: SortDirection) => number;
};

export function createColumns({
  compareModel,
}: {
  compareModel: CompareModel;
}): LeaderboardColumns {
  const specs: ColumnSpec[] = [
    {
      id: "model",
      header: "Model",
      align: "left",
      firstDirection: "asc",
      compare: (a, b, direction) => (direction === "asc" ? compareModel(a, b) : compareModel(b, a)),
      cell: modelCell,
    },
    numericColumn({
      id: "passAt1",
      header: "Pass@1",
      bar: true,
      value: (row) => row.passAt1,
      cell: (row) => formatPassAt1(row.passAt1),
    }),
    numericColumn({
      id: "avgCost",
      header: "Cost",
      value: (row) => row.effectiveCostUsd,
      cell: (row) =>
        row.accessRoute === "api"
          ? formatUsd(row.effectiveCostUsd)
          : struckCost(row.apiCostUsd, row.effectiveCostUsd),
    }),
    numericColumn({
      id: "outTok",
      header: "Tokens",
      value: (row) => row.outputTokens,
      cell: (row) => formatTokens(row.outputTokens),
    }),
    numericColumn({
      id: "steps",
      header: "Steps",
      value: (row) => row.steps,
      cell: (row) => formatInteger(row.steps),
    }),
    numericColumn({
      id: "costPerf",
      header: "Cost/perf",
      tooltip: "Cost ÷ Pass@1: what you pay per task actually solved",
      derived: true,
      value: (row) => row.costPerSolvedTaskUsd,
      // Pass@1 = 0 blanks both values, rendering a single blank cell.
      cell: (row) =>
        row.accessRoute === "api" || row.costPerSolvedTaskUsd === null
          ? formatUsd(row.costPerSolvedTaskUsd)
          : struckCost(row.apiCostPerSolvedTaskUsd, row.costPerSolvedTaskUsd),
    }),
    numericColumn({
      id: "avgTime",
      header: "Time",
      estimate: true,
      tooltip:
        "Output tokens ÷ vendor API throughput; excludes tool execution and gaps between the agent's calls",
      derived: true,
      value: (row) => row.averageTimeSeconds,
      cell: (row) => formatDuration(row.averageTimeSeconds),
    }),
    numericColumn({
      id: "tokPerSec",
      header: "Tok/s",
      // A measurement (OpenRouter's p50), not an estimate: only Time, which
      // is derived from it, carries "est".
      tooltip:
        "p50 throughput of the vendor's own consumer API (via OpenRouter stats). Not the speed measured in the benchmark run",
      derived: true,
      value: (row) => row.throughputTokPerSec,
      cell: (row) => formatThroughput(row.throughputTokPerSec),
    }),
  ];
  const byId = Object.fromEntries(specs.map((s) => [s.id, s])) as Record<ColumnId, ColumnSpec>;

  return {
    columns: specs.map(({ firstDirection: _first, compare: _compare, ...column }) => column),
    defaultSort: () => ({ columnId: "passAt1", direction: "desc" }),
    toggleSort: (sort, columnId) =>
      sort.columnId === columnId
        ? { columnId, direction: sort.direction === "asc" ? "desc" : "asc" }
        : { columnId, direction: byId[columnId].firstDirection },
    sortRows: (rows, sort) => {
      const { compare } = byId[sort.columnId];
      return rows.toSorted((a, b) => compare(a, b, sort.direction));
    },
  };
}

function numericColumn({
  value,
  bar,
  ...spec
}: Omit<Column, "align" | "bar"> & {
  bar?: true; // draw the column's value as a bar; the value must be a 0..1 fraction
  value: (row: LeaderboardRow) => number | null;
}): ColumnSpec {
  return {
    ...spec,
    bar: bar ? value : undefined,
    align: "right",
    firstDirection: "desc",
    compare: (a, b, direction) => compareBlankLast(value(a), value(b), direction),
  };
}

function compareBlankLast(a: number | null, b: number | null, direction: SortDirection): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return direction === "asc" ? a - b : b - a;
}

// Access tags are colour-coded by subscription family.
const tagClassByFamily = {
  claude: "border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400",
  chatgpt: "border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400",
};

// The display name mirrors DeepSWE and omits the model revision; the tooltip
// exposes the pinned OpenRouter id for readers cross-checking model cards
// (ADR 0002).
function modelCell(row: LeaderboardRow): ReactNode {
  return (
    <>
      <VendorMark vendor={row.vendor} className="mr-1.5" />
      {row.openrouterId === null ? (
        row.displayName
      ) : (
        <Tooltip>
          <TooltipTrigger render={<span />}>{row.displayName}</TooltipTrigger>
          <TooltipContent>{row.openrouterId}</TooltipContent>
        </Tooltip>
      )}
      {row.effort !== null && (
        // A real space, so copied text and the accessible name stay readable.
        <>
          {" "}
          <span className="ml-1 text-xs text-muted-foreground">{row.effort}</span>
        </>
      )}
      {row.accessTag && (
        <Badge variant="outline" className={cn("ml-2", tagClassByFamily[row.accessTag.family])}>
          {row.accessTag.label}
        </Badge>
      )}
    </>
  );
}

// A tier row's cost: the API cost struck out beside the effective cost.
function struckCost(apiUsd: number | null, effectiveUsd: number | null): ReactNode {
  return (
    <>
      <s className="text-muted-foreground">{formatUsd(apiUsd)}</s> {formatUsd(effectiveUsd)}
    </>
  );
}

const BLANK = "–";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

// Standard two-decimal currency. Sub-cent values collapse to $0.01 or $0.00
// on purpose: tier rows produce tiny costs, and "effectively free" reads
// better than a string of leading zeros.
function formatUsd(value: number | null): string {
  if (value === null) return BLANK;
  return usd.format(value);
}

function formatPassAt1(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

function formatTokens(value: number): string {
  return `${Math.round(value / 1000)}k`;
}

// Always one decimal, so a right-aligned column doesn't go ragged on whole
// numbers.
function formatThroughput(value: number | null): string {
  if (value === null) return BLANK;
  return value.toFixed(1);
}

// Always "Xm Ys": minutes ride past 60 and sub-minute values keep the zero
// minute, so the column reads uniformly across its whole range.
function formatDuration(seconds: number | null): string {
  if (seconds === null) return BLANK;
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}m ${whole % 60}s`;
}

function formatInteger(value: number): string {
  return `${Math.round(value)}`;
}
