# Permissions

Authorization uses explicit permission codes; role names are seed presets only.

| Role           | Primary scope                                                                      |
| -------------- | ---------------------------------------------------------------------------------- |
| Administrator  | All company, security, accounting, posting, closing, audit, and export permissions |
| Accountant     | COA, journals, reports, reconciliation, tax/settings, closing                      |
| Operator       | Contacts/items and sales/purchase draft + submit; no approve/post                  |
| Approver       | Approval queue, approve, sales/purchase post; no draft editing                     |
| Viewer/Auditor | Read transactions, journals, reports, approvals, and audit only                    |

Permission families include `company.manage`, `user.manage`, `role.manage`, `coa.*`, `contact.*`, `item.*`, `inventory.*`, `sales.*`, `purchase.*`, `journal.*`, `report.*`, `period.*`, `approval.read`, `audit.read`, and `settings.manage`.

The creator cannot approve their own document unless the company/workflow explicitly enables self-approval. Reject requires a comment. UI navigation hides unauthorized modules, but server queries, RLS, and RPCs independently enforce the same boundary.
