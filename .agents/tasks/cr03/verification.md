# CR03 duplicate handling – verification (iteration 1)

No review.json existed, so this iteration implements the task. Only `index.html` changed (`git diff --stat`: 3 insertions, 1 deletion). Nothing is staged or committed.

## Change
1. New seed email `id:13`, placed in the array between 12 and 11. The list's date sort puts it in the same place.
2. `panelMarkup`: after escaping, `.replace(/^(Repeated request:)(.*?)(SR\d+)/,'<b>$1</b>$2<b>$3</b>')` bolds the label and the SR id. The regex is anchored, so it only fires when `e.ai` starts with "Repeated request:". A one-line comment was added. `e.ai` stays plain text.

## Seeded content of email 13
- **Sender:** Liam Carter `<building.manager@resvu.example>`.
- **Subject:** "Leak from ceiling – Lot 12, RESVU ESTATE".
- **State:** `unread:true`, `links:[]`, `recommended:null`. `date` is 30/10/2026 11:40 AM, the newest message.
- **Thread** (2 messages, both To developer@i4tglobal.onmicrosoft.com, Cc Tommy Gennusa <tommy.gennusa@testdata.net.au>):
  1. **30/10/2026 08:10 AM:** found water leaking from the bathroom ceiling in Lot 12 at RESVU ESTATE during the morning check, likely a pipe above, asks for a plumber. Attaches `lot12_ceiling.jpg`.
  2. **30/10/2026 11:40 AM:** follow-up saying water is now coming through the ceiling of the unit below, and asking for an update on when the plumber will attend. No attachments.
- **pending:** "Repeated request: SR0001 already covers this leak at RESVU – ESTATE, Lot 12. Review and choose an action if needed."
- **ai:** "Repeated request: a Service Request already exists, SR0001 (raised by Tommy Gennusa, 29/10/2026)".
- **why:** "Same strata plan, lot and service category as open Service Request SR0001. No new Service Request was created."
- **AI-filled fields: added.**
  - Strata Plan: RESVU – ESTATE
  - Lot / Unit: Lot 12
  - Site Contact: Liam Carter
  - Service Category: Plumbing
  - Issue: "Water leaking from the bathroom ceiling in Lot 12, now coming through the ceiling of the unit below. Plumber attendance and an update requested."
  - Priority: High

## Commands
- `node /tmp/cr03dup-verify/extract.js`, then `node --check` on `inline0.js`, `inline1.js` and `inline2.js`. All passed (3 scripts checked, 1 text/plain block skipped).
- `node <suite>.js` in `/tmp/cr03dup-verify/` against http://127.0.0.1:3000/ (the server that was already running), using Chrome via Playwright.

| Suite | Before update (first run) | Final |
|---|---|---|
| cr03dup.js (new) | – | **57/57** |
| cr05fix.js | 150/150 | **153/153** |
| cr05.js | 242/243 | **256/256** |
| cr02.js | 127/148 | **150/150** |
| cr03.js | 262/264 | **265/265** |
| cr04.js | 90/90 | **96/96** |
| qa13.js | 40/40 | **40/40** |

No page errors or console errors in any suite. The suites were copied from `/tmp/cr05fix-verify/`, with output paths changed to `/tmp/cr03dup-verify/`.

## cr03dup.js checks
**List:**
- All 13, Unread 5, Action needed 7.
- "Showing 1 to 10 of 13 entries", with order 12, 13, 11.
- Group headers "October 2026 · 8 emails" and "September 2026 · 5 emails".
- Row 13:
  - Sender Liam Carter, count 2, address shown.
  - Subject and Action needed flag.
  - No chips; `.ib-links` is empty.
  - Unread class, dot and bold sender.
  - Shows 30 Oct · 11:40 AM in October 2026, with attachment chip lot12_ceiling.jpg.
  - aria-label is correct.
- Page 2 shows 11 to 13 of 13, with rows 8, 9 and 10.
- Searching "Liam" or "building.manager" returns [13]. Searching "SR0001" still returns [3].
- Email 13 is listed in the Action needed and Unread tabs.

**Panel:**
- Opening the email marks it read.
- Header shows the subject, the Action needed badge and "0 linked records".
- Thread "(2)" lists the messages newest first (11:40 then 08:10), each with its date at the top right. Both are from Liam with Cc Tommy, and the bodies and attachment are correct.
- The AI line text is exact. Only "Repeated request:" and "SR0001" are bold.
- Subtext is present.
- Buttons are exactly `Actions ▾` then `Dismiss`. There is no ✦, no split button and no Change.
- The Yara logo shows.
- The pending reason appears in Linked records (0), with no rows.
- The AI-filled values are correct and editable.
- The ▾ menu has 4 actions with no ✦ Recommended, then Dismiss. There is no Link to Service Request.

**Dismiss:**
- No in-app dialog opens, and no browser dialog either.
- The toast "Email dismissed" appears.
- The flag clears in the row and header, and Action needed goes 7 → 6.
- The bold line stays. Actions ▾ is the only button, followed by "Dismissed by Jane Thornton · 18/11/2026 · Flag again".
- SR0001 stays Open in `srRegistry` and in email 3's link. Email 3 stays flagged, and no SR0005 is created.
- Email 3's Linked records shows SR0001 Open, and its SR details show Status Open.
- The SR register still has 2 cards, with SR0001 Active, and View SR shows Status Open.

**Flag again:**
- The flag returns and the count goes back to 7.
- Reason, line, subtext and buttons are restored.
- SR0001 is still Open.
- Dismiss from the ▾ menu behaves the same way.

**Responsive:**
- No horizontal scroll at 390, 700 or 1440 px, in either the list or the email 13 panel.
- At each width, the AI box text and actions stay inside the box, and the logo is clear of the text.

## Test expectations changed (old → new). All changes are caused by the 13th email.
- **cr02.js:**
  - Table EXPECT: added `13:['Action needed','Actions ▾']` (new check).
  - Default order `[12,11,1,…,10]` → `[12,13,11,1,…,10]`.
  - check2: "Action needed tab reads 6" → 7; tab label "Action needed 6" → "Action needed 7"; tab list `[12,3,4,5,8,10]` → `[12,13,3,4,5,8,10]`.
  - check4: count after dismissing email 5, 5 → 6.
  - check5: Flag again count 6 → 7.
  - tab-keep: count 5 → 6; list after close `[12,3,4,8,10]` → `[12,13,3,4,8,10]`.
  - check6: count after Cancel 6 → 7; count after dismissing email 3, 5 → 6.
  - D1: Flag again count 6 → 7; after Create QR "count 5" → 6.
  - check9: "Action needed count 6 → 5" → "7 → 6".
  - check10: count 5 → 6.
  - regression:
    - "Showing 1 to 10 of 12" → "of 13".
    - Groups "October 2026 · 7 emails" → "8 emails".
    - Page 2 "11 to 12 of 12" → "11 to 13 of 13".
    - 25 per page "1 to 12 of 12" → "1 to 13 of 13".
    - Action needed tab "1 to 6 of 6" → "1 to 7 of 7".
    - Unread tab `[12,3,4,5]` → `[12,13,3,4,5]`; the unread count after opening 12 goes 3 → 4; after close `[3,4,5]` → `[13,3,4,5]`.
- **cr03.js:** EXPECT gains `13:''`; FLAGGED gains 13; blank link-column rows 5 → 6.
- **cr05.js:** ALL gains 13 (13 more per-email checks); THREAD gains `13:2`. The old "row 13: no count" failure came from the missing THREAD entry.
- **cr05fix.js:** ALL gains 13 (3 more per-email attachment checks).
- **cr04.js:**
  - ALL gains 13; FLAGGED gains 13.
  - New per-email branch for id 13: the exact repeated-request line, bold exactly ['Repeated request:','SR0001'], kids ['BTN:Actions ▾','Dismiss']. Without this branch, email 13 would have fallen into "no bold text".
  - Labels "all 12 emails" → "all 13 emails" (×2).
- **qa13.js:** the per-email loop list gains 13; label "12 emails" → "13 emails".

No checks were removed or skipped.

## Screenshots (in `.agents/tasks/cr03/shots/`)
Viewed:
- `list-1440.png`: email 13 is the second row, with Liam Carter 2, the Action needed flag, no chips and the unread dot.
- `email13-panel-1440.png`: the AI box with bold labels, Actions ▾ and Dismiss, then the thread, newest first.
- `email13-panel-390.png`: the same at 390 px. The text wraps inside the box and nothing overflows.

Produced but not viewed: `email13-panel-1440-viewport.png`, `email13-panel-390-viewport.png`, `email13-dismissed-1440.png`.

## Not verified
- Only desktop Chrome was tested. Safari, Firefox and screen readers were not.
- There is no general duplicate-detection engine (out of scope by decision). The scenario is seeded data only.
