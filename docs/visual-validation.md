# Visual validation — exploratory new-task slice

Screenshots stored outside the repository:

`~/.codex/workflows/screenshots/2026-11-05-harflowweb-new-task-slice/`

| File | Scenario | Size | Appearance |
| --- | --- | --- | --- |
| `01-default-light-1280x800.png` | new-task/default | 1280×800 | light |
| `02-harness-menu-light-1280x800.png` | new-task/harness-menu | 1280×800 | light |
| `03-sidebar-collapsed-light-1280x800.png` | new-task/sidebar-collapsed | 1280×800 | light |
| `04-sidebar-collapsed-dark-1280x800.png` | collapsed rail | 1280×800 | dark (mid-grey) |
| `05-default-dark-system-1280x800.png` | default (system→dark host) | ~1280×800 | dark |
| `06-loading-preview.png` | Context loading (proposal) | preview route | host |
| `07-unavailable-preview.png` | Context unavailable (proposal) | preview route | host |
| `08-unknown-submission-preview.png` | Unknown submit; draft kept | preview route | host |
| `09-narrow-390x800-proposal.png` | Narrow browser (proposal) | 390×800 | host |
| `design-ref-default-light.png` | Hosted design reference | design.harflow.dev/v2 | light |

## Checks performed

- Keyboard: Enter submits when enabled; IME composition Enter is ignored; Shift+Enter is not treated as submit.
- Focus: `:focus-visible` outline present in CSS; pill menus use `aria-expanded` / `role="menu"`.
- Labels: collapse/expand, appearance, Start task, unavailable destinations labelled.
- Reduced motion: spinning glyph animation gated in CSS; not exercised live beyond presence.
- Overflow: recent work scrolls inside sidebar section; composer pills wrap.
- Narrow width: required composer controls remain present; layout is a **proposal**, not an approved specimen. Preview scenario panel stacks above the app.

## Limitations

- Pixel fidelity to native materials is not claimed.
- Automation browser may prefer dark for `system`.
- Harness menu keyboard arrow navigation is basic button focus order only (no full roving tabindex).
