# Action needed flag, list record chips and Dismiss/Flag again for the Inbox (CR02)

The change replaces the Inbox's three email statuses (Action needed, Done, No action) with a single Action needed flag. The flag is derived from `e.pending` and suppressed by a new `e.dismissed` record. The first linked record now shows as a chip in each list row, with a `+n` button for the rest. The status dropdown becomes a third "Action needed" tab. Dismiss and Flag again are added in the AI line, in the ▾ menu and in the panel. Mark as Other and the Undo toast are removed, and the Settings › Email Integration labels are renamed. The diff touches only `index.html` and follows cr02.md, the plan's corrections M1–M5 and decisions D1–D6. Every spot-check in an independent Chrome run passed, with no page or console errors apart from the favicon 404.

Watch for: an email dismissed with an Open SR still allows Create QR/WO without Flag again. In that case a second SR is created next to the cancelled one (confirmed, non-blocking). The AI line on a dismissed email 3 still recommends Create Quote Request (confirmed, non-blocking, matches cr02 as written).

**Verdict**: APPROVED

## High-level view

The flag is computed by `isFlagged(e) = !!e.pending && !e.dismissed`, and every former `statusOf` consumer now reads it. Those consumers are the row, the panel header, the footer hint, the ✦ recommendation in the split button and the menu, the editability of the AI-filled details, and the tab filter. Dismiss keeps `pending` and `recommended`, so Flag again can restore them. Any create, link, or remove-all action clears `dismissed`.

Dismiss on an email with an Open SR asks for confirmation and then cancels the SR, both on the link and in `srRegistry`. Under D1, Flag again sets that SR back to Open. Create QR then converts SR0001 into `QR002217 · from SR0001` and no SR0005 is created. The path where the manager acts on the dismissed email without first choosing Flag again was not covered by D1. On that path the cancelled SR stays on the email and a new SR is created.

The list chips reuse the panel's `chip()`, with the CSS selectors widened to `#rows` (M1). The row keydown handler now ignores events from child elements (M3), so Enter on a chip opens the record and Enter/Space on `+n` opens the panel at Linked records. The Undo removal is complete: `snapshot`, `prevState`, the toast button and its CSS are all gone, and the toast hides after 3.5 s.

Scope is clean. `index.html` is the only modified tracked file. There are no hunks in the WO module, the SR register, the sidebar Email Integration dialog, the panel section order, or the Settings markup beyond the four label strings and the description.

<details>
<summary>Issues (2)</summary>

1. **Second SR after acting on a dismissed email (non-blocking)** — Dismissing email 3 cancels SR0001. If Create QR is then run without Flag again, SR0005 is created and SR0001 stays Cancelled on the same email, so the row reads `QR002217 · from SR0005 +1`. Either reopen the cancelled SR from `dismissed.sr` when any action clears the dismissal, or record this in the PRD as intended.
2. **Stale AI line on a dismissed email (non-blocking)** — After Dismiss, email 3's AI line still reads "Service Request SR0001 created. Recommended next step: Create Quote Request." while SR0001 is Cancelled and the footer says "No action needed". This matches cr02 §7, which does not change `ai`. Consider a dismissed variant of the copy in a later CR.

</details>

<details>
<summary>Details</summary>

### Dismiss, Flag again and the SR0001 lifecycle (D1)

`doDismiss` stores `{by, date, pending, recommended, sr}`. `flagAgain` reopens the SR only if it is still `Cancelled`, both on the link and in `srRegistry`, so it does not overwrite a status that something else changed in between. In the browser run, the sequence on email 3 was Dismiss from the ▾ menu, the confirmation, the toast "SR0001 cancelled. Email dismissed", and Linked records showing SR0001 Cancelled with the count at 5. Flag again then put SR0001 back to Open in both places, restored `✦ Create QR` and set the count to 6. Create QR showed "From Service Request SR0001" and produced `QR QR002217 · from SR0001`. No SR0005 was created and the count went to 5.

The gap is on the other route out of the dismissed state (confirmed in the browser):

```
Dismiss email 3          -> SR0001 Cancelled, link kept (cr02: "links stay")
Actions ▾ > Create QR    -> createForm finds no Open SR -> "A Service Request will be created in the background"
submit                   -> links: SR0001 Cancelled, SR0005 Converted, QR002217 from SR0005
row                      -> "QR QR002217 · from SR0005  +1"
```

`Create Service Request` stays disabled ("Already created") because `hasSR` counts the cancelled link. QR and WO creation still create an SR implicitly, so the email ends up with two SRs. That breaks the one-SR-per-email rule the menu enforces elsewhere. Before CR02, an email could not keep a Cancelled SR link (`doRemove` removes the link), so this state is new. It is non-blocking because cr02 §7 specifies the cancel-and-keep behaviour and D1 covers only Flag again. It does need a product decision.

The AI line has a related copy issue. `doDismiss` does not change `e.ai`, so dismissed email 3 still recommends Create Quote Request above a footer that says "No action needed".

### Row chips, `+n` and keyboard handling

The chip `<a>` and the `+n` `<button>` sit inside a `role=button` row. This is a nested-interactive accessibility issue, which the plan accepts as out of scope. The M3 guard handles only the behaviour. In the browser, Enter on the QR002210 chip opened the Quote Request dialog and not the panel. Enter and Space on `+1` opened the panel, and Enter on the row still opened it.

### Test evidence

The coder's `verification.md` reports `node --check` on the 3 inline scripts, every grep in plan section (e), and a 150-check Playwright suite with screenshots. That suite covers cr02 §11 checks 1–11 with the M7/M8 adjustments, D1 and D2, the regression set and the responsive checks. The independent spot-check confirmed the greps: the §11 check 1 grep returns nothing, `other:false` appears 11 times, `No action needed` appears once, there are no `,true)` toasts, and `'other'` appears only in the `.badge.other` colour class at lines 300 and 438. The Action needed tab count went 6 → 5 after dismissing email 5 and back to 6 after Flag again. An email dismissed from that tab stayed listed until its panel closed; after that the list was `[12,3,4,8,10]`. Email 11 showed only Change, with no Dismiss or ✦. The toast never rendered a button. The run also confirmed the flows above and found no horizontal scroll at 390, 700 or 1440 px on the list, the panel, the dismissed panel, the Action needed tab or Settings. The Settings labels read AI Automation, Service request creation (with the new description), Link to Quote and Link to Invoice, and the three checkbox ids are still checked.

Not tested: the double-SR path above has no automated check in the coder's suite. Screen readers and axe were not run, and no browser other than desktop Chrome was tested.

</details>

<details>
<summary>File map</summary>

`index.html`: chip CSS widened to `#rows`; `.ai-sep`, `.dismissed`, `.ib-chips` and `.ib-more` CSS added; `#toast button`, `.ib-st-done` and `.ib-st-none` CSS removed; status dropdown replaced by the `#ibTabFlag` tab; Settings AI labels renamed; SR role changed to "Service Request"; email 9 seed updated; `statusOf`, `ibBadge`, `badge`, `snapshot` and the `other` paths replaced by `isFlagged`, `ibFlag`, `ibChips`, `dismissEmail`, `doDismiss` and `flagAgain`; `renderRows`, `openPanel`, `panelMarkup`, `actionCell`, `openActionMenu` and `toast` updated.

Full diff: `git -C "/Users/arjuna/Documents/inbox automation/Inbox_automation" diff index.html`. Review harness: `/tmp/cr02-verify-review/review.js`.

</details>
