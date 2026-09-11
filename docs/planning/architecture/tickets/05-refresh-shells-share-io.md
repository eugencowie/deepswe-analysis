# 05: Refresh shells share their I/O and one existing-snapshot policy

Type: task
Status: ready-for-agent
Blocked by: 04

## What to build

The two refresh shells (DeepSWE and OpenRouter) each hand-roll the same plumbing: fetch bytes and check the status, read a JSON file, write pretty-printed JSON with a trailing newline, print a warning list, and append a summary to the GitHub Actions output with a unique heredoc delimiter. Extract these into one small shared module for the scripts so each shell reads as its orchestration only.

The two shells also disagree on what a broken existing snapshot means. The OpenRouter shell distinguishes a missing file (legitimate first run) from unparseable JSON (a repo problem, hard error). The DeepSWE shell maps every read error to "no existing snapshot", so a corrupt file silently disables the meaningful-change check. One shared read-existing-snapshot helper applies the OpenRouter policy to both.

Refresh PR output (console lines and the summary text) stays byte-identical.

## Decisions (grilled 2026-09-11)

- Module: `scripts/refresh-io.ts`, plain exported functions. The shells stay top-level-await scripts; no injected I/O object, no `run()` wrapper. The pure cores keep the logic tests.
- Paths: helpers take a file name (`model-mapping.json`) and resolve it against `data/` themselves, so every message names `data/<file>`. Two readers: `readDataFile(name, schema)` for required files (a missing file is a hard error via ENOENT, as today) and `readExistingSnapshot(name, schema)` for the two snapshots (ENOENT is `null`; corrupt JSON or a schema mismatch throws naming the file).
- Corrupt-file wording is generic (`data/<file> is not a valid data file — fix or delete it. (<cause>)`); zod's cause names the field. The ticket pins Refresh PR output, not error text.
- `writeDataFile(name, schema, value)` parses then writes the original object, so no write can skip validation. Price revisions gain the check; the mapping write drops its own `grown` parse.
- Fetch: `fetchBytes(url, accept)` plus `fetchJson(url, schema, init)` layered on it. OpenRouter's authenticated retry loop keeps its own `fetch` and error message: it branches on 429 and 404 before parsing and is not one of the five duplicated pieces.
- Warnings: one `warn(message)` with the `warning: ` prefix; callers loop. Summary: `publishSummary(summary)` reads `GITHUB_OUTPUT` itself and is a no-op when unset, as today.
- Tests: `scripts/refresh-io.test.ts` only. Missing snapshot is `null`; corrupt JSON and schema-invalid JSON both throw naming the file; write rejects an invalid value without touching the file; `fetchJson` on a non-OK response throws with status and URL (stubbed `fetch`); the summary append writes the heredoc with a delimiter absent from the summary (`GITHUB_OUTPUT` stubbed to a temp file).
- Verification: `OPENROUTER_API_KEY` is in the local `.env`, so both halves run live before and after the change. DeepSWE must report "No content change" with an identical summary. OpenRouter always rewrites: the file diff may touch only per-model values and `capturedAt`, and the summaries differ only there.
- Docs: this section; the automated-refresh spec's thin-shell sentence names the shared module. No ADR, no glossary change.

## Acceptance criteria

- [ ] A shared scripts module provides fetch-and-parse, read-and-parse, JSON write, warning printing and the summary append; both shells use it and no duplicated copies remain.
- [ ] A corrupt existing DeepSWE snapshot fails the run with a message naming the file; a missing one still counts as a first run.
- [ ] The DeepSWE and OpenRouter snapshot test suites pass unchanged, and `vp check` and `vp test` are green.
- [ ] Running both refresh scripts against the current checked-in data produces the same files and summaries as before the change.
