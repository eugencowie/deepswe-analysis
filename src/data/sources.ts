import rawSnapshot from "../../data/deepswe-v1.1.json" with { type: "json" };
import rawMapping from "../../data/model-mapping.json" with { type: "json" };
import rawThroughput from "../../data/openrouter-throughput.json" with { type: "json" };
import rawTiers from "../../data/tiers.json" with { type: "json" };
import {
  assertFamilyVendors,
  assertMappingCoverage,
  deepsweSnapshotSchema,
  modelMappingSchema,
  throughputSnapshotSchema,
  tiersSnapshotSchema,
} from "./schema.ts";

// Every data file the app reads is schema-parsed at load (ADR 0004), so
// malformed committed data fails here with an error naming the field.
export const deepsweSnapshot = deepsweSnapshotSchema.parse(rawSnapshot);
export const modelMapping = modelMappingSchema.parse(rawMapping);
assertMappingCoverage(deepsweSnapshot, modelMapping);

export const throughputSnapshot = throughputSnapshotSchema.parse(rawThroughput);
export const tiersSnapshot = tiersSnapshotSchema.parse(rawTiers);
export const tiers = tiersSnapshot.tiers;
assertFamilyVendors(tiers, modelMapping);
