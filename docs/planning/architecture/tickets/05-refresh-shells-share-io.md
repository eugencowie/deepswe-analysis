# 05: Refresh shells share their I/O and one existing-snapshot policy

Type: task
Status: ready-for-agent
Blocked by: 04

## What to build

The two refresh shells (DeepSWE and OpenRouter) each hand-roll the same plumbing: fetch bytes and check the status, read a JSON file, write pretty-printed JSON with a trailing newline, print a warning list, and append a summary to the GitHub Actions output with a unique heredoc delimiter. Extract these into one small shared module for the scripts so each shell reads as its orchestration only.

The two shells also disagree on what a broken existing snapshot means. The OpenRouter shell distinguishes a missing file (legitimate first run) from unparseable JSON (a repo problem, hard error). The DeepSWE shell maps every read error to "no existing snapshot", so a corrupt file silently disables the meaningful-change check. One shared read-existing-snapshot helper applies the OpenRouter policy to both.

Refresh PR output (console lines and the summary text) stays byte-identical.

## Acceptance criteria

- [ ] A shared scripts module provides fetch-and-parse, read-and-parse, JSON write, warning printing and the summary append; both shells use it and no duplicated copies remain.
- [ ] A corrupt existing DeepSWE snapshot fails the run with a message naming the file; a missing one still counts as a first run.
- [ ] The DeepSWE and OpenRouter snapshot test suites pass unchanged, and `vp check` and `vp test` are green.
- [ ] Running both refresh scripts against the current checked-in data produces the same files and summaries as before the change.
