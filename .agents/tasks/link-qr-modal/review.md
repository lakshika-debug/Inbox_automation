# Link to QR modal: review (iteration 1)

**Verdict: APPROVED.** No blocking findings.

## What I checked and how

**Integrity and scope**
- index.html mtime is `1795405589`, the same value recorded in verification.md. I checked it at the start and again before writing this review. No one else edited the file.
- `git status`: only `index.html` is modified. `.agents/tasks/link-qr-modal/` is untracked. Nothing is staged or committed.
- `git diff b881c84 -- index.html` (245+/11−) contains:
  - `lqr-` CSS, including the ≤700px media rule
  - the `#lqrShade` container placed before `#toast`
  - `doAction` routing `link-qr` → `openLinkQR` and `link-wo` → `linkForm`
  - the new `LQR_*` data and `lqr*` functions, plus one capture-phase keydown listener
  - the removal of `QR_OPTIONS` and the `isQR` branches from `linkForm`, `renderLinkResults` and `submitLink`
- The remaining Link to WO code produces the same strings as before ('Link to Work Order', 'Use as invoice', 'Invoice', WO_OPTIONS, the 'Invoice submitted' link, the same ai/why text and toast).
- The diff does not touch the New WO/QR screen, the list, tabs, the AI box, the thread, the Linked records layout, menus, the rules engine, Settings, the SR register or woModuleEncoded.
- Submit pushes `L('QR',id,'Quote','Received',ME+' · '+nowStamp(),docs)`, where docs are the ticked files. It runs `dropOld` for replace, nulls pending/recommended/dismissed, then calls `refresh()`, closes the modal and shows the toast 'Quote linked to {id}'. The bold outcome line comes from the existing `l.role==='Quote'` → 'Quote linked to' path.
- Interpolated values go through `escapeHtml`.

**Syntax check:** `node /tmp/linkqr-verify/extract.js` wrote 3 scripts and skipped the text/plain block. `node --check` passed on all 3.

**Suites, re-run by me** (Chrome, http://127.0.0.1:3000/, output in `/tmp/linkqr-review/cur/`):

| Suite | Result |
|---|---|
| linkqr | 101/101 |
| aidetails | 71/71 |
| cr02 | 138/138 |
| cr03 | 188/188 |
| cr03dup | 57/57 |
| cr04 | 91/91 |
| cr05 | 247/248 |
| cr05fix | 153/153 |
| qa13 | 39/39 |

- The one cr05 failure ("Download All at the right") also fails on b881c84. It comes from a later approved layout change and is unrelated to this change.
- I diffed the suites against `/tmp/aidetails-verify/`. Only these changed: cr04 `email12`, cr05 `linkQR-12` (submit selector only) and qa13 `extra`/`keyboard`. All of them are tied to the old link-qr pop-up, and all match what verification.md reports.

**My own browser checks** (`/tmp/linkqr-review/review.js`, log `review.log`): 43/44 passed. The one failure was an error in my own test, explained below.

- **Email 12 via ✦ Link to QR:**
  - the modal 'Link to QR' opens with QR002208 pre-selected and 'Suggested by AI' shown, and body scroll is locked
  - clicking the selector lists all 6 QRs
  - the first Esc closes the list, the second closes the modal, and the panel stays open with no data change
- **Search:**
  - "facilities" → QR002212, QR002210, QR002201
  - "QR002204" → QR002204
  - "sp4852" → QR002208, QR002212
  - "abc plumbing" → QR002204, QR002201
  - ArrowDown + Enter picks QR002201 and hides the AI tag. Picking QR002208 with the mouse brings the tag back.
- **Tiles:** Roofline_Quote_311.pdf has the Quote tag, is ticked and is selected. photos.zip is ticked. Clicking a tile changes only the preview, and the checkbox changes only the tick.
- **Preview:** the Roofline Q-311 page shows $4,950.00 with 3 thumbnails. Zoom goes up to 200% (page width 560→1120px) and down to 50%, and the buttons disable at both limits. Clicking thumbnail 2 highlights it.
- **Toasts:** View gives 'Opens QR002208 (prototype)' and Upload gives its toast.
- **Submit enablement:** unticking all files disables Submit. × disables both Submit and View.
- **Submit with the PDF only:**
  - the modal closes and the lock is released, toast 'Quote linked to QR002208'
  - the link is QR/Quote/Received, by 'Jane Thornton · …', docs `["Roofline_Quote_311.pdf"]`
  - pending, recommended and dismissed are null
  - the row 12 chip shows 'QR QR002208 · Quote'
  - the panel shows the link and the bold outcome line
- **Email 5 via ▾:** the field starts empty with no AI tag and Submit disabled. × closes with no change.
- **Email 8:** Link to WO still opens the old 'Link to Work Order' pop-up.
- **Widths:**
  - 390px: no page-level horizontal scroll, full-screen sheet (0,0,390×844), thumbnails hidden
  - 700px: no page-level horizontal scroll, full-screen sheet (700×900), thumbnails hidden
  - 1440px: no page-level horizontal scroll, 1000×810 modal with thumbnails visible
  - the tile strip uses overflow-x auto at all three widths
- **Errors:** no page errors or console errors.
- **The failed check (B0):** I tried Replace with… → Link to Quote Request on email 11's existing *Quote* link (QR002210). On that link the menu item is disabled by the existing same-role rule in `openActionMenu` (`target.role==='Quote'&&k==='link-qr'`). That rule is present on b881c84 and the diff does not change it, so this is expected and not a finding. The coder's suite covers the replaceable case: on email 3 / SR0001 the confirm appears first, then the modal opens, and Submit cancels SR0001. It also covers the blocked case on email 1 / WO619624. Both passed in my re-run.

**Screenshots I viewed** (`/tmp/linkqr-review/shots/`):
- `r-1440-default.png`: matches the reference layout and Submit is the only footer button.
- `r-dropdown-supplier.png`: the supplier search shows bold id + title and a muted 'property · suppliers' line.
- `r-390.png`: full-screen sheet, the strip scrolls horizontally, no thumbnail column.
- `r-after-submit.png`: row 12 chip 'QR QR002208 · Quote', no flag, Action needed 6, Linked records 'Linked by Jane Thornton - …', the bold outcome line, and the toast.

## Findings
None blocking.

The coder also lists some non-blocking items, which are outside the scope of this change:
- Email 12's existing pending/why text still mentions "No matching Quote Request … choose the contractor".
- `LQR_QRS` statuses stay 'Awaiting quote' after a link.
