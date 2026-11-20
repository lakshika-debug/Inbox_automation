# CR02 final report

- **Commit:** `6c7dc3f3b655932cf08d0400133a6ae19a58f8b4` on `main`. Not pushed.
- **Message:** `feat(inbox): CR02 – Action needed flag, record chips in list, Dismiss/Flag again; remove Done/No action, Mark as Other and Undo toast; AI Automation labels per PRD v3`
- **Files committed:** `index.html` only (83 insertions, 60 deletions; baseline `6c5b96a`). `Instruction/` and `.agents/` stay untracked.
- **Review verdict:** APPROVED (`review.json`), with 2 non-blocking findings (see "Open notes").

## Summary of changes (index.html)
| Area | Change |
|---|---|
| Flag (§2) | `statusOf`, `ibBadge`, `badge(st)` and the `.ib-st-done`/`.ib-st-none` CSS are removed. `isFlagged(e) = !!e.pending && !e.dismissed` drives the row, header, footer hint, ✦ recommendation, details editability and tab filter. |
| List chips (§3) | `ibChips()` shows the first visible link as a chip, plus a `+n` button that opens the panel at Linked records. Chip CSS widened to `#rows`. Row keydown ignores events from child elements. The SR role reads "Service Request". |
| Tab (§4) | The `#statusFilter` dropdown is replaced by an "Action needed (n)" tab (`#ibTabFlag`). An email acted on from that tab stays listed until its panel closes. |
| Panel (§5) | AI line shows `Change \| Dismiss` while flagged. After Dismiss: "Dismissed by [user] · [date] · Flag again". The pending reason and editable details apply only while flagged. |
| Menu (§6) | Mark as Other removed. Dismiss is the last item below a divider, on flagged emails only. |
| Dismiss / Flag again (§7) | `dismissEmail`, `doDismiss` and `flagAgain` added. Dismiss with an Open SR asks for confirmation and cancels the SR; links stay. Create, link and remove-all clear `dismissed`. |
| Seed (§8) | Email 9 loses `other:true` and gets new AI/why text. |
| Undo (§9) | `snapshot`, `prevState`, the Undo button and its CSS are removed. Toasts hide after 3.5 s. |
| Settings (§10) | Labels: "AI Automation", "Service request creation" (new description), "Link to Quote", "Link to Invoice". Ids unchanged; all ticked. |

Not touched: list layout, panel section order, SR register, WO iframe module, sidebar Email Integration dialog.

## Decisions D1–D6
| # | Decision | How it was applied |
|---|---|---|
| D1 | Flag again reopens the SR that Dismiss cancelled | `doDismiss` stores `sr` in `e.dismissed`. `flagAgain` sets that SR back to Open on the link and in `srRegistry`, only if it is still Cancelled. Verified on email 3: Create QR afterwards gives `QR002217 · from SR0001`, no SR0005. |
| D2 | Row chip for a cancelled SR | Kept unchanged (`SR SR0001 · Service Request`). The panel shows the Cancelled badge. |
| D3 | SR register / details for a Cancelled SR | Left unchanged. Noted for the PRD below. |
| D4 | `other:false` on 11 seeds | Left in place (`grep -c` = 11). Nothing reads it. |
| D5 | Settings label renames | Applied as cr02 §10 says. |
| D6 | Row keydown guard (M3) and chip CSS (M1, M2) | Applied. |

## cr02 §11 checklist (Playwright, Chrome, 150/150 checks passed; 0 page/console errors)
| # | Check | Result |
|---|---|---|
| Table | All 12 rows: line 2 and panel button match §11 | PASS (12/12) |
| 1 | No Done / No action / Mark as Other anywhere; `#statusFilter` gone | PASS |
| 2 | Tab reads "Action needed 6", lists [12,3,4,5,8,10] | PASS |
| 3 | Row chip opens the record, not the panel; `+n` (click/Enter/Space) opens the panel at Linked records; row Enter/Space still opens the panel | PASS |
| 4 | Email 5 Dismiss: no dialog, toast "Email dismissed" without Undo, flag cleared, dismissed line shown, count 5, toast gone by 3.9 s | PASS |
| 5 | Flag again: toast, flag back, count 6, reason restored, details editable | PASS |
| 6 | Email 3 Dismiss: confirmation, Cancel keeps SR0001 Open; confirm cancels SR0001 (link, registry, SR details) | PASS |
| 7 | Email 10 Dismiss: no confirmation, WO chip stays | PASS |
| 8 | Email 11 shows only Change; dismissed emails have read-only details and no ✦/Dismiss | PASS |
| 9 | Email 3 Create QR: `QR QR002217 · from SR0001`, count 6 → 5, no Undo | PASS |
| 10 | Dismissed email 5 → Link to WO clears dismissal; removing all links re-flags | PASS |
| 11 | Settings labels renamed, ticked, one row | PASS |

## Regression and responsive
- **Regression (all PASS):** pager (1–10 of 12, month groups, Enter on Next, 25 per page, reset on tab change); Unread tab; search by sender, subject, WO and SR id; sort oldest first; Mark all as read; SR register and View SR; sidebar Email Integration dialog; Settings Microsoft/Google connect, Disconnect, folder multiselect; Work Orders, Future & Recurring, Calendar navigation and back to Inbox.
- **Responsive (all PASS):** no horizontal scroll at 390, 700 and 1440 px on the list, panel, dismissed panel and Settings. All three tabs fit. At ≤700 px the chip wraps under the subject; at 1440 px subject, chip and flag stay on one line. The toast sits above the panel footer on narrow widths and left of the panel at 1440 px.
- **Syntax:** `node --check` passed on all 3 inline scripts.

## Grep outputs (`greps.txt`)
| Grep | Output |
|---|---|
| `'Done'\|No action'\|statusOf\|Mark as Other\|undoBtn\|prevState` | none |
| `statusOf\|ibBadge\|badge(st` | none |
| `statusFilter\|snapshot(\|ib-st-done\|ib-st-none\|#toast button\|other:true\|'other'\|Undo` | 2 hits, both the `.badge.other` colour class (lines 300, 438). Expected. |
| `grep -c "other:false"` | 11 |
| `No action needed` | 1 (line 335, footer hint) |
| `L('SR'` | 4 (lines 272, 275, 375, 420), all `'Service Request'` |
| `,true)` | none |
| `Dismiss\|dismissed\|flagAgain` | new code only (lines 59, 61, 288–289, 328–329, 348, 376, 378–390, 395, 425, 443) |

## Screenshots (`.agents/tasks/cr02/shots/`)
`list-all-1440.png`, `list-all-700.png`, `list-all-390.png`, `list-actionneeded-1440.png`, `list-actionneeded-390.png`, `email3-dismissed-1440.png`, `email3-dismissed-390.png`, `email5-dismissed-1440.png`, `email5-dismissed-390.png`, `settings-1440.png`, `settings-390.png`.

## Not verified
- Screen readers and axe were not run. The nested-interactive issue (chip or `+n` inside a `role=button` row) is known and accepted as out of scope.
- Only desktop Chrome was tested.
- The double-SR path (review finding 1) has no automated check.

## Open notes for the PRD
- **D3:** the SR register still labels a Cancelled SR "Active", and SR details for a Cancelled SR still offer Archive and Reject. Unchanged by design.
- **PRD-vs-prototype layout (cr02 §1):**
  - PRD §6 specifies columns Sender · Subject · Received Date · Linked Record · Action, an eye icon and a row action button. The prototype is an email-client list (sender name and address, subject line with chip and attachments, date); a row click opens the panel and actions live in the panel footer.
  - PRD §7 panel order is AI result → Linked records → AI-filled details → Original email. The prototype uses AI result → Email thread → Linked records → AI-filled details.
  - Not in the PRD: All emails / Unread tabs, Mark all as read, month group headers, pager with entries per page.
- **Review finding 1 (needs a product decision):** if a dismissed email with a cancelled SR gets Create QR/WO without Flag again, a second SR is created (`QR002217 · from SR0005 +1`). Options: reopen the cancelled SR from `dismissed.sr` whenever an action clears the dismissal, or record this as intended.
- **Review finding 2:** a dismissed email 3 still shows the AI line "Recommended next step: Create Quote Request". This matches cr02 §7 as written. A dismissed variant of the copy could come in a later CR.
