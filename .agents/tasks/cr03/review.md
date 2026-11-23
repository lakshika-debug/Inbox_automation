# CR03 duplicate handling – review (iteration 1)

## Scope
- `git status`: only `index.html` is modified. Untracked: `.agents/tasks/cr03/`, `.agents/tasks/cr05-fixes/`, `Instruction/cr03.md`, `assets/logo 1.png`, `assets/logo 2.png`. Nothing is staged.
- `git diff` (3 insertions, 1 deletion):
  - Seed email `id:13` at index.html:317, placed between ids 12 and 11.
  - One comment line and one changed `aiText` line in `panelMarkup` (index.html:410, 413). The change adds `.replace(/^(Repeated request:)(.*?)(SR\d+)/,'<b>$1</b>$2<b>$3</b>')` after `escapeHtml(e.ai)`, using the same technique as 'Recommended Action:'. The regex is anchored, so it only affects email 13. `e.ai` stays plain text.
- No changes to list layout, tabs, pager, menus, dialogs, rules, Settings, the SR register, the WO module or other emails' data. No Change link, no ✦ split button (`recommended:null`), no 'Link to Service Request' action, and no detection engine.

## Requirements against the seed data
- **Sender and recipients:** Liam Carter <building.manager@resvu.example>, To developer@i4tglobal.onmicrosoft.com, Cc Tommy Gennusa. This matches email 3's addresses (index.html:321).
- **Thread:** 2 messages, at 08:10 AM (with lot12_ceiling.jpg) and 11:40 AM on 30/10/2026. Both are after email 3's 29/10/2026 10:36 AM, and `e.date` is the newest message. `unread:true`, `links:[]`.
- **Text:** `pending`, `ai` and `why` match decision 3.
- **Fields:** added per decision 6, with Priority High.
- **Dismiss:** `dismissEmail`/`doDismiss` (index.html:458-466) only look at `e.links`. Email 13 has no links, so it gets no confirmation dialog and SR0001 is not cancelled. `flagAgain` restores `pending` and `recommended` from `e.dismissed`.

## Coder evidence
`verification.md` records:
- `node --check` passing on 3 inline scripts.
- New suite cr03dup 57/57, plus cr05fix 153/153, cr05 256/256, cr02 150/150, cr03 265/265, cr04 96/96 and qa13 40/40. No page or console errors.
- Every changed expectation is listed, and all are attributable to the 13th email.
- The SR register and View SR checks appear in cr03dup.log lines 41-42.

## Independent browser checks
Script: `/tmp/cr03dup-verify/review/rev.js`. It ran Playwright with `chromium.launch({channel:'chrome'})` against the existing server at http://127.0.0.1:3000/ (HTTP 200). Result: **22/22 PASS**.

**List**
- Counts are All 13, Unread 5, Action needed 7.
- The pager reads "Showing 1 to 10 of 13 entries". The first group is "October 2026 · 8 emails". Page 2 shows "11 to 13 of 13" with 3 rows.
- Row 13 shows Liam Carter with count 2, the Action needed flag, 0 chips and the unread class.
- Searching "Liam" returns [13].

**Panel**
- AI line innerText is exactly "Repeated request: a Service Request already exists, SR0001 (raised by Tommy Gennusa, 29/10/2026)". The bold elements are exactly ["Repeated request:","SR0001"].
- Subtext is exact.
- The buttons are ["Actions ▾","Dismiss"], with no `.spark` or `.smain`.
- The thread has 2 messages, newest first (11:40 then 08:10). Each date is flush top-right (gap 0) and each message shows the Cc to Tommy.

**Dismiss**
- No in-app dialog or browser dialog opened.
- Action needed went from 7 to 6, and the row flag cleared.
- `srRegistry.SR0001` and email 3's link both stay Open, email 3 stays flagged, and no new SR was created.
- The panel shows the repeated-request line and "Dismissed by … · Flag again".
- Email 3's Linked records show SR0001 Open.

**Flag again**
- The line, the buttons, the `pending` text and the Action needed count of 7 all came back.

**Layout and errors**
- No horizontal scroll at 390, 700 or 1440 px, with the panel open or closed.
- No page or console errors.

## Screenshots viewed
- `shots/list-1440.png`: Liam Carter 2 is the second row in October 2026 with the Action needed flag, no chip and the unread dot. The counts read 13/5/7.
- `shots/email13-panel-1440.png`: bold "Repeated request:" and "SR0001", the subtext, Actions ▾ and Dismiss, the Yara logo top-right, the thread newest first with dates top-right, and Linked records (0) with the pending reason.
- `shots/email13-panel-390.png`: the same layout. The text wraps inside the AI box and nothing overflows.

## Blockers
None.
