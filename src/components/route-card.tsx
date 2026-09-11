import { Menu as MenuPrimitive } from "@base-ui/react/menu";

import {
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/components/ui/utils";
import { VendorMark } from "@/components/vendor-mark";
import { formatTierDiscount, formatUsdPerMonth } from "@/data/format";
import {
  setRoute,
  type AccessRoute,
  type LeaderboardFilters,
  type PickerFamily,
} from "@/data/leaderboard";

const familyLabels = { claude: "Claude", chatgpt: "ChatGPT" } as const;

// The popover's brand wash: a translucent brand layer over the popover
// colour at the trigger's pair (8% light, 12% dark), composited the same way
// as the columns' `bg-brand/5` (a colour-mix in oklch drifts pink at low
// chroma). Subscription-filter ticket 02 records the pairs tried.
const popoverWash = "bg-linear-to-b from-brand/8 to-brand/8 dark:from-brand/12 dark:to-brand/12";

// A route-card rung: the vendored radio item's layout and disabled styling,
// but hover and focus take a faint brand fill rather than the grey accent,
// and the selected state is a stronger brand fill with brand text instead of
// a check mark, which would crowd the discount figures. No className: the
// rung is styled here only.
function RouteRung(props: Omit<MenuPrimitive.RadioItem.Props, "className">) {
  return (
    <MenuPrimitive.RadioItem
      closeOnClick={false}
      className="flex cursor-default items-center gap-3 rounded-xl px-2.5 py-2 text-sm outline-hidden select-none focus:not-data-checked:bg-brand/8 data-checked:bg-brand/15 data-checked:text-brand data-disabled:pointer-events-none data-disabled:opacity-50 dark:focus:not-data-checked:bg-brand/10 dark:data-checked:bg-brand/20"
      {...props}
    />
  );
}

// The Subscriptions picker's popover: one price ladder per family, side by
// side where there is room. The tier-wide discount is the one loud figure on
// each rung; the price and Fable's exception sit under it. No fill or edge
// inside is grey; secondary text stays muted.
export function RouteCard({
  filters,
  onChange,
  pickerFamilies,
}: {
  filters: LeaderboardFilters;
  onChange: (filters: LeaderboardFilters) => void;
  pickerFamilies: PickerFamily[];
}) {
  return (
    <DropdownMenuContent
      align="end"
      className={cn(
        "w-[min(30rem,var(--available-width))] p-2 ring-brand/20 dark:ring-brand/20",
        popoverWash,
      )}
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {pickerFamilies.map(({ family, vendor, tiers }) => (
          <DropdownMenuRadioGroup
            key={family}
            value={filters.subscriptions[family]}
            onValueChange={(route) => onChange(setRoute(filters, family, route as AccessRoute))}
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
      <DropdownMenuSeparator className="mt-2 bg-brand/20" />
      <p className="px-2.5 py-1.5 text-xs text-muted-foreground">
        Subscription costs are estimates: the struck-out API cost scaled by the tier's discount.
      </p>
    </DropdownMenuContent>
  );
}
