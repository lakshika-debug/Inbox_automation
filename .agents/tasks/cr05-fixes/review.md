# CR05 fixes – review (iteration 1)

**Verdict: APPROVED.** No blockers.

## Scope
- I ran `git status --short`. The only tracked change is ` M index.html`. The untracked `.agents/tasks/cr05-fixes/`, `Instruction/cr03.md`, `assets/logo 1.png` and `assets/logo 2.png` are not staged, and `git diff --cached` is empty. HEAD is 31ce26a on `main`.
- `git diff` shows 20 insertions and 11 deletions in `index.html`:
  - CSS lines 87 and 95–109 are all `#panel .th-*` thread rules: `th-em`, `th-nw`, `th-agrid`, `th-att`, `th-clip`, `th-aname`, `th-btns`, `th-ico`, the tooltip with its `.th-up` flip, and the ≤650px / ≤420px media rules.
  - JS lines 364–374 add `thAddr` and `thTip` and change `thMsg`. These helpers are used only inside `thMsg`, per a grep for `thAddr`, `thTip` and `th-ico`.
  - Nothing outside the Email thread section changed: list rows, dialogs, AI box, Linked records, menus and the WO module are untouched.
- The page served at http://127.0.0.1:3000/ is byte-identical to the working-tree `index.html` (checked with `cmp`).

## Coder evidence read
`verification.md` records the following:
- `node --check` passed on 3 inline scripts (the text/plain block was skipped).
- New `cr05fix.js`: 150/150.
- Regression suites: cr05 242/242, cr02 148/148, cr03 262/262, cr04 90/90, qa13 40/40.
- No page or console errors.
- The screenshots were viewed, and the decisions are recorded: the union in `e.attachments` is kept, the grid drops to 1 column at ≤420px, the tooltip shows below and flips above near the bottom, and the 📎 icon is kept.

This covers the required verification. I did not re-run those suites.

## Independent browser checks
Script: `/tmp/cr05fix-verify/review/review.js`. It runs in Chrome via `channel:'chrome'` with Playwright from `/tmp/inbox-v2-verify/node_modules/playwright`. Result: **88 pass, 0 fail**, with no page or console errors.

- **Per-message attachments** (emails 3, 10, 6, 12): each message shows exactly its own files, newest first, compared against the thread data.
  - The `Attachments (n)` label only appears on messages that have files.
  - Email 10 shows kitchen_leak.jpg once, under the newest message, and INV-2046.pdf under the oldest. Download All on the newest message toasts "Downloading 1 attachment (prototype)".
  - Email 10's list row still shows kitchen_leak.jpg, as the recorded union decision requires.
- **Grid**: I injected a 5-file message with long names into email 3 (in memory only).
  - Files per row: 3 at 1440px (rows 3+2), 3 at 700px, 2 at 600px, 1 at 390px.
  - Boxes are 30px tall. Buttons are 22×22 with a 12px SVG, in the order Download then Preview.
  - Each button's aria-label is `Download <name>` / `Preview <name>`, and the name span's `title` holds the full name.
  - The 4 long names are truncated (`scrollWidth > clientWidth`); `short.txt` is not. Every name is on one line, and each name's right edge is at or left of the Download button's left edge.
  - There is no horizontal scroll on the document, panel or `.th-list` at 1440, 700, 600 or 390px.
  - Download All toasts "Downloading 5 attachments". Download fires a `download` event (`Strata_plan_…pdf.txt`). Preview opens a new tab titled "Preview – Plumber_quote_…pdf".
- **Tooltips**: the tooltip box was computed from the `::after` used geometry and checked against the scroller's visible client rect. I tested hover over both buttons, keyboard focus with `:focus-visible` confirmed, and Tab to Preview.
  - Top edge (row top exactly at the scroller top, `pos 0`): injected newest message at 1440 and 390px, and real email 10 kitchen_leak.jpg. The tooltip shows below the button, fully inside the scroller.
  - Bottom edge (row bottom exactly at the scroller bottom, `pos 390`): the 5-file message injected as the oldest message (rows 1 and 4 at 1440px, row 5 at 390px), and real email 3 ceiling_leak.jpg. The tooltip flips above (`th-up`), fully inside.
  - Also passed: the last row with the list scrolled to the end, and email 12 (list not scrollable).
- **Addresses** at 390, 700 and 1440px (emails 3, 10, 6, 12, 1): I took every character's line box from `Range.getClientRects`. Every line break falls at whitespace in the source text or right after `@`, with no mid-token breaks.
  - At 390px the whole `<…>` moves to the next line.
  - Jane's own address breaks as `<developer@` / `i4tglobal.onmicrosoft.com>`.

## Screenshots viewed (`/tmp/cr05fix-verify/review/shots/`)
- `email3-1440.png`: the email 3 thread at 1440px. Addresses are on one line each and the date is at the top right.
- `inject-1440.png`: `Attachments (5)` with Download All at the right, files 3 per row, long names ending in "…" before the buttons, and compact boxes.
- `tip-inj-top.png`: the "Download" tooltip shows in full below the button. The row is at the scroller's top edge.
- `tip-e3-bottom.png`: the "Download" tooltip shows in full above the button. The row is at the scroller's bottom edge.
- `email3-390.png`: addresses wrap only before `<`, and the long mailbox address breaks after `@`.

## Findings
None.

Non-blocking notes, already disclosed by the coder:
- The tooltip side is decided on mouseenter/focus and is not recomputed during wheel scroll while the same button stays hovered.
- Only Chrome was tested.
