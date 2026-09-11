# 09: Toolbar splits into a Subscriptions picker and a Models picker

Type: task
Status: ready-for-agent
Blocked by: none (can start immediately)

## What to build

The toolbar builds the Subscriptions picker's trigger (tier picks, accessible name, vendor marks) while the route card owns only its popover, and the Models menu is written inline. Give each picker (docs/context.md) one component that owns its menu, trigger and content. The toolbar then composes the version chip, the effort buttons and the two pickers and nothing else.

The two formatters used only by the route card (tier discount, monthly price) move into the Subscriptions picker with their tests, and the standalone format module is deleted, as ADR 0007 anticipated.

Markup, accessible names and behaviour are unchanged.

## Acceptance criteria

- [ ] A Subscriptions picker component owns the trigger, its accessible name and the route card; a Models picker component owns the checkbox list and its select-all and clear items.
- [ ] The toolbar contains no picker-specific logic.
- [ ] The standalone format module is gone; its tests live beside the Subscriptions picker.
- [ ] All e2e filter and theme tests pass unchanged; `vp check` and `vp test` are green.
