# Link to QR modal: verification (iteration 1)

**Start check:** `git status` was clean on `main` at b881c84 and there was no earlier review.json. The mtime at start was 1795402678. No one else had edited the file.

**index.html mtime at the end of my last edit:** `1795405589` (`stat -f %m`)

Only `index.html` changed: 245 insertions and 11 deletions. Nothing is staged or committed.

## What changed (index.html)

### 1. Wiring
- `doAction` now sends `link-qr` to `openLinkQR(e,replaceIdx)` and `link-wo` to `linkForm` as before.
- Every entry point goes through `runAction` → `doAction`, so the new modal opens from all of them:
  - the ✦ Link to QR split button
  - ▾ → Link to Quote Request
  - ＋ Add link → Link to Quote Request
  - ⋯ → Replace with… → Link to Quote Request
- In replace mode, the block and confirm rules in `runAction` still run first, unchanged.

### 2. Dead code removed
- `QR_OPTIONS` is removed.
- The `isQR` branches in `linkForm`, `renderLinkResults` and `submitLink` are removed. This includes the 'Quote is from' select and the QR texts. These functions now serve only Link to WO.
- The Link to WO markup and behaviour are byte-identical to b881c84. `wocompare.js` compared title + content + footer HTML for emails 8, 5 and 10, plus the submit result (links, ai, why, toast) on HEAD (file://) and the current build. All 4 comparisons returned `true`.

### 3. New markup
`<div class="lqr-shade" id="lqrShade" hidden>` sits before `#toast`. It is filled when the modal opens and emptied when it closes.

### 4. New CSS (all `lqr-` prefixed)
- Modal size: `min(1000px,100%)` wide and `min(90vh,100%)` high.
- Grey header with the bold title and ×.
- Quote Request field: label with a red `*`, a 320px selector card, and a blue pill "View Quote Request" button with an eye icon.
- Tile strip:
  - light grey, scrolls horizontally, does not wrap
  - 87×85 tiles with a checkbox at top-right and a dark 'Quote' tag at top-left
  - blue border on the tile being previewed
  - dashed Upload tile at the far right
- Viewer:
  - 150px grey column of page thumbnails, which are real scaled copies of the pages
  - right pane with a dark floating toolbar at top centre and white pages
- Grey footer with a single Submit button.
- At ≤700px:
  - the modal is a full-screen sheet with inset 0 and no radius
  - the field is full width
  - the thumbnail column is hidden
- `body.lqr-lock{overflow:hidden}` while the modal is open.

### 5. New JS
The functions are `openLinkQR`, `lqrClose`, `lqrField`, `lqrList`, `lqrKey`, `lqrPick`, `lqrEdit`, `lqrClear`, `lqrBlur`, `lqrTiles`, `lqrTick`, `lqrPrev`, `lqrViewer`, `lqrPdfPages`, `lqrZoom`, `lqrGo`, `lqrOnScroll`, `lqrFileToast`, `lqrViewQR` and `lqrSubmit`. There is also one `window` keydown listener in the capture phase.

## Sample QR data added (`LQR_QRS`, all status 'Awaiting quote')

| ID | Title | Property / plan | Address | Invited suppliers |
|---|---|---|---|---|
| QR002208 | Roof membrane repair | HARBOUR VIEW SP4852 | 18 Harbour View Parade, Kirribilli NSW 2061 | Roofline Contractors, TopCover Roofing |
| QR002212 | Roof leak inspection – Level 6 | HARBOUR VIEW SP4852 | 18 Harbour View Parade, Kirribilli NSW 2061 | TopCover Roofing, Facilities Support |
| QR002210 | Switchboard upgrade | RESVU – ESTATE | 25 Estate Drive, Parramatta NSW 2150 | Spark Electrical, Facilities Support |
| QR002206 | Intercom repair – main entrance | RESVU – ESTATE | 25 Estate Drive, Parramatta NSW 2150 | Spark Electrical |
| QR002204 | Hot water system replacement – Lot 4 | SP12345 | 7 Station Street, Strathfield NSW 2135 | ABC Plumbing |
| QR002201 | Gutter clean | SP12345 | 7 Station Street, Strathfield NSW 2135 | ABC Plumbing, Facilities Support |

- **AI suggestion:** `LQR_AI={12:'QR002208'}`. QR002208 is the existing sample ID. It already had property HARBOUR VIEW SP4852, and Roofline Contractors is now invited to it.
- **Sample documents (`LQR_DOCS`):**
  - `Roofline_Quote_311.pdf`: Roofline Contractors, Quotation Q-311, quote date 30/10/2026, valid until 29/11/2026, reference "Roof membrane repair", quote for The Owners – HARBOUR VIEW SP4852. It has 5 roof membrane line items, subtotal $4,500.00, GST $450.00 and total $4,950.00.
  - `Quote_Q-8812.pdf`: Spark Electrical, switchboard upgrade, for email 11.
  - Any other PDF gets a generic quotation built from the email: sender, subject, and the digits of the file name.
  - Each PDF has 3 pages: (1) the summary and line items, (2) scope of works and exclusions, (3) terms and acceptance.

## Decisions I made (within the brief)

**Data and suggestion**
- **Existing IDs kept:** QR002210 and QR002201 come from the old sample list. QR002210 is listed as 'Awaiting quote' even though email 11 is already linked to it. Facilities Support is still invited, and this lets email 11 show the 'Already linked' state.
- **Suggestion after linking:** the AI suggestion is skipped when that QR is already linked to the email. After QR002208 is linked, reopening Link to QR on email 12 starts empty.
- **Search keys:** search uses the QR number, the property / plan name and the invited supplier names only, as the user stated. The QR title is not searched. The match ignores case and punctuation, so "RESVU ESTATE" matches "RESVU – ESTATE".
- **AI tag:** 'Suggested by AI' shows only while the AI-picked QR is the one selected. It disappears when the user picks another QR.

**Quote Request field**
- When a QR is selected, the selector card is a button. Clicking it switches to the search input, with all QRs listed and the current one highlighted.
- Leaving the search, by blur or by clicking elsewhere, brings the selected card back. × clears the selection and focuses the empty search input.
- The list opens on click, on typing, or on ArrowDown, but not on focus alone.
- Typing highlights the first enabled match, so Enter picks it. Arrow keys wrap around and skip disabled (Already linked) items.

**Keyboard and focus**
- **Esc:** the first Esc closes an open list, and the next Esc closes the modal. This is handled in the window capture phase, so the page's own Esc handler, which closes the side panel, does not fire.
- **Backdrop:** clicking the backdrop does not close the modal (only × and Esc close it), so selections are not lost.
- **Focus on open:** focus goes to the selector card, or to the search input when the field is empty.
- **Tab:** focus is trapped. Tab from Submit goes to ×, and Shift+Tab from × goes to Submit.
- **Focus on close:** focus returns to the opener (the ✦ button). If the opener is gone, for example after Submit re-renders the panel or when the modal was opened from a menu, focus goes to the panel's ▾/Actions button, then to the panel's ×.

**Attachments and preview**
- The preview starts on the first PDF, otherwise on the first attachment.
- Clicking a tile changes only the preview. The checkbox changes only the tick.
- An email with no attachments shows only the Upload tile and the message "No attachments". Submit stays disabled because at least one ticked file is required, as the brief says.
- Image tiles use a CSS striped pattern with a picture icon. The image preview is 1 page.
- Other file types (zip) get a generic file icon and the message "Preview not available". Zoom and print are disabled for them. Download still shows its toast.
- **Zoom:** 50–200% in 25% steps. The page is drawn in `em` units with `font-size: calc(10px*var(--z))`, so the whole page scales and the pane scrolls. The thumbnails use the same markup at 2px.
- **Thumbnails:** clicking one scrolls to that page. Scrolling the pane also updates which thumbnail is highlighted.

**Toasts and Submit**
- **Toast texts:**
  - `Opens {id} (prototype)`
  - `Upload is not available in this prototype`
  - `Downloading {file} (prototype)`
  - `Printing {file} (prototype)`
  - `Quote linked to {id}`. The old pop-up's toast said `Linked to {id}`; the brief asks for this new text.
- **Submit data effects** are the same as the old QR submit:
  - `dropOld` for replace mode
  - `L('QR',id,'Quote','Received',ME+' · '+nowStamp(),docs)`, where docs are the ticked file names
  - pending, recommended and dismissed set to null
  - the same `ai` and `why` texts
  - then `refresh()`, close, and the toast

## Commands and suites run (Chrome via `chromium.launch({channel:'chrome'})`, against the running http://127.0.0.1:3000/)

**Syntax check:** `node /tmp/linkqr-verify/extract.js` then `node --check` on each script. It wrote 3 inline scripts and skipped 1 text/plain block. All 3 passed.

**Suites:** they are copied from /tmp/aidetails-verify/ to /tmp/linkqr-verify/ with the paths updated. `runall.sh` runs them with `OUT=/tmp/linkqr-verify/cur/`. The logs and results JSON are in `/tmp/linkqr-verify/{base,cur}/`.

| Suite | Baseline on b881c84 (before edits) | After change |
|---|---|---|
| linkqr (new) | – | **101/101** |
| aidetails | 71/71 | **71/71** |
| cr02 | 138/138 | **138/138** |
| cr03 | 188/188 | **188/188** |
| cr03dup | 57/57 | **57/57** |
| cr04 | 91/91 | **91/91** |
| cr05 | 247/248 | **247/248** |
| cr05fix | 153/153 | **153/153** |
| qa13 | 39/39 | **39/39** |

- **cr05's one failure exists on b881c84 too and is not caused by this change.** The check "Download All text button at the right of the Attachments (1) row" fails because a later approved change moved Download All to the left. I did not touch it.
- **No page errors or console errors** in any suite. The favicon 404 is filtered out.
- **`wocompare.js`:** Link to WO dialog HTML and submit compared against b881c84 → `true true true true`.

**The new suite is `/tmp/linkqr-verify/linkqr.js`** (a copy is in this folder). It covers:
- **Email 12 default state:**
  - modal opens, titled 'Link to QR', role=dialog and aria-modal, and the old #shade does not open
  - red asterisk, QR002208 pre-selected with its property and address, 'Suggested by AI' shown
  - Submit and View enabled, body scroll locked, focus inside the modal
- **Tiles:** Roofline_Quote_311.pdf (Quote tag, PDF icon, selected) and photos.zip (file icon), both ticked, and the Upload tile text.
- **Preview:**
  - 3 thumbnails, page 1 highlighted
  - sample quote text and amounts, blue table header
  - toolbar (zoom out, 100%, zoom in, download, print) and a Submit-only footer
- **Zoom:** 125% gives a page 1.25× wider, 75%, 50% minimum, 200% maximum.
- **Thumbnails and preview switching:**
  - clicking thumbnail 3 scrolls to page 3 and highlights it, then back to page 1
  - Download and Print toasts
  - the zip tile shows "Preview not available", no thumbnails, zoom disabled
  - the checkbox toggles the tick only
- **View and Upload:** both toasts.
- **Search:**
  - QR002201 → [QR002201]
  - 2208 → [QR002208]
  - SP12345 → [QR002204, QR002201]
  - harbour view → [QR002208, QR002212]
  - RESVU ESTATE → [QR002210, QR002206]
  - Roofline → [QR002208]
  - spark → [QR002210, QR002206]
  - topcover → [QR002208, QR002212]
  - the item format is checked
  - a title-only query and "zzz" both give "No matching Quote Requests"
- **Keyboard:**
  - first match highlighted while typing, arrows move the highlight and aria-activedescendant
  - Esc closes only the list, ArrowDown reopens it
  - Enter selects QR002210, the AI tag hides and focus goes to the selector
- **Selection:**
  - blur keeps the selection
  - × clears it and disables Submit and View
  - clicking the empty field opens all 6
  - picking QR002208 by mouse brings the AI tag back
- **Ticks:** unticking all disables Submit, and ticking the PDF enables it again.
- **Focus trap:** both wrap directions.
- **Submit with only the PDF ticked:**
  - the modal closes and the lock is released, toast 'Quote linked to QR002208'
  - row 12 chip 'QR QR002208 · Quote' and no flag, also checked with the panel closed
  - Action needed 7→6
  - Linked records 'QR QR002208 · Quote' / 'Linked by Jane Thornton - 18/11/2026 h:mm'
  - link data QR/Quote/Received with docs `["Roofline_Quote_311.pdf"]`, pending, recommended and dismissed null
  - bold outcome 'Quote linked to QR002208', focus back in the panel
- **Reopen on email 12 via ▾:**
  - the field is empty with no AI tag
  - QR002208 is disabled with 'Already linked', clicking it does nothing, and ArrowDown skips it
  - Esc, Esc closes the modal
- **Close without changes:**
  - Esc closes with no changes and focus returns to ✦ Link to QR
  - reopening starts fresh
  - × closes with no changes
  - a backdrop click does not close
- **Email 5 via ▾:**
  - empty field, no AI tag, Submit and View disabled
  - security_door.jpg image tile and a 1-page image preview
  - "abc" + Enter selects QR002204, and Submit links it with docs [security_door.jpg]
- **Email 11 via ＋ Add link:** QR002210 is disabled 'Already linked', and the Spark Q-8812 sample is shown.
- **Replace on email 3 (SR0001):**
  - the confirm text appears first and the modal does not open
  - Cancel: no modal
  - Confirm opens the modal; submitting QR002206 sets SR0001 to Cancelled (registry too), links QR002206 and clears the flag
  - email 1 WO619624 replace still shows 'Change not possible' and no modal
- **Link to WO (email 8):** the old pop-up opens unchanged and its submit is unchanged.
- **Widths 390, 700 and 1440:**
  - no page-level horizontal scroll with the modal open or after closing it
  - the modal content stays inside the viewport
  - the tile strip uses overflow-x auto and nowrap
  - at 390 and 700 the modal fills the viewport exactly and the thumbnail column is hidden
  - at 1440 it is 1000px wide and 90vh high with thumbnails shown
  - at 390 the dropdown fits the viewport
- **Errors:** none.

## Test expectations changed (old link-qr pop-up only; none removed or skipped)

- **cr04.js** `email12`: "✦ Link to QR opens Link to Quote Request", which checked `#dialogTitle` = 'Link to Quote Request', becomes "✦ Link to QR opens the Link to QR modal". It now checks that `#lqrShade` is shown, `#lqrTitle` = 'Link to QR' and #shade is not visible, and it closes with Esc instead of the dialog ×.
- **cr05.js** `linkQR-12`: the step now submits with `#lqrSubmit` and waits for `#lqrShade` to be hidden, instead of `#dialogFoot .btn.primary` and #shade. The assertion itself is unchanged and passes: 'Quote linked to QR002208', bold, Linked by Jane Thornton.
- **qa13.js** `extra`: "email 12 ✦ main button opens Link to Quote Request dialog" now checks the Link to QR modal and closes with Esc.
- **qa13.js** `keyboard`: "Enter on ✦ main button runs recommended action" now checks the Link to QR modal and closes with Esc.
- **Not changed:**
  - qa13 QA5 (Replace with… → Link to Quote Request on email 1 shows the blocked dialog) still passes as it was.
  - The ▾ menu label tests ('Link to Quote Request') still pass, because the ACTIONS and SHORT labels are untouched.

## Screenshots (all viewed), in `.agents/tasks/link-qr-modal/shots/`

- **`modal-1440-email12-default.png`:**
  - centred 1000px modal over the panel, grey header 'Link to QR' with ×
  - 'Quote Request *' with the purple '✦ Suggested by AI' tag
  - selector "QR002208 Roof membrane repair" over "HARBOUR VIEW SP4852 · 18 Harbour View Par…" with ×, then the blue 'View Quote Request' pill
  - grey strip with the PDF tile (dark 'Quote' tag, ticked, blue border), the photos.zip tile (generic file icon, ticked) and the dashed Upload tile at the right
  - viewer with 3 mini pages (page 1 blue), the dark toolbar showing 100%, and the Roofline Quotation Q-311 page with the blue table header
  - Submit only, at bottom right
- **`dropdown-supplier-search-1440.png`:** "topcover" typed. The list shows QR002208 (highlighted) and QR002212, each with bold id + title and "HARBOUR VIEW SP4852 · Roofline Contractors, TopCover Roofing" / "· TopCover Roofing, Facilities Support". The list overlays the tile strip. The Upload toast is visible at the bottom.
- **`modal-390.png` and `modal-390-scrolled.png`:**
  - full-screen sheet, field full width with the AI tag, View button below it
  - tiles and the Upload tile in a horizontally scrolling strip (Upload partly cut off at the edge, as the strip scrolls)
  - no thumbnail column
  - the page at 100% scrolls inside the pane
  - Submit at the bottom
- **`modal-700.png`:** full-screen sheet with the address shown in full, the Upload tile at the right, no thumbnails, and the whole quote page visible at 100%.
- **`dropdown-390.png`:** the dropdown at 390px with "facil" typed. It fits the viewport.
- **`after-submit-email12-1440.png`:**
  - panel: 'Quote linked to QR002208' in bold, Actions ▾ only, 1 linked record, no Action needed badge
  - Linked records: 'QR QR002208 · Quote', Received, 'Linked by Jane Thornton - 18/11/2026 9:17 AM'
  - list: the Action needed tab shows 6 and row 12 has no flag
  - toast 'Quote linked to QR002208'
- **`after-submit-row12-1440.png`:** row 12 with the panel closed. The Linked records column shows the chip 'QR QR002208 · Quote', and there is no Action needed tag.

## Not verified / notes

- **Browsers and accessibility:** only desktop Chrome was tested. Screen readers and axe were not run. Touch scrolling on a real phone was not tested.
- **390px page width:** at 390px the 100% quote page (560px) is wider than the pane and scrolls inside the pane. This is not page-level scroll. There is no automatic fit-to-width.
- **Email 12 AI text:** the pending text still says "No matching Quote Request found … choose the contractor", and the why text says "no Quote Request number was found in the subject". This AI text is outside the Link to QR scope, so I left it unchanged. It now sits slightly at odds with the AI-suggested QR and with the removed 'Quote is from' field. The user may want to reword it.
- **Linked QR status:** after a QR is linked, its sample entry in `LQR_QRS` still says 'Awaiting quote'. Status is not shown in the dropdown.
