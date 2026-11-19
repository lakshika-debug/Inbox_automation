# Final report: Inbox list pagination, stacked sender, subject column (inbox-list-2)

Commit: `b1798d1` on `main` (not pushed). Only `index.html` was committed (+25/−12). `Instruction/` and `.agents/` were left unstaged.

## Changes (index.html, Inbox list only)

- **Pagination footer.** It replaces "Showing N of 12 emails" and the Unread legend.
  - Left: "Showing X to Y of Z entries".
  - Centre: a joined Previous / page numbers / Next group. The active page is blue (`#1a6dff`) with white text. Previous and Next are disabled at the ends.
  - Right: "Show [10|25|50|100] Entries", default 10.
  - At 700px and below, the three parts stack and are centred.
- **Sender column.** The sender name is on top and the email address is on the line below. Both truncate with an ellipsis and show the full text in a tooltip.
- **Subject column (2nd column).** It shows the subject with the status chip inline after it. Attachment chips sit below the subject. The date stays at the far right.
- **Grid.** All rows use `16px 220px minmax(0,1fr) auto`, so the sender, subject, attachment and date edges line up across rows.
- **Page state.** These changes go back to page 1: search, status, sort, tab and page size. These keep the current page: opening or closing the panel, Undo, row actions and Mark all as read. If the current page no longer exists, the list moves to the last valid page.

## Decisions

- **Month group header counts** show the month's total across the whole filtered set, not just the rows on the current page. For example, page 2 shows "September 2026 · 5 emails" above 2 rows. A header appears on every page that has rows from that month. If page-local counts are preferred, the change is small.
- **Page-number window:** at most 5 numbers, `start = max(1, min(page-2, pages-4))`, `end = min(pages, start+4)`. With 8 pages this shows 1–5 on page 1, 3–7 on page 5 and 4–8 on page 8.
- **Empty result:** "Showing 0 to 0 of 0 entries", with a single active "1" between disabled Previous and Next.

## Verification

- Coder suite (`verification.md`): Playwright on Chrome against http://127.0.0.1:3000/ gave **169 passed, 0 failed**. It covered pagination (34 checks), layout (13), responsive layout at 600 and 390px, legacy Inbox groups, and a regression group of 12 checks (Settings, SR register, the Email Integration dialog, Work Orders, Calendar, and computed styles for 28 selectors). `node --check` passed on all inline scripts. There were no console errors.
- Review (`review.md`): **APPROVED**. The reviewer's spot checks matched for paging, resets, clamping, alignment and pager centring, and found no horizontal scroll from 320 to 1440px. The diff stays inside the Inbox list.
- Non-blocking review notes:
  1. Month header counts span pages (the decision above).
  2. Between 700 and 800px, the fixed 220px sender column leaves the subject about 124px wide, so subjects truncate early. This is cosmetic.
  3. `#count` has `aria-live="polite"`, so each search keystroke that changes the total may be announced.

## Screenshots

These are in `.agents/tasks/inbox-list-2/shots/`:

- `page1-1440.png`, `page2-1440.png`, `size25-1440.png`, `unread-1440.png`
- `list-1440.png`, `list-1100.png`, `list-600.png`, `list-390.png`
- `list-oldest.png`, `list-unread.png`, `list-action-needed.png`
- `panel-open-1440.png`, `panel-email3-1440.png`, `panel-email10-1440.png`, `panel-600.png`, `panel-390.png`
- `toast-900.png`

The reviewer's screenshots are `review2-{1440,800,720,600,390,320}.png` in `/tmp/inbox-v2-verify/`.

## Not verified

- Screen-reader output for the pager and the live region.
- Browsers other than Chrome.
- Opening `/#settings` directly does not open Settings. This is existing route-handler behaviour that this change does not touch.
