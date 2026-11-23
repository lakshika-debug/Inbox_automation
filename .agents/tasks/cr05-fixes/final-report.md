# CR05 fixes – final report

**Commit:** `e21b329` on `main` (not pushed). Message: `fix(inbox): per-message attachment grid in email thread, tooltip clipping, address wrapping`. Only `index.html` was committed (20 insertions, 11 deletions). The untracked `Instruction/cr03.md`, `assets/logo 1.png`, `assets/logo 2.png` and `.agents/` were left unstaged.

**Review:** APPROVED, no findings (`review.json`, `review.md`).

## Changes (Email thread section only)
1. **Attachments under each message, in a compact grid.** Each message shows only its own files with its own `Attachments (n)` label and `Download All`. The files sit 3 per row (2 at ≤650px, 1 at ≤420px). Boxes are 30px tall, and the Download/Preview buttons are 22×22px with 12px icons. Long names end with "…" before the buttons, on one line. The full name is in the name's `title`. The button order (Download, Preview), tooltips and aria-labels are unchanged.
2. **Tooltip clipping.** Tooltips show below the button by default. `thTip()` flips them above (`.th-up`) when the button is near the bottom of the thread scroller. This runs on hover and on keyboard focus.
3. **Address wrapping.** `thAddr()` keeps each `<address>` together and moves it to the next line as one unit. If it is still too long, it breaks only after the `@` (for example `<developer@` / `i4tglobal.onmicrosoft.com>` at 390px).

## Decisions recorded
- `e.attachments` stays the union of all messages' attachments. The list row chips and the Create WO / Link to WO dialogs still list every file in the thread. For example, email 10's row still shows kitchen_leak.jpg, while inside the thread that file appears only under the newest message.
- The grid uses 1 column at ≤420px, because 2 columns at 390px would leave about 10 characters per name. At 700px the panel still fits 3 columns.
- Tooltips show below and flip above near the bottom edge. A CSS-only "always below" rule would still clip at the bottom edge.
- The existing 📎 icon is kept in its own span that does not shrink, so truncation never cuts it.

## Verification
- `node --check` passed on all 3 inline scripts.
- Playwright (Chrome) suites:

  | Suite | Result |
  |---|---|
  | cr05fix.js (new) | 150/150 |
  | cr05.js | 242/242 |
  | cr02.js | 148/148 |
  | cr03.js | 262/262 |
  | cr04.js | 90/90 |
  | qa13.js | 40/40 |

- The reviewer's independent script (`/tmp/cr05fix-verify/review/review.js`) passed 88 checks with 0 failures.
- No page or console errors in any run.
- Checks covered:
  - Each message's attachments match its data.
  - Column counts at 1440, 700, 600 and 390px.
  - Truncated names do not overlap the buttons.
  - No horizontal scroll.
  - Download fires a download event, and Preview opens a new tab.
  - Tooltips stay fully inside the scroller at its top and bottom edges, on hover and on focus.
  - Address line breaks fall only at spaces or after `@`.

## Screenshots
Coder screenshots are in `.agents/tasks/cr05-fixes/shots/`:
- `email3-thread-1440.png`
- `inject-5att-1440.png`
- `inject-5att-390.png`
- `tooltip-top-hover.png`
- `tooltip-top-focus.png`
- `tooltip-bottom-hover.png`
- `email3-390-addresses.png`

These were produced but not individually inspected:
- `email3-thread-bottom-1440.png`
- `email3-390.png`
- `tooltip-390-*`
- `tooltip-bottom-row1-hover.png`
- `tooltip-email10-top-hover.png`
- `tooltip-end-oldest-row1-hover.png`
- `shots/cr05/`

Reviewer screenshots are in `/tmp/cr05fix-verify/review/shots/`.

## Not verified / open
- Only desktop Chrome was tested. Safari, Firefox and screen readers were not.
- The tooltip side is decided on hover or focus. It is not recomputed if the list is scrolled with the wheel while the same button stays hovered.
- The verification and review notes for this step cover Work 1 only. They do not mention Work 2 (the duplicate-email conversation from `cr03.md`), so this commit's records do not show whether Work 2 was done.
