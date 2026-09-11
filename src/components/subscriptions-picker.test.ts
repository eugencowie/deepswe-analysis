import { describe, expect, test } from "vite-plus/test";

import { formatTierDiscount, formatUsdPerMonth } from "./subscriptions-picker.tsx";

describe("formatTierDiscount", () => {
  test("renders the discount as a negative percentage", () => {
    expect(formatTierDiscount(0.95)).toBe("−95%");
    expect(formatTierDiscount(0.9)).toBe("−90%");
  });

  test("keeps one decimal where rounding needs it", () => {
    expect(formatTierDiscount(0.975)).toBe("−97.5%");
    expect(formatTierDiscount(1 - 20 / 700)).toBe("−97.1%");
    expect(formatTierDiscount(1 - 200 / 14000)).toBe("−98.6%");
  });
});

describe("formatUsdPerMonth", () => {
  test("renders the published monthly price without rounding", () => {
    expect(formatUsdPerMonth(20)).toBe("$20/mo");
    expect(formatUsdPerMonth(200)).toBe("$200/mo");
    expect(formatUsdPerMonth(22.5)).toBe("$22.5/mo");
  });
});
