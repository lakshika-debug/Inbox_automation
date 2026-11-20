# CR05 verification

Iteration 1 (there was no review.json, so this was implemented from scratch). Only `index.html` changed: 84 insertions, 19 deletions. Nothing is committed.

## Commands and results

| Command | Result |
|---|---|
| `node /tmp/cr05-verify/extract.js` | Wrote 3 inline scripts and skipped 1 `text/plain` block (woModuleEncoded) |
| `node --check /tmp/cr05-verify/inline{0,1,2}.js` | All 3 OK |
| `node /tmp/cr05-verify/cr05.js` (new CR05 suite) | **242/242 PASS**, 0 page or console errors |
| `node /tmp/cr05-verify/cr02.js` | **148/148 PASS** |
| `node /tmp/cr05-verify/cr03.js` | **262/262 PASS** |
| `node /tmp/cr05-verify/cr04.js` | **90/90 PASS** |
| `node /tmp/cr05-verify/qa13.js` | **40/40 PASS** |

Setup: Chrome (`chromium.launch({channel:'chrome'})`) with Playwright from `/tmp/inbox-v2-verify/node_modules`, against the server already running at http://127.0.0.1:3000/. Results JSON files are in `/tmp/cr05-verify/*-results.json` and logs in `/tmp/cr05-verify/*.log`.

## Previous suites: assertions updated for CR05

The suites were copied from `/tmp/cr04-verify/` to `/tmp/cr05-verify/` with their paths changed. On the first run, 15 checks failed, and every one asserted behaviour that CR05 replaces. They were updated as follows:
- **cr02:** email 6 chip `QR QR002215 · from SR0003` becomes `· Quote Request`. The row aria-label now includes `(3 messages)`. Email 10 after Create WO reads `WO WO620041 · Work Order`. Email 3 after Create QR reads `QR QR002217 · Quote Request`, in 2 places.
- **cr03:** the email 6 chip expectation.
- **cr04:**
  - The old check "no bold text" for emails 1, 2, 6, 7 and 11 now checks for the exact bold outcome line.
  - Email 10 after Create WO now expects the bold `Invoice linked to WO615003. Converted to Work Order WO620041`.
  - The email 3 chip.
  - Email 9 after Link to WO now expects the bold `Invoice linked to WO…`.

No other assertions changed.

## CR05 suite coverage (cr05.js, all PASS)

**Thread (all 12 emails)**
- Emails 3, 10 and 6 show 3, 3 and 2 messages. Every other email shows 1. The header reads `Email thread (n)`.
- Dates run strictly newest first, and the top message's date equals the list date.
- Each date sits at the top right of its message header (right gap ≤ 1 px, top gap 0–3 px, no overlap with the sender block).
- No `Received` label appears, and no `developers@i4tglobal.com`.
- A Cc line appears exactly on the messages that define Cc.
- Every message has a `to` line.
- User messages come from `developer@i4tglobal.onmicrosoft.com`, are marked `(you)` and are tinted.
- Single-message emails are built from the existing fields.
- The thread starts at scrollTop 0.

**Scrolling and content**
- At 1440×900, email 3 has scrollHeight > clientHeight with clientHeight ≤ 420, and it can scroll to the bottom. Email 10 also scrolls.
- The conversation order and content are correct for emails 3, 10 and 6.
- Email 10's list attachments are derived from all of its messages.

**List**
- Rows 3, 10 and 6 show the counts 3, 3 and 2 in muted grey (`#8a929c`), right after the sender name, and the aria-label includes `(n messages)`.
- The other 9 rows show no count.

**Header**
- The `h2` "Email Details" is 17 px and bold, with × on the same row and a 1 px divider below.
- The subject, the Action needed flag and `1 linked record` sit underneath.
- The header stays sticky when the panel scrolls.

**Linked records (every email)**
- Exact chip and meta pairs, for example `Automatically linked - 29/10/2026 10:36 AM` and `Linked by Jane Thornton - 22/09/2026 9:15 AM`.
- The counts include only the records shown.
- No 📎, ✦ or file names appear in the meta lines.
- No "from SR" appears in chips or link rows. No "from SR" appears anywhere in the page text, except on email 3, whose existing pending reason says "…from SR0001".
- Email 6 has no SR0003 row.

**Create QR on email 3**
- The row reads `QR QR002217 · Quote Request`, and the SR0001 row is gone (SR0001 is Converted in the data).
- The outcome line is bold: `Converted to Quote Request QR002217`.
- The meta line reads `Linked by Jane Thornton - 18/11/2026 h:mm AM|PM`, using the current clock.

**Outcome line**
- Emails 1, 2, 6, 7 and 11 show the exact bold text, no subtext, and Actions ▾ only.
- Flagged emails 12, 3 and 10 keep their AI text with only `Recommended Action:` in bold. Email 9 keeps its existing text.
- Email 10 after Create WO shows `Invoice linked to WO615003. Converted to Work Order WO620041`. Its rows are WO620041 · Work Order (user stamp) and WO615003 · Invoice (AI stamp), with no SR row.
- Email 12 after Link to QR shows `Quote linked to QR002208`.
- Email 8 after Link to WO shows `Invoice linked to WO615003`.
- A dismissed email 10 keeps today's text.

**Dismiss on email 3**
- SR0001 is still shown as Cancelled, and Flag again reopens it (link and registry).

**Attachments**
- Each row has Download then Preview icon buttons. The buttons contain no words (an SVG and ↗) and carry aria-labels `Download {name}` and `Preview {name}`. The `Preview ↗` text button is gone.
- `Download All` is right-aligned on the `Attachments (n)` row.
- The CSS tooltip is hidden by default and appears on hover (`::after` content `"Download"` or `"Preview"`, opacity 1).
- **Keyboard:** Tab from Download All reaches Download, then Preview, and the tooltip shows on focus.
- **Preview:** Enter on Preview opens a new page (context `page` event) titled `Preview – ceiling_leak.jpg`, with a blob: URL and `window.opener===null`. A click on email 10 opens `Preview – kitchen_leak.jpg`.
- **Download:** a click fires a `download` event for `kitchen_leak.jpg.txt` containing the placeholder text, and the toast reads `Downloading kitchen_leak.jpg (prototype)`. Enter on Download for the oldest message downloads `INV-2046.pdf.txt`.
- **Download All** toasts show `Downloading 1 attachment (prototype)` and `Downloading 2 attachments (prototype)` (email 12).

**Responsive (390, 700 and 1440 px)**
- The list has no horizontal scroll.
- For emails 3, 10, 6 and 1, the page, the panel and the thread list have no horizontal overflow, and no element sticks out of a message card.
- The date stays top right, clear of the sender block, and the header bar keeps the title and × on one row.
- At 390 px, the toast shows at the bottom right.

**Errors:** none.

## Greps (index.html)
`developers@i4tglobal.com`, `Preview ↗`, `'from '+l.from`, `✦ ':''}Linked by` and `>Received<` each return 0 matches.

## Screenshots (viewed)
In `.agents/tasks/cr05/shots/`:
- `email3-thread-top-1440.png` and `email3-thread-bottom-1440.png`
- `email10-1440.png`
- `email6-links-1440.png`
- `email1-outcome-1440.png`
- `attachment-tooltip-preview.png`, `attachment-tooltip-download.png` and `attachment-tooltip-focus.png`
- `list-1440-counts.png`
- `email3-390.png`, `email3-390-thread.png` and `list-390.png`

After the first look at `email3-390.png`, I changed the CSS at ≤650 px. The avatar is hidden there, so the sender block gets the width, and addresses wrap at word boundaries (`overflow-wrap:break-word`). All suites were rerun after this change, with the results above.
