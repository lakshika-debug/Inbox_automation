# Verification: Inbox pagination + sender / subject columns (inbox-list-2)

First iteration: `review.json` did not exist. Only `index.html` changed (25 insertions, 12 deletions, uncommitted). The diff touches no `ps-`, `wo-` or `#settingsView` code.

## What changed (index.html, Inbox list only)

- **Footer.** `Showing N of 12 emails` and the `Unread · Read emails appear on white` legend are gone. The footer is now a 3-column grid:
  - Left: `#count` with `Showing {start} to {end} of {total} entries`.
  - Centre: `<nav class="ib-pager" aria-label="Pagination">` containing Previous, up to 5 page numbers, and Next.
  - Right: `Show [#ibSize] Entries` with options 10/25/50/100, default 10.
  - Below 700px the three parts stack and are centred.
- **Pager style.** One bordered group (`1px solid #dee2e6`, 4px radius, buttons separated only by 1px dividers, no gaps).
  - Active page: `#1a6dff` (the blue the ib- list already uses) with white text and `aria-current="page"`.
  - Other buttons: white with blue text. Number buttons have `aria-label="Page n"`.
  - Disabled Previous/Next: grey `#8a929c` with the native `disabled` attribute, so they are not clickable or focusable.
- **Pagination state.** New `let ibPage=1`. The page size is read from `#ibSize` on every render.
  - `ibFirst()` (search, status, sort, page size) and `ibSetTab()` reset to page 1.
  - `ibGo(n)` changes the page. If focus was in the pager, `ibGo` moves it back to the same button, or to the active page when that button becomes disabled.
  - `renderRows()` clamps `ibPage` to `[1, pages]` and slices the filtered, sorted list.
  - Opening or closing the panel, Undo, and other actions keep the current page.
- **Row grid.** `grid-template-columns:16px 220px minmax(0,1fr) auto` holds the unread dot, the sender block, the main block and the date. Rows are vertically centred.
  - Sender block (`.ib-sender`): name on top, address on the line below. Both truncate with an ellipsis and have a `title`.
  - Main block (`.ib-main`): subject with the status chip inline, then attachment chips below.
  - Below 700px: the sender block and date share line 1 (date at top-right), and the main block spans line 2.
  - Unread styling and the current-row style are unchanged.

## Decisions

- **Group header counts** show the total for that month across the whole filtered set, not only the rows on the current page. Example: page 1 shows 3 of the September emails but the header reads `September 2026 · 5 emails`, and page 2 also reads `September 2026 · 5 emails`. A group header is drawn on every page that has rows from that month.
- **Page window:** at most 5 numbers. `start = max(1, min(page-2, pages-4))`, `end = min(pages, start+4)`. With 8 pages this gives 1–5 on page 1, 3–7 on page 5, and 4–8 on page 8.
- **Empty result:** `Showing 0 to 0 of 0 entries`, and the pager shows `Previous [1] Next` with Previous and Next both disabled.
- **Page clamping:** if the current page becomes empty (for example, Mark all as read on the Unread tab while on page 2), the list goes to the last valid page.
- **Active colour:** I used `#1a6dff`, the ib- list's blue, instead of `#0b7bff`, so it matches the tabs and the unread dot. White on `#1a6dff` has about 4.6:1 contrast.

## Commands run

1. Extracted the 3 inline `<script>` blocks to `/tmp/inbox-v2-verify/list2-inline{0,1,2}.js`. `node --check` passed on all 3.
2. Ran `cd /tmp/inbox-v2-verify && node inbox-list-2.js` against the running server at http://127.0.0.1:3000/ (Playwright, `channel:'chrome'`). Result: **169 passed, 0 failed**. The log is in `inbox-list-2-run.log` and the results in `inbox-list-2-results.json`.

`inbox-list-2.js` extends the previous `inbox-list.js` suite:
- Legacy groups select 100 per page after load, so their checks still see all 12 rows.
- Checks that asserted the old footer text, legend or inline address were updated to the new behaviour.
- New groups `pagination` and `layout` load with the default of 10 per page.

### Pagination group (34 checks, all pass)

- **On load:** default size is 10 and the options are 10/25/50/100. The label reads `Show [select] Entries`. The count reads `Showing 1 to 10 of 12 entries`. Page 1 holds the 10 newest rows. The groups read `October 2026 · 7 emails` and `September 2026 · 5 emails`. The pager reads `Previous(disabled) | 1(current) | 2 | Next`.
- **Styling** (computed values):
  - Pager border is `1px solid rgb(222,226,230)` with a 4px radius, and the gaps between buttons measure 0px.
  - Active page: background `rgb(26,109,255)`, text white.
  - Other pages: white background, blue text. Disabled Previous: grey `rgb(138,146,156)`.
  - The pager is a `NAV` labelled `Pagination`, and the number buttons have aria-labels `Page 1` and `Page 2`.
- **Footer layout:** the count sits at the left, the pager centre matches the footer centre (831px vs 831px), and the size control sits at the right, all on one row.
- **Navigation:**
  - Forcing a click on the disabled Previous does nothing.
  - Next gives `Showing 11 to 12 of 12 entries`, rows `[9,10]`, group `September 2026 · 5 emails`, pager `Previous | 1 | 2(current) | Next(disabled)`.
  - Previous, page 1 and page 2 buttons work.
  - Keyboard: Enter on Next goes to page 2 and focus lands on `Page 2`. Space on Previous goes to page 1 and focus lands on `Page 1`.
- **Resets to page 1** (each tested from page 2):
  - Sort change.
  - Status change (Action needed gives `Showing 1 to 6 of 6 entries`), and changing status back to All.
  - Search input.
  - Unread tab gives `Showing 1 to 4 of 4 entries`, rows `[12,3,4,5]`, pager `Previous(disabled) | 1 | Next(disabled)`. Switching back to the All tab also resets.
  - Page size 25 gives `Showing 1 to 12 of 12 entries`, all 12 rows, Previous and Next disabled.
- **Row on page 2:** with Oldest first, page 2 holds `[11,12]`. Clicking row 12 opens the panel on `Quotation – roof membrane repair`, marks the email read, and the list stays on page 2. Closing the panel also keeps page 2.
- **Clamping:**
  - All 12 emails set to unread, Unread tab, page 2. Mark all as read leaves page 1 with `Showing 0 to 0 of 0 entries`, the pager with Previous and Next disabled, and the empty-state message.
  - Forcing `ibPage=2` with the Done filter (5 entries) clamps to page 1.
- **Sliding window** (80 synthetic emails): page 1 shows 1–5. Page 5 shows 3–7. Page 8 shows 4–8 with Next disabled and `Showing 71 to 80 of 80 entries`.

### Layout group (13 checks at 1440px, all pass)

- On every row, the address top is at or below the name bottom, with the same left edge.
- The sender column left edge is identical on every row, and its width is 220px on every row.
- The **subject left edge is identical on every row** (one unique value).
- The subject starts to the right of the sender column.
- The status chip sits after the subject, vertically centred on it within 3px.
- The attachment row sits below the subject with the same left edge. Only row 6 on page 1 has no attachments.
- The date `text-align` is right, every date has the same right edge, and the date starts after the subject.
- The sender block is vertically centred in the row within 1.5px.
- Row 12 (unread) keeps the dot, a bold subject and date, and the `rgb(240,245,255)` background.
- Clicking a row opens the panel, marks it read, and applies the current style (3px inset shadow).
- No horizontal scroll at 1100px.

### Responsive group (600px and 390px)

- No horizontal scroll at either width.
- Lines stack in order: name, address, subject, attachments.
- The date top is level with the name line (within 4px) and its right edge is within 20px of the row's right edge.
- The pagination parts stack (count, then pager, then size) inside the viewport.
- Tabs, filters, search and Mark all as read are visible.

### Legacy groups re-run, all pass

helpers, header, list, filters, unread, keyboard, markall, current, panel (Email Details order unchanged), actions (create/link/remove/Undo), toast placement.

### Regression group (12 checks, all pass)

- Computed styles match the earlier baseline (`inbox-list-baseline.json`) for 28 selectors covering the header, sidebar, Settings, panel and dialog.
- Settings: Sign in with Microsoft shows Connected, and Disconnect returns to sign-in.
- SR register dialog opens. The sidebar Email Integration dialog opens and Save Configuration shows its toast.
- Work Orders shows the iframe with content, and Calendar opens.
- Inbox nav returns to the list. The devlabel is present.

**Errors:** no console or page errors (the browser's automatic favicon.ico 404 is filtered out).

## Screenshots (`shots/`), all viewed

- `page1-1440.png`: 10 rows. The pager has Previous disabled and 1 active.
- `page2-1440.png`: rows 9 and 10 under `September 2026 · 5 emails`. Next is disabled and 2 is active. (Taken on the first run, before the pager was centred exactly. The re-run regenerated it with the pager centred.)
- `size25-1440.png`: all 12 rows on one page, Previous and Next disabled.
- `unread-1440.png`: 4 unread emails on one page.
- `list-600.png` (at 100 per page): stacked rows with the date top-right and the pagination stacked. `list-390.png` shows the same at 390px.
- `panel-open-1440.png`, `panel-600.png`, `panel-390.png`, `toast-900.png`, `list-1100.png`, `list-oldest.png`, `list-unread.png`, `list-action-needed.png`, `panel-email3-1440.png`, `panel-email10-1440.png`.

## Not verified

- Screen-reader output for the pager.
- Browsers other than Chrome.
