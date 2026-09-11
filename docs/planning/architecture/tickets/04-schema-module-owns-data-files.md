# 04: One schema module owns every checked-in data file

Type: task
Status: ready-for-agent
Blocked by: none (can start immediately)

## What to build

Every checked-in data file (the DeepSWE snapshot, model mapping, vendor mapping, price revisions, throughput snapshot, tiers) has exactly one zod schema, and its TypeScript type is inferred from that schema rather than written by hand beside it. Today the shapes are declared twice (hand-written types plus unbound zod objects) and the schemas are scattered across the app's schema module and two refresh-script modules, so the shapes can drift silently and the refresh shells fall back to bare casts when reading files the app already validates.

Move every file schema into a single module in the data layer, keep the field-level comments on the schema fields, and shrink the shared types module to the UI-only types that no file carries (tier ids, access routes, subscription families). The app loads all six files through the schemas; the two hand-maintained files stop being plain casts, and the comment claiming refresh-written files are parsed becomes true. Both refresh shells read the model mapping through the same schema; the vendor-mapping and price-revisions schemas move out of the scripts into the module too. The load-time invariants (duplicate identities, mapping coverage, one vendor per family) stay where they are.

This is the prefactor for ticket 05.

## Acceptance criteria

- [ ] One module exports a schema and an inferred type for each of the six data files; no hand-written duplicate of a file shape remains.
- [ ] Neither refresh shell casts a JSON file; every read goes through a schema.
- [ ] The app parses all six files at load, including the throughput snapshot and tiers.
- [ ] The DeepSWE snapshot, mapping and price-revision schema tests still pass, and `vp check`, `vp test` and the e2e suite are green.
- [ ] docs/context.md and any ADR that names the old type module are updated if they point at moved symbols.
