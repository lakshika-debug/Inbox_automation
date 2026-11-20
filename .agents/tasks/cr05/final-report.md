# CR05 final report

Only `index.html` changed (84 insertions, 19 deletions). Nothing is committed or pushed. Verification details are in `verification.md`.

## Changes per item

1. **Email thread**
   - Emails can now carry a `thread` array of messages: `{fromName, from, to[], cc[], date, body, attachments[]}`, stored oldest first. `threadOf(e)` builds a single message from the existing fields for emails without one.
   - **Email 3:** Tommy's report (28/10 04:18 PM, ceiling_leak.jpg), then Jane's reply asking for access details and confirming a plumber (29/10 08:05 AM), then Tommy's reply (29/10 10:36 AM).
   - **Email 10:** ABC's invoice and leak report (08/09 10:20 AM, INV-2046.pdf), then Jane's request for details and photos (08/09 01:05 PM), then ABC's reply with kitchen_leak.jpg (09/09 03:45 PM).
   - **Email 6:** Sara's original report (14/09 08:52 AM), then her existing follow-up (21/09 12:36 PM).
   - Cc lines use invented example addresses: Liam Carter, building manager; ABC Plumbing Accounts; Priya Shah, committee; Strata Committee.
   - `e.date` equals the newest message, so list dates are unchanged.
   - For emails with a thread, `e.attachments` is derived from all messages. Email 10's row now also shows kitchen_leak.jpg.
   - The mailbox address is `developer@i4tglobal.onmicrosoft.com`.
   - **Rendering:** cards newest first, each with an initial avatar, bold name and `<address>`, a muted `to …` line, a `Cc …` line only when present, and the date at the top right. There is no "Received" label. The body follows, then that message's attachments.
   - The list scrolls inside the section: `.th-list`, max-height 420px, `overflow-y:auto`, thin scrollbar, focusable region. It starts at the top. The section header reads `Email thread (n)`.
2. **Panel header:** a bar with `<h2 class="ph-title">Email Details</h2>` (17px bold) and × on one row, with a divider below. The subject (14px), the Action needed flag and the linked-record count sit underneath in `.ph-sub`. The header is still sticky.
3. **Converted SRs:**
   - Linked records uses `visibleLinks(e)`, so converted SRs are hidden. Index mapping for the ⋯ menu still points into `e.links`.
   - Both counts (the section title and the header) count only the records shown.
   - The `· from SR…` suffix is removed from chips. `linkRole(l)` shows `Quote Request` or `Work Order` for records created from an SR.
   - `l.from` is kept for the rules. Cancelled SRs still show.
4. **Outcome line:** `outcomeText(e)` builds the line from WO/QR links that are not cancelled, oldest first, joined with `. `. The wording is `Invoice linked to {id}`, `Quote linked to {id}`, `Converted to Quote Request {id}` or `Converted to Work Order {id}`. It shows in bold when the email is not flagged and not dismissed. Flagged emails, email 9 and dismissed emails are unchanged.
5. **Attachments:**
   - Each row has icon-only buttons, Download (inline SVG, arrow into a tray) then Preview (↗). They have aria-labels and a CSS `::after` tooltip that shows on `:hover` and `:focus-visible`.
   - Each message with attachments gets a `Download All` text button on the right of its `Attachments (n)` row.
6. **List thread count:** a grey count `.ib-tc` follows the sender name on emails with 2 or more messages (3, 10 and 6 show 3, 3 and 2). The aria-label gains `(n messages)`.
7. **Linked records meta line:** the attachments text and ✦ are removed.
   - The meta line reads `Automatically linked - {date}` or `Linked by {user} - {date}`, using `byText(l)`.
   - Seed stamps now include the time.
   - Create QR/WO (the created record and any background SR) and Link to WO/QR use `nowStamp()`, which is TODAY plus the current `h:mm AM/PM`.

## Decisions recorded
- **Thread date format:** the existing `dd/mm/yyyy hh:mm AM` format, the same as `e.date` (e.g. `29/10/2026 10:36 AM`).
- **User-message styling:** a light blue card tint, a blue avatar, and `(you)` after the name.
- **Chip role for records created from an SR:** `Quote Request` for QR and `Work Order` for WO. Only the display changed. The stored role is still `Request`, so the ⋯ menu header and the record dialog are unchanged.
- **AI link timestamp source:** the email's list date (`e.date`, the newest message). This matches the SR register's `created` value.
- **User link timestamp:** `TODAY` plus the clock time when the action runs, e.g. `18/11/2026 2:45 PM` (no leading zero, as in the brief).
- **Download:** a real browser download of a text placeholder named `{name}.txt` (e.g. `kitchen_leak.jpg.txt`), plus the toast `Downloading {name} (prototype)`. A `.jpg` or `.pdf` file holding text would look corrupt, so the `.txt` name was used instead.
- **Download All:** a toast only (`Downloading n attachment(s) (prototype)`). It downloads no files, so Chrome never asks for permission to download multiple files.
- **Preview:** opens a blob HTML page with `window.open(url,'_blank')` and then sets `opener=null`. The literal `'noopener'` feature was not used because with it `window.open` returns null, so a blocked pop-up could not be detected. If the pop-up is blocked, a toast appears.
- **Tooltip:** a CSS tooltip plus the aria-label, with no native `title`, so the tooltip never shows twice.
- **At ≤650 px:** the thread avatar is hidden and the body and attachments are not indented, so headers wrap cleanly.

## Verification
- `node --check` passed on all 3 inline scripts.
- Playwright (Chrome):

  | Suite | Result |
  |---|---|
  | CR05 | **242/242** |
  | cr02 | **148/148** |
  | cr03 | **262/262** |
  | cr04 | **90/90** |
  | qa13 | **40/40** |

- No page errors or console errors.
- 15 older assertions covered behaviour that CR05 replaces (the `from SR` chips, no bold text on linked emails, the aria-label without a count). They were updated, and none were removed. They are listed in `verification.md`.

Screenshots, all viewed, are in `.agents/tasks/cr05/shots/`:
- `email3-thread-top-1440.png` and `email3-thread-bottom-1440.png`
- `email10-1440.png`
- `email6-links-1440.png`
- `email1-outcome-1440.png`
- `attachment-tooltip-preview.png`, `attachment-tooltip-download.png` and `attachment-tooltip-focus.png`
- `list-1440-counts.png`
- `email3-390.png`, `email3-390-thread.png` and `list-390.png`

## Not verified or open notes
- Only desktop Chrome was tested. Screen readers and axe were not run.
- The pop-up-blocked toast path was not exercised, because Playwright allows pop-ups.
- Email 3's pending reason still reads "Create a Quote Request or Work Order from SR0001". This is existing AI text, which the brief keeps unchanged.
- The `Created from SRxxxx` row in the Open record dialog is unchanged, because dialogs are out of scope.
- At 390 px, a very long address with no break points can still break inside the word.
