# Accounting rules

## Double entry and lifecycle

Every posted journal has at least two lines, exactly one positive side per line, and equal positive debit/credit totals. PostgreSQL recalculates final document totals. Drafts may change; submitted/approved documents move only through workflow functions; posted entries/lines cannot update or delete.

Corrections create a linked reversal with swapped debit/credit. The source remains intact. Locked accounting periods reject posting, reversal, and new accounting effects.

## Posting matrix

| Source                   | Debit                    | Credit                   |
| ------------------------ | ------------------------ | ------------------------ |
| Service sales invoice    | Accounts Receivable      | Revenue, Output Tax      |
| Customer receipt         | Bank/Cash                | Accounts Receivable      |
| Service purchase invoice | Expense/Asset, Input Tax | Accounts Payable         |
| Supplier payment         | Accounts Payable         | Bank/Cash                |
| Inventory delivery       | Cost of Goods Sold       | Inventory                |
| Goods receipt            | Inventory                | GRNI                     |
| Depreciation             | Depreciation Expense     | Accumulated Depreciation |

Accounts come from company mappings or product configuration, never hard-coded IDs. Inventory invoice posting is intentionally rejected unless the required posted delivery/receipt path exists, preventing a ledger/stock mismatch.

## Inventory costing

MVP costing is moving weighted average:

`new average = (old quantity × old average + receipt quantity × receipt cost) / new quantity`

Negative stock is blocked. Backdated inventory movement before the latest product/warehouse movement is blocked until deterministic replay/revaluation is implemented.

## Reconciliation

Official reports read posted journal lines only. `verify_general_ledger_balance` checks total debit/credit. `verify_subledger_reconciliation` compares AR/AP outstanding records to configured control accounts. Inventory and tax reconciliation must be added to credentialed database scenarios before production readiness.
