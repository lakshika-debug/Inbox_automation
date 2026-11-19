# Implementation Plan: Inbox list redesign + Email Details panel reorder

Only file to edit: `/Users/arjuna/Documents/inbox automation/Inbox_automation/index.html` (static HTML + CSS + vanilla JS, no build).
Work on `main` directly, no worktree. Do **not** commit (the workflow's `commit` step does that), do **not** push, never stage `Instruction/` or `.agents/`.
Verification scripts live in `/tmp/inbox-v2-verify/` (Playwright already installed there; `chromium.launch({channel:'chrome'})`). Never put scripts in the repo.
The static server already runs at `http://127.0.0.1:3000/` (Python SimpleHTTP serving the working tree). Do not start another one.
Artifacts (screenshots, verification report) go in `/Users/arjuna/Documents/inbox automation/Inbox_automation/.agents/tasks/inbox-list/`.

## File map (index.html today, 531 lines, many very long lines)

Line numbers drift as you edit, so locate code by the quoted substrings, not by number.

- Line 7: one long base CSS line (`:root{--blue:#0864e9…` up to the `@media(max-width:620px){…}` block).
- Line 13: `@media(max-width:1250px){.toolbar{…}.toolbar input{width:220px}}`.
- Lines 23-43: "i4T restyle" overrides. Line 23 starts `.main{padding:17px 19px 26px}.breadcrumb{…`. Line 24 `.toolbar{…`. Line 25 `.tablewrap{…}.emailtable…`. Line 26 `.sender{…}.mailaddr{…}.subject{…}.record{…}`. Line 31 `.eye,.dots{…}.eye:hover,.dots:hover{…}.rowactions{gap:6px}`. Line 32 `.footer{…}.pager{…}`. Line 39 `.statusline{…}`. Line 41 `@media(max-width:650px){….toolbar{height:auto;flex-wrap:wrap}…}`.
- Lines 44-49: `.rowactions` and `.row-icon` rules.
- Lines 50-97: "Inbox v2" CSS (`.emailtable .rec,#panel .rec`, split button, `#menu`, `#panel …`, `#shade …`, `#toast …`).
- Lines 98-178: `ps-*` Profile & Account Settings CSS. DO NOT TOUCH. Lines 180-190: `wo-*` CSS. DO NOT TOUCH.
- Line 194: `<main class="main"><div id="inboxView"><div class="breadcrumb">HOME&nbsp; / &nbsp; INBOX</div><h1 class="mainhead">Inbox &nbsp; ⓘ</h1><div class="connected">…</div><div class="sync">Sync Folders: …</div>`.
- Line 195: `<div class="toolbar"><input id="search" …><select id="statusFilter" …>…</select></div>`.
- Line 196: `<div class="tablewrap"><table class="emailtable">…<tbody id="rows"></tbody></table><div class="footer"><span id="count"></span>…pager…</div></div><div class="statusline"><b>Confirmed Phase 1:</b> …</div></div>` (the final `</div>` closes `#inboxView`).
- Lines 197-235: `#settingsView` and `#woIntegratedView`. DO NOT TOUCH.
- Lines 236-237: `.devlabel`, `#overlay`, `#panel > #panelContent`, `#menu`, `#shade` dialog, `#toast`. Keep.
- Lines 238-437: first `<script>`, Inbox JS. Key places:
  - `const emails=[ … ]` (lines 240-253), email objects start `{id:12,`, `{id:11,`, `{id:1,` … `{id:10,`.
  - `let selected=null,menuFor=null;` (line 254).
  - `recordCell`, `actionCell(e,inPanel)`, `openPanel`, `closePanel`, `refresh`, `panelMarkup` (lines 267-296).
  - `snapshot`, `toast` with the Undo handler (lines 400-404).
  - `const GLYPHS={ eye:… };` and `renderRows()` (lines 418-424).
  - Line 437: listeners `document.querySelector('#search').addEventListener('input',renderRows);document.querySelector('#statusFilter').addEventListener('change',renderRows);…;renderRows();`.
- Lines 439-461: `ps*` JS (DO NOT TOUCH, but `psKey(e,fn)` is reused, see D9). Lines 463-521: second `<script>` (WO nav, `showIntegratedSection`, `showInbox`/`showSettings` wrappers). DO NOT TOUCH. Line 523: `woModuleEncoded`. DO NOT TOUCH.

Usage facts checked with grep on the non-encoded part of the file (the WO module runs in an iframe `srcdoc`, so parent CSS cannot reach it):
- `.breadcrumb`, `.mainhead`, `.connected` (the class, not `psConnected`), `.sync`, `.syncbutton`, `.toolbar`, `.tablewrap`, `.emailtable`, `.sender`, `.mailaddr`, `.subject`, `.record`, `.footer`, `.pager`, `.statusline`, `.empty`, `.eye`, `.dots` (CSS), `.row-icon`, `.recs`, `.plus`, `recordCell`, `GLYPHS` are used only by the Inbox list markup / `renderRows` / `recordCell` / `actionCell`'s eye button.
- Still used by the panel: `chip()`, `.rec`, `.rt*`, `.rrole`, `.split/.smain/.smore/.spark`, `.rowactions` (wrapper in `actionCell`), `badge()`, `linkBadge()`, `.badge*`, `.tags`, `.section`, `.meta`, `.message`, `.attachment`, `.btn.mini`.
- `openPanel(id,'links')` has one caller today: the `+n` button inside `recordCell` (being removed). Keep the parameter working anyway.
- The overlay has `pointer-events:none` (override line 33), so list rows stay clickable while the panel is open. Clicking another row switches the panel.

## Decisions

D1. **Class prefix.** All new CSS classes start with `ib-`. Existing generic classes (`.main`, `.role`, `.menu`, `.btn`, `.badge`, `.tabs`, `.field`, `.empty`) are not reused for the list.
D2. **Keep element ids** `#search`, `#statusFilter`, `#rows`, `#count` and move them into the new markup. The existing listener line and `renderRows()` callers keep working and the diff stays small. `#rows` becomes a `<div>` list container. New ids: `#ibUnreadPill`, `#ibMarkAll`, `#ibTabAll`, `#ibTabUnread`, `#ibCntAll`, `#ibCntUnread`, `#ibSort`.
D3. **State.** Search, status and sort are read from their controls (`#search`, `#statusFilter`, `#ibSort`) on each render, like today. New globals: `let ibTab='all'` (`'all'|'unread'`) and `let ibKeep=null` (see D5). `selected` stays the open email id.
D4. **Unread model.** Email objects 12, 3, 4, 5 get `unread:true`. The others have no `unread` property and count as read. `openPanel(id)` sets `unread=false`. "Mark all as read" sets every email to read and shows `toast('All emails marked as read')` with no Undo. The button is disabled when nothing is unread (the global `button:disabled` style applies).
D5. **Unread tab and the open email.** When you open an unread email from the Unread tab, it becomes read but stays listed (with the current-row style) until the panel closes, you change tabs, or you open another email. Rows otherwise vanish under the cursor. Implementation: `openPanel` sets `ibKeep=id` when the email was unread, keeps it if `ibKeep===id`, and sets it to `null` otherwise. `closePanel` and `ibSetTab` clear it. The Unread filter is `e.unread||e.id===ibKeep`. Header pill and tab counts always show the true unread count.
D6. **Undo and read state.** Read/unread is not part of Undo. In the toast Undo handler, copy the current `emails[i].unread` onto `s.email` before restoring it. Undo can then never bring back a stale unread dot. Mark all as read does not touch `prevState`.
D7. **Counts.** Tab counts: "All emails" = `emails.length` (12), "Unread" = number unread. Neither depends on search or status. Group header counts, the list and the footer `Showing X of 12 emails` follow the current tab + status + search. A group header uses `1 email` for a count of 1 and `n emails` otherwise. The header pill reads `n unread` (shown even when it reads `0 unread`).
D8. **Dates.** Every `date` string has the form `dd/mm/yyyy hh:mm AM|PM`. Parse it with one regex helper and build no time-zone-sensitive strings. Row label: `${Number(dd)} ${Mon} · ${Number(hh)}:${mm} ${AP}`, for example `30 Oct · 2:05 PM`, `3 Oct · 8:26 AM`, `21 Sep · 12:36 PM`. The sort key is `new Date(y,m-1,d,h24,mi).getTime()`, where h24 = `hh%12 + (PM?12:0)`. Ties are broken by id, following the sort direction. Month group label: `October 2026`. Groups and the rows inside them follow the sort (Newest first = descending).
D9. **Row interaction.** Each row is a `<div class="ib-row" role="button" tabindex="0" data-id="…" onclick="openPanel(id)" onkeydown="psKey(event,()=>openPanel(id))">`. `psKey` is the existing Enter/Space helper that the sidebar Inbox nav already uses. It calls `preventDefault`, so Space does not scroll. The current row gets `aria-current="true"`.
D10. **Attachment chips** show the real file name (max-width 150px, ellipsis, `title` = full name). They are not separately clickable; a click opens the panel like the rest of the row.
D11. **Status badge in rows** uses new `ib-st` classes with the mock colours. The panel header keeps the existing `badge(st)`.
D12. **Current row style** is `background:#e3edff; box-shadow: inset 3px 0 0 #1a6dff`. The inset shadow draws the 3px blue left border without shifting the content.
D13. **Muted text colour** is `#6b7480` (the colour the app already uses for muted text) rather than a lighter grey, because 11px text on the `#f0f5ff` unread background needs the contrast. Dark text is `#1d2433`, blue is `#1a6dff`.
D14. **Panel order** (Part B): header eyebrow `Email Details`, then AI card → `Email thread` (old "Original Email" content unchanged, `id="threadBox"`) → `Linked records (n)` (`#linksBox`, unchanged) → `AI-filled details` (only when `e.fields`) → sticky footer (unchanged). The thread has no fake earlier replies.
D15. **`openPanel(id,'links')` scroll.** Now that `#linksBox` sits below the thread, `scrollIntoView({block:'nearest'})` would leave it under the sticky footer. Replace it with `const p=document.querySelector('#panel'),b=document.querySelector('#linksBox');if(b)p.scrollTop=b.offsetTop-p.querySelector('.panelhead').offsetHeight-8;`. `#panel` is the box's offsetParent because it is `position:fixed`.
D16. **Toast placement.** Existing logic stays: above 1000px the CSS rule `#panel.visible~#toast` keeps the toast left of the panel; at 1000px and below, `toast()` sets an inline `bottom` above `.panelfoot`. Add one trivial fix: `closePanel()` sets `document.querySelector('#toast').style.bottom=''`, so a visible toast drops back to its normal place when the panel closes. The new list adds one toast with no panel involved (Mark all as read), and the existing logic handles it.
D17. **Dead code removal.** Remove `recordCell`, `GLYPHS`, and the `inPanel`/eye branch of `actionCell`. `actionCell(e)` keeps the `rowactions` wrapper and split button, and `panelMarkup` calls `actionCell(e)`. Remove CSS that only served the table, toolbar, old header, pager, statusline, eye/dots and row-icon. Change `.emailtable .x,#panel .x` selectors to `#panel .x` and delete the selectors that become empty (`.recs`, `.plus`). Leave the document click handler's `.closest('.dots')` check alone: it is harmless and lives outside the list code.
D18. **Not added:** Sync Now, Auto (every 5 mins), pager, `ⓘ`, per-row actions or record chips, focus restore to the row after the panel closes (the old table did not do it either).

## Expected data facts (use in checks)

- Newest-first order: `12, 11, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10`. Oldest-first order: the reverse.
- Groups: `October 2026 · 7 emails` (12, 11, 1, 2, 3, 4, 5) and `September 2026 · 5 emails` (6, 7, 8, 9, 10).
- Status: Action needed = 12, 3, 4, 5, 8, 10 (6). Done = 11, 1, 2, 6, 7 (5). No action = 9 (1).
- Unread at load: 12, 3, 4, 5. Rows with no attachments: 6, 9. Email 12 has `Roofline_Quote_311.pdf`, `photos.zip`.
- Next IDs: SR0005, QR002217, WO620041.

---

# Implementation Plan

- [ ] 1. Capture a computed-style baseline before any edit.
      Write `/tmp/inbox-v2-verify/inbox-list-baseline.js`. At 1440x900 it loads `http://127.0.0.1:3000/` and records `getComputedStyle` (`font-size, font-weight, color, background-color, padding, margin, border, border-radius, display, width, height`) for: `.top`, `.sidebar`, `.nav.active`, `.devlabel`. It then clicks the header gear (`.ps-gear`) and records `#settingsView .ps-title`, `.ps-card`, `.ps-tab.active`, `.ps-sec-h`, `.ps-toggle`, `.ps-subtab.active`, `.ps-foot .ps-pill`. It clicks the Email Integration sub-tab (`#psSubEmail`) and records `#psSignMs`. It returns to Inbox with `showInbox()`, opens the panel with `openPanel(3)`, and records `#panel .panelhead`, `.ptitle`, `#panel .ai`, `#linksBox h3`, `#panel .lrow`, `#panel .rec`, `#panel .rt-SR`, `#panel .smain`, `#panel .smore`, `#panel .panelfoot`, `#panel .kv .k`, `#panel .attachment`, `#panel .tags .badge`. It opens the create form with `runAction('create-qr',3)` and records `.dhead`, `#shade .opt`, `#shade .ai`. Use the first match of each selector and record `null` if none matches. Write the result to `/tmp/inbox-v2-verify/inbox-list-baseline.json`.
      Files: /tmp/inbox-v2-verify/inbox-list-baseline.js (outside repo)
      Verify: `cd /tmp/inbox-v2-verify && node inbox-list-baseline.js` exits 0 and the JSON has a non-null entry for every selector listed above. `git -C "/Users/arjuna/Documents/inbox automation/Inbox_automation" status --short` still shows only `?? .agents/` and `?? Instruction/`.

- [ ] 2. Write the verification script, grouped and runnable per group.
      Write `/tmp/inbox-v2-verify/inbox-list.js`, modelled on `/Users/arjuna/Documents/inbox automation/Inbox_automation/.agents/tasks/inbox-v2/verify.js` (`rec(group,name,ok,detail)`, console/pageerror capture, a `fresh()` reload per group). Group names come from argv; no args runs all groups. Screenshots go to `.agents/tasks/inbox-list/shots/`, results JSON to `/tmp/inbox-v2-verify/inbox-list-results.json`. Exit code 1 if any check fails. Locate rows with `#rows .ib-row[data-id="N"]`. Groups and checks:
      - `helpers`: in-page `ibWhen(find(12))==='30 Oct · 2:05 PM'`, `ibWhen(find(5))==='3 Oct · 8:26 AM'`, `ibWhen(find(6))==='21 Sep · 12:36 PM'`; `ibTime(find(1))>ibTime(find(2))>ibTime(find(3))`.
      - `header`: `.ib-crumb` text is `Home / Inbox` (whitespace-normalised). `h1` text is exactly `Inbox` (no `ⓘ`). `#ibUnreadPill` reads `4 unread`. Header text contains `Connected: developer@i4tglobal.onmicrosoft.com` and `Sync folder: Inbox`. No `.toolbar`, no `table` inside `#inboxView`, no `.statusline`. Body text does not contain `Confirmed Phase 1`, `Sync Now` or `Auto (every 5 mins)`. `#search` placeholder is `Search sender, subject or email...`. `#ibMarkAll` text contains `Mark all as read`.
      - `list`: tab texts `All emails 12` / `Unread 4`. `#ibTabAll` has `aria-selected="true"`. `#statusFilter` options are `All statuses|Action needed|Done|No action`. `#ibSort` options are `Newest first|Oldest first`. Row id order is the newest-first order from "Expected data facts". `.ib-group` texts are `October 2026 · 7 emails` and `September 2026 · 5 emails`. Row 12: sender `Roofline Contractors`, address `admin@roofline.com.au`, subject `Quotation – roof membrane repair`, badge `Action needed` with computed background `rgb(255, 244, 229)`, chips `Roofline_Quote_311.pdf|photos.zip`, date `30 Oct · 2:05 PM`, class `ib-unread`, a `.ib-udot` present, computed row background `rgb(240, 245, 255)`. Row 11: no `ib-unread`, white background, no `.ib-udot`. Rows 6 and 9 have no `.ib-l3`. Badge counts: 6 / 5 / 1. `#rows` contains no `.rec`, `.smain`, `.smore`, `.row-icon` or `button`. `#count` reads `Showing 12 of 12 emails`. The legend text contains `Unread` and `Read emails appear on white`. Selecting `Oldest first` reverses the row order and puts `September 2026` first. Screenshot `list-1440.png`.
      - `filters`: for each status value, every row badge equals that value and `#count` reads `Showing 6|5|1 of 12 emails`. With Action needed the groups read `October 2026 · 4 emails` and `September 2026 · 2 emails`. With No action the only group reads `September 2026 · 1 email`. Search `roofline` → row ids `[12]`. Search `QR002210` → `[11]`. Search `zzz` → `.ib-empty` text `No emails match these filters.` and `Showing 0 of 12 emails`.
      - `unread`: click `#ibTabUnread` → rows `[12, 3, 4, 5]`, tab `aria-selected` switches. Click row 3 → panel visible, pill `3 unread`, Unread tab text `Unread 3`, row 3 still listed with `ib-current` and without `ib-unread`. Close with `#panel .close` → rows `[12, 4, 5]`. Back on the All tab, row 3 has a white background.
      - `keyboard`: `row(4).focus()` then Enter → panel shows email 4's subject. Escape → panel hidden. Focus row 5 and press Space → panel opens on email 5 and `window.scrollY` is unchanged.
      - `markall`: click `#ibMarkAll` → toast text `All emails marked as read`, no `#undoBtn`, pill `0 unread`, zero `.ib-unread` rows, `#ibMarkAll` disabled.
      - `current`: click row 11 → only row 11 has `ib-current` and `aria-current="true"`, and its computed `box-shadow` contains `3px`. Click row 1 → current style moves to row 1.
      - `panel`: open email 3. The eyebrow (first div inside `.paneltop > div`) text is `Email Details`. The `.panelbody` children in order are `.ai`, then sections whose `h3` texts contain `Email thread`, `Linked records (1)`, `AI-filled details`. Panel text has no `Original Email`. `#threadBox` contains `From`, `To`, `Received`, the body text and `Attachments (1)` with a `Preview ↗` button. `.panelfoot .split .smain` text contains `Create QR`. Open email 9 (no fields) → sections are `Email thread`, `Linked records (0)` only. `openPanel(3,'links')` → `#linksBox` top ≥ `.panelhead` bottom and < `.panelfoot` top. Screenshot `panel-1440.png`.
      - `actions`: email 3: footer `.smain` → dialog `New Quote Request`. Pick strata `RESVU – ESTATE`, check `#c1`, click `#submitForm` → toast `QR002217 submitted` with `#undoBtn`. Click Undo → panel `Linked records (1)` and the SR0001 row status `Open`; `find(3).unread===false` and the pill is unchanged. Email 12: AI card `.change` → `#menu` visible, `Link to Quote Request` carries `✦ Recommended`. Click it, keep the default result, click Link → toast `Linked to QR002208` and row 12's badge is now `Done`. Email 11: link `.kebab` → menu `Open record` → dialog title `Quote Request – QR002210`, then close. Kebab → `Remove link` → confirm → toast `Link to QR002210 removed`, then Undo restores it. Email 5: `.smore` (Actions ▾) → `Create Service Request` → toast `SR0005 created`. `＋ Add link` opens a menu whose header is `Add link`. Clicking a `.rec` chip in the panel opens its record dialog.
      - `toast`: at 900x800, open email 4 → `.smore` → `Create Service Request` → the toast rect bottom is ≤ the `.panelfoot` rect top. Close the panel → `#toast.style.bottom===''`. At 1440x900, repeat with email 5 → the toast rect right is ≤ the `#panel` rect left.
      - `responsive`: at 600x900 and 390x844, `document.documentElement.scrollWidth<=innerWidth`. Row 12's `.ib-date` top is ≥ its `.ib-subj` bottom. Tabs and filters are all visible (non-zero rects). Screenshots `list-600.png`, `list-390.png`, and at 390 also `panel-390.png` after opening email 3.
      - `regression`: rerun the baseline collection from item 1 and compare every property with `/tmp/inbox-v2-verify/inbox-list-baseline.json` (all must match). Settings: click `#psSignMs` → `#psConnected` visible, then `#psDisconnect` → `#psSignIn` visible. Sidebar `Service Requests` → dialog title `Service Requests – Active and Archived`. Sidebar `Email Integration` → dialog title `Email Integration – Settings`, then `Save Configuration` → toast contains `Email-to-SR automation`. `#navWoAll` click → `#woIntegratedView` visible and the iframe body text is non-empty. `#navInbox` click → `.ib-row` count is 12. `.devlabel` text contains `PROTOTYPE · Demonstration data`. No console errors or page errors across all groups.
      Files: /tmp/inbox-v2-verify/inbox-list.js (outside repo)
      Verify: `cd /tmp/inbox-v2-verify && node inbox-list.js regression` passes against the unchanged file, which proves the harness and baseline agree. Running `node inbox-list.js header` fails at this point, as expected.

- [ ] 3. Add the unread data and the list helpers/state (no UI change yet).
      Insert `unread:true,` right after `id:12,`, `id:3,`, `id:4,`, `id:5,` in the `emails` array. After `let selected=null,menuFor=null;` add `let ibTab='all',ibKeep=null;`. Next to `statusOf`, add these helpers:
      - `ibParts(e)`: regex `/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}) (AM|PM)$/` → `{d,m,y,h,mi,ap}` as numbers plus `ap`.
      - `ibTime(e)`: sort key per D8.
      - `ibWhen(e)`: row label per D8.
      - `ibMonth(e)`: `October 2026`.
      - `ibBadge(st)`: `<span class="ib-st ib-st-need|ib-st-done|ib-st-none">st</span>`.
      Use a `const IB_MON=['January',…]` array and `.slice(0,3)` for the short month.
      Files: index.html
      Verify: `node inbox-list.js helpers regression` passes. The old table still renders, because `renderRows` is unchanged.

- [ ] 4. Replace the Inbox header + table with the email-list markup, CSS and rendering (Part A core).
      (a) HTML: in `#inboxView`, replace everything from `<div class="breadcrumb">` up to the closing `</div>` of `.statusline` (keep the final `</div>` that closes `#inboxView`). The new markup:
      `<div class="ib-crumb">Home <span>/</span> <b>Inbox</b></div>`
      `<div class="ib-headrow"><h1 class="ib-h1">Inbox</h1><span class="ib-pill" id="ibUnreadPill">4 unread</span><span class="ib-conn"><i class="ib-dot"></i>Connected: developer@i4tglobal.onmicrosoft.com</span></div>`
      `<div class="ib-sync">Sync folder: <b>Inbox</b></div>`
      `<div class="ib-card">`. Inside the card:
      - `.ib-top`: `<label class="ib-search">` with an inline magnifier SVG and `<input id="search" placeholder="Search sender, subject or email..." aria-label="Search emails">`, then `<button type="button" class="ib-markall" id="ibMarkAll" onclick="ibMarkAllRead()">` with a green check SVG and `Mark all as read`.
      - `.ib-tabsrow`: `<div class="ib-tabs" role="tablist">` holding `<button type="button" role="tab" class="ib-tab" id="ibTabAll" onclick="ibSetTab('all')">All emails <span id="ibCntAll">12</span></button>` and the same for `ibTabUnread` / `Unread <span id="ibCntUnread">4</span>`. Then `<div class="ib-filters">` with the existing `#statusFilter` select (same options) and `<select id="ibSort" aria-label="Sort"><option value="desc">Newest first</option><option value="asc">Oldest first</option></select>`.
      - `<div id="rows" class="ib-list"></div>`.
      - `.ib-foot`: `<span id="count"></span>` and `<span class="ib-legend"><i class="ib-udot"></i> Unread · Read emails appear on white</span>`.
      (b) CSS: add a block `/* Inbox email list (ib-) */` right before the `/* Profile & Account Settings view */` comment, with these values:
      - `.ib-crumb`: 11px, `#6b7480`, `b` regular `#1d2433`, margin `0 0 10px`.
      - `.ib-headrow`: flex, wrap, centre, gap 8px.
      - `.ib-h1`: margin 0, 20px, 700, `#1d2433`.
      - `.ib-pill`: `#e8f0ff` / `#1a6dff`, radius 10px, padding `2px 8px`, 11px, 600.
      - `.ib-conn`: `margin-left:auto`, 11px, muted, inline-flex, gap 6px. `.ib-dot`: 8px, `#1b9f4d`, round.
      - `.ib-sync`: 11px, muted, margin `6px 0 14px`, `b` `#1d2433` 600.
      - `.ib-card`: `#fff`, `1px solid #e3e7ee`, radius 8px, `box-shadow:0 1px 3px #1d24330d`, `overflow:hidden`.
      - `.ib-top`: flex, space-between, wrap, gap 10px, padding `12px 16px`.
      - `.ib-search`: relative, width 250px, `max-width:100%`. The input fills 100%, height 30px, `1px solid #d9dee6`, radius 4px, padding-left 28px, 12px. The SVG is absolute at left 9px, 14px, muted stroke.
      - `.ib-markall`: inline-flex, gap 6px, `1px solid #d9dee6`, `#fff`, radius 4px, padding `6px 12px`, 11px, `#1d2433`. Its SVG is 13px with stroke `#2f9e55`.
      - `.ib-tabsrow`: flex, space-between, align centre, wrap, gap 8px, padding `0 16px`, bottom border `#e3e7ee`.
      - `.ib-tab`: no border/background, `border-bottom:2px solid transparent`, `margin-bottom:-1px`, padding `10px 2px`, margin-right 18px, 12px, 600, `#5b6470`. The count span is muted with margin-left 4px. `.ib-tab.ib-on` (and its span): `#1a6dff` with a `#1a6dff` underline.
      - `.ib-filters`: flex, gap 8px, padding `6px 0`, wrap. Its selects: height 28px, `1px solid #d9dee6`, radius 4px, `#fff`, 11px, padding `0 8px`, `#333c45`.
      - `.ib-group`: `#f5f7fa`, padding `6px 16px`, 11px, `#1d2433`, bottom border `#eef0f4`. `b` 600, `span` muted.
      - `.ib-row`: grid `16px minmax(0,1fr) auto`, centre, column-gap 8px, min-height 65px, padding `10px 16px 10px 8px`, bottom border `#eef0f4`, `#fff`, pointer.
        - Hover `#f7f9fc`. `.ib-unread` `#f0f5ff`, hover `#e8f0ff`. `.ib-current` per D12 (also on hover). `:focus-visible` outline `2px solid #1a6dff` with offset -2px.
        - `.ib-gut`: flex, centre. `.ib-udot`: inline-block, 8px, round, `#1a6dff`.
      - Row lines:
        - `.ib-l1`: flex, gap 6px, baseline, min-width 0, 11px. `.ib-from`: 600, `#1d2433`, nowrap. `.ib-addr`: muted, ellipsis.
        - `.ib-l2`: flex, centre, gap 8px, margin-top 4px, min-width 0. `.ib-subj`: 12.5px, `#1d2433`, ellipsis, nowrap; `.ib-unread .ib-subj` is 700.
        - `.ib-st`: `flex:none`, 10px, 600, radius 3px, padding `2px 6px`. `.ib-st-need` `#fff4e5/#b4690e`, `.ib-st-done` `#e8f6ec/#2f7a45`, `.ib-st-none` `#f0f1f3/#5b6470`.
        - `.ib-l3`: flex, wrap, gap 6px, margin-top 6px. `.ib-att`: inline-flex, gap 4px, `max-width:150px`, `1px solid #dfe3ea`, radius 4px, padding `2px 6px`, 10px, `#5b6470`, `#fff`. Its inner span has an ellipsis; its SVG is 11px, stroke only.
        - `.ib-date`: 11px, muted, nowrap, right-aligned. `.ib-unread .ib-date`: 700, `#1d2433`.
      - `.ib-empty`: padding 36px, centred, muted.
      - `.ib-foot`: flex, space-between, wrap, gap 8px, padding `10px 16px`, 11px, muted. The legend dot has margin-right 4px.
      - `@media(max-width:700px)`: `.ib-row` grid `16px minmax(0,1fr)` with `.ib-date{grid-column:2;text-align:left;margin-top:4px}`; `.ib-search{width:100%}`; `.ib-tabsrow{padding:0 10px}`; `.ib-top,.ib-foot{padding-left:10px;padding-right:10px}`; `.ib-conn{margin-left:0;width:100%}`.
      (c) JS: rewrite `renderRows()` (same name, same place).
      - Read `q`, `s` and `asc=#ibSort.value==='asc'`. Compute `unreadN`. Set `#ibUnreadPill` to `${unreadN} unread`, `#ibCntAll` to `emails.length`, `#ibCntUnread` to `unreadN`, and `#ibMarkAll.disabled=!unreadN`. Toggle `ib-on` and `aria-selected` on both tabs from `ibTab`.
      - Filter with `(ibTab==='all'||e.unread||e.id===ibKeep)` + status + the same search haystack as today (`[e.sender,e.address,e.subject,...e.links.map(l=>l.id)]`). Sort by `ibTime` with the id tie-break (D8). Set `#count` to `Showing ${n} of ${emails.length} emails`.
      - Emit `.ib-group` headers when `ibMonth` changes, with that group's count (D7). Rows use the D9 attributes, the `ib-unread`/`ib-current` classes, a gutter dot when unread, l1/l2 (`ibBadge(statusOf(e))`)/l3 (only when `e.attachments.length`) and `.ib-date` (`ibWhen`). Escape every value with `escapeHtml`. Empty result: `<div class="ib-empty">No emails match these filters.</div>`.
      Add `function ibSetTab(t){ibTab=t;ibKeep=null;renderRows();}` and `function ibMarkAllRead(){emails.forEach(e=>e.unread=false);renderRows();toast('All emails marked as read');}`.
      In `openPanel`, after `selected=Number(id);hideMenu();`, add `const em=find(id);if(em){if(em.unread){em.unread=false;ibKeep=em.id;}else if(ibKeep!==em.id)ibKeep=null;}`. Keep the rest, including the existing `renderRows()` call. In `closePanel`, add `ibKeep=null;` before its `renderRows()`. On the listener line, add `document.querySelector('#ibSort').addEventListener('change',renderRows);` next to the `#statusFilter` listener.
      Files: index.html
      Verify: `node inbox-list.js helpers header list filters unread keyboard markall current regression` all pass. The `regression` group passes too: panel styles are unchanged so far, and the old `.emailtable`/`.toolbar` CSS that is still present matches nothing.

- [ ] 5. Reorder the side panel, rename labels, fix the links scroll, keep Undo from touching read state, clear the toast offset on close (Part B).
      In `panelMarkup`:
      - Change the eyebrow text `INBOX / EMAIL DETAILS` to `Email Details` (keep the inline style).
      - Rebuild the return expression in this order: panelhead (unchanged), `<div class="panelbody">` + AI card (unchanged) + the thread section + the `#linksBox` section (unchanged) + `fields` + `</div>` + panelfoot.
      - Thread section: the former "Original Email" section moved up, with `id="threadBox"` and its h3 changed to `✉ &nbsp; Email thread`. Its inner content (From/To/Received meta, body, attachments with Preview) stays byte-for-byte the same.
      - The closing `</div>` of `.panelbody` must now come after `fields`; today it sits at the end of the Original Email string.
      In `openPanel`, replace `if(focus==='links')document.querySelector('#linksBox')?.scrollIntoView({block:'nearest'});` with the D15 scroll code, still guarded by `focus==='links'`. In the `toast` Undo handler, change `emails[i]=s.email;` to `s.email.unread=emails[i].unread;emails[i]=s.email;` (D6). In `closePanel`, add `document.querySelector('#toast').style.bottom='';` (D16).
      Files: index.html
      Verify: `node inbox-list.js panel actions toast unread regression` all pass (the baseline style diff includes the panel selectors).

- [ ] 6. Remove dead list-only JS and CSS.
      JS:
      - Delete `function recordCell(e){…}` and `const GLYPHS={ eye:… };` (the 3-line block).
      - Change `function actionCell(e,inPanel){` to `function actionCell(e){`, delete the `const eye=…;` line, and return `<div class="rowactions">${drop}</div>`.
      - In `panelMarkup`, change `actionCell(e,true)` to `actionCell(e)`.
      CSS (exact rule removals; leave everything else on each line intact):
      - Line 7 base: `.breadcrumb{…}`, `.mainhead{…}`, `.connected{…}`, `.connected .dot{…}`, `.sync{…}`, `.syncbutton{…}`, `.toolbar{…}`, `.toolbar input,.toolbar select{…}`, `.toolbar input{…}`, `.toolbar select{…}`, `.tablewrap{…}`, every `.emailtable…{…}` rule, `.sender{…}`, `.mailaddr{…}`, `.subject{…}`, `.record{…}`, `.eye,.dots{…}`, `.eye:hover,.dots:hover{…}`, `.dots{…}`, `.footer{…}`, `.pager{…}`, `.empty{…}`, `.statusline{…}`. Inside `@media(max-width:900px){…}` remove only `.toolbar input{width:190px}`. Inside `@media(max-width:620px){…}` remove only `.toolbar{gap:5px;padding:5px}.toolbar input{width:130px}.toolbar select{min-width:100px;width:106px}`.
      - Delete the whole line `@media(max-width:1250px){.toolbar{…}.toolbar input{width:220px}}`.
      - Override line starting `.main{padding:17px 19px 26px}`: keep `.main{padding:17px 19px 26px}` and remove the `.breadcrumb`, `.mainhead`, `.connected`, `.connected .dot`, `.sync` and `.syncbutton` rules.
      - Delete the whole lines starting `.toolbar{height:63px`, `.tablewrap{border-radius:0 0 3px 3px`, `.sender{color:#424a53`, `.footer{font-size:11px` and `.statusline{font-size:10px`.
      - Line starting `.eye,.dots{color:#151a1f`: keep only `.rowactions{gap:6px}`.
      - In `@media(max-width:650px){…}` remove only `.toolbar{height:auto;flex-wrap:wrap}`.
      - Delete the 4 `.row-icon…` lines. Keep the `/* Contextual row action icons… */` comment's following `.rowactions{display:flex;…}` line.
      - In the Inbox v2 block: delete `.emailtable .recs,#panel .recs{…}` and `.emailtable .plus{…}`. In every other rule, drop the `.emailtable …,` selector parts so they read `#panel .rec`, `#panel .rec:hover`, `#panel .rt`, `#panel .rt-WO`, `#panel .rt-QR`, `#panel .rt-SR`, `#panel .rec .rrole`, `#panel .split`, `#panel .smain`, `#panel .smore`, `#panel .split.only .smore`, `#panel .spark,#shade .spark`.
      After the edits, the only remaining matches for `emailtable|toolbar|tablewrap|statusline|recordCell|GLYPHS|row-icon` must be inside `woModuleEncoded`, which is base64, so plain-text matches are false positives.
      Files: index.html
      Verify: `cd /tmp/inbox-v2-verify && node inbox-list.js` (all groups) passes, including `regression`, whose computed-style diff proves no settings or panel style changed. `git -C "/Users/arjuna/Documents/inbox automation/Inbox_automation" diff --stat` lists only `index.html`.

- [ ] 7. Final full verification and report.
      Run every group at 1440x900, and the `responsive` and `toast` groups at their sizes. Look at the screenshots (`list-1440.png`, `panel-1440.png`, `list-600.png`, `list-390.png`, `panel-390.png`). Confirm:
      - the list reads as an email inbox per Part A,
      - the panel order is AI card → Email thread → Linked records → AI-filled details → footer,
      - nothing scrolls horizontally.
      Confirm with `git diff -U0 index.html` that no hunk touches `#settingsView` markup, `ps-` CSS, `ps*` functions, the second `<script>` block or `woModuleEncoded`. Write `.agents/tasks/inbox-list/verification.md`, listing each group with PASS/FAIL, the screenshot paths, and decisions D4-D7, D15 and D16 as behaviour notes for the user.
      Files: .agents/tasks/inbox-list/verification.md (artifact, not staged), screenshots under .agents/tasks/inbox-list/shots/
      Verify: `cd /tmp/inbox-v2-verify && node inbox-list.js` exits 0 with zero FAIL lines and no console/page errors. `git status --short` shows ` M index.html`, `?? .agents/`, `?? Instruction/` only.

## Gaps and assumptions

- The mock image was not available to the planner. Layout values come from the brief's description. Where the brief gives a range (~65px row, ~250px search), the plan uses that value.
- The "Mark all as read" green check sits inside the outlined button, before the label.
- The header pill stays visible at `0 unread` rather than hiding, so the header row does not jump.
- `Instruction/cr01.md` rules (links model, statuses, dialogs, Undo) are unchanged. Only how the list displays them and the panel order change.
