// Formatting shared by the Subscriptions picker. Column formatting lives with
// the columns (src/components/leaderboard-columns.tsx).

// A tier discount (0.95 for 95% off) as a percentage: one decimal where
// needed ("−95%", "−97.5%"), minus sign U+2212.
export function formatTierDiscount(discount: number): string {
  const percent = Math.round(discount * 1000) / 10;
  return `−${percent}%`;
}

// A tier's monthly price as published: "$20/mo".
export function formatUsdPerMonth(value: number): string {
  return `$${value}/mo`;
}
