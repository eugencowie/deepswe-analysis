# Spec: Continuous deployment

Publishes `main` to GitHub Pages at <https://eugencowie.github.io/deepswe-enhanced/>.

- Pushes to `main` additionally build and deploy via `actions/upload-pages-artifact` and `actions/deploy-pages`, gated by the ready job from [continuous integration](../continuous-integration/spec.md). Pages uses "GitHub Actions" as the source.
- The deploy job derives the base path from `actions/configure-pages` and passes it to `vp build --base`. Nothing hardcodes `/deepswe-enhanced/`; local builds use `/`. The Playwright e2e smoke (ticket 06, [ADR 0001](../../architecture/0001-toolchain-conventions.md)) guards the root-absolute-URL gap this leaves.

## Acceptance criteria

- A push to `main` that passes the gate deploys the site at the project Pages URL with the correct base path.

## Tickets

Not yet assigned. The tickets that built this feature are in [`subsidised-leaderboard/tickets/`](../subsidised-leaderboard/tickets/) until the ticket split; ticket numbers in this spec refer to that folder.
