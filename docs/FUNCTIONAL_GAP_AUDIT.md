# Functional gap audit

Audit date: 2026-08-12

Status meanings:

- `DONE`: the action is reachable from the UI, persists through Supabase, is authorized server-side/RLS, and has a verified test or smoke check.
- `PARTIAL`: a real schema/query/RPC exists, but one or more required UI actions or verification layers are missing.
- `MISSING`: no usable end-to-end implementation exists.
- `NOT APPLICABLE`: the action does not belong to the resource lifecycle.

## Baseline before functional completion

| Module              | Route                        | List           | Create         | Detail         | Edit           | Delete/Archive | Submit         | Approve        | Post           | Reverse        | Export         | Status  |
| ------------------- | ---------------------------- | -------------- | -------------- | -------------- | -------------- | -------------- | -------------- | -------------- | -------------- | -------------- | -------------- | ------- |
| Authentication      | `/login`, recovery routes    | NOT APPLICABLE | DONE           | NOT APPLICABLE | DONE           | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | DONE    |
| Company selection   | `/select-company`            | DONE           | MISSING        | DONE           | MISSING        | MISSING        | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | PARTIAL |
| Dashboard           | `/dashboard`                 | DONE           | NOT APPLICABLE | DONE           | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | DONE    |
| Chart of accounts   | `/master/accounts`           | DONE           | MISSING        | MISSING        | MISSING        | MISSING        | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | MISSING        | PARTIAL |
| Contacts            | `/master/contacts`           | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | MISSING        | MISSING |
| Products            | `/master/products`           | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | MISSING        | MISSING |
| Warehouses          | `/master/warehouses`         | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | MISSING        | MISSING |
| Tax codes/rates     | `/master/taxes`              | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | MISSING        | MISSING |
| Sales quotations    | `/sales/quotations`          | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | NOT APPLICABLE | NOT APPLICABLE | MISSING        | MISSING |
| Sales orders        | `/sales/orders`              | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | NOT APPLICABLE | NOT APPLICABLE | MISSING        | MISSING |
| Sales deliveries    | `/sales/deliveries`          | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING |
| Sales invoices      | `/sales/invoices`            | DONE           | MISSING        | MISSING        | MISSING        | MISSING        | PARTIAL        | PARTIAL        | PARTIAL        | MISSING        | MISSING        | PARTIAL |
| Customer receipts   | `/sales/receipts`            | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | NOT APPLICABLE | PARTIAL        | MISSING        | MISSING        | PARTIAL |
| Sales returns       | `/sales/returns`             | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING |
| Purchase requests   | `/purchases/requests`        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | NOT APPLICABLE | NOT APPLICABLE | MISSING        | MISSING |
| Purchase orders     | `/purchases/orders`          | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | NOT APPLICABLE | NOT APPLICABLE | MISSING        | MISSING |
| Goods receipts      | `/purchases/receipts`        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING |
| Purchase invoices   | `/purchases/invoices`        | DONE           | MISSING        | MISSING        | MISSING        | MISSING        | PARTIAL        | PARTIAL        | PARTIAL        | MISSING        | MISSING        | PARTIAL |
| Supplier payments   | `/purchases/payments`        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | NOT APPLICABLE | PARTIAL        | MISSING        | MISSING        | PARTIAL |
| Purchase returns    | `/purchases/returns`         | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING |
| Stock               | `/inventory/stock`           | DONE           | NOT APPLICABLE | MISSING        | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | MISSING        | PARTIAL |
| Stock adjustments   | `/inventory/adjustments`     | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING |
| Stock transfers     | `/inventory/transfers`       | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING |
| Stock opname        | `/inventory/opname`          | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | NOT APPLICABLE | MISSING        | MISSING |
| Bank accounts       | `/cash-bank/accounts`        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | MISSING        | MISSING |
| Cash transactions   | `/cash-bank/transactions`    | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING |
| Bank reconciliation | `/cash-bank/reconciliations` | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | NOT APPLICABLE | NOT APPLICABLE | MISSING        | MISSING        | MISSING        | MISSING |
| Manual journals     | `/accounting/journals`       | DONE           | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | PARTIAL        | PARTIAL        | MISSING        | PARTIAL |
| Accounting periods  | `/accounting/periods`        | MISSING        | PARTIAL        | MISSING        | MISSING        | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | PARTIAL        | PARTIAL        | MISSING        | PARTIAL |
| Fixed assets        | `/fixed-assets`              | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | NOT APPLICABLE | NOT APPLICABLE | MISSING        | MISSING        | MISSING        | PARTIAL |
| Approvals           | `/approvals`                 | DONE           | NOT APPLICABLE | MISSING        | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | PARTIAL        | NOT APPLICABLE | NOT APPLICABLE | MISSING        | PARTIAL |
| Reports             | `/reports`                   | DONE           | NOT APPLICABLE | DONE           | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | MISSING        | PARTIAL |
| Users               | `/settings/users`            | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | MISSING        | MISSING |
| Roles               | `/settings/roles`            | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | MISSING        | MISSING |
| Account mapping     | `/settings/account-mapping`  | MISSING        | MISSING        | MISSING        | MISSING        | MISSING        | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | MISSING        | MISSING |
| Company settings    | `/settings/company`          | DONE           | NOT APPLICABLE | DONE           | MISSING        | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | MISSING        | PARTIAL |
| Audit log           | `/audit-log`                 | DONE           | NOT APPLICABLE | MISSING        | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | MISSING        | PARTIAL |

## Repository findings

- The sidebar exposed ten real routes; all rendered against Supabase after the composite invoice relationship fix.
- Business pages used `ModulePage` as a read-only table and exposed no mutation controls.
- Database RPCs already existed for invoice submit/approve/reject/post, receipt/payment posting, manual-journal posting/reversal, period close/reopen, and reconciliation verification, but no business UI invoked them.
- RLS existed on exposed business tables. Draft write policies and permission checks existed, while generic master mutations did not yet guarantee automatic audit events or optimistic concurrency from the UI.
- Sales quotations/orders/deliveries/returns, purchase requests/orders/goods receipts/returns, stock operations, cash transactions, reconciliation sessions, notifications, and depreciation schedules had no schema or UI.
- TailAdmin demonstration components contain sample buttons and `console.log` calls, but they are not reachable from the Dasol application routes. They remain third-party foundation code and are excluded from the functional status above.
- No `href="#"` or inert core-business button was reachable in the current Dasol routes; the gap was absence of actions rather than fake actions.

This document is updated as each vertical slice becomes usable and verified. Historical baseline statuses above are retained to make progress auditable; final statuses are recorded in `FUNCTIONAL_COMPLETION_REPORT.md`.
