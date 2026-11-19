# Verification: Inbox list redesign + Email Details panel reorder

Iteration 1 (no `review.json` existed). Only `index.html` changed (90 insertions, 51 deletions). Nothing is committed or staged. `git status --short` shows ` M index.html`, `?? .agents/` and `?? Instruction/`.

## What I ran

1. **Baseline before any edit.** `cd /tmp/inbox-v2-verify && node inbox-list-baseline.js` recorded computed styles for 28 selectors: header, sidebar, devlabel, settings page (`ps-*`, `#psSignMs`), panel (`.panelhead`, `.ai`, `#linksBox h3`, `.lrow`, `.rec`, `.smain`, `.smore`, `.panelfoot`, `.kv .k`, `.attachment`, `.tags .badge`) and the create dialog (`.dhead`, `#shade .opt`, `#shade .ai`). None was null.
2. **Syntax check.** I extracted every executable inline `<script>` (3 blocks; the base64 `text/plain` block was excluded) to `/tmp/inbox-v2-verify/list-inline{0,1,2}.js`. `node --check` passed on all 3.
3. **Browser suite.** `cd /tmp/inbox-v2-verify && node inbox-list.js` ran Playwright with `chromium.launch({channel:'chrome'})` against the running server at http://127.0.0.1:3000/. Result: **exit 0, 118 passed, 0 failed**. The log is in `/tmp/inbox-v2-verify/inbox-list-run.log` and the results in `inbox-list-results.json`.
4. **Screenshots.** I opened and checked each one (paths below).
5. **Diff check.** I ran `git diff -U0 index.html`. No hunk touches `#settingsView`, the `ps-*` CSS, the `ps*` functions, the second `<script>` block, `woModuleEncoded`, `showIntegratedSection`, `openSRRegister`, `openAutomationSettings`/`saveSettings`, or the header/sidebar markup. The new row markup calls the existing `psKey()` Enter/Space helper but does not change it.

## Results by group (all PASS)

| Group | What it checks |
|---|---|
| helpers | Date labels `30 Oct · 2:05 PM`, `3 Oct · 8:26 AM`, `21 Sep · 12:36 PM`; time sort key order |
| header | Breadcrumb `Home / Inbox`. H1 is exactly `Inbox` (no ⓘ). Pill reads `4 unread`. `Connected: developer@i4tglobal.onmicrosoft.com` and `Sync folder: Inbox` are shown. No `.toolbar`, no table, no `.statusline`. No `Confirmed Phase 1`, `Sync Now` or `Auto (every 5 mins)`. No Linked Record or Received Date column headers. Search placeholder and Mark all as read button are present |
| list | Tabs read `All emails 12` / `Unread 4`. Status options and sort options are correct. Newest-first order is 12,11,1,2,3,4,5,6,7,8,9,10. Groups read `October 2026 · 7 emails` and `September 2026 · 5 emails`. Row 12 shows sender, address, subject, the `Action needed` badge (bg rgb(255,244,229)), chips `Roofline_Quote_311.pdf`/`photos.zip`, date `30 Oct · 2:05 PM`, unread bg rgb(240,245,255), a blue dot and a bold subject. Row 11 is read and white. Rows 6 and 9 have no attachment line. Badge counts are 6/5/1. The list has no record chips or buttons. Footer reads `Showing 12 of 12 emails` and the legend is present. Oldest first reverses rows and groups |
| filters | Each status filter shows only that status and the matching count (6/5/1). Action needed groups read Oct · 4 and Sep · 2. No action shows `September 2026 · 1 email`. Searches: `roofline` returns [12], `QR002210` returns [11], **`WO615003` returns [8, 10]** (8 by subject, 10 by linked record id), `supplier.testing001` returns [4, 5]. `zzz` shows `No emails match these filters.` and `Showing 0 of 12 emails` |
| unread | The Unread tab lists [12,3,4,5]. **Opening email 3 drops the pill and the tab to 3.** Row 3 stays listed with the current-row style until the panel closes, then the list is [12,4,5]. Row 3 is white on the All tab. Undo after Create SR on email 5 does not bring back its unread state |
| keyboard | Enter on a focused row opens it. Escape closes the panel. Space opens a row without scrolling the page |
| markall | **Mark all as read**: toast `All emails marked as read` with no Undo, pill `0 unread`, `Unread 0`, no unread rows, button disabled |
| current | Only the open row has `ib-current` + `aria-current`. Its inset 3px blue left border is present, and the style moves when you open another row |
| panel | Email 3: eyebrow `Email Details`. Body order is AI card (with Change), `Email thread`, `Linked records (1)`, `AI-filled details`. No "Original Email". The thread has From/To/Received, the body and `Attachments (1)` with Preview. Footer shows `Create QR`. Email 9: thread then `Linked records (0)`. Email 10: same order as email 3. `openPanel(3,'links')` puts `#linksBox` between the sticky header and footer |
| actions | **Email 10 Create WO**: the `New Work Order` form opens with strata prefilled `SP12345` and Submit disabled until a contractor is chosen. Submit shows toast `WO620041 submitted` with Undo; the panel shows 3 links and the row badge is Done. **Undo** restores 1 link and Action needed. Email 3 Create QR shows `QR002217 submitted`; Undo restores SR0001 to Open and the email stays read. **Email 12 Link to QR** goes through the Change menu (`✦ Recommended`): the dialog opens, Link shows toast `Linked to QR002208` and the row badge becomes Done. Email 11: Open record shows `Quote Request – QR002210`; Remove link shows the toast, and Undo restores it. **Remove link on WO619624 (email 1) shows `Change not possible`.** Email 5 Actions ▾ → Create Service Request shows the toast. `＋ Add link` opens a menu headed "Add link". Clicking a record chip opens the SR dialog |
| toast | At 900px the toast sits above the panel footer, and closing the panel resets `#toast.style.bottom` to `''`. At 1440px the toast sits left of the panel. The Mark all toast shows when no panel is open |
| responsive | At 600px and 390px there is no horizontal scroll, the date moves under the subject, and the tabs, filters, search and Mark all button are all visible |
| regression | Computed styles match the baseline for all 28 selectors (settings, header, sidebar, panel, dialog). The one excluded property is `.sidebar` height, which stretches with the now taller Inbox content. The header gear opens settings. Sign in with Microsoft shows the connected state, and Disconnect shows sign-in again. The Inbox nav shows 12 rows. **SR register** opens (`Service Requests – Active and Archived`). **Sidebar Email Integration** opens `Email Integration – Settings`, and Save shows the `Email-to-SR automation` toast. **Work Orders / All** shows `#woIntegratedView` and the iframe has content. **Calendar** works. Returning to Inbox works. The devlabel is unchanged |
| errors | No console errors or page errors. The browser's automatic `GET /favicon.ico` returns 404 from the static server. The app does not request it, and it happens on unchanged pages too, so the script ignores it |

## Screenshots (`.agents/tasks/inbox-list/shots/`)

- `list-1440.png`: full Inbox at 1440px
- `list-unread.png`: Unread tab
- `list-action-needed.png`: status filter set to Action needed
- `list-oldest.png`: Oldest first
- `panel-email10-1440.png`, `panel-email3-1440.png`: panel open, showing the new order and `Email Details`
- `list-600.png`, `panel-600.png`, `list-390.png`, `panel-390.png`: narrow widths
- `toast-900.png`: Undo toast placement with the panel open at 900px

## Decisions (behaviour notes)

- **Attachment chips** show the real file name, one chip per attachment, max 150px with an ellipsis and the full name as a tooltip. The chips are not separately clickable; clicking one opens the panel like the rest of the row. Rows without attachments have no third line.
- **Unread model.** Emails 12, 3, 4 and 5 start unread. Opening an email's panel marks it read straight away, and the pill, Unread tab count and row style update immediately. If you open an unread email from the Unread tab, it stays in that list (shown as the current row) until you close the panel, switch tabs or open another email, so rows don't vanish under the cursor. Mark all as read has no Undo and is disabled when nothing is unread. The pill stays visible at `0 unread`.
- **Unread and Undo.** Read/unread is not part of Undo. The Undo handler copies the email's current `unread` value onto the restored snapshot, so Undo never brings back an unread dot. Mark all as read does not touch the Undo snapshot.
- **AI-filled details placement.** It moved to 4th, after Linked records and before the sticky footer. It is still shown only for emails that have AI fields (emails 3, 4, 5, 6 and 10).
- **Email thread naming.** The "Original Email" section is renamed `Email thread` (`id="threadBox"`). Its content is unchanged and no fake replies were added.
- **Counts.** The tab counts (12 / unread) ignore search and status. The group headers, the list and the footer follow the tab, status and search. Group headers use `1 email` for a single email.
- **Links scroll.** `openPanel(id,'links')` now sets `#panel.scrollTop` so `#linksBox` lands just below the sticky header, because `scrollIntoView` would leave it under the sticky footer.
- **Toast.** The existing placement logic is unchanged. `closePanel()` now clears the toast's inline `bottom`, so a visible toast drops back to its normal place when the panel closes.
- **Record numbering.** Undo does not roll back record numbers; this was already the case before this change. For example, after Create WO on email 10 followed by Undo, the next Create SR gets SR0006.
- **Removed dead code.** `recordCell`, `GLYPHS`, the eye button branch of `actionCell`, and the table/toolbar/old header/pager/statusline/eye/dots/row-icon CSS. `.emailtable` selectors were narrowed to `#panel`. `chip()`, `actionCell()`, `badge()` and the panel CSS stay, because the panel still uses them.
