// Load-time integrity checks for the two refresh-written data files
// (ADR 0004). These reject malformed committed data — duplicate identities,
// broken mapping coverage — while routine leaderboard growth parses clean, so
// a healthy refresh never turns tests red.

import { z } from "zod";
import type { DeepsweSnapshot, ModelMappingEntry, Tier } from "./types.ts";

const priceRateSchema = z.object({ input: z.number(), cached: z.number(), output: z.number() });

const deepsweEntrySchema = z.object({
  model: z.string(),
  effort: z.string().nullable(),
  pass_at_1: z.number(),
  average_cost_usd: z.number(),
  input_tokens: z.number(),
  cached_tokens: z.number(),
  output_tokens: z.number(),
  steps: z.number(),
  n_scored_attempts: z.number(),
  source_config: z.string(),
  raw_average_cost_usd: z.number(),
  cost_adjustment_factor: z.number(),
});

export const deepsweSnapshotSchema = z.object({
  source: z.string(),
  sourceUrl: z.string(),
  schema_version: z.literal(2),
  benchmark_version: z.literal("v1.1"),
  source_url: z.string(),
  source_generated_at: z.string(),
  source_latest_job: z.object({ name: z.string(), finished_at: z.string().nullable() }),
  n_tasks_in_set: z.number(),
  source_scope: z.string(),
  source_unit: z.string(),
  raw_sha256: z.string(),
  price_revisions: z.record(z.string(), z.object({ from: priceRateSchema, to: priceRateSchema })),
  entries: z.array(deepsweEntrySchema).superRefine((entries, ctx) => {
    const seen = new Set<string>();
    for (const entry of entries) {
      const identity = `${entry.model} @ ${entry.effort ?? "default"}`;
      if (seen.has(identity)) {
        ctx.addIssue({ code: "custom", message: `duplicate leaderboard entry: ${identity}` });
      }
      seen.add(identity);
    }
  }),
});

const modelMappingEntrySchema = z.object({
  leaderboardModel: z.string(),
  displayName: z.string(),
  vendor: z.string(),
  openrouterId: z.string().nullable(),
  family: z.enum(["claude", "chatgpt", "none"]),
  usageMultiplier: z.number(),
  shortName: z.string().optional(),
});

export const modelMappingSchema = z.array(modelMappingEntrySchema).superRefine((mapping, ctx) => {
  const seen = new Set<string>();
  for (const entry of mapping) {
    if (seen.has(entry.leaderboardModel)) {
      ctx.addIssue({
        code: "custom",
        message: `duplicate mapping key: ${entry.leaderboardModel}`,
      });
    }
    seen.add(entry.leaderboardModel);
  }
});

// Coverage must hold in both directions: an uncovered snapshot model would
// throw deep in createLeaderboard, and an orphaned mapping entry is refresh output
// pointing at nothing.
export function assertMappingCoverage(
  snapshot: DeepsweSnapshot,
  mapping: ModelMappingEntry[],
): void {
  const models = new Set(snapshot.entries.map((entry) => entry.model));
  const mapped = new Set(mapping.map((entry) => entry.leaderboardModel));
  const missing = [...models].filter((model) => !mapped.has(model));
  const orphaned = [...mapped].filter((model) => !models.has(model));
  const parts: string[] = [];
  if (missing.length > 0) {
    parts.push(`snapshot models missing from the mapping: ${missing.join(", ")}`);
  }
  if (orphaned.length > 0) {
    parts.push(`mapping entries matching no snapshot model: ${orphaned.join(", ")}`);
  }
  if (parts.length > 0) {
    throw new Error(parts.join("; "));
  }
}

// The Subscriptions picker shows each family's vendor mark, read from the
// family's mapping entries: a family with none, or with entries from two
// vendors, would otherwise lose or mislabel its mark deep in createLeaderboard.
export function assertFamilyVendors(tiers: Tier[], mapping: ModelMappingEntry[]): void {
  const families = new Set(tiers.map((tier) => tier.family));
  const parts: string[] = [];
  for (const family of families) {
    const vendors = new Set(
      mapping.filter((entry) => entry.family === family).map((entry) => entry.vendor),
    );
    if (vendors.size === 0) {
      parts.push(`no mapping entry has family "${family}"`);
    } else if (vendors.size > 1) {
      parts.push(`family "${family}" spans vendors ${[...vendors].join(", ")}`);
    }
  }
  if (parts.length > 0) {
    throw new Error(parts.join("; "));
  }
}
