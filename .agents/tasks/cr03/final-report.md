# CR03 duplicate handling – final report

**Commit:** `c9b34ebceb845ab7100fd8b7538412a672e807cb` on `main`, message "feat(inbox): CR03 repeated-request sample – email 13 duplicate of SR0001". Not pushed.
**Review:** APPROVED (`review.json`, no findings).
**Staged and committed:** only `index.html` and `Instruction/cr03.md` (2 files, 13 insertions, 1 deletion). `.agents/`, `assets/logo 1.png` and `assets/logo 2.png` are still untracked.

## Changes
- `index.html`:
  - New seed email `id:13`, placed between emails 12 and 11. The list's date sort puts it in the same place.
  - In `panelMarkup`, after `escapeHtml(e.ai)`, the code now runs `.replace(/^(Repeated request:)(.*?)(SR\d+)/,'<b>$1</b>$2<b>$3</b>')`, with a one-line comment. This is the same technique used for "Recommended Action:". The regex is anchored, so it only affects AI lines that start with "Repeated request:". `e.ai` stays plain text.
- `Instruction/cr03.md`: the spec file is now tracked. It was previously untracked and adds the "Duplicate handling" section (10 lines).

## Seeded content (email 13, related to email 3 / SR0001)
- **Sender:** Liam Carter `<building.manager@resvu.example>`.
- **Subject:** "Leak from ceiling – Lot 12, RESVU ESTATE".
- **State:** unread, `links:[]`, `recommended:null`. The email date is 30/10/2026 11:40 AM, which is the newest message.
- **Thread:** 2 messages, both To developer@i4tglobal.onmicrosoft.com and Cc Tommy Gennusa <tommy.gennusa@testdata.net.au>. They are shown newest first.
  1. **30/10/2026 08:10 AM:** reports water leaking from the bathroom ceiling in Lot 12, probably from a pipe above, and asks for a plumber. Attaches `lot12_ceiling.jpg`.
  2. **30/10/2026 11:40 AM:** follow-up. Water is now coming through the ceiling of the unit below, and the sender asks when the plumber will attend. No attachments.
- **Pending reason:** "Repeated request: SR0001 already covers this leak at RESVU – ESTATE, Lot 12. Review and choose an action if needed."
- **AI line:** "Repeated request: a Service Request already exists, SR0001 (raised by Tommy Gennusa, 29/10/2026)". Only "Repeated request:" and "SR0001" are bold.
- **Why:** "Same strata plan, lot and service category as open Service Request SR0001. No new Service Request was created."
- **AI-filled fields:**
  - Strata Plan: RESVU – ESTATE
  - Lot: Lot 12
  - Site Contact: Liam Carter
  - Service Category: Plumbing
  - Issue: leak now reaching the unit below, plumber requested
  - Priority: High

## Decisions (defaults accepted by the user)
- The duplicate is a separate email from a different sender, Liam Carter. It names the same strata plan, lot and category as email 3's open SR0001, and arrives after it (29/10/2026 10:36 AM).
- The email is flagged Action needed and has no links. No new SR is created and there is no ✦ recommended split button.
- The AI box shows `Actions ▾` and then `Dismiss`. This follows the earlier user rule that the Actions dropdown is kept. There is no Change link and no "Link to Service Request" action.
- Dismissing the email does not open a confirmation dialog and leaves SR0001 Open. Flag again restores the earlier state.
- The scenario is seeded data only. There is no general duplicate-detection engine (out of scope).

## Changed test expectations (all caused by the 13th email; none removed or skipped)
- **cr02.js:**
  - EXPECT gains email 13.
  - Default order becomes `[12,13,11,1,…,10]`.
  - Action needed counts go up by 1 throughout (6→7 and 5→6), and tab lists include 13.
  - Pager text becomes "of 13", "11 to 13 of 13" and "1 to 13 of 13". The Action needed tab reads "1 to 7 of 7".
  - The group header becomes "October 2026 · 8 emails".
  - Unread lists include 13, and the unread count after opening 12 goes from 3 to 4.
- **cr03.js:** EXPECT gains `13:''`, FLAGGED gains 13, and blank link-column rows go from 5 to 6.
- **cr05.js:** ALL gains 13, and THREAD gains `13:2`.
- **cr05fix.js:** ALL gains 13.
- **cr04.js:**
  - ALL and FLAGGED gain 13.
  - A new branch for email 13 checks the exact line, that the bold text is exactly ["Repeated request:","SR0001"], and that the buttons are ["Actions ▾","Dismiss"].
  - "all 12 emails" becomes "all 13 emails".
- **qa13.js:** the per-email loop gains 13, and "12 emails" becomes "13 emails".

## Verification results
- `node --check` passed on all 3 inline scripts.
- Playwright suites ran with Chrome against http://127.0.0.1:3000/. No page or console errors occurred.

| Suite | Result |
|---|---|
| cr03dup.js (new) | 57/57 |
| cr05fix.js | 153/153 |
| cr05.js | 256/256 |
| cr02.js | 150/150 |
| cr03.js | 265/265 |
| cr04.js | 96/96 |
| qa13.js | 40/40 |

- The reviewer ran an independent browser check (`/tmp/cr03dup-verify/review/rev.js`), which passed 22/22. It covered the list and counts, the panel line, bold text and buttons, the thread order, Dismiss leaving SR0001 Open, Flag again, and no horizontal scroll at 390, 700 and 1440 px.

## Screenshots (`.agents/tasks/cr03/shots/`)
- Viewed: `list-1440.png`, `email13-panel-1440.png`, `email13-panel-390.png`.
- Produced but not viewed: `email13-panel-1440-viewport.png`, `email13-panel-390-viewport.png`, `email13-dismissed-1440.png`.

## Not verified
- Only desktop Chrome was tested. Safari, Firefox and screen readers were not.
- There is no real duplicate-detection logic. The scenario is seeded data.
- The three viewport and dismissed screenshots listed above were not viewed.
