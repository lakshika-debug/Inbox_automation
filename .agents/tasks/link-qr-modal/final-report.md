# Link to QR modal: final report

**Commit:** `d4e3cb2` on `main` (parent b881c84), not pushed.
Message: `feat(inbox): Link to QR modal – AI-suggested Quote Request, search, attachment selection, document preview, Submit`
Only `index.html` was committed (245+/11−). Before committing, its mtime was `1795405589`, the same value recorded in verification.md, so no one else had edited it. `.agents/` was not staged.

Review: **APPROVED**, iteration 1, no blocking findings (review.md / review.json).

## Changes (index.html)
- **Wiring:** `doAction` sends `link-qr` to the new `openLinkQR` and `link-wo` to `linkForm` as before. The modal opens from all four entry points: ✦ Link to QR, ▾ → Link to Quote Request, ＋ Add link, and ⋯ → Replace with…. The block and confirm rules for replace still run first, unchanged.
- **Removed:** `QR_OPTIONS` and the `isQR` branches in `linkForm`, `renderLinkResults` and `submitLink`, including the 'Quote is from' select. The Link to WO pop-up is byte-identical to b881c84; `wocompare.js` returned `true` ×4.
- **Markup:** `#lqrShade` container before `#toast`.
- **CSS (`lqr-` prefix):**
  - 1000px modal, 90vh high, grey header and footer
  - Quote Request field with a red `*`, a selector card, and a blue "View Quote Request" pill
  - horizontally scrolling tile strip with checkboxes, a 'Quote' tag and a dashed Upload tile
  - viewer with a thumbnail column, a dark floating toolbar and white pages
  - Submit is the only footer button
  - at ≤700px the modal is a full-screen sheet with no thumbnails
  - body scroll is locked while the modal is open
- **JS:**
  - `openLinkQR`, `lqrClose`, `lqrField`, `lqrList`, `lqrKey`, `lqrPick`, `lqrEdit`, `lqrClear`, `lqrBlur`, `lqrTiles`, `lqrTick`, `lqrPrev`, `lqrViewer`, `lqrPdfPages`, `lqrZoom`, `lqrGo`, `lqrOnScroll`, `lqrFileToast`, `lqrViewQR`, `lqrSubmit`
  - one capture-phase window keydown listener
- **Submit:**
  - `dropOld` for replace
  - `L('QR',id,'Quote','Received',ME+' · '+nowStamp(),docs)`, where docs are the ticked files
  - pending, recommended and dismissed set to null
  - `refresh()`, close, and the toast 'Quote linked to {id}'
  - the inbox row shows the chip 'QR {id} · Quote'

## Sample QR data added (`LQR_QRS`, all 'Awaiting quote')
| ID | Title | Property / plan | Invited suppliers |
|---|---|---|---|
| QR002208 | Roof membrane repair | HARBOUR VIEW SP4852 | Roofline Contractors, TopCover Roofing |
| QR002212 | Roof leak inspection – Level 6 | HARBOUR VIEW SP4852 | TopCover Roofing, Facilities Support |
| QR002210 | Switchboard upgrade | RESVU – ESTATE | Spark Electrical, Facilities Support |
| QR002206 | Intercom repair – main entrance | RESVU – ESTATE | Spark Electrical |
| QR002204 | Hot water system replacement – Lot 4 | SP12345 | ABC Plumbing |
| QR002201 | Gutter clean | SP12345 | ABC Plumbing, Facilities Support |

- **AI suggestion:** `LQR_AI={12:'QR002208'}`.
- **Sample documents (`LQR_DOCS`):**
  - `Roofline_Quote_311.pdf`: Q-311, total $4,950.00 incl. GST
  - `Quote_Q-8812.pdf`: Spark Electrical, for email 11
  - any other PDF gets a generic quote built from the email
  - each PDF has 3 pages

## Decisions
**Data and suggestion**
- Existing IDs are kept. QR002210 stays 'Awaiting quote' so that email 11 shows 'Already linked'.
- The AI suggestion is skipped when that QR is already linked to the email.
- Search uses the QR number, the property / plan name and the supplier names, not the title. It ignores case and punctuation.
- 'Suggested by AI' shows only while the AI-picked QR is selected.

**Quote Request field**
- Clicking the selector card switches to search. Blur restores the selected card, and × clears the selection.
- The list opens on click, typing or ArrowDown. Typing highlights the first match, and the arrow keys wrap and skip 'Already linked' items.

**Keyboard and focus**
- The first Esc closes the list and the next Esc closes the modal; the side panel stays open. A backdrop click does not close the modal.
- Focus is trapped inside the modal. On close, focus returns to the opener, or to ▾/Actions, then to the panel ×.

**Attachments and preview**
- The preview starts on the first PDF. Clicking a tile changes only the preview, and the checkbox changes only the tick.
- An email with no attachments shows "No attachments" and Submit stays disabled.
- Images have a 1-page preview. Zip files show "Preview not available".
- Zoom goes from 50% to 200% in 25% steps. Clicking a thumbnail scrolls to its page, and scrolling the pane updates the highlighted thumbnail.

**Toasts:** View, Upload, Download and Print show prototype toasts. Submit shows 'Quote linked to {id}'; the old pop-up said 'Linked to {id}'.

## Changed test expectations (old link-qr pop-up only; none removed or skipped)
- **cr04 `email12`:** checks that the `#lqrShade` modal opens titled 'Link to QR' and closes with Esc.
- **cr05 `linkQR-12`:** submits through `#lqrSubmit` and waits for `#lqrShade` to hide. The assertion is unchanged.
- **qa13 `extra` and `keyboard`:** check the Link to QR modal and close it with Esc.

## Verification
**Syntax:** `node --check` passed on all 3 inline scripts (coder and reviewer).

**Suites:** Chrome against http://127.0.0.1:3000/.

| Suite | Baseline b881c84 | Coder | Reviewer |
|---|---|---|---|
| linkqr (new) | – | 101/101 | 101/101 |
| aidetails | 71/71 | 71/71 | 71/71 |
| cr02 | 138/138 | 138/138 | 138/138 |
| cr03 | 188/188 | 188/188 | 188/188 |
| cr03dup | 57/57 | 57/57 | 57/57 |
| cr04 | 91/91 | 91/91 | 91/91 |
| cr05 | 247/248 | 247/248 | 247/248 |
| cr05fix | 153/153 | 153/153 | 153/153 |
| qa13 | 39/39 | 39/39 | 39/39 |

- The cr05 failure ("Download All at the right") also fails on b881c84. It comes from an earlier approved layout change and is not caused by this change.
- **Reviewer's own browser checks:** 43/44 passed. The 1 failure was an error in the reviewer's own test: Replace on email 11's Quote link is disabled by the existing same-role rule, so it is not a finding.
- **Errors:** no page errors or console errors.

## Screenshots
**Coder:** `.agents/tasks/link-qr-modal/shots/`
- `modal-1440-email12-default.png`
- `dropdown-supplier-search-1440.png`
- `modal-390.png`
- `modal-390-scrolled.png`
- `modal-700.png`
- `dropdown-390.png`
- `after-submit-email12-1440.png`
- `after-submit-row12-1440.png`

**Reviewer:** `/tmp/linkqr-review/shots/`
- `r-1440-default.png`
- `r-dropdown-supplier.png`
- `r-390.png`
- `r-after-submit.png`

## Not verified / notes
- **Browsers and accessibility:** only desktop Chrome was tested. Screen readers, axe and real-phone touch scrolling were not tested.
- **390px:** the 560px quote page scrolls inside the pane. There is no fit-to-width.
- **Email 12 AI text:** the pending and why text still says "No matching Quote Request … choose the contractor". This is outside the scope of this change, and the user may want to reword it.
- **Linked QR status:** `LQR_QRS` statuses stay 'Awaiting quote' after a link. Status is not shown in the dropdown.
