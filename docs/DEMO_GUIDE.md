# Demo guide

## Provisioning

Copy `.env.example` to `.env.local`, configure local Supabase values and all five email/password pairs, set `DEMO_SEED_ENABLED=true`, then run:

```bash
npm run db:start
npm run db:reset
npm run seed:demo
npm run verify:accounting
```

The script creates or updates users using Supabase Admin on the server and calls a service-role-only transactional bootstrap. Passwords are never embedded or logged.

## Roles and presentation flow

1. Administrator: login, select PT Dasol Demo Indonesia, show dashboard, company settings, COA, roles/RLS explanation, and audit log.
2. Operator: demonstrate that sales/purchase reads are available but approval/post permissions are absent.
3. Approver: open approval scope and explain self-approval protection.
4. Accountant: review posted opening/sales/receipt/purchase/payment journals and report reconciliation.
5. Viewer: show read-only navigation and denied mutation by RLS.

Seeded examples include two branches/warehouses, an Indonesian example COA, account mappings, an example effective-dated tax code, customer, supplier, service product, bank account, balanced opening journal, paid service sales invoice/receipt, paid service purchase invoice/payment, and audit evidence.

## Demo limitations

Inventory delivery/goods receipt UI and credentialed multi-role browser automation are not complete. Coretax output is deliberately generic and not for official submission. Do not present this baseline as production-ready until database and full E2E gates pass in the target environment.
