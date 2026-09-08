import { ChevronDown } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ButtonGroup } from "@/components/ui/button-group";
import { cn } from "@/components/ui/utils";
import { RouteCard } from "@/components/route-card";
import { VendorMark } from "@/components/vendor-mark";
import {
  setEffortView,
  setModels,
  toggleModel,
  type LeaderboardFilters,
  type ModelOption,
  type PickerFamily,
} from "@/data/leaderboard";

const effortViews = [
  { view: "best", label: "Best" },
  { view: "all", label: "All effort levels" },
] as const;

export function LeaderboardToolbar({
  filters,
  onChange,
  models,
  pickerFamilies,
}: {
  filters: LeaderboardFilters;
  onChange: (filters: LeaderboardFilters) => void;
  models: ModelOption[];
  pickerFamilies: PickerFamily[];
}) {
  // The trigger surfaces only non-API picks: quiet on the default view, the
  // chosen tiers at a glance otherwise (column order, Claude first).
  const tierPicks = pickerFamilies.flatMap(({ family, vendor, tiers }) => {
    const tier = tiers.find((t) => t.id === filters.subscriptions[family]);
    return tier ? [{ family, vendor, tier }] : [];
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* The benchmark version is fixed; a static chip, not a dead toggle. */}
      <span className={cn(buttonVariants({ size: "sm" }), "pointer-events-none")}>v1.1</span>
      <ButtonGroup aria-label="Effort levels">
        {effortViews.map(({ view, label }) => (
          <Button
            key={view}
            size="sm"
            variant={filters.effortView === view ? "default" : "outline"}
            aria-pressed={filters.effortView === view}
            onClick={() => onChange(setEffortView(filters, view))}
          >
            {label}
          </Button>
        ))}
      </ButtonGroup>
      <div className="ms-auto flex items-center gap-2">
        <DropdownMenu>
          {/* Brand-tinted: subscription pricing is the feature the site adds.
              The trigger reads "Subscriptions" while both families are on
              the API, and otherwise shows only the tier picks, each with its
              vendor mark. The explicit label keeps the accessible name
              prefixed and comma-separated: name-from-content pads a hidden
              separator with spaces. */}
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="border-brand/40 bg-brand/8 text-brand hover:bg-brand/15 hover:text-brand aria-expanded:bg-brand/15 aria-expanded:text-brand dark:bg-brand/12 dark:hover:bg-brand/20 dark:aria-expanded:bg-brand/20"
                aria-label={
                  tierPicks.length === 0
                    ? undefined
                    : `Subscriptions: ${tierPicks.map(({ vendor, tier }) => `${vendor} ${tier.shortLabel}`).join(", ")}`
                }
              />
            }
          >
            {tierPicks.length === 0 ? (
              "Subscriptions"
            ) : (
              <span className="flex items-center gap-2">
                {tierPicks.map(({ family, vendor, tier }) => (
                  <span key={family} className="flex items-center gap-1">
                    <VendorMark vendor={vendor} className="[&>svg]:size-3.5" />
                    {tier.shortLabel}
                  </span>
                ))}
              </span>
            )}
            <ChevronDown data-icon="inline-end" />
          </DropdownMenuTrigger>
          <RouteCard filters={filters} onChange={onChange} pickerFamilies={pickerFamilies} />
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
            Models ({filters.models.size}/{models.length})
            <ChevronDown data-icon="inline-end" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <div className="max-h-72 overflow-y-auto">
              {models.map(({ model, displayName, vendor }) => (
                <DropdownMenuCheckboxItem
                  key={model}
                  checked={filters.models.has(model)}
                  closeOnClick={false}
                  onCheckedChange={() => onChange(toggleModel(filters, model))}
                >
                  <VendorMark vendor={vendor} />
                  {displayName}
                </DropdownMenuCheckboxItem>
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              closeOnClick={false}
              onClick={() =>
                onChange(setModels(filters, new Set(models.map(({ model }) => model))))
              }
            >
              Select all
            </DropdownMenuItem>
            <DropdownMenuItem
              closeOnClick={false}
              onClick={() => onChange(setModels(filters, new Set()))}
            >
              Clear
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
