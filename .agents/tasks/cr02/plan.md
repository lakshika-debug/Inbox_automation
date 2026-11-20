# CR02 implementation plan (validated against `index.html` @ 6c5b96a)

Read-only investigation. `index.html` is unchanged from `6c5b96a` (`git diff --stat 6c5b96a -- index.html` is empty). The server at http://127.0.0.1:3000/ answers 200.

## Summary

CR02 can be implemented as written, with five corrections and four decisions for the user.

Every function, variable and selector that cr02.md names exists. The line numbers are within ±2 of the real ones, and the counts are right: four `L('SR',…)` calls, four `snapshot(e)` calls and five `toast(…,true)` calls. The problems are in what cr02 leaves out:

1. **The list chips would render unstyled.** All chip CSS is scoped to `#panel` (`#panel .rec`, `#panel .rt`, `#panel .rt-WO|QR|SR`, `#panel .rec .rrole`, lines 40–44). `ibChips()` puts `chip()` output into `#rows`, so the type tag would show as plain text. The selectors must be extended to `#rows`.
2. **The "Flag again" button would render as a browser default button.** The `.change` link style is `#panel .ai .change` (line 59), and cr02 places `${dis}` *after* the `.ai` box. The `.dismissed` block would also sit directly on top of the Email thread section with no gap.
3. **Keyboard use of the row chip and the `+n` button is broken.** The row has `onkeydown="psKey(event,()=>openPanel(id))"` (line 465), and `psKey` (line 492) calls `preventDefault()`. Enter on a chip or Enter/Space on `+n` bubbles up to the row, so it opens the panel without `'links'` and never runs the chip or button.
4. **There is no `#undoBtn` CSS.** The Undo style is `#toast button{…}` (line 84), and the comment on line 39 says "Undo toast". Delete or reword those.
5. **QA check 8 cannot run as written.** Email 11 has no `fields`, so its panel has no AI-filled details section to be read-only.

The QA grep in §11 check 1 has **no false positives**. Nothing outside the Inbox code matches it, and the base64 `woModuleEncoded` (line 575) has 0 raw matches. The decoded module (83 KB) has no matches either. The pattern `No action'` does not match `'No action needed'`, so after CR02 the grep returns **nothing at all**. cr02 expects one hit; there will be none.

---

## (a) Ordered implementation steps

The file is a single page script, so removing a helper before all its callers are gone throws a ReferenceError at render time. Items 1–4 must be finished together before the page is loaded. Each item lists real line numbers at 6c5b96a.

- [ ] 1. **Flag helpers and seed (cr02 §2, §8).**
      - Add `isFlagged` and `ibFlag` next to `statusOf` (line 284). Do not delete `statusOf` yet.
      - Email 9 seed (line 274): remove `other:true`. Set `ai:'No request, invoice or quote found in this email.'` and `why:'General correspondence. Nothing to do.'`.
      - Leave `other:false` on the other 11 seeds, as cr02 says (see decision D4).
      Files: index.html
      Verify: run `node --check` on the extracted scripts (see the verification plan, section d).

- [ ] 2. **List row: chips, flag, tab, filter (cr02 §3b–3d, §4).**
      - Add `ibChips(e)` after `chip()` (line 299).
      - In `rowHtml` (line 464): swap `${ibBadge(statusOf(e))}` for `${ibChips(e)}${ibFlag(e)}` (line 467) and replace the aria-label (line 465).
      - **Correction 3:** change the row's onkeydown to `if(event.target===this)psKey(event,()=>openPanel(${e.id}))` so that keys pressed on the chip or `+n` act on those elements.
      - HTML line 218: delete `<select id="statusFilter">…</select>`. Add `#ibTabFlag` after `#ibTabUnread`.
      - `renderRows()` (line 447):
        - line 448: drop `s=…statusFilter…`.
        - set `#ibCntFlag`.
        - line 453: add `['flag','#ibTabFlag']` to the forEach.
        - line 454: replace the filter with `inTab()`.
      - `openPanel()` (line 306): apply the cr02 §4c condition. Update the `ibKeep` comment on line 278.
      - Wiring (line 489): delete the `#statusFilter` listener.
      - CSS:
        - add `.ib-chips`, `.ib-more` and `@media(max-width:700px){.ib-l2{flex-wrap:wrap}}` after line 119.
        - **Correction 1:** extend lines 40–44 to `#panel .rec,#rows .rec`, `#panel .rec:hover,#rows .rec:hover`, `#panel .rt,#rows .rt`, `…rt-WO/QR/SR` and `#panel .rec .rrole,#rows .rec .rrole`.
      Files: index.html

- [ ] 3. **Side panel (cr02 §5).** In `panelMarkup` (line 310):
      - line 311: `fl`/`canEdit`.
      - line 313: `pend`.
      - line 319: `change` with `| Dismiss`, plus `dis`.
      - line 320: `${badge(st)}` becomes `${fl?'<span class="badge needs">Action needed</span>':''}`.
      - line 321: insert `${dis}` after the `.ai` box.
      - line 325: footer hint.

      In `actionCell` (line 300), add `rec=isFlagged(e)?e.recommended:null` and use `rec` in both places that read `e.recommended`.

      CSS (add near line 59): `.ai-sep` and `.dismissed`. **Correction 2:** add `#panel .dismissed .change` to the line 59 selector. Use `margin:0 0 14px` on `.dismissed` instead of cr02's `8px 0 0`. The `.ai` box has `margin-bottom:14px` and the next `.section` has no top margin, so cr02's value leaves no gap above the Email thread.
      Files: index.html

- [ ] 4. **Menu, Dismiss/Flag again, SR role, remove Other (cr02 §3a, §6, §7).**
      - Line 297 `ACTIONS`: drop `'other'`.
      - `openActionMenu` (line 329): delete line 332. Gate the tag on line 337 with `isFlagged(e)&&`. Append the `<hr>` + Dismiss item. `#menu hr` CSS already exists (line 53).
      - Delete line 359 (`runAction` 'other') and line 368 (`doAction` 'other').
      - Add `dismissEmail`, `doDismiss` and `flagAgain` after `dropOld` (line 369).
      - `other:false` becomes `dismissed:null` on lines 367, 403 and 421. In `doRemove`, line 373 becomes `if(!e.links.length)Object.assign(e,{dismissed:null,…})`.
      - `'Request'` becomes `'Service Request'` in the four `L('SR',…)` calls: lines 268, 271, 366 and 398.
      - Delete `statusOf` (line 284), `ibBadge` (line 291) and `badge(st)` (line 295), plus `.ib-st-done` and `.ib-st-none` on line 110.
      Files: index.html
      Verify (items 1–4 together): `node --check` passes. Load http://127.0.0.1:3000/#inbox with no console errors. `grep -n "statusOf\|ibBadge\|badge(st" index.html` returns nothing.

- [ ] 5. **Remove Undo (cr02 §9).**
      - Delete the four `snapshot(e);` calls (lines 365, 372, 396 and 419) and the `snapshot` function (line 430).
      - Remove `prevState=null` from line 280.
      - Replace `toast()` (lines 431–434) with cr02's version. It keeps the `.panelfoot` placement line unchanged and the 3.5 s timer.
      - Remove `,true` from the toast calls. **Four remain** after item 4 deletes line 368: lines 367, 374, 404 and 422.
      - Delete `#toast button{…}` (line 84). Reword the line 39 comment to drop "Undo toast". Keep `#toast.visible` and `#panel.visible~#toast`.
      Files: index.html
      Verify: run the §11 check 1 grep; it should return nothing. Run the Playwright suite (section d).

- [ ] 6. **Settings labels (cr02 §10).** Line 237: `#psAiH` text becomes `AI Automation`. Line 238: label `Service request creation`, and `#psAiSrD` becomes `…maintenance emails and recommend QR or WO.`. Line 239: `Link to Quote`. Line 240: `Link to Invoice`. Keep the ids.
      Files: index.html
      Verify: in the Playwright Settings check, connect Microsoft and read the four texts.

- [ ] 7. **Full verification and commit** with the cr02 §12 message. Commit locally only.

---

## (b) cr02.md vs the code

| # | cr02 says | Code at 6c5b96a | Resolution |
|---|---|---|---|
| M1 | §3b: reuse `chip()` in the row | Chip CSS is `#panel`-scoped (lines 40–44). In `#rows` the chip loses its border and the type tag loses its colour | Add `#rows` selectors (item 2) |
| M2 | §5: `dis` after `.ai`, button class `change` | `.change` is styled only as `#panel .ai .change` (line 59). `.dismissed{margin:8px 0 0}` leaves 0 px above `#threadBox` | Add `#panel .dismissed .change`; use margin `0 0 14px` |
| M3 | §3b: chip and `+n` inside the row | Row keydown `psKey` calls preventDefault (lines 465, 492). Keyboard activation of the chip or `+n` opens the panel instead | Guard with `event.target===this` |
| M4 | §9: "Delete any `#undoBtn` CSS" | None exists. The Undo style is `#toast button` (line 84); the comment on line 39 says "Undo toast" | Delete line 84; edit the comment |
| M5 | §9: "every `toast(…,true)` (5 calls)" | 5 today (lines 367, 368, 374, 404, 422). §7 deletes line 368 first | 4 remain at §9 |
| M6 | §11 check 1: grep returns "No action needed" | `No action'` does not match `No action needed'` | Expect empty output |
| M7 | §11 check 8: email 11 details are read-only | Email 11 has no `fields`, so there is no section to check | Check read-only on dismissed email 5 and on email 6 instead |
| M8 | §11 check 8: email 11 has no ✦ | Email 11 has `recommended:null`, so the check passes whether or not the gate works | Also check dismissed email 12: no ✦ in the menu, footer shows `Actions ▾` |
| M9 | §2: `statusOf` ≈ 284, `ibBadge` ≈ 291, `badge` ≈ 295, `.ib-st` ≈ 110 | Exact: 284, 291, 295, 110 | None |
| M10 | §4a ≈ 218, §4d ≈ 489 | Exact: 218, 489 | None |
| M11 | §7: `Object.assign` ≈ 367 / 403 / 421 | Exact | None |
| M12 | §3a: four `L('SR',…)` | Four: 268, 271, 366, 398 | None |
| M13 | §9: four `snapshot(e)` | Four: 365, 372, 396, 419 (definition at 430) | None |
| M14 | Out of scope: "Inbox list layout (… tabs …)" | §4 adds a third tab | Additive only; the layout is unchanged. Wording note for the user |
| M15 | Brief: `srRegistry`, `ME`, `TODAY`, `showDialog(title,body,buttons)`, `confirmBox(t)`, `refresh()`, `visibleLinks` | Lines 440, 280, 280, 344, 354, 308, 293. All match the usage in §7 | None |

Other references to removed items, outside the lines listed above:

- `.badge.other` (CSS lines 7 and 24, `linkBadge` line 296, `renderLinkResults` line 416) is a colour class for Converted/Cancelled/link results, not the Other concept. **Keep it.**
- `hasSR` (line 294) stays.
- The SR register (line 486), SR details (line 477), the Settings view and the WO module do not use `statusOf`, Done, No action, other, snapshot, Undo, `statusFilter` or `badge()`.
- In the decoded WO iframe module, `grep` for `'Done'|No action|statusOf|Mark as Other|undoBtn|prevState|Dismiss|Undo|statusFilter|ibBadge` finds nothing.

---

## (c) Open decisions for the user

| # | Question | Why it matters | Recommended default |
|---|---|---|---|
| D1 | Should **Flag again** on email 3 reopen SR0001? | `doDismiss` cancels SR0001. `flagAgain` restores `pending:'Create a Quote Request or Work Order from SR0001'` and `recommended:'create-qr'`, but SR0001 stays Cancelled. Create QR would then make a new SR0005 (`createForm` only finds an Open SR), and the AI line still reads "SR0001 created" | Record `sr:sr.id` in `e.dismissed`. In `flagAgain`, set that SR back to `Open` in the link and in `srRegistry`, so Flag again fully undoes Dismiss. This adds behaviour beyond cr02, so it needs your yes |
| D2 | What should the row chip show for a **cancelled SR**? | `visibleLinks` hides only Converted SRs. After Dismiss on email 3 the row still shows `SR SR0001 · Service Request`, with nothing saying it is cancelled. The panel shows the Cancelled badge (`linkBadge`) | Keep the chip, per cr02 ("links stay"). Optionally, as a later change, mute it (grey) when `status==='Cancelled'` |
| D3 | **SR register / SR details** for a Cancelled SR | `openSRRegister` (line 486) labels every non-archived SR **Active**, so SR0001 shows "Active" after Dismiss. `showSRDetails` shows Status "Cancelled" but still offers Archive and Reject. The same already happens today after Remove link | Leave unchanged (cr02 puts the SR register out of scope) and note it for the PRD |
| D4 | `other:false` on 11 seeds | cr02 says to leave the seeds alone. After CR02 nothing reads `other` | Follow cr02 and leave them. Removing them is harmless if you prefer a clean model |
| D5 | Scope: §10 changes **Settings › Email Integration**, not the Inbox | It renames labels you set in your earlier request ("AI automations", "Service Request Creation", "Quote Linking", "Invoice Linking") | Apply as cr02 says; cr02 is the newer instruction |
| D6 | Should the row keydown guard (M3) and the chip CSS (M1, M2) be added? | They make cr02's intent work. Without them the chips are unstyled and keyboard activation misfires | Apply. They are fixes, not new behaviour |

Smaller points, no decision needed:

- Dismiss also appears in the "＋ Add link" menu, because it uses `mode==='add'`. The menu header there reads "Add link". This is acceptable.
- Remove link while other links remain does not clear `dismissed`. Only create, link and remove-all clear it. This matches §7.
- On a dismissed email, Change still shows. It opens the menu without Dismiss, and any action clears the dismissal. Email 9 (no links, no `pending`): Change opens the 5-item add menu, the footer reads "No action needed", and the button is `Actions ▾`. Nothing breaks once `other` is removed.
- The dismissed date is `TODAY='18/11/2026'` (line 280), which matches QA check 4.
- On the `ibKeep` logic: opening a flagged email from the Action needed tab keeps it listed after Dismiss or an action, until the panel closes or the tab changes (`closePanel` line 307, `ibSetTab` line 472). This mirrors the Unread tab.
- On tab ARIA: the new tab gets `aria-selected` from the forEach. The existing tabs have no `aria-controls` or arrow-key navigation, and the new tab inherits that.
- The tab label reads "Action needed 6", matching the existing tab count style. The PRD writes "Action needed (n)".
- The toast replacement keeps the `.panelfoot` bottom-offset logic from the current `toast()` unchanged. `closePanel` still resets `#toast.style.bottom`.
- Nested interactive elements (`<a>` and `<button>` inside `role=button`) are an axe "nested-interactive" issue. M3 fixes the behaviour. Full ARIA compliance would need a different row structure, which is out of scope.

---

## (d) Verification plan

Run against http://127.0.0.1:3000/ without restarting the server. Use a script in `/tmp/cr02-verify/` that requires `/tmp/inbox-v2-verify/node_modules/playwright`, with `chromium.launch({channel:'chrome'})`, a fresh page per scenario, and capture of `pageerror` and console errors.

1. **Syntax:** extract the inline `<script>` blocks, excluding `type="text/plain"`, into temp `.js` files and run `node --check` on each. All must pass.
2. **cr02 §11 checks 1–11**, with these adjustments:
   - Check 8: test read-only details on dismissed email 5 and on email 6, and test for no ✦ on dismissed email 12.
   - Check 3: also press Enter on a row chip (record dialog opens) and Enter/Space on `+n` (panel opens with `#linksBox` scrolled into view).
   - Check 4: confirm there is no `#toast button`, and that the toast disappears after about 3.5 s.
   - Check 6: open SR0001 from the chip and confirm SR details show Status Cancelled. Apply D1 if it is approved.
   - Check 9: the expected chip is `QR QR002217 · from SR0001` (`qrSeq` 2216 + 1).
   - Row table: assert line 2 for all 12 emails, plus the 6 ids in the Action needed tab and the count dropping to 5 after Dismiss and back to 6 after Flag again.
3. **Regression:**
   - pager: page 2 at 10 per page, entries-per-page change, focus kept on the pager.
   - Unread tab: an opened email stays listed until the panel closes.
   - Mark all as read: pill and count reach 0, the button becomes disabled.
   - search: by sender, subject and `WO615003`.
   - month group headers and counts.
   - Sort: oldest first.
   - SR register opens and View SR works.
   - sidebar Email Integration dialog.
   - Settings: Microsoft and Google connect/disconnect, the folders multiselect, and the new AI Automation labels.
   - Work Orders All, Future & Recurring and Calendar iframe load, then back to Inbox.
4. **Responsive:**
   - At 390 px: no horizontal scroll (`document.documentElement.scrollWidth<=innerWidth`), the three tabs fit or wrap without overflow, and the toast sits above the panel footer.
   - At 700 px: the `.ib-l2` chips wrap under the subject.
   - At 1440 px: the row stays on one line and the toast is offset left of the panel.
5. **Screenshots** of the list (All and Action needed tabs), email 3 after Dismiss, email 5 dismissed, and Settings, at 1440 and 390 px.

---

## (e) Expected greps after the change (6c5b96a + CR02)

| Command | Expected |
|---|---|
| `grep -n "'Done'\|No action'\|statusOf\|Mark as Other\|undoBtn\|prevState" index.html` (§11 check 1) | **No output.** No false positives: line 575 is base64 with no quote characters, and no other screen uses these strings |
| `grep -n "statusOf\|ibBadge\|badge(st" index.html` (§2) | No output |
| `grep -n "statusFilter\|snapshot(\|ib-st-done\|ib-st-none\|#toast button\|other:true\|'other'\|Undo" index.html` | Only `'other'` in `linkBadge` (line ~296) and `renderLinkResults` (line ~416). Both are the `.badge.other` colour class and are expected |
| `grep -c "other:false" index.html` | 11 (seed lines, per D4). 0 if D4 is changed |
| `grep -n "No action needed" index.html` | 1 (the footer hint in `panelMarkup`) |
| `grep -n "L('SR'" index.html` | 4 lines, all with `'Service Request'` |
| `grep -n ",true)" index.html` | No toast calls |
| `grep -n "Dismiss\|dismissed\|flagAgain" index.html` | Only the new code: `panelMarkup`, `openActionMenu`, `dismissEmail`, `doDismiss`, `flagAgain`, the `.dismissed` CSS, and the three `dismissed:null` plus one in `doRemove` |
