import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { ChevronDown } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ButtonGroup } from "@/components/ui/button-group";
import { cn } from "@/components/ui/utils";
import { VendorMark } from "@/components/vendor-mark";
import { formatTierDiscount, formatUsdPerMonth } from "@/data/format";
import {
  setEffortView,
  setModels,
  setRoute,
  toggleModel,
  type LeaderboardFilters,
  type ModelOption,
  type PickerFamily,
} from "@/data/leaderboard";
import type { AccessRoute } from "@/data/types";

const effortViews = [
  { view: "best", label: "Best" },
  { view: "all", label: "All effort levels" },
] as const;

const familyLabels = { claude: "Claude", chatgpt: "ChatGPT" } as const;

// A route-card rung: the vendored radio item's focus and disabled styling, but
// the selected state is a brand fill (the page's "enhancement" tint) instead
// of a check mark, which would crowd the discount figures.
function RouteRung(props: MenuPrimitive.RadioItem.Props) {
  return (
    <MenuPrimitive.RadioItem
      closeOnClick={false}
      className="flex cursor-default items-center gap-3 rounded-xl px-2.5 py-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-checked:bg-brand/12 data-checked:text-brand data-disabled:pointer-events-none data-disabled:opacity-50 dark:data-checked:bg-brand/16"
      {...props}
    />
  );
}

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
              vendor mark; a hidden prefix keeps the accessible name stable. */}
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="border-brand/40 bg-brand/8 text-brand hover:bg-brand/15 hover:text-brand aria-expanded:bg-brand/15 aria-expanded:text-brand dark:bg-brand/12 dark:hover:bg-brand/20 dark:aria-expanded:bg-brand/20"
              />
            }
          >
            {tierPicks.length === 0 ? (
              "Subscriptions"
            ) : (
              <>
                <span className="sr-only">Subscriptions: </span>
                <span className="flex items-center gap-2">
                  {tierPicks.map(({ family, vendor, tier }) => (
                    <span key={family} className="flex items-center gap-1">
                      <VendorMark vendor={vendor} className="[&>svg]:size-3.5" />
                      {tier.shortLabel}
                    </span>
                  ))}
                </span>
              </>
            )}
            <ChevronDown data-icon="inline-end" />
          </DropdownMenuTrigger>
          {/* A route card: one price ladder per family, side by side where
              there is room. The tier-wide discount is the one loud figure on
              each rung; the price and Fable's exception sit under it. */}
          <DropdownMenuContent align="end" className="w-[min(30rem,var(--available-width))] p-2">
            <div className="grid gap-2 sm:grid-cols-2">
              {pickerFamilies.map(({ family, vendor, tiers }) => (
                <DropdownMenuRadioGroup
                  key={family}
                  value={filters.subscriptions[family]}
                  onValueChange={(route) =>
                    onChange(setRoute(filters, family, route as AccessRoute))
                  }
                  className="flex min-w-0 flex-col"
                >
                  <DropdownMenuLabel className="flex items-center gap-2 px-2.5 pt-1 pb-2 text-sm text-foreground">
                    <VendorMark vendor={vendor} />
                    {familyLabels[family]}
                  </DropdownMenuLabel>
                  <RouteRung value="api">
                    <span className="flex-1">API</span>
                    <span className="text-xs text-muted-foreground">full price</span>
                  </RouteRung>
                  {tiers.map((tier) => (
                    <RouteRung key={tier.id} value={tier.id}>
                      <span className="flex flex-1 flex-col leading-tight">
                        <span>{tier.shortLabel}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {formatUsdPerMonth(tier.priceUsdPerMonth)}
                        </span>
                      </span>
                      <span className="flex flex-col items-end leading-tight tabular-nums">
                        <span className="text-[15px] font-semibold">
                          {formatTierDiscount(tier.tierDiscount)}
                        </span>
                        {tier.notes.map((note) => (
                          <span key={note.name} className="text-[11px] text-muted-foreground">
                            {note.name}: {formatTierDiscount(note.tierDiscount)}
                          </span>
                        ))}
                      </span>
                    </RouteRung>
                  ))}
                </DropdownMenuRadioGroup>
              ))}
            </div>
            <DropdownMenuSeparator className="mt-2" />
            <p className="px-2.5 py-1.5 text-xs text-muted-foreground">
              Subscription costs are estimates: the struck-out API cost scaled by the tier's
              discount.
            </p>
          </DropdownMenuContent>
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
