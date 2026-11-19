# Final report: Inbox email-list redesign + Email Details panel

**Commit:** `876f1c9` on `main`, local only, not pushed. Message: `feat: Inbox email-list redesign and reorder side panel (Email Details)`. Only `index.html` is staged and committed. `Instruction/` and `.agents/` are still untracked.

## Changes (all in `index.html`, Inbox only)

- **List instead of table.** The blue toolbar, the table, the Linked Record column, the per-row Action buttons and the pager are removed. The new layout has a breadcrumb `Home / Inbox`, an `Inbox` heading with a live `N unread` pill, and the Connected and Sync folder lines. Below that is a card with search, Mark all as read, All/Unread tabs, status and sort selects, and month group headers (`October 2026 · 7 emails`). Each row has two lines: an unread dot, sender and address, subject with a status badge, attachment chips and a short date (`30 Oct · 2:05 PM`).
- **Row opens the panel.** Click, Enter or Space on a row opens the side panel. Rows contain no buttons or links. The open row gets a blue left border.
- **Footer remark removed.** The "Confirmed Phase 1 …" status line is gone. The footer now reads `Showing N of 12 emails` plus the legend.
- **Side panel.** The header label is now `Email Details`. The section order is AI recommended action (with Change), Email thread with attachments, Linked records, AI-filled details, and the sticky Action dropdown footer.
- **Dead code removed:** `recordCell`, `GLYPHS`, the eye button branch, and the table/toolbar/pager/statusline CSS.

## Decisions

- **Attachment chips** show the real file name, one chip per file. Each chip is at most 150px wide, truncated with an ellipsis, and the full name appears as a tooltip. The chips are not separately clickable; clicking one opens the panel. Rows with no attachments have no third line.
- **Unread and Undo.** Emails 12, 3, 4 and 5 start unread. Opening an email marks it read immediately. On the Unread tab, the open email stays listed until the panel closes. Undo never restores unread state. Mark all as read has no Undo and is disabled when nothing is unread.
- **AI-filled details placement.** This section moved to 4th place, after Linked records and above the footer. It appears only for emails that have AI fields (3, 4, 5, 6, 10).
- **Email thread naming.** "Original Email" was renamed to `Email thread`. Its content is unchanged and no fake replies were added.
- **Counts.** Tab counts ignore search and status. The groups, the list and the footer count follow the tab, status and search.
- **Small fixes that came with the reorder.** The "links" focus now scrolls `#linksBox` below the sticky header, so it no longer sits under the footer. Closing the panel resets the toast position.

## Verification

- `verification.md`: `node --check` passed on all 3 inline scripts. The Playwright suite against http://127.0.0.1:3000/ ran **118 checks with 0 failures**. It covered the header, list, filters, search, unread, keyboard, Mark all, current row, panel order, actions with Undo, toast placement, 600/390px responsive layouts, and regression. Computed styles matched the baseline for 28 Settings/header/sidebar/panel/dialog selectors. Settings, SR register, Email Integration dialog, Work Orders and Calendar still work. There were no console errors apart from the browser's automatic `favicon.ico` 404.
- `review.md`: **APPROVED**. An independent run of 38 checks confirmed the key requirements. The review raised three non-blocking issues, and none of them is fixed:
  1. Keyboard focus falls to `<body>` when a row opens or closes the panel.
  2. Mark all as read can replace a pending Undo toast, so the last action can no longer be undone.
  3. The All/Unread tabs use `role="tab"` without the full ARIA tab pattern (no `aria-controls`, no tabpanel, no arrow keys).
  The review also noted a cosmetic issue: an empty Unread tab shows "No emails match these filters."

## Screenshots (`.agents/tasks/inbox-list/shots/`)

`list-1440.png`, `list-unread.png`, `list-action-needed.png`, `list-oldest.png`, `panel-email10-1440.png`, `panel-email3-1440.png`, `list-600.png`, `panel-600.png`, `list-390.png`, `panel-390.png`, `toast-900.png`

## Not verified

- Screen-reader output for the rows and tabs.
- The Mark-all-over-Undo toast interaction (only confirmed by reading the code).
- Browsers other than Chrome (via Playwright).
