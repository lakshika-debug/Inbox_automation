# CR02 verification

Iteration 1. `review.json` did not exist, so CR02 was implemented from scratch.

- Baseline: `6c5b96a`.
- File changed: `index.html` only (83 insertions, 60 deletions). Nothing is committed yet.
- Inputs: `Instruction/cr02.md` steps 2–10 and `plan.md` items 1–6, with corrections M1–M5 and decisions D1–D6 applied.

## What changed in index.html

| Area | Change |
|---|---|
| Flag helpers (§2) | Removed `statusOf`, `ibBadge` and `badge(st)`. Added `isFlagged` and `ibFlag`. Removed the `.ib-st-done` and `.ib-st-none` CSS. |
| List row (§3) | Added `ibChips()`, which shows the first visible link as a chip followed by a `+n` button. Updated the row aria-label. Changed the row onkeydown to `if(event.target===this)psKey(…)` (M3). Added CSS for `.ib-chips` and `.ib-more`, plus the ≤700 px `flex-wrap`. Extended the chip CSS from `#panel` to `#rows` (M1). |
| SR role (§3a) | All four `L('SR',…)` calls now use `'Service Request'`. |
| Tab (§4) | Removed `#statusFilter` and its listener. Added the `#ibTabFlag` tab with its `#ibCntFlag` count, the `inTab()` filter, and the `ibKeep` rule for the Action needed tab in `openPanel`. Updated the comment. |
| Panel (§5) | Uses `fl` and `canEdit`. The pending reason shows only while flagged. The AI line reads `Change \| Dismiss`, and the dismissed line is shown after the `.ai` box. The header badge, footer hint and `actionCell` recommendation all check `isFlagged`. Added `.ai-sep` and `.dismissed` CSS (margin `0 0 14px`), and the `#panel .dismissed .change` link style (M2). |
| Menu (§6) | Removed `'other'` from `ACTIONS` and the filter line. "✦ Recommended" is gated on `isFlagged`. On flagged emails in add mode, the menu ends with `<hr>` + Dismiss. |
| Dismiss (§7, D1) | Removed the `other` code from `runAction` and `doAction`. Added `dismissEmail`, `doDismiss` and `flagAgain`. `doDismiss` stores `sr: sr ? sr.id : null`. If that SR is Cancelled, `flagAgain` sets the link and `srRegistry` back to `Open`. `dismissed:null` replaces `other:false` in `create-sr`, `submitCreate`, `submitLink` and `doRemove`. |
| Seed (§8) | Email 9: removed `other:true` and applied the new `ai`/`why` text. The other 11 seeds keep `other:false` (D4). |
| Undo (§9) | Removed `snapshot`, its 4 calls and `prevState`. Replaced `toast(msg)` (3.5 s timeout). Removed `,true` from the 4 remaining calls (M5). Deleted the `#toast button` CSS and dropped "Undo toast" from the CSS comment (M4). |
| Settings (§10, D5) | Labels now read "AI Automation", "Service request creation" (new description), "Link to Quote" and "Link to Invoice". The ids are unchanged. |

Out of scope, so not touched: the list layout, panel section order, SR register, WO iframe module (`woModuleEncoded`), the sidebar Email Integration dialog, and SR register/details for Cancelled SRs (D3).

## Syntax

The 3 inline scripts were extracted, excluding `type="text/plain"`, and `node --check` passed on all 3 (`/tmp/cr02-verify/s0.js`–`s2.js`).

## Greps (plan section e): actual output

Full output is in `greps.txt`.

| Command | Actual |
|---|---|
| `grep -n "'Done'\|No action'\|statusOf\|Mark as Other\|undoBtn\|prevState"` | No output (exit 1), as M6 predicted |
| `grep -n "statusOf\|ibBadge\|badge(st"` | No output |
| `grep -n "statusFilter\|snapshot(\|ib-st-done\|ib-st-none\|#toast button\|other:true\|'other'\|Undo"` | 2 hits, both the `.badge.other` colour class: line 300 `linkBadge` and line 438 `renderLinkResults`. This is expected. |
| `grep -c "other:false"` | 11 |
| `grep -n "No action needed"` | 1 hit, line 335 (footer hint) |
| `grep -n "L('SR'"` | 4 hits, lines 272, 275, 375 and 420, all with `'Service Request'` |
| `grep -n ",true)"` | No output |
| `grep -n "Dismiss\|dismissed\|flagAgain"` | New code only: CSS (lines 59 and 61), `isFlagged` (lines 288–289), `panelMarkup` (lines 328–329), `openActionMenu` (line 348), `create-sr` `dismissed:null` (line 376), `dismissEmail`/`doDismiss`/`flagAgain` (lines 378–390, including the D1 lines), `doRemove` (line 395), and `submitCreate`/`submitLink` (lines 425 and 443) |

## Playwright

- Script: `cr02.js` (copy of `/tmp/cr02-verify/cr02.js`). It uses Chrome (`channel:'chrome'`) against http://127.0.0.1:3000/, the already-running server.
- Every scenario starts with `about:blank` and then a fresh load.
- Log: `run.log`. Raw results: `/tmp/cr02-verify/results.json`.
- **Result: 150/150 passed.** There were 0 page errors, 0 console errors and 0 HTTP ≥400 responses (favicon excluded).

Two harness runs were needed before the final one; the cause was test bugs, not app bugs. In the first runs, a same-URL `goto` with a hash did not reload the page, so state leaked between scenarios. There were also three matcher problems: the dialog text started with the `!` icon, the menu text had a space before "✦", and the `+n` scroll check did not allow for the bottom of a short panel. No change to `index.html` came out of those runs.

### cr02 §11 checks

| # | Check | Result |
|---|---|---|
| Table | All 12 rows: line 2 and the panel button match cr02 §11 exactly (e.g. 3 = `SR SR0001 · Service Request + Action needed` / `✦Create QR`; 9 = empty / `Actions ▾`) | PASS (12/12) |
| 1 | No Done or No action text in the list or in any of the 12 panels. `#statusFilter` is gone. No "Mark as Other" in the menu. The grep returns nothing. | PASS |
| 2 | The tab reads "Action needed 6" and lists [12,3,4,5,8,10]. `aria-selected` is set correctly. | PASS |
| 3 | Clicking the row chip QR002210 opens the record dialog, not the panel. Enter on the chip does the same. Clicking the SR chip opens SR details. Email 10 after Create WO shows `WO WO620041 · from SR0005 + +1`. Clicking `+1`, Enter on `+1` and Space on `+1` each open the panel scrolled to `#linksBox`. Enter and Space on the row itself still open the panel. | PASS |
| 4 | Email 5: the AI line is `Change \| Dismiss`. Dismiss shows no dialog. The toast reads "Email dismissed" with no `#toast button`. The flag is gone from the row and the header. The line reads "Dismissed by Jane Thornton · 18/11/2026 · Flag again". The count is 5. The toast is visible at 3.0 s and gone by 3.9 s. | PASS |
| 5 | Flag again: the toast reads "Email flagged again". The flag returns in the row and header, the count is 6, the original reason text is restored, and the details are editable again. | PASS |
| 6 | Email 3: Dismiss from the AI line shows the confirmation "SR0001 will be cancelled: no action needed. This email will no longer be flagged." Cancel leaves SR0001 Open. In the ▾ menu, Dismiss is the last item below an `<hr>`, and ✦ sits only on Create Quote Request. Confirming: the toast reads "SR0001 cancelled. Email dismissed", Linked records shows SR0001 as Cancelled, `srRegistry` says Cancelled, the flag clears and the count is 5. SR details opened from the chip show Status Cancelled. | PASS |
| 7 | Email 10: Dismiss shows no confirmation and clears the flag. `WO WO615003 · Invoice` stays in the row and in Linked records. | PASS |
| 8 (M7/M8) | Email 11: the AI line shows only Change. Neither the ▾ menu nor the Add link menu has Dismiss or ✦. Dismissed email 5 and email 6: the AI-filled details are read-only (0 inputs). Dismissed email 12: the footer shows `Actions ▾` / "No action needed", and neither the ▾ menu nor the Change menu has ✦ or Dismiss. Flagged email 5 has editable details (V13). | PASS |
| 9 | Email 3 Create QR → submit: the row shows `QR QR002217 · from SR0001` with no flag, the count goes 6 → 5, and the toast reads "QR002217 submitted" with no Undo. | PASS |
| 10 | Dismiss email 5 → Link to WO: the dismissed line is gone, `dismissed===null`, the row shows `WO WO615003 · Invoice`, and the toast has no Undo. Extra check: removing the last link on dismissed email 10 clears the dismissal and re-flags the email. | PASS |
| 11 | Settings › Email Integration after connecting Microsoft: "AI Automation", "Service request creation" (new description), "Link to Quote", "Link to Invoice". All three stay ticked and sit on one row. | PASS |

### D1 (email 3)

| Check | Result |
|---|---|
| Dismiss → SR0001 Cancelled (link and registry) | PASS |
| Flag again → SR0001 Open in Linked records and in `srRegistry` | PASS |
| SR details show Status Open, and the Create Quote Request/Work Order buttons are back | PASS |
| Flag, reason "Create a Quote Request or Work Order from SR0001" and `✦Create QR` restored; count 6 | PASS |
| The Create QR form shows "From Service Request SR0001". Submit gives `QR QR002217 · from SR0001` | PASS |
| No SR0005 exists in `srRegistry` or in any email's links. SR0001 is Converted and the count is 5 | PASS |

### Other checks

- **Action needed tab (ibKeep):** email 5 opened from the tab and dismissed stays listed while its panel is open. After the panel closes, the list is [12,3,4,8,10]. PASS.
- **D2:** the row chip for the cancelled SR0001 is unchanged (`SR SR0001 · Service Request`). PASS.
- **Seed 9:** the new AI and why text is shown. There is no flag. The footer reads "No action needed" with `Actions ▾`. Change opens the 5-item menu, with no Dismiss or Other. PASS.
- **M1:** the row chip has a 1 px border, the QR tag is purple `rgb(123,79,216)` with white text, and the link has no underline. PASS.
- **M2:** Flag again is styled as a link (no border, `#0b7bff`, underlined). The dismissed line has exactly 14 px above (to `.ai`) and 14 px below (to `#threadBox`). PASS.
- **Row aria-label:** email 3 reads `…RESVU ESTATE. Action needed. Linked to SR0001. 29 Oct · 10:36 AM`, and email 9 has no status text. PASS.

### Regression (plan d3), all PASS

- **Pager:**
  - Page 1 reads "Showing 1 to 10 of 12", with month groups "October 2026 · 7" and "September 2026 · 5".
  - Enter on Next goes to page 2 and keeps focus in the pager.
  - 25 per page shows a single page.
  - A tab change resets to page 1.
- **Unread tab:** shows 4 emails. An opened email stays listed until its panel closes.
- **Search:** sender (Roofline → [12]), subject (switchboard → [11]), WO615003 → [8,10], and SR0001 → [3].
- **Sort:** oldest first puts email 10 at the top.
- **Mark all as read:** the pill reads "0 unread", the count is 0 and the button is disabled.
- **SR register:** opens with 2 cards, and View SR opens SR0001 details.
- **Sidebar Email Integration dialog:** opens.
- **Settings:**
  - The sign-in buttons show first.
  - Microsoft connect works and Disconnect returns to the sign-in buttons.
  - Google connect shows "Google Connected Account :" with developer@i4tglobal.com.
  - In the folders multiselect, unchecking Archive leaves the chips Inbox and Sent Items.
- **Navigation:** Work Orders All (`#work-orders`, iframe `switchPage` ready), Future & Recurring and Calendar all load, and going back to Inbox shows 10 rows.

### Responsive (plan d4), all PASS

- **390 px:**
  - No horizontal scroll: with the list shown, with the panel open, with the dismissed panel, and on Settings.
  - All three tabs fit.
  - `.ib-l2` wraps, so email 3's chip sits below its subject.
  - The toast sits above the panel footer.
- **700 px:**
  - No horizontal scroll, and the tabs fit.
  - `.ib-l2` is `wrap`, and email 3's chip wraps below the subject.
  - The toast sits above the panel footer.
- **1440 px:**
  - No horizontal scroll.
  - Email 3's subject, chip and flag sit on one line (`nowrap`).
  - The toast is offset to the left of the panel.

### Screenshots (plan d5), all viewed

All files are in `shots/`:

- **`list-all-1440.png`:** chips, flags and the three tabs are visible, and row chips are styled. It shows "0 unread" because the table check opened every email first.
- **`list-actionneeded-1440.png`** and **`list-actionneeded-390.png`**: the Action needed tab.
- **`list-all-390.png`:** chips and the flag wrap under the subject, and there is no overflow.
- **`list-all-700.png`:** email 3's chip and flag wrap below the long subject.
- **`email3-dismissed-1440.png`:** the dismissed line with the Flag again link, a 14 px gap, Linked records showing SR0001 as Cancelled, the footer reading "No action needed" with Actions ▾, and the toast "SR0001 cancelled. Email dismissed" left of the panel.
- **`email3-dismissed-390.png`**
- **`email5-dismissed-390.png`:** the dismissed line, read-only details, and the toast above the footer.
- **`email5-dismissed-1440.png`**
- **`settings-1440.png`:** the "AI Automation" labels on one row, with folder chips Inbox and Sent Items.
- **`settings-390.png`**

## Not verified or out of scope

- Real screen readers and axe were not run. The nested-interactive issue (a chip or `+n` inside a `role=button` row) is known; the plan accepts it as out of scope.
- **D3, for the PRD:** the SR register still labels a Cancelled SR "Active", and SR details for a Cancelled SR still offer Archive and Reject. Both are unchanged by design.
- Browsers other than desktop Chrome were not tested.
