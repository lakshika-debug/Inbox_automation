# i4T Maintenance – AI Inbox Prototype (v3)

Static, interactive frontend demonstration using sample email records. Does not connect to the production application.

## What changed in v3
- No **Unlinked** status. An identified invoice that cannot be linked to an existing WO is **Needs Review**.
- **Needs Review** is also used when a maintenance email cannot be converted automatically into an SR because required information/validation is unresolved, or for a mixed/uncertain classification that requires manager review. This rule is for developers; no explanatory reason for the status is displayed in the UI.
- A technical exception is **Processing Failed**, not Needs Review. **Processing** is reserved for active processing, not for an invoice waiting to be linked.
- Eye icon and clicking the email row display the original email and extracted details in the side panel, **without a Next Action section**. Actions are available only through the row's outlined icons.
- Sara Browns' follow-up email retains **Service Request Created**; follow-ups inherit the existing processing result.
- Invoice awaiting manual linking displays the **Link Work Order** icon, taking the user to the existing modal.

## Deploy via GitHub and Vercel
1. Create a repository and upload the files from this folder at the repository root.
2. In Vercel, import the repository. Choose **Other** framework preset and deploy without a build command.
3. The page is served from `index.html`.

## Status rules for developers
| Email type / condition | Displayed Inbox status | Row action |
|---|---|---|
| Invoice matched to an existing WO | Linked | View linked WO |
| Invoice identified but no valid automatic WO link | Needs Review | Link Work Order |
| Maintenance email created an SR | Service Request Created | View SR / Create WO / Create QR / Archive SR |
| Maintenance email requires manager input before SR creation | Needs Review | Review Maintenance Request |
| Mixed or uncertain email requires a decision | Needs Review | Review Classification |
| AI/service processing has a technical error | Processing Failed | Retry Processing |
| General email requiring no automated workflow | No Action | Review Classification (optional) |
| Any email still actively being processed | Processing | No completion action yet |

The same email must never create multiple SRs when resynchronised. A separate matching email within 24 hours does not automatically create a second SR; after 24 hours it may create another SR according to the confirmed rules.
