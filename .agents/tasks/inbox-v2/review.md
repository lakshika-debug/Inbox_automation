# Inbox v2: SR archive target fix and Undo toast placement (review pass 2)

This pass reviews fix commit `9d17e7c` on top of `289b4f1`, and the cumulative diff against the pre-task base `90b97a3`. The fix resolves the blocking finding from pass 1. The SR details dialog now passes the SR it shows through Archive, confirm and Restore, so an email with two SRs archives and restores the right one. The Undo toast no longer covers the side-panel footer: above 1000 px it sits left of the panel, and at 1000 px and below it is lifted above the footer. Scope is unchanged from pass 1. The Settings view, the WO/Calendar module, `openAutomationSettings`/`saveSettings` and the header are untouched, and the commits are local and not pushed.

Watch for: at 1000 px and below, a toast raised with the panel open stays lifted mid-screen after the panel is closed, for the rest of its 10 s (**confirmed**, cosmetic).

**Verdict**: APPROVED

## High-level view

`archiveSR`, `confirmArchiveSR` and `restoreSR` now take an optional SR id and fall back to `currentSR(e)` without one. The panel's "SR Archived" badge now checks every SR linked to the email instead of only the last one.

Toast placement uses two mechanisms. Above 1000 px, a CSS sibling rule (`#panel.visible~#toast`) offsets the toast by the panel width, which matches the panel's `min(595px,96vw)` width at that breakpoint. At 1000 px and below, `toast()` sets an inline `bottom` once, when the toast is shown. That inline value is not cleared when the panel closes, which causes the cosmetic issue above.

The "Confirmed Phase 1 … 24 h" status line raised in pass 1 is still there. The user has deferred it ("We will keep these for later"), so it is no longer a finding. The coder's verification.md for iteration 2 matches what I observed independently.

<details>
<summary>Issues (1)</summary>

1. **Toast stays lifted after the panel closes (≤1000 px, non-blocking)**: `toast()` sets `el.style.bottom` from the panel footer's position. `closePanel()` does not reset it, so the toast floats 105–170 px above its normal spot until it times out. Clear `#toast`'s inline `bottom` in `closePanel()`, or reset it when the toast hides.

</details>

<details>
<summary>Details</summary>

### SR details now archive and restore the SR on screen

Every call site now passes the SR id (lines 409–414). I re-ran the pass 1 repro (**confirmed** fixed). On email 3, Change → Create Quote Request → Confirm → Rapid Plumbing → Submit leaves the links QR002217, SR0005 (Converted) and SR0001 (Cancelled). View SR0001 → Archive SR now opens "Archive SR0001", and confirming archives SR0001 only. Email 3's panel shows the "SR Archived" badge even though SR0001 is not the last SR link. Restore on SR0001 restores SR0001 alone. Archiving SR0003, a single-SR email, still works.

### Undo toast placement around the side panel

With the panel open, I measured the toast against the footer buttons at 1440, 1100, 1001, 1000, 900 and 600 px. At every width it was fully in the viewport and clear of the footer buttons. At 1000 px and below it sits over the panel body, which is the only free space at those widths. Screenshots `t-toast-1440.png`, `t-toast-900.png` and `05-panel-links.png` were inspected.

The narrow-width path leaves a gap (**confirmed**). The inline `bottom` is computed once, in `toast()`:

```js
const pf=document.querySelector('#panel.visible .panelfoot');
el.style.bottom=pf&&innerWidth<=1000?(innerHeight-pf.getBoundingClientRect().top+8)+'px':'';
```

If the panel is closed while that toast is up, the toast keeps the lifted position. It measured 105 px above the bottom at 900 px and 170 px at 600 px, and `t-toast-900-closed.png` shows it floating over the table rows. It returns to normal on the next toast. The wide-width CSS rule does not have this problem, because the sibling selector stops matching as soon as the panel closes.

### Independent browser run

Both scripts were my own, run with Playwright/Chromium under `/tmp` against the running server on :3000. The served `index.html` hash equals `HEAD:index.html`. The full QA and regression script from pass 1 (`/tmp/rv-check/check2.js`) passed 28 of 29 checks. The one failure is the same regex bug in my script that pass 1 described: "BlueLine Plumbing\nPublic liability expired[disabled]" did not match. The evidence shows BlueLine disabled and Submit gated as required. The script covered these areas:

- **Table:** no Type column, Type filter or 24-hour button, and three statuses only.
- **Menus and dialogs:** the menus, New Work Order, Link to Work Order, the L4/L5 replace confirmations and the L6 "Change not possible" dialogs.
- **Undo:** Undo on Create WO, Create SR and Link to WO.
- **Regressions:** the header gear opens Settings and sidebar Inbox returns to a working Inbox. The SR register and View SR work, Email Integration opens its dialog, and Calendar and Work Orders open with a return to the Inbox.
- **Header and console:** no Sync Now, "Auto (every 5 mins)", Retry or Failed. No console errors apart from the browser's `/favicon.ico` 404.

The fix-specific script (`/tmp/rv-check/fix2check.js`) passed 18 of 18 checks with no page or console errors. Screenshots in `/tmp/rv-check/shots2/` were inspected, including Settings, which is unchanged.

### Scope confirmation

`git diff 90b97a3 HEAD -U0` has no added line matching `ps-`, `ps[A-Z]`, `settingsView`, `woIntegrated`, `woModuleEncoded`, `showIntegratedSection`, `openAutomationSettings`, `saveSettings`, `wo-`, `Sync Now`, `Auto (every`, `Retry` or `Failed`. The only matches are removed lines from the old Retry and Failed code and the old 24-hour toolbar. The fix commit's one CSS addition applies only while `#panel.visible` is set, inside a `min-width:1001px` media query, so it cannot affect other screens. Only `index.html` is committed. `Instruction/` and `.agents/` are untracked, and `main` is two commits ahead of `origin/main` (not pushed).

</details>

<details>
<summary>File map</summary>

`index.html`: in the fix commit, a scoped toast-offset CSS rule, an inline toast lift in `toast()` for widths of 1000 px and below, SR id threading in `showSRDetails`/`archiveSR`/`confirmArchiveSR`/`restoreSR`, and an any-SR "SR Archived" badge in `panelMarkup`. Full diffs: `git -C "/Users/arjuna/Documents/inbox automation/Inbox_automation" diff 289b4f1 9d17e7c` (fix) and `git -C "/Users/arjuna/Documents/inbox automation/Inbox_automation" diff 90b97a3 HEAD` (cumulative).

</details>
