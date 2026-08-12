# Functional completion report

Completion date: 2026-08-12

This report records what is actually reachable through the UI and persisted in the linked Supabase project. `DONE` means the core business lifecycle is implemented and verified. `PARTIAL` means the workflow is real and usable, but one or more secondary requirements from the master prompt remain. No core module below is a display-only placeholder.

## Delivery totals

| Measure                                   |                               Result |
| ----------------------------------------- | -----------------------------------: |
| App route source files                    | 132 (128 pages and 4 route handlers) |
| CRUD/configuration resource families      |                                   12 |
| Transactional resource families           |                                   20 |
| Exported server actions                   |                                   84 |
| Save/create-style actions                 |                                   23 |
| Edit/save-style actions                   |                                   22 |
| Delete/archive/deactivate actions         |                                   16 |
| Transactional actions                     |                                   58 |
| Submit/approval-decision actions          |                                   13 |
| Posting/finalization/lifecycle actions    |                                   12 |
| Reversal actions                          |                                    8 |
| New migrations                            |             20 (`008` through `027`) |
| PostgreSQL functions delivered or revised | 74 unique functions (80 definitions) |
| New RLS policies                          |                                   32 |
| New database triggers                     |                                   38 |
| Automated test files                      |        13 E2E, 6 unit, 1 integration |

Action categories overlap where one atomic save action supports both create and edit.

## Final functional audit

| Module                     | Route                                  | List | Create  | Detail | Edit    | Delete/Archive | Submit  | Approve | Post | Reverse | Export  | Status  |
| -------------------------- | -------------------------------------- | ---- | ------- | ------ | ------- | -------------- | ------- | ------- | ---- | ------- | ------- | ------- |
| Authentication             | `/login`, recovery routes              | N/A  | DONE    | N/A    | DONE    | N/A            | N/A     | N/A     | N/A  | N/A     | N/A     | DONE    |
| Company selection/settings | `/select-company`, `/settings/company` | DONE | MISSING | DONE   | DONE    | MISSING        | N/A     | N/A     | N/A  | N/A     | N/A     | PARTIAL |
| Dashboard                  | `/dashboard`                           | DONE | N/A     | DONE   | N/A     | N/A            | N/A     | N/A     | N/A  | N/A     | N/A     | DONE    |
| Chart of accounts          | `/master/accounts`                     | DONE | DONE    | DONE   | DONE    | DONE           | N/A     | N/A     | N/A  | N/A     | DONE    | PARTIAL |
| Contacts                   | `/master/contacts`                     | DONE | DONE    | DONE   | DONE    | DONE           | N/A     | N/A     | N/A  | N/A     | DONE    | PARTIAL |
| Products                   | `/master/products`                     | DONE | DONE    | DONE   | DONE    | DONE           | N/A     | N/A     | N/A  | N/A     | DONE    | PARTIAL |
| Warehouses                 | `/master/warehouses`                   | DONE | DONE    | DONE   | DONE    | DONE           | N/A     | N/A     | N/A  | N/A     | DONE    | DONE    |
| Tax codes/rates            | `/master/taxes`                        | DONE | DONE    | DONE   | DONE    | DONE           | N/A     | N/A     | N/A  | N/A     | DONE    | DONE    |
| Sales quotations           | `/sales/quotations`                    | DONE | DONE    | DONE   | DONE    | DONE           | DONE    | DONE    | N/A  | N/A     | MISSING | PARTIAL |
| Sales orders               | `/sales/orders`                        | DONE | DONE    | DONE   | DONE    | DONE           | DONE    | DONE    | N/A  | N/A     | MISSING | PARTIAL |
| Sales deliveries           | `/sales/deliveries`                    | DONE | DONE    | DONE   | DONE    | DONE           | DONE    | DONE    | DONE | DONE    | MISSING | PARTIAL |
| Sales invoices             | `/sales/invoices`                      | DONE | DONE    | DONE   | DONE    | DONE           | DONE    | DONE    | DONE | DONE    | MISSING | PARTIAL |
| Customer receipts          | `/sales/receipts`                      | DONE | DONE    | DONE   | DONE    | DONE           | N/A     | N/A     | DONE | DONE    | MISSING | PARTIAL |
| Sales returns              | `/sales/returns`                       | DONE | DONE    | DONE   | DONE    | DONE           | DONE    | DONE    | DONE | DONE    | MISSING | PARTIAL |
| Purchase requests          | `/purchases/requests`                  | DONE | DONE    | DONE   | DONE    | DONE           | DONE    | DONE    | N/A  | N/A     | MISSING | PARTIAL |
| Purchase orders            | `/purchases/orders`                    | DONE | DONE    | DONE   | DONE    | DONE           | DONE    | DONE    | N/A  | N/A     | MISSING | PARTIAL |
| Goods receipts             | `/purchases/receipts`                  | DONE | DONE    | DONE   | DONE    | DONE           | DONE    | DONE    | DONE | DONE    | MISSING | PARTIAL |
| Purchase invoices          | `/purchases/invoices`                  | DONE | DONE    | DONE   | DONE    | DONE           | DONE    | DONE    | DONE | DONE    | MISSING | PARTIAL |
| Supplier payments          | `/purchases/payments`                  | DONE | DONE    | DONE   | DONE    | DONE           | N/A     | N/A     | DONE | DONE    | MISSING | PARTIAL |
| Purchase returns           | `/purchases/returns`                   | DONE | DONE    | DONE   | DONE    | DONE           | DONE    | DONE    | DONE | DONE    | MISSING | PARTIAL |
| Stock/card                 | `/inventory/stock`                     | DONE | N/A     | DONE   | N/A     | N/A            | N/A     | N/A     | N/A  | N/A     | MISSING | DONE    |
| Stock adjustments          | `/inventory/adjustments`               | DONE | DONE    | DONE   | DONE    | DONE           | DONE    | DONE    | DONE | DONE    | MISSING | DONE    |
| Stock transfers            | `/inventory/transfers`                 | DONE | DONE    | DONE   | DONE    | DONE           | DONE    | DONE    | DONE | DONE    | MISSING | PARTIAL |
| Stock opname               | `/inventory/opname`                    | DONE | DONE    | DONE   | DONE    | DONE           | DONE    | DONE    | DONE | DONE    | MISSING | DONE    |
| Bank/cash accounts         | `/cash-bank/accounts`                  | DONE | DONE    | DONE   | DONE    | DONE           | N/A     | N/A     | N/A  | N/A     | DONE    | DONE    |
| Cash transactions          | `/cash-bank/transactions`              | DONE | DONE    | DONE   | DONE    | DONE           | DONE    | DONE    | DONE | DONE    | MISSING | DONE    |
| Bank reconciliation        | `/cash-bank/reconciliations`           | DONE | DONE    | DONE   | N/A     | N/A            | N/A     | N/A     | DONE | N/A     | N/A     | DONE    |
| Manual journals            | `/accounting/journals`                 | DONE | DONE    | DONE   | MISSING | MISSING        | MISSING | MISSING | DONE | DONE    | MISSING | PARTIAL |
| Accounting periods         | `/accounting/periods`                  | DONE | MISSING | DONE   | N/A     | N/A            | N/A     | N/A     | DONE | DONE    | MISSING | PARTIAL |
| Fixed assets               | `/fixed-assets`                        | DONE | DONE    | DONE   | DONE    | DONE           | N/A     | N/A     | DONE | N/A     | MISSING | PARTIAL |
| Approvals                  | `/approvals`                           | DONE | N/A     | DONE   | N/A     | N/A            | N/A     | DONE    | N/A  | N/A     | N/A     | DONE    |
| Reports                    | `/reports/*`                           | DONE | N/A     | DONE   | N/A     | N/A            | N/A     | N/A     | N/A  | N/A     | DONE    | PARTIAL |
| Users/memberships          | `/settings/users`                      | DONE | DONE    | DONE   | DONE    | DONE           | N/A     | N/A     | N/A  | N/A     | N/A     | DONE    |
| Roles                      | `/settings/roles`                      | DONE | DONE    | DONE   | DONE    | DONE           | N/A     | N/A     | N/A  | N/A     | N/A     | DONE    |
| Account mapping            | `/settings/account-mapping`            | DONE | DONE    | DONE   | DONE    | DONE           | N/A     | N/A     | N/A  | N/A     | N/A     | DONE    |
| Notifications              | `/notifications`                       | DONE | N/A     | DONE   | DONE    | N/A            | N/A     | N/A     | N/A  | N/A     | N/A     | PARTIAL |
| Audit log                  | `/audit-log`                           | DONE | N/A     | DONE   | N/A     | N/A            | N/A     | N/A     | N/A  | N/A     | DONE    | DONE    |

The `MISSING` cells are secondary actions within otherwise usable modules; they are listed explicitly rather than being presented as completed.

## Functional modules delivered

- Shared mutation result handling, Zod validation, server-side permission checks, confirmation forms, loading states, error feedback, filters, pagination, details, and export helpers.
- Atomic master-data save/deactivation for accounts, contacts and primary address, products, warehouses, tax codes/rate versions, and bank accounts.
- Draft-to-submit-to-approval workflows for invoices, quotations, requests, orders, fulfillment, returns, stock operations, and cash transactions.
- Posting and reversal for sales/purchase invoices, receipts/payments, deliveries/goods receipts, returns, stock adjustments, transfer/opname operations, cash transactions, and journals where relevant.
- Sales quotation to order, purchase request to order, sales order to delivery, and purchase order to goods-receipt conversions with remaining-quantity controls.
- Fixed-asset category and asset lifecycle: create/edit draft, activation, depreciation, and disposal/write-off journals.
- Bank reconciliation: CSV import, match, unmatch, adjustment journal, balance validation, and finalization.
- User membership, custom roles, role permission assignment, account mapping, company identity/accounting settings, and self-lockout protections.
- Financial reports and drilldowns for general ledger, trial balance, profit/loss, balance sheet, cash flow, AR/AP aging, and tax; CSV cells are formula-injection safe.
- Durable in-app notifications for approval/status/low-stock events with per-user RLS and read state.
- Audit-list filters, detail view, before/after payload, actor/document metadata, and export.

## Database and security

- All business writes go through permission-checked server actions and transaction-safe RPCs.
- Tenant ownership is carried by `company_id`; composite foreign keys prevent cross-company references.
- New operational tables have authenticated RLS policies; mutation RPCs validate active membership and granular permissions again inside PostgreSQL.
- Audit triggers cover mutable master and transactional records. Posted journals/movements/history are reversed rather than hard-deleted.
- Optimistic `version` checks protect editable drafts and master records.
- Period checks, row locking, idempotency keys, quantity limits, stock-negative guards, balanced-journal checks, and reversal dependency guards are enforced in the database.
- Return credits now record invoice-applied and still-available portions separately. Reversal restores only the applied subledger amount and is blocked if credit integrity no longer matches.

## Automated verification

| Gate                               | Exact result                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| `npm run typecheck`                | PASS, exit 0                                                                  |
| `npm run lint`                     | PASS, exit 0, zero warnings                                                   |
| `npm run test:unit`                | PASS, 6 files / 23 tests                                                      |
| `npm run test:integration`         | PASS, 1 file / 1 test                                                         |
| Desktop E2E (`chromium`, serial)   | PASS, 20 passed / 1 skipped                                                   |
| Mobile E2E smoke (`mobile-chrome`) | PASS, 3 passed / 18 mutation suites intentionally skipped                     |
| `npm run build`                    | PASS, optimized Next.js 16.3.0 production build, 80 static-generation entries |
| `npm audit --audit-level=moderate` | PASS, 0 vulnerabilities                                                       |
| `npm run verify:accounting`        | PASS, 139 posted journals, balance PASS                                       |
| Supabase migration parity          | PASS, local and remote match through `202608120027`                           |

Local `npm run db:test` and `npm run db:lint` could not run because Supabase CLI requires Docker/Podman for the local database. The schema was instead applied transactionally to the linked hosted project, generated types were refreshed from that project, migration parity was checked, and browser/integration accounting workflows exercised the hosted database.

## Remaining limitations

1. Company creation/archive is not self-service; users select an existing membership and administrators can edit the active company.
2. Master-detail enrichment remains partial: COA import/tree view and contact/product history tabs/actions are not complete.
3. PDF/print/duplicate/send actions are not implemented for transactional documents. CSV export is implemented for master data, reports, and audit.
4. Quotation expiry/currency/salesperson fields and direct quotation-to-invoice conversion are not implemented.
5. Orders do not yet create invoices directly, cancel remaining quantity, or separately track invoiced quantity.
6. Settlement forms support invoice allocation and safe reversal, but not overpayment, withholding, bank fee, or write-off policy variants.
7. Purchase return starts from a posted purchase invoice, not directly from a goods receipt. Inventory movement is supported when the source invoice line is an inventory product.
8. Stock transfer is one-step posting; an optional in-transit/receive step is not implemented.
9. Manual journals post atomically on creation; draft/edit/delete/submit/approval stages are not implemented.
10. Period management closes/reopens existing periods; fiscal-year creation and automatic period generation are not implemented.
11. Reports have date filtering and CSV export, but not a universal search/sort/print-friendly mode.
12. Notifications are durable and readable but have no realtime header badge or external email delivery.

## Main implementation areas

- `src/features/master`, `src/features/invoices`, `src/features/settlements`
- `src/features/operations`, `src/features/returns`
- `src/features/inventory`, `src/features/cash`, `src/features/reconciliation`
- `src/features/accounting`, `src/features/fixed-assets`, `src/features/settings`
- `src/server/mutations`, `src/server/queries`, `src/server/auth`
- `src/app/(dashboard)` and `src/app/api`
- `supabase/migrations/202608120008_*` through `202608120027_*`
- `tests/e2e`, `tests/unit`, and `tests/integration`

The historical before-state is preserved in `FUNCTIONAL_GAP_AUDIT.md`.
