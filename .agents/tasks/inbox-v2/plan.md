# Implementation Plan: Inbox v2 (cr01.md) in index.html

Only file to edit: `/Users/arjuna/Documents/inbox automation/Inbox_automation/index.html`.
Work on `main` directly. Commit locally at the end, staging `index.html` only. Never stage `Instruction/`, `.agents/`, `implementation-log` or anything else. Do not push.

Spec: `Instruction/cr01.md`. Behaviour reference: `Instruction/inbox-v2-reference.html` (`<script>` block, functions `openMenu`, `openLinkMenu`, `act`, `run`, `removeLink`, `createForm`, `linkForm`, `linksBox`, `renderSide`, `blockMsg`, `removeEffect`). Port the behaviour into the repo's own structure (`#panel`/`#panelContent`, `#menu`, `showDialog`/`closeDialog`, `#toast`). Do not copy the reference's `.side`, `#layer`/`modal()`, `data-*` global click handler or its CSS wholesale.

## File map (index.html as it stands, 420 lines)

- Lines 6-132: `<style>`. Line 7 is one long base rule line. Lines 9-16 add `.scenario-btn`, `.timeline`, `.decision`, `.srgrid`. Lines 18-43 are the "i4T restyle" overrides. Lines 45-54 are `.row-icon` / `.icon-key`. Lines 55-120 are `ps-*` (Profile Settings, DO NOT TOUCH). Lines 122-131 are `wo-*` (DO NOT TOUCH).
- Line 136: Inbox view markup (header, toolbar, table, footer, `.statusline`).
- Lines 137-170: `#settingsView` and `#woIntegratedView` (DO NOT TOUCH).
- Lines 172-174: `.devlabel`, `#overlay`, `#panel > #panelContent`, `#menu`, `#shade` dialog, `#toast`.
- Lines 175-330: first `<script>`, Inbox JS. Lines 331-352: `ps*` JS (DO NOT TOUCH). Line 353 `</script>`.
- Lines 355-410: second `<script>` (WO nav, `showIntegratedSection`, `showInbox`/`showSettings` wrappers). DO NOT TOUCH.
- Line 412: `woModuleEncoded` base64 (DO NOT TOUCH). Lines 413-419: iframe loader (DO NOT TOUCH).

Functions in the first script that stay unchanged: `escapeHtml`, `find`, `closePanel`, `hideMenu`, `closeDialog`, `rejectSR`, `confirmReject`, `confirmArchiveSR`, `restoreSR`, `openAutomationSettings`, `saveSettings`, the Escape keydown handler, and every `ps*` function.

## Decisions (record of choices made where cr01.md or the brief is silent or ambiguous)

D1. **Class-name collisions.** The repo already has `.role` (dark header pill, line 7 and line 23) and `.main` (page layout container: `flex:1; padding:17px 19px 26px`). The cr01.md markup `.rec .role` and `.split .main` would inherit those styles. Rename: chip role span uses `class="rrole"`, split buttons use `class="smain"` and `class="smore"`. All other cr01.md classes (`.ai .new .pending .plus .split .rec .recs .rt .spark .change .lrow .addlink .sugg .req .miss .panelfoot .tag .curtag`) have zero existing uses in CSS or JS outside the WO iframe (checked with a script). They are still scoped under `.emailtable`, `#panel`, `#menu` or `#shade` so they cannot reach `#settingsView`. The WO module runs in an iframe `srcdoc` and cannot be affected by parent CSS.
D2. **`.new` CSS is not added.** It is only used by cr01.md step 10 (Settings toggles), which the user skipped.
D3. **Invoice link statuses.** cr01.md gives email 1 `Invoice submitted` and leaves emails 2, 7, 10 without a status. If every invoice link were `Invoice submitted` (a blocked status), the L4 check ("The invoice will be removed from…") could never be shown. Emails 2, 7 and 10 get status `Received`. Email 1 keeps `Invoice submitted` for the L6 check. Links made through the Link to WO dialog get `Invoice submitted` as cr01.md section 7 says.
D4. **New email placement.** Emails 12 and 11 go at the top of the array (newest first), dated `30/10/2026 02:05 PM` and `30/10/2026 09:42 AM`, since the repo's newest email is 29/10/2026. Bodies use repo properties: email 11 is the switchboard upgrade at RESVU – ESTATE; email 12 is the roof membrane repair at HARBOUR VIEW SP4852. No "NEW" tag in the row (cr01.md does not ask for one).
D5. **Strata plans, Work Orders, Quote Requests, contractors.** Use the repo's existing values: strata plans `RESVU – ESTATE`, `SP12345`, `HARBOUR VIEW SP4852` (three plans, which matches email 4's "matches 3 strata plans"). WO search list: the four IDs already in the old `linkWO` dialog (WO615003, WO620021, WO619624, WO613048). QR list: QR002208, QR002210, QR002201. Contractors come from the reference: Rapid Plumbing Pty Ltd (Compliant · Agent Preferred), Coastal Plumbing Services (Compliant), BlueLine Plumbing (disabled, "Public liability expired").
D6. **Priority values.** The repo uses `Routine` and `Urgent`. The create form priority select offers `Low, Routine, Medium, High, Urgent` and preselects the field value (default `Medium`).
D7. **Manual action stamp.** `const ME='Jane Thornton', TODAY='18/11/2026'`; manual links get `by:'Jane Thornton · 18/11/2026'`. AI links use `AI · <received date dd/mm/yyyy>`.
D8. **Record counters.** `demoSRSeq` stays at 4 so the next SR is `SR0005`. New `qrSeq=2216` gives `QR002217`, and new `woSeq=620040` gives `WO620041`. These match the cr01.md section 9 toast examples.
D9. **SR cancellation.** In replace mode an SR link is set to `Cancelled` and kept, as cr01.md section 7 says. For **Remove link** the link is spliced out. For an SR link, its `srRegistry` entry also gets `status:'Cancelled'`. Every SR status change on a link is mirrored into `srRegistry[id].status`.
D10. **Undo scope.** `snapshot(e)` stores a deep copy of the email **and** of `srRegistry`. Undo restores both, so the Service Requests register cannot drift from the Inbox. ID counters are not rewound.
D11. **"Current" menu item** in replace mode is shown muted with the `Current` tag and is disabled, because picking it would be a no-op replacement.
D12. **AI card "Change" link** is always shown. It opens replace mode for the last element of `e.links` when links exist, and add mode otherwise.
D13. **Editable side-panel fields** write back to `e.fields[key]` on `input`, so edits survive table re-renders. The Create form reads from those values.
D14. **Save Draft** in the Create form closes the dialog and shows `toast('Draft saved (prototype only)')` with no data change and no Undo.
D15. **SR details dialog.** It reads the strata plan, lot, category and issue from `e.fields`, and status from the SR link (fallback `srRegistry`). The Create QR / Create WO buttons only appear when the SR is `Open` and not archived. They call `closeDialog();runAction('create-qr'|'create-wo',emailId)`.
D16. **`.statusline` under the table** ("Confirmed Phase 1: … 24 h …") is **left unchanged**. It describes back-end duplicate rules, not the removed test button, and does not contradict the new UI. Report it as an open point: the user may want it removed now that the "Test 24-hour rule" lab is gone.
D17. **`defaultContact`** (unused helper) and the unused `.sideactions`, `.actionbar`, `.decision` CSS are left in place. They are outside cr01.md's delete list. `.decision` is still referenced by nothing after the lab is removed, but cr01.md does not list it, so it stays.
D18. **`showDialog` extension.** Button objects gain optional `id` and `disabled` properties (backward compatible). `openAutomationSettings` and the SR dialogs keep working unchanged.

## Final data model

Each email: `{id, sender, address, subject, date, attachments:[], body, links:[], pending, recommended, other, ai, why, fields?, missing?}`. Removed: `type, status, linked, confidence, attachment, invoice, strata, lot, category, priority, description, reason`.

Link helper (place right after `emails` helpers):
```js
const L=(type,id,role,status,by,docs,from)=>({type,id,role,status,by,docs:docs||[],from:from||null});
```
`fields` key order: `'Strata Plan','Lot / Unit','Site Contact','Service Category','Issue','Priority'`.

Array order (top to bottom): 12, 11, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10. Keep each existing email's sender, address, subject, date and body exactly as now.

| id | attachments | links | pending | recommended | other | ai | why | fields / missing |
|---|---|---|---|---|---|---|---|---|
| 12 Roofline Contractors `admin@roofline.com.au` "Quotation – roof membrane repair" 30/10/2026 02:05 PM. Body: `Hi,\n\nAttached is our quotation for the roof membrane repair at HARBOUR VIEW SP4852 as discussed on site.\n\nKind regards,\nRoofline Contractors` | `['Roofline_Quote_311.pdf','photos.zip']` | `[]` | `'No matching Quote Request found for this quote. Search for the Quote Request and choose the contractor.'` | `'link-qr'` | false | `Recommended: Link to Quote Request.` | `This looks like a quote, but no Quote Request number was found in the subject.` | none |
| 11 Spark Electrical `quotes@sparkelectrical.com.au` "Quote for QR002210 – switchboard upgrade" 30/10/2026 09:42 AM. Body: `Hi Jane,\n\nPlease find attached our quote for the switchboard upgrade at RESVU – ESTATE.\n\nRegards,\nMia – Spark Electrical` | `['Quote_Q-8812.pdf']` | `L('QR','QR002210','Quote','Received','AI · 30/10/2026',['Quote_Q-8812.pdf'])` | null | null | false | `Linked to QR002210 as the quote from Spark Electrical.` | `QR002210 is in the subject and the sender is a contractor invited to that Quote Request.` | none |
| 1 | `['Invoice_WO619624.pdf']` | `L('WO','WO619624','Invoice','Invoice submitted','AI · 29/10/2026',['Invoice_WO619624.pdf'])` | null | null | false | `Linked to WO619624 as an invoice.` | `WO619624 is in the subject and the sender is the contractor on that Work Order.` | none |
| 2 | `['Lift_Invoice_613048.pdf']` | `L('WO','WO613048','Invoice','Received','AI · 29/10/2026',['Lift_Invoice_613048.pdf'])` | null | null | false | `Linked to WO613048 as an invoice.` | `WO613048 is in the subject and the sender is the contractor on that Work Order.` | none |
| 3 | `['ceiling_leak.jpg']` | `L('SR','SR0001','Request','Open','AI · 29/10/2026')` | `'Create a Quote Request or Work Order from SR0001'` | `'create-qr'` | false | `Service Request SR0001 created. Recommended next step: Create Quote Request.` | `Property RESVU – ESTATE and category Plumbing found. Ceiling leaks usually need a site inspection and quote.` | `{'Strata Plan':'RESVU – ESTATE','Lot / Unit':'Lot 12','Site Contact':'Tommy Gennusa','Service Category':'Plumbing','Issue':'Water leaking from bathroom ceiling in Lot 12. The problem started yesterday and is worsening.','Priority':'High'}` |
| 4 | `['water_pressure.jpg']` | `[]` | `'Property not found: "Unit 5" matches 3 strata plans. Choose the strata plan to continue.'` | `'create-wo'` | false | `Recommended: Create Work Order.` | `Low water pressure is usually a small repair. The property could not be matched.` | `{'Strata Plan':'','Lot / Unit':'Unit 5','Site Contact':'i4T Test','Service Category':'Plumbing','Issue':'Low water pressure in Unit 5; inspection requested.','Priority':'Routine'}`, missing `['Strata Plan']` |
| 5 | `['security_door.jpg']` | `[]` | `'The AI could not identify what this email needs. Choose an action from the menu.'` | null | false | `No recommendation for this email.` | `The AI could not identify the purpose of this email.` | `{'Strata Plan':'','Lot / Unit':'Lot 7','Site Contact':'i4T Test','Service Category':'Security / Access','Issue':'Broken common-area security door near Lot 7; it does not close properly.','Priority':'Urgent'}`, missing `['Strata Plan']` |
| 6 | `[]` | `L('SR','SR0003','Request','Converted','AI · 21/09/2026')`, `L('QR','QR002215','Request','Open','Jane Thornton · 22/09/2026',[],'SR0003')` | null | null | false | `Service Request SR0003 converted to QR002215.` | `Converted by Jane Thornton on 22/09/2026.` | `{'Strata Plan':'RESVU – ESTATE','Lot / Unit':'Car park','Site Contact':'Sara Browns','Service Category':'Electrical','Issue':'Follow-up on previously reported car park lighting issue.','Priority':'Medium'}` |
| 7 | `['Invoice609221.pdf']` | `L('WO','WO609221','Invoice','Received','AI · 18/09/2026',['Invoice609221.pdf'])` | null | null | false | `Linked to WO609221 as an invoice.` | `WO609221 is in the subject and the sender is the contractor on that Work Order.` | none |
| 8 | `['INV-2045.pdf']` | `[]` | `'WO615003 found, but the sender is not the contractor on that Work Order. Confirm the link.'` (exact) | `'link-wo'` | false | `Recommended: Link to Work Order.` | `WO615003 is in the subject, but the sender is not the contractor on that Work Order.` | none |
| 9 | `[]` | `[]` | null | null | **true** | `Marked as Other: general correspondence.` | `No request, invoice or quote found in the email.` | none |
| 10 | `['INV-2046.pdf']` | `L('WO','WO615003','Invoice','Received','AI · 09/09/2026',['INV-2046.pdf'])` | `'The email also reports a new leak in the kitchen at Lot 12. Create a job for it.'` | `'create-wo'` | false | `Invoice linked to WO615003. Recommended next step for the new leak: Create Work Order.` | `The email has an invoice for WO615003 and also reports a new leak.` | `{'Strata Plan':'SP12345','Lot / Unit':'Lot 12','Site Contact':'ABC Plumbing','Service Category':'Plumbing','Issue':'New leak in the kitchen at Lot 12 needing a separate repair.','Priority':'Medium'}` |

Resulting statuses: Done = 11, 1, 2, 6, 7. Action needed = 12, 3, 4, 5, 8, 10. No action = 9.

`srRegistry`: keep its shape. Set `SR0003.status='Converted'`. SR0001 stays `Open`.

## Duplicated / overridden code to consolidate (all in the first `<script>`)

Delete these: line 189-190 `typeNames`, `statusNames`; line 193 `statusClass`; **first** `renderRows` (195-196); **first** `nextAction` and `details` (197-198); first `actions` (201); `menuHTML`, `openMenu`, `openMenuAtPanel` (202-204); `viewLinked` (207); the **original** `runAction` (208-214); `confirmWO` (215); **first** `confirmSR` (216); `confirmRetry`, `confirmClassification` (217-218); `createWOQR` (221); `processedMessageIDs`, `duplicateEvents` (231-232); `iconBtn`, `contextIcons` (250-276); **second** `renderRows` (276-280); **second** `details`, `nextAction` (282-290); old `panelMarkup` (291-295); **second** `actions` (296-300); the `originalRunAction` wrapper and the `runAction=function…` override (303-309); **second** `confirmSR` (310-316); `openScenarioLab`, `simulateResync`, `simulateDuplicate` (323-329). Reduce `GLYPHS` to `{eye: …}` only.

After this there is exactly one definition each of `renderRows`, `panelMarkup`, `openPanel`, `runAction`, `toast`.

## Ordered steps

- [ ] 1. CSS: remove obsolete rules and add scoped v2 rules.
      Remove: every `.scenario-btn` rule (lines 9, 10, 14 `.scenario-btn{order:4}`, 15 `.scenario-btn{width:100%}`, 26, 42 `.scenario-btn{order:4}`), keeping the other selectors in those media blocks. Also remove `.timeline` and `.timeline strong` (line 11), `.row-icon.warn:hover` and `.row-icon.danger:hover` (49-50), `.icon-key` and `.icon-key span` (52-53), `.badge.invoice`, `.badge.maintenance` and `.badge.mixed` from line 7. On line 30, reduce the grouped selector to `.badge.other,.badge.processing{…}` and keep `.badge.other`, which is used for "No action". Keep `.row-icon`, `.row-icon:hover`, `.row-icon svg` and `.row-icon:disabled`.
      Add one block `/* Inbox v2 */` just before `/* Profile & Account Settings view */`, containing cr01.md section 11 with these changes: `.rec .role` becomes `.rec .rrole`, `.split .main` becomes `.split .smain`, and `.split .more` / `.split.only .more` become `.smore`. Chip, split and spark rules are prefixed with `.emailtable ,#panel ` (e.g. `.emailtable .rec,#panel .rec{…}`). `.ai` is prefixed with `#panel ,#shade `. `.lrow .pending .addlink .sugg .req .miss .panelfoot` are prefixed with `#panel ` (`.sugg` also with `#shade `). Menu rules use `#menu`. No `.new` rule (D2).
      Also add:
      - `#menu .mh{font-size:10px;color:#6b7480;text-transform:uppercase;letter-spacing:.08em;padding:6px 8px 4px}`
      - `#menu button{display:flex;justify-content:space-between;align-items:center;gap:10px}`
      - `#menu hr{border:0;border-top:1px solid #e8ebef;margin:4px 0}`
      - `#panel .lrow .l1{display:flex;align-items:center;gap:6px;flex-wrap:wrap}`
      - `#panel .kebab{border:1px solid #dce0e5;background:#fff;border-radius:4px;padding:2px 8px}`
      - `#panel .kv{display:grid;grid-template-columns:140px 1fr;font-size:12px}`, `#panel .kv>div{padding:8px 10px;border-bottom:1px solid #e8ebef}`, `#panel .kv .k{font-weight:700;background:#f8faff}`, `#panel .kv input,#panel .kv select{width:100%;border:1px solid #cfd7e4;border-radius:3px;padding:5px 7px}`
      - `#panel .ai p{margin:0}`, `#panel .ai small,#shade .ai small{display:block;color:#6b7480;margin-top:3px}`
      - `#shade .grid2{display:grid;grid-template-columns:1fr 1fr;gap:0 12px}`
      - `#shade .field label.opt{display:flex;align-items:center;gap:8px;border:1px solid #dce0e5;border-radius:4px;padding:8px;font-weight:400;margin:0 0 6px}`, `#shade .opt:has(input:checked){border-color:#0878fa;background:#eaf3ff}`, `#shade .opt input{width:auto;margin:0}`, `#shade .opt .badge,#shade .opt .optnote{margin-left:auto}`
      - `#shade .confirm{display:flex;gap:12px;align-items:flex-start}`, `#shade .confirm .bang{flex:none;width:34px;height:34px;border-radius:50%;background:#6e7f89;color:#fff;font-size:18px;font-weight:700;display:flex;align-items:center;justify-content:center}`
      - `#shade .lk-none{border:1px dashed #dce0e5;border-radius:4px;padding:12px;text-align:center;color:#6b7480}`
      - `#toast.visible{display:flex;align-items:center}`
      - `@media(max-width:620px){#shade .grid2{grid-template-columns:1fr}}`
      Files: index.html (style block only).
      Verify: `git diff -U0 index.html` shows no changed line containing `ps-` or `wo-`. Load http://127.0.0.1:3000/ and confirm the page still renders (the old JS is still present at this point).

- [ ] 2. Inbox markup (line 136 only). Delete the `<button class="scenario-btn">…</button>` and the whole `<select id="typeFilter">…</select>`. Replace the `#statusFilter` options with `<option value="all">All statuses</option><option>Action needed</option><option>Done</option><option>No action</option>`. Replace the colgroup with 6 cols (16%, 30%, 13%, 10%, 15%, 16%). Remove `<th>Type</th>` and rename `Actions` to `Action`. Leave the breadcrumb, title, Connected line, `Sync Folders: Inbox`, footer and `.statusline` (D16) unchanged. Do not re-add Sync Now or "Auto (every 5 mins)".
      Files: index.html.
      Verify: done together with step 3, because the old JS reads `#typeFilter`.

- [ ] 3. Data model, helpers, table rendering, and deletion of dead code (one step, so the script stays runnable).
      a) Replace `const emails=[…]` with the 12-email model above, with `L()` defined before it. Add `const ME='Jane Thornton',TODAY='18/11/2026';let qrSeq=2216,woSeq=620040,prevState=null;`.
      b) Delete everything listed under "Duplicated / overridden code to consolidate". Reduce `GLYPHS` to eye. Remove the `typeFilter` listener on line 330 and keep the search/status listeners and the outside-click `hideMenu` handler.
      c) Add the helpers: `statusOf`, `visibleLinks`, `hasSR` (verbatim from cr01.md 2.2), plus `badge(st)`, which maps Done→`linked`, Action needed→`needs`, No action→`other` and returns `<span class="badge cls">st</span>`. Add `linkBadge(l)`: class `other` for Converted/Cancelled, else `linked`. Add `ACTIONS` (labels from the reference, including `other:'Mark as Other'`) and `SHORT` (cr01.md section 4, no retry/view). Add `chip(l)` and `recordCell(e)` (cr01.md section 4 code with `rrole` and `escapeHtml`), and `actionCell(e,inPanel)` (cr01.md section 4 code with classes `smain`/`smore`, eye button `class="row-icon"` with `GLYPHS.eye`).
      d) Add `currentSR(e)`: the `srRegistry` entry of the last SR link in `e.links`, or null. It replaces the old `e.linked` version.
      e) Write the single `renderRows()`: filter by `#statusFilter` (`all` or `statusOf(e)===value`) and by search over `[e.sender,e.address,e.subject,...e.links.map(l=>l.id)].join(' ')`. Keep the count text `Showing x of y emails`. Rows have cells Sender / Subject (show `📎 Attachments (n)` as `<div class="small muted">` when there are attachments) / Date / `badge(statusOf(e))` / `recordCell(e)` / `actionCell(e)`. Keep `tr.mailrow` with `chosen` and `onclick="openPanel(id)"`. The empty row uses `colspan="6"`.
      f) Temporary `openPanel` stays at its current definition (lines 199) until step 4 rebuilds `panelMarkup`. Add a minimal stub `function panelMarkup(e){return ''}` only if needed to keep the page runnable. Step 4 replaces it.
      g) Update the SR functions: `showSRDetails(id,srId)` per D15, with `sr=srRegistry[srId]||currentSR(e)`. Rows come from `e.fields` (`Strata Plan`, `Lot / Unit`, `Service Category`, `Issue`, using `e.subject` when there are no fields), status comes from the link with that id, and Site Contact comes from `sr.contact`/`sr.address`. Buttons: Close, Archive SR, Reject Request, and when Open plus not archived, Create Quote Request / Create Work Order via `closeDialog();runAction(...)`. Archived: Close plus Restore. `openSRRegister`: `e?.strata` becomes `e?.fields?.['Strata Plan']`, and "View SR" calls `closeDialog();openRecord('${sr.id}')`. `archiveSR`/`confirmArchiveSR`/`restoreSR` keep `currentSR(e)`; replace their `openPanel(id)` with `refresh()` (step 6).
      h) Extend `showDialog` button markup with optional `id` and `disabled` (D18).
      Files: index.html.
      Verify: extract scripts and run `node --check` (command in step 8). Load the page headless: zero console errors, 12 rows, 6 headers, status filter values as specified.

- [ ] 4. Side panel. Rewrite `openPanel(id,focus)`: set `selected`, `hideMenu()`, render `panelMarkup(find(id))`, show the overlay and panel, `renderRows()`, and when `focus==='links'` call `document.querySelector('#linksBox')?.scrollIntoView({block:'nearest'})` after render. Add `refresh()`: `renderRows(); if(selected) document.querySelector('#panelContent').innerHTML=panelMarkup(find(selected));`, which keeps the scroll position. Write `panelMarkup(e)` in this order, using the repo's classes:
      1. `.panelhead > .paneltop` with the `INBOX / EMAIL DETAILS` breadcrumb, `.ptitle` subject, and the existing close button. Then `.tags` with `badge(statusOf(e))` and `<span class="small muted">n linked record(s)</span>`. No Type badge, no "Linked: X". Show `<span class="badge archived">SR Archived</span>` when `currentSR(e)?.archived`.
      2. `.panelbody`, first child `<div class="ai section-gap">`: ✦ spark + `<p>` with `e.ai` + `<button class="change" onclick="event.stopPropagation();openActionMenu(event,id,mode,idx)">Change</button>` (D12) + `<small>` with `e.why`. Give it `margin-bottom:14px`.
      3. `<div class="section" id="linksBox"><h3>Linked records (n)</h3>`: a pending row `<div class="pending">⚠ text</div>` when `e.pending`. Then one `.lrow` per link, newest first, with the real index `i=e.links.length-1-ri`: `.l1` = `chip(l)` + `linkBadge(l)`, and `.meta2` = `📎 docs · ` (if any) + (`by` starts with `AI` ? `✦ Linked by AI · date` : `Linked by name · date`), plus a `<button class="kebab" onclick="event.stopPropagation();openLinkMenu(event,id,i)" aria-label="Link actions">⋯</button>`. With no links and no pending, show the muted row `No linked records yet.`. End with `<button class="addlink" onclick="event.stopPropagation();openActionMenu(event,id,'add')">＋ Add link</button>`.
      4. Only if `e.fields`: a `.section` with `<h3>AI-filled details <span class="sugg">Suggested by AI${e.pending?' · editable':''}</span></h3>` and a `.kv` grid. Editable when `e.pending`. A field is missing when `(e.missing||[]).includes(k)&&!v`: the key gets `<span class="req">Required</span>`, the value cell gets class `miss`, and Strata Plan becomes `<select id="sp-{id}">` with `Choose strata plan…` plus the three plans (D5). Other editable fields are `<input id="f-{id}-{k.replace(/\W/g,'')}">`. Each input and select gets `oninput`/`onchange="setField(id,'k',this.value)"` (D13). Read-only shows the value or `–`.
      5. The existing Original Email section, unchanged except attachments: `Attachments (n)` plus one `.attachment` row per file, keeping the existing Preview toast.
      6. `<div class="panelfoot">` placed after `.panelbody` inside `#panelContent`: left `<span class="small muted">` with `Recommended by AI` / `No action needed` (status No action) / `Choose an action`, right `actionCell(e,true)`.
      Add `setField(id,k,v){find(id).fields[k]=v;}`.
      Files: index.html.
      Verify: `node --check`. Headless: open email 10 and email 3 with no console errors. Section order is .ai → #linksBox → AI-filled details → Original Email → .panelfoot.

- [ ] 5. Menus. Delete nothing further (old menu functions were removed in step 3). Add:
      - `placeMenu(m, anchorRect)`: set innerHTML, add `visible`, then measure `m.offsetWidth/offsetHeight`. `left=max(8,min(innerWidth-w-8, r.right-w))`, and `top` is flipped above (`max(8,r.top-h-4)`) when `r.bottom+h+8>innerHeight`, else `r.bottom+4`.
      - `openActionMenu(ev,id,mode,idx)`: port the reference `openMenu` filtering. In add mode, drop `other` when the email has links. In replace mode for an Invoice/Quote target, drop `create-sr`. The Current tag applies when (Invoice & link-wo) | (Quote & link-qr) | (SR & create-sr), disabled per D11. `create-sr` is disabled with `Already created` when `hasSR(e)&&!(target&&target.type==='SR')`. `✦ Recommended` goes on `e.recommended`. Heading `<div class="mh">Add link</div>` or `Replace {id} with`. Items call `onclick="event.stopPropagation();runAction('k',id,'mode',idx)"` (idx `null` in add mode). Toggle closed if the same anchor is clicked again (reuse `menuFor`).
      - `openLinkMenu(ev,id,idx)`: heading `{id} · {role}`, items `Open record` (`hideMenu();openRecord(id)`), `Replace with…` (`openActionMenu(event,id,'replace',idx)`), `<hr>`, `Remove link` (`removeLink(id,idx)`).
      Files: index.html.
      Verify: `node --check`. Headless: click the ▾ on the email 10 row. The menu shows 6 items, `✦ Recommended` on Create Work Order, and Create Service Request is enabled. On email 3, Create Service Request is disabled with "Already created". Menus near the bottom of the viewport open upwards.

- [ ] 6. Rules engine, dispatcher, toast with Undo.
      - `BLOCKED`, `blockMsg(e,l)`, `removeEffect(l)` as in cr01.md section 7 (use the reference's null-safe `q?q.id:…` form). `confirmBox(t)` returns `<div class="confirm"><span class="bang">!</span><p style="margin:0">t</p></div>`. `showBlocked(msg)` calls `showDialog('Change not possible',confirmBox(msg),[{label:'OK',primary:true,run:'closeDialog()'}])`.
      - `runAction(k,id,mode='add',idx=null)`: `hideMenu()`. In replace mode with a target: if `blockMsg` is set, call showBlocked. Otherwise `showDialog('Please confirm', confirmBox(removeEffect(t)+' Then: '+ACTIONS[k]+'.'), [Cancel, {label:'Confirm',primary:true,run:`closeDialog();doAction('${k}',${id},${idx})`}])`. In add mode, `other` with links calls `showBlocked('Remove the linked records first, then mark this email as Other.')`. Otherwise `doAction(k,id,null)`.
      - `doAction(k,id,replaceIdx)`: create-qr/create-wo → `createForm`, link-wo/link-qr → `linkForm`. Otherwise `snapshot(e)` and `dropOld(e,replaceIdx)`. `create-sr`: id `'SR'+String(++demoSRSeq).padStart(4,'0')`, push `L('SR',id,'Request','Open',ME+' · '+TODAY)`, add `srRegistry[id]={id,email:e.id,category:e.fields?.['Service Category']||'',contact:e.sender,address:e.address,archived:false,status:'Open',created:TODAY}`, set `other:false,pending:'Create a Quote Request or Work Order from '+id,recommended:'create-qr',ai:'Service Request '+id+' created. Recommended next step: Create Quote Request.',why:'Created by Jane Thornton.'`, then `refresh(); toast(id+' created',true)`. `other`: set `other:true,pending:null,recommended:null,ai:'Marked as Other by Jane Thornton.',why:'No further action.'`, then refresh and `toast('Marked as Other',true)`.
      - `dropOld(e,idx)`: if idx is null do nothing. If the link is SR, set `status='Cancelled'` and mirror to srRegistry (D9). Else splice.
      - `removeLink(id,idx)`: `hideMenu()`, blocked check, then `showDialog('Please confirm', confirmBox(removeEffect(l)+' The link will be removed from this email.'), [Cancel, {label:'Remove link',primary:true,run:`closeDialog();doRemove(${id},${idx})`}])`. `doRemove`: snapshot, splice, SR → registry `Cancelled`. If no links remain and `!e.other`, set `pending:'All links removed. Choose what to do with this email.',recommended:null,ai:'No linked records.',why:'Choose an action from the menu.'`. Then refresh and `toast('Link to '+l.id+' removed',true)`.
      - `snapshot(e)`: `prevState={email:JSON.parse(JSON.stringify(e)),sr:JSON.parse(JSON.stringify(srRegistry))}` (D10).
      - `toast(msg,undo)`: cr01.md section 9 code, using the existing `toastHandle`. The Undo restores `emails[i]=prevState.email` and replaces the srRegistry keys with `prevState.sr` (delete keys not in the snapshot, then `Object.assign`). Then hide the toast, `renderRows()`, and `if(selected) openPanel(selected)`. Timeout 10000 with undo, 3500 without. One-argument calls from `ps*` code keep working.
      Files: index.html.
      Verify: `node --check`. Headless: email 1 ⋯ → Remove link shows "Change not possible" with "WO619624: the invoice is already invoice submitted and cannot be removed from the record." Email 3 Change → Link to Quote Request shows the confirm text starting "Service Request SR0001 will be cancelled (created in error)." Email 9 ▾ → Create Service Request gives toast "SR0005 created" with Undo, and Undo returns email 9 to No action.

- [ ] 7. Dialogs and record viewer.
      - `createForm(k,e,replaceIdx)`: port the reference `createForm` into `showDialog`. Title `New Quote Request` / `New Work Order`. Body: `.ai` note (`Filled in from the email by AI. Check the details, then choose contractors.` + small `From Service Request {open SR id}` or `A Service Request will be created in the background and linked.`). Then a `.grid2` of `.field`s with `<span class="sugg">AI</span>` labels: Strata Plan `<select id="m-sp">` (blank + 3 plans, preselected from `#sp-{id}` value or `fields`), Lot / Unit `m-lot`, Service Category `m-cat`, Priority `m-pri` (D6), Site Contact `m-sc` (default `e.sender`), Attachments `m-att` readonly (`join(', ')` or `None`). Description `<textarea id="m-desc">`. Contractors (manual): three `label.opt` checkboxes `c1`, `c2`, and disabled BlueLine (D5). Buttons: Cancel, Save Draft (D14), `{label:'Submit',primary:true,id:'submitForm',disabled:true,run:`submitCreate('${k}',${e.id},${replaceIdx})`}`. After showDialog, bind `input`/`change` on `#m-sp,#c1,#c2` so Submit is enabled only when Strata Plan is set and c1 or c2 is checked. `submitCreate` follows the reference submit: snapshot, `dropOld`, use the open SR or create one (`++demoSRSeq`, registry entry), set the SR `Converted` (and in the registry). New id `'QR00'+(++qrSeq)` or `'WO'+(++woSeq)`. Push `L(type,rec,'Request',isQR?'Open':'Issued',ME+' · '+TODAY,[],sr.id)`. Write the form values back to `e.fields` if present. Clear pending/recommended, `other:false`, `ai:'Service Request '+sr.id+' converted to '+rec+'.'`, `why:'Submitted by Jane Thornton. Approval follows the normal workflow.'`. Then `closeDialog(); refresh(); toast(rec+' submitted',true)`.
      - `linkForm(k,e,replaceIdx)`: title `Link to Work Order` / `Link to Quote Request`. Search `<input id="lk-q">` re-renders `#lk-results` on input (filter by id or property, case-insensitive). Results are `label.opt` radios `name="lk"` with `<b>id</b> property` and a `badge` showing the status, or disabled with `Already linked` when `e.links.some(l=>l.id===id)` (L3). The first enabled result is checked. For QR, add `Quote is from <select id="lk-c">` with `{e.sender} (invited)` and `TopCover Roofing (invited)`. "Use as invoice/quote" lists attachment radios `name="lka"` (first = Invoice/Quote, others = `Additional document`), or `<div class="lk-none">No attachments</div>`. Buttons: Cancel and `{label:'Link',primary:true,run:`submitLink('${k}',${e.id},${replaceIdx})`}`. `submitLink`: if nothing is checked, `toast('Select a record first')`. Else snapshot and `dropOld`. Push `L('WO',id,'Invoice','Invoice submitted',…)` or `L('QR',id,'Quote','Received',…)` with docs `[chosen]`. Clear pending/recommended, `other:false`, `ai:'Linked to '+id+' by Jane Thornton.'`, why as in the reference. Then `closeDialog(); refresh(); toast('Linked to '+id,true)`.
      - Options data (D5): WO `[['WO615003','SP12345 – Lot 12 plumbing repairs','Completed'],['WO620021','HARBOUR VIEW SP4852 – hot water unit','Issued'],['WO619624','RESVU – ESTATE – maintenance works','Completed'],['WO613048','RESVU – ESTATE – lift service','Completed']]`. QR `[['QR002208','HARBOUR VIEW SP4852 – roof membrane repair','Open'],['QR002210','RESVU – ESTATE – switchboard upgrade','Received'],['QR002201','SP12345 – gutter clean','Received']]`.
      - `openRecord(id)`: `hideMenu()`. SR → find the email whose links include id, then `showSRDetails(email.id,id)`. WO/QR → find the email and link, then `showDialog('Work Order – '+id | 'Quote Request – '+id, hint "Navigation to existing … record. In the real system, this link opens the existing record." + .details grid (Record, Status, Role, Documents, Created from (if from), Related email subject), [Close])`.
      Files: index.html.
      Verify: `node --check`. Headless: email 10 row button "Create WO" opens New Work Order with Strata Plan SP12345 and Submit disabled. Ticking Rapid Plumbing enables it. Submit gives toast "WO620041 submitted", the row shows the WO620041 chip plus "+1", and the status is Done. Email 10 Add link → Link to Work Order shows WO615003 disabled "Already linked". Email 12 Link to QR → Link gives "Linked to QR002208".

- [ ] 8. Full verification (no code changes unless a check fails, in which case fix and re-run).
      a) Syntax check:
      ```
      mkdir -p /tmp/inbox-v2-verify && cd /tmp/inbox-v2-verify && python3 - <<'EOF'
      import re
      s=open('/Users/arjuna/Documents/inbox automation/Inbox_automation/index.html',encoding='utf-8').read()
      for i,m in enumerate(re.findall(r'<script>(.*?)</script>',s,re.S)): open(f'inline{i}.js','w').write(m)
      EOF
      for f in inline*.js; do node --check "$f" && echo "$f ok"; done
      ```
      Expected: every file ok. The `type="text/plain"` WO script is excluded by the regex.
      b) Browser: `cd /tmp/inbox-v2-verify && npm init -y >/dev/null && npm i playwright`. Launch `chromium.launch({channel:'chrome'})` (Google Chrome is installed). If that fails, run `npx playwright install chromium`. Do NOT start a server, because http://127.0.0.1:3000/ is already serving the repo. Write `verify.js` that collects `page.on('console')` errors and `pageerror` (must be zero) and saves screenshots to `/tmp/inbox-v2-verify/shots/`: `01-table.png`, `02-panel-email10.png`, `03-panel-email3.png`, `04-action-menu.png`, `05-new-wo.png`, `06-link-wo.png`, `07-change-not-possible.png`, `08-toast-undo.png`. Open every screenshot with the image reader and check it.
      c) Walk the cr01.md section 13 checklist in the script with assertions, each logged PASS/FAIL. **Skip** the Settings › Features item. The items are:
         - no Type column, filter or 24-hour button
         - the filter has exactly 4 options and the status texts ⊂ {Action needed, Done, No action}
         - email 5: Action needed, "Actions ▾", and no `.smain`
         - no "Retry" text anywhere in the DOM or in any menu
         - every row has `.row-icon`, and clicking it opens `#panel.visible`
         - `.smain` text never matches `/(WO|QR|SR)\d/`, and ▾ lists 6 actions (or 5 when Mark as Other is hidden) with one `✦ Recommended`
         - email 6 chip text contains `QR002215` and `from SR0003`
         - email 10 Create WO gives a new chip, "+1", and clicking "+1" opens the panel with `#linksBox` in view
         - the panel order
         - email 10 pending row, then Done after Create WO
         - L2, L3, L4 (email 2: Change → Create Quote Request, confirm contains "The invoice will be removed from WO613048")
         - L5 (email 3)
         - L6 (WO619624 and SR0003 on email 6)
         - Submit gating, with BlueLine disabled
         - a toast with Undo on each manual action, where Undo restores the row status and panel
         - Work Orders and Calendar navigation
      d) Regression in the same script:
         - the header gear (`.ps-gear`) shows `#settingsView`, then sidebar Inbox (`#navInbox`) shows a working Inbox (rows clickable)
         - sidebar Service Requests opens the register, and View SR on SR0001 opens "Service Request – SR0001"
         - sidebar Email Integration opens "Email Integration – Settings"
         - sidebar Calendar and Work Orders → All show `#woIntegratedView` and the iframe has loaded content, then Inbox returns
      e) Scope: `git diff --stat` shows only index.html. `git diff index.html | grep -E '^[+-]' | grep -E 'ps-|psMs|woModuleEncoded|showIntegratedSection|openAutomationSettings|saveSettings'` returns nothing except the unchanged-context-free lines (expected: no matches).
      Files: none in the repo (scripts and screenshots live in /tmp/inbox-v2-verify).
      Verify: the script exits 0 with all PASS lines and zero console errors, and the screenshots match the spec.

- [ ] 9. Commit. `git add index.html && git commit -m "feat(inbox): Inbox v2 – links model, Action needed/Done/No action status, record chips, AI split action button, rebuilt side panel, link/create dialogs with rules engine and Undo toast"`. Run `git status --short` afterwards: only `?? Instruction/`, `?? .agents/` and any other pre-existing untracked files remain. Do not push.
      Verify: `git log -1 --stat` lists only index.html.

## Final report must include
The pass/fail table for section 13 (Settings item marked skipped by user decision), the regression results, the screenshot paths, decisions D1-D18, and the open point D16 (`.statusline` kept; recommend the user decide whether to remove it).
