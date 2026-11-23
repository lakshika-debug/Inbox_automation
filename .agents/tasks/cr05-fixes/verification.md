# CR05 fixes – verification (iteration 1)

Only `index.html` changed (`git diff --stat`: 1 file, 20 insertions, 11 deletions). Every hunk is in the Email thread CSS (`th-` prefix) or in the `thMsg` thread helpers. Nothing is staged or committed. The untracked files `Instruction/cr03.md`, `assets/logo 1.png`, `assets/logo 2.png` and `.DS_Store` were not touched.

## Changes
1. **Attachments per message, compact grid**
   - Before the change, `thMsg` already rendered each message's own `m.attachments` under that message's body. It had its own `Attachments (n)` row, and `Download All` received that message's count. Nothing aggregated attachments across messages inside the thread, so the per-message structure was kept as it was.
   - The rows now sit in a `.th-agrid` grid: `repeat(3,minmax(0,1fr))` with a 6px gap. It drops to 2 columns at ≤650px and 1 column at ≤420px.
   - Each box is `height:30px` with `padding:0 3px 0 7px`. It contains a 📎 icon (`.th-clip`, `flex:none`), then the name, then the buttons on the right.
   - The name (`.th-aname`) is `min-width:0; flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis`, 11px. The name span's `title` holds the full name, and the buttons' aria-labels still include it.
   - The icon buttons are 22×22px with a 3px gap. The SVG is 12px and the ↗ is 12px. The order (Download, Preview), the `data-tip` tooltips, the aria-labels (no native `title`) and the focus outline are unchanged.
2. **Tooltip clipping**
   - The `::after` tooltip now shows **below** the button (`top:calc(100% + 5px)`).
   - `thTip(btn)` runs on `mouseenter` and `focus`. It adds `.th-up`, which flips the tooltip above the button, when the button's bottom + 28px would pass the bottom of the `.th-list` visible area.
   - A row at the scroller's top edge therefore shows its tooltip below the button, and a row at the bottom edge shows it above.
3. **Address wrapping**
   - The new `thAddr(s)` wraps each address in the From line and in every to/Cc recipient as `<span class="th-em"><span class="th-nw">&lt;local@</span><wbr><span class="th-nw">domain&gt;</span></span>`. Both inner spans are `white-space:nowrap`, and `.th-em` is `display:inline-block; max-width:100%`.
   - When the whole `<…>` fits, it moves to the next line as one unit, so the break falls before the `<`.
   - When it does not fit, it breaks only at the `<wbr>` after the `@`. This happens at 390px for Jane's own From line, `<developer@` / `i4tglobal.onmicrosoft.com>`.
   - Names and commas are escaped as before.

## Decisions recorded
- **List row and dialogs:** `e.attachments` stays the union of all messages' attachments. Email 10's list row chips and the Create WO / Link to WO dialogs still include kitchen_leak.jpg. Inside the thread, kitchen_leak.jpg appears only under the newest message.
- **Narrow layouts:** the grid has 1 column at ≤420px viewport width. At 390px, two columns would leave about 63px per name (around 10 characters), so even `INV-2046.pdf` would be truncated. The panel at 700px is 600px wide and still fits 3 columns.
- **Tooltip placement:** the tooltip shows below by default and flips above near the scroller's bottom edge. A CSS-only "always below" would still clip at the bottom edge when a row sits there mid-scroll.
- **Paperclip icon:** the existing 📎 emoji is kept, now in its own non-shrinking span, so truncation never cuts it.

## Commands and results
- **Environment:** `/tmp/inbox-v2-verify/node_modules/playwright` had been emptied by macOS `/tmp` cleanup (0 files). The old folder was moved aside, and Playwright 1.65.1 was reinstalled there with `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install --no-save --no-package-lock playwright`. The suites use `channel:'chrome'`. The static server at http://127.0.0.1:3000/ answered 200, and no other server was started.
- **Syntax check:** `node /tmp/cr05fix-verify/extract.js` wrote 3 inline scripts and skipped 1 `text/plain` block. `node --check inline0.js inline1.js inline2.js` passed on all 3.
- **Playwright suites** (Chrome), all in `/tmp/cr05fix-verify/`. They are copies of `/tmp/cr05-verify/` with only the output paths changed; no assertion was edited.

  | Suite | Result |
  |---|---|
  | `cr05fix.js` (new) | **150/150** |
  | `cr05.js` | **242/242** |
  | `cr02.js` | **148/148** |
  | `cr03.js` | **262/262** |
  | `cr04.js` | **90/90** |
  | `qa13.js` | **40/40** |

  There were no page errors and no console errors (favicon 404 filtered).
- **`cr05fix.js` coverage:**
  - **Per message:** for all 12 emails, each message's DOM attachment names equal that message's data, newest first. The `Attachments (n)` label shows that message's count, and messages with no files have no block. The block follows the body, and the name `title` holds the full name.
  - **Emails 10, 3 and 12:** email 10 shows kitchen_leak.jpg only under the newest message (one occurrence) and INV-2046.pdf only under the oldest. Email 3 shows ceiling_leak.jpg only under the oldest message. Email 12 has one block with 2 files.
  - **Union decision:** `find(10).attachments` is `['INV-2046.pdf','kitchen_leak.jpg']`, and the row text includes kitchen_leak.jpg.
  - **Download All:** email 10 shows "1 attachment" on both its newest and oldest messages, and email 12 shows "2 attachments". The injected message shows "5 attachments", and the ceiling_leak message in the same thread shows "1 attachment".
  - **Real-data layout** (emails 3, 10, 12 at 1440px):
    - Box height ≤32px (30px measured).
    - Buttons 22×22px; SVG 12px; ↗ 12px.
    - Name is one line (`Range.getClientRects` gives a single top). Styles are nowrap, hidden, ellipsis, min-width 0, flex-grow 1.
    - The 📎 is left of the name, and the name's right edge is ≤ the Download button's left edge. Buttons are inside the box.
  - **Injected test case** (in-memory only): a 5-attachment message with long names is pushed into `find(3).thread` and the panel is re-opened.
    - Column counts: 1440px gives 3 per row (rows [3,2]), and 700px also gives 3. 600px gives 2 ([2,2,1]), and 390px gives 1.
    - Long names have `scrollWidth > clientWidth` (ellipsis), are one line, and never overlap the buttons. `notes.txt` is not truncated.
    - No horizontal scroll at any of the four widths.
    - Download on a grid item fires a `download` event (`Strata_plan_….pdf.txt`). Preview opens a new tab titled `Preview – Plumber_quote_….pdf`.
    - Buttons keep the order Download, Preview, with aria-labels and no `title`.
  - **Tooltip geometry:** the tooltip rect is computed from the `::after` computed geometry and checked against the `.th-list` visible rect.
    - **Top edge:** an attachment row is scrolled so its top is at the scroller's top edge (dTop 0). Cases: the injected newest message's first row, and real data email 10 kitchen_leak.jpg.
    - **Bottom edge:** a 5-attachment message is injected as the oldest message, and rows are scrolled so their bottom is at the scroller's bottom edge (dBottom 0). Cases: the first row and the second row.
    - **Scrolled to the end:** the last row with the list scrolled fully down. Cases: the injected oldest message and real email 3.
    - **390px:** both the top and bottom edges.
    - **Result:** on hover over Download and Preview, and on keyboard focus (`:focus-visible` confirmed, then Tab to Preview), the tooltip is opacity 1, visible, and fully inside the scroller. It shows below at the top edge and above (`.th-up`) at the bottom edge.
  - **Addresses** (390, 700 and 1440px; emails 3, 10, 6, 12, 1):
    - Every character's line box was checked with `Range.getClientRects`. Each line break comes after a space or after the `@`, with no mid-token breaks such as `onmicrosoft.co`/`m`.
    - Every address that fits the line width sits on one line.
    - At 390px, email 3's `developer@` address splits only after the `@`.
    - The markup check confirmed both nowrap halves and the `<wbr>`. No horizontal scroll on page, panel or thread at any width.
- **Scope:** `git diff --stat` shows only `index.html`. All hunks are thread CSS (`th-em`, `th-nw`, `th-agrid`, `th-att`, `th-clip`, `th-aname`, `th-btns`, `th-ico`, tooltip, media queries) or `thAddr`, `thTip` and `thMsg`.

## Screenshots viewed
All are in `.agents/tasks/cr05-fixes/shots/`.
- **`email3-thread-1440.png`:** the Email Details panel with the thread (3). Addresses sit on single lines.
- **`inject-5att-1440.png`:** `Attachments (5)` with `Download All` at the right, and the files 3 per row (3 + 2). Long names end with "…" before the buttons; `notes.txt` is shown in full. The boxes are compact.
- **`tooltip-top-hover.png` / `tooltip-top-focus.png`:** the first attachment row at the very top of the scroller. The "Download" and "Preview" tooltips show in full below the buttons, and the focus ring is visible on Preview.
- **`tooltip-bottom-hover.png`:** a row at the scroller's bottom edge. The "Download" tooltip shows in full above the button.
- **`email3-390-addresses.png`:** at 390px each `<address>` moves to its own line as a whole. Jane's `<developer@` / `i4tglobal.onmicrosoft.com>` breaks only after the `@`.
- **`inject-5att-390.png`:** 1 per row, with long names ellipsised before the buttons.

Also produced but not individually inspected: `email3-thread-bottom-1440.png`, `email3-390.png`, `tooltip-*-hover.png` for the other edge cases, and `shots/cr05/` (written by the re-run CR05 suite).

## Not verified
- Only desktop Chrome was tested. Safari, Firefox and screen readers were not.
- The tooltip flip is decided on `mouseenter`/`focus`. If the list is scrolled with the wheel while the same button stays hovered, the side is not recomputed until the next hover. Normal hover and focus at either edge were verified.
