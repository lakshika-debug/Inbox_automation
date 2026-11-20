# Email thread, outcome line and Linked records clean-up in the Email Details panel

CR05 turns the Email thread section into a scrollable, newest-first conversation with Cc lines and the user's own replies. It gives the side panel a proper "Email Details" header bar and shows a bold outcome line ("Invoice linked to WO619624", "Converted to Quote Request QR002215") once automation or the user has completed the work. Converted SRs are hidden from Linked records, and the meta line is reduced to "Automatically linked - …" or "Linked by <User> - …". Attachments get icon-only Download and Preview buttons with tooltips plus a Download All text button, and the Inbox list shows a Gmail-style message count after the sender. Only `index.html` changed, and every hunk falls in the panel, the list row, the email seed data or the link-stamp helpers.

Watch for: the thread data for email 10 adds `kitchen_leak.jpg`, which also shows up in the list row and in the Create/Link dialogs (confirmed, minor). Attachment tooltips can be clipped by the thread scroller when a row is scrolled to the top edge (likely, minor). At 390 px, long addresses break mid-word (confirmed, cosmetic). None of these block.

**Verdict**: APPROVED

## High-level view

Emails can now carry an optional `thread` array, stored oldest first and rendered newest first. Emails without one fall back to a single message built from the existing fields. Emails 3 and 10 each hold a three-message conversation with a reply from `developer@i4tglobal.onmicrosoft.com`, which is tinted and marked "(you)". Email 6 holds two messages from Sara. The list row count (3, 3, 2) and the panel both read the same `threadOf()` helper.

The outcome line comes from the WO and QR links that are not cancelled, not from `e.ai`. It replaces the AI sentence only when the email is neither flagged nor dismissed. The stored AI text, pending, recommendation and link data are identical to the base once the new link timestamps are set aside.

Linked records now applies the existing `visibleLinks()` rule, so converted SRs disappear from the panel, the header count and the list. Records created from an SR show their own type ("· Quote Request" or "· Work Order") instead of "· from SR…". The ⋯ menu still indexes into the full `e.links`, so Replace with… and Remove link act on the right record even though the rows are filtered.

Download saves a `.txt` placeholder named after the file, Preview opens a blob page in a new tab with `opener` cleared, and Download All only shows a toast. That asymmetry is the coder's recorded decision for the prototype. It avoids Chrome's multiple-download prompt.

<details>
<summary>Issues (3)</summary>

1. **Email 10 attachment set leaks beyond the thread** (confirmed, minor) — deriving `e.attachments` from all messages adds `kitchen_leak.jpg` to email 10's list row chips and to the Create WO / Link to WO dialogs (as an "Additional document"). Accept it as consistent with the thread, or keep the list on the original attachment set if the list rows must stay unchanged.
2. **Tooltip clipped at the top of the thread scroller** (likely, minor) — the `::after` tooltip sits above the button inside `.th-list`, which clips overflow. If an attachment row is scrolled within about 25 px of the scroller's top edge, the tooltip is cut off. Place the tooltip below the button in that case, or accept it for the prototype.
3. **Mid-word address breaks at 390 px** (confirmed, cosmetic) — `<developer@i4tglobal.onmicrosoft.com>` wraps as "onmicrosoft.co / m". Breaking before the `<` or after the `@` would read better. The coder already listed this as an open note.

</details>

<details>
<summary>Details</summary>

### Thread data feeding the list, panel and dialogs

```
e.thread (oldest first) ──► threadOf(e) ──┬─► thMarkup: reverse() → newest-first cards in .th-list
  (absent → one message from              ├─► rowHtml: count .ib-tc when length > 1
   sender/address/date/body)              └─► e.attachments = union of message attachments (at load)
```

`e.date` equals the newest message's date for emails 3, 6 and 10, so list dates, month groups and sorting do not move. The attachment union runs once at load (`emails.forEach(...)`), and that is where the email 10 side effect comes from. `createForm` and `linkForm` both read `e.attachments`, so the "Use as invoice" radio list for email 10 now offers `kitchen_leak.jpg` as a second option, and the list row shows a second attachment chip (confirmed).

The tooltip on the attachment buttons is positioned above the button (`bottom: calc(100% + 6px)`) inside `.th-list`, which has `overflow-y:auto`. In the default scroll position the first attachment button sits about 360 px below the scroller's top, so the tooltip shows in full. If the user scrolls an attachment row up to the top edge, the scroller clips the tooltip (likely; this state was not exercised).

### Chip role versus ⋯ menu header

The chip now uses `linkRole()`, but the ⋯ menu header still reads the stored `l.role`. QR002215 therefore shows "· Quote Request" on its chip and "QR002215 · Request" in its menu header. The menu was kept unchanged on purpose, and the old chip ("· from SR0003") already differed from the menu, so this is informational.

### Test coverage

The coder's evidence is present: a 242-check CR05 suite, re-runs of the cr02, cr03, cr04 and qa13 suites, and 15 older assertions updated only where CR05 replaces behaviour.

This review ran its own Playwright pass in Chrome (`/tmp/cr05-review/review.js` plus `followup.js`). It covered the following:

- **Thread:** emails 3, 10 and 6 show 3, 3 and 2 messages, newest on top. Dates sit at the top right, with no "Received" label. Cc lines appear, and replies come from `developer@i4tglobal.onmicrosoft.com`. Every thread starts at scrollTop 0, and emails 3 and 10 scroll (scrollHeight 878 and 906 against a clientHeight of 420).
- **List and header:** the list counts are 3, 3 and 2, with none on the other nine rows. The "Email Details" header bar has × on the same row.
- **Outcome lines and links:** the five exact bold outcome lines appear. Email 6 shows only QR002215, with no "from SR" in the list or the panel. Every meta line uses one of the two forms, with no ✦ or file names.
- **Create actions:** Create QR on email 3 gives "QR QR002217 · Quote Request" with SR0001 gone. Create WO on email 10 gives "Invoice linked to WO615003. Converted to Work Order WO620041".
- **Dismiss:** Dismiss on email 3 keeps SR0001 visible as Cancelled, and Flag again reopens it.
- **Attachments:** each row has Download then Preview, icon-only, with tooltips on hover and on keyboard focus. Preview opens a tab titled "Preview – ceiling_leak.jpg", Download fires a download, and Download All sits right-aligned on the Attachments row.
- **Menus:** the ▾ and ⋯ menu contents are unchanged. Replace with… shows the blocked rule on email 1 and the confirmation on email 11.
- **Layout:** there is no horizontal overflow at 390, 700 or 1440 px for emails 3, 10, 6, 1 and 12. At 390 px the toast shows at the bottom right.
- **Data guardrails:** comparing the data with the base commit confirmed that the AI text, pending, links (stamps aside), recommendations, `srRegistry`, rules, options and `woModuleEncoded` are unchanged.

There were no page errors. The only console error was a 404 for `/favicon.ico` from the static server, which is unrelated to the change.

Not tested: screen readers, the pop-up-blocked toast path for Preview, and the tooltip at the top edge of a scrolled thread.

</details>

<details>
<summary>File map</summary>

`index.html`: new CSS for the header bar, thread cards, icon buttons with tooltips and the list count; `thread` data for emails 3, 6 and 10, plus link timestamps with times; the helpers `linkRole`, `nowStamp`, `byText`, `outcomeText`, `threadOf`, `thMsg`, `thMarkup`, `attDownload`, `attPreview` and `attDownloadAll`; `panelMarkup` (header, outcome line, thread, Linked records); `submitCreate` and `submitLink` stamps; and the `renderRows` count. Full diff: `git -C "/Users/arjuna/Documents/inbox automation/Inbox_automation" diff index.html`.

</details>
