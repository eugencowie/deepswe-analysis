import { useMemo, useState } from "react";

import { LeaderboardTable } from "@/components/leaderboard-table";
import { LeaderboardToolbar } from "@/components/leaderboard-toolbar";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { createLeaderboard } from "@/data/leaderboard";
import {
  deepsweSnapshot,
  modelMapping,
  throughputSnapshot,
  tiers,
  tiersSnapshot,
} from "@/data/sources";

const leaderboard = createLeaderboard({
  snapshot: deepsweSnapshot,
  mapping: modelMapping,
  throughput: throughputSnapshot,
  tiers,
});

// The UTC date of a snapshot timestamp, robust to non-UTC offsets in a
// future refresh (a plain slice would take the offset-local date).
const utcDate = (timestamp: string) => new Date(timestamp).toISOString().slice(0, 10);

const snapshotDate = utcDate(deepsweSnapshot.source_generated_at);
const throughputDate = utcDate(throughputSnapshot.capturedAt);

function SourceLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="underline decoration-dotted underline-offset-4 hover:text-foreground">
      {children}
    </a>
  );
}

function App() {
  const [filters, setFilters] = useState(leaderboard.defaultFilters);
  const visibleRows = useMemo(() => leaderboard.visibleRows(filters), [filters]);

  return (
    // max-w-5xl: wide enough for tier rows' struck-out API costs.
    <div className="mx-auto flex min-h-svh max-w-5xl flex-col px-6 py-8">
      <header className="flex items-start justify-between gap-6">
        <div className="max-w-2xl">
          <h1 className="flex items-center gap-3 text-[28px] leading-none tracking-tight">
            <svg aria-hidden="true" className="brand-mark size-10 shrink-0" viewBox="0 0 160 144">
              <use href={`${import.meta.env.BASE_URL}favicon.svg#mark`} />
            </svg>
            <span>
              <span className="font-bold">DeepSWE</span>{" "}
              <span className="font-light text-brand">enhanced</span>
            </span>
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-pretty">
            The DeepSWE coding-agent benchmark, plus what each solved task costs on the API or on a
            Claude or ChatGPT subscription, and how long it takes at the vendor's real throughput.
          </p>
          {/* Provenance: every figure on the page traces to one of these three. */}
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            <SourceLink href={deepsweSnapshot.sourceUrl}>
              DeepSWE results updated {snapshotDate}
            </SourceLink>
            .{" "}
            <SourceLink href={throughputSnapshot.sourceUrl}>
              OpenRouter throughput updated {throughputDate}
            </SourceLink>
            .{" "}
            <SourceLink href={tiersSnapshot.sourceUrl}>
              Subscription costs are rough estimates from SemiAnalysis figures
            </SourceLink>
            .
          </p>
        </div>
        <ModeToggle />
      </header>
      <main className="mt-8 flex flex-col gap-3 border-t pt-3">
        <LeaderboardToolbar
          filters={filters}
          onChange={setFilters}
          models={leaderboard.modelOptions}
          pickerFamilies={leaderboard.pickerFamilies}
        />
        <LeaderboardTable
          rows={visibleRows}
          compareModel={leaderboard.compareModel}
          empty="No models selected. Use the Models menu to pick one or more."
        />
      </main>
    </div>
  );
}

export default App;
