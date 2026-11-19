# Inbox redesigned as an email list, with a reordered Email Details panel

The Inbox view's blue toolbar and 1,220px-wide table are gone. In their place is an email-client style list: a breadcrumb, an `Inbox` heading with a live `N unread` pill, the Connected and Sync folder lines, and a card. The card holds search, Mark all as read, All/Unread tabs, status and sort selects, month group headers and two-line rows. Each row shows an unread dot, the sender and address, the subject with a status badge, attachment chips and a short date. Clicking or keyboard-activating a row opens the side panel. The panel is now labelled `Email Details` and runs AI card → Email thread → Linked records → AI-filled details, with the sticky action footer. All edits are in `index.html` and stay inside the Inbox CSS, markup and first script block. The dead table code (`recordCell`, `GLYPHS`, the eye button, table, toolbar and pager CSS) is removed.

Watch for: keyboard users lose focus to `<body>` whenever a row opens the panel (confirmed, non-blocking). Mark all as read can silently replace a pending Undo toast (confirmed, non-blocking).

**Verdict**: APPROVED

## High-level view

The list is rebuilt from scratch under an `ib-` class prefix. It reuses the existing `#search`, `#statusFilter`, `#rows` and `#count` ids, so the existing listeners and every `renderRows()` caller in the action code keep working. Tab counts ignore filters. Group headers, rows and the footer count follow tab, status and search.

Read state is a plain `unread` flag on emails 12, 3, 4 and 5. Opening a panel clears the flag. An email opened from the Unread tab stays listed until the panel closes, so rows don't vanish under the cursor. Undo copies the current read state onto the restored snapshot, so undoing an action never brings back an unread dot.

The panel reorder only moves the existing sections and renames them ("Original Email" became "Email thread"). Two small fixes come with it. The links-focus scroll now uses `scrollTop`, so `#linksBox` doesn't land under the sticky footer. `closePanel()` clears the toast's inline `bottom` offset.

Accessibility is partial. Rows are focusable, work with Enter and Space, and carry descriptive `aria-label`s. Every re-render destroys the focused row, though, and the tabs are only half an ARIA tab pattern.

<details>
<summary>Issues (3)</summary>

1. **Keyboard focus lost on row open** — `openPanel` and `closePanel` both rebuild `#rows`, so the focused row is destroyed and focus falls to `<body>`. Move focus into the panel (for example its close button) on open, and back to `#rows .ib-row[data-id=…]` on close. Non-blocking: the plan (D18) deferred focus restore.
2. **Mark all as read clobbers a pending Undo** — `ibMarkAllRead()` calls `toast()`, which replaces a visible "… submitted / Undo" toast. The last action can then no longer be undone, although `prevState` is still set. Skip the toast or keep the Undo button while `prevState` is live. Non-blocking.
3. **Incomplete tab semantics** — `#ibTabAll`/`#ibTabUnread` have `role="tab"` but no `aria-controls`, no `role="tabpanel"` on `#rows` and no arrow-key handling. Either finish the pattern or drop the tab roles and use `aria-pressed` buttons. Non-blocking.

</details>

<details>
<summary>Details</summary>

### Scope of the diff

All hunks fall in the base CSS line, the old i4T restyle overrides, a new `/* Inbox email list (ib-) */` block placed before the Profile & Account Settings CSS, the `#inboxView` markup, and the first `<script>` block. I checked the base CSS line rule by rule against `HEAD`. The only removals are the list rules (`.breadcrumb`, `.mainhead`, `.connected`, `.sync`, `.syncbutton`, `.toolbar*`, `.tablewrap`, `.emailtable*`, `.sender`, `.mailaddr`, `.subject`, `.record`, `.eye`, `.dots`, `.footer`, `.pager`, `.empty`, `.statusline`), plus the `.toolbar` fragments inside the 900px, 620px and 650px media queries. None of those classes is still used in markup, and the only other "empty" class is `.ps-empty`, which is a separate rule. No changed line contains `ps-` or `wo-`. The second script, `woModuleEncoded`, `#settingsView`, the SR register and the sidebar Email Integration dialog are untouched. `git diff --cached` is empty, and `Instruction/` and `.agents/` are untracked.

### Read state and the Unread tab

```
openPanel(id) ── em.unread? ──yes──> unread=false, ibKeep=id
                       └─no──> ibKeep stays if same id, else null
renderRows filter: ibTab==='all' || e.unread || e.id===ibKeep
closePanel / ibSetTab ──> ibKeep=null
```

In the browser, opening email 3 dropped the pill and the Unread tab to 3, and row 3 lost `ib-unread` and gained `ib-current`. Mark all as read took the pill to `0 unread`, disabled the button, and left the Unread tab showing the `No emails match these filters.` empty state. That empty-state text was written for filter misses, so it reads slightly off on an empty Unread tab. This is cosmetic.

`ibMarkAllRead()` shows `toast('All emails marked as read')` with no Undo argument. `toast()` replaces the toast's `innerHTML`, so if a "WO620041 submitted · Undo" toast is still on screen, its Undo button disappears (confirmed by reading `toast()`). `prevState` survives, but nothing can reach it any more.

### Row keyboard access and focus

Rows are `role="button" tabindex="0"` and route Enter/Space through the existing `psKey` helper, so Space doesn't scroll the page. Each row's `aria-label` includes read state, sender, subject, status and date. However, `openPanel` calls `renderRows()`, which rebuilds `#rows` with `innerHTML`. After Enter on row 5, `document.activeElement` was `BODY` (confirmed in the browser). Focus doesn't move into the panel either, so a keyboard user has to tab from the top of the page to reach the panel actions, and closing the panel has the same effect. The old table's eye button had the same re-render problem, but rows are now the main keyboard target, so the gap matters more.

The tabs carry `role="tablist"`/`role="tab"` and toggle `aria-selected`, but nothing links them to the list and arrow keys do nothing. Screen readers will announce a tab widget that doesn't behave like one.

### Test coverage

The coder's evidence (`verification.md`, 118 Playwright checks, 11 screenshots) covers every requirement in the brief. My own run (`/tmp/inbox-v2-verify/review-list-check.js`, 38 checks) confirmed these: no table, no Linked Record column and no `Confirmed Phase 1`; no buttons or links inside rows; groups `October 2026 · 7 emails` / `September 2026 · 5 emails`; newest-first order; initial unread 12,3,4,5; tab labels; the row 12 date and chips; the header text and search placeholder; unread 4→3; Mark all → 0; `WO615003` → [8, 10] with `Showing 2 of 12 emails`; panel order AI → Email thread → Linked records (1) → AI-filled details under the `Email Details` eyebrow, with a sticky footer; Create WO on email 10 (`WO620041 submitted`, links 1→3, badge → Done, then Undo back to 1 and Action needed); the toast left of the panel at 1440px and above the panel footer at 900px; no horizontal scroll at 600 and 390px; and SR register, header gear settings, Work Orders (iframe has content) and the return to Inbox. The only console error was the browser's automatic `favicon.ico` 404 from the static server, which the app never requests.

Not tested: screen-reader output for the rows and tabs, and the Mark-all-over-Undo toast interaction.

</details>

<details>
<summary>File map</summary>

`index.html`: removed the table, toolbar, old header, pager and statusline CSS and markup; narrowed `.emailtable`/`#panel` selectors to `#panel`; added the `ib-` list CSS and markup, `unread` flags, date/group helpers, a rewritten `renderRows`, `ibSetTab` and `ibMarkAllRead`; reordered `panelMarkup`; changed the links scroll; kept read state out of Undo; reset the toast offset on close.

Full diff: `git -C '/Users/arjuna/Documents/inbox automation/Inbox_automation' diff index.html`

</details>
