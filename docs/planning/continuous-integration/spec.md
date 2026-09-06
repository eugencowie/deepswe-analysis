# Spec: Continuous integration

The check gate every change passes before it reaches `main` or the deployed site.

- `vp run ready` is the CI check gate.
- `.github/workflows/ci.yml`: `vp run ready` (the template's CI checks) runs on pull requests and on push to `main`. The Playwright e2e smoke (leaderboard-table ticket 01, [ADR 0001](../../architecture/0001-toolchain-conventions.md)) runs as its own job; [continuous deployment](../continuous-deployment/spec.md) gates on both.

## Acceptance criteria

- `vp run ready` passes and gates deploy.
- The Playwright e2e smoke passes: a build at a non-root base renders the table with no failed requests.

## Tickets

None yet. The ready gate was built in [project-structure ticket 01](../project-structure/tickets/01-scaffold-and-deploy-foundation.md) and the e2e job in [leaderboard-table ticket 01](../leaderboard-table/tickets/01-base-api-rows-table.md).
