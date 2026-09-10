import { useMemo, useState, type ReactNode } from "react";
import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import { ArrowDown, ArrowUp } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/components/ui/utils";
import type { Column, LeaderboardColumns } from "@/components/leaderboard-columns";
import type { LeaderboardRow } from "@/data/leaderboard";

// Classes shared by a column's header and cells. Both are tinted and ruled
// the same way so the two cannot drift apart. The tint is fainter than the
// Subscriptions trigger's because it covers a large area.
const columnClasses = (columns: Column[], index: number) => {
  const column = columns[index];
  const derivedBoundary = column.derived === true && columns[index - 1]?.derived !== true;
  return cn(
    column.align === "right" && "text-right",
    column.derived && "bg-brand/5 dark:bg-brand/8",
    derivedBoundary && "border-l border-brand/30",
  );
};

const features = tableFeatures({});
const helper = createColumnHelper<typeof features, LeaderboardRow>();

export function LeaderboardTable({
  rows,
  columns,
  empty,
}: {
  rows: LeaderboardRow[];
  columns: LeaderboardColumns;
  empty?: ReactNode;
}) {
  const [sort, setSort] = useState(columns.defaultSort);

  // Sorting lives outside TanStack: its sorted row model reverses comparator
  // results for descending order, which would put blank cells first.
  const sortedRows = useMemo(() => columns.sortRows(rows, sort), [columns, rows, sort]);

  const tanstackColumns = useMemo(
    () =>
      helper.columns(
        columns.columns.map((column) =>
          helper.display({
            id: column.id,
            header: column.header,
            cell: ({ row }) => column.cell(row.original),
          }),
        ),
      ),
    [columns],
  );
  const table = useTable({ features, columns: tanstackColumns, data: sortedRows });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((group) => (
          <TableRow key={group.id} className="text-muted-foreground">
            {/* Column order never changes, so headers zip with columns by index. */}
            {group.headers.map((header, index) => {
              const column = columns.columns[index];
              const isSorted = sort.columnId === column.id;
              const label = (
                <>
                  <span
                    className={cn(
                      column.tooltip && "underline decoration-dotted underline-offset-4",
                    )}
                  >
                    <table.FlexRender header={header} />
                  </span>
                  {column.estimate && (
                    <span className="ml-1 text-[11px] font-normal text-muted-foreground/80">
                      est
                    </span>
                  )}
                </>
              );
              return (
                <TableHead
                  key={header.id}
                  aria-sort={
                    isSorted ? (sort.direction === "asc" ? "ascending" : "descending") : undefined
                  }
                  className={cn(columnClasses(columns.columns, index), column.bar && "w-40")}
                >
                  <button
                    type="button"
                    onClick={() => setSort((current) => columns.toggleSort(current, column.id))}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-1 font-medium",
                      isSorted && "text-foreground",
                    )}
                  >
                    {column.tooltip ? (
                      <Tooltip>
                        <TooltipTrigger render={<span />}>{label}</TooltipTrigger>
                        <TooltipContent>{column.tooltip}</TooltipContent>
                      </Tooltip>
                    ) : (
                      label
                    )}
                    {isSorted &&
                      (sort.direction === "asc" ? (
                        <ArrowUp aria-hidden className="size-3.5" />
                      ) : (
                        <ArrowDown aria-hidden className="size-3.5" />
                      ))}
                  </button>
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {rows.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={columns.columns.length}
              className="py-8 text-center text-muted-foreground"
            >
              {empty}
            </TableCell>
          </TableRow>
        )}
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getAllCells().map((cell, index) => {
              const column = columns.columns[index];
              const bar = column.bar?.(row.original) ?? null;
              return (
                <TableCell
                  key={cell.id}
                  className={cn(
                    "py-1.5",
                    columnClasses(columns.columns, index),
                    column.align === "right" && "tabular-nums",
                  )}
                >
                  {bar === null ? (
                    <table.FlexRender cell={cell} />
                  ) : (
                    <span className="relative block h-5 leading-5">
                      <span
                        aria-hidden
                        className="absolute inset-y-0 left-0 rounded-r-sm bg-foreground/10 dark:bg-foreground/15"
                        style={{ width: `${bar * 100}%` }}
                      />
                      <span className="relative pr-1 font-medium">
                        <table.FlexRender cell={cell} />
                      </span>
                    </span>
                  )}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
